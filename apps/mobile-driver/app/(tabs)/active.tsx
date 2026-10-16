import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Navigation,
  MapPin,
  Truck,
  CheckCircle2,
  PhoneCall,
  Radio,
  Compass,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import type { BookingStatus } from '@triveni/shared-types';

export default function ActiveMoveConsole() {
  const activeJob = useDriverStore((s) => s.activeJob);
  const gps = useDriverStore((s) => s.gps);
  const updateJobStatus = useDriverStore((s) => s.updateJobStatus);
  const toggleGpsBroadcast = useDriverStore((s) => s.toggleGpsBroadcast);

  if (!activeJob) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Truck size={36} color={Colors.navy} strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyTitle}>No Active Move in Progress</Text>
        <Text style={styles.emptySubtitle}>
          You do not have an ongoing move right now. Accept an assignment from the Duties tab to start live execution and tracking.
        </Text>
        <TouchableOpacity
          style={styles.goToDutiesBtn}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.88}
        >
          <Text style={styles.goToDutiesText}>View Duties & Requests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNextStatus = () => {
    if (activeJob.status === 'ASSIGNED') {
      updateJobStatus(activeJob.id, 'EN_ROUTE');
      Alert.alert('Status Updated', 'Vehicle is now EN ROUTE to pickup location.');
    } else if (activeJob.status === 'EN_ROUTE') {
      updateJobStatus(activeJob.id, 'ARRIVED');
      Alert.alert('Status Updated', 'Arrived at pickup point. Begin goods inspection and inventory loading.');
    } else if (activeJob.status === 'ARRIVED') {
      updateJobStatus(activeJob.id, 'IN_PROGRESS');
      Alert.alert('Status Updated', 'Goods loaded securely. Move is now IN PROGRESS towards destination.');
    } else if (activeJob.status === 'IN_PROGRESS') {
      // Proceed to delivery confirmation
      router.push({ pathname: '/delivery/[id]/confirm', params: { id: activeJob.id } });
    }
  };

  const openNavigation = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', 'Could not open Google Maps navigation.');
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Move Header */}
      <View style={styles.topCard}>
        <View style={styles.topCardRow}>
          <View>
            <Text style={styles.trackingLabel}>CURRENT MISSION</Text>
            <Text style={styles.trackingCode}>{activeJob.trackingCode}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>{activeJob.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Milestone Steps Bar */}
        <View style={styles.milestonesBar}>
          <View style={[styles.milestoneStep, activeJob.status !== 'REQUESTED' && styles.stepDone]}>
            <Text style={[styles.stepNum, activeJob.status !== 'REQUESTED' && styles.stepNumDone]}>1</Text>
            <Text style={styles.stepText}>Assigned</Text>
          </View>
          <View style={[styles.stepLine, ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepLineDone]} />
          
          <View style={[styles.milestoneStep, ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepDone]}>
            <Text style={[styles.stepNum, ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepNumDone]}>2</Text>
            <Text style={styles.stepText}>En Route</Text>
          </View>
          <View style={[styles.stepLine, ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepLineDone]} />

          <View style={[styles.milestoneStep, ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepDone]}>
            <Text style={[styles.stepNum, ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepNumDone]}>3</Text>
            <Text style={styles.stepText}>Arrived</Text>
          </View>
          <View style={[styles.stepLine, ['IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepLineDone]} />

          <View style={[styles.milestoneStep, ['IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepDone]}>
            <Text style={[styles.stepNum, ['IN_PROGRESS', 'COMPLETED'].includes(activeJob.status) && styles.stepNumDone]}>4</Text>
            <Text style={styles.stepText}>In Transit</Text>
          </View>
          <View style={[styles.stepLine, activeJob.status === 'COMPLETED' && styles.stepLineDone]} />

          <View style={[styles.milestoneStep, activeJob.status === 'COMPLETED' && styles.stepDone]}>
            <Text style={[styles.stepNum, activeJob.status === 'COMPLETED' && styles.stepNumDone]}>5</Text>
            <Text style={styles.stepText}>Delivered</Text>
          </View>
        </View>

        {/* Primary Action Button based on status */}
        <TouchableOpacity
          style={styles.primaryStatusBtn}
          onPress={handleNextStatus}
          activeOpacity={0.88}
        >
          {activeJob.status === 'ASSIGNED' && (
            <View style={styles.btnContent}>
              <Truck size={17} color={Colors.white} />
              <Text style={styles.primaryStatusBtnText}>Start Trip · Mark En Route</Text>
            </View>
          )}
          {activeJob.status === 'EN_ROUTE' && (
            <View style={styles.btnContent}>
              <MapPin size={17} color={Colors.white} />
              <Text style={styles.primaryStatusBtnText}>Arrived at Pickup Location</Text>
            </View>
          )}
          {activeJob.status === 'ARRIVED' && (
            <View style={styles.btnContent}>
              <CheckCircle2 size={17} color={Colors.white} />
              <Text style={styles.primaryStatusBtnText}>Goods Loaded · Start Transit</Text>
            </View>
          )}
          {activeJob.status === 'IN_PROGRESS' && (
            <View style={styles.btnContent}>
              <FileCheck2 size={17} color={Colors.white} />
              <Text style={styles.primaryStatusBtnText}>Complete Move & Sign POD</Text>
            </View>
          )}
          <ArrowRight size={17} color={Colors.white} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Live GPS Broadcast Console */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsCardHeader}>
          <View style={styles.gpsTitleRow}>
            <Radio size={16} color={gps.isBroadcasting ? Colors.success : Colors.textMuted} />
            <Text style={styles.gpsCardTitle}>Customer Live Location Sharing</Text>
          </View>
          <Switch
            value={gps.isBroadcasting}
            onValueChange={(val) => toggleGpsBroadcast(val)}
            trackColor={{ false: Colors.cardBorder, true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.gpsTelemetryGrid}>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Current Location</Text>
            <Text style={styles.telemetryValue}>{gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)}</Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Transit Speed</Text>
            <Text style={styles.telemetryValue}>{gps.speedKmh} km/h</Text>
          </View>
        </View>

        <Text style={styles.gpsHint}>
          Live coordinates are transmitted to customer app and operations while duty is active.
        </Text>
      </View>

      {/* Navigation Quick Triggers */}
      <View style={styles.navCard}>
        <View style={styles.navHeader}>
          <Compass size={17} color={Colors.navy} />
          <Text style={styles.navTitle}>Turn-by-Turn Navigation</Text>
        </View>

        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            style={styles.navBtnPickup}
            onPress={() => openNavigation(activeJob.pickupAddress)}
            activeOpacity={0.85}
          >
            <MapPin size={15} color={Colors.marigold} />
            <View style={styles.navBtnTextCol}>
              <Text style={styles.navBtnLabel}>Navigate to</Text>
              <Text style={styles.navBtnDestination}>Pickup Point</Text>
            </View>
            <ExternalLink size={14} color={Colors.marigold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtnDrop}
            onPress={() => openNavigation(activeJob.dropAddress)}
            activeOpacity={0.85}
          >
            <Navigation size={15} color={Colors.white} />
            <View style={styles.navBtnTextCol}>
              <Text style={[styles.navBtnLabel, { color: 'rgba(255,255,255,0.7)' }]}>Navigate to</Text>
              <Text style={[styles.navBtnDestination, { color: Colors.white }]}>Drop Point</Text>
            </View>
            <ExternalLink size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Contact & Move Notes */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsCardHeader}>
          <Text style={styles.detailsCardTitle}>Customer & Route Info</Text>
          <TouchableOpacity
            style={styles.directCallBtn}
            onPress={() => Linking.openURL(`tel:${activeJob.customerPhone}`)}
            activeOpacity={0.85}
          >
            <PhoneCall size={14} color={Colors.white} />
            <Text style={styles.directCallText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customerSummaryBox}>
          <Text style={styles.custName}>{activeJob.customerName} ({activeJob.customerPhone})</Text>
          <Text style={styles.custConfig}>{activeJob.configuration} · {activeJob.totalCft} CFT · {activeJob.itemsCount} Items</Text>
        </View>

        {/* Addresses */}
        <View style={styles.addressList}>
          <View style={styles.addressItem}>
            <View style={[styles.addressBadge, { backgroundColor: Colors.marigoldSubtle }]}>
              <Text style={[styles.addressBadgeText, { color: Colors.marigoldDark }]}>FROM</Text>
            </View>
            <Text style={styles.addressFullText}>
              {activeJob.pickupAddress} (Floor {activeJob.floorNumber}{activeJob.liftAvailable ? ', Lift Available' : ', No Lift'})
            </Text>
          </View>

          <View style={styles.addressItem}>
            <View style={[styles.addressBadge, { backgroundColor: Colors.navySubtle }]}>
              <Text style={[styles.addressBadgeText, { color: Colors.navy }]}>TO</Text>
            </View>
            <Text style={styles.addressFullText}>{activeJob.dropAddress}</Text>
          </View>
        </View>

        {activeJob.notes && (
          <View style={styles.notesBox}>
            <AlertTriangle size={15} color={Colors.warning} />
            <Text style={styles.notesText}>{activeJob.notes}</Text>
          </View>
        )}
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

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  emptySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  goToDutiesBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadow.sm,
  },
  goToDutiesText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Top Card
  topCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 4,
    gap: Spacing.md,
    ...Shadow.md,
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trackingLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  trackingCode: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
  },

  // Milestones bar
  milestonesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  milestoneStep: {
    alignItems: 'center',
    gap: 3,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  stepNumDone: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
    color: Colors.white,
  },
  stepDone: {},
  stepText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 3,
    marginBottom: 12,
  },
  stepLineDone: {
    backgroundColor: Colors.navy,
  },

  // Primary Status Button
  primaryStatusBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryStatusBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // GPS Card
  gpsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  gpsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsCardTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  gpsTelemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  telemetryBox: {
    width: '48.5%',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 2,
  },
  telemetryLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  telemetryValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  gpsHint: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },

  // Navigation Card
  navCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navBtnPickup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  navBtnDrop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  navBtnTextCol: {
    flex: 1,
  },
  navBtnLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  navBtnDestination: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsCardTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  directCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  directCallText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  customerSummaryBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  custName: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  custConfig: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  addressBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
  },
  addressFullText: {
    flex: 1,
    fontSize: 11,
    color: Colors.navyDark,
    lineHeight: 16,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    color: Colors.navyDark,
    lineHeight: 15,
  },
});
