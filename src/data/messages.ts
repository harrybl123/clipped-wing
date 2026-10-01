import type { SymbolDefinition } from '../systems/SymbolMatcher';

// Grounded's messages: tiny plates of pale metal hidden in hollowed birds, each a sentence of
// scratched pictures, one picture per word or phrase (designer). The decoding screen
// (src/scenes/DecodeScene.ts) shows one: you turn the plate in the firelight to find the pictures,
// then type what you think each means. Close but wrong guesses get a warmer reply; after a couple of
// misses a nudge, after a few more a stronger hint (a memory from the story where there is one), and
// after six the picture solves itself (SymbolMatcher). Each solved picture goes into the glossary in
// your own words, kept in ink as glossary_<symbol id>, so a picture you've solved before is already
// filled in on later plates. Little grammar words ("that") are plain marks that fill themselves in.
// Pure data, unit-tested (tests/messages.test.ts). Pictures, words and hints are draft.

export interface DecodeSymbol extends SymbolDefinition {
  /** The picture scratched into the plate: rows of '#' (a scratch) and '.' (bare metal). */
  picture: string[];
  /** Close but wrong guesses, and what your inner voice says to them. */
  near: { words: string[]; reply: string }[];
  /** After a couple of misses. */
  nudge: string;
  /** After a few more: a stronger hint, ideally something you remember from the story. */
  hint: string;
  /** A little word that fills itself in (no guessing): the word shown. */
  given?: string;
}

