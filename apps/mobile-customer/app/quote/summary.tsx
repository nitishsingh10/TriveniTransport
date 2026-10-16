import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Home,
  ArrowDown,
  ArrowRight,
  AlertCircle,
  PhoneCall,
  Check,
  FileCheck,
  CreditCard,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi } from '@/lib/api';

const ITEM_RATES: Record<string, { name: string; rate: number }> = {
  sofa_3: { name: '3-Seater Sofa', rate: 800 },
  tv_unit: { name: 'LED TV & Unit', rate: 400 },
  coffee_table: { name: 'Coffee Table', rate: 200 },
  double_bed: { name: 'Double Bed & Mattress', rate: 1200 },
  wardrobe: { name: 'Wardrobe / Almirah', rate: 900 },
  dressing: { name: 'Dressing Table', rate: 500 },
  fridge: { name: 'Refrigerator', rate: 600 },
  washing: { name: 'Washing Machine', rate: 500 },
  microwave: { name: 'Microwave Oven', rate: 200 },
  boxes_sm: { name: 'Carton Boxes (Small)', rate: 60 },
  boxes_lg: { name: 'Jumbo Boxes (Large)', rate: 120 },
  bicycle: { name: 'Bicycle / Two-Wheeler', rate: 300 },
};

const ZONE_RATE = 3500;
const LABOUR_RATE = 1200;

