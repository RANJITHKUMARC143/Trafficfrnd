import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ItemSize = 'Small' | 'Regular' | 'Large';
type ItemWeight = '250g' | '500g' | '1kg' | '2kg' | '5kg';

const ItemScreen = () => {
  const params = useLocalSearchParams();
  const { 
    itemId, 
    itemName, 
    itemDescription, 
    itemPrice, 
    itemImageUrl,
    category 
  } = params;

  const [selectedSize, setSelectedSize] = useState<ItemSize>('Regular');
  const [selectedWeight, setSelectedWeight] = useState<ItemWeight>('500g');
  const [quantity, setQuantity] = useState(1);

  // Get category-specific details
  const getDrinkSizes = () => {
    const sizes: { size: ItemSize; price: number }[] = [
      { size: 'Small', price: parseInt(itemPrice as string) - 10 }, // 250ml
      { size: 'Regular', price: parseInt(itemPrice as string) },    // 500ml
      { size: 'Large', price: parseInt(itemPrice as string) + 20 }  // 750ml
    ];
    return sizes;
  };

  const getSnackSizes = () => {
    const sizes: { size: ItemWeight; price: number }[] = [
      { size: '250g', price: parseInt(itemPrice as string) - 10 },
      { size: '500g', price: parseInt(itemPrice as string) },
      { size: '1kg', price: parseInt(itemPrice as string) * 1.8 }
    ];
    return sizes;
  };

  const handleAddToCart = async () => {
    try {
      const item = {
        id: itemId,
        name: itemName,
        price: calculatePrice().toString(),
        quantity: quantity,
        size: category === 'Cool Drinks' ? selectedSize : selectedWeight,
        imageUrl: itemImageUrl,
      };

      // Get existing cart items
      const existingCart = await AsyncStorage.getItem('cart');
      let cartItems = existingCart ? JSON.parse(existingCart) : [];
      
      // Add new item
      cartItems.push(item);
      
      // Save updated cart
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      
      Alert.alert(
        'Success',
        'Item added to cart',
        [
          {
            text: 'Continue Shopping',
            onPress: () => router.back(),
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

  const adjustQuantity = (increment: boolean) => {
    setQuantity(prev => increment ? prev + 1 : Math.max(1, prev - 1));
  };

  const calculatePrice = () => {
    let basePrice = parseInt(itemPrice as string);
    if (category === 'Cool Drinks') {
      const sizePrice = getDrinkSizes().find(s => s.size === selectedSize)?.price || basePrice;
      return sizePrice * quantity;
    } else if (category === 'Snacks') {
      const weightPrice = getSnackSizes().find(w => w.size === selectedWeight)?.price || basePrice;
      return weightPrice * quantity;
    }
    return basePrice * quantity;
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{category}</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        {/* Image */}
        <Image
          source={{ uri: itemImageUrl as string }}
          style={styles.image}
          defaultSource={{ uri: 'https://via.placeholder.com/400' }}
        />

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.name}>{itemName}</ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <ThemedText style={styles.rating}>4.5</ThemedText>
            <ThemedText style={styles.ratingCount}>(128 ratings)</ThemedText>
          </View>
          <ThemedText style={styles.description}>{itemDescription}</ThemedText>

          {/* Category Specific Options */}
          {category === 'Cool Drinks' && (
            <View style={styles.optionsContainer}>
              <ThemedText style={styles.optionTitle}>Select Size</ThemedText>
              <View style={styles.optionsGrid}>
                {getDrinkSizes().map((sizeOption) => (
                  <TouchableOpacity
                    key={sizeOption.size}
                    style={[
                      styles.optionButton,
                      selectedSize === sizeOption.size && styles.optionButtonSelected
                    ]}
                    onPress={() => setSelectedSize(sizeOption.size)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      selectedSize === sizeOption.size && styles.optionTextSelected
                    ]}>
                      {sizeOption.size}
                    </ThemedText>
                    <ThemedText style={[
                      styles.optionPrice,
                      selectedSize === sizeOption.size && styles.optionTextSelected
                    ]}>
                      ₹{sizeOption.price}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {category === 'Snacks' && (
            <View style={styles.optionsContainer}>
              <ThemedText style={styles.optionTitle}>Select Pack Size</ThemedText>
              <View style={styles.optionsGrid}>
                {getSnackSizes().map((sizeOption) => (
                  <TouchableOpacity
                    key={sizeOption.size}
                    style={[
                      styles.optionButton,
                      selectedWeight === sizeOption.size && styles.optionButtonSelected
                    ]}
                    onPress={() => setSelectedWeight(sizeOption.size)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      selectedWeight === sizeOption.size && styles.optionTextSelected
                    ]}>
                      {sizeOption.size}
                    </ThemedText>
                    <ThemedText style={[
                      styles.optionPrice,
                      selectedWeight === sizeOption.size && styles.optionTextSelected
                    ]}>
                      ₹{sizeOption.price}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <ThemedText style={styles.optionTitle}>Quantity</ThemedText>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => adjustQuantity(false)}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </TouchableOpacity>
              <ThemedText style={styles.quantity}>{quantity}</ThemedText>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => adjustQuantity(true)}
              >
                <Ionicons name="add" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <ThemedText style={styles.priceLabel}>Total Price</ThemedText>
          <ThemedText style={styles.price}>₹{calculatePrice()}</ThemedText>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <ThemedText style={styles.addButtonText}>Add to Cart</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  image: {
    width: Dimensions.get('window').width,
    height: 300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 5,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

export default ItemScreen; 