import type { Game } from '../engine/engine.js';
import { ITEMS } from '../game/items.js';
import type { ItemId } from '../game/ids.js';

/** Verbs offered on every screen, in the order players reach for them. */
const CORE_VERBS = ['look at', 'talk to', 'get', 'open', 'use', 'give'];

/**
 * Context-sensitive word buttons.
 *
 * Typing full sentences on a phone is miserable, so the chips let a player
 * assemble a command by tapping: verbs insert a word and wait, nouns complete
 * the sentence and send it.
 */
export function installChips(
  game: Game,
  input: HTMLInputElement,
  submit: () => void,
): () => void {
  const container = document.getElementById('chips') as HTMLDivElement;

  const append = (word: string, andSend: boolean): void => {
    const current = input.value.trim();
    input.value = current.length ? `${current} ${word}` : word;
    if (andSend) submit();
    else input.focus();
  };

  const chip = (label: string, word: string, andSend: boolean): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    button.addEventListener('click', () => append(word, andSend));
    return button;
  };

  const refresh = (): void => {
    container.replaceChildren();

    // A close-up cannot be walked out of, so offer the way back first.
    if (game.room.closeup && game.room.leaveTo) {
      container.append(chip('leave', 'leave', true));
    }

    for (const verb of CORE_VERBS) container.append(chip(verb, verb, false));

    // Scenery the player can see right now.
    for (const spot of game.room.hotspots ?? []) {
      container.append(chip(spot.noun.replace(/-/g, ' '), spot.noun, true));
    }

    // Things being carried.
    for (const id of game.inventory) {
      const item = ITEMS[id as ItemId];
      if (item) container.append(chip(item.name.toLowerCase(), item.nouns[0], true));
    }
  };

  refresh();
  return refresh;
}
