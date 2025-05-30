import * as Location from 'expo-location';
import { Platform } from 'react-native';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private locationUpdatesCallback: ((location: Location.LocationObject) => void) | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission denied');
        return false;
      }

      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.error('Background location permission denied');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationUpdates(callback: (location: Location.LocationObject) => void) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.locationUpdatesCallback = callback;
      
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          if (this.locationUpdatesCallback) {
            this.locationUpdatesCallback(location);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location updates:', error);
      throw error;
    }
  }

  stopLocationUpdates() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.locationUpdatesCallback = null;
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street}, ${address.city}, ${address.region}, ${address.postalCode}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }
}

export const locationService = new LocationService(); 