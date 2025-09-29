import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingAnimationProps {
  visible?: boolean;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  overlay?: boolean;
}

const { width, height } = Dimensions.get('window');

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  visible = true,
  size = 'medium',
  backgroundColor = 'rgba(255, 255, 255, 0.9)',
  overlay = true
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

  const containerStyle = overlay
    ? [
        styles.overlay,
        { backgroundColor },
        { width, height }
      ]
    : styles.container;

  return (
    <View style={containerStyle}>
      <LottieView
        source={require('../assets/animations/loading.json')}
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animation: {
    alignSelf: 'center',
  },
});

export default LoadingAnimation;
