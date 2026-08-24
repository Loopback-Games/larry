import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { Actor } from '../../engine/actor.js';
import { WALK_FREE } from '../../constants.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

/** Where the cab will take you, and what to say to get there. */
export const DESTINATIONS: readonly {
  noun: string;
  synonyms: readonly string[];
  room: string;
  label: string;
  /** Kept off the spoken list until the player has a reason to go. */
  hidden?: boolean;
}[] = [
  { noun: 'bar', synonyms: ["lefty's", 'lefty', 'pub'], room: RoomId.OutsideBar, label: "Lefty's" },
  {
    noun: 'store',
    synonyms: ['liquor store', 'shop', 'off licence', 'market'],
    room: RoomId.OutsideStore,
    label: 'the liquor store',
  },
  {
    noun: 'disco',
    synonyms: ['nightclub', 'club', 'discotheque'],
    room: RoomId.OutsideDisco,
    label: 'the disco',
  },
  {
    noun: 'casino',
    synonyms: ['hotel', 'casino hotel'],
    room: RoomId.OutsideCasino,
    label: 'the casino',
  },
  {
    noun: 'chapel',
    synonyms: ['church', 'wedding chapel'],
    room: RoomId.OutsideChapel,
    label: 'the chapel',
    // Only on the list once there is a reason to go there.
    hidden: true,
  },
];

/** The back of the cab, looking forward past the driver through the windscreen. */
export const taxiScene = () =>
  paint((p) => {
    p.ink(C.black).box(0, 0, p.width, p.height);

    // Headlining and the top of the windscreen frame.
    p.ink(darker(C.yellow)).box(0, 0, p.width, 18);
    p.ink(C.brown).box(0, 18, p.width, 6);

    // Windscreen: the city sliding past at three in the morning.
    p.ink(C.navy).box(40, 24, 240, 62);
    p.ink(C.black).skyline(74, 12, 34, C.black, C.yellow, 0x5ec0de);
    p.ink(C.navy).box(0, 24, 40, 62).box(280, 24, 40, 62);
    p.ink(C.slate).box(36, 24, 6, 62).box(278, 24, 6, 62);
    p.ink(C.grey).line(158, 24, 158, 85);
    p.ink(C.white).dots([60, 70, 96, 74, 210, 72, 250, 68]);
    p.ink(C.yellow).box(120, 78, 30, 3).box(180, 80, 34, 3);

    // Dashboard, meter and a great many small ornaments.
    p.ink(C.brown).box(0, 86, p.width, 26);
    p.ink(darker(C.brown)).line(0, 86, p.width - 1, 86);
    p.ink(C.black).box(196, 90, 42, 18);
    p.ink(C.red).box(200, 94, 34, 10);
    p.ink(C.yellow).box(202, 97, 4, 5).box(208, 97, 4, 5).box(216, 97, 4, 5);
    p.ink(C.lime).box(20, 92, 26, 14);
    p.ink(C.pink).dots([60, 92, 66, 92, 63, 96]);

    // Seat back, headrest and the grille between front and back.
    p.ink(C.maroon).box(0, 112, p.width, 30);
    p.ink(darker(C.maroon)).line(0, 112, p.width - 1, 112);
    p.ink(C.slate);
    for (let x = 8; x < p.width; x += 12) p.line(x, 112, x, 138);
    for (let y = 116; y < 140; y += 8) p.line(0, y, p.width - 1, y);

    // Back seat, where you are.
    p.ink(C.maroon).box(0, 142, p.width, p.height - 142);
    p.ink(darker(C.maroon));
    for (let x = 20; x < p.width; x += 40) p.line(x, 142, x, p.height - 1);
    p.ink(C.black).line(0, 142, p.width - 1, 142);

    // Doors either side, with handles.
    p.ink(C.slate).box(0, 100, 14, 62).box(306, 100, 14, 62);
    p.ink(C.grey).box(2, 124, 10, 4).box(308, 124, 10, 4);

    p.blockRect(0, 0, p.width, 146);
    p.saved((q) => q.noInk().noDepth().walk(WALK_FREE).box(20, 146, 280, 22));
    p.depthRamp(146, p.height, 8, 14);
  });

const DRIVER = new Actor({
  id: 'driver',
  x: 96,
  y: 112,
  facing: 'back',
  depth: 4,
  style: {
    hair: C.brown,
    hairStyle: 'cap',
    skin: C.pink,
    top: C.green,
    bottom: C.navy,
    shoes: C.brown,
    build: 4,
    height: 26,
  },
});

/** The list of places the driver will admit to knowing, given what you know. */
function namedPlaces(g: Game): string {
  const open = DESTINATIONS.filter((d) => !d.hidden || g.flag('fawnReady'));
  const names = open.map((d) => d.noun.toUpperCase());
  return `You can name a place: ${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}.`;
}

function ride(g: Game, room: string, label: string): void {
  g.award(1, 'first-cab-ride');
  g.cue('door');
  g.say(
    `"${label}," you say, as though you do this every night.`,
    'He pulls out without indicating and drives you across town in a silence ' +
      'you eventually stop trying to fill.',
  );
  g.goTo(room);
}

export const taxi: RoomDef = {
  id: RoomId.Taxi,
  title: 'In the Cab',
  scene: taxiScene,

  entries: { default: { x: 160, y: 160, facing: 'back' } },

  describe:
    'The back of a cab that smells of pine air freshener losing to everything ' +
    'else. The meter is running. The driver is waiting for you to say a name.',

  hotspots: [
    {
      noun: 'driver',
      synonyms: ['cabbie', 'cabby', 'him'],
      look:
        'He watches you in the mirror with an expression that suggests he has ' +
        'already worked out how your evening ends.',
    },
    { noun: 'meter', synonyms: ['fare'], look: 'The meter ticks up in increments designed to be just below the threshold of complaint.' },
    { noun: 'windscreen', synonyms: ['windshield', 'window'], look: 'Lost Wages slides past: neon, shutters, and a great deal of nothing.' },
  ],

  onEnter(g) {
    if (!g.flag('rodeInCab')) {
      g.set('rodeInCab');
      g.say(
        'You get in and pull the door shut.',
        '"Where to?" says the driver, without turning round.',
        namedPlaces(g),
      );
    } else {
      g.say('"Where to?" he says again, with slightly less enthusiasm.', namedPlaces(g));
    }
  },

  onCommand(g, cmd) {
    for (const dest of DESTINATIONS) {
      const named =
        cmd.mentions(dest.noun) ||
        cmd.object === dest.noun ||
        cmd.indirect === dest.noun;
      if (!named) continue;
      if (cmd.verb === 'look') break;
      ride(g, dest.room, dest.label);
      return true;
    }

    if (cmd.is('talk', 'driver') || cmd.isBare('talk')) {
      g.say('"Where to?" he says. It is the whole of his conversation, and it is enough.');
      return true;
    }

    if (cmd.verb === 'exit' || cmd.is('open', 'door')) {
      g.say('"Not till you tell me where," he says. "I am not a bench."');
      return true;
    }

    if (cmd.verb === 'pay' || cmd.is('give', 'wallet')) {
      g.say('"When we get there," he says.');
      return true;
    }

    return false;
  },

  populate: () => [DRIVER],
};
