import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Home, Package, Headphones, User, PhoneCall } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

interface TabBarIconProps {
  name: 'home' | 'bookings' | 'support' | 'profile';
  label: string;
  focused: boolean;
}

function TabBarIcon({ name, label, focused }: TabBarIconProps) {
  const iconColor = focused ? Colors.navy : Colors.tabInactive;
  const strokeWidth = focused ? 2.4 : 1.8;

  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        {name === 'home' && <Home size={21} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'bookings' && <Package size={21} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'support' && <Headphones size={21} color={iconColor} strokeWidth={strokeWidth} />}
        {name === 'profile' && <User size={21} color={iconColor} strokeWidth={strokeWidth} />}
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function HeaderBrand() {
  return (
    <View style={styles.headerBrand}>
      <Image
        source={require('@/assets/logo-cropped.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <View style={styles.headerBrandText}>
        <Text style={styles.headerTitle}>TRIVENI</Text>
        <View style={styles.subRow}>
          <View style={styles.subDash} />
          <Text style={styles.headerSubtitle}>TRANSPORTS</Text>
          <View style={styles.subDash} />
        </View>
      </View>
    </View>
  );
}

function HeaderCallButton() {
  return (
    <TouchableOpacity
      style={styles.headerCallBtn}
      onPress={() => Linking.openURL('tel:8828647785')}
      activeOpacity={0.8}
    >
      <PhoneCall size={14} color={Colors.navy} />
      <Text style={styles.headerCallText}>8828647785</Text>
    </TouchableOpacity>
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
        headerStyle: {
          backgroundColor: Colors.headerBackground,
          borderBottomColor: Colors.headerBorder,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.navy,
        headerTitleAlign: 'left',
        headerTitle: () => <HeaderBrand />,
        headerRight: () => <HeaderCallButton />,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.navy,
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopColor: Colors.tabBorder,
    borderTopWidth: 1,
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: Colors.navy,
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
    color: Colors.navy,
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
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerBrandText: {
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.navy,
    fontSize: 15,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.5,
    lineHeight: 16,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subDash: {
    width: 10,
    height: 1.5,
    backgroundColor: Colors.marigold,
    borderRadius: 1,
  },
  headerSubtitle: {
    color: Colors.navy,
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
  },
  headerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    marginRight: Spacing.md,
    backgroundColor: Colors.marigoldSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
  },
  headerCallText: {
    color: Colors.navy,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
});
