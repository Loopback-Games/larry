import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { propHeight, personWidthAt } from '../scale.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 114;
/** Perspective, declared here so the furniture can be sized off the figure. */
const AT_HORIZON = 0.62;

const DOORS: readonly Doorway[] = [
  { to: RoomId.InsideCasino, label: 'Casino floor', side: 'front', x: 160, w: 48 },
];

/** Jokes the comedian works through, in order, for an audience of one. */
const ROUTINE: readonly string[] = [
  '"Good evening, Lost Wages! Or, as the sign at the city limits has it, ' +
    '\'Lost Wages: You Were Going To Spend It Anyway\'."',
  '"I flew in this afternoon. Terrible flight. The pilot came on and said, ' +
    '\'Folks, we are experiencing some turbulence, and also I am experiencing ' +
    'some doubt\'."',
  '"You are a wonderful audience. Both of you. And one of you is the drummer."',
  '"A man walks into a bar in this town and says, \'I will have whatever the ' +
    'floor is having\'."',
  '"My wife said, \'You never take me anywhere expensive.\' So I took her to ' +
    'the petrol station."',
  '"Thank you, you have been marvellous, and by marvellous I mean present."',
];

/** The hotel lounge: a small stage, a drummer, and eleven empty tables. */
export const loungeScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);

    // Curtain across the back wall.
    p.ink(C.maroon).box(0, 0, p.width, 100);
    p.ink(darker(C.maroon));
    for (let x = 4; x < p.width; x += 11) p.line(x, 0, x + 3, 99);
    p.ink(C.red);
    for (let x = 9; x < p.width; x += 11) p.line(x, 0, x + 3, 99);

    // Stage, lit by two follow spots.
    p.ink(darker(C.brown)).box(56, 84, 208, 30);
    p.ink(C.brown).line(56, 84, 263, 84);
    p.ink(C.black).line(56, 114, 263, 114);
    p.ink(darker(C.yellow)).solid([96, 0, 128, 0, 152, 84, 88, 84]);
    p.ink(darker(C.yellow)).solid([196, 0, 228, 0, 236, 84, 172, 84]);

    // Microphone stand.
    p.ink(C.slate).box(158, 40, 3, 46);
    p.ink(C.black).solid([152, 34, 168, 34, 166, 42, 154, 42]);
    p.ink(C.grey).box(150, 84, 20, 3);

    // Drum kit, upstage right.
    p.ink(C.white).solid([214, 90, 250, 90, 254, 112, 210, 112]);
    p.ink(C.red).line(214, 90, 249, 90);
    p.ink(C.yellow).box(206, 78, 22, 3).box(238, 74, 20, 3);
    p.ink(C.slate).box(216, 81, 2, 12).box(247, 77, 2, 16);
    p.ink(C.white).box(202, 96, 14, 10);

    // Tables in the dark, each with a candle.
    p.ink(C.black).box(0, 114, p.width, p.height - 114);
    for (const [tx, base] of [
      [40, 138], [130, 143], [232, 141], [86, 164], [196, 166], [286, 162],
    ] as const) {
      const h = propHeight('tableTop', base, FLOOR, AT_HORIZON);
      const r = Math.round(personWidthAt(base, FLOOR, AT_HORIZON) * 1.1);
      const ty = base - h;
      const apron = Math.max(2, Math.round(h * 0.4));
      p.ink(darker(C.slate)).solid([
        tx - r, ty,
        tx + r, ty,
        tx + r - 3, ty + apron,
        tx - r + 3, ty + apron,
      ]);
      p.ink(C.slate).line(tx - r, ty, tx + r - 1, ty);
      p.ink(C.black).box(tx - 2, ty + apron, 4, base - ty - apron);
      p.ink(C.red).box(tx - 3, ty - 7, 6, 7);
      p.ink(C.yellow).dot(tx, ty - 9).dot(tx, ty - 10);
    }

    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.depthRamp(114, p.height, 6, 14);
  });

const COMEDIAN = new Actor({
  id: 'comedian',
  x: 138,
  y: 86,
  facing: 'front',
  depth: 5,
  style: {
    hair: C.brown,
    hairStyle: 'short',
    skin: C.pink,
    top: C.cyan,
    shirt: C.white,
    accent: C.red,
    bottom: C.navy,
    shoes: C.black,
    build: 4,
    height: 28,
  },
});

const DRUMMER = new Actor({
  id: 'drummer',
  x: 232,
  y: 90,
  facing: 'front',
  depth: 4,
  style: {
    hair: C.black,
    hairStyle: 'long',
    skin: C.pink,
    top: C.purple,
    bottom: C.black,
    shoes: C.black,
    build: 3,
    height: 22,
  },
});

export const lounge: RoomDef = {
  id: RoomId.Lounge,
  title: 'The Lounge',
  scene: loungeScene,

  horizon: FLOOR,
  scaleAtHorizon: AT_HORIZON,

  entries: { default: { x: 160, y: 150, facing: 'back' } },

  describe:
    'A low room with a curtain, a small stage, and eleven empty tables with ' +
    'candles on them. A comedian is working. A drummer is punctuating. Neither ' +
    'of them is going to stop just because nobody came.',

  populate: () => [COMEDIAN, DRUMMER],

  hotspots: [
    { noun: 'comedian', synonyms: ['comic', 'man', 'him', 'entertainer'], look: 'A man in a powder-blue jacket delivering material to a room that is, generously, one third full of you.' },
    { noun: 'drummer', synonyms: ['drums', 'kit', 'her'], look: 'She hits the cymbal after every punchline with the timing of a metronome and the enthusiasm of a hostage.' },
    { noun: 'stage', synonyms: ['platform'], look: 'A stage about the size of a generous doormat.' },
    { noun: 'tables', synonyms: ['table', 'candles', 'candle'], look: 'Eleven tables, eleven candles, no people.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.isBare('sit') || cmd.isAny('sit', 'tables', 'stage')) {
      if (g.award(1, 'sat-in-lounge')) {
        g.cue('score');
        g.say(
          'You sit down at a table near the front, which the comedian ' +
            'immediately takes as a commitment.',
          ROUTINE[0],
          'The drummer hits the cymbal. You are the entire audience, and you ' +
            'have never felt more responsible for anything.',
        );
      } else {
        const n = g.bump('jokeIndex') % ROUTINE.length;
        g.say(ROUTINE[n], 'The cymbal. Every time, the cymbal.');
      }
      return true;
    }

    if (cmd.is('talk', 'comedian') || cmd.isBare('talk') || cmd.verb === 'listen') {
      const n = g.bump('jokeIndex') % ROUTINE.length;
      g.say(ROUTINE[n]);
      return true;
    }

    if (cmd.isAny('talk', 'drummer')) {
      g.say('She looks at you over the cymbal and does not stop playing.');
      return true;
    }

    return false;
  },
};
