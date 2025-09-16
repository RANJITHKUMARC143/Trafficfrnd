import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/_components/ThemedText';

export default function DeliveryStatusScreen() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Delivery Status</ThemedText>
      <ThemedText style={styles.description}>Track your delivery in real-time</ThemedText>
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