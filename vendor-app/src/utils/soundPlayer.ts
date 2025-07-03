import { Audio } from 'expo-av';

const notificationSound = require('../../assets/notification.mp3');

let sound: Audio.Sound | null = null;

export async function playAlertLoop() {
  try {
    console.log('playAlertLoop called');
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
    sound = new Audio.Sound();
    console.log('Loading sound asset...');
    await sound.loadAsync(notificationSound);
    await sound.setIsLoopingAsync(true);
    await sound.playAsync();
    console.log('Sound should be playing now');
  } catch (e) {
    console.warn('Error in playAlertLoop:', e);
  }
}

export async function stopAlert() {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
      console.log('Sound stopped');
    }
  } catch (e) {
    console.warn('Error in stopAlert:', e);
  }
} 