'use client';

import React from 'react';
import { Navigation, Clock, ExternalLink } from 'lucide-react';
import styles from './WebRouteCard.module.css';

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0d1f37' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1f37' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2e46' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#091524' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a939b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0d1f37' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091524' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];

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

  // Escape addresses for safe embedding in JS string
  const safeOrigin = pickupAddress.replace(/'/g, "\\'");
  const safeDest = dropAddress.replace(/'/g, "\\'");

  // Google Maps JS API with Directions Renderer — dark theme + gold route
  const routeMapHtml = `
    <!DOCTYPE html>
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
            overflow: hidden;
            background: #0d1f37;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.initMap = function() {
            var darkStyles = ${JSON.stringify(DARK_MAP_STYLES)};

            var map = new google.maps.Map(document.getElementById('map'), {
              zoom: 10,
              styles: darkStyles,
              disableDefaultUI: true,
              gestureHandling: 'none',
              backgroundColor: '#0d1f37',
              clickableIcons: false
            });

            var directionsService = new google.maps.DirectionsService();
            var directionsRenderer = new google.maps.DirectionsRenderer({
              map: map,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#F7A300',
                strokeWeight: 5,
                strokeOpacity: 0.9
              }
            });

            directionsService.route(
              {
                origin: '${safeOrigin}',
                destination: '${safeDest}',
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'IN'
              },
              function(result, status) {
                if (status === 'OK') {
                  directionsRenderer.setDirections(result);
                }
              }
            );
          };
        </script>
        <script
          src="https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=initMap&v=weekly"
          async
          defer
        ></script>
      </body>
    </html>
  `;

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
