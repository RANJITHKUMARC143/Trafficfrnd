import React from 'react';
import { View, ViewStyle } from 'react-native';

type Props = {
  style?: ViewStyle | ViewStyle[];
  source?: any;
  autoPlay?: boolean;
  loop?: boolean;
};

export default function LottieFallback(_props: Props) {
  return <View />;
}


