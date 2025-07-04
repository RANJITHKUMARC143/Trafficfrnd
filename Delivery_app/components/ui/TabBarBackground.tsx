import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

export const TabBarBackground = () => {
  return (
    <View style={styles.container}>
      <View style={styles.background} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
  },
  background: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.ultraLightGray,
  },
}); 