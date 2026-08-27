import type { Game } from '../engine/engine.js';
import type { AudioEngine } from '../platform/audio.js';

const ABOUT = [
  'LOST WAGES',
  '',
  'An original parser adventure written for modern browsers, following the ' +
    'shape of the 1987 comedy adventures it is fond of: the same kind of city, ' +
    'the same kind of hero, 222 points to find.',
  '',
  'All artwork, music, writing and code here are original.',
];

/** Wire the menu dialog's buttons to the game. */
export function installMenu(game: Game, audio: AudioEngine, onClose: () => void): void {
  const dialog = document.getElementById('menu') as HTMLDialogElement;
  const openButton = document.getElementById('menu-button') as HTMLButtonElement;
  const fullscreen = document.getElementById('fullscreen-button') as HTMLButtonElement;

  const soundButton = dialog.querySelector<HTMLButtonElement>('[data-action="sound"]');
  const syncSound = (): void => {
    if (soundButton) soundButton.textContent = `Sound: ${audio.enabled ? 'on' : 'off'}`;
  };
  syncSound();

  openButton.addEventListener('click', () => {
    syncSound();
    dialog.showModal();
  });

  fullscreen.addEventListener('click', () => {
    const root = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen?.().catch(() => undefined);
  });

  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;

    switch (action) {
      case 'save':
        game.say(game.save() ? 'Game saved.' : 'This browser will not let the game save.');
        break;
      case 'restore':
        if (!game.hasSave()) game.say('There is no saved game to restore.');
        else if (game.restore()) game.say('Game restored.');
        else game.say('That saved game could not be read.');
        break;
      case 'restart':
        window.location.reload();
        return;
      case 'sound':
        audio.setEnabled(!audio.enabled);
        if (audio.enabled) audio.resume();
        syncSound();
        return;
      case 'help':
        game.submit('help');
        break;
      case 'about':
        game.say(ABOUT);
        break;
      default:
        break;
    }
    dialog.close();
    onClose();
  });

  dialog.addEventListener('close', onClose);
}
