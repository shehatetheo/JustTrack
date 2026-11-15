import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Gloss, HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { addDays, isSameDay, startOfWeek } from '@/utils/date';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface WeekStripProps {
  today: Date;
  selected: Date;
  onSelect: (day: Date) => void;
}

/** This week as a row of dark pills, Monday to Sunday. The picked day is a capsule of lavender glass; days still to come are quiet. */
export function WeekStrip({ today, selected, onSelect }: WeekStripProps) {
  const { colors } = useAppTheme();
  const monday = startOfWeek(selected);

  return (
    <View style={styles.row}>
      {DAYS.map((name, index) => {
        const date = addDays(monday, index);
        const isSelected = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const future = date > today;
        const ink = isSelected ? colors.onAccent : colors.onHero;
        return (
          <PressScale
            key={date.toISOString()}
            disabled={future}
            haptic={isSelected ? null : 'select'}
            onPress={() => onSelect(date)}
            accessibilityRole="button"
            accessibilityLabel={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            accessibilityState={{ selected: isSelected, disabled: future }}
            style={[styles.day, { backgroundColor: colors.photoPlate, borderColor: isSelected ? colors.accent : colors.border, opacity: future ? 0.4 : 1 }]}
          >
            {isSelected ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
                <LinearGradient colors={Gloss.capsule} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={Gloss.highlight} style={styles.gloss} />
              </View>
            ) : null}
            <ThemedText variant="caption2" style={{ color: ink, opacity: isSelected ? 0.75 : 0.6 }}>
              {name}
            </ThemedText>
            <ThemedText variant="subheadEmphasized" style={[styles.number, { color: ink }]}>
              {date.getDate()}
            </ThemedText>
            <View style={[styles.dot, { backgroundColor: isToday ? ink : 'transparent' }]} />
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xs + 2, marginTop: Spacing.lg },
  day: { flex: 1, minHeight: MIN_TAP + 12, paddingVertical: Spacing.sm, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center', gap: 1 },
  clip: { borderRadius: Radii.full, overflow: 'hidden' },
  gloss: { position: 'absolute', top: 1, left: 3, right: 3, height: '42%', borderRadius: Radii.full },
  number: { fontVariant: ['tabular-nums'] },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});
