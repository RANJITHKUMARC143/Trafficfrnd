import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Linking,
  RefreshControl,
  Dimensions
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchOrderDetails } from '../../services/orderService';
import chatService from '../../services/chatService';
import { sendClickToCall } from '../../services/callService';


interface Order {
  _id: string;
  status: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee: number;
  feeBreakdown: any;
  timestamp: string;
  updatedAt: string;
  deliveryAddress: string;
  specialInstructions: string;
  vehicleNumber: string;
  locations: {
    user: { latitude: number; longitude: number; address: string };
    vendor: { latitude: number; longitude: number; address: string };
    deliveryBoy: { latitude: number; longitude: number; address: string };
  };
  selectedDeliveryPoint: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  deliveryBoyId: {
    _id: string;
    fullName: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating: number;
    totalDeliveries: number;
    onTimeRate: number;
    currentLocation: {
      coordinates: [number, number];
      lastUpdated: string;
    };
  };
  payment: {
    method: string;
    status: string;
    amount: number;
  };
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'delivery';
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await fetchOrderDetails(id as string);
        setOrder(data);
        // Normalize delivery boy currentLocation from GeoJSON if available
        try {
          const coords = data?.deliveryBoyId?.currentLocation?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              setDeliveryBoyLocation({ latitude: lat, longitude: lng });
            }
          }
        } catch {}
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const messageListenerRef = useRef<((message: any) => void) | null>(null);
  const historyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Compute and store history key per order
    if (id) historyKeyRef.current = `chat_history_${String(id)}`;
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadHistory = async () => {
        try {
          const key = historyKeyRef.current;
          if (!key) return;
          const raw = await AsyncStorage.getItem(key);
          if (raw && isActive) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setMessages(arr);
          }
        } catch {}
      };
      loadHistory();
      return () => { isActive = false; };
    }, [id])
  );

  useEffect(() => {
    // Persist chat history whenever messages change
    const saveHistory = async () => {
      try {
        const key = historyKeyRef.current;
        if (!key) return;
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      } catch {}
    };
    if (messages && messages.length >= 0) saveHistory();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('Initializing chat for order:', id, 'deliveryBoyId:', order?.deliveryBoyId?._id);
        const socket = await chatService.connect();
        if (!socket) {
          console.log('Failed to connect to chat socket');
          return;
        }

        console.log('Chat socket connected, joining room:', id);
        setIsChatConnected(true);
        // Join order-specific room
        chatService.joinOrderRoom(id as string);

        // Set up event listeners
        chatService.onOrderStatusUpdate(({ orderId, status }) => {
          if (orderId === id) {
            setOrder(prev => prev ? { ...prev, status } : null);
          }
        });

        chatService.onLocationUpdate(({ deliveryBoyId, location }) => {
          if (order?.deliveryBoyId?._id === deliveryBoyId) {
            try {
              const coords = location?.coordinates || location?.coords || location;
              if (Array.isArray(coords) && coords.length >= 2) {
                const lat = Number(coords[1]);
                const lng = Number(coords[0]);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setDeliveryBoyLocation({ latitude: lat, longitude: lng });
                }
              } else if (typeof location?.latitude === 'number' && typeof location?.longitude === 'number') {
                setDeliveryBoyLocation({ latitude: location.latitude, longitude: location.longitude });
              }
            } catch {}
          }
        });

        // Register message listener scoped to this order and store for cleanup
        messageListenerRef.current = (message: any) => {
          if (String(message?.orderId) !== String(id)) return;
          console.log('Received message for this order:', message);
          const uniqueMessage = {
            ...message,
            id: `${message?.id || Date.now().toString()}-${Math.random().toString(36).slice(2)}`
          };
          setMessages(prev => [...prev, uniqueMessage]);
          scrollToBottom();
        };
        chatService.onMessage(messageListenerRef.current);

        return () => {
          // Clean up listener and leave room
          if (messageListenerRef.current) {
            chatService.offMessage(messageListenerRef.current);
            messageListenerRef.current = null;
          }
          chatService.leaveOrderRoom(id as string);
          setIsChatConnected(false);
        };
      } catch (error) {
        console.error('Chat initialization error:', error);
      }
    };

    if (order?.deliveryBoyId?._id) {
      console.log('Delivery boy assigned, initializing chat');
      initializeChat();
    } else {
      console.log('No delivery boy assigned yet, chat not initialized');
    }
  }, [order?.deliveryBoyId, id]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchOrderDetails(id as string);
      setOrder(data);
    } catch (error) {
      console.error('Error refreshing order:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !chatService.isSocketConnected()) {
      console.log('Cannot send message:', { hasMessage: !!newMessage.trim(), isConnected: chatService.isSocketConnected() });
      return;
    }

    const message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    };

    console.log('Sending message:', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    scrollToBottom();

    // Send message to delivery partner
    chatService.sendMessage(id as string, message.text, 'user');
  };

  const callDeliveryPartner = async () => {
    try {
      const toNumber = order?.deliveryBoyId?.phone ? String(order.deliveryBoyId.phone) : '';
      // Prefer user phone from order payload; fallback to stored user profile
      let fromNumber = order?.user?.phone ? String(order.user.phone) : '';
      if (!fromNumber) {
        try {
          const raw = await AsyncStorage.getItem('user');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.phone) fromNumber = String(parsed.phone);
          }
        } catch {}
      }

      if (fromNumber && toNumber) {
        // Provider token from env or local storage
        let providerToken = process.env.EXPO_PUBLIC_CLICK_TO_CALL_TOKEN as string | undefined;
        if (!providerToken) {
          try {
            const stored = await AsyncStorage.getItem('CLICK_TO_CALL_TOKEN');
            if (stored) providerToken = stored;
          } catch {}
        }

        const res = await sendClickToCall(
          { from_number: fromNumber, to_number: toNumber },
          providerToken ? { authToken: providerToken } : undefined
        );
        if (!res?.success) {
          Alert.alert('Call Failed', res?.message || 'Unable to initiate call. Opening dialer...');
          Linking.openURL(`tel:${toNumber}`);
        }
        return;
      }

      // Fallback: open the native dialer if either number missing
      if (toNumber) {
        Linking.openURL(`tel:${toNumber}`);
      } else {
        Alert.alert('Call Unavailable', 'Delivery partner number not available yet.');
      }
    } catch (e) {
      try {
        const toNumber = order?.deliveryBoyId?.phone ? String(order.deliveryBoyId.phone) : '';
        if (toNumber) return Linking.openURL(`tel:${toNumber}`);
      } catch {}
      Alert.alert('Call Error', 'Unable to start the call. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#2196F3';
      case 'preparing': return '#9C27B0';
      case 'enroute': return '#FF5722';
      case 'ready': return '#4CAF50';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Order Pending';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing Your Order';
      case 'enroute': return 'On the Way';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown Status';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <ThemedText style={styles.errorText}>Order not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Order Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <ThemedText style={styles.statusText}>{getStatusText(order.status)}</ThemedText>
          </View>
          <ThemedText style={styles.orderId}>Order #{order._id.slice(-8)}</ThemedText>
        </View>

        {/* Map View */}
        {(currentLocation || deliveryBoyLocation || (order.selectedDeliveryPoint?.latitude && order.selectedDeliveryPoint?.longitude)) && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (currentLocation?.latitude
                  || (typeof order.selectedDeliveryPoint?.latitude === 'number' ? order.selectedDeliveryPoint.latitude : 0)
                  || 0),
                longitude: (currentLocation?.longitude
                  || (typeof order.selectedDeliveryPoint?.longitude === 'number' ? order.selectedDeliveryPoint.longitude : 0)
                  || 0),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' && (
                <Marker
                  coordinate={currentLocation}
                  title="Your Location"
                  pinColor="#4CAF50"
                />
              )}
              {deliveryBoyLocation && typeof deliveryBoyLocation.latitude === 'number' && typeof deliveryBoyLocation.longitude === 'number' && (
                <Marker
                  coordinate={deliveryBoyLocation}
                  title={`${order.deliveryBoyId?.fullName || 'Delivery Partner'}`}
                  pinColor="#FF5722"
                />
              )}
              {(typeof order.selectedDeliveryPoint?.latitude === 'number' && typeof order.selectedDeliveryPoint?.longitude === 'number') && (
                <Marker
                  coordinate={{
                    latitude: order.selectedDeliveryPoint.latitude,
                    longitude: order.selectedDeliveryPoint.longitude
                  }}
                  title="Delivery Point"
                  pinColor="#2196F3"
                />
              )}
            </MapView>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Order Date</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {new Date(order.timestamp).toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Items</ThemedText>
            <ThemedText style={styles.summaryValue}>{order.items.length}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{order.totalAmount - order.deliveryFee}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Delivery Fee</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{order.deliveryFee}</ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₹{order.totalAmount}</ThemedText>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Items Ordered</ThemedText>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemQuantity}>Qty: {item.quantity}</ThemedText>
              </View>
              <ThemedText style={styles.itemPrice}>₹{item.price * item.quantity}</ThemedText>
            </View>
          ))}
        </View>

        {/* Delivery Partner Info */}
        {order.deliveryBoyId && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Delivery Partner</ThemedText>
            <View style={styles.deliveryPartnerCard}>
              <View style={styles.deliveryPartnerInfo}>
                <View style={styles.deliveryPartnerHeader}>
                  <ThemedText style={styles.deliveryPartnerName}>{order.deliveryBoyId.fullName}</ThemedText>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.rating}>{order.deliveryBoyId.rating.toFixed(1)}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.deliveryPartnerDetails}>
                  {order.deliveryBoyId.vehicleType} • {order.deliveryBoyId.vehicleNumber}
                </ThemedText>
                <ThemedText style={styles.deliveryStats}>
                  {order.deliveryBoyId.totalDeliveries} deliveries • {order.deliveryBoyId.onTimeRate}% on-time
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={callDeliveryPartner}>
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Details</ThemedText>
          {order.selectedDeliveryPoint && (
            <View style={styles.deliveryDetailRow}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <View style={styles.deliveryDetailInfo}>
                <ThemedText style={styles.deliveryDetailTitle}>Delivery Point</ThemedText>
                <ThemedText style={styles.deliveryDetailText}>{order.selectedDeliveryPoint.name}</ThemedText>
                <ThemedText style={styles.deliveryDetailAddress}>{order.selectedDeliveryPoint.address}</ThemedText>
              </View>
            </View>
          )}
          {order.vehicleNumber && (
            <View style={styles.deliveryDetailRow}>
              <Ionicons name="car" size={20} color="#4CAF50" />
              <View style={styles.deliveryDetailInfo}>
                <ThemedText style={styles.deliveryDetailTitle}>Vehicle Number</ThemedText>
                <ThemedText style={styles.deliveryDetailText}>{order.vehicleNumber}</ThemedText>
              </View>
            </View>
          )}
          {order.specialInstructions && (
            <View style={styles.deliveryDetailRow}>
              <Ionicons name="document-text" size={20} color="#FF9800" />
              <View style={styles.deliveryDetailInfo}>
                <ThemedText style={styles.deliveryDetailTitle}>Special Instructions</ThemedText>
                <ThemedText style={styles.deliveryDetailText}>{order.specialInstructions}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Chat Section */}
        {order.deliveryBoyId && (
          <View style={styles.section}>
            <View style={styles.chatHeader}>
              <ThemedText style={styles.sectionTitle}>Send message to Delivery Partner</ThemedText>
              <View style={styles.connectionStatus}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: isChatConnected ? '#4CAF50' : '#F44336' }
                ]} />
                <ThemedText style={styles.statusText}>
                  {isChatConnected ? 'Connected' : 'Disconnected'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.chatContainer}>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.messagesContainer}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((message, idx) => (
                  <View
                    key={`${message.id}-${idx}`}
                    style={[
                      styles.messageBubble,
                      message.sender === 'user' ? styles.userMessage : styles.deliveryMessage
                    ]}
                  >
                    <ThemedText style={[
                      styles.messageText,
                      message.sender === 'user' ? styles.userMessageText : styles.deliveryMessageText
                    ]}>
                      {message.text}
                    </ThemedText>
                    <ThemedText style={styles.messageTime}>
                      {(() => {
                        const dt = message?.timestamp ? new Date(message.timestamp as any) : null;
                        return dt && !isNaN(dt.getTime())
                          ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '';
                      })()}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sendButton, { backgroundColor: '#FF9800', marginLeft: 8 }]} 
                  onPress={() => {
                    const testMessage = {
                      id: Date.now().toString(),
                      text: 'Test message from user',
                      sender: 'user' as const,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, testMessage]);
                    console.log('Added test message:', testMessage);
                  }}
                >
                  <Ionicons name="chatbubble" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 10,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  deliveryPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deliveryPartnerInfo: {
    flex: 1,
  },
  deliveryPartnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryPartnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  deliveryPartnerDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deliveryStats: {
    fontSize: 12,
    color: '#999',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  deliveryDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deliveryDetailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  deliveryDetailAddress: {
    fontSize: 14,
    color: '#666',
  },
  chatContainer: {
    height: 300,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messagesContainer: {
    flex: 1,
    padding: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-end',
  },
  deliveryMessage: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  deliveryMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 