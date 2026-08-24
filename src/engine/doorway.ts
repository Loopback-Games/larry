import type { Painter } from './scene.js';
import type { Exit } from './room.js';
import type { Game } from './engine.js';
import { C, shade } from './palette.js';
import { CANVAS_W, CANVAS_H, WALK_BLOCKED, WALK_FREE } from '../constants.js';

/**
 * A way out of a room, described once and used twice.
 *
 * Rooms used to declare exit rectangles separately from the picture, and the
 * two drifted: the cab was reached by walking into a bare patch of road, and
 * four of the casino's stations were unmarked bands across the back wall. Here
 * one spec both paints the doorway and produces the trigger, so an exit can
 * never sit somewhere the player has no reason to walk.
 */

/** Which boundary of the room the doorway sits on. */
export type Side = 'back' | 'left' | 'right' | 'front';

/** How the opening is drawn. */
export type DoorKind =
  | 'door' // a single panelled door in a frame
  | 'double' // two leaves, for hotels and chapels
  | 'arch' // an open opening, no leaves
  | 'curtain' // a hung drape, for back rooms and booths
  | 'stairs' // an opening reached by steps
  | 'plain'; // trigger only; the room paints its own way out

export interface Doorway {
  /** Room id this leads to. */
  readonly to: string;
  /** Shown to the player when they are standing in it. Keep it short. */
  readonly label: string;
  readonly side: Side;
  /**
   * For `back`/`front`, the centre of the opening. For `left`/`right`, ignored.
   */
  readonly x?: number;
  /**
   * The floor row the opening meets. For `left`/`right`, the centre of the
   * walkable band that leads off screen. Unused by `front` exits, which always
   * sit on the bottom edge of the picture.
   */
  readonly y?: number;
  /** Width of the opening; for side exits, the height of the band. */
  readonly w?: number;
  /** Height of the opening as drawn. Ignored for side exits. */
  readonly h?: number;
  readonly kind?: DoorKind;
  /** Frame colour. The leaves and threshold are derived from it. */
  readonly colour?: number;
  /** What shows through the opening. Black reads as "somewhere darker". */
  readonly through?: number;
  /** Light spilling out onto the floor, if the far side is brighter. */
  readonly spill?: number;
  readonly when?: (g: Game) => true | string;
}

/** How deep a floor trigger band is, in pixels. */
const BAND = 7;
/**
 * How wide the band at a left or right screen edge is.
 *
 * Wide enough that the ego's collision box can reach the middle of it. A
 * narrow band at x = 309 looks reachable and is not, because the walker's
 * right edge would be off the canvas.
 */
const EDGE = 18;

const w = (d: Doorway) => d.w ?? 34;
const h = (d: Doorway) => d.h ?? 40;
const cx = (d: Doorway) => d.x ?? CANVAS_W / 2;
const fy = (d: Doorway) => d.y ?? CANVAS_H - BAND;

/**
 * The trigger region for a doorway.
 *
 * Deliberately small and pinned to the drawn opening. The old hand-written
 * rectangles included an eighty-pixel patch of road and two full-width strips,
 * which is why leaving a room so often felt like an accident.
 */
export function exitOf(d: Doorway): Exit {
  const marker = { back: '^', front: 'v', left: '<', right: '>' }[d.side];
  const base = { to: d.to, label: d.label, marker, ...(d.when ? { when: d.when } : {}) };
  switch (d.side) {
    case 'back':
      // The band starts at the floor line, never above it: a room's horizon is
      // the floor line, and a trigger above it is one nothing can stand in.
      return { x: Math.round(cx(d) - w(d) / 2), y: fy(d), w: w(d), h: BAND, ...base };
    case 'front':
      return { x: Math.round(cx(d) - w(d) / 2), y: CANVAS_H - BAND, w: w(d), h: BAND, ...base };
    default: {
      const band = Math.min(d.w ?? 26, CANVAS_H - 2);
      const top = Math.min(CANVAS_H - band, Math.max(0, Math.round(fy(d) - band / 2)));
      const x = d.side === 'left' ? 0 : CANVAS_W - EDGE;
      return { x, y: top, w: EDGE, h: band, ...base };
    }
  }
}

/**
 * Paint the opening.
 *
 * Call this from the room's scene function with the same spec the exit is
 * derived from. It also clears the walk mask across the threshold, because a
 * doorway you cannot stand in is the bug this whole module exists to prevent.
 */
