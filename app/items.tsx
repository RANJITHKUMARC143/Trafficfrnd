import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';

type Item = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | React.FC<{ width: number; height: number }>;
  category: string;
};

const categoryItems: Record<string, Item[]> = {
  'snacks': [
    {
      id: '1',
      name: 'Lays Classic Salted',
      description: 'Original salted potato chips, crispy and fresh',
      price: '20',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '2',
      name: 'Masala Lays',
      description: 'Spicy masala flavored chips',
      price: '20',
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '3',
      name: 'Cream & Onion Lays',
      description: 'Creamy onion flavored chips',
      price: '20',
      imageUrl: 'https://images.unsplash.com/photo-1573481078935-b9605167e06b?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '4',
      name: 'Parle-G Biscuits',
      description: 'Classic glucose biscuits',
      price: '10',
      imageUrl: 'https://images.unsplash.com/photo-1590080876257-a35ea3b507ae?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '5',
      name: 'Good Day Cookies',
      description: 'Butter cookies with rich taste',
      price: '30',
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '6',
      name: 'Hide & Seek',
      description: 'Chocolate chip cookies',
      price: '30',
      imageUrl: 'https://images.unsplash.com/photo-1589302339671-e72596c8e7d4?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '7',
      name: 'Roasted Moong Dal',
      description: 'Crunchy and healthy moong dal',
      price: '40',
      imageUrl: 'https://images.unsplash.com/photo-1612257999691-cf0f8dbdb39f?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '8',
      name: 'Masala Moong Dal',
      description: 'Spicy masala roasted moong dal',
      price: '45',
      imageUrl: 'https://images.unsplash.com/photo-1612258013854-f0f4da870f05?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '9',
      name: 'Kurkure',
      description: 'Crunchy masala snack',
      price: '20',
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '10',
      name: 'Marie Gold',
      description: 'Light and crispy tea biscuits',
      price: '20',
      imageUrl: 'https://images.unsplash.com/photo-1587942108475-f7ce55bc3f42?w=500&auto=format',
      category: 'Snacks'
    },
    {
      id: '11',
      name: 'Mixed Snacks Pack',
      description: 'Assorted pack of chips, namkeen, and biscuits',
      price: '199',
      imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686f12c84a?w=500&auto=format',
      category: 'Snacks'
    }
  ],
  'cool-drinks': [
    {
      id: '1',
      name: 'Soft Drinks Pack',
      description: 'Assorted carbonated beverages',
      price: '299',
      imageUrl: 'https://images.unsplash.com/photo-1527960471264-932f39eb0614?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '2',
      name: 'Fruit Juice Pack',
      description: 'Natural fruit juice collection',
      price: '399',
      imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '3',
      name: 'Energy Drinks',
      description: 'Sports and energy drinks pack',
      price: '249',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66592cca56?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '4',
      name: 'Iced Tea Collection',
      description: 'Assorted flavored iced teas',
      price: '199',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '13',
      name: 'Chocolate Milkshake',
      description: 'Rich and creamy chocolate shake - 300ml',
      price: '70',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '14',
      name: 'Strawberry Milkshake',
      description: 'Fresh strawberry milkshake - 300ml',
      price: '70',
      imageUrl: 'https://images.unsplash.com/photo-1586917049334-0c466f2817ff?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '15',
      name: 'Vanilla Milkshake',
      description: 'Classic vanilla shake with cream - 300ml',
      price: '65',
      imageUrl: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&auto=format',
      category: 'Cool Drinks'
    },
    {
      id: '16',
      name: 'Oreo Milkshake',
      description: 'Creamy shake with crushed Oreos - 300ml',
      price: '80',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format',
      category: 'Cool Drinks'
    }
  ],
  'pharmacy': [
    {
      id: '1',
      name: 'First Aid Kit',
      description: 'Complete emergency medical supplies kit',
      price: '599',
      imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '2',
      name: 'Dettol Antiseptic',
      description: 'Liquid antiseptic and disinfectant - 550ml',
      price: '130',
      imageUrl: 'https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '3',
      name: 'Vicks Vaporub',
      description: 'Topical cough suppressant - 50ml',
      price: '85',
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '4',
      name: 'Bandage Roll',
      description: 'Elastic bandage roll - Pack of 3',
      price: '120',
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '5',
      name: 'Digital Thermometer',
      description: 'Quick reading digital thermometer',
      price: '250',
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '6',
      name: 'Paracetamol',
      description: 'Fever & pain relief tablets - Strip of 15',
      price: '35',
      imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '7',
      name: 'Hand Sanitizer',
      description: 'Alcohol-based hand sanitizer - 500ml',
      price: '150',
      imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '8',
      name: 'Face Masks',
      description: 'Disposable 3-ply masks - Pack of 50',
      price: '299',
      imageUrl: 'https://images.unsplash.com/photo-1586942593562-944a68aef00f?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '9',
      name: 'Cotton Rolls',
      description: 'Absorbent cotton rolls - 100g',
      price: '80',
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format',
      category: 'Pharmacy'
    },
    {
      id: '10',
      name: 'Vitamin C Tablets',
      description: 'Immunity booster - 60 tablets',
      price: '220',
      imageUrl: 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=500&auto=format',
      category: 'Pharmacy'
    }
  ],
  'electronics': [
    {
      id: '1',
      name: 'Wireless Earbuds',
      description: 'Bluetooth 5.0 with charging case',
      price: '2499',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '2',
      name: 'Power Bank',
      description: '10000mAh fast charging',
      price: '1299',
      imageUrl: 'https://images.unsplash.com/photo-1609592786331-b7f6f1cc2083?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '3',
      name: 'USB-C Cable',
      description: 'Fast charging cable - 1.5m',
      price: '299',
      imageUrl: 'https://images.unsplash.com/photo-1612487439139-c2963a991d23?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '4',
      name: 'Phone Stand',
      description: 'Adjustable desk phone holder',
      price: '399',
      imageUrl: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '5',
      name: 'Wireless Charger',
      description: '15W Qi fast wireless charging pad',
      price: '899',
      imageUrl: 'https://images.unsplash.com/photo-1622763853951-ded5a33cb724?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '6',
      name: 'Phone Case',
      description: 'Shockproof protective case',
      price: '599',
      imageUrl: 'https://images.unsplash.com/photo-1541877590-a229a2c77d1d?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '7',
      name: 'Screen Protector',
      description: 'Tempered glass - Pack of 2',
      price: '399',
      imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '8',
      name: 'Bluetooth Speaker',
      description: 'Portable wireless speaker',
      price: '1499',
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '9',
      name: 'Car Charger',
      description: 'Dual USB port car charger',
      price: '499',
      imageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format',
      category: 'Electronics'
    },
    {
      id: '10',
      name: 'Selfie Ring Light',
      description: 'LED ring light with phone holder',
      price: '799',
      imageUrl: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&auto=format',
      category: 'Electronics'
    }
  ]
};

