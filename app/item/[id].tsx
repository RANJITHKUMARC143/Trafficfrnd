import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { menuService } from '@/services/menuService';
import { MenuItem } from '@/types/menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCarAnimation, setShowCarAnimation] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    menuService.getAllMenuItems()
      .then(items => {
        const found = items.find(i => i._id === id);
        if (!found) setError('Item not found');
        setItem(found || null);
      })
      .catch(() => setError('Failed to fetch item'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!item) return;
    try {
      const cartData = await AsyncStorage.getItem('cart');
      let cartItems = cartData ? JSON.parse(cartData) : [];
      const existingItemIndex = cartItems.findIndex((i: any) => i.id === item._id);
      if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += 1;
      } else {
        cartItems.push({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.image,
          vendorId: item.vendorId,
        });
      }
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      setShowCarAnimation(true);
      setTimeout(() => {
        setShowCarAnimation(false);
        Alert.alert('Success', 'Item added to cart', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/cart') },
        ]);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    setShowCarAnimation(false);
    router.push('/cart');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LottieView
          source={require('../../assets/animations/car-delivery.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <ThemedText style={{ marginTop: 16, fontSize: 16, color: '#4CAF50' }}>Loading item...</ThemedText>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.errorText}>{error || 'Item not found'}</ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{item?.name || ''}</ThemedText>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/300' }}
            style={styles.image}
          />
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <ThemedText style={styles.price}>₹{item.price}</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
          {item.preparationTime && (
            <View style={styles.prepTimeRow}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <ThemedText style={styles.prepTime}>{item.preparationTime} mins</ThemedText>
            </View>
          )}
          {!item.isAvailable && (
            <ThemedText style={styles.unavailableText}>Currently Unavailable</ThemedText>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addToCartButton, !item.isAvailable && { opacity: 0.5 }]}
              onPress={handleAddToCart}
              disabled={!item.isAvailable}
            >
              <Ionicons name="cart-outline" size={24} color="#fff" />
              <ThemedText style={styles.addToCartButtonText}>Add to Cart</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buyNowButton, !item.isAvailable && { opacity: 0.5 }]}
              onPress={handleBuyNow}
              disabled={!item.isAvailable}
            >
              <ThemedText style={styles.buyNowButtonText}>Buy Now</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {/* Car Delivery Animation Modal */}
        <Modal
          visible={showCarAnimation}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCarAnimation(false)}
        >
          <View style={styles.modalOverlay}>
            <LottieView
              source={require('../../assets/animations/car-delivery.json')}
              autoPlay
              loop={false}
              style={{ width: 300, height: 300 }}
            />
            <ThemedText style={{ color: '#fff', fontSize: 18, marginTop: 20 }}>Your order is on the way!</ThemedText>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, alignItems: 'center' },
  image: { width: 260, height: 200, borderRadius: 16, marginBottom: 18, backgroundColor: '#eee' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  price: { fontSize: 22, color: '#4CAF50', fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', marginBottom: 12, textAlign: 'center' },
  prepTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  prepTime: { fontSize: 14, color: '#666', marginLeft: 6 },
  unavailableText: { fontSize: 16, color: '#FF3B30', fontWeight: '500', marginBottom: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 16 },
  addToCartButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginRight: 8 },
  addToCartButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  buyNowButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9800', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  buyNowButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#FF3B30', fontSize: 18, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
}); 