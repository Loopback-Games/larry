import { paint } from '../../engine/scene.js';
import { C } from '../../engine/palette.js';
import { WALK_BLOCKED } from '../../constants.js';

/**
 * Outside Lefty's — where the game starts. A dead-end block at 2am: one lit
 * doorway, a hotel sign down the street, and nothing else open.
 */
export const outsideBarScene = () =>
  paint((p) => {
    // Night sky over a distant skyline.
    p.ink(C.black).box(0, 0, p.width, p.height);
    p.ink(C.white).stars(0, 0, p.width, 52, 55, 0x1e5127);
    p.ink(C.slate).dots([18, 12, 19, 11, 20, 12, 19, 13]); // a wan moon
    p.skyline(72, 18, 46, C.navy, C.yellow, 0xbadc0de);

    // The bar itself: a squat brick box pushed up against the pavement.
    p.ink(C.grey).box(24, 40, 108, 78);
    p.ink(C.slate).line(24, 40, 131, 40).line(24, 41, 131, 41);
    p.bricks(24, 92, 108, 26, C.maroon, 5, 11);

    // Neon over the door.
    p.ink(C.maroon).box(52, 48, 52, 14);
    p.ink(C.red).outline(52, 48, 52, 14);
    p.ink(C.pink).outline(53, 49, 50, 12);

    // Upper-storey windows, a couple still lit.
    for (const [wx, glass] of [
      [32, C.navy],
      [58, C.yellow],
      [84, C.navy],
      [110, C.yellow],
    ] as const) {
      p.window(wx, 68, 16, 16, glass, C.slate);
    }

    // Doorway, recessed and lit from inside.
    p.ink(C.black).box(70, 92, 20, 26);
    p.ink(C.brown).outline(69, 91, 22, 27);
    p.ink(C.yellow).box(72, 96, 16, 8);
    p.ink(C.brown).box(72, 106, 16, 12);
    p.ink(C.yellow).dot(86, 112); // doorknob

    // Ground-floor windows, painted over from the inside.
    p.window(32, 96, 22, 14, C.teal, C.slate, false);
    p.window(102, 96, 22, 14, C.teal, C.slate, false);

    // Pavement and road.
    p.ink(C.slate).box(0, 118, p.width, 14);
    p.ink(C.grey).line(0, 118, p.width - 1, 118);
    p.ink(C.black).box(0, 132, p.width, p.height - 132);
    p.ink(C.slate).line(0, 132, p.width - 1, 132);
    p.ink(C.yellow);
    for (let x = 4; x < p.width; x += 22) p.box(x, 150, 10, 2);

    // A kerbside pole with a flyer stapled to it.
    p.ink(C.brown).box(140, 78, 3, 44);
    p.ink(C.white).box(137, 88, 9, 7);
    p.ink(C.slate).line(138, 90, 144, 90).line(138, 92, 143, 92);

    // Depth: everything below the building front reads as floor.
    p.depthRamp(118, p.height, 5, 14);

    // Movement: the building, the kerb line and the pole are solid.
    p.blockRect(0, 0, p.width, 118);
    p.saved((q) => q.noInk().noDepth().walk(WALK_BLOCKED).box(139, 110, 6, 12));
  });
