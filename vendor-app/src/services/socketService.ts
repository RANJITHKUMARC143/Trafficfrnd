import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private vendorId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly SOCKET_URL = 'https://traffic-friend-backend.onrender.com';
  private eventListeners: Map<string, Set<Function>> = new Map();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async initialize() {
    try {
      // Get vendor data
      const vendorStr = await AsyncStorage.getItem('vendor');
      if (!vendorStr) {
        console.log('No vendor found in storage');
        return;
      }

      const vendor = JSON.parse(vendorStr);
      if (!vendor._id) {
        console.log('Invalid vendor data');
        return;
      }
      this.vendorId = vendor._id;

      // Get token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        return;
      }

      // Initialize socket
      await this.connectSocket();
    } catch (error) {
      console.error('Error initializing socket service:', error);
    }
  }

  private async connectSocket() {
    if (!this.vendorId) {
      console.log('Cannot connect socket: No vendor ID');
      return;
    }

    try {
      // Disconnect existing socket if any
      if (this.socket) {
        console.log('Disconnecting existing socket...');
        this.socket.disconnect();
        this.socket = null;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Cannot connect socket: No token');
        return;
      }

      console.log('Attempting to connect socket to:', this.SOCKET_URL);

      // Initialize socket with proper configuration
      this.socket = io(this.SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        auth: {
          token
        },
        path: '/socket.io',
        forceNew: true,
      });

      // Set up socket event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
        if (this.vendorId) {
          console.log('Joining vendor room:', this.vendorId);
          this.socket?.emit('joinVendorRoom', this.vendorId);
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
        this.handleReconnect();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        if (reason !== 'io client disconnect') {
          this.handleReconnect();
        }
      });

      this.socket.on('error', (error: Error) => {
        console.error('Socket error:', error.message);
      });

      // Set up event listeners
      this.eventListeners.forEach((listeners, event) => {
        console.log(`Setting up listener for event: ${event}`);
        listeners.forEach(callback => {
          this.socket?.on(event, callback);
        });
      });

    } catch (error) {
      console.error('Error connecting socket:', error);
      console.warn('Socket connection failed, continuing without socket');
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.connectSocket();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    } else {
      console.warn('Max reconnection attempts reached, continuing without socket');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, callback: Function) {
    console.log(`Adding listener for event: ${event}`);
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: Function) {
    console.log(`Removing listener for event: ${event}`);
    this.eventListeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    console.log(`Emitting event: ${event}`, data);
    this.socket?.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = SocketService.getInstance(); 