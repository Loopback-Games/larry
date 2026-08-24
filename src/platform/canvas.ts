import { EGA_ABGR } from '../engine/palette.js';
import type { Surface } from '../engine/raster.js';
import { SCREEN_W, SCREEN_H } from '../engine/display.js';

/**
 * Presents composed screens on a canvas.
 *
 * The framebuffer is written at its native 320x200 and scaled up by the canvas
 * itself with smoothing disabled, so pixels stay square-edged at any zoom and
 * the browser does the upscale on the GPU.
 */
export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferCtx: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly pixels: Uint32Array;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d canvas context unavailable');
    this.ctx = ctx;

    this.buffer = document.createElement('canvas');
    this.buffer.width = SCREEN_W;
    this.buffer.height = SCREEN_H;
    const bctx = this.buffer.getContext('2d', { alpha: false });
    if (!bctx) throw new Error('2d buffer context unavailable');
    this.bufferCtx = bctx;

    this.image = this.bufferCtx.createImageData(SCREEN_W, SCREEN_H);
    this.pixels = new Uint32Array(this.image.data.buffer);
  }

  /** Size the backing store to the element's box, accounting for device pixels. */
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const box = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width * dpr));
    const h = Math.max(1, Math.round(box.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  draw(screen: Surface): void {
    const src = screen.colour;
    for (let i = 0; i < src.length; i++) this.pixels[i] = EGA_ABGR[src[i] & 0x0f];
    this.bufferCtx.putImageData(this.image, 0, 0);

    const { width, height } = this.canvas;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);

    // Letterbox to preserve the 320x200 aspect ratio.
    const scale = Math.min(width / SCREEN_W, height / SCREEN_H);
    const dw = Math.floor(SCREEN_W * scale);
    const dh = Math.floor(SCREEN_H * scale);
    const dx = Math.floor((width - dw) / 2);
    const dy = Math.floor((height - dh) / 2);
    this.ctx.drawImage(this.buffer, dx, dy, dw, dh);
  }
}
