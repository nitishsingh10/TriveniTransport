import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import {
  MapPin,
  Search,
  X,
  Crosshair,
  Check,
  Compass,
  ArrowRight,
  Navigation,
  Layers,
  Flag,
} from 'lucide-react-native';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { customerApi, mapsApi, PlaceLocation, SavedAddress } from '@/lib/api';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface GoogleMapsLocationModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  type: 'pickup' | 'drop';
  onSelect: (location: { address: string; lat: number; lng: number; city: string; type?: 'pickup' | 'drop' }) => void;
  onClose: () => void;
}

export function GoogleMapsLocationModal({
  visible,
  title,
  initialValue = '',
  type: initialType,
  onSelect,
  onClose,
}: GoogleMapsLocationModalProps) {
  const { colors: Colors, mode } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [activeType, setActiveType] = useState<'pickup' | 'drop'>(initialType);
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [locationBias, setLocationBias] = useState<{ lat: number; lng: number } | undefined>();

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5679,
    lng: 73.9143,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialValue);
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [areaHeadline, setAreaHeadline] = useState(initialValue ? initialValue.split(',')[0] : '');

  const debounceTimer = useRef<any>(null);
  const reverseGeocodeTimer = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);
  const initialMapCoords = useRef({ lat: 18.5679, lng: 73.9143 });
  const isMapReadyRef = useRef(false);
  const pendingFlyTo = useRef<{ lat: number; lng: number } | null>(null);
  const pendingPlaceSearch = useRef<{ query: string; bias?: { lat: number; lng: number } } | null>(null);

  // Sync state on open
  useEffect(() => {
    if (visible) {
      setActiveType(initialType);
      setQuery(initialValue);
      setSelectedAddress(initialValue);
      isMapReadyRef.current = false;
      if (initialValue.trim()) {
        geocodeInput(initialValue);
      }
      void customerApi.getAddresses().then(setSavedAddresses).catch(() => setSavedAddresses([]));
      void loadLocationBias(true);
    }
  }, [visible, initialType, initialValue]);

  const loadLocationBias = async (askPermission: boolean) => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted' && askPermission) permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return undefined;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const current = { lat: position.coords.latitude, lng: position.coords.longitude };
      setLocationBias(current);
      initialMapCoords.current = current;
      setSelectedCoords(current);
      if (visible) panMapTo(current.lat, current.lng);
      return current;
    } catch {
      return undefined;
    }
  };

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
        if (rev && rev.address) {
          setSelectedAddress(rev.address);
          setSelectedCity(rev.city || 'Pune');
          setAreaHeadline(rev.address.split(',')[0] || 'Selected Spot');
          setQuery(rev.address);
        } else setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } catch {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedAddress(fallback);
        setSelectedCity('');
        setAreaHeadline('Pinned location');
        setQuery(fallback);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 320);
  }, []);


  // Handle messages coming from either Web iframe or Native WebView
  const handleEventData = useCallback((data: any) => {
    if (!data) return;
    if (data.type === 'MAP_READY') {
      isMapReadyRef.current = true;
      if (pendingFlyTo.current) {
        panMapTo(pendingFlyTo.current.lat, pendingFlyTo.current.lng);
        pendingFlyTo.current = null;
      }
      if (pendingPlaceSearch.current) {
        const search = pendingPlaceSearch.current;
        pendingPlaceSearch.current = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          (document.getElementById('triveni-map-iframe') as HTMLIFrameElement | null)?.contentWindow?.postMessage({ type: 'SEARCH_PLACES', ...search }, '*');
        } else {
          webViewRef.current?.injectJavaScript(`window.searchPlaces && window.searchPlaces(${JSON.stringify(search.query)}, ${JSON.stringify(search.bias || null)}); true;`);
        }
      }
    } else if (data.type === 'PIN_COORDS') {
      const { lat, lng } = data;
      setSelectedCoords({ lat, lng });
      handleCoordsChanged(lat, lng);
    } else if (data.type === 'MAP_DRAGGING') {
      setIsMapMoving(true);
    } else if (data.type === 'PLACES_RESULTS' && Array.isArray(data.suggestions)) {
      setSuggestions(data.suggestions);
      setLoading(false);
    }
  }, [handleCoordsChanged]);

  // Listen for Web iframe postMessage events
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch {}
      }
      handleEventData(data);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleEventData]);

  // Native WebView message handler
  const handleNativeMessage = (event: any) => {
    let data = event.nativeEvent?.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {}
    }
    handleEventData(data);
  };

  // Send pan command to map (Web iframe or Native WebView)
  const panMapTo = (lat: number, lng: number) => {
    if (!isMapReadyRef.current) {
      pendingFlyTo.current = { lat, lng };
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const iframe = document.getElementById('triveni-map-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'FLY_TO', lat, lng }, '*');
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.flyToSpot) {
          window.flyToSpot(${lat}, ${lng});
        }
        true;
      `);
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

    setSuggestions([]);
    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const bias = locationBias || await loadLocationBias(true);
        const results = await mapsApi.searchPlaces(text, bias);
        if (results.length) {
          setSuggestions(results);
          setLoading(false);
        } else {
          // The embedded map's Places library is a direct fallback when the API
          // server-side autocomplete endpoint is unavailable.
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const iframe = document.getElementById('triveni-map-iframe') as HTMLIFrameElement;
            if (!isMapReadyRef.current) pendingPlaceSearch.current = { query: text.trim(), bias };
            else iframe?.contentWindow?.postMessage({ type: 'SEARCH_PLACES', query: text.trim(), bias }, '*');
          } else {
            if (!isMapReadyRef.current) pendingPlaceSearch.current = { query: text.trim(), bias };
            else webViewRef.current?.injectJavaScript(`window.searchPlaces && window.searchPlaces(${JSON.stringify(text.trim())}, ${JSON.stringify(bias || null)}); true;`);
          }
        }
      } catch {
        const bias = locationBias;
        if (!isMapReadyRef.current) pendingPlaceSearch.current = { query: text.trim(), bias };
        else if (Platform.OS === 'web' && typeof window !== 'undefined') {
          (document.getElementById('triveni-map-iframe') as HTMLIFrameElement | null)?.contentWindow?.postMessage({ type: 'SEARCH_PLACES', query: text.trim(), bias }, '*');
        } else {
          webViewRef.current?.injectJavaScript(`window.searchPlaces && window.searchPlaces(${JSON.stringify(text.trim())}, ${JSON.stringify(bias || null)}); true;`);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleSelectSuggestion = async (place: PlaceLocation) => {
    setQuery(place.description);
    setSelectedAddress(place.description);
    const geo = await mapsApi.geocode(place.description);
    setSelectedCoords({ lat: geo.lat, lng: geo.lng });
    setSelectedCity(place.city);
    setAreaHeadline(place.mainText);
    setSuggestions([]);
    panMapTo(geo.lat, geo.lng);
  };

  const handleSelectSavedAddress = (item: SavedAddress) => {
    setQuery(item.address);
    setSelectedAddress(item.address);
    setSelectedCity(item.city || item.address.split(',').slice(-2, -1)[0]?.trim() || '');
    setAreaHeadline(item.label);
    setSuggestions([]);
    if (item.lat != null && item.lng != null) {
      setSelectedCoords({ lat: item.lat, lng: item.lng });
      panMapTo(item.lat, item.lng);
    } else {
      void geocodeInput(item.address);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    const current = await loadLocationBias(true);
    if (!current) Alert.alert('Location unavailable', 'Allow location access or enter an address in the search field.');
    else handleCoordsChanged(current.lat, current.lng);
    setLoading(false);
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
  const isDark = mode === 'dark';
  const pinColor = isPickup ? Colors.marigold : (isDark ? '#38BDF8' : Colors.brandSurface);
  const pinGradientBg = isPickup ? [Colors.marigold, '#E09200'] : (isDark ? ['#0284C7', '#0369A1'] : [Colors.brandSurface, '#1A365D']);

  // Memoize map HTML so dragging the pin NEVER causes iframe/webview reload loops
  const mapHtml = useMemo(() => {
    const startLat = initialMapCoords.current.lat || 18.5679;
    const startLng = initialMapCoords.current.lng || 73.9143;
    const isDark = mode === 'dark';
    const mapBgColor = isDark ? '#091524' : '#F1F5F9';
    const mapsScript = GOOGLE_MAPS_API_KEY
      ? `<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&loading=async&callback=initMap"></script>`
      : '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body, #map {
        width: 100%;
        height: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        background: ${mapBgColor};
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #map-error {
        display: none;
        position: absolute;
        inset: 0;
        align-items: center;
        justify-content: center;
        padding: 24px;
        color: ${isDark ? '#fff' : '#0F172A'};
        background: ${mapBgColor};
        text-align: center;
        font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

      function postToApp(data) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }
        } catch (e) {}
        try {
          if (window.parent && window.parent.postMessage) {
            window.parent.postMessage(data, '*');
          }
        } catch (e) {}
      }

      window.onerror = function(msg, url, line) {
        showMapError('Google Maps could not load. Check the Maps JavaScript API key, billing, and allowed origins.');
        postToApp({ type: 'MAP_ERROR', error: msg + ' at ' + line });
      };

      function initMap() {
        if (!window.google || !google.maps) {
          showMapError('Google Maps could not load. Check the Maps JavaScript API key, billing, and allowed origins.');
          postToApp({ type: 'MAP_ERROR', error: 'Google Maps JavaScript API failed to load' });
          return;
        }
        var map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ${startLat}, lng: ${startLng} },
          zoom: 15,
          backgroundColor: '${mapBgColor}',
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: ${isDark ? `[
            { elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#d5dde8' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#091524' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#8b641f' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091524' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }
          ]` : `[
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
          ]`}
        });
        window.map = map;
        window.__triveniMapLoaded = true;

        map.addListener('dragstart', function() {
          postToApp({ type: 'MAP_DRAGGING' });
        });

        map.addListener('idle', function() {
          var c = map.getCenter().toJSON();
          postToApp({ type: 'PIN_COORDS', lat: c.lat, lng: c.lng });
        });

        map.addListener('click', function(e) {
          if (e.latLng) map.panTo(e.latLng);
        });

        window.flyToSpot = function(lat, lng) {
          if (window.map) {
            window.map.panTo({ lat: lat, lng: lng });
            window.map.setZoom(16);
          }
        };

        var placeSearchRequestId = 0;
        window.searchPlaces = async function(query, bias) {
          if (!query || !google.maps) return;
          var requestId = ++placeSearchRequestId;
          try {
            var places = await google.maps.importLibrary('places');
            var request = { input: query, includedRegionCodes: ['in'] };
            if (bias) request.locationBias = { center: { lat: bias.lat, lng: bias.lng }, radius: 50000 };
            var response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            if (requestId !== placeSearchRequestId) return;
            var results = (response.suggestions || []).map(function(item) { return item.placePrediction; }).filter(Boolean).slice(0, 6).map(function(item) {
              var description = item.text.toString();
              return { placeId: item.placeId, description: description, mainText: item.mainText ? item.mainText.toString() : description, secondaryText: item.secondaryText ? item.secondaryText.toString() : '', city: '' };
            });
            postToApp({ type: 'PLACES_RESULTS', suggestions: results });
          } catch (error) {
            if (requestId === placeSearchRequestId) postToApp({ type: 'PLACES_RESULTS', suggestions: [] });
          }
        };

        postToApp({ type: 'MAP_READY' });

        window.addEventListener('message', function(ev) {
          if (ev.data && ev.data.type === 'FLY_TO') {
            window.flyToSpot(ev.data.lat, ev.data.lng);
          } else if (ev.data && ev.data.type === 'SEARCH_PLACES') {
            window.searchPlaces(ev.data.query, ev.data.bias);
          }
        });
      }

      if (!${Boolean(GOOGLE_MAPS_API_KEY)}) {
        showMapError('Google Maps key is not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and restart the app.');
        postToApp({ type: 'MAP_ERROR', error: 'Google Maps API key is not configured' });
      } else {
        window.setTimeout(function() {
          if (!window.__triveniMapLoaded) {
            showMapError('Google Maps could not load. Check the API key, billing, and allowed origins.');
            postToApp({ type: 'MAP_ERROR', error: 'Google Maps JavaScript API timed out' });
          }
        }, 12000);
      }
    </script>
    ${mapsScript}
  </body>
