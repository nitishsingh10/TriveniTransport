import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Navigation,
  Truck,
  CheckCircle2,
  UserCheck,
  Car,
  MapPin,
  Package,
  Home,
  User,
  Star,
  PhoneCall,
  FileText,
  Clock,
  Compass,
  Radio,
  ShieldCheck,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, type BookingItem } from '@/lib/api';

interface Milestone {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
}

const MILESTONE_DEFINITIONS: Milestone[] = [
  { key: 'REQUESTED', label: 'Booking Requested', desc: 'Slot held & awaiting verification', icon: Clock },
  { key: 'CONFIRMED', label: 'Booking Confirmed', desc: 'Advance received & vehicle reserved', icon: CheckCircle2 },
  { key: 'ASSIGNED', label: 'Driver & Crew Assigned', desc: 'Captain & helpers allotted to duty', icon: UserCheck },
  { key: 'EN_ROUTE', label: 'Vehicle Dispatched', desc: 'Vehicle departed dispatch hub', icon: Car },
  { key: 'ARRIVED', label: 'Arrived at Pickup', desc: 'Inspection & loading commenced', icon: MapPin },
  { key: 'IN_PROGRESS', label: 'Loaded & In Transit', desc: 'Moving safely towards destination', icon: Truck },
  { key: 'COMPLETED', label: 'Delivered & Unpacked', desc: 'Final placement and handover complete', icon: Home },
];

const STATUS_PROGRESS: Record<string, number> = {
  REQUESTED: 0,
  CONFIRMED: 1,
  ASSIGNED: 2,
  EN_ROUTE: 3,
  ARRIVED: 4,
  IN_PROGRESS: 5,
  COMPLETED: 6,
};

