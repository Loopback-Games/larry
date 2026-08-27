import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

export const MIN_BET = 5;

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

/** Draw a card, returning its label and its high value (aces count as 11). */
function draw(g: Game): { label: string; value: number } {
  const r = g.roll(0, 12);
  const s = g.roll(0, 3);
  const value = r === 0 ? 11 : Math.min(r + 1, 10);
  return { label: `${RANKS[r]}${SUITS[s]}`, value };
}

/** Total a hand, demoting aces from 11 to 1 while it is bust. */
function total(values: readonly number[]): number {
  let sum = values.reduce((a, b) => a + b, 0);
  let aces = values.filter((v) => v === 11).length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

/** The card table, seen from a player's seat. */
export const blackjackScene = () =>
  paint((p) => {
    p.ink(C.maroon).box(0, 0, p.width, 60);
    p.ink(darker(C.maroon));
    for (let x = 0; x < p.width; x += 18) p.line(x, 0, x, 59);

    // Baize, sweeping towards the camera.
    p.ink(C.green).solid([0, 60, 319, 60, 319, 167, 0, 167]);
    p.ink(darker(C.green)).solid([40, 60, 280, 60, 320, 130, 0, 130]);
    p.ink(C.green).solid([54, 66, 266, 66, 300, 124, 20, 124]);
    p.ink(C.lime).path([54, 66, 266, 66]);
    p.ink(C.yellow).path([20, 124, 300, 124]);

    // House rules painted on the felt.
    p.ink(C.white).box(112, 76, 96, 4).box(128, 84, 64, 3);

    // Card positions.
    for (let i = 0; i < 3; i++) {
      p.ink(darker(C.green)).outline(96 + i * 40, 94, 26, 20);
    }
    for (let i = 0; i < 2; i++) {
      p.ink(darker(C.green)).outline(120 + i * 40, 132, 30, 24);
    }

    // Dealer shoe and a rack of chips.
    p.ink(C.black).solid([250, 66, 296, 66, 302, 88, 244, 88]);
    p.ink(C.slate).line(250, 66, 295, 66);
    p.ink(C.white).box(258, 70, 26, 4);
    for (let i = 0; i < 5; i++) {
      p.ink([C.white, C.red, C.blue, C.green, C.black][i]).box(28 + i * 12, 74 + i, 10, 14);
      p.ink(C.yellow).line(28 + i * 12, 74 + i, 37 + i * 12, 74 + i);
    }

    p.blockRect(0, 0, p.width, 130);
    p.depthRamp(130, p.height, 10, 14);
  });

const DEALER = new Actor({
  id: 'dealer',
  x: 160,
  y: 62,
  facing: 'front',
  depth: 3,
  style: {
    hair: C.brown,
    hairStyle: 'short',
    skin: C.pink,
    top: C.maroon,
    shirt: C.white,
    accent: C.black,
    bottom: C.black,
    shoes: C.black,
    build: 4,
    height: 26,
  },
});

function settle(g: Game, playerTotal: number, dealerTotal: number): void {
  const bet = g.counter('bjBet');
  g.setCounter('bjState', 0);
  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    g.bump('money', bet * 2);
    g.bump('bjWins');
    g.cue('victory');
    g.say(
      dealerTotal > 21
        ? `The dealer draws to ${dealerTotal} and busts. You win $${bet}.`
        : `You have ${playerTotal}, the dealer has ${dealerTotal}. You win $${bet}.`,
      `You now have $${g.counter('money')}.`,
    );
    return;
  }
  if (playerTotal === dealerTotal) {
    g.bump('money', bet);
    g.say(`Both on ${playerTotal}. Push. Your $${bet} comes back.`);
    return;
  }
  g.cue('error');
  g.say(
    `You have ${playerTotal}, the dealer has ${dealerTotal}. The house takes your $${bet}.`,
    `You have $${g.counter('money')} left.`,
  );
}

function dealerPlays(g: Game): void {
  const values: number[] = [g.counter('bjDealerA'), g.counter('bjDealerB')];
  let shown = total(values);
  const drawn: string[] = [];
  while (shown < 17) {
    const card = draw(g);
    values.push(card.value);
    drawn.push(card.label);
    shown = total(values);
  }
  if (drawn.length) g.say(`The dealer turns over and draws: ${drawn.join(', ')}.`);
  settle(g, g.counter('bjPlayer'), shown);
}

