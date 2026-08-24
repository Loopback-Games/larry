import { paint } from '../../engine/scene.js';
import { C } from '../../engine/palette.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** How many commands the night lasts. Generous, but not unlimited. */
export const NIGHT_LENGTH = 600;

/** Dawn over the strip, and the end of your chances. */
export const sunriseScene = () =>
  paint((p) => {
    p.gradient(0, 0, p.width, 70, C.navy, C.purple);
    p.gradient(0, 60, p.width, 34, C.purple, C.red);
    p.gradient(0, 90, p.width, 24, C.red, C.yellow);
    p.ink(C.yellow).box(0, 110, p.width, 8);

    // The sun, just clear of the skyline.
    p.ink(C.yellow).solid([
      130, 112, 190, 112, 196, 100, 188, 88, 172, 80, 148, 80, 132, 88, 124, 100,
    ]);
    p.ink(C.white).solid([146, 108, 174, 108, 176, 98, 168, 92, 152, 92, 144, 98]);

    // The city, black against it.
    p.skyline(118, 22, 54, C.black, C.maroon, 0x50fa7b);
    p.ink(C.black).box(0, 118, p.width, p.height - 118);
    p.ink(C.maroon).line(0, 118, p.width - 1, 118);
    p.ink(C.slate).box(0, 140, p.width, 3);
    p.ink(C.brown);
    for (let x = 8; x < p.width; x += 40) p.box(x, 150, 18, 3);

    p.blockRect(0, 0, p.width, 168);
  });

export const sunrise: RoomDef = {
  id: RoomId.Sunrise,
  title: 'Sunrise',
  cutscene: true,
  scene: sunriseScene,

  entries: { default: { x: 160, y: 166, facing: 'front' } },

  describe: 'The sun comes up over Lost Wages, and it is not on your side.',

  hotspots: [{ noun: 'sun', synonyms: ['sunrise', 'dawn', 'sky'], look: 'It is coming up whether you are ready or not.' }],

  onEnter(g) {
    g.die(
      'The sky over the strip goes from black to purple to a colour you have ' +
        'no name for, and then the sun comes up over the casino.',
      'All the neon in Lost Wages switches off at once, and without it the ' +
        'whole town looks like what it is: a few streets of concrete in a desert.',
      'You are standing in the open in a white polyester suit at six in the ' +
        'morning, alone, with a wristwatch and some pocket lint.',
      'There is a bus at seven. Your mother will want to know how it went.',
      '',
      `*** The night is over. You scored ${g.score} of 222. ***`,
    );
  },
};
