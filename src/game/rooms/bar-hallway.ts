import { paint } from '../../engine/scene.js';
import { C } from '../../engine/palette.js';
import { doorways, exitsOf, walls, type Doorway } from '../../engine/doorway.js';
import { Actor } from '../../engine/actor.js';
import { RoomId, ItemId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';

/** Where the corridor floor meets the far wall. */
const FLOOR = 124;

const DOORS: readonly Doorway[] = [
  {
    to: RoomId.BarToilet,
    label: 'Washroom',
    side: 'back',
    x: 40,
    y: FLOOR + 22,
    w: 32,
    h: 60,
    colour: C.pewter,
    through: C.black,
  },
  {
    to: RoomId.BarBackroom,
    label: 'Storeroom',
    side: 'back',
    x: 160,
    y: FLOOR,
    w: 30,
    h: 52,
    colour: C.brown,
    through: C.black,
  },
  {
    to: RoomId.InsideBar,
    label: 'Bar',
    side: 'back',
    x: 280,
    y: FLOOR + 22,
    w: 32,
    h: 60,
    colour: C.brown,
    through: C.bronze,
    spill: C.gold,
  },
];

/**
 * The corridor behind the bar. A drunk has come to rest against the wall with
 * a rose in one hand and a television remote in the other, and no memory of
 * acquiring either.
 */
export const barHallwayScene = () =>
  paint((p) => {
    // ---- corridor shell ---------------------------------------------------
    // Built back to front: the far wall, then the side walls closing in on it,
    // so the room reads as a passage rather than a flat brown field.
    p.ink(C.brown).box(0, 0, p.width, FLOOR);
    p.ink(C.charcoal).box(0, 0, p.width, 10);

    // Far wall at the end of the passage.
    p.slab(118, 22, 84, FLOOR - 22, C.brownLit, 1);
    p.sweep(118, 22, 84, FLOOR - 22, 1, 0);

    // Side walls, angled in. Darker than the far wall so the corner reads.
    p.ink(C.brown).solid([0, 0, 118, 22, 118, FLOOR, 0, p.height]);
    p.ink(C.brown).solid([p.width, 0, 202, 22, 202, FLOOR, p.width, p.height]);
    p.sweep(0, 0, 118, p.height, -1, 1);
    p.sweep(202, 0, 118, p.height, -1, 1);
    p.ink(C.woodDim).path([0, 0, 118, 22, 118, FLOOR]);
    p.ink(C.woodDim).path([p.width - 1, 0, 202, 22, 202, FLOOR]);

    // Wainscoting, following the same perspective as the walls.
    p.ink(C.maroonDeep).solid([0, 96, 118, 78, 202, 78, p.width, 96, p.width, 108, 202, 92, 118, 92, 0, 108]);
    p.ink(C.maroon).path([0, 96, 118, 78, 202, 78, p.width - 1, 96]);

    // Wallpaper stripes on the far wall only; on the side walls they would
    // fight the perspective rather than support it.
    p.ink(C.woodDim);
    for (let x = 124; x < 200; x += 12) p.line(x, 24, x, 76);

    // ---- a bare bulb, and the only light in here ---------------------------
    p.ink(C.charcoal).box(159, 10, 2, 12);
    p.ink(C.yellowPale).dot(160, 23).dot(159, 22).dot(161, 22).dot(160, 21);
    p.glow(160, 22, 16, C.gold, 0.45, [C.brown, C.brownLit, C.tan]);

    // ---- floor -------------------------------------------------------------
    p.floorPlane(FLOOR, p.height, C.brown, 160, 9);

    // ---- doors -------------------------------------------------------------
    doorways(p, DOORS);
    p.lightPool(160, 46, 54, 40, 1);

    // A bucket nobody has emptied.
    p.ink(C.pewter).solid([210, 148, 230, 148, 226, 164, 214, 164]);
    p.ink(C.pewterLit).line(210, 148, 229, 148);
    p.ink(C.tealLit).box(213, 151, 14, 3);
    p.contact(208, 160, 26, 6, -2);

    p.vignette(-1);
    p.depthRamp(FLOOR, p.height, 5, 14);
    walls(p, FLOOR, DOORS);
    p.blockRect(206, 144, 28, 22);
  });

const DRUNK = new Actor({
  id: 'drunk',
  x: 104,
  y: 156,
  facing: 'right',
  style: {
    hair: C.silver,
    hairStyle: 'short',
    skin: C.skinMid,
    top: C.greenDim,
    shirt: C.bone,
    bottom: C.navy,
    shoes: C.woodDeep,
    build: 5,
    height: 28,
  },
});

export const barHallway: RoomDef = {
  id: RoomId.BarHallway,
  title: 'Behind the Bar',
  scene: barHallwayScene,

  horizon: FLOOR,
  scaleAtHorizon: 0.58,

  entries: {
    default: { x: 190, y: 158, facing: 'left' },
    [RoomId.InsideBar]: { x: 258, y: 158, facing: 'left' },
    [RoomId.BarToilet]: { x: 66, y: 158, facing: 'right' },
    [RoomId.BarBackroom]: { x: 160, y: 136, facing: 'front' },
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

  exits: exitsOf(DOORS),

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
