import { CANVAS_W, CANVAS_H, WALK_FREE } from '../constants.js';

/**
 * A three-plane drawing surface.
 *
 * `colour` holds palette indices and is what the player sees. `depth` holds a
 * per-pixel band used to decide whether an actor is drawn in front of or behind
 * scenery. `walk` holds a separate movement mask. Keeping these apart (rather
 * than packing depth and walkability into one plane) means a wall can be
 * waist-high scenery and still be solid, which the room art relies on.
 */
export class Surface {
  readonly width: number;
  readonly height: number;
  readonly colour: Uint8Array;
  readonly depth: Uint8Array;
  readonly walk: Uint8Array;

  constructor(width = CANVAS_W, height = CANVAS_H) {
    this.width = width;
    this.height = height;
    this.colour = new Uint8Array(width * height);
    this.depth = new Uint8Array(width * height);
    this.walk = new Uint8Array(width * height);
  }

  clear(colour = 0, depth = 0, walk = WALK_FREE): void {
    this.colour.fill(colour);
    this.depth.fill(depth);
    this.walk.fill(walk);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  index(x: number, y: number): number {
    return y * this.width + x;
  }

  colourAt(x: number, y: number): number {
    return this.inside(x, y) ? this.colour[this.index(x, y)] : 0;
  }

  depthAt(x: number, y: number): number {
    return this.inside(x, y) ? this.depth[this.index(x, y)] : 0;
  }

  walkAt(x: number, y: number): number {
    return this.inside(x, y) ? this.walk[this.index(x, y)] : 1;
  }
}

/** Which planes a drawing operation writes to. */
export interface Pen {
  colour?: number;
  depth?: number;
  walk?: number;
}

/** Write a single pixel through the pen, respecting surface bounds. */
export function plot(s: Surface, pen: Pen, x: number, y: number): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (!s.inside(px, py)) return;
  const i = s.index(px, py);
  if (pen.colour !== undefined) s.colour[i] = pen.colour;
  if (pen.depth !== undefined) s.depth[i] = pen.depth;
  if (pen.walk !== undefined) s.walk[i] = pen.walk;
}

/** Bresenham line, inclusive of both endpoints. */
export function line(
  s: Surface,
  pen: Pen,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    plot(s, pen, x, y);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Connected line segments through a flat [x0,y0,x1,y1,...] point list. */
export function polyline(s: Surface, pen: Pen, points: readonly number[], close = false): void {
  if (points.length < 4) {
    if (points.length >= 2) plot(s, pen, points[0], points[1]);
    return;
  }
  for (let i = 0; i + 3 < points.length; i += 2) {
    line(s, pen, points[i], points[i + 1], points[i + 2], points[i + 3]);
  }
  if (close) {
    line(
      s,
      pen,
      points[points.length - 2],
      points[points.length - 1],
      points[0],
      points[1],
    );
  }
}

/** Axis-aligned filled rectangle. */
export function rect(
  s: Surface,
  pen: Pen,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(s.width, Math.round(x + w));
  const y1 = Math.min(s.height, Math.round(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) plot(s, pen, px, py);
  }
}

/** Rectangle outline. */
export function frame(
  s: Surface,
  pen: Pen,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  line(s, pen, x, y, x + w - 1, y);
  line(s, pen, x + w - 1, y, x + w - 1, y + h - 1);
  line(s, pen, x + w - 1, y + h - 1, x, y + h - 1);
  line(s, pen, x, y + h - 1, x, y);
}

/**
 * Scanline flood fill over the colour plane.
 *
 * Spreads from the seed across every pixel matching the seed's colour, which is
 * how the scene format keeps its data small: outline a shape, then drop a seed
 * inside it. Filling is a no-op when the seed already holds the target colour,
 * so repeated fills are safe.
 */
export function flood(s: Surface, pen: Pen, seedX: number, seedY: number): void {
  const sx = Math.round(seedX);
  const sy = Math.round(seedY);
  if (!s.inside(sx, sy)) return;

  const target = s.colour[s.index(sx, sy)];
  const replacement = pen.colour;
  // Without a colour change there is no way to mark pixels as visited.
  if (replacement === undefined || replacement === target) return;

  const stack: number[] = [sx, sy];
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    let left = x;
    while (left > 0 && s.colour[s.index(left - 1, y)] === target) left--;
    let right = x;
    while (right < s.width - 1 && s.colour[s.index(right + 1, y)] === target) right++;

    for (let px = left; px <= right; px++) plot(s, pen, px, y);

    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= s.height) continue;
      let px = left;
      while (px <= right) {
        if (s.colour[s.index(px, ny)] !== target) {
          px++;
          continue;
        }
        stack.push(px, ny);
        while (px <= right && s.colour[s.index(px, ny)] === target) px++;
      }
    }
  }
}

/**
 * Fill a region of the depth or walk plane bounded by the colour plane, without
 * touching colours. Used to mark solid scenery whose outline is already drawn.
 */
export function floodMask(
  s: Surface,
  pen: Pen,
  seedX: number,
  seedY: number,
  boundary: number,
): void {
  const sx = Math.round(seedX);
  const sy = Math.round(seedY);
  if (!s.inside(sx, sy)) return;

  const seen = new Uint8Array(s.width * s.height);
  const stack: number[] = [sx, sy];
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (!s.inside(x, y)) continue;
    const i = s.index(x, y);
    if (seen[i] || s.colour[i] === boundary) continue;
    seen[i] = 1;
    plot(s, pen, x, y);
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }
}
