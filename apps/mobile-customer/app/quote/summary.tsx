import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
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
  Banknote,
  Calendar,
  Wrench,
  Tag,
  Package,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, quoteApi } from '@/lib/api';
import { DEFAULT_CATALOG } from '@/constants/inventory';

interface SelectedItem {
  id: string;
  itemId?: string;
  name: string;
  quantity: number;
  defaultCft: number;
  baseRate: number;
}

const FALLBACK_ITEMS = new Map(
  DEFAULT_CATALOG.flatMap((section) => section.items.map((item) => [item.id, item] as const))
);

const ZONE_RATE = 3500;
const LABOUR_RATE = 1200;

export default function SummaryScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const params = useLocalSearchParams<{
    pickup: string;
    drop: string;
    config: string;
    floor: string;
    lift: string;
    quantities: string;
    selectedItems: string;
    pickupAddress?: string;
    dropAddress?: string;
    alternateContactPhone?: string;
    parkingClose?: string;
  }>();

  const quantities = useMemo<Record<string, number>>(() => {
    try { return JSON.parse(params.quantities ?? '{}'); } catch { return {}; }
  }, [params.quantities]);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    try {
      const parsed = JSON.parse(params.selectedItems ?? '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return Object.entries(quantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([id, quantity]) => {
        const item = FALLBACK_ITEMS.get(id);
        return {
          id,
          name: item?.name ?? id,
          quantity: Number(quantity),
          defaultCft: item?.defaultCft ?? 20,
          baseRate: item?.baseRate ?? 500,
        };
      });
  }, [params.selectedItems, quantities]);

  const itemLines = useMemo(
    () => selectedItems.map((item) => ({
      id: item.itemId || item.id,
      itemId: item.itemId,
      label: item.name,
      qty: item.quantity,
      cft: item.defaultCft,
      unitPrice: item.baseRate,
      total: item.quantity * item.baseRate,
    })),
    [selectedItems]
  );

  const [scheduledDate, setScheduledDate] = useState(() => {
    const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10);
  });
  const [scheduledSlot, setScheduledSlot] = useState('morning');
  const [packingTier, setPackingTier] = useState<'lite' | 'standard' | 'premium'>('standard');
  const [technicalWork, setTechnicalWork] = useState<string[]>([]);
  const goodsSubtotal = itemLines.reduce((s, l) => s + l.total, 0) * (packingTier === 'lite' ? 0.8 : packingTier === 'premium' ? 1.35 : 1);
  const liftDiscount = params.lift === '1' ? 0 : 400;
  const floorCharge = parseInt(params.floor ?? '0', 10) > 0 ? 300 : 0;
  const labourCharge = LABOUR_RATE + floorCharge + liftDiscount;
  const technicalCharge = technicalWork.length * 500;
  const totalAmount = ZONE_RATE + goodsSubtotal + labourCharge + technicalCharge;
  const [quoteEstimate, setQuoteEstimate] = useState<{ quoteAmount: number; breakdown: { goodsSubtotal: number; zoneCharge: number; labourCharge: number; surcharges: number; addonsTotal: number } } | null>(null);

  const dateOptions = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() + index + 1);
    const value = date.toISOString().slice(0, 10);
    return { value, day: date.toLocaleDateString('en-IN', { weekday: 'short' }), date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
  });

  const [loading, setLoading] = useState(false);

  const pickupAddress = params.pickupAddress || params.pickup || '';
  const dropAddress = params.dropAddress || params.drop || '';
  const configType = params.config || '2bhk';
  const floorNumber = parseInt(params.floor || '0', 10);
  const liftAvailable = params.lift === '1';
  const parkingClose = params.parkingClose !== '0';

  useEffect(() => {
    const timer = setTimeout(() => {
      void quoteApi.itemized({
        pickupAddress,
        dropAddress,
        ...(params.alternateContactPhone ? { alternateContactPhone: params.alternateContactPhone } : {}),
        configurationType: configType,
        floorNumber,
        liftAvailable,
        parkingClose,
        scheduledDate,
        scheduledSlot,
        items: itemLines.map((line) => ({ ...(line.itemId ? { itemId: line.itemId } : { customName: line.label, customCft: line.cft }), quantity: line.qty, packingTier })),
        addons: technicalWork,
      }).then(setQuoteEstimate).catch(() => setQuoteEstimate(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [pickupAddress, dropAddress, params.alternateContactPhone, configType, floorNumber, liftAvailable, parkingClose, scheduledDate, scheduledSlot, itemLines, packingTier, technicalWork]);

  const estimatedTotal = quoteEstimate?.quoteAmount ?? totalAmount;

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const itemsPayload = itemLines.map((line) => ({
        ...(line.itemId ? { itemId: line.itemId } : { customName: line.label, customCft: line.cft }),
        quantity: line.qty,
        packingTier,
      }));

      if (itemsPayload.length === 0) {
        itemsPayload.push({
          customName: 'General Household Furniture',
          customCft: 20,
          quantity: 1,
          packingTier: 'standard' as const,
        });
      }

      const res = await bookingApi.createBooking({
        pickupAddress: params.pickupAddress || params.pickup || '',
        dropAddress: params.dropAddress || params.drop || '',
        ...(params.alternateContactPhone ? { alternateContactPhone: params.alternateContactPhone } : {}),
        configurationType: (params.config as any) || '2bhk',
        floorNumber: parseInt(params.floor || '0', 10),
        liftAvailable: params.lift === '1',
        parkingClose: params.parkingClose !== '0',
        scheduledDate,
        scheduledSlot,
        items: itemsPayload,
        addons: technicalWork,
        paymentMethod: 'cash_on_delivery',
      });

      if (res?.booking?.id) {
        router.push(`/booking/${res.booking.id}/pay`);
      } else {
        throw new Error('The server did not return a booking confirmation.');
      }
    } catch (e: any) {
      console.warn('Backend createBooking failed:', e?.message || e);
      Alert.alert(
        'Booking not placed',
        e?.message || 'We could not place your booking. Please check your connection and try again.'
      );
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
          <View style={[styles.progressCircle, styles.progressCircleDone]}>
            <Check size={13} color={Colors.white} strokeWidth={3} />
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelDone]}>Details</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressNumActive}>4</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Schedule</Text>
        </View>
      </View>

      <View style={styles.titleGroup}>
        <Text style={styles.stepBadge}>STEP 4 OF 4 — SCHEDULE &amp; PRICE</Text>
        <Text style={styles.title}>Plan your move</Text>
        <Text style={styles.subtitle}>
          Choose a date, packing protection, and any technical work needed.
        </Text>
      </View>

      <View style={styles.linesCard}>
        <View style={styles.receiptHeader}><Calendar size={16} color={Colors.text} /><Text style={styles.receiptTitle}>MOVE DATE</Text></View>
        <View style={styles.dateOptions}>
          {dateOptions.map((option) => (
            <TouchableOpacity key={option.value} style={[styles.dateOption, scheduledDate === option.value && styles.optionSelected]} onPress={() => setScheduledDate(option.value)}>
              <Text style={[styles.dateDay, scheduledDate === option.value && styles.selectedOptionText]}>{option.day}</Text>
              <Text style={[styles.dateValue, scheduledDate === option.value && styles.selectedOptionText]}>{option.date}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Arrival window</Text>
        <View style={styles.choiceRow}>
          {['morning', 'afternoon', 'evening'].map((slot) => (
            <TouchableOpacity key={slot} style={[styles.choiceChip, scheduledSlot === slot && styles.optionSelected]} onPress={() => setScheduledSlot(slot)}>
              <Text style={[styles.choiceText, scheduledSlot === slot && styles.selectedOptionText]}>{slot[0].toUpperCase() + slot.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.linesCard}>
        <View style={styles.receiptHeader}><Package size={16} color={Colors.text} /><Text style={styles.receiptTitle}>PACKING TYPE</Text></View>
        {([
          ['lite', 'Basic', 'Protective wrap for everyday items'],
          ['standard', 'Standard', 'Layered protection for furniture and fragile goods'],
          ['premium', 'Premium', 'Enhanced protection for delicate and valuable items'],
        ] as const).map(([tier, label, detail]) => (
          <TouchableOpacity key={tier} style={[styles.packingOption, packingTier === tier && styles.optionSelected]} onPress={() => setPackingTier(tier)}>
            <View style={{ flex: 1 }}><Text style={[styles.packingTitle, packingTier === tier && styles.selectedOptionText]}>{label}</Text><Text style={styles.packingDesc}>{detail}</Text></View>
            <Text style={[styles.packingTick, packingTier === tier && styles.selectedOptionText]}>{packingTier === tier ? '✓' : '○'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.linesCard}>
        <View style={styles.receiptHeader}><Wrench size={16} color={Colors.text} /><Text style={styles.receiptTitle}>TECHNICAL WORK (OPTIONAL)</Text></View>
        {([
          ['electrician', 'Electronics installation / uninstallation', 'Extra charge'],
          ['carpenter', 'Bed or furniture dismantling / assembly', 'Extra charge'],
        ] as const).map(([addon, label, price]) => {
          const selected = technicalWork.includes(addon);
          return <TouchableOpacity key={addon} style={[styles.addonRow, selected && styles.optionSelected]} onPress={() => setTechnicalWork((current) => selected ? current.filter((item) => item !== addon) : [...current, addon])}>
            <View style={[styles.checkbox, selected && styles.checkboxActive]}>{selected ? <Check size={12} color={Colors.white} /> : null}</View>
            <Text style={styles.addonLabel}>{label}</Text><Text style={styles.addonPrice}>{price}</Text>
          </TouchableOpacity>;
        })}
      </View>

      <View style={styles.couponCard}>
        <Tag size={16} color={Colors.textMuted} /><View style={{ flex: 1 }}><Text style={styles.packingTitle}>Coupon</Text><Text style={styles.packingDesc}>No coupons available yet</Text></View>
        <Text style={styles.comingSoon}>COMING SOON</Text>
      </View>

      {/* Route Summary (White Card) */}
      <View style={styles.routeSummary}>
        <View style={styles.routeItem}>
          <MapPin size={16} color={Colors.marigold} />
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeVal}>{params.pickupAddress || params.pickup || 'Pickup location'}</Text>
          </View>
        </View>
        <View style={styles.routeDividerLine}>
          <ArrowDown size={14} color={Colors.textMuted} />
        </View>
        <View style={styles.routeItem}>
          <Home size={16} color={Colors.text} />
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeLabel}>DELIVERY</Text>
            <Text style={styles.routeVal}>{params.dropAddress || params.drop || 'Drop destination'}</Text>
          </View>
        </View>
      </View>

      {/* Itemized Receipt Card (White Card) */}
      <View style={styles.linesCard}>
        <View style={styles.receiptHeader}>
          <FileCheck size={16} color={Colors.text} />
          <Text style={styles.receiptTitle}>ITEMIZED CHARGES</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Base Vehicle & Distance Fee</Text>
          <Text style={styles.lineAmount}>₹{(quoteEstimate?.breakdown.zoneCharge ?? ZONE_RATE).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>Selected inventory ({itemLines.reduce((sum, line) => sum + line.qty, 0)} items)</Text>
          <Text style={styles.lineAmount}>₹{(quoteEstimate?.breakdown.goodsSubtotal ?? Math.round(goodsSubtotal)).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.lineRow}>
          <Text style={styles.lineLabel}>
            Labour & Crew Handling {params.floor === '0' ? '(Ground Floor)' : params.lift !== '1' ? '(Stairs)' : '(Lift Assisted)'}
          </Text>
          <Text style={styles.lineAmount}>₹{(quoteEstimate?.breakdown.labourCharge ?? labourCharge).toLocaleString('en-IN')}</Text>
        </View>

        {!!quoteEstimate?.breakdown.surcharges && <View style={styles.lineRow}><Text style={styles.lineLabel}>Site &amp; floor charges</Text><Text style={styles.lineAmount}>₹{quoteEstimate.breakdown.surcharges.toLocaleString('en-IN')}</Text></View>}
        {!!(quoteEstimate?.breakdown.addonsTotal ?? technicalCharge) && <View style={styles.lineRow}><Text style={styles.lineLabel}>Technical work</Text><Text style={styles.lineAmount}>₹{(quoteEstimate?.breakdown.addonsTotal ?? technicalCharge).toLocaleString('en-IN')}</Text></View>}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.taxInclusive}>Final charges confirmed before dispatch</Text>
          </View>
          <Text style={styles.totalAmount}>₹{estimatedTotal.toLocaleString('en-IN')}</Text>
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
        colors={[Colors.brandSurface, '#162C4E']}
        style={styles.depositCard}
      >
        <View style={styles.depositHeader}>
          <Banknote size={18} color={Colors.marigold} />
          <Text style={styles.depositTitle}>Confirm with Cash on Delivery</Text>
        </View>
        <Text style={styles.depositAmount}>₹{estimatedTotal.toLocaleString('en-IN')}</Text>
        <Text style={styles.depositSub}>
          ₹0 Advance Required · Full amount payable directly upon safe delivery
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
              <Text style={styles.bookCtaText}>Proceed to payment</Text>
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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: Colors.brandSurface,
    borderColor: Colors.brandSurface,
  },
  progressCircleActive: {
    backgroundColor: Colors.brandSurface,
    borderColor: Colors.brandSurface,
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
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  progressLabelActive: {
    color: Colors.text,
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
    backgroundColor: Colors.brandSurface,
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
    color: Colors.text,
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
    color: Colors.text,
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
  dateOptions: { flexDirection: 'row', gap: 7 },
  dateOption: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 3, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceSubtle },
  dateDay: { color: Colors.textMuted, fontSize: 9, fontWeight: FontWeight.semibold },
  dateValue: { color: Colors.text, fontSize: 10, fontWeight: FontWeight.bold },
  fieldLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold, marginTop: 3 },
  choiceRow: { flexDirection: 'row', gap: 7 },
  choiceChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surfaceSubtle },
  choiceText: { color: Colors.textSecondary, fontSize: 10, fontWeight: FontWeight.semibold },
  optionSelected: { borderColor: Colors.marigold, backgroundColor: Colors.marigoldSubtle },
  selectedOptionText: { color: Colors.marigoldDark },
  packingOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 9, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder },
  packingTitle: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  packingDesc: { color: Colors.textSecondary, fontSize: 10, marginTop: 2 },
  packingTick: { color: Colors.textMuted, fontSize: 16, fontWeight: FontWeight.bold },
  addonRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9, paddingHorizontal: 7, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.brandSurface, borderColor: Colors.brandSurface },
  addonLabel: { flex: 1, color: Colors.text, fontSize: 10, fontWeight: FontWeight.medium },
  addonPrice: { color: Colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold },
  couponCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, backgroundColor: Colors.surfaceSubtle, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: BorderRadius.lg },
  comingSoon: { color: Colors.textMuted, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  receiptTitle: {
    color: Colors.text,
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
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  lineAmount: {
    color: Colors.text,
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
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  taxInclusive: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  totalAmount: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.marigoldSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    padding: Spacing.md,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    color: Colors.warning,
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
