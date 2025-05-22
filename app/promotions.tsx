import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function PromotionsScreen() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Current Promotions</ThemedText>
      <ThemedText style={styles.description}>Check out our latest offers!</ThemedText>
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
  description: {
    fontSize: 16,
    color: '#666',
  },
}); 