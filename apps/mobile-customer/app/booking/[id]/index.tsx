import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  XCircle,
  Layers,
  Building,
  CreditCard,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, CURATED_LOCATIONS, type BookingItem } from '@/lib/api';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';
import { PulsingDot } from '@/components/PulsingDot';
import { CancellationProtocolModal } from '@/components/CancellationProtocolModal';
import type { BookingStatus } from '@triveni/shared-types';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface Milestone {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
}

const MILESTONE_DEFINITIONS: Milestone[] = [
  { key: 'REQUESTED', label: 'Order Requested', desc: 'Slot held & awaiting verification', icon: Clock },
  { key: 'CONFIRMED', label: 'Booking Confirmed', desc: 'We are assigning a verified service partner. Assignment details will appear here once assigned.', icon: CheckCircle2 },
  { key: 'ASSIGNED', label: 'Partner Assigned', desc: 'Your verified service partner is assigned to this move.', icon: UserCheck },
  { key: 'EN_ROUTE', label: 'Vehicle Dispatched', desc: 'Departed dispatch hub for pickup', icon: Car },
  { key: 'ARRIVED', label: 'Arrived at Pickup', desc: 'Loading & inspection commenced', icon: MapPin },
  { key: 'IN_PROGRESS', label: 'Loaded & In Transit', desc: 'Moving safely towards destination', icon: Truck },
  { key: 'COMPLETED', label: 'Delivered & Unpacked', desc: 'Handover complete with proof of delivery', icon: Home },
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
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchDetails = useCallback(async (isPolling = false) => {
    if (!id) return;
    try {
      const data = await bookingApi.get(id);
      setBooking(data);

      try {
        const telem = await bookingApi.getTelemetry(id);
        setTelemetry(telem);
      } catch {
        // Non-critical telemetry fallback
      }
    } catch (err: any) {
      if (!isPolling) setError(err.message || 'Unable to load booking details');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!id) return;
      bookingApi.get(id)
        .then((data) => {
          if (!active) return;
          setBooking(data);
          return bookingApi.getTelemetry(id).then((telem) => { if (active) setTelemetry(telem); }).catch(() => {});
        })
        .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load booking details'); })
        .finally(() => { if (active) setLoading(false); });
    };
    refresh();
    const pollInterval = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(pollInterval); };
  }, [id]);

  const isTransport = useMemo(() => {
    if (!booking) return false;
    return (
      booking.pricingSnapshot?.serviceType === 'transport' ||
      ['tata_ace', 'tata_407', 'eicher_17ft', 'eicher_14ft', 'transport', 'bolero'].includes(
        booking.configurationType
      )
    );
  }, [booking]);

  const isDriverAssigned = Boolean(
    booking?.vendor?.name &&
    booking?.status !== 'REQUESTED' &&
    booking?.status !== 'QUOTED' &&
    booking?.status !== 'CONFIRMED'
  );

  // Map tracking is ONLY available for trucks/pickups to track location of driver AFTER the driver accepts the order
  const showLiveMap = Boolean(
    isTransport &&
    isDriverAssigned &&
    booking?.status &&
    ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(booking.status)
  );

  const pickupAddress = booking?.pickupAddress;
  const dropAddress = booking?.dropAddress;
  const pickupCoords = useMemo(() => {
    if (!pickupAddress) return { lat: 18.5679, lng: 73.9143 };
    const lower = pickupAddress.toLowerCase();
    const found = CURATED_LOCATIONS.find(
      (c) => lower.includes(c.mainText.toLowerCase()) || lower.includes(c.city.toLowerCase())
    );
    return found ? { lat: found.lat, lng: found.lng } : { lat: 18.5679, lng: 73.9143 };
  }, [pickupAddress]);

  const dropCoords = useMemo(() => {
    if (!dropAddress) return { lat: 18.559, lng: 73.7868 };
    const lower = dropAddress.toLowerCase();
    const found = CURATED_LOCATIONS.find(
      (c) => lower.includes(c.mainText.toLowerCase()) || lower.includes(c.city.toLowerCase())
    );
    return found ? { lat: found.lat, lng: found.lng } : { lat: 18.559, lng: 73.7868 };
  }, [dropAddress]);

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
    if (!showLiveMap) return '';
    const mapsScript = GOOGLE_MAPS_API_KEY
      ? `<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
          GOOGLE_MAPS_API_KEY
        )}&loading=async&callback=initMap"></script>`
      : '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { box-sizing: border-box; }
      html, body, #map {
        width: 100%;
        height: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        background: #091524;
        overflow: hidden;
      }
      #map-error {
        display: none;
        position: absolute;
        inset: 0;
        align-items: center;
        justify-content: center;
        padding: 16px;
        color: #fff;
        background: #091524;
        text-align: center;
        font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="map-error"></div>
    <script>
      function showMapError(message) {
        var error = document.getElementById('map-error');
        error.textContent = message;
        error.style.display = 'flex';
      }

      function initMap() {
        if (!window.google || !google.maps) {
          showMapError('Google Maps could not load. Check its API key, billing, and allowed origins.');
          return;
        }
        var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
        var drop = { lat: ${dropCoords.lat}, lng: ${dropCoords.lng} };
        var truck = { lat: ${truckCoords.lat}, lng: ${truckCoords.lng} };
        var map = new google.maps.Map(document.getElementById('map'), {
          center: truck,
          zoom: 12,
          backgroundColor: '#091524',
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#d5dde8' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#091524' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#8b641f' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091524' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }
          ]
        });
        window.__triveniMapLoaded = true;

        var route = new google.maps.Polyline({
          path: [pickup, truck, drop],
          geodesic: true,
          strokeColor: '#F7A300',
          strokeOpacity: 0.9,
          strokeWeight: 3.5,
          map: map
        });
        new google.maps.Marker({
          position: pickup,
          map: map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#F7A300', fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2 },
          title: 'Pickup'
        });
        new google.maps.Marker({
          position: drop,
          map: map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#0D1F37', fillOpacity: 1, strokeColor: '#38BDF8', strokeWeight: 2.5 },
          title: 'Drop-off'
        });
        new google.maps.Marker({
          position: truck,
          map: map,
          label: { text: '🚚', fontSize: '16px' },
          title: 'Driver location'
        });

        var bounds = new google.maps.LatLngBounds();
        route.getPath().forEach(function(point) { bounds.extend(point); });
        map.fitBounds(bounds, 30);
        google.maps.event.addListenerOnce(map, 'idle', function() {
          if (map.getZoom() > 14) map.setZoom(14);
        });
      }

      if (!${Boolean(GOOGLE_MAPS_API_KEY)}) {
        showMapError('Google Maps key is not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.');
      } else {
        window.setTimeout(function() {
          if (!window.__triveniMapLoaded) showMapError('Google Maps could not load. Check its API key, billing, and allowed origins.');
        }, 12000);
      }
    </script>
    ${mapsScript}
  </body>
