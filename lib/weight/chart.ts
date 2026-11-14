import type { WeightPoint } from '@/lib/weight/trend';

/** Lays a weight series out inside a box: where each point sits, the smooth trend line through them, and tidy axis values. */

export interface ChartBox {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartLayout {
  /** Raw readings. */
  dots: { x: number; y: number; point: WeightPoint }[];
  /** The trend line as an SVG path, and the same path closed down to the baseline for the fill. */
  line: string;
  area: string;
  /** Horizontal guides with the value each stands for, in the unit passed in. */
  ticks: { y: number; value: number }[];
  goalY: number | null;
  yOf: (value: number) => number;
}

/** A step that gives three to five round-number guides across `span`. */
export function niceStep(span: number): number {
  const rough = span / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

/**
 * `toUnit` converts kilograms to what the user reads (kg or lb), so the
 * guides fall on round numbers in their unit.
 */
export function layoutChart(points: readonly WeightPoint[], box: ChartBox, toUnit: (kg: number) => number, goalKg: number | null = null): ChartLayout | null {
  if (points.length === 0 || box.width <= box.left + box.right || box.height <= box.top + box.bottom) return null;
  const values = points.flatMap((point) => [toUnit(point.kg), toUnit(point.trend)]);
  if (goalKg !== null) values.push(toUnit(goalKg));
  let low = Math.min(...values);
  let high = Math.max(...values);
  // A flat line still needs some air above and below it.
  if (high - low < 2) {
    const middle = (high + low) / 2;
    low = middle - 1;
    high = middle + 1;
  }
  const step = niceStep(high - low);
  const bottomValue = Math.floor((low - step * 0.15) / step) * step;
  const topValue = Math.ceil((high + step * 0.15) / step) * step;

  const innerWidth = box.width - box.left - box.right;
  const innerHeight = box.height - box.top - box.bottom;
  const lastDay = Math.max(points[points.length - 1].day, 1);
  const xOf = (day: number) => (points.length === 1 ? box.left + innerWidth / 2 : box.left + (day / lastDay) * innerWidth);
  const yOf = (value: number) => box.top + (1 - (value - bottomValue) / (topValue - bottomValue)) * innerHeight;

  const dots = points.map((point) => ({ x: xOf(point.day), y: yOf(toUnit(point.kg)), point }));
  const trend = points.map((point) => ({ x: xOf(point.day), y: yOf(toUnit(point.trend)) }));
  const line = smoothPath(points.length === 1 ? [{ x: box.left, y: trend[0].y }, { x: box.width - box.right, y: trend[0].y }] : trend);
  const startX = points.length === 1 ? box.left : trend[0].x;
  const endX = points.length === 1 ? box.width - box.right : trend[trend.length - 1].x;
  const baseline = box.height - box.bottom;
  const area = `${line} L ${round(endX)} ${round(baseline)} L ${round(startX)} ${round(baseline)} Z`;

  const ticks: { y: number; value: number }[] = [];
  for (let value = bottomValue; value <= topValue + step / 1000; value += step) ticks.push({ y: yOf(value), value: Math.round(value * 100) / 100 });

  return { dots, line, area, ticks, goalY: goalKg === null ? null : yOf(toUnit(goalKg)), yOf };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** A curve through the points that never overshoots between them (each segment's control points share its ends' heights). */
export function smoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const bend = (to.x - from.x) / 2;
    path += ` C ${round(from.x + bend)} ${round(from.y)} ${round(to.x - bend)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`;
  }
  return path;
}
