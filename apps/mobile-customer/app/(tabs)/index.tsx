import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
  Crosshair,
  Flag,
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
      {/* ── Modern Glassmorphic Hero Banner ─────────────────────────────── */}
      <LinearGradient
        colors={['#091524', '#0D1F37', '#162C4E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroPill}>
            <Sparkles size={12} color={Colors.marigold} />
            <Text style={styles.heroPillText}>Next-Gen Packers & Movers</Text>
          </View>

          <Text style={styles.heroGreeting}>
            Hello, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.heroTitle}>Safe Hands for Your Shifting Plans</Text>
          <Text style={styles.heroSubtitle}>
            Uber-style live map tracking · Transparent fixed quotes · 50,000+ happy homes
          </Text>

          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => router.push('/quote')}
            activeOpacity={0.88}
          >
            <Text style={styles.heroCtaText}>Calculate Instant Quote</Text>
            <ArrowRight size={16} color={Colors.navy} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroDecoBadge}>
          <Truck size={38} color={Colors.marigold} strokeWidth={1.8} />
        </View>
      </LinearGradient>

      {/* ── Uber-Style "Where to Move?" Fast Map Pinning Glass Card ──────── */}
      <View style={styles.fastPlanGlassCard}>
        <View style={styles.fastPlanHeader}>
          <View style={styles.fastPlanBadge}>
            <Compass size={14} color={Colors.marigoldDark} strokeWidth={2.4} />
            <Text style={styles.fastPlanBadgeText}>FAST MAP BOOKING</Text>
          </View>
          <Text style={styles.fastPlanTitle}>Plan Your Shifting Route</Text>
        </View>

        {/* Pickup Trigger Row */}
        <TouchableOpacity
          style={styles.fastInputRow}
          onPress={() => router.push('/quote')}
          activeOpacity={0.85}
        >
          <View style={styles.fastDotGold} />
          <Text style={styles.fastInputPlaceholder}>Set pickup location on map...</Text>
          <View style={styles.pinMiniBadge}>
            <MapPin size={12} color={Colors.marigoldDark} strokeWidth={2.4} />
            <Text style={styles.pinMiniText}>Pin</Text>
          </View>
        </TouchableOpacity>

        {/* Drop Trigger Row */}
        <TouchableOpacity
          style={styles.fastInputRow}
          onPress={() => router.push('/quote')}
          activeOpacity={0.85}
        >
          <View style={styles.fastDotNavy} />
          <Text style={styles.fastInputPlaceholder}>Set drop destination on map...</Text>
          <View style={[styles.pinMiniBadge, { backgroundColor: Colors.navySubtle, borderColor: Colors.navyBorder }]}>
            <Flag size={12} color={Colors.navy} strokeWidth={2.4} />
            <Text style={[styles.pinMiniText, { color: Colors.navy }]}>Pin</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Shortcut Hubs */}
        <View style={styles.fastShortcutsRow}>
          <TouchableOpacity
            style={styles.fastHubPill}
            onPress={() => router.push('/quote')}
            activeOpacity={0.75}
          >
            <Crosshair size={11} color={Colors.navy} strokeWidth={2.2} />
            <Text style={styles.fastHubText}>Use GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fastHubPill}
            onPress={() => router.push('/quote')}
            activeOpacity={0.75}
          >
            <Text style={styles.fastHubText}>Viman Nagar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fastHubPill}
            onPress={() => router.push('/quote')}
            activeOpacity={0.75}
          >
            <Text style={styles.fastHubText}>Hinjewadi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fastHubPill}
            onPress={() => router.push('/quote')}
            activeOpacity={0.75}
          >
            <Text style={styles.fastHubText}>Bandra</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Trust Stats Glass Bar ────────────────────────────────────────── */}
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

      {/* ── Quick Actions Grid ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Services</Text>
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
                  <IconComponent size={20} color={Colors.navy} strokeWidth={2.2} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Active Move Status Glass Card ─────────────────────────────────── */}
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
                  You do not have any ongoing moves right now. Plan your move with instant transparent pricing.
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

      {/* ── Why Triveni Transports ───────────────────────────────────────── */}
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
              title: 'Uber-Like GPS',
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
  scroll: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  container: {
    paddingBottom: Spacing.xxl,
  },

  // ── Hero Card ─────────────────────────────────────────────────────
  heroCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.xl + 2,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#091524',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(247, 163, 0, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.4)',
    marginBottom: 4,
  },
  heroPillText: {
    color: Colors.marigoldLight,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
  },
  heroGreeting: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.medium,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xl + 1,
    fontWeight: FontWeight.extrabold,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
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
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md + 4,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    shadowColor: Colors.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCtaText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  heroDecoBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(247, 163, 0, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(247, 163, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },

  // ── Fast Plan Glass Card ──────────────────────────────────────────
  fastPlanGlassCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl + 2,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: Spacing.sm + 2,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 5,
  },
  fastPlanHeader: {
    gap: 2,
  },
  fastPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fastPlanBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
    letterSpacing: 0.5,
  },
  fastPlanTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  fastInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.08)',
    gap: Spacing.sm,
  },
  fastDotGold: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.marigold,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fastDotNavy: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.navy,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fastInputPlaceholder: {
    flex: 1,
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  pinMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.marigoldSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
  },
  pinMiniText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.marigoldDark,
  },
  fastShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  fastHubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.12)',
    gap: 4,
  },
  fastHubText: {
    fontSize: 10.5,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },

  // ── Stats Bar ─────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.cardBorder,
  },

  // ── Sections & Grids ──────────────────────────────────────────────
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  pulseText: {
    color: Colors.success,
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: 6,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
  },
  actionLabel: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  actionDesc: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  // ── Move Card ─────────────────────────────────────────────────────
  moveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.xl + 2,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    gap: Spacing.sm + 2,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  moveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveIdLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  moveId: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.marigoldSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(13, 31, 55, 0.06)',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeLocation: {
    fontSize: FontSize.xs,
    color: Colors.navy,
    fontWeight: FontWeight.semibold,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moveEta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
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
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCircleDone: {
    backgroundColor: Colors.navy,
  },
  milestoneLabel: {
    fontSize: 8.5,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  milestoneLabelDone: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
  milestoneLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  milestoneLineDone: {
    backgroundColor: Colors.navy,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    gap: 6,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
  },

  noActiveMoveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gap: Spacing.md,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  noActiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 4,
  },
  noActiveIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.navyBorder,
  },
  noActiveTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  noActiveSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  quoteCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.xs,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteCtaText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
  },

  // ── Why Triveni ───────────────────────────────────────────────────
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  whyCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    gap: 4,
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  whyIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.marigoldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  whyTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  whyDesc: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
});
