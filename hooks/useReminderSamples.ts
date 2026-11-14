import { useCallback, useMemo, useState } from 'react';

import { momentFor } from '@/lib/reminders/messages';
import { createDealer } from '@/lib/reminders/plan';

/** Sample reminders, one at a time, in a fresh shuffle each time the screen opens. `next()` deals another. */
export function useReminderSamples(displayName: string | null) {
  const deal = useMemo(() => createDealer(displayName?.trim().split(/\s+/)[0] || null, Date.now()), [displayName]);
  const draw = useCallback(() => {
    const { title, body } = deal(momentFor(new Date().getHours()));
    return { title, body };
  }, [deal]);
  const [sample, setSample] = useState(draw);
  const next = useCallback(() => setSample(draw()), [draw]);
  return { sample, next };
}
