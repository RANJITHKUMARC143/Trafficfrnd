import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';

// Try to use Lottie if it's installed; otherwise fall back to ActivityIndicator
let LottieView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LottieView = require('lottie-react-native').default;
} catch (e) {
  LottieView = null;
}

interface LoadingOverlayProps {
  visible?: boolean;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

const { width, height } = Dimensions.get('window');

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  size = 'medium',
  backgroundColor = 'rgba(255, 255, 255, 0.9)'
}) => {
  if (!visible) return null;

  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 80 };
      case 'large':
        return { width: 200, height: 200 };
      default:
        return { width: 120, height: 120 };
    }
  };

  const animationSize = getSize();

  const spinnerSize = size === 'small' ? 'small' : 'large';

  if (LottieView) {
    return (
      <View style={[styles.overlay, { backgroundColor, width, height }]}> 
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay
          loop
          style={[
            styles.animation,
            {
              width: animationSize.width,
              height: animationSize.height,
            }
          ]}
          speed={1}
        />
      </View>
    );
  }

  return (
    <View style={[styles.overlay, { backgroundColor, width, height }]}> 
      <ActivityIndicator size={spinnerSize} color="#3d7a00" />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  animation: {
    alignSelf: 'center',
  },
});

export default LoadingOverlay;
