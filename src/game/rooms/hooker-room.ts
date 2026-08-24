import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';


/** Where the floor meets the back of the room. */
const FLOOR = 126;

const DOORS: readonly Doorway[] = [
  { to: RoomId.BarBackroom, label: 'Landing', side: 'left', y: 150, w: 30 },
  {
    to: RoomId.Alley,
    label: 'Fire escape',
    side: 'right',
    y: 146,
    w: 32,
    when: (g) =>
      g.hasAwarded('went-to-bed')
        ? true
        : 'You have not finished what you came up here for.',
  },
];

/**
 * The room at the top of the stairs. Red light, a bed, and a window that opens
 * onto the alley, which turns out to be the only way out.
 */
export const hookerRoomScene = () =>
  paint((p) => {
    p.ink(C.maroon).box(0, 0, p.width, 126);
    p.ink(darker(C.maroon)).box(0, 0, p.width, 10);

    // Flock wallpaper, in the sense that it was once a pattern.
    p.ink(C.red);
    for (let y = 16; y < 120; y += 18)
      for (let x = 10; x < p.width; x += 24) {
        p.dot(x, y).dot(x + 1, y).dot(x, y + 1).dot(x + 1, y + 1);
        p.dot(x + 12, y + 9).dot(x + 13, y + 9);
      }

    // A lamp with a scarf over it, which is this room's entire lighting design.
    p.ink(C.black).box(28, 60, 4, 40);
    p.ink(C.pink).solid([16, 60, 44, 60, 40, 42, 20, 42]);
    p.ink(C.red).line(16, 60, 43, 60);
    p.ink(C.brown).box(20, 100, 20, 5);

    // The bed: brass frame, red cover, more pillows than anyone needs.
    p.ink(C.yellow).box(70, 62, 5, 60).box(216, 70, 5, 52);
    p.ink(C.yellow).box(70, 62, 151, 5);
    for (let x = 80; x < 216; x += 16) p.ink(C.yellow).box(x, 64, 3, 12);
    p.ink(C.red).solid([72, 92, 220, 92, 232, 128, 60, 128]);
    p.ink(darker(C.red)).line(60, 128, 231, 128);
    p.ink(C.pink).solid([78, 82, 128, 82, 132, 96, 74, 96]);
    p.ink(C.white).solid([84, 84, 122, 84, 124, 94, 82, 94]);
    p.ink(C.maroon).box(66, 122, 160, 6);

    // The window onto the alley, sash up, curtain moving.
    p.ink(C.black).box(244, 30, 60, 66);
    p.ink(C.brown).outline(242, 28, 64, 70);
    p.ink(C.navy).box(248, 34, 52, 28);
    p.ink(C.white).dots([256, 40, 268, 46, 284, 38, 292, 52, 262, 56]);
    p.ink(C.brown).line(244, 62, 303, 62).line(273, 34, 273, 61);
    p.ink(C.pink).solid([300, 30, 306, 30, 304, 92, 296, 92]);

    // A small table with a box on it.
    p.ink(C.brown).box(150, 100, 44, 5).box(154, 105, 4, 22).box(186, 105, 4, 22);
    p.ink(C.pink).box(160, 92, 24, 8);
    p.ink(C.red).line(160, 96, 183, 96);

    // Floor.
    p.ink(C.brown).box(0, 126, p.width, p.height - 126);
    p.ink(darker(C.brown));
    for (let y = 130; y < p.height; y += 7) p.line(0, y, p.width - 1, y);
    p.ink(C.maroon).box(40, 140, 120, 22);
    p.ink(C.red).outline(40, 140, 120, 22);

    // Door back to the stairs.
    p.ink(C.black).box(0, 40, 26, 86);
    p.ink(C.brown).outline(0, 38, 28, 88);
    p.ink(C.yellow).dot(22, 86);

    p.depthRamp(126, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(56, 122, 176, 12);
  });

const HOST = new Actor({
  id: 'host',
  x: 250,
  y: 148,
  facing: 'left',
  style: {
    hair: C.black,
    hairStyle: 'long',
    skin: C.pink,
    top: C.red,
    bottom: C.red,
    legwear: 'skirt',
    shoes: C.black,
    build: 3,
    height: 29,
  },
});

export const hookerRoom: RoomDef = {
  id: RoomId.HookerRoom,
  title: 'Upstairs Room',
  scene: hookerRoomScene,

  horizon: 126,
  scaleAtHorizon: 0.7,

  entries: {
    default: { x: 56, y: 152, facing: 'right' },
    [RoomId.BarBackroom]: { x: 42, y: 152, facing: 'right' },
  },

  describe:
    'A small red room with a large brass bed, a lamp wearing a scarf, and a ' +
    'window propped open onto the alley. The woman who works here looks at you ' +
    'with the resigned patience of a dentist.',

  populate: () => [HOST],

  hotspots: [
    {
      noun: 'woman',
      synonyms: ['lady', 'her', 'hostess', 'she'],
      look:
        'She has been doing this longer than you have been thinking about it, ' +
        'and it shows in the most unflattering way possible: she is not ' +
        'nervous at all.',
    },
    {
      noun: 'bed',
      synonyms: ['brass bed', 'mattress'],
      look: 'A brass bed with a red cover and an alarming number of pillows.',
    },
    {
      noun: 'candy',
      synonyms: ['box of candy', 'chocolates', 'sweets'],
      look: 'A heart-shaped box of chocolates on the side table, from an admirer with no imagination.',
    },
    {
      noun: 'window',
      synonyms: ['sash', 'curtain'],
      look: 'The sash is up. Below it is the alley, two storeys down but reachable.',
    },
    { noun: 'lamp', look: 'A lamp with a pink scarf over the shade. Romantic, and a fire risk.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.is('wear', ItemId.Condom) || cmd.is('use', ItemId.Condom)) {
      if (!g.has(ItemId.Condom)) {
        g.say('You do not have one. This is the single most important fact about tonight.');
        return true;
      }
      if (g.flag('protected')) {
        g.say('Already handled. Once is sufficient.');
        return true;
      }
      g.set('protected');
      g.award(10, 'wore-protection');
      g.cue('score');
      g.say(
        'You take a moment in the corner to prepare, with all the grace of a ' +
          'man assembling flat-pack furniture.',
        'You have never been so pleased with yourself for reading a magazine.',
      );
      return true;
    }

    if (
      cmd.isAny('sleep', 'bed') ||
      cmd.isAny('enter', 'bed') ||
      cmd.isAny('use', 'bed') ||
      cmd.isAny('kiss', 'woman') ||
      cmd.isBare('sleep')
    ) {
      if (!g.flag('protected')) {
        g.die(
          'You get into bed. She sighs and turns off the lamp.',
          'The screen goes dark, which is the kindest thing this game will ever do for you.',
          'Some weeks later, in a clinic waiting room, you have time to reflect ' +
            'on the fact that the liquor store sold protection and you walked ' +
            'straight past it.',
          '*** You have died of poor planning ***',
        );
        return true;
      }
      if (g.hasAwarded('went-to-bed')) {
        g.say('She points at the window. Your welcome has a shape, and this is the edge of it.');
        return true;
      }
      g.award(11, 'went-to-bed');
      g.set('scored');
      g.cue('victory');
      g.say(
        'She turns off the lamp.',
        'The screen goes dark for a period of time that the game will describe ' +
          'as "an interval" and you will remember as "the evening".',
        'The lamp comes back on. She is already looking for her shoes, and you ' +
          'are already looking for something to say. Neither search goes well.',
        'She nods at the window. "Stairs are for customers with manners."',
      );
      return true;
    }

    if (cmd.is('remove', ItemId.Condom) || cmd.is('remove', ItemId.UsedCondom)) {
      if (!g.hasAwarded('went-to-bed')) {
        g.say('Leave it. You worked hard for that.');
        return true;
      }
      if (g.has(ItemId.UsedCondom)) {
        g.say('It is off. It is in your pocket. Let us all move on.');
        return true;
      }
      g.take(ItemId.Condom);
      g.give(ItemId.UsedCondom);
      g.award(1, 'removed-protection');
      g.cue('score');
      g.say(
        'You tidy up, and pocket the evidence, because there is a police ' +
          'officer in this town with nothing better to do.',
      );
      return true;
    }

    if (cmd.is('get', ItemId.Candy)) {
      if (g.has(ItemId.Candy)) {
        g.say('You already have the chocolates.');
        return true;
      }
      if (!g.hasAwarded('went-to-bed')) {
        g.say('Helping yourself to her chocolates before you have even said hello is a bit much.');
        return true;
      }
      g.give(ItemId.Candy);
      g.award(2, 'got-candy');
      g.cue('score');
      g.say(
        'On your way past the table you take the box of chocolates.',
        'She sees you do it and says nothing, which is somehow worse.',
      );
      return true;
    }

    if (cmd.is('talk', 'woman')) {
      g.say(
        g.hasAwarded('went-to-bed')
          ? '"The window," she says, without looking up.'
          : '"You want to talk?" she says. "That is extra, and you cannot afford it."',
      );
      return true;
    }

    if (cmd.isAny('open', 'window') || cmd.isAny('enter', 'window')) {
      g.say(
        g.hasAwarded('went-to-bed')
          ? 'You climb out onto the ledge and start down towards the alley.'
          : 'It is already open, and you have only just arrived.',
      );
      return true;
    }

    return false;
  },
};
