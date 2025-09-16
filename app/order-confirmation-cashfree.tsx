import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Alert, Text, StatusBar, Dimensions, TextInput } from 'react-native';
import { ThemedText } from './components/ThemedText';
import { ThemedView } from './components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchOrderDetails } from './services/orderService';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || 'https://traffic-friend-backend.onrender.com'}/api`;

export default function OrderConfirmationCashfreeScreen() {
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
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    // Fetch order details to check payment status
    const fetchOrder = async () => {
      try {
        const order = await fetchOrderDetails(orderId as string);
        setOrderDetails(order);
        
        // If payment is already completed, show success
        if (order.payment?.status === 'paid') {
          setPaymentCompleted(true);
        } else if (order.payment?.method === 'cashfree') {
          // Show payment modal for Cashfree orders
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
    // Only show the "Let's Go" modal if payment is completed
    if (paymentCompleted) {
      const timer = setTimeout(() => {
        setShowLetsGoModal(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentCompleted]);

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

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    Alert.alert('Payment Successful!', 'Your payment has been confirmed. Your order is being processed.');
  };

  const handlePaymentFailure = (error: string) => {
    Alert.alert('Payment Failed', error);
  };

  const handlePaymentAppPress = async (appName: string) => {
    try {
      const totalAmount = orderDetails ? (orderDetails.totalAmount + orderDetails.deliveryFee) : parseFloat(total as string);
      const currentOrderId = orderDetails?._id || orderId;
      
      if (!currentOrderId) {
        Alert.alert('Error', 'Order ID not found. Please try again.');
        return;
      }

      // Create Cashfree payment link
      const upiId = '9353069942@paytm'; // Default UPI ID
      
      try {
        const response = await fetch(`${API_BASE_URL}/payments/cashfree/upi/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
          },
          body: JSON.stringify({ orderId: currentOrderId, upiId })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment link');
        }

        const paymentData = await response.json();
        
        if (paymentData.success && paymentData.linkUrl) {
          // Open Cashfree payment page
          const canOpen = await Linking.canOpenURL(paymentData.linkUrl);
          
          if (canOpen) {
            await Linking.openURL(paymentData.linkUrl);
            
            Alert.alert(
              'Payment Page Opened',
              `Opening payment page to complete payment of ₹${totalAmount}`,
              [
                {
                  text: 'Payment Complete',
                  onPress: () => handlePaymentSuccess()
                },
                {
                  text: 'Payment Failed',
                  onPress: () => handlePaymentFailure('Payment was not completed')
                }
              ]
            );
          } else {
            Alert.alert(
              'Error',
              'Cannot open payment page. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('Failed to create payment link');
        }
      } catch (apiError) {
        console.error('Error creating payment link:', apiError);
        Alert.alert(
          'Payment Error',
          'Failed to create payment link. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening payment app:', error);
      Alert.alert('Error', 'Failed to open payment app. Please try again.');
    }
  };

  const handleUPIAppsPayment = async () => {
    try {
      const totalAmount = orderDetails ? (orderDetails.totalAmount + orderDetails.deliveryFee) : parseFloat(total as string);
      const currentOrderId = orderDetails?._id || orderId;
      
      if (!currentOrderId) {
        Alert.alert('Error', 'Order ID not found. Please try again.');
        return;
      }

      // Create Cashfree payment link - UPI ID will be set by backend
      const upiId = 'paytm@paytm'; // This will be overridden by backend default
      
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('UPI Apps Payment request:', { orderId: currentOrderId, upiId, token: token ? 'present' : 'missing' });
        
        const response = await fetch(`${API_BASE_URL}/payments/cashfree/upi/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderId: currentOrderId, upiId })
        });

        console.log('UPI Apps Payment response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('UPI Apps Payment API error:', errorText);
          throw new Error(`Failed to create payment link: ${response.status}`);
        }

        const paymentData = await response.json();
        console.log('UPI Apps Payment data received:', paymentData);
        
        if (paymentData.success && paymentData.linkUrl) {
          // Open Cashfree payment page which will show UPI apps
          const canOpen = await Linking.canOpenURL(paymentData.linkUrl);
          
          if (canOpen) {
            await Linking.openURL(paymentData.linkUrl);
            
            Alert.alert(
              'Payment Page Opened',
              `Choose your preferred UPI app to complete payment of ₹${totalAmount}`,
              [
                {
                  text: 'Payment Complete',
                  onPress: () => handlePaymentSuccess()
                },
                {
                  text: 'Payment Failed',
                  onPress: () => handlePaymentFailure('Payment was not completed')
                }
              ]
            );
          } else {
            Alert.alert('Error', 'Cannot open payment page. Please try again.');
          }
        } else {
          Alert.alert('Error', paymentData.message || 'Failed to create payment link');
        }
      } catch (apiError) {
        console.error('Error creating payment link:', apiError);
        Alert.alert(
          'Payment Error',
          'Failed to create payment link. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening UPI apps:', error);
      Alert.alert('Error', 'Failed to open UPI apps. Please try again.');
    }
  };

  const handleUpiIdPayment = async () => {
    if (!upiId.trim()) {
      Alert.alert('UPI ID Required', 'Please enter a valid UPI ID to proceed with payment.');
      return;
    }

    try {
      const totalAmount = orderDetails ? (orderDetails.totalAmount + orderDetails.deliveryFee) : parseFloat(total as string);
      const currentOrderId = orderDetails?._id || orderId;
      
      if (!currentOrderId) {
        Alert.alert('Error', 'Order ID not found. Please try again.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/payments/cashfree/upi/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
          },
          body: JSON.stringify({ orderId: currentOrderId, upiId: upiId.trim() })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment link');
        }

        const paymentData = await response.json();
        
        if (paymentData.success && paymentData.linkUrl) {
          // Open Cashfree payment page
          const canOpen = await Linking.canOpenURL(paymentData.linkUrl);
          
          if (canOpen) {
            await Linking.openURL(paymentData.linkUrl);
            
            Alert.alert(
              'Payment Page Opened',
              `Opening payment page for ₹${totalAmount} with UPI ID ${upiId}`,
              [
                {
                  text: 'Payment Complete',
                  onPress: () => handlePaymentSuccess()
                },
                {
                  text: 'Payment Failed',
                  onPress: () => handlePaymentFailure('Payment was not completed')
                }
              ]
            );
          } else {
            Alert.alert(
              'Error',
              'Cannot open payment page. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('Failed to create payment link');
        }
      } catch (apiError) {
        console.error('Error creating payment link:', apiError);
        Alert.alert(
          'Payment Error',
          'Failed to create payment link. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening UPI payment:', error);
      Alert.alert('Error', 'Failed to open UPI payment. Please try again.');
    }
  };

  const handleLetsGo = async () => {
    setLoadingCheckpoint(true);
    setCheckpointError('');
    try {
      // Get selected delivery point from AsyncStorage
      const dp = await AsyncStorage.getItem('selectedDeliveryPoint');
      if (!dp) {
        setCheckpointError('Selected delivery point not found.');
        setLoadingCheckpoint(false);
        return;
      }
      const selectedDeliveryPoint = JSON.parse(dp);
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCheckpointError('Location permission denied.');
        setLoadingCheckpoint(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin = `${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
      const destination = `${selectedDeliveryPoint.latitude},${selectedDeliveryPoint.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      Linking.openURL(url);
      setShowLetsGoModal(false);
    } catch (error) {
      setCheckpointError('Failed to open Google Maps.');
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const handleContinueShopping = async () => {
    await AsyncStorage.removeItem('selectedDeliveryPoint');
    router.push('/(tabs)');
  };

  const handlePayNow = () => {
    setShowPaymentModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Small Map showing current and destination */}
        {currentLocation && deliveryPoint && (
          <View style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
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
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor="#4CAF50"
              />
              <Marker
                coordinate={deliveryPoint}
                title={deliveryPoint.name || 'Delivery Point'}
                pinColor="#D32F2F"
              />
            </MapView>
          </View>
        )}

        {paymentCompleted ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <ThemedText style={styles.title}>Order Placed Successfully!</ThemedText>
            <ThemedText style={styles.subtitle}>
              Thank you for your order. Your items will be delivered soon.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.pendingContainer}>
            <View style={styles.pendingIcon}>
              <Ionicons name="time" size={60} color="#ff9800" />
            </View>
            <ThemedText style={styles.title}>Order Created!</ThemedText>
            <ThemedText style={styles.subtitle}>
              Please complete your payment to confirm your order.
            </ThemedText>
            
            {/* Payment Required Banner */}
            <View style={styles.paymentBanner}>
              <Ionicons name="warning" size={20} color="#ff6b35" />
              <ThemedText style={styles.paymentBannerText}>
                Payment Required - Order will be cancelled if not completed
              </ThemedText>
            </View>
          </View>
        )}

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
            <ThemedText style={[styles.detailValue, styles.statusText]}>
              {paymentCompleted ? 'Confirmed' : 'Pending Payment'}
            </ThemedText>
          </View>
          {orderDetails?.payment && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Payment Method:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {orderDetails.payment.method === 'cashfree' ? 'UPI (Cashfree)' : 
                 'Cash on Delivery'}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!paymentCompleted && orderDetails?.payment?.method === 'cashfree' && (
            <TouchableOpacity 
              style={[styles.payNowButton, { marginBottom: 15 }]}
              onPress={handlePayNow}
            >
              <Ionicons name="card" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText style={styles.payNowButtonText}>💳 Pay Now - ₹{total}</ThemedText>
            </TouchableOpacity>
          )}
          
          {paymentCompleted && (
            <TouchableOpacity 
              style={[styles.continueButton, { marginRight: 10 }]}
              onPress={() => router.push(`/order-details/${orderId}`)}
            >
              <ThemedText style={styles.continueButtonText}>View Order Details</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: '#FF9800' }]}
            onPress={handleContinueShopping}
          >
            <ThemedText style={styles.continueButtonText}>Continue Shopping</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modern Full-Screen Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPaymentModal(false)}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.modernPaymentModal}>
          {/* Modern Header with Gradient */}
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modernHeader}
          >
            <View style={styles.modernHeaderContent}>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modernCloseButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modernHeaderInfo}>
                <Text style={styles.modernTitle}>Complete Payment</Text>
                <Text style={styles.modernSubtitle}>Choose your preferred payment method</Text>
              </View>
              <View style={styles.modernAmountContainer}>
                <Text style={styles.modernAmountSymbol}>₹</Text>
                <Text style={styles.modernAmountText}>
                  {orderDetails ? (orderDetails.totalAmount + orderDetails.deliveryFee) : total}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modernContent} showsVerticalScrollIndicator={false}>
            {/* Order Summary */}
            {orderDetails && (
              <View style={styles.modernOrderSummary}>
                <Text style={styles.modernOrderSummaryTitle}>Order Summary</Text>
                <View style={styles.modernOrderSummaryRow}>
                  <Text style={styles.modernOrderSummaryLabel}>Item Total</Text>
                  <Text style={styles.modernOrderSummaryValue}>₹{orderDetails.totalAmount}</Text>
                </View>
                <View style={styles.modernOrderSummaryRow}>
                  <Text style={styles.modernOrderSummaryLabel}>Delivery Fee</Text>
                  <Text style={styles.modernOrderSummaryValue}>₹{orderDetails.deliveryFee}</Text>
                </View>
                <View style={[styles.modernOrderSummaryRow, styles.modernOrderSummaryTotal]}>
                  <Text style={styles.modernOrderSummaryTotalLabel}>Total Amount</Text>
                  <Text style={styles.modernOrderSummaryTotalValue}>₹{orderDetails.totalAmount + orderDetails.deliveryFee}</Text>
                </View>
              </View>
            )}

            {/* Payment Method Tabs */}
            <View style={styles.modernMethodSelector}>
              <TouchableOpacity style={[styles.modernMethodButton, styles.modernMethodButtonActive]}>
                <Ionicons name="phone-portrait" size={24} color="#fff" />
                <Text style={styles.modernMethodButtonTextActive}>Payment Apps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernMethodButton}>
                <Ionicons name="card" size={24} color="#666" />
                <Text style={styles.modernMethodButtonText}>UPI ID</Text>
              </TouchableOpacity>
            </View>

            {/* UPI Apps Payment Section */}
            <View style={styles.modernAppsSection}>
              <View style={styles.modernSectionHeader}>
                <Text style={styles.modernSectionTitle}>Pay by UPI Apps</Text>
                <Text style={styles.modernSectionSubtitle}>Choose your preferred UPI app to complete the payment</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modernUpiAppsButton}
                onPress={() => handleUPIAppsPayment()}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modernUpiAppsButtonGradient}
                >
                  <Ionicons name="phone-portrait" size={24} color="#fff" />
                  <Text style={styles.modernUpiAppsButtonText}>Pay by UPI Apps</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* UPI ID Section */}
            <View style={styles.modernUpiSection}>
              <View style={styles.modernUpiHeader}>
                <Ionicons name="card" size={24} color="#667eea" />
                <Text style={styles.modernUpiTitle}>Or Enter UPI ID</Text>
              </View>
              <View style={styles.modernUpiInputContainer}>
                <TextInput
                  style={styles.modernUpiInput}
                  placeholder="Enter UPI ID (e.g., 9876543210@paytm)"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  value={upiId}
                  onChangeText={setUpiId}
                />
                <TouchableOpacity 
                  style={styles.modernUpiButton}
                  onPress={() => handleUpiIdPayment()}
                >
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Security & Trust Section */}
            <View style={styles.modernSecuritySection}>
              <View style={styles.modernSecurityRow}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                <Text style={styles.modernSecurityText}>
                  Secured with 256-bit SSL encryption
                </Text>
              </View>
              <View style={styles.modernSecurityRow}>
                <Ionicons name="lock-closed" size={20} color="#4CAF50" />
                <Text style={styles.modernSecurityText}>
                  PCI DSS compliant payment processing
                </Text>
              </View>
              <View style={styles.modernSecurityRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.modernSecurityText}>
                  Your data is safe and encrypted
                </Text>
              </View>
            </View>

            {/* Bottom Action Button */}
            <View style={styles.modernBottomSection}>
              <TouchableOpacity style={styles.modernPayButton}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modernPayButtonGradient}
                >
                  <Ionicons name="card" size={24} color="#fff" />
                  <Text style={styles.modernPayButtonText}>
                    Pay ₹{orderDetails ? (orderDetails.totalAmount + orderDetails.deliveryFee) : total}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Let's Go Modal */}
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
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: '#FF9800', marginTop: 10 }]}
              onPress={() => setShowLetsGoModal(false)}
            >
              <ThemedText style={styles.continueButtonText}>Close</ThemedText>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  successContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  pendingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingIcon: {
    marginBottom: 16,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentBannerText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payNowButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
  },
  paymentMethodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
  },
  paymentSummary: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  paymentSubtext: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Modern Payment Modal Styles
  modernPaymentModal: {
    flex: 1,
    backgroundColor: '#f8fafc',
    height: height,
  },
  modernHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modernHeaderInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modernSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },
  modernAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modernAmountSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 4,
  },
  modernAmountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  modernContent: {
    flex: 1,
    padding: 24,
  },
  modernOrderSummary: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernOrderSummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
  },
  modernOrderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modernOrderSummaryLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  modernOrderSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  modernOrderSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 16,
  },
  modernOrderSummaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  modernOrderSummaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  modernMethodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modernMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  modernMethodButtonActive: {
    backgroundColor: '#667eea',
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernMethodButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
  },
  modernMethodButtonTextActive: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  modernAppsSection: {
    marginBottom: 32,
  },
  modernSectionHeader: {
    marginBottom: 24,
  },
  modernSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  modernSectionSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  modernAppsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modernAppButtonSmall: {
    flex: 1,
    height: 80,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernAppGradientSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  modernAppLogoSmall: {
    fontSize: 24,
    marginBottom: 4,
  },
  modernAppNameSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modernUpiSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernUpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernUpiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginLeft: 12,
  },
  modernUpiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  modernUpiInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a202c',
    paddingVertical: 16,
  },
  modernUpiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modernSecuritySection: {
    backgroundColor: '#f0fff4',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  modernSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernSecurityText: {
    fontSize: 14,
    color: '#2d3748',
    marginLeft: 12,
    flex: 1,
  },
  modernBottomSection: {
    paddingBottom: 40,
  },
  modernPayButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modernPayButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  modernPayButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 12,
  },
  modernUpiAppsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 10,
  },
  modernUpiAppsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modernUpiAppsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
});
