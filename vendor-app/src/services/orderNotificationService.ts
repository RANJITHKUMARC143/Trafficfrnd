import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { Order } from '../types/order';

let socket: Socket | null = null;

export const orderNotificationService = {
  initialize: () => {
    if (!socket) {
      socket = io(API_URL, { transports: ['websocket'] });
    }
  },
  onOrderStatusUpdate: (cb: (order: Order) => void) => {
    if (socket) socket.on('orderStatusUpdate', cb);
  },
  onNewOrder: (cb: (order: Order) => void) => {
    if (socket) socket.on('newOrder', cb);
  },
  onOrderCancelled: (cb: (orderId: string) => void) => {
    if (socket) socket.on('orderCancelled', cb);
  },
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  getSocket: () => socket,
}; 