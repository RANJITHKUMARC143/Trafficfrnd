import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, TouchableOpacity } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      onPress={(e) => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPress?.(e);
      }}
      style={[
        props.style,
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    />
  );
} 