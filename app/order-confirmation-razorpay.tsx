import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Alert, Text, StatusBar, Dimensions, TextInput } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchOrderDetails } from '@lib/services/orderService';
import RazorpayPayment from '../components/_components/RazorpayPayment';

const { width, height } = Dimensions.get('window');
import { API_URL } from '@src/config';
const API_BASE_URL = `${API_URL}/api`;

export default function OrderConfirmationRazorpayScreen() {
  const params = useLocalSearchParams();
  const { total, itemCount, orderId, routeId } = params;

  const [showLetsGoModal, setShowLetsGoModal] = useState(false);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [checkpointError, setCheckpointError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    // Fetch order details to check payment status
    const fetchOrder = async () => {
      try {
        const order = await fetchOrderDetails(orderId as string);
        setOrderDetails(order);
        // Set delivery point from order details if available
        if (order?.selectedDeliveryPoint && typeof order.selectedDeliveryPoint.latitude === 'number' && typeof order.selectedDeliveryPoint.longitude === 'number') {
          setDeliveryPoint({
            latitude: order.selectedDeliveryPoint.latitude,
            longitude: order.selectedDeliveryPoint.longitude,
            name: order.selectedDeliveryPoint.name || 'Delivery Point'
          });
        }
        
        // If payment is already completed, show success
        if (order.payment?.status === 'paid') {
          setPaymentCompleted(true);
        } else if (order.payment?.method === 'razorpay') {
          // Show payment modal for Razorpay orders
          setShowPaymentModal(true);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    Alert.alert(
      'Payment Successful!',
      'Your order has been confirmed and payment has been processed.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to orders or home
            router.push('/(tabs)/orders');
          }
        }
      ]
    );
  };

  const handlePaymentFailure = (error: string) => {
    Alert.alert(
      'Payment Failed',
      error,
      [
        {
          text: 'Try Again',
          onPress: () => setShowPaymentModal(true)
        },
        {
          text: 'Cancel Order',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleLetsGo = async () => {
    setLoadingCheckpoint(true);
    setCheckpointError('');
    
    try {
      // Always start navigation to the selected delivery point on the client
      if (orderDetails?.selectedDeliveryPoint) {
        const dest = orderDetails.selectedDeliveryPoint;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`;
        Linking.openURL(url);
      }

      // Fire-and-forget server hint (if permitted for the current user)
      const token = await AsyncStorage.getItem('token');
      fetch(`${API_BASE_URL}/orders/${orderId}/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // send driver current location, and we will move to enroute and navigate to selected delivery point
          location: currentLocation,
          checkpoint: 'driver_started'
        })
      }).catch(() => {});

      setShowLetsGoModal(false);
      // Open navigation to the selected delivery point immediately
      Alert.alert('Success', 'Navigation started to selected delivery point.');
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      setCheckpointError('Failed to start. Please try again.');
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const openMaps = () => {
    if (deliveryPoint) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryPoint.latitude},${deliveryPoint.longitude}`;
      Linking.openURL(url);
    }
  };

  if (!orderDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/animation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3d7a00" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3d7a00', '#3d7a00']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Order Confirmation</ThemedText>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={paymentCompleted ? "checkmark-circle" : "time"} 
              size={24} 
              color={paymentCompleted ? "#3d7a00" : "#FF9800"} 
            />
            <ThemedText style={styles.statusTitle}>
              {paymentCompleted ? 'Order Confirmed' : 'Payment Pending'}
            </ThemedText>
          </View>
          <ThemedText style={styles.statusSubtitle}>
            {paymentCompleted 
              ? 'Your order has been confirmed and payment processed' 
              : 'Please complete payment to confirm your order'
            }
          </ThemedText>
        </View>

        {/* Order Details */}
        <View style={styles.orderCard}>
          <ThemedText style={styles.cardTitle}>Order Details</ThemedText>
          <View style={styles.orderInfo}>
            <ThemedText style={styles.orderText}>Order ID: {orderId}</ThemedText>
            <ThemedText style={styles.orderText}>Items: {itemCount}</ThemedText>
            <ThemedText style={styles.orderText}>Total: ₹{total}</ThemedText>
            <ThemedText style={styles.orderText}>Payment: {orderDetails.payment?.method || 'razorpay'}</ThemedText>
          </View>
        </View>

        {/* Payment Section */}
        {!paymentCompleted && (
          <View style={styles.paymentCard}>
            <ThemedText style={styles.cardTitle}>Complete Payment</ThemedText>
            <RazorpayPayment
              orderId={orderId as string}
              amount={parseFloat(total as string)}
              userEmail={orderDetails.user?.email}
              userPhone={orderDetails.user?.phone}
              userName={orderDetails.user?.name || orderDetails.customerName}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
            />
          </View>
        )}

        {/* Map Section */}
        {(deliveryPoint || currentLocation) && (
          <View style={styles.mapCard}>
            <ThemedText style={styles.cardTitle}>Delivery Location</ThemedText>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (deliveryPoint?.latitude) || (currentLocation?.latitude) || 0,
                longitude: (deliveryPoint?.longitude) || (currentLocation?.longitude) || 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {currentLocation && (
                <Marker
                  coordinate={currentLocation}
                  title="Your Location"
                  pinColor="blue"
                />
              )}
              {deliveryPoint && (
                <Marker
                  coordinate={deliveryPoint}
                  title="Delivery Point"
                  pinColor="red"
                />
              )}
            </MapView>
            <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
              <Ionicons name="navigate" size={20} color="white" />
              <ThemedText style={styles.mapButtonText}>Open in Maps</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {paymentCompleted && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowLetsGoModal(true)}
            >
              <Ionicons name="car" size={20} color="white" />
              <ThemedText style={styles.primaryButtonText}>Let's Go!</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Let's Go Modal */}
      <Modal
        visible={showLetsGoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLetsGoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Ready to Start?</ThemedText>
            <ThemedText style={styles.modalText}>
              Are you ready to start your delivery journey?
            </ThemedText>
            {checkpointError ? (
              <ThemedText style={styles.errorText}>{checkpointError}</ThemedText>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowLetsGoModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleLetsGo}
                disabled={loadingCheckpoint}
              >
                {loadingCheckpoint ? (
                  <ThemedText style={styles.modalButtonText}>Updating...</ThemedText>
                ) : (
                  <ThemedText style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Let's Go!
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderInfo: {
    gap: 8,
  },
  orderText: {
    fontSize: 14,
    color: '#333',
  },
  mapCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d7a00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  mapButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtons: {
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d7a00',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    margin: 20,
    minWidth: width * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: '#3d7a00',
    borderColor: '#3d7a00',
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: 'bold',
  },
});
