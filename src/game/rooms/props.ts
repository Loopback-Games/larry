import type { Painter } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';

/**
 * Scenery that appears in more than one room, drawn as actors so it can be
 * depth-sorted rather than baked into a scene.
 */

/** A yellow cab in three-quarter view, with (x, y) at the kerbside rear wheel. */
export function drawTaxi(p: Painter, x: number, y: number): void {
  const left = x - 48;
  const top = y - 34;
  p.saved((q) => {
    // Body.
    q.ink(C.yellow).solid([
      left + 2, top + 22,
      left + 14, top + 12,
      left + 34, top + 8,
      left + 60, top + 8,
      left + 82, top + 14,
      left + 94, top + 22,
      left + 94, top + 30,
      left + 2, top + 30,
    ]);
    q.ink(darker(C.yellow)).line(left + 2, top + 30, left + 93, top + 30);
    // Glasshouse.
    q.ink(C.navy).solid([
      left + 20, top + 12,
      left + 34, top + 2,
      left + 58, top + 2,
      left + 70, top + 12,
    ]);
    q.ink(C.slate).line(left + 45, top + 2, left + 45, top + 12);
    // Chequer band, roof light and door line.
    q.ink(C.black);
    for (let i = 0; i < 12; i++) q.box(left + 8 + i * 7, top + 20 + (i % 2) * 3, 7, 3);
    q.ink(C.white).box(left + 38, top - 4, 16, 6);
    q.ink(C.black).outline(left + 38, top - 4, 16, 6);
    q.ink(darker(C.yellow)).line(left + 46, top + 12, left + 46, top + 30);
    // Wheels.
    q.ink(C.black);
    for (const wx of [left + 20, left + 76]) {
      q.solid([wx - 8, top + 30, wx + 8, top + 30, wx + 8, top + 34, wx - 8, top + 34]);
      q.ink(C.slate).box(wx - 3, top + 31, 6, 2);
      q.ink(C.black);
    }
    // Headlight and tail light.
    q.ink(C.white).box(left + 92, top + 22, 3, 4);
    q.ink(C.red).box(left + 1, top + 22, 3, 4);
  });
}

/** A payphone on a post; (x, y) is the base of the post. */
export function drawPayphone(p: Painter, x: number, y: number): void {
  p.saved((q) => {
    q.ink(C.slate).box(x - 2, y - 40, 5, 40);
    q.ink(C.navy).box(x - 14, y - 76, 30, 38);
    q.ink(C.blue).outline(x - 14, y - 76, 30, 38);
    q.ink(C.slate).box(x - 10, y - 72, 22, 12);
    q.ink(C.black);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) q.box(x - 8 + c * 7, y - 56 + r * 4, 4, 3);
    q.ink(C.black).box(x - 18, y - 70, 6, 16);
    q.ink(C.slate).path([x - 15, y - 54, x - 12, y - 48, x - 6, y - 46]);
  });
}
