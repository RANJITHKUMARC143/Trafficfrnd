import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, Share, Platform, Dimensions, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem } from '@/types/menu';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.4;

export default function CategoryScreen() {
  const { id, name, locationId, locationType, locationName, allMenuItems } = useLocalSearchParams();
  const categoryName = Array.isArray(name) ? name[0] : name || 'Category';
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [showCarAnimation, setShowCarAnimation] = useState(false);

  useEffect(() => {
    if (allMenuItems) {
      try {
        const parsedItems: MenuItem[] = JSON.parse(allMenuItems as string);
        const itemsForCategory = parsedItems.filter(item => item.category === categoryName);
        setFilteredItems(itemsForCategory);
        setLoading(false);
      } catch (e) {
        console.error("CategoryScreen: Error parsing menu items from params:", e);
        setError("Failed to load menu items. Invalid data.");
        setLoading(false);
      }
    } else {
      setError("No menu items provided for this category.");
      setLoading(false);
    }
  }, [allMenuItems, categoryName]);

  // Favorite logic
  const checkFavoriteStatus = async (itemId: string) => {
    setLoadingFavorite(true);
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favoritesArray = JSON.parse(favorites);
        setIsFavorite(favoritesArray.includes(itemId));
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      setIsFavorite(false);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const toggleFavorite = async (itemId: string) => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favoritesArray = favorites ? JSON.parse(favorites) : [];
      if (isFavorite) {
        favoritesArray = favoritesArray.filter((id: string) => id !== itemId);
      } else {
        favoritesArray.push(itemId);
      }
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
      setIsFavorite(!isFavorite);
    } catch (error) {}
  };

  const handleShare = async (item: MenuItem) => {
    try {
      await Share.share({
        message: `Check out ${item.name} on our app! Price: ₹${item.price}`,
        title: item.name,
      });
    } catch (error) {}
  };

  const handleAddToCart = async (item: MenuItem) => {
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

  // Open detail modal
  const openDetailModal = (item: MenuItem) => {
    setSelectedItem(item);
    checkFavoriteStatus(item._id);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <ThemedText style={styles.headerTitle}>{categoryName}</ThemedText>
        </TouchableOpacity>
      </View>
      
      {locationId && locationName && (
        <View style={styles.locationBanner}>
          <Ionicons
            name={locationType === 'traffic' ? 'alert-circle' : locationType === 'busstop' ? 'bus-outline' : 'stop-circle-outline'}
            size={24}
            color="#4CAF50"
          />
          <ThemedText style={styles.locationName}>{locationName}</ThemedText>
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No items found in this category</ThemedText>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.itemCard}
              onPress={() => openDetailModal(item)}
            >
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.itemImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                <View style={styles.itemFooter}>
                  <ThemedText style={styles.itemPrice}>₹{item.price}</ThemedText>
                  {!item.isAvailable && (
                    <ThemedText style={styles.unavailableText}>Currently Unavailable</ThemedText>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {/* Detail Modal */}
      <Modal
        visible={showDetailModal && !!selectedItem}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedItem.image || 'https://via.placeholder.com/150' }}
                  style={styles.detailImage}
                  defaultSource={{ uri: 'https://via.placeholder.com/150' }}
                />
                <View style={styles.detailHeader}>
                  <ThemedText style={styles.detailTitle}>{selectedItem.name}</ThemedText>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(selectedItem._id)}
                    disabled={loadingFavorite}
                  >
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={28}
                      color={isFavorite ? '#FF3B30' : '#666'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShare(selectedItem)}
                  >
                    <Ionicons name="share-outline" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.detailPrice}>₹{selectedItem.price}</ThemedText>
                <ThemedText style={styles.detailDescription}>{selectedItem.description}</ThemedText>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(selectedItem)}
                  >
                    <Ionicons name="cart-outline" size={24} color="#fff" />
                    <ThemedText style={styles.addToCartButtonText}>Add to Cart</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buyNowButton}
                    onPress={() => {
                      handleAddToCart(selectedItem);
                      setShowDetailModal(false);
                      router.push('/cart');
                    }}
                  >
                    <ThemedText style={styles.buyNowButtonText}>Buy Now</ThemedText>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      {/* Car Delivery Animation Modal */}
      <Modal
        visible={showCarAnimation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCarAnimation(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f6f0',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  locationName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  unavailableText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: width * 0.9,
    height: height * 0.9,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
    resizeMode: 'cover',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 16,
  },
  favoriteButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  buyNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    top: 16,
    right: 16,
  },
}); 