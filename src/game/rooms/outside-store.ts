import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { drawPayphone } from './props.js';
import { HOTLINE, SCRATCHED, DELIVERY, isNumber, dialledNumber } from '../phone.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 126;

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.InsideStore,
    label: 'Store',
    side: 'back',
    x: 238,
    y: FLOOR,
    w: 40,
    h: 46,
    colour: C.pewter,
    through: C.cyanLit,
    spill: C.cyanPale,
  },
  { to: RoomId.Taxi, label: 'Cab', side: 'left', y: 152, w: 36 },
];

/**
 * The corner outside the liquor store: a payphone, a man on the step who would
 * like a drink, and a cab that has not switched its engine off.
 */
export const outsideStoreScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 44, 60, 0x2b1f77);
    p.skyline(60, 16, 40, C.navy, C.yellow, 0x99ccdd);

    // The store front, glass and fluorescent.
    p.ink(C.slate).box(96, 30, 224, 92);
    p.ink(C.grey).box(96, 30, 224, 8);
    p.ink(C.white).box(104, 40, 96, 20);
    p.ink(C.maroon).box(106, 42, 92, 16);
    p.ink(C.yellow).box(110, 46, 84, 3).box(110, 52, 60, 3);
    p.ink(C.cyan).box(206, 40, 106, 18);
    p.ink(C.navy).box(208, 42, 102, 14);

    // Windows full of light and stacked stock.
    p.ink(C.white).box(104, 66, 96, 52);
    p.ink(C.cyan).box(106, 68, 92, 48);
    p.ink(C.slate).line(152, 68, 152, 115);
    p.ink(C.brown);
    for (let y = 74; y < 112; y += 12) p.line(108, y, 196, y);
    p.ink(C.red).dots([116, 80, 130, 80, 168, 92, 182, 104]);

    // The door, propped open with a crate.
    p.ink(C.cyan).box(216, 66, 44, 56);
    p.ink(C.white).outline(215, 65, 46, 58);
    p.ink(C.slate).box(236, 66, 3, 56);
    p.ink(C.brown).box(262, 104, 14, 18);

    // Step and shopfront kerb.
    p.ink(C.grey).box(96, 118, 224, 8);
    p.ink(C.slate).line(96, 118, 319, 118);

    // Pavement and road.
    p.ink(C.slate).box(0, 126, p.width, 16);
    p.ink(C.grey).line(0, 126, p.width - 1, 126);
    p.ink(C.black).box(0, 142, p.width, p.height - 142);
    p.ink(C.slate).line(0, 142, p.width - 1, 142);
    p.ink(C.yellow);
    for (let x = 10; x < p.width; x += 46) p.box(x, 158, 22, 3);

    // A litter bin, and a hydrant that has been hit at least once.
    p.ink(darker(C.slate)).box(60, 96, 22, 30);
    p.ink(C.slate).box(58, 92, 26, 5);
    p.ink(C.red).box(24, 104, 10, 22);
    p.ink(C.maroon).box(20, 110, 18, 5).box(26, 100, 6, 5);

    p.depthRamp(126, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(56, 118, 30, 12);
    p.blockRect(18, 118, 22, 10);
  });

const PHONE = new Actor({
  id: 'payphone',
  x: 288,
  y: 138,
  depth: 12,
  width: 36,
  height: 78,
  render: (p, a) => drawPayphone(p, a.x, a.y),
});

const WINE_MAN = new Actor({
  id: 'wineman',
  x: 128,
  y: 132,
  facing: 'right',
  depth: 7,
  style: {
    hair: C.grey,
    hairStyle: 'short',
    skin: C.brown,
    top: C.brown,
    shirt: C.yellow,
    bottom: C.green,
    shoes: C.black,
    build: 4,
    height: 24,
  },
});