</html>`;
  }, [visible, mode]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Full-screen Uber-style Themed Map Viewport */}
        <View style={[styles.mapViewport, { bottom: bottomSheetHeight }]}>
          {Platform.OS === 'web' ? (
            <iframe
              id="triveni-map-iframe"
              srcDoc={mapHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: isDark ? '#091524' : '#F1F5F9',
              }}
              title="Triveni Interactive Map"
            />
          ) : (
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml, baseUrl: 'https://www.trivenitransport.online/' }}
              applicationNameForUserAgent="TriveniTransports/1.0.0"
              onMessage={handleNativeMessage}
              style={{ flex: 1, width: '100%', height: '100%', backgroundColor: isDark ? '#091524' : '#F1F5F9' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
            />
          )}

          {/* Central Fixed Uber-style Animated Pin */}
          <View pointerEvents="none" style={styles.centerPinContainer}>
            {/* Pulsing ground shadow / radar aura */}
            <View
              style={[
                styles.groundPulse,
                {
                  backgroundColor: isPickup ? 'rgba(247, 163, 0, 0.25)' : 'rgba(13, 31, 55, 0.25)',
                  borderColor: isPickup ? Colors.marigold : Colors.brandSurface,
                },
              ]}
            />

            {/* Pin head & icon */}
            <View
              style={[
                styles.pinHead,
                {
                  backgroundColor: isPickup ? Colors.marigold : Colors.brandSurface,
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
                  backgroundColor: pinColor,
                  transform: [{ translateY: isMapMoving ? -14 : 0 }],
                },
              ]}
            />
            {/* Ground contact dot */}
            <View
              style={[
                styles.pinGroundDot,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.6)' : '#000000' },
              ]}
            />

            {/* Floating guidance tag */}
            <View
              style={[
                styles.pinTooltip,
                { transform: [{ translateY: isMapMoving ? -20 : -4 }] },
              ]}
            >
              <Text style={styles.pinTooltipText} numberOfLines={1}>
                {isMapMoving
                  ? 'Release to place pin'
                  : isPickup
                  ? 'Pickup pin'
                  : 'Drop-off pin'}
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
              <X size={18} color={Colors.text} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Floating Glassmorphic Search Input */}
          <View style={styles.glassSearchWrapper}>
            <Search size={18} color={Colors.text} style={styles.searchIcon} />
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
                        color={isPickup ? Colors.marigoldDark : Colors.text}
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
          {suggestions.length === 0 && savedAddresses.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickHubsScroll}
              contentContainerStyle={styles.quickHubsContent}
            >
              {savedAddresses.map((item) => (
                <TouchableOpacity
                  key={`saved-${item.id}`}
                  style={[styles.quickHubPill, selectedAddress === item.address && styles.quickHubPillActive]}
                  onPress={() => handleSelectSavedAddress(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickHubText, selectedAddress === item.address && styles.quickHubTextActive]}>
                    {item.label}
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
          <Crosshair size={20} color={isPickup ? Colors.marigoldDark : Colors.text} strokeWidth={2.4} />
        </TouchableOpacity>

        {/* ── Bottom Glassmorphic Pin Confirmation Sheet ───────────────── */}
        <View
          style={styles.bottomGlassSheet}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setBottomSheetHeight((current) => Math.abs(current - height) > 1 ? height : current);
          }}
        >
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
                  { backgroundColor: pinColor },
                ]}
              />
              <Text
                style={[
                  styles.pinStatusText,
                  { color: isPickup ? Colors.marigoldDark : Colors.text },
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
              { backgroundColor: isPickup ? Colors.marigold : (isDark ? '#0284C7' : Colors.brandSurface) },
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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapViewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.mapBg,
  },
  nativeMapGraphic: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mapBg,
  },
  nativeMapText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.sm,
  },
  nativeCoordsText: {
    color: Colors.textMuted,
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
    left: -68,
    top: -30,
    width: 176,
    alignItems: 'center',
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
    textAlign: 'center',
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
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    color: Colors.text,
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
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    color: Colors.textMuted,
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
    borderBottomColor: Colors.cardBorder,
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
    color: Colors.text,
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
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 5,
  },
  quickHubPillActive: {
    backgroundColor: Colors.marigoldSubtle,
    borderColor: Colors.marigold,
  },
  quickHubText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    borderTopWidth: 1.5,
    borderTopColor: Colors.cardBorder,
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
    backgroundColor: Colors.cardBorder,
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
    color: Colors.text,
  },
  addressSubtext: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  coordsMuted: {
    fontSize: 10,
    color: Colors.textMuted,
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
