import { Alert } from 'react-native';
import { socketService } from './socketService';
import { playAlertLoop } from '../utils/soundPlayer';

export interface OrderNotification {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  timestamp: string;
}

class OrderNotificationService {
  async initialize() {
    try {
      await socketService.initialize();
    } catch (error) {
      console.error('Error initializing order notification service:', error);
    }
  }

  // Real-time event listeners
  onNewOrder(callback: (order: any) => void) {
    socketService.on('newOrder', async (order: any) => {
      await playAlertLoop();
      callback(order);
    });
  }

  onOrderStatusUpdate(callback: (order: any) => void) {
    socketService.on('orderStatusUpdate', callback);
  }

  onOrderCancelled(callback: (orderId: string) => void) {
    socketService.on('orderCancelled', callback);
  }

  private showOrderNotification(order: OrderNotification) {
    Alert.alert(
      'New Order Received',
      `Order #${order.orderId} from ${order.customerName}\nTotal: ₹${order.totalAmount}`,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to order details
            // This will be handled by the OrdersScreen
          },
        },
        {
          text: 'Dismiss',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  private showOrderStatusNotification(order: OrderNotification) {
    Alert.alert(
      'Order Status Update',
      `Order #${order.orderId} is now ${order.status}`,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to order details
            // This will be handled by the OrdersScreen
          },
        },
        {
          text: 'Dismiss',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  // Cleanup
  disconnect() {
    socketService.disconnect();
  }
}

export const orderNotificationService = new OrderNotificationService(); 