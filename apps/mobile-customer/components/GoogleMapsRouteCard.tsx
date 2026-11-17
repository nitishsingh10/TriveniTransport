import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, Clock, MapPin, ExternalLink } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { CURATED_LOCATIONS } from '@/lib/api';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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
  const pCoords = pickupCoords || resolveCoords(pickupAddress, { lat: 18.5679, lng: 73.9143 });
  const dCoords = dropCoords || resolveCoords(dropAddress, { lat: 18.5590, lng: 73.7868 });

  // Custom dark route preview using Google Maps JavaScript API.
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
        min-height: 100%;
        margin: 0;
        padding: 0;
        background: #091524;
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
        background: #091524;
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
          zoom: 12,
          backgroundColor: '#091524',
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
        showMapError('Google Maps key is not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.');
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
            source={{ html: routeMapHtml, baseUrl: 'https://www.trivenitransport.online/' }}
            applicationNameForUserAgent="TriveniTransports/1.0.0"
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
