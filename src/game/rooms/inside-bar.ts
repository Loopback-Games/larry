import { paint } from '../../engine/scene.js';
import { C, shade } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { propHeight } from '../scale.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the back wall meets the floorboards. */
const FLOOR = 120;
/** Perspective, declared here so the scenery can be sized off the figure. */
const AT_HORIZON = 0.74;

/** Where the counter meets the floor, and how tall that makes it. */
const COUNTER_BASE = 126;
const COUNTER_H = propHeight('counterTop', COUNTER_BASE, FLOOR, AT_HORIZON);
const COUNTER_TOP = COUNTER_BASE - COUNTER_H;

/** The stools stand further forward, so they are drawn larger. */
const STOOL_BASE = 152;
const STOOL_H = propHeight('stoolSeat', STOOL_BASE, FLOOR, AT_HORIZON);

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.BarHallway,
    label: 'Back',
    side: 'back',
    x: 30,
    y: FLOOR,
    w: 28,
    h: 54,
    colour: C.woodDim,
    through: C.black,
  },
  { to: RoomId.OutsideBar, label: 'Street', side: 'front', x: 160, w: 44 },
];

/**
 * Inside Lefty's. Dim, red, and emptier than it should be. The bar runs across
 * the middle of the room; a door at the back leads deeper into the building.
 */
