import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** The penthouse bedroom, and the wardrobe with something folded in the bottom. */
export const penthouseBedroomScene = () =>
  paint((p) => {
    p.ink(C.navy).box(0, 0, p.width, 120);
    p.ink(darker(C.navy)).box(0, 0, p.width, 8);
    p.ink(C.blue);
    for (let x = 6; x < p.width; x += 24) p.line(x, 8, x, 119);

    // A window with the city in it, curtains half drawn.
    p.ink(C.black).box(214, 20, 78, 62);
    p.ink(C.navy).box(218, 24, 70, 54);
    p.ink(C.white).stars(218, 24, 70, 34, 18, 0x9911aa);
    p.ink(C.yellow).dots([226, 62, 240, 66, 258, 60, 276, 68, 248, 72]);
    p.ink(C.purple).box(206, 16, 14, 72).box(286, 16, 14, 72);
    p.ink(darker(C.purple)).line(212, 16, 212, 87).line(292, 16, 292, 87);

    // A very large bed.
    p.ink(C.slate).box(90, 40, 108, 40);
    p.ink(C.grey).outline(90, 40, 108, 40);
    p.ink(C.purple).solid([76, 80, 212, 80, 224, 122, 64, 122]);
    p.ink(darker(C.purple)).line(64, 122, 223, 122);
    p.ink(C.white).solid([98, 74, 138, 74, 140, 86, 96, 86]);
    p.ink(C.white).solid([152, 74, 192, 74, 194, 86, 150, 86]);

    // Wardrobe, doors open, with something on the floor of it.
    p.ink(C.brown).box(6, 18, 74, 102);
    p.ink(darker(C.brown)).outline(6, 18, 74, 102);
    p.ink(C.black).box(12, 24, 62, 90);
    p.ink(C.slate).line(14, 34, 72, 34);
    for (const hx of [22, 34, 46, 58]) {
      p.ink(C.grey).line(hx, 34, hx, 40);
      p.ink([C.white, C.red, C.cyan, C.yellow][(hx / 12) % 4 | 0]).box(hx - 6, 40, 12, 40);
    }
    p.ink(C.pink).box(18, 96, 50, 16);
    p.ink(darker(C.pink)).line(18, 96, 67, 96);

    // Floor.
    p.ink(C.purple).box(0, 120, p.width, p.height - 120);
    p.ink(darker(C.purple));
    for (let y = 124; y < p.height; y += 6) p.line(0, y, p.width - 1, y);
    p.ink(C.blue).line(0, 120, p.width - 1, 120);

    // Door back to the lounge.
    p.ink(C.brown).box(296, 92, 24, 28);

    p.depthRamp(120, p.height, 6, 14);
    p.blockRect(0, 0, p.width, 120);
    p.blockRect(60, 118, 168, 12);
  });

export const penthouseBedroom: RoomDef = {
  id: RoomId.PenthouseBedroom,
  title: 'The Penthouse Bedroom',
  scene: penthouseBedroomScene,

  entries: {
    default: { x: 260, y: 148, facing: 'left' },
    [RoomId.PenthouseLounge]: { x: 296, y: 148, facing: 'left' },
  },

  describe:
    'A bedroom the size of your mother\'s house, with a bed you could land an ' +
    'aircraft on and a wardrobe standing open. Whoever lives here owns a great ' +
    'many clothes and, folded on the floor of the wardrobe, one item that is ' +
    'not clothes.',

  hotspots: [
    { noun: 'bed', synonyms: ['large bed'], look: 'It is enormous, and made, and has clearly not been slept in tonight.' },
    { noun: 'wardrobe', synonyms: ['closet', 'cupboard'], look: 'A wardrobe of expensive clothes, and something pink folded flat at the bottom of it.' },
    { noun: 'window', synonyms: ['curtains', 'curtain'], look: 'Purple curtains, half drawn, and the city going about its business a long way below.' },
    { noun: 'clothes', synonyms: ['dresses', 'suits'], look: 'Not your size, not your colour, not your price bracket.' },
  ],

  exits: [{ x: 296, y: 120, w: 24, h: 20, to: RoomId.PenthouseLounge }],

  onCommand(g, cmd) {
    if (cmd.is('get', ItemId.Doll) || (cmd.verb === 'look in' && cmd.object === 'wardrobe')) {
      if (g.has(ItemId.Doll)) {
        g.say('You have the doll. You are carrying a deflated inflatable woman around a penthouse.');
        return true;
      }
      g.give(ItemId.Doll);
      g.award(5, 'got-doll');
      g.cue('score');
      g.say(
        'You crouch down and unfold the pink thing at the bottom of the wardrobe.',
        'It is an inflatable doll, deflated, folded with more care than you ' +
          'would have expected.',
        'You do not know why you are taking it. You take it.',
      );
      return true;
    }

    if (cmd.verb === 'inflate' && (cmd.object === null || cmd.mentions(ItemId.Doll))) {
      if (!g.has(ItemId.Doll)) {
        g.say('You have nothing to inflate.');
        return true;
      }
      if (g.flag('dollInflated')) {
        g.say('She is fully inflated. Any more and she will go off.');
        return true;
      }
      g.set('dollInflated');
      g.award(5, 'inflated-doll');
      g.cue('score');
      g.say(
        'You sit on the end of a stranger\'s enormous bed at five in the ' +
          'morning and blow up an inflatable doll.',
        'It takes nine minutes and most of what you have left. At the end of ' +
          'it you are light-headed, and she is smiling in a way that suggests ' +
          'she has seen worse evenings than this.',
      );
      return true;
    }

    return false;
  },
};
