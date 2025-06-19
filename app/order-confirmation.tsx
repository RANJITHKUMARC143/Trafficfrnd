import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams();
  const { total, itemCount, orderId, routeId } = params;

  const [showLetsGoModal, setShowLetsGoModal] = useState(false);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [checkpointError, setCheckpointError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLetsGoModal(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLetsGo = async () => {
    setLoadingCheckpoint(true);
    setCheckpointError('');
    try {
      // Get routeId from params or AsyncStorage
      let routeIdToUse = routeId;
      if (!routeIdToUse) {
        routeIdToUse = await AsyncStorage.getItem('currentRouteId');
      }
      if (!routeIdToUse) {
        setCheckpointError('Route information missing.');
        setLoadingCheckpoint(false);
        return;
      }
      // Fetch selected checkpoint from backend
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.4.176:3000/api/routes/${routeIdToUse}/selected-checkpoint`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch selected checkpoint');
      const data = await res.json();
      if (!data.selectedCheckpoint || !data.selectedCheckpoint.checkpoint || !data.selectedCheckpoint.checkpoint.location) {
        setCheckpointError('Checkpoint location not found.');
        setLoadingCheckpoint(false);
        return;
      }
      const checkpoint = data.selectedCheckpoint.checkpoint.location;
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCheckpointError('Location permission denied.');
        setLoadingCheckpoint(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin = `${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
      const destination = `${checkpoint.latitude},${checkpoint.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      Linking.openURL(url);
      setShowLetsGoModal(false);
    } catch (error) {
      setCheckpointError('Failed to open Google Maps.');
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const handleContinueShopping = () => {
    router.push('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LottieView
            source={require('../assets/animations/order-success.json')}
            autoPlay
            loop={false}
            style={{ width: 140, height: 140 }}
          />
        </View>
        
        <ThemedText style={styles.title}>Order Placed Successfully!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Thank you for your order. Your items will be delivered soon.
        </ThemedText>

        <View style={styles.orderDetails}>
          {orderId && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Order ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{orderId}</ThemedText>
            </View>
          )}
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Order Amount:</ThemedText>
            <ThemedText style={styles.detailValue}>₹{total}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Items:</ThemedText>
            <ThemedText style={styles.detailValue}>{itemCount}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Status:</ThemedText>
            <ThemedText style={[styles.detailValue, styles.statusText]}>Confirmed</ThemedText>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinueShopping}
        >
          <ThemedText style={styles.continueButtonText}>Continue Shopping</ThemedText>
        </TouchableOpacity>
      </View>
      <Modal
        visible={showLetsGoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLetsGoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.title}>Order Confirmed!</ThemedText>
            <ThemedText style={styles.subtitle}>Let's go to the checkpoint</ThemedText>
            <TouchableOpacity style={styles.continueButton} onPress={handleLetsGo}>
              <ThemedText style={styles.continueButtonText}>Let's Go</ThemedText>
            </TouchableOpacity>
            {loadingCheckpoint && (
              <ThemedText style={styles.subtitle}>Loading checkpoint...</ThemedText>
            )}
            {checkpointError ? (
              <ThemedText style={[styles.subtitle, { color: 'red' }]}>{checkpointError}</ThemedText>
            ) : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    color: '#4CAF50',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
}); 