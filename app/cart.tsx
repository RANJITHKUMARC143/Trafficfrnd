import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrder } from './services/orderService';
import * as Location from 'expo-location';
import { Linking, Modal as RNModal } from 'react-native';
import { useAuth } from '@/context/AuthContext';

type CartItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  size?: string;
  imageUrl: string;
  vendorId?: string;
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [pendingOrder, setPendingOrder] = useState(false);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [checkpointError, setCheckpointError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number; address: string} | null>(null);

  useEffect(() => {
    loadCartItems();
    // Load routeId from AsyncStorage
    const loadRouteId = async () => {
      const id = await AsyncStorage.getItem('currentRouteId');
      if (id) setRouteId(id);
    };
    loadRouteId();
  }, []);

  const loadCartItems = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    setVehicleModalVisible(true);
    setPendingOrder(true);
  };

  const fetchSelectedCheckpoint = async (routeId: string) => {
    setLoadingCheckpoint(true);
    setCheckpointError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.4.176:3000/api/routes/${routeId}/selected-checkpoint`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch selected checkpoint');
      const data = await res.json();
      // The location is in data.selectedCheckpoint.checkpoint.location
      if (data.selectedCheckpoint && data.selectedCheckpoint.checkpoint && data.selectedCheckpoint.checkpoint.location) {
        // This logic is now empty as the showOrderSuccessModal and selectedCheckpoint logic is removed
      } else {
        setCheckpointError('Checkpoint location not found in response');
      }
    } catch (error) {
      setCheckpointError('Failed to fetch checkpoint');
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const getUserCurrentLocation = async () => {
    try {
      // Check if location services are enabled
      const providerStatus = await Location.hasServicesEnabledAsync();
      if (!providerStatus) {
        console.log('Location services are disabled');
        return null;
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000, // Accept locations up to 30 seconds old
        timeout: 10000 // Timeout after 10 seconds
      });

      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      let address = '';
      try {
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (addressResult) {
          address = [
            addressResult.street,
            addressResult.city,
            addressResult.region,
            addressResult.country
          ].filter(Boolean).join(', ');
        }
      } catch (geocodeError) {
        console.log('Could not get address:', geocodeError);
        address = 'Current Location';
      }

      return { latitude, longitude, address };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const confirmVehicleNumberAndOrder = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter your vehicle number');
      return;
    }
    let vendorId = cartItems[0]?.vendorId;
    if (typeof vendorId === 'object' && vendorId !== null && vendorId._id) {
      vendorId = vendorId._id;
    }
    if (!vendorId || typeof vendorId !== 'string') {
      Alert.alert('Error', 'Vendor information missing or invalid in cart items');
      setVehicleModalVisible(false);
      setPendingOrder(false);
      return;
    }
    if (!routeId) {
      Alert.alert('Error', 'Route information missing. Please select a route.');
      setVehicleModalVisible(false);
      setPendingOrder(false);
      return;
    }
    setVehicleModalVisible(false);
    setPendingOrder(false);
    try {
      // Get user's current location
      const currentLocation = await getUserCurrentLocation();
      console.log('User current location:', currentLocation);

      const orderData = {
        vendorId,
        routeId,
        items: cartItems.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
        })),
        totalAmount: calculateTotal(),
        vehicleNumber,
        userLocation: currentLocation // Add user location to order data
      };
      console.log('Order payload:', orderData);
      const order = await createOrder(orderData);
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
      setVehicleNumber('');
      // Navigate to order confirmation page with all required params
      router.push({
        pathname: '/order-confirmation',
        params: {
          orderId: order._id,
          total: order.totalAmount,
          itemCount: order.items.length,
          routeId: order.routeId,
        },
      });
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemPrice}>₹{item.price}</ThemedText>
        <ThemedText style={styles.itemQuantity}>Quantity: {item.quantity}</ThemedText>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading cart...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Your Cart',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
          },
        }} 
      />

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <ThemedText style={styles.emptyCartText}>Your cart is empty</ThemedText>
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => router.push('/(tabs)')}
          >
            <ThemedText style={styles.continueShoppingText}>Continue Shopping</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartList}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>Total:</ThemedText>
              <ThemedText style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
            >
              <ThemedText style={styles.placeOrderButtonText}>Place Order</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
      <Modal
        visible={vehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVehicleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Enter Your Vehicle Number</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              maxLength={15}
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmVehicleNumberAndOrder}
            >
              <ThemedText style={styles.confirmButtonText}>Confirm & Place Order</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { setVehicleModalVisible(false); setPendingOrder(false); }}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {loadingCheckpoint && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Loading checkpoint...</ThemedText>
          </View>
        </View>
      )}
      {checkpointError ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{checkpointError}</ThemedText>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cartList: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 30,
  },
  continueShopping: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  continueShoppingText: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 