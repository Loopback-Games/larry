import {
  Surface,
  plot,
  line,
  polyline,
  rect,
  frame,
  flood,
  floodMask,
  fillPolygon,
} from './raster.js';
import type { Pen } from './raster.js';
import { CANVAS_W, CANVAS_H, WALK_BLOCKED } from '../constants.js';
import { shade } from './palette.js';
import { rng, randInt } from './rng.js';
import { glyphPixel, GLYPH_W, GLYPH_H } from './font.js';

/**
 * Fluent painter over a {@link Surface}.
 *
 * Room art is written as code rather than stored as bitmaps: it keeps each
 * scene to a few dozen readable lines, makes the depth and walk planes part of
 * the same description as the picture, and costs almost nothing to ship.
 */
/** 4x4 ordered dither matrix. */
const BAYER: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

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

  /**
   * Filled polygon. Scanline-filled rather than outlined and flooded, so the
   * shape stays solid whatever is already painted underneath it.
   */
  solid(points: readonly number[]): this {
    fillPolygon(this.surface, this.pen, points);
    polyline(this.surface, this.pen, points, true);
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

  /**
   * Draw text into the scene with the bitmap font, optionally scaled up.
   * Used for signage and the title screen.
   */
  text(value: string, x: number, y: number, scale = 1, spacing = 0): this {
    const step = GLYPH_W * scale + spacing;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      for (let gy = 0; gy < GLYPH_H; gy++) {
        for (let gx = 0; gx < GLYPH_W; gx++) {
          if (!glyphPixel(code, gx, gy)) continue;
          this.box(x + i * step + gx * scale, y + gy * scale, scale, scale);
        }
      }
    }
    return this;
  }

  /** Width in pixels that {@link text} will occupy. */
  textWidth(value: string, scale = 1, spacing = 0): number {
    return value.length * (GLYPH_W * scale + spacing) - spacing;
  }

  /** Draw text centred on `cx`. */
  textCentred(value: string, cx: number, y: number, scale = 1, spacing = 0): this {
    return this.text(
      value,
      Math.round(cx - this.textWidth(value, scale, spacing) / 2),
      y,
      scale,
      spacing,
    );
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

  /**
   * Mix two inks across a rectangle using an ordered (Bayer) dither.
   *
   * With sixteen colours to work with, dithering is how the palette gets more
   * apparent shades than it actually has. `mix` is the proportion of `b`.
   */
  blend(x: number, y: number, w: number, h: number, a: number, b: number, mix: number): this {
    return this.saved((p) => {
      const clamped = Math.min(1, Math.max(0, mix));
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const threshold = (BAYER[py & 3][px & 3] + 0.5) / 16;
          p.ink(clamped > threshold ? b : a).dot(x + px, y + py);
        }
      }
    });
  }

  /**
   * Vertical gradient between two inks, dithered so the bands do not step.
   * `from` and `to` are the mix at the top and bottom of the band.
   */
  gradient(
    x: number,
    y: number,
    w: number,
    h: number,
    a: number,
    b: number,
    from = 0,
    to = 1,
  ): this {
    return this.saved((p) => {
      for (let py = 0; py < h; py++) {
        const t = h <= 1 ? to : from + ((to - from) * py) / (h - 1);
        for (let px = 0; px < w; px++) {
          const threshold = (BAYER[py & 3][px & 3] + 0.5) / 16;
          p.ink(t > threshold ? b : a).dot(x + px, y + py);
        }
      }
    });
  }

  /**
   * A soft halo, for neon and lamps. Dithered rings that thin out with
   * distance, which is as close to a bloom as sixteen colours allow.
   *
   * Only pixels currently holding `over` are lit, so the glow spreads into the
   * night behind a sign without speckling across the sign, the brickwork or
   * the windows in front of it.
   */
  glow(
    cx: number,
    cy: number,
    radius: number,
    colour: number,
    strength = 0.7,
    over: number | readonly number[] = 0,
  ): this {
    const targets = typeof over === 'number' ? [over] : over;
    return this.saved((p) => {
      const r2 = radius * radius;
      for (let py = -radius; py <= radius; py++) {
        for (let px = -radius; px <= radius; px++) {
          const d2 = px * px + py * py;
          if (d2 > r2) continue;
          const x = cx + px;
          const y = cy + py;
          if (!targets.includes(this.surface.colourAt(x, y))) continue;
          const falloff = 1 - Math.sqrt(d2) / radius;
          const threshold = (BAYER[y & 3][x & 3] + 0.5) / 16;
          if (falloff * strength > threshold) p.ink(colour).dot(x, y);
        }
      }
    });
  }

  // ---- light and form ----------------------------------------------------

  /**
   * Shift pixels that are already painted along their own colour ramps.
   *
   * This is the workhorse behind every lighting effect here. Because each hue
   * owns a run of palette indices, "darken this region" is a meaningful
   * operation on arbitrary artwork: the wood stays wood and the brick stays
   * brick, they just fall into shadow. Fractional steps are dithered, so a
   * gentle falloff does not band.
   */
  relight(x: number, y: number, w: number, h: number, steps: number): this {
    if (!Number.isFinite(steps)) return this;
    // Round like `plot` does. Scene code passes fractional positions freely
    // (perspective rows, ellipse sweeps), and a fractional index reads past the
    // typed array rather than into it.
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = x0 + Math.round(w);
    const y1 = y0 + Math.round(h);
    const whole = Math.trunc(steps);
    const frac = Math.abs(steps - whole);
    const extra = steps < 0 ? whole - 1 : whole + 1;
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        if (!this.surface.inside(px, py)) continue;
        const i = this.surface.index(px, py);
        const current = this.surface.colour[i];
        if (current === 0) continue;
        const threshold = (BAYER[py & 3][px & 3] + 0.5) / 16;
        this.surface.colour[i] = shade(current, frac > threshold ? extra : whole);
      }
    }
    return this;
  }

  /**
   * A smooth vertical shade across already-painted pixels.
   *
   * Prefer this to `gradient` on any large surface. `gradient` dithers between
   * two fixed inks, which over a big area reads as sandpaper; this steps
   * through the colour's own ramp, so the intermediate tones are real and only
   * the fractional part is dithered.
   */
  sweep(x: number, y: number, w: number, h: number, from: number, to: number, blend = 3): this {
    for (let py = 0; py < h; py++) {
      const t = h <= 1 ? 1 : py / (h - 1);
      const value = from + (to - from) * t;
      const step = Math.round(value);
      // Dither only in a narrow band either side of each step boundary.
      // Dithering every row instead turns a gradient into sandpaper, which is
      // what the flat art was doing wrong in the first place.
      const rows = Math.abs(to - from) < 1e-6 ? h : h / Math.abs(to - from);
      const distance = Math.abs(value - step) * rows;
      this.relight(x, y + py, w, 1, distance < blend ? value : step);
    }
    return this;
  }

  /**
   * Ambient occlusion: a soft dark band where two surfaces meet.
   *
   * Nothing does more for readability per line of code. Without it a floor and
   * the wall behind it are two abutting fields of colour and the eye cannot
   * tell which is which; with it the junction reads as a corner.
   */
  contact(x: number, y: number, w: number, h: number, steps = -2): this {
    for (let py = 0; py < h; py++) {
      const falloff = 1 - py / h;
      const value = steps * falloff * falloff;
      const step = Math.round(value);
      // Banded like `sweep`, for the same reason: a per-row dither over a wide
      // surface reads as grain rather than as shadow.
      const next = Math.abs(steps) * (1 - ((py + 1) / h) ** 2);
      this.relight(x, y + py, w, 1, Math.abs(Math.abs(value) - next) > 0.34 ? value : step);
    }
    return this;
  }

  /**
   * A box with form: lit along the top and left, shadowed along the bottom and
   * right, so it reads as a solid object rather than a coloured rectangle.
   *
   * The light is treated as coming from the upper left everywhere in the game.
   * Keeping that consistent is most of what makes a scene look coherent.
   */
  slab(x: number, y: number, w: number, h: number, colour: number, bevel = 1): this {
    return this.saved((p) => {
      p.ink(colour).box(x, y, w, h);
      if (w < 3 || h < 3) return;
      p.ink(shade(colour, bevel));
      p.box(x, y, w, 1).box(x, y, 1, h);
      p.ink(shade(colour, -bevel));
      p.box(x, y + h - 1, w, 1).box(x + w - 1, y, 1, h);
      p.ink(shade(colour, -bevel * 2))
        .dot(x + w - 1, y)
        .dot(x, y + h - 1);
    });
  }

  /**
   * A pool of light on whatever is already painted, falling off elliptically.
   * Used for lamps, spotlights and the wash a doorway throws onto a pavement.
   */
  lightPool(cx: number, cy: number, rx: number, ry: number, steps = 1): this {
    for (let py = -ry; py <= ry; py++) {
      for (let px = -rx; px <= rx; px++) {
        const d = Math.sqrt((px / rx) ** 2 + (py / ry) ** 2);
        if (d > 1) continue;
        this.relight(cx + px, cy + py, 1, 1, steps * (1 - d * d));
      }
    }
    return this;
  }

  /**
   * Darken the edges of the frame. Pulls the eye to the middle of the picture
   * and stops large flat surfaces reading as blank.
   */
  vignette(steps = -1): this {
    // Distance from the nearest frame edge rather than from the centre. A
    // radial falloff draws a visible oval across a flat wall, which is worse
    // than the flatness it was meant to relieve.
    const at = (x: number, y: number) => {
      const edge = Math.min(
        x / this.width,
        y / this.height,
        1 - x / this.width,
        1 - y / this.height,
      );
      return edge > 0.18 ? 0 : steps * (1 - edge / 0.18);
    };
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const value = at(x, y);
        if (value === 0) continue;
        // Dither only where a neighbouring pixel would land on a different
        // ramp step, so the bands blend but the flat parts stay flat.
        const edge =
          Math.round(at(x + 2, y)) !== Math.round(value) ||
          Math.round(at(x, y + 2)) !== Math.round(value);
        this.relight(x, y, 1, 1, edge ? value : Math.round(value));
      }
    }
    return this;
  }

  /**
   * A receding floor: darker and cooler at the back, lit towards the camera,
   * with perspective seams converging on a vanishing point.
   *
   * Replaces the habit of scattering repeated texture over the whole floor,
   * which fills the area with detail but tells the eye nothing about depth.
   */
  floorPlane(
    yTop: number,
    yBottom: number,
    colour: number,
    vanishX = this.width / 2,
    seams = 9,
  ): this {
    return this.saved((p) => {
      const h = yBottom - yTop;
      p.ink(colour).box(0, yTop, p.width, h);
      // Shadowed at the back, catching the light as it comes towards us.
      p.sweep(0, yTop, p.width, h, -1, 1);
      // Seams fan out from the vanishing point, spaced wider as they near us.
      p.ink(shade(colour, -2));
      for (let i = 0; i <= seams; i++) {
        const t = (i / seams - 0.5) * 2;
        p.line(vanishX + t * p.width * 0.22, yTop, vanishX + t * p.width * 2.4, yBottom);
      }
      // Boards running across, on the same non-linear recession as the seams.
      for (let r = 1; r < 6; r++) {
        const y = yTop + h * Math.pow(r / 6, 1.7);
        p.ink(shade(colour, -2)).line(0, y, p.width - 1, y);
      }
      p.contact(0, yTop, p.width, Math.min(12, h), -2);
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
   * Mark standing scenery so actors sort against it correctly.
   *
   * The band is read from the floor directly under the object rather than
   * chosen by hand, which is the only way it stays consistent with
   * {@link depthRamp}. Call it after the ramp.
   *
   * Picking the number by eye is how the bar counter came to be band 11 while
   * the floor in front of it ran 6 to 14: anyone who walked within an arm's
   * length of the bar had their head painted out by it.
   */
  standing(x: number, y: number, w: number, h: number): this {
    const base = Math.min(this.height - 1, Math.round(y + h));
    const band = this.surface.depthAt(Math.round(x + w / 2), base);
    return this.saved((p) => p.noInk().noWalk().depth(band).box(x, y, w, h));
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
