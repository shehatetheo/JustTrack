import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { archPaths, FILIGREE_PATHS } from '@/components/decor';
import { DrawStroke, useDraw } from '@/components/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

interface OrnateFrameProps {
  /**
   * corners: wrought-iron filigree in each corner, for badges, the viewfinder and sheets.
   * arch: a pointed cathedral arch over the top, for the hero.
   * top: filigree in the two top corners only, for the head of a sheet.
   */
  variant?: 'corners' | 'arch' | 'top';
  /** Size of each corner ornament. */
  corner?: number;
  color?: string;
  /** Draw the linework on when it first appears. */
  draw?: boolean;
  /** Redraw when this changes. */
  replay?: unknown;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/** One filigree corner, drawn stroke by stroke, turned to face its corner. */
function Corner({ size, color, rotate, progress }: { size: number; color: string; rotate: number; progress: ReturnType<typeof useDraw> }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: [{ rotate: `${rotate}deg` }] }} {...hidden}>
      {FILIGREE_PATHS.map((d, index) =>
        d.endsWith('Z') ? <Path key={index} d={d} fill={color} /> : <DrawStroke key={index} d={d} length={150} progress={progress} stroke={color} strokeWidth={1.25} />
      )}
    </Svg>
  );
}

/**
 * Ornate linework around whatever it wraps. The frame itself never takes
 * touches or adds padding: it is drawn over the edges of its children.
 */
export function OrnateFrame({ variant = 'corners', corner = 44, color, draw = true, replay, style, children }: OrnateFrameProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.borderAccent;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useDraw({ duration: draw ? 620 : 0, replay });
  const arch = variant === 'arch' && size.width > 0 ? archPaths(size.width, size.height) : null;

  return (
    <View style={style} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      {children}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {arch ? (
          <Svg width={size.width} height={size.height} {...hidden}>
            <DrawStroke d={arch.outer} length={arch.length} progress={progress} stroke={ink} strokeWidth={1.25} />
            <DrawStroke d={arch.inner} length={arch.length} progress={progress} stroke={ink} strokeWidth={0.75} strokeOpacity={0.6} />
            <Path d={arch.finial} fill={ink} />
            <Circle cx={size.width / 2} cy={34} r={5} stroke={ink} strokeWidth={1} fill="none" />
          </Svg>
        ) : null}
        {variant !== 'arch' ? (
          <>
            <View style={styles.topLeft}>
              <Corner size={corner} color={ink} rotate={0} progress={progress} />
            </View>
            <View style={styles.topRight}>
              <Corner size={corner} color={ink} rotate={90} progress={progress} />
            </View>
            {variant === 'corners' ? (
              <>
                <View style={styles.bottomRight}>
                  <Corner size={corner} color={ink} rotate={180} progress={progress} />
                </View>
                <View style={styles.bottomLeft}>
                  <Corner size={corner} color={ink} rotate={270} progress={progress} />
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topLeft: { position: 'absolute', top: 0, left: 0 },
  topRight: { position: 'absolute', top: 0, right: 0 },
  bottomRight: { position: 'absolute', bottom: 0, right: 0 },
  bottomLeft: { position: 'absolute', bottom: 0, left: 0 },
});
