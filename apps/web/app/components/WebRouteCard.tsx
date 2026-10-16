'use client';

import React from 'react';
import { Navigation, Clock, Sparkles, ExternalLink } from 'lucide-react';
import styles from './WebRouteCard.module.css';

interface WebRouteCardProps {
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMins: number;
  onOpenMapPicker?: () => void;
}

export default function WebRouteCard({
  pickupAddress,
  dropAddress,
  distanceKm,
  durationMins,
  onOpenMapPicker,
}: WebRouteCardProps) {
  if (!pickupAddress || !dropAddress) return null;

  // Uber-like custom themed dark Triveni route map HTML
  const routeMapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #091524;
            overflow: hidden;
          }
          .leaflet-tile-pane {
            filter: brightness(0.72) invert(1) contrast(3.4) hue-rotate(200deg) saturate(0.35);
          }
          .leaflet-control-attribution, .leaflet-control-zoom {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false
          }).setView([18.55, 73.85], 11);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          // Plot visual gold corridor route
          var latlngs = [
            [18.5679, 73.9143], // Pickup
            [18.5590, 73.7868]  // Drop
          ];

          var polyline = L.polyline(latlngs, {
            color: '#F7A300',
            weight: 4.5,
            opacity: 0.9,
            lineCap: 'round',
            dashArray: '8, 8'
          }).addTo(map);

          L.circleMarker(latlngs[0], {
            radius: 7,
            fillColor: '#F7A300',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).addTo(map);

          L.circleMarker(latlngs[1], {
            radius: 7,
            fillColor: '#0D1F37',
            color: '#38BDF8',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
        </script>
      </body>
    </html>
  `;

  return (
    <div className={styles.routeCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleRow}>
          <div className={styles.pulseIconWrap}>
            <Sparkles size={14} />
          </div>
          <span className={styles.headerTitle}>Uber-Themed Route Estimation</span>
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
        <div className={styles.floatingCorridorBadge}>
          <span className={styles.badgeDot} />
          <span>OPTIMIZED MOVING CORRIDOR</span>
        </div>
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

      <p className={styles.disclaimerText}>
        Calculated via Google Maps Distance Matrix with heavy freight relocation speed profiles.
      </p>
    </div>
  );
}
