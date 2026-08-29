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

It follows the _structure_ of a well-known 1987 adventure game — the shape of
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

One file pins every tool and one file holds every command.

```sh
mise install   # node, just and the linters, at the pinned versions
just setup     # the above, plus the dependencies and the test browser
just           # list the recipes
```

```sh
just run       # development server
just fmt       # format everything
just lint      # typecheck, formatting, workflows
just test      # unit, world, traversal and walkthrough tests
just e2e       # browser tests, desktop and mobile
just security  # advisories against the dependencies, secrets in the history
just art       # render every room to a contact sheet
just check     # every gate, against the environment you have
just ci        # provision first, then check. What CI runs.
```

Tool versions live in `mise.toml` and nowhere else — not the workflow, not a
`.nvmrc`, not the README. `.github/workflows/ci.yml` installs that same file
with `jdx/mise-action` and then runs `just ci`, one step and no inline shell, so
a workflow can never carry a command you cannot run yourself.

There is a devcontainer for anyone who would rather not install any of that. It
builds on the same Playwright image CI runs the suite in, so the browser and the
libraries behind it are identical in both places. `just container` runs the
whole gate inside it.

---

## How it is put together

Roughly 3,000 lines of TypeScript with no runtime dependencies. The built game
is about 58 KB gzipped, all of it code — there are no asset downloads, because
the artwork _is_ code.

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
waist-high counter can be solid _and_ have someone stand behind it.

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
test/world        every exit resolves and is walkable to, every entry point
                  is on clear ground, every scene paints
test/traversal    walks the ego through every exit by steering and ticking
test/walkthrough  plays the entire game through the parser
e2e/              boots, renders, plays and saves in a real browser
```

Two of these carry most of the weight.

`test/walkthrough` types the full solution and asserts the score lands on
exactly **222** — the only way to know every puzzle is reachable, solvable in
order, and worth what it should be.

`test/traversal` drives the ego by steering and ticking rather than teleporting
it. That distinction matters: the walkthrough used `goTo` and so never noticed
that three rooms bounced the player straight back out of the door they had just
walked through, leaving the slot machine, the card table and the lounge
unreachable in normal play.

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
