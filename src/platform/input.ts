import { SCREEN_W, SCREEN_H, SCENE_TOP } from '../engine/display.js';
import { PIXEL_ASPECT, CANVAS_H } from '../constants.js';

export interface ScenePoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Map a pointer position on the canvas element to scene coordinates, undoing
 * the letterboxing and the 2x horizontal pixel doubling.
 *
 * Returns null when the pointer is outside the scene area (status line, input
 * row, or the letterbox bars).
 */
export function canvasToScene(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): ScenePoint | null {
  const box = canvas.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;

  const scale = Math.min(box.width / SCREEN_W, box.height / SCREEN_H);
  const drawnW = SCREEN_W * scale;
  const drawnH = SCREEN_H * scale;
  const originX = box.left + (box.width - drawnW) / 2;
  const originY = box.top + (box.height - drawnH) / 2;

  const screenX = (clientX - originX) / scale;
  const screenY = (clientY - originY) / scale;
  if (screenX < 0 || screenX >= SCREEN_W || screenY < 0 || screenY >= SCREEN_H) return null;

  const sceneY = screenY - SCENE_TOP;
  if (sceneY < 0 || sceneY >= CANVAS_H) return null;

  return { x: Math.floor(screenX / PIXEL_ASPECT), y: Math.floor(sceneY) };
}

/** Arrow-key names mapped to a steering vector. */
export const ARROW_VECTORS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
