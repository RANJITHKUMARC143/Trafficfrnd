import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? 'dark' : 'light';

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint={tint}
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return null;
} 