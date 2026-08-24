/**
 * The game renders to a small fixed logical canvas and scales up with nearest
 * neighbour, which is what gives it the late-80s look on any display.
 */
export const CANVAS_W = 160;
export const CANVAS_H = 168;

/** Pixels are drawn twice as wide as they are tall, as on period hardware. */
export const PIXEL_ASPECT = 2;

/** Logical display size once the aspect correction is applied. */
export const DISPLAY_W = CANVAS_W * PIXEL_ASPECT;
export const DISPLAY_H = CANVAS_H;

/** Depth bands. Higher numbers are nearer the camera and occlude lower ones. */
export const DEPTH_MIN = 1;
export const DEPTH_MAX = 15;
export const DEPTH_DEFAULT = 8;

/** Walkability mask values. */
export const WALK_FREE = 0;
/** Solid scenery: nothing may enter. */
export const WALK_BLOCKED = 1;
/** Passable, but actors that respect it are pushed back (railings, kerbs). */
export const WALK_EDGE = 2;
/** Water: only actors flagged as swimmers may enter. */
export const WALK_WATER = 3;
/** Script trigger: entering fires the room's `onTrigger`. */
export const WALK_TRIGGER = 4;

/** Rows above this are scenery only; walkers are clamped below it. */
export const DEFAULT_HORIZON = 96;
