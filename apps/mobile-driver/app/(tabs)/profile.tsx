import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Truck,
  ShieldCheck,
  Star,
  FileText,
  PhoneCall,
  LogOut,
  ChevronRight,
  Award,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function DriverProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleSignOut = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Driver Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <User size={28} color={Colors.navy} strokeWidth={2.4} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>Rajesh Kumar</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.driverPhone}>+91 {user?.phone || '98888 88888'}</Text>
            <Text style={styles.partnerId}>Partner ID: TRV-DRV-1049</Text>
          </View>
        </View>

        {/* Badges / Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={styles.metricValueRow}>
              <Star size={13} color={Colors.marigold} fill={Colors.marigold} />
              <Text style={styles.metricValue}>4.9</Text>
            </View>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>340+</Text>
            <Text style={styles.metricLabel}>Completed Moves</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>99.4%</Text>
            <Text style={styles.metricLabel}>On-Time Arrival</Text>
          </View>
        </View>
      </View>

      {/* Assigned Commercial Vehicle Details */}
      <View style={styles.vehicleCard}>
        <View style={styles.cardTitleRow}>
          <Truck size={17} color={Colors.navy} />
          <Text style={styles.cardTitle}>Assigned Vehicle</Text>
        </View>

        <View style={styles.vehicleDetailsRow}>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Vehicle Model</Text>
            <Text style={styles.specValue}>Tata 407</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Capacity</Text>
            <Text style={styles.specValue}>600 CFT</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Reg. Number</Text>
            <Text style={styles.specValue}>MH12 CD 5678</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Commercial Permit</Text>
            <Text style={[styles.specValue, { color: Colors.success }]}>Valid till 2028</Text>
          </View>
        </View>

        <View style={styles.complianceRow}>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>Fitness Certificate</Text>
          </View>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>Commercial Insurance</Text>
          </View>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>PUC Certified</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <PhoneCall size={16} color={Colors.navy} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>24/7 Operations Desk Helpline</Text>
            <Text style={styles.menuSubtitle}>8828647785 · Direct Dispatcher Link</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Safety Standards', 'Opening Material Handling & Safety Guide.')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <FileText size={16} color={Colors.navy} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Safety & Packaging Standards</Text>
            <Text style={styles.menuSubtitle}>Handling protocols & strapping guide</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Partner Incentives', 'Festive bonus active: ₹1,500 on 10 zero-damage moves per week.')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Award size={16} color={Colors.marigoldDark} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Partner Rewards & Incentives</Text>
            <Text style={styles.menuSubtitle}>Weekly zero-damage bonus</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        activeOpacity={0.85}
      >
        <LogOut size={16} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out from Portal</Text>
      </TouchableOpacity>

      <Text style={styles.appVersionText}>Triveni Driver App v1.0.0 (Build 2026.10)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    ...Shadow.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1.5,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  driverPhone: {
    fontSize: FontSize.xs,
    color: Colors.navy,
    fontWeight: FontWeight.medium,
  },
  partnerId: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  vehicleSpecBox: {
    width: '48.5%',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 2,
  },
  specLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  specValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceText: {
    fontSize: 10,
    color: Colors.navyDark,
    fontWeight: FontWeight.medium,
  },

  // Menu Card
  menuCard: {
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
    gap: Spacing.md,
    padding: Spacing.md,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  menuSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginLeft: 56,
  },

  // Sign out button
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  signOutText: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  appVersionText: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: -4,
  },
});
