import React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { Glass } from './Glass';

interface CardProps extends ViewProps {
  padded?: boolean;
  /** Kept for callers; glass panels sit flat on the page, so this no longer draws a shadow. */
  elevated?: 'sm' | 'md' | 'lg' | 'none';
}

/** A glass panel with the standard inset. */
export function Card({ padded = true, style, children, elevated: _elevated, ...rest }: CardProps) {
  return (
    <Glass radius={Radii.xl} style={[padded && styles.padded, style]} {...rest}>
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  padded: { padding: Spacing.lg },
});
