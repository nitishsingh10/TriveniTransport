import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Truck,
  MapPin,
  Clock,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Navigation,
  Box,
  Layers,
  Info,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore, DriverJob } from '@/store/driverStore';
import { useAuthStore } from '@/store/authStore';

export default function DutiesScreen() {
  const isOnline = useAuthStore((s) => s.isOnline);
  const activeJob = useDriverStore((s) => s.activeJob);
  const pendingJobs = useDriverStore((s) => s.pendingJobs);
  const completedJobs = useDriverStore((s) => s.completedJobs);
  const isLoading = useDriverStore((s) => s.isLoading);
  const fetchJobsFromBackend = useDriverStore((s) => s.fetchJobsFromBackend);
  const acceptJob = useDriverStore((s) => s.acceptJob);
  const declineJob = useDriverStore((s) => s.declineJob);

  // Fetch real jobs from backend on mount
  useEffect(() => {
    fetchJobsFromBackend();
  }, []);

  // Computed stats from real data
  const todaysMoves = completedJobs.length;
  const todaysPayout = completedJobs.reduce((sum, j) => sum + j.payoutAmount, 0) + (activeJob?.payoutAmount || 0);

  const handleAccept = (job: DriverJob) => {
    acceptJob(job.id);
    Alert.alert('Job Accepted!', `Assignment ${job.trackingCode} is now your active duty.`);
  };

  const handleDecline = (job: DriverJob) => {
    Alert.alert('Decline Assignment', `Are you sure you want to decline ${job.trackingCode}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => declineJob(job.id) },
    ]);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Alert Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Info size={16} color={Colors.warning} />
          <Text style={styles.offlineBannerText}>
            You are currently <Text style={styles.boldText}>OFFLINE</Text>. Toggle your duty status in the header to receive new assignments.
          </Text>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.navy} />
          <Text style={styles.loadingText}>Fetching assignments...</Text>
        </View>
      )}

      {/* Vehicle & Shift Quick Status Card */}
      <View style={styles.shiftCard}>
        <View style={styles.shiftCardHeader}>
          <View style={styles.vehicleInfo}>
            <View style={styles.truckIconBox}>
              <Truck size={18} color={Colors.navy} strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.vehicleTitle}>{activeJob?.vehicleType || 'Tata 407 · 600 CFT'}</Text>
              <Text style={styles.vehicleReg}>{activeJob?.vehicleReg || 'No vehicle assigned'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.shiftStatsRow}>
          <View style={styles.shiftStatItem}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{todaysMoves} Moves</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.shiftStatItem}>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={[styles.statValue, { color: Colors.navyDark }]}>₹{todaysPayout.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.shiftStatItem}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: Colors.navyDark }]}>{pendingJobs.length} Jobs</Text>
          </View>
        </View>
      </View>

      {/* ACTIVE JOB CARD */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Navigation size={17} color={Colors.navy} />
          <Text style={styles.sectionTitle}>Current Assigned Duty</Text>
        </View>
        {activeJob && (
          <View style={styles.activeTag}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeTagText}>{activeJob.status.replace('_', ' ')}</Text>
          </View>
        )}
      </View>

      {activeJob ? (
        <View style={styles.activeCard}>
          <View style={styles.activeCardHeader}>
            <View>
              <Text style={styles.trackingCodeLabel}>BOOKING ID</Text>
              <Text style={styles.trackingCode}>{activeJob.trackingCode}</Text>
            </View>
            <View style={styles.payoutBadge}>
              <Text style={styles.payoutLabel}>Driver Payout</Text>
              <Text style={styles.payoutValue}>₹{activeJob.payoutAmount}</Text>
            </View>
          </View>

          {/* Customer info row */}
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>
                {activeJob.customerName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{activeJob.customerName}</Text>
              <Text style={styles.customerConfig}>{activeJob.configuration} · {activeJob.totalCft} CFT</Text>
            </View>
            <TouchableOpacity
              style={styles.callCustomerBtn}
              onPress={() => Linking.openURL(`tel:${activeJob.customerPhone}`)}
              activeOpacity={0.85}
            >
              <PhoneCall size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Route details */}
          <View style={styles.routeBox}>
            <View style={styles.routeStep}>
              <View style={[styles.routeDot, { backgroundColor: Colors.marigold }]} />
              <View style={styles.routeTextCol}>
                <Text style={styles.routeStepLabel}>PICKUP POINT (Floor {activeJob.floorNumber}{activeJob.liftAvailable ? ', Lift' : ', No Lift'})</Text>
                <Text style={styles.routeAddress}>{activeJob.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeStepLine} />

            <View style={styles.routeStep}>
              <View style={[styles.routeDot, { backgroundColor: Colors.navy }]} />
              <View style={styles.routeTextCol}>
                <Text style={styles.routeStepLabel}>DROP DESTINATION</Text>
                <Text style={styles.routeAddress}>{activeJob.dropAddress}</Text>
              </View>
            </View>
          </View>

          {/* Slot & Distance specs */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={13} color={Colors.navy} />
              <Text style={styles.metaText}>{activeJob.scheduledSlot}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={13} color={Colors.navy} />
              <Text style={styles.metaText}>{activeJob.distanceKm} km trip</Text>
            </View>
            <View style={styles.metaItem}>
              <Box size={13} color={Colors.navy} />
              <Text style={styles.metaText}>{activeJob.itemsCount} inventory items</Text>
            </View>
          </View>

          {/* Move Console Action Trigger */}
          <TouchableOpacity
            style={styles.openConsoleBtn}
            onPress={() => router.push('/(tabs)/active')}
            activeOpacity={0.88}
          >
            <View style={styles.btnContentRow}>
              <Navigation size={16} color={Colors.white} strokeWidth={2.4} />
              <Text style={styles.openConsoleBtnText}>Open Move Execution Console</Text>
            </View>
            <ArrowRight size={16} color={Colors.white} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Truck size={36} color={Colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Active Assignment</Text>
          <Text style={styles.emptySubtitle}>
            You are ready to accept new jobs. Check incoming job requests below or wait for automated dispatch.
          </Text>
        </View>
      )}

      {/* PENDING / NEW REQUESTS */}
      <View style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
        <View style={styles.sectionTitleRow}>
          <Layers size={17} color={Colors.navy} />
          <Text style={styles.sectionTitle}>Available Job Requests ({pendingJobs.length})</Text>
        </View>
      </View>

      {pendingJobs.length === 0 ? (
        <View style={styles.emptyPendingCard}>
          <Text style={styles.emptyPendingText}>No pending requests right now. System is dispatching...</Text>
        </View>
      ) : (
        pendingJobs.map((job) => (
          <View key={job.id} style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <View>
                <Text style={styles.pendingTracking}>{job.trackingCode}</Text>
                <Text style={styles.pendingConfig}>{job.configuration} · {job.totalCft} CFT</Text>
              </View>
              <View style={styles.pendingPayoutBadge}>
                <Text style={styles.pendingPayoutText}>₹{job.payoutAmount}</Text>
                <Text style={styles.pendingPayoutSub}>net payout</Text>
              </View>
            </View>

            {/* Address overview */}
            <View style={styles.pendingRoute}>
              <View style={styles.pendingPoint}>
                <MapPin size={13} color={Colors.marigold} />
                <Text style={styles.pendingAddressText} numberOfLines={1}>
                  {job.pickupAddress}
                </Text>
              </View>
              <View style={styles.pendingPoint}>
                <MapPin size={13} color={Colors.navy} />
                <Text style={styles.pendingAddressText} numberOfLines={1}>
                  {job.dropAddress}
                </Text>
              </View>
            </View>

            <View style={styles.pendingMetaRow}>
              <Text style={styles.pendingMetaPill}>⏱️ {job.scheduledSlot}</Text>
              <Text style={styles.pendingMetaPill}>📏 {job.distanceKm} km</Text>
              <Text style={styles.pendingMetaPill}>📦 {job.itemsCount} items</Text>
            </View>

            {/* Accept / Decline actions */}
            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleDecline(job)}
                activeOpacity={0.8}
              >
                <XCircle size={15} color={Colors.error} />
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(job)}
                activeOpacity={0.88}
              >
                <CheckCircle2 size={15} color={Colors.white} />
                <Text style={styles.acceptBtnText}>Accept Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Safety & Protocol Card */}
      <View style={styles.safetyCard}>
        <ShieldCheck size={20} color={Colors.navy} />
        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>Triveni Safety Standard</Text>
          <Text style={styles.safetyDesc}>
            Always conduct an initial walk-through inventory check and verify goods condition before loading the vehicle.
          </Text>
        </View>
      </View>
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

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  offlineBannerText: {
    flex: 1,
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: FontWeight.bold,
  },

  // Shift Card
  shiftCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  truckIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  vehicleReg: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  fuelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  fuelText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  shiftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  shiftStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
  },

  // Active Job Card
  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.navy,
    padding: Spacing.md + 4,
    gap: Spacing.md,
    ...Shadow.md,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trackingCodeLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  trackingCode: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  payoutBadge: {
    alignItems: 'flex-end',
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  payoutLabel: {
    fontSize: 9,
    color: Colors.navyMuted,
    fontWeight: FontWeight.bold,
  },
  payoutValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitials: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  customerConfig: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  callCustomerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  routeBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 2,
  },
  routeStep: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  routeStepLine: {
    width: 2,
    height: 18,
    backgroundColor: Colors.cardBorder,
    marginLeft: 4,
    marginVertical: 1,
  },
  routeTextCol: {
    flex: 1,
  },
  routeStepLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: FontSize.xs,
    color: Colors.navyDark,
    fontWeight: FontWeight.semibold,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  openConsoleBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openConsoleBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Pending Cards
  emptyPendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  emptyPendingText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  pendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pendingTracking: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  pendingConfig: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  pendingPayoutBadge: {
    alignItems: 'flex-end',
  },
  pendingPayoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
  },
  pendingPayoutSub: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  pendingRoute: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  pendingPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingAddressText: {
    flex: 1,
    fontSize: 11,
    color: Colors.navyDark,
    fontWeight: FontWeight.medium,
  },
  pendingMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pendingMetaPill: {
    fontSize: 10,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceSubtle,
  },
  declineBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.navy,
    ...Shadow.sm,
  },
  acceptBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // Safety Card
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  safetyContent: {
    flex: 1,
    gap: 2,
  },
  safetyTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  safetyDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.navy,
    fontWeight: FontWeight.medium,
  },
});
