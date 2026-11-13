import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, Clock, MapPin, ExternalLink } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { CURATED_LOCATIONS } from '@/lib/api';

interface GoogleMapsRouteCardProps {
  pickupAddress: string;
  dropAddress: string;
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
  distanceKm: number;
  durationMins: number;
  onOpenMapPicker?: () => void;
}

function resolveCoords(address: string, fallback: { lat: number; lng: number }): { lat: number; lng: number } {
  if (!address) return fallback;
  const lower = address.toLowerCase();
  const matched = CURATED_LOCATIONS.find(
    (loc) =>
      lower.includes(loc.mainText.toLowerCase()) ||
      lower.includes(loc.city.toLowerCase()) ||
      lower.includes(loc.description.toLowerCase())
  );
  if (matched && matched.lat && matched.lng) {
    return { lat: matched.lat, lng: matched.lng };
  }
  return fallback;
}

export function GoogleMapsRouteCard({
  pickupAddress,
  dropAddress,
  pickupCoords,
  dropCoords,
  distanceKm,
  durationMins,
  onOpenMapPicker,
}: GoogleMapsRouteCardProps) {
  if (!pickupAddress || !dropAddress) return null;

  const pCoords = pickupCoords || resolveCoords(pickupAddress, { lat: 18.5679, lng: 73.9143 });
  const dCoords = dropCoords || resolveCoords(dropAddress, { lat: 18.5590, lng: 73.7868 });

  // Custom luxury dark themed route map HTML using Leaflet + CartoDB dark tiles
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
        min-height: 100%;
        margin: 0;
        padding: 0;
        background: #091524;
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
        }).setView(pickup, 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        setTimeout(function() { map.invalidateSize(); }, 250);
        setTimeout(function() { map.invalidateSize(); }, 700);

        // Dash line connecting pickup and drop
        var polyline = L.polyline([pickup, drop], {
          color: '#F7A300',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          dashArray: '6, 8'
        }).addTo(map);

        // Pickup Pin Marker (Marigold)
        L.circleMarker(pickup, {
          radius: 6.5,
          fillColor: '#F7A300',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map);

        // Drop Pin Marker (Deep Navy with Cyan ring)
        L.circleMarker(drop, {
          radius: 6.5,
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
          <WebView
            source={{ html: routeMapHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
            style={{
              width: '100%',
              height: 160,
              backgroundColor: '#091524',
              borderRadius: 14,
            }}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            bounces={false}
          />
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
