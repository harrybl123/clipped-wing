import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileInk } from '../scripts/ink.mjs';
import { glossaryVariable, MESSAGES, scratches } from '../src/data/messages';
import { StoryBridge } from '../src/systems/StoryBridge';
import { comparable, SymbolMatcher } from '../src/systems/SymbolMatcher';

describe('scratches', () => {
  it('joins the points of each stroke with straight lines', () => {
    expect(scratches(5, 3, [[[0, 0], [4, 0]], [[2, 2]]])).toEqual(['#####', '.....', '..#..']);
    expect(scratches(3, 3, [[[0, 0], [2, 2]]])).toEqual(['#..', '.#.', '..#']);
  });
});

describe.each(Object.values(MESSAGES))('message $id', (message) => {
  it('has well-formed pictures', () => {
    for (const s of message.symbols) {
      expect(new Set(s.picture.map((r) => r.length)).size, s.id).toBe(1);
      expect(s.picture.join('').replace(/[.#]/g, ''), s.id).toBe('');
      expect(s.picture.join('').split('#').length - 1, s.id).toBeGreaterThan(10);
    }
  });

  it('lays out the plate in rows of known symbols, using every symbol, small enough to fit', () => {
    const ids = new Set(message.symbols.map((s) => s.id));
    const used = new Set(message.rows.flat());
    for (const id of used) expect(ids.has(id), id).toBe(true);
    expect([...ids].filter((id) => !used.has(id))).toEqual([]);
    for (const row of message.rows) expect(row.length).toBeLessThanOrEqual(7);
    for (const s of message.symbols) expect(s.picture[0]!.length <= 26 && s.picture.length <= 20, s.id).toBe(true);
  });

  it('never lists a word as both near and right', () => {
    for (const s of message.symbols) {
      const accepted = new Set(s.accepted.map(comparable));
      for (const near of s.near) for (const w of near.words) expect(accepted.has(comparable(w)), `${s.id}: ${w}`).toBe(false);
    }
  });

  it('has a glossary variable in ink for every symbol', () => {
    const result = compileInk();
    const story = new StoryBridge(readFileSync(result.outFile, 'utf8'));
    for (const s of message.symbols) if (!s.given) expect(story.variableNames()).toContain(glossaryVariable(s.id));
  });
});

describe('message 1', () => {
  it('accepts the words the design doc gives (the eye: see, watch, look, notice), and others like them', () => {
    const symbols = MESSAGES.message1!.symbols;
    for (const w of ['see', 'watching', 'Looks', 'noticed']) expect(new SymbolMatcher(symbols).guess('see', w).kind, w).toBe('correct');
    const matcher = new SymbolMatcher(symbols);
    expect(matcher.guess('self', 'I').kind).toBe('correct');
    expect(matcher.guess('cant', "can't").kind).toBe('correct');
    expect(matcher.guess('clipped', 'cut off').kind).toBe('correct');
    expect(matcher.guess('fly', 'flying').kind).toBe('correct');
  });
});
