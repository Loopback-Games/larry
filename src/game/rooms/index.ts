import type { RoomDef } from '../../engine/room.js';
import { outsideBar } from './outside-bar.js';
import { insideBar } from './inside-bar.js';
import { barHallway } from './bar-hallway.js';
import { barToilet } from './bar-toilet.js';
import { barBackroom } from './bar-backroom.js';
import { hookerRoom } from './hooker-room.js';
import { alley } from './alley.js';
import { darkStreet } from './dark-street.js';
import { taxi } from './taxi.js';
import { outsideStore } from './outside-store.js';
import { insideStore } from './inside-store.js';

/**
 * Every room in the game. Adding a room here is all that is needed to make it
 * reachable; the engine registers its hotspot nouns with the parser.
 */
export const ROOMS: readonly RoomDef[] = [
  outsideBar,
  insideBar,
  barHallway,
  barToilet,
  barBackroom,
  hookerRoom,
  alley,
  darkStreet,
  taxi,
  outsideStore,
  insideStore,
];

export const ROOMS_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));
