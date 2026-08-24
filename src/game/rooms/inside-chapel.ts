import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Inside the chapel: six pews, a minister, and an organ playing itself. */
export const insideChapelScene = () =>
  paint((p) => {
    p.ink(C.brown).box(0, 0, p.width, 122);
    p.ink(darker(C.brown)).box(0, 0, p.width, 8);
    p.ink(C.yellow).line(0, 8, p.width - 1, 8);

    // Arched window behind the altar, lit from outside.
    p.ink(C.navy).solid([132, 70, 132, 34, 148, 18, 172, 18, 188, 34, 188, 70]);
    p.ink(C.cyan).solid([138, 66, 138, 38, 150, 24, 170, 24, 182, 38, 182, 66]);
    p.ink(C.pink).solid([148, 60, 148, 42, 160, 32, 172, 42, 172, 60]);
    p.ink(C.yellow).box(158, 44, 4, 16).box(152, 50, 16, 4);
    p.ink(C.slate).line(132, 44, 187, 44).line(160, 18, 160, 70);

    // Altar with two candlesticks and a very large book.
    p.ink(C.white).box(126, 84, 68, 24);
    p.ink(C.grey).outline(126, 84, 68, 24);
    p.ink(C.pink).box(126, 84, 68, 4);
    p.ink(C.yellow).box(134, 74, 4, 10).box(182, 74, 4, 10);
    p.ink(C.white).dot(136, 72).dot(184, 72);
    p.ink(C.red).box(148, 78, 24, 6);
    p.ink(C.white).line(149, 81, 171, 81);

    // Organ, stage left, with pipes.
    p.ink(darker(C.brown)).box(14, 56, 62, 52);
    p.ink(C.brown).outline(14, 56, 62, 52);
    p.ink(C.yellow);
    for (let i = 0; i < 9; i++) p.box(18 + i * 7, 30 + (i % 3) * 6, 5, 26 - (i % 3) * 6);
    p.ink(C.white).box(20, 84, 50, 6);
    p.ink(C.black);
    for (let x = 22; x < 68; x += 6) p.box(x, 84, 2, 4);

    // Pews.
    for (let r = 0; r < 3; r++) {
      const y = 118 + r * 18;
      const inset = 30 - r * 10;
      p.ink(C.brown).box(inset, y, 120 - inset, 6).box(200 + inset - 30, y, 120 - inset, 6);
      p.ink(darker(C.brown)).line(inset, y + 5, 119, y + 5);
      p.ink(darker(C.brown)).line(170 + inset, y + 5, 289 + inset - 30, y + 5);
    }

    // Aisle carpet.
    p.ink(C.maroon).box(126, 108, 68, p.height - 108);
    p.ink(C.red).line(126, 108, 126, p.height - 1).line(193, 108, 193, p.height - 1);
    p.ink(C.brown).box(0, 108, 126, 14).box(194, 108, 126, 14);
    p.ink(darker(C.brown)).line(0, 122, p.width - 1, 122);

    p.depthRamp(108, p.height, 5, 14);
    p.blockRect(0, 0, p.width, 110);
    p.blockRect(0, 110, 126, 58);
    p.blockRect(194, 110, 126, 58);
  });

const MINISTER = new Actor({
  id: 'minister',
  x: 160,
  y: 84,
  facing: 'front',
  depth: 4,
  style: {
    hair: C.grey,
    hairStyle: 'short',
    skin: C.pink,
    top: C.black,
    shirt: C.white,
    bottom: C.black,
    shoes: C.black,
    build: 4,
    height: 29,
  },
});

export const insideChapel: RoomDef = {
  id: RoomId.InsideChapel,
  title: 'The Chapel',
  scene: insideChapelScene,

  entries: {
    default: { x: 160, y: 162, facing: 'back' },
    [RoomId.OutsideChapel]: { x: 160, y: 158, facing: 'back' },
  },

  describe:
    'Six pews, an organ playing something on a loop, a window with a light ' +
    'behind it, and a minister at the altar in a suit that has done this ' +
    'several thousand times.',

  populate: (g) => {
    const cast = [MINISTER];
    if (g.flag('fawnReady') && !g.flag('married')) {
      cast.push(
        new Actor({
          id: 'fawn',
          x: 200,
          y: 128,
          facing: 'left',
          depth: 11,
          style: {
            hair: C.yellow,
            hairStyle: 'bouffant',
            skin: C.pink,
            top: C.white,
            bottom: C.white,
            legwear: 'skirt',
            shoes: C.white,
            build: 3,
            height: 29,
          },
        }),
      );
    }
    return cast;
  },

  hotspots: [
    { noun: 'minister', synonyms: ['priest', 'preacher', 'reverend', 'him'], look: 'He has married four thousand couples at this altar and can do the whole thing in ninety seconds.' },
    { noun: 'organ', synonyms: ['pipes', 'organ pipes'], look: 'It is playing by itself, which is either automation or the single most committed organist in the state.' },
    { noun: 'altar', synonyms: ['table', 'book'], look: 'A white altar, two candles, and a book open at a page it is always open at.' },
    { noun: 'pews', synonyms: ['pew', 'benches', 'seats'], look: 'Six pews. Nobody has ever filled them and nobody ever will.' },
    { noun: 'window', synonyms: ['stained glass', 'glass'], look: 'A stained-glass window depicting, on close inspection, two rings and a slot machine.' },
  ],

  exits: [{ x: 126, y: 164, w: 68, h: 4, to: RoomId.OutsideChapel }],

  onEnter(g) {
    if (g.flag('fawnReady') && !g.flag('married') && !g.flag('atAltar')) {
      g.set('atAltar');
      g.say(
        'Fawn is already at the altar, talking to the minister as though she ' +
          'has met him before.',
        'She turns as you come in and holds out a hand.',
      );
    }
  },

  onCommand(g, cmd) {
    if (cmd.verb === 'marry' || cmd.is('talk', 'minister')) {
      if (g.flag('married')) {
        g.say('You are already married. It has been an eventful few minutes.');
        return true;
      }
      if (!g.flag('fawnReady')) {
        if (cmd.verb === 'marry') {
          g.say(
            'The minister looks past you, at the empty chapel, and back at you.',
            '"On your own?" he says. "That is a different service entirely."',
          );
        } else {
          g.say('"Ceremony?" he says hopefully. "Bring somebody."');
        }
        return true;
      }
      g.set('married');
      g.award(12, 'married-fawn');
      g.cue('victory');
      g.say(
        'The minister asks if you take this woman. You say you do, in a voice ' +
          'that goes somewhere unexpected halfway through.',
        'He asks Fawn the same question. She looks at you for a long moment ' +
          'and says, "I do," and something in your chest performs a manoeuvre ' +
          'it has not attempted since school.',
        'The organ swells. It has been building to this all night.',
        'Ninety seconds later you are married, and being shown, with great ' +
          'efficiency, towards a lift.',
      );
      g.goTo(RoomId.HoneymoonSuite);
      return true;
    }

    if (cmd.is('talk', 'fawn') || cmd.is('kiss', 'fawn')) {
      g.say(
        g.flag('married')
          ? 'She is already gone. You will find out where shortly.'
          : '"Ask him," she says, nodding at the minister. "That is what he is for."',
      );
      return true;
    }

    return false;
  },
};
