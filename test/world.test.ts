import { describe, it, expect } from 'vitest';
import { ROOMS, ROOMS_BY_ID } from '../src/game/rooms/index.js';
import { createGame } from '../src/game/index.js';
import { RoomId, MAX_SCORE } from '../src/game/ids.js';
import { QUESTIONS } from '../src/game/rooms/age-check.js';
import { CANVAS_W, CANVAS_H, WALK_BLOCKED } from '../src/constants.js';
import { reachable } from './navigation.js';

describe('world integrity', () => {
  it('gives every room a unique id that is a declared RoomId', () => {
    const known = new Set<string>(Object.values(RoomId));
    const seen = new Set<string>();
    for (const room of ROOMS) {
      expect(known.has(room.id), `${room.id} is not in RoomId`).toBe(true);
      expect(seen.has(room.id), `${room.id} declared twice`).toBe(false);
      seen.add(room.id);
    }
  });

  it('points every exit at a room that exists', () => {
    for (const room of ROOMS) {
      for (const exit of room.exits ?? []) {
        expect(ROOMS_BY_ID.has(exit.to), `${room.id} -> ${exit.to}`).toBe(true);
      }
    }
  });

  it('gives every room a default entry point inside the canvas', () => {
    for (const room of ROOMS) {
      const entry = room.entries.default;
      expect(entry, `${room.id} has no default entry`).toBeDefined();
      for (const [name, point] of Object.entries(room.entries)) {
        expect(point.x, `${room.id}.${name}.x`).toBeGreaterThanOrEqual(0);
        expect(point.x, `${room.id}.${name}.x`).toBeLessThan(CANVAS_W);
        expect(point.y, `${room.id}.${name}.y`).toBeGreaterThanOrEqual(0);
        expect(point.y, `${room.id}.${name}.y`).toBeLessThan(CANVAS_H);
      }
    }
  });

  it('names entry keys after real rooms', () => {
    for (const room of ROOMS) {
      for (const key of Object.keys(room.entries)) {
        if (key === 'default') continue;
        expect(ROOMS_BY_ID.has(key), `${room.id} entry key ${key}`).toBe(true);
      }
    }
  });

  it('keeps every exit rectangle inside the canvas', () => {
    for (const room of ROOMS) {
      for (const exit of room.exits ?? []) {
        expect(exit.x, `${room.id}`).toBeGreaterThanOrEqual(0);
        expect(exit.y, `${room.id}`).toBeGreaterThanOrEqual(0);
        expect(exit.x + exit.w, `${room.id}`).toBeLessThanOrEqual(CANVAS_W);
        expect(exit.y + exit.h, `${room.id}`).toBeLessThanOrEqual(CANVAS_H);
        expect(exit.w).toBeGreaterThan(0);
        expect(exit.h).toBeGreaterThan(0);
      }
    }
  });

  it('paints a scene of the right size with somewhere to stand', () => {
    for (const room of ROOMS) {
      const s = room.scene();
      expect(s.width, room.id).toBe(CANVAS_W);
      expect(s.height, room.id).toBe(CANVAS_H);
      const painted = s.colour.reduce((n, v) => n + (v === 0 ? 0 : 1), 0);
      expect(painted, `${room.id} is mostly blank`).toBeGreaterThan(3000);
      // Framing screens and close-ups are deliberately unwalkable.
      if (room.cutscene || room.closeup) continue;
      const walkable = s.walk.reduce((n, v) => n + (v === 0 ? 1 : 0), 0);
      expect(walkable, `${room.id} has no walkable floor`).toBeGreaterThan(500);
    }
  });

  it('lets Larry stand where each room puts him', () => {
    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      const s = room.scene();
      for (const [name, point] of Object.entries(room.entries)) {
        const mask = s.walk[Math.round(point.y) * CANVAS_W + Math.round(point.x)];
        expect(mask, `${room.id}.${name} spawns inside scenery`).not.toBe(WALK_BLOCKED);
      }
    }
  });

  it('lets the player actually walk to every exit', () => {
    const g = createGame();
    for (const room of ROOMS) {
      if (room.cutscene || room.closeup || !room.exits?.length) continue;
      g.goTo(room.id);
      while (g.dismissMessage());

      const spots = reachable(g);
      expect(spots.size, `${room.id}: the entry point is walled in`).toBeGreaterThan(40);

      for (const exit of room.exits) {
        let ok = false;
        for (let y = exit.y; y < exit.y + exit.h && !ok; y++) {
          for (let x = exit.x; x < exit.x + exit.w; x++) {
            if (spots.has(y * CANVAS_W + x)) {
              ok = true;
              break;
            }
          }
        }
        expect(ok, `${room.id} -> ${exit.to} cannot be walked to from the entry`).toBe(true);
      }
    }
  });

  it('gives every room a floor deep enough to move around in', () => {
    const g = createGame();
    for (const room of ROOMS) {
      if (room.cutscene || room.closeup) continue;
      g.goTo(room.id);
      while (g.dismissMessage());
      const spots = reachable(g);
      expect(spots.size, `${room.id} has almost nowhere to stand`).toBeGreaterThan(300);
    }
  });

  it('keeps hotspot nouns unique within a room', () => {
    for (const room of ROOMS) {
      const nouns = (room.hotspots ?? []).map((h) => h.noun);
      expect(new Set(nouns).size, `${room.id} repeats a hotspot noun`).toBe(nouns.length);
    }
  });

  it('starts a new game on the title card with the pocket items', () => {
    const g = createGame();
    expect(g.roomId).toBe(RoomId.Title);
    expect(g.score).toBe(0);
    expect(g.inventory).toHaveLength(4);
    expect(MAX_SCORE).toBe(222);
  });

  it('reaches the opening room through the title card and the door', () => {
    const g = createGame();
    const drain = () => {
      while (g.dismissMessage());
    };
    drain();
    g.submit('start');
    drain();
    expect(g.roomId).toBe(RoomId.AgeCheck);

    // Answer the questions the room is actually asking, which the room derives
    // from its own counters.
    for (let i = 0; i < 12 && g.roomId === RoomId.AgeCheck; i++) {
      const seed = g.counter('quizSeed');
      const index = g.counter('quizIndex');
      const question = QUESTIONS[(seed + index * 3) % QUESTIONS.length];
      g.submit(question.answers[0]);
      drain();
    }
    expect(g.roomId).toBe(RoomId.OutsideBar);
  });
});
