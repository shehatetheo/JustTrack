/**
 * A short message that rises above the tab bar and leaves by itself, with
 * room for one action ("undo"). The ToastHost at the root draws it.
 */

export interface ToastState {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

let current: ToastState | null = null;
let counter = 0;
const listeners = new Set<() => void>();

function set(next: ToastState | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

export const toastStore = {
  getSnapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function showToast(toast: Omit<ToastState, 'id'>): void {
  counter += 1;
  set({ id: counter, ...toast });
}

export function dismissToast(id?: number): void {
  if (id === undefined || current?.id === id) set(null);
}