export interface Message {
  id: string;
  /** The plate's rows in reading order, as symbol ids. A symbol can appear more than once ("I" … "me"); solving it fills every place. */
  rows: string[][];
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

/** A little stick figure standing with its head at (x, 2). */
const figure = (x: number): Point[][] => [ring(x, 2, 2), [[x, 4], [x, 10]], [[x, 10], [x - 2, 13]], [[x, 10], [x + 2, 13]]];

// --- The pictures (one per word). Each symbol can be reused by later messages. ---

const SELF: DecodeSymbol = {
  id: 'self',
  picture: scratches(13, 14, [...figure(5), [[5, 5], [10, 5], [10, 7], [7, 7]], [[5, 5], [2, 9]]]),
  accepted: ['i', 'me', 'myself', 'self', 'my', 'mine', 'im'],
  near: [
    { words: ['person', 'man', 'woman', 'figure', 'human', 'someone', 'body', 'people'], reply: 'Warm. A person. But look where its hand is pointing.' },
    { words: ['you', 'yourself', 'them', 'him', 'her'], reply: "Close. But it isn't pointing at you. It's pointing at itself." },
  ],
  nudge: 'Its hand curls back and points at its own chest.',
  hint: 'Point at your own chest. What do you call the one doing the pointing?',
};

const SEE: DecodeSymbol = {
  id: 'see',
  picture: scratches(17, 9, [[[0, 4], [4, 1], [8, 0], [12, 1], [16, 4]], [[0, 4], [4, 7], [8, 8], [12, 7], [16, 4]], ring(8, 4, 2, 2, 8), [[8, 4]]]),
  accepted: ['see', 'watch', 'look', 'notice', 'observe', 'spot', 'saw', 'seen', 'stare', 'gaze', 'witness', 'spy', 'look at', 'behold'],
  near: [
    { words: ['eye', 'eyes', 'eyeball', 'vision', 'sight', 'pupil', 'iris', 'face'], reply: 'Warm. It is an eye. But what does an eye do?' },
    { words: ['tree', 'tube', 'canopy', 'light', 'sun', 'god', 'gods', 'heaven'], reply: "Cold. It isn't looking up. It's looking straight out of the plate." },
  ],
  nudge: 'An eye, wide open, staring straight out of the metal.',
  hint: 'You remember Mum at the bench, the eye you cut: "There. It\'s looking at you."',
};

const YOU: DecodeSymbol = {
  id: 'you',
  picture: scratches(20, 12, [[[1, 4], [3, 2], [9, 2], [10, 3]], [[10, 3], [18, 3], [19, 4], [18, 5], [10, 5]], [[10, 5], [10, 10], [8, 11], [3, 11], [1, 9], [1, 4]], [[4, 6], [9, 6]], [[4, 8], [9, 8]], [[3, 2], [5, 4], [8, 4]]]),
  accepted: ['you', 'your', 'yourself', 'thee', 'thou', 'ye', 'reader', 'carver'],
  near: [
    { words: ['hand', 'finger', 'point', 'pointing', 'fist', 'arm'], reply: 'Warm. A hand, pointing. But at whom?' },
    { words: ['i', 'me', 'myself', 'self'], reply: "Close. But it isn't pointing back at itself. It's pointing out." },
  ],
  nudge: 'The finger points straight out of the plate. At whoever is holding it.',
  hint: 'Who is holding the plate right now?',
};

const CLIPPED: DecodeSymbol = {
  id: 'clipped',
  picture: scratches(18, 14, [[[0, 8], [6, 8]], [[11, 9], [17, 9]], [[8, 9], [15, 1], [16, 2], [9, 10]], [[9, 10], [6, 13], [5, 12], [8, 9]], [[8, 6]], [[10, 11]]]),
  accepted: ['clipped', 'clip', 'cut', 'cut off', 'snipped', 'severed', 'chopped', 'trimmed', 'sliced', 'lopped', 'broken', 'shortened', 'docked'],
  near: [
    { words: ['knife', 'blade', 'chisel', 'sword', 'tool'], reply: "Warm. A blade. What's it doing to the line?" },
    { words: ['line', 'stick', 'branch', 'thread'], reply: 'Warm. A line, but in two pieces now. What happened to it?' },
  ],
  nudge: 'The blade has gone right through the line. One end has dropped away.',
  hint: 'You remember the knife slipping, and what it did to your hand.',
};

const WING: DecodeSymbol = {
  id: 'wing',
  picture: scratches(18, 12, [[[1, 10], [4, 4], [9, 1], [16, 0]], [[4, 4], [6, 11]], [[7, 2], [9, 11]], [[10, 1], [12, 10]], [[13, 1], [15, 8]], [[16, 0], [17, 5]], [[1, 10], [6, 11], [9, 11], [12, 10], [15, 8], [17, 5]]]),
  accepted: ['wing', 'wings', 'winged'],
  near: [
    { words: ['feather', 'feathers', 'bird', 'birds', 'arm', 'fan', 'leaf'], reply: 'Warm. Part of a bird. Which part?' },
    { words: ['fly', 'flying', 'flight'], reply: "Close. It's what a bird flies with." },
  ],
  nudge: 'Long feathers, all fanning out from one edge.',
  hint: 'You remember your bench this morning: "The left wing a little heavy."',
};

const SEND: DecodeSymbol = {
  id: 'send',
  picture: scratches(20, 14, [...figure(3), [[3, 6], [7, 6]], [[7, 6], [19, 6]], [[16, 3], [19, 6], [16, 9]]]),
  accepted: ['send', 'sent', 'give', 'offer', 'deliver', 'pass', 'post', 'throw', 'hand over', 'pass on', 'dispatch', 'gift'],
  near: [
    { words: ['arrow', 'away', 'go', 'leave', 'up', 'out', 'away from'], reply: 'Warm. Something going away from someone. Like an offering, going up the tube.' },
    { words: ['tube', 'rite', 'basket'], reply: 'Close. Not where it goes. What you do with it.' },
  ],
  nudge: 'Someone, and an arrow leaving their hand.',
  hint: 'Every morning the tree does this with its best work: up the tube it goes.',
};

const NEW: DecodeSymbol = {
  id: 'new',
  picture: scratches(16, 14, [[[2, 8], [2, 10], [4, 13], [11, 13], [13, 10], [13, 8]], [[2, 8], [4, 6], [6, 8], [8, 5], [10, 8], [12, 6], [13, 8]], [[3, 3], [5, 1], [8, 0], [11, 1], [12, 3]], [[3, 3], [5, 2], [7, 3], [9, 2], [12, 3]], [[1, 4]], [[14, 4]]]),
  accepted: ['new', 'fresh', 'born', 'newborn', 'hatch', 'hatched', 'young', 'begin', 'beginning', 'start', 'birth', 'brand new'],
  near: [
    { words: ['egg', 'eggs', 'shell', 'crack', 'cracked', 'broken', 'open'], reply: "Warm. An egg, just broken open. What's it like, whatever comes out?" },
    { words: ['old'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'An egg that has only just cracked open.',
  hint: 'You remember being small at the bench, and Mum: "There. Your very first bird." Something just made.',
};

const LIFE: DecodeSymbol = {
  id: 'life',
  picture: scratches(14, 14, [[[7, 13], [7, 5]], [[7, 9], [4, 7], [2, 7], [3, 9], [7, 10]], [[7, 6], [10, 3], [12, 3], [11, 5], [7, 7]], [[2, 13], [12, 13]]]),
  accepted: ['life', 'alive', 'living', 'live', 'lives', 'grow', 'growing', 'growth'],
  near: [
    { words: ['plant', 'sprout', 'seed', 'leaf', 'leaves', 'shoot', 'tree', 'root', 'roots', 'fungus', 'flower'], reply: 'Warm. A shoot, growing. What does growing mean it has?' },
    { words: ['death', 'dead', 'die'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'A shoot pushing up out of the ground.',
  hint: 'Every root and fungus down here has it. So do you, still.',
};

const THAT: DecodeSymbol = {
  id: 'that',
  picture: scratches(7, 5, [[[0, 2], [6, 2]], [[3, 0], [3, 4]]]),
  accepted: ['that'],
  near: [],
  nudge: '',
  hint: '',
  given: 'that',
};

const CANT: DecodeSymbol = {
  id: 'cant',
  picture: scratches(12, 12, [[[1, 1], [10, 10]], [[2, 1], [11, 10]], [[10, 1], [1, 10]], [[11, 1], [2, 10]]]),
  accepted: ['cant', 'cannot', 'can not', 'no', 'not', 'unable', 'never', 'wont', 'dont', 'impossible', 'unable to'],
  near: [
    { words: ['cross', 'x', 'kiss', 'mark', 'stop', 'wrong', 'cross out'], reply: 'Warm. A cross. What does it mean when you cross something out?' },
    { words: ['can', 'yes'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'Two strokes, crossing something out.',
  hint: "Cross a thing out and it isn't. It won't be. It ____ be.",
};

const FLY: DecodeSymbol = {
  id: 'fly',
  picture: scratches(22, 12, [[[11, 6], [7, 2], [3, 1], [0, 3]], [[11, 6], [15, 2], [19, 1], [21, 3]], [[0, 3], [4, 4], [7, 5], [11, 7], [15, 5], [18, 4], [21, 3]], [[3, 1], [4, 4]], [[7, 2], [7, 5]], [[15, 2], [15, 5]], [[19, 1], [18, 4]], ring(11, 4, 1, 1, 6), [[11, 7], [11, 9]], [[11, 9], [10, 11]], [[11, 9], [12, 11]]]),
  accepted: ['fly', 'flying', 'flight', 'flies', 'flew', 'flown', 'soar', 'soaring', 'glide', 'take off'],
  near: [
    { words: ['bird', 'birds', 'wing', 'wings', 'feather'], reply: 'Warm. A bird, wings wide open. What is it doing?' },
    { words: ['rise', 'rising', 'up', 'ascend', 'ascension'], reply: 'Close. Rising, but not up a tube. On its own wings.' },
  ],
  nudge: 'A bird with both wings spread, up in the air.',
  hint: 'Mum\'s voice at the bench: "Hold it gently, like it might fly off."',
};

/** Message 1 (Day 2): "I see you, clipped wing. Send me new life that can't fly." */
export const MESSAGE_1: Message = {
  id: 'message1',
  line: "I see you, clipped wing. Send me new life that can't fly.",
  rows: [
    ['self', 'see', 'you', 'clipped', 'wing'],
    ['send', 'self', 'new', 'life', 'that', 'cant', 'fly'],
  ],
  symbols: [SELF, SEE, YOU, CLIPPED, WING, SEND, NEW, LIFE, THAT, CANT, FLY],
};

export const MESSAGES: Record<string, Message> = { [MESSAGE_1.id]: MESSAGE_1 };
