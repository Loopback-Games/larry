import { Surface, plot, line, polyline, rect, frame, flood, floodMask } from './raster.js';
import type { Pen } from './raster.js';
import { CANVAS_W, CANVAS_H, WALK_BLOCKED } from '../constants.js';
import { rng, randInt } from './rng.js';

/**
 * Fluent painter over a {@link Surface}.
 *
 * Room art is written as code rather than stored as bitmaps: it keeps each
 * scene to a few dozen readable lines, makes the depth and walk planes part of
 * the same description as the picture, and costs almost nothing to ship.
 */
export class Painter {
  readonly surface: Surface;
  private pen: Pen = { colour: 0 };

  constructor(surface = new Surface()) {
    this.surface = surface;
  }

  get width(): number {
    return this.surface.width;
  }
  get height(): number {
    return this.surface.height;
  }

  // ---- pen state ---------------------------------------------------------

  /** Paint colour for subsequent operations. */
  ink(colour: number): this {
    this.pen = { ...this.pen, colour };
    return this;
  }

  /** Depth band for subsequent operations. */
  depth(depth: number): this {
    this.pen = { ...this.pen, depth };
    return this;
  }

  /** Walk-mask value for subsequent operations. */
  walk(walk: number): this {
    this.pen = { ...this.pen, walk };
    return this;
  }

  /** Stop writing to the colour plane (useful when marking depth or walk). */
  noInk(): this {
    const { colour, ...rest } = this.pen;
    void colour;
    this.pen = rest;
    return this;
  }

  noDepth(): this {
    const { depth, ...rest } = this.pen;
    void depth;
    this.pen = rest;
    return this;
  }

  noWalk(): this {
    const { walk, ...rest } = this.pen;
    void walk;
    this.pen = rest;
    return this;
  }

  /** Run `body` with the current pen restored afterwards. */
  saved(body: (p: this) => void): this {
    const kept = this.pen;
    body(this);
    this.pen = kept;
    return this;
  }

  // ---- primitives --------------------------------------------------------

  dot(x: number, y: number): this {
    plot(this.surface, this.pen, x, y);
    return this;
  }

