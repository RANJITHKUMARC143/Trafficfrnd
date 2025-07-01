import { StyleSheet, View, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { menuService } from '@/services/menuService';
import { MenuItem } from '@/types/menu';
import LottieView from 'lottie-react-native';

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const [results, setResults] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    menuService.getAllMenuItems().then((items) => {
      const query = (q || '').toString().toLowerCase();
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
      setResults(filtered);
      setLoading(false);
    });
  }, [q]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <LottieView
          source={require('../assets/animations/car-delivery.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <ThemedText style={{ marginTop: 16, fontSize: 16, color: '#4CAF50' }}>Searching...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Search Results</ThemedText>
      <ThemedText style={styles.query}>Query: {q}</ThemedText>
      {results.length === 0 ? (
        <ThemedText style={styles.noResults}>No items found for your search.</ThemedText>
      ) : (
        <ScrollView style={styles.resultsList}>
          {results.map(item => (
            <TouchableOpacity
              key={item._id}
              style={styles.resultCard}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item._id } })}
            >
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.resultImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
              <View style={styles.resultInfo}>
                <ThemedText style={styles.resultName}>{item.name}</ThemedText>
                <ThemedText style={styles.resultPrice}>₹{item.price}</ThemedText>
                <ThemedText style={styles.resultDescription} numberOfLines={2}>{item.description}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  query: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  noResults: {
    fontSize: 16,
    color: '#999',
    marginTop: 40,
    textAlign: 'center',
  },
  resultsList: {
    marginTop: 10,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#eee',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
}); 