import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ArrowRight, Calendar, Crosshair, Home, MapPin, Navigation, Truck } from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { bookingApi, mapsApi, type BookingItem } from '@/lib/api';
import { GoogleMapsLocationModal } from '@/components/GoogleMapsLocationModal';

export default function HomeScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [currentAddress, setCurrentAddress] = useState('Getting your current location…');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>();
  const [isLocating, setIsLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const readCurrentLocation = async () => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return null;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      const result = await mapsApi.reverseGeocode(coords.lat, coords.lng);
      return { coords, address: result.address || 'Current location' };
    } catch {
      return null;
    }
  };

  const updateCurrentLocation = async () => {
    setIsLocating(true);
    const location = await readCurrentLocation();
    if (location) {
      setCurrentCoords(location.coords);
      setCurrentAddress(location.address);
    } else {
      setCurrentAddress('Allow location access or choose on map');
    }
    setIsLocating(false);
  };

  useEffect(() => {
    let mounted = true;
    readCurrentLocation().then((location) => {
      if (!mounted) return;
      if (location) {
        setCurrentCoords(location.coords);
        setCurrentAddress(location.address);
      } else {
        setCurrentAddress('Allow location access or choose on map');
      }
    });
    bookingApi.list().then((list) => {
      if (!mounted) return;
      const active = list.find((booking) =>
        ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED', 'CONFIRMED', 'REQUESTED'].includes(booking.status)
      );
      setActiveBooking(active || null);
    }).catch(() => { if (mounted) setActiveBooking(null); })
      .finally(() => { if (mounted) setIsLoadingBooking(false); });
    return () => { mounted = false; };
  }, []);

  const handlePickupSelected = (location: { address: string; lat: number; lng: number }) => {
    setCurrentAddress(location.address);
    setCurrentCoords({ lat: location.lat, lng: location.lng });
    setMapOpen(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>TRIVENI TRANSPORTS</Text>
          <Text style={styles.title}>Where can we help you move?</Text>
        </View>

        <TouchableOpacity style={styles.pickupBar} onPress={() => setMapOpen(true)} activeOpacity={0.82}>
          <View style={styles.pickupIcon}><MapPin size={17} color={Colors.success} /></View>
          <View style={styles.pickupCopy}>
            <Text style={styles.pickupLabel}>PICKUP FROM</Text>
            <Text style={styles.pickupAddress} numberOfLines={1}>{currentAddress}</Text>
          </View>
          {isLocating ? <ActivityIndicator size="small" color={Colors.marigoldDark} /> : (
            <TouchableOpacity style={styles.gpsButton} onPress={(event) => { event.stopPropagation(); void updateCurrentLocation(); }} accessibilityLabel="Use current location">
              <Crosshair size={17} color={Colors.brandSurface} />
            </TouchableOpacity>
          )}
          <MapPin size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Choose a service</Text>
        <TouchableOpacity style={styles.serviceCard} onPress={() => router.push({ pathname: '/quote', params: { pickup: currentAddress, ...(currentCoords ? { pickupLat: String(currentCoords.lat), pickupLng: String(currentCoords.lng) } : {}) } })} activeOpacity={0.86}>
          <View style={[styles.serviceIcon, styles.homeIcon]}><Home size={23} color={Colors.marigoldDark} /></View>
          <View style={styles.serviceCopy}>
            <Text style={styles.serviceTitle}>Packers &amp; Movers</Text>
            <Text style={styles.serviceSub}>Home and office shifting, planned your way</Text>
          </View>
          <ArrowRight size={19} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(tabs)/bookings')} activeOpacity={0.86}>
          <View style={[styles.serviceIcon, styles.truckIcon]}><Truck size={23} color={Colors.brandSurface} /></View>
          <View style={styles.serviceCopy}>
            <Text style={styles.serviceTitle}>Transport &amp; Trucks</Text>
            <Text style={styles.serviceSub}>Pickup, truck, and transport bookings</Text>
          </View>
          <ArrowRight size={19} color={Colors.textMuted} />
        </TouchableOpacity>

        {activeBooking && (
          <TouchableOpacity style={styles.bookingCard} onPress={() => router.push(`/booking/${activeBooking.id}`)} activeOpacity={0.86}>
            <View style={styles.bookingHeader}>
              <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>CURRENT BOOKING</Text></View>
              <Text style={styles.bookingId}>#{activeBooking.id.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={styles.routeRow}>
              <Navigation size={15} color={Colors.marigoldDark} />
              <Text style={styles.routeAddress} numberOfLines={1}>{activeBooking.pickupAddress}</Text>
              <ArrowRight size={14} color={Colors.textMuted} />
              <Text style={styles.routeAddress} numberOfLines={1}>{activeBooking.dropAddress}</Text>
            </View>
            <View style={styles.bookingFooter}>
              <View style={styles.bookingDate}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{activeBooking.scheduledDate ? new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Date pending'}</Text>
              </View>
              <Text style={styles.trackText}>View booking <ArrowRight size={13} color={Colors.brandSurface} /></Text>
            </View>
          </TouchableOpacity>
        )}
        {!activeBooking && !isLoadingBooking && (
          <View style={styles.emptyBooking}><Calendar size={16} color={Colors.textMuted} /><Text style={styles.emptyText}>Your active bookings will appear here</Text></View>
        )}
      </ScrollView>

      <GoogleMapsLocationModal
        visible={mapOpen}
        type="pickup"
        title="Pickup from"
        initialValue={currentAddress.startsWith('Getting') ? '' : currentAddress}
        onSelect={handlePickupSelected}
        onClose={() => setMapOpen(false)}
      />
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  greeting: { gap: 4, paddingVertical: Spacing.sm },
  eyebrow: { color: Colors.marigoldDark, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2 },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, letterSpacing: -0.4 },
  pickupBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: BorderRadius.xl, ...Shadow.sm },
  pickupIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  pickupCopy: { flex: 1, gap: 2 },
  pickupLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  pickupAddress: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  gpsButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.navySubtle, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: BorderRadius.xl, ...Shadow.sm },
  serviceIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  homeIcon: { backgroundColor: Colors.marigoldSubtle },
  truckIcon: { backgroundColor: Colors.navySubtle },
  serviceCopy: { flex: 1, gap: 4 },
  serviceTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  serviceSub: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 17 },
  bookingCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.successBorder, borderRadius: BorderRadius.xl, padding: Spacing.md, gap: Spacing.md, marginTop: Spacing.md, ...Shadow.sm },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.successLight, borderRadius: BorderRadius.full, paddingHorizontal: 9, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.success, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  bookingId: { color: Colors.textMuted, fontSize: 10, fontWeight: FontWeight.bold },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  routeAddress: { flex: 1, color: Colors.text, fontSize: 10, fontWeight: FontWeight.medium },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: Colors.textSecondary, fontSize: 11, fontWeight: FontWeight.medium },
  trackText: { flexDirection: 'row', color: Colors.brandSurface, fontSize: 11, fontWeight: FontWeight.bold },
  emptyBooking: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.md, padding: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
