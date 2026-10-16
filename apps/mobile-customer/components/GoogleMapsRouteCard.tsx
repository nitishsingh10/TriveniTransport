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

  // Google Maps Directions Embed URL
  const originQuery = encodeURIComponent(pickupAddress);
  const destQuery = encodeURIComponent(dropAddress);
  const directionsMapUrl = `https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Navigation size={15} color={Colors.navy} strokeWidth={2.4} />
          <Text style={styles.headerTitle}>Google Maps Route Estimation</Text>
        </View>
        {onOpenMapPicker && (
          <TouchableOpacity onPress={onOpenMapPicker} style={styles.mapActionBtn} activeOpacity={0.7}>
            <Text style={styles.mapActionText}>Edit on Map</Text>
            <ExternalLink size={12} color={Colors.navy} />
          </TouchableOpacity>
        )}
      </View>

      {/* Embedded Route Map */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            src={directionsMapUrl}
            style={{
              width: '100%',
              height: 180,
              border: 'none',
              borderRadius: 12,
            }}
            title="Google Maps Route"
            loading="lazy"
          />
        ) : (
          <View style={styles.nativeRoutePlaceholder}>
            <Navigation size={28} color={Colors.navy} />
            <Text style={styles.routeText}>Live Route: {distanceKm} km</Text>
          </View>
        )}
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricIconBox}>
            <Navigation size={14} color={Colors.navy} />
          </View>
          <View>
            <Text style={styles.metricLabel}>ROAD DISTANCE</Text>
            <Text style={styles.metricValue}>{distanceKm} km</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <View style={[styles.metricIconBox, { backgroundColor: Colors.marigoldSubtle }]}>
            <Clock size={14} color={Colors.marigoldDark} />
          </View>
          <View>
            <Text style={styles.metricLabel}>EST. DRIVE TIME</Text>
            <Text style={styles.metricValue}>~{durationMins} mins</Text>
          </View>
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        Calculated via Google Maps Distance Matrix. Shifting speed accounts for heavy vehicle traffic.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mapActionText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  mapWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceSubtle,
  },
  nativeRoutePlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  metricValue: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 9,
    color: Colors.textMuted,
    lineHeight: 13,
  },
});
