/**
 * Small deterministic PRNG (mulberry32). Scene art uses it for scatter effects
 * like starfields and brick jitter, so a given seed always paints the same room.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] inclusive. */
export function randInt(next: () => number, min: number, max: number): number {
  return min + Math.floor(next() * (max - min + 1));
}
