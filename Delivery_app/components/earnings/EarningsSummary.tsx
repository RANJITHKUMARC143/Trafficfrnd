import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import Card from '../common/Card';

interface EarningsSummaryProps {
  currentEarnings: number;
  previousEarnings: number;
  deliveryCount: number;
  totalHours: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
}

const EarningsSummary = ({ 
  currentEarnings,
  previousEarnings,
  deliveryCount,
  totalHours,
  timeframe
}: EarningsSummaryProps) => {
  const percentChange = previousEarnings > 0 
    ? ((currentEarnings - previousEarnings) / previousEarnings * 100).toFixed(1)
    : '0.0';
    
  const isUp = currentEarnings >= previousEarnings;
  
  const getPeriodText = () => {
    switch (timeframe) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return '';
    }
  };
  
  const getPreviousPeriodText = () => {
    switch (timeframe) {
      case 'daily':
        return 'Yesterday';
      case 'weekly':
        return 'Last Week';
      case 'monthly':
        return 'Last Month';
      default:
        return '';
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getPeriodText()} Earnings</Text>
        <View style={[
          styles.changeContainer, 
          { backgroundColor: isUp ? COLORS.success + '15' : COLORS.error + '15' }
        ]}>
          <Text style={[
            styles.changeText,
            { color: isUp ? COLORS.success : COLORS.error }
          ]}>
            {isUp ? '↑' : '↓'} {percentChange}%
          </Text>
        </View>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.dollarSign}>₹</Text>
        <Text style={styles.amount}>{currentEarnings.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.comparisonText}>
        {isUp ? 'Up' : 'Down'} from ₹{previousEarnings.toFixed(2)} {getPreviousPeriodText()}
      </Text>
      
      <View style={styles.divider} />
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{deliveryCount}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        
        <View style={styles.verticalDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalHours}</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        
        <View style={styles.verticalDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{(currentEarnings / totalHours).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Per Hour</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.darkGray,
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    ...FONTS.body4Medium,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dollarSign: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginTop: 6,
  },
  amount: {
    ...FONTS.largeTitle,
    color: COLORS.darkGray,
    lineHeight: 48,
  },
  comparisonText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.ultraLightGray,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.body2Medium,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.ultraLightGray,
  },
});

export default EarningsSummary;