import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemProps {
  name: string;
  price: string;
  description: string;
  category: string;
  isAvailable: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  name,
  price,
  description,
  category,
  isAvailable,
}) => (
  <Card style={styles.menuItem}>
    <View style={styles.menuItemContent}>
      <View style={styles.menuItemImage}>
        <Ionicons name="fast-food" size={40} color={theme.colors.primary} />
      </View>
      <View style={styles.menuItemDetails}>
        <Text style={styles.menuItemName}>{name}</Text>
        <Text style={styles.menuItemDescription}>{description}</Text>
        <Text style={styles.menuItemPrice}>{price}</Text>
      </View>
      <View style={styles.menuItemActions}>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton}>
          <Ionicons name="trash" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.menuItemFooter}>
      <Text style={styles.menuItemCategory}>{category}</Text>
      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityText}>
          {isAvailable ? 'Available' : 'Not Available'}
        </Text>
        <View
          style={[
            styles.availabilityIndicator,
            {
              backgroundColor: isAvailable
                ? theme.colors.success
                : theme.colors.error,
            },
          ]}
        />
      </View>
    </View>
  </Card>
);

export const MenuScreen = () => {
  const menuItems: MenuItemProps[] = [
    {
      name: 'Margherita Pizza',
      price: '₹299',
      description: 'Classic tomato sauce, mozzarella, and basil',
      category: 'Pizza',
      isAvailable: true,
    },
    {
      name: 'Chicken Burger',
      price: '₹199',
      description: 'Grilled chicken patty with fresh vegetables',
      category: 'Burger',
      isAvailable: true,
    },
    {
      name: 'Pasta Alfredo',
      price: '₹249',
      description: 'Creamy white sauce pasta with parmesan',
      category: 'Pasta',
      isAvailable: false,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Items</Text>
        <Button
          title="Add New Item"
          onPress={() => {}}
          icon="add"
          style={styles.addButton}
        />
      </View>

      <ScrollView style={styles.menuList}>
        {menuItems.map((item, index) => (
          <MenuItem key={index} {...item} />
        ))}
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
  addButton: {
    width: 'auto',
  },
  menuList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  menuItem: {
    marginBottom: theme.spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemDetails: {
    flex: 1,
  },
  menuItemName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  menuItemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  menuItemPrice: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  menuItemCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 