export const blackjack: RoomDef = {
  id: RoomId.Blackjack,
  title: 'The Card Table',
  closeup: true,
  leaveTo: RoomId.InsideCasino,
  scene: blackjackScene,

  entries: { default: { x: 160, y: 154, facing: 'back' } },

  describe:
    'A green baize table with a dealer behind it who has been doing this since ' +
    'the building went up. The felt says DEALER STANDS ON 17. Minimum bet is ' +
    `$${MIN_BET}.`,

  populate: () => [DEALER],

  hotspots: [
    {
      noun: 'dealer',
      synonyms: ['croupier', 'him', 'man'],
      look: 'He deals without looking at his hands and looks at you without expression.',
    },
    {
      noun: 'felt',
      synonyms: ['baize', 'table', 'rules'],
      look: 'DEALER STANDS ON 17. BLACKJACK PAYS EVEN MONEY, which is robbery, politely printed.',
    },
    {
      noun: 'chips',
      synonyms: ['chip', 'rack'],
      look: 'A rack of chips, none of which are yours.',
    },
    {
      noun: 'shoe',
      synonyms: ['dealer shoe', 'cards'],
      look: 'A wooden shoe holding more decks than you can count.',
    },
  ],

  onEnter(g) {
    g.setCounter('bjState', 0);
    if (!g.flag('seenBlackjack')) {
      g.set('seenBlackjack');
      g.say(
        `"Place your bet," says the dealer. Minimum $${MIN_BET}.`,
        'Type BET 10 to stake ten dollars, then HIT or STAND.',
        'LEAVE when you have had enough.',
      );
    }
  },

  onCommand(g, cmd) {
    const playing = g.counter('bjState') === 1;

    if (cmd.verb === 'bet' || (cmd.verb === 'play' && !playing)) {
      if (playing) {
        g.say('You have a hand in front of you. Finish it.');
        return true;
      }
      const asked = Number((/(\d+)/.exec(cmd.raw) ?? [])[1] ?? MIN_BET);
      const bet = Math.max(MIN_BET, asked);
      if (bet > g.counter('money')) {
        g.say(`You do not have $${bet}. You have $${g.counter('money')}.`);
        return true;
      }
      g.bump('money', -bet);
      g.setCounter('bjBet', bet);
      g.setCounter('bjState', 1);

      const p1 = draw(g);
      const p2 = draw(g);
      const d1 = draw(g);
      const d2 = draw(g);
      g.setCounter('bjPlayer', total([p1.value, p2.value]));
      g.setCounter('bjDealerA', d1.value);
      g.setCounter('bjDealerB', d2.value);

      const you = g.counter('bjPlayer');
      g.cue('coin');
      g.say(
        `You put $${bet} on the felt.`,
        `You are dealt ${p1.label} and ${p2.label}, for ${you}.`,
        `The dealer shows ${d1.label} and one face down.`,
      );
      if (you === 21) {
        g.say('Twenty-one, straight off the deal.');
        dealerPlays(g);
      }
      return true;
    }

    if (cmd.verb === 'hit' || cmd.is('hit me') || cmd.isAny('get', 'cards')) {
      if (!playing) {
        g.say('Place a bet first.');
        return true;
      }
      const card = draw(g);
      // Totals are stored already-demoted, so an ace drawn late counts as one.
      const next =
        g.counter('bjPlayer') +
        (card.value === 11 && g.counter('bjPlayer') > 10 ? 1 : card.value);
      g.setCounter('bjPlayer', next);
      if (next > 21) {
        g.setCounter('bjState', 0);
        g.cue('error');
        g.say(
          `${card.label}. That takes you to ${next}.`,
          `Bust. The dealer takes your $${g.counter('bjBet')} without comment.`,
          `You have $${g.counter('money')} left.`,
        );
        return true;
      }
      g.say(`${card.label}. You are on ${next}.`);
      if (next === 21) dealerPlays(g);
      return true;
    }

    if (cmd.verb === 'stand' || cmd.is('stand pat') || cmd.verb === 'wait') {
      if (!playing) {
        g.say('You are not in a hand.');
        return true;
      }
      g.say(`You stand on ${g.counter('bjPlayer')}.`);
      dealerPlays(g);
      return true;
    }

    if (cmd.is('talk', 'dealer')) {
      g.say('"Place your bet," he says. It is the only thing he has ever said.');
      return true;
    }

    return false;
  },
};
