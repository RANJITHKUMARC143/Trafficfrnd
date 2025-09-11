import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 App Test Screen</Text>
      <Text style={styles.subtitle}>If you can see this, the app is working!</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/map-basic')}
        >
          <Text style={styles.buttonText}>Test Basic Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/map-simple-working')}
        >
          <Text style={styles.buttonText}>Test Simple Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/map')}
        >
          <Text style={styles.buttonText}>Test Main Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#28a745' }]}
          onPress={() => router.push('/map-force-render')}
        >
          <Text style={styles.buttonText}>Test Force Render Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#dc3545' }]}
          onPress={() => router.push('/map-guaranteed')}
        >
          <Text style={styles.buttonText}>🚀 GUARANTEED MAP</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.info}>
        This screen tests if the app is working properly.
        Try the different map options above.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
