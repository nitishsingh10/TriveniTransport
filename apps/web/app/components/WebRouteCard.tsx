'use client';

import React, { useMemo } from 'react';
import { Navigation, Clock, ExternalLink } from 'lucide-react';
import styles from './WebRouteCard.module.css';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface WebRouteCardProps {
  pickupAddress: string;
  dropAddress: string;
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
  distanceKm: number;
  durationMins: number;
  onOpenMapPicker?: () => void;
}

const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  vashi: { lat: 19.0771, lng: 72.9986 },
  'navi mumbai': { lat: 19.033, lng: 73.0297 },
  bhiwandi: { lat: 19.2967, lng: 73.0631 },
  thane: { lat: 19.2183, lng: 72.9781 },
  andheri: { lat: 19.1136, lng: 72.8697 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  panvel: { lat: 18.9894, lng: 73.1175 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  surat: { lat: 21.1702, lng: 72.8311 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  delhi: { lat: 28.6139, lng: 77.209 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  kolhapur: { lat: 16.705, lng: 74.2433 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  borivali: { lat: 19.2307, lng: 72.8567 },
  kalyan: { lat: 19.2437, lng: 73.1355 },
  dadar: { lat: 19.0178, lng: 72.8478 },
  bandra: { lat: 19.0596, lng: 72.8295 },
  kurla: { lat: 19.0726, lng: 72.8845 },
  ghatkopar: { lat: 19.086, lng: 72.909 },
  mulund: { lat: 19.1726, lng: 72.9565 },
  belapur: { lat: 19.0144, lng: 73.038 },
  kharghar: { lat: 19.0269, lng: 73.0699 },
  taloja: { lat: 19.062, lng: 73.1205 },
  jnpt: { lat: 18.9499, lng: 72.9496 },
  nhava: { lat: 18.9554, lng: 72.968 },
  chakan: { lat: 18.7606, lng: 73.8636 },
  bhosari: { lat: 18.6279, lng: 73.8488 },
  hadapsar: { lat: 18.5089, lng: 73.9259 },
  hinjawadi: { lat: 18.5913, lng: 73.7389 },
};

function resolveAddressCoords(address: string, fallback: { lat: number; lng: number }): { lat: number; lng: number } {
  if (!address) return fallback;
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return fallback;
}

export default function WebRouteCard({
  pickupAddress,
  dropAddress,
  pickupCoords,
  dropCoords,
  distanceKm,
  durationMins,
  onOpenMapPicker,
}: WebRouteCardProps) {
  const pCoords = pickupCoords || resolveAddressCoords(pickupAddress, { lat: 19.076, lng: 72.8777 });
  const dCoords = dropCoords || resolveAddressCoords(dropAddress, { lat: 19.2183, lng: 72.9781 });

  const routeMapHtml = useMemo(() => {
    const mapsScript = GOOGLE_MAPS_API_KEY
      ? `<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&loading=async&callback=initMap"></script>`
      : '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { box-sizing: border-box; }
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #0d1f37;
        overflow: hidden;
      }
      #map-error {
        display: none;
        position: absolute;
        inset: 0;
        align-items: center;
        justify-content: center;
        padding: 16px;
        color: #fff;
        background: #0d1f37;
        text-align: center;
        font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

      function initMap() {
        if (!window.google || !google.maps) {
          showMapError('Google Maps could not load. Check its API key, billing, and allowed origins.');
          return;
        }
        var pickup = { lat: ${pCoords.lat}, lng: ${pCoords.lng} };
        var drop = { lat: ${dCoords.lat}, lng: ${dCoords.lng} };
        var map = new google.maps.Map(document.getElementById('map'), {
          center: pickup,
          zoom: 11,
          backgroundColor: '#0d1f37',
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'none',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#d5dde8' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#091524' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#8b641f' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091524' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }
          ]
        });
        window.__triveniMapLoaded = true;
        new google.maps.Polyline({
          path: [pickup, drop],
          geodesic: true,
          strokeColor: '#F7A300',
          strokeOpacity: 0.95,
          strokeWeight: 4,
          map: map
        });
        new google.maps.Marker({
          position: pickup,
          map: map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#F7A300', fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2 },
          title: 'Pickup'
        });
        new google.maps.Marker({
          position: drop,
          map: map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#0D1F37', fillOpacity: 1, strokeColor: '#38BDF8', strokeWeight: 2.5 },
          title: 'Drop-off'
        });

        var bounds = new google.maps.LatLngBounds();
        bounds.extend(pickup);
        bounds.extend(drop);
        map.fitBounds(bounds, 30);
        google.maps.event.addListenerOnce(map, 'idle', function() {
          if (map.getZoom() > 14) map.setZoom(14);
        });
      }

      if (!${Boolean(GOOGLE_MAPS_API_KEY)}) {
        showMapError('Google Maps key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
      } else {
        window.setTimeout(function() {
          if (!window.__triveniMapLoaded) showMapError('Google Maps could not load. Check its API key, billing, and allowed origins.');
        }, 12000);
      }
    </script>
    ${mapsScript}
  </body>
</html>`;
  }, [pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng]);

  if (!pickupAddress || !dropAddress) return null;

  return (
    <div className={styles.routeCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleRow}>
          <span className={styles.headerTitle}>Route Preview</span>
        </div>

        {onOpenMapPicker && (
          <button type="button" className={styles.adjustBtn} onClick={onOpenMapPicker}>
            <span>Adjust on Map</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div className={styles.mapFrame}>
        <iframe
          srcDoc={routeMapHtml}
          className={styles.mapIframe}
          title="Triveni Route Preview"
        />
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricItem}>
          <div className={styles.metricIconBox}>
            <Navigation size={16} strokeWidth={2.4} />
          </div>
          <div className={styles.metricTextCol}>
            <span className={styles.metricLabel}>ROAD DISTANCE</span>
            <span className={styles.metricValue}>{distanceKm} km</span>
          </div>
        </div>

        <div className={styles.metricDivider} />

        <div className={styles.metricItem}>
          <div className={`${styles.metricIconBox} ${styles.iconBoxGold}`}>
            <Clock size={16} strokeWidth={2.4} />
          </div>
          <div className={styles.metricTextCol}>
            <span className={styles.metricLabel}>EST. DRIVE TIME</span>
            <span className={styles.metricValue}>~{durationMins} mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
