import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** The number scrawled on the wall here opens up the rest of the night. */
export const HOTLINE_NUMBER = '555-6969';

/**
 * The washroom at Lefty's. One stall, one basin, and a wall that functions as
 * the local newspaper.
 */
export const barToiletScene = () =>
  paint((p) => {
    // Tiled walls, grouted in a colour chosen by someone in a hurry.
    p.ink(C.teal).box(0, 0, p.width, 128);
    p.ink(darker(C.teal));
    for (let y = 8; y < 128; y += 12) p.line(0, y, p.width - 1, y);
    for (let x = 0; x < p.width; x += 16) p.line(x, 0, x, 127);
    p.ink(C.black).box(0, 0, p.width, 8);

    // Graffiti: the wall does a lot of work in this town.
    p.ink(C.white);
    p.path([182, 40, 190, 34, 198, 40, 190, 46, 182, 40]);
    p.ink(C.yellow).path([210, 34, 210, 46, 218, 46]).path([224, 34, 232, 34, 232, 46, 224, 46]);
    p.ink(C.pink).path([182, 56, 196, 56]).path([202, 52, 202, 60]);
    p.ink(C.lime).path([214, 54, 222, 62, 230, 54]);
    p.ink(C.red).path([240, 36, 248, 44, 240, 52]);

    // The stall.
    p.ink(C.slate).box(24, 26, 108, 102);
    p.ink(C.black).outline(24, 26, 108, 102);
    p.ink(C.grey).box(30, 32, 96, 90);
    p.ink(C.black).line(78, 32, 78, 121);

    // The throne, and the cistern above it.
    p.ink(C.white).solid([56, 82, 100, 82, 96, 116, 60, 116]);
    p.ink(C.grey).outline(56, 82, 45, 35);
    p.ink(C.white).box(58, 74, 40, 10);
    p.ink(C.slate).line(58, 74, 97, 74);
    p.ink(C.white).box(62, 50, 32, 24);
    p.ink(C.slate).outline(62, 50, 32, 24);
    p.ink(C.grey).box(64, 52, 28, 4);
    p.ink(C.slate).box(90, 56, 4, 3);

    // Basin, taps, and a mirror that has given up.
    p.ink(C.white).solid([206, 84, 262, 84, 256, 104, 212, 104]);
    p.ink(C.grey).outline(206, 84, 57, 21);
    p.ink(C.slate).box(230, 78, 8, 7).box(216, 104, 4, 22).box(248, 104, 4, 22);
    p.ink(C.black).box(212, 92, 44, 4);
    p.ink(C.slate).box(204, 20, 60, 44);
    p.ink(C.grey).outline(204, 20, 60, 44);
    p.ink(C.white).line(208, 24, 240, 56);
    p.ink(C.black).path([232, 30, 246, 44, 238, 52]);

    // Floor, with the sort of tiling that hides a great deal.
    p.ink(C.slate).box(0, 128, p.width, p.height - 128);
    p.ink(C.grey);
    for (let x = 0; x < p.width; x += 14)
      for (let y = 130; y < p.height; y += 8) p.dot(x + ((y / 8) % 2) * 7, y);
    p.ink(C.black).line(0, 128, p.width - 1, 128);

    // Door back to the corridor.
    p.ink(C.brown).box(286, 34, 32, 94);
    p.ink(C.black).outline(286, 34, 32, 94);
    p.ink(C.yellow).dot(292, 84);

    p.depthRamp(128, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 128);
    p.blockRect(24, 128, 108, 8);
    p.blockRect(200, 128, 70, 6);
  });

export const barToilet: RoomDef = {
  id: RoomId.BarToilet,
  title: 'The Washroom',
  scene: barToiletScene,

  entries: {
    default: { x: 180, y: 150, facing: 'left' },
    [RoomId.BarHallway]: { x: 290, y: 150, facing: 'left' },
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

  exits: [{ x: 300, y: 130, w: 20, h: 30, to: RoomId.BarHallway }],

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
