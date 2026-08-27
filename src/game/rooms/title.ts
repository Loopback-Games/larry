import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { drawFigure } from '../../engine/figure.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** The title card: the city at night, and a man who thinks tonight is his night. */
export const titleScene = () =>
  paint((p) => {
    // Night sky over the strip.
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 96, 90, 0x105135);
    p.ink(C.slate).stars(0, 0, p.width, 96, 50, 0x517311);

    // The strip receding to a vanishing point, lined with signs.
    p.skyline(120, 20, 46, C.navy, C.yellow, 0x1a2b3c4);
    p.ink(darker(C.navy)).box(0, 120, p.width, 10);
    p.ink(C.black).box(0, 130, p.width, p.height - 130);
    p.ink(darker(C.slate)).line(0, 130, p.width - 1, 130);

    // Road, narrowing towards the horizon.
    p.ink(darker(C.slate)).solid([0, p.height, 118, 130, 202, 130, p.width, p.height]);
    p.ink(C.yellow);
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const y = 132 + t * t * 36;
      const w = 2 + t * 14;
      p.box(160 - w / 2, y, w, Math.max(1, Math.round(1 + t * 4)));
    }

    // Kerbside neon, small and out of focus.
    p.ink(C.pink).box(18, 104, 26, 4).box(276, 100, 30, 4);
    p.ink(C.cyan).box(22, 110, 18, 3).box(280, 106, 22, 3);

    // Title.
    p.ink(C.maroon).textCentred('LOST WAGES', 162, 32, 3, 2);
    p.ink(C.red).textCentred('LOST WAGES', 161, 31, 3, 2);
    p.ink(C.yellow).textCentred('LOST WAGES', 160, 30, 3, 2);
    p.ink(C.white).textCentred('an adventure in poor judgement', 160, 62, 1, 0);

    // Neon frame around the title.
    p.ink(C.purple).outline(24, 18, 272, 58);
    p.ink(C.pink).outline(26, 20, 268, 54);
    p.ink(C.white).dots([26, 20, 293, 20, 26, 73, 293, 73]);

    p.blockRect(0, 0, p.width, 130);
  });

const LARRY_ON_TITLE = new Actor({
  id: 'title-larry',
  x: 160,
  y: 160,
  facing: 'front',
  depth: 15,
  render: (p, a) =>
    drawFigure(
      p,
      {
        hair: C.brown,
        hairStyle: 'short',
        skin: C.pink,
        top: C.white,
        shirt: C.white,
        accent: C.red,
        bottom: C.white,
        shoes: C.black,
        build: 5,
        height: 40,
      },
      'front',
      0,
      a.x,
      a.y,
    ),
});

export const title: RoomDef = {
  id: RoomId.Title,
  title: 'Lost Wages',
  cutscene: true,
  scene: titleScene,

  entries: { default: { x: 160, y: 160, facing: 'front' } },

  describe: 'Lost Wages, Nevada. Population: optimistic.',

  populate: () => [LARRY_ON_TITLE],

  hotspots: [
    {
      noun: 'sign',
      synonyms: ['title', 'neon'],
      look: 'LOST WAGES. An adventure in poor judgement.',
    },
  ],

  onEnter(g) {
    g.say([
      'LOST WAGES',
      '',
      'An original parser adventure.',
      '',
      'You are Larry Laffer. You are thirty-eight, you live with your mother, ' +
        'and you have decided that tonight is the night everything changes.',
      '',
      'Press ENTER to begin.',
    ]);
  },

  onCommand(g) {
    g.goTo(RoomId.AgeCheck);
    return true;
  },
};
