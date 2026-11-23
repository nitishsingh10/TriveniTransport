import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';

export default function EarningsScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const completedJobs = useDriverStore((s) => s.completedJobs);
  const activeJob = useDriverStore((s) => s.activeJob);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Settlement status */}
      <View style={styles.walletCard}>
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Payout settlement</Text>
          <Text style={styles.balanceValue}>Managed by operations</Text>
          <Text style={styles.balanceSub}>This app does not record payout balances or initiate bank transfers. Confirm settlement amounts with Triveni operations.</Text>
        </View>
      </View>

      {/* Recorded job activity */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Completed moves</Text>
          <Text style={styles.statBoxValue}>{completedJobs.length}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Active assignment</Text>
          <Text style={styles.statBoxValue}>{activeJob ? '1' : '0'}</Text>
        </View>
      </View>

      {/* Completed Trip History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Completed assignments</Text>
      </View>

      {completedJobs.length === 0 ? (
        <View style={styles.emptySettlementCard}>
          <CheckCircle2 size={36} color={Colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.emptySettlementTitle}>No completed moves yet</Text>
          <Text style={styles.emptySettlementSub}>
            Completed assignments will appear here. This list is not a payout or bank settlement statement.
          </Text>
        </View>
      ) : (
        completedJobs.map((job) => (
          <View key={job.id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View>
                <Text style={styles.tripCode}>{job.trackingCode}</Text>
                <Text style={styles.tripDate}>{job.scheduledDate} · {job.configuration}</Text>
              </View>
              <Text style={styles.statBoxSub}>{job.status.replaceAll('_', ' ')}</Text>
            </View>

            <View style={styles.tripRoute}>
              <Text style={styles.tripAddress} numberOfLines={1}>
                From: {job.pickupAddress}
              </Text>
              <Text style={styles.tripAddress} numberOfLines={1}>
                To: {job.dropAddress}
              </Text>
            </View>

            <View style={styles.tripFooter}>
              <Text style={styles.tripFooterText}>Vehicle: {job.vehicleType}</Text>
              <Text style={styles.tripFooterText}>Distance: {job.distanceKm} km</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Wallet Card
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.md,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  walletBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusLiveText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  balanceBlock: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    letterSpacing: -0.5,
  },
  balanceSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: Colors.brandSurface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  withdrawBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: 3,
    ...Shadow.sm,
  },
  statBoxLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  statBoxValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  statBoxSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Account Card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  accountIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  accountUpi: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  accountBank: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  downloadStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  downloadStatementText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },

  // Trip Card
  tripCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripCode: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  tripDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  payoutBadge: {
    alignItems: 'flex-end',
  },
  tripPayout: {
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  settledText: {
    fontSize: 9,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  tripRoute: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tripAddress: {
    fontSize: 11,
    color: Colors.navyDark,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tripFooterText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptySettlementCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  emptySettlementTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xs,
  },
  emptySettlementSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
