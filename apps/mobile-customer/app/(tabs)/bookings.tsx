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
  Edit3,
  Trash2,
  XCircle,
  FileText,
} from 'lucide-react-native';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import type { BookingStatus } from '@triveni/shared-types';
import { bookingApi } from '@/lib/api';
import { PressableScale } from '@/components/PressableScale';
import { FadeInUp } from '@/components/FadeInUp';
import { PulsingDot } from '@/components/PulsingDot';
import { CancellationProtocolModal } from '@/components/CancellationProtocolModal';

interface BookingCardProps {
  id: string;
  pickup: string;
  drop: string;
  date: string;
  amount: number;
  vehicle: string;
  itemsCount: number;
  status: BookingStatus;
  createdAt?: string;
  configurationType?: string;
  pricingSnapshot?: any;
  index: number;
  onDeleteDraft?: (id: string) => void;
  onEditDraft?: (booking: any) => void;
  onOpenCancelModal?: (id: string, status: BookingStatus) => void;
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
  createdAt,
  configurationType,
  pricingSnapshot,
  index,
  onDeleteDraft,
  onEditDraft,
  onOpenCancelModal,
}: BookingCardProps) {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const isDraft = status === 'REQUESTED' || status === 'QUOTED';
  const isCancellable = status === 'CONFIRMED' || status === 'ASSIGNED';
  const isInTransit = ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED'].includes(status);
  const isLive = ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED'].includes(status);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const initialTimer = setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, []);

  // Calculate hours remaining for draft (24 hours visibility)
  const draftHoursRemaining = (() => {
    if (!isDraft || !createdAt) return null;
    const createdMs = new Date(createdAt).getTime();
    if (isNaN(createdMs)) return null;
    const expiryMs = createdMs + 24 * 60 * 60 * 1000;
    const remainingHours = Math.max(0, Math.ceil((expiryMs - (currentTime ?? createdMs)) / (1000 * 60 * 60)));
    return remainingHours;
  })();

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ComponentType<any> }
  > = {
    CONFIRMED: { label: 'Partner Assigning', color: Colors.warning, bg: Colors.warningLight, icon: Clock },
    ASSIGNED: { label: 'Partner Assigned', color: Colors.info, bg: Colors.infoLight, icon: Truck },
    EN_ROUTE: { label: 'En Route', color: Colors.warning, bg: Colors.warningLight, icon: Navigation },
    IN_PROGRESS: { label: 'In Transit', color: Colors.warning, bg: Colors.warningLight, icon: Truck },
    COMPLETED: { label: 'Delivered', color: Colors.success, bg: Colors.successLight, icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: Colors.error, bg: Colors.errorLight, icon: AlertCircle },
    REQUESTED: { label: 'Draft Order', color: Colors.marigoldDark, bg: Colors.marigoldSubtle, icon: Clock },
    QUOTED: { label: 'Draft Quote', color: Colors.marigoldDark, bg: Colors.marigoldSubtle, icon: Clock },
  };

  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: Colors.textMuted,
    bg: Colors.surfaceSubtle,
    icon: Clock,
  };
  const StatusIcon = config.icon;

  return (
    <FadeInUp delay={Math.min(index * 60, 300)}>
      <PressableScale
        style={[styles.card, isLive && styles.liveCardBorder, isDraft && styles.draftCardBorder]}
        activeOpacity={0.92}
        onPress={() => router.push(`/booking/${id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idCol}>
            <Text style={styles.bookingIdLabel}>
              {isDraft ? 'DRAFT ORDER' : 'BOOKING ID'}
            </Text>
            <Text style={styles.bookingId}>#{id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.headerPillsRow}>
            {isDraft && draftHoursRemaining !== null && (
              <View style={styles.expiryPill}>
                <Clock size={10} color={Colors.marigoldDark} />
                <Text style={styles.expiryPillText}>Expires in {draftHoursRemaining}h</Text>
              </View>
            )}
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

        {/* Action Button Row */}
        {isDraft ? (
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.editDraftBtn}
              onPress={() =>
                onEditDraft?.({
                  id,
                  pickup,
                  drop,
                  configurationType,
                  pricingSnapshot,
                })
              }
              activeOpacity={0.85}
            >
              <Edit3 size={13} color={Colors.marigoldDark} />
              <Text style={styles.editDraftBtnText}>Edit Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteDraftBtn}
              onPress={() => onDeleteDraft?.(id)}
              activeOpacity={0.85}
            >
              <Trash2 size={13} color={Colors.error} />
              <Text style={styles.deleteDraftBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : isCancellable ? (
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.trackDetailsBtn}
              onPress={() => router.push(`/booking/${id}`)}
              activeOpacity={0.85}
            >
              <Navigation size={13} color={Colors.text} />
              <Text style={styles.trackDetailsBtnText}>Track Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelOrderBtn}
              onPress={() => onOpenCancelModal?.(id, status)}
              activeOpacity={0.85}
            >
              <XCircle size={13} color={Colors.error} />
              <Text style={styles.cancelOrderBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : isInTransit ? (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push(`/booking/${id}`)}
            activeOpacity={0.88}
          >
            <Navigation size={14} color={Colors.white} />
            <Text style={styles.trackButtonText}>Live GPS Radar</Text>
            <ArrowRight size={13} color={Colors.white} />
          </TouchableOpacity>
        ) : status === 'COMPLETED' ? (
          <TouchableOpacity
            style={styles.viewInvoiceBtn}
            onPress={() => router.push(`/booking/${id}/invoice`)}
            activeOpacity={0.88}
          >
            <FileText size={13} color={Colors.text} />
            <Text style={styles.viewInvoiceBtnText}>View Receipt &amp; POD</Text>
          </TouchableOpacity>
        ) : null}
      </PressableScale>
    </FadeInUp>
  );
}

export default function BookingsScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<'All' | 'Drafts' | 'Active' | 'Completed'>('All');
  const [realBookings, setRealBookings] = useState<Omit<BookingCardProps, 'index'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Protocol Modal State
  const [cancelModalState, setCancelModalState] = useState<{
    visible: boolean;
    bookingId: string;
    bookingStatus: BookingStatus;
  }>({
    visible: false,
    bookingId: '',
    bookingStatus: 'CONFIRMED',
  });

  const fetchBookings = async () => {
    const list = await bookingApi.list();
    if (!list || !Array.isArray(list)) return [];
    return list.map((item) => ({
      id: item.id,
      pickup: item.pickupAddress,
      drop: item.dropAddress,
      date: new Date(item.scheduledDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      amount: item.finalAmount || item.baseQuoteAmount || 0,
      vehicle: item.vehicle?.type || (item.status === 'CONFIRMED' || !item.vendor ? 'Matching verified partner' : 'Commercial Goods Carrier'),
      itemsCount: item.items?.length || 0,
      status: item.status as BookingStatus,
      createdAt: item.createdAt,
      configurationType: item.configurationType,
      pricingSnapshot: item.pricingSnapshot,
    }));
  };

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      setRealBookings(await fetchBookings());
    } catch {
      setRealBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetchBookings()
        .then((bookings) => { if (active) setRealBookings(bookings); })
        .catch(() => { if (active) setRealBookings([]); })
        .finally(() => { if (active) setIsLoading(false); });
    };
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const handleDeleteDraft = (bookingId: string) => {
    Alert.alert(
      'Delete Draft Order',
      'Are you sure you want to delete this draft move? This order will be permanently removed.',
      [
        { text: 'Keep Draft', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingApi.deleteDraft(bookingId);
              loadBookings();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to delete draft.');
            }
          },
        },
      ]
    );
  };

  const handleEditDraft = (b: any) => {
    const isTransport =
      b.pricingSnapshot?.serviceType === 'transport' ||
      ['tata_ace', 'tata_407', 'eicher_17ft', 'eicher_14ft', 'transport', 'bolero'].includes(
        b.configurationType
      );

    if (isTransport) {
      router.push({
        pathname: '/transport' as any,
        params: {
          pickup: b.pickup,
          drop: b.drop,
          draftId: b.id,
        },
      });
    } else {
      router.push({
        pathname: '/quote' as any,
        params: {
          pickup: b.pickup,
          drop: b.drop,
          config: b.configurationType,
          draftId: b.id,
        },
      });
    }
  };

  const handleOpenCancelModal = (bookingId: string, bookingStatus: BookingStatus) => {
    setCancelModalState({
      visible: true,
      bookingId,
      bookingStatus,
    });
  };

  const filteredBookings = realBookings.filter((b) => {
    if (filter === 'Drafts') {
      return b.status === 'REQUESTED' || b.status === 'QUOTED';
    }
    if (filter === 'Active') {
      return [
        'IN_PROGRESS',
        'CONFIRMED',
        'ASSIGNED',
        'EN_ROUTE',
        'ARRIVED',
      ].includes(b.status);
    }
    if (filter === 'Completed') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <FadeInUp delay={40}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>My Bookings</Text>
            <Text style={styles.pageSubtitle}>
              Track active moves, manage drafts, and review past relocation receipts
            </Text>
          </View>
        </FadeInUp>

        {/* Filter Segmented Control */}
        <FadeInUp delay={80}>
          <View style={styles.filterRow}>
            {(['All', 'Drafts', 'Active', 'Completed'] as const).map((f) => {
              const isActive = filter === f;
              const count = realBookings.filter((b) => {
                if (f === 'All') return true;
                if (f === 'Drafts') return b.status === 'REQUESTED' || b.status === 'QUOTED';
                if (f === 'Active') return ['IN_PROGRESS', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(b.status);
                if (f === 'Completed') return b.status === 'COMPLETED';
                return false;
              }).length;

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
                    {f} {count > 0 ? `(${count})` : ''}
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
                  {filter === 'Drafts'
                    ? 'Draft orders are kept for 24 hours. You have no pending drafts.'
                    : filter === 'All'
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
                  style={[
                    styles.quoteBtn,
                    {
                      backgroundColor: Colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: Colors.cardBorder,
                      marginTop: 8,
                    },
                  ]}
                  onPress={() => router.push('/transport' as any)}
                >
                  <Truck size={16} color={Colors.text} />
                  <Text style={[styles.quoteBtnText, { color: Colors.text }]}>Book Transport / Truck</Text>
                </PressableScale>
              </View>
            </FadeInUp>
          ) : (
            filteredBookings.map((b, idx) => (
              <BookingCard
                key={b.id}
                {...b}
                index={idx}
                onDeleteDraft={handleDeleteDraft}
                onEditDraft={handleEditDraft}
                onOpenCancelModal={handleOpenCancelModal}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Cancellation Protocol Modal */}
      <CancellationProtocolModal
        visible={cancelModalState.visible}
        bookingId={cancelModalState.bookingId}
        bookingStatus={cancelModalState.bookingStatus}
        onClose={() => setCancelModalState((prev) => ({ ...prev, visible: false }))}
        onSuccess={() => loadBookings()}
      />
    </>
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
      gap: 4,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.full,
    },
    filterChipActive: {
      backgroundColor: Colors.surface,
      ...Shadow.sm,
    },
    filterText: {
      fontSize: FontSize.xxs + 1,
      fontWeight: FontWeight.medium,
      color: Colors.textMuted,
    },
    filterTextActive: {
      color: Colors.text,
      fontWeight: FontWeight.bold,
    },

    bookingsList: {
      gap: Spacing.md,
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
    liveCardBorder: {
      borderColor: Colors.marigold,
      borderWidth: 1.5,
    },
    draftCardBorder: {
      borderColor: Colors.marigoldBorder,
      borderStyle: 'dashed',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    expiryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.marigoldSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.marigoldBorder,
    },
    expiryPillText: {
      fontSize: 9.5,
      fontWeight: FontWeight.bold,
      color: Colors.marigoldDark,
    },
    idCol: {
      gap: 1,
    },
    bookingIdLabel: {
      fontSize: 9.5,
      fontWeight: FontWeight.bold,
      color: Colors.textMuted,
      letterSpacing: 0.6,
    },
    bookingId: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.extrabold,
      color: Colors.text,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: FontSize.xxs,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.3,
    },

    routeBox: {
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm + 2,
      gap: 2,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    routeDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    routeConnectorLine: {
      width: 1,
      height: 10,
      backgroundColor: Colors.cardBorder,
      marginLeft: 3,
      marginVertical: 1,
    },
    routeText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
      color: Colors.text,
      flex: 1,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: Colors.surfaceSubtle,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    metaText: {
      fontSize: FontSize.xxs,
      color: Colors.textSecondary,
      fontWeight: FontWeight.medium,
    },

    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: Colors.cardBorder,
      paddingTop: Spacing.xs + 2,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dateText: {
      fontSize: FontSize.xxs,
      color: Colors.textMuted,
      fontWeight: FontWeight.medium,
    },
    amountText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.extrabold,
      color: Colors.text,
    },

    cardActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: 2,
    },
    editDraftBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      height: 38,
      backgroundColor: Colors.marigoldSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.marigoldBorder,
    },
    editDraftBtnText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.marigoldDark,
    },
    deleteDraftBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      height: 38,
      paddingHorizontal: Spacing.md,
      backgroundColor: Colors.errorLight,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.errorBorder,
    },
    deleteDraftBtnText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.error,
    },

    trackDetailsBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 38,
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    trackDetailsBtnText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },
    cancelOrderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      height: 38,
      paddingHorizontal: Spacing.md,
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    cancelOrderBtnText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: Colors.error,
    },

    trackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs + 2,
      backgroundColor: Colors.marigold,
      borderRadius: BorderRadius.md,
      paddingVertical: 9,
      marginTop: 2,
    },
    trackButtonText: {
      color: Colors.white,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.2,
    },

    viewInvoiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 36,
      backgroundColor: Colors.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      marginTop: 2,
    },
    viewInvoiceBtnText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: Colors.text,
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    emptyIconBox: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: Colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    emptyTitle: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: Colors.text,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 280,
    },
    quoteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.brandSurface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      marginTop: Spacing.md,
      width: '100%',
      maxWidth: 260,
    },
    quoteBtnText: {
      color: Colors.white,
      fontSize: FontSize.xs + 1,
      fontWeight: FontWeight.bold,
    },
  });
