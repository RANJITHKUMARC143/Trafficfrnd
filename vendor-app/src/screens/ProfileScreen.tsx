import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

interface SettingItemProps {
  icon: string;
  title: string;
  value?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  value,
  onPress,
  showSwitch,
  switchValue,
  onSwitchChange,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={showSwitch}
  >
    <View style={styles.settingLeft}>
      <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={styles.settingTitle}>{title}</Text>
    </View>
    {value && <Text style={styles.settingValue}>{value}</Text>}
    {showSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    )}
    {!showSwitch && !value && (
      <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [autoAccept, setAutoAccept] = React.useState(false);
  const { setIsAuthenticated } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="restaurant" size={40} color={theme.colors.primary} />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={20} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
        <Text style={styles.vendorName}>Pizza Paradise</Text>
        <Text style={styles.vendorType}>Restaurant</Text>
      </View>

      {/* Account Settings */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          onPress={() => {}}
        />
        <SettingItem
          icon="location-outline"
          title="Store Location"
          value="123 Main St, City"
          onPress={() => {}}
        />
        <SettingItem
          icon="time-outline"
          title="Business Hours"
          value="9:00 AM - 10:00 PM"
          onPress={() => {}}
        />
        <SettingItem
          icon="card-outline"
          title="Payment Methods"
          onPress={() => {}}
        />
      </Card>

      {/* Preferences */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          showSwitch={true}
          switchValue={notifications}
          onSwitchChange={setNotifications}
        />
        <SettingItem
          icon="checkmark-circle-outline"
          title="Auto-Accept Orders"
          showSwitch={true}
          switchValue={autoAccept}
          onSwitchChange={setAutoAccept}
        />
        <SettingItem
          icon="language-outline"
          title="Language"
          value="English"
          onPress={() => {}}
        />
        <SettingItem
          icon="color-palette-outline"
          title="Theme"
          value="Light"
          onPress={() => {}}
        />
      </Card>

      {/* Support & About */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support & About</Text>
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => {}}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms & Conditions"
          onPress={() => {}}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          onPress={() => {}}
        />
        <SettingItem
          icon="information-circle-outline"
          title="About"
          onPress={() => {}}
        />
      </Card>

      {/* Logout Button */}
      <Button
        title="Logout"
        variant="outline"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  vendorName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vendorType: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
  sectionCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
}); 