import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 118;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideCasino, label: 'Street', side: 'front', x: 160, w: 46 },
  {
    to: RoomId.Slots,
    label: 'Slot machines',
    side: 'back',
    x: 48,
    y: FLOOR,
    w: 34,
    h: 44,
    kind: 'arch',
    colour: C.gold,
    through: C.maroonDeep,
  },
  {
    to: RoomId.Lounge,
    label: 'Lounge',
    side: 'back',
    x: 132,
    y: FLOOR,
    w: 34,
    h: 44,
    kind: 'arch',
    colour: C.gold,
    through: C.violetDeep,
  },
  {
    to: RoomId.Blackjack,
    label: 'Card tables',
    side: 'back',
    x: 212,
    y: FLOOR,
    w: 34,
    h: 44,
    kind: 'arch',
    colour: C.gold,
    through: C.greenDeep,
  },
  {
    to: RoomId.ElevatorLobby,
    label: 'Lifts',
    side: 'back',
    x: 288,
    y: FLOOR,
    w: 34,
    h: 44,
    kind: 'arch',
    colour: C.gold,
    through: C.tealDeep,
  },
];

/**
 * The casino floor. Slot machines down one wall, a card table, a lift to the
 * hotel, and a lounge whose door is doing nothing to contain the drumming.
 *
 * Four ways on from here, so each one is a signposted alcove in the back wall
 * rather than an unmarked band of carpet: this room is where walking into the
 * wrong thing used to be easiest.
 */
export const insideCasinoScene = () =>
  paint((p) => {
    // ---- shell -------------------------------------------------------------
    p.ink(C.maroon).box(0, 0, p.width, FLOOR);
    p.sweep(0, 0, p.width, FLOOR, 2, 0);
    p.slab(0, 0, p.width, 12, C.maroonDeep, 1);
    p.ink(C.gold).box(0, 12, p.width, 1);

    // Flock wallpaper: sparse, low contrast, and only on the upper wall, so it
    // reads as texture instead of competing with everything in front of it.
    p.ink(C.crimson);
    for (let y = 20; y < 64; y += 16)
      for (let x = 10; x < p.width; x += 26) {
        p.path([x, y, x + 5, y + 5, x, y + 10, x - 5, y + 5]);
      }


    // A rail of bulbs running the length of the wall, and the light it throws.
    for (let x = 14; x < p.width; x += 28) {
      p.ink(C.yellowPale).dot(x, 18).dot(x + 1, 18);
      p.glow(x, 18, 12, C.crimson, 0.4, [C.maroon, C.crimson, C.maroonDeep]);
    }

    // ---- the four alcoves --------------------------------------------------
    // Each one is a recess with a sign over it. The arches themselves and the
    // triggers underneath them both come from DOORS.
    const SIGNS = [
      [48, 'SLOTS', C.gold],
      [132, 'LOUNGE', C.pinkLit],
      [212, 'TABLES', C.greenLit],
      [288, 'HOTEL', C.cyanLit],
    ] as const;
    for (const [sx, text, colour] of SIGNS) {
      p.slab(sx - 26, FLOOR - 58, 52, 12, C.ink, 1);
      p.ink(colour).textCentred(text, sx, FLOOR - 54, 1, 0);
      p.glow(sx, FLOOR - 52, 16, C.crimson, 0.4, [C.maroon, C.crimson, C.maroonDeep]);
    }

    // ---- floor -------------------------------------------------------------
    // Patterned carpet, but held well below the wall in value so the two never
    // read as the same surface. They used to share a texture and a brightness.
    p.floorPlane(FLOOR, p.height, C.violet, 160, 9);
    p.ink(C.lavender);
    for (let r = 0; r < 4; r++) {
      const y = FLOOR + 8 + Math.pow(r / 4, 1.5) * 46;
      const step = 18 + r * 8;
      for (let x = (r % 2) * step; x < p.width; x += step * 2) {
        p.dots([x, y, x + 2, y + 2, x + 4, y, x + 2, y - 2]);
      }
    }
    p.contact(0, FLOOR, p.width, 12, -2);

    doorways(p, DOORS);
    p.depthRamp(118, p.height, 5, 14);
    // Only the wall and its fittings are solid; the whole carpet is walkable.
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
  });

export const insideCasino: RoomDef = {
  id: RoomId.InsideCasino,
  title: 'The Casino Floor',
  scene: insideCasinoScene,

  horizon: 118,
  scaleAtHorizon: 0.6,

  entries: {
    default: { x: 160, y: 148, facing: 'back' },
    [RoomId.OutsideCasino]: { x: 160, y: 152, facing: 'back' },
    [RoomId.Slots]: { x: 48, y: 130, facing: 'front' },
    [RoomId.Lounge]: { x: 132, y: 130, facing: 'front' },
    [RoomId.Blackjack]: { x: 212, y: 130, facing: 'front' },
    [RoomId.ElevatorLobby]: { x: 288, y: 130, facing: 'front' },
  },

  describe:
    'Three slot machines, one card table, a carpet designed to hide anything, ' +
    'and the constant small noise of money changing hands. A lift stands open ' +
    'at the far end. Somewhere behind a curtained doorway, a drummer is ' +
    'working very hard for very few people.',

  hotspots: [
    { noun: 'slots', synonyms: ['slot machine', 'slot machines', 'machines', 'fruit machine'], look: 'Three one-armed bandits, all showing the same three losing symbols.' },
    { noun: 'blackjack table', synonyms: ['card table', 'table', 'blackjack', 'twenty one'], look: 'A green baize table with a dealer shoe and nobody sitting at it.' },
    { noun: 'lift', synonyms: ['elevator', 'lift doors'], look: 'Gold lift doors, standing open, waiting.' },
    { noun: 'lounge door', synonyms: ['curtain', 'lounge', 'doorway'], look: 'A curtained doorway with a pink sign over it. The drumming is coming from in there.' },
    {
      noun: 'card',
      synonyms: ['pass', 'membership card', 'little table', 'side table'],
      look: (g) =>
        g.has(ItemId.DiscoPass)
          ? 'The side table is empty now.'
          : 'There is a card lying on a side table by the wall. Somebody has ' +
            'put down a drink, and a membership card, and left with the drink.',
    },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.is('get', ItemId.DiscoPass) || cmd.is('get', 'card')) {
      if (g.has(ItemId.DiscoPass)) {
        g.say('You have the card.');
        return true;
      }
      g.give(ItemId.DiscoPass);
      g.award(1, 'got-pass');
      g.cue('score');
      g.say(
        'You pick the card up off the side table with the unhurried movement ' +
          'of a man collecting his own property.',
        'It is a membership card for a discotheque. It has somebody else\'s ' +
          'name on it, in a font small enough that this may not matter.',
      );
      return true;
    }

    if (cmd.isAny('play', 'slots') || cmd.isAny('use', 'slots')) {
      g.say('The machines are along the wall. Walk over to them.');
      return true;
    }

    return false;
  },
};