export const insideBarScene = () =>
  paint((p) => {
    // ---- room shell -------------------------------------------------------
    // A dim red room lit from above the counter, so the walls fall away at the
    // corners and the bar itself is the brightest thing in the picture.
    p.ink(C.maroon).box(0, 0, p.width, FLOOR);
    p.sweep(0, 0, p.width, FLOOR, -1, 1);
    p.ink(C.maroonDeep).box(0, 0, p.width, 14);
    p.slab(0, 12, p.width, 4, C.woodDeep, 1);

    // Ceiling beams pulling back towards the bar.
    p.ink(C.maroonDeep);
    p.line(0, 14, 48, 40).line(p.width - 1, 14, 272, 40);
    p.line(0, 30, 64, 42).line(p.width - 1, 30, 256, 42);

    // Hanging lamps over the counter, each throwing light on the wall behind.
    for (const lx of [96, 160, 224]) {
      p.ink(C.charcoal).box(lx - 1, 14, 2, 12);
      p.ink(C.pewter).solid([lx - 9, 32, lx + 9, 32, lx + 5, 25, lx - 5, 25]);
      p.ink(C.silver).line(lx - 9, 32, lx + 8, 32);
      p.ink(C.yellowPale).box(lx - 6, 33, 12, 2);
      p.glow(lx, 36, 22, C.crimson, 0.4, [C.maroon, C.crimson, C.maroonDeep]);
      p.lightPool(lx, 40, 30, 26, 1);
    }

    // ---- back bar ---------------------------------------------------------
    // The bottle shelf sits on a base cabinet that carries down to the floor,
    // so the two do not float apart with a band of bare wall between them.
    p.slab(66, 36, 188, 52, C.woodDim, 1);
    p.ink(C.woodDeep).box(70, 40, 180, 44);
    p.sweep(70, 40, 180, 44, -1, 0);
    for (const shelfY of [55, 70]) {
      p.slab(70, shelfY, 180, 3, C.brown, 1);
    }
    p.slab(70, 88, 180, COUNTER_TOP - 86, C.woodDim, 1);
    p.sweep(70, 88, 180, COUNTER_TOP - 86, 0, -1);
    p.ink(C.woodDeep);
    for (let x = 88; x < 250; x += 26) p.line(x, 90, x, COUNTER_TOP - 1);

    // Bottles: warm spirits on top, green and clear below, all glinting on the
    // same side because the light is over the counter.
    const bottles = [
      [78, C.gold],
      [88, C.tan],
      [98, C.brownLit],
      [110, C.crimson],
      [120, C.bone],
      [132, C.greenDim],
      [142, C.gold],
      [154, C.tealLit],
      [166, C.crimson],
      [176, C.bone],
      [188, C.greenDim],
      [198, C.goldLit],
      [210, C.teal],
      [222, C.maroon],
      [234, C.ivory],
    ] as const;
    for (const [bx, colour] of bottles) {
      for (const by of [44, 59]) {
        p.ink(colour).box(bx, by, 5, 11);
        p.ink(shade(colour, 2)).box(bx, by + 2, 1, 8);
        p.ink(shade(colour, -2)).box(bx + 4, by + 2, 1, 8);
        p.ink(shade(colour, -1)).box(bx + 1, by, 3, 1);
      }
    }

    // Mirror and a dead beer sign.
    p.slab(254, 42, 34, 38, C.woodDim, 1);
    p.ink(C.slateDim).box(257, 45, 28, 32);
    p.sweep(257, 45, 28, 32, 1, -1);
    p.ink(C.steel).line(260, 48, 282, 70);
    p.slab(32, 40, 34, 22, C.navy, 1);
    p.ink(C.blueLit).outline(35, 43, 28, 16);
    p.ink(C.bluePale).line(38, 51, 60, 51);

    // ---- the counter ------------------------------------------------------
    // Waist height on the man standing at it, not chest height on a giant.
    // Lit along its top edge, which is what makes it read as a solid mass in
    // front of the bartender rather than a brown stripe.
    const lip = Math.max(3, Math.round(COUNTER_H * 0.28));
    p.slab(30, COUNTER_TOP, 260, lip, C.brownLit, 1);
    p.ink(C.tan).box(30, COUNTER_TOP, 260, 2);
    p.slab(32, COUNTER_TOP + lip, 256, COUNTER_H - lip, C.woodDim, 1);
    p.sweep(32, COUNTER_TOP + lip, 256, COUNTER_H - lip, 0, -1);
    p.ink(C.woodDeep);
    for (let x = 44; x < 288; x += 18) p.line(x, COUNTER_TOP + lip + 1, x, COUNTER_BASE - 2);
    p.contact(30, COUNTER_TOP + lip, 260, 6, -2);

    // Beer taps and a bowl of something salted, standing on the counter.
    for (const tx of [120, 128, 136]) p.slab(tx, COUNTER_TOP - 9, 4, 9, C.pewter, 1);
    p.slab(115, COUNTER_TOP - 12, 28, 4, C.silver, 1);
    p.ink(C.ivory).solid([
      196,
      COUNTER_TOP,
      214,
      COUNTER_TOP,
      211,
      COUNTER_TOP - 6,
      199,
      COUNTER_TOP - 6,
    ]);
    p.ink(C.khaki).line(199, COUNTER_TOP - 5, 210, COUNTER_TOP - 5);

    // ---- floor ------------------------------------------------------------
    p.floorPlane(FLOOR, p.height, C.brown, 160, 11);

    // Stools go on after the floor, or the floor paints over them. Seat height
    // is taken from the figure that would sit on it.
    const seatTop = STOOL_BASE - STOOL_H;
    const cushion = Math.max(2, Math.round(STOOL_H * 0.3));
    for (const sx of [58, 100, 142, 184, 226, 266]) {
      p.ink(C.crimson).solid([
        sx - 10,
        seatTop,
        sx + 10,
        seatTop,
        sx + 8,
        seatTop + cushion,
        sx - 8,
        seatTop + cushion,
      ]);
      p.ink(C.redLit).line(sx - 10, seatTop, sx + 9, seatTop);
      p.ink(C.maroonDeep).line(sx - 8, seatTop + cushion, sx + 7, seatTop + cushion);
      p.slab(sx - 2, seatTop + cushion, 4, STOOL_BASE - seatTop - cushion, C.pewter, 1);
      p.ink(C.asphaltDeep).box(sx - 6, STOOL_BASE - 2, 12, 2);
    }

    p.vignette(-1);
    p.depthRamp(FLOOR, p.height, 6, 14);
    // The counter sits in front of the bartender and behind every customer.
    p.standing(30, COUNTER_TOP, 260, COUNTER_BASE - COUNTER_TOP);
    doorways(p, DOORS);
    // The bar itself is solid; you cannot walk through it to the bottles.
    p.blockRect(30, COUNTER_TOP, 260, COUNTER_BASE - COUNTER_TOP);
    for (const sx of [58, 100, 142, 184, 226, 266]) {
      p.blockRect(sx - 10, seatTop, 20, cushion + 2);
    }
    // Last, so the counter cannot seal the passage it stands beside.
    walls(p, FLOOR, DOORS);
  });

