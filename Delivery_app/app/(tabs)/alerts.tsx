import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, FlatList, View, TouchableOpacity, RefreshControl, Text, DeviceEventEmitter } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Screen from '@/components/common/Screen';
import Header from '@/components/common/Header';
import Card from '@/components/common/Card';
import { fetchAlerts, deleteAlert, clearAllAlerts, markAlertRead } from '@/services/alertService';
import { getSocket } from '@/utils/socket';

type DeliveryAlert = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return '';
  }
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<DeliveryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts();
      setAlerts(res || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Listen for realtime delivery notifications and refresh alerts list
    const socket = getSocket();
    const onDeliveryNotification = () => {
      load();
    };
    socket?.on?.('deliveryNotification', onDeliveryNotification);
    return () => {
      socket?.off?.('deliveryNotification', onDeliveryNotification);
    };
  }, [load]);

  // Ensure latest alerts whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <Screen>
      <Header title="Alerts" showBack showNotification notificationCount={unreadCount} />
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={async () => {
          try {
            await clearAllAlerts(alerts);
            await load();
            DeviceEventEmitter.emit('alertsUpdated');
          } catch {}
        }}>
          <Text style={styles.actionText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const renderRightActions = () => (
            <TouchableOpacity
              style={styles.swipeDelete}
              onPress={async () => {
                try {
                  await deleteAlert(item._id);
                  setAlerts(prev => prev.filter(a => a._id !== item._id));
                  DeviceEventEmitter.emit('alertsUpdated');
                } catch {}
              }}
            >
              <Text style={styles.swipeDeleteText}>Delete</Text>
            </TouchableOpacity>
          );

          return (
            <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  if (item.read) return;
                  try {
                    await markAlertRead(item._id);
                    setAlerts(prev => prev.map(a => a._id === item._id ? { ...a, read: true } : a));
                    DeviceEventEmitter.emit('alertsUpdated');
                  } catch {}
                }}
              >
                <Card style={[styles.alertCard, !item.read ? styles.unreadCard : undefined]}>
                  <View style={styles.alertHeader}>
                    <View style={styles.headerLeft}>
                      {!item.read ? <View style={styles.unreadDot} /> : null}
                      <Text style={[styles.alertTitle, item.read ? styles.readTitle : undefined]}>{item.title || 'Alert'}</Text>
                    </View>
                    <Text style={[styles.alertTime, item.read ? styles.readTime : undefined]}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={[styles.alertMsg, item.read ? styles.readMsg : undefined]}>{item.message}</Text>
                  {!item.read && (
                    <Text style={styles.tapHint}>Tap to mark as read • Swipe to delete</Text>
                  )}
                </Card>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No alerts</Text>
          </View>
        ) : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  actionText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  alertCard: {
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  readTitle: {
    color: '#475569',
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    color: '#475569',
  },
  readTime: {
    color: '#94a3b8',
  },
  alertMsg: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 10,
  },
  readMsg: {
    color: '#64748b',
  },
  unreadCard: {
    backgroundColor: '#eef6e9',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3d7a00',
  },
  tapHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  smallBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  swipeDelete: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginVertical: 6,
    borderRadius: 8,
  },
  swipeDeleteText: {
    color: 'white',
    fontWeight: '700',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
});


