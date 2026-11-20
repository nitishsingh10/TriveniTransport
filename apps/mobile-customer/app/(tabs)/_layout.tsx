import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Package, Headphones, User, PhoneCall } from 'lucide-react-native';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { isCustomerProfileComplete } from '@/lib/customerProfile';

interface TabBarIconProps {
  name: 'home' | 'bookings' | 'support' | 'profile';
  label: string;
  focused: boolean;
}

function TabBarIcon({ name, label, focused }: TabBarIconProps) {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const iconColor = focused ? Colors.text : Colors.tabInactive;
  const strokeWidth = focused ? 2.4 : 1.8;

  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        {name === 'home' && <Home size={20} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'bookings' && <Package size={20} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'support' && <Headphones size={20} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'profile' && <User size={20} color={iconColor} strokeWidth={strokeWidth} />}
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function HeaderBrand() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.headerBrand}>
      <View style={styles.logoBadge}>
        <Image
          source={require('@/assets/logo-cropped.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.headerBrandText}>
        <Text style={styles.headerTitle}>Triveni</Text>
        <Text style={styles.headerSubtitle}>TRANSPORTS</Text>
      </View>
    </View>
  );
}

function HeaderCallButton() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      style={styles.headerCallBtn}
      onPress={() => Linking.openURL('tel:8828647785')}
      activeOpacity={0.8}
      accessibilityLabel="Call 24/7 Helpline"
    >
      <PhoneCall size={13} color={Colors.text} strokeWidth={2.4} />
      <Text style={styles.headerCallText}>Help 24/7</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  // During cold launch hydration, keep screen empty (splash screen is visible)
  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // If user signed up with email but has not completed their profile with name & phone
  if (user?.email && !isCustomerProfileComplete(user)) {
    return <Redirect href={'/complete-profile' as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.headerBackground,
          borderBottomColor: Colors.headerBorder,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.text,
        headerTitleAlign: 'left',
        headerTitle: () => <HeaderBrand />,
        headerRight: () => <HeaderCallButton />,
        tabBarStyle: [styles.tabBar, { height: 56 + bottomInset, paddingBottom: bottomInset }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="bookings" label="Bookings" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="support" label="Support" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="profile" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopColor: Colors.tabBorder,
    borderTopWidth: 1,
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: Colors.brandSurface,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  iconWrapperFocused: {
    backgroundColor: Colors.navySubtle,
  },
  label: {
    fontSize: FontSize.xxs,
    color: Colors.tabInactive,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.marigold,
  },

  // Header
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: Spacing.xs,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerLogo: {
    width: 26,
    height: 26,
  },
  headerBrandText: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  headerSubtitle: {
    color: Colors.marigoldDark,
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  headerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerCallText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.1,
  },
});
