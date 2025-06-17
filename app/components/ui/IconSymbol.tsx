import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

type IconSymbolProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
};

export function IconSymbol({ name, size = 24, color = '#000' }: IconSymbolProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
}); 