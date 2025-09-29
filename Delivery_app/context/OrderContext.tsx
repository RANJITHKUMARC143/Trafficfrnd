import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Order } from '@/types/order';
import { connectSocket, getSocket } from '@/utils/socket';
import { useAuth } from './AuthContext';
import { Audio } from 'expo-av';
import { useRef } from 'react';
import { getBaseUrl, API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderContextType {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  stopAlert: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const suppressSoundRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);

  // Expose stopAlert so it can be called from outside
  const stopAlert = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    isPlayingRef.current = false;
    try { (global as any).__deliveryAlertPlaying = false; } catch {}
  };

  // Shared orders fetcher
  const refreshOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('@traffic_friend_token');
      if (!token || token === 'null' || token === 'undefined') return;
      // Assigned orders
      const assignedRes = await fetch(
        `${getBaseUrl()}${API_ENDPOINTS.DELIVERY.ORDERS(user?.id || '')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const assignedOrders = assignedRes.ok ? await assignedRes.json() : [];
      // Available orders
      const availableRes = await fetch(
        `${getBaseUrl()}${API_ENDPOINTS.ORDERS.AVAILABLE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const availableOrders = availableRes.ok ? await availableRes.json() : [];
      // Merge and deduplicate by _id
      const allOrders = [...assignedOrders, ...availableOrders].reduce((acc: Order[], curr: Order) => {
        if (!acc.some(o => o._id === curr._id)) acc.push(curr);
        return acc;
      }, []);
      setOrders(allOrders);
    } catch (err) {
      console.error('[OrderContext] Failed to refresh orders:', err);
    }
  };

  useEffect(() => {
    console.log('[OrderContext] Provider mounted. User:', user);
    if (user && user.id) {
      connectSocket(user);
      const socket = getSocket();
      console.log('[OrderContext] Socket instance:', socket);
      if (socket) {
        socket.on('orderCreated', (newOrder: Order) => {
          console.log('[OrderContext] orderCreated received:', newOrder);
          setOrders((prev) => {
            if (prev.some((o) => o._id === newOrder._id)) return prev;
            return [newOrder, ...prev];
          });
          // The useEffect below will handle sound based on updated orders
        });
        socket.on('orderClaimed', (claimedOrder: Order) => {
          console.log('[OrderContext] orderClaimed received:', claimedOrder);
          setOrders((prev) => prev.map(o => o._id === claimedOrder._id ? claimedOrder : o));
          // If I claimed it, stop alert sound immediately
          try {
            const myId = user?.id ? String(user.id) : '';
            const raw = (claimedOrder as any)?.deliveryBoyId;
            const claimerId = raw && typeof raw === 'object' && raw._id ? String(raw._id) : String(raw || '');
            if (myId && claimerId && myId === claimerId) {
              stopAlert();
              // Suppress auto-play for a short window to avoid re-trigger from other available orders
              suppressSoundRef.current = true;
              setTimeout(() => { suppressSoundRef.current = false; }, 15000);
            }
          } catch {}
        });
        socket.on('orderStatusUpdated', ({ orderId, status }: { orderId: string; status: string }) => {
          console.log('[OrderContext] orderStatusUpdated received:', { orderId, status });
          setOrders((prev) => prev.map(o => o._id === orderId ? { ...o, status } as Order : o));
          // If this order moved out of pending, stop alert
          if (String(status).toLowerCase() !== 'pending') {
            stopAlert();
          }
        });
        // Ensure available tab sees new orders even if targeted events were missed
        socket.on('deliveryNotification', async () => {
          await refreshOrders();
        });
        socket.on('connect', () => {
          console.log('[OrderContext] Socket connected:', socket.id);
        });
        socket.on('disconnect', () => {
          console.log('[OrderContext] Socket disconnected');
        });
      }
      // Initial fetch
      refreshOrders();
      return () => {
        if (socket) {
          socket.off('orderCreated');
          socket.off('orderClaimed');
          socket.off('orderStatusUpdated');
          socket.off('deliveryNotification');
          socket.off('connect');
          socket.off('disconnect');
        }
      };
    }
  }, [user]);

  useEffect(() => {
    console.log('[OrderContext] Orders state updated:', orders);
  }, [orders]);

  // Play/stop alert sound when available orders change
  useEffect(() => {
    const playAlert = async () => {
      if (isPlayingRef.current || isStartingRef.current) return;
      if ((global as any).__deliveryAlertPlaying) return;
      isStartingRef.current = true;
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/alert.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      await sound.playAsync();
      isPlayingRef.current = true;
      try { (global as any).__deliveryAlertPlaying = true; } catch {}
      isStartingRef.current = false;
    };
    // Find available orders
    const availableOrders = orders.filter((order) => {
      const hasAssignee = !!(order as any)?.deliveryBoyId;
      const isPending = String((order as any)?.status || '').toLowerCase() === 'pending';
      return !hasAssignee && isPending;
    });
    if (availableOrders.length > 0) {
      if (suppressSoundRef.current) {
        // Do not start a new alert loop while suppression is active
        return;
      }
      playAlert();
    } else {
      stopAlert();
    }
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, setOrders, stopAlert, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}; 