</html>`;
  }, [showLiveMap, pickupCoords, dropCoords, truckCoords]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.marigoldDark} />
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

  const currentStep =
    !isDriverAssigned && booking.status === 'CONFIRMED'
      ? 1
      : STATUS_PROGRESS[booking.status] ?? 0;

  const driverName = booking.vendor?.name || '';
  const driverPhone = booking.vendor?.phone || '';
  const vehicleName = booking.vehicle?.type || '';
  const vehicleReg = booking.vehicle?.registrationNumber || '';
  const isCancellable = booking.status === 'CONFIRMED' || booking.status === 'ASSIGNED';

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Type Banner */}
        <View style={styles.serviceBanner}>
          <View style={styles.serviceBannerLeft}>
            <View
              style={[
                styles.serviceIconBox,
                { backgroundColor: isTransport ? Colors.navySubtle : Colors.marigoldSubtle },
              ]}
            >
              <Truck
                size={18}
                color={isTransport ? Colors.text : Colors.marigoldDark}
                strokeWidth={2.2}
              />
            </View>
            <View>
              <Text style={styles.serviceBannerTitle}>
                {isTransport ? 'Truck & Freight Delivery' : 'Packers & Movers Relocation'}
              </Text>
              <Text style={styles.serviceBannerSub}>
                {isTransport
                  ? `${booking.configurationType?.toUpperCase()} · Commercial Goods Carrier`
                  : `${booking.configurationType?.toUpperCase()} Household Relocation`}
              </Text>
            </View>
          </View>
          <View style={styles.serviceBadgePill}>
            <Text style={styles.serviceBadgeText}>
              {booking.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* ── MAP VIEWPORT (ONLY SHOWN FOR TRUCKS AFTER DRIVER ACCEPTS) ──────── */}
        {showLiveMap ? (
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={liveMapHtml}
                style={{
                  width: '100%',
                  height: 220,
                  border: 'none',
                  background: '#091524',
                }}
                title="Triveni Live Tracking Map"
              />
            ) : (
              <WebView
                source={{ html: liveMapHtml, baseUrl: 'https://www.trivenitransport.online/' }}
                applicationNameForUserAgent="TriveniTransports/1.0.0"
                style={{
                  width: '100%',
                  height: 220,
                  backgroundColor: '#091524',
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                mixedContentMode="always"
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                scrollEnabled={false}
                bounces={false}
              />
            )}

            {/* Floating Live GPS badge */}
            <View style={styles.gpsLiveBadge}>
              <Radio
                size={12}
                color={
                  ['IN_PROGRESS', 'EN_ROUTE'].includes(booking.status)
                    ? Colors.success
                    : Colors.marigoldDark
                }
              />
              <Text style={styles.gpsLiveText}>
                {['IN_PROGRESS', 'EN_ROUTE'].includes(booking.status)
                  ? telemetry?.latitude
                    ? `GPS LIVE · ${telemetry.latitude.toFixed(3)}, ${telemetry.longitude.toFixed(3)}`
                    : 'GPS CONNECTING...'
                  : 'DRIVER DISPATCHED'}
              </Text>
            </View>

            {/* Floating Transit Speed Pill */}
            {['IN_PROGRESS', 'EN_ROUTE'].includes(booking.status) && (
              <View style={styles.speedFloatingPill}>
                <Truck size={12} color={Colors.marigoldDark} />
                <Text style={styles.speedFloatingText}>
                  {telemetry?.speedKmh ? `${telemetry.speedKmh} km/h` : 'In Transit'}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Booking Overview Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View>
              <Text style={styles.bookingIdLabel}>TRACKING REFERENCE</Text>
              <Text style={styles.bookingId}>#{booking.id.slice(-6).toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.transitBadge,
                {
                  backgroundColor: !isDriverAssigned ? Colors.warningLight : Colors.successLight,
                  borderColor: !isDriverAssigned ? Colors.warningBorder : Colors.successBorder,
                },
              ]}
            >
              <PulsingDot color={!isDriverAssigned ? Colors.warning : Colors.success} size={6} />
              <Text
                style={[
                  styles.transitBadgeText,
                  { color: !isDriverAssigned ? Colors.warning : Colors.success },
                ]}
              >
                {!isDriverAssigned ? 'DRIVER ASSIGNING' : booking.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Route details */}
          <View style={styles.routeBox}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>PICKUP DOORSTEP</Text>
                <Text style={styles.routeText}>{booking.pickupAddress}</Text>
                {!isTransport && booking.floorNumber !== undefined && (
                  <Text style={styles.routeSubtext}>
                    Floor {booking.floorNumber} · {booking.liftAvailable ? 'Lift Available' : 'No Lift (Stairs)'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.routeConnectorLine} />

            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.marigoldDark }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DESTINATION</Text>
                <Text style={styles.routeText}>{booking.dropAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.etaBar}>
            <View style={styles.etaItem}>
              <Calendar size={14} color={Colors.text} />
              <Text style={styles.etaLabel}>Scheduled Date &amp; Slot</Text>
            </View>
            <Text style={styles.etaValue}>
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              · {booking.scheduledSlot || 'Morning Slot'}
            </Text>
          </View>
        </View>

        {/* Driver / Moving Crew Assignment Section */}
        {!isDriverAssigned ? (
          <View style={styles.assigningCard}>
            <View style={styles.assigningHeader}>
              <View style={styles.assigningAvatar}>
                <Truck size={22} color={Colors.marigold} strokeWidth={2.4} />
              </View>
              <View style={styles.assigningInfo}>
                <View style={styles.assigningBadgeRow}>
                  <View style={styles.pulseMarigold} />
                  <Text style={styles.assigningBadgeText}>
                    {isTransport ? 'Locating Nearest Truck Captain' : 'Assigning Moving Crew & Captain'}
                  </Text>
                </View>
                <Text style={styles.assigningTitle}>
                  {isTransport ? 'Pairing Commercial Vehicle' : 'Allotting Relocation Captain'}
                </Text>
                <Text style={styles.assigningSubtitle}>
                  {isTransport
                    ? 'Matching verified driver captains in your pickup zone. Real-time GPS map tracking will unlock automatically when accepted.'
                    : 'Your verified packing team and moving captain are reserved for this slot. Details unlock 2-4 hours prior to scheduled time.'}
                </Text>
              </View>
            </View>

            <View style={styles.assigningPillRow}>
              <View style={styles.assigningPill}>
                <ShieldCheck size={12} color={Colors.success} />
                <Text style={styles.assigningPillText}>Verified Partner Fleet</Text>
              </View>
              <View style={styles.assigningPill}>
                <Radio size={12} color={Colors.text} />
                <Text style={styles.assigningPillText}>Auto-Updates on Acceptance</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <User size={22} color={Colors.text} strokeWidth={2.4} />
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{driverName}</Text>
                <View style={styles.driverVerifyBadge}>
                  <ShieldCheck size={11} color={Colors.success} />
                  <Text style={styles.driverVerifyText}>Verified Captain</Text>
                </View>
              </View>
              <View style={styles.driverMetaRow}>
                <Star size={12} color={Colors.marigold} fill={Colors.marigold} />
                <Text style={styles.driverRating}>4.9</Text>
                <Text style={styles.driverVehicle}>
                  · {vehicleName} {vehicleReg ? `(${vehicleReg})` : ''}
                </Text>
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

        {/* Move Items Summary (Packers & Movers inventory) */}
        {!isTransport && booking.items && booking.items.length > 0 && (
          <View style={styles.itemsCard}>
            <View style={styles.itemsCardHeader}>
              <Package size={16} color={Colors.text} />
              <Text style={styles.itemsCardTitle}>
                Relocation Inventory ({booking.items.length} items)
              </Text>
            </View>
            <View style={styles.itemsList}>
              {booking.items.map((item: any, idx: number) => (
                <View key={item.id || idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>
                      {item.customName || `Item #${idx + 1}`}
                    </Text>
                    <Text style={styles.itemTier}>
                      Packing: {item.packingTier?.toUpperCase() || 'STANDARD'}
                    </Text>
                  </View>
                  <View style={styles.itemQuantityBadge}>
                    <Text style={styles.itemQuantityText}>× {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Milestone Timeline Card */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Compass size={17} color={Colors.text} />
            <Text style={styles.timelineTitle}>Current Move Milestones</Text>
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

        {/* Payment Summary Box */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CreditCard size={16} color={Colors.text} />
            <Text style={styles.paymentCardTitle}>Payment &amp; Quote Summary</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Mode</Text>
            <Text style={styles.paymentValue}>
              {booking.pricingSnapshot?.paymentMethod === 'online'
                ? 'Paid Online (Razorpay)'
                : 'Cash on Delivery (Pay on Move Day)'}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount</Text>
            <Text style={styles.paymentAmount}>
              ₹{booking.finalAmount?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsRow}>
          <PressableScale
            style={styles.invoiceBtn}
            onPress={() => router.push(`/booking/${booking.id}/invoice`)}
          >
            <FileText size={16} color={Colors.white} />
            <Text style={styles.invoiceBtnText}>View payment summary</Text>
          </PressableScale>

          {isCancellable ? (
            <PressableScale
              style={styles.cancelBtn}
              onPress={() => setShowCancelModal(true)}
            >
              <XCircle size={16} color={Colors.error} />
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </PressableScale>
          ) : (
            <PressableScale
              style={styles.supportBtn}
              onPress={() => Linking.openURL('tel:8828647785')}
            >
              <PhoneCall size={16} color={Colors.text} />
              <Text style={styles.supportBtnText}>Call Helpline</Text>
            </PressableScale>
          )}
        </View>
      </ScrollView>

      {/* Cancellation Protocol Modal */}
      <CancellationProtocolModal
        visible={showCancelModal}
        bookingId={booking.id}
        bookingStatus={booking.status as BookingStatus}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => fetchDetails(false)}
      />
    </>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: Colors.background },
    container: { gap: Spacing.md, paddingBottom: Spacing.xxl },

    centerContainer: {
      flex: 1,
      backgroundColor: Colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
      gap: Spacing.sm,
    },
    loadingText: {
      color: Colors.textSecondary,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      marginTop: Spacing.xs,
    },
    errorTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      marginTop: Spacing.xs,
    },
    errorSub: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    backButton: {
      marginTop: Spacing.md,
      backgroundColor: Colors.brandSurface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 10,
      borderRadius: BorderRadius.md,
    },
    backButtonText: {
      color: Colors.white,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
    },

    // Service Banner
    serviceBanner: {
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Shadow.sm,
    },
    serviceBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    serviceIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceBannerTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    serviceBannerSub: {
      fontSize: FontSize.xxs + 1,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    serviceBadgePill: {
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    serviceBadgeText: {
      fontSize: 10,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      letterSpacing: 0.4,
    },

    // Map Canvas Graphic
    mapContainer: {
      marginHorizontal: Spacing.md,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      height: 220,
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
      borderColor: Colors.navyBorder,
      zIndex: 10,
      ...Shadow.sm,
    },
    gpsLiveText: {
      color: Colors.text,
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
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      zIndex: 10,
      ...Shadow.sm,
    },
    speedFloatingText: {
      color: Colors.text,
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
      color: Colors.text,
      fontSize: FontSize.md,
      fontWeight: FontWeight.extrabold,
    },
    transitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    transitBadgeText: {
      fontSize: FontSize.xxs,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.3,
    },

    routeBox: {
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    routeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
    },
    routeLabel: {
      fontSize: 9.5,
      fontWeight: FontWeight.bold,
      color: Colors.textMuted,
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    routeText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.text,
      lineHeight: 18,
    },
    routeSubtext: {
      fontSize: FontSize.xxs + 1,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    routeConnectorLine: {
      width: 1,
      height: 14,
      backgroundColor: Colors.cardBorder,
      marginLeft: 3.5,
    },

    etaBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
      paddingTop: Spacing.sm,
    },
    etaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    etaLabel: {
      fontSize: FontSize.xs,
      color: Colors.textMuted,
      fontWeight: FontWeight.medium,
    },
    etaValue: {
      fontSize: FontSize.xs,
      color: Colors.text,
      fontWeight: FontWeight.bold,
    },

    // Assigning Card
    assigningCard: {
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md + 2,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    assigningHeader: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    assigningAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.marigoldSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.marigoldBorder,
    },
    assigningInfo: {
      flex: 1,
      gap: 3,
    },
    assigningBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    pulseMarigold: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.marigold,
    },
    assigningBadgeText: {
      fontSize: 10,
      fontWeight: FontWeight.bold,
      color: Colors.marigoldDark,
      letterSpacing: 0.4,
    },
    assigningTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    assigningSubtitle: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      lineHeight: 18,
    },
    assigningPillRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    assigningPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    assigningPillText: {
      fontSize: 10,
      fontWeight: FontWeight.medium,
      color: Colors.textSecondary,
    },

    // Driver Card
    driverCard: {
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      ...Shadow.sm,
    },
    driverAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    driverInfo: {
      flex: 1,
      gap: 2,
    },
    driverNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
    driverName: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    driverVerifyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: Colors.successLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    driverVerifyText: {
      fontSize: 9.5,
      fontWeight: FontWeight.bold,
      color: Colors.success,
    },
    driverMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    driverRating: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    driverVehicle: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
    },
    callBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.brandSurface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },

    // Items card
    itemsCard: {
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    itemsCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    itemsCardTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    itemsList: {
      gap: Spacing.xs,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: Colors.cardBorder,
    },
    itemName: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.text,
    },
    itemTier: {
      fontSize: 10,
      color: Colors.textMuted,
      marginTop: 1,
    },
    itemQuantityBadge: {
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    itemQuantityText: {
      fontSize: 10.5,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },

    // Timeline Card
    timelineCard: {
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md + 2,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: Spacing.xs,
    },
    timelineTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    timelineRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    timelineNodeColumn: {
      alignItems: 'center',
      width: 24,
    },
    milestoneCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    milestoneCircleDone: {
      backgroundColor: Colors.marigold,
      borderColor: Colors.marigold,
    },
    milestoneLine: {
      width: 2,
      flex: 1,
      minHeight: 24,
      backgroundColor: Colors.cardBorder,
      marginVertical: 2,
    },
    milestoneLineDone: {
      backgroundColor: Colors.marigold,
    },
    milestoneContent: {
      flex: 1,
      paddingBottom: Spacing.sm + 2,
    },
    milestoneLabel: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.textMuted,
    },
    milestoneLabelDone: {
      color: Colors.text,
      fontWeight: FontWeight.bold,
    },
    milestoneDesc: {
      fontSize: 10.5,
      color: Colors.textSecondary,
      marginTop: 1,
    },

    // Payment Card
    paymentCard: {
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md,
      gap: Spacing.xs + 2,
      ...Shadow.sm,
    },
    paymentCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: Spacing.xs,
    },
    paymentCardTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
    },
    paymentValue: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.text,
    },
    paymentAmount: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.extrabold,
      color: Colors.marigoldDark,
    },

    // Actions Row
    actionsRow: {
      marginHorizontal: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    invoiceBtn: {
      flex: 1,
      height: 44,
      backgroundColor: Colors.brandSurface,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      ...Shadow.sm,
    },
    invoiceBtnText: {
      color: Colors.white,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
    },
    supportBtn: {
      flex: 1,
      height: 44,
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    supportBtnText: {
      color: Colors.text,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
    },
    cancelBtn: {
      flex: 1,
      height: 44,
      backgroundColor: Colors.errorLight,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.errorBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    cancelBtnText: {
      color: Colors.error,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
    },
  });
