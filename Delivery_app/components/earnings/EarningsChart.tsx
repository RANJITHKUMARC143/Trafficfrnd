import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { COLORS, FONTS } from '@/constants/theme';

interface EarningsChartProps {
  data: {
    day: string;
    earnings: number;
  }[];
  timeframe: 'daily' | 'weekly' | 'monthly';
}

const EarningsChart = ({ data, timeframe }: EarningsChartProps) => {
  const chartWidth = Math.max(Dimensions.get('window').width - 40, data.length * 50);
  
  const formatXAxis = (tick: string) => {
    if (timeframe === 'daily') {
      // Return hour format for daily view
      return tick;
    } else if (timeframe === 'weekly') {
      // Return shortened day name for weekly view
      return tick.substring(0, 3);
    } else {
      // Return day number for monthly view
      return tick;
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No earnings data available</Text>
      </View>
    );
  }
  
  const chartData = {
    labels: data.map(item => formatXAxis(item.day)),
    datasets: [
      {
        data: data.map(item => item.earnings)
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => COLORS.primary,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 2,
    formatYLabel: (value: string) => `₹${value}`,
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Earnings ({timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'})
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContainer}
      >
        <BarChart
          data={chartData}
          width={chartWidth}
          height={220}
          yAxisLabel="₹"
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars
          fromZero
          style={styles.chart}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  chartContainer: {
    paddingHorizontal: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default EarningsChart;