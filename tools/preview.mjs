// Dev utility: render a scene (or the whole room sheet) to PNG for eyeballing.
import { writeFileSync } from 'node:fs';
import { PALETTE_RGB } from '../src/engine/palette.ts';
import { PIXEL_ASPECT } from '../src/constants.ts';

/** Encode a Surface plane to a PPM buffer at 2x horizontal aspect. */
export function surfaceToPPM(surface, plane = 'colour', scale = 1) {
  const src = surface[plane];
  const W = surface.width * PIXEL_ASPECT * scale;
  const H = surface.height * scale;
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const v = src[y * surface.width + x];
      const [r, g, b] = plane === 'colour' ? PALETTE_RGB[v] : PALETTE_RGB[v % PALETTE_RGB.length];
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < PIXEL_ASPECT * scale; sx++) {
          const o = ((y * scale + sy) * W + x * PIXEL_ASPECT * scale + sx) * 3;
          buf[o] = r; buf[o + 1] = g; buf[o + 2] = b;
        }
      }
    }
  }
  return Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]);
}

export function writePPM(path, surface, plane = 'colour', scale = 1) {
  writeFileSync(path, surfaceToPPM(surface, plane, scale));
}
