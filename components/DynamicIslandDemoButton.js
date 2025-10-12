import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDynamicIsland } from '../context/DynamicIslandContext';

const DynamicIslandDemoButton = () => {
  const { triggerDemoNotification } = useDynamicIsland();

  const handleDemoPress = () => {
    // Cycle through different notification types
    const notifications = ['confirmed', 'assigned', 'pickup', 'nearby', 'delivered'];
    const randomType = notifications[Math.floor(Math.random() * notifications.length)];
    triggerDemoNotification(randomType);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleDemoPress}>
      <View style={styles.buttonContent}>
        <Ionicons name="notifications" size={20} color="#fff" />
        <Text style={styles.buttonText}>Test Dynamic Island</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DynamicIslandDemoButton;
