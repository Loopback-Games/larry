import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** The penthouse living room, and the balcony above the hot tub terrace. */
export const penthouseLoungeScene = () =>
  paint((p) => {
    p.ink(C.white).box(0, 0, p.width, 116);
    p.ink(C.grey).box(0, 0, p.width, 8);

    // A wall of glass, and the city a long way down.
    p.ink(C.slate).box(150, 14, 160, 102);
    p.ink(C.black).box(154, 18, 152, 94);
    p.ink(C.navy).box(154, 18, 152, 58);
    p.ink(C.white).stars(154, 18, 152, 40, 26, 0x1010ff);
    p.skyline(76, 10, 30, C.black, C.yellow, 0x5150c0);
    p.ink(C.slate).line(230, 18, 230, 111);
    for (let y = 30; y < 112; y += 24) p.ink(C.slate).line(154, y, 305, y);

    // Sliding door out to the balcony.
    p.ink(C.grey).box(226, 40, 40, 72);
    p.ink(C.cyan).box(230, 44, 32, 64);
    p.ink(C.white).path([234, 104, 258, 50]);

    // Sunken seating and a low table.
    p.ink(C.brown).solid([10, 84, 128, 84, 136, 112, 2, 112]);
    p.ink(darker(C.brown)).line(2, 112, 135, 112);
    p.ink(C.yellow).box(14, 76, 108, 8);
    p.ink(C.white).box(24, 70, 24, 8).box(84, 70, 24, 8);
    p.ink(C.slate).box(44, 118, 60, 6).box(52, 124, 5, 12).box(92, 124, 5, 12);
    p.ink(C.red).box(60, 112, 10, 6);

    // A bar cart and a lamp, because this is that kind of apartment.
    p.ink(C.yellow).box(122, 96, 26, 4).box(124, 100, 3, 20).box(144, 100, 3, 20);
    p.ink(C.lime).box(128, 88, 4, 8);
    p.ink(C.red).box(136, 88, 4, 8);
    p.ink(C.slate).box(4, 40, 4, 44);
    p.ink(C.white).solid([-6, 40, 18, 40, 14, 22, -2, 22]);

    // Door to the bedroom, and the lift doors.
    p.ink(C.brown).box(60, 20, 34, 64);
    p.ink(darker(C.brown)).outline(58, 18, 38, 68);
    p.ink(C.yellow).dot(90, 54);
    p.ink(C.yellow).box(104, 24, 34, 60);
    p.ink(darker(C.yellow)).outline(104, 24, 34, 60);
    p.ink(C.brown).line(121, 26, 121, 82);

    // Floor: pale marble.
    p.ink(C.grey).box(0, 116, p.width, p.height - 116);
    p.ink(C.white);
    for (let x = 0; x < p.width; x += 40) p.line(x, 116, x - 20, p.height - 1);
    for (let y = 124; y < p.height; y += 16) p.line(0, y, p.width - 1, y);
    p.ink(C.slate).line(0, 116, p.width - 1, 116);

    // Balcony railing at the right-hand edge.
    p.ink(C.slate).box(268, 116, 5, 34);
    p.ink(C.grey).box(266, 112, 54, 4);
    for (let x = 280; x < 320; x += 12) p.ink(C.slate).box(x, 116, 4, 30);

    p.depthRamp(116, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 116);
    // Only the low table is solid down here; the lift doorway must stay clear.
    p.blockRect(44, 118, 60, 20);
    p.blockRect(264, 112, 56, 10);
  });

export const penthouseLounge: RoomDef = {
  id: RoomId.PenthouseLounge,
  title: 'The Penthouse',
  scene: penthouseLoungeScene,

  entries: {
    default: { x: 160, y: 150, facing: 'front' },
    [RoomId.Elevator]: { x: 121, y: 148, facing: 'front' },
    [RoomId.PenthouseBedroom]: { x: 78, y: 150, facing: 'right' },
    [RoomId.PenthouseHotTub]: { x: 280, y: 150, facing: 'left' },
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

  exits: [
    { x: 104, y: 116, w: 34, h: 8, to: RoomId.Elevator },
    { x: 58, y: 116, w: 38, h: 8, to: RoomId.PenthouseBedroom },
    {
      x: 288, y: 124, w: 32, h: 30,
      to: RoomId.PenthouseHotTub,
      when: (g) =>
        g.flag('ropeTied')
          ? true
          : 'It is one level down and a long way out. You would need something ' +
            'to climb.',
    },
  ],

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
