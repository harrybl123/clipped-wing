import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// config.ts imports Phaser, which needs a browser; read the palette table from CLAUDE.md instead
// and compare against the constants by parsing config.ts as text.
describe('palette', () => {
  it('matches the table in CLAUDE.md exactly', () => {
    const claude = readFileSync('CLAUDE.md', 'utf8');
    const config = readFileSync('src/config.ts', 'utf8');
    const fromDoc = [...claude.matchAll(/^\| (\w+) \| #([0-9A-F]{6}) \|/gm)].map(([, n, h]) => [n, h!.toLowerCase()]);
    const fromCode = [...config.matchAll(/^\s+(\w+): 0x([0-9a-f]{6}),$/gm)].map(([, n, h]) => [n, h]);
    expect(fromDoc).toHaveLength(6);
    expect(fromCode).toEqual(fromDoc);
  });
});
