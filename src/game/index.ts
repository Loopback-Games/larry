import { Game } from '../engine/engine.js';
import type { GameHooks } from '../engine/engine.js';
import { buildVocabulary } from './vocabulary.js';
import { ITEMS, STARTING_ITEMS } from './items.js';
import { RoomId } from './ids.js';
import type { ItemId } from './ids.js';
import { ROOMS } from './rooms/index.js';
import { C } from '../engine/palette.js';

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
  game.describeItem = (id) => ITEMS[id as ItemId]?.description ?? `It is a ${id}.`;

  for (const room of ROOMS) game.addRoom(room);

  game.ego.style = LARRY_STYLE;
  game.ego.speed = 2;
  for (const item of STARTING_ITEMS) game.give(item);

  game.goTo(RoomId.OutsideBar);
  return game;
}

export { RoomId, ItemId } from './ids.js';
