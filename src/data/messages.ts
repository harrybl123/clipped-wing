import type { SymbolDefinition } from '../systems/SymbolMatcher';

// Grounded's messages: tiny plates of pale metal hidden in hollowed birds, each a sentence of
// scratched pictures, one picture per word or phrase (designer). The decoding screen
// (src/scenes/DecodeScene.ts) shows one: you rub the soot off the plate to find the pictures,
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

/** A solid area cut into the plate: a polygon (its outline is drawn too) or a disc. */
export type Shape = { poly: Point[] } | { disc: [number, number, number] };

/**
 * Draws a picture as scratches on a `width` × `height` grid: each stroke is a list of points
 * joined by straight lines (Bresenham), and each shape is filled solid.
 */
export function scratches(width: number, height: number, strokes: Point[][], shapes: Shape[] = []): string[] {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill('.'));
  const plot = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < width && y < height) grid[y]![x] = '#';
  };
  for (const shape of shapes) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if ('disc' in shape) {
          const [cx, cy, r] = shape.disc;
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) plot(x, y);
        } else if (insidePolygon(x, y, shape.poly)) plot(x, y);
      }
    }
    if ('poly' in shape) strokes = [...strokes, [...shape.poly, shape.poly[0]!]];
  }
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

/** Even-odd test: is (x, y) inside the polygon? */
function insidePolygon(x: number, y: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A closed ring of points around (cx, cy), for eyes and heads. */
function ring(cx: number, cy: number, rx: number, ry = rx, steps = 12): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)] as Point;
  });
}

/** A small solid figure, centred on x, with its head at y. */
const figureShapes = (x: number, y: number): Shape[] => [{ disc: [x, y, 2.3] }, { poly: [[x - 3, y + 4], [x + 3, y + 4], [x + 2, y + 9], [x - 2, y + 9]] }];
const figureLimbs = (x: number, y: number): Point[][] => [[[x - 3, y + 4], [x - 5, y + 8]], [[x - 1, y + 9], [x - 2, y + 13]], [[x + 1, y + 9], [x + 2, y + 13]]];

// --- The pictures (one per word). Each symbol can be reused by later messages. ---

const SELF: DecodeSymbol = {
  id: 'self',
  picture: scratches(
    16,
    20,
    [[[8, 0], [8, 1]], [[11, 11], [13, 15]], ...figureLimbs(8, 7)],
    [{ poly: [[5, 1], [11, 1], [8, 4]] }, ...figureShapes(8, 7)],
  ),
  accepted: ['i', 'me', 'myself', 'self', 'my', 'mine', 'im'],
  near: [
    { words: ['person', 'man', 'woman', 'figure', 'human', 'someone', 'body', 'people', 'arrow'], reply: 'Warm. A person, and an arrow pointing right at them. Who is the one pointing?' },
    { words: ['you', 'yourself', 'them', 'him', 'her'], reply: "Close. But it isn't pointing at you. It's pointing at itself." },
  ],
  nudge: 'An arrow pointing down at a person. This one, here.',
  hint: 'Whoever made the plate is pointing at the person: themself. What would they call themself?',
};

const SEE: DecodeSymbol = {
  id: 'see',
  picture: scratches(
    25,
    14,
    [[[1, 7], [5, 3], [12, 1], [19, 3], [23, 7]], [[1, 7], [5, 11], [12, 13], [19, 11], [23, 7]], [[1, 8], [5, 12]], [[23, 8], [19, 12]], ring(12, 7, 4, 4, 16), [[6, 2], [5, 0]], [[12, 1], [12, 0]], [[18, 2], [19, 0]]],
    [{ disc: [12, 7, 2] }],
  ),
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
  picture: scratches(
    22,
    14,
    [[[4, 6], [10, 6]], [[4, 9], [10, 9]], [[3, 3], [6, 5], [10, 5]]],
    [{ poly: [[1, 5], [3, 3], [11, 3], [11, 4], [20, 4], [21, 5], [20, 6], [11, 6], [11, 12], [9, 13], [3, 13], [1, 11]] }],
  ),
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
  picture: scratches(24, 10, [[[19, 6], [5, 6], [4, 5], [5, 4], [21, 4], [22, 5], [22, 7], [21, 8], [3, 8], [1, 7], [1, 3], [3, 1], [18, 1]]]),
  accepted: ['clipped', 'clip', 'paperclip', 'paper clip', 'clips', 'snipped', 'cut', 'cut off', 'severed', 'chopped', 'trimmed', 'sliced', 'lopped', 'broken', 'shortened', 'docked'],
  near: [
    { words: ['wire', 'pin', 'hook', 'loop', 'staple', 'metal'], reply: 'Warm. A bent bit of wire for holding things together. What is it called?' },
    { words: ['knife', 'blade', 'scissors', 'shears'], reply: 'Close in meaning. But the picture is the wire itself. What is it called?' },
  ],
  nudge: 'A loop of wire, the kind that clips things together. It sounds like what was done to your wing.',
  hint: 'You remember the knife slipping, and what it did to your hand.',
};

