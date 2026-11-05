import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Home,
  Building2,
  Bed,
  Briefcase,
  Layers,
  ArrowRight,
  Compass,
  Crosshair,
  Flag,
  Navigation,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ConfigurationType } from '@triveni/shared-types';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';
import { GoogleMapsRouteCard } from '@/components/GoogleMapsRouteCard';
import { mapsApi, RouteEstimate, PlaceLocation } from '@/lib/api';

interface ConfigOption {
  value: ConfigurationType;
  label: string;
  icon: React.ComponentType<any>;
}

const CONFIGS: ConfigOption[] = [
  { value: '1bhk', label: '1 BHK', icon: Home },
  { value: '2bhk', label: '2 BHK', icon: Home },
  { value: '3bhk', label: '3 BHK', icon: Building2 },
  { value: '4bhk', label: '4 BHK', icon: Building2 },
  { value: 'studio', label: 'Studio Room', icon: Bed },
  { value: 'villa', label: 'Luxury Villa', icon: Home },
  { value: 'office', label: 'Commercial Office', icon: Briefcase },
];

const FLOORS = ['Ground', '1st', '2nd', '3rd', '4th', '5th+'];

export default function QuoteIndexScreen() {
  const params = useLocalSearchParams<{
    pickup?: string;
    drop?: string;
    config?: string;
    pickupLat?: string;
    pickupLng?: string;
    dropLat?: string;
    dropLng?: string;
  }>();
  const [pickup, setPickup] = useState(params.pickup || '');
  const [drop, setDrop] = useState(params.drop || '');
  const [config, setConfig] = useState<ConfigurationType>((params.config as ConfigurationType) || '2bhk');
  const [floor, setFloor] = useState(0);
  const [lift, setLift] = useState(true);

  // Address suggestions state (Google Maps style)
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceLocation[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceLocation[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [isPickupLoading, setIsPickupLoading] = useState(false);
  const [isDropLoading, setIsDropLoading] = useState(false);

  const pickupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Maps Pinning Modal State
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | undefined>(
    params.pickupLat && params.pickupLng
      ? { lat: parseFloat(params.pickupLat), lng: parseFloat(params.pickupLng) }
      : undefined
  );
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | undefined>(
    params.dropLat && params.dropLng
      ? { lat: parseFloat(params.dropLat), lng: parseFloat(params.dropLng) }
      : undefined
  );

  // Fetch route estimate when both addresses are valid
  useEffect(() => {
    if (pickup.trim().length > 3 && drop.trim().length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await mapsApi.getRouteEstimate(pickup, drop);
          setRouteEstimate(res);
        } catch {
          setRouteEstimate({ distanceKm: 14.5, durationMins: 38 });
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRouteEstimate(null);
    }
  }, [pickup, drop]);

  const canProceed = pickup.trim().length > 2 && drop.trim().length > 2;

  // Handle address input typing with instant local matching + debounced Google Places suggestions
  const handlePickupChange = (text: string) => {
    setPickup(text);
    if (pickupDebounce.current) clearTimeout(pickupDebounce.current);

    if (text.trim().length < 2) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      setIsPickupLoading(false);
      return;
    }

    // Instant local match (0ms latency, exactly like Google Maps cache)
    const localMatches = mapsApi.getLocalMatches(text);
    setPickupSuggestions(localMatches);
    setShowPickupSuggestions(true);
    setIsPickupLoading(true);

    pickupDebounce.current = setTimeout(async () => {
      try {
        const results = await mapsApi.searchPlaces(text);
        if (results && results.length > 0) {
          setPickupSuggestions((prev) => {
            const seen = new Set(results.map((r) => r.placeId || r.description));
            const merged = [...results, ...prev.filter((p) => !seen.has(p.placeId || p.description))];
            return merged.slice(0, 6);
          });
        }
      } catch {
        // Keep local matches
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
      setShowDropSuggestions(false);
      setIsDropLoading(false);
      return;
    }

    // Instant local match (0ms latency)
    const localMatches = mapsApi.getLocalMatches(text);
    setDropSuggestions(localMatches);
    setShowDropSuggestions(true);
    setIsDropLoading(true);

    dropDebounce.current = setTimeout(async () => {
      try {
        const results = await mapsApi.searchPlaces(text);
        if (results && results.length > 0) {
          setDropSuggestions((prev) => {
            const seen = new Set(results.map((r) => r.placeId || r.description));
            const merged = [...results, ...prev.filter((p) => !seen.has(p.placeId || p.description))];
            return merged.slice(0, 6);
          });
        }
      } catch {
        // Keep local matches
      } finally {
        setIsDropLoading(false);
      }
    }, 250);
  };

  const handleSelectPickupSuggestion = (item: PlaceLocation) => {
    setPickup(item.description);
    if (item.lat && item.lng) {
      setPickupCoords({ lat: item.lat, lng: item.lng });
    }
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
  };

  const handleSelectDropSuggestion = (item: PlaceLocation) => {
    setDrop(item.description);
    if (item.lat && item.lng) {
      setDropCoords({ lat: item.lat, lng: item.lng });
    }
    setShowDropSuggestions(false);
    setDropSuggestions([]);
  };

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number; city: string; type?: 'pickup' | 'drop' }) => {
    const targetType = loc.type || mapModalType;
    if (targetType === 'pickup') {
      setPickup(loc.address);
      setPickupCoords({ lat: loc.lat, lng: loc.lng });
      setShowPickupSuggestions(false);
    } else if (targetType === 'drop') {
      setDrop(loc.address);
      setDropCoords({ lat: loc.lat, lng: loc.lng });
      setShowDropSuggestions(false);
    }
    setMapModalType(null);
  };

  const handleUseCurrentLocationForPickup = () => {
    setShowPickupSuggestions(false);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            const rev = await mapsApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setPickup(rev.address);
          } catch {
            setPickup('Viman Nagar, Pune, Maharashtra');
            setPickupCoords({ lat: 18.5679, lng: 73.9143 });
          }
        },
        () => {
          setPickup('Viman Nagar, Pune, Maharashtra');
          setPickupCoords({ lat: 18.5679, lng: 73.9143 });
        }
      );
    } else {
      setPickup('Viman Nagar, Pune, Maharashtra');
      setPickupCoords({ lat: 18.5679, lng: 73.9143 });
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Modern Step Progress Bar ─────────────────────────────── */}
      <View style={styles.progressCard}>
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressNumActive}>1</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Locations</Text>
        </View>

        <View style={styles.progressLineActive} />

        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNum}>2</Text>
          </View>
          <Text style={styles.progressLabel}>Inventory</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNum}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Quote</Text>
        </View>
      </View>

      {/* ── Screen Title Group ────────────────────────────────────── */}
      <View style={styles.titleGroup}>
        <View style={styles.stepBadgePill}>
          <Sparkles size={11} color={Colors.marigoldDark} />
          <Text style={styles.stepBadgeText}>STEP 1 OF 3 · RELOCATION ROUTE</Text>
        </View>
        <Text style={styles.title}>Where are you moving?</Text>
        <Text style={styles.subtitle}>
          Enter addresses or select on the map for an instant estimate.
        </Text>
      </View>

      {/* ── Location Card with Route Connector ─────────────────────── */}
      <View style={styles.locationCard}>
        {/* Hero Banner to Open Map Pinning */}
        <TouchableOpacity
          style={styles.mapPinHeroBanner}
          onPress={() => setMapModalType('pickup')}
          activeOpacity={0.88}
        >
          <View style={styles.mapPinIconBox}>
            <Compass size={18} color={Colors.navy} strokeWidth={2.4} />
          </View>
          <View style={styles.mapPinBannerTextCol}>
            <Text style={styles.mapPinBannerTitle}>Select on Map</Text>
            <Text style={styles.mapPinBannerSub}>
              Pin exact pickup &amp; drop entrance on map
            </Text>
          </View>
          <View style={styles.bannerArrowCircle}>
            <ArrowRight size={14} color={Colors.navy} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>

        {/* Pickup Location Block */}
        <View style={styles.addressBlockWrap}>
          <View style={styles.inputContainerRow}>
            <View style={styles.routeIndicatorCol}>
              <View style={styles.pickupDotOuter}>
                <View style={styles.pickupDotInner} />
              </View>
              <View style={styles.routeVerticalTrack} />
            </View>

            <View style={styles.locationInputBlock}>
              <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Society name, street, or landmark"
                placeholderTextColor={Colors.inputPlaceholder}
                value={pickup}
                onChangeText={handlePickupChange}
                onFocus={() => {
                  if (pickupSuggestions.length > 0) setShowPickupSuggestions(true);
                }}
              />
            </View>

            {pickup.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setPickup('');
                  setShowPickupSuggestions(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <X size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.mapPickerTrigger}
              onPress={() => setMapModalType('pickup')}
              activeOpacity={0.75}
            >
              <MapPin size={12} color={Colors.marigoldDark} strokeWidth={2.4} />
              <Text style={styles.mapPickerTriggerText}>Pin Map</Text>
            </TouchableOpacity>
          </View>

          {/* Google Maps Places Suggestions for Pickup */}
          {showPickupSuggestions && (
            <View style={styles.suggestionsContainer}>
              {isPickupLoading && (
                <View style={styles.suggestionLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.marigoldDark} />
                  <Text style={styles.suggestionLoadingText}>Searching Google Maps locations...</Text>
                </View>
              )}
              {pickupSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId || item.description}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectPickupSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionPinBox}>
                    <MapPin size={14} color={Colors.marigoldDark} strokeWidth={2.2} />
                  </View>
                  <View style={styles.suggestionTextBox}>
                    <Text style={styles.suggestionMainText} numberOfLines={1}>
                      {item.mainText || item.description}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={styles.suggestionSubText} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Drop Destination Block */}
        <View style={styles.addressBlockWrap}>
          <View style={styles.inputContainerRow}>
            <View style={styles.routeIndicatorCol}>
              <View style={styles.dropSquareOuter}>
                <View style={styles.dropSquareInner} />
              </View>
            </View>

            <View style={styles.locationInputBlock}>
              <Text style={styles.inputLabel}>DROP DESTINATION</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Delivery destination building or area"
                placeholderTextColor={Colors.inputPlaceholder}
                value={drop}
                onChangeText={handleDropChange}
                onFocus={() => {
                  if (dropSuggestions.length > 0) setShowDropSuggestions(true);
                }}
              />
            </View>

            {drop.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setDrop('');
                  setShowDropSuggestions(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <X size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mapPickerTrigger, styles.mapPickerTriggerNavy]}
              onPress={() => setMapModalType('drop')}
              activeOpacity={0.75}
            >
              <Flag size={12} color={Colors.navy} strokeWidth={2.4} />
              <Text style={[styles.mapPickerTriggerText, { color: Colors.navy }]}>Pin Map</Text>
            </TouchableOpacity>
          </View>

          {/* Google Maps Places Suggestions for Drop */}
          {showDropSuggestions && (
            <View style={styles.suggestionsContainer}>
              {isDropLoading && (
                <View style={styles.suggestionLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.navy} />
                  <Text style={styles.suggestionLoadingText}>Searching Google Maps locations...</Text>
                </View>
              )}
              {dropSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId || item.description}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectDropSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.suggestionPinBox, { backgroundColor: Colors.navySubtle }]}>
                    <MapPin size={14} color={Colors.navy} strokeWidth={2.2} />
                  </View>
                  <View style={styles.suggestionTextBox}>
                    <Text style={styles.suggestionMainText} numberOfLines={1}>
                      {item.mainText || item.description}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={styles.suggestionSubText} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Location Shortcuts */}
        <View style={styles.quickShortcutsRow}>
          <TouchableOpacity
            style={styles.quickGpsChip}
            onPress={handleUseCurrentLocationForPickup}
            activeOpacity={0.75}
          >
            <Crosshair size={12} color={Colors.navy} strokeWidth={2.2} />
            <Text style={styles.quickGpsText}>My GPS Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAreaChip}
            onPress={() => {
              setDrop('Thane West, Maharashtra');
              setShowDropSuggestions(false);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Thane West</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAreaChip}
            onPress={() => {
              setDrop('Bandra BKC, Mumbai');
              setShowDropSuggestions(false);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Bandra BKC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAreaChip}
            onPress={() => {
              setDrop('Hinjewadi Phase 1, Pune');
              setShowDropSuggestions(false);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Hinjewadi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Maps Route Preview Card */}
      {routeEstimate && (
        <GoogleMapsRouteCard
          pickupAddress={pickup}
          dropAddress={drop}
          pickupCoords={pickupCoords}
          dropCoords={dropCoords}
          distanceKm={routeEstimate.distanceKm}
          durationMins={routeEstimate.durationMins}
          onOpenMapPicker={() => setMapModalType('pickup')}
        />
      )}

      {/* ── Home Configuration Grid ─────────────────────────────────── */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Home Size / Configuration</Text>
          <Text style={styles.sectionSubtitle}>Standard truck sized to fit</Text>
        </View>
        <View style={styles.configGrid}>
          {CONFIGS.map((c) => {
            const Icon = c.icon;
            const isSelected = config === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[styles.configChip, isSelected && styles.configChipActive]}
                onPress={() => setConfig(c.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.configIconBox, isSelected && styles.configIconBoxActive]}>
                  <Icon
                    size={16}
                    color={isSelected ? Colors.marigold : Colors.navy}
                    strokeWidth={isSelected ? 2.4 : 1.8}
                  />
                </View>
                <Text
                  style={[
                    styles.configLabel,
                    isSelected && styles.configLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Floor Number Level ───────────────────────────────────────── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Pickup Floor Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.floorRow}>
            {FLOORS.map((f, i) => {
              const isSelected = floor === i;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.floorChip, isSelected && styles.floorChipActive]}
                  onPress={() => setFloor(i)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.floorText,
                      isSelected && styles.floorTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Lift Available Toggle Card ──────────────────────────────── */}
      <TouchableOpacity
        style={styles.liftToggleCard}
        onPress={() => setLift(!lift)}
        activeOpacity={0.85}
      >
        <View style={styles.liftInfo}>
          <View style={styles.liftIconCircle}>
            <Layers size={18} color={Colors.navy} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liftTitle}>Service Lift / Elevator Available</Text>
            <Text style={styles.liftSub}>
              {lift
                ? 'Elevator available · Standard loading rates apply'
                : 'Staircase manual carry charges apply'}
            </Text>
          </View>
        </View>
        <View style={[styles.toggle, lift && styles.toggleActive]}>
          <View style={[styles.toggleThumb, lift && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>

      {/* ── Primary CTA Button ───────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.cta, !canProceed && styles.ctaDisabled]}
        disabled={!canProceed}
        onPress={() =>
          router.push({
            pathname: '/quote/inventory',
            params: {
              pickup,
              drop,
              config,
              floor: floor.toString(),
              lift: lift ? '1' : '0',
              distance: (routeEstimate?.distanceKm || 14.5).toString(),
            },
          })
        }
        activeOpacity={0.88}
      >
        <Text style={styles.ctaText}>Proceed to Item Inventory</Text>
        <ArrowRight size={17} color={Colors.navy} strokeWidth={2.6} />
      </TouchableOpacity>

      {/* Full-Screen Uber-Themed Interactive Map Pinning Modal */}
      {mapModalType && (
        <GoogleMapsLocationModal
          visible={Boolean(mapModalType)}
          title={mapModalType === 'pickup' ? 'Select Pickup Location' : 'Select Drop Destination'}
          initialValue={mapModalType === 'pickup' ? pickup : drop}
          type={mapModalType}
          onSelect={handleLocationSelected}
          onClose={() => setMapModalType(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },

  // ── Step Progress Indicator ──────────────────────────────────
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    ...Shadow.sm,
  },
  progressItem: {
    alignItems: 'center',
    gap: 4,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: Colors.navy,
  },
  progressNum: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressNumActive: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: 10.5,
    fontWeight: FontWeight.medium,
  },
  progressLabelActive: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: Spacing.sm,
    marginBottom: 16,
  },
  progressLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.navy,
    marginHorizontal: Spacing.sm,
    marginBottom: 16,
  },

  // ── Title Group ──────────────────────────────────────────────
  titleGroup: {
    gap: 4,
    paddingHorizontal: Spacing.xs,
  },
  stepBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(247, 163, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.25)',
  },
  stepBadgeText: {
    color: Colors.marigoldDark,
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  title: {
    color: Colors.navyDark,
    fontSize: FontSize.xl + 2,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
  },

  // ── Location Card ────────────────────────────────────────────
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.md,
  },

  // Hero Map Pin Banner
  mapPinHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1F37',
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.35)',
    ...Shadow.sm,
  },
  mapPinIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinBannerTextCol: {
    flex: 1,
    gap: 1,
  },
  mapPinBannerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.2,
  },
  mapPinBannerSub: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  bannerArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Address Block Wrap
  addressBlockWrap: {
    position: 'relative',
    gap: 4,
  },

  // Location Row
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.04)',
  },
  routeIndicatorCol: {
    alignItems: 'center',
    width: 18,
  },
  pickupDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  routeVerticalTrack: {
    width: 2,
    height: 36,
    backgroundColor: 'rgba(13, 31, 55, 0.12)',
    marginVertical: 2,
  },
  dropSquareOuter: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(247, 163, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropSquareInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.marigold,
  },
  locationInputBlock: {
    flex: 1,
    gap: 1,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
  },
  locationInput: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.semibold,
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  mapPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  mapPickerTriggerNavy: {
    backgroundColor: Colors.navySubtle,
    borderColor: Colors.navyBorder,
  },
  mapPickerTriggerText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
  },

  // Google Maps Style Suggestions
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.1)',
    overflow: 'hidden',
    marginTop: 4,
    ...Shadow.md,
  },
  suggestionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionLoadingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 31, 55, 0.04)',
  },
  suggestionPinBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextBox: {
    flex: 1,
    gap: 1,
  },
  suggestionMainText: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  suggestionSubText: {
    fontSize: 10.5,
    color: Colors.textSecondary,
  },

  // Shortcuts Row
  quickShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 31, 55, 0.05)',
  },
  quickGpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.12)',
    gap: 4,
    ...Shadow.sm,
  },
  quickGpsText: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  quickAreaChip: {
    backgroundColor: 'rgba(247, 163, 0, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.25)',
  },
  quickAreaText: {
    color: Colors.marigoldDark,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  // ── Sections & Grids ─────────────────────────────────────────
  sectionBlock: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  configChipActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
    ...Shadow.md,
  },
  configIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  configLabel: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 0.5,
    fontWeight: FontWeight.bold,
  },
  configLabelActive: {
    color: '#FFFFFF',
  },

  floorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  floorChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  floorChipActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
    ...Shadow.md,
  },
  floorText: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 0.5,
    fontWeight: FontWeight.bold,
  },
  floorTextActive: {
    color: '#FFFFFF',
  },

  // Lift Toggle Card
  liftToggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
    padding: Spacing.md,
    ...Shadow.sm,
  },
  liftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: Spacing.sm,
  },
  liftIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liftTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
  },
  liftSub: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: Colors.marigold,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },

  // Primary CTA Button
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 4,
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.xl,
    paddingVertical: 15,
    marginTop: Spacing.xs,
    ...Shadow.glowSm,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: Colors.navy,
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.2,
  },
});
