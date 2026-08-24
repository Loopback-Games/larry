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
npm run build      # includes the type-check
npm test
npm run test:e2e
```
