import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'expo-router/entry';
import Constants from 'expo-constants';

try {
  if (Constants?.appOwnership !== 'expo') {
    require('@react-native-firebase/app');
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('FCM background message:', remoteMessage?.messageId || remoteMessage);
    });
  } else {
    console.log('[Init] Skipping Firebase in Expo Go');
  }
} catch (e) {
  console.warn('[Init] Firebase background handler init skipped:', e?.message || e);
}
