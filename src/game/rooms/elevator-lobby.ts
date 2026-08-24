import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 124;

const DOORS: readonly Doorway[] = [
  { to: RoomId.InsideCasino, label: 'Casino floor', side: 'front', x: 160, w: 46 },
  {
    to: RoomId.Elevator,
    label: 'Lift',
    side: 'back',
    x: 160,
    y: FLOOR,
    w: 54,
    h: 52,
    kind: 'double',
    colour: C.gold,
    through: C.charcoal,
  },
];

/** A short marble lobby with the lift at the end of it. */
export const elevatorLobbyScene = () =>
  paint((p) => {
    p.ink(C.grey).box(0, 0, p.width, 124);
    p.ink(C.white).box(0, 0, p.width, 8);
    p.ink(C.slate).line(0, 8, p.width - 1, 8);

    // Marble veining on the walls.
    p.ink(C.slate);
    for (let i = 0; i < 26; i++) {
      const x = (i * 37) % 320;
      p.path([x, 12 + (i % 5) * 20, x + 14, 20 + (i % 5) * 20, x + 26, 16 + (i % 5) * 20]);
    }

    // Corridor perspective towards the lift.
    p.ink(C.slate).path([0, 8, 92, 40, 92, 124]).path([319, 8, 228, 40, 228, 124]);
    p.ink(darker(C.slate)).fill(40, 60).fill(280, 60);

    // Lift doors, brass, with a floor indicator above.
    p.ink(C.yellow).box(104, 40, 112, 84);
    p.ink(darker(C.yellow)).outline(104, 40, 112, 84);
    p.ink(C.brown).box(158, 40, 4, 84);
    p.ink(darker(C.yellow)).box(112, 48, 38, 30).box(170, 48, 38, 30);
    p.ink(C.black).box(132, 26, 56, 12);
    p.ink(C.red).box(136, 29, 8, 6).box(148, 29, 8, 6).box(160, 29, 8, 6).box(172, 29, 8, 6);
    p.ink(C.yellow).box(136, 29, 8, 6);

    // Call button and an ashtray on a stand.
    p.ink(C.slate).box(222, 74, 10, 16);
    p.ink(C.red).dot(226, 79).dot(227, 79).dot(226, 80).dot(227, 80);
    p.ink(C.slate).box(70, 96, 12, 28);
    p.ink(C.grey).solid([64, 90, 88, 90, 84, 98, 68, 98]);

    // A potted plant that has outlived the decor.
    p.ink(C.brown).solid([246, 100, 274, 100, 270, 124, 250, 124]);
    p.ink(C.green);
    for (const [dx, dy] of [[-14, -18], [-6, -26], [4, -28], [14, -20], [0, -14]] as const) {
      p.solid([260, 100, 260 + dx, 100 + dy, 260 + dx + 6, 100 + dy + 6]);
    }

    // Carpet.
    p.ink(C.maroon).box(0, 124, p.width, p.height - 124);
    p.ink(C.red);
    for (let y = 128; y < p.height; y += 8) p.line(0, y, p.width - 1, y);
    p.ink(C.yellow).line(0, 124, p.width - 1, 124);

    p.depthRamp(124, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(244, 118, 34, 10);
  });

export const elevatorLobby: RoomDef = {
  id: RoomId.ElevatorLobby,
  title: 'The Lift Lobby',
  scene: elevatorLobbyScene,

  horizon: 124,
  scaleAtHorizon: 0.64,

  entries: {
    default: { x: 160, y: 148, facing: 'back' },
    [RoomId.InsideCasino]: { x: 160, y: 152, facing: 'back' },
    [RoomId.Elevator]: { x: 160, y: 134, facing: 'front' },
  },

  describe:
    'A short marble lobby with brass lift doors at the end, a call button, an ' +
    'ashtray on a stand, and a plant that has clearly been here since the ' +
    'building opened.',

  hotspots: [
    { noun: 'lift', synonyms: ['elevator', 'doors', 'lift doors'], look: 'Brass doors with a row of floor lights above them. The lights are not moving.' },
    { noun: 'button', synonyms: ['call button'], look: 'A single round button, worn to a shine.' },
    { noun: 'plant', synonyms: ['pot plant', 'potted plant'], look: 'It has survived thirty years of cigarette ends and is thriving out of spite.' },
    { noun: 'ashtray', synonyms: ['stand'], look: 'A chrome ashtray on a stand, full to the brim.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.isAny('push', 'button') || cmd.isAny('use', 'button') || cmd.isAny('open', 'lift')) {
      g.cue('door');
      g.say('You press the button. Somewhere above you, machinery agrees to help.');
      return true;
    }
    return false;
  },
};
