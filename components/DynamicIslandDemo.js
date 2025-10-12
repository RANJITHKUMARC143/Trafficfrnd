import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useDynamicIsland } from '../context/DynamicIslandContext';

const DynamicIslandDemo = () => {
  const { triggerDemoNotification, connectSocket, disconnectSocket, socket } = useDynamicIsland();

  const demoNotifications = [
    { type: 'confirmed', label: 'Order Confirmed', emoji: '🛒' },
    { type: 'assigned', label: 'Walker Assigned', emoji: '🚶‍♂️' },
    { type: 'pickup', label: 'Order Picked Up', emoji: '🚶‍♂️' },
    { type: 'nearby', label: 'Rider Nearby', emoji: '🚴‍♂️' },
    { type: 'delivered', label: 'Order Delivered', emoji: '✅' },
  ];

  const handleDemoNotification = (type) => {
    triggerDemoNotification(type);
  };

  const handleConnectSocket = () => {
    connectSocket();
  };

  const handleDisconnectSocket = () => {
    disconnectSocket();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 Dynamic Island Demo</Text>
      <Text style={styles.subtitle}>Test Traffic Frnd notifications</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 Socket Connection</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.connectButton]} 
            onPress={handleConnectSocket}
          >
            <Text style={styles.buttonText}>Connect Socket</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.disconnectButton]} 
            onPress={handleDisconnectSocket}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.statusText}>
          Status: {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 Demo Notifications</Text>
        <Text style={styles.instructionText}>
          Tap any button below to trigger a Dynamic Island notification
        </Text>
        
        {demoNotifications.map((notification, index) => (
          <TouchableOpacity
            key={index}
            style={styles.notificationButton}
            onPress={() => handleDemoNotification(notification.type)}
          >
            <Text style={styles.notificationEmoji}>{notification.emoji}</Text>
            <Text style={styles.notificationLabel}>{notification.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ How it Works</Text>
        <Text style={styles.infoText}>
          • The Dynamic Island appears at the top of your screen{'\n'}
          • Shows real-time delivery updates with smooth animations{'\n'}
          • Connects to your backend via Socket.io for live updates{'\n'}
          • Auto-hides after 4 seconds or when new update arrives{'\n'}
          • Includes haptic feedback on supported devices
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Integration</Text>
        <Text style={styles.codeText}>
          {`// Add to your App.js
import { DynamicIslandProvider } from './context/DynamicIslandContext';
import TrafficFrndDynamicIsland from './components/TrafficFrndDynamicIsland';

export default function App() {
  return (
    <DynamicIslandProvider>
      <YourAppContent />
      <TrafficFrndDynamicIsland />
    </DynamicIslandProvider>
  );
}`}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  notificationEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});

export default DynamicIslandDemo;
