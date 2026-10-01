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

  it('spreads the glints out across the turn, so each picture catches the light on its own', () => {
    const glints = message.symbols.map((s) => s.glint).sort((a, b) => a - b);
    for (const g of glints) expect(Math.abs(g)).toBeLessThanOrEqual(0.8);
    for (let i = 1; i < glints.length; i++) expect(glints[i]! - glints[i - 1]!).toBeGreaterThanOrEqual(0.5);
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
    for (const s of message.symbols) expect(story.variableNames()).toContain(glossaryVariable(s.id));
  });
});

describe('message 1', () => {
  it('accepts the words the design doc gives (the eye: see, watch, look, notice), and others like them', () => {
    const symbols = MESSAGES.message1!.symbols;
    for (const w of ['see', 'watching', 'Looks', 'noticed']) expect(new SymbolMatcher(symbols).guess('eye', w).kind, w).toBe('correct');
    const matcher = new SymbolMatcher(symbols);
    expect(matcher.guess('clipped_bird', "can't fly").kind).toBe('correct');
    expect(matcher.guess('fledgling', 'a baby bird').kind).toBe('correct');
  });
});
