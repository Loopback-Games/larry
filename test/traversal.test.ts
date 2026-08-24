import { describe, it, expect } from 'vitest';
import { createGame } from '../src/game/index.js';
import { ROOMS, ROOMS_BY_ID } from '../src/game/rooms/index.js';
import { RoomId, ItemId } from '../src/game/ids.js';
import { QUESTIONS } from '../src/game/rooms/age-check.js';
import { walkTo, exitCentre, reachable } from './navigation.js';
import { CANVAS_W } from '../src/constants.js';

/**
 * Walking tests.
 *
 * The walkthrough proves the puzzles are solvable; these prove the world is
 * navigable. Everything here drives the ego by steering and ticking, exactly as
 * holding the arrow keys does, so a doorway that cannot be reached on foot
 * fails here even though `goTo` would have hidden it.
 */

function fresh() {
  const g = createGame();
  while (g.dismissMessage());
  return g;
}

describe('walking the map', () => {
  it('walks through every unlocked exit into the room it advertises', () => {
    const g = fresh();
    const failures: string[] = [];

    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      for (const exit of room.exits ?? []) {
        g.goTo(room.id);
        while (g.dismissMessage());
        // Only exercise exits that are open with a fresh inventory.
        if (typeof exit.when?.(g) === 'string') continue;

        const arrived = walkTo(g, exitCentre(exit));
        if (!arrived) {
          failures.push(`${room.id} -> ${exit.to}: could not walk to the doorway`);
          continue;
        }
        // Walking into a doorway must actually change room.
        for (let i = 0; i < 10 && g.roomId === room.id; i++) g.tick();
        if (g.roomId !== exit.to) {
          failures.push(`${room.id} -> ${exit.to}: walking in led to ${g.roomId}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('does not bounce the player back out of a room they just entered', () => {
    const g = fresh();
    const failures: string[] = [];

    for (const room of ROOMS) {
      if (room.cutscene) continue;
      for (const from of Object.keys(room.entries)) {
        if (from !== 'default' && !ROOMS_BY_ID.has(from)) continue;
        if (from !== 'default') g.goTo(from);
        g.goTo(room.id);
        while (g.dismissMessage());
        // Stand still for a while. The room must keep the player.
        for (let i = 0; i < 12; i++) g.tick();
        if (g.roomId !== room.id) {
          failures.push(`${room.id}: entering from ${from} bounced straight to ${g.roomId}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('never lets a walker put its feet inside scenery', () => {
    const g = fresh();
    const failures: string[] = [];

    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      g.goTo(room.id);
      while (g.dismissMessage());

      // Shove hard in every direction for a while and check the invariant holds.
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]] as const) {
        g.goTo(room.id);
        while (g.dismissMessage());
        g.steer(dx, dy);
        for (let i = 0; i < 120; i++) {
          g.tick();
          if (g.roomId !== room.id) break;
          if (!g.canOccupy(g.ego.x, g.ego.y, g.ego.collisionHalfWidth)) {
            failures.push(
              `${room.id}: walking (${dx},${dy}) put the ego at ` +
                `${Math.round(g.ego.x)},${Math.round(g.ego.y)}, which is inside scenery`,
            );
            break;
          }
        }
        g.steer(0, 0);
      }
    }
    expect(failures).toEqual([]);
  });

  it('reaches the whole of the opening block on foot', () => {
    const g = fresh();
    // Outside Lefty's -> in -> behind the bar -> washroom, all by walking.
    g.goTo(RoomId.OutsideBar);
    while (g.dismissMessage());

    const route: string[] = [RoomId.InsideBar, RoomId.BarHallway, RoomId.BarToilet];
    for (const target of route) {
      const room = ROOMS_BY_ID.get(g.roomId)!;
      const exit = room.exits?.find((e) => e.to === target);
      expect(exit, `no exit from ${g.roomId} to ${target}`).toBeDefined();
      expect(walkTo(g, exitCentre(exit!)), `could not walk ${g.roomId} -> ${target}`).toBe(true);
      for (let i = 0; i < 10 && g.roomId !== target; i++) g.tick();
      expect(g.roomId, `walking from ${room.id}`).toBe(target);
      while (g.dismissMessage());
    }
  });

  it('plays the opening act with no teleporting at all', () => {
    // Every room change here happens by walking. Nothing calls goTo, so this
    // exercises navigation and puzzle handling together, the way a player does.
    const g = fresh();
    const drain = () => {
      while (g.dismissMessage());
    };
    const type = (line: string) => {
      drain();
      g.submit(line);
      drain();
    };
    const walkThrough = (to: string) => {
      const room = ROOMS_BY_ID.get(g.roomId)!;
      const exit = room.exits?.find((e) => e.to === to);
      expect(exit, `no exit from ${g.roomId} to ${to}`).toBeDefined();
      expect(walkTo(g, exitCentre(exit!)), `stuck walking ${g.roomId} -> ${to}`).toBe(true);
      for (let i = 0; i < 10 && g.roomId !== to; i++) g.tick();
      drain();
      expect(g.roomId).toBe(to);
    };

    type(''); // title card
    for (let i = 0; i < 12 && g.roomId === RoomId.AgeCheck; i++) {
      const seed = g.counter('quizSeed');
      const index = g.counter('quizIndex');
      type(QUESTIONS[(seed + index * 3) % QUESTIONS.length].answers[0]);
    }
    expect(g.roomId).toBe(RoomId.OutsideBar);

    walkThrough(RoomId.InsideBar);
    type('buy whiskey');
    expect(g.score).toBe(1);

    walkThrough(RoomId.BarHallway);
    type('get rose');
    type('give whiskey to drunk');
    type('get remote');
    expect(g.score).toBe(4);

    walkThrough(RoomId.BarToilet);
    type('sit down');
    type('read the wall');
    type('open the cistern');
    expect(g.score).toBe(10);
    expect(g.has(ItemId.Ring)).toBe(true);

    walkThrough(RoomId.BarHallway);
    walkThrough(RoomId.BarBackroom);
    type('use remote');
    type('use remote');
    expect(g.score).toBe(21);
  });

  it('keeps the ego on screen and correctly scaled', () => {
    const g = fresh();
    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      g.goTo(room.id);
      while (g.dismissMessage());
      for (const spot of reachable(g)) {
        const x = spot % CANVAS_W;
        const y = Math.floor(spot / CANVAS_W);
        expect(x, room.id).toBeGreaterThanOrEqual(1);
        expect(x, room.id).toBeLessThan(CANVAS_W - 1);
        expect(y, `${room.id} lets the ego above its horizon`).toBeGreaterThanOrEqual(g.horizon);
        const scale = g.scaleAt(y);
        expect(scale, room.id).toBeGreaterThan(0.4);
        expect(scale, room.id).toBeLessThanOrEqual(1);
      }
    }
  });
});
