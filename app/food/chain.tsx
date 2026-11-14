import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { FoodSearchRow } from '@/components/food/FoodSearchRow';
import { AppIcon } from '@/components/ui/AppIcon';
import { CloseButton } from '@/components/ui/CloseButton';
import { EmptyState } from '@/components/ui/EmptyState';
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
      <Stack.Screen options={{ title: '', headerLeft: () => <CloseButton back onPress={() => router.back()} />, headerRight: () => <CloseButton onPress={closeFlow} /> }} />
      <SectionList
        sections={sections}
        keyExtractor={(food) => food.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              <ChainLogo chain={chain} size={72} radius={Radii.xl} />
              <View style={styles.titleBlock}>
                <ThemedText variant="title1" accessibilityRole="header">
                  {chain}
                </ThemedText>
                <ThemedText variant="footnote" color="secondary">
                  {menu.length > 0 ? `${formatNumber(menu.length)} items · ${pickRowId ? 'pick the closest match' : `adding to ${MEAL_TYPE_META[mealType].label}`}` : 'Menu coming soon'}
                </ThemedText>
              </View>
            </View>
            {builder ? (
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
                    Pick it like you’d order it.
                  </ThemedText>
                </View>
                <AppIcon name="chevronRight" size={14} color={colors.fabIcon} weight="semibold" />
              </Pressable>
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
          <View style={styles.rowWrap}>
            <FoodSearchRow food={item} onPress={() => choose(item)} hideBrand thumb={false} position={section.data.length === 1 ? 'only' : index === 0 ? 'first' : index === section.data.length - 1 ? 'last' : 'middle'} />
          </View>
        )}
        renderSectionFooter={() => <View style={styles.gap} />}
        ListEmptyComponent={
          menu.length === 0 ? (
            <EmptyState icon="clock" title="Menu coming soon" message={`${chain} isn’t in our menu data yet. Search for the item by name, or snap a photo and the scanner will estimate it.`} />
          ) : (
            <EmptyState icon="search" title="Nothing on this menu matches" message="Try a shorter word, like “chicken” or “large”." />
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
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  titleBlock: { flex: 1, gap: 2 },
  builder: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.xl },
  builderText: { flex: 1, gap: 2 },
  sectionHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  rowWrap: { paddingHorizontal: Spacing.lg },
  gap: { height: Spacing.xs },
});
