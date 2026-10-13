import { describe, expect, it } from 'vitest';
import { ARCHIVIST, ELDERS, MASTER, FRIEND, GIRL, GUARD, MUM, PREACHER, PRINCE, PRINCE_CROUCH, PROTAGONIST, RESIDENTS, SCAVENGER, TENDER, VILLAGERS } from '../src/ui/characters';
import { SHADES } from '../src/ui/pixelArt';
import { PORTRAIT_SIZE, SPEAKERS } from '../src/ui/portraits';
import type { RowSprite } from '../src/ui/sprites';
import { CAPITAL_CAST, CITIZENS, COUNCILLORS, COURTIERS, GUARDS, SERVANTS, WATCH } from '../src/ui/capitalFolk';

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
    for (const f of [...MUM.idle, ...TENDER.idle, ...FRIEND.idle, ...GIRL.idle, ...PREACHER.idle, ...MASTER.idle, ...ARCHIVIST.idle, ...GUARD.idle, ...RESIDENTS.flatMap((r) => [...r.idle, ...r.walk]), ...ELDERS.flatMap((e) => e.idle), ...VILLAGERS.flatMap((v) => [...v.idle, ...v.walk])]) {
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

it('gives the archivist grounded, same-size frames with the pale ribbon', () => {
  for (const f of ARCHIVIST.idle) {
    expect(f.rows).toHaveLength(27);
    expect(new Set(f.rows.map((r) => r.length))).toEqual(new Set([13]));
    expect(f.rows.at(-1)).toMatch(/[^.]/);
    expect(f.rows.join('')).toContain('r');
    expect(f.colours.r).toBe(SHADES.white);
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

it('gives the prince same-size, grounded frames, wine on every one, and keeps wine off the others', () => {
  const frames = [...PRINCE.idle, ...PRINCE.walk, PRINCE.jump, PRINCE.fall, PRINCE_CROUCH.idle, ...PRINCE_CROUCH.walk];
  for (const f of frames) {
    expect(f.rows).toHaveLength(26);
    expect(new Set(f.rows.map((r) => r.length))).toEqual(new Set([12]));
    expect(f.rows.join('')).toContain('R');
    expect(f.colours.R).toBe(SHADES.wine);
    expect(Object.values(f.colours)).not.toContain(SHADES.red);
    expect(Object.values(f.colours)).not.toContain(SHADES.copper);
  }
  for (const f of frames.filter((f) => f !== PRINCE.jump)) expect(f.rows.at(-1)).toMatch(/[^.]/);
  for (const f of [...PROTAGONIST.idle, ...SCAVENGER.idle, ...MUM.idle, ...FRIEND.idle, ...GIRL.idle, ...VILLAGERS.flatMap((v) => v.idle)]) {
    expect(Object.values(f.colours)).not.toContain(SHADES.wine);
    expect(Object.values(f.colours)).not.toContain(SHADES.wineDeep);
  }
});

describe("the capital's people (Chapter 3)", () => {
  const groups = { ...Object.fromEntries(Object.entries(CAPITAL_CAST).map(([id, f]) => [id, [f]])), GUARDS, COURTIERS, SERVANTS, COUNCILLORS, WATCH, CITIZENS };
  const frames = Object.entries(groups).flatMap(([name, list]) => list.flatMap((f, i) => [...f.idle, ...f.walk].map((s, j): [string, RowSprite] => [`${name} ${i}.${j}`, s])));
  const reserved = [SHADES.red, SHADES.redDark, SHADES.copper, SHADES.copperDeep, SHADES.wine, SHADES.wineDeep];

  it.each(frames)('%s is well formed, stands on the ground and keeps off the reserved colours', (_name, f) => {
    expect(new Set(f.rows.map((r) => r.length)).size).toBe(1);
    for (const ch of new Set(f.rows.join(''))) if (ch !== '.') expect(f.colours[ch], ch).toBeDefined();
    expect(f.rows.at(-1)).toMatch(/[^.]/);
    const used = new Set(f.rows.join(''));
    for (const [ch, c] of Object.entries(f.colours)) if (used.has(ch)) expect(reserved, ch).not.toContain(c);
  });

  it('gives every capital speaker a portrait free of the reserved colours', () => {
    const ids = [...Object.keys(CAPITAL_CAST), ...Object.keys(SPEAKERS).filter((id) => id.startsWith('c3_'))];
    for (const id of ids) {
      const { portrait } = SPEAKERS[id]!;
      const used = new Set(portrait.rows.join(''));
      for (const [ch, c] of Object.entries(portrait.colours)) if (used.has(ch)) expect(reserved, `${id} ${ch}`).not.toContain(c);
    }
  });
});
