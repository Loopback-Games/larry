/**
 * Render every room to one contact sheet for review.
 *
 * Room art is written as code, so a pull request that changes a scene shows a
 * diff of draw calls and nothing about the result. CI runs this and uploads the
 * sheet, so an art change can actually be looked at.
 *
 *   node tools/room-sheet.mjs [out.png] [colour|walk|depth]
 */
import { writeFileSync } from 'node:fs';
import { encodePNG } from './png.mjs';
import { withSource } from './load.mjs';

const out = process.argv[2] ?? 'rooms.png';
const plane = process.argv[3] ?? 'colour';

await withSource(async (load) => {
  const { ROOMS } = await load('/src/game/rooms/index.ts');
  const { PALETTE_RGB } = await load('/src/engine/palette.ts');
  const { createGame } = await load('/src/game/index.ts');
  const { CANVAS_W, CANVAS_H, WALK_BLOCKED } = await load('/src/constants.ts');

  const COLS = 3;
  const PAD = 4;
  const rows = Math.ceil(ROOMS.length / COLS);
  const W = COLS * (CANVAS_W + PAD) + PAD;
  const H = rows * (CANVAS_H + PAD) + PAD;
  const buf = Buffer.alloc(W * H * 3, 0x18);

  // Composing through the game rather than calling `scene()` puts the ego and
  // the room's actors in the picture, which is how scale and depth get judged.
  const game = createGame();
  while (game.dismissMessage());

  ROOMS.forEach((room, i) => {
    game.goTo(room.id);
    while (game.dismissMessage());
    const frame = game.renderFrame().surface;

    const ox = PAD + (i % COLS) * (CANVAS_W + PAD);
    const oy = PAD + Math.floor(i / COLS) * (CANVAS_H + PAD);

    for (let y = 0; y < CANVAS_H; y++) {
      for (let x = 0; x < CANVAS_W; x++) {
        const at = y * CANVAS_W + x;
        let [r, g, b] = PALETTE_RGB[frame.colour[at]] ?? [255, 0, 255];
        if (plane === 'walk') {
          // Tint the art by walkability rather than replacing it, so blocked
          // scenery can be checked against what is drawn there.
          const blocked = frame.walk[at] === WALK_BLOCKED;
          r = r * 0.3 + (blocked ? 95 : 0);
          g = g * 0.3 + (blocked ? 0 : 90);
          b = b * 0.3;
        } else if (plane === 'depth') {
          const d = frame.depth[at] * 17;
          r = g = b = d;
        }
        const o = ((oy + y) * W + ox + x) * 3;
        buf[o] = r;
        buf[o + 1] = g;
        buf[o + 2] = b;
      }
    }

    // Outline every exit in white, so a trigger that has drifted away from the
    // art it belongs to is visible at a glance.
    if (plane === 'walk') {
      for (const exit of room.exits ?? []) {
        const mark = (x, y) => {
          if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) return;
          const o = ((oy + y) * W + ox + x) * 3;
          buf[o] = buf[o + 1] = buf[o + 2] = 255;
        };
        for (let x = exit.x; x < exit.x + exit.w; x++) {
          mark(x, exit.y);
          mark(x, exit.y + exit.h - 1);
        }
        for (let y = exit.y; y < exit.y + exit.h; y++) {
          mark(exit.x, y);
          mark(exit.x + exit.w - 1, y);
        }
      }
    }
  });

  writeFileSync(out, encodePNG(buf, W, H));
  console.log(`${ROOMS.length} rooms -> ${out} (${W}x${H}) plane=${plane}`);
});
