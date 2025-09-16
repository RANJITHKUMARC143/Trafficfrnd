import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function ModeSelectionScreen() {
  useEffect(() => {
    checkPreviousMode();
  }, []);

  const checkPreviousMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('appMode');
      if (savedMode) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking previous mode:', error);
    }
  };

  const handleModeSelection = async (mode: 'travel' | 'home') => {
    try {
      await AsyncStorage.setItem('appMode', mode);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving mode:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <ThemedText style={styles.title}>Welcome to Traffic Frnd</ThemedText>
        <ThemedText style={styles.subtitle}>How would you like to use the app?</ThemedText>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleModeSelection('travel')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="airplane" size={40} color="white" />
            </View>
            <ThemedText style={styles.optionTitle}>Travel Mode</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Perfect for when you're traveling or exploring new areas
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleModeSelection('home')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#1a73e8' }]}>
              <Ionicons name="home" size={40} color="white" />
            </View>
            <ThemedText style={styles.optionTitle}>Home Mode</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Ideal for ordering products from your regular location
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  optionDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
}); 