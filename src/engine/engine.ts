import { Surface } from './raster.js';
import { Painter } from './scene.js';
import { darker } from './palette.js';
import { Actor } from './actor.js';
import { Command, EMPTY_COMMAND, parse } from './parser.js';
import { Vocabulary } from './vocabulary.js';
import type { RoomDef, Hotspot, EntryPoint } from './room.js';
import { WALK_BLOCKED, WALK_WATER, CANVAS_W, CANVAS_H, FOOT_ROWS } from '../constants.js';

/** Serialisable game progress. */
export interface SaveData {
  readonly version: 1;
  readonly room: string;
  readonly x: number;
  readonly y: number;
  readonly facing: string;
  readonly score: number;
  readonly flags: readonly string[];
  readonly counters: Readonly<Record<string, number>>;
  readonly inventory: readonly string[];
  readonly awarded: readonly string[];
  readonly moves: number;
}

/** What the presentation layer needs to draw one frame. */
export interface Frame {
  readonly surface: Surface;
  readonly status: string;
  readonly score: number;
  readonly message: readonly string[] | null;
  readonly awaitingDismiss: boolean;
  readonly gameOver: 'dead' | 'won' | null;
}

export interface GameHooks {
  /** Called when a sound or music cue should start. */
  readonly onCue?: (cue: string) => void;
  /** Called whenever a message is shown, for transcript/accessibility. */
  readonly onMessage?: (lines: readonly string[]) => void;
  readonly onRoomChange?: (room: string) => void;
}

const SAVE_KEY = 'larry.save.v1';

/**
 * The game itself: state, the room graph, command dispatch and the tick loop.
 *
 * Room modules receive this object and drive everything through it, so all
 * mutation goes through one place and saving is a matter of reading fields.
 */
export class Game {
  readonly vocab: Vocabulary;
  private readonly rooms = new Map<string, RoomDef>();
  private readonly scenes = new Map<string, Surface>();
  /** Per-room noun lookup layers, so scenery words stay room-local. */
  private readonly roomNouns = new Map<string, Map<string, string>>();
  /** Horizon and perspective scale, derived from each room's walk mask. */
  private readonly perspective = new Map<string, { horizon: number; near: number }>();
  private readonly hooks: GameHooks;

  private flags = new Set<string>();
  private counters = new Map<string, number>();
  private inventoryItems = new Set<string>();
  private awarded = new Set<string>();

  score = 0;
  moves = 0;

  ego: Actor;
  private currentRoom: RoomDef | null = null;
  private previousRoomId: string | null = null;
  private actors: Actor[] = [];
  private surface: Surface = new Surface();

  /** Queued text windows; the first is currently on screen. */
  private messageQueue: string[][] = [];
  private gameOver: 'dead' | 'won' | null = null;

  /** Direction the player is currently holding, in canvas units. */
  private inputDx = 0;
  private inputDy = 0;

  /**
   * Exits the ego was already standing in when the room loaded.
   *
   * Arriving inside the doorway you just came through would otherwise fire that
   * exit again on the very next tick and bounce the player straight back. Each
   * one is armed only once the ego has stepped clear of it.
   */
  private suppressedExits = new Set<number>();

  /** Last command, for `again`. */
  private lastCommand: Command = EMPTY_COMMAND;

  /**
   * Source of chance for the gambling rooms. Replaceable so tests can make a
   * run deterministic.
   */
  random: () => number = Math.random;

  /**
   * Called after each accepted command. Returning true consumes the turn, which
   * is how the night's time limit ends the game.
   */
  onMove?: (g: Game) => boolean;

  /** Integer in [min, max] inclusive. */
  roll(min: number, max: number): number {
    return min + Math.floor(this.random() * (max - min + 1));
  }

  constructor(vocab: Vocabulary, hooks: GameHooks = {}) {
    this.vocab = vocab;
    this.hooks = hooks;
    this.ego = new Actor({ id: 'ego', x: 80, y: 150 });
  }

