import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import Card from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  isUp?: boolean;
  changePercent?: number;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = COLORS.primary,
  isUp,
  changePercent
}: StatCardProps) => {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        
        {changePercent !== undefined && (
          <View style={[
            styles.changeContainer, 
            { backgroundColor: isUp ? COLORS.success + '15' : COLORS.error + '15' }
          ]}>
            <Text style={[
              styles.changeText,
              { color: isUp ? COLORS.success : COLORS.error }
            ]}>
              {isUp ? '↑' : '↓'} {changePercent}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 16,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  title: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    ...FONTS.body4Medium,
    fontSize: 10,
  },
});

export default StatCard;