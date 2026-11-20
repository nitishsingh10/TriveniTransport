import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Home,
  Layers,
  MapPin,
  Minus,
  Plus,
  Truck,
} from 'lucide-react-native';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import type { ThemeColors } from '@/constants/theme';
import { BorderRadius, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';
import { SlidingPill, SlidingPillToggle } from '@/components/SlidingPill';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';

const QUICK_FLOORS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AddressDetailsScreen() {
  const { colors: Colors, mode } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    pickup: string;
    drop: string;
    config?: string;
    quantities?: string;
    selectedItems?: string;
  }>();

  const [pickupUnit, setPickupUnit] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropUnit, setDropUnit] = useState('');
  const [dropLandmark, setDropLandmark] = useState('');
  const [alternateContactPhone, setAlternateContactPhone] = useState('');

  // Building access: 'ground' or 'floor'
  const [accessType, setAccessType] = useState<'ground' | 'floor'>('ground');
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [lift, setLift] = useState<boolean>(true);
  const [parkingClose, setParkingClose] = useState<boolean>(true);

  const phoneValid = !alternateContactPhone || /^[6-9]\d{9}$/.test(alternateContactPhone);
  const canContinue =
    pickupUnit.trim().length > 0 &&
    pickupLandmark.trim().length > 0 &&
    dropUnit.trim().length > 0 &&
    dropLandmark.trim().length > 0 &&
    phoneValid;

  const handleFloorChange = (delta: number) => {
    setFloorNumber((prev) => Math.max(1, Math.min(80, prev + delta)));
  };

  const handleContinue = () => {
    if (!canContinue) return;
    const finalFloor = accessType === 'ground' ? 0 : floorNumber;
    const finalLift = accessType === 'ground' ? true : lift;

    router.push({
      pathname: '/quote/summary',
      params: {
        ...params,
        pickupAddress: `${params.pickup}, ${pickupUnit.trim()}, Landmark: ${pickupLandmark.trim()}`,
        dropAddress: `${params.drop}, ${dropUnit.trim()}, Landmark: ${dropLandmark.trim()}`,
        alternateContactPhone,
        floor: String(finalFloor),
        lift: finalLift ? '1' : '0',
        parkingClose: parkingClose ? '1' : '0',
      },
    });
  };

  const isDark = mode === 'dark';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Back & Progress */}
      <FadeInUp delay={0}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color={Colors.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.badgePill}>
            <Text style={styles.step}>STEP 3 OF 4</Text>
          </View>
        </View>

        <Text style={styles.title}>Add access details</Text>
        <Text style={styles.subtitle}>
          Fill in flat numbers and premises access so the moving crew is prepared.
        </Text>
      </FadeInUp>

      {/* Selected Route Summary Banner */}
      <FadeInUp delay={50}>
        <View style={styles.routeBanner}>
          <View style={styles.routeCol}>
            <View style={styles.routePoint}>
              <View style={[styles.dot, styles.dotPickup]} />
              <Text style={styles.routeLabel} numberOfLines={1}>
                {params.pickup || 'Pickup location'}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, styles.dotDrop]} />
              <Text style={styles.routeLabel} numberOfLines={1}>
                {params.drop || 'Drop destination'}
              </Text>
            </View>
          </View>
        </View>
      </FadeInUp>

      {/* Pickup Address Card */}
      <FadeInUp delay={100}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={16} color={Colors.warning} />
            <Text style={styles.cardTitle}>Pickup Flat & Landmark</Text>
          </View>
          <TextInput
            style={styles.input}
            value={pickupUnit}
            onChangeText={setPickupUnit}
            placeholder="Flat / house / office number *"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={pickupLandmark}
            onChangeText={setPickupLandmark}
            placeholder="Nearby landmark (e.g., Near Metro Station) *"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </FadeInUp>

      {/* Delivery Address Card */}
      <FadeInUp delay={150}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={16} color={Colors.info} />
            <Text style={styles.cardTitle}>Delivery Flat & Landmark</Text>
          </View>
          <TextInput
            style={styles.input}
            value={dropUnit}
            onChangeText={setDropUnit}
            placeholder="Destination flat / house number *"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={dropLandmark}
            onChangeText={setDropLandmark}
            placeholder="Nearby landmark at destination *"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </FadeInUp>

      {/* Building Access Card */}
      <FadeInUp delay={200}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Building2 size={16} color={Colors.navyMuted} />
            <Text style={styles.cardTitle}>Building Access</Text>
          </View>

          {/* 1. Building Access Selection: Ground vs Floor */}
          <Text style={styles.fieldLabel}>Pickup floor level</Text>
          <SlidingPill<'ground' | 'floor'>
            options={[
              {
                value: 'ground',
                label: 'Ground Floor',
                icon: <Home size={15} color={accessType === 'ground' ? Colors.text : Colors.textMuted} />,
              },
              {
                value: 'floor',
                label: 'Floor',
                icon: <Building2 size={15} color={accessType === 'floor' ? Colors.text : Colors.textMuted} />,
              },
            ]}
            value={accessType}
            onChange={(val) => setAccessType(val)}
          />

          {accessType === 'ground' ? (
            <View style={styles.infoBanner}>
              <CheckCircle2 size={14} color={Colors.success} />
              <Text style={styles.infoBannerText}>
                Ground floor entry · Direct loading with zero stair surcharge.
              </Text>
            </View>
          ) : (
            /* On clicking Floor: Show Floor selector + Lift option */
            <View style={styles.floorSubSection}>
              {/* Add / Choose Floor */}
              <View style={styles.stepperContainer}>
                <View>
                  <Text style={styles.fieldLabel}>Select floor number</Text>
                  <Text style={styles.stepperSub}>
                    {floorNumber === 1 ? '1st Floor' : floorNumber === 2 ? '2nd Floor' : floorNumber === 3 ? '3rd Floor' : `${floorNumber}th Floor`}
                  </Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, floorNumber <= 1 && styles.stepperBtnDisabled]}
                    onPress={() => handleFloorChange(-1)}
                    disabled={floorNumber <= 1}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color={floorNumber <= 1 ? Colors.textMuted : Colors.text} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValueText}>{floorNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleFloorChange(1)}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Floor Chips */}
              <View style={styles.chipsRow}>
                {QUICK_FLOORS.map((f) => {
                  const isSelected = floorNumber === f;
                  const label = f === 1 ? '1st' : f === 2 ? '2nd' : f === 3 ? '3rd' : `${f}th`;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                      ]}
                      onPress={() => setFloorNumber(f)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Check whether Lift is Available (Sliding Pill) */}
              <View style={styles.toggleSection}>
                <View style={styles.toggleTextGroup}>
                  <Text style={styles.fieldLabel}>Is a service or passenger lift available?</Text>
                  <Text style={styles.toggleSub}>
                    {lift
                      ? 'Elevator available · Fast loading without stair fees'
                      : 'No elevator · Crew will carry via stairs'}
                  </Text>
                </View>
                <SlidingPillToggle
                  value={lift}
                  onChange={setLift}
                  trueLabel="Lift Available"
                  falseLabel="No Lift (Stairs)"
                  trueIcon={<Layers size={14} color={lift ? Colors.success : Colors.textMuted} />}
                  falseIcon={<Layers size={14} color={!lift ? Colors.warning : Colors.textMuted} />}
                />
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Truck Parking Option (Sliding Pill) */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleTextGroup}>
              <Text style={styles.fieldLabel}>Can truck park near entrance?</Text>
              <Text style={styles.toggleSub}>
                {parkingClose
                  ? 'Within 50m of main building entrance'
                  : 'Parking is > 50m away · Long carry required'}
              </Text>
            </View>
            <SlidingPillToggle
              value={parkingClose}
              onChange={setParkingClose}
              trueLabel="Yes, nearby"
              falseLabel="No (> 50m)"
              trueIcon={<Truck size={14} color={parkingClose ? Colors.success : Colors.textMuted} />}
              falseIcon={<Truck size={14} color={!parkingClose ? Colors.warning : Colors.textMuted} />}
            />
          </View>
        </View>
      </FadeInUp>

      {/* Alternative Contact Phone */}
      <FadeInUp delay={250}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alternative Contact (Optional)</Text>
          <Text style={styles.inputSub}>
            Provide an alternate family member or receiver's contact for move-day coordination.
          </Text>
          <TextInput
            style={styles.input}
            value={alternateContactPhone}
            onChangeText={(value) =>
              setAlternateContactPhone(value.replace(/\D/g, '').slice(0, 10))
            }
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.textMuted}
          />
          {!phoneValid && (
            <Text style={styles.error}>Enter a valid 10-digit Indian mobile number.</Text>
          )}
        </View>
      </FadeInUp>

      {/* Submit CTA with PressableScale */}
      <FadeInUp delay={300}>
        <PressableScale
          disabled={!canContinue}
          style={[styles.cta, !canContinue && styles.disabled]}
          onPress={handleContinue}
        >
          <View style={styles.ctaContent}>
            <View>
              <Text style={styles.ctaTitle}>Continue to Schedule & Price</Text>
              <Text style={styles.ctaSub}>
                {canContinue ? 'Next: choose moving date & instant estimate' : 'Fill mandatory address details above'}
              </Text>
            </View>
            <View style={styles.ctaArrowCircle}>
              <ArrowRight size={17} color={Colors.white} strokeWidth={2.4} />
            </View>
          </View>
        </PressableScale>
      </FadeInUp>
    </ScrollView>
  );
}

