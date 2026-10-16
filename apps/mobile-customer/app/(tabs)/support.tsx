import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  PhoneCall,
  MessageSquare,
  Mail,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

const FAQ_ITEMS = [
  {
    q: 'How do I track my truck in real-time?',
    a: 'Go to the Bookings tab, select your active move, and tap "Live GPS Tracking". You will see real-time updates as your vehicle progresses along the transit route.',
  },
  {
    q: 'What happens if extra items need to be moved?',
    a: 'Your moving supervisor can perform an on-site inventory check. Any additional items will be added at transparent unit prices with prior customer confirmation before loading.',
  },
  {
    q: 'Can I reschedule my shifting date?',
    a: 'Yes, free rescheduling is available up to 24 hours prior to your scheduled move slot. Simply call our support desk or send a message on WhatsApp.',
  },
  {
    q: 'What is the payment breakdown?',
    a: 'A 20% advance booking deposit locks your truck and crew slot. The remaining balance is payable upon successful delivery and item handover via UPI, cards, or net banking.',
  },
  {
    q: 'Are household goods insured against transit damage?',
    a: 'Yes! All Triveni Transports moves include transit insurance coverage up to ₹10 Lakhs. Dedicated claims specialists assist in rare cases of transit disruption.',
  },
];

export default function SupportScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Support & Assistance</Text>
        <Text style={styles.subtitle}>
          Dedicated customer care available 24 hours a day, 7 days a week
        </Text>
      </View>

      {/* Contact Quick Options (Pure White Cards) */}
      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircle}>
            <PhoneCall size={20} color={Colors.navy} strokeWidth={2} />
          </View>
          <Text style={styles.contactLabel}>Phone Call</Text>
          <Text style={styles.contactValue}>8828647785</Text>
          <Text style={styles.contactMeta}>24/7 Helpline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('https://wa.me/918828647785')}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircle}>
            <MessageSquare size={20} color={Colors.navy} strokeWidth={2} />
          </View>
          <Text style={styles.contactLabel}>WhatsApp</Text>
          <Text style={styles.contactValue}>Chat Now</Text>
          <Text style={styles.contactMeta}>Instant response</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('mailto:support@trivenitransports.in')}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircle}>
            <Mail size={20} color={Colors.navy} strokeWidth={2} />
          </View>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>Write to Us</Text>
          <Text style={styles.contactMeta}>Within 2 hours</Text>
        </TouchableOpacity>
      </View>

      {/* Move Coordinator Banner (White with gold border) */}
      <View style={styles.coordinatorBanner}>
        <View style={styles.coordinatorHeader}>
          <ShieldCheck size={22} color={Colors.marigold} strokeWidth={2.4} />
          <Text style={styles.coordinatorTitle}>Dedicated Move Manager</Text>
        </View>
        <Text style={styles.coordinatorSub}>
          Every confirmed booking is assigned a dedicated relocation manager. They coordinate
          packing materials, vehicle dispatch, driver verification, and delivery sign-off from start to finish.
        </Text>
        <View style={styles.guaranteeRow}>
          <View style={styles.guaranteeItem}>
            <CheckCircle2 size={14} color={Colors.success} />
            <Text style={styles.guaranteeText}>Pre-move survey</Text>
          </View>
          <View style={styles.guaranteeItem}>
            <CheckCircle2 size={14} color={Colors.success} />
            <Text style={styles.guaranteeText}>On-site supervision</Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.sectionHeader}>
        <HelpCircle size={18} color={Colors.navy} />
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      </View>

      <View style={styles.faqList}>
        {FAQ_ITEMS.map((item, i) => (
          <View key={i} style={styles.faqItem}>
            <View style={styles.faqQRow}>
              <HelpCircle size={16} color={Colors.marigold} style={styles.faqQIcon} />
              <Text style={styles.faqQ}>{item.q}</Text>
            </View>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  header: { gap: 4 },
  pageTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  contactRow: { flexDirection: 'row', gap: Spacing.xs },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  contactLabel: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  contactValue: {
    color: Colors.marigoldDark,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  contactMeta: {
    color: Colors.textMuted,
    fontSize: 10,
  },

  coordinatorBanner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 4,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  coordinatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coordinatorTitle: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  coordinatorSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 20,
    marginTop: 2,
  },
  guaranteeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  guaranteeText: {
    color: Colors.navy,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
  },
  faqList: { gap: Spacing.sm },
  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqQIcon: {
    marginTop: 2,
  },
  faqQ: {
    flex: 1,
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    lineHeight: 18,
  },
  faqA: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 20,
    paddingLeft: 24,
  },
});
