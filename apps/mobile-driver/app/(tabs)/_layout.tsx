import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import {
  Truck,
  Navigation,
  Wallet,
  User,
  PhoneCall,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

function DriverHeader() {
  const isOnline = useAuthStore((s) => s.isOnline);
  const toggleOnline = useAuthStore((s) => s.toggleOnline);

  return (
    <View style={styles.header}>
      {/* Brand logo & portal title */}
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/logo-cropped.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.titleBlock}>
          <Text style={styles.brandName}>TRIVENI</Text>
          <View style={styles.subRow}>
            <View style={styles.subDash} />
            <Text style={styles.brandSubtitle}>TRANSPORTS</Text>
            <View style={styles.subDash} />
          </View>
        </View>
        <View style={styles.driverTag}>
          <Text style={styles.driverTagText}>DRIVER</Text>
        </View>
      </View>

      {/* Online/Offline status switch + 24/7 hotline */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.dutyPill, isOnline ? styles.dutyPillOnline : styles.dutyPillOffline]}
          onPress={() => toggleOnline()}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, isOnline ? styles.dotGreen : styles.dotGray]} />
          <Text style={[styles.dutyText, isOnline ? styles.dutyTextOnline : styles.dutyTextOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helplineBtn}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.85}
        >
          <PhoneCall size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <DriverHeader />,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopColor: Colors.tabBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          ...Shadow.sm,
        },
        tabBarActiveTintColor: Colors.navy,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Duties',
          tabBarIcon: ({ color, size }) => <Truck size={size - 2} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active Move',
          tabBarIcon: ({ color, size }) => <Navigation size={size - 2} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <Wallet size={size - 2} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.headerBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm + 4,
    ...Shadow.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
    letterSpacing: 1.5,
    lineHeight: 15,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  subDash: {
    width: 8,
    height: 1.5,
    backgroundColor: Colors.marigold,
    borderRadius: 1,
  },
  brandSubtitle: {
    fontSize: 7.5,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
    letterSpacing: 1.2,
  },
  driverTag: {
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: 2,
  },
  driverTagText: {
    fontSize: 8.5,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dutyPillOnline: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  dutyPillOffline: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.cardBorder,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotGreen: {
    backgroundColor: Colors.success,
  },
  dotGray: {
    backgroundColor: Colors.textMuted,
  },
  dutyText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  dutyTextOnline: {
    color: Colors.success,
  },
  dutyTextOffline: {
    color: Colors.textMuted,
  },
  helplineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
});
