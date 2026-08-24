import { Game } from '../engine/engine.js';
import type { GameHooks } from '../engine/engine.js';
import { buildVocabulary } from './vocabulary.js';
import { ITEMS, STARTING_ITEMS } from './items.js';
import { RoomId } from './ids.js';
import { ItemId } from './ids.js';
import { ROOMS } from './rooms/index.js';
import { C } from '../engine/palette.js';

/** What Larry has in his wallet when the night begins. */
export const STARTING_MONEY = 94;

/** Larry's look: the white suit is the whole character in one silhouette. */
export const LARRY_STYLE = {
  hair: C.brown,
  hairStyle: 'short' as const,
  skin: C.pink,
  top: C.white,
  shirt: C.white,
  accent: C.red,
  bottom: C.white,
  shoes: C.black,
  build: 4,
};

/** Build a fully wired game, positioned at the opening room. */
export function createGame(hooks: GameHooks = {}): Game {
  const game = new Game(buildVocabulary(), hooks);

  game.itemName = (id) => ITEMS[id as ItemId]?.name ?? id;
  game.describeItem = (id) => {
    const item = ITEMS[id as ItemId];
    if (!item) return `It is a ${id}.`;
    if (id === ItemId.Wallet) {
      return `${item.description} There is $${game.counter('money')} in it.`;
    }
    return item.description;
  };

  for (const room of ROOMS) game.addRoom(room);

  game.ego.style = LARRY_STYLE;
  game.ego.speed = 2;
  for (const item of STARTING_ITEMS) game.give(item);
  game.setCounter('money', STARTING_MONEY);

  game.goTo(RoomId.OutsideBar);
  return game;
}

export { RoomId, ItemId } from './ids.js';
