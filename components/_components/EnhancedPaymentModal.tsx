import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { API_URL } from '@src/config';

const { width, height } = Dimensions.get('window');

interface PaymentApp {
  id: string;
  name: string;
  scheme: string;
  upiId: string;
  color: string;
  icon: string;
  gradient: string[];
}

const PAYMENT_APPS: PaymentApp[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    scheme: 'phonepe://pay',
    upiId: 'phonepe@paytm',
    color: '#5f259f',
    icon: '📱',
    gradient: ['#5f259f', '#7c3aed'],
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    scheme: 'tez://upi/pay',
    upiId: 'googlepay@okaxis',
    color: '#4285f4',
    icon: '💳',
    gradient: ['#4285f4', '#34a853'],
  },
  {
    id: 'paytm',
    name: 'Paytm',
    scheme: 'paytmmp://pay',
    upiId: 'paytm@paytm',
    color: '#00baf2',
    icon: '💰',
    gradient: ['#00baf2', '#00a8cc'],
  },
  {
    id: 'bharatpe',
    name: 'BharatPe',
    scheme: 'bharatpe://pay',
    upiId: 'bharatpe@paytm',
    color: '#00d4aa',
    icon: '🏦',
    gradient: ['#00d4aa', '#00a085'],
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    scheme: 'mobikwik://pay',
    upiId: 'mobikwik@paytm',
    color: '#ff6b35',
    icon: '⚡',
    gradient: ['#ff6b35', '#ff8c42'],
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    scheme: 'amazonpay://pay',
    upiId: 'amazonpay@paytm',
    color: '#ff9900',
    icon: '🛒',
    gradient: ['#ff9900', '#ffb84d'],
  },
  {
    id: 'cred',
    name: 'CRED',
    scheme: 'cred://pay',
    upiId: 'cred@paytm',
    color: '#00d4aa',
    icon: '💎',
    gradient: ['#00d4aa', '#00a085'],
  },
  {
    id: 'freecharge',
    name: 'Freecharge',
    scheme: 'freecharge://pay',
    upiId: 'freecharge@paytm',
    color: '#ff6b35',
    icon: '⚡',
    gradient: ['#ff6b35', '#ff8c42'],
  },
];

interface EnhancedPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: string) => void;
}

