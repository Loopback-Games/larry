import { Surface, rect, frame as drawFrame, plot } from './raster.js';
import { glyphPixel, GLYPH_W, GLYPH_H } from './font.js';
import { C } from './palette.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import type { Frame } from './engine.js';

/** The composed display is a classic 320x200, 40x25 character screen. */
export const SCREEN_W = CANVAS_W;
export const SCREEN_H = 200;
export const TEXT_COLS = SCREEN_W / GLYPH_W;
export const TEXT_ROWS = SCREEN_H / GLYPH_H;

/** The scene occupies rows 1 to 21, leaving a status line and an input area. */
export const SCENE_TOP = GLYPH_H;
export const INPUT_TOP = SCENE_TOP + CANVAS_H;

export interface DisplayState {
  /** Text currently typed at the prompt. */
  readonly input: string;
  /** Whether to draw the blinking cursor this frame. */
  readonly cursorOn: boolean;
  /** Overrides the default prompt hint when the game is waiting for a key. */
  readonly prompt?: string;
}

/**
 * Compose one 320x200 screen: status line, scene, any open message window, and
 * the input line. Kept separate from the canvas so it can be unit tested and
 * rendered headlessly.
 */
export function compose(frame: Frame, state: DisplayState): Surface {
  const s = new Surface(SCREEN_W, SCREEN_H);
  s.clear(C.black);

  drawStatusLine(s, frame);
  blitScene(s, frame.surface);
  drawInputArea(s, frame, state);
  if (frame.message) drawMessageWindow(s, frame.message);

  return s;
}

function drawStatusLine(s: Surface, frame: Frame): void {
  rect(s, { colour: C.grey }, 0, 0, SCREEN_W, GLYPH_H);
  const left = ` ${frame.status}`;
  const right = `Score ${frame.score} of 222 `;
  text(s, left, 0, 0, C.black);
  text(s, right, TEXT_COLS - right.length, 0, C.black);
}

/** Copy the scene into the screen, below the status line. */
function blitScene(s: Surface, scene: Surface): void {
  const width = Math.min(scene.width, SCREEN_W);
  for (let y = 0; y < scene.height; y++) {
    const dy = SCENE_TOP + y;
    if (dy >= SCREEN_H) break;
    s.colour.set(scene.colour.subarray(y * scene.width, y * scene.width + width), dy * SCREEN_W);
  }
}

function drawInputArea(s: Surface, frame: Frame, state: DisplayState): void {
  rect(s, { colour: C.black }, 0, INPUT_TOP, SCREEN_W, SCREEN_H - INPUT_TOP);
  const row = Math.floor(INPUT_TOP / GLYPH_H);

  if (frame.gameOver) {
    const label =
      frame.gameOver === 'won'
        ? 'Press ENTER to play again.'
        : 'Press ENTER to restore, or R to restart.';
    text(s, label, 1, row + 1, C.yellow);
    return;
  }
  if (frame.awaitingDismiss) {
    text(s, state.prompt ?? 'Press ENTER to continue.', 1, row + 1, C.yellow);
    return;
  }

  const shown = state.input.slice(-(TEXT_COLS - 3));
  text(s, `>${shown}`, 0, row + 1, C.white);
  if (state.cursorOn) {
    const cx = (shown.length + 1) * GLYPH_W;
    rect(s, { colour: C.white }, cx, (row + 1) * GLYPH_H + 1, GLYPH_W - 2, GLYPH_H - 2);
  }
}

/** Draw a bordered window centred over the scene. */
function drawMessageWindow(s: Surface, lines: readonly string[]): void {
  const wrapped = wrap(lines, TEXT_COLS - 6);
  const w = Math.min(TEXT_COLS - 2, Math.max(20, ...wrapped.map((l) => l.length)) + 4);
  const h = wrapped.length + 2;
  const col = Math.floor((TEXT_COLS - w) / 2);
  const sceneRows = Math.floor(CANVAS_H / GLYPH_H);
  const row = Math.max(1, Math.floor((sceneRows - h) / 2) + 1);

  const px = col * GLYPH_W;
  const py = row * GLYPH_H;
  const pw = w * GLYPH_W;
  const ph = h * GLYPH_H;

  rect(s, { colour: C.white }, px, py, pw, ph);
  drawFrame(s, { colour: C.navy }, px + 1, py + 1, pw - 2, ph - 2);
  drawFrame(s, { colour: C.navy }, px + 2, py + 2, pw - 4, ph - 4);

  wrapped.forEach((line, i) => {
    text(s, line, col + 2, row + 1 + i, C.black);
  });
}

/** Greedy word wrap that preserves explicit line breaks. */
export function wrap(lines: readonly string[], width: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      out.push('');
      continue;
    }
    let current = '';
    for (const word of line.split(/\s+/)) {
      if (current.length === 0) {
        current = word;
      } else if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        out.push(current);
        current = word;
      }
    }
    if (current.length) out.push(current);
  }
  return out;
}

/** Draw a string at a character cell position. */
export function text(
  s: Surface,
  value: string,
  col: number,
  row: number,
  colour: number,
): void {
  for (let i = 0; i < value.length; i++) {
    const cx = (col + i) * GLYPH_W;
    if (cx >= s.width) break;
    const code = value.charCodeAt(i);
    for (let y = 0; y < GLYPH_H; y++) {
      for (let x = 0; x < GLYPH_W; x++) {
        if (glyphPixel(code, x, y)) plot(s, { colour }, cx + x, row * GLYPH_H + y);
      }
    }
  }
}
