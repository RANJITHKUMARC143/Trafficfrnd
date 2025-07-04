import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/common/Screen';
import { COLORS, FONTS } from '@/constants/theme';
import { Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { registerUser, UserData } from '@/utils/auth';

const VEHICLE_TYPES = ['Walker', 'Bike'];

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

  const handleRegister = async () => {
    try {
      // Validate form data
      if (!formData.fullName || !formData.email || !formData.phone || 
          !formData.password || !formData.confirmPassword || 
          !formData.vehicleType || !formData.vehicleNumber) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setIsLoading(true);
      console.log('Starting registration process...');

      // Create user data object
      const userData: UserData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
      };

      console.log('Attempting to register user with data:', { ...userData, password: '***' });

      // Register user
      const success = await registerUser(userData);
      console.log('Registration result:', success);
      
      if (success) {
        // Show success message and navigate to login
        Alert.alert(
          'Success',
          'Registration successful! Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Navigating to login screen...');
                router.replace('/auth/login');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'Failed to register. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectVehicleType = (type: string) => {
    setFormData({ ...formData, vehicleType: type });
    setShowVehicleTypeModal(false);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start delivering</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={COLORS.gray} />
              ) : (
                <Eye size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={COLORS.gray} />
              ) : (
                <Eye size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowVehicleTypeModal(true)}
          >
            <View style={styles.vehicleTypeSelector}>
              <Text style={[
                styles.vehicleTypeText,
                !formData.vehicleType && styles.placeholderText
              ]}>
                {formData.vehicleType || 'Select vehicle type'}
              </Text>
              <ChevronDown size={20} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleNumber}
            onChangeText={(text) => setFormData({ ...formData, vehicleNumber: text })}
            placeholder={formData.vehicleType === 'Walker' ? 'Enter your ID number' : 'Enter your vehicle number'}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>{isLoading ? 'Registering...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showVehicleTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVehicleTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle Type</Text>
            </View>
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => selectVehicleType(type)}
              >
                <Text style={[
                  styles.modalOptionText,
                  formData.vehicleType === type && styles.selectedOptionText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 24,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.body2,
    color: COLORS.gray,
    textAlign: 'center',
  },
  form: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONTS.body4Medium,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.ultraLightGray,
    borderRadius: 8,
    padding: 12,
    ...FONTS.body3,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  vehicleTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleTypeText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  registerButtonText: {
    ...FONTS.body2Medium,
    color: COLORS.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  loginLink: {
    ...FONTS.body3Medium,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ultraLightGray,
  },
  modalTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ultraLightGray,
  },
  modalOptionText: {
    ...FONTS.body2,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: COLORS.primary,
    ...FONTS.body2Medium,
  },
}); 