import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Navigation,
  Layers,
  Flag,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { mapsApi, PlaceLocation } from '@/lib/api';

interface GoogleMapsLocationModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  type: 'pickup' | 'drop';
  onSelect: (location: { address: string; lat: number; lng: number; city: string; type?: 'pickup' | 'drop' }) => void;
  onClose: () => void;
}

// Popular quick selection hubs in Maharashtra
const POPULAR_HUBS = [
  { name: 'Viman Nagar', city: 'Pune', lat: 18.5679, lng: 73.9143, landmark: 'Near Airport Rd' },
  { name: 'Baner', city: 'Pune', lat: 18.559, lng: 73.7868, landmark: 'High Street' },
  { name: 'Kothrud', city: 'Pune', lat: 18.5074, lng: 73.8077, landmark: 'Near Karve Statue' },
  { name: 'Hinjewadi Phase 1', city: 'Pune', lat: 18.5913, lng: 73.7389, landmark: 'IT Park' },
  { name: 'Kharadi', city: 'Pune', lat: 18.5516, lng: 73.9348, landmark: 'World Trade Center' },
  { name: 'Bandra West', city: 'Mumbai', lat: 19.0596, lng: 72.8295, landmark: 'Hill Road' },
  { name: 'Powai', city: 'Mumbai', lat: 19.1176, lng: 72.906, landmark: 'Hiranandani Gardens' },
  { name: 'Thane West', city: 'Thane', lat: 19.2183, lng: 72.9781, landmark: 'Gokhale Road' },
  { name: 'BKC', city: 'Mumbai', lat: 19.0657, lng: 72.8687, landmark: 'G Block' },
];

