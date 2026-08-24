import { describe, it, expect } from 'vitest';
import { Surface, line, flood, rect, plot } from '../src/engine/raster.js';
import { Painter, paint } from '../src/engine/scene.js';
import { WALK_BLOCKED } from '../src/constants.js';

describe('raster primitives', () => {
  it('draws an inclusive horizontal line', () => {
    const s = new Surface(10, 4);
    line(s, { colour: 3 }, 2, 1, 6, 1);
    for (let x = 0; x < 10; x++) {
      expect(s.colourAt(x, 1)).toBe(x >= 2 && x <= 6 ? 3 : 0);
    }
  });

  it('draws a diagonal that touches both endpoints', () => {
    const s = new Surface(8, 8);
    line(s, { colour: 5 }, 0, 0, 7, 7);
    expect(s.colourAt(0, 0)).toBe(5);
    expect(s.colourAt(7, 7)).toBe(5);
    expect(s.colourAt(4, 4)).toBe(5);
  });

  it('clips drawing at the surface bounds without throwing', () => {
    const s = new Surface(4, 4);
    expect(() => line(s, { colour: 1 }, -20, -20, 40, 40)).not.toThrow();
    expect(s.colourAt(0, 0)).toBe(1);
  });

  it('flood fills only within an enclosing outline', () => {
    const s = new Surface(16, 16);
    rect(s, { colour: 1 }, 0, 0, 16, 16);
    // A hollow box drawn in colour 2, seeded from inside.
    for (let i = 4; i <= 11; i++) {
      plot(s, { colour: 2 }, i, 4);
      plot(s, { colour: 2 }, i, 11);
      plot(s, { colour: 2 }, 4, i);
      plot(s, { colour: 2 }, 11, i);
    }
    flood(s, { colour: 7 }, 8, 8);
    expect(s.colourAt(8, 8)).toBe(7);
    expect(s.colourAt(5, 5)).toBe(7);
    // Outside the outline is untouched.
    expect(s.colourAt(1, 1)).toBe(1);
    expect(s.colourAt(0, 15)).toBe(1);
  });

  it('is a no-op when the seed already holds the fill colour', () => {
    const s = new Surface(8, 8);
    rect(s, { colour: 4 }, 0, 0, 8, 8);
    expect(() => flood(s, { colour: 4 }, 3, 3)).not.toThrow();
    expect(s.colourAt(3, 3)).toBe(4);
  });

  it('writes colour, depth and walk planes independently', () => {
    const s = new Surface(8, 8);
    rect(s, { colour: 9 }, 0, 0, 8, 8);
    rect(s, { depth: 12 }, 2, 2, 4, 4);
    rect(s, { walk: WALK_BLOCKED }, 0, 0, 8, 2);
    expect(s.colourAt(3, 3)).toBe(9);
    expect(s.depthAt(3, 3)).toBe(12);
    expect(s.depthAt(0, 7)).toBe(0);
    expect(s.walkAt(1, 1)).toBe(WALK_BLOCKED);
    expect(s.walkAt(1, 5)).toBe(0);
    // Marking depth must not have disturbed the picture.
    expect(s.colourAt(3, 3)).toBe(9);
  });
});

describe('scene painter', () => {
  it('restores the pen after a saved block', () => {
    const s = paint((p) => {
      p.ink(5);
      p.saved((q) => q.ink(9).box(0, 0, 2, 2));
      p.box(4, 0, 2, 2);
    }, 8, 8);
    expect(s.colourAt(0, 0)).toBe(9);
    expect(s.colourAt(4, 0)).toBe(5);
  });

  it('produces a deterministic starfield for a given seed', () => {
    const a = paint((p) => p.ink(15).stars(0, 0, 32, 32, 20, 1234), 32, 32);
    const b = paint((p) => p.ink(15).stars(0, 0, 32, 32, 20, 1234), 32, 32);
    const c = paint((p) => p.ink(15).stars(0, 0, 32, 32, 20, 9999), 32, 32);
    expect([...a.colour]).toEqual([...b.colour]);
    expect([...a.colour]).not.toEqual([...c.colour]);
  });

  it('ramps depth downward so nearer rows occlude farther ones', () => {
    const p = new Painter(new Surface(16, 32));
    p.depthRamp(0, 32, 4, 14);
    expect(p.surface.depthAt(0, 0)).toBe(4);
    expect(p.surface.depthAt(0, 31)).toBe(14);
    expect(p.surface.depthAt(0, 16)).toBeGreaterThan(p.surface.depthAt(0, 4));
  });

  it('marks blocked rectangles without painting them', () => {
    const s = paint((p) => {
      p.ink(6).box(0, 0, 16, 16);
      p.blockRect(2, 2, 4, 4);
    }, 16, 16);
    expect(s.walkAt(3, 3)).toBe(WALK_BLOCKED);
    expect(s.colourAt(3, 3)).toBe(6);
  });
});
