import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, RefreshControl, Alert as RNAlert, Text, Modal } from 'react-native';
import { ThemedText, ThemedView } from '../components';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { fetchAlerts, deleteAlert, clearAllAlerts, markAlertRead } from '../services/alertService';
import { Audio } from 'expo-av';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';

const alertTypeIcon = (type: string) => {
  switch (type) {
    case 'traffic': return <Ionicons name="car-sport-outline" size={28} color="#FF9800" style={{ marginRight: 12 }} />;
    case 'delivery': return <Ionicons name="cube-outline" size={28} color="#4CAF50" style={{ marginRight: 12 }} />;
    case 'system': return <Ionicons name="alert-circle-outline" size={28} color="#2196F3" style={{ marginRight: 12 }} />;
    default: return <Ionicons name="notifications-outline" size={28} color="#888" style={{ marginRight: 12 }} />;
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const previousAlertCount = useRef(0);
  const lastFetchTime = useRef(0);
  const isRefreshing = useRef(false);

  const loadAlerts = useCallback(async (isAutoRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (isRefreshing.current) {
      console.log('Alert fetch already in progress, skipping...');
      return;
    }

    // For auto-refresh, only fetch if enough time has passed
    if (isAutoRefresh && Date.now() - lastFetchTime.current < 5000) {
      console.log('Auto-refresh skipped - too soon since last fetch');
      return;
    }

    isRefreshing.current = true;
    setRefreshing(true);
    
    try {
      const data = await fetchAlerts();
      
      // Deduplicate alerts by ID to prevent duplicates
      const uniqueAlerts = data.reduce((acc: any[], alert: any) => {
        const existingIndex = acc.findIndex(existing => existing._id === alert._id);
        if (existingIndex === -1) {
          acc.push(alert);
        } else {
          // Update existing alert if it's newer
          if (new Date(alert.updatedAt || alert.createdAt) > new Date(acc[existingIndex].updatedAt || acc[existingIndex].createdAt)) {
            acc[existingIndex] = alert;
          }
        }
        return acc;
      }, []);

      // Map backend fields to UI fields and sort by creation time
      const mappedAlerts = uniqueAlerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(alert => ({
          id: alert._id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          timestamp: new Date(alert.createdAt).getTime(),
          read: alert.read,
        }));

      setAlerts(mappedAlerts);
      setAuthError(false); // Reset auth error on successful load
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      
      // Handle authentication errors gracefully
      if (error instanceof Error && error.message.includes('Authentication')) {
        setAuthError(true);
        if (!isAutoRefresh) {
          setShowAuthModal(true);
        }
        // Set empty alerts for auth errors
        setAlerts([]);
      } else {
        setAuthError(false);
        if (!isAutoRefresh) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts';
          RNAlert.alert('Error', errorMessage);
        }
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAlerts();
  }, []);

  // Auto-refresh alerts every 15 seconds (increased from 10 to reduce frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Play sound only for new alerts (not on refresh)
  useEffect(() => {
    if (alerts.length > previousAlertCount.current && previousAlertCount.current > 0) {
      playAlertSound();
    }
    previousAlertCount.current = alerts.length;
  }, [alerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRefreshing.current = false;
    };
  }, []);

  const playAlertSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/alert.mp3')
      );
      await sound.playAsync();
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const handleClearAll = async () => {
    RNAlert.alert('Clear All?', 'Are you sure you want to clear all alerts?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => {
        try {
          await clearAllAlerts(alerts);
          setAlerts([]);
          previousAlertCount.current = 0; // Reset counter
        } catch (error) {
          console.error('Error clearing alerts:', error);
          RNAlert.alert('Error', 'Failed to clear alerts.');
        }
      } },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      previousAlertCount.current = alerts.length - 1; // Update counter
    } catch (error) {
      console.error('Error deleting alert:', error);
      RNAlert.alert('Error', 'Failed to delete alert.');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, read: true } : alert));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      RNAlert.alert('Error', 'Failed to mark alert as read.');
    }
  };

  const handleRefresh = () => {
    loadAlerts();
  };

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable
      renderRightActions={() => (
        <View style={{ justifyContent: 'center', alignItems: 'center', width: 80, backgroundColor: '#FF5252', borderRadius: 14, marginVertical: 7 }}>
          <Ionicons name="trash" size={28} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
        </View>
      )}
      rightThreshold={80}
      onSwipeableRightOpen={() => handleDelete(item.id)}
    >
      <View style={[styles.alertCard, !item.read && styles.unreadCard]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {alertTypeIcon(item.type)}
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.alertTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.alertMessage}>{item.message}</ThemedText>
            <View style={styles.alertFooter}>
              <ThemedText style={styles.alertType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</ThemedText>
              <ThemedText style={styles.alertTime}>{formatTime(item.timestamp)}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>Alerts</ThemedText>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
            <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={styles.loadingState}>
          <Ionicons name="hourglass-outline" size={48} color="#4CAF50" style={{ marginBottom: 10 }} />
          <ThemedText style={styles.loadingText}>Loading alerts...</ThemedText>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyState}>
          {authError ? (
            <>
              <Ionicons name="lock-closed-outline" size={48} color="#FF9800" style={{ marginBottom: 10 }} />
              <ThemedText style={styles.emptyText}>Please log in to view your alerts.</ThemedText>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="notifications-off-outline" size={48} color="#bbb" style={{ marginBottom: 10 }} />
              <ThemedText style={styles.emptyText}>No alerts yet. You'll see traffic, delivery, and system alerts here.</ThemedText>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Enhanced Navigation Bar */}
      <BottomNavigationBar />

      {/* Custom Authentication Modal */}
      <Modal
        visible={showAuthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Ionicons name="lock-closed-outline" size={48} color="#FF9800" style={{ marginBottom: 16 }} />
              <ThemedText style={styles.modalTitle}>Authentication Required</ThemedText>
              <ThemedText style={styles.modalMessage}>Please log in to view your alerts.</ThemedText>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAuthModal(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.loginButton]}
                  onPress={() => {
                    setShowAuthModal(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearAllText: {
    color: '#FF5252',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: '#fffbe6',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  alertType: {
    fontSize: 12,
    color: '#888',
    marginRight: 10,
  },
  alertTime: {
    fontSize: 12,
    color: '#aaa',
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
}); 