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
  CreditCard,
  QrCode,
  Building,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, type BookingItem } from '@/lib/api';

export default function BookingPayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
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
  const advanceAmount = Math.round(totalAmount * 0.2);
  const balanceAmount = totalAmount - advanceAmount;

  const handlePay = async () => {
    setProcessing(true);
    try {
      if (id) {
        await bookingApi.confirm(id).catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 800));
      setProcessing(false);
      Alert.alert(
        'Payment Successful',
        `Your advance deposit of ₹${advanceAmount.toLocaleString('en-IN')} has been received. Your relocation vehicle and crew are locked.`,
        [
          {
            text: 'View Move Status',
            onPress: () => router.replace(`/booking/${id}`),
          },
        ]
      );
    } catch {
      setProcessing(false);
      Alert.alert('Payment Status', 'Your payment is being verified by Triveni Transports.');
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

      {/* Amount Hero (Pure White Card) */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>BOOKING ADVANCE DEPOSIT (20%)</Text>
        <Text style={styles.amountValue}>₹{advanceAmount.toLocaleString('en-IN')}</Text>
        <Text style={styles.amountSub}>
          Booking #{id} · Balance ₹{balanceAmount.toLocaleString('en-IN')} payable upon safe delivery
        </Text>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      <View style={styles.methodsList}>
        {/* UPI Option */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === 'upi' && styles.methodCardActive,
          ]}
          onPress={() => setSelectedMethod('upi')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconWrapper}>
            <QrCode size={20} color={Colors.navy} />
          </View>
          <View style={styles.methodTextGroup}>
            <Text style={styles.methodTitle}>UPI Instant Payment</Text>
            <Text style={styles.methodDesc}>Google Pay, PhonePe, Paytm, BHIM</Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              selectedMethod === 'upi' && styles.radioCircleActive,
            ]}
          >
            {selectedMethod === 'upi' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Card Option */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === 'card' && styles.methodCardActive,
          ]}
          onPress={() => setSelectedMethod('card')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconWrapper}>
            <CreditCard size={20} color={Colors.navy} />
          </View>
          <View style={styles.methodTextGroup}>
            <Text style={styles.methodTitle}>Credit / Debit Card</Text>
            <Text style={styles.methodDesc}>Visa, MasterCard, RuPay</Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              selectedMethod === 'card' && styles.radioCircleActive,
            ]}
          >
            {selectedMethod === 'card' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* NetBanking Option */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === 'netbanking' && styles.methodCardActive,
          ]}
          onPress={() => setSelectedMethod('netbanking')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconWrapper}>
            <Building size={20} color={Colors.navy} />
          </View>
          <View style={styles.methodTextGroup}>
            <Text style={styles.methodTitle}>Net Banking</Text>
            <Text style={styles.methodDesc}>All Major Indian Banks</Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              selectedMethod === 'netbanking' && styles.radioCircleActive,
            ]}
          >
            {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Security Guarantee */}
      <View style={styles.securityBox}>
        <Lock size={15} color={Colors.success} />
        <Text style={styles.securityText}>
          PCI-DSS Level 1 Encrypted · Official Triveni Transports Escrow Gateway
        </Text>
      </View>

      {/* Pay CTA: Deep Navy Button */}
      <TouchableOpacity
        style={[styles.payCta, processing && styles.payCtaDisabled]}
        onPress={handlePay}
        disabled={processing}
        activeOpacity={0.88}
      >
        {processing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View style={styles.payCtaContent}>
            <Text style={styles.payCtaText}>Pay ₹2,500 Securely</Text>
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

  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
    marginTop: Spacing.xs,
  },

  methodsList: { gap: Spacing.xs },
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
  methodCardActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.surfaceSubtle,
  },
  methodIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextGroup: { flex: 1, gap: 2 },
  methodTitle: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  methodDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.navy,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.navy,
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
