import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { FoodSearchRow } from '@/components/food/FoodSearchRow';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { PressScale, Stagger } from '@/components/motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glass } from '@/components/ui/Glass';
import { SearchField } from '@/components/ui/SearchField';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { builderForChain } from '@/lib/food/builders';
import { chainRows, chainRowToFood, searchChainFoods } from '@/lib/food/chainDatabase';
import { groupMenu } from '@/lib/food/menuGroups';
import { matchRowToFood } from '@/lib/scan/reviewStore';
import type { FoodDetail } from '@/types';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';
import { formatNumber } from '@/utils/format';

/** One chain's whole menu, sectioned like the menu board, with a search box that only looks here. */
export default function ChainMenuScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ chain?: string; mealType?: string; pick?: string }>();
  const { now } = useCurrentTime();
  const chain = singleParam(params.chain) ?? '';
  const mealType = mealTypeParam(params.mealType) ?? defaultMealType(now);
  const pickRowId = singleParam(params.pick) ?? null;
  const builder = pickRowId ? null : builderForChain(chain);
  const [query, setQuery] = useState('');

  const menu = useMemo(() => chainRows(chain).map(chainRowToFood), [chain]);
  const sections = useMemo(() => {
    const term = query.trim();
    if (term.length >= 2) {
      const hits = searchChainFoods(`${chain} ${term}`, 60);
      return hits.length > 0 ? [{ title: 'Results', data: hits }] : [];
    }
    return groupMenu(menu, (food) => food.name);
  }, [chain, menu, query]);

  const choose = (food: FoodDetail) => {
    if (pickRowId) {
      matchRowToFood(pickRowId, food);
      // Back past the search screen to the review it came from.
      navigation.getParent()?.goBack();
      return;
    }
    router.push({ pathname: '/food/[id]', params: { id: food.id, mealType } });
  };
  /** The X closes the whole Add Food flow, not just this page. */
  const closeFlow = () => navigation.getParent()?.goBack();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title={chain} tagline={menu.length > 0 ? (pickRowId ? 'pick the closest match' : `adding to ${MEAL_TYPE_META[mealType].label.toLowerCase()}`) : undefined} onBack={() => router.back()} onClose={closeFlow} />
      <SectionList
        sections={sections}
        keyExtractor={(food) => food.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              <ChainLogo chain={chain} size={64} radius={Radii.lg} />
              <View style={styles.titleBlock}>
                <ThemedText variant="figureSmall" style={styles.tabular}>
                  {menu.length > 0 ? formatNumber(menu.length) : '—'}
                </ThemedText>
                <ThemedText variant="overline" color="tertiary">
                  {menu.length > 0 ? 'ITEMS ON THE MENU' : 'MENU COMING SOON'}
                </ThemedText>
              </View>
            </View>
            {builder ? (
              <PressScale onPress={() => router.push({ pathname: '/food/build', params: { builder: builder.key, mealType } })} pressScale={0.985} accessibilityRole="button" accessibilityLabel={`Build your ${builder.chain} order`}>
                <Glass radius={Radii.xl} lit style={styles.builder}>
                  <View style={styles.builderText}>
                    <ThemedText variant="headline">build your order</ThemedText>
                    <ThemedText variant="footnote" color="secondary">
                      Pick it like you’d order it.
                    </ThemedText>
                  </View>
                  <AppIcon name="chevronRight" size={14} color={colors.accentText} weight="semibold" />
                </Glass>
              </PressScale>
            ) : null}
            {menu.length > 0 ? <SearchField value={query} onChangeText={setQuery} placeholder={`Search the ${chain} menu`} /> : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <ThemedText variant="overline" color="tertiary">
              {section.title.toUpperCase()}
            </ThemedText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <Stagger index={index} style={styles.rowWrap}>
            <FoodSearchRow food={item} onPress={() => choose(item)} hideBrand thumb={false} position={section.data.length === 1 ? 'only' : index === 0 ? 'first' : index === section.data.length - 1 ? 'last' : 'middle'} />
          </Stagger>
        )}
        renderSectionFooter={() => <View style={styles.gap} />}
        ListEmptyComponent={
          menu.length === 0 ? (
            <EmptyState title="Menu coming soon" message={`${chain} isn’t in our menu data yet. Search for the item by name, or snap a photo and the scanner will estimate it.`} />
          ) : (
            <EmptyState title="Nothing on this menu matches" message="Try a shorter word, like “chicken” or “large”." />
          )
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  titleBlock: { flex: 1, gap: 2 },
  builder: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  builderText: { flex: 1, gap: 2 },
  sectionHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  rowWrap: { paddingHorizontal: Spacing.lg },
  gap: { height: Spacing.xs },
  tabular: { fontVariant: ['tabular-nums'] },
});