  dots(points: readonly number[]): this {
    for (let i = 0; i + 1 < points.length; i += 2) {
      plot(this.surface, this.pen, points[i], points[i + 1]);
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number): this {
    line(this.surface, this.pen, x0, y0, x1, y1);
    return this;
  }

  /** Open polyline through a flat [x,y,...] list. */
  path(points: readonly number[]): this {
    polyline(this.surface, this.pen, points, false);
    return this;
  }

  /** Closed polygon outline. */
  poly(points: readonly number[]): this {
    polyline(this.surface, this.pen, points, true);
    return this;
  }

  /** Closed polygon, outlined then flood-filled from its centroid. */
  solid(points: readonly number[]): this {
    polyline(this.surface, this.pen, points, true);
    let cx = 0;
    let cy = 0;
    const n = points.length / 2;
    for (let i = 0; i < points.length; i += 2) {
      cx += points[i];
      cy += points[i + 1];
    }
    flood(this.surface, this.pen, cx / n, cy / n);
    return this;
  }

  box(x: number, y: number, w: number, h: number): this {
    rect(this.surface, this.pen, x, y, w, h);
    return this;
  }

  outline(x: number, y: number, w: number, h: number): this {
    frame(this.surface, this.pen, x, y, w, h);
    return this;
  }

  fill(x: number, y: number): this {
    flood(this.surface, this.pen, x, y);
    return this;
  }

  /** Fill depth/walk inside a colour-bounded region without repainting it. */
  maskFill(x: number, y: number, boundary: number): this {
    floodMask(this.surface, this.pen, x, y, boundary);
    return this;
  }

  // ---- composite scenery -------------------------------------------------

  /** Horizontal band, optionally dithered into the band above it. */
  band(y: number, h: number, colour: number, dither?: number): this {
    return this.saved((p) => {
      p.ink(colour).box(0, y, p.width, h);
      if (dither !== undefined) {
        p.ink(dither);
        for (let py = y; py < y + Math.min(h, 4); py++) {
          const step = py - y + 2;
          for (let px = (py % 2) * step; px < p.width; px += step * 2) p.dot(px, py);
        }
      }
    });
  }

  /** Vertical gradient approximated by ordered dithering between two inks. */
  gradient(x: number, y: number, w: number, h: number, top: number, bottom: number): this {
    return this.saved((p) => {
      p.ink(top).box(x, y, w, h);
      p.ink(bottom);
      for (let row = 0; row < h; row++) {
        // Probability of a bottom-colour pixel rises down the band.
        const density = row / Math.max(1, h - 1);
        const period = Math.max(1, Math.round(1 / Math.max(0.02, density)));
        for (let col = (row % 2) * Math.ceil(period / 2); col < w; col += period) {
          p.dot(x + col, y + row);
        }
      }
    });
  }

  /** Scattered single-pixel stars, deterministic for a given seed. */
  stars(x: number, y: number, w: number, h: number, count: number, seed: number): this {
    const next = rng(seed);
    return this.saved((p) => {
      for (let i = 0; i < count; i++) {
        p.dot(x + randInt(next, 0, w - 1), y + randInt(next, 0, h - 1));
      }
    });
  }

  /** Brick coursing: staggered mortar lines over an already-painted wall. */
  bricks(
    x: number,
    y: number,
    w: number,
    h: number,
    mortar: number,
    courseH = 4,
    brickW = 10,
  ): this {
    return this.saved((p) => {
      p.ink(mortar);
      for (let row = 0, py = y; py < y + h; py += courseH, row++) {
        p.line(x, py, x + w - 1, py);
        const offset = row % 2 ? brickW / 2 : 0;
        for (let px = x + offset; px < x + w; px += brickW) {
          p.line(px, py, px, Math.min(y + h - 1, py + courseH - 1));
        }
      }
    });
  }

  /** Receding checkerboard floor, the period shorthand for "interior". */
  checkerFloor(
    yTop: number,
    yBottom: number,
    vanishX: number,
    light: number,
    dark: number,
    columns = 10,
    rows = 7,
  ): this {
    return this.saved((p) => {
      p.ink(dark).box(0, yTop, p.width, yBottom - yTop);
      p.ink(light);
      const depthOf = (r: number) => Math.pow(r / rows, 1.7);
      for (let r = 0; r < rows; r++) {
        const y0 = yTop + (yBottom - yTop) * depthOf(r);
        const y1 = yTop + (yBottom - yTop) * depthOf(r + 1);
        const spread0 = 0.15 + depthOf(r) * 1.5;
        const spread1 = 0.15 + depthOf(r + 1) * 1.5;
        for (let c = 0; c < columns; c++) {
          if ((r + c) % 2) continue;
          const t0 = (c / columns - 0.5) * 2;
          const t1 = ((c + 1) / columns - 0.5) * 2;
          p.solid([
            vanishX + t0 * spread0 * p.width,
            y0,
            vanishX + t1 * spread0 * p.width,
            y0,
            vanishX + t1 * spread1 * p.width,
            y1,
            vanishX + t0 * spread1 * p.width,
            y1,
          ]);
        }
      }
    });
  }

  /** A lit window: frame, glass, and optional mullions. */
  window(
    x: number,
    y: number,
    w: number,
    h: number,
    glass: number,
    frameColour: number,
    mullions = true,
  ): this {
    return this.saved((p) => {
      p.ink(glass).box(x, y, w, h);
      p.ink(frameColour).outline(x, y, w, h);
      if (mullions) {
        p.line(x + Math.floor(w / 2), y, x + Math.floor(w / 2), y + h - 1);
        p.line(x, y + Math.floor(h / 2), x + w - 1, y + Math.floor(h / 2));
      }
    });
  }

  /** A city skyline silhouette with lit windows, used by exterior night scenes. */
  skyline(
    yBase: number,
    minH: number,
    maxH: number,
    body: number,
    lights: number,
    seed: number,
  ): this {
    const next = rng(seed);
    return this.saved((p) => {
      let x = -4;
      while (x < p.width) {
        const w = randInt(next, 12, 26);
        const h = randInt(next, minH, maxH);
        p.ink(body).box(x, yBase - h, w, h);
        p.ink(lights);
        for (let wy = yBase - h + 3; wy < yBase - 3; wy += 5) {
          for (let wx = x + 2; wx < x + w - 2; wx += 4) {
            if (next() < 0.45) p.dot(wx, wy);
          }
        }
        x += w + randInt(next, 0, 3);
      }
    });
  }

  /** Mark a rectangle as solid scenery on the walk plane only. */
  blockRect(x: number, y: number, w: number, h: number): this {
    return this.saved((p) => p.noInk().noDepth().walk(WALK_BLOCKED).box(x, y, w, h));
  }

  /**
   * Give everything below `y` a depth band that rises towards the bottom of the
   * screen, so actors standing nearer the camera correctly overlap those behind.
   */
  depthRamp(yTop: number, yBottom: number, from = 4, to = 14): this {
    return this.saved((p) => {
      p.noInk().noWalk();
      for (let y = yTop; y < yBottom; y++) {
        const t = (y - yTop) / Math.max(1, yBottom - yTop - 1);
        p.depth(Math.round(from + t * (to - from))).box(0, y, p.width, 1);
      }
    });
  }
}

/** Build a surface by running a painting function over a fresh canvas. */
export function paint(
  body: (p: Painter) => void,
  width = CANVAS_W,
  height = CANVAS_H,
): Surface {
  const p = new Painter(new Surface(width, height));
  body(p);
  return p.surface;
}
