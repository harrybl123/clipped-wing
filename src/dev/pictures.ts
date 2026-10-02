// DEV ONLY (pictures.html, not part of the build): every picture on Grounded's plates beside its word,
// each plate as you decode it, and the pictures you scratch back, for judging the pictures.
// Plain canvas, no Phaser.

import { MESSAGES, REPLY_SETS, type DecodeSymbol } from '../data/messages';

const METAL = '#d8d2c2';
const SCRATCH = '#2a221b';

/** A picture drawn as scratches on pale metal, enlarged. */
function picture(rows: string[], scale: number): HTMLCanvasElement {
  const pad = 2;
  const canvas = document.createElement('canvas');
  canvas.width = (rows[0]!.length + pad * 2) * scale;
  canvas.height = (rows.length + pad * 2) * scale;
  const g = canvas.getContext('2d')!;
  g.fillStyle = METAL;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = SCRATCH;
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && g.fillRect((x + pad) * scale, (y + pad) * scale, scale, scale)));
  return canvas;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function figure(rows: string[], scale: number, word: string, also = '', used = ''): HTMLElement {
  const f = el('figure');
  f.append(picture(rows, scale), el('figcaption', 'word', word));
  if (also) f.append(el('div', 'also', also));
  if (used) f.append(el('div', 'used', used));
  return f;
}

const root = document.getElementById('pictures')!;
const messages = Object.values(MESSAGES);

// 1. Every picture once, in the order you first meet it, with the words it accepts.
root.append(el('h2', '', 'Every picture he sends'));
const symbols = new Map<string, { symbol: DecodeSymbol; in: string[] }>();
for (const m of messages) {
  for (const s of m.symbols) {
    const entry = symbols.get(s.id) ?? { symbol: s, in: [] };
    entry.in.push(m.id);
    symbols.set(s.id, entry);
  }
}
const grid = el('div', 'grid');
for (const { symbol, in: usedIn } of symbols.values()) {
  const word = symbol.given ?? symbol.accepted[0]!;
  const also = symbol.given ? '(fills itself in)' : symbol.accepted.slice(1, 6).join(', ');
  const first = usedIn[0]!.replace(/^message/, 'message ').replace(/_/g, ' ');
  grid.append(figure(symbol.picture, 5, word, also, `first: ${first}`));
}
root.append(grid);

// 2. Each plate as you see it: the pictures in their rows, each with its word.
root.append(el('h2', '', 'The plates'));
for (const m of messages) {
  root.append(el('h3', '', m.id), el('p', 'line', `"${m.line}"`));
  const plate = el('div', 'plate');
  const byId = new Map(m.symbols.map((s) => [s.id, s]));
  for (const row of m.rows) {
    const r = el('div', 'row');
    for (const id of row) {
      const s = byId.get(id)!;
      r.append(figure(s.picture, 3, s.given ?? s.accepted[0]!));
    }
    plate.append(r);
  }
  root.append(plate);
}

// 3. Your replies, scratched on the back of his plate.
root.append(el('h2', '', 'Your replies'));
const REPLY_WORDS: Record<string, string> = {
  yes: 'yes', cant: "I can't", why: 'why?', who: 'who are you?', take: 'take me', watched: "I'm being watched",
  blame: 'they blame me', help: 'help me', todo: 'what do I do?', caged: "I'm trapped",
};
for (const [id, set] of Object.entries(REPLY_SETS)) {
  root.append(el('h3', '', `${id} (fills ${set.variable})`));
  const r = el('div', 'grid');
  if (set.after) r.append(figure(set.after, 4, 'already on the plate', 'they blame me'));
  for (const o of set.options) r.append(figure(o.picture, 4, id === 'ask' && o.value === 'why' ? 'why me?' : (REPLY_WORDS[o.value] ?? o.value)));
  root.append(r);
}
