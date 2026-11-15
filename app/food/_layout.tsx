import { Stack } from 'expo-router';
import React from 'react';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { Duration } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

/** The add-food sheet: search, a chain's menu, the order builder, and the food itself. Every screen draws its own header. */
export default function FoodFlowLayout() {
  const { colors } = useAppTheme();

  return (
    <SheetFrame>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: Duration.standard, contentStyle: { backgroundColor: colors.background } }} />
    </SheetFrame>
  );
}
