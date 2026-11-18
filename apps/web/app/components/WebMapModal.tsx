'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MapPin,
  Search,
  X,
  Crosshair,
  Check,
  ArrowRight,
  Flag,
} from 'lucide-react';
import styles from './WebMapModal.module.css';
import { getBrowserLocation, type LocationBias } from '../lib/location';

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
type PlaceSuggestion = { placeId: string; description: string; mainText: string; secondaryText: string; lat: number; lng: number; city: string };

// Triveni dark map style — navy/slate roads with gold highway labels
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1f37' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9da5b3' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3c7a53' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#091524' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a939b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0d1f37' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091524' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#091524' }] },
];

interface WebMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'pickup' | 'drop';
  initialAddress?: string;
  onSelectLocation: (loc: {
    address: string;
    lat: number;
    lng: number;
    city: string;
    type: 'pickup' | 'drop';
  }) => void;
}



export default function WebMapModal({
  isOpen,
  onClose,
  type: initialType,
  initialAddress = '',
  onSelectLocation,
}: WebMapModalProps) {
  const [activeType, setActiveType] = useState<'pickup' | 'drop'>(initialType);
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [locationBias, setLocationBias] = useState<LocationBias | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5679,
    lng: 73.9143,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [selectedCity, setSelectedCity] = useState('');
  const [areaHeadline, setAreaHeadline] = useState(initialAddress ? initialAddress.split(',')[0] : '');

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const reverseGeocodeTimer = useRef<NodeJS.Timeout | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const mapIsReadyRef = useRef(false);
  const pendingMapLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const pendingPlaceSearchRef = useRef<{ query: string; bias: LocationBias | null } | null>(null);

  const initialMapCoords = useRef({ lat: 18.5679, lng: 73.9143 });

  useEffect(() => {
    if (!isOpen || !bottomSheetRef.current || typeof ResizeObserver === 'undefined') return;
    const sheet = bottomSheetRef.current;
    const updateHeight = () => {
      const height = sheet.getBoundingClientRect().height;
      setBottomSheetHeight((current) => Math.abs(current - height) > 1 ? height : current);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [isOpen]);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      mapIsReadyRef.current = false;
      setActiveType(initialType);
      setQuery(initialAddress);
      setSelectedAddress(initialAddress);
      initialMapCoords.current = { lat: selectedCoords.lat, lng: selectedCoords.lng };
      void getBrowserLocation().then((location) => {
        if (!location) return;
        setLocationBias(location);
        initialMapCoords.current = location;
      });
      if (initialAddress.trim()) {
        geocodeAddress(initialAddress);
      }
    }
  }, [isOpen, initialType, initialAddress]);

  const geocodeAddress = async (addr: string) => {
    try {
      const res = await fetch(`/api/v1/maps/geocode?address=${encodeURIComponent(addr.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCoords({ lat: data.lat, lng: data.lng });
        setSelectedAddress(data.formattedAddress);
        setAreaHeadline(data.formattedAddress.split(',')[0]);
        panMapTo(data.lat, data.lng);
      }
    } catch {}
  };

  const handleCoordsChanged = useCallback((lat: number, lng: number) => {
    setIsMapMoving(false);
    setIsResolving(true);
    if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);

    reverseGeocodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/maps/reverse?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedAddress(data.address);
          setSelectedCity(data.city || 'Pune');
          setAreaHeadline(data.address.split(',')[0] || 'Selected Location');
          setQuery(data.address);
        } else {
          setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
          setAreaHeadline('Pinned Location');
        }
      } catch {
        setSelectedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
        setAreaHeadline('Pinned Location');
      } finally {
        setIsResolving(false);
      }
    }, 350);
  }, []);

  // Listen to iframe map postMessage
  useEffect(() => {
    if (!isOpen) return;

    const onMessage = (event: MessageEvent) => {
      const iframe = document.getElementById('web-triveni-map-iframe') as HTMLIFrameElement | null;
      if (!iframe?.contentWindow || event.source !== iframe.contentWindow) return;

      if (event.data?.type === 'MAP_READY') {
        mapIsReadyRef.current = true;
        const pendingLocation = pendingMapLocationRef.current;
        if (pendingLocation) {
          iframe.contentWindow.postMessage({ type: 'FLY_TO', ...pendingLocation }, '*');
          pendingMapLocationRef.current = null;
        }
        if (pendingPlaceSearchRef.current) {
          iframe.contentWindow.postMessage({ type: 'SEARCH_PLACES', ...pendingPlaceSearchRef.current }, '*');
          pendingPlaceSearchRef.current = null;
        }
      } else if (event.data && event.data.type === 'PIN_COORDS') {
        const { lat, lng } = event.data;
        setSelectedCoords({ lat, lng });
        handleCoordsChanged(lat, lng);
      } else if (event.data && event.data.type === 'MAP_DRAGGING') {
        setIsMapMoving(true);
      } else if (event.data?.type === 'PLACES_RESULTS' && Array.isArray(event.data.suggestions)) {
        setSuggestions(event.data.suggestions);
        setLoading(false);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, handleCoordsChanged]);

  const panMapTo = (lat: number, lng: number) => {
    const iframe = document.getElementById('web-triveni-map-iframe') as HTMLIFrameElement | null;
    if (!mapIsReadyRef.current || !iframe?.contentWindow) {
      pendingMapLocationRef.current = { lat, lng };
      return;
    }
    iframe.contentWindow.postMessage({ type: 'FLY_TO', lat, lng }, '*');
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const bias = locationBias || await getBrowserLocation();
        if (bias) setLocationBias(bias);
        const params = new URLSearchParams({ input: val.trim() });
        if (bias) { params.set('lat', String(bias.lat)); params.set('lng', String(bias.lng)); }
        const res = await fetch(`/api/v1/maps/places?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) {
            setSuggestions(data);
            setLoading(false);
            return;
          }
        }
        // Fall back to the Places library loaded in the active map iframe so
        // autocomplete still works when the backend Places endpoint is down.
        const iframe = document.getElementById('web-triveni-map-iframe') as HTMLIFrameElement | null;
        if (!mapIsReadyRef.current) pendingPlaceSearchRef.current = { query: val.trim(), bias };
        else iframe?.contentWindow?.postMessage({ type: 'SEARCH_PLACES', query: val.trim(), bias }, '*');
      } catch {
        const iframe = document.getElementById('web-triveni-map-iframe') as HTMLIFrameElement | null;
        if (!mapIsReadyRef.current) pendingPlaceSearchRef.current = { query: val.trim(), bias: locationBias };
        else iframe?.contentWindow?.postMessage({ type: 'SEARCH_PLACES', query: val.trim(), bias: locationBias }, '*');
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = async (place: PlaceSuggestion) => {
    setQuery(place.description);
    setSelectedAddress(place.description);
    const geocode = await fetch(`/api/v1/maps/geocode?address=${encodeURIComponent(place.description)}`);
    if (geocode.ok) {
      const coordinates = await geocode.json();
      setSelectedCoords({ lat: coordinates.lat, lng: coordinates.lng });
      panMapTo(coordinates.lat, coordinates.lng);
    }
    setSelectedCity(place.city);
    setAreaHeadline(place.mainText);
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    const location = await getBrowserLocation();
    if (!location) {
      setLoading(false);
      return;
    }
    setLocationBias(location);
    setSelectedCoords(location);
    panMapTo(location.lat, location.lng);
    try {
      const response = await fetch(`/api/v1/maps/reverse?lat=${location.lat}&lng=${location.lng}`);
      if (response.ok) {
        const data = await response.json();
        const address = data.address || '';
        setSelectedAddress(address);
        setSelectedCity(data.city || '');
        setAreaHeadline(address.split(',')[0] || 'Current location');
        setQuery(address);
      }
    } finally { setLoading(false); }
  };

  const handleConfirm = () => {
    const finalAddress = selectedAddress.trim() || query.trim();
    if (!finalAddress) return;
    onSelectLocation({
      address: finalAddress,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      city: selectedCity,
      type: activeType,
    });
    onClose();
  };

  const isPickup = activeType === 'pickup';

  // Memoize map HTML so dragging the pin NEVER reloads the iframe.
  const mapHtml = useMemo(() => {
    if (!isOpen) return '';
    const startLat = initialMapCoords.current.lat || 18.5679;
    const startLng = initialMapCoords.current.lng || 73.9143;
    const mapsScript = GMAPS_KEY
      ? `<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GMAPS_KEY)}&libraries=places&loading=async&callback=initMap"></script>`
      : '';
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #0d1f37;
          }
          #map-error {
            display: none;
            position: absolute;
            inset: 0;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: #fff;
            background: #0d1f37;
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

          function postToParent(data) {
            try {
              if (window.parent && window.parent.postMessage) {
                window.parent.postMessage(data, '*');
              }
            } catch (e) {}
          }

          function initMap() {
            if (!window.google || !google.maps) {
              showMapError('Google Maps could not load. Check the Maps JavaScript API key, billing, and allowed origins.');
              postToParent({ type: 'MAP_ERROR' });
              return;
            }

            var map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${startLat}, lng: ${startLng} },
              zoom: 15,
              backgroundColor: '#0d1f37',
              disableDefaultUI: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
              styles: ${JSON.stringify(DARK_MAP_STYLES)}
            });
            window.map = map;
            window.__triveniMapLoaded = true;

            map.addListener('dragstart', function() {
              postToParent({ type: 'MAP_DRAGGING' });
            });

            map.addListener('idle', function() {
              var c = map.getCenter().toJSON();
              postToParent({ type: 'PIN_COORDS', lat: c.lat, lng: c.lng });
            });

            map.addListener('click', function(e) {
              if (e.latLng) map.panTo(e.latLng);
            });

            window.addEventListener('message', function(ev) {
              if (ev.data && ev.data.type === 'FLY_TO') {
                if (window.map) {
                  window.map.panTo({ lat: ev.data.lat, lng: ev.data.lng });
                  window.map.setZoom(16);
                }
              } else if (ev.data && ev.data.type === 'SEARCH_PLACES') {
                window.searchPlaces(ev.data.query, ev.data.bias);
              }
            });

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
                postToParent({ type: 'PLACES_RESULTS', suggestions: results });
              } catch (error) {
                if (requestId === placeSearchRequestId) postToParent({ type: 'PLACES_RESULTS', suggestions: [] });
              }
            };

            postToParent({ type: 'MAP_READY' });
          }

          if (!${Boolean(GMAPS_KEY)}) {
            showMapError('Google Maps key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and restart the web app.');
            postToParent({ type: 'MAP_ERROR' });
          } else {
            window.setTimeout(function() {
              if (!window.__triveniMapLoaded) {
                showMapError('Google Maps could not load. Check the API key, billing, and allowed origins.');
              }
            }, 12000);
          }
        </script>
        ${mapsScript}
      </body>
    </html>
  `;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Map Viewport */}
        <div className={styles.mapViewport} style={{ bottom: bottomSheetHeight }}>
          <iframe
            id="web-triveni-map-iframe"
            srcDoc={mapHtml}
            className={styles.mapIframe}
            title="Triveni Interactive Map"
          />

          {/* Central Fixed Animated Pin */}
          <div className={styles.centerPinContainer}>
            <div
              className={`${styles.groundPulse} ${isPickup ? styles.groundPulsePickup : styles.groundPulseDrop}`}
            />
            <div
              className={`${styles.pinHead} ${isPickup ? styles.pinHeadPickup : styles.pinHeadDrop} ${isMapMoving ? styles.pinLifted : ''}`}
            >
              {isPickup ? (
                <MapPin size={18} color="#FFFFFF" strokeWidth={2.6} />
              ) : (
                <Flag size={16} color="#FFFFFF" strokeWidth={2.6} />
              )}
            </div>
            <div
              className={`${styles.pinStem} ${isPickup ? styles.pinStemPickup : styles.pinStemDrop} ${isMapMoving ? styles.pinLifted : ''}`}
            />
            <div className={styles.pinGroundDot} />

            <div className={`${styles.pinTooltip} ${isMapMoving ? styles.pinTooltipLifted : ''}`}>
              <span>
                {isMapMoving
                  ? 'Release to set location'
                  : isPickup
                  ? 'Pickup location'
                  : 'Drop destination'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Top Floating Glassmorphic Header & Search Bar ─────────────── */}
        <div className={styles.topFloatingOverlay}>
          <div className={styles.glassHeaderBar}>
            {/* Pickup / Drop Pill Switcher */}
            <div className={styles.modeSwitcherPill}>
              <button
                type="button"
                className={`${styles.modeTab} ${isPickup ? styles.modeTabActivePickup : ''}`}
                onClick={() => setActiveType('pickup')}
              >
                <MapPin size={13} strokeWidth={2.4} />
                <span>Pickup</span>
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${!isPickup ? styles.modeTabActiveDrop : ''}`}
                onClick={() => setActiveType('drop')}
              >
                <Flag size={13} strokeWidth={2.4} />
                <span>Drop</span>
              </button>
            </div>

            {/* Close Button */}
            <button type="button" className={styles.glassCloseBtn} onClick={onClose} aria-label="Close Map">
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>

          {/* Glass Search Input */}
          <div className={styles.glassSearchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.glassSearchInput}
              placeholder="Search area, society, landmark or street..."
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
            />
            {loading ? (
              <span className={styles.spinnerMini} />
            ) : query.length > 0 ? (
              <button type="button" className={styles.clearSearchBtn} onClick={() => handleQueryChange('')}>
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className={styles.suggestionsGlassCard}>
              <div className={styles.suggestionsLabel}>SELECT MATCHING LOCATION</div>
              <div className={styles.suggestionsList}>
                {suggestions.map(item => (
                  <button
                    key={item.placeId}
                    type="button"
                    className={styles.suggestionRow}
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <div className={`${styles.suggestionPinBox} ${isPickup ? styles.pinBoxPickup : styles.pinBoxDrop}`}>
                      <MapPin size={14} strokeWidth={2.2} />
                    </div>
                    <div className={styles.suggestionTextCol}>
                      <span className={styles.suggestionTitle}>{item.mainText}</span>
                      <span className={styles.suggestionDesc}>{item.description}</span>
                    </div>
                    <ArrowRight size={14} className={styles.suggestionArrow} />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Floating Locate Me GPS Button ────────────────────────────── */}
        <button
          type="button"
          className={styles.floatingGpsBtn}
          onClick={handleUseCurrentLocation}
          title="Use my GPS location"
        >
          <Crosshair size={20} strokeWidth={2.4} />
        </button>

        {/* ── Bottom Glassmorphic Confirmation Sheet ───────────────────── */}
        <div className={styles.bottomGlassSheet} ref={bottomSheetRef}>
          <div className={styles.sheetHandle} />

          <div className={styles.sheetStatusRow}>
            <div className={`${styles.pinStatusPill} ${isPickup ? styles.statusPillPickup : styles.statusPillDrop}`}>
              <div className={`${styles.pinStatusDot} ${isPickup ? styles.dotPickup : styles.dotDrop}`} />
              <span>{isPickup ? 'PICKUP LOCATION PIN' : 'DROP DESTINATION PIN'}</span>
            </div>

            <div className={styles.gpsLockPill}>
              {isResolving ? (
                <>
                  <span className={styles.spinnerMiniGold} />
                  <span>Resolving...</span>
                </>
              ) : (
                <>
                  <Check size={12} strokeWidth={2.6} />
                  <span>PIN LOCKED</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.addressBlock}>
            <h3 className={styles.addressHeadline}>{areaHeadline}</h3>
            <p className={styles.addressSubtext}>
              {selectedAddress || 'Pan the map to pick your exact location...'}
            </p>
            <span className={styles.coordsMuted}>
              {selectedCoords.lat.toFixed(5)}° N, {selectedCoords.lng.toFixed(5)}° E · {selectedCity}
            </span>
          </div>

          <button
            type="button"
            className={`${styles.confirmBtn} ${isPickup ? styles.confirmBtnPickup : styles.confirmBtnDrop}`}
            onClick={handleConfirm}
          >
            <span>{isPickup ? 'Confirm Pickup Location' : 'Confirm Drop Destination'}</span>
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
