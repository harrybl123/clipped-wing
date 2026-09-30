import Phaser from 'phaser';

// PROTOTYPE: a tiny hand-drawn pixel font (5×7 caps, lowercase with descenders), drawn
// white so it can be tinted. Missing characters render as a hollow box.

const G: Record<string, string[]> = {
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  a: ['....', '....', '.###', '...#', '.###', '#..#', '.###'],
  b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'],
  c: ['....', '....', '.###', '#...', '#...', '#...', '.###'],
  d: ['...#', '...#', '.###', '#..#', '#..#', '#..#', '.###'],
  e: ['....', '....', '.##.', '#..#', '####', '#...', '.###'],
  f: ['..##', '.#..', '###.', '.#..', '.#..', '.#..', '.#..'],
  g: ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'],
  i: ['#', '.', '#', '#', '#', '#', '#'],
  k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  l: ['#.', '#.', '#.', '#.', '#.', '#.', '.#'],
  m: ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#'],
  o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.'],
  p: ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  r: ['...', '...', '#.#', '##.', '#..', '#..', '#..'],
  s: ['....', '....', '.###', '#...', '.##.', '...#', '###.'],
  t: ['...', '.#.', '###', '.#.', '.#.', '.#.', '..#'],
  u: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###'],
  w: ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['...', '...', '#.#', '#.#', '.#.', '#.#', '#.#'],
  y: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'],
  ']': ['##', '.#', '.#', '.#', '.#', '.#', '##'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};
const MISSING = ['###', '#.#', '#.#', '#.#', '#.#', '#.#', '###'];
const ROWS = 9; // 7 + 2 descender rows

export function measure(text: string, scale = 1): { width: number; height: number } {
  const width = [...text].reduce((w, ch) => w + ((G[ch] ?? MISSING)[0]!.length + 1), -1);
  return { width: Math.max(0, width) * scale, height: ROWS * scale };
}

/** Creates (once) a white texture for `text` and returns its key. */
export function textTexture(scene: Phaser.Scene, text: string, scale = 1): string {
  const key = `pixel-text:${scale}:${text}`;
  if (scene.textures.exists(key)) return key;
  const { width, height } = measure(text, scale);
  const tex = scene.textures.createCanvas(key, Math.max(1, width), height)!;
  const ctx = tex.getContext();
  ctx.fillStyle = '#ffffff';
  let x = 0;
  for (const ch of text) {
    const glyph = G[ch] ?? MISSING;
    glyph.forEach((row, y) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect((x + i) * scale, y * scale, scale, scale);
    });
    x += glyph[0]!.length + 1;
  }
  tex.refresh();
  return key;
}

/** A tinted pixel-text image with its top-left at (x, y). */
export function pixelText(scene: Phaser.Scene, x: number, y: number, text: string, color: number, scale = 1): Phaser.GameObjects.Image {
  return scene.add.image(x, y, textTexture(scene, text, scale)).setOrigin(0).setTint(color);
}