  // ---- registration ------------------------------------------------------

  addRoom(room: RoomDef): void {
    this.rooms.set(room.id, room);
    const spots = room.hotspots ?? [];
    this.roomNouns.set(room.id, Vocabulary.scopeFrom(spots));
    // Also pooled globally so the words are recognised (rather than reported as
    // unknown) when the player names them from somewhere else.
    for (const spot of spots) this.vocab.noun(spot.noun, ...(spot.synonyms ?? []));
  }

  /** Noun layer for the room the player is standing in. */
  get currentNouns(): ReadonlyMap<string, string> | undefined {
    return this.currentRoom ? this.roomNouns.get(this.currentRoom.id) : undefined;
  }

  get roomId(): string {
    return this.currentRoom?.id ?? '';
  }

  get room(): RoomDef {
    if (!this.currentRoom) throw new Error('no room is active');
    return this.currentRoom;
  }

  get previousRoom(): string | null {
    return this.previousRoomId;
  }

  // ---- state -------------------------------------------------------------

  flag(name: string): boolean {
    return this.flags.has(name);
  }

  set(name: string, value = true): void {
    if (value) this.flags.add(name);
    else this.flags.delete(name);
  }

  counter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  setCounter(name: string, value: number): void {
    this.counters.set(name, value);
  }

  bump(name: string, by = 1): number {
    const next = this.counter(name) + by;
    this.counters.set(name, next);
    return next;
  }

  has(item: string): boolean {
    return this.inventoryItems.has(item);
  }

  get inventory(): readonly string[] {
    return [...this.inventoryItems];
  }

  give(item: string): void {
    this.inventoryItems.add(item);
  }

  take(item: string): void {
    this.inventoryItems.delete(item);
  }

  /**
   * Award points once. `key` identifies the achievement so repeating an action
   * cannot farm the same points twice.
   */
  award(points: number, key: string): boolean {
    if (this.awarded.has(key)) return false;
    this.awarded.add(key);
    this.score += points;
    return true;
  }

  hasAwarded(key: string): boolean {
    return this.awarded.has(key);
  }

  // ---- messages ----------------------------------------------------------

  /** Queue a text window. Multiple arguments become separate windows. */
  say(...messages: (string | readonly string[])[]): void {
    for (const m of messages) {
      const lines = typeof m === 'string' ? [m] : [...m];
      if (lines.length === 0) continue;
      this.messageQueue.push(lines);
      this.hooks.onMessage?.(lines);
    }
  }

  get pendingMessage(): readonly string[] | null {
    return this.messageQueue[0] ?? null;
  }

  get isBlocked(): boolean {
    return this.messageQueue.length > 0 || this.gameOver !== null;
  }

  /** Dismiss the on-screen message. Returns true if one was showing. */
  dismissMessage(): boolean {
    if (this.messageQueue.length === 0) return false;
    this.messageQueue.shift();
    return true;
  }

  cue(name: string): void {
    this.hooks.onCue?.(name);
  }

  // ---- room transitions --------------------------------------------------

