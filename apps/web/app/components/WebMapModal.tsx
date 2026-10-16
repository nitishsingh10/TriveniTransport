'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  X,
  Crosshair,
  Check,
  Compass,
  ArrowRight,
  Sparkles,
  Flag,
} from 'lucide-react';
import styles from './WebMapModal.module.css';

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

export default function WebMapModal({
  isOpen,
  onClose,
  type: initialType,
  initialAddress = '',
  onSelectLocation,
}: WebMapModalProps) {
  const [activeType, setActiveType] = useState<'pickup' | 'drop'>(initialType);
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5679,
    lng: 73.9143,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [areaHeadline, setAreaHeadline] = useState(initialAddress ? initialAddress.split(',')[0] : 'Viman Nagar');

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const reverseGeocodeTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      setQuery(initialAddress);
      setSelectedAddress(initialAddress);
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
          setAreaHeadline(data.address.split(',')[0] || 'Selected Spot');
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
  }, [isOpen, handleCoordsChanged]);

  const panMapTo = (lat: number, lng: number) => {
    const iframe = document.getElementById('web-triveni-map-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'FLY_TO', lat, lng }, '*');
    }
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
        const res = await fetch(`/api/v1/maps/places?input=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (place: any) => {
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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          panMapTo(lat, lng);
          // Reverse-geocode to show real address, not raw coordinates
          try {
            const res = await fetch(`/api/v1/maps/reverse?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || '';
              setSelectedAddress(addr);
              setSelectedCity(data.city || 'Pune');
              setAreaHeadline(addr.split(',')[0] || 'Current Location');
              setQuery(addr);
            } else {
              handleCoordsChanged(lat, lng);
            }
          } catch {
            handleCoordsChanged(lat, lng);
          } finally {
            setLoading(false);
          }
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
    onSelectLocation({
      address: finalAddress,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      city: selectedCity,
      type: activeType,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isPickup = activeType === 'pickup';

  // Custom dark-themed map HTML (CartoDB dark tiles)
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
          /* Dark map theme filter */
          .leaflet-tile-pane {
            filter: brightness(0.72) invert(1) contrast(3.4) hue-rotate(200deg) saturate(0.35);
          }
          .leaflet-control-attribution, .leaflet-control-zoom {
            display: none !important;
          }
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Map Viewport */}
        <div className={styles.mapViewport}>
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

            {/* Glass Close Button */}
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

          {/* Quick Hubs Horizontal Carousel */}
          {suggestions.length === 0 && (
            <div className={styles.quickHubsRow}>
              {POPULAR_HUBS.map(hub => (
                <button
                  key={hub.name}
                  type="button"
                  className={`${styles.quickHubPill} ${selectedAddress.includes(hub.name) ? styles.quickHubActive : ''}`}
                  onClick={() => handleSelectQuickHub(hub)}
                >
                  <Sparkles size={11} />
                  <span>{hub.name}</span>
                </button>
              ))}
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
        <div className={styles.bottomGlassSheet}>
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
              {selectedAddress || 'Pan the map to pick your exact doorstep or building gate...'}
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
