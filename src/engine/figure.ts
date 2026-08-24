import { Painter } from './scene.js';
import { C, darker } from './palette.js';

export type Facing = 'right' | 'left' | 'front' | 'back';
export type HairStyle = 'short' | 'long' | 'bouffant' | 'bald' | 'cap' | 'beehive';
export type Legwear = 'trousers' | 'skirt' | 'bare';

/**
 * Appearance of one character. Every person in the game is this same rig with
 * different colours and a couple of shape switches, which keeps the cast cheap
 * to draw and consistent in proportion.
 */
export interface FigureStyle {
  readonly hair: number;
  readonly hairStyle?: HairStyle;
  readonly skin?: number;
  /** Jacket or blouse. */
  readonly top: number;
  /** Collar or shirt showing at the neck; omit for a closed top. */
  readonly shirt?: number;
  /** Tie, necklace or trim. */
  readonly accent?: number;
  readonly bottom: number;
  readonly legwear?: Legwear;
  readonly shoes?: number;
  /** Total height in pixels, feet to crown. */
  readonly height?: number;
  /** Half-width of the shoulders when facing the camera. */
  readonly build?: number;
}

/** Nominal cel box for a default-height figure. */
export const FIGURE_W = 17;
export const FIGURE_H = 38;

/** Number of animation phases in a walk cycle. */
export const WALK_PHASES = 4;

/** Forward foot offset per walk phase; the rear foot mirrors it. */
const STRIDE = [0, 2, 0, -2];
/** Arm swing per walk phase, opposing the legs. */
const SWING = [0, -1, 0, 1];

/**
 * Draw a character with their feet at (`footX`, `footY`).
 *
 * `phase` selects a frame of the walk cycle; pass 0 for a standing pose.
 */
