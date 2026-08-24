import { describe, it, expect } from 'vitest';
import { ROOMS } from '../src/game/rooms/index.js';
import { luma } from '../src/engine/palette.js';
import { CANVAS_W, CANVAS_H } from '../src/constants.js';
import type { Surface } from '../src/engine/raster.js';

/**
 * Readability tests.
 *
 * `world` proves the map holds together and `traversal` proves it can be
 * walked. Nothing proved the pictures could be understood, and for a while
 * several of them could not: the chapel was a brown field with its pews as
 * bars floating on black, and the storeroom's wall and floor were within one
 * hundredth of a stop of each other.
 *
 * These measure the properties that separate a picture from a coloured
 * rectangle. The thresholds are set below where the game currently sits, so
 * they catch a regression rather than pin the art in place.
 */

/** How many pixels of each colour a scene uses. */
function histogram(s: Surface): Map<number, number> {
  const counts = new Map<number, number>();
  for (const v of s.colour) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

/** Mean brightness of a horizontal band of the picture. */
function meanLuma(s: Surface, top: number, bottom: number): number {
  let sum = 0;
  let n = 0;
  for (let y = Math.max(0, top); y < Math.min(CANVAS_H, bottom); y++) {
    for (let x = 0; x < CANVAS_W; x++) {
      sum += luma(s.colour[y * CANVAS_W + x]);
      n++;
    }
  }
  return n === 0 ? 0 : sum / n;
}

describe('room artwork', () => {
  it('paints enough distinct colours to describe a place', () => {
    for (const room of ROOMS) {
      if (room.cutscene) continue;
      expect(
        histogram(room.scene()).size,
        `${room.id} is painted in too few colours to have any form`,
      ).toBeGreaterThanOrEqual(9);
    }
  });

  it('is not dominated by one flat colour', () => {
    for (const room of ROOMS) {
      if (room.cutscene) continue;
      const s = room.scene();
      const counts = [...histogram(s).values()].sort((a, b) => b - a);
      const share = counts[0] / s.colour.length;
      // Night exteriors are legitimately mostly sky; a room that is two thirds
      // one colour is a void with some furniture in it.
      expect(share, `${room.id} is ${Math.round(share * 100)}% a single colour`).toBeLessThan(0.7);
    }
  });

  it('uses more than a couple of brightness levels', () => {
    for (const room of ROOMS) {
      if (room.cutscene) continue;
      const s = room.scene();
      const bands = new Map<number, number>();
      for (const [colour, n] of histogram(s)) {
        const band = Math.round(luma(colour) * 8);
        bands.set(band, (bands.get(band) ?? 0) + n);
      }
      // Bands holding at least 1% of the picture, so a handful of highlight
      // pixels cannot stand in for actual tonal range.
      const significant = [...bands.values()].filter((n) => n / s.colour.length > 0.01).length;
      expect(significant, `${room.id} is all one brightness`).toBeGreaterThanOrEqual(3);
    }
  });

  it('separates the floor from the wall behind it', () => {
    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      const s = room.scene();
      const horizon = room.horizon ?? 110;
      const wall = meanLuma(s, horizon - 26, horizon);
      const floor = meanLuma(s, horizon + 1, horizon + 27);
      // Without this the two abut as one field of colour and the eye cannot
      // tell where the room stops and the ground starts.
      expect(
        Math.abs(wall - floor),
        `${room.id}: wall and floor are the same brightness`,
      ).toBeGreaterThan(0.018);
    }
  });

  it('paints the same picture every time', () => {
    // Several scenes seed a generator for stars, skylines and scatter. If one
    // ever reaches for an unseeded source the art drifts between runs, and the
    // measurements above stop meaning anything.
    for (const room of ROOMS) {
      const a = room.scene();
      const b = room.scene();
      expect([...a.colour], `${room.id} does not paint deterministically`).toEqual([...b.colour]);
      expect([...a.walk], `${room.id}'s walk mask is not deterministic`).toEqual([...b.walk]);
    }
  });
});
