import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = 'http://192.168.31.107:3000';
import { API_URL as API_URL_CONFIG, SOCKET_CONFIG } from '@src/config';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isInitializing = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('Socket initialization already in progress');
      return;
    }

    // Skip socket initialization if we've already failed too many times
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Socket initialization skipped - max attempts reached');
      return;
    }

    this.isInitializing = true;
    try {
      // Get token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found - socket initialization skipped');
        this.isInitializing = false;
        return;
      }

      // Validate token format (basic JWT check)
      if (!this.isValidToken(token)) {
        console.log('Invalid token format - socket initialization skipped');
        await AsyncStorage.removeItem('token');
        this.isInitializing = false;
        return;
      }

      // Initialize socket only if we have a valid token
      console.log('Valid token found - initializing socket connection');
      await this.connectSocket(token);
    } catch (error) {
      console.error('Error initializing socket service:', error);
      this.reconnectAttempts = this.maxReconnectAttempts; // Stop trying
    } finally {
      this.isInitializing = false;
    }
  }

  private isValidToken(token: string): boolean {
    // Basic JWT token validation (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  private async connectSocket(token: string) {
    try {
      // Disconnect existing socket if any
      if (this.socket) {
        console.log('Disconnecting existing socket...');
        this.socket.disconnect();
        this.socket = null;
      }

      console.log('Attempting to connect socket to:', API_URL);

      // Initialize socket with proper configuration for local development
      this.socket = io(API_URL, {
        transports: ['websocket', 'polling'], // Try both transports
        auth: { token },
        timeout: 10000, // 10 second timeout
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        forceNew: true,
        autoConnect: true,
        // Add extra options for better compatibility
        upgrade: true,
        rememberUpgrade: false
      });

      // Set up socket event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', (error: Error) => {
        console.log('Socket connection error:', error.message);
        if (error.message.includes('authentication') || error.message.includes('Invalid token') || error.message.includes('websocket error')) {
          // Handle authentication/connection errors - stop trying
          console.log('Socket connection failed - stopping attempts');
          this.handleAuthError();
        } else {
          // Only retry for network errors, not auth errors
          this.handleReconnect();
        }
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

      // Set up event listeners with error handling
      this.eventListeners.forEach((listeners, event) => {
        console.log(`Setting up listener for event: ${event}`);
        listeners.forEach(callback => {
          this.socket?.on(event, (data: any) => {
            try {
              // If data is a string, try to parse it as JSON
              if (typeof data === 'string') {
                try {
                  data = JSON.parse(data);
                } catch (parseError) {
                  console.error(`Failed to parse JSON for event ${event}:`, parseError);
                  console.log('Raw data:', data);
                  return;
                }
              }
              callback(data);
            } catch (error) {
              console.error(`Error in event listener for ${event}:`, error);
            }
          });
        });
      });

      // Set up connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          console.warn('Socket connection timeout, attempting to reconnect...');
          this.handleReconnect();
        }
      }, 15000); // 15 second timeout

    } catch (error) {
      console.error('Error connecting socket:', error);
      console.warn('Socket connection failed, continuing without socket');
    }
  }

  private async handleAuthError() {
    console.log('Handling authentication error...');
    // Clear token and stop trying to reconnect
    await AsyncStorage.removeItem('token');
    this.reconnectAttempts = this.maxReconnectAttempts; // Stop retrying
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('Socket authentication failed - user needs to login again');
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.initialize();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    } else {
      console.warn('Max reconnection attempts reached, continuing without socket');
      // Disable socket for this session
      this.socket = null;
      this.reconnectAttempts = this.maxReconnectAttempts;
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
    this.socket?.on(event, (data: any) => {
      try {
        // If data is a string, try to parse it as JSON
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            console.error(`Failed to parse JSON for event ${event}:`, parseError);
            console.log('Raw data:', data);
            return;
          }
        }
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  off(event: string, callback: Function) {
    console.log(`Removing listener for event: ${event}`);
    this.eventListeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    try {
      // If data is not a string, stringify it
      if (typeof data !== 'string') {
        data = JSON.stringify(data);
      }
      console.log(`Emitting event: ${event}`, data);
      this.socket.emit(event, data);
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Method to manually initialize socket after login
  async initializeAfterLogin() {
    console.log('Initializing socket after login...');
    this.reconnectAttempts = 0; // Reset attempts
    await this.initialize();
  }

  // Method to check if user is logged in
  async isUserLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      return token && this.isValidToken(token);
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Method to disconnect and cleanup
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }
}

export const socketService = SocketService.getInstance();
export default socketService; 