const BARTENDER = new Actor({
  id: 'bartender',
  x: 246,
  y: 118,
  facing: 'front',
  depth: 3,
  style: {
    hair: C.black,
    hairStyle: 'short',
    skin: C.pink,
    top: C.white,
    shirt: C.white,
    bottom: C.slate,
    shoes: C.black,
    build: 5,
  },
});

export const insideBar: RoomDef = {
  id: RoomId.InsideBar,
  title: "Lefty's Bar",
  scene: insideBarScene,

  horizon: FLOOR,
  scaleAtHorizon: AT_HORIZON,

  entries: {
    default: { x: 168, y: 150, facing: 'back' },
    [RoomId.OutsideBar]: { x: 160, y: 150, facing: 'back' },
    [RoomId.BarHallway]: { x: 44, y: 136, facing: 'right' },
  },

  describe:
    "Lefty's. Red walls, red light, and a smell of spilt beer that has soaked " +
    'into the fabric of the building. A bartender polishes a glass with a cloth ' +
    'that is making it dirtier. Nobody else is here.',

  populate: () => [BARTENDER],

  hotspots: [
    {
      noun: 'bartender',
      synonyms: ['lefty', 'barman', 'man', 'barkeep', 'him'],
      look:
        'A large, unhurried man polishing a glass. He has the expression of ' +
        'someone who stopped being surprised by people a very long time ago.',
    },
    {
      noun: 'bar',
      synonyms: ['counter', 'bartop'],
      look: 'A scarred wooden counter, sticky in a way you decide not to investigate.',
    },
    {
      noun: 'stool',
      synonyms: ['stools', 'seat', 'seats', 'chair'],
      look: 'Five vinyl stools. Four of them are torn. The fifth is worse.',
    },
    {
      noun: 'bottles',
      synonyms: ['bottle', 'shelf', 'shelves', 'liquor', 'booze'],
      look:
        'Rows of bottles in colours not found in nature. The labels have been ' +
        'turned to face the wall, which is either theft prevention or shame.',
    },
    {
      noun: 'mirror',
      look:
        'You catch sight of yourself: white suit, open collar, hopeful ' +
        'expression. You look away first.',
    },
    {
      noun: 'door',
      synonyms: ['back door', 'doorway'],
      look: 'A door at the end of the bar, leading further into the building.',
    },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    const buyingDrink =
      cmd.isAny('buy', ItemId.Whiskey, 'drink') ||
      cmd.isAny('get', ItemId.Whiskey) ||
      cmd.isAny('ask', ItemId.Whiskey);

    if (buyingDrink) {
      if (g.has(ItemId.Whiskey)) {
        g.say('You already have a drink you have no intention of finishing.');
        return true;
      }
      g.give(ItemId.Whiskey);
      g.award(1, 'bought-whiskey');
      g.cue('coin');
      g.say(
        'You order a whiskey. The bartender pours something amber without ' +
          'breaking eye contact, takes your money, and goes back to his glass.',
        'You are now holding a drink. This makes you approximately eleven per ' +
          'cent more confident.',
      );
      return true;
    }

    if (cmd.is('talk', 'bartender') || cmd.isBare('talk')) {
      if (g.has(ItemId.Whiskey)) {
        g.say('"You want another one?" he says, in a tone that discourages it.');
      } else {
        g.say(
          '"You drinking or loitering?" he asks, without looking up.',
          'It seems rude not to buy something.',
        );
      }
      return true;
    }

    if (cmd.is('drink', ItemId.Whiskey)) {
      g.say(
        'You raise the glass, think better of it, and put it down again.',
        'Something tells you this drink has a purpose, and that purpose is not you.',
      );
      return true;
    }

    if (cmd.isAny('sit', 'stool', 'bar')) {
      g.say('You perch on a stool and wait to be noticed. You are not noticed.');
      return true;
    }

    return false;
  },
};
