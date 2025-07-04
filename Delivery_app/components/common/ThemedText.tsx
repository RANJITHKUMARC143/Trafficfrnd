import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'subtitle' | 'caption';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  style, 
  type = 'default',
  ...props 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'caption':
        return styles.caption;
      default:
        return styles.default;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getTextStyle(),
        { color: isDark ? '#FFFFFF' : '#000000' },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  default: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 