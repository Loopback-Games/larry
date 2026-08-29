import type { Painter } from './scene.js';
import { drawFigure, WALK_PHASES, FIGURE_W, FIGURE_H } from './figure.js';
import type { FigureStyle, Facing } from './figure.js';

/** How an actor decides where to be each tick. */
export type ActorBehaviour =
  | { kind: 'still' }
  | { kind: 'walkTo'; x: number; y: number; onArrive?: () => void }
  | { kind: 'patrol'; points: readonly (readonly [number, number])[]; index: number }
  | { kind: 'follow'; target: Actor; distance: number };

export interface ActorOptions {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly facing?: Facing;
  readonly style?: FigureStyle;
  /** Replaces the humanoid rig entirely, for props and vehicles. */
  readonly render?: (p: Painter, actor: Actor) => void;
  /** Pixels moved per tick. */
  readonly speed?: number;
  readonly visible?: boolean;
  /** Fixed depth band; by default the scene's depth under the actor's feet. */
  readonly depth?: number;
  /** Height in pixels, used for the bounding box when not using the rig. */
  readonly height?: number;
  readonly width?: number;
  /**
   * Half-width of the base that collides with scenery. Characters collide on
   * their feet, not their whole silhouette, so they can stand in front of a
   * counter without the counter pushing them away.
   */
  readonly footHalfWidth?: number;
  /** Depth of the colliding base, measured upwards from the feet. */
  readonly footHeight?: number;
  /** Actors that do not shrink with distance, such as vehicles and props. */
  readonly fixedScale?: boolean;
  /** Props already drawn with their own shading opt out of the contact shadow. */
  readonly castsShadow?: boolean;
}

/**
 * A moving thing in a room: Larry, another character, or a prop that needs to
 * be depth-sorted against the scenery rather than painted into it.
 */
export class Actor {
  readonly id: string;
  x: number;
  y: number;
  facing: Facing;
  phase = 0;
  visible: boolean;
  speed: number;
  style?: FigureStyle;
  render?: (p: Painter, actor: Actor) => void;
  depthOverride?: number;
  behaviour: ActorBehaviour = { kind: 'still' };
  /** Set while the actor moved on the most recent tick. */
  moving = false;
  readonly height: number;
  readonly width: number;
  readonly footHalfWidth: number;
  readonly footHeight: number;
  readonly fixedScale: boolean;
  readonly castsShadow: boolean;
  /** Perspective scale for this frame, set by the engine before drawing. */
  scale = 1;

  constructor(options: ActorOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.facing = options.facing ?? 'front';
    this.visible = options.visible ?? true;
    this.speed = options.speed ?? 2;
    this.style = options.style;
    this.render = options.render;
    this.depthOverride = options.depth;
    this.height = options.height ?? options.style?.height ?? FIGURE_H;
    this.width = options.width ?? FIGURE_W;
    this.footHalfWidth = options.footHalfWidth ?? 5;
    this.footHeight = options.footHeight ?? 3;
    this.fixedScale = options.fixedScale ?? options.render !== undefined;
    this.castsShadow = options.castsShadow ?? options.style !== undefined;
  }

  /**
   * Half-width of the base as it currently stands, including perspective.
   * A figure drawn smaller in the distance occupies proportionally less floor,
   * so collision and rendering agree at every depth.
   */
  get collisionHalfWidth(): number {
    return this.footHalfWidth * this.scale;
  }

  /** Bounding box in surface coordinates, with (x, y) as the feet. */
  get bounds(): { left: number; top: number; right: number; bottom: number } {
    const half = Math.ceil((this.width * this.scale) / 2) + 1;
    return {
      left: Math.floor(this.x - half),
      top: Math.floor(this.y - this.height * this.scale) - 1,
      right: Math.ceil(this.x + half),
      bottom: this.y,
    };
  }

  walkTo(x: number, y: number, onArrive?: () => void): void {
    this.behaviour = { kind: 'walkTo', x, y, onArrive };
  }

  stop(): void {
    this.behaviour = { kind: 'still' };
    this.moving = false;
  }

  faceTowards(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx >= 0 ? 'right' : 'left';
    else this.facing = dy >= 0 ? 'front' : 'back';
  }

  /** Advance the walk cycle by one frame. */
  advanceAnimation(): void {
    this.phase = (this.phase + 1) % WALK_PHASES;
  }

  draw(p: Painter): void {
    if (!this.visible) return;
    if (this.render) {
      this.render(p, this);
      return;
    }
    if (this.style) {
      const scaled =
        this.scale === 1
          ? this.style
          : {
              ...this.style,
              height: Math.max(10, Math.round((this.style.height ?? 30) * this.scale)),
              build: Math.max(2, Math.round((this.style.build ?? 4) * this.scale)),
            };
      drawFigure(p, scaled, this.facing, this.moving ? this.phase : 0, this.x, this.y);
    }
  }
}
