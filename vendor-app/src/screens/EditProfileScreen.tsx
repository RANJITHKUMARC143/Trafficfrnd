import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { profileService, VendorProfile } from '../services/profileService';
import { useNavigation, useRoute } from '@react-navigation/native';

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialProfile = route.params?.profile as VendorProfile;

  const [profile, setProfile] = useState<VendorProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!profile.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!profile.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    if (!profile.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (profile.address) {
      if (!profile.address.street.trim()) {
        newErrors['address.street'] = 'Street address is required';
      }
      if (!profile.address.city.trim()) {
        newErrors['address.city'] = 'City is required';
      }
      if (!profile.address.state.trim()) {
        newErrors['address.state'] = 'State is required';
      }
      if (!profile.address.zipCode.trim()) {
        newErrors['address.zipCode'] = 'ZIP code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const updatedProfile = await profileService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof VendorProfile],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={[styles.input, errors.businessName && styles.inputError]}
              value={profile.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              placeholder="Enter business name"
            />
            {errors.businessName && (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name</Text>
            <TextInput
              style={[styles.input, errors.ownerName && styles.inputError]}
              value={profile.ownerName}
              onChangeText={(value) => updateField('ownerName', value)}
              placeholder="Enter owner name"
            />
            {errors.ownerName && (
              <Text style={styles.errorText}>{errors.ownerName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={profile.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street</Text>
            <TextInput
              style={[styles.input, errors['address.street'] && styles.inputError]}
              value={profile.address?.street}
              onChangeText={(value) => updateField('address.street', value)}
              placeholder="Enter street address"
            />
            {errors['address.street'] && (
              <Text style={styles.errorText}>{errors['address.street']}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={[styles.input, errors['address.city'] && styles.inputError]}
              value={profile.address?.city}
              onChangeText={(value) => updateField('address.city', value)}
              placeholder="Enter city"
            />
            {errors['address.city'] && (
              <Text style={styles.errorText}>{errors['address.city']}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={[styles.input, errors['address.state'] && styles.inputError]}
              value={profile.address?.state}
              onChangeText={(value) => updateField('address.state', value)}
              placeholder="Enter state"
            />
            {errors['address.state'] && (
              <Text style={styles.errorText}>{errors['address.state']}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={[styles.input, errors['address.zipCode'] && styles.inputError]}
              value={profile.address?.zipCode}
              onChangeText={(value) => updateField('address.zipCode', value)}
              placeholder="Enter ZIP code"
              keyboardType="numeric"
            />
            {errors['address.zipCode'] && (
              <Text style={styles.errorText}>{errors['address.zipCode']}</Text>
            )}
          </View>
        </View>
      </View>
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
  saveButton: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
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
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
}); 