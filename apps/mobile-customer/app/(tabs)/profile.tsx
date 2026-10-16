import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  Bell,
  ShieldCheck,
  FileText,
  Globe,
  Star,
  Headphones,
  ChevronRight,
  LogOut,
  CheckCircle2,
  PackageCheck,
  Weight,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const MENU_ITEMS = [
    {
      icon: MapPin,
      label: 'Saved Addresses',
      subtitle: 'Home, office, and frequent destinations',
      onPress: () => {},
    },
    {
      icon: Bell,
      label: 'Notification Preferences',
      subtitle: 'SMS, WhatsApp, and push tracking alerts',
      onPress: () => {},
    },
    {
      icon: FileText,
      label: 'Invoices & Receipts',
      subtitle: 'Tax invoices and GST documentation',
      onPress: () => {},
    },
    {
      icon: ShieldCheck,
      label: 'Insurance & Privacy Policy',
      subtitle: '₹10L transit coverage terms',
      onPress: () => {},
    },
    {
      icon: Globe,
      label: 'App Language',
      subtitle: 'English (India)',
      onPress: () => {},
    },
    {
      icon: Star,
      label: 'Rate Experience',
      subtitle: 'Help us improve service quality',
      onPress: () => {},
    },
    {
      icon: Headphones,
      label: '24/7 Customer Care',
      subtitle: 'Direct support helpline (8828647785)',
      onPress: () => router.push('/(tabs)/support'),
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar / User Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {(user?.name ?? 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.userName}>{user?.name ?? 'Valued Customer'}</Text>
          <Text style={styles.userPhone}>{user?.phone ?? '+91 98765 43210'}</Text>
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={12} color={Colors.success} />
            <Text style={styles.verifiedText}>Verified Customer</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <PackageCheck size={18} color={Colors.navy} />
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Completed Moves</Text>
        </View>
        <View style={styles.statBox}>
          <Weight size={18} color={Colors.navy} />
          <Text style={styles.statValue}>1.4 T</Text>
          <Text style={styles.statLabel}>Goods Relocated</Text>
        </View>
        <View style={styles.statBox}>
          <Star size={18} color={Colors.marigold} fill={Colors.marigold} />
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Avg Experience</Text>
        </View>
      </View>

      {/* Account Settings Menu */}
      <Text style={styles.menuSectionHeader}>Account & Settings</Text>
      <View style={styles.menu}>
        {MENU_ITEMS.map((item, index) => {
          const ItemIcon = item.icon;
          const isLast = index === MENU_ITEMS.length - 1;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, isLast && styles.menuItemLast]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <ItemIcon size={18} color={Colors.navy} strokeWidth={2} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={16} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out from Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Triveni Transports — Mobile Customer v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.marigold,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.glowSm,
  },
  avatarInitial: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
  },
  profileDetails: { flex: 1, gap: 2 },
  userName: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },
  userPhone: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  verifiedText: {
    color: Colors.success,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statValue: {
    color: Colors.navyDark,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
    textAlign: 'center',
  },

  menuSectionHeader: {
    color: Colors.textMuted,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  menuSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    marginTop: Spacing.xs,
  },
  logoutText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  version: {
    color: Colors.textMuted,
    fontSize: FontSize.xxs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
