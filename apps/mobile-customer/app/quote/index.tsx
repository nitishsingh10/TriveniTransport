import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

  // Google Maps State
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

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number; city: string }) => {
    if (mapModalType === 'pickup') {
      setPickup(loc.address);
    } else if (mapModalType === 'drop') {
      setDrop(loc.address);
    }
    setMapModalType(null);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressNumActive}>1</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Locations</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNum}>2</Text>
          </View>
          <Text style={styles.progressLabel}>Items</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNum}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Summary</Text>
        </View>
      </View>

      <View style={styles.titleGroup}>
        <Text style={styles.stepBadge}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Where are you moving?</Text>
        <Text style={styles.subtitle}>
          Select pickup and drop locations via Google Maps for instant distance-based estimates.
        </Text>
      </View>

      {/* Location Card with Map Pickers */}
      <View style={styles.locationCard}>
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.pinWrapper}
            onPress={() => setMapModalType('pickup')}
            activeOpacity={0.8}
          >
            <MapPin size={18} color={Colors.marigold} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.locationInputBlock}>
            <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="e.g. Viman Nagar, Pune"
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
            <Compass size={13} color={Colors.navy} />
            <Text style={styles.mapPickerTriggerText}>Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.pinWrapper}
            onPress={() => setMapModalType('drop')}
            activeOpacity={0.8}
          >
            <MapPin size={18} color={Colors.navy} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.locationInputBlock}>
            <Text style={styles.inputLabel}>DROP DESTINATION</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="e.g. Baner, Pune"
              placeholderTextColor={Colors.inputPlaceholder}
              value={drop}
              onChangeText={setDrop}
            />
          </View>
          <TouchableOpacity
            style={styles.mapPickerTrigger}
            onPress={() => setMapModalType('drop')}
            activeOpacity={0.75}
          >
            <Compass size={13} color={Colors.navy} />
            <Text style={styles.mapPickerTriggerText}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Maps Route Preview Card */}
      {routeEstimate && (
        <GoogleMapsRouteCard
          pickupAddress={pickup}
          dropAddress={drop}
          distanceKm={routeEstimate.distanceKm}
          durationMins={routeEstimate.durationMins}
          onOpenMapPicker={() => setMapModalType('pickup')}
        />
      )}


      {/* Home Configuration */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Home Size / Configuration</Text>
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
                <Icon
                  size={16}
                  color={isSelected ? Colors.white : Colors.navy}
                  strokeWidth={isSelected ? 2.4 : 1.8}
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

      {/* Floor Number */}
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

      {/* Lift Available */}
      <TouchableOpacity
        style={styles.liftToggle}
        onPress={() => setLift(!lift)}
        activeOpacity={0.85}
      >
        <View style={styles.liftInfo}>
          <View style={styles.liftIconCircle}>
            <Layers size={18} color={Colors.navy} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.liftTitle}>Service Lift / Elevator Available</Text>
            <Text style={styles.liftSub}>
              {lift
                ? 'Elevator reduces manual carrying and labour time'
                : 'Staircase carrying charges applied'}
            </Text>
          </View>
        </View>
        <View style={[styles.toggle, lift && styles.toggleActive]}>
          <View style={[styles.toggleThumb, lift && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>

      {/* CTA Button: Deep Navy matching website btn-primary */}
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
        <Text style={styles.ctaText}>Proceed to Item Selection</Text>
        <ArrowRight size={18} color={Colors.white} strokeWidth={2.4} />
      </TouchableOpacity>

      {/* Google Maps Location Selection Modal */}
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
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  progressItem: {
    alignItems: 'center',
    gap: 4,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
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
    color: Colors.white,
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

  // Title
  titleGroup: { gap: 4 },
  stepBadge: {
    color: Colors.marigoldDark,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    color: Colors.navyDark,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  // Location Card
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  pinWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  locationInputBlock: {
    flex: 1,
    gap: 2,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  locationInput: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    paddingVertical: 2,
    fontWeight: FontWeight.medium,
  },
  locationDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },
  mapPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  mapPickerTriggerText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  // Sections
  sectionBlock: { gap: Spacing.xs },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },

  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  configChipActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  configLabel: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  configLabelActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  floorRow: { flexDirection: 'row', gap: Spacing.xs },
  floorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  floorChipActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  floorText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  floorTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  // Lift toggle
  liftToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  liftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  liftIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liftTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  liftSub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cardBorder,
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: { backgroundColor: Colors.navy },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
