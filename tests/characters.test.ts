import { describe, expect, it } from 'vitest';
import { ELDERS, FRIEND, GIRL, MUM, PREACHER, PROTAGONIST, TENDER, VILLAGERS } from '../src/ui/characters';
import { SHADES } from '../src/ui/pixelArt';
import { PORTRAIT_SIZE, SPEAKERS } from '../src/ui/portraits';
import type { RowSprite } from '../src/ui/sprites';

const frames: [string, RowSprite][] = [
  ...PROTAGONIST.idle.map((f, i) => [`idle ${i}`, f] as [string, RowSprite]),
  ...PROTAGONIST.walk.map((f, i) => [`walk ${i}`, f] as [string, RowSprite]),
  ['jump', PROTAGONIST.jump],
  ['fall', PROTAGONIST.fall],
];

describe('character sprites', () => {
  it('gives every protagonist frame the same size, with well-formed rows', () => {
    for (const [name, f] of frames) {
      expect(f.rows.length, name).toBe(26);
      expect(new Set(f.rows.map((r) => r.length)), name).toEqual(new Set([12]));
    }
  });

  it('stands the protagonist on the bottom row in every grounded frame', () => {
    for (const [name, f] of frames.filter(([n]) => n !== 'jump')) expect(f.rows.at(-1), name).toMatch(/[^.]/);
  });

  it('includes the red thread and the bandaged hand in every frame', () => {
    for (const [name, f] of frames) {
      const pixels = f.rows.join('');
      expect(pixels, name).toContain('r');
      expect(pixels, name).toContain('h');
      expect(f.colours.r).toBe(SHADES.red);
    }
  });

  it('keeps red off everyone else', () => {
    for (const f of [...MUM.idle, ...TENDER.idle, ...FRIEND.idle, ...GIRL.idle, ...PREACHER.idle, ...ELDERS.flatMap((e) => e.idle), ...VILLAGERS.flatMap((v) => [...v.idle, ...v.walk])]) {
      expect(Object.values(f.colours)).not.toContain(SHADES.red);
      expect(new Set(f.rows.map((r) => r.length)).size).toBe(1);
    }
  });
});

it('gives the friend grounded, same-size frames with the tube token and blond hair', () => {
  for (const f of FRIEND.idle) {
    expect(f.rows).toHaveLength(25);
    expect(new Set(f.rows.map((r) => r.length))).toEqual(new Set([12]));
    expect(f.rows.at(-1)).toMatch(/[^.]/);
    expect(f.rows.join('')).toContain('q');
    expect(f.colours.q).toBe(SHADES.cyan);
    expect(f.colours.Y).toBe(SHADES.amber);
  }
});

it('gives the girl grounded, same-size frames with her glowing green strand', () => {
  for (const f of GIRL.idle) {
    expect(f.rows).toHaveLength(24);
    expect(new Set(f.rows.map((r) => r.length))).toEqual(new Set([12]));
    expect(f.rows.at(-1)).toMatch(/[^.]/);
    expect(f.rows.join('')).toContain('g');
    expect(f.colours.g).toBe(SHADES.green);
  }
});

describe('portraits', () => {
  it.each(Object.entries(SPEAKERS))('%s is a square, fully coloured portrait', (_id, { portrait }) => {
    expect(portrait.rows).toHaveLength(PORTRAIT_SIZE);
    expect(new Set(portrait.rows.map((r) => r.length))).toEqual(new Set([PORTRAIT_SIZE]));
    const unknown = [...new Set(portrait.rows.join(''))].filter((ch) => ch !== '.' && !(ch in portrait.colours));
    expect(unknown).toEqual([]);
  });

  it('keeps red on the protagonist only', () => {
    expect(SPEAKERS.you!.portrait.rows.join('')).toContain('r');
    for (const id of Object.keys(SPEAKERS).filter((id) => id !== 'you')) expect(SPEAKERS[id]!.portrait.rows.join(''), id).not.toContain('r');
  });
});
