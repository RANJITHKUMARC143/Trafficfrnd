import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { profileService, VendorProfile } from '../services/profileService';

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
    <View style={styles.settingRight}>
      {value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : null}
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
        />
      ) : null}
      {!showSwitch && !value ? (
        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
      ) : null}
    </View>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = React.useState(true);
  const [autoAccept, setAutoAccept] = React.useState(false);
  const { logout } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updatedProfile = await profileService.toggleOpenStatus();
      setProfile(updatedProfile);
      Alert.alert(
        'Status Updated',
        `Your restaurant is now ${updatedProfile.isOpen ? 'open' : 'closed'}`
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No profile data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile', { profile })}
        >
          <Ionicons name="pencil" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{profile.businessName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{profile.ownerName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{profile.email || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{profile.phone || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {profile.address ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{profile.address.street || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {profile.address.city && profile.address.state && profile.address.zipCode
                  ? `${profile.address.city}, ${profile.address.state} ${profile.address.zipCode}`
                  : 'Not set'}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {profile.cuisine && profile.cuisine.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine</Text>
          <View style={styles.cuisineContainer}>
            {profile.cuisine.map((item, index) => (
              <View key={index} style={styles.cuisineTag}>
                <Text style={styles.cuisineText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {profile.openingHours ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          <View style={styles.infoCard}>
            {Object.entries(profile.openingHours).map(([day, hours]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.hoursText}>
                  {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Closed'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: profile.isOpen ? theme.colors.success : theme.colors.error }
          ]}
          onPress={handleToggleStatus}
        >
          <Text style={styles.statusButtonText}>
            {profile.isOpen ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      {profile.rating ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={24} color={theme.colors.warning} />
            <Text style={styles.ratingText}>
              {profile.rating.toFixed(1)} ({profile.totalRatings} ratings)
            </Text>
          </View>
        </View>
      ) : null}

      {/* Account Settings */}
      <Card style={styles.sectionCard}>
        <View>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile', { profile })}
          />
          <SettingItem
            icon="location-outline"
            title="Store Location"
            value={profile.address ? `${profile.address.street}, ${profile.address.city}` : 'Not set'}
            onPress={() => {}}
          />
          <SettingItem
            icon="time-outline"
            title="Business Hours"
            value="Set Hours"
            onPress={() => {}}
          />
          <SettingItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => {}}
          />
        </View>
      </Card>

      {/* Preferences */}
      <Card style={styles.sectionCard}>
        <View>
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
        </View>
      </Card>

      {/* Support & About */}
      <Card style={styles.sectionCard}>
        <View>
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
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  cuisineTag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cuisineText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dayText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  hoursText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statusButton: {
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  sectionCard: {
    margin: theme.spacing.md,
  },
  logoutButton: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  settingValue: {
    marginRight: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
}); 