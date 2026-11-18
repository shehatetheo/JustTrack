import { useMemo, useSyncExternalStore } from 'react';

import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/hooks/useSettings';
import { activeFast, fastConflict, fastProgress, type FastProgress } from '@/lib/fast/plan';
import { logStore } from '@/lib/log/logStore';
import type { FastPlan, MealType } from '@/types';

type FastCheck = (foodName: string, brand?: string | null, mealType?: MealType | null) => string | null;

interface Fast {
  /** The saved plan, whether it has started, is running, or is over. */
  plan: FastPlan | null;
  /** The plan, only while it is in force today. */
  active: FastPlan | null;
  progress: FastProgress | null;
  /** What a food runs into while the fast is in force ("soda"), or null. Give the meal when it is known. */
  conflict: FastCheck;
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
      conflict: (foodName, brand, mealType) => (active ? fastConflict(active, foodName, brand, mealType) : null),
    };
  }, [entries, plan, today]);
}

/** Just the check, for rows in long lists: no progress is worked out. */
export function useFastConflict(): FastCheck {
  const { fast: plan } = useSettings();
  const { today } = useCurrentTime();
  return useMemo(() => {
    const active = activeFast(plan, today);
    return (foodName, brand, mealType) => (active ? fastConflict(active, foodName, brand, mealType) : null);
  }, [plan, today]);
}
