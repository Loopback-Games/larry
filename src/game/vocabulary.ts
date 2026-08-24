import { Vocabulary } from '../engine/vocabulary.js';
import { ALL_ITEMS } from './items.js';

/**
 * Build the game's word list: the standard verb set, prepositions, filler words
 * the parser discards, and a noun for every inventory item. Rooms add their own
 * scenery nouns when they are registered.
 */
export function buildVocabulary(): Vocabulary {
  const v = new Vocabulary();

  // ---- movement ----------------------------------------------------------
  v.verb('north', 'n', 'go north');
  v.verb('south', 's', 'go south');
  v.verb('east', 'e', 'go east');
  v.verb('west', 'w', 'go west');
  v.verb('up', 'u', 'go up', 'climb up', 'upstairs');
  v.verb('down', 'd', 'go down', 'climb down', 'downstairs');
  v.verb('enter', 'go in', 'go into', 'go inside', 'in');
  v.verb('exit', 'out', 'go out', 'leave', 'get out', 'get off');

  // ---- perception --------------------------------------------------------
  v.verb('look', 'l', 'examine', 'x', 'inspect', 'look at', 'describe', 'study');
  v.verb('look in', 'look inside', 'search', 'look into');
  v.verb('look under', 'look beneath', 'lift');
  v.verb('look behind');
  v.verb('read', 'peruse');
  v.verb('smell', 'sniff');
  v.verb('listen');
  v.verb('touch', 'feel');

  // ---- manipulation ------------------------------------------------------
  v.verb('get', 'take', 'pick up', 'grab', 'acquire', 'steal');
  v.verb('drop', 'put down', 'discard', 'leave behind');
  v.verb('open', 'unlock');
  v.verb('close', 'shut', 'lock');
  v.verb('push', 'press', 'press button', 'shove');
  v.verb('pull', 'tug', 'yank');
  v.verb('turn', 'rotate', 'twist');
  v.verb('turn on', 'switch on', 'activate', 'start');
  v.verb('turn off', 'switch off', 'deactivate', 'stop');
  v.verb('use', 'operate', 'apply');
  v.verb('put', 'place', 'insert', 'put in');
  v.verb('wear', 'put on', 'don');
  v.verb('remove', 'take off', 'doff');
  v.verb('give', 'hand', 'offer', 'hand over');
  v.verb('show', 'display', 'present', 'flash');
  v.verb('buy', 'purchase');
  v.verb('pay', 'pay for');
  v.verb('break', 'smash', 'shatter');
  v.verb('hit', 'strike', 'punch', 'kick', 'attack');
  v.verb('cut', 'slice', 'saw');
  v.verb('tie', 'fasten', 'attach', 'knot');
  v.verb('untie', 'unfasten', 'loosen');
  v.verb('inflate', 'blow up', 'pump up');
  v.verb('fill');
  v.verb('knock', 'knock on');
  v.verb('throw', 'toss', 'chuck');
  v.verb('move');

  // ---- body and social ---------------------------------------------------
  v.verb('talk', 'talk to', 'speak', 'speak to', 'greet', 'say hello');
  v.verb('ask', 'ask about', 'ask for', 'question');
  v.verb('kiss', 'smooch');
  v.verb('dance', 'boogie', 'get down');
  v.verb('marry', 'wed', 'propose');
  v.verb('sit', 'sit down', 'sit on', 'be seated');
  v.verb('stand', 'stand up', 'get up', 'rise');
  v.verb('sleep', 'nap', 'rest', 'go to bed', 'lie down', 'get in bed', 'get into bed');
  v.verb('wait', 'z');
  v.verb('eat', 'consume', 'bite');
  v.verb('drink', 'sip', 'swallow');
  v.verb('spray', 'squirt');
  v.verb('climb', 'scale', 'clamber');
  v.verb('jump', 'leap', 'hop');
  v.verb('swim', 'paddle');
  v.verb('knock out');

  // ---- devices -----------------------------------------------------------
  v.verb('call', 'dial', 'phone', 'telephone', 'ring up');
  v.verb('answer', 'pick up phone');
  v.verb('play', 'gamble');
  v.verb('bet', 'wager', 'stake');
  v.verb('deal');
  v.verb('hit me');
  v.verb('stand pat');

  // ---- meta --------------------------------------------------------------
  v.verb('inventory', 'i', 'inv', 'items', 'possessions');
  v.verb('score', 'points');
  v.verb('save', 'save game');
  v.verb('restore', 'load', 'restore game', 'load game');
  v.verb('restart', 'start over');
  v.verb('quit', 'exit game');
  v.verb('help', '?', 'hint');
  v.verb('yes', 'y', 'yeah', 'yep', 'sure');
  v.verb('no', 'nope', 'nah');
  v.verb('again', 'g', 'repeat');

  // ---- prepositions ------------------------------------------------------
  v.preposition('to', 'toward', 'towards');
  v.preposition('with', 'using');
  v.preposition('on', 'onto', 'upon');
  v.preposition('in', 'into', 'inside');
  v.preposition('under', 'underneath', 'beneath');
  v.preposition('at');
  v.preposition('from', 'off of');
  v.preposition('about', 'regarding');
  v.preposition('for');
  v.preposition('behind');

  // ---- filler ------------------------------------------------------------
  v.ignore(
    'a', 'an', 'the', 'my', 'your', 'his', 'her', 'its', 'their',
    'this', 'that', 'these', 'those', 'some', 'any', 'all',
    'please', 'now', 'then', 'just', 'really', 'very',
    // 'go' is filler: the movement verbs are registered as "go north" phrases,
    // which are matched before the bare word is discarded.
    'go',
    'and', 'of', 'is', 'are', 'was', 'be', 'do', 'does', 'did',
    // 'i' is deliberately not ignored: as a lone word it is the
    // inventory shorthand, which players use far more than the pronoun.
    'me', 'you', 'it', 'him', 'them',
  );

  // ---- items -------------------------------------------------------------
  for (const item of ALL_ITEMS) v.itemNoun(item.id, ...item.nouns);

  // ---- universally present scenery ---------------------------------------
  v.noun('self', 'me', 'myself', 'larry', 'larry laffer');
  v.noun('ground', 'floor', 'pavement', 'sidewalk');
  v.noun('sky', 'stars', 'moon');
  v.noun('door', 'doorway', 'entrance');
  v.noun('window', 'windows');
  v.noun('wall', 'walls');
  v.noun('sign', 'signs', 'notice');

  return v;
}
