import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Package,
  Minus,
  Plus,
  ArrowRight,
  Check,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { catalogApi } from '@/lib/api';
import { DEFAULT_CATALOG, mergeServerCatalog, type RoomSection } from '@/constants/inventory';

export default function InventoryScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const params = useLocalSearchParams();
  const isOfficeMove = params.config === 'office';
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<RoomSection[]>(DEFAULT_CATALOG);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    catalogApi.listItems()
      .then((items) => {
        if (active && items.length > 0) {
          const currentCatalog = mergeServerCatalog(items);
          const availableIds = new Set(currentCatalog.flatMap((section) => section.items.map((item) => item.id)));
          const availableCategories = new Set(currentCatalog.map((section) => section.room));
          setCatalog(currentCatalog);
          setSelectedCategory((previous) => availableCategories.has(previous) ? previous : 'All');
          setQuantities((previous) => Object.fromEntries(
            Object.entries(previous).filter(([id]) => availableIds.has(id))
          ));
        }
      })
      .catch(() => {
        // Keep the offline-ready catalog available when the API cannot be reached.
      })
      .finally(() => {
        if (active) setIsCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  const update = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(100, Math.max(0, (prev[id] ?? 0) + delta)),
    }));
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const selectedLines = useMemo(
    () => catalog.flatMap((section) => section.items
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        id: item.id,
        itemId: item.serverId,
        name: item.name,
        quantity: quantities[item.id],
        defaultCft: item.defaultCft,
        baseRate: item.baseRate,
      }))),
    [catalog, quantities]
  );
  const estimatedGoodsCost = selectedLines.reduce((total, item) => total + item.baseRate * item.quantity, 0);
  const moveCatalog = useMemo(() => {
    const preferred = isOfficeMove
      ? ['office', 'electronics', 'carton', 'storage', 'living room', 'bedroom', 'kitchen', 'dining', 'vehicles']
      : ['living room', 'bedroom', 'kitchen', 'dining', 'electronics', 'carton', 'storage', 'vehicles', 'office'];
    return [...catalog].sort((a, b) => {
      const rank = (room: string) => {
        const value = room.toLowerCase();
        const index = preferred.findIndex((item) => value.includes(item));
        return index < 0 ? preferred.length : index;
      };
      return rank(a.room) - rank(b.room);
    });
  }, [catalog, isOfficeMove]);
  const categories = ['All', ...moveCatalog.map((section) => section.room)];
  const visibleCatalog = useMemo(() => moveCatalog
    .filter((section) => selectedCategory === 'All' || section.room === selectedCategory)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())),
    }))
    .filter((section) => section.items.length > 0), [moveCatalog, search, selectedCategory]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Progress */}
      <View style={styles.progressContainer}>
        {['Locations', 'Items', 'Details', 'Schedule'].map((label, index) => (
          <React.Fragment key={label}>
            {index > 0 && <View style={[styles.progressLine, index <= 1 && styles.progressLineDone]} />}
            <View style={styles.progressItem}>
              <View style={[styles.progressCircle, index === 0 && styles.progressCircleDone, index === 1 && styles.progressCircleActive]}>
                {index === 0 ? <Check size={13} color={Colors.white} strokeWidth={3} /> : <Text style={index === 1 ? styles.progressNumActive : styles.progressNum}>{index + 1}</Text>}
              </View>
              <Text style={[styles.progressLabel, index <= 1 && styles.progressLabelDone, index === 1 && styles.progressLabelActive]}>{label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.titleGroup}>
        <Text style={styles.stepBadge}>STEP 3 OF 4 · INVENTORY</Text>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Build your inventory</Text>
            <Text style={styles.subtitle}>
              Choose the goods you’re moving. All home and office items are available, with {isOfficeMove ? 'office' : 'home'} items shown first.
            </Text>
          </View>
          <View style={styles.catalogCountBadge}>
            <SlidersHorizontal size={14} color={Colors.text} />
            <Text style={styles.catalogCountText}>{catalog.reduce((n, section) => n + section.items.length, 0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={17} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search sofa, boxes, appliances…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.selectionSummary}>
        <View>
          <Text style={styles.selectionEyebrow}>YOUR MOVE</Text>
          <Text style={styles.selectionHeadline}>{totalItems} {totalItems === 1 ? 'item' : 'items'} selected</Text>
        </View>
        <View style={styles.selectionStats}>
          <Text style={styles.selectionVolume}>{estimatedGoodsCost > 0 ? `Est. ₹${estimatedGoodsCost.toLocaleString('en-IN')}` : 'Select your goods'}</Text>
          <Text style={styles.selectionCost}>Item quantities</Text>
        </View>
      </View>

      {isCatalogLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.text} />
          <Text style={styles.loadingText}>Loading current item rates…</Text>
        </View>
      )}

      {visibleCatalog.map((section) => {
        const SectionIcon = section.icon;
        return (
          <View key={section.room} style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionIcon size={18} color={Colors.text} strokeWidth={2.2} />
              <Text style={styles.roomTitle}>{section.room}</Text>
              <Text style={styles.sectionItemCount}>{section.items.length} goods</Text>
            </View>

            {section.items.map((item) => {
              const ItemIcon = item.icon;
              const count = quantities[item.id] ?? 0;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={[styles.itemIconContainer, count > 0 && styles.itemIconContainerActive]}>
                    <ItemIcon
                      size={18}
                      color={count > 0 ? Colors.text : Colors.textMuted}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>₹{item.baseRate}/unit</Text>
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
                        color={count > 0 ? Colors.text : Colors.cardBorder}
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

      {visibleCatalog.length === 0 && (
        <View style={styles.emptyState}>
          <Package size={24} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No goods found</Text>
          <Text style={styles.emptyCopy}>Try another name or choose a different category.</Text>
        </View>
      )}

      </ScrollView>

      <View style={styles.ctaArea}>
        <TouchableOpacity
          style={[styles.cta, totalItems === 0 && styles.ctaDisabled]}
          disabled={totalItems === 0}
          onPress={() => router.push({
            pathname: '/quote/address-details',
            params: {
              ...params,
              quantities: JSON.stringify(quantities),
              selectedItems: JSON.stringify(selectedLines),
            },
          })}
          activeOpacity={0.88}
        >
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaText}>{totalItems > 0 ? 'Review your estimate' : 'Add an item to continue'}</Text>
            {totalItems > 0 && <Text style={styles.ctaSubtext}>{totalItems} goods selected</Text>}
          </View>
          <ArrowRight size={18} color={Colors.white} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.md, paddingBottom: Spacing.xxl },

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
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headingCopy: { flex: 1, gap: 4 },
  catalogCountBadge: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  catalogCountText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.sm, paddingVertical: Spacing.sm },
  categoryRow: { gap: Spacing.sm, paddingVertical: 2, paddingRight: Spacing.md },
  categoryChip: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: Colors.brandSurface, borderColor: Colors.brandSurface },
  categoryChipText: { color: Colors.textSecondary, fontSize: FontSize.xxs, fontWeight: FontWeight.semibold },
  categoryChipTextActive: { color: Colors.white },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
  },
  selectionEyebrow: { color: Colors.navyMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1 },
  selectionHeadline: { color: Colors.navyDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 3 },
  selectionStats: { alignItems: 'flex-end', gap: 3 },
  selectionVolume: { color: Colors.navyDark, fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  selectionCost: { color: Colors.textSecondary, fontSize: 10 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 2 },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.xxs },

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
  sectionItemCount: { marginLeft: 'auto', color: Colors.textMuted, fontSize: FontSize.xxs, fontWeight: FontWeight.medium },
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
    color: Colors.text,
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
    backgroundColor: Colors.brandSurface,
    borderColor: Colors.brandSurface,
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

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 180,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: { color: Colors.navyDark, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  emptyCopy: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center' },

  ctaArea: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.brandSurface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  ctaDisabled: { backgroundColor: Colors.navyMuted, opacity: 0.65 },
  ctaCopy: { flex: 1, gap: 3 },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  ctaSubtext: { color: 'rgba(255,255,255,0.72)', fontSize: FontSize.xxs },
});
