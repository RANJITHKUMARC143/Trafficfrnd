import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
  style?: ViewStyle;
  onNotificationPress?: () => void;
}

const Header = ({
  title,
  showBack = false,
  showNotification = false,
  notificationCount = 0,
  style,
  onNotificationPress,
}: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color={COLORS.darkGray} size={24} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightContainer}>
        {showNotification && (
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Bell color={COLORS.darkGray} size={24} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 8,
  },
  leftContainer: {
    width: 40,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    flex: 1,
    textAlign: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  notificationButton: {
    padding: 8,
    marginRight: -8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    ...FONTS.body4,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default Header;