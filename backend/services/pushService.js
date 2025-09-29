const { Expo } = require('expo-server-sdk');
const firebaseService = require('./firebaseService');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');

// Singleton Expo client
let expo = null;
function getExpo() {
  if (!expo) expo = new Expo();
  return expo;
}

function isValidExpoToken(token) {
  return typeof token === 'string' && Expo.isExpoPushToken(token);
}

async function sendPushMessages(messages) {
  if (!messages || !messages.length) return;
  const expoClient = getExpo();
  const chunks = expoClient.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expoClient.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.warn('Expo push error:', error?.message || error);
    }
  }
}

async function sendToUser(userId, title, body, data = {}) {
  try {
    if (!userId) return;
    const user = await User.findById(userId).select('expoPushToken fcmToken');
    const expoToken = user && user.expoPushToken ? user.expoPushToken : '';
    const fcmToken = user && user.fcmToken ? user.fcmToken : '';
    
    // Try Firebase first, then Expo as fallback
    if (firebaseService.isValidFCMToken(fcmToken)) {
      await firebaseService.sendToUser(userId, title, body, data);
    } else if (isValidExpoToken(expoToken)) {
      const message = {
        to: expoToken,
        sound: 'default',
        title: String(title || 'Notification'),
        body: String(body || ''),
        data: data || {},
        priority: 'high'
      };
      await sendPushMessages([message]);
      console.log('[PUSH] Sent to user via Expo', String(userId));
    } else {
      console.log('[PUSH] No valid token for user', String(userId));
    }
  } catch (e) {
    console.warn('sendToUser error:', e?.message || e);
  }
}

module.exports = {
  sendToUser,
  async sendToDeliveryBoy(deliveryBoyId, title, body, data = {}) {
    try {
      if (!deliveryBoyId) return;
      const driver = await DeliveryBoy.findById(deliveryBoyId).select('expoPushToken fcmToken');
      const expoToken = driver && driver.expoPushToken ? driver.expoPushToken : '';
      const fcmToken = driver && driver.fcmToken ? driver.fcmToken : '';
      
      // Try Firebase first, then Expo as fallback
      if (firebaseService.isValidFCMToken(fcmToken)) {
        await firebaseService.sendToDeliveryBoy(deliveryBoyId, title, body, data);
      } else if (isValidExpoToken(expoToken)) {
        const message = {
          to: expoToken,
          sound: 'default',
          title: String(title || 'Notification'),
          body: String(body || ''),
          data: data || {},
          priority: 'high'
        };
        await sendPushMessages([message]);
        console.log('[PUSH] Sent to delivery via Expo', String(deliveryBoyId));
      } else {
        console.log('[PUSH] No valid token for delivery', String(deliveryBoyId));
      }
    } catch (e) {
      console.warn('sendToDeliveryBoy error:', e?.message || e);
    }
  }
};