export function paintDoorway(p: Painter, d: Doorway): void {
  if (d.side === 'left' || d.side === 'right') return paintSideExit(p, d);
  if (d.side === 'front') return paintFrontExit(p, d);
  if (d.kind === 'plain') return clearThreshold(p, d);

  const width = w(d);
  const height = h(d);
  const left = Math.round(cx(d) - width / 2);
  const floorY = fy(d);
  const top = floorY - height;
  const frame = d.colour ?? C.brown;
  const through = d.through ?? C.black;

  // The opening itself, and the darkness or light beyond it.
  p.ink(through).box(left, top, width, height);
  if (through !== C.black) p.relight(left, top, width, height, -1);

  switch (d.kind ?? 'door') {
    case 'double': {
      const leaf = Math.floor((width - 6) / 2);
      p.slab(left + 2, top + 3, leaf, height - 3, frame);
      p.slab(left + width - 2 - leaf, top + 3, leaf, height - 3, frame);
      p.ink(shade(frame, 2)).dot(left + leaf - 1, top + height - 18);
      p.ink(shade(frame, 2)).dot(left + width - leaf, top + height - 18);
      break;
    }
    case 'arch':
      // Nothing hangs in an arch; the frame below does the work.
      break;
    case 'curtain': {
      const drape = d.colour ?? C.maroon;
      for (let i = 0; i < width; i += 4) {
        p.ink(shade(drape, i % 8 === 0 ? 1 : -1)).box(left + i, top, 4, height);
      }
      p.contact(left, top, width, 10, -2);
      break;
    }
    case 'stairs': {
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        const inset = i * 3;
        p.slab(left - 6 + inset, floorY - 3 - i * 3, width + 12 - inset * 2, 4, shade(frame, -1));
      }
      break;
    }
    default: {
      p.slab(left + 3, top + 3, width - 6, height - 3, frame);
      p.ink(shade(frame, -2)).outline(left + 7, top + 8, width - 14, height - 22);
      p.ink(shade(frame, 2)).dot(left + width - 9, top + height - 20);
    }
  }

  // The frame, lit from the upper left like everything else.
  p.ink(shade(frame, 1)).box(left - 3, top - 3, width + 6, 3).box(left - 3, top - 3, 3, height + 3);
  p.ink(shade(frame, -2)).box(left + width, top - 3, 3, height + 3);

  // Light falling out of the opening onto the floor in front of it.
  if (d.spill !== undefined) {
    p.ink(d.spill).solid([
      left + 2, floorY,
      left + width - 2, floorY,
      left + width + 8, floorY + 9,
      left - 8, floorY + 9,
    ]);
    p.relight(left - 8, floorY, width + 16, 10, -1);
    p.lightPool(cx(d), floorY + 5, Math.round(width / 2) + 10, 8, 1);
  }

  // A worn threshold strip, so the trigger band is visible even without spill.
  p.ink(shade(frame, -2)).box(left, floorY, width, 2);
  p.ink(shade(frame, 1)).box(left, floorY, width, 1);

  clearThreshold(p, d);
}

/**
 * The way back out of the front of the picture, towards the camera.
 *
 * There is no door to draw at the bottom of the screen, so the floor itself
 * carries the mark: a lit threshold with chevrons pointing out.
 */
function paintFrontExit(p: Painter, d: Doorway): void {
  const e = exitOf(d);
  p.relight(e.x - 6, e.y - 4, e.w + 12, e.h + 4, 1);
  p.ink(d.colour ?? C.goldLit);
  const mid = e.x + e.w / 2;
  for (const dx of [-14, 0, 14]) {
    p.path([mid + dx - 5, CANVAS_H - 8, mid + dx, CANVAS_H - 3, mid + dx + 5, CANVAS_H - 8]);
  }
  clearThreshold(p, d);
}

/**
 * A way off the side of the screen: the pavement carries on, and a chevron on
 * the ground says so. Side exits have no door to draw, so without a mark they
 * are invisible.
 */
function paintSideExit(p: Painter, d: Doorway): void {
  const band = d.w ?? 26;
  const centre = fy(d);
  const top = Math.round(centre - band / 2);
  const right = d.side === 'right';
  const x0 = right ? CANVAS_W - EDGE : 0;

  // Darken the very edge so the road reads as continuing past the frame.
  p.relight(x0, top, EDGE, band, -1);

  const tip = right ? CANVAS_W - 4 : 3;
  const back = right ? tip - 6 : tip + 6;
  p.ink(d.colour ?? C.goldLit);
  for (const dy of [-4, 0, 4]) {
    p.path([back, centre + dy - 5, tip, centre + dy, back, centre + dy + 5]);
  }

  p.saved((q) => q.noInk().noDepth().walk(WALK_FREE).box(x0, top, EDGE, band));
}

/** Make sure the player can actually stand in the doorway they can see. */
function clearThreshold(p: Painter, d: Doorway): void {
  const e = exitOf(d);
  p.saved((q) => q.noInk().noDepth().walk(WALK_FREE).box(e.x, e.y, e.w, e.h));
}

/**
 * Paint every doorway and hand back the matching exits.
 *
 * The one call rooms should use, so the two can only ever be built together.
 */
export function doorways(p: Painter, list: readonly Doorway[]): void {
  for (const d of list) paintDoorway(p, d);
}

/** Exits for a set of doorways, in declaration order. */
export function exitsOf(list: readonly Doorway[]): Exit[] {
  return list.map(exitOf);
}

/** Block everything above a floor line, then reopen each doorway's threshold. */
export function walls(p: Painter, floorY: number, list: readonly Doorway[]): void {
  p.saved((q) => q.noInk().noDepth().walk(WALK_BLOCKED).box(0, 0, CANVAS_W, floorY));
  for (const d of list) clearThreshold(p, d);
}
