import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDynamicIsland } from '../context/DynamicIslandContext';

/**
 * Example component showing how to integrate Dynamic Island notifications
 * into your existing app components
 */
const DynamicIslandIntegration = () => {
  const { showNotification, connectSocket } = useDynamicIsland();

  // Example: Trigger notification when order is created
  const handleOrderCreated = () => {
    showNotification({
      status: 'Order confirmed 🛒',
      riderName: null,
      eta: null,
      type: 'confirmed'
    });
  };

  // Example: Trigger notification when walker is assigned
  const handleWalkerAssigned = () => {
    showNotification({
      status: 'Walker assigned 🚶‍♂️',
      riderName: 'Arjun',
      eta: 'ETA 10 mins',
      type: 'assigned'
    });
  };

  // Example: Trigger notification when order is picked up
  const handleOrderPickedUp = () => {
    showNotification({
      status: 'Walker picked up your order 🚶‍♂️',
      riderName: 'Arjun',
      eta: 'ETA 5 mins',
      type: 'pickup'
    });
  };

  // Example: Trigger notification when rider is nearby
  const handleRiderNearby = () => {
    showNotification({
      status: 'Rider is near you 🚴‍♂️',
      riderName: 'Arjun',
      eta: 'ETA 2 mins',
      type: 'nearby'
    });
  };

  // Example: Trigger notification when order is delivered
  const handleOrderDelivered = () => {
    showNotification({
      status: 'Order delivered ✅',
      riderName: 'Arjun',
      eta: null,
      type: 'delivered'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Dynamic Island Integration</Text>
      <Text style={styles.subtitle}>
        Use these functions in your existing app logic
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleOrderCreated}>
          <Text style={styles.buttonText}>📦 Order Created</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleWalkerAssigned}>
          <Text style={styles.buttonText}>🚶‍♂️ Walker Assigned</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleOrderPickedUp}>
          <Text style={styles.buttonText}>📦 Order Picked Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleRiderNearby}>
          <Text style={styles.buttonText}>🚴‍♂️ Rider Nearby</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleOrderDelivered}>
          <Text style={styles.buttonText}>✅ Order Delivered</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>💻 Code Example:</Text>
        <Text style={styles.codeText}>
          {`import { useDynamicIsland } from '../context/DynamicIslandContext';

function YourComponent() {
  const { showNotification } = useDynamicIsland();

  const handleOrderUpdate = (orderData) => {
    showNotification({
      status: 'Order updated 📦',
      riderName: orderData.riderName,
      eta: orderData.eta,
      type: 'update'
    });
  };

  return (
    // Your component JSX
  );
}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeExample: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
});

export default DynamicIslandIntegration;
