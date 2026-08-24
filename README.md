# Lost Wages

An original parser adventure for desktop and mobile browsers, in the shape of
the late-1980s comedy adventures it is fond of: one night in a neon town, a
protagonist with poor judgement, a text parser, and 222 points to find.

**Play:** https://loopback-games.github.io/larry/

---

## What this is, and what it is not

This project is a **from-scratch reimplementation**. Every line of code, every
pixel of artwork, every line of writing and every note of music here is
original work produced for this repository.

It follows the *structure* of a well-known 1987 adventure game — the shape of
the city, the chain of puzzles, the 222-point scoring — because that structure
is what makes the genre work. Game mechanics and puzzle structure are not
copyrightable; the expression of them is. So none of the expression is reused:

- **No original source code.** Nothing was ported, transpiled, or copied.
- **No original assets.** No pictures, sprites, sounds, fonts or text from any
  other game appear here, and the project does not read or require any.
- **All prose is new.** Every room description, character line and joke was
  written for this project.

"Leisure Suit Larry" is a trademark of its owners. This is not their product,
is not endorsed by them, and is offered free, for study and for fun.

---

## Playing

Type what you want to do:

```
look at the sign          get the whiskey
talk to the bartender     give the rose to her
open the door             call 555-6969
```

Move with the arrow keys, the on-screen pad, or by tapping where you want to
go. `INVENTORY`, `SCORE`, `SAVE`, `RESTORE`, `AGAIN` and `HELP` all work.

On a phone the word chips under the prompt build a command by tapping: verbs
insert a word, nouns finish the sentence and send it.

---

## Running it

```sh
npm install
npm run dev        # development server
npm run build      # type-check and produce dist/
npm run preview    # serve the production build
npm test           # unit and integration tests
npm run test:e2e   # browser tests, desktop and mobile
```

Node 20 or newer.

---

## How it is put together

Roughly 3,000 lines of TypeScript with no runtime dependencies. The built game
is about 58 KB gzipped, all of it code — there are no asset downloads, because
the artwork *is* code.

```
src/
  engine/       drawing, text, parsing, actors, game state
  game/         the world: rooms, items, vocabulary
  platform/     canvas, input, audio
  ui/           the responsive shell
```

**Rooms are drawn, not loaded.** Each of the 27 rooms is a function that paints
itself with lines, polygons and fills:

```ts
p.ink(C.grey).box(48, 38, 220, 84);
p.bricks(48, 92, 220, 30, C.maroon, 6, 20);
p.window(62, 62, 34, 24, C.yellow, C.slate);
p.depthRamp(122, p.height, 5, 14);
```

Every scene carries three planes: **colour** for the picture, **depth** for
deciding whether a character walks in front of or behind the scenery, and
**walk** for where a character may go at all. Keeping them separate means a
waist-high counter can be solid *and* have someone stand behind it.

**Characters are parametric.** One humanoid rig is drawn from a style record,
so the whole cast — Larry, the bartender, Fawn, the doorman, Eve — shares
proportions and costs almost nothing to add to.

**The parser** resolves synonym groups to canonical ids, matches multi-word
phrases longest-first, and layers nouns: the room you are standing in wins,
then anything you are carrying, then the shared pool. That layering is not
decorative — see the note in `vocabulary.ts` for the three puzzles it fixed.

---

## Tests

```
test/raster       drawing primitives, fills, clipping
test/font         every glyph well-formed and legible
test/parser       synonyms, phrases, indirect objects
test/world        every exit resolves, every entry point is walkable,
                  every scene paints, no duplicate hotspots
test/walkthrough  plays the entire game through the parser
e2e/              boots, renders, plays and saves in a real browser
```

The walkthrough test is the one that matters. It types the full solution and
asserts the score lands on exactly **222**, which is the only way to know that
every puzzle in the chain is reachable, solvable in order, and worth what it is
meant to be worth. It has already caught real defects that unit tests missed.

---

## Deploying

Pushing to `main` builds and publishes the site through GitHub Actions. There is
no build-output branch: the artifact goes straight from the build job to Pages.

`.github/workflows/deploy.yml` type-checks, runs the unit tests, builds, deploys,
and then runs the browser suite **against the URL it just published**. A deploy
that produces a broken site fails the run.

`BASE_PATH` overrides the base URL if you serve it from somewhere else; the
workflow sets it from the Pages configuration automatically.

---

## Licence

MIT. See [LICENCE](LICENSE).
