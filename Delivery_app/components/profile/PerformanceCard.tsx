import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import Card from '../common/Card';

interface PerformanceCardProps {
  title: string;
  value: string | number;
  maxValue?: number;
  icon: React.ReactNode;
  color?: string;
}

const PerformanceCard = ({ 
  title, 
  value, 
  maxValue, 
  icon,
  color = COLORS.primary
}: PerformanceCardProps) => {
  // Calculate percentage if maxValue is provided
  const percentage = maxValue ? Math.min(Math.round((Number(value) / maxValue) * 100), 100) : null;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
      </View>

      <Text style={styles.value}>{value}</Text>

      {percentage !== null && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${percentage}%`,
                  backgroundColor: color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{percentage}%</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...FONTS.body3Medium,
    color: COLORS.darkGray,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...FONTS.h2,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.ultraLightGray,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...FONTS.body4Medium,
    color: COLORS.gray,
    width: 40,
    textAlign: 'right',
  },
});

export default PerformanceCard;