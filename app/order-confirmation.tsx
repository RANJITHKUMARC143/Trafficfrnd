import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
// Icons replaced with emoji for compatibility
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from '@cmp/LottieFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams();
  const { total, itemCount, orderId, routeId } = params;

  // Removed modal-related state
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState<{ latitude: number; longitude: number; name: string } | null>(null);

  // Removed auto-opening modal after confirmation

  useEffect(() => {
    // Fetch current location and delivery point for map
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
        const dp = await AsyncStorage.getItem('selectedDeliveryPoint');
        if (dp) {
          const parsed = JSON.parse(dp);
          setDeliveryPoint({ latitude: parsed.latitude, longitude: parsed.longitude, name: parsed.name });
        }
      } catch {}
    })();
  }, []);

  // Removed modal action handler

  const handleContinueShopping = async () => {
    await AsyncStorage.removeItem('selectedDeliveryPoint');
    router.push('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconWrap}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>
          <ThemedText style={styles.successTitle}>Order Confirmed</ThemedText>
          <ThemedText style={styles.successSubtitle}>Cash on Delivery</ThemedText>
          <View style={styles.methodChip}><Text style={{ fontSize: 14 }}>💵</Text><Text style={styles.methodChipText}>Pay at Delivery</Text></View>
        </View>

        {/* Map Preview */}
        {currentLocation && deliveryPoint && (
          <View style={styles.mapPreview}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: (currentLocation.latitude + deliveryPoint.latitude) / 2,
                longitude: (currentLocation.longitude + deliveryPoint.longitude) / 2,
                latitudeDelta: Math.abs(currentLocation.latitude - deliveryPoint.latitude) * 2 + 0.02,
                longitudeDelta: Math.abs(currentLocation.longitude - deliveryPoint.longitude) * 2 + 0.02,
              }}
              pointerEvents="none"
            >
              <Marker coordinate={currentLocation} title="Your Location" pinColor="#4CAF50" />
              <Marker coordinate={deliveryPoint} title={deliveryPoint.name || 'Delivery Point'} pinColor="#D32F2F" />
            </MapView>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          {orderId ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}><Text style={{ fontSize: 16 }}>🧾</Text><Text style={styles.summaryLabel}>Order ID</Text></View>
              <Text style={styles.summaryValue}>{orderId}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}><Text style={{ fontSize: 16 }}>🛍️</Text><Text style={styles.summaryLabel}>Items</Text></View>
            <Text style={styles.summaryValue}>{itemCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}><Text style={{ fontSize: 16 }}>🏷️</Text><Text style={styles.summaryLabel}>Amount</Text></View>
            <Text style={styles.amountValue}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}><Text style={{ fontSize: 16 }}>✅</Text><Text style={styles.summaryLabel}>Status</Text></View>
            <Text style={styles.statusValue}>Confirmed</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryBtn]} onPress={() => router.push(`/order-details/${orderId}`)}>
            <Text style={styles.primaryBtnText}>📍 Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn]} onPress={handleContinueShopping}>
            <Text style={styles.secondaryBtnText}>🏠 Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Modal removed as per request */}
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
    padding: 20,
  },
  successHeader: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  successSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  methodChip: {
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodChipText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  mapPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  summaryValue: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  amountValue: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 16,
  },
  statusValue: {
    color: '#4CAF50',
    fontWeight: '800',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#2E7D32',
    fontWeight: '800',
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
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
}); 