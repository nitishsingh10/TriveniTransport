import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Switch,
  Alert,
  Platform,
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

let WebViewComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview not available', e);
  }
}

const KNOWN_HUBS: { match: string; lat: number; lng: number }[] = [
  { match: 'viman', lat: 18.5679, lng: 73.9143 },
  { match: 'baner', lat: 18.5590, lng: 73.7868 },
  { match: 'kothrud', lat: 18.5074, lng: 73.8077 },
  { match: 'hinjewadi', lat: 18.5913, lng: 73.7389 },
  { match: 'kharadi', lat: 18.5516, lng: 73.9348 },
  { match: 'wakad', lat: 18.5987, lng: 73.7661 },
  { match: 'aundh', lat: 18.5580, lng: 73.8075 },
  { match: 'magarpatta', lat: 18.5158, lng: 73.9272 },
  { match: 'hadapsar', lat: 18.5089, lng: 73.9259 },
  { match: 'bandra', lat: 19.0596, lng: 72.8295 },
  { match: 'powai', lat: 19.1176, lng: 72.9060 },
  { match: 'thane', lat: 19.2183, lng: 72.9781 },
  { match: 'andheri', lat: 19.1136, lng: 72.8697 },
  { match: 'bkc', lat: 19.0657, lng: 72.8687 },
  { match: 'vashi', lat: 19.0771, lng: 72.9986 },
  { match: 'whitefield', lat: 12.9698, lng: 77.7500 },
  { match: 'indiranagar', lat: 12.9784, lng: 77.6408 },
  { match: 'koramangala', lat: 12.9352, lng: 77.6245 },
];

function resolveAddress(addr: string, fallback: { lat: number; lng: number }) {
  if (!addr) return fallback;
  const lower = addr.toLowerCase();
  const found = KNOWN_HUBS.find((h) => lower.includes(h.match));
  return found ? { lat: found.lat, lng: found.lng } : fallback;
}

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

  const pickupCoords = useMemo(
    () => resolveAddress(activeJob.pickupAddress, { lat: 18.5679, lng: 73.9143 }),
    [activeJob.pickupAddress]
  );
  const dropCoords = useMemo(
    () => resolveAddress(activeJob.dropAddress, { lat: 18.5590, lng: 73.7868 }),
    [activeJob.dropAddress]
  );

  const liveMapHtml = useMemo(() => {
    const truckLat = gps.latitude || (pickupCoords.lat + dropCoords.lat) / 2;
    const truckLng = gps.longitude || (pickupCoords.lng + dropCoords.lng) / 2;

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
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
      .leaflet-control-attribution, .leaflet-control-zoom {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      function init() {
        if (typeof L === 'undefined') return;
        var pickup = [${pickupCoords.lat}, ${pickupCoords.lng}];
        var drop = [${dropCoords.lat}, ${dropCoords.lng}];
        var truck = [${truckLat}, ${truckLng}];

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

        setTimeout(function() { map.invalidateSize(); }, 250);
        setTimeout(function() { map.invalidateSize(); }, 700);

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
          className: 'driver-truck',
          html: '<div style="width:30px;height:30px;border-radius:15px;background:#F7A300;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px #F7A300;border:2px solid #FFFFFF;"><span style="font-size:14px;line-height:30px;text-align:center;">🚚</span></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        L.marker(truck, { icon: truckIcon }).addTo(map);

        try {
          map.fitBounds(polyline.getBounds(), { padding: [30, 30], maxZoom: 14 });
        } catch(e) {}
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    </script>
  </body>
</html>`;
  }, [pickupCoords, dropCoords, gps.latitude, gps.longitude]);

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

      {/* Live Route Radar Map */}
      <View style={styles.mapCard}>
        <View style={styles.mapCardHeader}>
          <View style={styles.mapHeaderTitleRow}>
            <View style={styles.mapPulseDot} />
            <Text style={styles.mapHeaderTitle}>LIVE TRANSIT RADAR</Text>
          </View>
          <View style={styles.statusSubBadge}>
            <Text style={styles.statusSubBadgeText}>
              {gps.speedKmh > 0 ? `${gps.speedKmh} km/h` : 'STATIONARY'}
            </Text>
          </View>
        </View>

        <View style={styles.mapCanvasWrapper}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={liveMapHtml}
              style={{
                width: '100%',
                height: 180,
                border: 'none',
                backgroundColor: '#091524',
              }}
              title="Triveni Driver Live Route Map"
            />
          ) : WebViewComponent ? (
            <WebViewComponent
              originWhitelist={['*']}
              source={{ html: liveMapHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
              style={{ width: '100%', height: 180, backgroundColor: '#091524' }}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              scrollEnabled={false}
              bounces={false}
            />
          ) : (
            <View style={styles.mapFallback}>
              <Truck size={24} color={Colors.marigold} />
              <Text style={styles.mapFallbackText}>Active Route Loaded</Text>
            </View>
          )}

          <View style={styles.mapFloatingRouteBadge}>
            <View style={styles.dotGold} />
            <Text style={styles.mapFloatingText} numberOfLines={1}>
              {activeJob.pickupAddress.split(',')[0]} → {activeJob.dropAddress.split(',')[0]}
            </Text>
          </View>
        </View>
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

  // Map Card
  mapCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.sm,
    gap: Spacing.xs + 2,
    ...Shadow.sm,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingTop: 2,
  },
  mapHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  mapHeaderTitle: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    letterSpacing: 0.5,
  },
  statusSubBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statusSubBadgeText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  mapCanvasWrapper: {
    position: 'relative',
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#091524',
  },
  mapFallbackText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  mapFloatingRouteBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 21, 36, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  dotGold: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.marigold,
  },
  mapFloatingText: {
    color: Colors.white,
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
    flex: 1,
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
