import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@src/config';
const SOCKET_URL = API_URL;

class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private isConnected = false;
  private joinedRooms: Set<string> = new Set();

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async connect(): Promise<Socket | null> {
    try {
      if (this.socket && this.isConnected) {
        return this.socket;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found for chat connection');
        return null;
      }

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('Chat socket connected');
        this.isConnected = true;
        // Auto rejoin any rooms after reconnect
        if (this.joinedRooms.size > 0) {
          this.joinedRooms.forEach((roomId) => {
            try {
              this.socket?.emit('joinOrderRoom', roomId);
            } catch {}
          });
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Chat socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Chat socket connection error:', error);
        this.isConnected = false;
      });

      return this.socket;
    } catch (error) {
      console.error('Error connecting chat socket:', error);
      return null;
    }
  }

  public joinOrderRoom(orderId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinOrderRoom', orderId);
      this.joinedRooms.add(orderId);
    }
  }

  public leaveOrderRoom(orderId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveOrderRoom', orderId);
      this.joinedRooms.delete(orderId);
    }
  }

  public sendMessage(orderId: string, message: string, sender: 'user' | 'delivery'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', {
        orderId,
        message,
        sender
      });
    }
  }

  public onMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  public offMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.off('message', callback);
    }
  }

  public onOrderStatusUpdate(callback: (data: { orderId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('orderStatusUpdated', callback);
    }
  }

  public onLocationUpdate(callback: (data: { deliveryBoyId: string; location: any }) => void): void {
    if (this.socket) {
      this.socket.on('locationUpdated', callback);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null;
  }
}

export default ChatService.getInstance();
