import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The terrace, the hot tub, and Eve. This is the last room, and the last four
 * commands of the night decide how the whole thing has gone.
 */
export const penthouseHotTubScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);

    // The sky, beginning to think about morning.
    p.gradient(0, 0, p.width, 56, C.navy, C.black);
    p.ink(C.white).stars(0, 0, p.width, 40, 30, 0xeee111);
    p.ink(C.purple).box(0, 48, p.width, 8);
    p.ink(C.maroon).box(0, 54, p.width, 6);

    // The city, far below and behind the parapet.
    p.skyline(72, 10, 26, C.black, C.yellow, 0x3141592);

    // Terrace parapet.
    p.ink(C.grey).box(0, 72, p.width, 10);
    p.ink(C.white).line(0, 72, p.width - 1, 72);

    // Tiled decking, laid before anything that stands on it.
    p.ink(C.grey).box(0, 82, p.width, p.height - 82);
    p.ink(C.white);
    for (let x = 0; x < p.width; x += 26) p.line(x, 82, x, p.height - 1);
    for (let y = 90; y < p.height; y += 14) p.line(0, y, p.width - 1, y);
    p.ink(C.slate).line(0, 82, p.width - 1, 82);

    // Potted palms at each end.
    for (const px of [26, 296]) {
      p.ink(C.brown).solid([px - 10, 90, px + 10, 90, px + 7, 112, px - 7, 112]);
      p.ink(C.green);
      for (const [dx, dy] of [[-18, -16], [-8, -24], [4, -26], [16, -18], [0, -12]] as const) {
        p.path([px, 90, px + dx, 90 + dy]);
        p.path([px + dx, 90 + dy, px + dx + (dx > 0 ? -6 : 6), 90 + dy + 6]);
      }
    }

    // The hot tub: tiled surround, lit water, steam rising off it.
    p.ink(C.brown).solid([70, 106, 250, 106, 268, 152, 52, 152]);
    p.ink(darker(C.brown)).line(52, 152, 267, 152);
    p.ink(C.yellow).line(70, 106, 249, 106);
    p.ink(C.teal).solid([84, 112, 236, 112, 250, 144, 70, 144]);
    p.ink(C.cyan).solid([92, 116, 228, 116, 240, 140, 80, 140]);
    p.ink(C.white);
    for (let i = 0; i < 30; i++) {
      const x = 88 + ((i * 41) % 144);
      const y = 119 + ((i * 17) % 20);
      p.dot(x, y).dot(x + 1, y);
    }
    p.ink(C.white).dots([110, 100, 130, 96, 156, 98, 182, 94, 206, 100]);
    p.ink(C.slate).dots([118, 92, 148, 88, 176, 90, 200, 92]);

    // The rope, hanging in from the balcony above.
    p.ink(C.brown).path([300, 0, 296, 30, 300, 60, 294, 88]);

    p.depthRamp(90, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 90);
    p.blockRect(52, 104, 216, 50);
    p.blockRect(14, 86, 26, 28);
    p.blockRect(284, 86, 26, 28);
  });

const EVE = new Actor({
  id: 'eve',
  x: 160,
  y: 116,
  facing: 'front',
  depth: 12,
  style: {
    hair: C.brown,
    hairStyle: 'long',
    skin: C.pink,
    top: C.red,
    bottom: C.red,
    legwear: 'bare',
    shoes: C.pink,
    build: 3,
    height: 20,
  },
});