const WING: DecodeSymbol = {
  id: 'wing',
  picture: scratches(
    24,
    18,
    [[[23, 2], [15, 1], [6, 2], [1, 5], [5, 6], [2, 9], [6, 10], [4, 13], [9, 13], [8, 16], [13, 15], [23, 8], [23, 2]], [[5, 6], [18, 4]], [[6, 10], [19, 7]], [[9, 13], [18, 10]], [[15, 1], [23, 5]]],
  ),
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
  picture: scratches(
    24,
    18,
    [...figureLimbs(4, 3), [[7, 7], [19, 7]], [[7, 8], [19, 8]]],
    [...figureShapes(4, 3), { poly: [[18, 3], [23, 7], [18, 12]] }],
  ),
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
  picture: scratches(
    24,
    18,
    [ring(12, 12, 7, 5, 20).filter(([, y]) => y >= 11), [[5, 11], [7, 9], [9, 11], [11, 8], [13, 11], [15, 9], [17, 11], [19, 11]], [[6, 6], [8, 3], [12, 1], [16, 2], [18, 5]], [[6, 6], [8, 4], [10, 6], [12, 4], [14, 6], [16, 4], [18, 5]], [[14, 9], [16, 9]], [[2, 4], [3, 4]], [[21, 3], [22, 3]]],
    [{ disc: [12, 9, 2] }],
  ),
  accepted: ['new', 'fresh', 'born', 'newborn', 'hatch', 'hatched', 'young', 'begin', 'beginning', 'start', 'birth', 'brand new'],
  near: [
    { words: ['egg', 'eggs', 'shell', 'crack', 'cracked', 'broken', 'open'], reply: "Warm. An egg, just broken open. What's it like, whatever comes out?" },
    { words: ['old'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'An egg cracking open, and a tiny head peeping out.',
  hint: 'You remember being small at the bench, and Mum: "There. Your very first bird." Something just made.',
};

const LIFE: DecodeSymbol = {
  id: 'life',
  picture: scratches(
    24,
    18,
    [[[12, 15], [12, 6]], [[13, 15], [13, 7]]],
    [{ poly: [[3, 17], [21, 17], [18, 15], [6, 15]] }, { poly: [[12, 11], [8, 8], [4, 8], [6, 11], [12, 12]] }, { poly: [[13, 8], [16, 4], [21, 3], [19, 7], [13, 9]] }],
  ),
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
  picture: scratches(14, 14, [[[1, 1], [12, 12]], [[2, 1], [13, 12]], [[1, 2], [12, 13]], [[12, 1], [1, 12]], [[13, 1], [2, 12]], [[12, 2], [1, 13]]]),
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
  picture: scratches(
    24,
    14,
    [[[12, 10], [11, 13]], [[13, 10], [14, 13]]],
    [{ poly: [[12, 8], [7, 3], [1, 2], [5, 5], [10, 10]] }, { poly: [[13, 8], [18, 3], [23, 2], [19, 5], [15, 10]] }, { disc: [12.5, 9, 2] }, { disc: [12.5, 6, 1.5] }],
  ),
  accepted: ['fly', 'flying', 'flight', 'flies', 'flew', 'flown', 'soar', 'soaring', 'glide', 'take off'],
  near: [
    { words: ['bird', 'birds', 'wing', 'wings', 'feather'], reply: 'Warm. A bird, wings wide open. What is it doing?' },
    { words: ['rise', 'rising', 'up', 'ascend', 'ascension'], reply: 'Close. Rising, but not up a tube. On its own wings.' },
  ],
  nudge: 'A bird with both wings raised, up in the air.',
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

// --- Message 2's new pictures ---

const REST: DecodeSymbol = {
  id: 'rest',
  picture: scratches(
    24,
    14,
    [[[16, 9], [21, 9]], [[16, 11], [21, 11]], [[0, 13], [23, 13]], [[14, 1], [17, 1], [14, 4], [17, 4]], [[19, 4], [21, 4], [19, 6], [21, 6]]],
    [{ disc: [4, 10, 2.3] }, { poly: [[7, 8], [16, 8], [16, 12], [7, 12]] }],
  ),
  accepted: ['rest', 'sleep', 'lie', 'lie down', 'stay', 'live', 'dwell', 'wait', 'lay', 'resting', 'asleep', 'nap', 'am'],
  near: [
    { words: ['bed', 'night', 'tired', 'dream', 'z', 'zz', 'zzz', 'snore'], reply: "Warm. Someone lying down, asleep. What are they doing?" },
    { words: ['dead', 'die', 'death', 'fall', 'fallen'], reply: "Cold. Look: they're breathing. Only sleeping." },
  ],
  nudge: 'A person lying flat, with little marks rising off them, like breath in sleep.',
  hint: 'Mum, every night: "Get some rest, love."',
};

const BEYOND: DecodeSymbol = {
  id: 'beyond',
  picture: scratches(
    24,
    16,
    [[[1, 13], [3, 7], [7, 3], [12, 1], [17, 3], [21, 8], [22, 12]], [[19, 10], [22, 13], [23, 9]], [[0, 15], [23, 15]]],
    [{ poly: [[10, 6], [13, 6], [13, 15], [10, 15]] }],
  ),
  accepted: ['beyond', 'past', 'over', 'outside', 'behind', 'across', 'past the', 'the other side', 'other side', 'through', 'far', 'away', 'out'],
  near: [
    { words: ['wall', 'arrow', 'jump', 'hill', 'arch', 'bridge'], reply: 'Warm. An arrow, going right over a wall. Where does it end up?' },
    { words: ['inside', 'in', 'under', 'within'], reply: 'Cold. The opposite: the far side.' },
  ],
  nudge: 'An arrow arching over a wall, landing on the far side.',
  hint: 'Further than the Canopy. Further than the lower roots. On the other side of everything you know.',
};

const BARK: DecodeSymbol = {
  id: 'bark',
  picture: scratches(22, 18, [
    [[4, 0], [4, 17]],
    [[17, 0], [17, 17]],
    [[7, 0], [8, 4], [7, 8], [8, 12], [7, 17]],
    [[11, 0], [10, 5], [11, 9], [10, 13], [11, 17]],
    [[14, 0], [15, 4], [14, 9], [15, 13], [14, 17]],
    [[2, 3], [4, 3]],
    [[17, 11], [19, 11]],
  ]),
  accepted: ['bark', 'tree', 'the tree', 'trunk', 'skin', 'wood', 'shell', 'outside of the tree', 'outer wood'],
  near: [
    { words: ['plank', 'board', 'wall', 'lines', 'grain'], reply: "Warm. Wood, rough and ridged. But not cut wood. The tree's own outside." },
    { words: ['root', 'roots', 'branch', 'leaf'], reply: 'Close. Part of the tree. Which part covers the outside of it?' },
  ],
  nudge: 'Rough, ridged wood: the outside of a trunk.',
  hint: "You've carved your whole life into the inside of the tree. What covers its outside?",
};

const WOULD: DecodeSymbol = {
  id: 'would',
  picture: scratches(14, 18, [
    [[3, 5], [4, 2], [7, 0], [10, 1], [11, 4], [9, 7], [7, 9], [7, 12]],
    [[4, 5], [5, 2], [7, 1], [10, 2], [10, 4], [8, 7], [6, 9], [6, 12]],
  ], [{ disc: [6.5, 16, 1.4] }]),
  accepted: ['would', 'will', 'do', 'does', 'could', 'can', 'shall', 'should', 'may', 'want', 'question', 'ask'],
  near: [
    { words: ['what', 'why', 'how', 'who', 'where', 'when', 'hook'], reply: "Warm. It's a question. How do you start asking someone if they want something?" },
  ],
  nudge: 'A hook with a dot under it: a question being asked.',
  hint: 'A question. The kind you ask when you hope the answer is yes.',
};

const LIKE: DecodeSymbol = {
  id: 'like',
  picture: scratches(16, 14, [], [{ poly: [[8, 13], [1, 6], [1, 3], [3, 1], [6, 1], [8, 3], [10, 1], [13, 1], [15, 3], [15, 6]] }]),
  accepted: ['like', 'want', 'love', 'wish', 'desire', 'care', 'fancy', 'enjoy', 'hope', 'long'],
  near: [
    { words: ['heart', 'hearts', 'chest', 'feel', 'feeling'], reply: 'Warm. A heart. What does your heart do when you long for something?' },
    { words: ['hate', 'dislike'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'A heart.',
  hint: 'What your friend feels about the Canopy. He would ____ to go there more than anything.',
};

const TO: DecodeSymbol = {
  id: 'to',
  picture: scratches(7, 5, [[[0, 2], [6, 2]], [[4, 0], [6, 2], [4, 4]]]),
  accepted: ['to'],
  near: [],
  nudge: '',
  hint: '',
  given: 'to',
};

/** Message 2 (Day 3): "Clipped wing, I rest beyond the bark. Would you like to fly?" Clipped, wing, I, you and fly come from message 1. */
export const MESSAGE_2: Message = {
  id: 'message2',
  line: 'Clipped wing, I rest beyond the bark. Would you like to fly?',
  rows: [
    ['clipped', 'wing', 'self', 'rest', 'beyond', 'bark'],
    ['would', 'you', 'like', 'to', 'fly'],
  ],
  symbols: [CLIPPED, WING, SELF, REST, BEYOND, BARK, WOULD, YOU, LIKE, TO, FLY],
};

export const MESSAGES: Record<string, Message> = { [MESSAGE_1.id]: MESSAGE_1, [MESSAGE_2.id]: MESSAGE_2 };
