import { useRouter } from 'expo-router';

import { Haptic } from '@/constants/motion';
import { MEAL_TYPE_META, MEAL_TYPES } from '@/constants/nutrition';
import { createEntry } from '@/lib/log/entries';
import { addEntries, removeEntry, updateEntry } from '@/lib/log/logStore';
import type { LogEntry, MealType } from '@/types';
import { showActionMenu, showOptionSheet } from '@/utils/actionSheet';
import { showToast } from '@/utils/toast';

/** Takes an entry out of the log and offers to put it back. */
export function removeWithUndo(entry: LogEntry): void {
  removeEntry(entry.id);
  showToast({ message: `${entry.foodName} removed`, actionLabel: 'Undo', onAction: () => addEntries([entry]) });
}

/** What you can do to a logged entry from a list: open, log it again, move it, delete it. */
export function useEntryActions() {
  const router = useRouter();

  const open = (entry: LogEntry) => router.push({ pathname: '/entry/[id]', params: { id: entry.id } });

  const duplicate = (entry: LogEntry) => {
    const { id: _id, loggedAt: _loggedAt, ...rest } = entry;
    addEntries([createEntry(rest, new Date())]);
    Haptic.log();
  };

  const remove = (entry: LogEntry) => {
    Haptic.tap();
    removeWithUndo(entry);
  };

  const move = (entry: LogEntry, mealType: MealType) => {
    if (mealType !== entry.mealType) updateEntry(entry.id, (current) => ({ ...current, mealType }));
  };

  const chooseMeal = (entry: LogEntry) => {
    showOptionSheet({
      title: 'Move to',
      options: MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_META[value].label })),
      selected: entry.mealType,
      onSelect: (mealType) => move(entry, mealType),
    });
  };

  /** The long-press menu. `onDelete` lets the list play its own leaving animation before the entry goes. */
  const more = (entry: LogEntry, onDelete: (entry: LogEntry) => void = remove) => {
    Haptic.tap();
    showActionMenu({
      title: entry.foodName,
      actions: [
        { label: 'Edit', icon: 'pencil', onPress: () => open(entry) },
        { label: 'Log again', icon: 'duplicate', onPress: () => duplicate(entry) },
        { label: 'Move to…', icon: 'clock', onPress: () => chooseMeal(entry) },
        { label: 'Delete', icon: 'trash', destructive: true, onPress: () => onDelete(entry) },
      ],
    });
  };

  return { open, duplicate, remove, move, chooseMeal, more };
}
