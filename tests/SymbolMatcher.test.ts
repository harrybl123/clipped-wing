import { describe, expect, it } from 'vitest';
import {
  AUTO_SOLVE_AFTER,
  comparable,
  HINT_AFTER,
  normalise,
  NUDGE_AFTER,
  stem,
  SymbolMatcher,
} from '../src/systems/SymbolMatcher';

// Test-only symbols; real ones will live in src/data.
const SYMBOLS = [
  { id: 'eye', accepted: ['see', 'eye', 'watch'] },
  { id: 'wing', accepted: ['clipped wing', "can't fly"] },
  { id: 'carve', accepted: ['carve'] },
];

describe('normalise', () => {
  it('lowercases, trims, strips punctuation and collapses spaces', () => {
    expect(normalise('  See!  ')).toBe('see');
    expect(normalise('"Clipped,   wing."')).toBe('clipped wing');
    expect(normalise('Can’t fly?')).toBe('cant fly');
  });
});

describe('stem', () => {
  it.each([
    ['see', 'sees', 'seeing'],
    ['carve', 'carves', 'carved', 'carving'],
    ['fly', 'flies', 'flying'],
    ['rest', 'rests', 'rested', 'resting'],
    ['watch', 'watches', 'watched', 'watching'],
    ['rot', 'rots', 'rotted', 'rotting'],
    ['wing', 'wings', 'winged'],
    ['seed', 'seeds'],
    ['eye', 'eyes'],
  ])('treats %s and its variations the same', (...forms) => {
    expect(new Set(forms.map(stem)).size).toBe(1);
  });

  it('leaves short words alone', () => {
    expect(stem('sing')).toBe('sing');
    expect(stem('is')).toBe('is');
  });
});

describe('comparable', () => {
  it('ignores articles', () => {
    expect(comparable('The eye')).toBe(comparable('eye'));
    expect(comparable('a clipped wing')).toBe(comparable('clipped wing'));
  });
});

describe('SymbolMatcher', () => {
  it('accepts any listed word, with case, whitespace, punctuation and simple variations', () => {
    for (const guess of ['see', ' SEE ', 'seeing', 'sees!', 'Eyes', 'the eye', 'watching']) {
      const m = new SymbolMatcher(SYMBOLS);
      expect(m.guess('eye', guess).kind, guess).toBe('correct');
    }
    expect(new SymbolMatcher(SYMBOLS).guess('wing', 'Clipped wings.').kind).toBe('correct');
    expect(new SymbolMatcher(SYMBOLS).guess('wing', 'cant fly').kind).toBe('correct');
    expect(new SymbolMatcher(SYMBOLS).guess('carve', 'carving').kind).toBe('correct');
  });

  it('rejects unrelated words', () => {
    const m = new SymbolMatcher(SYMBOLS);
    expect(m.guess('eye', 'tree').kind).toBe('wrong');
    expect(m.guess('eye', 'seeds').kind).toBe('wrong');
    expect(m.guess('wing', 'wing').kind).toBe('wrong');
  });

  it("records the player's own words as the answer", () => {
    const m = new SymbolMatcher(SYMBOLS);
    expect(m.guess('eye', '  Watching! ')).toEqual({ kind: 'correct', answer: 'Watching!' });
    expect(m.isSolved('eye')).toBe(true);
    expect(m.answer('eye')).toBe('Watching!');
    expect(m.guess('eye', 'see')).toEqual({ kind: 'already-solved', answer: 'Watching!' });
  });

  it('does not count blank guesses', () => {
    const m = new SymbolMatcher(SYMBOLS);
    expect(m.guess('eye', '  ?! ')).toEqual({ kind: 'empty' });
    expect(m.guess('eye', 'the')).toEqual({ kind: 'empty' });
    expect(m.wrongAttempts('eye')).toBe(0);
  });

  it('escalates from nudge to hint to auto-solve, per symbol', () => {
    const m = new SymbolMatcher(SYMBOLS);
    const helps: string[] = [];
    for (let i = 1; i < AUTO_SOLVE_AFTER; i++) {
      const r = m.guess('eye', `wrong ${i}`);
      if (r.kind !== 'wrong') throw new Error(`expected wrong, got ${r.kind}`);
      expect(r.wrongAttempts).toBe(i);
      helps.push(r.help);
    }
    expect(helps.indexOf('nudge') + 1).toBe(NUDGE_AFTER);
    expect(helps.indexOf('hint') + 1).toBe(HINT_AFTER);
    expect(m.helpLevel('eye')).toBe('hint');
    expect(m.helpLevel('wing')).toBe('none');

    expect(m.guess('eye', 'still wrong')).toEqual({ kind: 'auto-solved', wrongAttempts: AUTO_SOLVE_AFTER, answer: 'see' });
    expect(m.answer('eye')).toBe('see');
    expect(m.wrongAttempts('wing')).toBe(0);
  });

  it('has thresholds in increasing order', () => {
    expect(NUDGE_AFTER).toBeLessThan(HINT_AFTER);
    expect(HINT_AFTER).toBeLessThan(AUTO_SOLVE_AFTER);
  });

  it('throws for unknown or badly defined symbols', () => {
    const m = new SymbolMatcher(SYMBOLS);
    expect(() => m.guess('nope', 'x')).toThrow('unknown symbol "nope"');
    expect(() => new SymbolMatcher([{ id: 'a', accepted: [] }])).toThrow('no accepted words');
    expect(() => new SymbolMatcher([{ id: 'a', accepted: ['x'] }, { id: 'a', accepted: ['y'] }])).toThrow('duplicate');
  });

  it('can preset a symbol as solved (an earlier glossary entry)', () => {
    const m = new SymbolMatcher([{ id: 'eye', accepted: ['see'] }]);
    m.preset('eye', 'watch');
    expect(m.isSolved('eye')).toBe(true);
    expect(m.guess('eye', 'see')).toEqual({ kind: 'already-solved', answer: 'watch' });
  });
});
