import React from 'react';
import { View } from 'react-native';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';
import SearchScreen from '../search';

export default function SearchWithTabs() {
  return (
    <View style={{ flex: 1 }}>
      <SearchScreen />
      <BottomNavigationBar />
    </View>
  );
}

