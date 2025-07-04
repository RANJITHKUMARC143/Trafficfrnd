import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary
  primary: '#3366FF',
  primaryLight: '#5E85FF',
  primaryDark: '#1A4ADB',
  
  // Secondary/Accent
  accent: '#FF9500',
  accentLight: '#FFAD33',
  accentDark: '#DB8000',
  
  // Status colors
  success: '#34C759',
  successLight: '#5AD37A',
  successDark: '#2AA84A',
  
  warning: '#FFCC00',
  warningLight: '#FFD633',
  warningDark: '#E6B800',
  
  error: '#FF3B30',
  errorLight: '#FF6259',
  errorDark: '#DB2E24',
  
  // Neutrals
  black: '#000000',
  darkGray: '#333333',
  gray: '#777777',
  lightGray: '#BBBBBB',
  ultraLightGray: '#EEEEEE',
  white: '#FFFFFF',
  
  // Background colors
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  
  // Status colors
  statusPickup: '#FFCC00',
  statusEnRoute: '#3366FF',
  statusDelivered: '#34C759',
  statusCanceled: '#FF3B30',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  margin: 20,

  // Font sizes
  largeTitle: 40,
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 16,
  h5: 14,
  body1: 18,
  body2: 16,
  body3: 14,
  body4: 12,
  small: 10,

  // Dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: { fontFamily: 'Poppins-Bold', fontSize: SIZES.largeTitle, lineHeight: 55 },
  h1: { fontFamily: 'Poppins-Bold', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: 'Poppins-Bold', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h3, lineHeight: 26 },
  h4: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h4, lineHeight: 22 },
  h5: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h5, lineHeight: 20 },
  body1: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body1, lineHeight: 27 },
  body2: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body2, lineHeight: 24 },
  body3: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body3, lineHeight: 21 },
  body4: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body4, lineHeight: 18 },
  body1Medium: { fontFamily: 'Poppins-Medium', fontSize: SIZES.body1, lineHeight: 27 },
  body2Medium: { fontFamily: 'Poppins-Medium', fontSize: SIZES.body2, lineHeight: 24 },
  body3Medium: { fontFamily: 'Poppins-Medium', fontSize: SIZES.body3, lineHeight: 21 },
  body4Medium: { fontFamily: 'Poppins-Medium', fontSize: SIZES.body4, lineHeight: 18 },
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 5,
  },
};

export const IS_WEB = Platform.OS === 'web';

export default { COLORS, SIZES, FONTS, SHADOWS, IS_WEB };