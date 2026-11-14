import { layoutChart, niceStep, smoothPath } from '@/lib/weight/chart';
import { weightSummary, withTrend } from '@/lib/weight/trend';
import { parseWeights } from '@/lib/weight/weightStore';
import type { WeightEntry } from '@/types';

const today = new Date(2026, 10, 14, 9);
const entry = (date: string, kg: number): WeightEntry => ({ date, kg });

describe('parseWeights', () => {
  it('keeps real weigh-ins, one per day, oldest first', () => {
    expect(parseWeights([entry('2026-11-03', 80), entry('2026-11-01', 81), entry('2026-11-03', 79.5)])).toEqual([entry('2026-11-01', 81), entry('2026-11-03', 79.5)]);
  });

  it('drops impossible values and dates', () => {
    expect(parseWeights([entry('2026-13-40', 80), entry('2026-11-01', 3), entry('2026-11-02', 900), { date: 5, kg: 80 }, null])).toEqual([]);
    expect(parseWeights('nope')).toBeNull();
  });
});

describe('withTrend', () => {
  it('starts on the first reading and lags behind a jump', () => {
    const points = withTrend([entry('2026-11-01', 80), entry('2026-11-02', 82)]);
    expect(points[0]).toMatchObject({ day: 0, kg: 80, trend: 80 });
    expect(points[1].day).toBe(1);
    expect(points[1].trend).toBeGreaterThan(80);
    expect(points[1].trend).toBeLessThan(80.5);
  });

  it('follows a reading more closely after a long gap', () => {
    const soon = withTrend([entry('2026-11-01', 80), entry('2026-11-02', 76)])[1].trend;
    const later = withTrend([entry('2026-10-01', 80), entry('2026-11-02', 76)])[1].trend;
    expect(later).toBeLessThan(soon);
    expect(later).toBeCloseTo(76, 0);
  });

  it('settles on a steady weight', () => {
    const steady = withTrend(Array.from({ length: 30 }, (_, index) => entry(`2026-10-${String(index + 1).padStart(2, '0')}`, 75)));
    expect(steady[29].trend).toBeCloseTo(75, 5);
  });
});

describe('weightSummary', () => {
  const entries = [entry('2026-08-01', 90), entry('2026-10-20', 84), entry('2026-11-01', 83), entry('2026-11-08', 82), entry('2026-11-14', 81)];

  it('filters to the range and re-bases the days', () => {
    const month = weightSummary(entries, '1M', today);
    expect(month.points.map((point) => point.date)).toEqual(['2026-10-20', '2026-11-01', '2026-11-08', '2026-11-14']);
    expect(month.points[0].day).toBe(0);
    expect(month.points[3].day).toBe(25);
    expect(weightSummary(entries, '1W', today).points.map((point) => point.date)).toEqual(['2026-11-08', '2026-11-14']);
    expect(weightSummary(entries, 'ALL', today).points).toHaveLength(5);
  });

  it('reports the latest reading, the change in trend and a weekly rate', () => {
    const month = weightSummary(entries, '1M', today);
    expect(month.latest?.kg).toBe(81);
    expect(month.change).toBeLessThan(0);
    expect(month.perWeek).toBeLessThan(0);
    expect(month.perWeek).toBeCloseTo((month.change! / 25) * 7, 6);
    expect(month.lowest).toBe(81);
    expect(month.highest).toBe(84);
  });

  it('has no change with one reading and nothing at all with none', () => {
    expect(weightSummary([entry('2026-11-14', 81)], '1M', today)).toMatchObject({ change: null, perWeek: null, lowest: 81, highest: 81 });
    expect(weightSummary([], 'ALL', today)).toMatchObject({ points: [], latest: null, change: null, lowest: null });
  });
});

describe('chart layout', () => {
  const box = { width: 320, height: 200, top: 10, right: 40, bottom: 24, left: 10 };
  const same = (kg: number) => kg;

  it('picks round steps', () => {
    expect(niceStep(3)).toBe(1);
    expect(niceStep(7)).toBe(2);
    expect(niceStep(18)).toBe(5);
    expect(niceStep(40)).toBe(10);
    expect(niceStep(0.6)).toBeCloseTo(0.2);
  });

  it('keeps every point inside the plot and puts heavier readings higher', () => {
    const points = weightSummary([entry('2026-11-01', 84), entry('2026-11-07', 82), entry('2026-11-14', 80)], 'ALL', today).points;
    const layout = layoutChart(points, box, same)!;
    expect(layout.dots).toHaveLength(3);
    for (const dot of layout.dots) {
      expect(dot.x).toBeGreaterThanOrEqual(box.left);
      expect(dot.x).toBeLessThanOrEqual(box.width - box.right);
      expect(dot.y).toBeGreaterThanOrEqual(box.top);
      expect(dot.y).toBeLessThanOrEqual(box.height - box.bottom);
    }
    expect(layout.dots[0].x).toBe(box.left);
    expect(layout.dots[2].x).toBe(box.width - box.right);
    expect(layout.dots[0].y).toBeLessThan(layout.dots[2].y);
    expect(layout.ticks.length).toBeGreaterThanOrEqual(3);
    expect(layout.ticks.length).toBeLessThanOrEqual(7);
    expect(layout.line.startsWith('M ')).toBe(true);
    expect(layout.area.endsWith('Z')).toBe(true);
  });

  it('centres a single reading on a level line and widens a flat range', () => {
    const layout = layoutChart(weightSummary([entry('2026-11-14', 80)], 'ALL', today).points, box, same)!;
    expect(layout.dots[0].x).toBe(box.left + (box.width - box.left - box.right) / 2);
    expect(layout.ticks[layout.ticks.length - 1].value - layout.ticks[0].value).toBeGreaterThanOrEqual(2);
  });

  it('makes room for the goal line and converts units for the guides', () => {
    const points = weightSummary([entry('2026-11-01', 84), entry('2026-11-14', 82)], 'ALL', today).points;
    const layout = layoutChart(points, box, (kg) => kg * 2.20462, 75)!;
    expect(layout.goalY).toBeGreaterThan(layout.dots[1].y);
    expect(layout.goalY).toBeLessThanOrEqual(box.height - box.bottom);
    expect(layout.ticks.every((tick) => Number.isInteger(tick.value / 5))).toBe(true);
  });

  it('returns nothing without points or room', () => {
    expect(layoutChart([], box, same)).toBeNull();
    expect(layoutChart(weightSummary([entry('2026-11-14', 80)], 'ALL', today).points, { ...box, width: 20 }, same)).toBeNull();
    expect(smoothPath([])).toBe('');
  });
});
