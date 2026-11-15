import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { FoodDataAttribution } from '@/components/food/FoodDataAttribution';
import { FoodSearchRow } from '@/components/food/FoodSearchRow';
import { RestaurantGrid } from '@/components/food/RestaurantGrid';
import { FilterChips, TermChips } from '@/components/food/SearchChips';
import { SkeletonRows } from '@/components/food/SkeletonRows';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { PressScale, Stagger } from '@/components/motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glass } from '@/components/ui/Glass';
import { SearchField } from '@/components/ui/SearchField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Haptic } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { builderForChain } from '@/lib/food/builders';
import { clearRecentSearches, recentSearchesStore, rememberSearch, SUGGESTED_SEARCHES } from '@/lib/food/recentSearches';
import { createEntry } from '@/lib/log/entries';
import { frequentEntries } from '@/lib/log/frequent';
import { addEntries, logStore, removeEntry } from '@/lib/log/logStore';
import { matchRowToFood } from '@/lib/scan/reviewStore';
import type { FoodDetail, LogEntry } from '@/types';
import { formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';
import { showToast } from '@/utils/toast';

type SectionKey = 'restaurants' | 'everyday' | 'packaged';
type Filter = 'all' | SectionKey;

interface ResultSection {
  key: SectionKey;
  title: string;
  data: FoodDetail[];
}

/**
 * Add food. Before typing: what you log often (one tap logs it again),
 * recent searches and the restaurant grid. While typing: results grouped
 * into panels (restaurants, everyday, packaged) with a filter row to focus
 * on one kind.
 */
export default function FoodSearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ mealType?: string; pick?: string; q?: string }>();
  const { now } = useCurrentTime();
  const mealType = mealTypeParam(params.mealType) ?? defaultMealType(now);
  // In "pick" mode the search is choosing a database match for a scanned food.
  const pickRowId = singleParam(params.pick) ?? null;

  const [query, setQuery] = useState(() => singleParam(params.q) ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  // Built-in results are instant; the short debounce just spares Open Food Facts a request per keystroke.
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const search = useFoodSearch(debouncedQuery);
  const builder = pickRowId ? null : builderForChain(search.chainNamed);
  const recents = useSyncExternalStore(recentSearchesStore.subscribe, recentSearchesStore.getSnapshot, recentSearchesStore.getSnapshot);
  const log = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const often = useMemo(() => (pickRowId ? [] : frequentEntries(log, now)), [log, now, pickRowId]);

  /** One tap on something logged often: the latest amount goes into this meal, and the sheet closes on it. */
  const logAgain = (entry: LogEntry) => {
    const { id: _id, loggedAt: _loggedAt, ...rest } = entry;
    const again = createEntry({ ...rest, mealType }, new Date());
    addEntries([again]);
    Haptic.log();
    showToast({ message: `${entry.foodName} logged to ${MEAL_TYPE_META[mealType].label.toLowerCase()}`, actionLabel: 'Undo', onAction: () => removeEntry(again.id) });
    router.back();
  };

  const choose = (food: FoodDetail) => {
    rememberSearch(debouncedQuery);
    if (pickRowId) {
      matchRowToFood(pickRowId, food);
      router.back();
      return;
    }
    router.push({ pathname: '/food/[id]', params: { id: food.id, mealType } });
  };

  const openChain = (chain: string) => router.push({ pathname: '/food/chain', params: { chain, mealType, ...(pickRowId ? { pick: pickRowId } : {}) } });

  const all: ResultSection[] = useMemo(() => {
    if (!search.active) return [];
    const restaurants: ResultSection = { key: 'restaurants', title: search.chainNamed ?? 'Restaurants', data: search.restaurants };
    const everyday: ResultSection = { key: 'everyday', title: 'Everyday foods', data: search.everyday };
    const packaged: ResultSection = { key: 'packaged', title: 'Packaged foods', data: search.packaged };
    // A named chain leads; otherwise everyday foods come first and restaurants last.
    return search.chainNamed ? [restaurants, everyday, packaged] : [everyday, packaged, restaurants];
  }, [search.active, search.chainNamed, search.restaurants, search.everyday, search.packaged]);

  const counts: Record<SectionKey, number> = { restaurants: search.restaurants.length, everyday: search.everyday.length, packaged: search.packaged.length };
  const sections = all.filter((section) => (filter === 'all' ? section.data.length > 0 || section.key === 'packaged' || section.key === 'restaurants' : section.key === filter));

  const sectionFooter = (key: SectionKey) => {
    if (key === 'restaurants') {
      if (search.restaurants.length > 0) return <View style={styles.gap} />;
      return <Note text={search.chainNamed ? `Nothing on the ${search.chainNamed} menu matches those words.` : 'No menu items match.'} />;
    }
    if (key === 'everyday') return search.everyday.length === 0 ? <Note text="No everyday foods match. Try a simpler word." /> : <View style={styles.gap} />;
    if (search.packagedStatus === 'loading') return <SkeletonRows />;
    if (search.packagedStatus === 'error') return <Note text={search.packagedError ?? 'Packaged foods couldn’t load.'} actionLabel="Try again" onAction={search.retryPackaged} />;
    if (search.packaged.length === 0) return <Note text="No packaged foods match." />;
    return search.loadingMore ? <SkeletonRows count={1} /> : <View style={styles.gap} />;
  };

  const position = (index: number, length: number): 'first' | 'middle' | 'last' | 'only' => (length === 1 ? 'only' : index === 0 ? 'first' : index === length - 1 ? 'last' : 'middle');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader
        title={pickRowId ? 'Choose a match' : 'Add food'}
        tagline={pickRowId ? 'the scanned amount is kept' : `adding to ${MEAL_TYPE_META[mealType].label.toLowerCase()}`}
        onBack={pickRowId ? () => router.back() : undefined}
        onClose={pickRowId ? undefined : () => router.back()}
      />

      <View style={styles.searchBar}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search foods, brands, or restaurants" autoFocus={!pickRowId} loading={search.active && search.packagedStatus === 'loading'} />
      </View>

      {search.active ? (
        <FilterChips
          options={[
            { value: 'all', label: 'All' },
            { value: 'restaurants', label: 'Restaurants', count: counts.restaurants },
            { value: 'everyday', label: 'Everyday', count: counts.everyday },
            { value: 'packaged', label: 'Packaged', count: counts.packaged },
          ]}
          selected={filter}
          onSelect={setFilter}
        />
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(food) => food.id}
        renderItem={({ item, index, section }) => (
          <Stagger index={index} style={styles.rowWrap}>
            <FoodSearchRow food={item} onPress={() => choose(item)} disambiguate={search.isAmbiguous(item)} hideBrand={section.key === 'restaurants' && item.brand === search.chainNamed} position={position(index, section.data.length)} />
          </Stagger>
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <View style={styles.sectionTitleRow}>
              {section.key === 'restaurants' && search.chainNamed ? <ChainLogo chain={search.chainNamed} size={22} radius={Radii.sm} /> : null}
              <ThemedText variant="overline" color="tertiary" style={styles.sectionTitle}>
                {section.title.toUpperCase()}
              </ThemedText>
              {section.key === 'restaurants' && search.chainNamed ? (
                <PressScale onPress={() => openChain(search.chainNamed as string)} haptic="select" accessibilityRole="button" accessibilityLabel={`Browse the ${search.chainNamed} menu`} hitSlop={12} style={styles.browse}>
                  <ThemedText variant="footnote" style={[styles.strong, { color: colors.accentText }]}>
                    full menu
                  </ThemedText>
                  <AppIcon name="chevronRight" size={11} color={colors.accentText} weight="semibold" />
                </PressScale>
              ) : null}
            </View>
            {section.key === 'restaurants' && builder ? (
              <PressScale onPress={() => router.push({ pathname: '/food/build', params: { builder: builder.key, mealType } })} pressScale={0.985} accessibilityRole="button" accessibilityLabel={`Build your ${builder.chain} order`}>
                <Glass radius={Radii.xl} lit style={styles.callout}>
                  <View style={styles.calloutText}>
                    <ThemedText variant="headline">build your order</ThemedText>
                    <ThemedText variant="footnote" color="secondary">
                      Pick it like you’d order it; the total is the menu’s own numbers.
                    </ThemedText>
                  </View>
                  <AppIcon name="chevronRight" size={14} color={colors.accentText} weight="semibold" />
                </Glass>
              </PressScale>
            ) : null}
          </View>
        )}
        renderSectionFooter={({ section }) => sectionFooter(section.key)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          search.active ? (
            <View>
              <EmptyState title="Nothing yet" message="Try a simpler word, a chain like “Chipotle”, or a brand like “Chobani”." />
              <FoodDataAttribution style={styles.attribution} />
            </View>
          ) : (
            <View style={styles.landing}>
              {often.length > 0 ? (
                <View style={styles.often}>
                  <ThemedText variant="overline" color="tertiary">
                    LOGGED OFTEN
                  </ThemedText>
                  <View style={styles.oftenWrap}>
                    {often.map((entry, index) => (
                      <Stagger key={entry.id} index={index}>
                        <Chip label={entry.foodName} detail={`${formatNumber(entry.calories)} cal`} haptic={null} onPress={() => logAgain(entry)} accessibilityLabel={`Log ${entry.foodName} again, ${formatNumber(entry.calories)} calories`} style={styles.oftenChip} />
                      </Stagger>
                    ))}
                  </View>
                </View>
              ) : null}
              {!pickRowId ? (
                <PressScale onPress={() => router.push('/scan/describe')} pressScale={0.985} accessibilityRole="button" accessibilityLabel="Describe what you ate" style={styles.describe}>
                  <Glass radius={Radii.xl} style={styles.callout}>
                    <View style={styles.calloutText}>
                      <ThemedText variant="headline">describe what you ate</ThemedText>
                      <ThemedText variant="footnote" color="secondary" numberOfLines={2}>
                        Type “2 eggs and toast, iced latte”. It gets sized, and you pick the numbers.
                      </ThemedText>
                    </View>
                    <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
                  </Glass>
                </PressScale>
              ) : null}
              <TermChips title={recents.length > 0 ? 'Recent' : 'Try'} terms={recents.length > 0 ? recents : SUGGESTED_SEARCHES} onPick={setQuery} onClear={recents.length > 0 ? clearRecentSearches : undefined} />
              <ThemedText variant="overline" color="tertiary" style={styles.browseTitle}>
                RESTAURANTS
              </ThemedText>
              <RestaurantGrid onSelect={openChain} />
              <FoodDataAttribution style={styles.attribution} />
            </View>
          )
        }
        ListFooterComponent={search.active && sections.length > 0 ? <FoodDataAttribution style={styles.attribution} /> : null}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function Note({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.note}>
      <ThemedText variant="footnote" color="secondary" style={styles.noteText}>
        {text}
      </ThemedText>
      {actionLabel && onAction ? (
        <PressScale onPress={onAction} haptic="select" accessibilityRole="button" hitSlop={12} style={styles.noteAction}>
          <ThemedText variant="footnote" style={[styles.strong, { color: colors.accentText }]}>
            {actionLabel.toLowerCase()}
          </ThemedText>
        </PressScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  list: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
  rowWrap: { paddingHorizontal: Spacing.lg },
  sectionHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: MIN_TAP / 2 },
  sectionTitle: { flex: 1 },
  browse: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  strong: { fontWeight: '600' },
  landing: { paddingTop: Spacing.md, gap: Spacing.lg },
  often: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  oftenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  oftenChip: { maxWidth: 260 },
  describe: { marginHorizontal: Spacing.lg },
  callout: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  calloutText: { flex: 1, gap: 2 },
  browseTitle: { paddingHorizontal: Spacing.lg },
  gap: { height: Spacing.xs },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  noteText: { flex: 1 },
  noteAction: { justifyContent: 'center' },
  attribution: { marginTop: Spacing.lg },
});
