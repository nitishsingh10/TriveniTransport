import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowLeft, Crosshair, Home, MapPin, Star, Trash2 } from 'lucide-react-native';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { showToast } from '@/components/ToastHost';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { customerApi, mapsApi, type SavedAddress } from '@/lib/api';

export default function SavedAddressesScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    try { setAddresses(await customerApi.getAddresses()); }
    catch (error: any) { showToast({ title: 'Could not load addresses', message: error.message, variant: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const resetForm = () => { setLabel('Home'); setCustomLabel(''); setAddress(''); setCity(''); setCoords(null); setEditingId(undefined); };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Allow location access to use your current location.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = position.coords;
      setCoords({ lat, lng });
      const result = await mapsApi.reverseGeocode(lat, lng);
      setAddress(result.address);
      setCity(result.city || '');
      showToast({ title: 'Location found', message: 'Review the address and save it.', variant: 'success' });
    } catch (error: any) {
      showToast({ title: 'Could not get location', message: error.message || 'Check GPS settings and try again.', variant: 'error' });
    } finally { setLocating(false); }
  };

  const save = async () => {
    const finalLabel = label === 'Other' ? customLabel.trim() : label.trim();
    if (finalLabel.length === 0 || address.trim().length < 5) {
      showToast({ title: 'Add an address', message: 'Enter a label and full address before saving.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const updated = await customerApi.saveAddress({ id: editingId, label: finalLabel, address: address.trim(), city: city.trim(), lat: coords?.lat ?? null, lng: coords?.lng ?? null, isDefault: !editingId && addresses.length === 0 });
      setAddresses(updated); resetForm();
      showToast({ title: 'Address saved', message: 'You can select it for future moves.', variant: 'success' });
    } catch (error: any) { showToast({ title: 'Could not save address', message: error.message, variant: 'error' }); }
    finally { setSaving(false); }
  };

  const remove = (item: SavedAddress) => Alert.alert('Delete saved address?', `Remove ${item.label}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { setAddresses(await customerApi.deleteAddress(item.id)); if (editingId === item.id) resetForm(); }
      catch (error: any) { showToast({ title: 'Could not delete address', message: error.message, variant: 'error' }); }
    } },
  ]);

  const edit = (item: SavedAddress) => { setEditingId(item.id); setLabel(['Home', 'Work'].includes(item.label) ? item.label : 'Other'); setCustomLabel(['Home', 'Work'].includes(item.label) ? '' : item.label); setAddress(item.address); setCity(item.city || ''); setCoords(item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null); };

  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}><ArrowLeft size={20} color={Colors.text} /></TouchableOpacity>
      <View><Text style={styles.title}>Saved Addresses</Text><Text style={styles.subtitle}>Keep frequent move locations ready</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{editingId ? 'Edit address' : 'Add a new address'}</Text>
        <Text style={styles.label}>ADDRESS LABEL</Text>
        <View style={styles.labelChoices}>{['Home', 'Work', 'Other'].map((value) => <TouchableOpacity key={value} onPress={() => setLabel(value)} style={[styles.choice, label === value && styles.choiceActive]}><Text style={[styles.choiceText, label === value && styles.choiceTextActive]}>{value}</Text></TouchableOpacity>)}</View>
        {label === 'Other' && <TextInput value={customLabel} onChangeText={setCustomLabel} style={styles.input} placeholder="Name this address" placeholderTextColor={Colors.inputPlaceholder} />}
        <TouchableOpacity style={styles.gpsButton} onPress={useCurrentLocation} disabled={locating}>
          {locating ? <ActivityIndicator size="small" color={Colors.navy} /> : <Crosshair size={17} color={Colors.navy} />}
          <Text style={styles.gpsText}>{locating ? 'Getting current location…' : 'Use current location'}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>FULL ADDRESS</Text>
        <TextInput value={address} onChangeText={setAddress} style={[styles.input, styles.addressInput]} placeholder="Flat, building, street, area" placeholderTextColor={Colors.inputPlaceholder} multiline />
        <Text style={styles.label}>CITY (OPTIONAL)</Text>
        <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="City" placeholderTextColor={Colors.inputPlaceholder} />
        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.navy} /> : <Text style={styles.saveText}>{editingId ? 'Update address' : 'Save address'}</Text>}
        </TouchableOpacity>
        {!!editingId && <TouchableOpacity onPress={resetForm} style={styles.cancel}><Text style={styles.cancelText}>Cancel editing</Text></TouchableOpacity>}
      </View>

      <Text style={styles.listTitle}>Your addresses</Text>
      {loading ? <ActivityIndicator color={Colors.marigold} /> : addresses.length === 0 ? <View style={styles.empty}><MapPin size={22} color={Colors.textMuted} /><Text style={styles.emptyText}>Saved addresses will appear here.</Text></View> : addresses.map((item) => <View key={item.id} style={styles.addressCard}>
        <View style={styles.addressIcon}><Home size={18} color={Colors.text} /></View>
        <TouchableOpacity style={styles.addressInfo} onPress={() => edit(item)}>
          <View style={styles.addressTitleRow}><Text style={styles.addressTitle}>{item.label}</Text>{item.isDefault && <View style={styles.defaultTag}><Star size={10} color={Colors.success} /><Text style={styles.defaultText}>Default</Text></View>}</View>
          <Text style={styles.addressText} numberOfLines={3}>{item.address}{item.city ? `, ${item.city}` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delete} onPress={() => remove(item)}><Trash2 size={17} color={Colors.error} /></TouchableOpacity>
      </View>)}
    </ScrollView>
  </View>;
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingTop: Spacing.xl, borderBottomWidth: 1, borderColor: Colors.cardBorder },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.sm, ...Shadow.md },
  sectionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 4 },
  label: { color: Colors.textMuted, fontSize: FontSize.xxs, fontWeight: FontWeight.bold, letterSpacing: 0.7, marginTop: 5 },
  labelChoices: { flexDirection: 'row', gap: Spacing.sm },
  choice: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceSubtle, borderWidth: 1, borderColor: Colors.cardBorder },
  choiceActive: { backgroundColor: Colors.marigoldSubtle, borderColor: Colors.marigoldBorder },
  choiceText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  choiceTextActive: { color: Colors.text },
  gpsButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 4, backgroundColor: Colors.marigold, borderRadius: BorderRadius.lg },
  gpsText: { color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  input: { minHeight: 46, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, color: Colors.text, backgroundColor: Colors.inputBg, fontSize: FontSize.sm },
  addressInput: { minHeight: 82, paddingTop: Spacing.md, textAlignVertical: 'top' },
  saveButton: { minHeight: 48, marginTop: 6, backgroundColor: Colors.marigold, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg },
  saveText: { color: Colors.navy, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  cancel: { alignItems: 'center', paddingVertical: 5 },
  cancelText: { color: Colors.textMuted, fontSize: FontSize.xs },
  listTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  empty: { minHeight: 95, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.xs },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  addressIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  addressInfo: { flex: 1, gap: 5 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  defaultTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: Colors.successLight },
  defaultText: { color: Colors.success, fontSize: 9, fontWeight: FontWeight.bold },
  addressText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  delete: { padding: 7 },
});
