import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  Home,
  MapPin,
  Navigation,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { bookingApi, mapsApi, type BookingItem } from '@/lib/api';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';
import { useAuthStore } from '@/store/authStore';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';
import { PulsingDot } from '@/components/PulsingDot';

export default function HomeScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((s) => s.user);

  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [currentAddress, setCurrentAddress] = useState('Locating your position…');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>();
  const [isLocating, setIsLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const readCurrentLocation = async () => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') return null;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      const result = await mapsApi.reverseGeocode(coords.lat, coords.lng);
      return { coords, address: result.address || 'Current location' };
    } catch {
      return null;
    }
  };

  const updateCurrentLocation = async () => {
    setIsLocating(true);
    const location = await readCurrentLocation();
    if (location) {
      setCurrentCoords(location.coords);
      setCurrentAddress(location.address);
    } else {
      setCurrentAddress('Tap to select pickup location');
    }
    setIsLocating(false);
  };

  useEffect(() => {
    let mounted = true;
    readCurrentLocation().then((location) => {
      if (!mounted) return;
      if (location) {
        setCurrentCoords(location.coords);
        setCurrentAddress(location.address);
      } else {
        setCurrentAddress('Tap to select pickup location');
      }
    });

    bookingApi
      .list()
      .then((list) => {
        if (!mounted) return;
        const active = list.find((booking) =>
          ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED', 'CONFIRMED', 'REQUESTED'].includes(booking.status)
        );
        setActiveBooking(active || null);
      })
      .catch(() => {
        if (mounted) setActiveBooking(null);
      })
      .finally(() => {
        if (mounted) setIsLoadingBooking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePickupSelected = (location: { address: string; lat: number; lng: number }) => {
    setCurrentAddress(location.address);
    setCurrentCoords({ lat: location.lat, lng: location.lng });
    setMapOpen(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── 1. Greeting & Title ── */}
        <FadeInUp delay={60}>
          <View style={styles.greetingHeader}>
            <View style={styles.greetingTextCol}>
              <View style={styles.badgeRow}>
                <View style={styles.pillBadge}>
                  <Sparkles size={11} color={Colors.marigoldDark} />
                  <Text style={styles.pillBadgeText}>EXPRESS RELOCATION</Text>
                </View>
              </View>
              <Text style={styles.greetingTitle}>
                {greeting}, {firstName}
              </Text>
              <Text style={styles.greetingSub}>
                Instant verified quotes and real-time tracking across India
              </Text>
            </View>
          </View>
        </FadeInUp>

        {/* ── 2. Interactive Location Search Bar ── */}
        <FadeInUp delay={120}>
          <PressableScale
            style={styles.searchBar}
            onPress={() => setMapOpen(true)}
            activeOpacity={0.92}
          >
            <View style={styles.searchDotContainer}>
              <View style={styles.searchDot} />
            </View>
            <View style={styles.searchCopy}>
              <Text style={styles.searchPre}>PICKUP LOCATION</Text>
              <Text style={styles.searchMain} numberOfLines={1}>
                {currentAddress}
              </Text>
            </View>
            {isLocating ? (
              <ActivityIndicator size="small" color={Colors.marigoldDark} />
            ) : (
              <TouchableOpacity
                style={styles.gpsIconBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  void updateCurrentLocation();
                }}
                accessibilityLabel="Detect GPS location"
              >
                <Crosshair size={17} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <View style={styles.mapPinPill}>
              <Compass size={14} color={Colors.marigoldDark} strokeWidth={2.2} />
            </View>
          </PressableScale>
        </FadeInUp>

        {/* ── 3. Active Booking Live Status (if any) ── */}
        {activeBooking && (
          <FadeInUp delay={160}>
            <PressableScale
              style={styles.activeBookingCard}
              onPress={() => router.push(`/booking/${activeBooking.id}`)}
              activeOpacity={0.92}
            >
              <View style={styles.activeBookingTop}>
                <View style={styles.liveIndicatorRow}>
                  <PulsingDot color={Colors.success} size={7} />
                  <Text style={styles.liveStatusText}>LIVE SHIPMENT</Text>
                </View>
                <Text style={styles.bookingIdTag}>#{activeBooking.id.slice(-6).toUpperCase()}</Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePointsCol}>
                  <View style={[styles.routePointDot, { backgroundColor: Colors.success }]} />
                  <View style={styles.routePointLine} />
                  <View style={[styles.routePointDot, { backgroundColor: Colors.marigoldDark }]} />
                </View>
                <View style={styles.routeTextCol}>
                  <Text style={styles.routeAddressText} numberOfLines={1}>
                    {activeBooking.pickupAddress}
                  </Text>
                  <Text style={[styles.routeAddressText, { marginTop: 12 }]} numberOfLines={1}>
                    {activeBooking.dropAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.activeBookingFooter}>
                <View style={styles.footerDate}>
                  <Clock size={13} color={Colors.textSecondary} />
                  <Text style={styles.footerDateText}>
                    {activeBooking.scheduledDate
                      ? new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Scheduled'}
                  </Text>
                </View>
                <View style={styles.trackActionBtn}>
                  <Text style={styles.trackActionText}>Live GPS Radar</Text>
                  <Navigation size={13} color={Colors.white} />
                </View>
              </View>
            </PressableScale>
          </FadeInUp>
        )}

        {/* ── 4. Bento Services Selector ── */}
        <FadeInUp delay={200}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Relocation Services</Text>
            <Text style={styles.sectionSubHeading}>Guaranteed price · Zero advance</Text>
          </View>

          <View style={styles.bentoGrid}>
            {/* Service 1: Packers & Movers */}
            <PressableScale
              style={[styles.serviceTile, styles.packersTile]}
              onPress={() =>
                router.push({
                  pathname: '/quote',
                  params: {
                    pickup: currentAddress,
                    ...(currentCoords
                      ? { pickupLat: String(currentCoords.lat), pickupLng: String(currentCoords.lng) }
                      : {}),
                  },
                })
              }
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconBox, { backgroundColor: Colors.marigoldSubtle }]}>
                  <Home size={22} color={Colors.marigoldDark} strokeWidth={2.2} />
                </View>
                <View style={styles.tileBadgePill}>
                  <Text style={styles.tileBadgeText}>FULL SERVICE</Text>
                </View>
              </View>

              <View style={styles.tileBody}>
                <Text style={styles.tileTitle}>Packers &amp; Movers</Text>
                <Text style={styles.tileDescription}>
                  Complete home &amp; office moves with multi-layer packing, skilled labor &amp; safe setup.
                </Text>
              </View>

              <View style={styles.tileFooter}>
                <Text style={styles.tileActionLink}>Get Instant Estimate</Text>
                <View style={styles.tileArrowCircle}>
                  <ArrowRight size={14} color={Colors.text} strokeWidth={2.5} />
                </View>
              </View>
            </PressableScale>

            {/* Service 2: Transport & Trucks */}
            <PressableScale
              style={[styles.serviceTile, styles.trucksTile]}
              onPress={() =>
                router.push({
                  pathname: '/transport' as any,
                  params: {
                    pickup: currentAddress,
                    ...(currentCoords
                      ? { pickupLat: String(currentCoords.lat), pickupLng: String(currentCoords.lng) }
                      : {}),
                  },
                })
              }
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconBox, { backgroundColor: Colors.navySubtle }]}>
                  <Truck size={22} color={Colors.text} strokeWidth={2.2} />
                </View>
                <View style={[styles.tileBadgePill, { backgroundColor: Colors.navySubtle }]}>
                  <Text style={[styles.tileBadgeText, { color: Colors.text }]}>VEHICLE ONLY</Text>
                </View>
              </View>

              <View style={styles.tileBody}>
                <Text style={styles.tileTitle}>Transport &amp; Trucks</Text>
                <Text style={styles.tileDescription}>
                  Quick pickup &amp; drop freight. Tata Ace, 407 &amp; 17ft trucks with optional helper assistance.
                </Text>
              </View>

              <View style={styles.tileFooter}>
                <Text style={styles.tileActionLink}>Book Truck Online</Text>
                <View style={[styles.tileArrowCircle, { backgroundColor: Colors.surfaceSubtle }]}>
                  <ArrowRight size={14} color={Colors.text} strokeWidth={2.5} />
                </View>
              </View>
            </PressableScale>
          </View>
        </FadeInUp>

        {/* ── 5. Trust & Quality Banner ── */}
        <FadeInUp delay={260}>
          <View style={styles.trustStrip}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <ShieldCheck size={18} color={Colors.marigoldDark} strokeWidth={2.2} />
              </View>
              <View style={styles.trustCopy}>
                <Text style={styles.trustTitle}>100% Insured</Text>
                <Text style={styles.trustSub}>Transit safety covered</Text>
              </View>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Zap size={18} color={Colors.success} strokeWidth={2.2} />
              </View>
              <View style={styles.trustCopy}>
                <Text style={styles.trustTitle}>Pay on Move Day</Text>
                <Text style={styles.trustSub}>Zero advance booking</Text>
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* ── 6. How Triveni Works (Quick 3-step info) ── */}
        <FadeInUp delay={320}>
          <View style={styles.stepsCard}>
            <Text style={styles.stepsHeading}>How It Works</Text>
            <View style={styles.stepItemRow}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Select pickup &amp; drop</Text>
                <Text style={styles.stepDesc}>Pin exact locations with instant route distance estimation.</Text>
              </View>
            </View>
            <View style={styles.stepItemRow}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Choose configuration or vehicle</Text>
                <Text style={styles.stepDesc}>1-3 BHK shifting with packing tiers or dedicated freight trucks.</Text>
              </View>
            </View>
            <View style={styles.stepItemRow}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Confirm with zero advance</Text>
                <Text style={styles.stepDesc}>Pay 100% on move day after safe delivery and verification.</Text>
              </View>
            </View>
          </View>
        </FadeInUp>
      </ScrollView>

      {/* Map modal for pinning location */}
      <GoogleMapsLocationModal
        visible={mapOpen}
        type="pickup"
        title="Pickup from"
        initialValue={currentAddress.startsWith('Locating') ? '' : currentAddress}
        onSelect={handlePickupSelected}
        onClose={() => setMapOpen(false)}
      />
    </View>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xxxl,
      gap: Spacing.md,
    },

    // 1. Greeting
    greetingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
    },
    greetingTextCol: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    pillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.marigoldSubtle,
      borderWidth: 1,
      borderColor: Colors.marigoldBorder,
    },
    pillBadgeText: {
      color: Colors.marigoldDark,
      fontSize: 10,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.6,
    },
    greetingTitle: {
      color: Colors.text,
      fontSize: FontSize.xl,
      fontWeight: FontWeight.extrabold,
      letterSpacing: -0.5,
    },
    greetingSub: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      lineHeight: 18,
    },

    // 2. Search Bar
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.xl,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
      ...Shadow.sm,
    },
    searchDotContainer: {
      width: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.success,
    },
    searchCopy: {
      flex: 1,
      gap: 2,
    },
    searchPre: {
      color: Colors.textMuted,
      fontSize: 9,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.8,
    },
    searchMain: {
      color: Colors.text,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      letterSpacing: -0.1,
    },
    gpsIconBtn: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    mapPinPill: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.marigoldSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // 3. Active Booking Card
    activeBookingCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1.5,
      borderColor: Colors.successBorder,
      gap: Spacing.md,
      ...Shadow.md,
    },
    activeBookingTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    liveIndicatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    liveStatusText: {
      color: Colors.success,
      fontSize: 10,
      fontWeight: FontWeight.extrabold,
      letterSpacing: 0.6,
    },
    bookingIdTag: {
      color: Colors.textSecondary,
      fontSize: 11,
      fontWeight: FontWeight.bold,
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.sm,
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    routePointsCol: {
      alignItems: 'center',
      width: 10,
    },
    routePointDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    routePointLine: {
      width: 1.5,
      height: 18,
      backgroundColor: Colors.cardBorder,
      marginVertical: 2,
    },
    routeTextCol: {
      flex: 1,
    },
    routeAddressText: {
      color: Colors.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
    },
    activeBookingFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
    },
    footerDate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    footerDateText: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
    },
    trackActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.brandSurface,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
    },
    trackActionText: {
      color: Colors.white,
      fontSize: 11,
      fontWeight: FontWeight.bold,
    },

    // 4. Bento Section
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    sectionHeading: {
      color: Colors.text,
      fontSize: FontSize.lg,
      fontWeight: FontWeight.extrabold,
      letterSpacing: -0.3,
    },
    sectionSubHeading: {
      color: Colors.textMuted,
      fontSize: 11,
      fontWeight: FontWeight.medium,
    },
    bentoGrid: {
      gap: Spacing.md,
    },
    serviceTile: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    packersTile: {
      borderLeftWidth: 4,
      borderLeftColor: Colors.marigoldDark,
    },
    trucksTile: {
      borderLeftWidth: 4,
      borderLeftColor: Colors.navyMuted,
    },
    tileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tileIconBox: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileBadgePill: {
      backgroundColor: Colors.marigoldSubtle,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    tileBadgeText: {
      color: Colors.marigoldDark,
      fontSize: 10,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.6,
    },
    tileBody: {
      gap: 4,
    },
    tileTitle: {
      color: Colors.text,
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      letterSpacing: -0.3,
    },
    tileDescription: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      lineHeight: 19,
    },
    tileFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
    },
    tileActionLink: {
      color: Colors.text,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
    },
    tileArrowCircle: {
      width: 30,
      height: 30,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // 5. Trust Strip
    trustStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      ...Shadow.sm,
    },
    trustItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    trustDivider: {
      width: 1,
      height: 28,
      backgroundColor: Colors.cardBorder,
      marginHorizontal: Spacing.xs,
    },
    trustIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustCopy: {
      flex: 1,
    },
    trustTitle: {
      color: Colors.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
    },
    trustSub: {
      color: Colors.textMuted,
      fontSize: 10,
      fontWeight: FontWeight.medium,
      marginTop: 1,
    },

    // 6. How it works
    stepsCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    stepsHeading: {
      color: Colors.text,
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      letterSpacing: -0.2,
      marginBottom: Spacing.xs,
    },
    stepItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    stepNumBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.marigoldSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepNumText: {
      color: Colors.marigoldDark,
      fontSize: 11,
      fontWeight: FontWeight.extrabold,
    },
    stepCopy: {
      flex: 1,
      gap: 2,
    },
    stepTitle: {
      color: Colors.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
    },
    stepDesc: {
      color: Colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },
  });
