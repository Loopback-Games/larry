import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The front of the casino hotel. A great deal of light spent on very little
 * architecture, and a fruit stall on the corner doing quiet business.
 */
export const outsideCasinoScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 20, 22, 0xc0ffee);

    // The tower, lit from below, going up out of frame.
    p.ink(darker(C.slate)).box(56, 0, 210, 104);
    p.ink(C.slate).box(56, 0, 210, 6);
    p.ink(C.navy);
    for (let y = 12; y < 96; y += 12)
      for (let x = 64; x < 260; x += 14) p.box(x, y, 10, 8);
    p.ink(C.yellow);
    for (let y = 12; y < 96; y += 12)
      for (let x = 64; x < 260; x += 14) if ((x + y) % 5 === 0) p.box(x, y, 10, 8);

    // A colossal sign, because subtlety costs money.
    p.ink(C.maroon).box(76, 24, 170, 34);
    p.ink(C.yellow).outline(76, 24, 170, 34);
    p.ink(C.red).outline(78, 26, 166, 30);
    p.ink(C.white).box(88, 32, 146, 6).box(104, 44, 114, 5);
    p.ink(C.yellow);
    for (let x = 80; x < 244; x += 12) p.dot(x, 22).dot(x, 60);

    // The entrance canopy.
    p.ink(C.red).solid([96, 104, 226, 104, 244, 122, 78, 122]);
    p.ink(C.yellow).line(78, 122, 243, 122);
    p.ink(C.white);
    for (let x = 84; x < 242; x += 14) p.box(x, 118, 7, 4);
    p.ink(C.slate).box(100, 122, 6, 22).box(216, 122, 6, 22);

    // Glass doors, gold framed and revolving.
    p.ink(C.yellow).box(126, 96, 72, 48);
    p.ink(C.cyan).box(130, 100, 64, 44);
    p.ink(C.yellow).line(162, 100, 162, 143).line(130, 122, 193, 122);
    p.ink(C.white).path([134, 140, 156, 104]);

    // Fruit stall on the corner.
    p.ink(C.brown).box(8, 112, 76, 8);
    p.ink(darker(C.brown)).box(12, 120, 5, 26).box(74, 120, 5, 26);
    p.ink(C.green).solid([4, 100, 88, 100, 84, 112, 8, 112]);
    p.ink(C.white).path([4, 100, 88, 100]);
    p.ink(C.red);
    for (let x = 14; x < 78; x += 9) p.box(x, 106, 6, 5);
    p.ink(C.yellow);
    for (let x = 18; x < 74; x += 9) p.dot(x, 106);

    // Pavement and road.
    p.ink(C.grey).box(0, 144, p.width, 12);
    p.ink(C.white).line(0, 144, p.width - 1, 144);
    p.ink(C.black).box(0, 156, p.width, p.height - 156);
    p.ink(C.grey).line(0, 156, p.width - 1, 156);

    p.depthRamp(144, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 144);
    p.blockRect(4, 140, 86, 8);
  });

const VENDOR = new Actor({
  id: 'vendor',
  x: 46,
  y: 142,
  facing: 'front',
  depth: 8,
  style: {
    hair: C.grey,
    hairStyle: 'cap',
    skin: C.brown,
    top: C.white,
    shirt: C.white,
    bottom: C.navy,
    shoes: C.black,
    build: 4,
    height: 27,
  },
});

export const outsideCasino: RoomDef = {
  id: RoomId.OutsideCasino,
  title: 'Outside the Casino',
  scene: outsideCasinoScene,

  entries: {
    default: { x: 250, y: 160, facing: 'left' },
    [RoomId.Taxi]: { x: 292, y: 160, facing: 'left' },
    [RoomId.InsideCasino]: { x: 162, y: 150, facing: 'front' },
  },

  describe:
    'The casino tower goes up further than the screen allows, wearing a sign ' +
    'the size of a house. Under the canopy, gold doors revolve for nobody. On ' +
    'the corner, a man is selling fruit at three in the morning with no ' +
    'apparent expectation of custom.',

  populate: () => [VENDOR],

  hotspots: [
    {
      noun: 'vendor',
      synonyms: ['seller', 'man', 'stall keeper', 'him'],
      look: 'An old man behind a fruit stall, patient as furniture.',
    },
    {
      noun: 'stall',
      synonyms: ['fruit stall', 'fruit', 'apples', 'cart'],
      look: 'Apples, mostly. A few oranges that have given up. The apples are polished.',
    },
    { noun: 'casino', synonyms: ['hotel', 'tower', 'building'], look: 'Thirty storeys of hotel with a casino in the bottom of it, lit like a landing strip.' },
    { noun: 'sign', synonyms: ['big sign', 'neon'], look: 'A sign so large it has its own weather. It does not name the place. It just says OPEN, in letters eight feet high.' },
    { noun: 'doors', synonyms: ['revolving doors', 'entrance'], look: 'Gold-framed revolving doors turning slowly with nobody in them.' },
  ],

  exits: [
    { x: 126, y: 140, w: 72, h: 8, to: RoomId.InsideCasino },
    { x: 296, y: 148, w: 24, h: 20, to: RoomId.Taxi },
  ],

  onCommand(g, cmd) {
    const buyingApple =
      cmd.isAny('buy', ItemId.Apple, 'stall') || cmd.isAny('get', ItemId.Apple);

    if (buyingApple) {
      if (g.has(ItemId.Apple)) {
        g.say('You have an apple. You have no idea why you want it, but you have one.');
        return true;
      }
      if (cmd.verb === 'get' && !cmd.mentions(ItemId.Apple)) return false;
      g.give(ItemId.Apple);
      g.bump('money', -1);
      g.award(3, 'bought-apple');
      g.cue('coin');
      g.say(
        'You buy an apple, mostly to have a reason to have stopped walking.',
        'The old man polishes it on his sleeve before he hands it over, which ' +
          'is the most care anyone has taken over anything you have bought tonight.',
      );
      return true;
    }

    if (cmd.is('talk', 'vendor')) {
      g.say('"Apples," he says, and gestures at the apples, in case of confusion.');
      return true;
    }

    if (cmd.is('eat', ItemId.Apple)) {
      g.say(
        'You raise the apple, and something stops you. Not hunger. A feeling ' +
          'that this apple has a job to do, and that eating it would be a ' +
          'category error.',
      );
      return true;
    }

    return false;
  },
};
