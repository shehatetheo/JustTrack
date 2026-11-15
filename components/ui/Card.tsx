import React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { Glass } from './Glass';

interface CardProps extends ViewProps {
  padded?: boolean;
  /** Lavender edge, for the one card that should stand out. */
  lit?: boolean;
}

/** A glass panel with the standard inset. */
export function Card({ padded = true, lit = false, style, children, ...rest }: CardProps) {
  return (
    <Glass radius={Radii.lg} lit={lit} style={[padded && styles.padded, style]} {...rest}>
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  padded: { padding: Spacing.lg },
});
