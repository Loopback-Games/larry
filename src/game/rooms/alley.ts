import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 130;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideBar, label: 'Street', side: 'right', y: 150, w: 34 },
];

/**
 * The alley behind Lefty's. A dumpster, a boarded-up dispensary window, and a
 * fire escape that only goes one way.
 */
export const alleyScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);

    // ---- a slot of sky, two walls closing in -------------------------------
    p.ink(C.navyDeep).box(112, 0, 96, 40);
    p.gradient(112, 0, 96, 40, C.navyDeep, C.navy, 0, 0.6);
    p.ink(C.silver).stars(114, 2, 92, 34, 16, 0x51a11e);

    // Left wall: in shadow, receding.
    p.ink(C.asphalt).solid([0, 0, 112, 26, 112, FLOOR + 8, 0, p.height]);
    p.bricks(0, 0, 118, FLOOR + 20, C.asphaltDeep, 7, 18);
    p.sweep(0, 0, 118, p.height, -1, 1);

    // Right wall: catches what light there is from the street end.
    p.ink(C.concrete).solid([p.width, 0, 208, 26, 208, FLOOR + 8, p.width, p.height]);
    p.bricks(202, 0, 122, FLOOR + 20, C.maroonDeep, 7, 18);
    p.sweep(202, 0, 122, p.height, -1, 1);
    p.relight(280, 0, 40, p.height, 1);

    // Brickwork is laid as a rectangle, so put the sky back over the top
    // corners the walls do not actually reach.
    p.ink(C.black).solid([0, -1, 112, -1, 112, 26, 0, 0]);
    p.ink(C.black).solid([208, -1, p.width, -1, p.width, 0, 208, 26]);

    // The far end of the alley: a blank wall and a lit window above it.
    p.slab(112, 26, 96, FLOOR - 26, C.asphalt, 1);
    p.sweep(112, 26, 96, FLOOR - 26, -1, 0);
    p.window(136, 44, 46, 26, C.gold, C.asphaltDeep);
    p.glow(159, 57, 26, C.concrete, 0.4, [C.asphalt, C.asphaltDeep, C.concrete]);

    // ---- fire escape, left wall -------------------------------------------
    p.ink(C.pewter);
    for (let i = 0; i < 6; i++) p.line(16, 34 + i * 9, 54, 34 + i * 9);
    p.line(16, 34, 16, 88).line(54, 34, 54, 88);
    p.slab(12, 88, 48, 4, C.pewter, 1);
    p.ink(C.asphalt).path([58, 90, 82, FLOOR]);
    p.ink(C.pewterLit).path([56, 90, 80, FLOOR]);

    // The window Larry comes out of, two storeys up.
    p.slab(20, 14, 28, 20, C.gold, 1);
    p.ink(C.woodDim).outline(19, 13, 30, 22);
    p.glow(34, 24, 20, C.concrete, 0.4, [C.asphalt, C.asphaltDeep]);

    // ---- dumpster ----------------------------------------------------------
    // Sat on the ground with a shadow under it, so it stops floating.
    p.ink(C.greenDim).solid([134, 88, 222, 88, 230, 130, 126, 130]);
    p.ink(C.green).line(134, 88, 221, 88);
    p.ink(C.greenDeep).line(126, 130, 229, 130);
    p.sweep(126, 88, 106, 42, 0, -1);
    p.ink(C.greenDeep).box(130, 100, 96, 2).line(178, 88, 178, 129);
    p.ink(C.greenLit).box(130, 90, 96, 1);
    p.slab(126, 130, 12, 9, C.asphalt, 1);
    p.slab(218, 130, 12, 9, C.asphalt, 1);
    // Rubbish spilling over the lip.
    p.ink(C.woodDim).dots([142, 86, 154, 85, 198, 86, 210, 84]);
    p.slab(204, 82, 10, 5, C.bone, 1);

    // ---- boarded-up window, right wall -------------------------------------
    p.ink(C.ink).box(250, 56, 52, 46);
    for (const by of [60, 72, 84]) {
      p.slab(246, by, 62, 8, C.woodDim, 1);
      p.ink(C.woodDeep).dots([252, by + 3, 302, by + 3]);
    }

    // ---- ground ------------------------------------------------------------
    p.floorPlane(FLOOR, p.height, C.asphalt, 208, 7);
    // A puddle reflecting the lit window at the end.
    p.ink(C.navyDeep).solid([62, 148, 104, 148, 112, 162, 54, 162]);
    p.ink(C.navy).line(62, 148, 103, 148);
    p.ink(C.blueDim).dots([72, 154, 86, 152, 96, 157]);
    p.contact(126, 128, 106, 8, -2);

    doorways(p, DOORS);
    p.depthRamp(130, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(118, 126, 120, 14);
  });

export const alley: RoomDef = {
  id: RoomId.Alley,
  title: 'The Alley',
  scene: alleyScene,

  horizon: 130,
  scaleAtHorizon: 0.68,

  entries: {
    default: { x: 56, y: 152, facing: 'right' },
    [RoomId.HookerRoom]: { x: 82, y: 148, facing: 'front' },
    [RoomId.OutsideBar]: { x: 286, y: 152, facing: 'left' },
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

  exits: exitsOf(DOORS),

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
      g.say(
        'The bottom section is well above your reach, and you are not the athlete you were.',
      );
      return true;
    }

    return false;
  },
};
