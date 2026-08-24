import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 110;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideChapel, label: 'Outside', side: 'front', x: 160, w: 48 },
];

/** Inside the chapel: six pews, a minister, and an organ playing itself. */
export const insideChapelScene = () =>
  paint((p) => {
    // ---- shell -------------------------------------------------------------
    // Panelled walls closing in on a lit apse, so the eye is pulled down the
    // aisle to the altar rather than left wandering a flat brown field.
    p.ink(C.brown).box(0, 0, p.width, FLOOR);
    p.slab(0, 0, p.width, 10, C.woodDeep, 1);

    // Side walls in perspective, dark, framing the lit end.
    p.ink(C.brown).solid([0, 0, 96, 16, 96, FLOOR, 0, FLOOR + 30]);
    p.ink(C.brown).solid([p.width, 0, 224, 16, 224, FLOOR, p.width, FLOOR + 30]);
    p.sweep(0, 0, 96, FLOOR, -1, 1);
    p.sweep(224, 0, 96, FLOOR, -1, 1);
    p.ink(C.woodDeep);
    for (let x = 4; x < 96; x += 22) p.line(x, 0, x, FLOOR + 20);
    for (let x = 232; x < p.width; x += 22) p.line(x, 0, x, FLOOR + 20);

    // The lit end wall.
    p.slab(96, 16, 128, FLOOR - 16, C.brown, 1);
    p.sweep(96, 16, 128, FLOOR - 16, 1, -1);

    // ---- arched window, and the light it throws ---------------------------
    p.ink(C.navyDeep).solid([134, 74, 134, 36, 148, 18, 172, 18, 186, 36, 186, 74]);
    p.ink(C.teal).solid([138, 70, 138, 39, 150, 23, 170, 23, 182, 39, 182, 70]);
    p.ink(C.violet).solid([146, 62, 146, 43, 160, 30, 174, 43, 174, 62]);
    p.ink(C.goldLit).box(158, 42, 4, 18).box(151, 48, 18, 4);
    p.ink(C.navyDeep).line(134, 46, 185, 46).line(160, 19, 160, 73);
    p.glow(160, 46, 40, C.brownLit, 0.45, [C.brown, C.brownLit, C.woodDim]);
    p.lightPool(160, 60, 70, 54, 1);

    // ---- altar -------------------------------------------------------------
    p.slab(124, 82, 72, 6, C.bone, 1);
    p.slab(128, 88, 64, 22, C.linen, 1);
    p.sweep(128, 88, 64, 22, 0, -1);
    p.ink(C.pinkLit).box(124, 82, 72, 2);
    for (const cx of [134, 184]) {
      p.slab(cx, 70, 4, 12, C.gold, 1);
      p.ink(C.yellowPale).dot(cx + 1, 68).dot(cx + 2, 68);
      p.glow(cx + 1, 68, 9, C.tan, 0.5, [C.brown, C.brownLit, C.linen, C.bone]);
    }
    p.ink(C.crimson).box(148, 76, 26, 6);
    p.ink(C.bone).line(149, 79, 172, 79);
    p.contact(124, 106, 72, 6, -2);

    // ---- organ, stage left -------------------------------------------------
    p.ink(C.gold);
    for (let i = 0; i < 8; i++) {
      const px = 20 + i * 8;
      const top = 26 + (i % 3) * 7;
      p.slab(px, top, 6, 62 - top + 26, C.gold, 1);
    }
    p.slab(14, 84, 66, 26, C.woodDim, 1);
    p.slab(20, 90, 54, 6, C.bone, 1);
    p.ink(C.ink);
    for (let x = 23; x < 72; x += 6) p.box(x, 90, 2, 4);
    p.contact(14, 104, 66, 6, -2);

    // ---- floor and pews ----------------------------------------------------
    p.floorPlane(FLOOR, p.height, C.brown, 160, 9);

    // Aisle carpet, running from the altar out towards the camera.
    p.ink(C.maroon).solid([132, FLOOR, 188, FLOOR, 208, p.height, 112, p.height]);
    p.sweep(112, FLOOR, 96, p.height - FLOOR, -1, 1);
    p.ink(C.crimson).path([132, FLOOR, 112, p.height]);
    p.ink(C.crimson).path([188, FLOOR, 208, p.height]);

    // Pews either side, growing and spreading as they come towards us.
    for (let r = 0; r < 4; r++) {
      const t = Math.pow(r / 4, 1.4);
      const y = FLOOR + 6 + t * 48;
      const back = 6 + t * 8;
      const inner = 130 - t * 22;
      const outer = 8 - t * 18;
      for (const side of [-1, 1] as const) {
        const x0 = side < 0 ? outer : 320 - inner;
        const x1 = side < 0 ? inner : 320 - outer;
        p.ink(C.brown).box(x0, y - back, x1 - x0, back);
        p.ink(C.brownLit).box(x0, y - back, x1 - x0, 2);
        p.ink(C.woodDeep).box(x0, y, x1 - x0, 3);
        p.contact(x0, y + 3, x1 - x0, 4, -2);
      }
    }

    doorways(p, DOORS);
    p.vignette(-1);
    p.depthRamp(108, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(0, 110, 126, 58);
    p.blockRect(194, 110, 126, 58);
  });

const MINISTER = new Actor({
  id: 'minister',
  x: 160,
  y: 84,
  facing: 'front',
  depth: 4,
  style: {
    hair: C.grey,
    hairStyle: 'short',
    skin: C.pink,
    top: C.black,
    shirt: C.white,
    bottom: C.black,
    shoes: C.black,
    build: 4,
    height: 29,
  },
});

export const insideChapel: RoomDef = {
  id: RoomId.InsideChapel,
  title: 'The Chapel',
  scene: insideChapelScene,

  horizon: 110,
  scaleAtHorizon: 0.62,

  entries: {
    default: { x: 160, y: 154, facing: 'back' },
    [RoomId.OutsideChapel]: { x: 160, y: 152, facing: 'back' },
  },

  describe:
    'Six pews, an organ playing something on a loop, a window with a light ' +
    'behind it, and a minister at the altar in a suit that has done this ' +
    'several thousand times.',

  populate: (g) => {
    const cast = [MINISTER];
    if (g.flag('fawnReady') && !g.flag('married')) {
      cast.push(
        new Actor({
          id: 'fawn',
          x: 200,
          y: 128,
          facing: 'left',
          depth: 11,
          style: {
            hair: C.yellow,
            hairStyle: 'bouffant',
            skin: C.pink,
            top: C.white,
            bottom: C.white,
            legwear: 'skirt',
            shoes: C.white,
            build: 3,
            height: 29,
          },
        }),
      );
    }
    return cast;
  },

  hotspots: [
    { noun: 'minister', synonyms: ['priest', 'preacher', 'reverend', 'him'], look: 'He has married four thousand couples at this altar and can do the whole thing in ninety seconds.' },
    { noun: 'organ', synonyms: ['pipes', 'organ pipes'], look: 'It is playing by itself, which is either automation or the single most committed organist in the state.' },
    { noun: 'altar', synonyms: ['table', 'book'], look: 'A white altar, two candles, and a book open at a page it is always open at.' },
    { noun: 'pews', synonyms: ['pew', 'benches', 'seats'], look: 'Six pews. Nobody has ever filled them and nobody ever will.' },
    { noun: 'window', synonyms: ['stained glass', 'glass'], look: 'A stained-glass window depicting, on close inspection, two rings and a slot machine.' },
  ],

  exits: exitsOf(DOORS),

  onEnter(g) {
    if (g.flag('fawnReady') && !g.flag('married') && !g.flag('atAltar')) {
      g.set('atAltar');
      g.say(
        'Fawn is already at the altar, talking to the minister as though she ' +
          'has met him before.',
        'She turns as you come in and holds out a hand.',
      );
    }
  },

  onCommand(g, cmd) {
    if (cmd.verb === 'marry' || cmd.is('talk', 'minister')) {
      if (g.flag('married')) {
        g.say('You are already married. It has been an eventful few minutes.');
        return true;
      }
      if (!g.flag('fawnReady')) {
        if (cmd.verb === 'marry') {
          g.say(
            'The minister looks past you, at the empty chapel, and back at you.',
            '"On your own?" he says. "That is a different service entirely."',
          );
        } else {
          g.say('"Ceremony?" he says hopefully. "Bring somebody."');
        }
        return true;
      }
      g.set('married');
      g.award(12, 'married-fawn');
      g.cue('victory');
      g.say(
        'The minister asks if you take this woman. You say you do, in a voice ' +
          'that goes somewhere unexpected halfway through.',
        'He asks Fawn the same question. She looks at you for a long moment ' +
          'and says, "I do," and something in your chest performs a manoeuvre ' +
          'it has not attempted since school.',
        'The organ swells. It has been building to this all night.',
        'Ninety seconds later you are married, and being shown, with great ' +
          'efficiency, towards a lift.',
      );
      g.goTo(RoomId.HoneymoonSuite);
      return true;
    }

    if (cmd.is('talk', 'fawn') || cmd.is('kiss', 'fawn')) {
      g.say(
        g.flag('married')
          ? 'She is already gone. You will find out where shortly.'
          : '"Ask him," she says, nodding at the minister. "That is what he is for."',
      );
      return true;
    }

    return false;
  },
};
