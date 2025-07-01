import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, RefreshControl, Alert as RNAlert, Text } from 'react-native';
import { ThemedText, ThemedView } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { fetchAlerts, deleteAlert, clearAllAlerts, markAlertRead } from '../services/alertService';
import { Audio } from 'expo-av';
import { Swipeable } from 'react-native-gesture-handler';

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
  const previousAlertCount = useRef(0);

  const loadAlerts = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchAlerts();
      // Map backend fields to UI fields
      setAlerts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(alert => ({
        id: alert._id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        timestamp: new Date(alert.createdAt).getTime(),
        read: alert.read,
      })));
    } catch {
      RNAlert.alert('Error', 'Failed to fetch alerts.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Auto-refresh alerts every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  useEffect(() => {
    if (alerts.length > previousAlertCount.current) {
      playAlertSound();
    }
    previousAlertCount.current = alerts.length;
  }, [alerts]);

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
        await clearAllAlerts(alerts);
        setAlerts([]);
      } },
    ]);
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(id);
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const handleMarkRead = async (id: string) => {
    await markAlertRead(id);
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, read: true } : alert));
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
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color="#bbb" style={{ marginBottom: 10 }} />
          <ThemedText style={styles.emptyText}>No alerts yet. You'll see traffic, delivery, and system alerts here.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAlerts} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
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
  },
}); 