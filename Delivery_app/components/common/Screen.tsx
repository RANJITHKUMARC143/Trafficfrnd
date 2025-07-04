import React from 'react';
import { 
  SafeAreaView, 
  View, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
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
  const Container = safeArea ? SafeAreaView : View;
  
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
      <Container style={[styles.screen, { backgroundColor }]}>
        {scroll ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {content}
          </ScrollView>
        ) : content}
      </Container>
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