const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

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
    const user = await User.findById(userId).select('expoPushToken');
    const token = user && user.expoPushToken ? user.expoPushToken : '';
    if (!isValidExpoToken(token)) return;
    const message = {
      to: token,
      sound: 'default',
      title: String(title || 'Notification'),
      body: String(body || ''),
      data: data || {},
      priority: 'high'
    };
    await sendPushMessages([message]);
  } catch (e) {
    console.warn('sendToUser error:', e?.message || e);
  }
}

module.exports = {
  sendToUser,
};


