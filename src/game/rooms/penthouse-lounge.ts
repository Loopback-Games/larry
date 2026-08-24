import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 116;

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.PenthouseBedroom,
    label: 'Bedroom',
    side: 'back',
    x: 40,
    y: FLOOR,
    w: 34,
    h: 46,
    colour: C.brownLit,
    through: C.black,
  },
  {
    to: RoomId.Elevator,
    label: 'Lift',
    side: 'back',
    x: 282,
    y: FLOOR,
    w: 36,
    h: 46,
    kind: 'double',
    colour: C.gold,
    through: C.charcoal,
  },
  {
    to: RoomId.PenthouseHotTub,
    label: 'Terrace',
    side: 'right',
    y: 142,
    w: 30,
    when: (g) =>
      g.flag('ropeTied')
        ? true
        : 'It is one level down and a long way out. You would need something ' +
          'to climb.',
  },
];

/** The penthouse living room, and the balcony above the hot tub terrace. */
export const penthouseLoungeScene = () =>
  paint((p) => {
    // ---- shell -------------------------------------------------------------
    // A pale room with one enormous window. Both doorways sit on plain wall
    // with nothing in front of them, and the seating goes under the glass.
    p.ink(C.parchment).box(0, 0, p.width, FLOOR);
    p.sweep(0, 0, p.width, FLOOR, 1, -1);
    p.slab(0, 0, p.width, 8, C.khaki, 1);

    // ---- the window, and the city forty floors down ------------------------
    // The skyline helper draws the full width, so the wall is laid back over
    // the parts of the room the window does not reach.
    p.ink(C.black).box(0, 16, p.width, 72);
    p.gradient(0, 16, p.width, 44, C.navyDeep, C.black, 0, 1);
    p.ink(C.silver).stars(0, 16, p.width, 36, 26, 0x1010ff);
    // A silhouette body, not black, or the city is invisible against the night.
    p.skyline(88, 12, 34, C.violetDeep, C.gold, 0x5150c0);

    p.ink(C.parchment).box(0, 0, 100, FLOOR).box(246, 0, 74, FLOOR);
    p.sweep(0, 0, 100, FLOOR, 1, -1);
    p.sweep(246, 0, 74, FLOOR, 1, -1);
    p.slab(0, 0, p.width, 8, C.khaki, 1);

    // Window frame and mullions.
    p.ink(C.linen).box(96, 12, 8, 80).box(242, 12, 8, 80);
    p.ink(C.linen).box(96, 12, 154, 5).box(96, 87, 154, 5);
    p.ink(C.bone).box(170, 17, 3, 70);
    p.ink(C.khaki).box(96, 91, 154, 2);
    p.contact(96, 17, 154, 8, -2);

    // ---- sunken seating, under the glass -----------------------------------
    p.ink(C.brown).solid([104, 94, 240, 94, 248, 116, 96, 116]);
    p.sweep(96, 94, 152, 22, 1, -1);
    p.ink(C.brownLit).line(104, 94, 239, 94);
    p.ink(C.tan).box(110, 88, 128, 7);
    p.slab(120, 82, 26, 8, C.cream, 1);
    p.slab(196, 82, 26, 8, C.cream, 1);
    p.contact(96, 112, 152, 8, -2);

    // ---- a bar cart, because this is that kind of apartment ----------------
    p.slab(258, 92, 32, 5, C.gold, 1);
    p.ink(C.brass).box(261, 97, 3, 18).box(284, 97, 3, 18);
    p.ink(C.greenDim).box(264, 84, 4, 9);
    p.ink(C.crimson).box(272, 84, 4, 9);
    p.contact(256, 113, 36, 5, -2);

    // A standard lamp, and the pool of light it puts on the wall.
    p.ink(C.pewter).box(76, 44, 4, 44);
    p.ink(C.cream).solid([66, 44, 92, 44, 88, 24, 70, 24]);
    p.glow(79, 40, 30, C.bone, 0.4, [C.parchment, C.linen, C.bone]);

    // ---- floor -------------------------------------------------------------
    p.floorPlane(FLOOR, p.height, C.pewter, 180, 9);
    p.relight(0, FLOOR, p.width, p.height - FLOOR, 1);

    // A low table, out in front of the seating and clear of both doorways.
    p.slab(128, 130, 54, 6, C.pewter, 1);
    p.ink(C.asphalt).box(134, 136, 5, 12).box(172, 136, 5, 12);
    p.ink(C.crimson).box(146, 124, 12, 6);
    p.contact(128, 146, 54, 5, -2);


    // ---- balcony railing, right edge ---------------------------------------
    p.slab(296, 122, 24, 4, C.silver, 1);
    for (let x = 300; x < p.width; x += 10) p.slab(x, 126, 3, 24, C.pewter, 1);

    doorways(p, DOORS);
    p.depthRamp(116, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    // Only the low table is solid down here; both doorways must stay clear.
    p.blockRect(128, 130, 54, 18);
    p.blockRect(250, 110, 46, 8);
  });

export const penthouseLounge: RoomDef = {
  id: RoomId.PenthouseLounge,
  title: 'The Penthouse',
  scene: penthouseLoungeScene,

  horizon: 116,
  scaleAtHorizon: 0.66,

  entries: {
    default: { x: 212, y: 152, facing: 'front' },
    [RoomId.Elevator]: { x: 282, y: 132, facing: 'front' },
    [RoomId.PenthouseBedroom]: { x: 40, y: 132, facing: 'front' },
    [RoomId.PenthouseHotTub]: { x: 282, y: 146, facing: 'left' },
  },

  describe:
    'The penthouse. A wall of glass with the whole city underneath it, pale ' +
    'marble, a sunken seat, and a bar cart. Through the sliding door there is ' +
    'a balcony, and below the balcony, one level down, a lit terrace with a ' +
    'hot tub on it. There is somebody in the hot tub.',

  hotspots: [
    { noun: 'glass', synonyms: ['windows', 'wall of glass', 'view'], look: 'Thirty storeys of nothing, and then Lost Wages, looking almost pretty from up here.' },
    {
      noun: 'balcony',
      synonyms: ['railing', 'rail', 'terrace', 'ledge'],
      look: (g) =>
        g.flag('ropeTied')
          ? 'Your rope is tied to the railing and hangs down to the terrace below.'
          : 'A balcony with a steel railing. One level below and slightly out ' +
            'from the building is a lit terrace with a hot tub on it.',
    },
    { noun: 'tub', synonyms: ['hot tub', 'jacuzzi'], look: 'From up here you can see steam, water, and one person in it who is not thinking about you at all.' },
    { noun: 'cart', synonyms: ['bar cart', 'drinks'], look: 'A drinks trolley with two bottles on it and nobody drinking from either.' },
    { noun: 'bedroom door', synonyms: ['bedroom'], look: 'A door standing slightly open on a dark bedroom.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    const tying =
      (cmd.verb === 'tie' && (cmd.mentions(ItemId.Rope) || cmd.mentions('balcony'))) ||
      (cmd.verb === 'use' && cmd.mentions(ItemId.Rope));

    if (tying) {
      if (!g.has(ItemId.Rope)) {
        g.say('You have nothing to tie.');
        return true;
      }
      if (g.flag('ropeTied')) {
        g.say('The rope is tied and hanging. Climb down it.');
        return true;
      }
      g.set('ropeTied');
      g.cue('door');
      g.say(
        'You tie the rope to the balcony railing, using a knot you are ' +
          'inventing as you go.',
        'It reaches the terrace below with room to spare. Somewhere in this ' +
          'city, a woman is spending your money, and it turns out she gave you ' +
          'the rope to do this with.',
      );
      return true;
    }

    if (cmd.verb === 'climb' || cmd.verb === 'down') {
      if (!g.flag('ropeTied')) {
        g.say('There is nothing to climb down. It is a straight drop onto a terrace.');
        return true;
      }
      g.goTo(RoomId.PenthouseHotTub);
      return true;
    }

    if (cmd.verb === 'jump') {
      g.die(
        'You climb over the railing and jump for the terrace below.',
        'You are thirty-eight years old, you have not exercised since 1971, ' +
          'and you are wearing shoes with no grip whatsoever.',
        'You miss the terrace.',
        '*** You have fallen thirty storeys ***',
      );
      return true;
    }

    return false;
  },
};
