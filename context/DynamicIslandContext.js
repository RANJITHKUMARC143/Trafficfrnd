import React, { createContext, useContext, useState, useCallback } from 'react';
import io from 'socket.io-client';

const DynamicIslandContext = createContext();

export const useDynamicIsland = () => {
  const context = useContext(DynamicIslandContext);
  if (!context) {
    throw new Error('useDynamicIsland must be used within a DynamicIslandProvider');
  }
  return context;
};

export const DynamicIslandProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [socket, setSocket] = useState(null);

  const showNotification = useCallback((data) => {
    setNotificationData(data);
    setIsVisible(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsVisible(false);
    // Keep data for a moment to allow smooth animation
    setTimeout(() => {
      setNotificationData(null);
    }, 300);
  }, []);

  const connectSocket = useCallback((url = 'https://trafficfrnd-2.onrender.com') => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Dynamic Island Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Dynamic Island Socket disconnected');
    });

    // Listen for order status updates
    newSocket.on('ORDER_STATUS_UPDATE', (data) => {
      console.log('Dynamic Island received ORDER_STATUS_UPDATE:', data);
      showNotification(data);
    });

    // Listen for delivery updates
    newSocket.on('DELIVERY_STATUS_UPDATE', (data) => {
      console.log('Dynamic Island received DELIVERY_STATUS_UPDATE:', data);
      showNotification(data);
    });

    // Listen for rider location updates
    newSocket.on('RIDER_LOCATION_UPDATE', (data) => {
      console.log('Dynamic Island received RIDER_LOCATION_UPDATE:', data);
      showNotification({
        status: `Rider is near you ${data.eta ? `ETA ${data.eta}` : ''} 🚴‍♂️`,
        riderName: data.riderName || 'Your rider',
        eta: data.eta || '',
        type: 'nearby',
        ...data
      });
    });

    // Listen for order creation
    newSocket.on('ORDER_CREATED', (data) => {
      console.log('Dynamic Island received ORDER_CREATED:', data);
      showNotification({
        status: 'Order confirmed 🛒',
        riderName: null,
        eta: null,
        type: 'confirmed',
        ...data
      });
    });

    // Listen for order completion
    newSocket.on('ORDER_COMPLETED', (data) => {
      console.log('Dynamic Island received ORDER_COMPLETED:', data);
      showNotification({
        status: 'Order delivered ✅',
        riderName: data.riderName || 'Your rider',
        eta: null,
        type: 'delivered',
        ...data
      });
    });

    setSocket(newSocket);
    return newSocket;
  }, [socket, showNotification]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  const triggerDemoNotification = useCallback((type = 'pickup') => {
    const demoNotifications = {
      confirmed: {
        status: 'Order confirmed 🛒',
        riderName: null,
        eta: null,
        type: 'confirmed'
      },
      assigned: {
        status: 'Walker assigned 🚶‍♂️',
        riderName: 'Arjun',
        eta: 'ETA 10 mins',
        type: 'assigned'
      },
      pickup: {
        status: 'Walker picked up your order 🚶‍♂️',
        riderName: 'Arjun',
        eta: 'ETA 5 mins',
        type: 'pickup'
      },
      nearby: {
        status: 'Rider is near you 🚴‍♂️',
        riderName: 'Arjun',
        eta: 'ETA 2 mins',
        type: 'nearby'
      },
      delivered: {
        status: 'Order delivered ✅',
        riderName: 'Arjun',
        eta: null,
        type: 'delivered'
      }
    };

    const notification = demoNotifications[type] || demoNotifications.pickup;
    showNotification(notification);
  }, [showNotification]);

  const value = {
    isVisible,
    notificationData,
    showNotification,
    hideNotification,
    connectSocket,
    disconnectSocket,
    triggerDemoNotification,
    socket
  };

  return (
    <DynamicIslandContext.Provider value={value}>
      {children}
    </DynamicIslandContext.Provider>
  );
};
