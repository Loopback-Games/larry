import { paint } from '../../engine/scene.js';
import { C, shade } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { drawTaxi } from './props.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the pavement meets the front of the building. */
const FLOOR = 118;

/**
 * The ways out, declared once.
 *
 * The scene paints these and the room's exits are derived from them, so the
 * cab is reached by walking to a cab and the alley by walking to an alley.
 */
const DOORS: readonly Doorway[] = [
  {
    to: RoomId.InsideBar,
    label: "Lefty's",
    side: 'back',
    x: 160,
    y: FLOOR,
    w: 34,
    h: 42,
    colour: C.brown,
    through: C.bronze,
    spill: C.goldLit,
  },
  { to: RoomId.DarkStreet, label: 'West', side: 'left', y: 142, w: 44 },
  { to: RoomId.Alley, label: 'Alley', side: 'right', y: 142, w: 44 },
  { to: RoomId.Taxi, label: 'Cab', side: 'back', x: 128, y: 150, w: 28, kind: 'plain' },
];

/**
 * Outside Lefty's — where the game starts. A dead-end block at two in the
 * morning: one lit doorway, a cab at the kerb, and nothing else open.
 */
export const outsideBarScene = () =>
  paint((p) => {
    // ---- night sky --------------------------------------------------------
    // Not flat black: the city throws enough light to lift the horizon.
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.gradient(0, 6, p.width, 68, C.black, C.navyDeep, 0, 1);
    p.ink(C.navyDeep).box(0, 60, p.width, 14);
    p.sweep(0, 40, p.width, 34, 0, 1);
    p.ink(C.silver).stars(0, 0, p.width, 44, 60, 0x1e5127);
    p.ink(C.steel).stars(0, 0, p.width, 60, 40, 0x51e712);
    p.skyline(70, 18, 46, C.violetDeep, C.gold, 0xbadc0de);
    p.relight(0, 24, p.width, 48, -1);

    // ---- the block --------------------------------------------------------
    // Neighbouring frontages, shut and unlit, so the bar is not a lit island
    // floating in a black void.
    p.slab(0, 62, 50, FLOOR - 62, C.asphalt, 1);
    p.slab(266, 54, 54, FLOOR - 54, C.asphalt, 1);
    p.ink(C.asphaltDeep).box(4, 92, 40, 24).box(276, 84, 38, 30);
    p.relight(0, 62, 50, FLOOR - 62, -1);
    p.relight(266, 54, 54, FLOOR - 54, -1);

    // ---- the bar ----------------------------------------------------------
    // One storey of rendered stucco over a brick base, lit from the left by a
    // streetlamp somewhere off frame. Kept well above the sky in value, or the
    // building and the night read as the same surface.
    p.slab(46, 34, 224, FLOOR - 34, C.parchment, 1);
    p.sweep(46, 34, 224, FLOOR - 34, 1, -1);
    p.ink(C.ivory).box(44, 29, 228, 5);
    p.ink(C.khaki).box(44, 34, 228, 2);
    p.bricks(46, 90, 224, 28, C.woodDeep, 7, 22);
    p.contact(46, 34, 224, 10, -2);
    // The right-hand end falls away from the lamp.
    p.relight(206, 34, 64, FLOOR - 34, -1);
    p.relight(240, 34, 30, FLOOR - 34, -1);

    // Neon over the door: a hot tube in a dark housing, throwing its own light
    // onto the render around it and into the night above.
    p.slab(112, 44, 96, 24, C.charcoal, 1);
    p.ink(C.magenta).outline(117, 48, 86, 16);
    p.ink(C.pinkLit).outline(118, 49, 84, 14);
    p.ink(C.pinkPale).dots([124, 54, 130, 54, 190, 58, 196, 58]);
    p.glow(160, 56, 34, C.plum, 0.5);
    p.lightPool(160, 62, 60, 30, 1);

    // Upper windows: two lit, two not, one with someone still awake in it.
    for (const [wx, glass] of [
      [60, C.navy],
      [108, C.goldLit],
      [212, C.navy],
    ] as const) {
      p.window(wx, 58, 34, 24, glass, C.khaki);
      if (glass !== C.navy) p.glow(wx + 17, 70, 16, C.bronze, 0.35);
    }
    p.ink(C.charcoal).box(118, 64, 7, 14);

    // Ground-floor windows, painted over from the inside.
    for (const wx of [60, 212]) {
      p.window(wx, 92, 46, 20, C.tealDeep, C.woodDeep, false);
      p.ink(C.teal).line(wx + 2, 96, wx + 42, 106);
    }

    // ---- pavement and road ------------------------------------------------
    // Pavement kept clearly lighter than the road, or the two read as one
    // surface and the kerb disappears.
    p.ink(C.concreteLit).box(0, FLOOR, p.width, 26);
    p.sweep(0, FLOOR, p.width, 26, -1, 1);
    p.ink(C.pewterLit).box(0, 142, p.width, 2);
    p.ink(C.asphalt).box(0, 144, p.width, p.height - 144);
    p.sweep(0, 144, p.width, 24, -1, 1);
    p.ink(C.gold);
    for (let x = 10; x < p.width; x += 46) p.box(x, 160, 22, 3);
    p.relight(0, 160, p.width, 8, -1);

    // Cracks and a drain, because the block has seen things.
    p.ink(C.asphaltDeep).path([24, FLOOR, 30, 128, 26, 138]).path([286, FLOOR, 292, 132]);
    p.slab(92, 130, 16, 8, C.asphalt, 1);
    p.ink(C.asphaltDeep).line(94, 133, 106, 133).line(94, 135, 106, 135);

    // The building casts a shadow across the pavement it stands on.
    p.contact(0, FLOOR, p.width, 12, -2);

    // ---- doorways ----------------------------------------------------------
    doorways(p, DOORS);

    // A doormat, because someone here has a sense of humour.
    p.slab(144, FLOOR + 2, 32, 7, C.woodDim, 1);
    p.ink(C.woodDeep).line(148, FLOOR + 5, 172, FLOOR + 5);

    // The kerbside spot beside the cab's open door, so the way into it reads
    // as somewhere to stand rather than a patch of empty road.
    p.ink(C.gold).box(114, 149, 28, 1).box(114, 160, 28, 1);
    p.ink(shade(C.gold, -2)).box(114, 150, 28, 10);
    p.lightPool(128, 155, 22, 10, 1);

    // ---- kerbside pole with a flyer ---------------------------------------
    p.slab(284, 68, 6, 50, C.woodDim, 1);
    p.ink(C.pewter).box(283, 67, 8, 3);
    p.slab(274, 84, 20, 15, C.bone, 1);
    p.ink(C.khaki).line(277, 88, 291, 88).line(277, 91, 289, 91).line(277, 94, 290, 94);

    p.vignette(-1);

    // ---- depth and movement ------------------------------------------------
    p.depthRamp(FLOOR, p.height, 5, 14);
    walls(p, FLOOR, DOORS);
    p.blockRect(278, 108, 18, 12);
    // The parked cab is solid; you walk to its door rather than through it.
    p.blockRect(158, 142, 120, 26);
  });

