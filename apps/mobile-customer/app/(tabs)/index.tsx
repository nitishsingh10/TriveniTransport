import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Truck,
  Package,
  Navigation,
  Headphones,
  CheckCircle2,
  UserCheck,
  Car,
  Home,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Receipt,
  Compass,
  Star,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { bookingApi, type BookingItem } from '@/lib/api';

const QUICK_ACTIONS = [
  {
    icon: Truck,
    label: 'Get Quote',
    desc: 'Instant transparent estimate',
    route: '/quote' as const,
  },
  {
    icon: Package,
    label: 'My Bookings',
    desc: 'Track active & past relocations',
    route: '/(tabs)/bookings' as const,
  },
  {
    icon: Navigation,
    label: 'Live Track',
    desc: 'Real-time vehicle GPS',
    route: '/(tabs)/bookings' as const,
  },
  {
    icon: Headphones,
    label: '24/7 Helpline',
    desc: 'Direct coordinator support',
    route: '/(tabs)/support' as const,
  },
];

const MILESTONES = [
  { icon: CheckCircle2, label: 'Confirmed' },
  { icon: UserCheck, label: 'Assigned' },
  { icon: Car, label: 'En Route' },
  { icon: Package, label: 'Loading' },
  { icon: Truck, label: 'In Transit' },
  { icon: Home, label: 'Delivered' },
];

