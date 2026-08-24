import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/**
 * The corridor behind the bar. A drunk has come to rest against the wall with
 * a rose in one hand and a television remote in the other, and no memory of
 * acquiring either.
 */
export const barHallwayScene = () =>
  paint((p) => {
    p.ink(C.brown).box(0, 0, p.width, 126);
    p.ink(darker(C.brown)).box(0, 0, p.width, 8);

    // Wainscoting and a wallpaper the colour of old tea.
    p.ink(C.maroon).box(0, 70, p.width, 12);
    p.ink(C.brown).box(0, 82, p.width, 44);
    p.ink(darker(C.brown));
    for (let x = 8; x < p.width; x += 16) p.line(x, 8, x, 68);

    // Perspective: the corridor narrows towards a door at the far end.
    p.ink(C.black).path([0, 8, 60, 34, 60, 126]).path([p.width - 1, 8, 260, 34, 260, 126]);
    p.ink(darker(C.brown)).fill(30, 40).fill(290, 40);

    // Toilet door, left.
    p.ink(C.slate).box(12, 40, 40, 84);
    p.ink(C.black).outline(12, 40, 40, 84);
    p.ink(C.white).box(24, 48, 16, 12);
    p.ink(C.black).line(28, 52, 36, 52).line(28, 56, 34, 56);
    p.ink(C.yellow).dot(46, 84).dot(47, 84);

    // Door back to the bar, right.
    p.ink(C.brown).box(268, 40, 40, 84);
    p.ink(C.black).outline(268, 40, 40, 84);
    p.ink(C.yellow).dot(274, 84).dot(275, 84);

    // Storeroom door at the end of the corridor.
    p.ink(C.black).box(146, 44, 28, 76);
    p.ink(C.slate).outline(145, 43, 30, 78);
    p.ink(C.yellow).dot(170, 84);

    // A bare bulb and its pool of light.
    p.ink(C.black).line(160, 8, 160, 20);
    p.ink(C.yellow).dot(160, 22).dot(159, 21).dot(161, 21).dot(160, 20);

    // Floor: worn boards running away from the camera.
    p.ink(C.brown).box(0, 126, p.width, p.height - 126);
    p.ink(darker(C.brown));
    for (let i = -6; i <= 6; i++) p.line(160 + i * 12, 126, 160 + i * 46, p.height - 1);
    p.ink(C.black).line(0, 126, p.width - 1, 126);

    // A bucket nobody has emptied.
    p.ink(C.slate).solid([196, 152, 214, 152, 211, 166, 199, 166]);
    p.ink(C.teal).box(198, 154, 14, 3);

    p.depthRamp(126, p.height, 5, 14);
    p.blockRect(0, 0, p.width, 126);
    p.blockRect(192, 148, 26, 20);
  });

const DRUNK = new Actor({
  id: 'drunk',
  x: 96,
  y: 150,
  facing: 'right',
  style: {
    hair: C.grey,
    hairStyle: 'short',
    skin: C.pink,
    top: C.green,
    shirt: C.white,
    bottom: C.navy,
    shoes: C.brown,
    build: 4,
    height: 22,
  },
});

export const barHallway: RoomDef = {
  id: RoomId.BarHallway,
  title: 'Behind the Bar',
  scene: barHallwayScene,

  entries: {
    default: { x: 250, y: 148, facing: 'left' },
    [RoomId.InsideBar]: { x: 276, y: 148, facing: 'left' },
    [RoomId.BarToilet]: { x: 60, y: 148, facing: 'right' },
    [RoomId.BarBackroom]: { x: 160, y: 140, facing: 'front' },
  },

  describe:
    'A narrow corridor that smells of bleach losing an argument. There is a ' +
    'door to the washroom, a door to a storeroom, and a man on the floor who ' +
    'has clearly been here longer than the carpet.',

  populate: () => [DRUNK],

  hotspots: [
    {
      noun: 'drunk',
      synonyms: ['man', 'guy', 'bum', 'fellow', 'him'],
      look: (g) =>
        g.flag('drunkHelped')
          ? 'He is asleep now, and smiling, which is more than he managed awake.'
          : 'He is sitting against the wall holding a rose in one hand and a ' +
            'television remote in the other. He appears to be waiting for ' +
            'someone who is not coming.',
    },
    {
      noun: 'toilet door',
      synonyms: ['washroom door', 'washroom', 'bathroom', 'restroom', 'toilet'],
      look: 'A door marked with a sign so worn it could mean anything.',
    },
    {
      noun: 'storeroom door',
      synonyms: ['storeroom', 'far door', 'back door'],
      look: 'A plain door at the end of the corridor. It is not locked.',
    },
    { noun: 'bucket', look: 'A mop bucket. The water in it has developed opinions.' },
    { noun: 'bulb', synonyms: ['light', 'lamp'], look: 'One bare bulb doing the work of four.' },
  ],

  exits: [
    { x: 296, y: 128, w: 24, h: 30, to: RoomId.InsideBar },
    { x: 0, y: 128, w: 24, h: 30, to: RoomId.BarToilet },
    { x: 146, y: 126, w: 28, h: 6, to: RoomId.BarBackroom },
  ],

  onCommand(g, cmd) {
    if (cmd.is('get', ItemId.Rose)) {
      if (g.has(ItemId.Rose)) {
        g.say('You have the rose. One is plenty.');
        return true;
      }
      g.give(ItemId.Rose);
      g.award(1, 'got-rose');
      g.cue('score');
      g.say(
        'You take the rose from his hand. He does not resist. He does not, ' +
          'strictly speaking, notice.',
      );
      return true;
    }

    if (cmd.is('get', ItemId.RemoteControl)) {
      if (g.has(ItemId.RemoteControl)) {
        g.say('You already have it.');
        return true;
      }
      if (!g.flag('drunkHelped')) {
        g.say(
          'His grip on the remote is the only firm thing about him. Whatever ' +
            'he thinks it controls, he is not letting go of it sober.',
        );
        return true;
      }
      g.give(ItemId.RemoteControl);
      g.cue('score');
      g.say('You slip the remote out of his sleeping hand.');
      return true;
    }

    const givingDrink =
      cmd.is('give', ItemId.Whiskey) ||
      cmd.is('give', ItemId.Whiskey, 'drunk') ||
      (cmd.verb === 'give' && cmd.mentions(ItemId.Whiskey));

    if (givingDrink) {
      if (!g.has(ItemId.Whiskey)) {
        g.say('You have nothing to give him.');
        return true;
      }
      if (g.flag('drunkHelped')) {
        g.say('He has had quite enough of your generosity.');
        return true;
      }
      g.take(ItemId.Whiskey);
      g.set('drunkHelped');
      g.award(2, 'gave-drunk-drink');
      g.cue('score');
      g.say(
        'You offer him the whiskey. He accepts it with the dignity of a man ' +
          'receiving an award.',
        'He drinks it in one movement, sighs, and slides gently sideways into ' +
          'the deepest sleep of his life. His hands open.',
      );
      return true;
    }

    if (cmd.is('talk', 'drunk')) {
      g.say(
        g.flag('drunkHelped')
          ? 'He is unreachable now. Somewhere better, probably.'
          : '"You buying?" he says, to a spot about a foot to your left.',
      );
      return true;
    }

    if (cmd.is('look in', 'bucket') || cmd.is('look', 'bucket')) {
      g.say('You look into the bucket. The bucket, in some sense, looks back.');
      return true;
    }

    return false;
  },
};
