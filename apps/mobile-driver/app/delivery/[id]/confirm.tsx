import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ShieldCheck,
  CheckCircle2,
  Camera,
  Signature,
  PackageCheck,
  Banknote,
  RotateCcw,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import { showToast } from '@/components/ToastHost';

export default function DeliveryConfirmScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const activeJob = useDriverStore((s) => s.activeJob);
  const completeJob = useDriverStore((s) => s.completeJob);

  const [customerName, setCustomerName] = useState(activeJob?.customerName || '');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [itemsChecked, setItemsChecked] = useState(false);
  const [unloadingDone, setUnloadingDone] = useState(false);
  const [paymentSettled, setPaymentSettled] = useState(false);
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = photoAdded && itemsChecked && unloadingDone && paymentSettled && signed;

  const handleFinishDelivery = async () => {
    if (!allChecked) {
      showToast({ title: 'Complete the handover checklist', message: 'Finish all checks and add a delivery photo.', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await completeJob(id as string, {
        signedBy: customerName,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Delivery not recorded',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
      return;
    }
    setLoading(false);

    Alert.alert(
      'Move Marked Complete',
      'The completion status was saved. Settlement is handled separately by Triveni operations.',
      [
        {
          text: 'View Earnings',
          onPress: () => router.replace('/(tabs)/earnings'),
        },
        {
          text: 'Back to Duties',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <PackageCheck size={28} color={Colors.navyDark} />
        </View>
        <Text style={styles.headerTitle}>Delivery & Handover</Text>
        <Text style={styles.headerSubtitle}>
          Complete the handover checklist for move {activeJob?.trackingCode}. This screen saves the move status only; it does not upload photos, signatures, or payment proof.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Verification Checkpoints */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mandatory Checkpoints</Text>

          {/* 1. Unload Check */}
          <TouchableOpacity
            style={[styles.checkRow, unloadingDone && styles.checkRowActive]}
            onPress={() => setUnloadingDone(!unloadingDone)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, unloadingDone && styles.checkboxActive]}>
              {unloadingDone && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>Unloading Completed</Text>
              <Text style={styles.checkSub}>All goods safely transferred into customer residence.</Text>
            </View>
          </TouchableOpacity>

          {/* 2. Inventory Damage Check */}
          <TouchableOpacity
            style={[styles.checkRow, itemsChecked && styles.checkRowActive]}
            onPress={() => setItemsChecked(!itemsChecked)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, itemsChecked && styles.checkboxActive]}>
              {itemsChecked && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>Goods Inspected & Verified</Text>
              <Text style={styles.checkSub}>Customer inspected high-value and fragile goods.</Text>
            </View>
          </TouchableOpacity>

          {/* 3. POD Photo Capture */}
          <TouchableOpacity
            style={[styles.checkRow, photoAdded && styles.checkRowActive]}
            onPress={() => setPhotoAdded(!photoAdded)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, photoAdded && styles.checkboxActive]}>
              {photoAdded && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>Proof of Delivery (Photo)</Text>
              <Text style={styles.checkSub}>
                {photoAdded ? 'Photo evidence collected outside this app.' : 'Collect the delivery photo using your approved operations process. It is not uploaded here.'}
              </Text>
            </View>
            <Camera size={20} color={photoAdded ? Colors.success : Colors.textMuted} />
          </TouchableOpacity>

          {/* 4. Payment Settlement */}
          <TouchableOpacity
            style={[styles.checkRow, paymentSettled && styles.checkRowActive]}
            onPress={() => setPaymentSettled(!paymentSettled)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, paymentSettled && styles.checkboxActive]}>
              {paymentSettled && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>Payment handled per booking instructions</Text>
              <Text style={styles.checkSub}>This app does not process, verify, or save a payment confirmation.</Text>
            </View>
            <Banknote size={20} color={paymentSettled ? Colors.success : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Customer Handover & Signature */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Acknowledgment</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Received By (Customer / Representative)</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Ramesh Kulkarni"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.signBox, signed && styles.signBoxActive]}
            onPress={() => setSigned(!signed)}
            activeOpacity={0.8}
          >
            <Signature size={24} color={signed ? Colors.success : Colors.textMuted} />
            <Text style={[styles.signLabel, signed && styles.signLabelActive]}>
              {signed ? 'Acknowledgement marked complete' : 'Confirm acknowledgement was collected outside this app'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.submitBtn, !allChecked && styles.submitBtnDisabled]}
          onPress={handleFinishDelivery}
          disabled={loading || !allChecked}
          activeOpacity={0.88}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting Handover...' : 'Confirm Delivery & Close Trip'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <RotateCcw size={15} color={Colors.textMuted} />
          <Text style={styles.cancelBtnText}>Back to Active Console</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    alignItems: 'center',
    gap: 4,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.sm + 4,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  checkRowActive: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkTextCol: {
    flex: 1,
  },
  checkLabel: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  checkSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.navyDark,
    fontWeight: FontWeight.medium,
  },

  signBox: {
    height: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  signBoxActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  signLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  signLabelActive: {
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },

  submitBtn: {
    backgroundColor: Colors.navyDark,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glowSm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