const STATUS_TO_STEP: Record<string, number> = {
  REQUESTED: 0,
  CONFIRMED: 0,
  ASSIGNED: 1,
  EN_ROUTE: 2,
  ARRIVED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const list = await bookingApi.list();
        if (isMounted && list && Array.isArray(list)) {
          // Find first active/ongoing move
          const active = list.find((b) =>
            ['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED', 'ASSIGNED', 'CONFIRMED', 'REQUESTED'].includes(b.status)
          );
          setActiveBooking(active || null);
        } else {
          if (isMounted) setActiveBooking(null);
        }
      } catch {
        if (isMounted) setActiveBooking(null);
      } finally {
        if (isMounted) setIsLoadingBooking(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card (Website Hero Banner in Deep Navy with Marigold Accents) */}
      <LinearGradient
        colors={[Colors.navy, '#162C4E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroPill}>
            <Sparkles size={12} color={Colors.marigold} />
            <Text style={styles.heroPillText}>Premium Relocation Service</Text>
          </View>

          <Text style={styles.heroGreeting}>
            Hello, {user?.name?.split(' ')[0] ?? 'there'}
          </Text>
          <Text style={styles.heroTitle}>Safe Hands for Your Shifting Plans</Text>
          <Text style={styles.heroSubtitle}>
            Transparent pricing · Live truck tracking · 50,000+ satisfied families
          </Text>

          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => router.push('/quote')}
            activeOpacity={0.88}
          >
            <Text style={styles.heroCtaText}>Get Instant Quote</Text>
            <ArrowRight size={16} color={Colors.navy} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroDecoBadge}>
          <Truck size={38} color={Colors.marigold} strokeWidth={1.75} />
        </View>
      </LinearGradient>

      {/* Trust Stats Bar (Light White Surface) */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Award size={16} color={Colors.navy} />
          <Text style={styles.statLabel}>50k+ Moves</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Star size={16} color={Colors.marigold} fill={Colors.marigold} />
          <Text style={styles.statLabel}>4.9/5 Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ShieldCheck size={16} color={Colors.success} />
          <Text style={styles.statLabel}>₹10L Insured</Text>
        </View>
      </View>

      {/* Quick Actions (White Cards on Canvas) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route)}
                activeOpacity={0.85}
              >
                <View style={styles.actionIconContainer}>
                  <IconComponent size={20} color={Colors.navy} strokeWidth={2} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Active Move Status (White Card) */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Move Status</Text>
          {activeBooking && (
            <View style={styles.livePulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>LIVE MOVEMENT</Text>
            </View>
          )}
        </View>

        {isLoadingBooking ? (
          <View style={[styles.moveCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <ActivityIndicator size="small" color={Colors.navy} />
            <Text style={[styles.moveEta, { marginTop: Spacing.xs }]}>Checking active moves...</Text>
          </View>
        ) : activeBooking ? (
          <View style={styles.moveCard}>
            <View style={styles.moveCardHeader}>
              <View>
                <Text style={styles.moveIdLabel}>BOOKING ID</Text>
                <Text style={styles.moveId}>#{activeBooking.id}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Truck size={13} color={Colors.navy} strokeWidth={2.4} />
                <Text style={styles.statusText}>{activeBooking.status.replace('_', ' ')}</Text>
              </View>
            </View>

            {/* Route Display */}
            <View style={styles.routeContainer}>
              <View style={[styles.routePoint, { flex: 1 }]}>
                <MapPin size={15} color={Colors.marigold} />
                <Text style={styles.routeLocation} numberOfLines={1}>
                  {activeBooking.pickupAddress}
                </Text>
              </View>
              <ArrowRight size={14} color={Colors.textMuted} style={{ marginHorizontal: 4 }} />
              <View style={[styles.routePoint, { flex: 1 }]}>
                <Home size={15} color={Colors.success} />
                <Text style={styles.routeLocation} numberOfLines={1}>
                  {activeBooking.dropAddress}
                </Text>
              </View>
            </View>

            <View style={styles.etaContainer}>
              <Calendar size={15} color={Colors.navy} />
              <Text style={styles.moveEta}>
                Scheduled: {new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })} · Slot: {activeBooking.scheduledSlot || 'Standard Morning'}
              </Text>
            </View>

            {/* Milestone timeline */}
            <View style={styles.milestoneRow}>
              {MILESTONES.map((m, i) => {
                const MilestoneIcon = m.icon;
                const currentStep = STATUS_TO_STEP[activeBooking.status] ?? 0;
                const isDone = i <= currentStep;
                return (
                  <React.Fragment key={m.label}>
                    <View style={styles.milestoneItem}>
                      <View
                        style={[
                          styles.milestoneCircle,
                          isDone && styles.milestoneCircleDone,
                        ]}
                      >
                        <MilestoneIcon
                          size={13}
                          color={isDone ? Colors.white : Colors.textMuted}
                          strokeWidth={isDone ? 2.4 : 1.8}
                        />
                      </View>
                      <Text
                        style={[
                          styles.milestoneLabel,
                          isDone && styles.milestoneLabelDone,
                        ]}
                        numberOfLines={1}
                      >
                        {m.label}
                      </Text>
                    </View>
                    {i < MILESTONES.length - 1 && (
                      <View
                        style={[
                          styles.milestoneLine,
                          i < currentStep && styles.milestoneLineDone,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push(`/booking/${activeBooking.id}`)}
              activeOpacity={0.88}
            >
              <Navigation size={15} color={Colors.white} />
              <Text style={styles.trackBtnText}>Live GPS Tracking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noActiveMoveCard}>
            <View style={styles.noActiveHeader}>
              <View style={styles.noActiveIconBox}>
                <Truck size={22} color={Colors.navy} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noActiveTitle}>No Active Relocation</Text>
                <Text style={styles.noActiveSub}>
                  You do not have any ongoing moves right now. Plan your relocation with instant transparent pricing.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.quoteCtaBtn}
              onPress={() => router.push('/quote')}
              activeOpacity={0.88}
            >
              <Text style={styles.quoteCtaText}>Book Your Relocation</Text>
              <ArrowRight size={15} color={Colors.white} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Why Triveni Transports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Triveni Transports?</Text>
        <View style={styles.whyGrid}>
          {[
            {
              icon: ShieldCheck,
              title: 'Fully Insured',
              desc: 'Transit damage coverage up to ₹10 Lakhs',
            },
            {
              icon: Receipt,
              title: 'No Hidden Fees',
              desc: 'Transparent itemized rate cards locked upfront',
            },
            {
              icon: Zap,
              title: 'Instant Quotes',
              desc: 'Real-time pricing engine in under 60 seconds',
            },
            {
              icon: Compass,
              title: 'GPS Tracking',
              desc: 'Watch your dedicated vehicle move on the map',
            },
          ].map((item) => {
            const FeatureIcon = item.icon;
            return (
              <View key={item.title} style={styles.whyCard}>
                <View style={styles.whyIconContainer}>
                  <FeatureIcon size={18} color={Colors.navy} strokeWidth={2} />
                </View>
                <Text style={styles.whyTitle}>{item.title}</Text>
                <Text style={styles.whyDesc}>{item.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xxl },

  // Hero Card (Navy Accent matching website hero)
  heroCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadow.md,
  },
  heroContent: { flex: 1, gap: Spacing.xs },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(247, 163, 0, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.35)',
    marginBottom: 4,
  },
  heroPillText: {
    color: Colors.marigoldLight,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
  },
  heroGreeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 3,
    paddingHorizontal: Spacing.md + 4,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    ...Shadow.glowSm,
  },
  heroCtaText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  heroDecoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(247, 163, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },

  // Stats Bar (White card)
  statsBar: {
    marginHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.cardBorder,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.2,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  pulseText: {
    color: Colors.success,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },

  // Quick Actions Grid (Pure White cards)
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: 4,
    ...Shadow.sm,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  actionDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
    lineHeight: 15,
  },

  // Active Move Card (Pure White)
  moveCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.md,
  },
  moveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveIdLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  moveId: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  statusText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeLocation: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moveEta: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Milestone timeline
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  milestoneItem: {
    alignItems: 'center',
    gap: 4,
    width: 44,
  },
  milestoneCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCircleDone: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  milestoneLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  milestoneLabelDone: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  milestoneLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.cardBorder,
    marginBottom: 16,
  },
  milestoneLineDone: {
    backgroundColor: Colors.navy,
  },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    ...Shadow.sm,
  },
  trackBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Why Triveni
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  whyCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: 4,
    ...Shadow.sm,
  },
  whyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  whyTitle: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  whyDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxs,
    lineHeight: 16,
  },
  noActiveMoveCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  noActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  noActiveIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noActiveTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  noActiveSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  quoteCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    ...Shadow.sm,
  },
  quoteCtaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
