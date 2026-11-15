/**
 * A letter for the day, in the manner of a game's style rank. It rewards
 * two things only: a balanced split of protein, carbs and fat, and showing
 * up to log. It never looks at how many calories were eaten or how far
 * under a goal someone is.
 */
export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';

export const RANKS: readonly Rank[] = ['S', 'A', 'B', 'C', 'D'];

/** Days logged in a row needed, on top of a 90+ balance, for the top rank. */
export const S_RANK_STREAK = 7;

/** Null until there is a balance score to rank (not enough logged yet). */
export function rankFor(balanceScore: number | null, streakDays: number): Rank | null {
  if (balanceScore === null) return null;
  if (balanceScore >= 90 && streakDays >= S_RANK_STREAK) return 'S';
  if (balanceScore >= 80) return 'A';
  if (balanceScore >= 65) return 'B';
  if (balanceScore >= 50) return 'C';
  return 'D';
}

/** What the rank is saying, in a few calm words. Never a judgement about amount. */
export function rankLine(rank: Rank, balanceScore: number, streakDays: number): string {
  switch (rank) {
    case 'S':
      return 'balanced, and a week of showing up';
    case 'A':
      return balanceScore >= 90 ? `balanced. log ${S_RANK_STREAK - streakDays} more ${S_RANK_STREAK - streakDays === 1 ? 'day' : 'days'} in a row for S` : 'a well-balanced day';
    case 'B':
      return 'close to balanced';
    case 'C':
      return 'one macro is carrying the day';
    default:
      return 'lopsided today; tomorrow is a clean page';
  }
}
