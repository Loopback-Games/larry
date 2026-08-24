import { Vocabulary, normalise } from './vocabulary.js';

/** One parsed player instruction. */
export class Command {
  constructor(
    readonly raw: string,
    readonly verb: string | null,
    readonly object: string | null,
    readonly preposition: string | null,
    readonly indirect: string | null,
    /** First typed word the vocabulary did not recognise, if any. */
    readonly unknownWord: string | null,
    /** Every recognised noun in the input, in order. */
    readonly nouns: readonly string[],
  ) {}

  get isEmpty(): boolean {
    return this.verb === null && this.object === null && this.unknownWord === null;
  }

  /** Match a verb, and optionally a direct and indirect object. */
  is(verb: string, object?: string, indirect?: string): boolean {
    if (this.verb !== verb) return false;
    if (object !== undefined && this.object !== object) return false;
    if (indirect !== undefined && this.indirect !== indirect) return false;
    return true;
  }

  /** Match a verb with any of the listed direct objects. */
  isAny(verb: string, ...objects: string[]): boolean {
    return this.verb === verb && this.object !== null && objects.includes(this.object);
  }

  /** True when the verb matches and no object was supplied. */
  isBare(verb: string): boolean {
    return this.verb === verb && this.object === null;
  }

  /** True when the noun appears anywhere in the command. */
  mentions(noun: string): boolean {
    return this.nouns.includes(noun);
  }

  toString(): string {
    return [this.verb, this.object, this.preposition, this.indirect].filter(Boolean).join(' ');
  }
}

export const EMPTY_COMMAND = new Command('', null, null, null, null, null, []);

/**
 * Turn a typed line into a {@link Command}.
 *
 * Words are matched greedily longest-first so multi-word entries like
 * "disco pass" or "look under" win over their single-word prefixes.
 */
export function parse(input: string, vocab: Vocabulary): Command {
  const raw = input.trim();
  const words = normalise(raw).split(' ').filter(Boolean);
  if (words.length === 0) return new Command(raw, null, null, null, null, null, []);

  let verb: string | null = null;
  let preposition: string | null = null;
  const found: string[] = [];
  let unknown: string | null = null;

  let i = 0;
  while (i < words.length) {
    let matched = false;
    const span = Math.min(vocab.maxPhrase, words.length - i);
    for (let n = span; n >= 1 && !matched; n--) {
      const phrase = words.slice(i, i + n).join(' ');

      if (vocab.isIgnored(phrase)) {
        i += n;
        matched = true;
        break;
      }
      // A verb only counts in the leading position; "look at the look" is not
      // two verbs, and nouns that share a spelling with a verb resolve as nouns.
      const asVerb = vocab.lookupVerb(phrase);
      if (asVerb && verb === null) {
        verb = asVerb;
        i += n;
        matched = true;
        break;
      }
      const asNoun = vocab.lookupNoun(phrase);
      if (asNoun) {
        found.push(asNoun);
        i += n;
        matched = true;
        break;
      }
      const asPrep = vocab.lookupPreposition(phrase);
      if (asPrep) {
        if (preposition === null) preposition = asPrep;
        i += n;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (unknown === null) unknown = words[i];
      i += 1;
    }
  }

  return new Command(
    raw,
    verb,
    found[0] ?? null,
    preposition,
    found[1] ?? null,
    unknown,
    found,
  );
}
