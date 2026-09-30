import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Compare the palette table in CLAUDE.md against src/palette.ts, parsed as text.

describe('palette', () => {
  it('matches the table in CLAUDE.md exactly', () => {
    const claude = readFileSync('CLAUDE.md', 'utf8');
    const palette = readFileSync('src/palette.ts', 'utf8');
    const fromDoc = [...claude.matchAll(/^\| (\w+) \| #([0-9A-F]{6}) \|/gm)].map(([, n, h]) => [n, h!.toLowerCase()]);
    const fromCode = [...palette.matchAll(/^\s+(\w+): 0x([0-9a-f]{6}),$/gm)].map(([, n, h]) => [n, h]);
    expect(fromDoc).toHaveLength(6);
    expect(fromCode).toEqual(fromDoc);
  });
});
