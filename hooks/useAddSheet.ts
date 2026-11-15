import { useRouter } from 'expo-router';

import { MEAL_TYPE_META } from '@/constants/nutrition';
import type { MealType } from '@/types';
import { showSheet } from '@/utils/actionSheet';

const BUILDERS = [
  { key: 'chipotle', label: 'Chipotle', caption: 'bowl, burrito, tacos or salad' },
  { key: 'subway', label: 'Subway', caption: 'six-inch or footlong' },
  { key: 'panda', label: 'Panda Express', caption: 'bowl, plate or bigger plate' },
  { key: 'jerseymikes', label: 'Jersey Mike’s', caption: 'mini, regular or giant' },
] as const;

/**
 * The sheet behind every "+ add": the five ways to log food, with the meal
 * it will go to carried along where the next screen can use it.
 */
export function useAddSheet() {
  const router = useRouter();

  return (mealType?: MealType) => {
    const params = mealType ? { mealType } : {};
    const build = () =>
      showSheet({
        title: 'Build an order',
        tagline: 'picked the way you’d order it',
        options: BUILDERS.map((builder) => ({ label: builder.label, caption: builder.caption, onPress: () => router.push({ pathname: '/food/build', params: { builder: builder.key, ...params } }) })),
      });

    showSheet({
      title: mealType ? `Add to ${MEAL_TYPE_META[mealType].label}` : 'Add food',
      tagline: 'how do you want to log it?',
      options: [
        { label: 'Scan a meal', caption: 'photograph the plate', icon: 'camera', onPress: () => router.navigate('/scan') },
        { label: 'Search', caption: 'foods, brands and restaurants', icon: 'search', onPress: () => router.push({ pathname: '/food/search', params }) },
        { label: 'Scan a barcode', caption: 'anything in a packet', icon: 'barcode', onPress: () => router.push('/scan/barcode') },
        { label: 'Describe it', caption: 'type what you ate', icon: 'pencil', onPress: () => router.push('/scan/describe') },
        { label: 'Build an order', caption: 'chipotle, subway, panda express, jersey mike’s', icon: 'lunch', onPress: build },
      ],
    });
  };
}