export default function ItemsScreen() {
  const params = useLocalSearchParams();
  const { locationId, locationType, locationName, category } = params;

  // Get items based on category
  const getCategoryKey = (cat: string | string[] | undefined): string => {
    if (!cat) return 'snacks';
    const catStr = Array.isArray(cat) ? cat[0] : cat;
    switch (catStr.toLowerCase()) {
      case '1':
      case 'snacks': return 'snacks';
      case '2':
      case 'cool drinks': return 'cool-drinks';
      case '3':
      case 'pharmacy': return 'pharmacy';
      case '4':
      case 'electronics': return 'electronics';
      default: return 'snacks';
    }
  };

  const items = categoryItems[getCategoryKey(category)] || categoryItems['snacks'];

  const handleItemSelect = (item: Item) => {
    router.push({
      pathname: `/item/${item.id}`,
      params: {
        itemId: item.id,
        itemName: item.name,
        itemDescription: item.description,
        itemPrice: item.price,
        itemImageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : item.imageUrl.toString(),
        category: item.category
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <ThemedText style={styles.headerTitle}>Select Item</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.locationInfo}>
          <Ionicons
            name={locationType === 'traffic' ? 'alert-circle' : locationType === 'busstop' ? 'bus-outline' : 'stop-circle-outline'}
            size={24}
            color="#4CAF50"
          />
          <ThemedText style={styles.locationName}>{locationName}</ThemedText>
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => handleItemSelect(item)}
          >
            <Image
              source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
              style={styles.itemImage}
              defaultSource={{ uri: 'https://via.placeholder.com/150' }}
            />
            <View style={styles.itemInfo}>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <ThemedText style={styles.itemDescription}>
                {item.description}
              </ThemedText>
              <ThemedText style={styles.itemPrice}>₹{item.price}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    margin: 15,
    borderRadius: 12,
  },
  locationName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 15,
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
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
}); 