import { rankFor, rankLine } from '@/lib/nutrition/rank';

describe('rankFor', () => {
  it('has no rank until there is a balance score', () => {
    expect(rankFor(null, 30)).toBeNull();
  });

  it('ranks on balance', () => {
    expect([100, 85, 80, 79, 65, 64, 50, 49, 0].map((score) => rankFor(score, 0))).toEqual(['A', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D']);
  });

  it('needs both a 90+ balance and a week-long streak for S', () => {
    expect(rankFor(95, 6)).toBe('A');
    expect(rankFor(95, 7)).toBe('S');
    expect(rankFor(89, 30)).toBe('A');
  });

  it('never rises on a streak alone', () => {
    expect(rankFor(40, 100)).toBe('D');
  });
});

describe('rankLine', () => {
  it('says what is left for S when balance is already there', () => {
    expect(rankLine('A', 93, 5)).toBe('balanced. log 2 more days in a row for S');
    expect(rankLine('A', 93, 6)).toBe('balanced. log 1 more day in a row for S');
    expect(rankLine('A', 82, 0)).toBe('a well-balanced day');
  });

  it('never mentions calories, eating less or weight', () => {
    for (const [rank, score, streak] of [['S', 95, 9], ['A', 85, 0], ['B', 70, 0], ['C', 55, 0], ['D', 10, 0]] as const) {
      expect(rankLine(rank, score, streak)).not.toMatch(/calor|less|weight|over|under|too much/i);
    }
  });
});
