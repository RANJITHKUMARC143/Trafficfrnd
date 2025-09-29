import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, Linking, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/orderService';

interface RazorpayPaymentProps {
  orderId: string;
  amount: number;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: string) => void;
}

export default function RazorpayPayment({ orderId, amount, userEmail, userPhone, userName, onPaymentSuccess, onPaymentFailure }: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      // Create Razorpay order
      const orderResponse = await createRazorpayOrder(orderId);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      setPaymentData(orderResponse);
      setShowWebView(true);
    } catch (error) {
      console.error('Razorpay payment error:', error);
      onPaymentFailure(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      if (data.type === 'payment_success') {
        setShowWebView(false);
        onPaymentSuccess();
      } else if (data.type === 'payment_failed') {
        setShowWebView(false);
        onPaymentFailure(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const generateRazorpayHTML = () => {
    if (!paymentData) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Razorpay Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #3d7a00;
            margin: 10px 0;
          }
          .button {
            background-color: #3d7a00;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #3d7a00;
          }
          .button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Traffic Friend</h2>
            <div class="amount">₹${(paymentData.amount / 100).toFixed(2)}</div>
            <p>Order: ${orderId}</p>
          </div>
          <button class="button" onclick="openRazorpay()" id="payButton">
            Pay Now
          </button>
        </div>

        <script>
          const options = {
            key: '${paymentData.keyId}',
            amount: ${paymentData.amount},
            currency: 'INR',
            name: 'Traffic Friend',
            description: 'Order Payment - ${orderId}',
            order_id: '${paymentData.orderId}',
            prefill: {
              name: '${userName || 'Customer'}',
              email: '${userEmail || 'customer@example.com'}',
              contact: '${userPhone || '9999999999'}'
            },
            // Ensure UPI Intent apps (GPay/PhonePe/Paytm) and all common options show up
            method: {
              upi: true,
              wallet: true,
              card: true,
              netbanking: true,
              paylater: true
            },
            upi: {
              flow: 'intent' // Prefer direct app intent instead of manual VPA entry
            },
            // Try to prioritize UPI apps and wallets on the sheet
            config: {
              display: {
                blocks: {
                  upi_block: {
                    name: 'UPI Apps',
                    instruments: [
                      { method: 'upi', flows: ['intent'] }
                    ]
                  },
                  wallet_block: {
                    name: 'Wallets',
                    instruments: [
                      { method: 'wallet', wallets: ['paytm'] }
                    ]
                  }
                },
                sequence: ['block.upi_block', 'block.wallet_block'],
                preferences: {
                  show_default_blocks: true
                }
              }
            },
            theme: {
              color: '#3d7a00'
            },
            handler: function (response) {
              console.log('Payment success:', response);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_success',
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              }));
            },
            modal: {
              ondismiss: function() {
                console.log('Payment modal dismissed');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_failed',
                  message: 'Payment was cancelled by user'
                }));
              }
            }
          };

          function openRazorpay() {
            const rzp = new Razorpay(options);
            rzp.open();
          }

          // Auto-open payment modal
          setTimeout(() => {
            openRazorpay();
          }, 1000);
        </script>
      </body>
      </html>
    `;
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.paymentButton, loading && styles.disabledButton]}
          onPress={handleRazorpayPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Pay ₹{amount} with Razorpay
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.description}>
          Secure payment with UPI, Cards, Net Banking, Wallets
        </Text>
      </View>

      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWebView(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {paymentData && (
            <WebView
              source={{ html: generateRazorpayHTML() }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              userAgent={
                Platform.select({
                  android: 'Mozilla/5.0 (Linux; Android 10; Chrome/119.0.0.0 Mobile Safari/537.36)',
                  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                }) as string
              }
              // Handle UPI intent links opened by Razorpay Checkout inside WebView
              onShouldStartLoadWithRequest={(request) => {
                const url = request?.url || '';
                if (url.startsWith('upi:') || url.startsWith('phonepe:') || url.startsWith('tez:') || url.startsWith('gpay:') || url.startsWith('paytmmp:')) {
                  Linking.openURL(url).catch(() => {});
                  return false;
                }
                return true;
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  paymentButton: {
    backgroundColor: '#3d7a00',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  webview: {
    flex: 1,
  },
});
