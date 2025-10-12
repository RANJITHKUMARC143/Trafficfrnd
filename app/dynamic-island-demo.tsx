import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DynamicIslandDemo from '../components/DynamicIslandDemo';
import { useDynamicIsland } from '../context/DynamicIslandContext';

export default function DynamicIslandDemoScreen() {
  const { connectSocket } = useDynamicIsland();

  useEffect(() => {
    // Auto-connect to socket when demo screen loads
    connectSocket();
  }, [connectSocket]);

  return (
    <SafeAreaView style={styles.container}>
      <DynamicIslandDemo />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
