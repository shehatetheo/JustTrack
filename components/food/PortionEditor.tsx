import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { StepperButton } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { PortionController } from '@/hooks/usePortion';

/** The serving picker, and an amount you can type or step. */
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
        <TextField label="Amount" value={portion.amountText} onChangeText={portion.setAmountText} keyboardType="decimal-pad" returnKeyType="done" maxLength={7} suffix={portion.amountSuffix} error={portion.error} selectTextOnFocus />
        <View style={styles.steppers}>
          <StepperButton direction="less" accessibilityLabel="Less" onPress={() => portion.step(-1)} />
          <StepperButton direction="more" accessibilityLabel="More" onPress={() => portion.step(1)} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  divider: { height: HAIRLINE },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  steppers: { flexDirection: 'row', gap: Spacing.sm, marginTop: 24 },
});
