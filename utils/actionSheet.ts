import type { AppIconName } from '@/constants/icons';
import { Haptic } from '@/constants/motion';

/**
 * Menus, pickers and questions. Nothing here draws anything: each call puts
 * a description of a sheet or a dialog into `sheetStore`, and the
 * ActionSheetHost mounted at the root draws it in the app's own style, the
 * same on every platform.
 */

export interface SheetOption {
  label: string;
  /** A second, quieter line. */
  caption?: string;
  icon?: AppIconName;
  destructive?: boolean;
  selected?: boolean;
  onPress: () => void;
}

export interface SheetState {
  kind: 'sheet';
  title?: string;
  /** One italic line under the title. */
  tagline?: string;
  options: SheetOption[];
}

export interface DialogState {
  kind: 'dialog';
  title: string;
  message?: string;
  confirmLabel: string;
  /** Left out for a notice that only needs acknowledging. */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export type OverlayState = SheetState | DialogState;

let current: OverlayState | null = null;
const listeners = new Set<() => void>();

function present(next: OverlayState | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

export const sheetStore = {
  getSnapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function dismissSheet(): void {
  present(null);
}

/** A sheet of things to do, each with an optional glyph and a second line. */
export function showSheet(sheet: Omit<SheetState, 'kind'>): void {
  present({ kind: 'sheet', ...sheet });
}

interface OptionSheetConfig<T extends string> {
  title: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Pick one value from a short list. */
export function showOptionSheet<T extends string>({ title, options, selected, onSelect }: OptionSheetConfig<T>) {
  showSheet({
    title,
    options: options.map((option) => ({
      label: option.label,
      selected: option.value === selected,
      onPress: () => {
        Haptic.select();
        onSelect(option.value);
      },
    })),
  });
}

export interface MenuAction {
  label: string;
  icon?: AppIconName;
  destructive?: boolean;
  onPress: () => void;
}

/** A menu of commands (e.g. a long-press menu). */
export function showActionMenu({ title, actions }: { title?: string; actions: readonly MenuAction[] }) {
  showSheet({ title, options: actions.map((action) => ({ label: action.label, icon: action.icon, destructive: action.destructive, onPress: action.onPress })) });
}

/** Asks before doing something that can't be undone. Resolves true to go ahead. */
export function confirmAsync({ title, message, confirmLabel }: { title: string; message?: string; confirmLabel: string }): Promise<boolean> {
  return new Promise((resolve) => {
    present({ kind: 'dialog', title, message, confirmLabel, cancelLabel: 'Cancel', onConfirm: () => resolve(true), onCancel: () => resolve(false) });
  });
}

/** Tells the user something and waits for them to acknowledge it. An optional action sits beside "OK". */
export function showNotice({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }): void {
  const noop = () => {};
  if (actionLabel && onAction) present({ kind: 'dialog', title, message, confirmLabel: actionLabel, cancelLabel: 'Not now', onConfirm: onAction, onCancel: noop });
  else present({ kind: 'dialog', title, message, confirmLabel: 'OK', onConfirm: noop, onCancel: noop });
}
