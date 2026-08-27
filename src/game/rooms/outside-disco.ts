import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 128;

const DOORS: readonly Doorway[] = [
  { to: RoomId.Taxi, label: 'Cab', side: 'left', y: 152, w: 36 },
  {
    to: RoomId.InsideDisco,
    label: 'Disco',
    side: 'back',
    x: 165,
    y: FLOOR,
    w: 48,
    h: 50,
    kind: 'double',
    colour: C.blue,
    through: C.violetDeep,
    spill: C.pinkLit,
    when: (g) =>
      g.hasAwarded('showed-pass')
        ? true
        : 'The doorman moves about four inches and somehow fills the entire ' +
          'doorway. "Members," he says.',
  },
];

/**
 * Outside the disco. A rope, a doorman, and a queue of nobody, which somehow
 * still does not mean you are getting in.
 */
export const outsideDiscoScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 30, 40, 0x44f00d);

    // The club front: black glass and a great deal of neon.
    p.ink(darker(C.slate)).box(40, 24, 250, 104);
    p.ink(C.black).box(48, 34, 234, 88);

    // Sign: three stacked neon bars in club colours, each with its own bloom.
    p.glow(164, 42, 46, C.purple, 0.8);
    p.glow(164, 56, 34, C.navy, 0.7);
    p.ink(C.pink).box(74, 38, 180, 8);
    p.ink(C.cyan).box(88, 50, 152, 6);
    p.ink(C.yellow).box(104, 60, 120, 5);
    p.ink(C.white).dots([70, 42, 258, 42, 84, 53, 244, 53]);

    // Chevrons of light down each side of the entrance.
    for (let i = 0; i < 5; i++) {
      const colour = [C.pink, C.purple, C.blue, C.cyan, C.white][i];
      p.ink(colour);
      p.path([56 + i * 5, 74, 66 + i * 5, 90, 56 + i * 5, 106]);
      p.path([274 - i * 5, 74, 264 - i * 5, 90, 274 - i * 5, 106]);
    }

    // Doors, mirrored and closed.
    p.ink(C.slate).box(126, 70, 78, 58);
    p.ink(C.navy).box(130, 74, 70, 54);
    p.ink(C.blue).line(165, 74, 165, 127);
    p.ink(C.white).path([136, 122, 158, 80]).path([172, 122, 194, 80]);
    p.ink(C.yellow).box(158, 96, 4, 10).box(168, 96, 4, 10);

    // Velvet rope on chrome posts.
    p.ink(C.grey).box(92, 100, 5, 30).box(232, 100, 5, 30);
    p.ink(C.slate).box(90, 96, 9, 5).box(230, 96, 9, 5);
    p.ink(C.maroon).path([96, 104, 130, 116, 164, 118, 198, 116, 232, 104]);
    p.ink(C.red).path([96, 105, 130, 117, 164, 119, 198, 117, 232, 105]);

    // Pavement and kerb.
    p.ink(C.slate).box(0, 128, p.width, 16);
    p.ink(C.grey).line(0, 128, p.width - 1, 128);
    p.ink(C.black).box(0, 144, p.width, p.height - 144);
    p.ink(C.slate).line(0, 144, p.width - 1, 144);
    p.ink(C.pink).box(0, 148, p.width, 2);

    p.depthRamp(128, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(88, 122, 14, 10);
    p.blockRect(228, 122, 14, 10);
  });

const DOORMAN = new Actor({
  id: 'doorman',
  x: 214,
  y: 140,
  facing: 'left',
  style: {
    hair: C.black,
    hairStyle: 'short',
    skin: C.brown,
    top: C.black,
    shirt: C.white,
    accent: C.black,
    bottom: C.black,
    shoes: C.black,
    build: 6,
    height: 33,
  },
});

export const outsideDisco: RoomDef = {
  id: RoomId.OutsideDisco,
  title: 'Outside the Disco',
  scene: outsideDiscoScene,

  horizon: 128,
  scaleAtHorizon: 0.64,

  entries: {
    default: { x: 84, y: 152, facing: 'right' },
    [RoomId.Taxi]: { x: 44, y: 154, facing: 'right' },
    [RoomId.InsideDisco]: { x: 165, y: 138, facing: 'front' },
  },

  describe:
    'The front of the disco: black glass, three bars of neon, and a velvet ' +
    'rope guarding a door that nobody is queueing for. A doorman stands beside ' +
    'it with his hands folded, entirely at peace.',

  populate: () => [DOORMAN],

  hotspots: [
    {
      noun: 'doorman',
      synonyms: ['bouncer', 'man', 'him', 'guard'],
      look: (g) =>
        g.hasAwarded('showed-pass')
          ? 'He has gone back to watching the empty street. You have ceased to be a problem.'
          : 'A wide man in a dinner jacket, perfectly still, radiating the ' +
            'calm of someone whose job is to say one word all night.',
    },
    {
      noun: 'rope',
      synonyms: ['velvet rope', 'barrier'],
      look: 'A velvet rope between two chrome posts, holding back a queue of nobody.',
    },
    {
      noun: 'doors',
      synonyms: ['door', 'entrance'],
      look: 'Mirrored doors. You can see yourself approaching them, which is discouraging.',
    },
    {
      noun: 'neon',
      synonyms: ['sign', 'lights'],
      look: 'Three bars of neon in pink, blue and yellow. The name of the place is not written anywhere. If you have to ask, and so on.',
    },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    const showingPass =
      cmd.is('show', ItemId.DiscoPass) ||
      cmd.is('give', ItemId.DiscoPass) ||
      (cmd.mentions(ItemId.DiscoPass) && ['show', 'give', 'use'].includes(cmd.verb ?? ''));

    if (showingPass) {
      if (!g.has(ItemId.DiscoPass)) {
        g.say('You pat your pockets with increasing honesty. You do not have a pass.');
        return true;
      }
      if (g.award(5, 'showed-pass')) {
        g.cue('score');
        g.say(
          'You produce the card and hold it up with what you hope is the ' +
            'boredom of a regular.',
          'He looks at it for a long moment, then at you, then unhooks the ' +
            'rope. "Evening, sir," he says, and manages to make the word "sir" ' +
            'carry a full sentence of doubt.',
        );
      } else {
        g.say('He waves it away. You are already in, as far as he is concerned.');
      }
      return true;
    }

    if (cmd.is('talk', 'doorman')) {
      g.say(
        g.hasAwarded('showed-pass')
          ? '"Enjoy your evening, sir."'
          : '"Members," he says, and returns to whatever he was thinking about.',
      );
      return true;
    }

    if (cmd.verb === 'pay' || cmd.is('give', ItemId.Wallet)) {
      g.say('"Not that kind of door," he says, almost kindly.');
      return true;
    }

    return false;
  },
};
