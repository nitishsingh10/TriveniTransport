import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Info,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';
import { GoogleMapsRouteCard } from '@/components/GoogleMapsRouteCard';
import {
  mapsApi,
  quoteApi,
  bookingApi,
  type RouteEstimate,
  type PlaceLocation,
  type TransportVehicleConfig,
  type TransportQuoteResponse,
} from '@/lib/api';
import { showToast } from '@/components/ToastHost';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';

const DEFAULT_VEHICLES: TransportVehicleConfig[] = [
  {
    type: 'tata_ace',
    displayName: 'Tata Ace (Chota Hathi)',
    description: 'Best for 1-2 BHK items, appliances, boxes & small freight',
    capacityCft: 300,
    payloadKg: 750,
    dimensions: '7ft x 4.8ft x 4.8ft',
    baseRate: 650,
    baseKm: 10,
    perKmRate: 37.64,
    helperRate: 350,
    recommendedFor: 'Light cargo, furniture, boxes',
  },
  {
    type: 'tata_407',
    displayName: 'Tata 407 (9ft / 10ft)',
    description: 'Medium commercial freight, machinery, full room shipments',
    capacityCft: 600,
    payloadKg: 1800,
    dimensions: '9.5ft x 5.5ft x 5ft',
    baseRate: 1400,
    baseKm: 12,
    perKmRate: 63.85,
    helperRate: 450,
    recommendedFor: 'Medium commercial cargo, raw goods',
  },
  {
    type: 'eicher_17ft',
    displayName: 'Eicher 17ft (Heavy Carrier)',
    description: 'Heavy industrial freight, bulk materials, full loads',
    capacityCft: 1100,
    payloadKg: 4000,
    dimensions: '17ft x 6.5ft x 7ft',
    baseRate: 2600,
    baseKm: 15,
    perKmRate: 150.0,
    helperRate: 600,
    recommendedFor: 'Heavy machinery, bulk pallet freight',
  },
];

const TIME_SLOTS = [
  '08:00 AM – 11:00 AM',
  '11:00 AM – 02:00 PM',
  '02:00 PM – 05:00 PM',
  '05:00 PM – 08:00 PM',
];

