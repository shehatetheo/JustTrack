import { useReducedMotion } from 'react-native-reanimated';

/** One place to ask whether to move. Every primitive checks this, so "Reduce Motion" is honoured everywhere at once. */
export function useMotion(): { reduced: boolean } {
  return { reduced: useReducedMotion() };
}
