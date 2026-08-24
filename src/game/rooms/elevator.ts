import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { WALK_FREE } from '../../constants.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

/** Floors the lift will admit to having. */
export const FLOORS: readonly {
  label: string;
  words: readonly string[];
  room: string;
  gate?: (g: Game) => true | string;
}[] = [
  { label: '1 — Casino', words: ['1', 'one', 'casino', 'lobby', 'ground'], room: RoomId.ElevatorLobby },
  {
    label: '8 — Offices',
    words: ['8', 'eight', 'office', 'offices', 'reception'],
    room: RoomId.ReceptionDesk,
  },
  {
    label: '9 — Honeymoon Suites',
    words: ['9', 'nine', 'suite', 'suites', 'honeymoon'],
    room: RoomId.HoneymoonSuite,
    gate: (g) =>
      g.flag('married')
        ? true
        : 'The button for the ninth floor does not light. Those suites are ' +
          'reserved, and you are not, yet, a reservation.',
  },
  {
    label: 'P — Penthouse',
    words: ['p', 'penthouse', 'top', 'roof'],
    room: RoomId.PenthouseLounge,
    gate: (g) =>
      g.flag('penthouseUnlocked')
        ? true
        : 'The penthouse button needs a key that you do not have. It is on a ' +
          'desk on the eighth floor, behind a woman who is extremely awake.',
  },
];

/** Inside the lift: brass, mirrors, and a panel of buttons. */
export const elevatorScene = () =>
  paint((p) => {
    p.ink(darker(C.yellow)).box(0, 0, p.width, 138);
    p.ink(C.yellow).box(0, 0, p.width, 10).box(0, 60, p.width, 4);
    p.ink(C.brown);
    for (let x = 0; x < p.width; x += 26) p.line(x, 10, x, 137);

    // Mirrored back wall.
    p.ink(C.slate).box(60, 20, 200, 96);
    p.ink(C.grey).outline(60, 20, 200, 96);
    p.ink(C.white).path([70, 110, 130, 30]).path([150, 112, 200, 40]);
    p.ink(C.yellow).box(56, 116, 208, 5);

    // Handrail.
    p.ink(C.brown).box(20, 96, 280, 5);
    p.ink(C.yellow).line(20, 96, 299, 96);

    // Button panel.
    p.ink(C.slate).box(272, 44, 36, 60);
    p.ink(C.grey).outline(272, 44, 36, 60);
    const lamps = [C.white, C.white, C.white, C.red];
    for (let i = 0; i < 4; i++) {
      p.ink(C.black).box(280, 52 + i * 13, 20, 9);
      p.ink(lamps[i]).box(282, 54 + i * 13, 6, 5);
      p.ink(C.grey).box(291, 54 + i * 13, 7, 5);
    }

    // Floor indicator over the doors.
    p.ink(C.black).box(128, 12, 64, 10);
    p.ink(C.red).box(134, 14, 10, 6).box(150, 14, 10, 6).box(166, 14, 10, 6);

    // Floor.
    p.ink(C.maroon).box(0, 138, p.width, p.height - 138);
    p.ink(C.red);
    for (let y = 142; y < p.height; y += 7) p.line(0, y, p.width - 1, y);
    p.ink(C.yellow).line(0, 138, p.width - 1, 138);

    p.blockRect(0, 0, p.width, 138);
    p.saved((q) => q.noInk().noDepth().walk(WALK_FREE).box(16, 138, 288, 30));
    p.depthRamp(138, p.height, 8, 14);
  });

export const elevator: RoomDef = {
  id: RoomId.Elevator,
  title: 'In the Lift',
  scene: elevatorScene,

  entries: { default: { x: 160, y: 158, facing: 'back' } },

  describe:
    'Brass, mirrors, a handrail, and a panel with four buttons. There is ' +
    'music, of a kind. You can see yourself in three directions and you do not ' +
    'care for any of them.',

  hotspots: [
    { noun: 'panel', synonyms: ['buttons', 'button'], look: () => `The panel reads:  ${FLOORS.map((f) => f.label).join('   ')}` },
    { noun: 'mirror', synonyms: ['mirrors'], look: 'Three of you, all making the same face.' },
    { noun: 'handrail', synonyms: ['rail'], look: 'A brass rail, for people who need one.' },
  ],

  onEnter(g) {
    if (!g.flag('rodeLift')) {
      g.set('rodeLift');
      g.say(
        'The doors close. The music continues.',
        `Press a floor: ${FLOORS.map((f) => f.label).join(',  ')}.`,
      );
    }
  },

  onCommand(g, cmd) {
    if (cmd.verb === 'look' && cmd.object === 'panel') return false;

    const words = cmd.raw.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const floor of FLOORS) {
      if (!floor.words.some((w) => words.includes(w))) continue;
      if (floor.room === g.previousRoom && floor.room === RoomId.ElevatorLobby && !g.flag('married')) {
        // Going back where you came from is always allowed.
      }
      const gate = floor.gate?.(g);
      if (typeof gate === 'string') {
        g.say(gate);
        return true;
      }
      g.cue('door');
      g.say(`The lift moves. After a while, the doors open on ${floor.label.toLowerCase()}.`);
      g.goTo(floor.room);
      return true;
    }

    if (cmd.verb === 'push' || cmd.verb === 'use' || cmd.verb === 'up' || cmd.verb === 'down') {
      g.say(`Which floor?  ${FLOORS.map((f) => f.label).join(',  ')}`);
      return true;
    }

    if (cmd.verb === 'exit') {
      g.say('The doors are shut. Choose a floor.');
      return true;
    }

    return false;
  },
};
