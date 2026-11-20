import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  Calendar,
  Navigation,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowRight,
  Package,
} from 'lucide-react-native';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import type { BookingStatus } from '@triveni/shared-types';
import { bookingApi } from '@/lib/api';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';
import { PulsingDot } from '@/components/PulsingDot';

interface BookingCardProps {
  id: string;
  pickup: string;
  drop: string;
  date: string;
  amount: number;
  vehicle: string;
  itemsCount: number;
  status: BookingStatus;
  index: number;
}

function BookingCard({
  id,
  pickup,
  drop,
  date,
  amount,
  vehicle,
  itemsCount,
  status,
  index,
}: BookingCardProps) {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ComponentType<any> }
  > = {
    CONFIRMED: { label: 'Driver Assigning', color: Colors.warning, bg: Colors.warningLight, icon: Clock },
    ASSIGNED: { label: 'Driver Assigned', color: Colors.info, bg: Colors.infoLight, icon: Truck },
    EN_ROUTE: { label: 'En Route', color: Colors.warning, bg: Colors.warningLight, icon: Navigation },
    IN_PROGRESS: { label: 'In Transit', color: Colors.warning, bg: Colors.warningLight, icon: Truck },
    COMPLETED: { label: 'Delivered', color: Colors.success, bg: Colors.successLight, icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: Colors.error, bg: Colors.errorLight, icon: AlertCircle },
    REQUESTED: { label: 'Draft / Requested', color: Colors.info, bg: Colors.infoLight, icon: Clock },
  };

  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: Colors.textMuted,
    bg: Colors.surfaceSubtle,
    icon: Clock,
  };
  const StatusIcon = config.icon;
  const isLive = ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED'].includes(status);

  return (
    <FadeInUp delay={Math.min(index * 60, 300)}>
      <PressableScale
        style={[styles.card, isLive && styles.liveCardBorder]}
        activeOpacity={0.92}
        onPress={() => router.push(`/booking/${id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idCol}>
            <Text style={styles.bookingIdLabel}>BOOKING ID</Text>
            <Text style={styles.bookingId}>#{id.slice(-6).toUpperCase()}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: config.bg, borderColor: `${config.color}35` },
            ]}
          >
            {isLive ? (
              <PulsingDot color={config.color} size={6} />
            ) : (
              <StatusIcon size={12} color={config.color} strokeWidth={2.4} />
            )}
            <Text style={[styles.statusPillText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Route display */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={styles.routeConnectorLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.marigoldDark }]} />
            <Text style={styles.routeText} numberOfLines={1}>{drop}</Text>
          </View>
        </View>

        {/* Meta tags */}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Truck size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{vehicle}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Package size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {itemsCount > 0 ? `${itemsCount} items` : 'Cargo / Freight'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Calendar size={13} color={Colors.textMuted} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <Text style={styles.amountText}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>

        {isLive && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push(`/booking/${id}`)}
            activeOpacity={0.88}
          >
            <Navigation size={14} color={Colors.white} />
            <Text style={styles.trackButtonText}>Live GPS Radar</Text>
            <ArrowRight size={13} color={Colors.white} />
          </TouchableOpacity>
        )}
      </PressableScale>
    </FadeInUp>
  );
}

export default function BookingsScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [realBookings, setRealBookings] = useState<Omit<BookingCardProps, 'index'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = async () => {
    try {
      const list = await bookingApi.list();
      if (list && Array.isArray(list)) {
        setRealBookings(
          list.map((item) => ({
            id: item.id,
            pickup: item.pickupAddress,
            drop: item.dropAddress,
            date: new Date(item.scheduledDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            amount: item.finalAmount || item.baseQuoteAmount || 0,
            vehicle:
              item.vehicle?.type ||
              (item.status === 'CONFIRMED' || !item.vendor
                ? 'Assigning driver'
                : 'Commercial Goods Carrier'),
            itemsCount: item.items?.length || 0,
            status: item.status as BookingStatus,
          }))
        );
      } else {
        setRealBookings([]);
      }
    } catch {
      setRealBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredBookings = realBookings.filter((b) => {
    if (filter === 'Active') {
      return [
        'IN_PROGRESS',
        'CONFIRMED',
        'ASSIGNED',
        'REQUESTED',
        'EN_ROUTE',
        'ARRIVED',
      ].includes(b.status);
    }
    if (filter === 'Completed') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <FadeInUp delay={40}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Bookings</Text>
          <Text style={styles.pageSubtitle}>
            Track active moves and review past relocation receipts
          </Text>
        </View>
      </FadeInUp>

      {/* Filter Segmented Control */}
      <FadeInUp delay={80}>
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Completed'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </FadeInUp>

      <View style={styles.bookingsList}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={Colors.marigoldDark} />
            <Text style={styles.emptyTitle}>Fetching bookings…</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <FadeInUp delay={120}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Package size={34} color={Colors.textSecondary} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'All' ? 'No Bookings Found' : `No ${filter} Bookings`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'All'
                  ? 'Schedule your first move or freight delivery with transparent rates.'
                  : `You do not have any ${filter.toLowerCase()} moves currently.`}
              </Text>
              <PressableScale
                style={styles.quoteBtn}
                onPress={() => router.push('/quote')}
              >
                <Truck size={16} color={Colors.white} />
                <Text style={styles.quoteBtnText}>Book Packers &amp; Movers</Text>
              </PressableScale>
              <PressableScale
                style={[styles.quoteBtn, { backgroundColor: Colors.surfaceSubtle, borderWidth: 1, borderColor: Colors.cardBorder, marginTop: 8 }]}
                onPress={() => router.push('/transport' as any)}
              >
                <Truck size={16} color={Colors.text} />
                <Text style={[styles.quoteBtnText, { color: Colors.text }]}>Book Transport / Truck</Text>
              </PressableScale>
            </View>
          </FadeInUp>
        ) : (
          filteredBookings.map((b, idx) => (
            <BookingCard key={b.id} {...b} index={idx} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: Colors.background },
    container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxxl },

    header: { gap: 3 },
    pageTitle: {
      color: Colors.text,
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.extrabold,
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      lineHeight: 18,
    },

    filterRow: {
      flexDirection: 'row',
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.full,
      padding: 4,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      gap: 4,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.full,
    },
    filterChipActive: {
      backgroundColor: Colors.surface,
      ...Shadow.sm,
    },
    filterText: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
    },
    filterTextActive: {
      color: Colors.text,
      fontWeight: FontWeight.bold,
    },

    bookingsList: { gap: Spacing.md },

    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    liveCardBorder: {
      borderColor: Colors.successBorder,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    idCol: { gap: 2 },
    bookingIdLabel: {
      color: Colors.textMuted,
      fontSize: 9,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.8,
    },
    bookingId: {
      color: Colors.text,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.extrabold,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: BorderRadius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.2,
    },

    routeBox: {
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      padding: 10,
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    routeConnectorLine: {
      width: 1.5,
      height: 8,
      backgroundColor: Colors.cardBorder,
      marginLeft: 2.8,
    },
    routeText: {
      color: Colors.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      flex: 1,
    },

    metaRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    metaText: {
      color: Colors.textSecondary,
      fontSize: 11,
      fontWeight: FontWeight.medium,
    },

    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      color: Colors.textMuted,
      fontSize: 12,
      fontWeight: FontWeight.medium,
    },
    amountText: {
      color: Colors.text,
      fontSize: FontSize.md,
      fontWeight: FontWeight.extrabold,
    },

    trackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.brandSurface,
      borderRadius: BorderRadius.md,
      paddingVertical: 10,
      marginTop: 2,
    },
    trackButtonText: {
      color: Colors.white,
      fontSize: 12,
      fontWeight: FontWeight.bold,
    },

    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxl,
      gap: Spacing.xs,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      paddingHorizontal: Spacing.lg,
    },
    emptyTitle: {
      color: Colors.text,
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      marginTop: Spacing.sm,
    },
    emptySubtitle: {
      color: Colors.textSecondary,
      fontSize: FontSize.xs,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: Spacing.sm,
    },
    emptyIconBox: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    quoteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.brandSurface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      borderRadius: BorderRadius.md,
      width: '100%',
    },
    quoteBtnText: {
      color: Colors.white,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
    },
  });
