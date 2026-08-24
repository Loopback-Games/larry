import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 128;

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.InsideChapel,
    label: 'Chapel',
    side: 'back',
    x: 160,
    y: FLOOR,
    w: 44,
    h: 46,
    kind: 'double',
    colour: C.gold,
    through: C.bronze,
    spill: C.yellowPale,
  },
  { to: RoomId.Taxi, label: 'Cab', side: 'right', y: 150, w: 32 },
];

/**
 * The all-night wedding chapel. Neon hearts, plastic flowers, and a man in a
 * long coat who is not, on this occasion, going to do anything about it.
 */
export const outsideChapelScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 30, 34, 0xbeef11);

    // The chapel: white boards, a steeple, and far too much neon.
    p.ink(C.white).box(70, 44, 180, 84);
    p.ink(C.grey);
    for (let y = 48; y < 128; y += 6) p.line(70, y, 249, y);
    p.ink(C.slate).outline(70, 44, 180, 84);
    p.ink(C.white).solid([160, 6, 186, 44, 134, 44]);
    p.ink(C.grey).path([160, 6, 134, 44]);
    p.ink(C.yellow).box(158, 0, 4, 8).box(154, 3, 12, 3);

    // Neon hearts either side of the door, and the sign.
    for (const hx of [98, 222]) {
      p.ink(C.pink);
      p.solid([hx, 78, hx - 10, 68, hx - 5, 62, hx, 66, hx + 5, 62, hx + 10, 68]);
      p.ink(C.red).dot(hx, 74).dot(hx - 4, 70).dot(hx + 4, 70);
    }
    p.ink(C.maroon).box(112, 52, 96, 14);
    p.ink(C.pink).outline(112, 52, 96, 14);
    p.ink(C.white).box(118, 56, 84, 4).box(132, 62, 56, 2);

    // Doors, open, with light coming out.
    p.ink(C.brown).box(134, 84, 52, 44);
    p.ink(C.yellow).box(140, 88, 40, 40);
    p.ink(C.brown).box(158, 84, 4, 44);
    p.ink(darker(C.brown)).outline(133, 83, 54, 46);

    // Plastic urns of plastic flowers either side of the door.
    for (const ux of [116, 204]) {
      p.ink(C.slate).solid([ux - 8, 108, ux + 8, 108, ux + 5, 128, ux - 5, 128]);
      p.ink(C.grey).line(ux - 8, 108, ux + 7, 108);
      p.ink(C.green).path([ux, 108, ux - 6, 96]).path([ux, 108, ux + 6, 94]).path([ux, 108, ux, 92]);
      p.ink(C.pink).dot(ux - 6, 95).dot(ux + 6, 93).dot(ux, 91);
      p.ink(C.yellow).dot(ux - 6, 94).dot(ux, 90);
    }

    // Pavement and kerb.
    p.ink(C.slate).box(0, 128, p.width, 16);
    p.ink(C.grey).line(0, 128, p.width - 1, 128);
    p.ink(C.black).box(0, 144, p.width, p.height - 144);
    p.ink(C.slate).line(0, 144, p.width - 1, 144);

    p.depthRamp(128, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
  });

const FLASHER = new Actor({
  id: 'flasher',
  x: 54,
  y: 148,
  facing: 'right',
  style: {
    hair: C.grey,
    hairStyle: 'short',
    skin: C.pink,
    top: C.brown,
    shirt: C.white,
    bottom: C.brown,
    shoes: C.black,
    build: 5,
    height: 30,
  },
});

export const outsideChapel: RoomDef = {
  id: RoomId.OutsideChapel,
  title: 'Outside the Chapel',
  scene: outsideChapelScene,

  horizon: 128,
  scaleAtHorizon: 0.66,

  entries: {
    default: { x: 232, y: 152, facing: 'left' },
    [RoomId.Taxi]: { x: 286, y: 152, facing: 'left' },
    [RoomId.InsideChapel]: { x: 160, y: 136, facing: 'front' },
  },

  describe:
    'A white clapboard chapel with a steeple, two neon hearts and a sign ' +
    'promising ceremonies at any hour. The doors are open and there is warm ' +
    'light inside. A man in a long coat is loitering by the kerb.',

  populate: () => [FLASHER],

  hotspots: [
    {
      noun: 'flasher',
      synonyms: ['man', 'coat', 'stranger', 'him', 'loiterer'],
      look: (g) =>
        g.hasAwarded('talked-to-flasher')
          ? 'He has gone back to waiting for somebody who deserves it.'
          : 'A man in a long coat, standing very still by the kerb with the ' +
            'air of someone about to make a decision.',
    },
    { noun: 'chapel', synonyms: ['church', 'building'], look: 'A wedding chapel built out of boards and optimism, open twenty-four hours.' },
    { noun: 'hearts', synonyms: ['neon', 'neon hearts', 'sign'], look: 'Two neon hearts, one of which is failing in a way that makes it flicker like a real one.' },
    { noun: 'steeple', synonyms: ['spire'], look: 'A steeple with a small gold cross that is, on closer inspection, a small gold dollar sign.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.is('talk', 'flasher') || (cmd.verb === 'talk' && cmd.object === null)) {
      if (g.award(1, 'talked-to-flasher')) {
        g.cue('score');
        g.say(
          'You say good evening, because you are a polite man and it is a ' +
            'public street.',
          'He looks startled, as though nobody has ever opened with ' +
            'conversation before. He glances down at his coat, then at you, ' +
            'then at the chapel.',
          '"Getting married?" he says. "Good for you. Good for you." And he ' +
            'wanders off up the street with the coat still firmly closed, ' +
            'which is, on balance, the best outcome available.',
        );
      } else {
        g.say('He has moved on, still buttoned.');
      }
      return true;
    }

    if (cmd.verb === 'look' && cmd.object === 'flasher' && !g.hasAwarded('talked-to-flasher')) {
      return false;
    }

    return false;
  },
};
