import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Banknote,
  CreditCard,
  QrCode,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, type BookingItem } from '@/lib/api';
import { showToast } from '@/components/ToastHost';
import { PressableScale } from '@/components/PressableScale';

export default function BookingPayScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedMethod, setSelectedMethod] = useState<'cod' | 'upi' | 'card' | 'netbanking'>('cod');
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<BookingItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!id) return;
      try {
        const data = await bookingApi.get(id);
        if (isMounted) setBooking(data);
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const totalAmount = booking?.finalAmount || booking?.baseQuoteAmount || 12500;

  const handleOnlineMethodClick = (methodName: string) => {
    showToast({
      title: `${methodName} is temporarily unavailable`,
      message: 'Choose cash on delivery. No advance payment is required.',
      variant: 'info',
    });
  };

  const handleConfirmCod = async () => {
    setProcessing(true);
    try {
      if (id) {
        await bookingApi.confirmCod(id);
      }
      await new Promise((r) => setTimeout(r, 600));
      setProcessing(false);
      showToast({ title: 'Move booked', message: `₹${totalAmount.toLocaleString('en-IN')} due on delivery.`, variant: 'success' });
      router.replace(id ? `/booking/${id}` : '/(tabs)/bookings');
    } catch {
      setProcessing(false);
      showToast({ title: 'Could not confirm booking', message: 'Please retry or check your bookings.', variant: 'error' });
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ArrowLeft size={16} color={Colors.text} />
        <Text style={styles.backText}>Cancel & Go Back</Text>
      </TouchableOpacity>

      {/* Amount Hero (Zero Advance, Pay on Delivery) */}
      <View style={styles.amountCard}>
        <View style={styles.badgeZeroAdvance}>
          <Text style={styles.badgeZeroAdvanceText}>ZERO ADVANCE REQUIRED</Text>
        </View>
        <Text style={styles.amountLabel}>ESTIMATED MOVE TOTAL</Text>
        <Text style={styles.amountValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        <Text style={styles.amountSub}>
          Booking #{id?.slice(-6).toUpperCase() || 'NEW'} · 100% payable only upon safe delivery
        </Text>
      </View>

      {/* Notice Banner */}
      <View style={styles.noticeBanner}>
        <Info size={16} color={Colors.marigoldDark} />
        <Text style={styles.noticeText}>
          Online payment is temporarily unavailable. Your move will be confirmed only after you tap the confirmation button below. No advance is required with <Text style={{ fontWeight: 'bold' }}>Cash on Delivery</Text>.
        </Text>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      <View style={styles.methodsList}>
        {/* Cash on Delivery (ACTIVE & DEFAULT) */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            styles.methodCardCodActive,
          ]}
          onPress={() => setSelectedMethod('cod')}
          activeOpacity={0.85}
        >
          <View style={styles.codIconWrapper}>
            <Banknote size={22} color={Colors.white} />
          </View>
          <View style={styles.methodTextGroup}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.methodTitle}>Cash on Delivery (Pay on Move Day)</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.methodDesc}>
              Pay ₹{totalAmount.toLocaleString('en-IN')} in cash or UPI scanner directly to your driver captain after delivery.
            </Text>
          </View>
          <View style={[styles.radioCircle, styles.radioCircleCodActive]}>
            <Check size={14} color={Colors.white} strokeWidth={3} />
          </View>
        </TouchableOpacity>

        {/* UPI Option (DISABLED) */}
        <TouchableOpacity
          style={[styles.methodCard, styles.methodCardDisabled]}
          onPress={() => handleOnlineMethodClick('UPI Instant Payment')}
          activeOpacity={0.7}
        >
          <View style={styles.disabledIconWrapper}>
            <QrCode size={20} color={Colors.textMuted} />
          </View>
          <View style={styles.methodTextGroup}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.disabledMethodTitle}>UPI Instant Payment</Text>
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillText}>UNAVAILABLE</Text>
              </View>
            </View>
            <Text style={styles.disabledMethodDesc}>Google Pay, PhonePe, Paytm, BHIM</Text>
          </View>
          <View style={styles.radioCircleDisabled} />
        </TouchableOpacity>

        {/* Card Option (DISABLED) */}
        <TouchableOpacity
          style={[styles.methodCard, styles.methodCardDisabled]}
          onPress={() => handleOnlineMethodClick('Credit / Debit Card')}
          activeOpacity={0.7}
        >
          <View style={styles.disabledIconWrapper}>
            <CreditCard size={20} color={Colors.textMuted} />
          </View>
          <View style={styles.methodTextGroup}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.disabledMethodTitle}>Credit / Debit Card</Text>
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillText}>UNAVAILABLE</Text>
              </View>
            </View>
            <Text style={styles.disabledMethodDesc}>Visa, MasterCard, RuPay</Text>
          </View>
          <View style={styles.radioCircleDisabled} />
        </TouchableOpacity>

        {/* NetBanking Option (DISABLED) */}
        <TouchableOpacity
          style={[styles.methodCard, styles.methodCardDisabled]}
          onPress={() => handleOnlineMethodClick('Net Banking')}
          activeOpacity={0.7}
        >
          <View style={styles.disabledIconWrapper}>
            <Building size={20} color={Colors.textMuted} />
          </View>
          <View style={styles.methodTextGroup}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.disabledMethodTitle}>Net Banking</Text>
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillText}>UNAVAILABLE</Text>
              </View>
            </View>
            <Text style={styles.disabledMethodDesc}>All Major Indian Banks</Text>
          </View>
          <View style={styles.radioCircleDisabled} />
        </TouchableOpacity>
      </View>

      {/* Security Guarantee */}
      <View style={styles.securityBox}>
        <ShieldCheck size={16} color={Colors.success} />
        <Text style={styles.securityText}>
          Triveni Transports Price Assurance · ₹0 Advance · Pay only after item inspection
        </Text>
      </View>

      {/* Confirm CTA: Deep Navy Button with tactile spring scale */}
      <PressableScale
        style={[styles.payCta, processing && styles.payCtaDisabled]}
        onPress={handleConfirmCod}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View style={styles.payCtaContent}>
            <Text style={styles.payCtaText}>Confirm Move (Cash on Delivery)</Text>
            <ArrowRight size={17} color={Colors.white} strokeWidth={2.4} />
          </View>
        )}
      </PressableScale>
    </ScrollView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  backText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  badgeZeroAdvance: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgeZeroAdvanceText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
  },
  amountLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  amountValue: {
    color: Colors.navyDark,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 40,
    marginTop: 2,
  },
  amountSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
    textAlign: 'center',
    marginTop: 2,
  },

  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  noticeText: {
    flex: 1,
    color: Colors.warning,
    fontSize: 11,
    lineHeight: 15,
  },

  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
    marginTop: Spacing.xs,
  },

  methodsList: { gap: Spacing.xs + 2 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  methodCardCodActive: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: Colors.successLight,
  },
  methodCardDisabled: {
    opacity: 0.55,
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.cardBorder,
  },
  codIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextGroup: { flex: 1, gap: 2 },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  methodTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  disabledMethodTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  methodDesc: {
    color: Colors.success,
    fontSize: 11,
    lineHeight: 15,
  },
  disabledMethodDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  activePill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
  },
  disabledPill: {
    backgroundColor: Colors.inputBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disabledPillText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleCodActive: {
    backgroundColor: Colors.success,
  },
  radioCircleDisabled: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },

  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    marginTop: Spacing.xs,
  },
  securityText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },

  payCta: {
    backgroundColor: Colors.brandSurface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  payCtaDisabled: { opacity: 0.5 },
  payCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  payCtaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
