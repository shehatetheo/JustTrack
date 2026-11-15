import type { LogEntry } from '@/types';

/** How far back "often" looks. */
const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Two entries are the same food if they share a name and a brand, whatever the amount. */
function foodKey(entry: LogEntry): string {
  return `${entry.foodName.trim().toLowerCase()}|${(entry.brand ?? '').trim().toLowerCase()}`;
}

/**
 * The foods logged most often in the last 30 days, each as its most recent
 * entry (so logging it again repeats the latest amount). Something logged
 * only once is not "often" and is left out. Ties go to the more recent.
 */
export function frequentEntries(entries: readonly LogEntry[], now: Date, limit = 6): LogEntry[] {
  const since = now.getTime() - WINDOW_DAYS * DAY_MS;
  const groups = new Map<string, { count: number; latest: LogEntry; at: number }>();
  for (const entry of entries) {
    const at = Date.parse(entry.loggedAt);
    if (!Number.isFinite(at) || at < since || at > now.getTime()) continue;
    const key = foodKey(entry);
    const group = groups.get(key);
    if (!group) groups.set(key, { count: 1, latest: entry, at });
    else {
      group.count += 1;
      if (at > group.at) {
        group.latest = entry;
        group.at = at;
      }
    }
  }
  return [...groups.values()]
    .filter((group) => group.count >= 2)
    .sort((a, b) => b.count - a.count || b.at - a.at)
    .slice(0, limit)
    .map((group) => group.latest);
}
