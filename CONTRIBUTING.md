# Contributing

## The one hard rule

Everything in this repository must be original work. Do not add code, artwork,
audio or text taken from any other game, and do not add anything that requires
another game's data files to run. If you are adapting an idea, adapt the idea
and write the expression yourself.

## Adding a room

1. Write `src/game/rooms/<name>.ts` exporting a scene function and a `RoomDef`.
2. Register it in `src/game/rooms/index.ts`.
3. Run `npm test`. `test/world.test.ts` will tell you if an exit points nowhere,
   an entry point is inside a wall, or an exit region is unreachable.
4. Review the art with `npx vite-node tools/room-sheet.mjs /tmp/rooms.ppm`.

Scenes are painted top-down: draw the floor before anything standing on it, or
the floor will paint over it.

## Adding a puzzle

Score with `g.award(points, key)`. The key makes the award once-only, so an
action cannot be repeated for points. Add the new step to the solution in
`test/walkthrough.test.ts` and adjust the milestone totals; the suite asserts
the run still finishes on exactly 222.

## Before opening a pull request

```sh
npm run verify     # type-check, tests, build, browser tests
```

CI runs the same commands, so anything that passes here passes there.
Deployment is automatic on merge to `main`; nothing needs publishing by hand.

If you touch a workflow:

```sh
npm run lint:workflows   # actionlint + zizmor
```

## What the tests are for

- `test/world` — the map holds together: exits resolve, entry points are on
  walkable ground, no room drops you on top of its own doorway.
- `test/traversal` — the map is *navigable*: it walks the ego through every
  exit by steering and ticking, exactly as the arrow keys do. Use this rather
  than `goTo` when you want to know a room really works.
- `test/walkthrough` — the game is completable and still scores 222.
