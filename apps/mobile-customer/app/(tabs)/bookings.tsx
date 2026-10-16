import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { BookingStatus } from '@triveni/shared-types';
import { bookingApi } from '@/lib/api';

interface BookingCardProps {
  id: string;
  pickup: string;
  drop: string;
  date: string;
  amount: number;
  vehicle: string;
  itemsCount: number;
  status: BookingStatus;
}


const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<any> }
> = {
  CONFIRMED: {
    label: 'Confirmed',
    color: Colors.success,
    bg: Colors.successLight,
    icon: CheckCircle2,
  },
  ASSIGNED: {
    label: 'Driver Assigned',
    color: Colors.info,
    bg: Colors.infoLight,
    icon: Truck,
  },
  EN_ROUTE: {
    label: 'En Route',
    color: Colors.warning,
    bg: Colors.warningLight,
    icon: Navigation,
  },
  IN_PROGRESS: {
    label: 'In Transit',
    color: Colors.warning,
    bg: Colors.warningLight,
    icon: Truck,
  },
  COMPLETED: {
    label: 'Delivered',
    color: Colors.success,
    bg: Colors.successLight,
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: Colors.error,
    bg: Colors.errorLight,
    icon: AlertCircle,
  },
  REQUESTED: {
    label: 'Requested',
    color: Colors.info,
    bg: Colors.infoLight,
    icon: Clock,
  },
};

function BookingCard({
  id,
  pickup,
  drop,
  date,
  amount,
  vehicle,
  itemsCount,
  status,
}: BookingCardProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: Colors.textMuted,
    bg: Colors.surfaceSubtle,
    icon: Clock,
  };
  const StatusIcon = config.icon;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/booking/${id}`)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.bookingIdLabel}>BOOKING ID</Text>
          <Text style={styles.bookingId}>#{id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: config.bg, borderColor: `${config.color}35` }]}>
          <StatusIcon size={12} color={config.color} strokeWidth={2.4} />
          <Text style={[styles.statusPillText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Route display */}
      <View style={styles.routeBox}>
        <View style={styles.routeRow}>
          <MapPin size={15} color={Colors.marigold} />
          <Text style={styles.routeText}>{pickup}</Text>
        </View>
        <View style={styles.routeDivider}>
          <ArrowRight size={13} color={Colors.textMuted} />
        </View>
        <View style={styles.routeRow}>
          <MapPin size={15} color={Colors.success} />
          <Text style={styles.routeText}>{drop}</Text>
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
          <Text style={styles.metaText}>{itemsCount} items</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Calendar size={13} color={Colors.textMuted} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Text style={styles.amountText}>₹{amount.toLocaleString('en-IN')}</Text>
      </View>

      {(status === 'IN_PROGRESS' || status === 'EN_ROUTE' || status === 'ASSIGNED') && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => router.push(`/booking/${id}`)}
          activeOpacity={0.88}
        >
          <Navigation size={14} color={Colors.white} />
          <Text style={styles.trackButtonText}>Live GPS Tracking</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [realBookings, setRealBookings] = useState<BookingCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = async () => {
    setIsLoading(true);
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
            amount: item.finalAmount || item.baseQuoteAmount || 12000,
            vehicle: item.vehicle?.type || 'Tata 407 (14ft)',
            itemsCount: 18,
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
  }, []);

  const filteredBookings = realBookings.filter((b) => {
    if (filter === 'Active') return b.status === 'IN_PROGRESS' || b.status === 'CONFIRMED' || b.status === 'ASSIGNED' || b.status === 'REQUESTED' || b.status === 'EN_ROUTE' || b.status === 'ARRIVED';
    if (filter === 'Completed') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Bookings</Text>
        <Text style={styles.pageSubtitle}>Track and manage your household relocations</Text>
      </View>

      {/* Filter Chips */}
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
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bookingsList}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <Package size={36} color={Colors.navy} />
            <Text style={styles.emptyTitle}>Loading your bookings...</Text>
            <Text style={styles.emptySubtitle}>Fetching your latest relocations from Triveni servers</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Package size={38} color={Colors.navy} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'All' ? 'No Bookings Yet' : `No ${filter} Bookings`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'All'
                ? 'You have not scheduled any relocations with Triveni Transports yet.'
                : `You do not have any ${filter.toLowerCase()} moves currently.`}
            </Text>
            <TouchableOpacity
              style={styles.quoteBtn}
              onPress={() => router.push('/quote')}
              activeOpacity={0.88}
            >
              <Truck size={16} color={Colors.white} />
              <Text style={styles.quoteBtnText}>Get Instant Quote & Book</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((b) => <BookingCard key={b.id} {...b} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  header: { gap: 2 },
  pageTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },

  filterRow: { flexDirection: 'row', gap: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  bookingsList: { gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  bookingId: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },

  routeBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDivider: {
    paddingLeft: 18,
  },
  routeText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
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
    gap: 5,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  amountText: {
    color: Colors.navy,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },

  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    ...Shadow.sm,
  },
  trackButtonText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    color: Colors.navy,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  quoteBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
