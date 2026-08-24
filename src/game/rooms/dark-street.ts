import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The wrong way. Walking west out of Lefty's leads here, and here is where the
 * game explains that some directions are not for you.
 */
export const darkStreetScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 40, 30, 0x0dd51e);
    p.skyline(96, 30, 66, C.black, C.navy, 0x77aa11);

    // A single streetlight failing to light anything.
    p.ink(C.slate).box(58, 40, 5, 92);
    p.ink(C.grey).path([58, 40, 62, 32, 82, 30]);
    p.ink(C.yellow).solid([76, 30, 92, 30, 88, 40, 80, 40]);
    // A weak cone of light that reaches the pavement and stops.
    p.ink(darker(C.yellow)).solid([66, 40, 96, 40, 118, 130, 44, 130]);
    p.ink(C.brown).solid([72, 40, 90, 40, 104, 130, 58, 130]);

    // Shuttered frontages that have not opened in years.
    for (const sx of [140, 210, 276]) {
      p.ink(C.slate).box(sx, 54, 56, 76);
      p.ink(C.black).outline(sx, 54, 56, 76);
      p.ink(darker(C.slate));
      for (let y = 58; y < 128; y += 5) p.line(sx + 2, y, sx + 53, y);
      p.ink(C.maroon).box(sx + 8, 44, 40, 10);
    }

    // Road and pavement.
    p.ink(darker(C.slate)).box(0, 130, p.width, 14);
    p.ink(C.slate).line(0, 130, p.width - 1, 130);
    p.ink(C.black).box(0, 144, p.width, p.height - 144);
    p.ink(darker(C.slate)).line(0, 144, p.width - 1, 144);

    // Two points of light that are not streetlights.
    p.ink(C.red).dot(240, 150).dot(248, 150);

    p.depthRamp(130, p.height, 5, 14);
    p.blockRect(0, 0, p.width, 130);
  });

export const darkStreet: RoomDef = {
  id: RoomId.DarkStreet,
  title: 'A Dark Street',
  scene: darkStreetScene,

  entries: { default: { x: 290, y: 150, facing: 'left' } },

  describe:
    'The street runs on into a dark that the streetlight is not even trying to ' +
    'reach. Every frontage is shuttered. Nothing down here is open, and ' +
    'something down here is awake.',

  hotspots: [
    { noun: 'shutters', synonyms: ['shops', 'shopfronts', 'frontages'], look: 'Steel shutters, rusted at the bottom, all of them closed for good.' },
    { noun: 'streetlight', synonyms: ['lamp', 'light', 'lamppost'], look: 'It buzzes and casts a cone of light about three feet wide.' },
    { noun: 'dark', synonyms: ['darkness', 'shadows'], look: 'Two small red points at about head height. They move when you move.' },
  ],

  exits: [{ x: 296, y: 132, w: 24, h: 34, to: RoomId.OutsideBar }],

  onEnter(g) {
    if (!g.flag('warnedDarkStreet')) {
      g.set('warnedDarkStreet');
      g.say(
        'Every instinct you have, and you have very few, tells you this is the ' +
          'wrong direction.',
        'Behind you, the neon of the bar is still visible. Ahead there is only ' +
          'the dark, and something in it that has noticed you.',
      );
    }
  },

  onTick(g) {
    // Loitering here is fatal; the way back is a short walk east.
    if (g.ego.x > 200) {
      g.setCounter('darkStreetDwell', 0);
      return;
    }
    const dwell = g.bump('darkStreetDwell');
    if (dwell === 14) {
      g.say('Something moves in the dark ahead. It is not in a hurry, which is worse.');
    }
    if (dwell >= 26) {
      g.setCounter('darkStreetDwell', 0);
      g.die(
        'A hand closes on your shoulder, and a second one takes your wallet ' +
          'with the ease of long practice.',
        'You are relieved of your money, your watch, your dignity and, after a ' +
          'brief negotiation, your consciousness.',
        '*** You have been mugged to death ***',
      );
    }
  },
};
