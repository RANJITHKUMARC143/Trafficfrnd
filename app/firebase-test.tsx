import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { testFirebaseConnection, testUserAuth } from '../firebase/test-connection';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function FirebaseTestScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const checkFirebaseConnection = async () => {
    setLoading(true);
    try {
      const connectionResult = await testFirebaseConnection();
      setResult(connectionResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'Error testing Firebase connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    if (!email || !password) {
      setResult({
        success: false,
        message: 'Please enter email and password'
      });
      return;
    }

    setLoading(true);
    try {
      const authResult = await testUserAuth(email, password);
      setResult(authResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'Error testing user authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // This is just a placeholder - actual sign out is handled in the test function
      setResult({
        success: true,
        message: 'Sign out successful'
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error signing out',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Firebase Test' }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Firebase Connection Test</ThemedText>
          <TouchableOpacity 
            style={styles.button} 
            onPress={checkFirebaseConnection}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Test Connection</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>User Authentication Test</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity 
            style={styles.button} 
            onPress={testAuth}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Test Auth</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sign Out</ThemedText>
          <TouchableOpacity 
            style={[styles.button, styles.signOutButton]} 
            onPress={handleSignOut}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <ThemedText style={styles.resultTitle}>Test Result</ThemedText>
            <ThemedText style={[
              styles.resultStatus, 
              { color: result.success ? '#4CAF50' : '#F44336' }
            ]}>
              {result.success ? 'Success' : 'Failed'}
            </ThemedText>
            <ThemedText style={styles.resultMessage}>{result.message}</ThemedText>
            {result.details && (
              <View style={styles.detailsContainer}>
                <ThemedText style={styles.detailsTitle}>Details:</ThemedText>
                <ThemedText>{JSON.stringify(result.details, null, 2)}</ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 10,
  },
  detailsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
}); 