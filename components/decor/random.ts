/** A small repeatable random source: the same seed always draws the same scribble, splatter or barcode. */
export function seeded(seed: number): () => number {
  let state = (Math.imul(seed | 0, 2654435761) >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export const round = (value: number): number => Math.round(value * 10) / 10;
