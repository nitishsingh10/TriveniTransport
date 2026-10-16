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
  Camera,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Banknote,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';

export default function DeliveryConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activeJob = useDriverStore((s) => s.activeJob);
  const completeJob = useDriverStore((s) => s.completeJob);

  // Checkbox states
  const [checklist, setChecklist] = useState({
    goodsInspected: true,
    fragileVerified: true,
    furniturePlaced: true,
    paymentCollected: true,
  });

  const [hasPhoto, setHasPhoto] = useState(true);
  const [customerName, setCustomerName] = useState(activeJob?.customerName || 'Rohit Sharma');
  const [otpCode, setOtpCode] = useState('7842');
  const [loading, setLoading] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean) && hasPhoto;

  const handleFinishDelivery = async () => {
    if (!allChecked) {
      Alert.alert('Incomplete Checklist', 'Please complete all inspection checks and capture a delivery photo before final submission.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    completeJob(id as string, {
      photoUri: 'mock-pod-photo-uri',
      signedBy: customerName,
      customerSignature: 'Digital Verification Verified',
      completedAt: 'Today, Just Now',
    });

    setLoading(false);

    Alert.alert(
      'Move Completed Successfully! 🎉',
      `Trip payout of ₹${activeJob?.payoutAmount ?? 3200} has been credited to your Triveni driver wallet.`,
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color={Colors.navy} />
          <Text style={styles.backBtnText}>Back to Move Console</Text>
        </TouchableOpacity>

        {/* Title Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.podBadge}>
              <ShieldCheck size={12} color={Colors.success} />
              <Text style={styles.podBadgeText}>FINAL HANDOVER & POD</Text>
            </View>
            <Text style={styles.trackingText}>#{activeJob?.trackingCode ?? 'TRV-PUN-8492'}</Text>
          </View>
          <Text style={styles.title}>Proof of Delivery (POD)</Text>
          <Text style={styles.subtitle}>
            Complete the final handover inspection with the customer to generate the official tax receipt and release driver payout.
          </Text>
        </View>

        {/* Payment Collection Reminder */}
        {activeJob && activeJob.collectAtDelivery > 0 && (
          <View style={styles.paymentCard}>
            <View style={styles.paymentIconBox}>
              <Banknote size={20} color={Colors.marigoldDark} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>Collect Balance at Delivery</Text>
              <Text style={styles.paymentAmount}>₹{activeJob.collectAtDelivery}</Text>
              <Text style={styles.paymentSub}>Collect via UPI QR or Cash before customer signature</Text>
            </View>
          </View>
        )}

        {/* Inspection Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Mandatory Inspection Checklist</Text>

          <TouchableOpacity
            style={styles.checkItem}
            onPress={() => toggleCheck('goodsInspected')}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, checklist.goodsInspected && styles.checkboxActive]}>
              {checklist.goodsInspected && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <Text style={styles.checkText}>All 18 items unloaded and verified with customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkItem}
            onPress={() => toggleCheck('fragileVerified')}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, checklist.fragileVerified && styles.checkboxActive]}>
              {checklist.fragileVerified && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <Text style={styles.checkText}>Fragile items & electronics inspected without damage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkItem}
            onPress={() => toggleCheck('furniturePlaced')}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, checklist.furniturePlaced && styles.checkboxActive]}>
              {checklist.furniturePlaced && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <Text style={styles.checkText}>Beds and major wardrobes assembled in customer rooms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkItem}
            onPress={() => toggleCheck('paymentCollected')}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, checklist.paymentCollected && styles.checkboxActive]}>
              {checklist.paymentCollected && <CheckCircle2 size={16} color={Colors.white} />}
            </View>
            <Text style={styles.checkText}>Full final settlement received from customer</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Proof of Delivery */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Photo Proof of Unloaded Goods</Text>
          <Text style={styles.photoHint}>
            Take a clear photo showing the unloaded cargo placed safely in the recipient's premises.
          </Text>

          {hasPhoto ? (
            <View style={styles.photoPreviewCard}>
              <View style={styles.photoFakeFrame}>
                <CheckCircle2 size={24} color={Colors.success} />
                <Text style={styles.photoCapturedText}>Unloading & Delivery Photo Captured</Text>
                <Text style={styles.photoTimestamp}>Timestamp: Today · GPS Tagged</Text>
              </View>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setHasPhoto(false)}
                activeOpacity={0.8}
              >
                <RotateCcw size={13} color={Colors.navy} />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={() => setHasPhoto(true)}
              activeOpacity={0.85}
            >
              <Camera size={22} color={Colors.navy} />
              <Text style={styles.captureBtnText}>Tap to Capture Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Handover OTP */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Customer Delivery Handover</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Received By (Customer Name)</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer Full Name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Handover OTP Code</Text>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="4-digit OTP"
            />
            <Text style={styles.inputSub}>Ask the customer for their 4-digit confirmation code</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.finishBtn, !allChecked && styles.finishBtnDisabled]}
          onPress={handleFinishDelivery}
          activeOpacity={0.88}
          disabled={!allChecked || loading}
        >
          <CheckCircle2 size={18} color={Colors.white} />
          <Text style={styles.finishBtnText}>Confirm Delivery & Credit Payout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  backBtnText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  podBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  podBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  trackingText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Payment Reminder Card
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  paymentAmount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    marginTop: 1,
  },
  paymentSub: {
    fontSize: 10,
    color: Colors.navyMuted,
    marginTop: 1,
  },

  // Checklist
  sectionHeading: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  checkText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.navyDark,
    fontWeight: FontWeight.medium,
    lineHeight: 17,
  },

  // Photo Box
  photoHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  photoPreviewCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  photoFakeFrame: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  photoCapturedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  photoTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.xs,
  },
  retakeText: {
    fontSize: 11,
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  captureBtn: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.navyBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  captureBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  // Inputs
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.navy,
    fontWeight: FontWeight.medium,
  },
  inputSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Finish Button
  finishBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  finishBtnDisabled: {
    opacity: 0.5,
  },
  finishBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