export default function TransportBookingScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const params = useLocalSearchParams<{
    pickup?: string;
    drop?: string;
    pickupLat?: string;
    pickupLng?: string;
  }>();

  const [pickup, setPickup] = useState(params.pickup || '');
  const [drop, setDrop] = useState(params.drop || '');
  const [selectedVehicleType, setSelectedVehicleType] = useState<'tata_ace' | 'tata_407' | 'eicher_17ft'>('tata_ace');
  const [helperCount, setHelperCount] = useState<number>(0);
  const [goodsType, setGoodsType] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState(TIME_SLOTS[1]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [vehicles, setVehicles] = useState<TransportVehicleConfig[]>(DEFAULT_VEHICLES);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [quoteResponse, setQuoteResponse] = useState<TransportQuoteResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map and suggestions state
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceLocation[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceLocation[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  const pickupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      value: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  // Calculate route distance when pickup and drop are provided
  useEffect(() => {
    if (pickup.trim().length > 3 && drop.trim().length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await mapsApi.getRouteEstimate(pickup, drop);
          setRouteEstimate(res);
          // Fetch dynamic vehicle rates
          const fetchedVehicles = await quoteApi.getTransportVehicles(res.distanceKm);
          if (fetchedVehicles && fetchedVehicles.length > 0) {
            setVehicles(fetchedVehicles);
          }
        } catch {
          setRouteEstimate({ distanceKm: 15.0, durationMins: 40 });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pickup, drop]);

  // Calculate live transport quote
  useEffect(() => {
    if (pickup.trim().length > 3 && drop.trim().length > 3) {
      setIsCalculating(true);
      const timer = setTimeout(async () => {
        try {
          const quote = await quoteApi.transport({
            pickupAddress: pickup.trim(),
            dropAddress: drop.trim(),
            vehicleType: selectedVehicleType,
            scheduledDate,
            scheduledSlot,
            helperCount,
            goodsType: goodsType.trim() || undefined,
            paymentMethod: 'cash_on_delivery',
          });
          setQuoteResponse(quote);
        } catch (e) {
          console.warn('Transport quote error:', e);
        } finally {
          setIsCalculating(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pickup, drop, selectedVehicleType, helperCount, goodsType, scheduledDate, scheduledSlot]);

  const handlePickupChange = (text: string) => {
    setPickup(text);
    if (pickupDebounce.current) clearTimeout(pickupDebounce.current);
    if (text.trim().length < 2) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      return;
    }
    setShowPickupSuggestions(true);
    pickupDebounce.current = setTimeout(async () => {
      try {
        setPickupSuggestions(await mapsApi.searchPlaces(text));
      } catch {
        setPickupSuggestions([]);
      }
    }, 250);
  };

  const handleDropChange = (text: string) => {
    setDrop(text);
    if (dropDebounce.current) clearTimeout(dropDebounce.current);
    if (text.trim().length < 2) {
      setDropSuggestions([]);
      setShowDropSuggestions(false);
      return;
    }
    setShowDropSuggestions(true);
    dropDebounce.current = setTimeout(async () => {
      try {
        setDropSuggestions(await mapsApi.searchPlaces(text));
      } catch {
        setDropSuggestions([]);
      }
    }, 250);
  };

  const handleUseCurrentLocation = async () => {
    try {
      let permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        showToast({ title: 'Location Permission Needed', message: 'Please allow location access to use current location.', variant: 'error' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const rev = await mapsApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setPickup(rev.address);
      setShowPickupSuggestions(false);
      showToast({ title: 'Location updated', message: rev.address, variant: 'success' });
    } catch {
      showToast({ title: 'Could not fetch location', variant: 'error' });
    }
  };

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number }) => {
    if (mapModalType === 'pickup') {
      setPickup(loc.address);
      setShowPickupSuggestions(false);
    } else if (mapModalType === 'drop') {
      setDrop(loc.address);
      setShowDropSuggestions(false);
    }
    setMapModalType(null);
  };

  const selectedVehicle = vehicles.find((v) => v.type === selectedVehicleType) || vehicles[0];

  const handleBookNow = async () => {
    if (!pickup.trim() || pickup.trim().length < 5) {
      Alert.alert('Pickup address required', 'Please enter a valid pickup address.');
      return;
    }
    if (!drop.trim() || drop.trim().length < 5) {
      Alert.alert('Drop address required', 'Please enter a valid drop address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingApi.createTransportBooking({
        pickupAddress: pickup.trim(),
        dropAddress: drop.trim(),
        vehicleType: selectedVehicleType,
        scheduledDate,
        scheduledSlot,
        helperCount,
        goodsType: goodsType.trim() || undefined,
        paymentMethod: 'cash_on_delivery',
      });

      if (res?.booking?.id) {
        showToast({
          title: 'Booking Received',
          message: `Booking #${res.booking.id.slice(-6).toUpperCase()} is confirmed. Partner assignment is pending.`,
          variant: 'success',
        });
        router.push(`/booking/${res.booking.id}`);
      } else {
        throw new Error('Booking could not be created');
      }
    } catch (e: any) {
      Alert.alert(
        'Could not place booking',
        e?.message || 'Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Transport &amp; Trucks</Text>
          <Text style={styles.headerSub}>Pickup-drop service with verified drivers</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Sparkles size={16} color={Colors.marigoldDark} />
          <Text style={styles.bannerText}>
            Transparent distance-based truck rates. Zero advance, 100% Pay on Delivery.
          </Text>
        </View>

        {/* ── 1. Route Section ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Trip Route</Text>

          {/* Pickup */}
          <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={17} color={Colors.success} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={pickup}
              onChangeText={handlePickupChange}
              placeholder="Enter pickup address, warehouse, or building"
              placeholderTextColor={Colors.inputPlaceholder}
            />
            <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.inlineGpsBtn}>
              <Crosshair size={16} color={Colors.marigoldDark} />
            </TouchableOpacity>
          </View>
          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {pickupSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={`p-${idx}`}
                  style={styles.suggestionRow}
                  onPress={() => {
                    setPickup(item.description);
                    setShowPickupSuggestions(false);
                  }}
                >
                  <MapPin size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Drop */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>DROP LOCATION</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={17} color={Colors.error} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={drop}
              onChangeText={handleDropChange}
              placeholder="Enter drop destination or delivery address"
              placeholderTextColor={Colors.inputPlaceholder}
            />
          </View>
          {showDropSuggestions && dropSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {dropSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={`d-${idx}`}
                  style={styles.suggestionRow}
                  onPress={() => {
                    setDrop(item.description);
                    setShowDropSuggestions(false);
                  }}
                >
                  <MapPin size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Map Selector Hero */}
          <TouchableOpacity
            style={styles.mapPinBtn}
            onPress={() => setMapModalType('pickup')}
            activeOpacity={0.85}
          >
            <Compass size={16} color={Colors.text} />
            <Text style={styles.mapPinText}>Pin location accurately on map</Text>
            <ArrowRight size={14} color={Colors.text} />
          </TouchableOpacity>

          {routeEstimate && (
            <View style={styles.routePill}>
              <Text style={styles.routePillText}>
                🛣️ Driving Distance: <Text style={{ fontWeight: '700' }}>{routeEstimate.distanceKm.toFixed(1)} km</Text> (~{routeEstimate.durationMins} mins)
              </Text>
            </View>
          )}
        </View>

        {/* ── 2. Select Vehicle ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Choose Vehicle</Text>
          <View style={styles.vehicleList}>
            {vehicles.map((v) => {
              const isSelected = v.type === selectedVehicleType;
              return (
                <PressableScale
                  key={v.type}
                  style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                  onPress={() => setSelectedVehicleType(v.type)}
                >
                  <View style={styles.vehicleHeader}>
                    <View style={[styles.vehicleIconCircle, isSelected && styles.vehicleIconCircleActive]}>
                      <Truck size={20} color={isSelected ? Colors.white : Colors.marigoldDark} />
                    </View>
                    <View style={styles.vehicleMainCopy}>
                      <Text style={[styles.vehicleName, isSelected && styles.vehicleNameActive]}>
                        {v.displayName}
                      </Text>
                      <Text style={styles.vehicleDesc}>{v.description}</Text>
                    </View>
                    <View style={styles.vehiclePriceCol}>
                      <Text style={styles.vehicleBaseFare}>₹{v.baseRate}</Text>
                      <Text style={styles.vehicleFareSub}>Base (incl. {v.baseKm}km)</Text>
                    </View>
                  </View>

                  <View style={styles.vehicleSpecsRow}>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>Payload: {v.payloadKg} kg</Text>
                    </View>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>Vol: {v.capacityCft} CFT</Text>
                    </View>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>{v.dimensions}</Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* ── 3. Helpers & Goods Type ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Helpers &amp; Cargo Details</Text>

          <Text style={styles.fieldLabel}>HELPERS NEEDED (LOADING / UNLOADING)</Text>
          <View style={styles.helperRow}>
            {[
              { count: 0, label: '0 Helpers (Driver only)' },
              { count: 1, label: `1 Helper (+₹${selectedVehicle.helperRate})` },
              { count: 2, label: `2 Helpers (+₹${selectedVehicle.helperRate * 2})` },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.count}
                style={[styles.helperChip, helperCount === opt.count && styles.helperChipActive]}
                onPress={() => setHelperCount(opt.count)}
                activeOpacity={0.8}
              >
                <Users size={14} color={helperCount === opt.count ? Colors.white : Colors.text} />
                <Text style={[styles.helperChipText, helperCount === opt.count && styles.helperChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>GOODS DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            style={[styles.textInput, styles.goodsInput]}
            value={goodsType}
            onChangeText={setGoodsType}
            placeholder="e.g. 10 cartons, washing machine, hardware supplies"
            placeholderTextColor={Colors.inputPlaceholder}
          />
        </View>

        {/* ── 4. Date & Time ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Schedule Trip</Text>

          <Text style={styles.fieldLabel}>PICKUP DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {dateOptions.map((opt) => {
              const active = scheduledDate === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setScheduledDate(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>{opt.day}</Text>
                  <Text style={[styles.dateVal, active && styles.dateTextActive]}>{opt.date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>PREFERRED TIME SLOT</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => {
              const active = scheduledSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotChip, active && styles.slotChipActive]}
                  onPress={() => setScheduledSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Clock size={13} color={active ? Colors.white : Colors.text} />
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 5. Fare Breakdown & Confirmation ── */}
        <View style={[styles.card, styles.fareCard]}>
          <Text style={styles.sectionTitle}>Fare Estimate</Text>

          {isCalculating ? (
            <View style={styles.loadingFare}>
              <ActivityIndicator color={Colors.marigoldDark} />
              <Text style={styles.loadingFareText}>Calculating optimal route &amp; fare…</Text>
            </View>
          ) : quoteResponse ? (
            <View style={styles.fareBreakdown}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Trip Fare (incl. {selectedVehicle.baseKm} km)</Text>
                <Text style={styles.fareVal}>₹{quoteResponse.breakdown.baseTripCharge}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance Charge ({quoteResponse.metrics.distanceKm.toFixed(1)} km)</Text>
                <Text style={styles.fareVal}>₹{quoteResponse.breakdown.distanceCharge}</Text>
              </View>
              {quoteResponse.breakdown.helperCharge > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Helper Assistance ({quoteResponse.metrics.helperCount} helper)</Text>
                  <Text style={styles.fareVal}>₹{quoteResponse.breakdown.helperCharge}</Text>
                </View>
              )}
              {quoteResponse.breakdown.tollOrSurcharges > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Tolls &amp; Highway Surcharges</Text>
                  <Text style={styles.fareVal}>₹{quoteResponse.breakdown.tollOrSurcharges}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>TOTAL ESTIMATED FARE</Text>
                  <Text style={styles.totalSub}>100% Cash on Delivery (Pay to Driver)</Text>
                </View>
                <Text style={styles.totalAmount}>₹{quoteResponse.quoteAmount}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyFare}>
              <Info size={16} color={Colors.textMuted} />
              <Text style={styles.emptyFareText}>
                Enter pickup and drop locations above to view your exact trip fare.
              </Text>
            </View>
          )}

          <PressableScale
            style={[styles.bookBtn, (!pickup || !drop || isSubmitting) && styles.bookBtnDisabled]}
            disabled={!pickup || !drop || isSubmitting}
            onPress={handleBookNow}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.bookBtnText}>Book Truck · Pay on Delivery</Text>
                <ArrowRight size={18} color={Colors.white} />
              </>
            )}
          </PressableScale>
        </View>
      </ScrollView>

      {/* Map modal for pinning location */}
      <GoogleMapsLocationModal
        visible={mapModalType !== null}
        type={mapModalType || 'pickup'}
        title={mapModalType === 'pickup' ? 'Pin Pickup Location' : 'Pin Drop Destination'}
        initialValue={mapModalType === 'pickup' ? pickup : drop}
        onSelect={handleLocationSelected}
        onClose={() => setMapModalType(null)}
      />
    </View>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.cardBorder,
      gap: Spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleBox: { flex: 1 },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
    headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
    content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    bannerText: { flex: 1, fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.medium },

    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      ...Shadow.sm,
    },
    sectionTitle: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      marginBottom: Spacing.sm,
    },
    fieldLabel: {
      fontSize: FontSize.xxs,
      fontWeight: FontWeight.bold,
      color: Colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.sm,
      height: 46,
    },
    inputIcon: { marginRight: Spacing.xs },
    textInput: {
      flex: 1,
      fontSize: FontSize.sm,
      color: Colors.text,
      height: '100%',
    },
    inlineGpsBtn: {
      padding: 6,
    },
    suggestionsBox: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      marginTop: 4,
      ...Shadow.md,
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      padding: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.cardBorder,
    },
    suggestionText: {
      fontSize: FontSize.xs,
      color: Colors.text,
      flex: 1,
    },
    mapPinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      marginTop: Spacing.sm,
    },
    mapPinText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.text,
    },
    routePill: {
      marginTop: Spacing.sm,
      padding: Spacing.xs,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.surfaceSubtle,
    },
    routePillText: {
      fontSize: FontSize.xs,
      color: Colors.text,
    },

    // Vehicle cards
    vehicleList: { gap: Spacing.sm },
    vehicleCard: {
      borderWidth: 1.5,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      backgroundColor: Colors.surface,
    },
    vehicleCardSelected: {
      borderColor: Colors.marigoldDark,
      backgroundColor: Colors.surfaceSubtle,
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    vehicleIconCircle: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleIconCircleActive: {
      backgroundColor: Colors.marigoldDark,
    },
    vehicleMainCopy: { flex: 1 },
    vehicleName: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    vehicleNameActive: { color: Colors.marigoldDark },
    vehicleDesc: {
      fontSize: FontSize.xxs,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    vehiclePriceCol: { alignItems: 'flex-end' },
    vehicleBaseFare: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    vehicleFareSub: {
      fontSize: FontSize.xxs,
      color: Colors.textMuted,
    },
    vehicleSpecsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
    },
    specBadge: {
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.sm,
    },
    specBadgeText: {
      fontSize: FontSize.xxs,
      color: Colors.textSecondary,
      fontWeight: FontWeight.medium,
    },

    // Helpers
    helperRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    helperChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.full,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: Colors.surface,
    },
    helperChipActive: {
      backgroundColor: Colors.brandSurface,
      borderColor: Colors.brandSurface,
    },
    helperChipText: {
      fontSize: FontSize.xs,
      color: Colors.text,
      fontWeight: FontWeight.medium,
    },
    helperChipTextActive: {
      color: Colors.white,
      fontWeight: FontWeight.bold,
    },
    goodsInput: {
      height: 42,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.sm,
      backgroundColor: Colors.surfaceSubtle,
    },

    // Date & Slot
    dateScroll: { gap: Spacing.xs, paddingVertical: 4 },
    dateChip: {
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      minWidth: 70,
      backgroundColor: Colors.surface,
    },
    dateChipActive: {
      backgroundColor: Colors.marigoldDark,
      borderColor: Colors.marigoldDark,
    },
    dateDay: { fontSize: FontSize.xxs, color: Colors.textMuted },
    dateVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 2 },
    dateTextActive: { color: Colors.white },
    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    slotChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: BorderRadius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: Colors.surface,
    },
    slotChipActive: {
      backgroundColor: Colors.brandSurface,
      borderColor: Colors.brandSurface,
    },
    slotText: { fontSize: FontSize.xs, color: Colors.text },
    slotTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

    // Fare breakdown
    fareCard: {
      backgroundColor: Colors.surface,
      borderColor: Colors.marigoldDark,
      borderWidth: 1.5,
    },
    loadingFare: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    loadingFareText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    emptyFare: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    emptyFareText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
    fareBreakdown: { gap: 8, marginVertical: Spacing.xs },
    fareRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fareLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
    fareVal: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.cardBorder, marginVertical: 6 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    totalLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.text },
    totalSub: { fontSize: FontSize.xxs, color: Colors.success, fontWeight: FontWeight.medium },
    totalAmount: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.marigoldDark },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      backgroundColor: Colors.marigoldDark,
      borderRadius: BorderRadius.md,
      paddingVertical: 14,
      marginTop: Spacing.md,
    },
    bookBtnDisabled: {
      opacity: 0.5,
    },
    bookBtnText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: Colors.white,
    },
  });
