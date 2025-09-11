// API Configuration
// For development, use localhost or your computer's local IP address
// You can find your IP address by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.107:3000';

// Socket Configuration
export const SOCKET_CONFIG = {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 10000,
  path: '/socket.io',
  forceNew: true,
}; 