import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Download,
  Building,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';

export default function EarningsScreen() {
  const completedJobs = useDriverStore((s) => s.completedJobs);
  const [withdrawing, setWithdrawing] = useState(false);

  const totalEarned = completedJobs.reduce((sum, j) => sum + j.payoutAmount, 0);
  const totalCft = completedJobs.reduce((sum, j) => sum + (j.totalCft || 0), 0);
  const fuelAllowance = completedJobs.length > 0 ? Math.round(totalEarned * 0.15) : 0;
  const incentive = completedJobs.length > 0 ? 500 * completedJobs.length : 0;
  const availableBalance = totalEarned;

  const handleWithdraw = () => {
    if (availableBalance <= 0) {
      Alert.alert('No Balance', 'You currently do not have any cleared earnings to withdraw.');
      return;
    }

    Alert.alert(
      'Instant Payout Transfer',
      `Transfer ₹${availableBalance.toLocaleString('en-IN')} directly to your registered UPI ID (trivenipartner@oksbi)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Transfer',
          onPress: () => {
            setWithdrawing(true);
            setTimeout(() => {
              setWithdrawing(false);
              Alert.alert('Payout Initiated! ⚡', `₹${availableBalance.toLocaleString('en-IN')} has been sent to your bank account via IMPS.`);
            }, 800);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Balance Hero Card */}
      <View style={styles.walletCard}>
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>₹{availableBalance.toLocaleString('en-IN')}.00</Text>
          <Text style={styles.balanceSub}>Cleared for withdrawal to registered account</Text>
        </View>

        <TouchableOpacity
          style={[styles.withdrawBtn, availableBalance <= 0 && { opacity: 0.6 }]}
          onPress={handleWithdraw}
          activeOpacity={0.88}
          disabled={withdrawing || availableBalance <= 0}
        >
          <ArrowUpRight size={16} color={Colors.white} strokeWidth={2.4} />
          <Text style={styles.withdrawBtnText}>
            {withdrawing
              ? 'Transferring...'
              : availableBalance <= 0
              ? 'No Balance to Withdraw'
              : 'Withdraw to Bank Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Performance Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Total Payout</Text>
          <Text style={styles.statBoxValue}>₹{totalEarned.toLocaleString('en-IN')}</Text>
          <View style={styles.trendRow}>
            <TrendingUp size={11} color={Colors.success} />
            <Text style={styles.trendText}>Verified duty earnings</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Completed Trips</Text>
          <Text style={styles.statBoxValue}>{completedJobs.length} Moves</Text>
          <Text style={styles.statBoxSub}>{totalCft > 0 ? `${totalCft} CFT Moved` : '0 CFT Moved'}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Fuel Allowance</Text>
          <Text style={styles.statBoxValue}>₹{fuelAllowance.toLocaleString('en-IN')}</Text>
          <Text style={styles.statBoxSub}>Standard 15%</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Incentive Bonus</Text>
          <Text style={[styles.statBoxValue, { color: Colors.marigoldDark }]}>
            ₹{incentive.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statBoxSub}>Zero Damage Bonus</Text>
        </View>
      </View>

      {/* Payout Account Info */}
      <View style={styles.accountCard}>
        <View style={styles.accountIconBox}>
          <Building size={20} color={Colors.navy} />
        </View>
        <View style={styles.accountDetails}>
          <Text style={styles.accountTitle}>Registered Settlement Account</Text>
          <Text style={styles.accountUpi}>UPI ID: trivenipartner@oksbi</Text>
          <Text style={styles.accountBank}>State Bank of India · A/C **4928</Text>
        </View>
        <ShieldCheck size={18} color={Colors.success} />
      </View>

      {/* Completed Trip History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trip Settlement History</Text>
        {completedJobs.length > 0 && (
          <TouchableOpacity
            style={styles.downloadStatementBtn}
            onPress={() => Alert.alert('Statement Downloaded', 'TDS & Payout statement downloaded to your device.')}
            activeOpacity={0.8}
          >
            <Download size={13} color={Colors.navy} />
            <Text style={styles.downloadStatementText}>Statement</Text>
          </TouchableOpacity>
        )}
      </View>

      {completedJobs.length === 0 ? (
        <View style={styles.emptySettlementCard}>
          <CheckCircle2 size={36} color={Colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.emptySettlementTitle}>No Settled Trips Yet</Text>
          <Text style={styles.emptySettlementSub}>
            Completed assignments and their respective driver payouts will be credited and listed here.
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
              <View style={styles.payoutBadge}>
                <Text style={styles.tripPayout}>+₹{job.payoutAmount}</Text>
                <View style={styles.settledBadge}>
                  <CheckCircle2 size={10} color={Colors.success} />
                  <Text style={styles.settledText}>Settled</Text>
                </View>
              </View>
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

const styles = StyleSheet.create({
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
    color: Colors.navy,
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
    backgroundColor: Colors.navy,
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
    color: Colors.navy,
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
    color: Colors.navy,
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