const createStyles = (C: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.background,
    },
    container: {
      padding: Spacing.md,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl + 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.xs,
    },
    backBtnText: {
      color: C.text,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.semibold,
    },
    badgePill: {
      backgroundColor: C.navySubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: C.navyBorder,
    },
    step: {
      color: C.marigoldDark,
      fontSize: 10.5,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.8,
    },
    title: {
      color: C.text,
      fontSize: FontSize.xl + 2,
      fontWeight: FontWeight.extrabold,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: C.textSecondary,
      fontSize: FontSize.xs + 1,
      lineHeight: 18,
      marginTop: 4,
    },

    // Route banner
    routeBanner: {
      backgroundColor: C.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: Spacing.sm + 2,
      ...Shadow.sm,
    },
    routeCol: {
      gap: 6,
    },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotPickup: {
      backgroundColor: C.warning,
    },
    dotDrop: {
      backgroundColor: C.info,
    },
    routeLine: {
      width: 1.5,
      height: 8,
      backgroundColor: C.cardBorder,
      marginLeft: 3.2,
    },
    routeLabel: {
      color: C.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
      flex: 1,
    },

    // Cards
    card: {
      padding: Spacing.md,
      gap: Spacing.sm + 2,
      borderRadius: BorderRadius.xl,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.cardBorder,
      ...Shadow.sm,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      color: C.text,
      fontSize: FontSize.sm + 1,
      fontWeight: FontWeight.bold,
    },
    fieldLabel: {
      color: C.text,
      fontSize: FontSize.xs + 0.5,
      fontWeight: FontWeight.semibold,
      marginBottom: 2,
    },
    inputSub: {
      color: C.textSecondary,
      fontSize: FontSize.xs,
      lineHeight: 16,
    },
    input: {
      minHeight: 46,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      color: C.text,
      fontSize: FontSize.sm,
      backgroundColor: C.inputBg,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.successLight,
      borderWidth: 1,
      borderColor: C.successBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs + 2,
      marginTop: 4,
    },
    infoBannerText: {
      color: C.success,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      flex: 1,
    },

    // Floor SubSection
    floorSubSection: {
      gap: Spacing.md,
      marginTop: 4,
      paddingTop: Spacing.xs,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.inputBg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    stepperSub: {
      color: C.textSecondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepperBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    stepperBtnDisabled: {
      opacity: 0.4,
    },
    stepperValueBox: {
      minWidth: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperValueText: {
      color: C.text,
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
    },
    chipActive: {
      backgroundColor: C.navy,
      borderColor: C.navy,
    },
    chipText: {
      color: C.textSecondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
    },
    chipTextActive: {
      color: C.white,
      fontWeight: FontWeight.bold,
    },

    // Toggles
    toggleSection: {
      gap: 8,
    },
    toggleTextGroup: {
      gap: 2,
    },
    toggleSub: {
      color: C.textSecondary,
      fontSize: FontSize.xs - 0.5,
      lineHeight: 15,
    },
    cardDivider: {
      height: 1,
      backgroundColor: C.cardBorderSubtle,
      marginVertical: 4,
    },

    error: {
      color: C.error,
      fontSize: FontSize.xs,
      marginTop: 2,
    },

    // CTA
    cta: {
      minHeight: 56,
      borderRadius: BorderRadius.xl,
      backgroundColor: C.navy,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.sm + 2,
      justifyContent: 'center',
      ...Shadow.md,
    },
    disabled: {
      opacity: 0.45,
    },
    ctaContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ctaTitle: {
      color: C.white,
      fontSize: FontSize.sm + 1,
      fontWeight: FontWeight.bold,
    },
    ctaSub: {
      color: 'rgba(255, 255, 255, 0.72)',
      fontSize: FontSize.xxs + 1,
      marginTop: 2,
    },
    ctaArrowCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
