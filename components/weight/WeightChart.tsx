import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { layoutChart } from '@/lib/weight/chart';
import type { WeightPoint } from '@/lib/weight/trend';
import type { WeightUnit } from '@/types';
import { parseDateKey } from '@/utils/date';
import { kgToLb } from '@/utils/units';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WeightChartProps {
  points: readonly WeightPoint[];
  unit: WeightUnit;
  goalKg?: number | null;
  height?: number;
  /** A small version for a card: just the line, no guides, no touch. */
  compact?: boolean;
}

function shortDate(key: string): string {
  return parseDateKey(key)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? key;
}

/**
 * Weight over time: each weigh-in as a quiet dot, and through them the trend
 * line, which is the thing to watch. The line draws itself in from the left.
 * Drag a finger across the full-size chart to read any day.
 */
export function WeightChart({ points, unit, goalKg = null, height = 220, compact = false }: WeightChartProps) {
  const { colors, isDark } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const toUnit = (kg: number) => (unit === 'kg' ? kg : kgToLb(kg));
  const box = compact ? { width, height, top: 6, right: 6, bottom: 6, left: 6 } : { width, height, top: 16, right: 44, bottom: 28, left: 10 };
  const layout = width > 0 ? layoutChart(points, box, toUnit, compact ? null : goalKg) : null;
  const line = isDark ? '#FFFFFF' : colors.text;

  // Long enough to cover any line this chart can draw; the dash slides off to reveal it.
  const reach = Math.max(width * 3, 600);
  const drawn = useSharedValue(0);
  const signature = `${points.length}:${points[0]?.date ?? ''}:${points[points.length - 1]?.date ?? ''}:${width > 0}`;
  useEffect(() => {
    drawn.set(0);
    drawn.set(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [drawn, signature]);
  const stroke = useAnimatedProps(() => ({ strokeDashoffset: reach * (1 - drawn.get()) }));
  const fill = useAnimatedProps(() => ({ opacity: drawn.get() }));

  const pick = (x: number) => {
    if (!layout || layout.dots.length === 0) return;
    let nearest = 0;
    layout.dots.forEach((dot, index) => {
      if (Math.abs(dot.x - x) < Math.abs(layout.dots[nearest].x - x)) nearest = index;
    });
    setActive(nearest);
  };

  const shown = layout && active !== null ? layout.dots[Math.min(active, layout.dots.length - 1)] : null;
  const last = layout ? layout.dots[layout.dots.length - 1] : null;
  const marker = shown ?? last;
  const fillId = compact ? 'weight-fill-compact' : 'weight-fill';

  return (
    <View
      style={{ height }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !compact}
      onMoveShouldSetResponder={() => !compact}
      onResponderGrant={(event) => pick(event.nativeEvent.locationX)}
      onResponderMove={(event) => pick(event.nativeEvent.locationX)}
      onResponderRelease={() => setActive(null)}
      onResponderTerminate={() => setActive(null)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={points.length ? `Weight chart, ${points.length} weigh-ins from ${shortDate(points[0].date)} to ${shortDate(points[points.length - 1].date)}` : 'Weight chart, no weigh-ins yet'}
    >
      {layout ? (
        <>
          <Svg width={width} height={height} pointerEvents="none">
            <Defs>
              <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={isDark ? 0.42 : 0.26} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {compact ? null : layout.ticks.map((tick) => <Line key={tick.value} x1={box.left} x2={width - box.right} y1={tick.y} y2={tick.y} stroke={colors.border} strokeWidth={1} />)}
            {layout.goalY !== null ? <Line x1={box.left} x2={width - box.right} y1={layout.goalY} y2={layout.goalY} stroke={colors.success} strokeWidth={1.5} strokeDasharray="5 5" /> : null}
            <AnimatedPath d={layout.area} fill={`url(#${fillId})`} animatedProps={fill} />
            <AnimatedPath d={layout.line} stroke={colors.accent} strokeOpacity={0.35} strokeWidth={compact ? 5 : 7} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={`${reach} ${reach}`} animatedProps={stroke} />
            <AnimatedPath d={layout.line} stroke={line} strokeWidth={compact ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={`${reach} ${reach}`} animatedProps={stroke} />
            {compact ? null : layout.dots.map((dot) => <Circle key={dot.point.date} cx={dot.x} cy={dot.y} r={2.5} fill={colors.textTertiary} />)}
            {shown ? <Line x1={shown.x} x2={shown.x} y1={box.top} y2={height - box.bottom} stroke={colors.textSecondary} strokeWidth={1} /> : null}
            {marker ? (
              <>
                <Circle cx={marker.x} cy={layout.yOf(toUnit(marker.point.trend))} r={compact ? 4 : 6} fill={colors.accent} fillOpacity={0.35} />
                <Circle cx={marker.x} cy={layout.yOf(toUnit(marker.point.trend))} r={compact ? 2.5 : 3.5} fill={line} />
              </>
            ) : null}
          </Svg>

          {/* Labels sit in a layer that ignores touches, so a drag always reports its position against the chart itself. */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {compact
              ? null
              : layout.ticks.map((tick) => (
                  <ThemedText key={tick.value} variant="caption2" color="tertiary" style={[styles.tick, { top: tick.y - 7, width: box.right - 8 }]}>
                    {tick.value}
                  </ThemedText>
                ))}
            {!compact && layout.goalY !== null ? (
              <ThemedText variant="caption2" style={[styles.goal, { top: layout.goalY - 16, left: box.left + 2, color: colors.success }]}>
                GOAL
              </ThemedText>
            ) : null}
            {!compact && points.length > 0 ? (
              <View style={[styles.dates, { left: box.left, right: box.right }]}>
                <ThemedText variant="caption2" color="tertiary">
                  {shortDate(points[0].date)}
                </ThemedText>
                {points.length > 1 ? (
                  <ThemedText variant="caption2" color="tertiary">
                    {shortDate(points[points.length - 1].date)}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
            {shown ? (
              <View style={[styles.bubble, { backgroundColor: colors.text, left: Math.min(Math.max(shown.x - 54, 0), Math.max(width - 108, 0)) }]}>
                <ThemedText variant="caption2" style={{ color: colors.textInverse, opacity: 0.7 }}>
                  {shortDate(shown.point.date)}
                </ThemedText>
                <ThemedText variant="subheadEmphasized" style={[styles.tabular, { color: colors.textInverse }]}>
                  {toUnit(shown.point.kg).toFixed(1)} {unit}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', right: 0, textAlign: 'right', fontVariant: ['tabular-nums'] },
  goal: { position: 'absolute', fontWeight: '700', letterSpacing: 1 },
  dates: { position: 'absolute', bottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
  bubble: { position: 'absolute', top: 0, width: 108, alignItems: 'center', paddingVertical: Spacing.xs, borderRadius: 8 },
  tabular: { fontVariant: ['tabular-nums'] },
});
