import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Animated } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { MenuItem } from '@/types/menu';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!item.isAvailable) return;

    router.push({
      pathname: `/item/${item._id}`,
      params: {
        itemId: item._id,
        itemName: item.name,
        itemDescription: item.description,
        itemPrice: item.price.toString(),
        itemImageUrl: item.image,
        category: item.category,
        preparationTime: item.preparationTime.toString(),
        vendorId: item.vendorId
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[
          styles.card,
          !item.isAvailable && styles.unavailable
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!item.isAvailable}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          defaultSource={{ uri: 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image' }}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            <ThemedText style={styles.price}>₹{item.price.toFixed(2)}</ThemedText>
          </View>
          <ThemedText style={styles.description} numberOfLines={2}>
            {item.description}
          </ThemedText>
          <View style={styles.footer}>
            {item.preparationTime && (
              <View style={styles.prepTimeContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <ThemedText style={styles.prepTime}>{item.preparationTime} mins</ThemedText>
              </View>
            )}
            {!item.isAvailable && (
              <ThemedText style={styles.unavailableText}>
                Currently Unavailable
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prepTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  unavailable: {
    opacity: 0.7,
  },
  unavailableText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
}); 