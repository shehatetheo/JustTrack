import { useSyncExternalStore } from 'react';

import { weightStore } from '@/lib/weight/weightStore';
import type { WeightEntry } from '@/types';

/** Every weigh-in on this device, oldest first. */
export function useWeights(): WeightEntry[] {
  return useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot);
}
