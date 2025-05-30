import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { locationService } from '../services/locationService';

interface UseVendorLocationReturn {
  location: Location.LocationObject | null;
  address: string | null;
  error: string | null;
  isLoading: boolean;
}

export const useVendorLocation = (): UseVendorLocationReturn => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateLocation = async (newLocation: Location.LocationObject) => {
    setLocation(newLocation);
    const newAddress = await locationService.getAddressFromCoordinates(
      newLocation.coords.latitude,
      newLocation.coords.longitude
    );
    setAddress(newAddress);
  };

  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get initial location
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation && mounted) {
          await updateLocation(currentLocation);
        }

        // Start watching for location updates
        await locationService.startLocationUpdates((newLocation) => {
          if (mounted) {
            updateLocation(newLocation);
          }
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to start location tracking');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeLocation();

    // Cleanup function
    return () => {
      mounted = false;
      locationService.stopLocationUpdates();
    };
  }, []);

  return {
    location,
    address,
    error,
    isLoading,
  };
}; 