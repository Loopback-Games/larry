import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { rng, randInt } from '../../engine/rng.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

/**
 * The disco. A lit floor, a mirror ball, and one woman at a table who is the
 * entire reason you came to this town.
 */
export const insideDiscoScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);

    // Mirror ball and its scatter.
    p.ink(C.slate).box(158, 4, 5, 10);
    p.ink(C.white).solid([150, 14, 170, 14, 174, 26, 166, 34, 154, 34, 146, 26]);
    p.ink(C.grey);
    for (let y = 16; y < 33; y += 3) p.line(147, y, 173, y);
    for (let x = 148; x < 174; x += 4) p.line(x, 15, x, 33);
    const spark = rng(0x0d15c0);
    p.ink(C.white);
    for (let i = 0; i < 70; i++) p.dot(randInt(spark, 0, 319), randInt(spark, 0, 88));

    // Back wall: banks of coloured lights over a DJ booth.
    for (let r = 0; r < 3; r++) {
      const colour = [C.purple, C.blue, C.maroon][r];
      p.ink(colour);
      for (let x = 8; x < 312; x += 22) p.box(x, 12 + r * 10, 14, 6);
    }
    p.ink(darker(C.slate)).box(120, 44, 80, 34);
    p.ink(C.slate).outline(120, 44, 80, 34);
    p.ink(C.black).box(126, 50, 30, 20).box(164, 50, 30, 20);
    p.ink(C.grey).solid([132, 54, 150, 54, 150, 66, 132, 66]);
    p.ink(C.grey).solid([170, 54, 188, 54, 188, 66, 170, 66]);
    p.ink(C.red).dots([128, 74, 136, 74, 188, 74, 196, 74]);

    // Speaker stacks.
    for (const sx of [16, 268]) {
      p.ink(darker(C.brown)).box(sx, 40, 36, 74);
      p.ink(C.black).outline(sx, 40, 36, 74);
      p.ink(C.slate).solid([sx + 6, 50, sx + 30, 50, sx + 30, 72, sx + 6, 72]);
      p.ink(C.black).box(sx + 12, 56, 12, 10);
      p.ink(C.slate).box(sx + 8, 80, 20, 20);
      p.ink(C.black).box(sx + 13, 85, 10, 10);
    }

    // The lit dance floor, receding.
    const rows = 6;
    const palette = [C.pink, C.cyan, C.yellow, C.lime, C.purple, C.red, C.blue, C.white];
    for (let r = 0; r < rows; r++) {
      const t0 = Math.pow(r / rows, 1.5);
      const t1 = Math.pow((r + 1) / rows, 1.5);
      const y0 = 92 + t0 * 50;
      const y1 = 92 + t1 * 50;
      const s0 = 40 + t0 * 130;
      const s1 = 40 + t1 * 130;
      for (let c = 0; c < 8; c++) {
        p.ink(palette[(r * 3 + c) % palette.length]);
        p.solid([
          160 + ((c - 4) / 4) * s0, y0,
          160 + ((c - 3) / 4) * s0, y0,
          160 + ((c - 3) / 4) * s1, y1,
          160 + ((c - 4) / 4) * s1, y1,
        ]);
      }
    }
    p.ink(C.black).box(0, 142, p.width, p.height - 142);
    p.ink(darker(C.slate)).line(0, 142, p.width - 1, 142);

    // Booth tables either side of the floor, out of the light.
    for (const [tx, ty] of [[42, 132], [274, 134]] as const) {
      p.ink(darker(C.maroon)).solid([tx - 24, ty, tx + 24, ty, tx + 20, ty + 10, tx - 20, ty + 10]);
      p.ink(C.maroon).line(tx - 24, ty, tx + 23, ty);
      p.ink(C.black).box(tx - 3, ty + 10, 6, 14);
      p.ink(darker(C.maroon)).box(tx - 14, ty + 24, 28, 4);
      p.ink(C.yellow).box(tx - 4, ty - 6, 3, 6);
      p.ink(C.red).dot(tx - 3, ty - 8);
    }

    p.depthRamp(92, p.height, 4, 14);
    p.blockRect(0, 0, p.width, 92);
    p.blockRect(18, 126, 50, 22);
    p.blockRect(250, 128, 50, 22);
  });

