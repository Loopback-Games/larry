import { paint } from '../../engine/scene.js';
import { C } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** The number scrawled on the wall here opens up the rest of the night. */
export const HOTLINE_NUMBER = '555-6969';


/** Where the floor meets the back of the room. */
const FLOOR = 128;

const DOORS: readonly Doorway[] = [
  { to: RoomId.BarHallway, label: 'Corridor', side: 'right', y: 148, w: 32 },
];

/**
 * The washroom at Lefty's. One stall, one basin, and a wall that functions as
 * the local newspaper.
 */
export const barToiletScene = () =>
  paint((p) => {
    // ---- tiled walls -------------------------------------------------------
    p.ink(C.teal).box(0, 0, p.width, FLOOR);
    p.sweep(0, 0, p.width, FLOOR, 1, -1);
    p.ink(C.tealDeep);
    for (let y = 10; y < FLOOR; y += 11) p.line(0, y, p.width - 1, y);
    for (let x = 0; x < p.width; x += 15) p.line(x, 0, x, FLOOR - 1);
    p.ink(C.tealLit);
    for (let y = 11; y < FLOOR; y += 11) p.line(0, y, p.width - 1, y);
    p.slab(0, 0, p.width, 10, C.asphalt, 1);

    // One dead fluorescent tube doing what it can.
    p.slab(126, 12, 68, 5, C.silver, 1);
    p.ink(C.cream).box(129, 13, 62, 2);
    p.glow(160, 17, 30, C.cyanLit, 0.35, [C.teal, C.tealLit, C.tealDeep]);
    p.lightPool(160, 30, 90, 40, 1);

    // ---- the stall ---------------------------------------------------------
    // Sized off Larry: the partition is a little taller than he is, and the
    // pan comes to about his knee. It used to be the size of an armchair.
    p.slab(20, 34, 112, 84, C.pewter, 1);
    p.sweep(22, 36, 108, 80, 0, -1);
    p.ink(C.asphalt).box(78, 36, 2, 80);
    p.ink(C.silver).box(20, 34, 112, 2);
    p.contact(20, 112, 112, 6, -2);

    // The throne, and the cistern above it.
    p.ink(C.bone).solid([64, 92, 92, 92, 89, 116, 67, 116]);
    p.ink(C.cream).line(64, 92, 91, 92);
    p.ink(C.khaki).line(67, 116, 88, 116);
    p.slab(62, 84, 32, 9, C.cream, 1);
    p.slab(66, 68, 24, 16, C.bone, 1);
    p.ink(C.khaki).box(88, 72, 3, 3);
    p.contact(60, 114, 36, 5, -2);

    // ---- basin -------------------------------------------------------------
    p.ink(C.cream).solid([206, 92, 258, 92, 253, 104, 211, 104]);
    p.ink(C.white).line(206, 92, 257, 92);
    p.ink(C.khaki).line(211, 104, 252, 104);
    p.ink(C.pewter).box(216, 104, 4, 14).box(244, 104, 4, 14);
    p.slab(228, 86, 8, 7, C.silver, 1);
    p.contact(204, 116, 56, 5, -2);

    // Mirror over it, reflecting the tiles opposite.
    p.slab(202, 34, 60, 44, C.pewter, 1);
    p.ink(C.slateDim).box(205, 37, 54, 38);
    p.sweep(205, 37, 54, 38, 1, -1);
    p.ink(C.steel).line(208, 40, 256, 72);

    // ---- graffiti ----------------------------------------------------------
    // On the wall left of the mirror, where there is room for it to be read.
    p.ink(C.cream).path([148, 44, 156, 38, 164, 44, 156, 50, 148, 44]);
    p.ink(C.goldLit).path([174, 38, 174, 50, 182, 50]).path([188, 38, 194, 38, 194, 50, 188, 50]);
    p.ink(C.pinkLit).path([148, 60, 162, 60]).path([168, 56, 168, 64]);
    p.ink(C.greenLit).path([176, 58, 184, 66, 192, 58]);
    p.ink(C.redLit).path([148, 72, 156, 80, 148, 88]);

    // ---- floor -------------------------------------------------------------
    p.ink(C.concrete).box(0, FLOOR, p.width, p.height - FLOOR);
    p.sweep(0, FLOOR, p.width, p.height - FLOOR, -1, 1);
    p.ink(C.asphalt);
    for (let i = -6; i <= 6; i++) p.line(160 + i * 24, FLOOR, 160 + i * 58, p.height - 1);
    for (let r = 1; r < 5; r++) {
      const y = FLOOR + (p.height - FLOOR) * Math.pow(r / 5, 1.7);
      p.line(0, y, p.width - 1, y);
    }
    p.contact(0, FLOOR, p.width, 10, -2);

    doorways(p, DOORS);
    p.depthRamp(128, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(24, 128, 108, 8);
    p.blockRect(200, 128, 70, 6);
  });

export const barToilet: RoomDef = {
  id: RoomId.BarToilet,
  title: 'The Washroom',
  scene: barToiletScene,

  horizon: 128,
  scaleAtHorizon: 0.7,

  entries: {
    default: { x: 200, y: 152, facing: 'left' },
    [RoomId.BarHallway]: { x: 286, y: 150, facing: 'left' },
  },

  describe:
    'A washroom in the loosest sense. One stall, one basin, and a wall covered ' +
    'in the collected wisdom of everyone who has ever stood here.',

  hotspots: [
    {
      noun: 'wall',
      synonyms: ['graffiti', 'writing', 'scrawl', 'walls'],
      look: (g) =>
        g.flag('readWall')
          ? `Among the drawings, the number ${HOTLINE_NUMBER} is still legible.`
          : 'The tiles are covered edge to edge in scrawl. Some of it might ' +
            'even be useful, if you read it properly.',
    },
    {
      noun: 'toilet',
      synonyms: ['throne', 'bowl', 'seat', 'pan'],
      look: 'It is a toilet. You have seen worse. Not many, but some.',
    },
    {
      noun: 'cistern',
      synonyms: ['tank', 'lid'],
      look: (g) =>
        g.flag('cisternOpen')
          ? 'The lid is off. Inside there is water, a float, and not much else now.'
          : 'A porcelain tank with the lid sitting slightly crooked, as though ' +
            'someone put it back in a hurry.',
    },
    { noun: 'basin', synonyms: ['sink', 'washbasin'], look: 'Cracked, but plumbed.' },
    {
      noun: 'mirror',
      look: 'Someone has scratched a shape into it. You decide it is a heart.',
    },
    { noun: 'stall', synonyms: ['cubicle', 'partition'], look: 'A metal stall, unlocked.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.isAny('sit', 'toilet', 'seat') || cmd.isBare('sit')) {
      if (g.award(1, 'sat-down')) {
        g.cue('score');
        g.say(
          'You sit down, because you have been on your feet for hours and ' +
            'because nobody is watching.',
          'From here you have an excellent view of the wall, and time to read it.',
        );
      } else {
        g.say('You sit down again. It is no more dignified the second time.');
      }
      return true;
    }

    if (cmd.is('read', 'wall') || cmd.is('look', 'wall') || cmd.is('read', 'sign')) {
      if (!g.hasAwarded('sat-down')) {
        g.say(
          'The interesting writing is lower down, near the floor. You would ' +
            'have to be sitting to read it comfortably.',
        );
        return true;
      }
      if (g.award(2, 'read-wall')) {
        g.set('readWall');
        g.cue('score');
        g.say(
          'You work through the wall like a scholar. Most of it is boasting.',
          `One entry is written more carefully than the rest, in a small neat ` +
            `hand: "FOR A GOOD TIME, AND A BETTER TIP, CALL ${HOTLINE_NUMBER}."`,
          'You commit it to memory. You have never memorised anything faster.',
        );
      } else {
        g.say(`The number is still there: ${HOTLINE_NUMBER}.`);
      }
      return true;
    }

    if (
      cmd.isAny('open', 'cistern', 'tank') ||
      cmd.isAny('look in', 'cistern', 'tank', 'toilet') ||
      cmd.isAny('move', 'cistern')
    ) {
      g.set('cisternOpen');
      if (g.has(ItemId.Ring)) {
        g.say('Just water, and a float valve going about its business.');
        return true;
      }
      g.give(ItemId.Ring);
      g.award(3, 'got-ring');
      g.cue('score');
      g.say(
        'You lift the lid off the cistern and look inside, which is not the ' +
          'behaviour of a well man.',
        'Taped to the inside wall, above the waterline, is a diamond ring.',
        'Somebody hid this here. Somebody is going to be very disappointed. ' +
          'You put it in your pocket.',
      );
      return true;
    }

    if (cmd.is('look', 'mirror')) {
      g.say(
        'You check yourself in the mirror and adjust your collar by a degree ' +
          'that will change nothing.',
      );
      return true;
    }

    if (cmd.isAny('use', 'basin') || cmd.isAny('turn on', 'basin')) {
      g.say('The tap coughs, produces rust, and thinks better of it.');
      return true;
    }

    return false;
  },
};
