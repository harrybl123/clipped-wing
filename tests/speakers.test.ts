import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPEAKERS } from '../src/ui/portraits';

// Everyone you speak to has a face (designer, 2026-10-01). Every line of speech in the ink carries a
// `#speaker:` tag with a portrait. A few voices are faceless on purpose (`#name:` alone), and lines that
// only quote words, like a message being read, are marked `#quote`. The prologue is faceless throughout.

const STORY = join(__dirname, '..', 'story');
const FACELESS = new Set(['A voice', 'Your friend']); // the curtain on Day 6; the shutter on Day 7
const files = readdirSync(STORY).filter((f) => f.endsWith('.ink') && f !== 'prologue.ink');

interface Line { file: string; n: number; text: string; tags: string[] }

const lines: Line[] = files.flatMap((file) =>
  readFileSync(join(STORY, file), 'utf8').split('\n').map((raw, i) => {
    const code = raw.replace(/\/\/.*$/, '');
    const [text = '', ...tags] = code.split('#');
    return { file, n: i + 1, text: text.trim(), tags: tags.map((t) => t.trim()) };
  }),
);

/** The content of a line once its choice or gather markers are gone, or null for a bare choice or logic. */
function content(text: string): string | null {
  if (/^(~|VAR|=|INCLUDE|->)/.test(text)) return null;
  let s = text.replace(/^[*+\-\s]+/, '').replace(/^\([a-z_]+\)\s*/, '');
  if (s.startsWith('[')) {
    const close = s.indexOf(']');
    s = close === -1 ? '' : s.slice(close + 1).trim(); // the choice's own text is yours, shown as a choice
  }
  if (/^"[^"]*":/.test(s)) return null; // a switch case
  return s;
}

/** Speech: the line opens with a quote (or a sequence of quotes). */
const isSpeech = (s: string) => /^\{[~&!]?"/.test(s) || s.startsWith('"');

describe('speakers', () => {
  it('every line of speech has a face', () => {
    const missing = lines
      .filter((l) => {
        const s = content(l.text);
        if (!s || !isSpeech(s)) return false;
        if (l.tags.some((t) => t.startsWith('speaker:') || t === 'quote')) return false;
        const name = l.tags.find((t) => t.startsWith('name:'))?.slice('name:'.length);
        return !(name && FACELESS.has(name));
      })
      .map((l) => `${l.file}:${l.n}  ${l.text.slice(0, 70)}`);
    expect(missing).toEqual([]);
  });

  it('every #speaker: has a portrait', () => {
    const unknown = lines.flatMap((l) => l.tags.filter((t) => t.startsWith('speaker:') && !(t.slice(8) in SPEAKERS)).map((t) => `${l.file}:${l.n} ${t}`));
    expect(unknown).toEqual([]);
  });

  it('#name: alone is only for the faceless voices', () => {
    const named = lines.filter((l) => !l.tags.some((t) => t.startsWith('speaker:'))).flatMap((l) => l.tags.filter((t) => t.startsWith('name:')).map((t) => t.slice(5)));
    expect(named.filter((n) => !FACELESS.has(n))).toEqual([]);
  });
});
