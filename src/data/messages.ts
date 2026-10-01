import type { SymbolDefinition } from '../systems/SymbolMatcher';

// Grounded's messages: tiny plates of pale metal hidden in hollowed birds, each a row of scratched
// pictures (design doc, "Decoding the messages"). The decoding screen (src/scenes/DecodeScene.ts)
// shows one: you turn the plate in the firelight to find each picture, then type what you think it
// means. Wrong guesses that are close get a warmer reply; after a couple of misses a nudge, after a
// few more a memory from the story, and after six the picture solves itself (SymbolMatcher). Each
// solved picture goes into the glossary in your own words, kept in ink as glossary_<symbol id>.
// Pure data, unit-tested (tests/messages.test.ts). Words and hints are draft, for the designer.

export interface DecodeSymbol extends SymbolDefinition {
  /** The picture scratched into the plate: rows of '#' (a scratch) and '.' (bare metal). */
  picture: string[];
  /** How far the plate must be turned (-1 fully left … 1 fully right) for this picture to catch the firelight. */
  glint: number;
  /** Close but wrong guesses, and what your inner voice says to them. */
  near: { words: string[]; reply: string }[];
  /** After a couple of misses. */
  nudge: string;
  /** After a few more: something you remember from the story that points the way. */
  memory: string;
}

export interface Message {
  id: string;
  /** Left to right on the plate. */
  symbols: DecodeSymbol[];
  /** The whole line, as your inner voice reads it once every picture is solved. */
  line: string;
}

/** The ink variable holding a symbol's glossary entry. */
export const glossaryVariable = (symbolId: string) => `glossary_${symbolId}`;

type Point = [number, number];

/**
 * Draws a picture as scratches: each stroke is a list of points joined by straight lines
 * (Bresenham), on a `width` × `height` grid.
 */
export function scratches(width: number, height: number, strokes: Point[][]): string[] {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill('.'));
  const plot = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < width && y < height) grid[y]![x] = '#';
  };
  for (const stroke of strokes) {
    if (stroke.length === 1) plot(...stroke[0]!);
    for (let i = 1; i < stroke.length; i++) {
      let [x0, y0] = stroke[i - 1]!;
      const [x1, y1] = stroke[i]!;
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        plot(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
    }
  }
  return grid.map((row) => row.join(''));
}

/** A closed ring of points around (cx, cy), for eyes and heads. */
function ring(cx: number, cy: number, rx: number, ry = rx, steps = 12): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)] as Point;
  });
}

/** Message 1 (Day 2): "I see you, clipped wing. Send me new life that can't fly." An eye, a clipped-wing bird, a clipped-wing fledgling. */
export const MESSAGE_1: Message = {
  id: 'message1',
  line: "I see you, clipped wing. Send me new life that can't fly.",
  symbols: [
    {
      id: 'eye',
      picture: scratches(25, 13, [
        [[1, 6], [6, 2], [12, 1], [18, 2], [23, 6]],
        [[1, 6], [6, 10], [12, 11], [18, 10], [23, 6]],
        ring(12, 6, 3),
        [[11, 6], [13, 6]],
        [[12, 5], [12, 7]],
      ]),
      glint: -0.65,
      accepted: ['see', 'watch', 'look', 'notice', 'observe', 'spot', 'saw', 'seen', 'stare', 'gaze', 'witness', 'spy', 'look at', 'watching you', 'see you'],
      near: [
        { words: ['eye', 'eyes', 'eyeball', 'vision', 'sight', 'pupil', 'iris', 'face'], reply: 'Warm. It is an eye. But what does an eye do?' },
        { words: ['tree', 'tube', 'canopy', 'light', 'sun', 'god', 'heaven'], reply: "Cold. It isn't looking up. It's looking straight out of the plate." },
      ],
      nudge: 'It stares straight out of the metal, right at you.',
      memory: 'You remember Mum at the bench, the eye you cut: "There. It\'s looking at you."',
    },
    {
      id: 'clipped_bird',
      picture: scratches(26, 16, [
        [[7, 8], [1, 6]],
        [[7, 9], [1, 10]],
        [[6, 8], [10, 6], [16, 6], [19, 5]],
        [[6, 8], [9, 10], [15, 11], [19, 9], [20, 7]],
        ring(21, 5, 2),
        [[23, 5], [25, 6], [23, 6]],
        [[10, 7], [12, 3], [15, 3], [16, 6]],
        [[12, 1], [13, 0]],
        [[15, 1], [16, 0]],
        [[13, 11], [13, 14]],
        [[16, 11], [16, 14]],
        [[12, 14], [14, 14]],
        [[15, 14], [17, 14]],
      ]),
      glint: 0,
      accepted: ['clipped wing', 'clipped', 'clipped bird', 'you', 'me', 'myself', 'carver', 'the carver', 'cut wing', 'broken wing', 'broken bird', 'hurt bird', 'wounded bird', 'injured bird', 'damaged bird', 'flightless', 'cant fly', 'cannot fly', 'short wing'],
      near: [
        { words: ['bird', 'birds', 'offering', 'carving', 'sparrow', 'wing', 'wings', 'feather'], reply: 'Warm. A bird, yes. Look at its wing.' },
        { words: ['fly', 'flying', 'flight', 'soar', 'rise', 'rising'], reply: "Warm. But it isn't flying. It couldn't." },
        { words: ['mum', 'mother', 'tender', 'friend', 'someone', 'person'], reply: 'Close. It stands for someone. Who carves birds with a heavy wing?' },
      ],
      nudge: 'One wing is short. Cut off clean, as if it was clipped.',
      memory: 'You remember this morning, at your bench: "The left wing a little heavy." Your birds. Your hand.',
    },
    {
      id: 'fledgling',
      picture: scratches(20, 16, [
        [[5, 6], [2, 5]],
        [[5, 6], [8, 5], [11, 5]],
        [[5, 6], [7, 8], [11, 8], [13, 7]],
        ring(13, 5, 2),
        [[15, 5], [17, 6], [15, 6]],
        [[8, 6], [9, 3], [11, 4]],
        [[9, 1], [10, 0]],
        [[3, 15], [4, 11], [6, 13], [8, 10], [10, 13], [12, 10], [14, 13], [16, 11], [17, 15]],
        [[3, 15], [17, 15]],
      ]),
      glint: 0.65,
      accepted: ['fledgling', 'chick', 'baby bird', 'young bird', 'baby', 'hatchling', 'nestling', 'new life', 'life', 'newborn', 'young', 'youngster', 'little bird', 'small bird', 'child', 'offspring', 'new bird', 'hatched', 'birth'],
      near: [
        { words: ['bird', 'birds', 'sparrow', 'small', 'little', 'tiny'], reply: "Warm. A bird, but a very small one. Look at what it's sitting in." },
        { words: ['egg', 'eggs', 'shell', 'nest'], reply: "Warm. A broken shell, and something just out of it." },
        { words: ['clipped', 'clipped wing', 'you', 'me', 'carver'], reply: "Its wing is clipped too. But it's smaller. Newer." },
      ],
      nudge: 'It sits in the broken pieces of a shell.',
      memory: 'You remember being small at the bench, and Mum: "There. Your very first bird." Something new, just made.',
    },
  ],
};

export const MESSAGES: Record<string, Message> = { [MESSAGE_1.id]: MESSAGE_1 };