const FAWN = new Actor({
  id: 'fawn',
  x: 250,
  y: 130,
  facing: 'left',
  depth: 9,
  style: {
    hair: C.yellow,
    hairStyle: 'bouffant',
    skin: C.pink,
    top: C.white,
    bottom: C.cyan,
    legwear: 'skirt',
    shoes: C.white,
    build: 3,
    height: 29,
  },
});

/** Gifts in the order she expects them, with what each is worth. */
const GIFTS: readonly { item: string; key: string; points: number; lines: string[] }[] = [
  {
    item: ItemId.Rose,
    key: 'gave-rose',
    points: 5,
    lines: [
      'You produce the rose. It has been in your pocket for some hours and it ' +
        'shows, but she takes it and turns it over and looks, briefly, like ' +
        'somebody nobody has given a flower to in a while.',
      '"That is sweet," she says, and means it, which throws you completely.',
    ],
  },
  {
    item: ItemId.Candy,
    key: 'gave-candy',
    points: 5,
    lines: [
      'You put the box of chocolates on the table.',
      'She opens it, notes the two missing, decides not to raise it, and eats ' +
        'one. "You are trying," she says. "I will give you that."',
    ],
  },
  {
    item: ItemId.Ring,
    key: 'gave-ring',
    points: 5,
    lines: [
      'You put the diamond ring on the table between the drinks.',
      'The lights go round. The stone does something spectacular. She stops ' +
        'talking mid-sentence.',
      '"Larry," she says, using your name for the first time, "what exactly ' +
        'are you proposing?"',
    ],
  },
];

function courtshipStage(g: Game): number {
  return GIFTS.filter((gift) => g.hasAwarded(gift.key)).length;
}

