import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * Inside Lefty's. Dim, red, and emptier than it should be. The bar runs across
 * the middle of the room; a door at the back leads deeper into the building.
 */
export const insideBarScene = () =>
  paint((p) => {
    // ---- room shell -------------------------------------------------------
    p.ink(C.maroon).box(0, 0, p.width, 122);
    p.ink(C.black).box(0, 0, p.width, 12);
    p.ink(C.brown).line(0, 12, p.width - 1, 12);

    // Ceiling beams pulling back towards the bar.
    p.ink(C.black);
    p.line(0, 12, 44, 40).line(p.width - 1, 12, 276, 40);
    p.ink(C.maroon).line(0, 26, 60, 40).line(p.width - 1, 26, 260, 40);

    // Hanging lamps over the counter.
    for (const lx of [96, 160, 224]) {
      p.ink(C.black).line(lx, 12, lx, 26);
      p.ink(C.slate).solid([lx - 8, 32, lx + 8, 32, lx + 5, 26, lx - 5, 26]);
      p.ink(C.yellow).box(lx - 6, 32, 12, 2);
    }

    // ---- back bar ---------------------------------------------------------
    p.ink(C.brown).box(72, 40, 176, 44);
    p.ink(C.black).outline(72, 40, 176, 44);
    p.ink(C.slate).line(72, 56, 247, 56).line(72, 70, 247, 70);

    const bottles = [
      [78, C.lime], [88, C.yellow], [98, C.teal], [110, C.red], [120, C.white],
      [132, C.lime], [142, C.yellow], [154, C.teal], [166, C.red], [176, C.white],
      [188, C.lime], [198, C.yellow], [210, C.teal], [222, C.red], [234, C.white],
    ] as const;
    for (const [bx, colour] of bottles) {
      p.ink(colour).box(bx, 44, 4, 11);
      p.ink(darker(colour)).dot(bx, 44).dot(bx + 3, 44);
      p.ink(colour).box(bx, 59, 4, 10);
    }

    // Mirror and a dead beer sign.
    p.ink(C.slate).box(256, 44, 30, 34);
    p.ink(C.teal).outline(256, 44, 30, 34);
    p.ink(C.grey).line(259, 47, 283, 71);
    p.ink(C.navy).box(34, 42, 32, 20);
    p.ink(C.blue).outline(34, 42, 32, 20);
    p.ink(C.slate).line(38, 52, 62, 52);

    // ---- the counter ------------------------------------------------------
    p.ink(C.brown).box(32, 92, 256, 12);
    p.ink(C.yellow).line(32, 92, 287, 92);
    p.ink(C.black).line(32, 104, 287, 104);
    p.ink(C.brown).box(32, 104, 256, 14);
    p.ink(C.black).box(32, 118, 256, 4);
    p.ink(C.maroon);
    for (let x = 40; x < 288; x += 16) p.line(x, 106, x, 116);

    // The counter sits in front of anyone standing behind it.
    p.saved((q) => q.noInk().noWalk().depth(11).box(32, 92, 256, 30));

    // Beer taps and a bowl of something salted.
    p.ink(C.slate);
    for (const tx of [120, 128, 136]) p.box(tx, 84, 3, 8);
    p.ink(C.grey).box(116, 82, 26, 3);
    p.ink(C.white).solid([196, 92, 214, 92, 211, 86, 199, 86]);

    // ---- door to the back -------------------------------------------------
    p.ink(C.black).box(6, 58, 24, 62);
    p.ink(C.brown).outline(4, 56, 28, 64);
    p.ink(C.slate).line(8, 60, 8, 118);
    p.ink(C.yellow).dot(27, 90).dot(28, 90);

    // ---- floor ------------------------------------------------------------
    p.checkerFloor(122, p.height, 160, C.slate, C.black, 14, 6);

    // Stools go on after the floor, or the floor paints over them.
    for (const sx of [56, 96, 136, 176, 216, 256]) {
      p.ink(C.maroon).box(sx - 10, 122, 20, 4);
      p.ink(C.red).line(sx - 10, 122, sx + 9, 122);
      p.ink(C.black).line(sx - 10, 125, sx + 9, 125);
      p.ink(C.slate).box(sx - 2, 126, 4, 18);
      p.ink(C.black).box(sx - 8, 144, 16, 3);
    }

    p.depthRamp(122, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 122);
    // Leave a way through to the back door.
    p.saved((q) => q.noInk().noDepth().walk(0).box(4, 118, 30, 12));
  });

const BARTENDER = new Actor({
  id: 'bartender',
  x: 214,
  y: 104,
  facing: 'front',
  depth: 6,
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

  entries: {
    default: { x: 160, y: 152, facing: 'back' },
    [RoomId.OutsideBar]: { x: 160, y: 158, facing: 'back' },
    [RoomId.BarHallway]: { x: 30, y: 128, facing: 'right' },
  },

  describe:
    'Lefty\'s. Red walls, red light, and a smell of spilt beer that has soaked ' +
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

  exits: [
    { x: 128, y: 162, w: 64, h: 6, to: RoomId.OutsideBar },
    { x: 0, y: 118, w: 22, h: 16, to: RoomId.BarHallway },
  ],

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
