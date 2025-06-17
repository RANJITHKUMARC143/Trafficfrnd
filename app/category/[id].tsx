import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';

export default function CategoryScreen() {
  const { id, name, locationId, locationType, locationName, allMenuItems } = useLocalSearchParams();
  const categoryName = Array.isArray(name) ? name[0] : name || 'Category';
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleItemPress = (item: MenuItem) => {
    router.push({
      pathname: `/item/${item._id}`,
      params: {
        itemId: item._id,
        itemName: item.name,
        itemDescription: item.description,
        itemPrice: item.price.toString(),
        itemImageUrl: item.image,
        category: item.category,
        locationId,
        locationType,
        locationName
      }
    });
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
              onPress={() => handleItemPress(item)}
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
}); 