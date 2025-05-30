import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme/theme';
import { menuService, MenuItem } from '../services/menuService';

type MenuStackParamList = {
  MenuList: undefined;
  MenuItemDetail: { item: MenuItem };
  MenuItemForm: { mode: 'add' | 'edit'; initialData?: MenuItem };
};

type MenuItemDetailScreenNavigationProp = NativeStackNavigationProp<MenuStackParamList>;

export const MenuItemDetailScreen = () => {
  const navigation = useNavigation<MenuItemDetailScreenNavigationProp>();
  const route = useRoute();
  const { item } = route.params as {
    item: MenuItem;
  };

  const handleEdit = () => {
    // @ts-ignore
    navigation.navigate('MenuItemForm', {
      mode: 'edit',
      initialData: item,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await menuService.deleteMenuItem(item._id);
            navigation.goBack();
            } catch (error) {
              console.error('Error deleting menu item:', error);
              Alert.alert('Error', 'Failed to delete menu item');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Item Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Image source={{ uri: item.image }} style={styles.image} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <View
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: item.isAvailable
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            >
              <Text style={styles.availabilityText}>
                {item.isAvailable ? 'Available' : 'Not Available'}
              </Text>
            </View>
          </View>

          <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
          
          <View style={styles.categoryContainer}>
            <Ionicons name="restaurant" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.category}>{item.category}</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  availabilityText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  price: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
}); 