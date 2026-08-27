/**
 * The game's palette, built as hue ramps rather than a flat table.
 *
 * The original sixteen EGA entries could not shade themselves: six of them had
 * nothing between the colour and black, so art drawn with them came out as flat
 * fills with hard outlines and no sense of form. Here every hue owns a run of
 * consecutive indices from shadow to highlight, which is what makes `darker`,
 * `lighter` and `shade` meaningful and lets the scene code model light.
 *
 * Ramps are hue-shifted the way pixel artists build them: shadows cool towards
 * blue and purple, highlights warm towards yellow. A ramp is never a single hue
 * at varying brightness, because that reads as plastic.
 */

/** A named run of consecutive palette indices, darkest first. */
export interface Ramp {
  readonly name: string;
  readonly base: number;
  readonly length: number;
}

/**
 * Ramp definitions in index order. Index 0 is pure black and stands outside
 * every ramp: scene code treats it as "nothing painted here", and `glow`
 * defaults to lighting only those pixels.
 */
const RAMPS: readonly (readonly [string, readonly string[]])[] = [
  ['void', ['#000000']],

  // Neutrals. Cool in shadow, faintly warm at the top so white surfaces read as
  // lit rather than as holes in the picture.
  [
    'neutral',
    [
      '#0b0c12',
      '#191b26',
      '#2a2d3b',
      '#3f4354',
      '#585d71',
      '#767d92',
      '#9aa1b4',
      '#c3c9d8',
      '#eef1f8',
    ],
  ],

  ['blue', ['#101a3a', '#1b2c5e', '#28468f', '#3f6cc4', '#6f9ceb', '#a8c6f7']],
  ['cyan', ['#0a2c36', '#0f545f', '#188792', '#2ebcbe', '#6ee2dc', '#b2f5ef']],
  ['green', ['#132a18', '#1d4a25', '#2d7833', '#4aa543', '#7fd45f', '#b6f095']],
  ['gold', ['#3a2a0d', '#644812', '#96701a', '#c99c28', '#f0c94a', '#ffe89a']],
  ['wood', ['#241708', '#432a12', '#6b4520', '#9a6a31', '#c4934e', '#e5bb84']],
  ['red', ['#2e0d19', '#571623', '#8a232c', '#bc3f3c', '#e2705f', '#f5a58e']],
  ['pink', ['#300f2b', '#571a4b', '#872e74', '#b7529c', '#dd7fc4', '#f4aede']],
  ['purple', ['#1a1430', '#2b2151', '#443579', '#6252a6', '#8a7bcd', '#b6aae8']],
  ['skin', ['#3a201c', '#61382a', '#8b5540', '#b47a58', '#d7a37c', '#f0c9a6']],
  ['slate', ['#0f1a22', '#1b2b36', '#2b4250', '#3f5c6c', '#587a8b', '#7d9dad']],
  ['cream', ['#463f31', '#6d654f', '#968b6e', '#bdb190', '#dcd3b6', '#fff9e6']],
] as const;

