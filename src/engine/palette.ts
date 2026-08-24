/** The 16-colour EGA palette AGI renders with, as packed 0xAABBGGRR words. */
export const EGA_RGB: readonly [number, number, number][] = [
  [0x00, 0x00, 0x00], // 0  black
  [0x00, 0x00, 0xaa], // 1  blue
  [0x00, 0xaa, 0x00], // 2  green
  [0x00, 0xaa, 0xaa], // 3  cyan
  [0xaa, 0x00, 0x00], // 4  red
  [0xaa, 0x00, 0xaa], // 5  magenta
  [0xaa, 0x55, 0x00], // 6  brown
  [0xaa, 0xaa, 0xaa], // 7  light grey
  [0x55, 0x55, 0x55], // 8  dark grey
  [0x55, 0x55, 0xff], // 9  light blue
  [0x55, 0xff, 0x55], // 10 light green
  [0x55, 0xff, 0xff], // 11 light cyan
  [0xff, 0x55, 0x55], // 12 light red
  [0xff, 0x55, 0xff], // 13 light magenta
  [0xff, 0xff, 0x55], // 14 yellow
  [0xff, 0xff, 0xff], // 15 white
];

/** ABGR words for direct assignment into a Uint32Array ImageData view. */
export const EGA_ABGR = new Uint32Array(
  EGA_RGB.map(([r, g, b]) => (0xff << 24) | (b << 16) | (g << 8) | r),
);

/** Named palette indices, for readable scene code. */
export const C = {
  black: 0,
  navy: 1,
  green: 2,
  teal: 3,
  maroon: 4,
  purple: 5,
  brown: 6,
  grey: 7,
  slate: 8,
  blue: 9,
  lime: 10,
  cyan: 11,
  red: 12,
  pink: 13,
  yellow: 14,
  white: 15,
} as const;

export type Colour = (typeof C)[keyof typeof C];

/**
 * Nearest darker companion for each palette entry, used for shading and
 * outlines so figures read against backgrounds of similar brightness.
 */
const SHADE: readonly number[] = [0, 0, 0, 1, 0, 0, 0, 8, 0, 1, 2, 3, 4, 5, 6, 7];

export function darker(colour: number): number {
  return SHADE[colour & 0x0f];
}
