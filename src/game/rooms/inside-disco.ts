import { paint } from '../../engine/scene.js';
import { C, shade } from '../../engine/palette.js';
import { propHeight, personWidthAt } from '../scale.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { rng, randInt } from '../../engine/rng.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

/** Where the floor meets the back of the room. */
const FLOOR = 92;
/** Perspective, declared here so the furniture can be sized off the figure. */
const AT_HORIZON = 0.56;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideDisco, label: 'Street', side: 'front', x: 160, w: 46 },
];

/**
 * The disco. A lit floor, a mirror ball, and one woman at a table who is the
 * entire reason you came to this town.
 */
export const insideDiscoScene = () =>
  paint((p) => {
    // ---- the room ----------------------------------------------------------
    // Dark, but not empty: the walls are lit violet from the floor up, so the
    // upper half of the picture reads as a room rather than as nothing.
    p.ink(C.violetDeep).box(0, 0, p.width, p.height);
    p.sweep(0, 0, p.width, FLOOR, -2, 0);
    p.slab(0, 0, p.width, 8, C.ink, 1);

    // ---- mirror ball -------------------------------------------------------
    p.ink(C.asphalt).box(158, 8, 4, 8);
    p.ink(C.silver).solid([150, 16, 170, 16, 174, 28, 166, 36, 154, 36, 146, 28]);
    p.ink(C.grey);
    for (let y = 18; y < 35; y += 3) p.line(148, y, 172, y);
    for (let x = 149; x < 173; x += 4) p.line(x, 17, x, 35);
    p.ink(C.white).dots([154, 22, 158, 20, 162, 24]);
    p.glow(160, 26, 30, C.violet, 0.45, [C.violetDeep, C.violetDim, C.violet]);

    // Its scatter across the walls, thinning towards the edges.
    const spark = rng(0x0d15c0);
    for (let i = 0; i < 90; i++) {
      const x = randInt(spark, 0, 319);
      const y = randInt(spark, 0, FLOOR - 4);
      p.ink(Math.abs(x - 160) > 110 ? C.violetLit : C.lavender).dot(x, y);
    }

    // ---- back wall: light banks over a DJ booth -----------------------------
    for (let r = 0; r < 3; r++) {
      const colour = [C.magenta, C.blue, C.crimson][r];
      for (let x = 8; x < 312; x += 22) {
        p.slab(x, 12 + r * 10, 14, 6, colour, 1);
        p.glow(x + 7, 15 + r * 10, 9, shade(colour, -2), 0.35, [
          C.violetDeep,
          C.violetDim,
          C.violet,
        ]);
      }
    }
    p.slab(118, 44, 84, 36, C.asphalt, 1);
    p.ink(C.ink).box(124, 50, 32, 22).box(164, 50, 32, 22);
    p.slab(130, 54, 20, 14, C.pewter, 1);
    p.slab(170, 54, 20, 14, C.pewter, 1);
    p.ink(C.redLit).dots([126, 76, 134, 76, 186, 76, 194, 76]);

    // ---- speaker stacks ----------------------------------------------------
    for (const sx of [14, 268]) {
      p.slab(sx, 40, 38, 76, C.woodDeep, 1);
      p.slab(sx + 6, 50, 26, 24, C.asphalt, 1);
      p.ink(C.ink).box(sx + 12, 56, 14, 12);
      p.slab(sx + 8, 82, 22, 22, C.asphalt, 1);
      p.ink(C.ink).box(sx + 13, 87, 12, 12);
      p.contact(sx, 112, 38, 6, -2);
    }

    // ---- the lit dance floor -----------------------------------------------
    // Six colours rather than eight, in a repeating order, so the floor reads
    // as tiles catching the lights instead of as confetti.
    const rows = 6;
    const palette = [C.pink, C.cyan, C.gold, C.greenLit, C.violetLit, C.blueLit];
    for (let r = 0; r < rows; r++) {
      const t0 = Math.pow(r / rows, 1.5);
      const t1 = Math.pow((r + 1) / rows, 1.5);
      const y0 = 92 + t0 * 50;
      const y1 = 92 + t1 * 50;
      const s0 = 40 + t0 * 130;
      const s1 = 40 + t1 * 130;
      for (let c = 0; c < 8; c++) {
        p.ink(palette[(r + c) % palette.length]);
        p.solid([
          160 + ((c - 4) / 4) * s0,
          y0,
          160 + ((c - 3) / 4) * s0,
          y0,
          160 + ((c - 3) / 4) * s1,
          y1,
          160 + ((c - 4) / 4) * s1,
          y1,
        ]);
      }
      // Far rows sit further from the lamps, which also settles the colour.
      p.relight(0, y0, p.width, Math.max(1, y1 - y0), -2 + r * 0.5);
    }
    p.ink(C.ink).box(0, 142, p.width, p.height - 142);
    p.ink(C.violetDeep).box(0, 142, p.width, 6);
    p.contact(0, 142, p.width, 8, -2);

    // ---- booth tables either side of the floor ------------------------------
    // Sized off the person who would sit at them rather than by eye: a table
    // top comes to a little under half the height of someone standing beside
    // it, and seats two.
    for (const [tx, base] of [
      [42, 148],
      [274, 152],
    ] as const) {
      const h = propHeight('tableTop', base, FLOOR, AT_HORIZON);
      const half = Math.round(personWidthAt(base, FLOOR, AT_HORIZON) * 1.2);
      const top = base - h;
      const apron = Math.max(2, Math.round(h * 0.3));
      p.ink(C.maroonDeep).solid([
        tx - half,
        top,
        tx + half,
        top,
        tx + half - 3,
        top + apron,
        tx - half + 3,
        top + apron,
      ]);
      p.ink(C.maroon).line(tx - half, top, tx + half - 1, top);
      p.ink(C.ink).box(tx - 2, top + apron, 5, base - top - apron);
      p.ink(C.maroonDeep).box(tx - Math.round(half * 0.5), base - 2, half, 3);
      p.ink(C.gold).box(tx - 2, top - 7, 3, 7);
      p.ink(C.yellowPale).dot(tx - 1, top - 9);
      p.glow(tx - 1, top - 9, 14, C.violetDim, 0.4, [C.ink, C.violetDeep]);
      p.contact(tx - half, base, half * 2, 4, -2);
    }

    doorways(p, DOORS);
    p.depthRamp(92, p.height, 4, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    // Collision follows the tables' new footprint.
    p.blockRect(24, 134, 38, 16);
    p.blockRect(256, 138, 38, 16);
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

  horizon: FLOOR,
  scaleAtHorizon: AT_HORIZON,

  entries: {
    default: { x: 160, y: 154, facing: 'back' },
    [RoomId.OutsideDisco]: { x: 160, y: 152, facing: 'back' },
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
    {
      noun: 'floor',
      synonyms: ['dance floor', 'dancefloor'],
      look: 'Lit squares in colours that change on a cycle set by somebody with a grudge.',
    },
    {
      noun: 'ball',
      synonyms: ['mirror ball', 'glitterball'],
      look: 'A mirror ball turning at a speed that suggests the motor is failing.',
    },
    {
      noun: 'booth',
      synonyms: ['dj', 'dj booth', 'decks'],
      look: 'A booth with two decks and nobody behind them. The music is coming from somewhere else.',
    },
    {
      noun: 'table',
      synonyms: ['tables', 'booths'],
      look: 'Two booth tables, each with a candle in a red glass.',
    },
  ],

  exits: exitsOf(DOORS),

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
        g.say(
          'You dance alone in an empty disco for a while. Nobody joins you. Nobody ever will.',
        );
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
        g.say(
          'You would have to go and sit with her first. Shouting across a disco is not courtship.',
        );
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