export const penthouseHotTub: RoomDef = {
  id: RoomId.PenthouseHotTub,
  title: 'The Terrace',
  scene: penthouseHotTubScene,

  entries: {
    default: { x: 292, y: 150, facing: 'left' },
    [RoomId.PenthouseLounge]: { x: 292, y: 150, facing: 'left' },
  },

  describe:
    'A tiled terrace thirty storeys up, with two palms in pots, a low parapet, ' +
    'and a hot tub full of lit water and steam. In the tub, entirely unbothered ' +
    'by your arrival, is a woman watching the sky start to change colour.',

  populate: () => [EVE],

  hotspots: [
    {
      noun: 'eve',
      synonyms: ['woman', 'her', 'she', 'lady', 'girl'],
      look: (g) =>
        g.hasAwarded('used-doll')
          ? 'She is still laughing. She has one arm over the side of the tub ' +
            'and she is looking at you properly for the first time.'
          : 'She is in the water with her arms along the edge of the tub, ' +
            'watching the sky. She has not looked at you once, and it is not ' +
            'rudeness. It is that you have not yet been interesting.',
    },
    { noun: 'tub', synonyms: ['hot tub', 'jacuzzi', 'water'], look: 'Hot, lit from underneath, and steaming in the cold.' },
    { noun: 'parapet', synonyms: ['wall', 'edge', 'city'], look: 'Beyond it, the whole of Lost Wages, going quiet at last.' },
    { noun: 'sky', synonyms: ['sunrise', 'dawn'], look: 'There is a line of colour along the bottom of it. Not long now.' },
    { noun: 'palms', synonyms: ['palm', 'plants', 'pots'], look: 'Two palms in pots, doing well for this altitude.' },
  ],

  exits: [{ x: 296, y: 140, w: 24, h: 28, to: RoomId.PenthouseLounge }],

  onEnter(g) {
    if (!g.flag('metEve')) {
      g.set('metEve');
      g.say(
        'You come down the rope onto the terrace with a landing that you would ' +
          'not call graceful but would defend as survivable.',
        'She does not turn round. "The lift works," she says.',
      );
    }
  },

  onCommand(g, cmd) {
    // ---- the doll ---------------------------------------------------------
    const usingDoll =
      (cmd.verb === 'use' && cmd.mentions(ItemId.Doll)) ||
      (cmd.verb === 'give' && cmd.mentions(ItemId.Doll)) ||
      (cmd.verb === 'put' && cmd.mentions(ItemId.Doll)) ||
      (cmd.verb === 'throw' && cmd.mentions(ItemId.Doll)) ||
      (cmd.verb === 'show' && cmd.mentions(ItemId.Doll));

    if (usingDoll) {
      if (!g.has(ItemId.Doll)) {
        g.say('You do not have it.');
        return true;
      }
      if (!g.flag('dollInflated')) {
        g.say(
          'You produce a folded sheet of pink vinyl and hold it up. It is not ' +
            'the gesture you hoped it would be.',
        );
        return true;
      }
      if (g.hasAwarded('used-doll')) {
        g.say('The doll is bobbing gently at the far end of the tub, doing her work.');
        return true;
      }
      g.take(ItemId.Doll);
      g.award(8, 'used-doll');
      g.cue('victory');
      g.say(
        'You have nothing left. No money, no wife, no plan, and nine minutes ' +
          'of your own breath in an inflatable woman.',
        'So you walk to the edge of the tub, and with the seriousness of a man ' +
          'presenting credentials, you introduce her.',
        '"This is my friend," you say. "She has had a difficult night as well."',
        'And you put the doll in the hot tub.',
        'There is a pause. Then Eve laughs — a proper, undignified, ' +
          'thirty-storeys-up laugh — and does not stop for some time.',
        '"Sit down," she says, when she can. "Sit down, before you do anything ' +
          'else."',
      );
      return true;
    }

    // ---- the apple: the last move of the game ------------------------------
    const offeringApple =
      (cmd.verb === 'give' && cmd.mentions(ItemId.Apple)) ||
      (cmd.verb === 'show' && cmd.mentions(ItemId.Apple)) ||
      (cmd.verb === 'put' && cmd.mentions(ItemId.Apple));

    if (offeringApple) {
      if (!g.has(ItemId.Apple)) {
        g.say('You do not have an apple. It is, remarkably, the one thing you need.');
        return true;
      }
      if (!g.hasAwarded('used-doll')) {
        g.say(
          'You hold out the apple. She glances at it, and at you, and goes ' +
            'back to the sky.',
          'It is not the moment. You will know the moment when it happens.',
        );
        return true;
      }
      g.take(ItemId.Apple);
      g.award(40, 'gave-eve-apple');
      g.set('wonGame');
      g.win(
        'You sit down on the edge of the tub with your shoes in a puddle and ' +
          'your suit ruined, and you take out the last thing you own.',
        'It is an apple. You bought it from an old man at three in the morning ' +
          'for a dollar, for no reason at all, and you have carried it across ' +
          'this entire town.',
        'You offer it to her.',
        'She looks at the apple. She looks at you. Somewhere behind the two of ' +
          'you the sun comes up over Lost Wages and puts a line of gold along ' +
          'the top of every terrible building in it.',
        '"Larry," she says, taking it, "you are the strangest man I have ever met."',
        'And she bites the apple.',
        '',
        '*** You have won ***',
        '',
        `Final score: ${g.score + 40 - 40} of 222.`,
      );
      return true;
    }

    if (cmd.is('talk', 'eve') || cmd.isBare('talk')) {
      g.say(
        g.hasAwarded('used-doll')
          ? '"Go on then," she says. "What else have you got?"'
          : 'You say something. It is not good. She lets it go past her like ' +
            'weather.',
      );
      return true;
    }

    if (cmd.isAny('enter', 'tub') || cmd.isAny('swim', 'tub') || cmd.isBare('swim')) {
      if (!g.hasAwarded('used-doll')) {
        g.say('"No," she says, without heat, and without looking round.');
        return true;
      }
      g.say('You get in, fully dressed, because taking the suit off now would break the spell.');
      return true;
    }

    if (cmd.is('kiss', 'eve')) {
      g.say(
        g.hasAwarded('used-doll')
          ? 'Not yet. You have one thing left to do, and you know exactly what it is.'
          : 'She puts one wet hand flat against your chest. That is as far as that goes.',
      );
      return true;
    }

    return false;
  },
};