function buildPalette(): {
  rgb: [number, number, number][];
  ramps: Record<string, Ramp>;
  rampOf: Int8Array;
  stepOf: Int8Array;
} {
  const rgb: [number, number, number][] = [];
  const ramps: Record<string, Ramp> = {};
  const rampIndex: number[] = [];
  const step: number[] = [];

  for (const [name, entries] of RAMPS) {
    ramps[name] = { name, base: rgb.length, length: entries.length };
    entries.forEach((hex, i) => {
      const v = parseInt(hex.slice(1), 16);
      rgb.push([(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]);
      rampIndex.push(Object.keys(ramps).length - 1);
      step.push(i);
    });
  }
  return { rgb, ramps, rampOf: Int8Array.from(rampIndex), stepOf: Int8Array.from(step) };
}

const built = buildPalette();

/** Every palette entry as an [r, g, b] triple. */
export const PALETTE_RGB: readonly (readonly [number, number, number])[] = built.rgb;

/** Ramps by name, for code that wants to walk one deliberately. */
export const RAMP: Readonly<Record<string, Ramp>> = built.ramps;

/** How many colours the palette holds. */
export const PALETTE_SIZE = built.rgb.length;

/** ABGR words for direct assignment into a Uint32Array ImageData view. */
export const PALETTE_ABGR = new Uint32Array(
  built.rgb.map(([r, g, b]) => (0xff << 24) | (b << 16) | (g << 8) | r),
);

/**
 * Move along a colour's own ramp, clamping at both ends.
 *
 * Positive steps go lighter. Black is outside every ramp and stays black, so
 * shading something unpainted is a no-op rather than a surprise.
 */
export function shade(colour: number, steps: number): number {
  // Anything not a real palette index resolves to black rather than walking off
  // the end of the ramp table.
  if (!Number.isInteger(colour) || colour <= 0 || colour >= PALETTE_SIZE) return 0;
  if (!Number.isFinite(steps)) return colour;
  const ramp = RAMPS[built.rampOf[colour]];
  const base = colour - built.stepOf[colour];
  const length = ramp[1].length;
  const next = built.stepOf[colour] + steps;
  return base + Math.min(length - 1, Math.max(0, next));
}

/** One step darker along the colour's ramp. */
export function darker(colour: number): number {
  return shade(colour, -1);
}

/** One step lighter along the colour's ramp. */
export function lighter(colour: number): number {
  return shade(colour, 1);
}

/**
 * Named colours.
 *
 * The sixteen EGA names are kept and point at the nearest tone in the new
 * ramps, so every scene written against them still reads correctly; the
 * `-Dim`/`-Lit` variants are there for art that wants to say which way the
 * light is going without counting ramp steps.
 */
export const C = {
  black: 0,

  // Neutrals
  ink: RAMP.neutral.base,
  charcoal: RAMP.neutral.base + 1,
  slateDim: RAMP.neutral.base + 2,
  slate: RAMP.neutral.base + 3,
  steel: RAMP.neutral.base + 4,
  grey: RAMP.neutral.base + 5,
  greyLit: RAMP.neutral.base + 6,
  silver: RAMP.neutral.base + 7,
  white: RAMP.neutral.base + 8,

  navyDeep: RAMP.blue.base,
  navy: RAMP.blue.base + 1,
  blueDim: RAMP.blue.base + 2,
  blue: RAMP.blue.base + 3,
  blueLit: RAMP.blue.base + 4,
  bluePale: RAMP.blue.base + 5,

  tealDeep: RAMP.cyan.base,
  teal: RAMP.cyan.base + 1,
  tealLit: RAMP.cyan.base + 2,
  cyan: RAMP.cyan.base + 3,
  cyanLit: RAMP.cyan.base + 4,
  cyanPale: RAMP.cyan.base + 5,

  greenDeep: RAMP.green.base,
  greenDim: RAMP.green.base + 1,
  green: RAMP.green.base + 2,
  greenLit: RAMP.green.base + 3,
  lime: RAMP.green.base + 4,
  limePale: RAMP.green.base + 5,

  bronze: RAMP.gold.base,
  brass: RAMP.gold.base + 1,
  gold: RAMP.gold.base + 2,
  goldLit: RAMP.gold.base + 3,
  yellow: RAMP.gold.base + 4,
  yellowPale: RAMP.gold.base + 5,

  woodDeep: RAMP.wood.base,
  woodDim: RAMP.wood.base + 1,
  brown: RAMP.wood.base + 2,
  brownLit: RAMP.wood.base + 3,
  tan: RAMP.wood.base + 4,
  tanPale: RAMP.wood.base + 5,

  maroonDeep: RAMP.red.base,
  maroon: RAMP.red.base + 1,
  crimson: RAMP.red.base + 2,
  red: RAMP.red.base + 3,
  redLit: RAMP.red.base + 4,
  salmon: RAMP.red.base + 5,

  plum: RAMP.pink.base,
  purple: RAMP.pink.base + 1,
  magenta: RAMP.pink.base + 2,
  pink: RAMP.pink.base + 3,
  pinkLit: RAMP.pink.base + 4,
  pinkPale: RAMP.pink.base + 5,

  violetDeep: RAMP.purple.base,
  violetDim: RAMP.purple.base + 1,
  violet: RAMP.purple.base + 2,
  violetLit: RAMP.purple.base + 3,
  lavender: RAMP.purple.base + 4,
  lavenderPale: RAMP.purple.base + 5,

  skinDeep: RAMP.skin.base,
  skinShadow: RAMP.skin.base + 1,
  skinDark: RAMP.skin.base + 2,
  skinMid: RAMP.skin.base + 3,
  skin: RAMP.skin.base + 4,
  skinLit: RAMP.skin.base + 5,

  asphaltDeep: RAMP.slate.base,
  asphalt: RAMP.slate.base + 1,
  concrete: RAMP.slate.base + 2,
  concreteLit: RAMP.slate.base + 3,
  pewter: RAMP.slate.base + 4,
  pewterLit: RAMP.slate.base + 5,

  khaki: RAMP.cream.base,
  linen: RAMP.cream.base + 1,
  parchment: RAMP.cream.base + 2,
  bone: RAMP.cream.base + 3,
  ivory: RAMP.cream.base + 4,
  cream: RAMP.cream.base + 5,
} as const;

export type Colour = (typeof C)[keyof typeof C];

/** Relative luminance 0..1, for tests that reason about value contrast. */
export function luma(colour: number): number {
  const [r, g, b] = built.rgb[colour] ?? [0, 0, 0];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
