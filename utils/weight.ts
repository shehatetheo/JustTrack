import type { WeightUnit } from '@/types';
import { kgToLb, lbToKg } from '@/utils/units';

/** Kilograms as the number the user reads, to one decimal. */
export function weightValue(kg: number, unit: WeightUnit): string {
  return (unit === 'kg' ? kg : kgToLb(kg)).toFixed(1);
}

/** A typed number in the user's unit, as kilograms. NaN when it isn't a number. */
export function weightFromInput(text: string, unit: WeightUnit): number {
  const value = Number.parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(value)) return Number.NaN;
  return unit === 'kg' ? value : lbToKg(value);
}

/** A change in weight with its sign: "−1.4 lb", "+0.3 kg", "0.0 lb". */
export function weightDelta(kg: number, unit: WeightUnit): string {
  const value = unit === 'kg' ? kg : kgToLb(kg);
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${sign}${Math.abs(rounded).toFixed(1)} ${unit}`;
}