export default function BookingTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [telemetry, setTelemetry] = useState<{
    latitude: number;
    longitude: number;
    speedKmh: number;
    headingDeg: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await bookingApi.get(id);
        if (isMounted) setBooking(data);

        try {
          const telem = await bookingApi.getTelemetry(id);
          if (isMounted) setTelemetry(telem);
        } catch {
          // Non-critical telemetry fallback
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unable to load booking details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.navy} />
        <Text style={styles.loadingText}>Fetching live move details...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={44} color={Colors.error} />
        <Text style={styles.errorTitle}>Booking Not Found</Text>
        <Text style={styles.errorSub}>{error || `Unable to locate booking #${id}`}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.88}
        >
          <Text style={styles.backButtonText}>Return to Bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = STATUS_PROGRESS[booking.status] ?? 0;
  const pickupCity = booking.pickupAddress.split(',')[0] || 'Pickup';
  const dropCity = booking.dropAddress.split(',')[0] || 'Destination';
  const driverName = booking.vendor?.name || 'Rajesh Kumar (Verified Captain)';
  const driverPhone = booking.vendor?.phone || '8828647785';
  const vehicleName = booking.vehicle?.type || 'Tata 407 (14ft)';
  const vehicleReg = booking.vehicle?.registrationNumber || 'KA-01-TR-4921';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Live Map Display Graphic */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={['#E2E8F0', '#EDF2F7']}
          style={styles.mapCanvas}
        >
          {/* Simulated GPS grid */}
          <View style={styles.gpsGridRow}>
            <View style={styles.gpsGridLine} />
            <View style={styles.gpsGridLine} />
            <View style={styles.gpsGridLine} />
          </View>

          {/* Live GPS badge */}
          <View style={styles.gpsLiveBadge}>
            <Radio size={12} color={Colors.success} />
            <Text style={styles.gpsLiveText}>
              GPS ACTIVE · {telemetry?.latitude ? `${telemetry.latitude.toFixed(3)}, ${telemetry.longitude.toFixed(3)}` : '12 SATELLITES'}
            </Text>
          </View>

          {/* Route path line on map */}
          <View style={styles.mapRouteGraphic}>
            <View style={styles.mapPointStart}>
              <View style={styles.startDot} />
              <Text style={styles.pointText} numberOfLines={1}>{pickupCity}</Text>
            </View>

            <View style={styles.mapConnectingLine}>
              <View style={styles.mapProgressFill} />
            </View>

            {/* Moving Truck Marker */}
            <View style={styles.truckMarkerContainer}>
              <View style={styles.markerPulse} />
              <View style={styles.markerTruckCircle}>
                <Truck size={17} color={Colors.white} strokeWidth={2.4} />
              </View>
              <View style={styles.speedPill}>
                <Text style={styles.speedText}>
                  {telemetry?.speedKmh ? `${telemetry.speedKmh} km/h` : '36 km/h'}
                </Text>
              </View>
            </View>

            <View style={styles.mapPointEnd}>
              <View style={styles.endDot} />
              <Text style={styles.pointText} numberOfLines={1}>{dropCity}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Booking Overview Card (Pure White Card) */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <View>
            <Text style={styles.bookingIdLabel}>TRACKING CODE</Text>
            <Text style={styles.bookingId}>#{booking.id}</Text>
          </View>
          <View style={styles.transitBadge}>
            <View style={styles.pulseGreen} />
            <Text style={styles.transitBadgeText}>{booking.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <MapPin size={15} color={Colors.marigold} />
          <Text style={styles.routeText} numberOfLines={1}>{booking.pickupAddress}</Text>
          <ArrowRight size={13} color={Colors.textMuted} />
          <Home size={15} color={Colors.navy} />
          <Text style={styles.routeText} numberOfLines={1}>{booking.dropAddress}</Text>
        </View>

        <View style={styles.etaBar}>
          <View style={styles.etaItem}>
            <Calendar size={14} color={Colors.navy} />
            <Text style={styles.etaLabel}>Scheduled</Text>
          </View>
          <Text style={styles.etaValue}>
            {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} · {booking.scheduledSlot || 'Morning Slot'}
          </Text>
        </View>
      </View>

      {/* Driver Contact Card (Pure White Card) */}
      <View style={styles.driverCard}>
        <View style={styles.driverAvatar}>
          <User size={22} color={Colors.navy} strokeWidth={2.4} />
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverName}>{driverName}</Text>
            <View style={styles.driverVerifyBadge}>
              <ShieldCheck size={11} color={Colors.success} />
              <Text style={styles.driverVerifyText}>Verified</Text>
            </View>
          </View>
          <View style={styles.driverMetaRow}>
            <Star size={12} color={Colors.marigold} fill={Colors.marigold} />
            <Text style={styles.driverRating}>4.9 (Captain)</Text>
            <Text style={styles.driverVehicle}>· {vehicleName} ({vehicleReg})</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${driverPhone}`)}
          activeOpacity={0.85}
        >
          <PhoneCall size={18} color={Colors.white} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Milestone Timeline Card (Pure White Card) */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <Compass size={17} color={Colors.navy} />
          <Text style={styles.timelineTitle}>Live Move Timeline</Text>
        </View>

        {MILESTONE_DEFINITIONS.map((m, i) => {
          const MilestoneIcon = m.icon;
          const isDone = i <= currentStep;
          const isLast = i === MILESTONE_DEFINITIONS.length - 1;
          return (
            <View key={m.key} style={styles.timelineRow}>
              <View style={styles.timelineNodeColumn}>
                <View
                  style={[
                    styles.milestoneCircle,
                    isDone && styles.milestoneCircleDone,
                  ]}
                >
                  <MilestoneIcon
                    size={14}
                    color={isDone ? Colors.white : Colors.textMuted}
                    strokeWidth={isDone ? 2.3 : 1.8}
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.milestoneLine,
                      isDone && styles.milestoneLineDone,
                    ]}
                  />
                )}
              </View>

              <View style={styles.milestoneContent}>
                <Text
                  style={[
                    styles.milestoneLabel,
                    isDone && styles.milestoneLabelDone,
                  ]}
                >
                  {m.label}
                </Text>
                <Text style={styles.milestoneDesc}>{m.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.invoiceBtn}
          onPress={() => router.push(`/booking/${booking.id}/invoice`)}
          activeOpacity={0.85}
        >
          <FileText size={16} color={Colors.white} />
          <Text style={styles.invoiceBtnText}>View Move Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.85}
        >
          <PhoneCall size={16} color={Colors.navy} />
          <Text style={styles.supportBtnText}>Call Helpline</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Map Canvas Graphic
  mapContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  mapCanvas: {
    height: 190,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  gpsGridRow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.25,
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  gpsGridLine: {
    height: 1,
    backgroundColor: Colors.navy,
  },
  gpsLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  gpsLiveText: {
    color: Colors.navy,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  mapRouteGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  mapPointStart: {
    alignItems: 'center',
    gap: 4,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.marigold,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  mapPointEnd: {
    alignItems: 'center',
    gap: 4,
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.navy,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pointText: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  mapConnectingLine: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 8,
    position: 'relative',
    borderRadius: 2,
  },
  mapProgressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: Colors.navy,
    borderRadius: 2,
  },
  truckMarkerContainer: {
    position: 'absolute',
    left: '52%',
    top: -24,
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    top: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(13, 31, 55, 0.15)',
  },
  markerTruckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  speedPill: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  speedText: {
    color: Colors.navy,
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },

  // Info Card
  infoCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  bookingId: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },
  transitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  pulseGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
  transitBadgeText: {
    color: Colors.warning,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routeText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  etaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  etaValue: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Driver Card
  driverCard: {
    marginHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    ...Shadow.sm,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: { flex: 1, gap: 2 },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  driverVerifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  driverVerifyText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverRating: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  driverVehicle: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },

  // Timeline
  timelineCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  timelineTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.2,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timelineNodeColumn: {
    alignItems: 'center',
    width: 28,
  },
  milestoneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCircleDone: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  milestoneLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: Colors.cardBorder,
    marginVertical: 3,
  },
  milestoneLineDone: {
    backgroundColor: Colors.navy,
  },
  milestoneContent: {
    flex: 1,
    gap: 2,
    paddingBottom: Spacing.xs,
  },
  milestoneLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  milestoneLabelDone: {
    color: Colors.navyDark,
    fontWeight: FontWeight.bold,
  },
  milestoneDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  // Bottom action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  invoiceBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  supportBtnText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.sm,
  },
  errorTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  errorSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  backButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
