/**
 * A tiny square-wave synthesiser.
 *
 * The music and effects are written here as note lists rather than sampled, so
 * the whole soundtrack costs a few hundred bytes and sits in the same register
 * as the visuals.
 */

const NOTE_OFFSETS: Readonly<Record<string, number>> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
};

/** Convert scientific pitch notation ("c4", "f#5", "-" for a rest) to Hz. */
export function noteToHz(note: string): number {
  if (note === '-' || note === '') return 0;
  const m = /^([a-g])([#b]?)(-?\d)$/.exec(note.toLowerCase());
  if (!m) return 0;
  const semitone =
    NOTE_OFFSETS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  // MIDI note 69 is A440.
  return 440 * Math.pow(2, (semitone - 69) / 12);
}

export interface Cue {
  /** Beats per minute. */
  readonly tempo: number;
  readonly wave: OscillatorType;
  readonly gain: number;
  /** `note:beats` pairs, e.g. `c4:1`. */
  readonly notes: readonly string[];
  readonly loop?: boolean;
}

/** Original compositions, one per cue name. */
export const CUES: Readonly<Record<string, Cue>> = {
  theme: {
    tempo: 132,
    wave: 'square',
    gain: 0.16,
    notes: [
      'c4:1', 'e4:0.5', 'g4:0.5', 'a4:1', 'g4:1',
      'f4:1', 'a4:0.5', 'c5:0.5', 'd5:1', 'c5:1',
      'e4:1', 'g4:0.5', 'b4:0.5', 'c5:1', 'b4:1',
      'a4:0.5', 'g4:0.5', 'f4:0.5', 'e4:0.5', 'd4:1', 'c4:1',
    ],
  },
  coin: {
    tempo: 400,
    wave: 'square',
    gain: 0.18,
    notes: ['e5:1', 'g5:1', 'c6:2'],
  },
  door: {
    tempo: 300,
    wave: 'triangle',
    gain: 0.14,
    notes: ['g3:1', 'c4:1'],
  },
  error: {
    tempo: 340,
    wave: 'square',
    gain: 0.12,
    notes: ['g3:1', 'f#3:2'],
  },
  death: {
    tempo: 96,
    wave: 'sawtooth',
    gain: 0.16,
    notes: ['c4:1', 'b3:1', 'a3:1', 'g#3:2', '-:0.5', 'g3:3'],
  },
  victory: {
    tempo: 150,
    wave: 'square',
    gain: 0.18,
    notes: [
      'c5:0.5', 'e5:0.5', 'g5:0.5', 'c6:1.5',
      'g5:0.5', 'c6:2',
    ],
  },
  score: {
    tempo: 420,
    wave: 'square',
    gain: 0.15,
    notes: ['c5:1', 'e5:1'],
  },
};

const STORAGE_KEY = 'larry.sound';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private playing: OscillatorNode[] = [];
  private muted: boolean;

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    this.muted = stored === 'off';
  }

  get enabled(): boolean {
    return !this.muted;
  }

  setEnabled(on: boolean): void {
    this.muted = !on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* storage may be unavailable in private mode; sound still works. */
    }
    if (!on) this.stop();
  }

  /** Browsers require a user gesture before audio starts. */
  resume(): void {
    if (this.muted) return;
    this.ensure();
    void this.ctx?.resume();
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  stop(): void {
    for (const osc of this.playing) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }
    this.playing = [];
  }

  play(cueName: string): void {
    if (this.muted) return;
    const cue = CUES[cueName];
    if (!cue) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const beat = 60 / cue.tempo;
    let at = ctx.currentTime + 0.02;

    for (const entry of cue.notes) {
      const [name, beatsText] = entry.split(':');
      const beats = Number(beatsText ?? '1');
      const seconds = beats * beat;
      const hz = noteToHz(name);
      if (hz > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cue.wave;
        osc.frequency.value = hz;
        // A short attack and release stops the square wave from clicking.
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(cue.gain, at + 0.008);
        gain.gain.setValueAtTime(cue.gain, at + seconds * 0.75);
        gain.gain.linearRampToValueAtTime(0, at + seconds * 0.95);
        osc.connect(gain).connect(this.master);
        osc.start(at);
        osc.stop(at + seconds);
        this.playing.push(osc);
        osc.addEventListener('ended', () => {
          this.playing = this.playing.filter((o) => o !== osc);
        });
      }
      at += seconds;
    }
  }
}
