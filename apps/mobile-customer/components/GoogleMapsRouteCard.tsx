import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Navigation, Clock, MapPin, ExternalLink } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface GoogleMapsRouteCardProps {
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMins: number;
  onOpenMapPicker?: () => void;
}

export function GoogleMapsRouteCard({
  pickupAddress,
  dropAddress,
  distanceKm,
  durationMins,
  onOpenMapPicker,
}: GoogleMapsRouteCardProps) {
  if (!pickupAddress || !dropAddress) return null;

  // Uber-like custom themed route map HTML using Leaflet + CartoDB dark tiles
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
          // Rough coordinates bounding Pune / Mumbai corridor
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

          // Plot visual gold route curve
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

          // Pickup Pin Marker
          L.circleMarker(latlngs[0], {
            radius: 7,
            fillColor: '#F7A300',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).addTo(map);

          // Drop Pin Marker
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
    <View style={styles.glassCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.badgePulse}>
            <Navigation size={13} color={Colors.marigoldDark} />
          </View>
          <Text style={styles.headerTitle}>Uber-Themed Route Preview</Text>
        </View>

        {onOpenMapPicker && (
          <TouchableOpacity onPress={onOpenMapPicker} style={styles.mapActionBtn} activeOpacity={0.8}>
            <Text style={styles.mapActionText}>Adjust on Map</Text>
            <ExternalLink size={12} color={Colors.navy} />
          </TouchableOpacity>
        )}
      </View>

      {/* Embedded Route Map with Custom Dark Theme */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={routeMapHtml}
            style={{
              width: '100%',
              height: 160,
              border: 'none',
              background: '#091524',
              borderRadius: 14,
            }}
            title="Uber-Themed Route Map"
          />
        ) : (
          <View style={styles.nativeRoutePlaceholder}>
            <Navigation size={28} color={Colors.marigold} />
            <Text style={styles.routeText}>Transit Corridor: {distanceKm} km</Text>
          </View>
        )}

        {/* Floating Route Badge */}
        <View style={styles.routeFloatingPill}>
          <View style={styles.routePillDot} />
          <Text style={styles.routePillText}>OPTIMIZED MOVING CORRIDOR</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricIconBox}>
            <Navigation size={14} color={Colors.navy} strokeWidth={2.4} />
          </View>
          <View>
            <Text style={styles.metricLabel}>ROAD DISTANCE</Text>
            <Text style={styles.metricValue}>{distanceKm} km</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <View style={[styles.metricIconBox, { backgroundColor: Colors.marigoldSubtle }]}>
            <Clock size={14} color={Colors.marigoldDark} strokeWidth={2.4} />
          </View>
          <View>
            <Text style={styles.metricLabel}>EST. DRIVE TIME</Text>
            <Text style={styles.metricValue}>~{durationMins} mins</Text>
          </View>
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        Calculated via Google Maps Distance Matrix with heavy relocation vehicle routing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    gap: Spacing.sm,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    letterSpacing: 0.2,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  mapActionText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  mapWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#091524',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nativeRoutePlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#091524',
  },
  routeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  routeFloatingPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 21, 36, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 5,
  },
  routePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.marigold,
  },
  routePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.navySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(13, 31, 55, 0.08)',
    marginHorizontal: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 9.5,
    color: Colors.textMuted,
    lineHeight: 14,
  },
});
