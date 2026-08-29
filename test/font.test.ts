import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { glyph, glyphPixel, GLYPH_H } from '../src/engine/font.js';

describe('bitmap font', () => {
  it('declares every glyph as 8 rows of 6 cells', () => {
    const src = readFileSync('src/engine/font.ts', 'utf8');
    const table = src.slice(src.indexOf('const GLYPHS'), src.indexOf('export const GLYPH_W'));
    const rows = [...table.matchAll(/: '([.#/]+)',/g)];
    expect(rows.length).toBeGreaterThanOrEqual(95);
    for (const [, spec] of rows) {
      const lines = spec.split('/');
      expect(lines.length).toBe(8);
      for (const line of lines) expect(line.length).toBe(6);
    }
  });

  it('covers the printable ASCII range', () => {
    for (let c = 33; c < 127; c++) {
      const rows = glyph(c);
      expect(rows.length).toBe(GLYPH_H);
      // Every printable non-space character must draw something.
      expect(
        rows.some((r) => r !== 0),
        String.fromCharCode(c),
      ).toBe(true);
    }
  });

  it('renders space as blank and falls back to ? for unmapped codes', () => {
    expect(glyph(32).every((r) => r === 0)).toBe(true);
    expect([...glyph(200)]).toEqual([...glyph(63)]);
  });

  it('keeps the rightmost column and bottom row clear for spacing', () => {
    for (let c = 32; c < 127; c++) {
      expect(glyphPixel(c, 7, 0)).toBe(false);
      for (let x = 0; x < 8; x++) expect(glyphPixel(c, x, 7)).toBe(false);
    }
  });
});
