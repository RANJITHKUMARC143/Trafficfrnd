import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { ThemedText } from './ThemedText';
import { fetchAlerts } from '@lib/services/alertService';

interface TabItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  label: string;
}

const tabs: TabItem[] = [
  { name: 'home', icon: 'home', route: '/(tabs)', label: 'Home' },
  { name: 'search', icon: 'search', route: '/(tabs)/search', label: 'Search' },
  { name: 'map', icon: 'map', route: '/map', label: 'Map' },
  { name: 'alerts', icon: 'notifications', route: '/alerts', label: 'Alerts' },
  { name: 'profile', icon: 'person', route: '/profile', label: 'Profile' },
];

interface BottomNavigationBarProps {
  keyboardOpen?: boolean;
}

export default function BottomNavigationBar({ keyboardOpen = false }: BottomNavigationBarProps) {
  const pathname = usePathname();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  const isActiveTab = (route: string) => {
    if (route === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/';
    }
    return pathname === route || pathname.startsWith(route);
  };

  // Load unread alerts count on interval and route changes
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const alerts = await fetchAlerts();
        if (!mounted) return;
        const unread = (alerts || []).filter((a: any) => a && a.read === false).length;
        setUnreadAlerts(unread);
      } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(t); };
  }, [pathname]);

  if (keyboardOpen) {
    return null;
  }

  return (
    <View style={styles.enhancedBottomNavBar} pointerEvents="box-none">
      <View style={styles.navBarContainer}>
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.route);
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.route as any)}
              style={[styles.navTab, isActive && styles.activeTab]}
              activeOpacity={0.7}
            >
              <View style={styles.navTabContent}>
                {isActive && <View style={styles.activeTabIndicator} />}
                <View>
                  <Ionicons 
                    name={tab.icon} 
                    size={24} 
                    color={isActive ? '#3d7a00' : '#666'} 
                  />
                  {tab.name === 'alerts' && unreadAlerts > 0 && (
                    <View style={styles.alertBadge}>
                      <ThemedText style={styles.alertBadgeText}>
                        {unreadAlerts > 9 ? '9+' : String(unreadAlerts)}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={[
                  styles.navTabLabel,
                  isActive && styles.activeTabLabel
                ]}>
                  {tab.label}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  enhancedBottomNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 2000,
    elevation: 20,
    paddingBottom: 0,
  },
  navBarContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 70,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#f0f8f0',
  },
  navTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3d7a00',
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  activeTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3d7a00',
    marginTop: 4,
    textAlign: 'center',
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
