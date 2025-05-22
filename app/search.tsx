import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const { q } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Search Results</ThemedText>
      <ThemedText style={styles.query}>Query: {q}</ThemedText>
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
  },
}); 