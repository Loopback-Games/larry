import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { WALK_FREE } from '../../constants.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 130;

const DOORS: readonly Doorway[] = [
  { to: RoomId.BarHallway, label: 'Corridor', side: 'left', y: 152, w: 30 },
  {
    to: RoomId.HookerRoom,
    label: 'Upstairs',
    side: 'right',
    y: 22,
    w: 28,
    when: (g) =>
      g.flag('heavyDistracted')
        ? true
        : 'The heavy at the foot of the stairs looks at you the way a wall ' +
          'looks at weather.',
  },
];

/**
 * The storeroom. Crates, a staircase, a television showing nothing, and a very
 * large man being paid to sit between you and the stairs.
 */
export const barBackroomScene = () =>
  paint((p) => {
    // Painted brick, lit from the bulb in the middle of the room. Kept well
    // above the floorboards in value so the two never read as one surface.
    p.ink(C.concrete).box(0, 0, p.width, FLOOR);
    p.bricks(0, 10, p.width, FLOOR - 10, C.asphalt, 7, 22);
    p.sweep(0, 0, p.width, FLOOR, -1, 1);
    p.slab(0, 0, p.width, 11, C.asphaltDeep, 1);
    p.ink(C.asphalt);
    for (let x = 0; x < p.width; x += 52) p.line(x, 11, x, FLOOR - 1);

    // Staircase up the right-hand wall.
    for (let i = 0; i < 9; i++) {
      const sx = 196 + i * 13;
      const sy = 118 - i * 12;
      p.slab(sx, sy, 15, 13, C.brown, 1);
      p.ink(C.tan).line(sx, sy, sx + 14, sy);
      p.ink(C.woodDeep).line(sx, sy + 12, sx + 14, sy + 12);
    }
    p.ink(C.ink).box(300, 6, 20, 28);
    p.ink(C.goldLit).box(302, 8, 16, 24);
    p.glow(310, 20, 22, C.concrete, 0.4, [C.concrete, C.asphalt, C.concreteLit]);
    p.slab(190, 108, 5, 28, C.pewter, 1);
    p.ink(C.pewterLit).path([194, 106, 306, 6]);

    // Crates stacked against the left wall.
    for (const [cx, cy, cw, ch] of [
      [8, 74, 44, 56],
      [56, 90, 38, 40],
      [12, 40, 36, 34],
    ] as const) {
      p.slab(cx, cy, cw, ch, C.brown, 1);
      p.sweep(cx, cy, cw, ch, 1, -1);
      p.ink(C.woodDeep).line(cx, cy + ch / 2, cx + cw - 1, cy + ch / 2);
      p.ink(C.tan).line(cx, cy + ch / 2 + 1, cx + cw - 1, cy + ch / 2 + 1);
      p.slab(cx + 6, cy + 6, cw - 12, 5, C.goldLit, 1);
      p.contact(cx, cy + ch, cw, 5, -2);
    }

    // The television, on a crate, aimed at one specific chair.
    p.slab(106, 60, 66, 56, C.asphalt, 1);
    p.ink(C.ink).box(112, 66, 48, 38);
    p.ink(C.navy).box(114, 68, 44, 34);
    p.sweep(114, 68, 44, 34, 1, -1);
    p.ink(C.blueLit).line(116, 70, 140, 92);
    p.ink(C.silver).box(162, 70, 6, 4).box(162, 78, 6, 4);
    p.ink(C.ink).line(139, 116, 139, FLOOR - 2);
    p.glow(136, 86, 26, C.concreteLit, 0.35, [C.concrete, C.asphalt]);
    p.contact(106, 116, 66, 5, -2);

    // A bare bulb, an extension lead, and a great deal of dust.
    p.ink(C.ink).line(150, 11, 150, 22);
    p.ink(C.yellowPale).dot(150, 24).dot(149, 23).dot(151, 23);
    p.glow(150, 23, 30, C.concreteLit, 0.45, [C.concrete, C.asphalt, C.concreteLit]);

    // Floor.
    p.floorPlane(FLOOR, p.height, C.woodDim, 160, 9);

    // Door back down to the corridor.
    p.ink(C.woodDeep).box(0, FLOOR, 26, 8);

    p.depthRamp(130, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(0, 130, 8, 12);
    p.blockRect(186, 128, 134, 16);

    // Carve a walkable ramp up the staircase. The band is deliberately tall so
    // that four-way movement can zig-zag up it; a one-pixel-per-step diagonal
    // would be unusable on a touch pad.
    p.saved((q) => {
      q.noInk().noDepth().walk(WALK_FREE);
      for (let x = 188; x <= 306; x++) {
        const stairTop = 122 - ((x - 190) / 13) * 12;
        q.box(x, Math.max(4, stairTop - 8), 1, 26);
      }
      q.box(288, 4, 32, 34);
      q.box(178, 118, 24, 24);
    });
  });

const HEAVY = new Actor({
  id: 'heavy',
  x: 176,
  y: 152,
  facing: 'left',
  style: {
    hair: C.black,
    hairStyle: 'short',
    skin: C.pink,
    top: C.maroon,
    shirt: C.white,
    bottom: C.black,
    shoes: C.black,
    build: 6,
    height: 32,
  },
});

export const barBackroom: RoomDef = {
  id: RoomId.BarBackroom,
  title: 'The Storeroom',
  scene: barBackroomScene,

  horizon: 118,
  scaleAtHorizon: 0.56,

  entries: {
    default: { x: 74, y: 154, facing: 'right' },
    [RoomId.BarHallway]: { x: 40, y: 152, facing: 'right' },
    [RoomId.HookerRoom]: { x: 250, y: 150, facing: 'left' },
  },

  describe:
    'A storeroom full of crates, with a staircase going up and a television ' +
    'showing a grey blizzard. A very large man sits between you and the stairs, ' +
    'watching the blizzard with total commitment.',

  populate: () => [HEAVY],

  hotspots: [
    {
      noun: 'heavy',
      synonyms: ['man', 'bouncer', 'guard', 'giant', 'him'],
      look: (g) =>
        g.flag('heavyDistracted')
          ? 'He has not blinked since the picture came on. You could take his ' +
            'chair and he would not notice.'
          : 'He is the size of a doorway and has the patient expression of ' +
            'someone paid by the hour to sit exactly there.',
    },
    {
      noun: 'television',
      synonyms: ['tv', 'telly', 'set', 'screen'],
      look: (g) =>
        g.flag('heavyDistracted')
          ? 'The picture is crisp now, and whatever is on it has him completely.'
          : 'A television tuned to a channel that stopped broadcasting some ' +
            'years ago. He is watching it anyway.',
    },
    {
      noun: 'stairs',
      synonyms: ['staircase', 'steps'],
      look: 'Wooden stairs leading up to a landing and a closed door.',
    },
    {
      noun: 'crates',
      synonyms: ['crate', 'boxes', 'box'],
      look: 'Beer crates, mostly empty, stacked by someone with no interest in stacking.',
    },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    const usingRemote =
      cmd.is('use', ItemId.RemoteControl) ||
      cmd.is('turn on', 'television') ||
      (cmd.mentions(ItemId.RemoteControl) && ['use', 'push', 'press'].includes(cmd.verb ?? ''));

    if (usingRemote) {
      if (!g.has(ItemId.RemoteControl)) {
        g.say('You have nothing to point at it.');
        return true;
      }
      if (!g.hasAwarded('used-remote')) {
        g.award(3, 'used-remote');
        g.cue('score');
        g.say(
          'You point the remote at the television and press something at random.',
          'The blizzard resolves into a picture. The large man sits up very ' +
            'slightly, which for him is a standing ovation.',
        );
        return true;
      }
      if (!g.hasAwarded('changed-channels')) {
        g.award(8, 'changed-channels');
        g.set('heavyDistracted');
        g.cue('score');
        g.say(
          'You work through the channels one at a time while he watches, ' +
            'rapt, like a man being shown fire.',
          'You stop on something involving a swimming pool. His jaw settles. ' +
            'His arm comes down. He has left the building without moving.',
          'The stairs are yours.',
        );
        return true;
      }
      g.say('He is as distracted as a man can get. Leave it.');
      return true;
    }

    if (cmd.isAny('change', 'television') || cmd.is('push', 'television')) {
      g.say('The set has no buttons left. Somebody has been thorough.');
      return true;
    }

    if (cmd.is('talk', 'heavy')) {
      g.say(
        g.flag('heavyDistracted')
          ? 'He does not hear you. He is at the pool.'
          : '"Not up there," he says, pleasantly, still watching the blizzard.',
      );
      return true;
    }

    if (cmd.isAny('hit', 'heavy') || cmd.isAny('push', 'heavy')) {
      g.say(
        'You consider it. You take in his shoulders, his hands, and his ' +
          'complete lack of concern, and you reconsider.',
      );
      return true;
    }

    return false;
  },
};
