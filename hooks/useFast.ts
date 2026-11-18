import { useMemo, useSyncExternalStore } from 'react';

import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/hooks/useSettings';
import { activeFast, fastConflict, fastProgress, type FastProgress } from '@/lib/fast/plan';
import { logStore } from '@/lib/log/logStore';
import type { FastPlan } from '@/types';

interface Fast {
  /** The saved plan, whether it has started, is running, or is over. */
  plan: FastPlan | null;
  /** The plan, only while it is in force today. */
  active: FastPlan | null;
  progress: FastProgress | null;
  /** What a food's name runs into while the fast is in force ("meat"), or null. */
  conflict: (foodName: string, brand?: string | null) => string | null;
}

/** The fast, if there is one: where it stands today, and a check for whether a food looks like something being given up. */
export function useFast(): Fast {
  const { fast: plan } = useSettings();
  const { today } = useCurrentTime();
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);

  return useMemo(() => {
    const active = activeFast(plan, today);
    return {
      plan,
      active,
      progress: plan ? fastProgress(plan, entries, today) : null,
      conflict: (foodName, brand) => (active ? fastConflict(active, foodName, brand) : null),
    };
  }, [entries, plan, today]);
}

/** Just the check, for rows in long lists: no progress is worked out. */
export function useFastConflict(): (foodName: string, brand?: string | null) => string | null {
  const { fast: plan } = useSettings();
  const { today } = useCurrentTime();
  return useMemo(() => {
    const active = activeFast(plan, today);
    return (foodName, brand) => (active ? fastConflict(active, foodName, brand) : null);
  }, [plan, today]);
}
