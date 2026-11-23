import React from 'react';
import { Tabs, Redirect, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck,
  Navigation,
  Wallet,
  User,
  PhoneCall,
} from 'lucide-react-native';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

function DriverHeader() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isOnline = useAuthStore((s) => s.isOnline);
  const toggleOnline = useAuthStore((s) => s.toggleOnline);
  const verificationStatus = useOnboardingStore((s) => s.verificationStatus);
  const approved = verificationStatus === 'approved';
  const dutyEnabled = approved && isOnline;

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
          <Text style={styles.driverTagText}>PARTNER</Text>
        </View>
      </View>

      {/* Online/Offline status switch and operations contact */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.dutyPill, dutyEnabled ? styles.dutyPillOnline : styles.dutyPillOffline]}
          onPress={() => approved ? toggleOnline() : router.push('/(auth)/onboarding' as any)}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, dutyEnabled ? styles.dotGreen : styles.dotGray]} />
          <Text style={[styles.dutyText, dutyEnabled ? styles.dutyTextOnline : styles.dutyTextOffline]}>
            {approved ? (isOnline ? 'ONLINE' : 'OFFLINE') : 'VERIFY'}
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
  const { colors: Colors } = useAppTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  // During cold launch hydration, keep screen empty (splash screen is visible)
  if (!isHydrated) {
    return null;
  }

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
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          ...Shadow.sm,
        },
        tabBarActiveTintColor: Colors.text,
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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
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
    color: Colors.text,
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
    color: Colors.text,
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
    color: Colors.text,
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
    backgroundColor: Colors.navyMuted,
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
    backgroundColor: Colors.brandSurface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
});