export default function SummaryScreen() {
  const params = useLocalSearchParams<{
    pickup: string;
    drop: string;
    config: string;
    floor: string;
    lift: string;
    quantities: string;
  }>();

  const quantities = useMemo<Record<string, number>>(
    () => JSON.parse(params.quantities ?? '{}'),
    [params.quantities]
  );

  const itemLines = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({
          label: ITEM_RATES[id]?.name ?? id,
          qty,
          unitPrice: ITEM_RATES[id]?.rate ?? 0,
          total: qty * (ITEM_RATES[id]?.rate ?? 0),
        })),
    [quantities]
  );

  const goodsSubtotal = itemLines.reduce((s, l) => s + l.total, 0);
  const liftDiscount = params.lift === '1' ? 0 : 400;
  const floorCharge = parseInt(params.floor ?? '0', 10) > 0 ? 300 : 0;
  const labourCharge = LABOUR_RATE + floorCharge + liftDiscount;
  const totalAmount = ZONE_RATE + goodsSubtotal + labourCharge;
  const advanceAmount = Math.ceil(totalAmount * 0.2);

  const [loading, setLoading] = useState(false);

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setDate(today.getDate() + 2);
      const scheduledDate = today.toISOString().split('T')[0];

      const itemsPayload = itemLines.map((line) => ({
        customName: line.label,
        quantity: line.qty,
        packingTier: 'standard' as const,
      }));

      if (itemsPayload.length === 0) {
        itemsPayload.push({
          customName: 'General Household Furniture',
          quantity: 1,
          packingTier: 'standard' as const,
        });
      }

      const res = await bookingApi.createBooking({
        pickupAddress: params.pickup || 'Viman Nagar, Pune',
        dropAddress: params.drop || 'Baner, Pune',
        configurationType: (params.config as any) || '2bhk',
        floorNumber: parseInt(params.floor || '0', 10),
        liftAvailable: params.lift === '1',
        scheduledDate,
        scheduledSlot: '09:00 AM – 12:00 PM',
        items: itemsPayload,
      });

      if (res?.booking?.id) {
        router.push(`/booking/${res.booking.id}/pay`);
      } else {
        router.push('/(tabs)/bookings');
      }
    } catch (e: any) {
      console.log('Backend createBooking error or fallback:', e.message);
      router.push('/(tabs)/bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleDone]}>
            <Check size={13} color={Colors.white} strokeWidth={3} />
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelDone]}>Locations</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleDone]}>
            <Check size={13} color={Colors.white} strokeWidth={3} />
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelDone]}>Items</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressNumActive}>3</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Summary</Text>
        </View>
      </View>

      <View style={styles.titleGroup}>
        <Text style={styles.stepBadge}>STEP 3 OF 3 — ESTIMATE READY</Text>
        <Text style={styles.title}>Price Breakdown</Text>
        <Text style={styles.subtitle}>
          Itemized transparent estimate with zero hidden costs or surge pricing.
        </Text>
      </View>

      {/* Route Summary (White Card) */}
      <View style={styles.routeSummary}>
        <View style={styles.routeItem}>
          <MapPin size={16} color={Colors.marigold} />
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeVal}>{params.pickup || 'Pickup location'}</Text>
          </View>
        </View>
        <View style={styles.routeDividerLine}>
          <ArrowDown size={14} color={Colors.textMuted} />
        </View>
        <View style={styles.routeItem}>
          <Home size={16} color={Colors.navy} />
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeLabel}>DELIVERY</Text>
            <Text style={styles.routeVal}>{params.drop || 'Drop destination'}</Text>
          </View>
        </View>
      </View>

      {/* Itemized Receipt Card (White Card) */}
      <View style={styles.linesCard}>
        <View style={styles.receiptHeader}>
          <FileCheck size={16} color={Colors.navy} />
          <Text style={styles.receiptTitle}>ITEMIZED CHARGES</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Base Vehicle & Distance Fee</Text>
          <Text style={styles.lineAmount}>₹{ZONE_RATE.toLocaleString('en-IN')}</Text>
        </View>

        {itemLines.map((l) => (
          <View key={l.label} style={styles.lineRow}>
            <Text style={styles.lineLabel}>
              {l.label} <Text style={styles.qtyBadge}>×{l.qty}</Text>
            </Text>
            <Text style={styles.lineAmount}>₹{l.total.toLocaleString('en-IN')}</Text>
          </View>
        ))}

        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>
            Labour & Crew Handling {params.lift !== '1' ? '(Stairs)' : '(Lift Assisted)'}
          </Text>
          <Text style={styles.lineAmount}>₹{labourCharge.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.taxInclusive}>Inclusive of GST & Transit Cover</Text>
          </View>
          <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Preliminary Note */}
      <View style={styles.disclaimer}>
        <AlertCircle size={16} color={Colors.warning} style={styles.disclaimerIcon} />
        <Text style={styles.disclaimerText}>
          This is an instant volumetric estimate based on your catalog input. Final rates are locked upon physical or video verification before dispatch.
        </Text>
      </View>

      {/* Deposit Card (Deep Navy Banner Card) */}
      <LinearGradient
        colors={[Colors.navy, '#162C4E']}
        style={styles.depositCard}
      >
        <View style={styles.depositHeader}>
          <CreditCard size={18} color={Colors.marigold} />
          <Text style={styles.depositTitle}>Confirm with 20% Booking Deposit</Text>
        </View>
        <Text style={styles.depositAmount}>₹{advanceAmount.toLocaleString('en-IN')}</Text>
        <Text style={styles.depositSub}>
          Remaining balance (₹{(totalAmount - advanceAmount).toLocaleString('en-IN')}) payable on delivery
        </Text>

        <TouchableOpacity
          style={[styles.bookCta, loading && { opacity: 0.7 }]}
          activeOpacity={0.88}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.navy} />
          ) : (
            <>
              <Text style={styles.bookCtaText}>Confirm & Book Relocation</Text>
              <ArrowRight size={17} color={Colors.navy} strokeWidth={2.4} />
            </>
          )}
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.callRow}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.8}
        >
          <PhoneCall size={14} color={Colors.marigold} />
          <Text style={styles.callLink}>Prefer to talk? Call 8828647785</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  progressItem: {
    alignItems: 'center',
    gap: 4,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleDone: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  progressCircleActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  progressNumActive: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  progressLabelDone: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  progressLabelActive: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.sm,
    marginBottom: 16,
  },
  progressLineDone: {
    backgroundColor: Colors.navy,
  },

  // Title
  titleGroup: { gap: 4 },
  stepBadge: {
    color: Colors.marigoldDark,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    color: Colors.navyDark,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  // Route Summary
  routeSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeDividerLine: {
    paddingLeft: 22,
    marginVertical: 2,
  },
  routeTextBlock: {
    flex: 1,
    gap: 1,
  },
  routeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  routeVal: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Lines Card
  linesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  receiptTitle: {
    color: Colors.navy,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },
  qtyBadge: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  lineAmount: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  taxInclusive: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  totalAmount: {
    color: Colors.navyDark,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: Spacing.md,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    color: '#92400E',
    fontSize: FontSize.xxs,
    lineHeight: 16,
  },

  // Deposit Card
  depositCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.md,
  },
  depositHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  depositTitle: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  depositAmount: {
    color: Colors.marigold,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 38,
    marginTop: 4,
  },
  depositSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FontSize.xxs,
    textAlign: 'center',
  },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
    ...Shadow.glowSm,
  },
  bookCtaText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  callLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
  },
});
