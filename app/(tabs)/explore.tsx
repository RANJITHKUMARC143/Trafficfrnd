import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: number;
};

type PopularItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  rating: number;
};

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const params = useLocalSearchParams();
  const { locationId, locationType, locationName } = params;

  const categories: Category[] = [
    {
      id: '1',
      name: 'Snacks',
      icon: 'cafe',
      items: 45
    },
    {
      id: '2',
      name: 'Cool Drinks',
      icon: 'beer',
      items: 12
    },
    {
      id: '3',
      name: 'Pharmacy',
      icon: 'medical',
      items: 89
    },
    {
      id: '4',
      name: 'Electronics',
      icon: 'phone-portrait',
      items: 67
    }
  ];

  const popularItems: PopularItem[] = [
    {
      id: '1',
      name: 'First Aid Kit',
      description: 'Complete emergency medical supplies kit',
      price: '599',
      imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format',
      rating: 4.9
    },
    {
      id: '2',
      name: 'Wireless Earbuds',
      description: 'Bluetooth 5.0 with charging case',
      price: '2499',
      imageUrl: 'https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?w=500&auto=format',
      rating: 4.8
    },
    {
      id: '3',
      name: 'Dettol Antiseptic',
      description: 'Liquid antiseptic and disinfectant - 550ml',
      price: '130',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format',
      rating: 4.7
    },
    {
      id: '4',
      name: 'Power Bank',
      description: '10000mAh fast charging',
      price: '1299',
      imageUrl: 'https://images.unsplash.com/photo-1609592786331-b7f6f1cc2083?w=500&auto=format',
      rating: 4.6
    }
  ];

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/category/[id]',
      params: { 
        id: category.id.toString(),
        name: category.name,
        locationId,
        locationType,
        locationName
      }
    });
  };

  const handleItemPress = (item: PopularItem) => {
    router.push({
      pathname: '/items',
      params: { featured: item.id }
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { query: searchQuery }
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
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
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={28} color="#4CAF50" />
                </View>
                <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                <ThemedText style={styles.categoryItems}>{category.items} items</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Popular Items</ThemedText>
          {popularItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleItemPress(item)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
                <View style={styles.itemFooter}>
                  <ThemedText style={styles.itemPrice}>₹{item.price}</ThemedText>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryItems: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA000',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  locationName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