export const outsideStore: RoomDef = {
  id: RoomId.OutsideStore,
  title: 'Outside the Store',
  scene: outsideStoreScene,

  horizon: 126,
  scaleAtHorizon: 0.66,

  entries: {
    default: { x: 176, y: 150, facing: 'right' },
    [RoomId.InsideStore]: { x: 238, y: 134, facing: 'front' },
    [RoomId.Taxi]: { x: 40, y: 152, facing: 'right' },
  },

  describe:
    'A corner lit like an operating theatre by the store window. There is a ' +
    'payphone at the kerb, a bin, a hydrant with a dent in it, and a man ' +
    'sitting on the step with an empty bottle and an expectant manner.',

  populate: () => [PHONE, WINE_MAN],

  hotspots: [
    {
      noun: 'wineman',
      synonyms: ['man', 'tramp', 'beggar', 'fellow', 'him', 'guy'],
      look: (g) =>
        g.hasAwarded('gave-wine')
          ? 'He is working steadily through the bottle and nodding at you in a ' +
            'way that suggests you are now, permanently, his friend.'
          : 'A man of indeterminate age sitting on the step, turning an empty ' +
            'bottle in his hands and looking at it the way you look at your life.',
    },
    {
      noun: 'payphone',
      synonyms: ['phone', 'telephone', 'call box', 'booth'],
      look: (g) =>
        g.hasAwarded('looked-at-phone')
          ? `Scratched into the casing beside the keypad: ${SCRATCHED}.`
          : 'A payphone that has survived things. The receiver still has a cord, ' +
            'which around here counts as luxury.',
    },
    { noun: 'store', synonyms: ['shop', 'window', 'storefront'], look: 'Open all night, lit like a stadium, and completely empty.' },
    { noun: 'bin', synonyms: ['litter bin', 'trash can'], look: 'Full, and slightly beyond full.' },
    { noun: 'hydrant', look: 'A fire hydrant wearing a dent the exact width of a car bumper.' },
  ],

  exits: exitsOf(DOORS),

  onTick(g) {
    // Once you have made the joke call, the phone rings back.
    if (g.hasAwarded('joke-call') && !g.flag('phoneRinging') && !g.hasAwarded('answered-phone')) {
      const waited = g.bump('phoneRingDelay');
      if (waited === 12) {
        g.set('phoneRinging');
        g.cue('error');
        g.say('The payphone rings.');
      }
    }
  },

  onCommand(g, cmd) {
    // ---- the man on the step ----------------------------------------------
    const givingWine =
      (cmd.verb === 'give' && cmd.mentions(ItemId.Wine)) ||
      cmd.is('give', ItemId.Wine, 'wineman');

    if (givingWine) {
      if (!g.has(ItemId.Wine)) {
        g.say('You have no wine to give.');
        return true;
      }
      if (g.hasAwarded('gave-wine')) {
        g.say('He is already provided for.');
        return true;
      }
      g.take(ItemId.Wine);
      g.give(ItemId.Knife);
      g.award(5, 'gave-wine');
      g.cue('score');
      g.say(
        'You hand him the bag. He looks inside, looks at you, and looks back ' +
          'inside, as though checking it is not a trick.',
        '"You are a gentleman," he says, which is the first time anyone has ' +
          'said that to you and meant it.',
        'He digs in his coat and presses a small folding knife into your hand. ' +
          '"Take it. Town like this."',
      );
      return true;
    }

    if (cmd.is('talk', 'wineman')) {
      g.say(
        g.hasAwarded('gave-wine')
          ? '"You are all right," he says. "You are all right."'
          : '"Cold night," he says, and shakes the empty bottle at you, gently, ' +
            'in case you have missed the point.',
      );
      return true;
    }

    // ---- the payphone ------------------------------------------------------
    if (g.flag('phoneRinging') && (cmd.verb === 'answer' || cmd.isAny('get', 'payphone'))) {
      g.set('phoneRinging', false);
      g.award(5, 'answered-phone');
      g.cue('score');
      g.say(
        'You pick up on the fourth ring, because a ringing payphone is a thing ' +
          'no human being can walk past.',
        '"You called this number," says a woman, sounding tired. "Everyone who ' +
          `calls this number wants the same thing. Try ${DELIVERY}. And do not ` +
          'call here again."',
        'She hangs up. You write the number on your hand.',
      );
      g.set('knowsDelivery');
      return true;
    }

    if (cmd.is('look', 'payphone')) {
      if (g.award(1, 'looked-at-phone')) {
        g.cue('score');
        g.say(
          'You inspect the payphone properly, the way a man does when he has ' +
            'run out of other ideas.',
          `Scratched into the casing beside the keypad, in letters made with a ` +
            `key, is a number: ${SCRATCHED}.`,
        );
        return true;
      }
      return false;
    }

    const dialling =
      cmd.verb === 'call' ||
      (cmd.mentions('payphone') && cmd.verb === 'use') ||
      dialledNumber(cmd.raw) !== null;

    if (dialling) {
      const raw = cmd.raw;

      if (isNumber(raw, HOTLINE)) {
        if (g.award(2, 'called-hotline')) {
          g.cue('score');
          g.say(
            `You dial ${HOTLINE} and get a recording made by somebody who was ` +
              'reading it for the first time.',
            '"...thank you for calling. If you are looking for a good evening ' +
              'in Lost Wages, the disco on Third is where everyone is. Note ' +
              'that the door is selective, and that the door does not care who ' +
              'you are, only what you are holding."',
            'It repeats. You hang up.',
          );
          g.set('knowsAboutDisco');
        } else {
          g.say('The same recording. It has not improved.');
        }
        return true;
      }

      if (isNumber(raw, SCRATCHED)) {
        if (!g.hasAwarded('looked-at-phone')) {
          g.say('You would need a number to dial. There is not one written down anywhere obvious.');
          return true;
        }
        if (g.award(5, 'joke-call')) {
          g.cue('score');
          g.say(
            'You dial the scratched number, because it is there and because ' +
              'you are the sort of man who dials numbers scratched into payphones.',
            'It rings eleven times. Someone picks up, breathes into the receiver ' +
              'for a full four seconds, and says, "No."',
            'The line goes dead. You stand holding the receiver, feeling that ' +
              'the exchange went as well as it could have.',
          );
        } else {
          g.say('You try it again. This time nobody picks up at all.');
        }
        return true;
      }

      if (isNumber(raw, DELIVERY)) {
        if (!g.flag('knowsDelivery')) {
          g.say('The number rings out. You are not sure why you tried it.');
          return true;
        }
        if (g.award(5, 'called-delivery')) {
          g.set('orderedWine');
          g.cue('score');
          g.say(
            `You dial ${DELIVERY}. A man answers on the first ring and does not ` +
              'say the name of any business.',
            '"Wine," you say, and then, inspired, "for a lady. At the disco."',
            '"It will be there," he says, and hangs up before you can ask what ' +
              'it will cost, which is how you know it will cost a great deal.',
          );
        } else {
          g.say('"It is already coming," says the man, and hangs up again.');
        }
        return true;
      }

      if (dialledNumber(raw)) {
        g.say('You dial. It rings and rings and nobody in Lost Wages answers it.');
        return true;
      }

      g.say(
        g.hasAwarded('looked-at-phone')
          ? 'You lift the receiver. You will need to dial an actual number, ' +
            'for example CALL 555-1234.'
          : 'You lift the receiver and realise you have nobody to call.',
      );
      return true;
    }

    return false;
  },
};
