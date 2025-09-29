import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
  safeArea?: boolean;
}

const Screen = ({ 
  children, 
  scroll = false, 
  style, 
  backgroundColor = COLORS.background,
  safeArea = true
}: ScreenProps) => {
  const content = (
    <View style={[
      styles.container, 
      { backgroundColor }, 
      style
    ]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled
    >
      <StatusBar 
        backgroundColor={backgroundColor} 
        barStyle="dark-content" 
      />
      {safeArea ? (
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.screen, { backgroundColor }]}>
          {scroll ? (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {content}
            </ScrollView>
          ) : content}
        </SafeAreaView>
      ) : (
        <View style={[styles.screen, { backgroundColor, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }]}>
          {scroll ? (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {content}
            </ScrollView>
          ) : content}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
  }
});

export default Screen;