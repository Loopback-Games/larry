import { createGame } from './game/index.js';
import { CanvasRenderer } from './platform/canvas.js';
import { canvasToScene, ARROW_VECTORS } from './platform/input.js';
import { compose } from './engine/display.js';
import { AudioEngine } from './platform/audio.js';
import { installChips } from './ui/chips.js';
import { installMenu } from './ui/menu.js';

/** Logical simulation rate. Deliberately unhurried, like the games this follows. */
const TICK_MS = 100;
const CURSOR_MS = 500;

function boot(): void {
  const app = document.getElementById('app') as HTMLDivElement;
  const canvas = document.getElementById('screen') as HTMLCanvasElement;
  const input = document.getElementById('command') as HTMLInputElement;
  const form = document.getElementById('command-form') as HTMLFormElement;

  const audio = new AudioEngine();
  const game = createGame({
    onCue: (cue) => audio.play(cue),
  });

  const renderer = new CanvasRenderer(canvas);
  app.dataset.state = 'ready';

  // ---- rendering ---------------------------------------------------------

  let lastTick = performance.now();
  let cursorOn = true;
  let lastCursor = lastTick;

  const loop = (now: number): void => {
    while (now - lastTick >= TICK_MS) {
      game.tick();
      lastTick += TICK_MS;
    }
    if (now - lastCursor >= CURSOR_MS) {
      cursorOn = !cursorOn;
      lastCursor = now;
    }
    renderer.resize();
    renderer.draw(compose(game.renderFrame(), { input: input.value, cursorOn }));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // ---- command entry -----------------------------------------------------

  const submit = (): void => {
    const value = input.value;
    input.value = '';
    if (game.pendingMessage) {
      game.dismissMessage();
      if (value.trim()) game.submit(value);
      return;
    }
    if (value.trim()) game.submit(value);
    refreshChips();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
    // Keep focus so a desktop player can keep typing without clicking back.
    if (matchMedia('(pointer: fine)').matches) input.focus();
  });

  // ---- keyboard ----------------------------------------------------------

  const held = new Set<string>();

  const applySteering = (): void => {
    let dx = 0;
    let dy = 0;
    for (const key of held) {
      const v = ARROW_VECTORS[key];
      if (v) {
        dx += v[0];
        dy += v[1];
      }
    }
    game.steer(dx, dy);
  };

  window.addEventListener('keydown', (event) => {
    if (event.key in ARROW_VECTORS) {
      event.preventDefault();
      held.add(event.key);
      applySteering();
      return;
    }
    if (event.key === 'Enter' && document.activeElement !== input) {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === 'Escape') {
      input.value = '';
      return;
    }
    // Any printable key starts typing, wherever focus happens to be.
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      document.activeElement !== input
    ) {
      input.focus();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key in ARROW_VECTORS) {
      held.delete(event.key);
      applySteering();
    }
  });

  window.addEventListener('blur', () => {
    held.clear();
    game.steer(0, 0);
  });

  // ---- touch pad ---------------------------------------------------------

  for (const pad of document.querySelectorAll<HTMLButtonElement>('.pad')) {
    const [dx, dy] = (pad.dataset.dir ?? '0,0').split(',').map(Number);
    const press = (event: PointerEvent): void => {
      event.preventDefault();
      pad.dataset.held = 'true';
      pad.setPointerCapture(event.pointerId);
      game.steer(dx, dy);
      audio.resume();
    };
    const release = (): void => {
      delete pad.dataset.held;
      game.steer(0, 0);
    };
    pad.addEventListener('pointerdown', press);
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('pointerleave', release);
    pad.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ---- tapping the scene -------------------------------------------------

  canvas.addEventListener('pointerdown', (event) => {
    audio.resume();
    if (game.pendingMessage || game.ending) {
      game.dismissMessage();
      return;
    }
    const point = canvasToScene(canvas, event.clientX, event.clientY);
    if (!point) return;
    // Walking to an unreachable spot should not strand Larry mid-stride.
    if (!game.canStand(point.x, point.y)) return;
    game.steer(0, 0);
    held.clear();
    game.ego.walkTo(point.x, point.y);
  });

  // ---- panels ------------------------------------------------------------

  const refreshChips = installChips(game, input, submit);
  installMenu(game, audio, () => {
    refreshChips();
    input.focus();
  });

  refreshChips();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