export function GoogleMapsLocationModal({
  visible,
  title,
  initialValue = '',
  type: initialType,
  onSelect,
  onClose,
}: GoogleMapsLocationModalProps) {
  const [activeType, setActiveType] = useState<'pickup' | 'drop'>(initialType);
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5679,
    lng: 73.9143,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialValue);
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [areaHeadline, setAreaHeadline] = useState(initialValue ? initialValue.split(',')[0] : 'Viman Nagar');

  const debounceTimer = useRef<any>(null);
  const reverseGeocodeTimer = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  // Sync state on open
  useEffect(() => {
    if (visible) {
      setActiveType(initialType);
      setQuery(initialValue);
      setSelectedAddress(initialValue);
      if (initialValue.trim()) {
        geocodeInput(initialValue);
      }
    }
  }, [visible, initialType, initialValue]);

  // Geocode address text into coords
  const geocodeInput = async (addr: string) => {
    try {
      const geo = await mapsApi.geocode(addr);
      setSelectedCoords({ lat: geo.lat, lng: geo.lng });
      setSelectedAddress(geo.formattedAddress);
      setAreaHeadline(geo.formattedAddress.split(',')[0]);
      panMapTo(geo.lat, geo.lng);
    } catch {}
  };

  // Reverse geocode lat/lng to human address
  const handleCoordsChanged = useCallback((lat: number, lng: number) => {
    setIsMapMoving(false);
    setIsResolvingAddress(true);
    if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);

    reverseGeocodeTimer.current = setTimeout(async () => {
      try {
        const rev = await mapsApi.reverseGeocode(lat, lng);
        setSelectedAddress(rev.address);
        setSelectedCity(rev.city || 'Pune');
        setAreaHeadline(rev.address.split(',')[0] || 'Selected Spot');
        setQuery(rev.address);
      } catch {
        setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
        setAreaHeadline('Pinned Location');
      } finally {
        setIsResolvingAddress(false);
      }
    }, 380);
  }, []);

  // Listen for Leaflet map postMessage events
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PIN_COORDS') {
        const { lat, lng } = event.data;
        setSelectedCoords({ lat, lng });
        handleCoordsChanged(lat, lng);
      } else if (event.data && event.data.type === 'MAP_DRAGGING') {
        setIsMapMoving(true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleCoordsChanged]);

  // Send pan command to map iframe
  const panMapTo = (lat: number, lng: number) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const iframe = document.getElementById('triveni-map-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'FLY_TO', lat, lng }, '*');
      }
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

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
    setAreaHeadline(place.mainText);
    setSuggestions([]);
    panMapTo(place.lat, place.lng);
  };

  const handleSelectQuickHub = (hub: (typeof POPULAR_HUBS)[0]) => {
    const fullAddress = `${hub.name}, ${hub.landmark}, ${hub.city}, Maharashtra`;
    setQuery(fullAddress);
    setSelectedAddress(fullAddress);
    setSelectedCoords({ lat: hub.lat, lng: hub.lng });
    setSelectedCity(hub.city);
    setAreaHeadline(hub.name);
    setSuggestions([]);
    panMapTo(hub.lat, hub.lng);
  };

  const handleUseCurrentLocation = () => {
    setLoading(true);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          panMapTo(lat, lng);
          handleCoordsChanged(lat, lng);
          setLoading(false);
        },
        () => {
          const fallback = POPULAR_HUBS[0];
          handleSelectQuickHub(fallback);
          setLoading(false);
        },
        { timeout: 6000 }
      );
    } else {
      const fallback = POPULAR_HUBS[0];
      handleSelectQuickHub(fallback);
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
      type: activeType,
    });
    onClose();
  };

  const isPickup = activeType === 'pickup';
  const pinColor = isPickup ? Colors.marigold : Colors.navy;
  const pinGradientBg = isPickup ? [Colors.marigold, '#E09200'] : [Colors.navy, '#1A365D'];

  // Uber-like custom dark Triveni theme map HTML
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #091524;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          /* Custom Uber-like Triveni midnight theme filter */
          .leaflet-tile-pane {
            filter: brightness(0.72) invert(1) contrast(3.4) hue-rotate(200deg) saturate(0.35);
          }
          .leaflet-control-attribution, .leaflet-control-zoom {
            display: none !important;
          }
          /* Smooth tile rendering */
          .leaflet-tile {
            transition: opacity 0.2s linear;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            inertia: true,
            inertiaDeceleration: 3000
          }).setView([${selectedCoords.lat}, ${selectedCoords.lng}], 15);

          // CartoDB Dark Matter luxury dark tiles
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          map.on('movestart', function() {
            window.parent.postMessage({ type: 'MAP_DRAGGING' }, '*');
          });

          map.on('moveend', function() {
            var c = map.getCenter();
            window.parent.postMessage({ type: 'PIN_COORDS', lat: c.lat, lng: c.lng }, '*');
          });

          map.on('click', function(e) {
            map.flyTo(e.latlng, map.getZoom(), { duration: 0.8 });
          });

          window.addEventListener('message', function(ev) {
            if (ev.data && ev.data.type === 'FLY_TO') {
              map.flyTo([ev.data.lat, ev.data.lng], 16, { duration: 1.2 });
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Full-screen Uber-style Themed Map Viewport */}
        <View style={styles.mapViewport}>
          {Platform.OS === 'web' ? (
            <iframe
              id="triveni-map-iframe"
              srcDoc={mapHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#091524',
              }}
              title="Triveni Uber-Themed Interactive Map"
            />
          ) : (
            <View style={styles.nativeMapGraphic}>
              <Compass size={40} color={isPickup ? Colors.marigold : Colors.navy} />
              <Text style={styles.nativeMapText}>Interactive Map Active</Text>
              <Text style={styles.nativeCoordsText}>
                {selectedCoords.lat.toFixed(4)}° N, {selectedCoords.lng.toFixed(4)}° E
              </Text>
            </View>
          )}

          {/* Central Fixed Uber-style Animated Pin */}
          <View pointerEvents="none" style={styles.centerPinContainer}>
            {/* Pulsing ground shadow / radar aura */}
            <View
              style={[
                styles.groundPulse,
                {
                  backgroundColor: isPickup ? 'rgba(247, 163, 0, 0.25)' : 'rgba(13, 31, 55, 0.25)',
                  borderColor: isPickup ? Colors.marigold : Colors.navy,
                },
              ]}
            />

            {/* Pin head & icon */}
            <View
              style={[
                styles.pinHead,
                {
                  backgroundColor: isPickup ? Colors.marigold : Colors.navy,
                  transform: [{ translateY: isMapMoving ? -14 : 0 }],
                  shadowColor: isPickup ? Colors.marigold : '#000',
                },
              ]}
            >
              {isPickup ? (
                <MapPin size={18} color="#FFFFFF" strokeWidth={2.6} />
              ) : (
                <Flag size={16} color="#FFFFFF" strokeWidth={2.6} />
              )}
            </View>

            {/* Needle stem */}
            <View
              style={[
                styles.pinStem,
                {
                  backgroundColor: isPickup ? Colors.marigoldDark : Colors.navyDark,
                  transform: [{ translateY: isMapMoving ? -14 : 0 }],
                },
              ]}
            />
            {/* Ground contact dot */}
            <View style={styles.pinGroundDot} />

            {/* Floating guidance tag */}
            <View
              style={[
                styles.pinTooltip,
                { transform: [{ translateY: isMapMoving ? -20 : -4 }] },
              ]}
            >
              <Text style={styles.pinTooltipText}>
                {isMapMoving
                  ? 'Release to drop pin here'
                  : isPickup
                  ? '📍 Pointing to Pickup Spot'
                  : '🏁 Pointing to Destination'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Top Floating Glassmorphic Header & Search Bar ──────────────── */}
        <View style={styles.topFloatingOverlay}>
          {/* Top Bar with Mode Toggle & Close */}
          <View style={styles.glassHeaderBar}>
            {/* Pickup / Drop Mode Pill Switcher */}
            <View style={styles.modeSwitcherPill}>
              <TouchableOpacity
                style={[styles.modeTab, isPickup && styles.modeTabActivePickup]}
                onPress={() => setActiveType('pickup')}
                activeOpacity={0.8}
              >
                <MapPin size={13} color={isPickup ? '#FFFFFF' : Colors.textMuted} strokeWidth={2.4} />
                <Text style={[styles.modeTabText, isPickup && styles.modeTabTextActive]}>Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, !isPickup && styles.modeTabActiveDrop]}
                onPress={() => setActiveType('drop')}
                activeOpacity={0.8}
              >
                <Flag size={13} color={!isPickup ? '#FFFFFF' : Colors.textMuted} strokeWidth={2.4} />
                <Text style={[styles.modeTabText, !isPickup && styles.modeTabTextActive]}>Drop</Text>
              </TouchableOpacity>
            </View>

            {/* Glass Close Button */}
            <TouchableOpacity style={styles.glassCloseBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color={Colors.navy} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Floating Glassmorphic Search Input */}
          <View style={styles.glassSearchWrapper}>
            <Search size={18} color={Colors.navy} style={styles.searchIcon} />
            <TextInput
              style={styles.glassSearchInput}
              placeholder="Search society, landmark, or street..."
              placeholderTextColor={Colors.inputPlaceholder}
              value={query}
              onChangeText={handleQueryChange}
              clearButtonMode="while-editing"
            />
            {loading ? (
              <ActivityIndicator size="small" color={Colors.marigold} style={styles.searchLoader} />
            ) : query.length > 0 ? (
              <TouchableOpacity onPress={() => handleQueryChange('')} style={styles.clearSearchBtn}>
                <X size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Autocomplete Suggestions Glass Dropdown */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsGlassCard}>
              <ScrollView
                style={styles.suggestionsScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.suggestionsLabel}>SELECT MATCHING LOCATION</Text>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.suggestionPinBox,
                        { backgroundColor: isPickup ? Colors.marigoldSubtle : Colors.navySubtle },
                      ]}
                    >
                      <MapPin
                        size={15}
                        color={isPickup ? Colors.marigoldDark : Colors.navy}
                        strokeWidth={2.2}
                      />
                    </View>
                    <View style={styles.suggestionTextCol}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.mainText}
                      </Text>
                      <Text style={styles.suggestionDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <ArrowRight size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Hubs Horizontal Glass Carousel */}
          {suggestions.length === 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickHubsScroll}
              contentContainerStyle={styles.quickHubsContent}
            >
              {POPULAR_HUBS.map((hub) => (
                <TouchableOpacity
                  key={hub.name}
                  style={[
                    styles.quickHubPill,
                    selectedAddress.includes(hub.name) && styles.quickHubPillActive,
                  ]}
                  onPress={() => handleSelectQuickHub(hub)}
                  activeOpacity={0.75}
                >
                  <Sparkles size={11} color={selectedAddress.includes(hub.name) ? Colors.marigold : Colors.navy} />
                  <Text
                    style={[
                      styles.quickHubText,
                      selectedAddress.includes(hub.name) && styles.quickHubTextActive,
                    ]}
                  >
                    {hub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Floating Locate-Me GPS Button ─────────────────────────────── */}
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.85}
        >
          <Crosshair size={20} color={isPickup ? Colors.marigoldDark : Colors.navy} strokeWidth={2.4} />
        </TouchableOpacity>

        {/* ── Bottom Glassmorphic Pin Confirmation Sheet ───────────────── */}
        <View style={styles.bottomGlassSheet}>
          {/* Subtle drag handle */}
          <View style={styles.sheetHandle} />

          {/* Pin Type & Status Pill */}
          <View style={styles.sheetStatusRow}>
            <View
              style={[
                styles.pinStatusPill,
                { backgroundColor: isPickup ? Colors.marigoldSubtle : Colors.navySubtle },
              ]}
            >
              <View
                style={[
                  styles.pinStatusDot,
                  { backgroundColor: isPickup ? Colors.marigold : Colors.navy },
                ]}
              />
              <Text
                style={[
                  styles.pinStatusText,
                  { color: isPickup ? Colors.marigoldDark : Colors.navy },
                ]}
              >
                {isPickup ? 'PICKUP LOCATION PIN' : 'DROP DESTINATION PIN'}
              </Text>
            </View>

            {/* GPS Lock indicator */}
            <View style={styles.gpsLockPill}>
              {isResolvingAddress ? (
                <>
                  <ActivityIndicator size="small" color={Colors.marigold} style={{ transform: [{ scale: 0.65 }] }} />
                  <Text style={styles.gpsLockText}>Resolving...</Text>
                </>
              ) : (
                <>
                  <Check size={11} color={Colors.success} strokeWidth={2.6} />
                  <Text style={styles.gpsLockText}>PIN LOCKED</Text>
                </>
              )}
            </View>
          </View>

          {/* Area Headline & Formatted Address */}
          <View style={styles.addressBlock}>
            <Text style={styles.addressHeadline} numberOfLines={1}>
              {areaHeadline}
            </Text>
            <Text style={styles.addressSubtext} numberOfLines={2}>
              {selectedAddress || 'Pan the map to pick your exact doorstep or building...'}
            </Text>
            <Text style={styles.coordsMuted}>
              {selectedCoords.lat.toFixed(5)}° N, {selectedCoords.lng.toFixed(5)}° E · {selectedCity}
            </Text>
          </View>

          {/* Confirm Pin Location Button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: isPickup ? Colors.marigold : Colors.navy },
            ]}
            onPress={handleConfirm}
            activeOpacity={0.88}
          >
            <Text style={styles.confirmBtnText}>
              {isPickup ? 'Confirm Pickup Location' : 'Confirm Drop Destination'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#091524',
  },
  mapViewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#091524',
  },
  nativeMapGraphic: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091524',
  },
  nativeMapText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.sm,
  },
  nativeCoordsText: {
    color: '#829AB1',
    fontSize: FontSize.xs,
    marginTop: 4,
  },

  // ── Central Uber-Style 3D Pin ──────────────────────────────────────
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -42,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 60,
    zIndex: 10,
  },
  groundPulse: {
    position: 'absolute',
    bottom: -2,
    width: 28,
    height: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pinHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },
  pinStem: {
    width: 3.5,
    height: 12,
    marginTop: -2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1,
  },
  pinGroundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginTop: 1,
  },
  pinTooltip: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(13, 31, 55, 0.92)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pinTooltipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },

  // ── Top Glassmorphic Overlay ───────────────────────────────────────
  topFloatingOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 16,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 20,
  },
  glassHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modeSwitcherPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 31, 55, 0.88)',
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  modeTabActivePickup: {
    backgroundColor: Colors.marigold,
  },
  modeTabActiveDrop: {
    backgroundColor: '#1E3A8A',
  },
  modeTabText: {
    color: '#829AB1',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  glassCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Search input with frosted glass
  glassSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  glassSearchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.navy,
    fontWeight: FontWeight.medium,
    height: '100%',
    outlineStyle: 'none' as any,
  },
  searchLoader: {
    marginLeft: Spacing.xs,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Autocomplete Suggestions Dropdown
  suggestionsGlassCard: {
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: BorderRadius.lg,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    paddingVertical: Spacing.xs,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#829AB1',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 31, 55, 0.05)',
  },
  suggestionPinBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  suggestionTextCol: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  suggestionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },
  suggestionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Quick Hubs Scroll
  quickHubsScroll: {
    marginTop: Spacing.sm,
  },
  quickHubsContent: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  quickHubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 31, 55, 0.82)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 5,
  },
  quickHubPillActive: {
    backgroundColor: 'rgba(247, 163, 0, 0.22)',
    borderColor: Colors.marigold,
  },
  quickHubText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  quickHubTextActive: {
    color: Colors.marigold,
    fontWeight: FontWeight.bold,
  },

  // ── Floating GPS Recenter Button ──────────────────────────────────
  floatingGpsBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 230,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 15,
  },

  // ── Bottom Glassmorphic Card Sheet ────────────────────────────────
  bottomGlassSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 25,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(13, 31, 55, 0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  pinStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  pinStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pinStatusText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  gpsLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  gpsLockText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    letterSpacing: 0.4,
  },
  addressBlock: {
    marginVertical: Spacing.xs,
  },
  addressHeadline: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  addressSubtext: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  coordsMuted: {
    fontSize: 10,
    color: '#829AB1',
    marginTop: 4,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: '#F7A300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
