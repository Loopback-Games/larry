import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/index.js';
import { Game } from '../src/engine/engine.js';
import { RoomId, ItemId, MAX_SCORE } from '../src/game/ids.js';
import { HOTLINE, SCRATCHED, DELIVERY } from '../src/game/phone.js';

/**
 * Play the game from start to finish through the parser, exactly as a player
 * would type it, and check the score lands on 222.
 *
 * This is the parity test that matters: it proves every puzzle in the chain is
 * reachable, solvable in order, and worth what it is supposed to be worth.
 */

/**
 * Submit a line and clear any text windows it opens.
 *
 * Any window already open is dismissed first, because in the real game the
 * first key press closes the window rather than running a command.
 */
function type(g: Game, line: string): void {
  while (g.dismissMessage()) {
    /* close whatever is on screen */
  }
  g.submit(line);
  while (g.dismissMessage()) {
    /* drain the queue */
  }
}

/** Walk between rooms directly; movement itself is covered by other tests. */
function walk(g: Game, room: string): void {
  g.goTo(room);
  while (g.dismissMessage()) {
    /* drain the queue */
  }
}

function newGame(): Game {
  const g = createGame();
  // Fixed chance so the gambling rooms cannot affect a run.
  let seed = 12345;
  g.random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  while (g.dismissMessage()) {
    /* clear the title card */
  }
  // Skip the framing screens; they have their own coverage in world.test.ts.
  g.goTo(RoomId.OutsideBar);
  while (g.dismissMessage()) {
    /* clear the opening narration */
  }
  return g;
}

/** The complete solution, as a list of [room, commands] legs. */
function playToTheEnd(g: Game, checkpoint?: (g: Game, label: string) => void): void {
  const leg = (label: string, room: string, ...commands: string[]) => {
    walk(g, room);
    for (const c of commands) type(g, c);
    checkpoint?.(g, label);
  };

  leg('bar', RoomId.InsideBar, 'buy whiskey');
  leg('hallway', RoomId.BarHallway, 'get rose', 'give whiskey to drunk', 'get remote');
  leg('washroom', RoomId.BarToilet, 'sit down', 'read the wall', 'open the cistern');
  leg('storeroom', RoomId.BarBackroom, 'use remote', 'use remote');
  leg('cab', RoomId.Taxi, 'store');
  leg('store', RoomId.InsideStore, 'buy magazine', 'read magazine', 'buy wine', 'buy condom');
  leg(
    'phone',
    RoomId.OutsideStore,
    'give wine to man',
    'look at the phone',
    `call ${HOTLINE}`,
    `call ${SCRATCHED}`,
  );

  // The payphone rings back a few ticks after the joke call.
  for (let i = 0; i < 20 && !g.flag('phoneRinging'); i++) g.tick();
  type(g, 'answer the phone');
  type(g, `call ${DELIVERY}`);
  checkpoint?.(g, 'phone-answered');

  leg('upstairs', RoomId.HookerRoom, 'wear condom', 'go to bed', 'remove condom', 'get candy');
  leg('alley', RoomId.Alley, 'look in dumpster', 'break the boards', 'get the pills');
  leg('casino', RoomId.InsideCasino, 'get card');
  leg('lounge', RoomId.Lounge, 'sit down');
  leg('apple', RoomId.OutsideCasino, 'buy apple');
  leg('door', RoomId.OutsideDisco, 'show pass');
  leg(
    'disco',
    RoomId.InsideDisco,
    'sit down',
    'look at girl',
    'look at girl',
    'talk to girl',
    'dance',
    'give rose to girl',
    'give candy to girl',
    'give ring to girl',
    'give money to girl',
  );
  leg('chapel outside', RoomId.OutsideChapel, 'talk to man');
  leg('chapel', RoomId.InsideChapel, 'marry');

  // Marrying moves Larry straight to the suite, tied to the bed.
  while (g.dismissMessage()) {
    /* drain */
  }
  type(g, 'turn on radio');
  type(g, 'cut the rope with the knife');
  type(g, 'get the rope');
  checkpoint?.(g, 'suite');

  leg('reception', RoomId.ReceptionDesk, 'give pills to faith', 'push the red button');
  leg('bedroom', RoomId.PenthouseBedroom, 'get doll', 'inflate doll');
  leg('penthouse', RoomId.PenthouseLounge, 'tie rope to balcony');
  leg('terrace', RoomId.PenthouseHotTub, 'use doll', 'give apple to eve');
}

describe('walkthrough', () => {
  it('completes the game and scores exactly 222', () => {
    const g = newGame();
    playToTheEnd(g);
    expect(g.score).toBe(MAX_SCORE);
    expect(g.ending).toBe('won');
  });

  it('never awards more than the maximum at any point', () => {
    const g = newGame();
    playToTheEnd(g, (game, label) => {
      expect(game.score, `score overshot at ${label}`).toBeLessThanOrEqual(MAX_SCORE);
    });
  });

  it('scores each leg of the chain as designed', () => {
    const g = newGame();
    const seen: Record<string, number> = {};
    playToTheEnd(g, (game, label) => {
      seen[label] = game.score;
    });
    // Spot-check the milestones the walkthrough is built around.
    expect(seen.bar).toBe(1);
    expect(seen.hallway).toBe(4);
    expect(seen.washroom).toBe(10);
    expect(seen.storeroom).toBe(21);
    expect(seen.cab).toBe(22);
    expect(seen.store).toBe(29);
    expect(seen['phone-answered']).toBe(52);
    expect(seen.upstairs).toBe(76);
    expect(seen.alley).toBe(87);
    expect(seen.door).toBe(97);
    expect(seen.disco).toBe(127);
    // The wedding is the 140-point mark.
    expect(seen.chapel).toBe(140);
    expect(seen.suite).toBe(154);
    expect(seen.terrace).toBe(MAX_SCORE);
  });

  it('collects and consumes the inventory along the way', () => {
    const g = newGame();
    playToTheEnd(g);
    // Everything given away should be gone; the souvenirs remain.
    for (const gone of [
      ItemId.Whiskey,
      ItemId.Wine,
      ItemId.Rose,
      ItemId.Candy,
      ItemId.Ring,
      ItemId.Pills,
      ItemId.Doll,
      ItemId.Apple,
    ]) {
      expect(g.has(gone), `${gone} should have been given away`).toBe(false);
    }
    for (const kept of [ItemId.Knife, ItemId.Hammer, ItemId.Rope, ItemId.Watch]) {
      expect(g.has(kept), `${kept} should still be carried`).toBe(true);
    }
  });

  it('awards no points twice when the solution is repeated', () => {
    const g = newGame();
    playToTheEnd(g);
    const first = g.score;
    g.clearEnding();
    playToTheEnd(g);
    expect(g.score).toBe(first);
  });
});
