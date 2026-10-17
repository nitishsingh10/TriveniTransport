import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
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
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ConfigurationType } from '@triveni/shared-types';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';
import { GoogleMapsRouteCard } from '@/components/GoogleMapsRouteCard';
import { mapsApi, RouteEstimate } from '@/lib/api';

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
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [config, setConfig] = useState<ConfigurationType>('2bhk');
  const [floor, setFloor] = useState(0);
  const [lift, setLift] = useState(true);

  // Google Maps Pinning Modal State
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);

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

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number; city: string; type?: 'pickup' | 'drop' }) => {
    const targetType = loc.type || mapModalType;
    if (targetType === 'pickup') {
      setPickup(loc.address);
    } else if (targetType === 'drop') {
      setDrop(loc.address);
    }
    setMapModalType(null);
  };

  const handleUseCurrentLocationForPickup = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const rev = await mapsApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setPickup(rev.address);
          } catch {
            setPickup('Viman Nagar, Pune, Maharashtra');
          }
        },
        () => setPickup('Viman Nagar, Pune, Maharashtra')
      );
    } else {
      setPickup('Viman Nagar, Pune, Maharashtra');
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Glassmorphic Step Progress Indicator */}
      <View style={styles.glassProgressCard}>
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

      {/* Screen Title */}
      <View style={styles.titleGroup}>
        <View style={styles.badgeRow}>
          <Text style={styles.stepBadge}>STEP 1 · RELOCATION ROUTE</Text>
        </View>
        <Text style={styles.title}>Where are you moving?</Text>
        <Text style={styles.subtitle}>
          Select pickup & drop points using our interactive Uber-styled map pin selector.
        </Text>
      </View>

      {/* Glassmorphic Location Pinning Card with Route Connector */}
      <View style={styles.glassLocationCard}>
        {/* Interactive Banner to open full Map Pinning */}
        <TouchableOpacity
          style={styles.mapPinHeroBanner}
          onPress={() => setMapModalType('pickup')}
          activeOpacity={0.88}
        >
          <View style={styles.mapPinIconBox}>
            <Compass size={20} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <View style={styles.mapPinBannerTextCol}>
            <Text style={styles.mapPinBannerTitle}>Select via Interactive Map Pinning</Text>
            <Text style={styles.mapPinBannerSub}>
              Drag to pin exact doorway or building in our Uber-themed map
            </Text>
          </View>
          <ArrowRight size={16} color={Colors.marigold} strokeWidth={2.6} />
        </TouchableOpacity>

        {/* Pickup Row */}
        <View style={styles.locationRow}>
          <View style={styles.routeIndicatorCol}>
            <View style={styles.pickupDot} />
            <View style={styles.routeVerticalLine} />
          </View>

          <View style={styles.locationInputBlock}>
            <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Society name, street, or landmark"
              placeholderTextColor={Colors.inputPlaceholder}
              value={pickup}
              onChangeText={setPickup}
            />
          </View>

          <TouchableOpacity
            style={styles.mapPickerTrigger}
            onPress={() => setMapModalType('pickup')}
            activeOpacity={0.75}
          >
            <MapPin size={13} color={Colors.marigoldDark} strokeWidth={2.4} />
            <Text style={styles.mapPickerTriggerText}>Pin Map</Text>
          </TouchableOpacity>
        </View>

        {/* Drop Destination Row */}
        <View style={styles.locationRow}>
          <View style={styles.routeIndicatorCol}>
            <View style={styles.dropSquare} />
          </View>

          <View style={styles.locationInputBlock}>
            <Text style={styles.inputLabel}>DROP DESTINATION</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Delivery destination building or area"
              placeholderTextColor={Colors.inputPlaceholder}
              value={drop}
              onChangeText={setDrop}
            />
          </View>

          <TouchableOpacity
            style={[styles.mapPickerTrigger, { backgroundColor: Colors.navySubtle, borderColor: Colors.navyBorder }]}
            onPress={() => setMapModalType('drop')}
            activeOpacity={0.75}
          >
            <Flag size={13} color={Colors.navy} strokeWidth={2.4} />
            <Text style={[styles.mapPickerTriggerText, { color: Colors.navy }]}>Pin Map</Text>
          </TouchableOpacity>
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
            onPress={() => setDrop('Baner, Pune, Maharashtra')}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Baner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAreaChip}
            onPress={() => setDrop('Hinjewadi Phase 1, Pune')}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Hinjewadi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAreaChip}
            onPress={() => setDrop('Powai, Mumbai')}
            activeOpacity={0.75}
          >
            <Text style={styles.quickAreaText}>+ Powai</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Maps Route Preview Card with Custom Uber Theme */}
      {routeEstimate && (
        <GoogleMapsRouteCard
          pickupAddress={pickup}
          dropAddress={drop}
          distanceKm={routeEstimate.distanceKm}
          durationMins={routeEstimate.durationMins}
          onOpenMapPicker={() => setMapModalType('pickup')}
        />
      )}

      {/* Home Configuration Glass Grid */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Home Size / Configuration</Text>
        <View style={styles.configGrid}>
          {CONFIGS.map((c) => {
            const Icon = c.icon;
            const isSelected = config === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[styles.glassConfigChip, isSelected && styles.glassConfigChipActive]}
                onPress={() => setConfig(c.value)}
                activeOpacity={0.8}
              >
                <Icon
                  size={16}
                  color={isSelected ? Colors.marigoldDark : Colors.navy}
                  strokeWidth={isSelected ? 2.6 : 1.8}
                />
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

      {/* Floor Number Glass Chips */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Pickup Floor Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.floorRow}>
            {FLOORS.map((f, i) => {
              const isSelected = floor === i;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.glassFloorChip, isSelected && styles.glassFloorChipActive]}
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

      {/* Lift Available Glass Card */}
      <TouchableOpacity
        style={styles.glassLiftToggle}
        onPress={() => setLift(!lift)}
        activeOpacity={0.85}
      >
        <View style={styles.liftInfo}>
          <View style={styles.liftIconCircle}>
            <Layers size={18} color={Colors.navy} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liftTitle}>Service Lift / Elevator Available</Text>
            <Text style={styles.liftSub}>
              {lift
                ? 'Elevator available · standard loading rates'
                : 'Staircase manual carry charges apply'}
            </Text>
          </View>
        </View>
        <View style={[styles.toggle, lift && styles.toggleActive]}>
          <View style={[styles.toggleThumb, lift && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>

      {/* CTA Button */}
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
        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
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
    backgroundColor: '#F0F4F8',
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // ── Glassmorphic Step Progress Card ─────────────────────────────
  glassProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressItem: {
    alignItems: 'center',
    gap: 4,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
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
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  progressLabelActive: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.cardBorder,
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

  // Title
  titleGroup: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepBadge: {
    color: Colors.marigoldDark,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    color: Colors.navyDark,
    fontSize: FontSize.xl + 2,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
    lineHeight: 19,
  },

  // ── Glassmorphic Location Card ──────────────────────────────────
  glassLocationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
  },

  // Map Pin Hero Banner
  mapPinHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#091524',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 4,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  mapPinIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(247, 163, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.marigold,
  },
  mapPinBannerTextCol: {
    flex: 1,
  },
  mapPinBannerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
  },
  mapPinBannerSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  // Location Rows with vertical connected route
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  routeIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  pickupDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.marigold,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: Colors.marigold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  routeVerticalLine: {
    width: 2,
    height: 32,
    backgroundColor: 'rgba(13, 31, 55, 0.2)',
    marginVertical: 2,
  },
  dropSquare: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: Colors.navy,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInputBlock: {
    flex: 1,
    gap: 2,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  locationInput: {
    color: Colors.navy,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.semibold,
    paddingVertical: 3,
  },
  mapPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  mapPickerTriggerText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
  },

  // Quick Shortcuts Row
  quickShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 31, 55, 0.06)',
  },
  quickGpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.15)',
    gap: 5,
  },
  quickGpsText: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  quickAreaChip: {
    backgroundColor: 'rgba(247, 163, 0, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.28)',
  },
  quickAreaText: {
    color: Colors.marigoldDark,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },

  // ── Sections ────────────────────────────────────────────────────
  sectionBlock: {
    gap: Spacing.xs + 2,
  },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },

  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  glassConfigChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  glassConfigChipActive: {
    borderColor: Colors.marigold,
    backgroundColor: 'rgba(247, 163, 0, 0.12)',
    borderWidth: 1.5,
  },
  configLabel: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  configLabelActive: {
    color: Colors.marigoldDark,
    fontWeight: FontWeight.bold,
  },

  floorRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  glassFloorChip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  glassFloorChipActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  floorText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  floorTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },

  // Lift toggle
  glassLiftToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: Spacing.md,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  liftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
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
    borderWidth: 1,
    borderColor: Colors.navyBorder,
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
    backgroundColor: Colors.navy,
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

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    marginTop: Spacing.xs,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
});
