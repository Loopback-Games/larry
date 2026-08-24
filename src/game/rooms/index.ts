import type { RoomDef } from '../../engine/room.js';
import { title } from './title.js';
import { ageCheck } from './age-check.js';
import { sunrise } from './sunrise.js';
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
import { outsideDisco } from './outside-disco.js';
import { insideDisco } from './inside-disco.js';
import { outsideCasino } from './outside-casino.js';
import { insideCasino } from './inside-casino.js';
import { slots } from './slots.js';
import { blackjack } from './blackjack.js';
import { lounge } from './lounge.js';
import { elevatorLobby } from './elevator-lobby.js';
import { elevator } from './elevator.js';
import { receptionDesk } from './reception-desk.js';
import { outsideChapel } from './outside-chapel.js';
import { insideChapel } from './inside-chapel.js';
import { honeymoonSuite } from './honeymoon-suite.js';
import { penthouseLounge } from './penthouse-lounge.js';
import { penthouseBedroom } from './penthouse-bedroom.js';
import { penthouseHotTub } from './penthouse-hot-tub.js';

/**
 * Every room in the game. Adding a room here is all that is needed to make it
 * reachable; the engine registers its hotspot nouns with the parser.
 */
export const ROOMS: readonly RoomDef[] = [
  title,
  ageCheck,
  sunrise,
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
  outsideDisco,
  insideDisco,
  outsideCasino,
  insideCasino,
  slots,
  blackjack,
  lounge,
  elevatorLobby,
  elevator,
  receptionDesk,
  outsideChapel,
  insideChapel,
  honeymoonSuite,
  penthouseLounge,
  penthouseBedroom,
  penthouseHotTub,
];

export const ROOMS_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));
