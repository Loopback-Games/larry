import type { Surface } from './raster.js';
import type { Actor } from './actor.js';
import type { Command } from './parser.js';
import type { Facing } from './figure.js';
import type { Game } from './engine.js';

/** Where Larry appears when a room is entered. */
export interface EntryPoint {
  readonly x: number;
  readonly y: number;
  readonly facing?: Facing;
}

/**
 * A walkable region that leads somewhere else.
 *
 * Build these with `exitsOf` from `doorway.ts` rather than by hand, so the
 * trigger is always derived from the opening that was painted.
 */
export interface Exit {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly to: string;
  /**
   * Where this goes, shown over the player's head while they stand in it.
   * Walking into an unmarked rectangle and being teleported is the single
   * most disorienting thing an adventure game can do.
   */
  readonly label: string;
  /** Blocks the exit and explains why when it returns a string. */
  readonly when?: (g: Game) => true | string;
}

/** A thing in the scenery the player can refer to. */
export interface Hotspot {
  /** Canonical noun; also the id room code matches against. */
  readonly noun: string;
  readonly synonyms?: readonly string[];
  /** Response to `look at <noun>`. */
  readonly look?: string | ((g: Game) => string | string[]);
  /** Optional bounding box, for proximity checks. */
  readonly area?: { x: number; y: number; w: number; h: number };
}

export interface RoomDef {
  readonly id: string;
  /** Shown on the status line. */
  readonly title: string;
  /**
   * A framing screen rather than a place: the title card, the door quiz, the
   * ending. Larry is not drawn and there is nowhere to walk.
   */
  readonly cutscene?: boolean;
  /**
   * Topmost row a walker's feet may reach, and how much smaller they are drawn
   * there than at the bottom of the screen. Gives the room depth and stops a
   * full-size figure standing against the back wall.
   */
  readonly horizon?: number;
  readonly scaleAtHorizon?: number;
  /**
   * A close-up of one thing rather than a place: a slot machine, a card table,
   * the inside of a lift. The player is not drawn and does not walk; they use
   * what is in front of them and then leave.
   */
  readonly closeup?: boolean;
  /** Where LEAVE goes from a close-up. */
  readonly leaveTo?: string;
  /** Builds the room's artwork; called once and cached. */
  readonly scene: () => Surface;
  /** Entry positions keyed by the room travelled from, plus a `default`. */
  readonly entries: Readonly<Record<string, EntryPoint>>;
  readonly exits?: readonly Exit[];
  readonly hotspots?: readonly Hotspot[];
  /** Response to a bare `look`. */
  readonly describe?: string | ((g: Game) => string | string[]);
  /** Actors created fresh each time the room is entered. */
  readonly populate?: (g: Game) => Actor[];
  readonly onEnter?: (g: Game) => void;
  readonly onTick?: (g: Game) => void;
  /** Return true to consume the command; otherwise the default handler runs. */
  readonly onCommand?: (g: Game, cmd: Command) => boolean;
}
