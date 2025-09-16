import React from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@cmp/ThemedText';
import { ThemedView } from '@cmp/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigationBar from '@cmp/_components/BottomNavigationBar';

type PaymentItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export default function PaymentsScreen() {
  const items: PaymentItem[] = [
    { id: '1', title: 'Payment Methods', subtitle: 'UPI, Cards, Wallets', icon: 'card-outline' },
    { id: '2', title: 'Transactions', subtitle: 'Your recent payments', icon: 'receipt-outline' },
    { id: '3', title: 'Refunds', subtitle: 'Track refund status', icon: 'cash-outline' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Payments</ThemedText>
        <ThemedText style={styles.subtitle}>Manage methods and view history</ThemedText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.9} onPress={item.onPress}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color="#4CAF50" />
              </View>
              <View>
                <ThemedText style={styles.rowTitle}>{item.title}</ThemedText>
                {!!item.subtitle && (
                  <ThemedText style={styles.rowSubtitle}>{item.subtitle}</ThemedText>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomNavigationBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 24, paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitle: { marginTop: 2, color: '#666' },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 80 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eaf7ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  rowSubtitle: { marginTop: 2, color: '#777', fontSize: 12 },
  separator: { height: 12 },
});


