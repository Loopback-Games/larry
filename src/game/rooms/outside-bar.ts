import { paint } from '../../engine/scene.js';
import { C } from '../../engine/palette.js';
import { WALK_BLOCKED } from '../../constants.js';
import { Actor } from '../../engine/actor.js';
import { drawTaxi } from './props.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * Outside Lefty's — where the game starts. A dead-end block at two in the
 * morning: one lit doorway, a hotel sign down the street, and nothing else open.
 */
export const outsideBarScene = () =>
  paint((p) => {
    // ---- night sky --------------------------------------------------------
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 56, 90, 0x1e5127);
    p.ink(C.slate).dots([36, 14, 37, 13, 38, 14, 37, 15, 36, 16, 38, 16]);
    p.skyline(74, 20, 52, C.navy, C.yellow, 0xbadc0de);

    // ---- the bar ----------------------------------------------------------
    p.ink(C.grey).box(48, 38, 220, 84);
    p.ink(C.slate).box(48, 38, 220, 4);
    p.ink(C.black).line(48, 37, 267, 37);
    p.bricks(48, 92, 220, 30, C.maroon, 6, 20);
    p.ink(C.slate).line(48, 92, 267, 92);

    // Neon sign over the door: a hot pink tube in a dark housing.
    p.ink(C.black).box(112, 48, 96, 22);
    p.ink(C.maroon).outline(112, 48, 96, 22);
    p.ink(C.pink).outline(117, 52, 86, 14);
    p.ink(C.red).outline(118, 53, 84, 12);
    p.ink(C.pink).dots([124, 58, 130, 58, 190, 60, 196, 60]);

    // Upper windows: two lit, two not, one with a silhouette in it.
    const upper = [
      [62, C.navy],
      [110, C.yellow],
      [166, C.navy],
      [222, C.yellow],
    ] as const;
    for (const [wx, glass] of upper) p.window(wx, 62, 34, 24, glass, C.slate);
    p.ink(C.brown).box(232, 68, 6, 12);

    // ---- doorway ----------------------------------------------------------
    p.ink(C.black).box(142, 88, 36, 34);
    p.ink(C.brown).outline(140, 86, 40, 36);
    p.ink(C.yellow).box(146, 92, 28, 12);
    p.ink(C.brown).box(146, 106, 28, 16);
    p.ink(C.slate).line(146, 106, 173, 106);
    p.ink(C.yellow).dot(170, 114).dot(171, 114);

    // Painted-over ground floor windows.
    p.window(62, 96, 46, 18, C.teal, C.slate, false);
    p.window(212, 96, 46, 18, C.teal, C.slate, false);
    p.ink(C.slate).line(64, 100, 106, 110).line(214, 110, 256, 100);

    // ---- street -----------------------------------------------------------
    p.ink(C.slate).box(0, 122, p.width, 18);
    p.ink(C.grey).line(0, 122, p.width - 1, 122);
    p.ink(C.black).line(0, 139, p.width - 1, 139);
    p.ink(C.black).box(0, 140, p.width, p.height - 140);
    p.ink(C.slate).line(0, 140, p.width - 1, 140);
    p.ink(C.yellow);
    for (let x = 6; x < p.width; x += 44) p.box(x, 156, 20, 3);

    // Pavement cracks and a drain, because the block has seen things.
    p.ink(C.black);
    p.path([24, 122, 30, 130, 26, 138]).path([286, 122, 292, 132]);
    p.ink(C.slate).box(96, 132, 14, 6);
    p.ink(C.black).line(98, 134, 108, 134).line(98, 136, 108, 136);

    // ---- kerbside pole with a flyer ---------------------------------------
    p.ink(C.brown).box(284, 74, 5, 50);
    p.ink(C.slate).box(283, 73, 7, 3);
    p.ink(C.white).box(276, 88, 18, 14);
    p.ink(C.slate).line(278, 92, 292, 92).line(278, 95, 290, 95).line(278, 98, 291, 98);

    // A doormat, because someone here has a sense of humour.
    p.ink(C.brown).box(144, 123, 32, 7);
    p.ink(C.black).line(148, 126, 172, 126);

    // ---- depth and movement ------------------------------------------------
    p.depthRamp(122, p.height, 5, 14);
    p.blockRect(0, 0, p.width, 122);
    p.saved((q) => q.noInk().noDepth().walk(WALK_BLOCKED).box(280, 112, 14, 14));
  });

const TAXI = new Actor({
  id: 'taxi',
  x: 66,
  y: 166,
  depth: 15,
  width: 96,
  height: 34,
  render: (p, a) => drawTaxi(p, a.x, a.y),
});

export const outsideBar: RoomDef = {
  id: RoomId.OutsideBar,
  title: "Outside Lefty's",
  scene: outsideBarScene,

  entries: {
    default: { x: 160, y: 134, facing: 'back' },
    [RoomId.InsideBar]: { x: 160, y: 132, facing: 'front' },
    [RoomId.Alley]: { x: 292, y: 134, facing: 'left' },
    [RoomId.DarkStreet]: { x: 28, y: 134, facing: 'right' },
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

  exits: [
    { x: 142, y: 122, w: 36, h: 8, to: RoomId.InsideBar },
    { x: 26, y: 146, w: 80, h: 22, to: RoomId.Taxi },
    { x: 300, y: 122, w: 20, h: 18, to: RoomId.Alley },
    { x: 0, y: 122, w: 20, h: 18, to: RoomId.DarkStreet },
  ],

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
