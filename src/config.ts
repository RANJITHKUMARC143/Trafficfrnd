// API Configuration
// For development, prefer EXPO_PUBLIC_API_URL; otherwise try to detect LAN IP (Expo Go),
// and finally fall back to localhost.
import Constants from 'expo-constants';

function deriveLanBaseURL(): string | undefined {
  try {
    const hostUri = (Constants as any)?.expoConfig?.hostUri
      || (Constants as any)?.manifest?.debuggerHost
      || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (!hostUri || typeof hostUri !== 'string') return undefined;
    const host = hostUri.split(':')[0];
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (isIPv4) {
      return `http://${host}:3000`;
    }
  } catch {}
  return undefined;
}

const LAN_BASE = deriveLanBaseURL();
export const API_URL = process.env.EXPO_PUBLIC_API_URL || LAN_BASE || 'http://localhost:3000';

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