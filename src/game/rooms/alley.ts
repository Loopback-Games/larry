import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The alley behind Lefty's. A dumpster, a boarded-up dispensary window, and a
 * fire escape that only goes one way.
 */
export const alleyScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.navy).box(0, 0, p.width, 24);
    p.ink(C.white).stars(0, 0, p.width, 22, 24, 0x51a11e);

    // Two brick walls closing in, with a strip of sky between them.
    p.ink(C.slate).box(0, 8, 108, 122);
    p.ink(C.grey).box(212, 8, 108, 122);
    p.bricks(0, 8, 108, 122, C.black, 7, 18);
    p.bricks(212, 8, 108, 122, C.maroon, 7, 18);
    p.ink(C.black).path([108, 8, 128, 46, 128, 130]).path([212, 8, 192, 46, 192, 130]);
    p.ink(C.slate).fill(160, 60);
    p.ink(C.black).box(128, 46, 64, 84);
    p.ink(C.navy).box(136, 54, 48, 30);
    p.ink(C.white).dots([142, 62, 156, 70, 170, 58, 178, 76]);

    // Fire escape on the left wall, coming down from the upstairs window.
    p.ink(C.slate);
    for (let i = 0; i < 6; i++) p.line(14, 30 + i * 9, 52, 30 + i * 9);
    p.line(14, 30, 14, 84).line(52, 30, 52, 84);
    p.ink(C.grey).box(10, 84, 46, 4);
    p.ink(C.slate).path([56, 86, 78, 128]);

    // The window Larry comes out of, two storeys up.
    p.ink(C.yellow).box(20, 12, 26, 16);
    p.ink(C.brown).outline(19, 11, 28, 18);

    // Dumpster.
    p.ink(C.green).solid([132, 92, 224, 92, 232, 132, 124, 132]);
    p.ink(darker(C.green)).outline(124, 92, 109, 41);
    p.ink(C.lime).line(132, 92, 223, 92);
    p.ink(C.black).line(178, 92, 178, 131);
    p.ink(darker(C.green)).box(128, 102, 100, 3);
    p.ink(C.slate).box(126, 132, 10, 8).box(220, 132, 10, 8);
    // Rubbish spilling over the lip.
    p.ink(C.brown).dots([140, 90, 152, 89, 196, 90, 208, 88]);
    p.ink(C.white).box(206, 86, 8, 5);

    // Boarded-up window in the right-hand wall.
    p.ink(C.black).box(248, 58, 54, 44);
    p.ink(C.brown);
    p.box(244, 62, 62, 7).box(244, 74, 62, 7).box(244, 86, 62, 7);
    p.ink(darker(C.brown)).line(244, 62, 305, 62).line(244, 74, 305, 74).line(244, 86, 305, 86);
    p.ink(C.slate).dots([250, 65, 300, 65, 250, 77, 300, 77, 250, 89, 300, 89]);

    // Ground: wet, littered, unloved.
    p.ink(C.slate).box(0, 130, p.width, p.height - 130);
    p.ink(C.black).line(0, 130, p.width - 1, 130);
    p.ink(darker(C.slate));
    for (let x = 0; x < p.width; x += 26) p.path([x, 134, x + 12, 142, x + 4, 152]);
    p.ink(C.navy).solid([60, 150, 100, 150, 108, 162, 52, 162]);
    p.ink(C.white).dots([70, 154, 88, 157]);

    p.depthRamp(130, p.height, 5, 14);
    p.blockRect(0, 0, p.width, 130);
    p.blockRect(118, 126, 120, 14);
  });