export function drawFigure(
  p: Painter,
  style: FigureStyle,
  facing: Facing,
  phase: number,
  footX: number,
  footY: number,
): void {
  const h = style.height ?? FIGURE_H;
  const skin = style.skin ?? C.pink;
  const shoes = style.shoes ?? C.black;
  const hairStyle = style.hairStyle ?? 'short';
  const legwear = style.legwear ?? 'trousers';
  const side = facing === 'right' || facing === 'left';
  const dir = facing === 'left' ? -1 : 1;
  const ph = ((phase % WALK_PHASES) + WALK_PHASES) % WALK_PHASES;
  const stride = STRIDE[ph];
  const swing = SWING[ph];

  // Vertical landmarks as fractions of the default 30px figure.
  const at = (row: number) => footY - h + 1 + Math.round((row * h) / FIGURE_H);
  const crown = at(0);
  const browLine = at(2);
  const chin = at(8);
  const shoulder = at(9);
  const belt = at(19);
  const ankle = at(27);

  // A side view is much narrower than a front view.
  const shoulderHalf = side ? 2 : (style.build ?? 4);
  const headHalf = side ? 2 : 3;
  const hipHalf = side ? 2 : Math.max(2, shoulderHalf - 1);
  const cx = footX;

  const topShade = darker(style.top);
  const bottomShade = darker(style.bottom);

  p.saved((q) => {
    // ---- legs -------------------------------------------------------------
    const legW = side ? 3 : 2;
    const legTop = legwear === 'skirt' ? at(24) : belt;
    if (legwear === 'skirt') {
      q.ink(style.bottom).solid([
        cx - hipHalf,
        belt - 1,
        cx + hipHalf,
        belt - 1,
        cx + hipHalf + 2,
        at(24),
        cx - hipHalf - 2,
        at(24),
      ]);
      q.ink(bottomShade).line(cx - hipHalf - 2, at(24), cx + hipHalf + 2, at(24));
    }
    const legInk = legwear === 'skirt' || legwear === 'bare' ? skin : style.bottom;
    const legShade = legwear === 'skirt' || legwear === 'bare' ? darker(skin) : bottomShade;

    if (side) {
      // Two legs at the same x, separated by the stride.
      q.ink(legShade).box(cx - 1 - stride, legTop, legW, ankle - legTop);
      q.ink(legInk).box(cx - 1 + stride, legTop, legW, ankle - legTop);
      q.ink(darker(shoes)).box(cx - 2 - stride, ankle, legW + 2, footY - ankle + 1);
      q.ink(shoes).box(cx - 2 + stride + dir, ankle, legW + 2, footY - ankle + 1);
    } else {
      q.ink(legInk);
      q.box(cx - hipHalf, legTop, legW, ankle - legTop);
      q.box(cx + hipHalf - legW, legTop, legW, ankle - legTop);
      // A shaded gap keeps the legs readable even on a same-colour torso.
      q.ink(legShade).box(cx - 1, legTop, 2, ankle - legTop);
      q.ink(shoes);
      q.box(cx - hipHalf - 1, ankle, legW + 2, footY - ankle + 1);
      q.box(cx + hipHalf - legW - 1, ankle, legW + 2, footY - ankle + 1);
    }

    // ---- torso ------------------------------------------------------------
    q.ink(style.top).solid([
      cx - shoulderHalf,
      shoulder,
      cx + shoulderHalf,
      shoulder,
      cx + hipHalf,
      belt,
      cx - hipHalf,
      belt,
    ]);
    // Belt line separates the torso from the legs.
    q.ink(topShade).line(cx - hipHalf, belt - 1, cx + hipHalf - 1, belt - 1);

    if (style.shirt !== undefined && facing !== 'back') {
      q.ink(style.shirt);
      if (side) {
        q.box(cx + dir, shoulder, 2, at(15) - shoulder);
      } else {
        // An open-collar V down the chest.
        q.solid([cx - 2, shoulder, cx + 2, shoulder, cx, at(15)]);
      }
    }
    if (style.accent !== undefined && facing !== 'back') {
      q.ink(style.accent);
      const tx = side ? cx + dir : cx;
      q.box(tx, shoulder + 1, 1, at(16) - shoulder);
    }

    // ---- arms -------------------------------------------------------------
    q.ink(style.top);
    const armTop = shoulder + 1;
    const armLen = at(18) - armTop;
    if (side) {
      q.box(cx + dir * shoulderHalf - (dir < 0 ? 1 : 0), armTop + swing, 2, armLen);
      q.ink(skin).box(cx + dir * shoulderHalf - (dir < 0 ? 1 : 0), armTop + armLen + swing, 2, 2);
    } else {
      q.box(cx - shoulderHalf - 2, armTop, 2, armLen + swing);
      q.box(cx + shoulderHalf, armTop, 2, armLen - swing);
      q.ink(skin);
      q.box(cx - shoulderHalf - 2, armTop + armLen + swing, 2, 2);
      q.box(cx + shoulderHalf, armTop + armLen - swing, 2, 2);
    }

    // ---- head and neck ----------------------------------------------------
    q.ink(skin);
    q.box(cx - 1, chin, 2, shoulder - chin + 1);
    q.solid([
      cx - headHalf,
      browLine,
      cx + headHalf,
      browLine,
      cx + headHalf,
      chin,
      cx - headHalf,
      chin,
    ]);

    if (facing === 'front') {
      q.ink(C.black).dot(cx - 2, at(4)).dot(cx + 1, at(4));
      q.ink(darker(skin)).dot(cx, at(6));
    } else if (side) {
      q.ink(C.black).dot(cx + dir, at(4));
      // A nose, which is what actually sells a profile at this size.
      q.ink(skin).dot(cx + dir * (headHalf + 1), at(5));
    }

    // ---- hair -------------------------------------------------------------
    if (hairStyle !== 'bald') {
      q.ink(style.hair);
      if (facing === 'back') {
        q.box(cx - headHalf, crown, headHalf * 2 + 1, chin - crown);
      } else {
        q.box(cx - headHalf, crown, headHalf * 2 + 1, browLine - crown + 1);
      }
      switch (hairStyle) {
        case 'bouffant':
          q.box(cx - headHalf - 1, crown - 2, headHalf * 2 + 3, browLine - crown + 3);
          break;
        case 'beehive':
          q.solid([
            cx - headHalf,
            crown,
            cx + headHalf,
            crown,
            cx + headHalf - 1,
            crown - 5,
            cx - headHalf + 1,
            crown - 5,
          ]);
          break;
        case 'long':
          q.box(cx - headHalf - 1, crown, 2, chin - crown + 3);
          q.box(cx + headHalf, crown, 2, chin - crown + 3);
          break;
        case 'cap':
          q.box(cx - headHalf - 1, crown + 1, headHalf * 2 + 3, 2);
          break;
        default:
          break;
      }
    }
  });
}
