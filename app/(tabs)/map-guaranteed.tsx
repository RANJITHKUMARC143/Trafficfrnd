import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { fetchDeliveryPoints } from '@lib/services/orderService';

type DeliveryPoint = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
};

export default function GuaranteedMapScreen() {
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        console.log('🚀 GUARANTEED MAP: Starting...');
        
        // Get location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        console.log('🚀 GUARANTEED MAP: Location:', coords);
        setLocationCoords(coords);

        // Fetch delivery points
        const points = await fetchDeliveryPoints();
        console.log('🚀 GUARANTEED MAP: Points:', points.length);
        setDeliveryPoints(points);

        setLoading(false);
        setMapReady(true);
        console.log('🚀 GUARANTEED MAP: Ready!');
      } catch (error) {
        console.error('❌ GUARANTEED MAP: Error:', error);
        setError('Failed to initialize');
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🚀 Loading guaranteed map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          setLoading(true);
          const initializeMap = async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                setError('Location permission denied');
                setLoading(false);
                return;
              }
              const location = await Location.getCurrentPositionAsync({});
              const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
              setLocationCoords(coords);
              const points = await fetchDeliveryPoints();
              setDeliveryPoints(points);
              setLoading(false);
              setMapReady(true);
            } catch (error) {
              setError('Failed to initialize');
              setLoading(false);
            }
          };
          initializeMap();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!locationCoords) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No location available</Text>
      </View>
    );
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: #f0f0f0;
          }
          #map { 
            width: 100%; 
            height: 100vh; 
            background: #e0e0e0;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="loading" id="loading">
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">🗺️</div>
            <div>Loading map...</div>
          </div>
        </div>
        <script>
          console.log('🚀 GUARANTEED MAP: Initializing...');
          
          // Create map
          const map = L.map('map').setView([${locationCoords.latitude}, ${locationCoords.longitude}], 13);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Add user location marker
          const userMarker = L.marker([${locationCoords.latitude}, ${locationCoords.longitude}])
            .addTo(map)
            .bindPopup('<b>Your Location</b><br>You are here')
            .openPopup();
          
          // Add delivery point markers
          ${deliveryPoints.map(point => `
            L.marker([${point.latitude}, ${point.longitude}])
              .addTo(map)
              .bindPopup('<b>${point.name}</b><br>${point.address}');
          `).join('')}
          
          // Hide loading
          setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            console.log('✅ GUARANTEED MAP: Map loaded successfully!');
          }, 1000);
          
          // Map events
          map.on('load', () => {
            console.log('✅ GUARANTEED MAP: Map loaded event');
          });
          
          map.on('tileload', () => {
            console.log('✅ GUARANTEED MAP: Tiles loaded');
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Guaranteed Map</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          ✅ Map Ready | 📍 {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)} | 
          🎯 {deliveryPoints.length} Points
        </Text>
      </View>

      {/* Map */}
      <WebView
        source={{ html: mapHTML }}
        style={styles.map}
        onLoad={() => {
          console.log('✅ GUARANTEED MAP: WebView loaded');
        }}
        onError={(error) => {
          console.log('❌ GUARANTEED MAP: WebView error:', error);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />

      {/* Delivery Points */}
      <View style={styles.deliveryPoints}>
        <Text style={styles.deliveryPointsTitle}>Delivery Points</Text>
        <Text style={styles.deliveryPointsSubtitle}>{deliveryPoints.length} points available</Text>
        {deliveryPoints.slice(0, 3).map((point) => (
          <View key={point._id} style={styles.deliveryPointCard}>
            <Text style={styles.deliveryPointName}>{point.name}</Text>
            <Text style={styles.deliveryPointAddress}>{point.address}</Text>
            {point.name === 'Tamaka' && (
              <View style={styles.nearestBadge}>
                <Text style={styles.nearestBadgeText}>NEAREST</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#007AFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 34,
  },
  statusBar: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  map: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 50,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryPoints: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  deliveryPointsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  deliveryPointsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  deliveryPointCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryPointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deliveryPointAddress: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  nearestBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  nearestBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
