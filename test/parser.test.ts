import { describe, it, expect } from 'vitest';
import { parse } from '../src/engine/parser.js';
import { buildVocabulary } from '../src/game/vocabulary.js';
import { ItemId } from '../src/game/ids.js';

const vocab = buildVocabulary();
const p = (s: string) => parse(s, vocab);

describe('parser', () => {
  it('parses a bare verb', () => {
    expect(p('look').is('look')).toBe(true);
    expect(p('look').object).toBeNull();
  });

  it('parses verb plus object', () => {
    const c = p('get whiskey');
    expect(c.verb).toBe('get');
    expect(c.object).toBe(ItemId.Whiskey);
    expect(c.is('get', ItemId.Whiskey)).toBe(true);
  });

  it('discards articles and filler words', () => {
    expect(p('take the rose').is('get', ItemId.Rose)).toBe(true);
    expect(p('please just look at the door').is('look', 'door')).toBe(true);
  });

  it('resolves verb synonyms to one canonical verb', () => {
    for (const s of ['get rose', 'take rose', 'pick up rose', 'grab rose']) {
      expect(p(s).is('get', ItemId.Rose), s).toBe(true);
    }
  });

  it('resolves noun synonyms to one canonical id', () => {
    for (const s of ['get condom', 'get rubber', 'get prophylactic']) {
      expect(p(s).object, s).toBe(ItemId.Condom);
    }
  });

  it('prefers the longest matching phrase', () => {
    expect(p('look under mat').verb).toBe('look under');
    expect(p('look mat').verb).toBe('look');
    expect(p('get disco pass').object).toBe(ItemId.DiscoPass);
    expect(p('turn on radio').verb).toBe('turn on');
    expect(p('turn radio').verb).toBe('turn');
  });

  it('parses an indirect object across a preposition', () => {
    const c = p('give the rose to the girl');
    expect(c.verb).toBe('give');
    expect(c.object).toBe(ItemId.Rose);
    expect(c.preposition).toBe('to');
  });

  it('parses instrument phrasing', () => {
    const c = p('cut rope with knife');
    expect(c.verb).toBe('cut');
    expect(c.object).toBe(ItemId.Rope);
    expect(c.indirect).toBe(ItemId.Knife);
    expect(c.preposition).toBe('with');
  });

  it('reports the first unrecognised word', () => {
    const c = p('frobnicate the wallet');
    expect(c.unknownWord).toBe('frobnicate');
  });

  it('treats an empty line as empty', () => {
    expect(p('   ').isEmpty).toBe(true);
    expect(p('').isEmpty).toBe(true);
  });

  it('handles direction shorthands', () => {
    expect(p('n').verb).toBe('north');
    expect(p('go north').verb).toBe('north');
    expect(p('i').verb).toBe('inventory');
  });

  it('is case and punctuation insensitive', () => {
    expect(p('  GET   the WHISKEY!!! ').is('get', ItemId.Whiskey)).toBe(true);
  });

  it('records every noun mentioned', () => {
    const c = p('give rose to girl');
    expect(c.mentions(ItemId.Rose)).toBe(true);
  });
});
