import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
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
import { bookingApi, CURATED_LOCATIONS, type BookingItem } from '@/lib/api';

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
    let pollInterval: any;

    const fetchDetails = async (isPolling = false) => {
      if (!id) return;
      try {
        if (!isPolling) setLoading(true);
        const data = await bookingApi.get(id);
        if (isMounted) setBooking(data);

        try {
          const telem = await bookingApi.getTelemetry(id);
          if (isMounted) setTelemetry(telem);
        } catch {
          // Non-critical telemetry fallback
        }
      } catch (err: any) {
        if (isMounted && !isPolling) setError(err.message || 'Unable to load booking details');
      } finally {
        if (isMounted && !isPolling) setLoading(false);
      }
    };

    fetchDetails(false);

    // Auto-poll every 5 seconds so customer sees live when a driver accepts the move
    pollInterval = setInterval(() => {
      fetchDetails(true);
    }, 5000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
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

  const isDriverAssigned = Boolean(
    booking.vendor?.name &&
    booking.status !== 'REQUESTED' &&
    booking.status !== 'QUOTED' &&
    booking.status !== 'CONFIRMED'
  );

  const currentStep = !isDriverAssigned && booking.status === 'CONFIRMED' ? 1 : (STATUS_PROGRESS[booking.status] ?? 0);
  const pickupCity = booking.pickupAddress.split(',')[0] || 'Pickup';
  const dropCity = booking.dropAddress.split(',')[0] || 'Destination';
  const driverName = booking.vendor?.name || '';
  const driverPhone = booking.vendor?.phone || '';
  const vehicleName = booking.vehicle?.type || '';
  const vehicleReg = booking.vehicle?.registrationNumber || '';

  const pickupCoords = useMemo(() => {
    const lower = (booking.pickupAddress || '').toLowerCase();
    const found = CURATED_LOCATIONS.find((c) => lower.includes(c.mainText.toLowerCase()) || lower.includes(c.city.toLowerCase()));
    return found ? { lat: found.lat, lng: found.lng } : { lat: 18.5679, lng: 73.9143 };
  }, [booking.pickupAddress]);

  const dropCoords = useMemo(() => {
    const lower = (booking.dropAddress || '').toLowerCase();
    const found = CURATED_LOCATIONS.find((c) => lower.includes(c.mainText.toLowerCase()) || lower.includes(c.city.toLowerCase()));
    return found ? { lat: found.lat, lng: found.lng } : { lat: 18.5590, lng: 73.7868 };
  }, [booking.dropAddress]);

  const truckCoords = useMemo(() => {
    if (telemetry?.latitude && telemetry?.longitude) {
      return { lat: telemetry.latitude, lng: telemetry.longitude };
    }
    return {
      lat: (pickupCoords.lat + dropCoords.lat) / 2,
      lng: (pickupCoords.lng + dropCoords.lng) / 2,
    };
  }, [telemetry, pickupCoords, dropCoords]);

  const liveMapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      * { box-sizing: border-box; }
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #091524;
        overflow: hidden;
      }
      .leaflet-control-attribution, .leaflet-control-zoom {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var pickup = [${pickupCoords.lat}, ${pickupCoords.lng}];
      var drop = [${dropCoords.lat}, ${dropCoords.lng}];
      var truck = [${truckCoords.lat}, ${truckCoords.lng}];

      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true
      }).setView(truck, 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Route dashed line
      var polyline = L.polyline([pickup, truck, drop], {
        color: '#F7A300',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 8'
      }).addTo(map);

      // Pickup pin (Gold)
      L.circleMarker(pickup, {
        radius: 6,
        fillColor: '#F7A300',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1
      }).addTo(map);

      // Drop pin (Cyan)
      L.circleMarker(drop, {
        radius: 6,
        fillColor: '#0D1F37',
        color: '#38BDF8',
        weight: 2.5,
        fillOpacity: 1
      }).addTo(map);

      // Moving Truck Marker
      var truckIcon = L.divIcon({
        className: 'custom-truck',
        html: '<div style="width:28px;height:28px;border-radius:14px;background:#F7A300;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #F7A300;border:2px solid #FFFFFF;"><span style="font-size:13px;line-height:28px;text-align:center;">🚚</span></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker(truck, { icon: truckIcon }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [30, 30], maxZoom: 14 });
    </script>
  </body>
</html>`;
  }, [pickupCoords, dropCoords, truckCoords]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Live Map Display Graphic */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={liveMapHtml}
            style={{
              width: '100%',
              height: 200,
              border: 'none',
              background: '#091524',
            }}
            title="Triveni Live Tracking Map"
          />
        ) : (
          <WebView
            source={{ html: liveMapHtml }}
            style={{
              width: '100%',
              height: 200,
              backgroundColor: '#091524',
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            scrollEnabled={false}
            bounces={false}
          />
        )}

        {/* Floating Live GPS badge */}
        <View style={styles.gpsLiveBadge}>
          <Radio size={12} color={Colors.success} />
          <Text style={styles.gpsLiveText}>
            GPS ACTIVE · {telemetry?.latitude ? `${telemetry.latitude.toFixed(3)}, ${telemetry.longitude.toFixed(3)}` : '12 SATELLITES'}
          </Text>
        </View>

        {/* Floating Transit Speed Pill */}
        <View style={styles.speedFloatingPill}>
          <Truck size={12} color={Colors.marigoldDark} />
          <Text style={styles.speedFloatingText}>
            {telemetry?.speedKmh ? `${telemetry.speedKmh} km/h` : '36 km/h'}
          </Text>
        </View>
      </View>

      {/* Booking Overview Card (Pure White Card) */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <View>
            <Text style={styles.bookingIdLabel}>TRACKING CODE</Text>
            <Text style={styles.bookingId}>#{booking.id}</Text>
          </View>
          <View style={styles.transitBadge}>
            <View style={!isDriverAssigned ? styles.pulseMarigold : styles.pulseGreen} />
            <Text style={styles.transitBadgeText}>
              {!isDriverAssigned ? 'ASSIGNING SHORTLY' : booking.status.replace('_', ' ')}
            </Text>
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

      {/* Driver Assignment Section: Assigning shortly vs Real Driver Contact */}
      {!isDriverAssigned ? (
        <View style={styles.assigningCard}>
          <View style={styles.assigningHeader}>
            <View style={styles.assigningAvatar}>
              <Truck size={22} color={Colors.marigold} strokeWidth={2.4} />
            </View>
            <View style={styles.assigningInfo}>
              <View style={styles.assigningBadgeRow}>
                <View style={styles.pulseMarigold} />
                <Text style={styles.assigningBadgeText}>Assigning shortly</Text>
              </View>
              <Text style={styles.assigningTitle}>Pairing Driver Captain</Text>
              <Text style={styles.assigningSubtitle}>
                Finding the nearest verified Triveni Captain and commercial vehicle for your move slot.
              </Text>
            </View>
          </View>

          <View style={styles.assigningPillRow}>
            <View style={styles.assigningPill}>
              <ShieldCheck size={12} color={Colors.success} />
              <Text style={styles.assigningPillText}>Verified Partner Fleet</Text>
            </View>
            <View style={styles.assigningPill}>
              <Radio size={12} color={Colors.navy} />
              <Text style={styles.assigningPillText}>Auto-Unlocks When Accepted</Text>
            </View>
          </View>
          <Text style={styles.assigningFootnote}>
            Driver phone number and vehicle registration plate will unlock here automatically as soon as accepted.
          </Text>
        </View>
      ) : (
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
              <Text style={styles.driverVehicle}>· {vehicleName} {vehicleReg ? `(${vehicleReg})` : ''}</Text>
            </View>
          </View>
          {driverPhone ? (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${driverPhone}`)}
              activeOpacity={0.85}
              accessibilityLabel={`Call driver ${driverName}`}
            >
              <PhoneCall size={18} color={Colors.white} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

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
    height: 200,
    backgroundColor: '#091524',
    position: 'relative',
    ...Shadow.sm,
  },
  gpsLiveBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.1)',
    zIndex: 10,
    ...Shadow.sm,
  },
  gpsLiveText: {
    color: Colors.navy,
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  speedFloatingPill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.1)',
    zIndex: 10,
    ...Shadow.sm,
  },
  speedFloatingText: {
    color: Colors.navyDark,
    fontSize: 10,
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

  pulseMarigold: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.marigold,
  },

  // Assigning Driver Card
  assigningCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.marigoldBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  assigningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assigningAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1.5,
    borderColor: Colors.marigoldBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigningInfo: {
    flex: 1,
    gap: 2,
  },
  assigningBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.marigoldSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    marginBottom: 2,
  },
  assigningBadgeText: {
    fontSize: 9.5,
    fontWeight: FontWeight.extrabold,
    color: Colors.marigoldDark,
    letterSpacing: 0.3,
  },
  assigningTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  assigningSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  assigningPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  assigningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  assigningPillText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },
  assigningFootnote: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
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
