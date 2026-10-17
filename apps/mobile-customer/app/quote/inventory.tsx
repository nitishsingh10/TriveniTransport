import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Armchair,
  Tv,
  Coffee,
  Bed,
  DoorClosed,
  MirrorRectangular,
  Refrigerator,
  WashingMachine,
  Box,
  Package,
  PackagePlus,
  Bike,
  UtensilsCrossed,
  Minus,
  Plus,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface RoomItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  defaultCft: number;
  baseRate: number;
}

interface RoomSection {
  room: string;
  icon: React.ComponentType<any>;
  items: RoomItem[];
}

const CATALOG: RoomSection[] = [
  {
    room: 'Living Room',
    icon: Armchair,
    items: [
      { id: 'sofa_3', name: '3-Seater Sofa', icon: Armchair, defaultCft: 40, baseRate: 800 },
      { id: 'tv_unit', name: 'LED TV & Media Unit', icon: Tv, defaultCft: 25, baseRate: 400 },
      { id: 'coffee_table', name: 'Coffee / Center Table', icon: Coffee, defaultCft: 12, baseRate: 200 },
    ],
  },
  {
    room: 'Bedroom Furniture',
    icon: Bed,
    items: [
      { id: 'double_bed', name: 'King / Queen Bed with Mattress', icon: Bed, defaultCft: 65, baseRate: 1200 },
      { id: 'wardrobe', name: 'Almirah / Wardrobe (2-3 Door)', icon: DoorClosed, defaultCft: 50, baseRate: 900 },
      { id: 'dressing', name: 'Dressing Table with Mirror', icon: MirrorRectangular, defaultCft: 30, baseRate: 500 },
    ],
  },
  {
    room: 'Kitchen & Appliances',
    icon: UtensilsCrossed,
    items: [
      { id: 'fridge', name: 'Double Door Refrigerator', icon: Refrigerator, defaultCft: 30, baseRate: 600 },
      { id: 'washing', name: 'Automatic Washing Machine', icon: WashingMachine, defaultCft: 25, baseRate: 500 },
      { id: 'microwave', name: 'Microwave Oven & Stand', icon: Box, defaultCft: 8, baseRate: 200 },
    ],
  },
  {
    room: 'Boxes & Miscellaneous',
    icon: Package,
    items: [
      { id: 'boxes_sm', name: 'Carton Box (Books/Clothes - 15kg)', icon: Package, defaultCft: 4, baseRate: 60 },
      { id: 'boxes_lg', name: 'Jumbo Box (Kitchenware/Linens - 25kg)', icon: PackagePlus, defaultCft: 12, baseRate: 120 },
      { id: 'bicycle', name: 'Bicycle / Two-Wheeler', icon: Bike, defaultCft: 20, baseRate: 300 },
    ],
  },
];

export default function InventoryScreen() {
  const params = useLocalSearchParams();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const update = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

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
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Text style={styles.progressNumActive}>2</Text>
          </View>
          <Text style={[styles.progressLabel, styles.progressLabelActive]}>Items</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNum}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Summary</Text>
        </View>
      </View>

      <View style={styles.titleGroup}>
        <Text style={styles.stepBadge}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Select Your Inventory</Text>
        <Text style={styles.subtitle}>
          Add items to get a transparent volume-based estimate. Additional items can always be added on moving day.
        </Text>
      </View>

      {CATALOG.map((section) => {
        const SectionIcon = section.icon;
        return (
          <View key={section.room} style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionIcon size={18} color={Colors.navy} strokeWidth={2.2} />
              <Text style={styles.roomTitle}>{section.room}</Text>
            </View>

            {section.items.map((item) => {
              const ItemIcon = item.icon;
              const count = quantities[item.id] ?? 0;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={[styles.itemIconContainer, count > 0 && styles.itemIconContainerActive]}>
                    <ItemIcon
                      size={18}
                      color={count > 0 ? Colors.navy : Colors.textMuted}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.defaultCft} CFT · ₹{item.baseRate}/unit
                    </Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={[styles.counterBtn, count === 0 && styles.counterBtnDisabled]}
                      onPress={() => update(item.id, -1)}
                      disabled={count === 0}
                      activeOpacity={0.7}
                    >
                      <Minus
                        size={13}
                        color={count > 0 ? Colors.navy : Colors.cardBorder}
                        strokeWidth={2.4}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.counterVal, count > 0 && styles.counterValActive]}>
                      {count}
                    </Text>
                    <TouchableOpacity
                      style={[styles.counterBtn, styles.counterBtnAdd]}
                      onPress={() => update(item.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={13} color={Colors.white} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* Sticky Bottom Summary Bar */}
      <View style={styles.ctaArea}>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaCount}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} selected for relocation
          </Text>
        </View>
        <TouchableOpacity
          style={styles.cta}
          onPress={() =>
            router.push({
              pathname: '/quote/summary',
              params: { ...params, quantities: JSON.stringify(quantities) },
            })
          }
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Proceed to Price Breakdown</Text>
          <ArrowRight size={17} color={Colors.white} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
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
  progressNum: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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

  // Section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.xs,
  },
  roomTitle: {
    color: Colors.navyDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.2,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorderSubtle,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconContainerActive: {
    backgroundColor: Colors.navySubtle,
    borderColor: Colors.navyBorder,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  itemMeta: {
    color: Colors.textSecondary,
    fontSize: 11,
  },

  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterBtnAdd: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  counterVal: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    minWidth: 20,
    textAlign: 'center',
  },
  counterValActive: {
    color: Colors.navyDark,
  },

  ctaArea: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  ctaBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  ctaCount: {
    color: Colors.navy,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    ...Shadow.sm,
  },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
