import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Stagger } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/Sheet';
import { Stamp } from '@/components/ui/Stamp';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { EGGS } from '@/lib/easterEggs/eggs';

interface SecretsSheetProps {
  visible: boolean;
  found: readonly string[];
  onClose: () => void;
}

const SIZE = 64;

/** The collection: a stamp for each hidden detail found so far, and an empty ring for each one still out there. No hints. */
export function SecretsSheet({ visible, found, onClose }: SecretsSheetProps) {
  const { colors } = useAppTheme();
  const count = EGGS.filter((egg) => found.includes(egg.id)).length;

  return (
    <BottomSheet visible={visible} inline onClose={onClose} title="Secrets" tagline={`${count} of ${EGGS.length} found`}>
      <View style={styles.grid}>
        {EGGS.map((egg, index) => {
          const has = found.includes(egg.id);
          return (
            <Stagger key={egg.id} index={index} style={styles.cell}>
              {has ? (
                <Stamp label={egg.mark} size={SIZE} accent seed={index + 2} tilt={index % 2 ? 7 : -8} accessibilityLabel={`Found: ${egg.name}. ${egg.found}`} />
              ) : (
                <View accessible accessibilityRole="image" accessibilityLabel="A secret not found yet">
                  <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
                    <Circle cx={50} cy={50} r={44} stroke={colors.border} strokeWidth={2} strokeDasharray="6 7" fill="none" />
                  </Svg>
                </View>
              )}
            </Stagger>
          );
        })}
      </View>
      <ThemedText variant="footnote" color="secondary" style={styles.center}>
        {count === EGGS.length ? 'That’s all of them. Nicely done.' : 'Small things hidden around the app. None of them is needed for anything.'}
      </ThemedText>
      <Button label="Close" variant="quiet" size="md" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  cell: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
