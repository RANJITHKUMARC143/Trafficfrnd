import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, ActivityIndicator, TextInput, StyleSheet, ScrollView } from 'react-native';
import { createCashfreeUPIOrder, createCashfreePaymentSession, verifyCashfreePayment } from '../services/orderService';

interface CashfreePaymentProps {
  orderId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: string) => void;
}

// Payment app configurations
const PAYMENT_APPS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    scheme: 'phonepe://pay',
    upiId: 'phonepe@paytm',
    color: '#5f259f',
    icon: '📱'
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    scheme: 'tez://upi/pay',
    upiId: 'googlepay@okaxis',
    color: '#4285f4',
    icon: '💳'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    scheme: 'paytmmp://pay',
    upiId: 'paytm@paytm',
    color: '#00baf2',
    icon: '💰'
  },
  {
    id: 'bharatpe',
    name: 'BharatPe',
    scheme: 'bharatpe://pay',
    upiId: 'bharatpe@paytm',
    color: '#00d4aa',
    icon: '🏦'
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    scheme: 'mobikwik://pay',
    upiId: 'mobikwik@paytm',
    color: '#ff6b35',
    icon: '⚡'
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    scheme: 'amazonpay://pay',
    upiId: 'amazonpay@paytm',
    color: '#ff9900',
    icon: '🛒'
  },
  {
    id: 'cred',
    name: 'CRED',
    scheme: 'cred://pay',
    upiId: 'cred@paytm',
    color: '#00d4aa',
    icon: '💎'
  },
  {
    id: 'freecharge',
    name: 'Freecharge',
    scheme: 'freecharge://pay',
    upiId: 'freecharge@paytm',
    color: '#ff6b35',
    icon: '⚡'
  }
];

export default function CashfreePayment({ orderId, amount, onPaymentSuccess, onPaymentFailure }: CashfreePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'apps' | 'upi'>('apps');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleDirectAppPayment = async (app: typeof PAYMENT_APPS[0]) => {
    setLoading(true);
    try {
      // First create the payment link with the app's UPI ID
      const result = await createCashfreeUPIOrder(orderId, app.upiId);
      
      if (result.success && result.linkUrl) {
        // Try to open the specific payment app first
        const appScheme = app.scheme;
        const canOpenApp = await Linking.canOpenURL(appScheme);
        
        if (canOpenApp) {
          // Open the specific payment app
          await Linking.openURL(appScheme);
          
          Alert.alert(
            `${app.name} Opened`,
            `Please complete the payment in ${app.name}. We will verify the payment automatically.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  pollPaymentStatus();
                }
              }
            ]
          );
        } else {
          // Fallback to opening the payment link in browser
          const canOpenLink = await Linking.canOpenURL(result.linkUrl);
          if (canOpenLink) {
            await Linking.openURL(result.linkUrl);
            
            Alert.alert(
              'Payment Link Opened',
              `Please complete the payment using ${app.name} or any UPI app. We will verify the payment automatically.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    pollPaymentStatus();
                  }
                }
              ]
            );
          } else {
            throw new Error('Cannot open payment link');
          }
        }
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('Direct App Payment Error:', error);
      onPaymentFailure(error.message || `Failed to open ${app.name}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPaymentLink = async () => {
    if (!upiId.trim()) {
      Alert.alert('Error', 'Please enter your UPI ID');
      return;
    }

    setLoading(true);
    try {
      const result = await createCashfreeUPIOrder(orderId, upiId);
      
      if (result.success && result.linkUrl) {
        // Open the payment link
        const canOpen = await Linking.canOpenURL(result.linkUrl);
        if (canOpen) {
          await Linking.openURL(result.linkUrl);
          
          // Show success message and start polling for payment status
          Alert.alert(
            'Payment Link Generated',
            'Please complete the payment in your UPI app. We will verify the payment automatically.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start polling for payment verification
                  pollPaymentStatus();
                }
              }
            ]
          );
        } else {
          throw new Error('Cannot open payment link');
        }
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('UPI Payment Link Error:', error);
      onPaymentFailure(error.message || 'Failed to create UPI payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPaymentSession = async () => {
    setLoading(true);
    try {
      const result = await createCashfreePaymentSession(orderId);
      
      if (result.success && result.paymentSessionId) {
        // For mobile SDK integration, you would use the Cashfree React Native SDK here
        // For now, we'll show a success message and poll for status
        Alert.alert(
          'Payment Session Created',
          'Payment session created successfully. In a real implementation, this would open the Cashfree payment SDK.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Start polling for payment verification
                pollPaymentStatus();
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error) {
      console.error('UPI Payment Session Error:', error);
      onPaymentFailure(error.message || 'Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async () => {
    // Poll for payment status every 3 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes with 3-second intervals
    
    const poll = async () => {
      try {
        const result = await verifyCashfreePayment(orderId);
        
        if (result.success && result.paymentStatus === 'paid') {
          onPaymentSuccess();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000); // Poll again after 3 seconds
        } else {
          onPaymentFailure('Payment verification timeout. Please check your payment status manually.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          onPaymentFailure('Failed to verify payment status');
        }
      }
    };
    
    poll();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💳 Choose Payment Method</Text>
      <Text style={styles.amount}>Amount: ₹{amount}</Text>
      
      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'apps' && styles.selectedMethod]}
          onPress={() => setPaymentMethod('apps')}
        >
          <Text style={[styles.methodText, paymentMethod === 'apps' && styles.selectedMethodText]}>
            📱 Payment Apps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'upi' && styles.selectedMethod]}
          onPress={() => setPaymentMethod('upi')}
        >
          <Text style={[styles.methodText, paymentMethod === 'upi' && styles.selectedMethodText]}>
            🔗 UPI ID
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'apps' && (
        <View style={styles.appsContainer}>
          <Text style={styles.sectionTitle}>Select Payment App</Text>
          <View style={styles.appsGrid}>
            {PAYMENT_APPS.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[
                  styles.appButton,
                  { backgroundColor: app.color },
                  selectedApp === app.id && styles.selectedApp
                ]}
                onPress={() => {
                  setSelectedApp(app.id);
                  handleDirectAppPayment(app);
                }}
                disabled={loading}
              >
                <Text style={styles.appIcon}>{app.icon}</Text>
                <Text style={styles.appName}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {paymentMethod === 'upi' && (
        <View style={styles.upiInputContainer}>
          <Text style={styles.label}>Enter your UPI ID:</Text>
          <TextInput
            style={styles.upiInput}
            placeholder="yourname@paytm or 9999999999@upi"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
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
            style={[styles.payButton, loading && styles.disabledButton]}
            onPress={handleUPIPaymentLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Generate UPI Payment Link</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}

      <Text style={styles.note}>
        {paymentMethod === 'apps' 
          ? 'Tap on your preferred payment app to open it directly and complete the payment.'
          : 'Enter your UPI ID to generate a payment link that can be opened in any UPI app.'
        }
      </Text>
    </ScrollView>
  );
}

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
  amount: {
    fontSize: 20,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedMethod: {
    backgroundColor: '#4CAF50',
  },
  methodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedMethodText: {
    color: '#fff',
  },
  appsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedApp: {
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
  appIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  upiInputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  upiInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  upiSuggestions: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  suggestionText: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
});
