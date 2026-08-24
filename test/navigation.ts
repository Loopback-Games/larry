import { Game } from '../src/engine/engine.js';
import { CANVAS_W, CANVAS_H } from '../src/constants.js';

/** A walkable position, quantised to whole pixels. */
export type Point = { x: number; y: number };

const key = (x: number, y: number) => y * CANVAS_W + x;

/**
 * Every position the ego can reach on foot from where it is standing.
 *
 * Uses the engine's own occupancy rule, so it measures the room as the player
 * experiences it rather than as the walk mask is drawn.
 */
export function reachable(g: Game, from: Point = g.ego): Set<number> {
  // The base narrows with distance, so the width to test depends on the row.
  const halfAt = (y: number) => g.ego.footHalfWidth * g.scaleAt(y);
  const seen = new Set<number>();
  const start = { x: Math.round(from.x), y: Math.round(from.y) };
  if (!g.canOccupy(start.x, start.y, halfAt(start.y))) return seen;

  seen.add(key(start.x, start.y));
  const queue: Point[] = [start];
  while (queue.length) {
    const p = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || nx >= CANVAS_W || ny < 0 || ny >= CANVAS_H) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      if (!g.canOccupy(nx, ny, halfAt(ny))) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

/** Shortest walkable path from the ego to a target, or null if unreachable. */
export function pathTo(g: Game, target: Point): Point[] | null {
  const halfAt = (y: number) => g.ego.footHalfWidth * g.scaleAt(y);
  const start = { x: Math.round(g.ego.x), y: Math.round(g.ego.y) };
  const goal = { x: Math.round(target.x), y: Math.round(target.y) };
  if (!g.canOccupy(goal.x, goal.y, halfAt(goal.y))) return null;

  const prev = new Map<number, number>();
  const seen = new Set<number>([key(start.x, start.y)]);
  const queue: Point[] = [start];
  let head = 0;

  while (head < queue.length) {
    const p = queue[head++];
    if (p.x === goal.x && p.y === goal.y) {
      const path: Point[] = [];
      let k = key(p.x, p.y);
      for (;;) {
        path.push({ x: k % CANVAS_W, y: Math.floor(k / CANVAS_W) });
        const parent = prev.get(k);
        if (parent === undefined) break;
        k = parent;
      }
      return path.reverse();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || nx >= CANVAS_W || ny < 0 || ny >= CANVAS_H) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      if (!g.canOccupy(nx, ny, halfAt(ny))) continue;
      seen.add(k);
      prev.set(k, key(p.x, p.y));
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

/**
 * Walk the ego to a point, one tick at a time, driving the same route follower
 * the game uses when the player taps the scene.
 *
 * This deliberately exercises the engine's own pathfinding rather than a copy
 * of it: an earlier version planned its own route at one pixel per node while
 * the ego moved two, so it oscillated around every waypoint and reported
 * thirty-six broken connections that were not broken.
 */
export function walkTo(g: Game, target: Point, maxTicks = 600): boolean {
  const roomAtStart = g.roomId;
  const goal = { x: Math.round(target.x), y: Math.round(target.y) };
  if (!g.walkEgoTo(goal.x, goal.y)) return false;

  for (let tick = 0; tick < maxTicks; tick++) {
    if (g.roomId !== roomAtStart) return true; // walked into a doorway
    const at = { x: Math.round(g.ego.x), y: Math.round(g.ego.y) };
    if (at.x === goal.x && at.y === goal.y) return true;
    if (!g.walking) return false; // the route ran out without arriving
    g.tick();
    while (g.dismissMessage()) {
      /* clear anything the move triggered */
    }
  }
  return false;
}

/** Centre of an exit region. */
export function exitCentre(exit: { x: number; y: number; w: number; h: number }): Point {
  return { x: Math.round(exit.x + exit.w / 2), y: Math.round(exit.y + exit.h / 2) };
}
