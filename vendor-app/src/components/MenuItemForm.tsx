import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import * as FileSystem from 'expo-file-system';
import { menuService } from '../services/menuService';

const CATEGORIES = [
  'main_course',
  'starters',
  'appetizers',
  'desserts',
  'beverages',
  'sides',
  'specials',
  'breakfast',
  'lunch',
  'dinner',
];

export const MenuItemForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, initialData } = route.params as {
    mode: 'add' | 'edit';
    initialData?: any;
  };

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
  const [image, setImage] = useState(initialData?.image || '');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const pickImage = async () => {
    try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
        base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !price || !category || !image) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (description.length < 10 || description.length > 500) {
      Alert.alert('Error', 'Description must be between 10 and 500 characters');
      return;
    }

    if (!CATEGORIES.includes(category)) {
      Alert.alert('Error', 'Please select a valid category');
      return;
    }

    try {
      setLoading(true);
      const base64Image = await convertImageToBase64(image);
      
      const formData = {
        name: name.trim(),
        description: description.trim(),
      price: parseFloat(price),
        image: base64Image,
        category: category.toLowerCase(),
      isAvailable,
      };

      console.log('Submitting form data:', { ...formData, image: 'base64_image_data' });

      if (mode === 'add') {
        await menuService.addMenuItem(formData);
        Alert.alert('Success', 'Menu item added successfully');
      } else if (mode === 'edit' && initialData?._id) {
        await menuService.updateMenuItem(initialData._id, formData);
        Alert.alert('Success', 'Menu item updated successfully');
      }

      // Navigate back to menu list
      navigation.goBack();
    } catch (error: any) {
      console.error('Error handling form submission:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save menu item. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory.toLowerCase());
    setShowCategoryModal(false);
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryItem,
                  category === cat && styles.categoryItemSelected,
                ]}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    category === cat && styles.categoryItemTextSelected,
                  ]}
                >
                  {cat.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
                {category === cat && (
                  <Ionicons 
                    name="checkmark" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'add' ? 'Add Item' : 'Edit Item'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={styles.placeholderText}>Add Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Item description"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.categorySelectorText, !category && styles.placeholderText]}>
              {category || 'Select a category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.availabilityContainer}>
          <Text style={styles.label}>Availability</Text>
          <TouchableOpacity
            style={styles.availabilityToggle}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View
              style={[
                styles.toggleButton,
                { backgroundColor: isAvailable ? theme.colors.success : theme.colors.error },
              ]}
            />
          </TouchableOpacity>
          <Text style={styles.availabilityText}>
            {isAvailable ? 'Available' : 'Not Available'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Item' : 'Update Item'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {renderCategoryModal()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  form: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  placeholderText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  inputGroup: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categorySelectorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  categoryList: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  categoryItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  categoryItemText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  categoryItemTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  availabilityToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    padding: 2,
    marginRight: 8,
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
  },
  availabilityText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
}); 