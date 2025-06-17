import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { ThemedText, ThemedView } from '@/components';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem } from '@/types/menu';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const IMAGE_HEIGHT = height * 0.4;

const SkeletonLoader = () => {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
          style={styles.headerGradient}
        >
          <View style={[styles.backButton, { backgroundColor: '#f0f0f0' }]} />
          <View style={[styles.shareButton, { backgroundColor: '#f0f0f0' }]} />
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          <View style={[styles.image, { backgroundColor: '#f0f0f0' }]} />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.titleContainer}>
            <View style={[styles.skeletonTitle, { backgroundColor: '#f0f0f0' }]} />
            <View style={[styles.skeletonFavorite, { backgroundColor: '#f0f0f0' }]} />
          </View>

          <View style={styles.priceContainer}>
            <View style={[styles.skeletonPrice, { backgroundColor: '#f0f0f0' }]} />
            <View style={[styles.skeletonPrepTime, { backgroundColor: '#f0f0f0' }]} />
          </View>

          <View style={styles.categoryContainer}>
            <View style={[styles.skeletonCategory, { backgroundColor: '#f0f0f0' }]} />
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionTitle} />
          <View style={[styles.skeletonDescription, { backgroundColor: '#f0f0f0' }]} />
          <View style={[styles.skeletonDescription, { backgroundColor: '#f0f0f0', width: '80%' }]} />

          <View style={styles.actionButtons}>
            <View style={[styles.skeletonButton, { backgroundColor: '#f0f0f0' }]} />
            <View style={[styles.skeletonButton, { backgroundColor: '#f0f0f0' }]} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const ItemScreen = () => {
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = new Animated.Value(0);
  const imageScale = new Animated.Value(1);

  const {
    itemId,
    itemName,
    itemDescription,
    itemPrice,
    itemImageUrl,
    category,
    preparationTime,
  } = params;

  useEffect(() => {
    checkFavoriteStatus();
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [itemId]);

  const checkFavoriteStatus = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favoritesArray = JSON.parse(favorites);
        setIsFavorite(favoritesArray.includes(itemId));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
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
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${itemName} on our app! Price: ₹${itemPrice}`,
        title: itemName as string,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      // Get existing cart items
      const cartData = await AsyncStorage.getItem('cart');
      let cartItems = cartData ? JSON.parse(cartData) : [];

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex((item: any) => item.id === itemId);

      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        cartItems[existingItemIndex].quantity += 1;
      } else {
        // Add new item to cart
        cartItems.push({
          id: itemId,
          name: itemName,
          price: itemPrice,
          quantity: 1,
          imageUrl: itemImageUrl,
        });
      }

      // Save updated cart
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));

      // Show success message
      Alert.alert(
        'Success',
        'Item added to cart',
        [
          {
            text: 'Continue Shopping',
            style: 'cancel',
          },
          {
            text: 'View Cart',
            onPress: () => router.push('/cart'),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-height, 0, height],
    outputRange: [height / 2, 0, -height / 2],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={[
          styles.imageContainer,
          {
            transform: [
              { translateY: imageTranslateY },
              { scale: imageScale }
            ]
          }
        ]}>
          <Image
            source={{ uri: Array.isArray(itemImageUrl) ? itemImageUrl[0] : itemImageUrl || '' }}
            style={styles.image}
            defaultSource={{ uri: 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
        </Animated.View>

        <View style={styles.detailsContainer}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>{itemName}</ThemedText>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#FF3B30' : '#666'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.priceContainer}>
            <ThemedText style={styles.price}>₹{itemPrice}</ThemedText>
            {preparationTime && (
              <View style={styles.prepTimeContainer}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <ThemedText style={styles.prepTime}>{preparationTime} mins</ThemedText>
              </View>
            )}
          </View>

          {category && (
            <View style={styles.categoryContainer}>
              <Ionicons name="restaurant-outline" size={18} color="#666" />
              <ThemedText style={styles.category}>{category}</ThemedText>
            </View>
          )}

          <View style={styles.divider} />

          <ThemedText style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText style={styles.description}>{itemDescription}</ThemedText>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={24} color="#fff" />
              <ThemedText style={styles.addToCartButtonText}>Add to Cart</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyNowButton}
              onPress={() => {
                handleAddToCart();
                router.push('/cart');
              }}
            >
              <ThemedText style={styles.buyNowButtonText}>Buy Now</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
};

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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 100,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    width: width,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  favoriteButton: {
    padding: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 15,
  },
  prepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prepTime: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  category: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyNowButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonTitle: {
    height: 32,
    width: '80%',
    borderRadius: 8,
  },
  skeletonFavorite: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  skeletonPrice: {
    height: 28,
    width: 100,
    borderRadius: 8,
  },
  skeletonPrepTime: {
    height: 24,
    width: 80,
    borderRadius: 12,
    marginLeft: 15,
  },
  skeletonCategory: {
    height: 20,
    width: 120,
    borderRadius: 10,
  },
  skeletonDescription: {
    height: 16,
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    marginRight: 10,
  },
});

export default ItemScreen; 