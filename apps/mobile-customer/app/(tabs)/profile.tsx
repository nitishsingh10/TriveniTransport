import React, { useState, useEffect } from 'react';
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
  Award,
  Headphones,
  ChevronRight,
  LogOut,
  CheckCircle2,
  PackageCheck,
  Truck,
  User as UserIcon,
  Edit3,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { bookingApi } from '@/lib/api';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const list = await bookingApi.list();
        if (isMounted && Array.isArray(list)) {
          const completed = list.filter((b) => b.status === 'COMPLETED').length;
          const active = list.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status)).length;
          setCompletedCount(completed);
          setActiveCount(active);
          setTotalCount(list.length);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const isProfileIncomplete = !user?.phone || !user?.name || user.name === 'Valued Customer' || user.name === 'Customer';

  const MENU_ITEMS = [
    {
      icon: UserIcon,
      label: 'Personal & Contact Details',
      subtitle: user?.phone ? `${user.name} · ${user.phone}` : 'Complete your name and mobile number',
      onPress: () => router.push('/complete-profile' as any),
      highlight: isProfileIncomplete,
    },
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
      onPress: () => router.push('/(tabs)/bookings'),
    },
    {
      icon: ShieldCheck,
      label: 'Insurance & Privacy Policy',
      subtitle: '₹10L transit coverage terms',
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
            {(user?.name && user.name !== 'Valued Customer' ? user.name : 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.userName}>
            {user?.name && user.name !== 'Customer' ? user.name : 'Valued Customer'}
          </Text>
          <Text style={styles.userPhone}>
            {user?.phone ? user.phone : (user?.email || 'No phone number set')}
          </Text>
          <View style={isProfileIncomplete ? styles.incompleteBadge : styles.verifiedBadge}>
            {isProfileIncomplete ? (
              <AlertCircle size={12} color={Colors.warning} />
            ) : (
              <CheckCircle2 size={12} color={Colors.success} />
            )}
            <Text style={isProfileIncomplete ? styles.incompleteText : styles.verifiedText}>
              {isProfileIncomplete ? 'Profile Incomplete' : 'Verified Customer'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editProfilePill}
          onPress={() => router.push('/complete-profile' as any)}
          activeOpacity={0.8}
        >
          <Edit3 size={13} color={Colors.navy} />
          <Text style={styles.editProfileText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Incomplete Profile Callout Banner */}
      {isProfileIncomplete && (
        <TouchableOpacity
          style={styles.incompleteBanner}
          onPress={() => router.push('/complete-profile' as any)}
          activeOpacity={0.88}
        >
          <View style={styles.incompleteBannerLeft}>
            <AlertCircle size={18} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.incompleteBannerTitle}>Add your phone number</Text>
              <Text style={styles.incompleteBannerDesc}>
                Needed to assign verified drivers and send live GPS tracking updates.
              </Text>
            </View>
          </View>
          <View style={styles.completePillBtn}>
            <Text style={styles.completePillBtnText}>Complete</Text>
            <ChevronRight size={13} color={Colors.navy} />
          </View>
        </TouchableOpacity>
      )}

      {/* Real Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <PackageCheck size={18} color={Colors.navy} />
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed Moves</Text>
        </View>
        <View style={styles.statBox}>
          <Truck size={18} color={Colors.marigoldDark} />
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Moves</Text>
        </View>
        <View style={styles.statBox}>
          <Award size={18} color={Colors.navy} />
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
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
              style={[
                styles.menuItem,
                isLast && styles.menuItemLast,
                item.highlight && styles.menuItemHighlight,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  item.highlight && styles.menuIconHighlight,
                ]}
              >
                <ItemIcon size={18} color={item.highlight ? '#B45309' : Colors.navy} strokeWidth={2} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={[styles.menuLabel, item.highlight && styles.menuLabelHighlight]}>
                  {item.label}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={16} color={item.highlight ? '#B45309' : Colors.textMuted} />
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
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  verifiedText: {
    color: Colors.success,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  incompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  incompleteText: {
    color: '#B45309',
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  editProfileText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  incompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  incompleteBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  incompleteBannerTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },
  incompleteBannerDesc: {
    fontSize: FontSize.xxs,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 14,
  },
  completePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.marigold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  completePillBtnText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
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
  menuItemHighlight: {
    backgroundColor: '#FFFBEB',
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
  menuIconHighlight: {
    backgroundColor: '#FDE68A',
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
  menuLabelHighlight: {
    color: '#92400E',
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

