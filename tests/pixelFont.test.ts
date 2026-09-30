import { describe, expect, it } from 'vitest';
import { definedCharacters, drawLine, glyphFor, GLYPH_ROWS, hasGlyph, layout, LINE_HEIGHT, measure, normaliseText, wrap } from '../src/ui/pixelFont';

describe('pixel font', () => {
  it('has well-formed glyphs: equal-width rows, 7 rows or 9 with descenders', () => {
    for (const ch of definedCharacters()) {
      const glyph = glyphFor(ch);
      expect([7, GLYPH_ROWS], `rows of ${JSON.stringify(ch)}`).toContain(glyph.length);
      expect(new Set(glyph.map((row) => row.length)).size, `widths of ${JSON.stringify(ch)}`).toBe(1);
      expect(glyph.every((row) => /^[#.]+$/.test(row))).toBe(true);
    }
  });

  it('covers all letters, digits and the punctuation the game uses', () => {
    const needed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?:;\'"`-_=+/()[]<>·';
    expect([...needed].filter((ch) => !hasGlyph(ch))).toEqual([]);
  });

  it('turns typographic characters into ones it has', () => {
    expect(normaliseText('‘It’s “here”… — ok')).toBe('\'It\'s "here"... - ok');
  });

  it('measures lines with a 1px gap between glyphs', () => {
    expect(measure('')).toBe(0);
    expect(measure('A')).toBe(5);
    expect(measure('AA')).toBe(11);
    expect(measure('il')).toBe(1 + 1 + 2);
  });

  it('wraps at spaces within the width, and on newlines', () => {
    expect(wrap('aa bb cc', measure('aa bb'))).toEqual(['aa bb', 'cc']);
    const text = 'the quick brown fox jumps over the lazy dog';
    const lines = wrap(text, 40);
    expect(lines.join(' ')).toBe(text);
    expect(lines.every((l) => measure(l) <= 40)).toBe(true);
    expect(wrap('one\ntwo')).toEqual(['one', 'two']);
  });

  it('keeps a word longer than the width on its own line', () => {
    expect(wrap('a extraordinarily b', 20)).toEqual(['a', 'extraordinarily', 'b']);
  });

  it('lays out wrapped text with a fixed line height', () => {
    const { lines, width, height } = layout('aa bb', measure('aa'));
    expect(lines).toEqual(['aa', 'bb']);
    expect(width).toBe(measure('aa'));
    expect(height).toBe(LINE_HEIGHT + GLYPH_ROWS);
  });

  it('draws ink pixels at the given scale', () => {
    const rects: number[][] = [];
    drawLine({ fillRect: (...r) => rects.push(r) }, '.', 10, 20, 2);
    expect(rects).toEqual([[10, 20 + 6 * 2, 2, 2]]);
  });
});
