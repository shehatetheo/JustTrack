import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { TextField } from '@/components/ui/TextField';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { PortionController } from '@/hooks/usePortion';

function StepButton({ icon, label, onPress }: { icon: AppIconName; label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.step, { backgroundColor: colors.surfaceRaised, opacity: pressed ? 0.6 : 1 }]}
    >
      <AppIcon name={icon} size={18} color={colors.text} weight="semibold" />
    </Pressable>
  );
}

/** "Serving" picker plus an amount field with − / + steppers. */
export function PortionEditor({ portion }: { portion: PortionController }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card}>
      {portion.options.length > 1 ? (
        <>
          <OptionPicker label="Serving" options={portion.options} value={portion.selectedKey} onChange={portion.selectChoice} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </>
      ) : null}
      <View style={styles.amountRow}>
        <TextField
          label="Amount"
          value={portion.amountText}
          onChangeText={portion.setAmountText}
          keyboardType="decimal-pad"
          returnKeyType="done"
          maxLength={7}
          suffix={portion.amountSuffix}
          error={portion.error}
          selectTextOnFocus
        />
        <View style={styles.steppers}>
          <StepButton icon="minus" label="Less" onPress={() => portion.step(-1)} />
          <StepButton icon="plus" label="More" onPress={() => portion.step(1)} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  divider: { height: StyleSheet.hairlineWidth },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  steppers: { flexDirection: 'row', gap: Spacing.sm, marginTop: 22 },
  step: { width: 52, height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
});
