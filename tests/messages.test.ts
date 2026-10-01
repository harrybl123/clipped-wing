import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileInk } from '../scripts/ink.mjs';
import { glossaryVariable, MESSAGES, REPLY_SETS, scratches } from '../src/data/messages';
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
    expect(message.rows.length).toBeLessThanOrEqual(2); // the plate has two rows
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

describe('message 3', () => {
  it('has a version for each reply to message 2, all ending the same way', () => {
    for (const { value: reply } of REPLY_SETS.reply2!.options) {
      const message = MESSAGES[`message3_${reply}`];
      expect(message, reply).toBeDefined();
      expect(message!.line).toMatch(/I am Grounded\. There are many of us beyond the bark\.$/);
      expect(message!.rows.flat().slice(-6)).toEqual(['self', 'am', 'grounded', 'many', 'beyond', 'bark']);
    }
  });

  it('accepts his name, and the words for the new pictures', () => {
    const matcher = new SymbolMatcher(MESSAGES.message3_why!.symbols);
    expect(matcher.guess('grounded', 'Grounded').kind).toBe('correct');
    expect(matcher.guess('because', 'because').kind).toBe('correct');
    expect(matcher.guess('carve', 'carving').kind).toBe('correct');
    expect(matcher.guess('many', 'many of us').kind).toBe('correct');
    expect(new SymbolMatcher(MESSAGES.message3_yes!.symbols).guess('yet', 'yet').kind).toBe('correct');
    expect(new SymbolMatcher(MESSAGES.message3_cant!.symbols).guess('also', 'neither').kind).toBe('correct');
  });
});

describe('replies', () => {
  it('offers three well-formed pictures per set, each filling a variable that exists in ink', () => {
    const story = new StoryBridge(readFileSync(compileInk().outFile, 'utf8'));
    for (const [id, set] of Object.entries(REPLY_SETS)) {
      expect(set.options, id).toHaveLength(3);
      expect(story.variableNames()).toContain(set.variable);
      for (const o of set.options) expect(new Set(o.picture.map((r) => r.length)).size, `${id} ${o.value}`).toBe(1);
    }
  });
});

describe('message 4', () => {
  it('reads like message 1, but new life is a seed', () => {
    expect(MESSAGES.message4!.line).toBe(MESSAGES.message1!.line.replace('I see you, clipped wing. ', 'Clipped wing, ').replace('Send', 'send'));
    expect(new SymbolMatcher(MESSAGES.message4!.symbols).guess('seed', 'seed').kind).toBe('correct');
  });
});
