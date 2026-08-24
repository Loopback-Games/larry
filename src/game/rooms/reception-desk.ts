import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The eighth floor. One desk, one receptionist, and the button that releases
 * the penthouse lift. She is between you and it, and she is very awake.
 */
export const receptionDeskScene = () =>
  paint((p) => {
    p.ink(C.teal).box(0, 0, p.width, 120);
    p.ink(darker(C.teal)).box(0, 0, p.width, 10);
    p.ink(C.cyan).line(0, 10, p.width - 1, 10);
    p.ink(darker(C.teal));
    for (let x = 0; x < p.width; x += 32) p.line(x, 10, x, 119);

    // A corporate mural nobody looks at.
    p.ink(C.navy).box(24, 24, 84, 48);
    p.ink(C.blue).solid([28, 66, 56, 32, 84, 66]);
    p.ink(C.white).solid([56, 32, 66, 46, 46, 46]);
    p.ink(C.yellow).dot(96, 34).dot(97, 34).dot(96, 35).dot(97, 35);
    p.ink(C.cyan).outline(24, 24, 84, 48);

    // Lettering on the wall behind the desk.
    p.ink(C.white).box(196, 30, 96, 5).box(212, 42, 64, 4);

    // Lift doors back to the rest of the hotel.
    p.ink(C.yellow).box(126, 34, 58, 86);
    p.ink(darker(C.yellow)).outline(126, 34, 58, 86);
    p.ink(C.brown).line(155, 36, 155, 118);

    // The desk.
    p.ink(C.brown).solid([176, 96, 312, 96, 320, 130, 168, 130]);
    p.ink(C.yellow).line(176, 96, 311, 96);
    p.ink(darker(C.brown)).line(168, 130, 319, 130);
    p.ink(C.black).box(196, 84, 30, 12);
    p.ink(C.lime).box(199, 86, 24, 8);
    p.ink(C.slate).box(238, 88, 26, 8);
    p.ink(C.white).box(272, 86, 20, 10);
    p.ink(C.red).box(288, 100, 12, 8);
    p.ink(C.yellow).box(291, 102, 6, 4);

    // A glass of water and a small heap of paperwork.
    p.ink(C.cyan).box(182, 86, 8, 12);
    p.ink(C.white).box(180, 84, 12, 3);
    p.ink(C.white).box(212, 100, 26, 4).box(214, 96, 22, 4);

    // Carpet.
    p.ink(C.navy).box(0, 120, p.width, p.height - 120);
    p.ink(C.blue);
    for (let y = 124; y < p.height; y += 9)
      for (let x = ((y / 9) % 2) * 8; x < p.width; x += 16) p.dot(x, y);
    p.ink(C.cyan).line(0, 120, p.width - 1, 120);

    p.depthRamp(120, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 120);
    p.blockRect(166, 118, 154, 14);
  });

const FAITH = new Actor({
  id: 'faith',
  x: 246,
  y: 112,
  facing: 'front',
  depth: 5,
  style: {
    hair: C.brown,
    hairStyle: 'bouffant',
    skin: C.pink,
    top: C.white,
    shirt: C.white,
    accent: C.navy,
    bottom: C.navy,
    legwear: 'skirt',
    shoes: C.black,
    build: 3,
    height: 28,
  },
});

export const receptionDesk: RoomDef = {
  id: RoomId.ReceptionDesk,
  title: 'Eighth Floor',
  scene: receptionDeskScene,

  entries: {
    default: { x: 155, y: 140, facing: 'front' },
    [RoomId.Elevator]: { x: 155, y: 132, facing: 'front' },
  },

  describe:
    'The eighth floor: a corridor, a mural, and a desk with a woman behind it ' +
    'who has been on shift since before you were born and shows no sign of ' +
    'weakening. On the desk, among the paperwork, is a red button.',

  populate: () => [FAITH],

  hotspots: [
    {
      noun: 'faith',
      synonyms: ['receptionist', 'woman', 'her', 'girl', 'secretary'],
      look: (g) =>
        g.flag('faithAsleep')
          ? 'She is asleep on the paperwork, breathing slowly, entirely at peace.'
          : 'Her name plate says FAITH. She is answering a phone, filing ' +
            'something and pressing the heel of her hand into her forehead, ' +
            'all at once.',
    },
    {
      noun: 'red button',
      synonyms: ['button', 'switch'],
      look: 'A red button under a small hinged cover, labelled PH RELEASE.',
    },
    { noun: 'desk', synonyms: ['counter', 'paperwork', 'papers'], look: 'A wide desk covered in paper, a telephone, a card machine and a glass of water.' },
    { noun: 'mural', synonyms: ['painting', 'picture'], look: 'A mountain, painted by somebody who had heard about mountains.' },
    { noun: 'water', synonyms: ['glass', 'glass of water'], look: 'A glass of water beside her, mostly full.' },
  ],

  exits: [{ x: 126, y: 120, w: 58, h: 10, to: RoomId.Elevator }],

  onCommand(g, cmd) {
    const givingPills =
      (cmd.verb === 'give' && cmd.mentions(ItemId.Pills)) ||
      (cmd.verb === 'show' && cmd.mentions(ItemId.Pills));

    if (givingPills) {
      if (!g.has(ItemId.Pills)) {
        g.say('You do not have any pills.');
        return true;
      }
      if (g.flag('faithAsleep')) {
        g.say('She has had quite enough.');
        return true;
      }
      g.take(ItemId.Pills);
      g.set('faithAsleep');
      g.award(5, 'gave-pills');
      g.cue('score');
      g.say(
        '"You do not have anything for a headache, I suppose," she says, ' +
          'entirely rhetorically.',
        'You produce an unlabelled bottle of pills you found behind some ' +
          'boards in an alley, and hand it over.',
        'She takes two without looking at them, because it is four in the ' +
          'morning and she has stopped asking questions.',
        'Twenty seconds later she is asleep on the paperwork. You look at the ' +
          'bottle again. There is still no label.',
      );
      return true;
    }

    if (cmd.isAny('push', 'red button') || cmd.isAny('use', 'red button')) {
      if (!g.flag('faithAsleep')) {
        g.say(
          'You reach for the button. Without looking up, she moves the ' +
            'paperwork six inches to the left and your hand is nowhere near it.',
        );
        return true;
      }
      if (g.award(5, 'released-penthouse')) {
        g.set('penthouseUnlocked');
        g.cue('score');
        g.say(
          'You lift the little cover and press the button.',
          'Down the corridor, something in the lift shaft unlocks with a ' +
            'satisfying clunk. The penthouse is now, technically, available.',
        );
      } else {
        g.say('It is already pressed. The penthouse is waiting.');
      }
      return true;
    }

    if (cmd.is('talk', 'faith')) {
      g.say(
        g.flag('faithAsleep')
          ? 'She is not taking questions.'
          : '"Can I help you," she says, in a way that has no question in it ' +
            'at all. "Sorry. Long night. Headache."',
      );
      return true;
    }

    if (cmd.verb === 'kiss' && cmd.object === 'faith') {
      g.say(
        g.flag('faithAsleep')
          ? 'No. Absolutely not. You have some standards, and this is where ' +
            'they turn out to be.'
          : 'She holds up one finger without looking at you, and you stop.',
      );
      return true;
    }

    return false;
  },
};
