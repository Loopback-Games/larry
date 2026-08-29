import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the floor meets the back of the room. */
const FLOOR = 130;

const DOORS: readonly Doorway[] = [
  { to: RoomId.OutsideBar, label: 'Back east', side: 'right', y: 150, w: 34 },
];

/**
 * The wrong way. Walking west out of Lefty's leads here, and here is where the
 * game explains that some directions are not for you.
 */
export const darkStreetScene = () =>
  paint((p) => {
    // ---- night -------------------------------------------------------------
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.gradient(0, 0, p.width, 60, C.black, C.navyDeep, 0, 0.9);
    p.ink(C.steel).stars(0, 0, p.width, 40, 34, 0x51e712);

    // ---- shuttered frontages ----------------------------------------------
    // Three units, each a little darker than the last as the street runs west
    // into nothing. Structure, so the dark reads as a place and not a void.
    for (let i = 0; i < 4; i++) {
      const x = 96 + i * 58;
      p.slab(x, 44 + i * 2, 56, FLOOR - 44, C.asphalt, 1);
      p.relight(x, 44, 56, FLOOR - 44, -i * 0.5);
      // Roller shutter.
      p.ink(C.asphaltDeep);
      for (let y = 62 + i * 2; y < FLOOR - 6; y += 5) p.line(x + 4, y, x + 51, y);
      p.slab(x + 3, 56 + i * 2, 50, 5, C.maroonDeep, 1);
      p.ink(C.concrete).box(x, 44 + i * 2, 56, 2);
    }
    // The last one fades out entirely; the street simply stops being lit.
    p.relight(250, 0, 70, p.height, -2);

    // ---- the one streetlight ------------------------------------------------
    p.ink(C.asphalt).box(46, 22, 5, 46);
    p.ink(C.pewter).box(44, 20, 9, 3);
    p.ink(C.concrete).path([48, 22, 60, 14, 74, 16]);
    p.ink(C.gold).solid([66, 18, 84, 18, 80, 28, 70, 28]);
    p.ink(C.yellowPale).box(69, 26, 12, 2);
    p.glow(75, 26, 30, C.brass, 0.5);

    // Its cone, thrown down the wall and across the pavement.
    p.ink(C.bronze);
    for (let y = 30; y < FLOOR + 26; y += 2) {
      const t = (y - 30) / (FLOOR + 26 - 30);
      const half = 8 + t * 52;
      for (let x = Math.round(75 - half); x < 75 + half; x += 3) {
        if (((x + y) & 3) === 0) p.dot(x, y);
      }
    }

    // ---- pavement and road --------------------------------------------------
    p.ink(C.asphalt).box(0, FLOOR, p.width, 20);
    p.sweep(0, FLOOR, p.width, 20, -1, 0);
    p.ink(C.concrete).box(0, FLOOR, p.width, 1);
    p.ink(C.asphaltDeep).box(0, 150, p.width, p.height - 150);
    p.lightPool(75, 148, 70, 26, 1);
    p.contact(0, FLOOR, p.width, 10, -2);

    // Something small and red, watching, at the edge of the light.
    p.ink(C.redLit).dots([148, 156, 152, 156]);

    doorways(p, DOORS);
    p.depthRamp(130, p.height, 5, 14);
    doorways(p, DOORS);
    walls(p, FLOOR, DOORS);
  });

export const darkStreet: RoomDef = {
  id: RoomId.DarkStreet,
  title: 'A Dark Street',
  scene: darkStreetScene,

  horizon: 130,
  scaleAtHorizon: 0.66,

  entries: { default: { x: 280, y: 152, facing: 'left' } },

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
