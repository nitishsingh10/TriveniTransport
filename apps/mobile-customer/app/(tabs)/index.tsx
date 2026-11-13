import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Truck,
  Package,
  Navigation,
  CheckCircle2,
  Home,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  Car,
  Briefcase,
  Crosshair,
  Flag,
  Calendar,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { bookingApi, mapsApi, type BookingItem, type PlaceLocation } from '@/lib/api';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';

const MOVING_SERVICES = [
  {
    id: 'home',
    title: 'Home Shifting',
    subtitle: '1, 2, 3+ BHK & Villas',
    price: 'From ₹2,499',
    badge: 'Popular',
    icon: Home,
    color: '#0D1F37',
    iconBg: 'rgba(13, 31, 55, 0.08)',
    config: '2bhk',
  },
  {
    id: 'office',
    title: 'Office Relocation',
    subtitle: 'Desks, IT & archives',
    price: 'Custom quote',
    badge: 'Corporate',
    icon: Briefcase,
    color: '#0D1F37',
    iconBg: 'rgba(13, 31, 55, 0.08)',
    config: 'office',
  },
  {
    id: 'mini',
    title: 'Few Items / Mini Move',
    subtitle: 'Sofas, appliances & boxes',
    price: 'From ₹1,499',
    badge: 'Quick',
    icon: Package,
    color: '#0D1F37',
    iconBg: 'rgba(13, 31, 55, 0.08)',
    config: '1bhk',
  },
  {
    id: 'vehicle',
    title: 'Vehicle Transport',
    subtitle: 'Cars, bikes & two-wheelers',
    price: 'Safe transit',
    badge: 'Insured',
    icon: Car,
    color: '#0D1F37',
    iconBg: 'rgba(13, 31, 55, 0.08)',
    config: '1bhk',
  },
];

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Locked Rates',
    desc: 'Transparent itemised pricing. Zero unexpected move-day surcharges.',
  },
  {
    icon: Navigation,
    title: 'Live GPS Tracking',
    desc: 'Watch your dedicated vehicle progress in real-time from door to door.',
  },
  {
    icon: Package,
    title: 'Damage Protection',
    desc: 'Multi-layer bubble packing, trained crew, and up to ₹10L insurance.',
  },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);

  // Address search state
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceLocation[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceLocation[]>([]);
  const [showPickupSug, setShowPickupSug] = useState(false);
  const [showDropSug, setShowDropSug] = useState(false);
  const [isPickupLoading, setIsPickupLoading] = useState(false);
  const [isDropLoading, setIsDropLoading] = useState(false);

  // Map Picker Modal State
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | undefined>();

  const pickupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const list = await bookingApi.list();
        if (isMounted && list && Array.isArray(list)) {
          const active = list.find((b) =>
            ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED', 'CONFIRMED', 'REQUESTED'].includes(b.status)
          );
          setActiveBooking(active || null);
        } else {
          if (isMounted) setActiveBooking(null);
        }
      } catch {
        if (isMounted) setActiveBooking(null);
      } finally {
        if (isMounted) setIsLoadingBooking(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handlePickupChange = (text: string) => {
    setPickup(text);
    if (pickupDebounce.current) clearTimeout(pickupDebounce.current);
    if (text.trim().length < 2) {
      setPickupSuggestions([]);
      setShowPickupSug(false);
      setIsPickupLoading(false);
      return;
    }
    const local = mapsApi.getLocalMatches(text);
    setPickupSuggestions(local);
    setShowPickupSug(true);
    setIsPickupLoading(true);
    pickupDebounce.current = setTimeout(async () => {
      try {
        const res = await mapsApi.searchPlaces(text);
        if (res && res.length > 0) {
          setPickupSuggestions((prev) => {
            const seen = new Set(res.map((r) => r.placeId || r.description));
            return [...res, ...prev.filter((p) => !seen.has(p.placeId || p.description))].slice(0, 5);
          });
        }
      } catch {
        // keep local matches
      } finally {
        setIsPickupLoading(false);
      }
    }, 250);
  };

  const handleDropChange = (text: string) => {
    setDrop(text);
    if (dropDebounce.current) clearTimeout(dropDebounce.current);
    if (text.trim().length < 2) {
      setDropSuggestions([]);
      setShowDropSug(false);
      setIsDropLoading(false);
      return;
    }
    const local = mapsApi.getLocalMatches(text);
    setDropSuggestions(local);
    setShowDropSug(true);
    setIsDropLoading(true);
    dropDebounce.current = setTimeout(async () => {
      try {
        const res = await mapsApi.searchPlaces(text);
        if (res && res.length > 0) {
          setDropSuggestions((prev) => {
            const seen = new Set(res.map((r) => r.placeId || r.description));
            return [...res, ...prev.filter((p) => !seen.has(p.placeId || p.description))].slice(0, 5);
          });
        }
      } catch {
        // keep local matches
      } finally {
        setIsDropLoading(false);
      }
    }, 250);
  };

  const selectPickup = (item: PlaceLocation) => {
    setPickup(item.description);
    if (item.lat && item.lng) {
      setPickupCoords({ lat: item.lat, lng: item.lng });
    }
    setShowPickupSug(false);
    setPickupSuggestions([]);
  };

  const selectDrop = (item: PlaceLocation) => {
    setDrop(item.description);
    if (item.lat && item.lng) {
      setDropCoords({ lat: item.lat, lng: item.lng });
    }
    setShowDropSug(false);
    setDropSuggestions([]);
  };

  const handleMapSelect = (loc: { address: string; lat: number; lng: number; city: string }) => {
    if (mapModalType === 'pickup') {
      setPickup(loc.address);
      setPickupCoords({ lat: loc.lat, lng: loc.lng });
    } else if (mapModalType === 'drop') {
      setDrop(loc.address);
      setDropCoords({ lat: loc.lat, lng: loc.lng });
    }
    setMapModalType(null);
  };

  const handleGetEstimate = () => {
    Keyboard.dismiss();
    const params: Record<string, string> = {};
    if (pickup.trim()) params.pickup = pickup.trim();
    if (drop.trim()) params.drop = drop.trim();
    if (pickupCoords) {
      params.pickupLat = pickupCoords.lat.toString();
      params.pickupLng = pickupCoords.lng.toString();
    }
    if (dropCoords) {
      params.dropLat = dropCoords.lat.toString();
      params.dropLng = dropCoords.lng.toString();
    }
    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    router.push((`/quote${query}`) as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* ── Welcoming Header ────────────────────────────────────────── */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.greetingText}>
            Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.taglineText}>Where are we moving today?</Text>
        </View>
        <View style={styles.cityPill}>
          <MapPin size={11} color={Colors.marigoldDark} />
          <Text style={styles.cityPillText}>Mumbai & Thane</Text>
        </View>
      </View>

      {/* ── Active Move Status (Contextual: Only when active move exists) ── */}
      {isLoadingBooking ? null : activeBooking ? (
        <View style={styles.activeMoveCard}>
          <View style={styles.activeMoveHeader}>
            <View style={styles.liveBadgeRow}>
              <View
                style={[
                  styles.liveDot,
                  !['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED'].includes(activeBooking.status) && {
                    backgroundColor: Colors.marigold,
                  },
                ]}
              />
              <Text style={styles.liveBadgeText}>
                {['IN_PROGRESS', 'EN_ROUTE'].includes(activeBooking.status)
                  ? 'LIVE IN TRANSIT'
                  : activeBooking.status === 'ARRIVED'
                  ? 'DRIVER AT PICKUP'
                  : activeBooking.status === 'ASSIGNED'
                  ? 'DRIVER ASSIGNED'
                  : activeBooking.status === 'CONFIRMED'
                  ? 'MOVE CONFIRMED'
                  : 'REQUEST RECEIVED'}
              </Text>
            </View>
            <Text style={styles.activeBookingId}>#{activeBooking.id.slice(-6).toUpperCase()}</Text>
          </View>

          <View style={styles.activeRouteRow}>
            <View style={styles.routeCol}>
              <View style={styles.routeDotGreen} />
              <Text style={styles.routeAddress} numberOfLines={1}>
                {activeBooking.pickupAddress || 'Pickup location'}
              </Text>
            </View>
            <ArrowRight size={14} color={Colors.textMuted} />
            <View style={styles.routeCol}>
              <View style={styles.routeDotGold} />
              <Text style={styles.routeAddress} numberOfLines={1}>
                {activeBooking.dropAddress || 'Drop destination'}
              </Text>
            </View>
          </View>

          <View style={styles.activeFooter}>
            <View style={styles.activeDateBadge}>
              <Calendar size={12} color={Colors.textSecondary} />
              <Text style={styles.activeDateText}>
                {activeBooking.scheduledDate
                  ? new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'Scheduled'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.trackLiveBtn}
              onPress={() => router.push(`/booking/${activeBooking.id}`)}
              activeOpacity={0.85}
            >
              <Navigation size={13} color={Colors.white} />
              <Text style={styles.trackLiveBtnText}>Track Vehicle Live</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* ── Master Route Planner Hub (with live address suggestions) ───────────── */}
      <View style={styles.plannerContainer}>
        <LinearGradient
          colors={['#081423', '#0D1F37', '#122B4D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.plannerCard}
        >
          <View style={styles.plannerHeader}>
            <View style={styles.plannerBadge}>
              <Sparkles size={12} color={Colors.marigold} />
              <Text style={styles.plannerBadgeText}>INSTANT TRANSPARENT ESTIMATE</Text>
            </View>
            <Text style={styles.plannerTitle}>Plan Your Relocation</Text>
          </View>

          {/* Route Inputs Container */}
          <View style={styles.routeInputsBox}>
            {/* Pickup Row */}
            <View style={styles.routeInputRow}>
              <View style={styles.beaconCircleGreen}>
                <View style={styles.beaconInnerDotGreen} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.inputMiniLabel}>PICKUP FROM</Text>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Enter society or landmark..."
                  placeholderTextColor="rgba(13,31,55,0.35)"
                  value={pickup}
                  onChangeText={handlePickupChange}
                  onFocus={() => { if (pickupSuggestions.length > 0) setShowPickupSug(true); }}
                  returnKeyType="next"
                />
              </View>
              {isPickupLoading && <ActivityIndicator size="small" color={Colors.marigoldDark} />}
              {pickup.length > 0 && !isPickupLoading && (
                <TouchableOpacity
                  onPress={() => { setPickup(''); setShowPickupSug(false); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.pinTagGold}
                onPress={() => setMapModalType('pickup')}
                activeOpacity={0.75}
              >
                <MapPin size={12} color={Colors.marigoldDark} />
                <Text style={styles.pinTagText}>Map</Text>
              </TouchableOpacity>
            </View>

            {/* Pickup Suggestions */}
            {showPickupSug && pickupSuggestions.length > 0 && (
              <View style={styles.homeSuggestionsBox}>
                {pickupSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId || item.description}
                    style={styles.homeSuggRow}
                    onPress={() => selectPickup(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.homeSugPinBox}>
                      <MapPin size={12} color={Colors.marigoldDark} strokeWidth={2.2} />
                    </View>
                    <View style={styles.homeSugTextCol}>
                      <Text style={styles.homeSugMain} numberOfLines={1}>{item.mainText}</Text>
                      {item.secondaryText ? (
                        <Text style={styles.homeSugSub} numberOfLines={1}>{item.secondaryText}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Connecting Track Line */}
            <View style={styles.trackConnectorLine}>
              <View style={styles.trackDashedBar} />
            </View>

            {/* Destination Row */}
            <View style={styles.routeInputRow}>
              <View style={styles.beaconCircleGold}>
                <View style={styles.beaconInnerDotGold} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.inputMiniLabel}>DELIVER TO</Text>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Enter destination address..."
                  placeholderTextColor="rgba(13,31,55,0.35)"
                  value={drop}
                  onChangeText={handleDropChange}
                  onFocus={() => { if (dropSuggestions.length > 0) setShowDropSug(true); }}
                  returnKeyType="done"
                />
              </View>
              {isDropLoading && <ActivityIndicator size="small" color={Colors.navy} />}
              {drop.length > 0 && !isDropLoading && (
                <TouchableOpacity
                  onPress={() => { setDrop(''); setShowDropSug(false); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.pinTagNavy}
                onPress={() => setMapModalType('drop')}
                activeOpacity={0.75}
              >
                <Flag size={12} color={Colors.navy} />
                <Text style={[styles.pinTagText, { color: Colors.navy }]}>Map</Text>
              </TouchableOpacity>
            </View>

            {/* Drop Suggestions */}
            {showDropSug && dropSuggestions.length > 0 && (
              <View style={styles.homeSuggestionsBox}>
                {dropSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId || item.description}
                    style={styles.homeSuggRow}
                    onPress={() => selectDrop(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.homeSugPinBox, { backgroundColor: Colors.navySubtle }]}>
                      <MapPin size={12} color={Colors.navy} strokeWidth={2.2} />
                    </View>
                    <View style={styles.homeSugTextCol}>
                      <Text style={styles.homeSugMain} numberOfLines={1}>{item.mainText}</Text>
                      {item.secondaryText ? (
                        <Text style={styles.homeSugSub} numberOfLines={1}>{item.secondaryText}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.planCtaBtn}
            onPress={handleGetEstimate}
            activeOpacity={0.88}
          >
            <Text style={styles.planCtaText}>Get Instant Estimate</Text>
            <ArrowRight size={16} color={Colors.navy} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Quick Zone Suggestions */}
          <View style={styles.zoneShortcutsRow}>
            <TouchableOpacity
              style={styles.zonePill}
              onPress={() => { setPickup('Viman Nagar, Pune, Maharashtra, India'); setShowPickupSug(false); }}
              activeOpacity={0.75}
            >
              <Crosshair size={11} color={Colors.marigold} />
              <Text style={styles.zonePillText}>Viman Nagar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zonePill}
              onPress={() => { setDrop('Thane West, Thane, Maharashtra, India'); setShowDropSug(false); }}
              activeOpacity={0.75}
            >
              <Text style={styles.zonePillText}>Thane West</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zonePill}
              onPress={() => { setDrop('Bandra Kurla Complex (BKC), Mumbai, Maharashtra'); setShowDropSug(false); }}
              activeOpacity={0.75}
            >
              <Text style={styles.zonePillText}>Bandra BKC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zonePill}
              onPress={() => { setDrop('Hinjewadi Phase 1, Pune, Maharashtra, India'); setShowDropSug(false); }}
              activeOpacity={0.75}
            >
              <Text style={styles.zonePillText}>Hinjewadi</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* ── Reassurance Strip (Clean & Unobtrusive) ──────────────────── */}
      <View style={styles.assuranceStrip}>
        <View style={styles.assuranceItem}>
          <ShieldCheck size={14} color={Colors.navy} />
          <Text style={styles.assuranceText}>₹0 Advance to Lock Date</Text>
        </View>
        <View style={styles.assuranceDot} />
        <View style={styles.assuranceItem}>
          <Clock size={14} color={Colors.navy} />
          <Text style={styles.assuranceText}>On-Time Assurance</Text>
        </View>
        <View style={styles.assuranceDot} />
        <View style={styles.assuranceItem}>
          <CheckCircle2 size={14} color={Colors.success} />
          <Text style={styles.assuranceText}>100% Transit Safe</Text>
        </View>
      </View>

      {/* ── Moving Services Categories (Clean 2x2 Grid) ──────────────── */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Your Move Type</Text>
          <TouchableOpacity onPress={() => router.push('/quote')} activeOpacity={0.7}>
            <Text style={styles.sectionActionText}>View Catalog</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {MOVING_SERVICES.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceCard}
                onPress={() => router.push('/quote')}
                activeOpacity={0.85}
              >
                <View style={styles.serviceCardTop}>
                  <View style={[styles.serviceIconBox, { backgroundColor: item.iconBg }]}>
                    <IconComp size={20} color={item.color} strokeWidth={2.2} />
                  </View>
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{item.badge}</Text>
                  </View>
                </View>

                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{item.title}</Text>
                  <Text style={styles.serviceSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>

                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>{item.price}</Text>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── The Triveni Standard (Spacious Trust Pillars) ───────────── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>The Triveni Standard</Text>
        <View style={styles.trustStack}>
          {TRUST_PILLARS.map((pillar) => {
            const IconComp = pillar.icon;
            return (
              <View key={pillar.title} style={styles.trustItemCard}>
                <View style={styles.trustIconWrap}>
                  <IconComp size={18} color={Colors.marigoldDark} strokeWidth={2.2} />
                </View>
                <View style={styles.trustContent}>
                  <Text style={styles.trustTitle}>{pillar.title}</Text>
                  <Text style={styles.trustDesc}>{pillar.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      </ScrollView>

      {/* Full-Screen Uber-Themed Interactive Map Pinning Modal */}
      <GoogleMapsLocationModal
        visible={mapModalType !== null}
        type={mapModalType || 'pickup'}
        title={mapModalType === 'pickup' ? 'Select Pickup Point' : 'Select Destination Point'}
        initialValue={mapModalType === 'pickup' ? pickup : drop}
        onSelect={handleMapSelect}
        onClose={() => setMapModalType(null)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingBottom: Spacing.xxxl,
  },

  // ── Welcome Header ──────────────────────────────────────────
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  welcomeTextGroup: {
    flex: 1,
    gap: 2,
  },
  greetingText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    letterSpacing: -0.3,
  },
  taglineText: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
    ...Shadow.sm,
  },
  cityPillText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  // ── Active Move Card ────────────────────────────────────────
  activeMoveCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: Spacing.sm + 2,
    ...Shadow.md,
  },
  activeMoveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveBadgeText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  activeBookingId: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  activeRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  routeCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  routeDotGold: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.marigold,
  },
  routeAddress: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: FontWeight.semibold,
    color: Colors.navyDark,
  },
  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  activeDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDateText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  trackLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  trackLiveBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },

  // ── Master Route Planner Card ───────────────────────────────
  plannerContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  plannerCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.lg,
  },
  plannerHeader: {
    gap: 4,
  },
  plannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  plannerBadgeText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.marigold,
    letterSpacing: 0.8,
  },
  plannerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  routeInputsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  beaconCircleGreen: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInnerDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  beaconCircleGold: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 163, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInnerDotGold: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.marigold,
  },
  routeTextCol: {
    flex: 1,
    gap: 1,
  },
  inputMiniLabel: {
    fontSize: 8.5,
    fontWeight: FontWeight.extrabold,
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  inputPlaceholderText: {
    fontSize: FontSize.xs + 1,
    color: Colors.navyDark,
    fontWeight: FontWeight.semibold,
  },
  pinTagGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.marigoldSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
  },
  pinTagNavy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.navySubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
  },
  pinTagText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
  },
  trackConnectorLine: {
    height: 10,
    justifyContent: 'center',
    paddingLeft: 21,
  },
  trackDashedBar: {
    width: 1.5,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  planCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.xl,
    paddingVertical: 13,
    ...Shadow.glowSm,
  },
  planCtaText: {
    fontSize: FontSize.sm + 0.5,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
  },

  zoneShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  zonePillText: {
    fontSize: 10.5,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // ── Reassurance Strip ───────────────────────────────────────
  assuranceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    ...Shadow.sm,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assuranceText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  assuranceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.cardBorder,
  },

  // ── Moving Services ─────────────────────────────────────────
  sectionBlock: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm + 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    letterSpacing: -0.2,
  },
  sectionActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  serviceCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  serviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadge: {
    backgroundColor: 'rgba(13, 31, 55, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  serviceBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  serviceContent: {
    gap: 2,
  },
  serviceTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  serviceSubtitle: {
    fontSize: 10.5,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 31, 55, 0.04)',
  },
  servicePrice: {
    fontSize: 11,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
  },

  // ── The Triveni Standard ────────────────────────────────────
  trustStack: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  trustItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    marginTop: 2,
  },
  trustContent: {
    flex: 1,
    gap: 2,
  },
  trustTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  trustDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Home screen inline address TextInput ────────────────────
  inlineInput: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.semibold,
    paddingVertical: 1,
    minHeight: 20,
  },

  // ── Home screen suggestion dropdown ─────────────────────────
  homeSuggestionsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
    marginTop: 4,
    overflow: 'hidden',
  },
  homeSuggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 31, 55, 0.04)',
  },
  homeSugPinBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeSugTextCol: {
    flex: 1,
    gap: 1,
  },
  homeSugMain: {
    fontSize: FontSize.xs + 0.5,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  homeSugSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
