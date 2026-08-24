import { FIGURE_H, FIGURE_W } from '../engine/figure.js';

/**
 * How big things are, relative to the person standing next to them.
 *
 * Scenes are drawn in a perspective where a figure shrinks towards the back of
 * the room, so "how many pixels tall is a table" has no fixed answer — it
 * depends where the table stands. Sizing props by eye instead produced a bar
 * counter taller than Larry and stools he could not have climbed, which is what
 * made the rooms feel like they belonged to somebody else.
 *
 * Everything here is expressed as a fraction of a 1.75 m adult, so a prop is
 * sized from the figure that would stand beside it.
 */

/** Perspective scale at a floor row, as {@link Game.scaleAt} computes it. */
export function scaleAtRow(row: number, horizon: number, atHorizon: number): number {
  const span = Math.max(1, 167 - horizon);
  const t = Math.min(1, Math.max(0, (row - horizon) / span));
  return atHorizon + (1 - atHorizon) * t;
}

/** How tall a person standing on `row` is drawn, in pixels. */
export function personAt(row: number, horizon: number, atHorizon: number): number {
  return FIGURE_H * scaleAtRow(row, horizon, atHorizon);
}

/** How wide a person standing on `row` is drawn, in pixels. */
export function personWidthAt(row: number, horizon: number, atHorizon: number): number {
  return FIGURE_W * scaleAtRow(row, horizon, atHorizon);
}

/**
 * Heights as a fraction of the person beside them.
 *
 * Real dimensions over 1.75 m: a dining table is 0.75 m, a bar counter 1.1 m,
 * a chair seat 0.45 m, a door 2.05 m.
 */
export const PROP = {
  seat: 0.26,
  tableTop: 0.43,
  stoolSeat: 0.43,
  deskTop: 0.43,
  bedTop: 0.3,
  counterTop: 0.63,
  doorway: 1.9,
} as const;

export type PropKind = keyof typeof PROP;

/**
 * Height in pixels of a prop of `kind` standing on `row`.
 *
 * The row is where the prop meets the floor, not where its top edge sits.
 */
export function propHeight(
  kind: PropKind,
  row: number,
  horizon: number,
  atHorizon: number,
): number {
  return Math.max(2, Math.round(personAt(row, horizon, atHorizon) * PROP[kind]));
}