const TAXI = new Actor({
  id: 'taxi',
  x: 216,
  y: 168,
  depth: 15,
  width: 104,
  height: 30,
  render: (p, a) => drawTaxi(p, a.x, a.y),
});

export const outsideBar: RoomDef = {
  id: RoomId.OutsideBar,
  title: "Outside Lefty's",
  scene: outsideBarScene,

  horizon: FLOOR,
  scaleAtHorizon: 0.66,

  entries: {
    default: { x: 196, y: 138, facing: 'left' },
    [RoomId.InsideBar]: { x: 160, y: 132, facing: 'front' },
    [RoomId.Alley]: { x: 286, y: 140, facing: 'left' },
    [RoomId.DarkStreet]: { x: 34, y: 140, facing: 'right' },
    [RoomId.Taxi]: { x: 128, y: 162, facing: 'right' },
  },

  describe:
    "Lefty's Bar. The neon buzzes, the windows are too filthy to see through, " +
    'and something in the gutter has given up. This is the most promising ' +
    'place you have been all week.',

  populate: () => [TAXI],

  hotspots: [
    {
      noun: 'taxi',
      synonyms: ['cab', 'car', 'taxicab', 'driver', 'cabbie'],
      look:
        'A yellow cab idling at the kerb with its light on. The driver has ' +
        'the window down and one elbow out of it, waiting for the night to ' +
        'produce a fare.',
    },
    {
      noun: 'bar',
      synonyms: ['lefty', "lefty's", 'building', 'lefties'],
      look:
        'A single-storey brick box with a neon sign and no windows worth the ' +
        'name. The kind of establishment that does not need to advertise ' +
        'because its customers have nowhere else to go.',
    },
    {
      noun: 'neon',
      synonyms: ['neon sign', 'light'],
      look:
        'The tube flickers through what used to spell a word. Two letters ' +
        'have died and nobody has mourned them.',
    },
    {
      noun: 'door',
      synonyms: ['doorway', 'entrance', 'front door'],
      look: 'A heavy wooden door, propped very slightly open. Warm light leaks out.',
    },
    {
      noun: 'mat',
      synonyms: ['doormat', 'door mat', 'welcome mat'],
      look: 'A bristly brown mat. The word on it has been worn down to "ELCO".',
    },
    {
      noun: 'window',
      synonyms: ['windows', 'glass'],
      look:
        'Painted over from the inside, which tells you everything you need to ' +
        'know about the clientele.',
    },
    {
      noun: 'pole',
      synonyms: ['utility pole', 'post', 'flyer', 'poster', 'notice'],
      look:
        'A flyer stapled to a utility pole, curling at the corners. Most of it ' +
        'has rained away. What survives reads: "...LOST WAGES ... YOUR LUCK ... TONIGHT".',
    },
    {
      noun: 'road',
      synonyms: ['street', 'gutter', 'kerb', 'curb'],
      look: 'Wet asphalt and a broken yellow line running off into the dark.',
    },
  ],

  exits: exitsOf(DOORS),

  onEnter(g) {
    if (!g.flag('seenOpening')) {
      g.set('seenOpening');
      g.cue('theme');
      g.say(
        [
          'Lost Wages, two in the morning.',
          '',
          'You are Larry Laffer: thirty-eight years old, still living with your ' +
            'mother, and dressed in a white polyester leisure suit you believe ' +
            'is working for you.',
        ],
        [
          'Tonight you have $94, a wristwatch, and a plan so simple it barely ' +
            'deserves the word: find a woman who will have you.',
          '',
          'You have until sunrise.',
        ],
      );
    }
  },

  onCommand(g, cmd) {
    if (cmd.is('look under', 'mat') || cmd.is('get', 'mat')) {
      g.say(
        'You lift the mat, fully expecting a key.',
        'There is no key. There is a flattened cigarette end and a woodlouse ' +
          'who resents the intrusion.',
      );
      return true;
    }
    if (cmd.is('open', 'door') || cmd.is('knock', 'door')) {
      g.say('It is already open. Just walk in.');
      return true;
    }
    if (cmd.isAny('break', 'window') || cmd.isAny('hit', 'window')) {
      g.say('Lefty would break something of yours in return, and he would enjoy it.');
      return true;
    }
    if (cmd.is('read', 'pole') || cmd.is('read', 'sign')) {
      g.say('"...LOST WAGES ... YOUR LUCK ... TONIGHT". The rest has rained away.');
      return true;
    }
    return false;
  },
};
