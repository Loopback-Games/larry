import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

const SYMBOLS = ['CHERRY', 'BELL', 'BAR', 'SEVEN', 'LEMON', 'PLUM'] as const;
/** Payout multiplier for three of a kind. */
const TRIPLE: Readonly<Record<string, number>> = {
  CHERRY: 5,
  BELL: 8,
  BAR: 12,
  SEVEN: 40,
  LEMON: 3,
  PLUM: 4,
};
export const SLOT_BET = 5;

/** A single slot machine, seen close up. */
export const slotsScene = () =>
  paint((p) => {
    p.ink(C.maroon).box(0, 0, p.width, p.height);
    p.ink(darker(C.maroon));
    for (let y = 6; y < p.height; y += 16) p.line(0, y, p.width - 1, y);

    // Cabinet.
    p.ink(darker(C.slate)).box(64, 8, 192, 152);
    p.ink(C.slate).outline(64, 8, 192, 152);
    p.ink(C.grey).box(70, 14, 180, 140);

    // Marquee.
    p.ink(C.red).box(80, 20, 160, 30);
    p.ink(C.yellow).outline(80, 20, 160, 30);
    p.ink(C.white).box(94, 28, 132, 6).box(112, 40, 96, 4);
    p.ink(C.yellow);
    for (let x = 84; x < 240; x += 10) p.dot(x, 18).dot(x, 52);

    // Three reel windows.
    for (let i = 0; i < 3; i++) {
      const rx = 84 + i * 54;
      p.ink(C.black).box(rx, 60, 46, 50);
      p.ink(C.white).box(rx + 3, 63, 40, 44);
      p.ink(C.slate)
        .line(rx + 3, 70, rx + 42, 70)
        .line(rx + 3, 100, rx + 42, 100);
      p.ink([C.red, C.lime, C.blue][i]).box(rx + 12, 76, 22, 18);
      p.ink(C.black).outline(rx + 12, 76, 22, 18);
    }

    // Coin slot, payout tray and the arm.
    p.ink(C.yellow).box(150, 118, 20, 5);
    p.ink(C.black).box(154, 119, 12, 3);
    p.ink(darker(C.slate)).box(96, 130, 128, 20);
    p.ink(C.black).box(100, 134, 120, 14);
    p.ink(C.slate).box(256, 74, 10, 40);
    p.ink(C.red).solid([252, 62, 270, 62, 270, 76, 252, 76]);

    p.blockRect(0, 0, p.width, 160);
    p.depthRamp(160, p.height, 12, 14);
  });

function spin(g: Game): void {
  const money = g.counter('money');
  if (money < SLOT_BET) {
    g.say('You go through your pockets twice. There is not enough there for another go.');
    return;
  }
  g.bump('money', -SLOT_BET);
  const reels = [0, 1, 2].map(() => SYMBOLS[g.roll(0, SYMBOLS.length - 1)]);
  const line = reels.join('  -  ');

  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    const win = SLOT_BET * TRIPLE[reels[0]];
    g.bump('money', win);
    g.bump('slotWins');
    g.cue('victory');
    g.say(
      line,
      `Three of them. The machine makes a noise it has clearly been saving up ` +
        `and pays out $${win}.`,
      `You now have $${g.counter('money')}.`,
    );
    return;
  }
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    const win = SLOT_BET * 2;
    g.bump('money', win);
    g.cue('coin');
    g.say(
      line,
      `Two matching. It gives you back $${win}, which is not winning, but is not losing.`,
    );
    return;
  }
  g.cue('error');
  g.say(
    line,
    `Nothing. You are $${SLOT_BET} lighter and you have $${g.counter('money')} left.`,
  );
}

export const slots: RoomDef = {
  id: RoomId.Slots,
  title: 'The Slot Machine',
  closeup: true,
  leaveTo: RoomId.InsideCasino,
  scene: slotsScene,

  entries: { default: { x: 160, y: 154, facing: 'back' } },

  describe:
    'A slot machine the height of a wardrobe, lit like a small cathedral. ' +
    `Five dollars a pull. It is not complicated, and neither are you.`,

  hotspots: [
    {
      noun: 'machine',
      synonyms: ['slot machine', 'slots', 'bandit'],
      look: 'Three reels, one arm, and a payout tray with nothing in it.',
    },
    {
      noun: 'arm',
      synonyms: ['lever', 'handle'],
      look: 'A chrome arm with a red ball on the end, worn smooth.',
    },
    {
      noun: 'tray',
      synonyms: ['payout tray', 'payout'],
      look: 'Empty, and polished by generations of hopeful hands.',
    },
  ],

  onEnter(g) {
    if (!g.flag('seenSlots')) {
      g.set('seenSlots');
      g.say(
        `Five dollars a pull. You have $${g.counter('money')}.`,
        'PULL the arm to play, or LEAVE to go back to the floor.',
      );
    }
  },

  onCommand(g, cmd) {
    if (
      cmd.verb === 'pull' ||
      cmd.verb === 'play' ||
      cmd.verb === 'bet' ||
      cmd.isAny('use', 'machine', 'arm')
    ) {
      spin(g);
      return true;
    }
    if (cmd.verb === 'look' && cmd.object === 'tray') {
      g.say('Empty. Obviously.');
      return true;
    }
    return false;
  },
};
