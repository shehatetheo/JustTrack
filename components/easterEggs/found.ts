import { Haptic } from '@/constants/motion';
import { findEgg, type EggId } from '@/lib/easterEggs/eggs';
import { showToast } from '@/utils/toast';

/** Marks an egg as found and, the first time only, says so in a toast. Returns whether it was new. */
export function discover(id: EggId): boolean {
  const egg = findEgg(id);
  if (!egg) return false;
  Haptic.success();
  showToast({ message: `secret found · ${egg.name}` });
  return true;
}
