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
4. Review the art with `node tools/room-sheet.mjs rooms.png`, which
   renders every room, ego and actors included, to one PNG. Pass `walk` as a
   second argument to tint the same sheet by walkability with every exit
   trigger outlined — the quickest way to see a trigger that has drifted away
   from the art it belongs to. CI renders both on every run and attaches them
   as the `room-sheet` artifact.

Scenes are painted top-down: draw the floor before anything standing on it, or
the floor will paint over it.

## Ways out

Declare exits as `Doorway` specs and use them twice: `doorways(p, DOORS)` in
the scene function paints them, and `exits: exitsOf(DOORS)` turns the same
list into triggers. Never hand-write an exit rectangle. When the two were
written separately they drifted, and the cab outside Lefty's ended up being
reached by walking into a bare patch of road.

Finish the scene with `walls(p, FLOOR, DOORS)`, which blocks everything above
the floor line and then reopens each threshold, so a doorway you can see is
always one you can stand in.

Rooms should also set `horizon` and `scaleAtHorizon`. The horizon is the floor
line, used for perspective scaling; it does not bound movement, so a room may
let the player climb above it where the walk mask allows, as the storeroom
stairs do.

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

## Sizing things

Scenes are drawn in perspective, so "how tall is a table" depends on where the
table stands. Size props off the figure that would stand beside them, using
`propHeight` from `src/game/scale.ts`, rather than by eye. Doing it by eye gave
the bar a counter taller than Larry and stools he could not have climbed.

Scenery that stands forward of the wall needs `p.standing(...)` after
`depthRamp`, which reads its depth band from the floor beneath it. Choosing the
band by hand is how the counter came to sit in front of every customer as well
as the bartender, painting out the head of anyone who walked up to the bar.

Call `walls(p, FLOOR, DOORS)` last, after every other `blockRect`. Forward
scenery reaches below the floor line, and marking it solid afterwards can seal
a doorway it merely stands beside.

## Artwork

The palette is a set of hue ramps rather than a flat table, so every colour has
somewhere darker and somewhere lighter to go. Use that: `slab` for anything
with volume, `contact` where two surfaces meet, `sweep` for a graded surface,
and `relight` to push what is already painted towards light or shadow. Light
comes from the upper left everywhere in the game.

Prefer `sweep` to `gradient` on any large area. `gradient` dithers between two
fixed inks and over a whole wall reads as sandpaper; `sweep` steps through the
colour's own ramp and dithers only at the transitions.

`test/art.test.ts` measures whether a room can be read at all: how many colours
it uses, whether one flat colour dominates, whether it has more than a couple
of brightness levels, and whether the floor is distinguishable from the wall
behind it. If it fails, the room is a coloured rectangle rather than a picture.
