/**
 * The parser's word list.
 *
 * Words are registered as synonym groups pointing at a canonical id. Rooms and
 * items contribute nouns at start-up, so a room can match `cmd.object === 'door'`
 * without caring which of a dozen spellings the player typed.
 */
export class Vocabulary {
  private readonly verbs = new Map<string, string>();
  /** Inventory words. These always win over another room's scenery. */
  private readonly itemNouns = new Map<string, string>();
  /** Scenery words, pooled from every room plus the universal set. */
  private readonly nouns = new Map<string, string>();
  private readonly preps = new Map<string, string>();
  private readonly ignored = new Set<string>();
  private longest = 1;

  /** Longest phrase, in words, that any registered entry spans. */
  get maxPhrase(): number {
    return this.longest;
  }

  private add(into: Map<string, string>, canonical: string, words: readonly string[]): void {
    for (const w of [canonical, ...words]) {
      const key = normalise(w);
      if (!key) continue;
      into.set(key, canonical);
      const span = key.split(' ').length;
      if (span > this.longest) this.longest = span;
    }
  }

  verb(canonical: string, ...synonyms: string[]): this {
    this.add(this.verbs, canonical, synonyms);
    return this;
  }

  noun(canonical: string, ...synonyms: string[]): this {
    this.add(this.nouns, canonical, synonyms);
    return this;
  }

  /** Register an inventory word, which outranks scenery of the same spelling. */
  itemNoun(canonical: string, ...synonyms: string[]): this {
    this.add(this.itemNouns, canonical, synonyms);
    return this;
  }

  preposition(canonical: string, ...synonyms: string[]): this {
    this.add(this.preps, canonical, synonyms);
    return this;
  }

  ignore(...words: string[]): this {
    for (const w of words) this.ignored.add(normalise(w));
    return this;
  }

  lookupVerb(word: string): string | undefined {
    return this.verbs.get(word);
  }
  /**
   * Resolve a noun, most specific first: the scenery of the room the player is
   * standing in, then anything they might be carrying, then the shared pool.
   *
   * Without the room layer a noun registered late would silently rename the
   * same word everywhere else: "wall" became the penthouse parapet, and the
   * washroom graffiti stopped answering to it.
   */
  lookupNoun(word: string, roomNouns?: ReadonlyMap<string, string>): string | undefined {
    return roomNouns?.get(word) ?? this.itemNouns.get(word) ?? this.nouns.get(word);
  }
  lookupPreposition(word: string): string | undefined {
    return this.preps.get(word);
  }
  isIgnored(word: string): boolean {
    return this.ignored.has(word);
  }
  knows(word: string): boolean {
    return (
      this.verbs.has(word) ||
      this.nouns.has(word) ||
      this.itemNouns.has(word) ||
      this.preps.has(word) ||
      this.ignored.has(word)
    );
  }

  /** Compile one room's hotspot words into a lookup layer. */
  static scopeFrom(
    spots: readonly { noun: string; synonyms?: readonly string[] }[],
  ): Map<string, string> {
    const scope = new Map<string, string>();
    for (const spot of spots) {
      for (const word of [spot.noun, ...(spot.synonyms ?? [])]) {
        scope.set(normalise(word), spot.noun);
      }
    }
    return scope;
  }

  /** Every canonical noun currently registered, for suggestion UI. */
  nounIds(): string[] {
    return [...new Set([...this.nouns.values(), ...this.itemNouns.values()])].sort();
  }

  /** Every word the player could usefully type, for autocomplete. */
  allWords(): string[] {
    return [
      ...new Set([...this.verbs.keys(), ...this.nouns.keys(), ...this.itemNouns.keys()]),
    ].sort();
  }
}

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
