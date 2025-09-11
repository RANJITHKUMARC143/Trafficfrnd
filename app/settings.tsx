import React, { useState } from 'react';
import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigationBar from '@/components/BottomNavigationBar';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={styles.subtitle}>Personalize your experience</ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Preferences</ThemedText>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="notifications-outline" size={18} color="#4CAF50" /></View>
            <ThemedText style={styles.rowTitle}>Notifications</ThemedText>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="location-outline" size={18} color="#4CAF50" /></View>
            <ThemedText style={styles.rowTitle}>Location Access</ThemedText>
          </View>
          <Switch value={location} onValueChange={setLocation} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="moon-outline" size={18} color="#4CAF50" /></View>
            <ThemedText style={styles.rowTitle}>Dark Mode</ThemedText>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Account</ThemedText>
        <TouchableOpacity style={styles.row} activeOpacity={0.8}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="lock-closed-outline" size={18} color="#4CAF50" /></View>
            <ThemedText style={styles.rowTitle}>Change Password</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.8}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="help-circle-outline" size={18} color="#4CAF50" /></View>
            <ThemedText style={styles.rowTitle}>Help & Support</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <BottomNavigationBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 24, paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitle: { marginTop: 2, color: '#666' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eaf7ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
});