export default function EnhancedPaymentModal({
  visible,
  onClose,
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentFailure,
}: EnhancedPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'apps' | 'upi'>('apps');
  const [selectedApp, setSelectedApp] = useState<PaymentApp | null>(null);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDirectAppPayment = async (app: PaymentApp) => {
    setLoading(true);
    setSelectedApp(app);
    
    try {
      // Create Razorpay order
      const response = await fetch(`${API_URL}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          upiId: app.upiId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Try to open the specific payment app
        const canOpen = await Linking.canOpenURL(app.scheme);
        if (canOpen) {
          await Linking.openURL(app.scheme);
        } else {
          // Fallback to payment link
          await Linking.openURL(result.linkUrl);
        }
        
        // Start polling for payment status
        pollPaymentStatus();
      } else {
        onPaymentFailure(result.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentFailure('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIAppsPayment = async () => {
    setLoading(true);
    
    try {
      // Create Razorpay order with a generic UPI ID
      const response = await fetch(`${API_URL}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          upiId: 'paytm@paytm', // Generic UPI ID for UPI apps
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Open UPI deep link that will show all available UPI apps
        const upiUrl = `upi://pay?pa=paytm@paytm&pn=TrafficFriend&am=${amount}&cu=INR&tn=Order Payment`;
        const canOpen = await Linking.canOpenURL(upiUrl);
        
        if (canOpen) {
          await Linking.openURL(upiUrl);
        } else {
          // Fallback to generic UPI link
          const genericUpiUrl = `upi://pay?pa=paytm@paytm&pn=TrafficFriend&am=${amount}&cu=INR&tn=Order Payment`;
          await Linking.openURL(genericUpiUrl);
        }
        
        // Start polling for payment status
        pollPaymentStatus();
      } else {
        onPaymentFailure(result.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentFailure('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPayment = async () => {
    if (!upiId.trim()) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          upiId: upiId.trim(),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await Linking.openURL(result.linkUrl);
        pollPaymentStatus();
      } else {
        onPaymentFailure(result.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentFailure('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        });
        const order = await response.json();
        
        if (order.payment?.status === 'paid') {
          clearInterval(interval);
          onPaymentSuccess();
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const getAuthToken = async () => {
    // Get token from AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('authToken');
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Complete Payment</Text>
              <Text style={styles.headerSubtitle}>Secure & Fast</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{formatAmount(amount)}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Payment Method Selector */}
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'apps' && styles.methodButtonActive,
              ]}
              onPress={() => setPaymentMethod('apps')}
            >
              <Ionicons
                name="phone-portrait"
                size={20}
                color={paymentMethod === 'apps' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.methodButtonText,
                  paymentMethod === 'apps' && styles.methodButtonTextActive,
                ]}
              >
                Payment Apps
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'upi' && styles.methodButtonActive,
              ]}
              onPress={() => setPaymentMethod('upi')}
            >
              <Ionicons
                name="card"
                size={20}
                color={paymentMethod === 'upi' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.methodButtonText,
                  paymentMethod === 'upi' && styles.methodButtonTextActive,
                ]}
              >
                UPI ID
              </Text>
            </TouchableOpacity>
          </View>

          {/* UPI Apps Payment */}
          {paymentMethod === 'apps' && (
            <View style={styles.appsSection}>
              <Text style={styles.sectionTitle}>Pay by UPI Apps</Text>
              <Text style={styles.sectionSubtitle}>
                Choose your preferred UPI app to complete the payment
              </Text>
              
              <TouchableOpacity
                style={[styles.upiAppsButton, loading && styles.payButtonDisabled]}
                onPress={handleUPIAppsPayment}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.upiAppsButtonGradient}
                >
                  <Ionicons name="phone-portrait" size={24} color="#fff" />
                  <Text style={styles.upiAppsButtonText}>
                    {loading ? 'Processing...' : 'Pay by UPI Apps'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* UPI ID Input */}
          {paymentMethod === 'upi' && (
            <View style={styles.upiSection}>
              <Text style={styles.sectionTitle}>Enter UPI ID</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.upiInput}
                  placeholder="Enter your UPI ID (e.g., yourname@paytm)"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.upiSuggestions}>
                <Text style={styles.suggestionsTitle}>Popular UPI IDs:</Text>
                <View style={styles.suggestionChips}>
                  {['yourname@paytm', 'yourname@okaxis', 'yourname@ybl', '9999999999@upi'].map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.suggestionChip}
                      onPress={() => setUpiId(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.payButton, loading && styles.payButtonDisabled]}
                onPress={handleUPIPayment}
                disabled={loading || !upiId.trim()}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.payButtonGradient}
                >
                  <Ionicons name="card" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>
                    {loading ? 'Processing...' : `Pay ${formatAmount(amount)}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your payment is secured with 256-bit SSL encryption
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    height: height, // Full screen height
  },
  header: {
    paddingTop: 60, // Increased padding
    paddingBottom: 30, // Increased padding
    paddingHorizontal: 24, // Increased padding
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24, // Increased font size
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16, // Increased font size
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4, // Increased margin
  },
  amountContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amountText: {
    fontSize: 22, // Increased font size
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24, // Increased padding
    height: height * 0.8, // 80% of screen height
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16, // Increased border radius
    padding: 6, // Increased padding
    marginBottom: 28, // Increased margin
    elevation: 3, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // Increased padding
    paddingHorizontal: 20, // Increased padding
    borderRadius: 12, // Increased border radius
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  methodButtonText: {
    fontSize: 18, // Increased font size
    fontWeight: '600',
    color: '#666',
    marginLeft: 10, // Increased margin
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  appsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20, // Increased font size
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8, // Reduced margin
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appButton: {
    width: (width - 80) / 2, // Slightly smaller width for better spacing
    height: 120, // Increased height even more
    marginBottom: 20, // Increased margin
    borderRadius: 20, // Increased border radius
    overflow: 'hidden',
    elevation: 5, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectedApp: {
    transform: [{ scale: 0.95 }],
  },
  appGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    fontSize: 40, // Increased icon size even more
    marginBottom: 12, // Increased margin
  },
  appName: {
    fontSize: 18, // Increased font size
    fontWeight: '700', // Increased font weight
    color: '#fff',
  },
  upiSection: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20, // Increased border radius
    paddingHorizontal: 24, // Increased padding
    paddingVertical: 20, // Increased padding
    marginBottom: 24, // Increased margin
    elevation: 4, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  upiInput: {
    flex: 1,
    fontSize: 20, // Increased font size
    color: '#333',
    paddingVertical: 8, // Increased padding
  },
  upiSuggestions: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  upiAppsButton: {
    borderRadius: 16, // Increased border radius
    overflow: 'hidden',
    elevation: 4, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 10, // Added margin
  },
  upiAppsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  upiAppsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  payButton: {
    borderRadius: 16, // Increased border radius
    overflow: 'hidden',
    elevation: 4, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 10, // Added margin
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24, // Increased padding
    paddingHorizontal: 40, // Increased padding
  },
  payButtonText: {
    fontSize: 20, // Increased font size
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16, // Increased margin
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});
