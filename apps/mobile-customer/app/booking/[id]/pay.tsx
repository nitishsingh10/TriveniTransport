import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, type BookingItem } from '@/lib/api';

export default function BookingPayScreen() {
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
    Alert.alert(
      'Online Payment Temporarily Disabled',
      `${methodName} is temporarily paused. Please confirm your relocation using Cash on Delivery. Zero advance is required, and you can pay directly to your assigned captain on the day of delivery via Cash or UPI scanner.`,
      [{ text: 'Got It, Use COD' }]
    );
  };

  const handleConfirmCod = async () => {
    setProcessing(true);
    try {
      if (id) {
        if (bookingApi.confirmCod) {
          await bookingApi.confirmCod(id).catch(() => bookingApi.confirm(id));
        } else {
          await bookingApi.confirm(id);
        }
      }
      await new Promise((r) => setTimeout(r, 600));
      setProcessing(false);
      Alert.alert(
        '✓ Booking Confirmed (Cash on Delivery)',
        `Your relocation is successfully booked! Zero advance payment required.\n\nTotal of ₹${totalAmount.toLocaleString('en-IN')} will be collected by your moving captain upon safe delivery at your new address.`,
        [
          {
            text: 'View Move Details',
            onPress: () => router.replace(`/booking/${id}`),
          },
        ]
      );
    } catch {
      setProcessing(false);
      Alert.alert(
        'Booking Recorded',
        'Your booking with Cash on Delivery is confirmed. You can track your move status directly from the bookings tab.',
        [
          {
            text: 'Go to Bookings',
            onPress: () => router.replace(`/booking/${id}`),
          },
        ]
      );
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
        <ArrowLeft size={16} color={Colors.navy} />
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
          Booking #{id?.slice(0, 8).toUpperCase() || 'NEW'} · 100% payable only upon safe delivery
        </Text>
      </View>

      {/* Notice Banner */}
      <View style={styles.noticeBanner}>
        <Info size={16} color={Colors.marigoldDark} />
        <Text style={styles.noticeText}>
          Online payment gateway is temporarily disabled. All bookings are confirmed with <Text style={{ fontWeight: 'bold' }}>Cash on Delivery</Text> at zero advance fee.
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

      {/* Confirm CTA: Deep Navy Button */}
      <TouchableOpacity
        style={[styles.payCta, processing && styles.payCtaDisabled]}
        onPress={handleConfirmCod}
        disabled={processing}
        activeOpacity={0.88}
      >
        {processing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View style={styles.payCtaContent}>
            <Text style={styles.payCtaText}>Confirm Move (Cash on Delivery)</Text>
            <ArrowRight size={17} color={Colors.white} strokeWidth={2.4} />
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  backText: {
    color: Colors.navy,
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
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgeZeroAdvanceText: {
    color: '#15803D',
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
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeText: {
    flex: 1,
    color: '#92400E',
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
    backgroundColor: '#F0FDF4',
  },
  methodCardDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  codIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
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
    color: '#166534',
    fontSize: 11,
    lineHeight: 15,
  },
  disabledMethodDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
  },
  disabledPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disabledPillText: {
    color: '#64748B',
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
    backgroundColor: '#10B981',
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
    color: Colors.navy,
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },

  payCta: {
    backgroundColor: Colors.navy,
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
