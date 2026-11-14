import type { WeightEntry } from '@/types';
import { addDays, parseDateKey, toDateKey } from '@/utils/date';

/**
 * Turns raw weigh-ins into something worth reading. The scale jumps around
 * by a kilo a day on water alone, so alongside each reading there is a
 * trend: a weighted average that leans on recent days and smooths the rest.
 */

export type WeightRange = '1W' | '1M' | '3M' | 'ALL';
export const WEIGHT_RANGES: readonly { value: WeightRange; label: string; days: number | null }[] = [
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: 'ALL', label: 'All', days: null },
];

/** How many days of history carry real weight in the trend. */
const TREND_DAYS = 7;

export interface WeightPoint {
  date: string;
  /** Whole days since the first point in the series; the chart's x value. */
  day: number;
  kg: number;
  trend: number;
}

function dayNumber(date: string): number {
  const parsed = parseDateKey(date);
  // Noon avoids a daylight-saving hour pushing a day over the line.
  return parsed ? Math.round(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12).getTime() / 86_400_000) : 0;
}

/** Every weigh-in with its trend value. Gaps are handled: a reading after a long break pulls the trend most of the way to it. */
export function withTrend(entries: readonly WeightEntry[]): WeightPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];
  const origin = dayNumber(sorted[0].date);
  let trend = sorted[0].kg;
  let previous = origin;
  return sorted.map((entry, index) => {
    const day = dayNumber(entry.date);
    if (index > 0) {
      const pull = 1 - Math.exp(-(day - previous) / TREND_DAYS);
      trend += pull * (entry.kg - trend);
    }
    previous = day;
    return { date: entry.date, day: day - origin, kg: entry.kg, trend };
  });
}

export interface WeightSummary {
  /** The points inside the chosen range, re-based so the first is day 0. */
  points: WeightPoint[];
  latest: WeightPoint | null;
  /** Change in the trend from the first point in range to the latest. Null with fewer than two points. */
  change: number | null;
  /** Trend change per week over the range. Null until the range spans at least three days. */
  perWeek: number | null;
  lowest: number | null;
  highest: number | null;
}

export function weightSummary(entries: readonly WeightEntry[], range: WeightRange, today: Date): WeightSummary {
  const all = withTrend(entries);
  const days = WEIGHT_RANGES.find((option) => option.value === range)?.days ?? null;
  const from = days === null ? null : toDateKey(addDays(today, -days));
  const inRange = from === null ? all : all.filter((point) => point.date > from);
  const base = inRange[0]?.day ?? 0;
  const points = inRange.map((point) => ({ ...point, day: point.day - base }));
  const latest = points[points.length - 1] ?? null;
  const first = points[0] ?? null;
  const span = latest && first ? latest.day - first.day : 0;
  const change = latest && first && points.length > 1 ? latest.trend - first.trend : null;
  return {
    points,
    latest,
    change,
    perWeek: change !== null && span >= 3 ? (change / span) * 7 : null,
    lowest: points.length ? Math.min(...points.map((point) => point.kg)) : null,
    highest: points.length ? Math.max(...points.map((point) => point.kg)) : null,
  };
}
