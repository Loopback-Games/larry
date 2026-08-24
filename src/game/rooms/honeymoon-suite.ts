import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 118;

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.Elevator,
    label: 'Lift',
    side: 'left',
    y: 146,
    w: 32,
    when: (g) =>
      g.flag('untied')
        ? true
        : 'You are tied to the bed. The door might as well be in another country.',
  },
];

/**
 * The honeymoon suite, four minutes after the wedding. Heart-shaped bed, a
 * radio, and a length of rope with you on the end of it.
 */
export const honeymoonSuiteScene = () =>
  paint((p) => {
    p.ink(C.pink).box(0, 0, p.width, 118);
    p.ink(darker(C.pink)).box(0, 0, p.width, 8);
    p.ink(C.red);
    for (let y = 14; y < 114; y += 16)
      for (let x = 8; x < p.width; x += 20) {
        p.solid([x, y + 6, x - 5, y + 1, x - 2, y - 2, x, y, x + 2, y - 2, x + 5, y + 1]);
      }

    // Mirrored headboard wall.
    p.ink(C.slate).box(88, 16, 144, 60);
    p.ink(C.grey).outline(88, 16, 144, 60);
    p.ink(C.white).path([96, 70, 140, 22]).path([160, 72, 196, 28]);

    // The bed, heart-shaped headboard, red cover.
    p.ink(C.maroon).solid([104, 76, 216, 76, 216, 96, 104, 96]);
    p.ink(C.red).solid([160, 76, 118, 76, 124, 58, 148, 58, 160, 70, 172, 58, 196, 58, 202, 76]);
    p.ink(C.pink).path([124, 60, 146, 60]).path([174, 60, 196, 60]);
    // Mattress top at about a third of standing height, not chest level.
    p.ink(C.red).solid([84, 110, 236, 110, 248, 136, 72, 136]);
    p.ink(darker(C.red)).line(72, 136, 247, 136);
    p.ink(C.white).solid([106, 90, 152, 90, 154, 102, 104, 102]);
    p.ink(C.white).solid([170, 90, 216, 90, 218, 102, 168, 102]);
    p.ink(C.yellow).box(80, 96, 5, 42).box(235, 96, 5, 42);

    // The rope, still tied to the bedpost.
    p.ink(C.brown);
    p.path([82, 100, 96, 106, 88, 114, 100, 120]);
    p.path([238, 100, 224, 106, 232, 114, 220, 120]);

    // Bedside table with a clock radio on it.
    p.ink(C.brown).box(248, 100, 40, 5).box(252, 105, 5, 22).box(280, 105, 5, 22);
    p.ink(darker(C.slate)).box(254, 86, 30, 14);
    p.ink(C.black).box(258, 89, 16, 7);
    p.ink(C.red).box(260, 91, 3, 4).box(265, 91, 3, 4).box(270, 91, 3, 4);
    p.ink(C.grey).box(276, 90, 6, 5);

    // A champagne bucket nobody is going to open.
    p.ink(C.grey).solid([26, 96, 62, 96, 57, 122, 31, 122]);
    p.ink(C.white).line(26, 96, 61, 96);
    p.ink(C.green).box(40, 78, 8, 20);
    p.ink(C.yellow).box(40, 74, 8, 5);

    // Door out, and the carpet.
    p.ink(C.brown).box(0, 26, 22, 92);
    p.ink(darker(C.brown)).outline(0, 24, 24, 94);
    p.ink(C.yellow).dot(19, 74);
    p.ink(C.maroon).box(0, 118, p.width, p.height - 118);
    p.ink(C.red);
    for (let y = 122; y < p.height; y += 8) p.line(0, y, p.width - 1, y);
    p.ink(C.pink).line(0, 118, p.width - 1, 118);

    p.depthRamp(118, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(70, 118, 180, 20);
    p.blockRect(24, 118, 42, 8);
  });

export const honeymoonSuite: RoomDef = {
  id: RoomId.HoneymoonSuite,
  title: 'The Honeymoon Suite',
  scene: honeymoonSuiteScene,

  horizon: 118,
  scaleAtHorizon: 0.7,

  entries: {
    default: { x: 160, y: 150, facing: 'front' },
    [RoomId.Elevator]: { x: 30, y: 150, facing: 'right' },
  },

  describe: (g) =>
    g.flag('untied')
      ? 'The honeymoon suite: a heart-shaped bed, a mirrored wall, a bucket of ' +
        'warm champagne and a cut length of rope. You have been married for ' +
        'about eleven minutes.'
      : 'You are tied to the bedposts of a heart-shaped bed in the honeymoon ' +
        'suite of a casino hotel. The door is open. Your wife is not here. ' +
        'Neither, you suspect, is your wallet.',

  onEnter(g) {
    if (!g.flag('tiedUp') && !g.flag('untied')) {
      g.set('tiedUp');
      g.setCounter('money', 0);
      g.cue('door');
      g.say(
        'The suite is enormous and pink and has a heart-shaped bed in the ' +
          'middle of it.',
        '"Lie down," says Fawn, "and close your eyes."',
        'You do both, because you have waited thirty-eight years for somebody ' +
          'to say that to you.',
        'There is some businesslike movement with what turns out to be a rope.',
        'Then the door closes, and a lift arrives, and a lift leaves, and you ' +
          'are alone, tied to a heart-shaped bed, with an empty wallet and a ' +
          'clock radio for company.',
      );
    }
  },

  hotspots: [
    { noun: 'bed', synonyms: ['heart bed', 'headboard', 'bedpost', 'bedposts'], look: 'A heart-shaped bed. Somebody built this on purpose.' },
    {
      noun: 'radio',
      synonyms: ['clock radio', 'clock', 'alarm'],
      look: (g) =>
        g.flag('radioOn')
          ? 'The radio is on. A late-night station is playing something slow ' +
            'and, under the circumstances, sarcastic.'
          : 'A clock radio on the bedside table. It says 4:41. The dial is ' +
            'within reach, if only just.',
    },
    {
      noun: 'rope',
      synonyms: ['ropes', 'knot', 'knots'],
      look: (g) =>
        g.flag('untied')
          ? 'A cut length of good nylon rope, coiled on the bed.'
          : 'Nylon rope, tied to the bedposts with knots that were not learned ' +
            'this evening.',
    },
    { noun: 'champagne', synonyms: ['bucket', 'bottle', 'ice bucket'], look: 'A bottle in a bucket of water that used to be ice.' },
    { noun: 'mirror', synonyms: ['mirrors', 'mirrored wall'], look: 'You can watch yourself being tied to a bed, which is a service nobody asked for.' },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    if (cmd.isAny('turn on', 'radio') || cmd.isAny('use', 'radio') || cmd.isAny('listen', 'radio')) {
      if (g.award(1, 'turned-on-radio')) {
        g.set('radioOn');
        g.cue('score');
        g.say(
          'By stretching further than a man of your age should, you get a ' +
            'finger to the dial.',
          'A late-night station comes on, playing something slow. The presenter ' +
            'says it is four forty-one, and that this one goes out to all the ' +
            'lovers out there.',
          'You lie tied to a heart-shaped bed and listen to it, and you have ' +
            'to admit that the timing is perfect.',
        );
      } else {
        g.say('It is already on, and it is not helping.');
      }
      return true;
    }

    const cutting =
      (cmd.verb === 'cut' && (cmd.mentions(ItemId.Rope) || cmd.mentions(ItemId.Knife))) ||
      (cmd.verb === 'use' && cmd.mentions(ItemId.Knife));

    if (cutting) {
      if (g.flag('untied')) {
        g.say('You are already free. Do not push your luck with a knife.');
        return true;
      }
      if (!g.has(ItemId.Knife)) {
        g.say(
          'You pull against the rope for a while. The rope is fine. The bed is ' +
            'fine. You are the only part of this arrangement showing wear.',
        );
        return true;
      }
      g.set('untied');
      g.set('tiedUp', false);
      g.award(10, 'cut-rope');
      g.cue('score');
      g.say(
        'You work the pocket knife out of your jacket with two fingers and ' +
          'most of your remaining dignity.',
        'It takes a long time. The knife is blunt and the rope is good. But it ' +
          'goes, strand by strand, and then you are sitting on the edge of a ' +
          'heart-shaped bed at nearly five in the morning with no money and no ' +
          'wife, holding a knife.',
        'The old man outside the liquor store knew exactly what he was doing.',
      );
      return true;
    }

    if (cmd.is('get', ItemId.Rope)) {
      if (g.has(ItemId.Rope)) {
        g.say('You have the rope.');
        return true;
      }
      if (!g.flag('untied')) {
        g.say('The rope is currently in use, and you are the one it is being used on.');
        return true;
      }
      g.give(ItemId.Rope);
      g.award(3, 'got-rope');
      g.cue('score');
      g.say(
        'You coil the cut rope and take it with you, because it is good rope ' +
          'and because you have learned tonight that this town gives you ' +
          'nothing you do not pick up yourself.',
      );
      return true;
    }

    if (cmd.verb === 'inventory' && !g.flag('untied')) {
      return false;
    }

    if (!g.flag('untied') && ['north', 'south', 'east', 'west', 'exit', 'stand'].includes(cmd.verb ?? '')) {
      g.say('You are tied to a bed. Movement is not currently among your options.');
      return true;
    }

    return false;
  },
};