  goTo(roomId: string, entry?: EntryPoint): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      // Unreachable in a shipped build: `test/world.test.ts` asserts that every
      // exit resolves. Kept as a soft failure so a work-in-progress map is
      // still playable rather than crashing the loop.
      this.say(`There is no way through here yet. (missing room: ${roomId})`);
      return;
    }

    this.previousRoomId = this.currentRoom?.id ?? null;
    this.currentRoom = room;

    let scene = this.scenes.get(roomId);
    if (!scene) {
      scene = room.scene();
      this.scenes.set(roomId, scene);
      this.perspective.set(roomId, derivePerspective(scene));
    }
    this.surface = scene;

    const spawn =
      entry ??
      (this.previousRoomId ? room.entries[this.previousRoomId] : undefined) ??
      room.entries.default;
    if (spawn) {
      this.ego.x = spawn.x;
      this.ego.y = spawn.y;
      if (spawn.facing) this.ego.facing = spawn.facing;
    }
    this.ego.stop();
    this.ego.scale = this.scaleAt(this.ego.y);
    this.inputDx = 0;
    this.inputDy = 0;

    this.suppressedExits = new Set(
      (room.exits ?? [])
        .map((exit, index) => (this.inExit(exit, this.ego.x, this.ego.y) ? index : -1))
        .filter((index) => index >= 0),
    );

    this.actors = room.populate ? room.populate(this) : [];
    // Framing screens and close-ups have no playable space, so Larry stays off
    // them; a close-up is a view of one object, not somewhere to stand.
    this.ego.visible = !room.cutscene && !room.closeup;
    room.onEnter?.(this);
    this.hooks.onRoomChange?.(roomId);
  }

  /** Add an actor to the current room. */
  spawn(actor: Actor): Actor {
    this.actors.push(actor);
    return actor;
  }

  actor(id: string): Actor | undefined {
    return this.actors.find((a) => a.id === id);
  }

  despawn(id: string): void {
    this.actors = this.actors.filter((a) => a.id !== id);
  }

  // ---- endings -----------------------------------------------------------

  die(...messages: string[]): void {
    this.say(...messages);
    this.gameOver = 'dead';
    this.cue('death');
  }

  win(...messages: string[]): void {
    this.say(...messages);
    this.gameOver = 'won';
    this.cue('victory');
  }

  get ending(): 'dead' | 'won' | null {
    return this.gameOver;
  }

  clearEnding(): void {
    this.gameOver = null;
  }

  // ---- movement ----------------------------------------------------------

  /** Set the direction the player is holding. Values are clamped to -1..1. */
  steer(dx: number, dy: number): void {
    this.inputDx = Math.sign(dx);
    this.inputDy = Math.sign(dy);
    if (dx !== 0 || dy !== 0) {
      this.ego.facing =
        Math.abs(dx) >= Math.abs(dy)
          ? dx >= 0
            ? 'right'
            : 'left'
          : dy >= 0
            ? 'front'
            : 'back';
    }
  }

  get steering(): { dx: number; dy: number } {
    return { dx: this.inputDx, dy: this.inputDy };
  }

  /** True when an actor of this height may stand with its feet at (x, y). */
  /** True when a single point is standable. Used by tap-to-walk and tests. */
  canStand(x: number, y: number, swimmer = false): boolean {
    return this.canOccupy(x, y, 0, swimmer);
  }

  /**
   * True when a walker whose base is `halfWidth` across may stand with its feet
   * at (x, y).
   *
   * Characters collide on their base rather than a single pixel, so they cannot
   * push their feet into a wall, and rather than their whole silhouette, so
   * they can still stand in front of a counter.
   */
  canOccupy(x: number, y: number, halfWidth = 0, swimmer = false): boolean {
    const fy = Math.round(y);
    if (fy < 1 || fy > CANVAS_H - 1) return false;

    if (fy < this.horizon) return false;

    const left = Math.round(x - halfWidth);
    const right = Math.round(x + halfWidth);
    if (left < 1 || right > CANVAS_W - 2) return false;

    // Sample the base box: its full width, and a few rows up from the feet.
    for (let sy = fy; sy > fy - FOOT_ROWS && sy >= 0; sy--) {
      for (let sx = left; sx <= right; sx++) {
        const mask = this.surface.walkAt(sx, sy);
        if (mask === WALK_BLOCKED) return false;
        if (mask === WALK_WATER && !swimmer) return false;
      }
    }
    return true;
  }

  /**
   * Topmost row a walker's feet may reach in the current room. Taken from the
   * room if it declares one, otherwise derived from where the floor starts.
   */
  get horizon(): number {
    const room = this.currentRoom;
    if (!room) return 0;
    if (room.horizon !== undefined) return room.horizon;
    return this.perspective.get(room.id)?.horizon ?? 0;
  }

  /**
   * Perspective scale for a walker standing at row `y`.
   *
   * Figures shrink towards the horizon so a room reads as space rather than a
   * flat backdrop, and so a full-size character cannot stand against the back
   * wall looking like a giant.
   */
  scaleAt(y: number): number {
    const room = this.currentRoom;
    if (!room) return 1;
    const horizon = this.horizon;
    const near = room.scaleAtHorizon ?? this.perspective.get(room.id)?.near ?? 1;
    if (near >= 1) return 1;
    const span = Math.max(1, CANVAS_H - 1 - horizon);
    const t = Math.min(1, Math.max(0, (y - horizon) / span));
    return Math.round((near + (1 - near) * t) * 100) / 100;
  }

  /**
   * Move an actor by up to (dx, dy), one pixel at a time.
   *
   * Stepping pixel by pixel rather than jumping the whole distance is what
   * stops a walker crossing a thin wall in a single tick, and stops a diagonal
   * cutting the corner of one. When the diagonal is blocked the move falls back
   * to whichever single axis is still clear, so corners are not sticky.
   */
  private moveActor(actor: Actor, dx: number, dy: number): boolean {
    if (dx === 0 && dy === 0) return false;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const stepX = dx / steps;
    const stepY = dy / steps;
    const half = actor.collisionHalfWidth;
    let moved = false;

    for (let i = 0; i < steps; i++) {
      const nx = actor.x + stepX;
      const ny = actor.y + stepY;
      if (this.canOccupy(nx, ny, half)) {
        actor.x = nx;
        actor.y = ny;
        moved = true;
        continue;
      }
      if (stepX !== 0 && this.canOccupy(actor.x + stepX, actor.y, half)) {
        actor.x += stepX;
        moved = true;
        continue;
      }
      if (stepY !== 0 && this.canOccupy(actor.x, actor.y + stepY, half)) {
        actor.y += stepY;
        moved = true;
        continue;
      }
      break;
    }
    if (moved) actor.scale = actor.fixedScale ? 1 : this.scaleAt(actor.y);
    return moved;
  }

  // ---- the tick ----------------------------------------------------------

  /** Advance the simulation one logical frame. */
  tick(): void {
    if (this.isBlocked || !this.currentRoom) return;

    if (this.currentRoom.closeup) {
      for (const actor of this.actors) this.stepActor(actor);
      this.currentRoom.onTick?.(this);
      return;
    }

    // Larry follows the held direction.
    const speed = this.ego.speed;
    const moved = this.moveActor(this.ego, this.inputDx * speed, this.inputDy * speed);
    this.ego.moving = moved;
    if (moved) this.ego.advanceAnimation();

    for (const actor of this.actors) this.stepActor(actor);

    this.currentRoom.onTick?.(this);
    if (this.isBlocked) return;

    this.checkExits();
  }

  private stepActor(actor: Actor): void {
    const b = actor.behaviour;
    switch (b.kind) {
      case 'walkTo': {
        const dx = b.x - actor.x;
        const dy = b.y - actor.y;
        if (Math.abs(dx) <= actor.speed && Math.abs(dy) <= actor.speed) {
          actor.x = b.x;
          actor.y = b.y;
          actor.moving = false;
          actor.stop();
          b.onArrive?.();
          return;
        }
        actor.faceTowards(b.x, b.y);
        actor.moving = this.moveActor(
          actor,
          Math.sign(dx) * Math.min(actor.speed, Math.abs(dx)),
          Math.sign(dy) * Math.min(actor.speed, Math.abs(dy)),
        );
        if (actor.moving) actor.advanceAnimation();
        break;
      }
      case 'patrol': {
        const point = b.points[b.index % b.points.length];
        const dx = point[0] - actor.x;
        const dy = point[1] - actor.y;
        if (Math.abs(dx) <= actor.speed && Math.abs(dy) <= actor.speed) {
          b.index = (b.index + 1) % b.points.length;
          return;
        }
        actor.faceTowards(point[0], point[1]);
        actor.moving = this.moveActor(actor, Math.sign(dx) * actor.speed, Math.sign(dy) * actor.speed);
        if (actor.moving) actor.advanceAnimation();
        break;
      }
      case 'follow': {
        const dx = b.target.x - actor.x;
        const dy = b.target.y - actor.y;
        if (Math.hypot(dx, dy) <= b.distance) {
          actor.moving = false;
          return;
        }
        actor.faceTowards(b.target.x, b.target.y);
        actor.moving = this.moveActor(actor, Math.sign(dx) * actor.speed, Math.sign(dy) * actor.speed);
        if (actor.moving) actor.advanceAnimation();
        break;
      }
      default:
        actor.moving = false;
    }
  }

  private inExit(
    exit: { x: number; y: number; w: number; h: number },
    x: number,
    y: number,
  ): boolean {
    return x >= exit.x && x < exit.x + exit.w && y >= exit.y && y < exit.y + exit.h;
  }

  private checkExits(): void {
    const room = this.currentRoom;
    if (!room?.exits) return;
    const { x, y } = this.ego;
    for (let index = 0; index < room.exits.length; index++) {
      const exit = room.exits[index];
      if (!this.inExit(exit, x, y)) {
        // Stepping clear of a doorway arms it again.
        this.suppressedExits.delete(index);
        continue;
      }
      if (this.suppressedExits.has(index)) continue;
      const gate = exit.when?.(this);
      if (typeof gate === 'string') {
        this.say(gate);
        // Nudge Larry back out of the exit so the message does not repeat.
        this.ego.y = Math.min(CANVAS_H - 2, exit.y + exit.h + 2);
        return;
      }
      this.goTo(exit.to);
      return;
    }
  }

  // ---- rendering ---------------------------------------------------------

  /** Compose the scene and its actors into a frame for the presentation layer. */
  renderFrame(): Frame {
    const composed = new Surface(this.surface.width, this.surface.height);
    composed.colour.set(this.surface.colour);
    composed.depth.set(this.surface.depth);
    composed.walk.set(this.surface.walk);

    const painter = new Painter(composed);
    const drawable = [...this.actors, this.ego]
      .filter((a) => a.visible)
      .sort((a, b) => a.y - b.y);

    // Shadows go down first, under everyone, so a figure standing in front of
    // another does not have its shadow painted over the one behind.
    for (const actor of drawable) {
      actor.scale = actor.fixedScale ? 1 : this.scaleAt(actor.y);
      if (actor.castsShadow) this.drawShadow(painter, composed, actor);
    }

    for (const actor of drawable) {
      const before = composed.colour.slice();
      actor.draw(painter);
      this.applyDepth(composed, before, actor);
    }

    return {
      surface: composed,
      status: this.currentRoom?.title ?? '',
      score: this.score,
      message: this.pendingMessage,
      awaitingDismiss: this.messageQueue.length > 0,
      gameOver: this.gameOver,
    };
  }

  /**
   * A soft contact shadow under an actor's feet.
   *
   * Without one a figure reads as floating slightly above the floor. The
   * shadow is a dithered ellipse in a darker shade of whatever it falls on, so
   * it works on any surface without needing per-room colours.
   */
  private drawShadow(painter: Painter, composed: Surface, actor: Actor): void {
    const rx = Math.max(3, Math.round((actor.width * actor.scale) / 2.6));
    const ry = Math.max(1, Math.round(rx / 3));
    const cy = Math.round(actor.y);
    const cx = Math.round(actor.x);

    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (n > 1) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (!composed.inside(x, y)) continue;
        // Dither the edge so the ellipse fades rather than stopping dead.
        if (n > 0.45 && ((x + y) & 1) === 0) continue;
        const i = composed.index(x, y);
        composed.colour[i] = darker(composed.colour[i]);
      }
    }
    void painter;
  }

  /**
   * Undo any actor pixels that scenery should be drawn in front of.
   *
   * Drawing then masking is cheaper to write than clipping every primitive,
   * and actors are small enough that the extra work is not measurable.
   */
  private applyDepth(composed: Surface, before: Uint8Array, actor: Actor): void {
    const band =
      actor.depthOverride ?? this.surface.depthAt(Math.round(actor.x), Math.round(actor.y));
    if (band >= 15) return;
    const { left, top, right, bottom } = actor.bounds;
    for (let y = Math.max(0, top); y <= Math.min(composed.height - 1, bottom); y++) {
      for (let x = Math.max(0, left); x <= Math.min(composed.width - 1, right); x++) {
        const i = composed.index(x, y);
        if (composed.colour[i] === before[i]) continue;
        if (this.surface.depth[i] > band) composed.colour[i] = before[i];
      }
    }
  }

  // ---- commands ----------------------------------------------------------

  /** Parse and run one typed line. */
  submit(input: string): void {
    if (this.dismissMessage()) return;
    const cmd = parse(input, this.vocab, this.currentNouns);
    // Framing screens advance on any key, including a bare Enter, so an empty
    // command still has to reach them.
    if (cmd.isEmpty && this.currentRoom?.cutscene) {
      this.currentRoom.onCommand?.(this, cmd);
      return;
    }
    this.run(cmd);
  }

  run(cmd: Command): void {
    if (cmd.isEmpty) return;
    if (cmd.verb === 'again') {
      if (this.lastCommand.isEmpty) {
        this.say('You have not done anything yet.');
        return;
      }
      this.run(this.lastCommand);
      return;
    }
    this.lastCommand = cmd;
    this.moves++;
    if (this.onMove?.(this)) return;

    if (this.currentRoom?.onCommand?.(this, cmd)) return;
    if (this.handleGlobal(cmd)) return;

    if (cmd.unknownWord) {
      this.say(`You do not need to use the word "${cmd.unknownWord}" to finish this game.`);
      return;
    }
    if (cmd.verb === null) {
      this.say('Start your instruction with a verb.');
      return;
    }
    this.say(this.confused(cmd));
  }

  private hotspot(noun: string): Hotspot | undefined {
    return this.currentRoom?.hotspots?.find((h) => h.noun === noun);
  }

  private handleGlobal(cmd: Command): boolean {
    switch (cmd.verb) {
      case 'inventory':
        this.say(this.inventoryText());
        return true;

      case 'score':
        this.say(
          `Your score is ${this.score} of a possible 222 point${this.score === 1 ? '' : 's'}, ` +
            `in ${this.moves} move${this.moves === 1 ? '' : 's'}.`,
        );
        return true;

      case 'look': {
        if (cmd.object === null) {
          const text = resolveText(this.currentRoom?.describe, this);
          this.say(text ?? 'You look around and learn nothing new.');
          return true;
        }
        if (cmd.object === 'self') {
          this.say(
            'A thirty-eight-year-old man in a white polyester leisure suit. ' +
              'The suit was a mistake. The confidence is a bigger one.',
          );
          return true;
        }
        const spot = this.hotspot(cmd.object);
        const spotText = resolveText(spot?.look, this);
        if (spotText) {
          this.say(spotText);
          return true;
        }
        if (this.has(cmd.object)) {
          this.say(this.describeItem(cmd.object));
          return true;
        }
        return false;
      }

      case 'wait':
        this.say('Time passes. It is not kind to you.');
        return true;

      case 'exit':
      case 'down': {
        const room = this.currentRoom;
        if (room?.closeup && room.leaveTo) {
          this.goTo(room.leaveTo);
          return true;
        }
        return false;
      }

      case 'help':
        this.say(HELP_TEXT);
        return true;

      case 'drop': {
        if (cmd.object && this.has(cmd.object)) {
          this.say('Better hold on to that. You own very little as it is.');
          return true;
        }
        return false;
      }

      case 'get': {
        if (cmd.object && this.has(cmd.object)) {
          this.say('You already have it.');
          return true;
        }
        return false;
      }

      default:
        return false;
    }
  }

  /** Overridden by the game layer so item text lives with the item table. */
  describeItem: (id: string) => string = (id) => `It is a ${id}.`;

  private inventoryText(): string[] {
    if (this.inventoryItems.size === 0) return ['You are carrying nothing at all.'];
    return ['You are carrying:', ...[...this.inventoryItems].map((i) => `  ${this.itemName(i)}`)];
  }

  /** Overridden by the game layer. */
  itemName: (id: string) => string = (id) => id;

  private confused(cmd: Command): string {
    if (cmd.object && !this.hotspot(cmd.object) && !this.has(cmd.object)) {
      return 'You do not see that here.';
    }
    return "That is not something you can do just now.";
  }

  // ---- persistence -------------------------------------------------------

  toSave(): SaveData {
    return {
      version: 1,
      room: this.roomId,
      x: this.ego.x,
      y: this.ego.y,
      facing: this.ego.facing,
      score: this.score,
      flags: [...this.flags],
      counters: Object.fromEntries(this.counters),
      inventory: [...this.inventoryItems],
      awarded: [...this.awarded],
      moves: this.moves,
    };
  }

  loadSave(data: SaveData): void {
    this.flags = new Set(data.flags);
    this.counters = new Map(Object.entries(data.counters));
    this.inventoryItems = new Set(data.inventory);
    this.awarded = new Set(data.awarded);
    this.score = data.score;
    this.moves = data.moves;
    this.gameOver = null;
    this.messageQueue = [];
    this.goTo(data.room, {
      x: data.x,
      y: data.y,
      facing: data.facing as EntryPoint['facing'],
    });
  }

  save(storage: Storage = localStorage): boolean {
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(this.toSave()));
      return true;
    } catch {
      return false;
    }
  }

  restore(storage: Storage = localStorage): boolean {
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return false;
      this.loadSave(data);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(storage: Storage = localStorage): boolean {
    try {
      return storage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }
}

/**
 * Work out where a room's floor begins and how much perspective it has.
 *
 * A shallow strip of floor gets no scaling: shrinking a figure across fifteen
 * rows just makes it flicker. A deep floor gets enough to read as distance.
 */
function derivePerspective(scene: Surface): { horizon: number; near: number } {
  const RUN = 24;
  let horizon = CANVAS_H - 1;
  for (let y = 0; y < CANVAS_H; y++) {
    let run = 0;
    for (let x = 0; x < CANVAS_W; x++) {
      run = scene.walk[y * CANVAS_W + x] === WALK_BLOCKED ? 0 : run + 1;
      if (run >= RUN) {
        horizon = y;
        break;
      }
    }
    if (horizon !== CANVAS_H - 1) break;
  }
  const depth = CANVAS_H - 1 - horizon;
  const near = depth >= 30 ? 0.62 : depth >= 18 ? 0.78 : 1;
  return { horizon, near };
}

function resolveText(
  source: string | readonly string[] | ((g: Game) => string | string[]) | undefined,
  g: Game,
): string[] | null {
  if (source === undefined) return null;
  const value = typeof source === 'function' ? source(g) : source;
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? [value] : [...value];
}

const HELP_TEXT = [
  'Type what you want to do, for example:',
  '  look at the sign      get the whiskey',
  '  talk to the bartender give the rose to her',
  '  open door             buy wine',
  'Move with the arrow keys, or the pad on a touch screen.',
  'Other useful words: INVENTORY, SCORE, SAVE, RESTORE, AGAIN.',
];