export const alley: RoomDef = {
  id: RoomId.Alley,
  title: 'The Alley',
  scene: alleyScene,

  entries: {
    default: { x: 40, y: 150, facing: 'front' },
    [RoomId.HookerRoom]: { x: 74, y: 146, facing: 'front' },
    [RoomId.OutsideBar]: { x: 296, y: 150, facing: 'left' },
  },

  describe:
    'A brick channel behind the bar, wide enough for a dumpster and a bad ' +
    'decision. A fire escape comes down one wall. A window in the other has ' +
    'been boarded over by someone in a hurry.',

  hotspots: [
    {
      noun: 'dumpster',
      synonyms: ['bin', 'skip', 'trash', 'rubbish', 'garbage'],
      look: (g) =>
        g.has(ItemId.Hammer)
          ? 'A green dumpster, thoroughly searched. By you. Recently.'
          : 'A green dumpster with the lid propped open. Something in there ' +
            'is catching what little light there is.',
    },
    {
      noun: 'boards',
      synonyms: ['board', 'planks', 'boarded window', 'plank'],
      look: (g) =>
        g.flag('boardsOff')
          ? 'The boards are off. Behind them is a shelf, and on the shelf, a bottle.'
          : 'Three planks nailed across a window. The nails are old and the ' +
            'wood has been rained on for years. It would not take much.',
    },
    {
      noun: 'fire escape',
      synonyms: ['ladder', 'escape', 'stairs'],
      look: 'It comes down from the window above. Getting up it again is not an option.',
    },
    { noun: 'puddle', look: 'You choose not to think about the puddle.' },
  ],

  exits: [{ x: 300, y: 132, w: 20, h: 34, to: RoomId.OutsideBar }],

  onCommand(g, cmd) {
    if (
      cmd.isAny('look in', 'dumpster') ||
      cmd.isAny('get', ItemId.Hammer) ||
      cmd.isAny('open', 'dumpster')
    ) {
      if (g.has(ItemId.Hammer)) {
        g.say('You have taken everything from that dumpster that you are willing to touch.');
        return true;
      }
      g.give(ItemId.Hammer);
      g.award(3, 'got-hammer');
      g.cue('score');
      g.say(
        'You lean into the dumpster, which is a sentence you never expected ' +
          'to be true of your evening.',
        'Under a collapsed cardboard box you find a claw hammer with tape ' +
          'around the handle. You take it, and you wash your hands in the ' +
          'puddle, which does not help.',
      );
      return true;
    }

    const prisingBoards =
      cmd.isAny('break', 'boards', 'window') ||
      cmd.isAny('hit', 'boards', 'window') ||
      cmd.isAny('open', 'boards', 'window') ||
      cmd.isAny('pull', 'boards') ||
      (cmd.mentions(ItemId.Hammer) && cmd.mentions('boards'));

    if (prisingBoards) {
      if (!g.has(ItemId.Hammer)) {
        g.say(
          'You pull at the boards with your fingers and achieve nothing except ' +
            'a splinter and a lesson.',
        );
        return true;
      }
      if (g.flag('boardsOff')) {
        g.say('The boards are already off.');
        return true;
      }
      g.set('boardsOff');
      g.cue('door');
      g.say(
        'You get the claw of the hammer under the bottom plank and lean on it.',
        'The nails give with a shriek that echoes down the alley. Behind the ' +
          'boards is a dusty shelf, and on the shelf is a bottle of pills.',
      );
      return true;
    }

    if (cmd.is('get', ItemId.Pills) || (cmd.verb === 'get' && cmd.mentions('boards'))) {
      if (g.has(ItemId.Pills)) {
        g.say('You have the pills.');
        return true;
      }
      if (!g.flag('boardsOff')) {
        g.say('Whatever is behind those boards is going to stay there for now.');
        return true;
      }
      g.give(ItemId.Pills);
      g.award(8, 'got-pills');
      g.cue('score');
      g.say(
        'You reach through the gap and take the bottle.',
        'There is no label. You shake it and it rattles encouragingly. ' +
          'Somebody, somewhere, is going to want these.',
      );
      return true;
    }

    if (cmd.isAny('climb', 'fire escape', 'ladder')) {
      g.say('The bottom section is well above your reach, and you are not the athlete you were.');
      return true;
    }

    return false;
  },
};
