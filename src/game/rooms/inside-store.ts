import { paint } from '../../engine/scene.js';
import { C, shade } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 122;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideStore, label: 'Street', side: 'right', y: 148, w: 36 },
];

/**
 * The all-night liquor store. Strip lighting, four aisles, and a proprietor
 * who has seen every kind of customer this town produces.
 */
export const insideStoreScene = () =>
  paint((p) => {
    // ---- shell -------------------------------------------------------------
    // Strip-lit and bright, but held below white: a pure-white floor blows out
    // the whole picture and leaves the ego with nothing to read against.
    p.ink(C.linen).box(0, 0, p.width, FLOOR);
    p.sweep(0, 0, p.width, FLOOR, 1, -1);
    p.slab(0, 0, p.width, 11, C.khaki, 1);

    // Strip lights, and the wash they put on the ceiling.
    for (const lx of [56, 160, 264]) {
      p.slab(lx - 28, 12, 56, 6, C.cream, 1);
      p.ink(C.white).box(lx - 26, 13, 52, 2);
      p.glow(lx, 18, 22, C.bone, 0.4, [C.linen, C.parchment, C.khaki]);
    }

    // ---- back wall of shelving --------------------------------------------
    p.slab(18, 32, 204, 66, C.woodDim, 1);
    p.ink(C.woodDeep).box(20, 34, 200, 62);
    for (const shelfY of [34, 54, 74]) {
      p.slab(20, shelfY + 17, 200, 3, C.brown, 1);
      for (let x = 24; x < 216; x += 9) {
        const colour = [C.greenDim, C.gold, C.teal, C.crimson, C.bone, C.magenta][
          (x + shelfY) % 6
        ];
        p.ink(colour).box(x, shelfY + 4, 6, 13);
        p.ink(shade(colour, 2)).box(x, shelfY + 6, 1, 9);
        p.ink(shade(colour, -2)).box(x + 5, shelfY + 6, 1, 9);
        p.ink(shade(colour, -1)).box(x + 1, shelfY + 4, 4, 1);
      }
    }
    p.contact(18, 32, 204, 8, -2);

    // A sign nobody has updated in a decade.
    p.slab(230, 28, 80, 28, C.maroon, 1);
    p.ink(C.gold).outline(233, 31, 74, 22);
    p.ink(C.cream).box(238, 36, 64, 4).box(238, 44, 48, 4);

    // ---- chill cabinet, right ----------------------------------------------
    p.slab(234, 60, 78, 58, C.pewter, 1);
    p.ink(C.tealDeep).box(238, 64, 70, 50);
    p.sweep(238, 64, 70, 50, 1, -1);
    p.ink(C.cyanPale).line(238, 66, 306, 66);
    p.ink(C.silver).box(272, 64, 2, 50);
    p.ink(C.blueDim);
    for (let y = 70; y < 110; y += 12) for (let x = 242; x < 306; x += 10) p.box(x, y, 6, 9);
    p.ink(C.cyanLit).line(240, 68, 268, 96);
    p.contact(234, 114, 78, 6, -2);

    // ---- counter, till and magazine rack -----------------------------------
    p.slab(0, 94, 132, 8, C.brownLit, 1);
    p.slab(0, 102, 132, 22, C.woodDim, 1);
    p.sweep(0, 102, 132, 22, 0, -1);
    p.slab(84, 80, 36, 15, C.pewter, 1);
    p.ink(C.ink).box(88, 83, 28, 6);
    p.ink(C.greenLit).box(90, 84, 24, 4);
    p.ink(C.silver).box(90, 91, 4, 3).box(97, 91, 4, 3).box(104, 91, 4, 3);
    p.contact(0, 118, 132, 6, -2);

    p.slab(140, 84, 64, 42, C.asphalt, 1);
    for (let r = 0; r < 3; r++) {
      const colour = [C.pinkLit, C.goldLit, C.cyanLit][r];
      p.slab(144, 88 + r * 13, 56, 11, colour, 1);
      p.ink(C.cream).box(147, 91 + r * 13, 22, 4);
    }
    p.contact(140, 122, 64, 5, -2);

    // ---- floor -------------------------------------------------------------
    // Vinyl tiles, receding, and clearly darker than the lit walls.
    p.ink(C.bone).box(0, FLOOR, p.width, p.height - FLOOR);
    p.sweep(0, FLOOR, p.width, p.height - FLOOR, -2, 0);
    p.ink(C.khaki);
    for (let i = -7; i <= 7; i++) p.line(160 + i * 20, FLOOR, 160 + i * 62, p.height - 1);
    for (let r = 1; r < 6; r++) {
      const y = FLOOR + (p.height - FLOOR) * Math.pow(r / 6, 1.7);
      p.line(0, y, p.width - 1, y);
    }
    p.contact(0, FLOOR, p.width, 12, -2);

    doorways(p, DOORS);
    p.depthRamp(122, p.height, 6, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
    p.blockRect(0, 122, 132, 10);
    p.blockRect(236, 118, 76, 8);
  });

const SHOPKEEPER = new Actor({
  id: 'shopkeeper',
  x: 46,
  y: 108,
  facing: 'front',
  depth: 5,
  style: {
    hair: C.black,
    hairStyle: 'short',
    skin: C.brown,
    top: C.blue,
    shirt: C.white,
    bottom: C.navy,
    shoes: C.black,
    build: 4,
  },
});

export const insideStore: RoomDef = {
  id: RoomId.InsideStore,
  title: 'The Liquor Store',
  scene: insideStoreScene,

  horizon: 122,
  scaleAtHorizon: 0.72,

  entries: {
    default: { x: 250, y: 150, facing: 'left' },
    [RoomId.OutsideStore]: { x: 276, y: 150, facing: 'left' },
  },

  describe:
    'Strip lights, a wall of bottles, a chill cabinet humming to itself, and a ' +
    'magazine rack positioned so that everyone in the shop can see what you ' +
    'choose. The man behind the counter is reading something else entirely.',

  populate: () => [SHOPKEEPER],

  hotspots: [
    {
      noun: 'shopkeeper',
      synonyms: ['clerk', 'man', 'proprietor', 'owner', 'him'],
      look:
        'He looks up, takes in the leisure suit, and goes back to his book ' +
        'without comment. It is the most tactful thing anyone has done for ' +
        'you all night.',
    },
    {
      noun: 'rack',
      synonyms: ['magazines', 'magazine rack', 'shelf'],
      look: 'A rack of magazines arranged so that the interesting ones are at adult eye level.',
    },
    {
      noun: 'counter',
      synonyms: ['till', 'register'],
      look: 'A worn counter with a till and a jar of something pickled.',
    },
    {
      noun: 'cabinet',
      synonyms: ['chill cabinet', 'fridge', 'cooler'],
      look: 'A cold cabinet full of things in cans.',
    },
    {
      noun: 'shelves',
      synonyms: ['bottles', 'liquor', 'stock'],
      look: 'Every bottle this town has a use for, and several it does not.',
    },
  ],

  exits: exitsOf(DOORS),

  onCommand(g, cmd) {
    const buy = (item: string) =>
      cmd.isAny('buy', item) || cmd.isAny('get', item) || cmd.isAny('ask', item);

    if (buy(ItemId.Magazine)) {
      if (g.has(ItemId.Magazine)) {
        g.say('One is enough. Two would be a statement.');
        return true;
      }
      g.give(ItemId.Magazine);
      g.award(1, 'bought-magazine');
      g.cue('coin');
      g.say(
        'You take a magazine to the counter and put it down face-first, which ' +
          'fools nobody.',
        'He rings it up without looking at it, which you decide to be grateful for.',
      );
      return true;
    }

    if (cmd.is('read', ItemId.Magazine) || cmd.is('look', ItemId.Magazine)) {
      if (!g.has(ItemId.Magazine)) {
        g.say('You would need to buy one first.');
        return true;
      }
      if (g.award(1, 'read-magazine')) {
        g.set('knowsAboutProtection');
        g.cue('score');
        g.say(
          'You flick through it, strictly for the articles, and find one.',
          'Inside the back cover, between an advertisement for hair products ' +
            'and one for a mail-order sword, is a short, stern paragraph on ' +
            'the importance of protection, and a note that most liquor stores ' +
            'keep it behind the counter if you have the nerve to ask.',
          'You do not have the nerve. You will have to develop some.',
        );
      } else {
        g.say('You have read it. The useful paragraph is still in the back.');
      }
      return true;
    }

    if (buy(ItemId.Wine)) {
      if (g.has(ItemId.Wine)) {
        g.say('You have a bottle already.');
        return true;
      }
      g.give(ItemId.Wine);
      g.award(1, 'bought-wine');
      g.cue('coin');
      g.say(
        'You buy the cheapest bottle of red in the shop, which is a competitive ' + 'category.',
        'He puts it in a paper bag, twisting the neck closed with the ' +
          'practised movement of a man who does this four hundred times a night.',
      );
      return true;
    }

    if (buy(ItemId.Condom)) {
      if (g.has(ItemId.Condom) || g.has(ItemId.UsedCondom)) {
        g.say('You have that situation in hand.');
        return true;
      }
      if (!g.flag('knowsAboutProtection')) {
        g.say(
          'You look along the shelves for something you cannot name and would ' +
            'not recognise. There is nothing on display.',
        );
        return true;
      }
      g.give(ItemId.Condom);
      g.award(4, 'bought-protection');
      g.cue('coin');
      g.say(
        'You approach the counter. You open your mouth. Nothing comes out.',
        'You try again and manage the word, at a volume that reaches the back ' +
          'of the shop and, you suspect, the street.',
        'He reaches under the counter without changing expression, rings it up, ' +
          'and says "Good luck," in a tone that carries no hope whatsoever.',
      );
      return true;
    }

    if (cmd.is('talk', 'shopkeeper')) {
      g.say(
        g.flag('knowsAboutProtection')
          ? '"You want something," he says, "or you want to keep standing there?"'
          : '"Take your time," he says, in a way that means the opposite.',
      );
      return true;
    }

    if (cmd.verb === 'get' && cmd.object && ['shelves', 'bottles'].includes(cmd.object)) {
      g.say('Shoplifting, in a shop this size, with one other person in it. No.');
      return true;
    }

    return false;
  },
};
