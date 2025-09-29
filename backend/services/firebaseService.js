const { admin, initializeFirebase } = require('../config/firebase');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');

// Initialize Firebase Admin SDK
let firebaseApp = null;

function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
}

// Initialize Firebase on module load
getFirebaseApp();

function isValidFCMToken(token) {
  return typeof token === 'string' && token.length > 0 && token.startsWith('f');
}

async function sendFCMMessage(message) {
  try {
    if (!getFirebaseApp()) {
      console.error('Firebase Admin SDK not initialized');
      return false;
    }

    const response = await admin.messaging().send(message);
    console.log('FCM message sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    return false;
  }
}

async function sendToUser(userId, title, body, data = {}) {
  try {
    if (!userId) return;
    
    const user = await User.findById(userId).select('fcmToken');
    const token = user && user.fcmToken ? user.fcmToken : '';
    
    if (!isValidFCMToken(token)) {
      console.log('[FCM] No valid FCM token for user', String(userId));
      return;
    }

    const message = {
      token: token,
      notification: {
        title: String(title || 'Notification'),
        body: String(body || ''),
      },
      data: {
        ...data,
        type: data.type || 'info'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    await sendFCMMessage(message);
    console.log('[FCM] Sent to user', String(userId));
  } catch (e) {
    console.warn('sendToUser FCM error:', e?.message || e);
  }
}

async function sendToDeliveryBoy(deliveryBoyId, title, body, data = {}) {
  try {
    if (!deliveryBoyId) return;
    
    const driver = await DeliveryBoy.findById(deliveryBoyId).select('fcmToken');
    const token = driver && driver.fcmToken ? driver.fcmToken : '';
    
    if (!isValidFCMToken(token)) {
      console.log('[FCM] No valid FCM token for delivery', String(deliveryBoyId));
      return;
    }

    const message = {
      token: token,
      notification: {
        title: String(title || 'Notification'),
        body: String(body || ''),
      },
      data: {
        ...data,
        type: data.type || 'info'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    await sendFCMMessage(message);
    console.log('[FCM] Sent to delivery', String(deliveryBoyId));
  } catch (e) {
    console.warn('sendToDeliveryBoy FCM error:', e?.message || e);
  }
}

async function sendToMultipleTokens(tokens, title, body, data = {}) {
  try {
    if (!tokens || !tokens.length) return;
    
    const validTokens = tokens.filter(isValidFCMToken);
    if (!validTokens.length) {
      console.log('[FCM] No valid tokens provided');
      return;
    }

    const message = {
      tokens: validTokens,
      notification: {
        title: String(title || 'Notification'),
        body: String(body || ''),
      },
      data: {
        ...data,
        type: data.type || 'info'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    await sendFCMMessage(message);
    console.log('[FCM] Sent to multiple tokens:', validTokens.length);
  } catch (e) {
    console.warn('sendToMultipleTokens FCM error:', e?.message || e);
  }
}

module.exports = {
  sendToUser,
  sendToDeliveryBoy,
  sendToMultipleTokens,
  sendFCMMessage,
  isValidFCMToken
};
