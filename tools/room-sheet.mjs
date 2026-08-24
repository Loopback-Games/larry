// Dev utility: render every room's art to one contact sheet for review.
import { writeFileSync } from 'node:fs';
import { ROOMS } from '../src/game/rooms/index.ts';
import { EGA_RGB } from '../src/engine/palette.ts';
import { Painter } from '../src/engine/scene.ts';
import { drawFigure } from '../src/engine/figure.ts';
import { LARRY_STYLE } from '../src/game/index.ts';

const plane = process.argv[3] ?? 'colour';
const cols = 2;
const rows = Math.ceil(ROOMS.length / cols);
const RW = 320, RH = 168, PAD = 6, LABEL = 10;
const W = cols * (RW + PAD) + PAD;
const H = rows * (RH + PAD + LABEL) + PAD;
const buf = Buffer.alloc(W * H * 3, 0x11);

ROOMS.forEach((room, i) => {
  const surface = room.scene();
  // Drop Larry in at the default entry so scale and depth can be judged.
  const entry = room.entries.default;
  if (plane === 'colour' && entry) {
    drawFigure(new Painter(surface), LARRY_STYLE, entry.facing ?? 'front', 0, entry.x, entry.y);
  }
  const src = surface[plane];
  const ox = PAD + (i % cols) * (RW + PAD);
  const oy = PAD + Math.floor(i / cols) * (RH + PAD + LABEL);
  for (let y = 0; y < RH; y++)
    for (let x = 0; x < RW; x++) {
      const v = src[y * RW + x];
      const [r, g, b] = plane === 'colour' ? EGA_RGB[v] : EGA_RGB[(v * 3) % 16];
      const o = ((oy + y) * W + ox + x) * 3;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b;
    }
});

const out = process.argv[2] ?? '/tmp/rooms.ppm';
writeFileSync(out, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]));
console.log(`${ROOMS.length} rooms -> ${out} (${W}x${H}) plane=${plane}`);
console.log(ROOMS.map((r, i) => `${i + 1}. ${r.title}`).join('   '));
