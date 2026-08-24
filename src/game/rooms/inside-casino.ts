import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The casino floor. Slot machines down one wall, a card table, a lift to the
 * hotel, and a lounge whose door is doing nothing to contain the drumming.
 */
export const insideCasinoScene = () =>
  paint((p) => {
    p.ink(C.maroon).box(0, 0, p.width, 118);
    p.ink(darker(C.maroon)).box(0, 0, p.width, 10);
    p.ink(C.yellow).line(0, 10, p.width - 1, 10);

    // Patterned wall, because every surface in here is doing something.
    p.ink(C.red);
    for (let y = 16; y < 112; y += 14)
      for (let x = 6; x < p.width; x += 18) p.path([x, y, x + 6, y + 6, x, y + 12, x - 6, y + 6]);

    // Bank of slot machines along the left, ending above the carpet line.
    for (let i = 0; i < 3; i++) {
      const mx = 8 + i * 40;
      p.ink(darker(C.slate)).box(mx, 54, 32, 62);
      p.ink(C.slate).outline(mx, 54, 32, 62);
      p.ink(C.red).box(mx + 2, 56, 28, 12);
      p.ink(C.yellow).box(mx + 5, 59, 22, 6);
      p.ink(C.white).box(mx + 4, 72, 24, 16);
      p.ink(C.black).line(mx + 12, 72, mx + 12, 87).line(mx + 20, 72, mx + 20, 87);
      p.ink(C.red).box(mx + 6, 76, 4, 6);
      p.ink(C.lime).box(mx + 14, 76, 4, 6);
      p.ink(C.blue).box(mx + 22, 76, 4, 6);
      p.ink(C.grey).box(mx + 8, 94, 16, 6);
      p.ink(C.slate).box(mx + 32, 76, 3, 14);
      p.ink(C.red).box(mx + 31, 72, 5, 5);
    }

    // Curtained doorway to the lounge, back centre.
    p.ink(C.black).box(136, 46, 58, 70);
    p.ink(C.purple).outline(134, 44, 62, 74);
    p.ink(C.pink).box(140, 34, 50, 9);
    p.ink(C.white).box(145, 36, 40, 4);
    p.ink(darker(C.purple));
    for (let x = 139; x < 194; x += 6) p.line(x, 46, x + 2, 115);

    // Blackjack table, right of centre, clear of the carpet.
    p.ink(C.green).solid([206, 62, 262, 62, 268, 96, 200, 96]);
    p.ink(C.lime).line(206, 62, 261, 62);
    p.ink(darker(C.green)).outline(200, 62, 69, 35);
    p.ink(C.yellow).path([210, 70, 258, 70]);
    p.ink(C.white).box(216, 76, 10, 7).box(230, 76, 10, 7).box(246, 76, 10, 7);
    p.ink(C.black).box(224, 54, 22, 8);
    p.ink(C.brown).box(230, 96, 8, 18);

    // Lift doors, far right.
    p.ink(C.yellow).box(272, 38, 42, 78);
    p.ink(darker(C.yellow)).outline(272, 38, 42, 78);
    p.ink(C.brown).line(293, 40, 293, 114);
    p.ink(C.red).box(284, 28, 18, 8);
    p.ink(C.white).dot(288, 32).dot(298, 32);

    // Carpet: the loudest thing in the building.
    p.ink(C.navy).box(0, 118, p.width, p.height - 118);
    p.ink(C.blue);
    for (let y = 122; y < p.height; y += 10)
      for (let x = ((y / 10) % 2) * 10; x < p.width; x += 20) {
        p.path([x, y, x + 6, y + 4, x, y + 8, x - 6, y + 4]);
      }
    p.ink(C.red);
    for (let y = 126; y < p.height; y += 20)
      for (let x = 10; x < p.width; x += 20) p.dot(x, y);
    p.ink(C.yellow).line(0, 118, p.width - 1, 118);

    // A side table by the wall with a card left on it.
    p.ink(C.brown).box(196, 100, 30, 5).box(208, 105, 5, 12);
    p.ink(C.white).box(204, 96, 14, 5);
    p.ink(C.red).line(205, 98, 216, 98);

    p.depthRamp(118, p.height, 5, 14);
    // Only the wall and its fittings are solid; the whole carpet is walkable.
    p.blockRect(0, 0, p.width, 118);
  });

export const insideCasino: RoomDef = {
  id: RoomId.InsideCasino,
  title: 'The Casino Floor',
  scene: insideCasinoScene,

  entries: {
    default: { x: 160, y: 150, facing: 'back' },
    [RoomId.OutsideCasino]: { x: 160, y: 162, facing: 'back' },
    [RoomId.Slots]: { x: 56, y: 140, facing: 'front' },
    [RoomId.Lounge]: { x: 164, y: 140, facing: 'front' },
    [RoomId.Blackjack]: { x: 232, y: 140, facing: 'front' },
    [RoomId.ElevatorLobby]: { x: 292, y: 140, facing: 'front' },
  },

  describe:
    'Three slot machines, one card table, a carpet designed to hide anything, ' +
    'and the constant small noise of money changing hands. A lift stands open ' +
    'at the far end. Somewhere behind a curtained doorway, a drummer is ' +
    'working very hard for very few people.',

  hotspots: [
    { noun: 'slots', synonyms: ['slot machine', 'slot machines', 'machines', 'fruit machine'], look: 'Three one-armed bandits, all showing the same three losing symbols.' },
    { noun: 'blackjack table', synonyms: ['card table', 'table', 'blackjack', 'twenty one'], look: 'A green baize table with a dealer shoe and nobody sitting at it.' },
    { noun: 'lift', synonyms: ['elevator', 'lift doors'], look: 'Gold lift doors, standing open, waiting.' },
    { noun: 'lounge door', synonyms: ['curtain', 'lounge', 'doorway'], look: 'A curtained doorway with a pink sign over it. The drumming is coming from in there.' },
    {
      noun: 'card',
      synonyms: ['pass', 'membership card', 'little table', 'side table'],
      look: (g) =>
        g.has(ItemId.DiscoPass)
          ? 'The side table is empty now.'
          : 'There is a card lying on a side table by the wall. Somebody has ' +
            'put down a drink, and a membership card, and left with the drink.',
    },
  ],

  exits: [
    { x: 128, y: 164, w: 64, h: 4, to: RoomId.OutsideCasino },
    { x: 8, y: 119, w: 104, h: 9, to: RoomId.Slots },
    { x: 136, y: 119, w: 58, h: 9, to: RoomId.Lounge },
    { x: 200, y: 119, w: 68, h: 9, to: RoomId.Blackjack },
    { x: 272, y: 119, w: 44, h: 9, to: RoomId.ElevatorLobby },
  ],

  onCommand(g, cmd) {
    if (cmd.is('get', ItemId.DiscoPass) || cmd.is('get', 'card')) {
      if (g.has(ItemId.DiscoPass)) {
        g.say('You have the card.');
        return true;
      }
      g.give(ItemId.DiscoPass);
      g.award(1, 'got-pass');
      g.cue('score');
      g.say(
        'You pick the card up off the side table with the unhurried movement ' +
          'of a man collecting his own property.',
        'It is a membership card for a discotheque. It has somebody else\'s ' +
          'name on it, in a font small enough that this may not matter.',
      );
      return true;
    }

    if (cmd.isAny('play', 'slots') || cmd.isAny('use', 'slots')) {
      g.say('The machines are along the wall. Walk over to them.');
      return true;
    }

    return false;
  },
};
