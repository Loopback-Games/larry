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
    p.ink(C.slate).box(0, 0, p.width, 130);
    p.ink(darker(C.slate)).box(0, 0, p.width, 10);
    p.ink(C.black);
    for (let x = 0; x < p.width; x += 40) p.line(x, 10, x, 129);

    // Staircase up the right-hand wall.
    p.ink(C.brown);
    for (let i = 0; i < 9; i++) {
      p.box(196 + i * 13, 118 - i * 12, 14, 12);
      p.ink(darker(C.brown)).line(196 + i * 13, 118 - i * 12, 209 + i * 13, 118 - i * 12);
      p.ink(C.brown);
    }
    p.ink(C.black).box(300, 6, 20, 26);
    p.ink(C.yellow).box(302, 8, 16, 22);
    p.ink(C.slate).box(190, 108, 4, 26);
    p.ink(C.slate).path([194, 106, 306, 6]);

    // Crates stacked against the left wall.
    for (const [cx, cy, cw, ch] of [
      [8, 74, 44, 56],
      [56, 90, 38, 40],
      [12, 40, 36, 34],
    ] as const) {
      p.ink(C.brown).box(cx, cy, cw, ch);
      p.ink(darker(C.brown)).outline(cx, cy, cw, ch);
      p.ink(C.black).line(cx, cy + ch / 2, cx + cw - 1, cy + ch / 2);
      p.ink(C.yellow).box(cx + 6, cy + 6, cw - 12, 4);
    }

    // The television, on a crate, aimed at one specific chair.
    p.ink(C.black).box(108, 62, 62, 52);
    p.ink(C.slate).outline(108, 62, 62, 52);
    p.ink(C.navy).box(114, 68, 44, 34);
    p.ink(C.grey).box(160, 70, 6, 4).box(160, 78, 6, 4);
    p.ink(C.black).line(139, 114, 139, 126);

    // A bare bulb, an extension lead, and a great deal of dust.
    p.ink(C.black).line(150, 10, 150, 22);
    p.ink(C.yellow).dot(150, 24).dot(149, 23).dot(151, 23);

    // Floor.
    p.ink(C.brown).box(0, 130, p.width, p.height - 130);
    p.ink(darker(C.brown));
    for (let y = 132; y < p.height; y += 6) p.line(0, y, p.width - 1, y);
    p.ink(C.black).line(0, 130, p.width - 1, 130);

    // Door back down to the corridor.
    p.ink(C.black).box(0, 130, 26, 8);

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
    { noun: 'stairs', synonyms: ['staircase', 'steps'], look: 'Wooden stairs leading up to a landing and a closed door.' },
    { noun: 'crates', synonyms: ['crate', 'boxes', 'box'], look: 'Beer crates, mostly empty, stacked by someone with no interest in stacking.' },
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
