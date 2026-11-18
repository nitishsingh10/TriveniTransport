import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Layers, Truck } from 'lucide-react-native';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import type { ThemeColors } from '@/constants/theme';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';

const FLOORS = ['Ground', '1st', '2nd', '3rd', '4th', '5th+'];

export default function AddressDetailsScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams();
  const [pickupUnit, setPickupUnit] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropUnit, setDropUnit] = useState('');
  const [dropLandmark, setDropLandmark] = useState('');
  const [alternateContactPhone, setAlternateContactPhone] = useState('');
  const [floor, setFloor] = useState(0);
  const [lift, setLift] = useState(true);
  const [parkingClose, setParkingClose] = useState(true);
  const phoneValid = !alternateContactPhone || /^[6-9]\d{9}$/.test(alternateContactPhone);
  const canContinue = pickupUnit.trim() && pickupLandmark.trim() && dropUnit.trim() && dropLandmark.trim() && phoneValid;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.step}>STEP 3 · COMPLETE YOUR ADDRESSES</Text>
      <Text style={styles.title}>Add access details</Text>
      <Text style={styles.subtitle}>Your selected locations: {params.pickup} → {params.drop}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pickup address</Text>
        <TextInput style={styles.input} value={pickupUnit} onChangeText={setPickupUnit} placeholder="Flat / house number *" placeholderTextColor={Colors.textMuted} />
        <TextInput style={styles.input} value={pickupLandmark} onChangeText={setPickupLandmark} placeholder="Landmark *" placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery address</Text>
        <TextInput style={styles.input} value={dropUnit} onChangeText={setDropUnit} placeholder="Flat / house number *" placeholderTextColor={Colors.textMuted} />
        <TextInput style={styles.input} value={dropLandmark} onChangeText={setDropLandmark} placeholder="Landmark *" placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Building access</Text>
        <Text style={styles.label}>Pickup floor</Text>
        <View style={styles.floorRow}>{FLOORS.map((label, index) => <TouchableOpacity key={label} onPress={() => setFloor(index)} style={[styles.floor, floor === index && styles.active]}><Text style={[styles.floorText, floor === index && styles.activeText]}>{label}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setLift(!lift)}><Layers size={18} color={Colors.text} /><Text style={styles.toggleLabel}>Service lift available</Text><Text style={styles.toggleValue}>{lift ? 'Yes' : 'No'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setParkingClose(!parkingClose)}><Truck size={18} color={Colors.text} /><Text style={styles.toggleLabel}>Truck can park near entrance</Text><Text style={styles.toggleValue}>{parkingClose ? 'Yes' : 'No'}</Text></TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alternative contact (optional)</Text>
        <TextInput style={styles.input} value={alternateContactPhone} onChangeText={(value) => setAlternateContactPhone(value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" maxLength={10} placeholder="10-digit mobile number" placeholderTextColor={Colors.textMuted} />
        {!phoneValid && <Text style={styles.error}>Enter a valid 10-digit Indian mobile number.</Text>}
      </View>
      <TouchableOpacity disabled={!canContinue} style={[styles.cta, !canContinue && styles.disabled]} onPress={() => router.push({ pathname: '/quote/summary', params: {
        ...params,
        pickupAddress: `${params.pickup}, ${pickupUnit.trim()}, Landmark: ${pickupLandmark.trim()}`,
        dropAddress: `${params.drop}, ${dropUnit.trim()}, Landmark: ${dropLandmark.trim()}`,
        alternateContactPhone,
        floor: String(floor), lift: lift ? '1' : '0', parkingClose: parkingClose ? '1' : '0',
      } })}>
        <Text style={styles.ctaText}>Continue to schedule & price</Text><ArrowRight size={18} color={Colors.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (C: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background }, container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  step: { color: C.marigoldDark, fontSize: FontSize.xxs, fontWeight: FontWeight.bold, letterSpacing: 1 }, title: { color: C.text, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold }, subtitle: { color: C.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  card: { padding: Spacing.md, gap: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: C.surface, borderWidth: 1, borderColor: C.cardBorder }, cardTitle: { color: C.text, fontSize: FontSize.md, fontWeight: FontWeight.bold }, label: { color: C.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.cardBorder, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, color: C.text, fontSize: FontSize.sm }, floorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, floor: { borderRadius: BorderRadius.full, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 13, paddingVertical: 8 }, floorText: { color: C.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold }, active: { backgroundColor: C.brandSurface, borderColor: C.brandSurface }, activeText: { color: C.white },
  toggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }, toggleLabel: { flex: 1, color: C.text, fontSize: FontSize.sm }, toggleValue: { color: C.marigoldDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold }, error: { color: C.error, fontSize: FontSize.xs },
  cta: { minHeight: 54, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: C.brandSurface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, disabled: { opacity: 0.5 }, ctaText: { color: C.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
