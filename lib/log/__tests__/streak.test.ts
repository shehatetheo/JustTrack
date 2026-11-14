import { daysSinceLastLog, streakSummary } from '@/lib/log/streak';

const today = new Date(2026, 10, 14, 15, 0);
const on = (daysAgo: number, hour = 12) => ({ loggedAt: new Date(2026, 10, 14 - daysAgo, hour, 0).toISOString() });

describe('streakSummary', () => {
  it('is zero with nothing logged', () => {
    expect(streakSummary([], today)).toMatchObject({ current: 0, best: 0, loggedToday: false, waiting: false, daysLogged: 0 });
  });

  it('counts consecutive days ending today', () => {
    expect(streakSummary([on(0), on(1), on(1, 19), on(2)], today)).toMatchObject({ current: 3, best: 3, loggedToday: true, waiting: false, daysLogged: 3 });
  });

  it('keeps yesterday’s streak alive until today is logged', () => {
    expect(streakSummary([on(1), on(2), on(3)], today)).toMatchObject({ current: 3, loggedToday: false, waiting: true });
  });

  it('resets after a missed day but remembers the best run', () => {
    const summary = streakSummary([on(0), on(3), on(4), on(5), on(6), on(9)], today);
    expect(summary).toMatchObject({ current: 1, best: 4, daysLogged: 6 });
  });

  it('is broken when both today and yesterday are empty', () => {
    expect(streakSummary([on(2), on(3)], today)).toMatchObject({ current: 0, best: 2, waiting: false });
  });

  it('reports the last seven days, oldest first', () => {
    const { week } = streakSummary([on(0), on(2), on(6), on(7)], today);
    expect(week.map((day) => day.logged)).toEqual([true, false, false, false, true, false, true]);
    expect(week[6].date.getDate()).toBe(14);
    expect(week[0].date.getDate()).toBe(8);
  });

  it('counts a run across a month boundary and ignores bad dates', () => {
    const entries = [{ loggedAt: new Date(2026, 9, 30, 9).toISOString() }, { loggedAt: new Date(2026, 9, 31, 9).toISOString() }, { loggedAt: new Date(2026, 10, 1, 9).toISOString() }, { loggedAt: 'nonsense' }];
    expect(streakSummary(entries, today).best).toBe(3);
  });
});

describe('daysSinceLastLog', () => {
  it('is null when nothing was ever logged', () => {
    expect(daysSinceLastLog([], today)).toBeNull();
  });

  it('counts calendar days, not 24-hour periods', () => {
    expect(daysSinceLastLog([on(0, 1)], today)).toBe(0);
    expect(daysSinceLastLog([on(1, 23)], today)).toBe(1);
    expect(daysSinceLastLog([on(9), on(4)], today)).toBe(4);
  });
});

describe('lapseDays', () => {
  const { lapseDays } = jest.requireActual('@/lib/log/streak') as typeof import('@/lib/log/streak');
  const iso = (daysAgo: number) => new Date(2026, 10, 14 - daysAgo, 12).toISOString();

  it('stays quiet for an active user and for someone who never finished onboarding', () => {
    expect(lapseDays({ entries: [on(0)], welcomedAt: iso(30), welcomeBackAt: null, now: today })).toBeNull();
    expect(lapseDays({ entries: [on(2)], welcomedAt: iso(30), welcomeBackAt: null, now: today })).toBeNull();
    expect(lapseDays({ entries: [], welcomedAt: null, welcomeBackAt: null, now: today })).toBeNull();
  });

  it('speaks up after three days without a log', () => {
    expect(lapseDays({ entries: [on(3), on(8)], welcomedAt: iso(30), welcomeBackAt: null, now: today })).toBe(3);
    expect(lapseDays({ entries: [on(12)], welcomedAt: null, welcomeBackAt: null, now: today })).toBe(12);
  });

  it('counts from onboarding for someone who has never logged', () => {
    expect(lapseDays({ entries: [], welcomedAt: iso(1), welcomeBackAt: null, now: today })).toBeNull();
    expect(lapseDays({ entries: [], welcomedAt: iso(5), welcomeBackAt: null, now: today })).toBe(5);
  });

  it('shows once per lapse, then again only after another week away', () => {
    expect(lapseDays({ entries: [on(10)], welcomedAt: null, welcomeBackAt: iso(2), now: today })).toBeNull();
    expect(lapseDays({ entries: [on(10)], welcomedAt: null, welcomeBackAt: iso(7), now: today })).toBe(10);
  });

  it('shows again for a new lapse after the user came back and logged', () => {
    expect(lapseDays({ entries: [on(4)], welcomedAt: null, welcomeBackAt: iso(20), now: today })).toBe(4);
  });
});
