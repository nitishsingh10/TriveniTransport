'use client';

import React, { useMemo } from 'react';
import { Navigation, Clock, ExternalLink } from 'lucide-react';
import styles from './WebRouteCard.module.css';

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
  if (!pickupAddress || !dropAddress) return null;

  const pCoords = pickupCoords || resolveAddressCoords(pickupAddress, { lat: 19.076, lng: 72.8777 });
  const dCoords = dropCoords || resolveAddressCoords(dropAddress, { lat: 19.2183, lng: 72.9781 });

  const routeMapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
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
      .leaflet-control-attribution, .leaflet-control-zoom {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      function init() {
        if (typeof L === 'undefined') return;
        var pickup = [${pCoords.lat}, ${pCoords.lng}];
        var drop = [${dCoords.lat}, ${dCoords.lng}];

        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false
        }).setView(pickup, 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        setTimeout(function() { map.invalidateSize(); }, 250);
        setTimeout(function() { map.invalidateSize(); }, 700);

        var polyline = L.polyline([pickup, drop], {
          color: '#F7A300',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          dashArray: '6, 8'
        }).addTo(map);

        L.circleMarker(pickup, {
          radius: 7,
          fillColor: '#F7A300',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map);

        L.circleMarker(drop, {
          radius: 7,
          fillColor: '#0D1F37',
          color: '#38BDF8',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map);

        try {
          map.fitBounds(polyline.getBounds(), { padding: [30, 30], maxZoom: 14 });
        } catch(e) {}
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    </script>
  </body>
</html>`;
  }, [pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng]);

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
