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
    // A sealed letter on its way, with speed lines trailing behind it.
    [[[6, 3], [23, 3], [23, 15], [6, 15], [6, 3]], [[6, 3], [14, 10], [23, 3]], [[7, 4], [14, 9], [22, 4]], [[0, 6], [3, 6]], [[1, 9], [4, 9]], [[0, 12], [3, 12]]],
    [{ disc: [14, 10, 1.6] }],
  ),
  accepted: ['send', 'sent', 'give', 'offer', 'deliver', 'pass', 'post', 'throw', 'hand over', 'pass on', 'dispatch', 'gift'],
  near: [
    { words: ['letter', 'envelope', 'mail', 'message', 'note', 'parcel', 'away', 'go', 'leave', 'out', 'away from'], reply: 'Warm. A letter, on its way. What do you do with a letter, to get it to someone?' },
    { words: ['tube', 'rite', 'basket'], reply: 'Close. Not where it goes. What you do with it.' },
  ],
  nudge: 'A sealed letter, flying off to someone.',
  hint: 'Every morning the tree does this with its best work: up the tube it goes.',
};

const NEW: DecodeSymbol = {
  id: 'new',
  picture: scratches(
    24,
    18,
    // A chick hatching (designer: the old picture didn't read): the cracked bottom half of an egg, a round
    // head peeping out of it with an eye and a beak, the top of the shell knocked off to one side, and two
    // little sparkles: just made.
    [
      ring(12, 12, 7, 5, 24).slice(0, 13), // the egg's bottom half
      [[5, 12], [7, 10], [9, 12], [11, 10], [13, 12], [15, 10], [17, 12], [19, 12]], // its broken edge
      ring(12, 7, 3, 3, 16).filter(([, y]) => y <= 10), // the head, rising out of the shell
      [[1, 6], [2, 3], [5, 1]], [[1, 6], [3, 5], [5, 6]], // the top of the shell, knocked off to the left
      [[20, 1], [20, 3]], [[19, 2], [21, 2]], [[22, 6], [23, 6]], // sparkles
    ],
    [{ disc: [13, 6, 0.6] }, { poly: [[15, 6], [18, 7], [15, 8]] }],
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

/** "Not": a circle struck through. (Its own picture: "can't" and "not" are too different to share one, designer.) */
const NOT: DecodeSymbol = {
  id: 'not',
  picture: scratches(16, 16, [ring(8, 8, 7, 7, 20), ring(8, 8, 6, 6, 20), [[3, 3], [13, 13]], [[3, 4], [12, 13]], [[4, 3], [13, 12]]]),
  accepted: ['not', 'no', 'isnt', 'arent', 'never', 'none', 'nope', 'nothing'],
  near: [
    { words: ['cant', 'cannot', 'stop', 'forbidden', 'cross', 'circle', 'wrong', 'dont', 'wont'], reply: 'Close. A circle struck through. Simpler than that. Just...' },
    { words: ['yes', 'is', 'are'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'A circle with a line struck through it.',
  hint: 'The smallest word for no.',
};

// --- Message 3's new pictures ---

const YET: DecodeSymbol = {
  id: 'yet',
  picture: scratches(
    24,
    13,
    [[[0, 11], [23, 11]], [[12, 1], [12, 3]], [[5, 4], [6, 5]], [[19, 4], [18, 5]], [[2, 9], [4, 9]], [[20, 9], [22, 9]]],
    [{ disc: [12, 11, 5.4] }],
  ),
  accepted: ['yet', 'not yet', 'soon', 'later', 'wait', 'someday', 'one day', 'in time', 'eventually', 'still', 'almost', 'nearly'],
  near: [
    { words: ['sun', 'sunrise', 'dawn', 'morning', 'rising', 'horizon', 'day', 'light'], reply: "Warm. The sun, only halfway up. It hasn't happened... not ___." },
    { words: ['now', 'already', 'done'], reply: 'Cold. The opposite: it hasn\'t happened.' },
  ],
  nudge: "Something only halfway risen. It's coming, but it isn't here.",
  hint: 'What Mum says when you ask if supper is ready: "Not ___."',
};

const ALSO: DecodeSymbol = {
  id: 'also',
  picture: scratches(24, 16, [...figureLimbs(5, 2), ...figureLimbs(19, 2), [[10, 6], [14, 6]], [[10, 9], [14, 9]]], [...figureShapes(5, 2), ...figureShapes(19, 2)]),
  accepted: ['also', 'too', 'either', 'neither', 'as well', 'same', 'likewise', 'me too', 'both', 'nor', 'same as', 'alike'],
  near: [
    { words: ['two', 'pair', 'twins', 'people', 'friends', 'equal', 'equals', 'us'], reply: 'Warm. Two people, just the same. One is like the other ___.' },
    { words: ['different', 'other', 'opposite'], reply: 'Cold. Look: they match.' },
  ],
  nudge: 'Two figures, exactly alike, with a sign between them that says they match.',
  hint: 'When your friend said he was scared too, you said: "Me ___."',
};

const BECAUSE: DecodeSymbol = {
  id: 'because',
  picture: scratches(
    24,
    14,
    [[[6, 7], [16, 7]], [[13, 4], [16, 7], [13, 10]], [[20, 2], [20, 4]], [[20, 10], [20, 12]], [[17, 7], [17, 7]], [[23, 7], [22, 7]], [[18, 4], [18, 4]], [[22, 4], [22, 4]], [[18, 10], [18, 10]], [[22, 10], [22, 10]]],
    [{ disc: [3, 7, 2.6] }, { disc: [20, 7, 1.6] }],
  ),
  accepted: ['because', 'since', 'cause', 'reason', 'so', 'as', 'for', 'why', 'caused', 'due to', 'because of', 'thanks to'],
  near: [
    { words: ['arrow', 'then', 'leads', 'makes', 'after', 'next', 'burst', 'start'], reply: "Warm. One thing making another happen. Why did the second happen? ___ of the first." },
  ],
  nudge: 'A dot, and an arrow from it to a burst: one thing makes the next one happen.',
  hint: 'You asked him "why?". How does anyone start the answer to that?',
};

const CARVE: DecodeSymbol = {
  id: 'carve',
  picture: scratches(
    24,
    18,
    // A knife (solid handle, crossguard, thin blade) cutting into a block of wood, a curl of shaving lifting off.
    [
      [[9, 6], [15, 12]], [[10, 6], [15, 11]],
      [[6, 8], [10, 4]],
      [[10, 12], [23, 12], [23, 17], [10, 17], [10, 12]], [[12, 14], [16, 14]], [[18, 15], [22, 15]], [[13, 16], [19, 16]],
      [[16, 11], [18, 8], [20, 6], [22, 6], [23, 8], [21, 9], [20, 8]],
    ],
    [{ poly: [[0, 2], [2, 0], [7, 5], [5, 7]] }],
  ),
  accepted: ['carve', 'carving', 'carved', 'carver', 'carves', 'whittle', 'cut', 'craft', 'make', 'made', 'shape', 'work', 'chip'],
  near: [
    { words: ['knife', 'blade', 'chisel', 'shaving', 'shavings', 'wood', 'tool'], reply: 'Warm. A knife, and a curl of wood peeling off it. What are you doing with it?' },
  ],
  nudge: 'A knife cutting into a block of wood, and a curl of shaving lifting off.',
  hint: 'What you do every morning at your bench.',
};

const AM: DecodeSymbol = {
  id: 'am',
  picture: scratches(7, 5, [[[0, 1], [6, 1]], [[0, 3], [6, 3]]]),
  accepted: ['am'],
  near: [],
  nudge: '',
  hint: '',
  given: 'am',
};

/** His own mark: a bird on bare ground, wings folded (design doc). */
const GROUNDED: DecodeSymbol = {
  id: 'grounded',
  picture: scratches(
    24,
    18,
    [[[0, 16], [23, 16]], [[9, 13], [8, 16]], [[12, 13], [13, 16]], [[3, 17], [4, 17]], [[17, 17], [19, 17]], [[2, 5], [5, 6]]],
    [{ disc: [7, 6, 2.6] }, { poly: [[6, 8], [16, 6], [22, 4], [19, 9], [14, 13], [8, 13], [5, 10]] }],
  ),
  accepted: ['grounded', 'ground', 'landed', 'flightless', 'earthbound', 'earth', 'ground bird', 'bird on the ground', 'on the ground', 'the grounded', 'down'],
  near: [
    { words: ['bird', 'birds', 'sitting', 'nest', 'perched', 'hen', 'standing', 'resting', 'him', 'name'], reply: 'Warm. A bird, but not flying. Where is it standing? What does that make it?' },
    { words: ['soil', 'dirt', 'floor', 'mud'], reply: "Close. That's where it is. What does it make a bird, to be stuck there?" },
    { words: ['fly', 'flying', 'flight', 'sky'], reply: 'Cold. This one has its feet on the ground.' },
  ],
  nudge: "A bird standing on bare ground, wings folded. It isn't flying. It's been ___ed.",
  hint: 'A bird that can\'t fly stays on the ___. Like yours, with its clipped wing. He signs himself that way.',
};

/** "Many of us": a crowd of little figures. */
const MANY: DecodeSymbol = {
  id: 'many',
  picture: scratches(24, 18, [...figureLimbs(4, 4), ...figureLimbs(12, 2), ...figureLimbs(20, 4)], [...figureShapes(4, 4), ...figureShapes(12, 2), ...figureShapes(20, 4)]),
  accepted: ['many', 'many of us', 'lots', 'lots of us', 'crowd', 'us', 'we', 'others', 'people', 'more', 'a lot', 'plenty', 'many people', 'all of us', 'there are many'],
  near: [
    { words: ['three', 'family', 'friends', 'group', 'village', 'tree', 'them', 'they'], reply: "Warm. Lots of people together. And he's one of them. How many?" },
    { words: ['one', 'alone', 'me', 'i'], reply: 'Cold. There are more than one.' },
  ],
  nudge: 'A crowd of little people, standing together.',
  hint: 'Not just him. There are ____ of them.',
};

/** Message 3 (Day 4), after "yes": "Not yet. I am Grounded. There are many of us beyond the bark." */
export const MESSAGE_3_YES: Message = {
  id: 'message3_yes',
  line: 'Not yet. I am Grounded. There are many of us beyond the bark.',
  rows: [
    ['not', 'yet', 'self', 'am', 'grounded'],
    ['many', 'beyond', 'bark'],
  ],
  symbols: [NOT, YET, SELF, AM, GROUNDED, MANY, BEYOND, BARK],
};

/** Message 3 (Day 4), after "I can't": "Neither can I. I am Grounded. There are many of us beyond the bark." */
export const MESSAGE_3_CANT: Message = {
  id: 'message3_cant',
  line: 'Neither can I. I am Grounded. There are many of us beyond the bark.',
  rows: [
    ['self', 'cant', 'also'],
    ['self', 'am', 'grounded', 'many', 'beyond', 'bark'],
  ],
  symbols: [SELF, CANT, ALSO, AM, GROUNDED, MANY, BEYOND, BARK],
};

/** Message 3 (Day 4), after "why?": "Because I have watched you carve. I am Grounded. There are many of us beyond the bark." */
export const MESSAGE_3_WHY: Message = {
  id: 'message3_why',
  line: 'Because I have watched you carve. I am Grounded. There are many of us beyond the bark.',
  rows: [
    ['because', 'self', 'see', 'you', 'carve'],
    ['self', 'am', 'grounded', 'many', 'beyond', 'bark'],
  ],
  symbols: [BECAUSE, SELF, SEE, YOU, CARVE, AM, GROUNDED, MANY, BEYOND, BARK],
};



/** A wing cut off short, the way you clip a fledgling's: your "I can't". */
const CLIPPED_WING = scratches(
  24,
  18,
  [[[14, 1], [6, 2], [1, 5], [5, 6], [2, 9], [6, 10], [4, 13], [9, 13], [8, 16], [13, 15], [14, 14]], [[5, 6], [13, 4]], [[6, 10], [13, 8]], [[14, 0], [14, 17]], [[17, 3], [19, 5]], [[17, 9], [19, 11]]],
);

// --- Your replies to message 3 (Day 5) ---

/** "Who are you?": his pointing hand, and the hook-and-dot question. */
const WHO_ARE_YOU = scratches(
  24,
  18,
  [[[3, 8], [8, 8]], [[3, 11], [8, 11]], [[16, 5], [17, 2], [19, 1], [21, 2], [22, 4], [20, 7], [19, 9], [19, 12]], [[17, 5], [18, 3], [20, 2], [21, 4], [19, 7], [18, 9], [18, 12]]],
  [{ poly: [[1, 7], [2, 6], [8, 6], [8, 7], [13, 7], [14, 8], [13, 9], [8, 9], [8, 14], [7, 15], [2, 15], [1, 13]] }, { disc: [18.5, 15.5, 1.4] }],
);

/** "Take me": you, and an arrow arching up over the bark to the far side. */
const TAKE_ME = scratches(
  24,
  18,
  [...figureLimbs(4, 4), [[5, 7], [7, 3], [11, 1], [15, 1], [19, 4], [21, 9]], [[18, 8], [21, 11], [23, 7]], [[14, 6], [14, 17]], [[15, 6], [15, 17]], [[0, 17], [23, 17]]],
  [...figureShapes(4, 4)],
);

/** "I'm being watched": you, small, under a great eye. */
const WATCHED = scratches(
  24,
  26,
  [[[2, 4], [6, 1], [12, 0], [18, 1], [22, 4]], [[2, 4], [6, 7], [12, 8], [18, 7], [22, 4]], ...figureLimbs(12, 12), [[7, 15], [6, 17], [7, 19]], [[17, 15], [18, 17], [17, 19]]],
  [{ disc: [12, 4, 2.2] }, ...figureShapes(12, 12)],
);

/** "They blame me; help me": hands pointing at you from both sides, and you with both arms thrown up, calling for help. */
const POINTING_HANDS = scratches(
  32,
  21,
  [
    // Both arms thrown up in a V, open hands at the ends; legs apart.
    [[14, 10], [11, 5]], [[18, 10], [21, 5]], [[11, 5], [10, 2]], [[11, 5], [12, 2]], [[21, 5], [20, 2]], [[21, 5], [22, 2]], [[11, 5], [9, 4]], [[21, 5], [23, 4]],
    [[15, 18], [13, 20]], [[17, 18], [19, 20]],
  ],
  [
    { disc: [16, 7, 2.2] },
    { poly: [[13, 10], [19, 10], [18, 18], [14, 18]] },
    // The pointing hands, either side.
    { poly: [[0, 11], [5, 11], [5, 12], [10, 12], [10, 13], [5, 13], [5, 16], [0, 16]] },
    { poly: [[31, 11], [26, 11], [26, 12], [21, 12], [21, 13], [26, 13], [26, 16], [31, 16]] },
  ],
);

// --- Your plate on Day 7 ---

/** "I'm trapped": a bird in a cage. */
const CAGED = scratches(
  24,
  22,
  [
    [[4, 7], [7, 3], [12, 1], [17, 3], [20, 7]], [[12, 0], [12, 1]], // the dome and its hook
    [[4, 7], [4, 20]], [[8, 4], [8, 20]], [[12, 2], [12, 20]], [[16, 4], [16, 20]], [[20, 7], [20, 20]], // bars
    [[2, 20], [22, 20]], [[2, 21], [22, 21]], // the base
    [[9, 16], [9, 19]], [[11, 16], [11, 19]], // its legs
  ],
  [{ disc: [10, 12, 2.6] }, { poly: [[8, 13], [15, 11], [18, 9], [16, 14], [12, 16], [8, 15]] }, { poly: [[7, 11], [5, 12], [7, 13]] }],
);

export interface ReplyOption {
  /** What goes into the ink variable. */
  value: string;
  picture: string[];
}

/** Your replies, scratched on the back of his plate in his own pictures (#plate:<set> in the carving): which ink variable each set fills, and its three pictures in the order of the choices. */
export const REPLY_SETS: Record<string, { variable: string; options: ReplyOption[] }> = {
  // Day 4, to message 2: yes (open wings) / I can't (a clipped wing) / why? (a hook and a dot).
  reply2: { variable: 'reply2', options: [{ value: 'yes', picture: FLY.picture }, { value: 'cant', picture: CLIPPED_WING }, { value: 'why', picture: WOULD.picture }] },
  // Day 6: one picture, no choice: everyone pointing at you, and a hand reaching down (they blame me; help me).
  blame: { variable: 'reply4', options: [{ value: 'blame', picture: POINTING_HANDS }] },
  // Day 7: one picture, no choice: a bird in a cage (I'm trapped).
  caged: { variable: 'reply5', options: [{ value: 'caged', picture: CAGED }] },
  // Day 5, to message 3: who are you? / take me / I'm being watched.
  reply3: { variable: 'reply3', options: [{ value: 'who', picture: WHO_ARE_YOU }, { value: 'take', picture: TAKE_ME }, { value: 'watched', picture: WATCHED }] },
};

// --- Message 4 ---

/** "New life", this time as a seed sprouting, with the upper branches above it: he wants a seed, from up there. */
const SEED: DecodeSymbol = {
  id: 'seed',
  picture: scratches(
    24,
    20,
    [[[0, 1], [6, 3], [10, 2]], [[6, 3], [8, 6]], [[23, 0], [17, 3], [13, 2]], [[17, 3], [15, 6]], [[3, 0], [4, 2]], [[20, 0], [20, 2]], [[12, 15], [12, 9]]],
    [{ poly: [[9, 16], [12, 14], [15, 16], [14, 19], [10, 19]] }, { poly: [[13, 10], [16, 7], [19, 7], [17, 10], [13, 11]] }, { poly: [[12, 12], [9, 10], [6, 10], [8, 12], [12, 13]] }],
  ),
  accepted: ['seed', 'seeds', 'new life', 'sprout', 'seedling', 'grain', 'pip', 'kernel', 'nut', 'bean', 'shoot', 'growth', 'life'],
  near: [
    { words: ['egg', 'plant', 'branch', 'branches', 'tree', 'leaf', 'leaves', 'up', 'top', 'grove', 'root', 'roots'], reply: "Warm. Not an egg this time. What's that shoot growing out of, under the branches?" },
  ],
  nudge: "Where the first plate had an egg and a shoot, there's a seed, sprouting. And branches over it: the upper branches.",
  hint: 'What does a tree grow from?',
};

/** Message 4 (Day 5): "Clipped wing, send me new life that can't fly." The same words as message 1, but new life is a seed, by the upper branches (design doc). */
export const MESSAGE_4: Message = {
  id: 'message4',
  line: "Clipped wing, send me new life that can't fly.",
  rows: [
    ['clipped', 'wing', 'send', 'self'],
    ['seed', 'that', 'cant', 'fly'],
  ],
  symbols: [CLIPPED, WING, SEND, SELF, SEED, THAT, CANT, FLY],
};

// --- Message 5's new pictures ---

/** "Lives": the seed grown into a little tree, leafing out. */
const LIVES: DecodeSymbol = {
  id: 'lives',
  picture: scratches(
    24,
    18,
    [[[12, 17], [12, 6]], [[13, 17], [13, 7]], [[12, 11], [8, 8]], [[13, 10], [17, 7]], [[0, 17], [23, 17]]],
    [{ disc: [12, 5, 4.2] }, { disc: [7, 8, 3] }, { disc: [18, 7, 3] }, { poly: [[9, 17], [12, 15], [15, 17]] }],
  ),
  accepted: ['lives', 'live', 'alive', 'living', 'grows', 'grow', 'growing', 'grew', 'grown', 'thrives', 'sprouted', 'blooms', 'flourishes'],
  near: [
    { words: ['tree', 'plant', 'bush', 'leaves', 'sapling', 'seedling'], reply: "Warm. A little tree, grown from something small. What's it doing? It's..." },
    { words: ['dead', 'dies', 'died', 'sleeps'], reply: 'Cold. Look how it leafs out.' },
  ],
  nudge: 'The seed, grown into a little tree, in full leaf.',
  hint: 'The seed you sent. What has it done?',
};

/** "The rot": a length of wood gone soft, eaten with holes, crumbling away underneath, with a stink rising off it. */
const ROT_HOLES: [number, number][] = [[5, 9], [6, 10], [12, 10], [13, 11], [12, 11], [18, 9], [19, 10], [9, 12], [16, 12]];
const ROT: DecodeSymbol = {
  id: 'rot',
  picture: scratches(
    24,
    18,
    [
      [[4, 1], [5, 3], [4, 5]], [[11, 0], [12, 2], [11, 4]], [[18, 1], [19, 3], [18, 5]], // stink rising
      [[3, 15], [3, 16]], [[9, 15], [9, 17]], [[15, 15], [15, 16]], [[20, 16], [20, 17]], // crumbs falling
    ],
    [{ poly: [[1, 7], [22, 7], [23, 9], [22, 13], [18, 14], [14, 13], [10, 14], [6, 13], [1, 13]] }],
  ).map((row, y) => [...row].map((ch, x) => (ROT_HOLES.some(([hx, hy]) => hx === x && hy === y) ? '.' : ch)).join('')), // eaten through
  accepted: ['rot', 'the rot', 'rotten', 'rotting', 'decay', 'decayed', 'decaying', 'mould', 'mold', 'blight', 'putrid', 'corruption'],
  near: [
    { words: ['wood', 'log', 'holes', 'crumbling', 'soft', 'stink', 'smell', 'smelly', 'dead', 'sick', 'disease', 'fungus', 'worm', 'worms'], reply: 'Close. Wood gone soft and stinking, eaten through and crumbling away. What does the whole roots call that?' },
  ],
  nudge: 'Wood eaten through with holes, crumbling away, a stink rising off it.',
  hint: 'What they call you, at the ceremonies: ___-hand.',
};

/** "Deep": layers, and an arrow going down through all of them. */
const DEEP: DecodeSymbol = {
  id: 'deep',
  picture: scratches(
    24,
    18,
    [[[0, 3], [23, 3]], [[2, 7], [21, 7]], [[4, 11], [19, 11]], [[6, 15], [17, 15]], [[12, 0], [12, 15]], [[11, 0], [11, 15]], [[8, 12], [11, 17], [12, 17], [15, 12]]],
  ),
  accepted: ['deep', 'deeper', 'depth', 'depths', 'deep down', 'far down', 'deeply'],
  near: [
    { words: ['down', 'below', 'under', 'beneath', 'underneath', 'bottom', 'layers', 'arrow', 'lines', 'roots', 'ground', 'floor'], reply: 'Close. Down, yes, through layer after layer. How far down? Very...' },
    { words: ['up', 'high', 'shallow', 'top'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'An arrow going down through layer after layer, all the way to the bottom.',
  hint: 'Further down than the lower roots. Further than anyone goes.',
};

/** "Stay alive": someone hanging on to a branch by their hands. */
const STAY_ALIVE: DecodeSymbol = {
  id: 'stayalive',
  picture: scratches(
    24,
    18,
    [[[0, 1], [23, 1]], [[0, 2], [23, 2]], [[9, 3], [11, 7]], [[15, 3], [13, 7]], [[11, 15], [10, 17]], [[13, 15], [14, 17]]],
    [{ disc: [12, 8, 2.2] }, { poly: [[9, 10], [15, 10], [14, 15], [10, 15]] }],
  ),
  accepted: ['stay alive', 'survive', 'live', 'hold on', 'hang on', 'stay', 'endure', 'keep going', 'dont die', 'keep living', 'cling on', 'last', 'be safe', 'stay safe'],
  near: [
    { words: ['hang', 'hanging', 'branch', 'climb', 'climbing', 'grip', 'cling', 'swing', 'fall'], reply: "Warm. Someone hanging on by their fingertips. What's he telling you to do?" },
  ],
  nudge: 'Someone hanging on to a branch by their hands, not letting go.',
  hint: 'Mum, last night: "Whatever keeps you alive."',
};

/** "Need": two open hands reaching up. */
const NEED: DecodeSymbol = {
  id: 'need',
  picture: scratches(
    24,
    18,
    [[[3, 3], [3, 8]], [[5, 1], [5, 8]], [[7, 2], [7, 8]], [[1, 7], [2, 9]], [[16, 2], [16, 8]], [[18, 1], [18, 8]], [[20, 3], [20, 8]], [[22, 7], [21, 9]]],
    [{ poly: [[2, 8], [9, 8], [8, 14], [4, 14]] }, { poly: [[14, 8], [21, 8], [19, 14], [15, 14]] }, { poly: [[4, 14], [8, 14], [9, 17], [3, 17]] }, { poly: [[15, 14], [19, 14], [20, 17], [14, 17]] }],
  ),
  accepted: ['need', 'needs', 'want', 'require', 'must have', 'have to have', 'rely on', 'depend on'],
  near: [
    { words: ['ask', 'help', 'beg', 'call', 'hands', 'hand', 'reach', 'reaching', 'grab', 'please', 'give', 'catch'], reply: "Close. Hands reaching out for something they have to have, and can't do without. They ____ it." },
  ],
  nudge: 'Two open hands, reaching up for something they can\'t do without.',
  hint: 'What you feel for food, today. Not want. Something stronger.',
};

/** "Hurry": a figure running, with speed lines behind. */
const HURRY: DecodeSymbol = {
  id: 'hurry',
  picture: scratches(
    24,
    18,
    [[[13, 7], [17, 9]], [[13, 7], [10, 10]], [[12, 11], [16, 14], [15, 17]], [[12, 11], [8, 13], [6, 16]], [[0, 5], [5, 5]], [[1, 9], [6, 9]], [[0, 13], [4, 13]]],
    [{ disc: [15, 3, 2.2] }, { poly: [[11, 6], [15, 6], [13, 12], [11, 12]] }],
  ),
  accepted: ['hurry', 'quick', 'quickly', 'fast', 'run', 'rush', 'soon', 'now', 'haste', 'hasten', 'go', 'be quick', 'come quickly'],
  near: [
    { words: ['runner', 'legs', 'chase', 'flee', 'escape', 'race', 'speed'], reply: 'Warm. Someone running as fast as they can. What is he telling you to do?' },
    { words: ['slow', 'wait', 'later'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'Someone running flat out, speed lines streaming behind.',
  hint: 'What everyone says when the guards are coming.',
};

/** Message 5 (Day 6), after the archivist's seed: "New life lives. Clipped wing, stay alive. You are not the rot. We need you. Hurry." */
export const MESSAGE_5_LIVES: Message = {
  id: 'message5_lives',
  line: 'New life lives. Clipped wing, stay alive. You are not the rot. We need you. Hurry.',
  rows: [
    ['seed', 'lives', 'clipped', 'wing', 'stayalive'],
    ['you', 'not', 'rot', 'many', 'need', 'you', 'hurry'],
  ],
  symbols: [SEED, LIVES, CLIPPED, WING, STAY_ALIVE, YOU, NOT, ROT, MANY, NEED, HURRY],
};

/** Message 5 (Day 6), after the boy's seed: "New life sleeps. The rot is deep. Clipped wing, stay alive. You are not the rot. We need you. Hurry." */
export const MESSAGE_5_SLEEPS: Message = {
  id: 'message5_sleeps',
  line: 'New life sleeps. The rot is deep. Clipped wing, stay alive. You are not the rot. We need you. Hurry.',
  rows: [
    ['seed', 'rest', 'rot', 'deep', 'clipped', 'wing', 'stayalive'],
    ['you', 'not', 'rot', 'many', 'need', 'you', 'hurry'],
  ],
  symbols: [SEED, REST, ROT, DEEP, CLIPPED, WING, STAY_ALIVE, YOU, NOT, MANY, NEED, HURRY],
};

// --- Message 6's new pictures ---

/** "Make yourself a master": the master's spiral, cut into their last carving the night of the Ascension (design doc). */
const MASTER: DecodeSymbol = {
  id: 'master',
  picture: scratches(16, 16, [[[1, 1], [14, 1], [14, 14], [3, 14], [3, 4], [11, 4], [11, 11], [6, 11], [6, 7], [8, 7], [8, 9]], [[1, 2], [13, 2], [13, 13]]]),
  accepted: ['master', 'make yourself a master', 'a master', 'masters', 'ascend', 'ascended', 'ascension', 'chosen', 'the chosen', 'martyr', 'saint', 'best', 'great carver', 'mastery'],
  near: [
    { words: ['spiral', 'swirl', 'coil', 'maze', 'snail', 'whirl', 'mark', 'sign', 'carver', 'carving'], reply: "Warm. The spiral on a carving, the night of the Ascension. Whose mark was it?" },
  ],
  nudge: "The mark on the last carving of the one the whole tree sang up the tube, the night of the Ascension.",
  hint: 'Once a lifetime, the best carver in the tree goes up the tube. What do they call them?',
};

/** "If": a path splitting in two, one way up and one way down. */
const IF: DecodeSymbol = {
  id: 'if',
  picture: scratches(24, 16, [[[0, 8], [9, 8]], [[0, 9], [9, 9]], [[9, 8], [15, 3], [23, 3]], [[9, 9], [15, 13], [23, 13]], [[20, 0], [23, 3], [20, 6]], [[20, 10], [23, 13], [20, 16]]]),
  accepted: ['if', 'whether', 'either', 'or', 'choice', 'choose', 'when', 'unless', 'maybe', 'perhaps', 'in case'],
  near: [
    { words: ['fork', 'split', 'path', 'paths', 'road', 'roads', 'way', 'ways', 'two', 'branch', 'arrows', 'up', 'down', 'apart'], reply: 'Warm. One way splitting in two. It depends: ___ this, or that.' },
  ],
  nudge: "A path that splits in two: one way goes up, the other down. It depends which.",
  hint: "The little word that comes before a condition. \"___ it rains, stay in.\"",
};

/** "Can": a tick, the opposite of the cross you know for "can't". */
const CAN: DecodeSymbol = {
  id: 'can',
  picture: scratches(18, 14, [[[1, 7], [6, 12], [16, 1]], [[1, 8], [6, 13], [17, 1]], [[2, 7], [6, 11], [16, 0]]]),
  accepted: ['can', 'could', 'able', 'are able', 'manage', 'possible', 'capable', 'yes', 'ok', 'okay', 'right', 'allowed'],
  near: [
    { words: ['tick', 'check', 'mark', 'correct', 'good', 'done'], reply: "Warm. A tick: the opposite of the cross for can't. So, not can't. Just..." },
    { words: ['cant', 'cannot', 'not', 'no'], reply: "Cold. The opposite: it isn't crossed out." },
  ],
  nudge: "Not the cross you know for \"can't\". Its opposite.",
  hint: "Cross a thing out and you can't. Tick it, and you...",
};

/** "Fall": someone tumbling head first, with lines streaming up above them. */
const FALL: DecodeSymbol = {
  id: 'fall',
  picture: scratches(
    22,
    20,
    [[[10, 6], [9, 2]], [[12, 6], [13, 2]], [[8, 11], [4, 8]], [[14, 11], [18, 8]], [[3, 0], [3, 4]], [[19, 0], [19, 4]], [[16, 0], [16, 2]], [[6, 0], [6, 2]]],
    [{ disc: [11, 15, 2.3] }, { poly: [[8, 11], [14, 11], [13, 6], [9, 6]] }],
  ),
  accepted: ['fall', 'falling', 'fell', 'fallen', 'drop', 'dropping', 'dropped', 'tumble', 'plunge', 'plummet', 'go down', 'sink', 'descend'],
  near: [
    { words: ['upside', 'upside down', 'head', 'person', 'dive', 'diving', 'jump', 'jumping', 'flip', 'lines'], reply: 'Warm. Someone head first, the wind streaming past. What are they doing?' },
    { words: ['fly', 'rise', 'up', 'climb', 'float'], reply: "Cold. They're going the other way." },
  ],
  nudge: 'Someone head first, arms flung out, with the wind streaming up past them.',
  hint: "What a bird does when it can't fly.",
};

/** "Must": a heavy stroke and a dot. Like the question's hook, but not a question. */
const MUST: DecodeSymbol = {
  id: 'must',
  picture: scratches(8, 18, [], [{ poly: [[2, 0], [6, 0], [5, 11], [3, 11]] }, { disc: [4, 15, 1.6] }]),
  accepted: ['must', 'have to', 'has to', 'need to', 'should', 'got to', 'no choice', 'shall', 'forced', 'made to', 'ought to'],
  near: [
    { words: ['would', 'question', 'ask', 'what', 'why', 'hook'], reply: "Close. Like the question's hook, but straight. It isn't asking." },
    { words: ['line', 'stick', 'dot', 'stroke', 'mark', 'shout', 'loud', 'important', 'warning', 'danger'], reply: "Warm. Said hard, no arguing. Not 'you may'. You ___." },
  ],
  nudge: 'A straight stroke, struck hard, with a dot under it. No question about it.',
  hint: 'Not "you could". Not "you might". No choice left: you ____.',
};

/** "Will find": an eye, a winding trail, and a mark where it ends. */
const FIND: DecodeSymbol = {
  id: 'find',
  picture: scratches(
    26,
    16,
    [ring(5, 5, 4, 3, 12), [[10, 6]], [[12, 8]], [[14, 10]], [[16, 10]], [[18, 9]], [[19, 11], [23, 15]], [[23, 11], [19, 15]], [[20, 11], [24, 15]], [[24, 11], [20, 15]]],
    [{ disc: [5, 5, 1.2] }],
  ),
  accepted: ['find', 'will find', 'found', 'finds', 'come for', 'come to', 'search', 'seek', 'look for', 'discover', 'track', 'reach', 'meet', 'get to'],
  near: [
    { words: ['see', 'watch', 'eye', 'look', 'spot', 'trail', 'path', 'map', 'x', 'cross', 'mark', 'follow'], reply: 'Close. More than seeing: following the trail, and getting there.' },
    { words: ['lose', 'lost', 'hide'], reply: 'Cold. The opposite.' },
  ],
  nudge: 'An eye, a trail winding away from it, and a mark where it ends. Looking, and getting there.',
  hint: "What you do with something that's lost, when you look hard enough.",
};

/** Message 6 (Day 7): "Clipped wing, make yourself a master. Fly if you can, fall if you must. I will find you." (designer) */
export const MESSAGE_6: Message = {
  id: 'message6',
  line: 'Clipped wing, make yourself a master. Fly if you can, fall if you must. I will find you.',
  rows: [
    ['clipped', 'wing', 'master', 'fly', 'if', 'can'],
    ['fall', 'if', 'must', 'self', 'find', 'you'],
  ],
  symbols: [CLIPPED, WING, MASTER, FLY, IF, CAN, FALL, MUST, SELF, FIND, YOU],
};

export const MESSAGES: Record<string, Message> = Object.fromEntries(
  [MESSAGE_1, MESSAGE_2, MESSAGE_3_YES, MESSAGE_3_CANT, MESSAGE_3_WHY, MESSAGE_4, MESSAGE_5_LIVES, MESSAGE_5_SLEEPS, MESSAGE_6].map((m) => [m.id, m]),
);
