import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ThemedText } from '@cmp/ThemedText';
import { menuService } from '@lib/services/menuService';
import { MenuItem } from '@lib/types/menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LottieView from '@cmp/LottieFallback';
import { LinearGradient } from 'expo-linear-gradient';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCarAnimation, setShowCarAnimation] = useState(false);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [comboItems, setComboItems] = useState<MenuItem[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    menuService.getAllMenuItems()
      .then(items => {
        setAllItems(items);
        const found = items.find(i => i._id === id);
        if (!found) setError('Item not found');
        setItem(found || null);
        if (found) {
          // Build recommendations: similar category and top rated
          const sameCategory = items
            .filter(m => m._id !== found._id && m.category === found.category)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 8);
          setRecommendedItems(sameCategory);

          // Build combos: different categories that complement (e.g., Drinks, Snacks, Sides)
          const preferred = ['Beverages', 'Drinks', 'Snacks', 'Appetizer', 'Dessert'];
          const combos = items
            .filter(m => m._id !== found._id && (preferred.includes(m.category) || m.category !== found.category))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6);
          setComboItems(combos);
        }
      })
      .catch(() => setError('Failed to fetch item'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!item) return;
    try {
      // Ensure user is authenticated at action time
      const liveToken = await AsyncStorage.getItem('token');
      if (!liveToken) {
        Alert.alert(
          'Authentication Required',
          'Please log in to add items to cart.',
          [
            { text: 'Go to Login', onPress: () => router.push('/(tabs)/profile') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
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
        <ThemedText style={{ marginTop: 16, fontSize: 16, color: '#3d7a00' }}>Loading item...</ThemedText>
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <LinearGradient colors={["#ffffff", "#f8fafb"]} style={styles.heroGradient}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                style={styles.image}
              />
              <View style={styles.badgesRow}>
                <View style={styles.badgePrimary}>
                  <Ionicons name="flame" size={14} color="#fff" />
                  <ThemedText style={styles.badgePrimaryText}>Hot Pick</ThemedText>
                </View>
                <View style={styles.badgeGhost}>
                  <Ionicons name="star" size={14} color="#FFC107" />
                  <ThemedText style={styles.badgeGhostText}>4.5</ThemedText>
                </View>
              </View>
            </LinearGradient>
          </View>
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <View style={styles.priceRow}>
            <ThemedText style={styles.price}>₹{item.price}</ThemedText>
            {item.mrp && item.mrp > item.price ? (
              <ThemedText style={styles.mrpText}>₹{item.mrp}</ThemedText>
            ) : null}
            <View style={styles.discountPill}><ThemedText style={styles.discountText}>{item.mrp && item.mrp > item.price ? `${Math.round(((item.mrp - item.price)/item.mrp)*100)}% OFF` : '15% OFF'}</ThemedText></View>
          </View>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
          <View style={styles.trafficTip}><Ionicons name="car" size={16} color="#3d7a00" /><ThemedText style={styles.trafficTipText}>Perfect snack for your jam</ThemedText></View>
          {item.preparationTime && (
            <View style={styles.prepTimeRow}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <ThemedText style={styles.prepTime}>{item.preparationTime} mins</ThemedText>
            </View>
          )}
          {!item.isAvailable && (
            <ThemedText style={styles.unavailableText}>Currently Unavailable</ThemedText>
          )}
          {/* Best Buy / Combo Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Best Buy Combos</ThemedText></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
              {comboItems.map((ci) => (
                <TouchableOpacity key={ci._id} style={styles.comboCard} activeOpacity={0.9} onPress={handleAddToCart}>
                  <Image source={{ uri: ci.image || 'https://via.placeholder.com/120' }} style={styles.comboImage} />
                  <View style={styles.comboInfo}>
                    <ThemedText style={styles.comboTitle} numberOfLines={1}>{ci.name}</ThemedText>
                    <ThemedText style={styles.comboPrice}>₹{ci.price}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>You may also like</ThemedText></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendedItems.map((ri) => (
                <TouchableOpacity key={ri._id} style={styles.recoCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/item/[id]', params: { id: ri._id } })}>
                  <Image source={{ uri: ri.image || 'https://via.placeholder.com/120' }} style={styles.recoImage} />
                  <ThemedText style={styles.recoName} numberOfLines={1}>{ri.name}</ThemedText>
                  <ThemedText style={styles.recoPrice}>₹{ri.price}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
        {/* Sticky Bottom Bar */}
        <View style={styles.stickyBar}>
          <View style={styles.qtyPill}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleAddToCart}><Ionicons name="remove" size={18} color="#3d7a00" /></TouchableOpacity>
            <ThemedText style={styles.qtyText}>1</ThemedText>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleAddToCart}><Ionicons name="add" size={18} color="#3d7a00" /></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.buyNowButton, !item.isAvailable && { opacity: 0.5 }]} onPress={handleBuyNow} disabled={!item.isAvailable}>
            <ThemedText style={styles.buyNowButtonText}>Buy Now</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addToCartButton, !item.isAvailable && { opacity: 0.5 }]} onPress={handleAddToCart} disabled={!item.isAvailable}>
            <Ionicons name="cart-outline" size={22} color="#fff" />
            <ThemedText style={styles.addToCartButtonText}>Add to Cart</ThemedText>
          </TouchableOpacity>
        </View>
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
  scrollContent: { padding: 16, paddingBottom: 180, flexGrow: 1 },
  heroCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  heroGradient: { padding: 16, alignItems: 'center' },
  image: { width: 300, height: 220, borderRadius: 16, backgroundColor: '#eee' },
  badgesRow: { flexDirection: 'row', gap: 8, position: 'absolute', top: 12, left: 12 },
  badgePrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3d7a00', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgePrimaryText: { color: '#fff', marginLeft: 4, fontWeight: '700', fontSize: 12 },
  badgeGhost: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  badgeGhostText: { color: '#222', marginLeft: 4, fontWeight: '600', fontSize: 12 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  price: { fontSize: 24, color: '#3d7a00', fontWeight: 'bold' },
  discountPill: { backgroundColor: '#e8f5e8', borderColor: '#3d7a00', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  discountText: { color: '#2e7d32', fontWeight: '700', fontSize: 12 },
  mrpText: { textDecorationLine: 'line-through', color: '#9CA3AF', fontSize: 14 },
  description: { fontSize: 16, color: '#666', marginBottom: 12, textAlign: 'center' },
  trafficTip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  trafficTipText: { color: '#3d7a00', fontWeight: '600' },
  prepTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  prepTime: { fontSize: 14, color: '#666', marginLeft: 6 },
  unavailableText: { fontSize: 16, color: '#FF3B30', fontWeight: '500', marginBottom: 10 },
  section: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  comboCard: { width: 180, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0', marginRight: 12, overflow: 'hidden' },
  comboImage: { width: 180, height: 110 },
  comboInfo: { padding: 10 },
  comboTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  comboPrice: { fontSize: 16, fontWeight: '700', color: '#3d7a00' },
  recoCard: { width: 120, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0', marginRight: 12, padding: 8 },
  recoImage: { width: 104, height: 80, borderRadius: 8, marginBottom: 6, backgroundColor: '#eee' },
  recoName: { fontSize: 12, fontWeight: '600', color: '#333' },
  recoPrice: { fontSize: 12, fontWeight: '700', color: '#3d7a00' },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6fef6' },
  qtyText: { width: 20, textAlign: 'center', fontWeight: '700', color: '#2e7d32' },
  addToCartButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3d7a00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  addToCartButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  buyNowButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9800', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  buyNowButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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