export const insideDisco: RoomDef = {
  id: RoomId.InsideDisco,
  title: 'The Disco',
  scene: insideDiscoScene,

  entries: {
    default: { x: 160, y: 160, facing: 'back' },
    [RoomId.OutsideDisco]: { x: 160, y: 156, facing: 'back' },
  },

  describe:
    'A lit floor, a mirror ball throwing pieces of light around a room that ' +
    'is almost empty, and a woman at the far booth with a drink she is not ' +
    'drinking. She is the only other person in here who is not being paid to be.',

  populate: () => [FAWN],

  hotspots: [
    {
      noun: 'fawn',
      synonyms: ['girl', 'woman', 'lady', 'her', 'blonde', 'she'],
      look: (g) => {
        if (!g.hasAwarded('looked-once')) {
          g.award(0, 'looked-once');
          return (
            'You look across at her, and she looks back, and you look at the ' +
            'floor. Standard opening.'
          );
        }
        if (g.award(1, 'looked-twice')) {
          g.cue('score');
          return [
            'You look again, properly this time.',
            'She is bored out of her mind. Her drink has not moved. She is ' +
              'here because being here is better than being at home, which is ' +
              'the only thing the two of you have in common and, tonight, it ' +
              'is going to be enough.',
          ];
        }
        return 'Still bored. Still here. Still, for reasons of her own, looking back.';
      },
    },
    { noun: 'floor', synonyms: ['dance floor', 'dancefloor'], look: 'Lit squares in colours that change on a cycle set by somebody with a grudge.' },
    { noun: 'ball', synonyms: ['mirror ball', 'glitterball'], look: 'A mirror ball turning at a speed that suggests the motor is failing.' },
    { noun: 'booth', synonyms: ['dj', 'dj booth', 'decks'], look: 'A booth with two decks and nobody behind them. The music is coming from somewhere else.' },
    { noun: 'table', synonyms: ['tables', 'booths'], look: 'Two booth tables, each with a candle in a red glass.' },
  ],

  exits: [{ x: 128, y: 162, w: 64, h: 6, to: RoomId.OutsideDisco }],

  onCommand(g, cmd) {
    // ---- sitting down -----------------------------------------------------
    if (cmd.isBare('sit') || cmd.isAny('sit', 'table', 'booth')) {
      if (g.award(1, 'sat-with-fawn')) {
        g.set('satWithFawn');
        g.cue('score');
        g.say(
          'You cross the floor and sit down at her table without being asked, ' +
            'which is either confidence or the absence of anything else to do.',
          'She does not get up. This is the single most encouraging thing that ' +
            'has happened to you this year.',
        );
      } else {
        g.say('You are already sitting with her. Do not push it.');
      }
      return true;
    }

    const seated = g.hasAwarded('sat-with-fawn');

    // ---- dancing ----------------------------------------------------------
    if (cmd.verb === 'dance') {
      if (!seated) {
        g.say('You dance alone in an empty disco for a while. Nobody joins you. Nobody ever will.');
        return true;
      }
      if (g.award(5, 'danced')) {
        g.set('danced');
        g.cue('victory');
        g.say(
          'You ask her to dance. She looks at you for slightly too long and ' +
            'then says "Why not."',
          'What follows is four minutes of you doing something you learned in ' +
            '1974 and have not revisited since. She matches it, move for move, ' +
            'entirely straight-faced.',
          'By the end of it you are both laughing, and you have stopped being ' +
            'a man in a leisure suit and become, briefly, good company.',
        );
      } else {
        g.say('You have danced. Quit while you are ahead.');
      }
      return true;
    }

    // ---- talking ----------------------------------------------------------
    if (cmd.is('talk', 'fawn') || cmd.isBare('talk')) {
      if (!seated) {
        g.say('You would have to go and sit with her first. Shouting across a disco is not courtship.');
        return true;
      }
      if (g.award(1, 'talked-to-fawn')) {
        g.cue('score');
        g.say(
          '"Fawn," she says, when you finally ask.',
          'She talks for a while about nothing much: the club, the town, a job ' +
            'she left. You listen, which you have not done in years, and it ' +
            'turns out to be the most effective thing you have ever done.',
        );
      } else {
        g.say('"You are still here," she says, pleased and not hiding it well.');
      }
      return true;
    }

    // ---- gifts ------------------------------------------------------------
    for (let i = 0; i < GIFTS.length; i++) {
      const gift = GIFTS[i];
      if (!(cmd.verb === 'give' && cmd.mentions(gift.item))) continue;
      if (!g.has(gift.item)) {
        g.say('You do not have that.');
        return true;
      }
      if (!seated || !g.flag('danced')) {
        g.say(
          'You are not there yet. Sit with her, talk to her, dance with her. ' +
            'Then start handing things over.',
        );
        return true;
      }
      if (g.hasAwarded(gift.key)) {
        g.say('You have already given her that.');
        return true;
      }
      if (courtshipStage(g) !== i) {
        g.say(
          'It is not the moment for that. There is an order to these things, ' +
            'even for you.',
        );
        return true;
      }
      g.take(gift.item);
      g.award(gift.points, gift.key);
      g.cue('score');
      g.say(gift.lines);
      return true;
    }

    // ---- the money --------------------------------------------------------
    const offeringMoney =
      (cmd.verb === 'give' && (cmd.mentions(ItemId.Wallet) || /money|cash/i.test(cmd.raw))) ||
      cmd.verb === 'pay';

    if (offeringMoney) {
      if (courtshipStage(g) < GIFTS.length) {
        g.say(
          'You reach for your wallet. Something in her expression stops your ' +
            'hand before it gets there.',
        );
        return true;
      }
      if (g.award(7, 'gave-money')) {
        g.set('fawnReady');
        g.cue('victory');
        g.say(
          '"Right," she says. "Here is where we are. I like you, which has ' +
            'surprised us both. But I am not doing any of this in Lost Wages ' +
            'on a Tuesday for free."',
          'You give her everything in your wallet. It is not a large amount ' +
            'and she counts it anyway, and then she puts it away and takes ' +
            'your arm.',
          '"There is a chapel two streets over that never closes," she says. ' +
            '"Do you want to do something stupid?"',
          'You have never wanted anything more.',
        );
      } else {
        g.say('She has your money. All of it. She is aware of this.');
      }
      return true;
    }

    if (cmd.isAny('kiss', 'fawn')) {
      g.say(
        g.flag('fawnReady')
          ? '"Chapel first," she says.'
          : 'She puts a hand flat on your chest. "Slow down, Larry."',
      );
      return true;
    }

    if (cmd.verb === 'marry') {
      g.say(
        g.flag('fawnReady')
          ? 'She is way ahead of you. There is a chapel two streets over.'
          : 'You have known her for four minutes. Even you can see the problem.',
      );
      return true;
    }

    return false;
  },
};
