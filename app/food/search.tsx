import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ChainLogo } from '@/components/food/ChainLogo';
import { FoodDataAttribution } from '@/components/food/FoodDataAttribution';
import { FoodSearchRow } from '@/components/food/FoodSearchRow';
import { RestaurantGrid } from '@/components/food/RestaurantGrid';
import { FilterChips, TermChips } from '@/components/food/SearchChips';
import { SkeletonRows } from '@/components/food/SkeletonRows';
import { AppIcon } from '@/components/ui/AppIcon';
import { CloseButton } from '@/components/ui/CloseButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { builderForChain } from '@/lib/food/builders';
import { clearRecentSearches, recentSearchesStore, rememberSearch, SUGGESTED_SEARCHES } from '@/lib/food/recentSearches';
import { matchRowToFood } from '@/lib/scan/reviewStore';
import type { FoodDetail } from '@/types';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';

type SectionKey = 'restaurants' | 'everyday' | 'packaged';
type Filter = 'all' | SectionKey;

interface ResultSection {
  key: SectionKey;
  title: string;
  data: FoodDetail[];
}

/**
 * Add Food. Before typing: the restaurant grid plus recent searches. While
 * typing: results grouped into cards (restaurants, everyday, packaged) with
 * a filter row to focus on one kind.
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
      <Stack.Screen
        options={{
          title: pickRowId ? 'Choose a match' : 'Add Food',
          headerLeft: pickRowId ? () => <CloseButton back onPress={() => router.back()} /> : () => null,
          headerRight: pickRowId ? undefined : () => <CloseButton onPress={() => router.back()} />,
          headerTitleAlign: 'center',
        }}
      />

      <View style={styles.searchBar}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search foods, brands, or restaurants" autoFocus={!pickRowId} loading={search.active && search.packagedStatus === 'loading'} />
        <ThemedText variant="footnote" color="secondary" style={styles.destination}>
          {pickRowId ? 'Pick the closest match; the scanned amount is kept.' : `Adding to ${MEAL_TYPE_META[mealType].label}`}
        </ThemedText>
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
          <View style={styles.rowWrap}>
            <FoodSearchRow food={item} onPress={() => choose(item)} disambiguate={search.isAmbiguous(item)} hideBrand={section.key === 'restaurants' && item.brand === search.chainNamed} position={position(index, section.data.length)} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <Animated.View entering={FadeIn.duration(220)} style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <View style={styles.sectionTitleRow}>
              {section.key === 'restaurants' && search.chainNamed ? <ChainLogo chain={search.chainNamed} size={22} radius={6} /> : null}
              <ThemedText variant="footnote" color="secondary" style={styles.sectionTitle}>
                {section.title.toUpperCase()}
              </ThemedText>
              {section.key === 'restaurants' && search.chainNamed ? (
                <Pressable onPress={() => openChain(search.chainNamed as string)} accessibilityRole="button" accessibilityLabel={`Browse the ${search.chainNamed} menu`} hitSlop={8} style={styles.browse}>
                  <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                    Full menu
                  </ThemedText>
                  <AppIcon name="chevronRight" size={11} color={colors.accent} weight="semibold" />
                </Pressable>
              ) : null}
            </View>
            {section.key === 'restaurants' && builder ? (
              <Pressable
                onPress={() => router.push({ pathname: '/food/build', params: { builder: builder.key, mealType } })}
                accessibilityRole="button"
                accessibilityLabel={`Build your ${builder.chain} order`}
                style={({ pressed }) => [styles.builder, { backgroundColor: colors.fab, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={styles.builderText}>
                  <ThemedText variant="headline" style={{ color: colors.fabIcon }}>
                    Build your order
                  </ThemedText>
                  <ThemedText variant="footnote" style={{ color: colors.fabIcon, opacity: 0.75 }}>
                    Pick it like you’d order it; the total is the menu’s own numbers.
                  </ThemedText>
                </View>
                <AppIcon name="chevronRight" size={14} color={colors.fabIcon} weight="semibold" />
              </Pressable>
            ) : null}
          </Animated.View>
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
              <EmptyState icon="search" title="Nothing yet" message="Try a simpler word, a chain like “Chipotle”, or a brand like “Chobani”." />
              <FoodDataAttribution style={styles.attribution} />
            </View>
          ) : (
            <View style={styles.landing}>
              {!pickRowId ? (
                <Pressable
                  onPress={() => router.push('/scan/describe')}
                  accessibilityRole="button"
                  accessibilityLabel="Describe what you ate"
                  style={({ pressed }) => [styles.describe, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={styles.describeText}>
                    <ThemedText variant="headline">Describe what you ate</ThemedText>
                    <ThemedText variant="footnote" color="secondary" numberOfLines={2}>
                      Type “2 eggs and toast, iced latte”. It gets sized, and you pick the numbers.
                    </ThemedText>
                  </View>
                  <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
                </Pressable>
              ) : null}
              <TermChips title={recents.length > 0 ? 'Recent' : 'Try'} terms={recents.length > 0 ? recents : SUGGESTED_SEARCHES} onPick={setQuery} onClear={recents.length > 0 ? clearRecentSearches : undefined} />
              <ThemedText variant="footnote" color="secondary" style={styles.browseTitle}>
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
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.sm },
  destination: { marginLeft: Spacing.xs },
  list: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
  rowWrap: { paddingHorizontal: Spacing.lg },
  sectionHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { letterSpacing: 0.5, flex: 1 },
  browse: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  landing: { paddingTop: Spacing.sm },
  describe: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth * 2, marginBottom: Spacing.lg },
  describeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  describeText: { flex: 1, gap: 2 },
  browseTitle: { letterSpacing: 0.5, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  builder: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.xl },
  builderText: { flex: 1, gap: 2 },
  gap: { height: Spacing.xs },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  noteText: { flex: 1 },
  attribution: { marginTop: Spacing.lg },
});
