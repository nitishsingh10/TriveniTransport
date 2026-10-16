import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  MapPin,
  Search,
  X,
  Crosshair,
  Check,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { mapsApi, PlaceLocation } from '@/lib/api';

interface GoogleMapsLocationModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  type: 'pickup' | 'drop';
  onSelect: (location: { address: string; lat: number; lng: number; city: string }) => void;
  onClose: () => void;
}

// Popular quick selection hubs
const POPULAR_HUBS = [
  { name: 'Viman Nagar', city: 'Pune', lat: 18.5679, lng: 73.9143 },
  { name: 'Baner', city: 'Pune', lat: 18.559, lng: 73.7868 },
  { name: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077 },
  { name: 'Hinjewadi Phase 1', city: 'Pune', lat: 18.5913, lng: 73.7389 },
  { name: 'Kharadi', city: 'Pune', lat: 18.5516, lng: 73.9348 },
  { name: 'Bandra West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Powai (Hiranandani)', city: 'Mumbai', lat: 19.1176, lng: 72.906 },
  { name: 'Thane West', city: 'Thane', lat: 19.2183, lng: 72.9781 },
];

export function GoogleMapsLocationModal({
  visible,
  title,
  initialValue = '',
  type,
  onSelect,
  onClose,
}: GoogleMapsLocationModalProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5679,
    lng: 73.9143,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialValue);
  const [selectedCity, setSelectedCity] = useState('Pune');
  const debounceTimer = useRef<any>(null);

  // Initialize on open
  useEffect(() => {
    if (visible) {
      setQuery(initialValue);
      setSelectedAddress(initialValue);
      if (initialValue.trim()) {
        geocodeInput(initialValue);
      }
    }
  }, [visible, initialValue]);

  const geocodeInput = async (addr: string) => {
    try {
      const geo = await mapsApi.geocode(addr);
      setSelectedCoords({ lat: geo.lat, lng: geo.lng });
      setSelectedAddress(geo.formattedAddress);
    } catch {}
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await mapsApi.searchPlaces(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (place: PlaceLocation) => {
    setQuery(place.description);
    setSelectedAddress(place.description);
    setSelectedCoords({ lat: place.lat, lng: place.lng });
    setSelectedCity(place.city);
    setSuggestions([]);
  };

  const handleSelectQuickHub = (hub: (typeof POPULAR_HUBS)[0]) => {
    const fullAddress = `${hub.name}, ${hub.city}, Maharashtra, India`;
    setQuery(fullAddress);
    setSelectedAddress(fullAddress);
    setSelectedCoords({ lat: hub.lat, lng: hub.lng });
    setSelectedCity(hub.city);
    setSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    setLoading(true);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          const rev = await mapsApi.reverseGeocode(lat, lng);
          setSelectedAddress(rev.address);
          setSelectedCity(rev.city);
          setQuery(rev.address);
          setLoading(false);
        },
        () => {
          // Fallback location
          const defaultLoc = POPULAR_HUBS[0];
          handleSelectQuickHub(defaultLoc);
          setLoading(false);
        },
        { timeout: 5000 }
      );
    } else {
      const defaultLoc = POPULAR_HUBS[0];
      handleSelectQuickHub(defaultLoc);
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const finalAddress = selectedAddress.trim() || query.trim();
    if (!finalAddress) return;
    onSelect({
      address: finalAddress,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      city: selectedCity,
    });
    onClose();
  };

  // Google Maps Embed URL for interactive visual map rendering
  const isPinPickup = type === 'pickup';
  const pinColor = isPinPickup ? '%23F7A300' : '%230D1F37';
  const mapCenterQuery = `${selectedCoords.lat},${selectedCoords.lng}`;
  const googleMapIframeSrc = `https://maps.google.com/maps?q=${mapCenterQuery}&z=15&output=embed`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.typeIconCircle,
                { backgroundColor: isPinPickup ? Colors.marigoldSubtle : Colors.navySubtle },
              ]}
            >
              <MapPin
                size={18}
                color={isPinPickup ? Colors.marigoldDark : Colors.navy}
                strokeWidth={2.4}
              />
            </View>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>Powered by Google Maps Platform</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={Colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search society, landmark, street or area..."
              placeholderTextColor={Colors.inputPlaceholder}
              value={query}
              onChangeText={handleQueryChange}
              autoFocus={true}
              clearButtonMode="while-editing"
            />
            {loading ? (
              <ActivityIndicator size="small" color={Colors.marigold} style={styles.searchLoader} />
            ) : query.length > 0 ? (
              <TouchableOpacity onPress={() => handleQueryChange('')}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current Location Action */}
          <TouchableOpacity
            style={styles.gpsRow}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.75}
          >
            <Crosshair size={15} color={Colors.navy} strokeWidth={2.2} />
            <Text style={styles.gpsText}>Use current device GPS location</Text>
          </TouchableOpacity>
        </View>

        {/* Content Area: Autocomplete Results or Interactive Map */}
        <View style={styles.body}>
          {suggestions.length > 0 ? (
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.suggestionsHeader}>GOOGLE MAPS PLACES</Text>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionPinCircle}>
                    <MapPin size={15} color={Colors.navy} strokeWidth={2.2} />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionMainText}>{item.mainText}</Text>
                    <Text style={styles.suggestionSubText}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.mapScroll}
              contentContainerStyle={styles.mapContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Interactive Google Map Box */}
              <View style={styles.mapFrame}>
                {Platform.OS === 'web' ? (
                  <iframe
                    src={googleMapIframeSrc}
                    style={{
                      width: '100%',
                      height: 240,
                      border: 'none',
                      borderRadius: 14,
                    }}
                    title="Google Map Location Selector"
                    loading="lazy"
                  />
                ) : (
                  <View style={styles.nativeMapGraphic}>
                    <Compass size={32} color={Colors.navy} />
                    <Text style={styles.nativeMapText}>Interactive Map Center</Text>
                    <Text style={styles.nativeCoordsText}>
                      {selectedCoords.lat.toFixed(4)}° N, {selectedCoords.lng.toFixed(4)}° E
                    </Text>
                  </View>
                )}

                {/* Floating Map Pin Badge */}
                <View style={styles.mapOverlayPill}>
                  <View
                    style={[
                      styles.mapDot,
                      { backgroundColor: isPinPickup ? Colors.marigold : Colors.navy },
                    ]}
                  />
                  <Text style={styles.mapOverlayText}>
                    {isPinPickup ? 'Pickup Location Pin' : 'Drop Destination Pin'}
                  </Text>
                </View>
              </View>

              {/* Coordinates & Accuracy Indicator */}
              <View style={styles.geoStatsRow}>
                <View style={styles.geoStat}>
                  <Text style={styles.geoStatLabel}>LATITUDE</Text>
                  <Text style={styles.geoStatValue}>{selectedCoords.lat.toFixed(5)}</Text>
                </View>
                <View style={styles.geoDivider} />
                <View style={styles.geoStat}>
                  <Text style={styles.geoStatLabel}>LONGITUDE</Text>
                  <Text style={styles.geoStatValue}>{selectedCoords.lng.toFixed(5)}</Text>
                </View>
                <View style={styles.geoDivider} />
                <View style={styles.geoStat}>
                  <Text style={styles.geoStatLabel}>REGION</Text>
                  <Text style={styles.geoStatValue}>{selectedCity}</Text>
                </View>
              </View>

              {/* Quick Hubs Chips */}
              <View style={styles.quickHubsBlock}>
                <View style={styles.quickHubsTitleRow}>
                  <Sparkles size={13} color={Colors.marigoldDark} />
                  <Text style={styles.quickHubsTitle}>Popular Locations in Maharashtra</Text>
                </View>
                <View style={styles.hubsChipGrid}>
                  {POPULAR_HUBS.map((hub) => (
                    <TouchableOpacity
                      key={hub.name}
                      style={[
                        styles.hubChip,
                        selectedAddress.includes(hub.name) && styles.hubChipActive,
                      ]}
                      onPress={() => handleSelectQuickHub(hub)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.hubChipText,
                          selectedAddress.includes(hub.name) && styles.hubChipTextActive,
                        ]}
                      >
                        {hub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Footer Confirmation Card */}
        <View style={styles.footer}>
          <View style={styles.confirmedAddressBox}>
            <Text style={styles.confirmedLabel}>
              {isPinPickup ? 'CONFIRMED PICKUP' : 'CONFIRMED DESTINATION'}
            </Text>
            <Text style={styles.confirmedAddress} numberOfLines={2}>
              {selectedAddress.trim() || query.trim() || 'Please select an address above'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !(selectedAddress.trim() || query.trim()) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!(selectedAddress.trim() || query.trim())}
            activeOpacity={0.88}
          >
            <View style={styles.btnContent}>
              <Check size={17} color={Colors.white} strokeWidth={2.4} />
              <Text style={styles.confirmBtnText}>Confirm This Location</Text>
              <ArrowRight size={16} color={Colors.white} strokeWidth={2.2} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 48 : Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  modalSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Search
  searchSection: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: Colors.navy,
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.medium,
  },
  searchLoader: {
    marginLeft: Spacing.xs,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  gpsText: {
    fontSize: FontSize.xs,
    color: Colors.navy,
    fontWeight: FontWeight.semibold,
  },

  // Body
  body: {
    flex: 1,
  },
  suggestionsList: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  suggestionsHeader: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    letterSpacing: 0.8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  suggestionPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 2,
  },
  suggestionMainText: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  suggestionSubText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Map
  mapScroll: {
    flex: 1,
  },
  mapContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  mapFrame: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceSubtle,
    position: 'relative',
    ...Shadow.md,
  },
  nativeMapGraphic: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8EDF2',
    gap: 6,
  },
  nativeMapText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  nativeCoordsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  mapOverlayPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapOverlayText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  // Geo Stats
  geoStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  geoStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  geoStatLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  geoStatValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  geoDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.cardBorder,
  },

  // Quick Hubs
  quickHubsBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  quickHubsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickHubsTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  hubsChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hubChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  hubChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  hubChipText: {
    fontSize: 11,
    color: Colors.navy,
    fontWeight: FontWeight.medium,
  },
  hubChipTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  // Footer
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  confirmedAddressBox: {
    gap: 2,
  },
  confirmedLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  confirmedAddress: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
