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
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Expose stopAlert so it can be called from outside
  const stopAlert = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
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
        });
        socket.on('orderClaimed', (claimedOrder: Order) => {
          console.log('[OrderContext] orderClaimed received:', claimedOrder);
          setOrders((prev) => prev.map(o => o._id === claimedOrder._id ? claimedOrder : o));
        });
        socket.on('connect', () => {
          console.log('[OrderContext] Socket connected:', socket.id);
        });
        socket.on('disconnect', () => {
          console.log('[OrderContext] Socket disconnected');
        });
      }
      // Fetch both assigned and available orders
      const fetchOrders = async () => {
        try {
          const token = await AsyncStorage.getItem('@traffic_friend_token');
          if (!token || token === 'null' || token === 'undefined') return;
          // Assigned orders
          const assignedRes = await fetch(
            `${getBaseUrl()}${API_ENDPOINTS.DELIVERY.ORDERS(user.id)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const assignedOrders = assignedRes.ok ? await assignedRes.json() : [];
          console.log('[OrderContext] Assigned orders:', assignedOrders);
          // Available orders
          const availableRes = await fetch(
            `${getBaseUrl()}${API_ENDPOINTS.ORDERS.AVAILABLE}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const availableOrders = availableRes.ok ? await availableRes.json() : [];
          console.log('[OrderContext] Available orders:', availableOrders);
          // Merge and deduplicate by _id
          const allOrders = [...assignedOrders, ...availableOrders].reduce((acc, curr) => {
            if (!acc.some(o => o._id === curr._id)) acc.push(curr);
            return acc;
          }, []);
          setOrders(allOrders);
        } catch (err) {
          console.error('[OrderContext] Failed to fetch orders:', err);
        }
      };
      fetchOrders();
      return () => {
        if (socket) {
          socket.off('orderCreated');
          socket.off('orderClaimed');
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
    };
    // Find available orders
    const availableOrders = orders.filter(
      (order) => !order.deliveryBoyId && order.status === 'pending'
    );
    if (availableOrders.length > 0) {
      playAlert();
    } else {
      stopAlert();
    }
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, setOrders, stopAlert }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}; 