import { paint } from '../../engine/scene.js';
import { C, darker } from '../../engine/palette.js';
import { RoomId } from '../ids.js';
import type { RoomDef } from '../../engine/room.js';
import type { Game } from '../../engine/engine.js';

/**
 * The doorman of the whole game.
 *
 * The original of this genre gated itself behind general-knowledge questions
 * on the theory that anyone who could answer them was old enough to be here.
 * These questions are original, and the gate is deliberately forgiving: get
 * two of three and you are in, and a failed round simply asks three more.
 */
interface Question {
  readonly ask: string;
  /** Any of these, matched case- and punctuation-insensitively, is correct. */
  readonly answers: readonly string[];
}

export const QUESTIONS: readonly Question[] = [
  { ask: 'A rotary telephone has a dial. What do you do to it?', answers: ['turn', 'spin', 'rotate', 'dial', 'wind'] },
  { ask: 'Before a compact disc, music at home came on a black disc called what?', answers: ['record', 'vinyl', 'lp', 'album', 'a record'] },
  { ask: 'What did you have to do to a cassette tape that had unspooled?', answers: ['rewind', 'wind it', 'wind', 'pencil', 'use a pencil'] },
  { ask: 'A television with no remote control required you to do what to change channel?', answers: ['get up', 'stand up', 'walk', 'turn the dial', 'turn dial', 'get off the couch'] },
  { ask: 'What colour is the middle light of a traffic signal?', answers: ['amber', 'yellow', 'orange'] },
  { ask: 'A telephone number written 555-0100 has how many digits?', answers: ['7', 'seven'] },
  { ask: 'What do you call the small change left for a waiter?', answers: ['tip', 'a tip', 'gratuity'] },
  { ask: 'In a deck of cards, which suit is the same colour as hearts?', answers: ['diamonds', 'diamond', 'the diamonds'] },
  { ask: 'What do you put in a car to make it go?', answers: ['petrol', 'gas', 'gasoline', 'fuel', 'diesel'] },
  { ask: 'Twenty-one is the winning total in which card game?', answers: ['blackjack', 'pontoon', 'twenty one', '21', 'twenty-one'] },
];

const NEEDED = 2;
const ROUND = 3;

/** A plain door with a card taped to it, which is all this needs to be. */
export const ageCheckScene = () =>
  paint((p) => {
    p.ink(darker(C.navy)).box(0, 0, p.width, p.height);
    p.ink(C.navy);
    for (let y = 0; y < p.height; y += 6) p.line(0, y, p.width - 1, y);

    p.ink(C.brown).box(96, 20, 128, 148);
    p.ink(darker(C.brown)).outline(96, 20, 128, 148);
    p.ink(darker(C.brown)).outline(106, 32, 108, 56).outline(106, 98, 108, 56);
    p.ink(C.yellow).dot(212, 96).dot(213, 96).dot(212, 97).dot(213, 97);

    p.ink(C.white).box(120, 48, 80, 40);
    p.ink(C.black).outline(120, 48, 80, 40);
    p.ink(C.maroon).textCentred('OVER', 160, 54, 1, 1);
    p.ink(C.maroon).textCentred('18s', 160, 66, 1, 1);
    p.ink(C.black).textCentred('ONLY', 160, 78, 1, 0);

    p.blockRect(0, 0, p.width, 168);
  });

function askNext(g: Game): void {
  const index = g.counter('quizIndex');
  const order = g.counter('quizSeed');
  const q = QUESTIONS[(order + index * 3) % QUESTIONS.length];
  g.say(`Question ${index + 1} of ${ROUND}:`, q.ask);
}

function currentQuestion(g: Game): Question {
  const index = g.counter('quizIndex');
  const order = g.counter('quizSeed');
  return QUESTIONS[(order + index * 3) % QUESTIONS.length];
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export const ageCheck: RoomDef = {
  id: RoomId.AgeCheck,
  title: 'The Door',
  cutscene: true,
  scene: ageCheckScene,

  entries: { default: { x: 160, y: 166, facing: 'back' } },

  describe: 'A locked door with a card taped to it reading OVER 18s ONLY.',

  hotspots: [
    { noun: 'door', synonyms: ['card', 'sign', 'notice'], look: 'OVER 18s ONLY. Underneath, in biro: "prove it".' },
  ],

  onEnter(g) {
    g.setCounter('quizIndex', 0);
    g.setCounter('quizRight', 0);
    g.setCounter('quizSeed', g.roll(0, QUESTIONS.length - 1));
    g.say(
      'A locked door, and a card taped to it reading OVER 18s ONLY.',
      'Underneath, somebody has added in biro: "prove it".',
      `Answer ${NEEDED} of ${ROUND} and the door opens. Just type your answer.`,
    );
    askNext(g);
  },

  onCommand(g, cmd) {
    const answer = normalise(cmd.raw);
    if (!answer) return true;

    const question = currentQuestion(g);
    const correct = question.answers.some((a) => {
      const want = normalise(a);
      return answer === want || answer.split(' ').includes(want);
    });

    if (correct) {
      g.bump('quizRight');
      g.cue('score');
      g.say('Correct.');
    } else {
      g.cue('error');
      g.say('That is not it.');
    }

    const asked = g.bump('quizIndex');
    if (asked < ROUND) {
      askNext(g);
      return true;
    }

    const right = g.counter('quizRight');
    if (right >= NEEDED) {
      g.say(
        `${right} out of ${ROUND}. The lock clicks.`,
        'Welcome to Lost Wages. Try to be back before sunrise.',
      );
      g.goTo(RoomId.OutsideBar);
      return true;
    }

    g.say(
      `${right} out of ${ROUND}. The door stays shut.`,
      'Three more, then.',
    );
    g.setCounter('quizIndex', 0);
    g.setCounter('quizRight', 0);
    g.setCounter('quizSeed', g.roll(0, QUESTIONS.length - 1));
    askNext(g);
    return true;
  },
};
