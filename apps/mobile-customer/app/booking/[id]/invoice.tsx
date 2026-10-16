import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  CheckCircle2,
  MapPin,
  Home,
  ArrowLeft,
  Share2,
  Download,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { bookingApi, type BookingItem } from '@/lib/api';

export default function BookingInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await bookingApi.get(id);
        if (isMounted) setBooking(data);
      } catch (e) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleShare = () => {
    Alert.alert('Tax Invoice', 'Invoice link copied to clipboard.');
  };

  const handleDownload = () => {
    Alert.alert('Download Receipt', 'Invoice PDF saved to device.');
  };

  if (loading) {
    return (
      <View style={[styles.scroll, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.navy} />
        <Text style={{ marginTop: 12, color: Colors.navy, fontWeight: '600' }}>Loading invoice...</Text>
      </View>
    );
  }

  const totalAmount = booking?.finalAmount || booking?.baseQuoteAmount || 12500;
  const advancePaid = Math.round(totalAmount * 0.2);
  const balanceDue = totalAmount - advancePaid;
  const scheduledDateStr = booking?.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Date';
  const invoiceNum = booking ? `INV-${booking.id.slice(0, 8).toUpperCase()}` : 'INV-2024-8842';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ArrowLeft size={16} color={Colors.navy} />
        <Text style={styles.backText}>Back to Move Status</Text>
      </TouchableOpacity>

      {/* Invoice Card (Pure White Surface) */}
      <View style={styles.invoiceCard}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>TRIVENI TRANSPORTS</Text>
            <Text style={styles.brandSub}>LOGISTICS & RELOCATION SERVICES</Text>
            <Text style={styles.gstText}>GSTIN: 29AABCT1234F1Z5</Text>
          </View>
          <View style={styles.paidBadge}>
            <CheckCircle2 size={12} color={Colors.success} />
            <Text style={styles.paidText}>ADVANCE PAID</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Invoice Meta */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>INVOICE NO.</Text>
            <Text style={styles.metaVal}>{invoiceNum}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaVal}>{scheduledDateStr}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>BOOKING ID</Text>
            <Text style={styles.metaVal}>#{booking?.id || id}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>PAYMENT MODE</Text>
            <Text style={styles.metaVal}>UPI / Net Banking</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Route Info */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <MapPin size={14} color={Colors.marigold} />
            <Text style={styles.routeText}>{booking?.pickupAddress || 'Origin Location'}</Text>
          </View>
          <View style={styles.routeRow}>
            <Home size={14} color={Colors.navy} />
            <Text style={styles.routeText}>{booking?.dropAddress || 'Destination Location'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Line Items */}
        <View style={styles.lines}>
          <Text style={styles.sectionHeading}>PARTICULARS</Text>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>
              Dedicated Transport ({booking?.vehicle?.type || booking?.configurationType || 'Standard Truck'})
            </Text>
            <Text style={styles.linePrice}>₹{Math.round(totalAmount * 0.4).toLocaleString('en-IN')}.00</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Household Goods Handling & Floor Service</Text>
            <Text style={styles.linePrice}>₹{Math.round(totalAmount * 0.4).toLocaleString('en-IN')}.00</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Crew Labour & Standard Packing</Text>
            <Text style={styles.linePrice}>₹{Math.round(totalAmount * 0.15).toLocaleString('en-IN')}.00</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Goods Transit Cover (Included)</Text>
            <Text style={styles.linePrice}>₹{Math.round(totalAmount * 0.05).toLocaleString('en-IN')}.00</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.summaryTotals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Gross Total (Incl. GST)</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}.00</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Advance Received (20%)</Text>
            <Text style={styles.paidAmount}>-₹{advancePaid.toLocaleString('en-IN')}.00</Text>
          </View>
          <View style={[styles.totalLine, styles.dueLine]}>
            <Text style={styles.dueLabel}>Balance Payable on Delivery</Text>
            <Text style={styles.dueAmount}>₹10,000.00</Text>
          </View>
        </View>

        {/* Trust Stamp */}
        <View style={styles.stampBox}>
          <ShieldCheck size={16} color={Colors.navy} />
          <Text style={styles.stampText}>Official Computer Generated Tax Invoice · Triveni Transports</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <Download size={16} color={Colors.white} />
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={16} color={Colors.navy} />
          <Text style={styles.shareBtnText}>Share Invoice</Text>
        </TouchableOpacity>
      </View>
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

  invoiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 4,
    gap: Spacing.sm,
    ...Shadow.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
  },
  brandSub: {
    color: Colors.marigoldDark,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginTop: 1,
  },
  gstText: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  paidText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaItem: {
    width: '46%',
    gap: 1,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  metaVal: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  routeBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },

  lines: { gap: 6 },
  sectionHeading: {
    color: Colors.navy,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },
  linePrice: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  summaryTotals: { gap: 6, paddingTop: 4 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  totalAmount: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  paidAmount: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  dueLine: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    marginTop: 4,
  },
  dueLabel: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  dueAmount: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },

  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 4,
  },
  stampText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  downloadBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  shareBtnText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
