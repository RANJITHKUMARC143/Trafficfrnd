import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TrafficFrndDynamicIsland = ({ 
  isVisible = false, 
  notificationData = null, 
  onHide = () => {} 
}) => {
  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);
  const progress = useSharedValue(0);
  
  // State
  const [currentData, setCurrentData] = useState(null);
  const hideTimeoutRef = useRef(null);

  // Demo data for testing
  const demoData = {
    status: "Walker picked up your order 🚶‍♂️",
    riderName: "Arjun",
    eta: "ETA 5 mins",
    riderImage: null,
    type: "pickup"
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'confirmed':
        return '🛒';
      case 'assigned':
        return '🚶‍♂️';
      case 'pickup':
        return '🚶‍♂️';
      case 'nearby':
        return '🚴‍♂️';
      case 'delivered':
        return '✅';
      default:
        return '📦';
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'confirmed':
        return ['#4CAF50', '#45a049'];
      case 'assigned':
        return ['#2196F3', '#1976D2'];
      case 'pickup':
        return ['#FF9800', '#F57C00'];
      case 'nearby':
        return ['#9C27B0', '#7B1FA2'];
      case 'delivered':
        return ['#4CAF50', '#388E3C'];
      default:
        return ['#607D8B', '#455A64'];
    }
  };

  const showNotification = (data) => {
    const notification = data || demoData;
    
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCurrentData(notification);

    // Animation sequence
    scale.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withSpring(1, { damping: 15, stiffness: 300 }),
      withDelay(3000, withTiming(0.8, { duration: 200 })),
      withTiming(0, { duration: 200 })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(3000, withTiming(0.8, { duration: 200 })),
      withTiming(0, { duration: 200 })
    );

    translateY.value = withSequence(
      withSpring(0, { damping: 15, stiffness: 300 }),
      withDelay(3000, withTiming(-20, { duration: 200 })),
      withTiming(-100, { duration: 200 })
    );

    // Progress animation
    progress.value = withTiming(1, { duration: 4000 });

    // Auto hide after 4 seconds
    hideTimeoutRef.current = setTimeout(() => {
      runOnJS(onHide)();
    }, 4000);
  };

  const hideNotification = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 150 }),
      withTiming(0, { duration: 200 })
    );
    
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-100, { duration: 200 });
    progress.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      setCurrentData(null);
    }, 200);
  };

  useEffect(() => {
    if (isVisible && notificationData) {
      showNotification(notificationData);
    } else if (!isVisible && currentData) {
      hideNotification();
    }
  }, [isVisible, notificationData]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
    };
  });

  if (!currentData) return null;

  const colors = getStatusColor(currentData.type || 'default');
  const statusIcon = getStatusIcon(currentData.type || 'default');

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>

          {/* Main content */}
          <View style={styles.contentContainer}>
            {/* Status icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.statusIcon}>{statusIcon}</Text>
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text style={styles.statusText} numberOfLines={1}>
                {currentData.status}
              </Text>
              {currentData.riderName && (
                <Text style={styles.riderText}>
                  {currentData.riderName}
                </Text>
              )}
              {currentData.eta && (
                <Text style={styles.etaText}>
                  {currentData.eta}
                </Text>
              )}
            </View>

            {/* Close button */}
            <View style={styles.closeButton}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: screenWidth * 0.1,
    right: screenWidth * 0.1,
    zIndex: 9999,
    elevation: 9999,
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  gradientContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  riderText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  etaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default TrafficFrndDynamicIsland;
