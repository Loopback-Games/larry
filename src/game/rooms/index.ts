import type { RoomDef } from '../../engine/room.js';
import { outsideBar } from './outside-bar.js';
import { insideBar } from './inside-bar.js';

/**
 * Every room in the game. Adding a room here is all that is needed to make it
 * reachable; the engine registers its hotspot nouns with the parser.
 */
export const ROOMS: readonly RoomDef[] = [outsideBar, insideBar];

export const ROOMS_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));
