import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The all-night liquor store. Strip lighting, four aisles, and a proprietor
 * who has seen every kind of customer this town produces.
 */
export const insideStoreScene = () =>
  paint((p) => {
    p.ink(C.grey).box(0, 0, p.width, 122);
    p.ink(C.white).box(0, 0, p.width, 10);
    p.ink(C.slate).line(0, 10, p.width - 1, 10);

    // Strip lights.
    for (const lx of [56, 160, 264]) {
      p.ink(C.white).box(lx - 28, 12, 56, 5);
      p.ink(C.yellow).box(lx - 26, 14, 52, 2);
    }

    // Back wall of shelving, packed with bottles.
    p.ink(C.brown).box(20, 34, 200, 62);
    p.ink(C.black).outline(20, 34, 200, 62);
    for (const shelfY of [34, 54, 74]) {
      p.ink(C.slate).line(20, shelfY + 18, 219, shelfY + 18);
      for (let x = 24; x < 216; x += 9) {
        const colour = [C.lime, C.yellow, C.teal, C.red, C.white, C.pink][(x + shelfY) % 6];
        p.ink(colour).box(x, shelfY + 4, 5, 13);
        p.ink(darker(colour)).dot(x, shelfY + 4).dot(x + 4, shelfY + 4);
      }
    }

    // A sign nobody has updated in a decade.
    p.ink(C.maroon).box(232, 30, 76, 26);
    p.ink(C.yellow).outline(232, 30, 76, 26);
    p.ink(C.white).box(238, 36, 64, 4).box(238, 44, 48, 4);

    // Chill cabinet on the right.
    p.ink(C.teal).box(236, 60, 74, 60);
    p.ink(C.white).outline(236, 60, 74, 60);
    p.ink(C.cyan).box(240, 64, 66, 52);
    p.ink(C.white).line(273, 64, 273, 115);
    p.ink(C.navy);
    for (let y = 68; y < 112; y += 12)
      for (let x = 244; x < 304; x += 10) p.box(x, y, 6, 9);

    // The counter, the till, and the magazine rack beside it.
    p.ink(C.brown).box(0, 96, 130, 12);
    p.ink(C.yellow).line(0, 96, 129, 96);
    p.ink(C.brown).box(0, 108, 130, 20);
    p.ink(C.black).line(0, 128, 129, 128);
    p.ink(C.slate).box(84, 82, 34, 14);
    p.ink(C.black).box(88, 85, 26, 5);
    p.ink(C.grey).box(90, 92, 4, 3).box(96, 92, 4, 3).box(102, 92, 4, 3);

    p.ink(C.slate).box(140, 86, 62, 40);
    p.ink(C.black).outline(140, 86, 62, 40);
    for (let r = 0; r < 3; r++) {
      p.ink([C.pink, C.yellow, C.cyan][r]).box(144, 90 + r * 13, 54, 10);
      p.ink(C.black).line(144, 90 + r * 13, 197, 90 + r * 13);
      p.ink(C.white).box(146, 93 + r * 13, 20, 4);
    }

    // Floor.
    p.ink(C.white).box(0, 122, p.width, p.height - 122);
    p.ink(C.grey);
    for (let x = 0; x < p.width; x += 22) p.line(x, 122, x, p.height - 1);
    for (let y = 128; y < p.height; y += 12) p.line(0, y, p.width - 1, y);
    p.ink(C.slate).line(0, 122, p.width - 1, 122);

    // Door out to the street.
    p.ink(C.cyan).box(286, 122, 34, 46);
    p.ink(C.slate).outline(286, 122, 34, 46);

    p.depthRamp(122, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 122);
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
    { noun: 'counter', synonyms: ['till', 'register'], look: 'A worn counter with a till and a jar of something pickled.' },
    { noun: 'cabinet', synonyms: ['chill cabinet', 'fridge', 'cooler'], look: 'A cold cabinet full of things in cans.' },
    { noun: 'shelves', synonyms: ['bottles', 'liquor', 'stock'], look: 'Every bottle this town has a use for, and several it does not.' },
  ],

  exits: [{ x: 292, y: 128, w: 28, h: 40, to: RoomId.OutsideStore }],

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
        'You buy the cheapest bottle of red in the shop, which is a competitive ' +
          'category.',
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
