import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MenuItemForm } from '../components/MenuItemForm';
import { theme } from '../theme/theme';
import { useRoute } from '@react-navigation/native';

export const MenuItemFormScreen = () => {
  const route = useRoute();
  const { mode, initialData } = route.params || {};

  return (
    <View style={styles.container}>
      <MenuItemForm mode={mode} initialData={initialData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}); 