import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '@/components';

export default function AlertsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Alerts</ThemedText>
      <ThemedText style={styles.description}>Traffic alerts will appear here...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 