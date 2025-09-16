import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Alert, TextInput, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrder, fetchDeliveryPoints, quoteDeliveryFee, getPaymentConfig } from '@lib/services/orderService';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
// Map preview removed
import { API_URL } from '@src/config';
// Lottie removed

type CartItem = {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  quantity: number;
  size?: string;
  imageUrl: string;
  vendorId?: string;
};

async function fetchLatestDeliveryPoint(destination) {
  const token = await AsyncStorage.getItem('token');
  const userId = await AsyncStorage.getItem('userId');
  const res = await fetch(`${API_URL}/api/users/${userId}/delivery-point?destination=${encodeURIComponent(destination)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('No delivery point found');
  const data = await res.json();
  return data.deliveryPoint;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [pendingOrder, setPendingOrder] = useState(true);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [checkpointError, setCheckpointError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number; address: string} | null>(null);
  const isFocused = useIsFocused();
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState(null);
  const [suggestedDeliveryPoints, setSuggestedDeliveryPoints] = useState<any[]>([]);
  const [deliveryFeeQuote, setDeliveryFeeQuote] = useState<{ fee?: number; breakdown?: any } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'cashfree'>('cod');
  const [cashfreeClientId, setCashfreeClientId] = useState<string | null>(null);

  // Load payment configuration to decide which payment options to enable
  useEffect(() => {
    (async () => {
      try {
        const cfg = await getPaymentConfig();
        const cashfreeClientId = cfg?.cashfreeClientId || '';
        setCashfreeClientId(cashfreeClientId || null);
      } catch {
        setCashfreeClientId(null);
      }
    })();
  }, []);

  useEffect(() => {
    loadCartItems();
    // Load routeId from AsyncStorage
    const loadRouteId = async () => {
      const id = await AsyncStorage.getItem('currentRouteId');
      if (id) setRouteId(id);
    };
    loadRouteId();
    
    // Check authentication status
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert(
        'Authentication Required',
        'Please log in to access your cart and place orders.',
        [
          {
            text: 'Login',
            onPress: () => router.push('/(tabs)/profile')
          }
        ],
        { cancelable: false }
      );
    }
  };

  // Re-read selectedDeliveryPoint whenever the cart screen is focused
  useEffect(() => {
    const fetchSelectedDeliveryPoint = async () => {
      try {
        const dp = await AsyncStorage.getItem('selectedDeliveryPoint');
        if (dp) setSelectedDeliveryPoint(JSON.parse(dp));
        else setSelectedDeliveryPoint(null);
      } catch (e) {
        setSelectedDeliveryPoint(null);
      }
    };
    if (isFocused) {
      fetchSelectedDeliveryPoint();
    }
  }, [isFocused]);

  // Fetch user location and nearby delivery point suggestions when placing order
  useEffect(() => {
    if (!pendingOrder) return;
    let cancelled = false;

    const getDeliveryPointsCached = async () => {
      try {
        const cacheStr = await AsyncStorage.getItem('deliveryPointsCache');
        const now = Date.now();
        if (cacheStr) {
          const cache = JSON.parse(cacheStr);
          if (cache.expiresAt && cache.expiresAt > now && Array.isArray(cache.points)) {
            return cache.points as any[];
          }
        }
      } catch {}
      try {
        const fresh = await fetchDeliveryPoints();
        // cache for 10 minutes
        await AsyncStorage.setItem(
          'deliveryPointsCache',
          JSON.stringify({ points: fresh, expiresAt: Date.now() + 10 * 60 * 1000 })
        );
        return fresh as any[];
      } catch {
        return [] as any[];
      }
    };

    const getFastLocation = async () => {
      try {
        // Try last known first for instant UI
        const last = await Location.getLastKnownPositionAsync();
        if (last?.coords) {
          const { latitude, longitude } = last.coords;
          return { latitude, longitude, address: 'Current Location' };
        }
      } catch {}
      // Fallback to current (already balanced and timeout set in getUserCurrentLocation)
      return await getUserCurrentLocation();
    };

    (async () => {
      try {
        const [loc, points] = await Promise.all([getFastLocation(), getDeliveryPointsCached()]);
        if (cancelled) return;
        if (loc && !userLocation) setUserLocation(loc);
        if (loc && points && points.length) {
          const withDistance = points
            .map((p: any) => ({
              ...p,
              distance: haversineDistanceKm(
                { latitude: loc.latitude, longitude: loc.longitude },
                { latitude: p.latitude, longitude: p.longitude }
              )
            }))
            .filter((p: any) => Number.isFinite(p.distance));
          withDistance.sort((a: any, b: any) => a.distance - b.distance);
          setSuggestedDeliveryPoints(withDistance.slice(0, 3));
        } else {
          setSuggestedDeliveryPoints([]);
        }
      } catch {
        if (!cancelled) setSuggestedDeliveryPoints([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingOrder]);

  // Auto-quote delivery fee when user location and delivery point are available
  useEffect(() => {
    let cancelled = false;
    const doQuote = async () => {
      if (!pendingOrder) return;
      if (!userLocation || !selectedDeliveryPoint) return;
      try {
        setQuoting(true);
        const quote = await quoteDeliveryFee({
          userLocation: { latitude: userLocation.latitude, longitude: userLocation.longitude },
          selectedDeliveryPoint: { latitude: selectedDeliveryPoint.latitude, longitude: selectedDeliveryPoint.longitude },
          etaMinutes: 0,
        });
        if (!cancelled) setDeliveryFeeQuote({ fee: quote.deliveryFee, breakdown: quote.feeBreakdown });
      } catch {
        if (!cancelled) setDeliveryFeeQuote({ fee: undefined, breakdown: null });
      } finally {
        if (!cancelled) setQuoting(false);
      }
    };
    doQuote();
    return () => { cancelled = true; };
  }, [pendingOrder, userLocation, selectedDeliveryPoint]);

  function haversineDistanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const toRad = (n: number) => (n * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

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

  const persistCart = async (updated: CartItem[]) => {
    await AsyncStorage.setItem('cart', JSON.stringify(updated));
    setCartItems(updated);
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      await persistCart(updatedCart);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  const updateQuantity = async (itemId: string, delta: number) => {
    try {
      const updated = cartItems.map(ci => ci.id === itemId ? { ...ci, quantity: Math.max(1, (ci.quantity || 1) + delta) } : ci);
      await persistCart(updated);
    } catch {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const calculateMrpTotal = () => {
    return cartItems.reduce((total, item) => {
      const unit = parseFloat(item.price);
      const mrp = item.mrp ? parseFloat(item.mrp) : unit * 1.1;
      return total + mrp * item.quantity;
    }, 0);
  };

  const calculateSavings = () => {
    const mrp = calculateMrpTotal();
    const total = calculateTotal();
    return Math.max(0, mrp - total);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    // Always re-read selectedDeliveryPoint before opening modal
    try {
      const dp = await AsyncStorage.getItem('selectedDeliveryPoint');
      if (dp) setSelectedDeliveryPoint(JSON.parse(dp));
      else setSelectedDeliveryPoint(null);
    } catch (e) {
      setSelectedDeliveryPoint(null);
    }
    setPendingOrder(true);
  };

  const fetchSelectedCheckpoint = async (routeId: string) => {
    setLoadingCheckpoint(true);
    setCheckpointError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/routes/${routeId}/selected-checkpoint`, {
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
    // Check if user is authenticated
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert(
        'Authentication Required',
        'Please log in to place an order.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setVehicleModalVisible(false);
              setPendingOrder(false);
            }
          },
          {
            text: 'Login',
            onPress: () => {
              setVehicleModalVisible(false);
              setPendingOrder(false);
              router.push('/(tabs)/profile');
            }
          }
        ],
        { cancelable: false }
      );
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
    // RouteId is optional - users can place orders with just delivery points
    // if (!routeId) {
    //   Alert.alert(
    //     'Route Required',
    //     'Please select a route to proceed.',
    //     [
    //       {
    //         text: 'Go to Map',
    //         onPress: () => {
    //           setVehicleModalVisible(false);
    //           setPendingOrder(false);
    //           router.push('/map');
    //         }
    //       },
    //       {
    //         text: 'Cancel',
    //         style: 'cancel',
    //         onPress: () => {
    //           setVehicleModalVisible(false);
    //           setPendingOrder(false);
    //         }
    //       }
    //     ],
    //     { cancelable: false }
    //   );
    //   return;
    // }
    let deliveryPoint;
    try {
      // Always get the latest selected delivery point from AsyncStorage
      const dp = await AsyncStorage.getItem('selectedDeliveryPoint');
      if (!dp) throw new Error('No delivery point selected');
      const parsed = JSON.parse(dp);
      // Ensure all fields are present
      deliveryPoint = {
        id: parsed.id,
        name: parsed.name,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        address: parsed.address
      };
    } catch (e) {
      Alert.alert('Error', 'No delivery point selected for this destination.');
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
        // vehicle number is optional; include as-is (can be empty)
        vehicleNumber,
        userLocation: currentLocation, // Add user location to order data
        selectedDeliveryPoint: deliveryPoint // Add selected delivery point to order data
      };
      console.log('Order payload:', orderData);
      if (paymentMethod === 'cashfree' && !cashfreeClientId) {
        Alert.alert('UPI payment unavailable', 'Cashfree key not configured. Please select Cash on Delivery.');
        return;
      }
      const order = await createOrder({ ...orderData, payment: { method: paymentMethod } });
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
      setVehicleNumber('');
      // Navigate to appropriate order confirmation page based on payment method
      const confirmationPath = paymentMethod === 'cashfree' ? '/order-confirmation-cashfree' : '/order-confirmation';
      router.push({
        pathname: confirmationPath,
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

  const renderRightActions = (itemId: string) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => removeFromCart(itemId)}>
      <Ionicons name="trash" size={20} color="#fff" />
      <ThemedText style={styles.swipeDeleteText}>Delete</ThemedText>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: CartItem }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={styles.cartItem}>
        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
          <View style={styles.priceRow}>
            <ThemedText style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</ThemedText>
            <View style={styles.freeBadge}><ThemedText style={styles.freeBadgeText}>Free delivery</ThemedText></View>
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
              <Ionicons name="remove" size={18} color="#4CAF50" />
            </TouchableOpacity>
            <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
              <Ionicons name="add" size={18} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
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
        <View>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.cartList, { paddingBottom: 220 }]}
            ListFooterComponent={() => (
              <View style={{ paddingBottom: 8 }}>
                <View style={styles.couponRow}>
                  <Ionicons name="pricetags" size={18} color="#4CAF50" />
                  <TextInput placeholder="Apply coupon code" style={styles.couponInput} placeholderTextColor="#9CA3AF" />
                  <TouchableOpacity style={styles.couponBtn}><ThemedText style={styles.couponBtnText}>Apply</ThemedText></TouchableOpacity>
                </View>
                {/* Inline Confirm Location below items */}
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                  <ThemedText style={styles.cautionHeading}>Confirm Location</ThemedText>
                  {suggestedDeliveryPoints.length > 0 && (
                    <View style={{ width: '100%', marginBottom: 12 }}>
                      <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>Nearby Delivery Points</ThemedText>
                      {suggestedDeliveryPoints.slice(0, 3).map((p, idx) => {
                        const pointId = p.id || p._id;
                        const isSelected = selectedDeliveryPoint && (selectedDeliveryPoint.id === pointId);
                        return (
                          <TouchableOpacity
                            key={pointId || idx}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 10,
                              borderWidth: 2,
                              borderColor: isSelected ? '#4CAF50' : '#e5e7eb',
                              borderRadius: 10,
                              marginBottom: 8,
                              backgroundColor: isSelected ? '#e8f5e8' : '#fafafa'
                            }}
                            onPress={async () => {
                              const chosen = {
                                id: pointId,
                                name: p.name,
                                latitude: p.latitude,
                                longitude: p.longitude,
                                address: p.address
                              };
                              await AsyncStorage.setItem('selectedDeliveryPoint', JSON.stringify(chosen));
                              setSelectedDeliveryPoint(chosen as any);
                            }}
                          >
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <ThemedText style={{ fontWeight: '600' }}>{p.name}</ThemedText>
                              <ThemedText style={{ color: '#6b7280', fontSize: 12 }}>{p.address}</ThemedText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <ThemedText style={{ color: '#2e7d32', fontWeight: '700' }}>{p.distance.toFixed(1)} km</ThemedText>
                              {isSelected ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                  <ThemedText style={{ color: '#4CAF50', fontSize: 12, marginLeft: 4 }}>Selected</ThemedText>
                                </View>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      {!selectedDeliveryPoint && suggestedDeliveryPoints.length > 0 && (
                        <TouchableOpacity
                          style={{ backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                          onPress={async () => {
                            const nearest = suggestedDeliveryPoints[0];
                            if (!nearest) return;
                            const chosen = {
                              id: nearest.id || nearest._id,
                              name: nearest.name,
                              latitude: nearest.latitude,
                              longitude: nearest.longitude,
                              address: nearest.address
                            };
                            await AsyncStorage.setItem('selectedDeliveryPoint', JSON.stringify(chosen));
                            setSelectedDeliveryPoint(chosen as any);
                            try {
                              if (userLocation) {
                                setQuoting(true);
                                const quote = await quoteDeliveryFee({
                                  userLocation: { latitude: userLocation.latitude, longitude: userLocation.longitude },
                                  selectedDeliveryPoint: { latitude: chosen.latitude, longitude: chosen.longitude },
                                  etaMinutes: 0,
                                });
                                setDeliveryFeeQuote({ fee: quote.deliveryFee, breakdown: quote.feeBreakdown });
                              }
                            } catch {}
                            setQuoting(false);
                          }}
                        >
                          <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Use Nearest Point</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {userLocation && selectedDeliveryPoint && (
                    <View style={{ width: '100%', marginBottom: 8 }}>
                      <ThemedText style={{ fontWeight: '700' }}>
                        Delivery Fee: {typeof deliveryFeeQuote?.fee === 'number' ? `₹${deliveryFeeQuote.fee.toFixed(2)}` : (quoting ? 'Calculating…' : '—')}
                      </ThemedText>
                      {deliveryFeeQuote?.breakdown?.baseFare !== undefined && (
                        <ThemedText style={{ color: '#6b7280', fontSize: 12 }}>
                          Base ₹{deliveryFeeQuote.breakdown.baseFare}, Dist ~{Math.round(deliveryFeeQuote.breakdown.distanceMeters)}m, Surge {Math.round((deliveryFeeQuote.breakdown.surgePercent||0)*100)}%
                        </ThemedText>
                      )}
                    </View>
                  )}
                  <ThemedText style={styles.modalTitle}>Enter Your Vehicle Number</ThemedText>
                  {/* Payment method selector */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setPaymentMethod('cod')} 
                      style={{ 
                        paddingVertical: 8, 
                        paddingHorizontal: 12, 
                        borderRadius: 10, 
                        borderWidth: 1, 
                        borderColor: paymentMethod==='cod' ? '#4CAF50' : '#e5e7eb', 
                        backgroundColor: paymentMethod==='cod' ? '#e8f5e8' : '#fff' 
                      }}
                    >
                      <ThemedText>Cash on Delivery</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!cashfreeClientId) {
                          Alert.alert('UPI payment unavailable', 'Cashfree key not configured. Please choose Cash on Delivery.');
                          return;
                        }
                        setPaymentMethod('cashfree');
                      }}
                      style={{ 
                        paddingVertical: 8, 
                        paddingHorizontal: 12, 
                        borderRadius: 10, 
                        borderWidth: 1, 
                        borderColor: paymentMethod==='cashfree' ? '#4CAF50' : '#e5e7eb', 
                        backgroundColor: paymentMethod==='cashfree' ? '#e8f5e8' : (!cashfreeClientId ? '#f9fafb' : '#fff'), 
                        opacity: !cashfreeClientId ? 0.6 : 1 
                      }}
                    >
                      <ThemedText>UPI (Cashfree){!cashfreeClientId ? ' — coming soon' : ''}</ThemedText>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Vehicle Number"
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    autoCapitalize="characters"
                    maxLength={15}
                  />
                  <TouchableOpacity
                    style={[styles.confirmButton, !selectedDeliveryPoint && { opacity: 0.5 }]}
                    disabled={!selectedDeliveryPoint}
                    onPress={confirmVehicleNumberAndOrder}
                  >
                    <ThemedText style={styles.confirmButtonText}>Confirm & Place Order</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={styles.footerSticky}>
            <View style={styles.breakdownRow}><ThemedText style={styles.breakdownLabel}>MRP</ThemedText><ThemedText style={styles.breakdownValue}>₹{calculateMrpTotal().toFixed(2)}</ThemedText></View>
            <View style={styles.breakdownRow}><ThemedText style={styles.breakdownLabel}>Discount</ThemedText><ThemedText style={[styles.breakdownValue, { color: '#2e7d32' }]}>-₹{calculateSavings().toFixed(2)}</ThemedText></View>
            {/* Delivery Fee (separate) */}
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.breakdownLabel}>Delivery Fee</ThemedText>
              <ThemedText style={styles.breakdownValue}>
                {typeof deliveryFeeQuote?.fee === 'number' ? `₹${deliveryFeeQuote.fee.toFixed(2)}` : '—'}
              </ThemedText>
            </View>
            {/* Grand Total: subtotal + delivery fee when available */}
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>Grand Total</ThemedText>
              <ThemedText style={styles.totalAmount}>
                ₹{(
                  calculateTotal() + (typeof deliveryFeeQuote?.fee === 'number' ? deliveryFeeQuote.fee : 0)
                ).toFixed(2)}
              </ThemedText>
            </View>
            {/* Footer action removed to avoid duplicate with inline Confirm & Place Order */}
          </View>
        </View>
      )}
      {/* Removed old inline overlay confirm; using inline section above */}
      {false && (
        <View>
          <View>
            <ThemedText style={styles.cautionHeading}>Confirm Location</ThemedText>
            {userLocation && selectedDeliveryPoint && (
              <View style={{ width: '100%', marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '700' }}>
                  Delivery Fee: {typeof deliveryFeeQuote?.fee === 'number' ? `₹${deliveryFeeQuote.fee.toFixed(2)}` : (quoting ? 'Calculating…' : '—')}
                </ThemedText>
                {deliveryFeeQuote?.breakdown?.baseFare !== undefined && (
                  <ThemedText style={{ color: '#6b7280', fontSize: 12 }}>
                    Base ₹{deliveryFeeQuote.breakdown.baseFare}, Dist ~{Math.round(deliveryFeeQuote.breakdown.distanceMeters)}m, Surge {Math.round((deliveryFeeQuote.breakdown.surgePercent||0)*100)}%
                  </ThemedText>
                )}
              </View>
            )}
            {suggestedDeliveryPoints.length > 0 && (
              <View style={{ width: '100%', marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>Nearby Delivery Points</ThemedText>
                {suggestedDeliveryPoints.slice(0, 3).map((p, idx) => {
                  const pointId = p.id || p._id;
                  const isSelected = selectedDeliveryPoint && (selectedDeliveryPoint.id === pointId);
                  return (
                  <TouchableOpacity
                    key={pointId || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? '#4CAF50' : '#e5e7eb',
                      borderRadius: 10,
                      marginBottom: 8,
                      backgroundColor: isSelected ? '#e8f5e8' : '#fafafa'
                    }}
                    onPress={async () => {
                      const chosen = {
                        id: pointId,
                        name: p.name,
                        latitude: p.latitude,
                        longitude: p.longitude,
                        address: p.address
                      };
                      await AsyncStorage.setItem('selectedDeliveryPoint', JSON.stringify(chosen));
                      setSelectedDeliveryPoint(chosen as any);
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText style={{ fontWeight: '600' }}>{p.name}</ThemedText>
                      <ThemedText style={{ color: '#6b7280', fontSize: 12 }}>{p.address}</ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={{ color: '#2e7d32', fontWeight: '700' }}>{p.distance.toFixed(1)} km</ThemedText>
                      {isSelected ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <ThemedText style={{ color: '#4CAF50', fontSize: 12, marginLeft: 4 }}>Selected</ThemedText>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );})}
                {!selectedDeliveryPoint && suggestedDeliveryPoints.length > 0 && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                    onPress={async () => {
                      const nearest = suggestedDeliveryPoints[0];
                      if (!nearest) return;
                      const chosen = {
                        id: nearest.id || nearest._id,
                        name: nearest.name,
                        latitude: nearest.latitude,
                        longitude: nearest.longitude,
                        address: nearest.address
                      };
                      await AsyncStorage.setItem('selectedDeliveryPoint', JSON.stringify(chosen));
                      setSelectedDeliveryPoint(chosen as any);
                      // try quote
                      try {
                        if (userLocation) {
                          setQuoting(true);
                          const quote = await quoteDeliveryFee({
                            userLocation: { latitude: userLocation.latitude, longitude: userLocation.longitude },
                            selectedDeliveryPoint: { latitude: chosen.latitude, longitude: chosen.longitude },
                            etaMinutes: 0,
                          });
                          setDeliveryFeeQuote({ fee: quote.deliveryFee, breakdown: quote.feeBreakdown });
                        }
                      } catch {}
                      setQuoting(false);
                    }}
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Use Nearest Point</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
              style={[styles.confirmButton, !selectedDeliveryPoint && { opacity: 0.5 }]}
              disabled={!selectedDeliveryPoint}
              onPress={confirmVehicleNumberAndOrder}
            >
              <ThemedText style={styles.confirmButtonText}>Confirm & Place Order</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { setPendingOrder(false); }}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Removed legacy checkpoint overlays */}
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  itemImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12, backgroundColor: '#f5f5f5' },
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeBadge: { backgroundColor: '#e8f5e8', borderColor: '#4CAF50', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  freeBadgeText: { color: '#2e7d32', fontSize: 11, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyText: { width: 24, textAlign: 'center', fontWeight: '700', color: '#111' },
  itemActions: { justifyContent: 'space-between', alignItems: 'flex-end' },
  removeButton: {
    padding: 8,
  },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 6 },
  couponInput: { flex: 1, height: 42, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff', color: '#111' },
  couponBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  couponBtnText: { color: '#fff', fontWeight: '700' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  footerSticky: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', padding: 14 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  breakdownLabel: { color: '#6b7280' },
  breakdownValue: { color: '#111827', fontWeight: '600' },
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
  changeDeliveryButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  changeDeliveryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cautionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
}); 