import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER character sprites until the art pass: small dark figures with slightly long,
// carved-figure proportions, lit from one side (a pale rim on the right edge). Frames are
// generated from a few pose parameters so a walk cycle stays consistent; each is still plain
// character rows. All face right; the game flips them.

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
const put = (g: Grid, x: number, y: number, c: string) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0]!.length) g[y]![x] = c;
};
const span = (g: Grid, y: number, x0: number, x1: number, c: string) => {
  for (let x = x0; x <= x1; x++) put(g, x, y, c);
};
const rows = (g: Grid) => g.map((r) => r.join(''));

/**
 * A faint edge on the unlit (left and top) side of the dark body, so the figure still reads
 * against dark backgrounds. Dimmer than the rim light on the lit side.
 */
function edgeShadowSide(g: Grid): void {
  const empty = (x: number, y: number) => (g[y]?.[x] ?? '.') === '.';
  const edges: [number, number][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c === 'o' && (empty(x - 1, y) || empty(x, y - 1))) edges.push([x, y]);
  }));
  for (const [x, y] of edges) g[y]![x] = 'e';
}

// --- The protagonist ---

interface Pose {
  /** Horizontal offset of the back and front foot relative to the hips. */
  sway: [number, number];
  /** How many rows each leg is drawn up (bent) from the ground. */
  lift?: [number, number];
  /** Upper body pushed down 1px (breathing, walk bob). */
  bob?: number;
  /** Front arm swing: hand offset forwards (+) or back (−). */
  arm?: number;
  /** The red thread from the knot at the neck, as offsets from the knot. */
  thread: [number, number][];
}

const PROTAGONIST_W = 12;
const PROTAGONIST_H = 26;

function protagonist(pose: Pose): RowSprite {
  const g = grid(PROTAGONIST_W, PROTAGONIST_H);
  const b = pose.bob ?? 0;
  // Head
  span(g, 0 + b, 4, 7, 'o');
  for (let y = 1; y <= 3; y++) {
    span(g, y + b, 3, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 4 + b, 4, 6, 'o');
  put(g, 7, 4 + b, '#');
  // Neck, shoulders, body
  span(g, 5 + b, 5, 6, 'o');
  span(g, 6 + b, 4, 8, 'o');
  for (let y = 7; y <= 16; y++) span(g, y + b, 4, 8, 'o');
  // Back arm, in shadow, swinging opposite the front one.
  for (let y = 7; y <= 14; y++) {
    const swing = y >= 11 ? -Math.sign(pose.arm ?? 0) * Math.min(Math.abs(pose.arm ?? 0), y - 10) : 0;
    put(g, 3 + swing, y + b, 'o');
  }
  // Front arm with a pale rim, ending in the bandaged hand (the missing thumb).
  const arm = pose.arm ?? 0;
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 11 ? Math.sign(arm) * Math.min(Math.abs(arm), y - 10) : 0;
    put(g, 9 + swing, y + b, 'o');
    put(g, 10 + swing, y + b, '#');
  }
  const handX = 9 + arm;
  for (let y = 14; y <= 15; y++) span(g, y + b, handX, handX + 1, 'h');
  // Legs: back leg in shadow, front leg rim-lit; toes point forwards.
  const [liftBack, liftFront] = pose.lift ?? [0, 0];
  const leg = (hipX: number, sway: number, lift: number, rim: boolean) => {
    const bottom = PROTAGONIST_H - 1 - lift;
    for (let y = 17; y <= bottom; y++) {
      const x = hipX + Math.round((sway * (y - 17)) / Math.max(1, bottom - 17));
      put(g, x, y, 'o');
      put(g, x + 1, y, rim ? '#' : 'o');
      if (y === bottom) put(g, x + 2, y, 'o');
    }
  };
  leg(4, pose.sway[0], liftBack, false);
  leg(6, pose.sway[1], liftFront, true);
  edgeShadowSide(g);
  // The red thread: a knot at the back of the neck, trailing out behind the body
  // (only drawn where it isn't hidden by the figure).
  put(g, 4, 5 + b, 'r');
  for (const [dx, dy] of pose.thread) {
    const x = 3 + dx;
    const y = 6 + b + dy;
    if (g[y]?.[x] === '.') put(g, x, y, 'r');
  }
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, h: SHADES.light, r: SHADES.red } };
}

const HANGING: [number, number][] = [[-1, 1], [-1, 2], [-2, 3]];
const TRAILING_A: [number, number][] = [[-1, 0], [-2, 1], [-3, 1], [-4, 2]];
const TRAILING_B: [number, number][] = [[-1, 1], [-2, 1], [-3, 2], [-4, 2]];

export const PROTAGONIST = {
  idle: [protagonist({ sway: [0, 0], thread: HANGING }), protagonist({ sway: [0, 0], bob: 1, thread: HANGING })],
  walk: [
    protagonist({ sway: [-3, 3], arm: -1, thread: TRAILING_A }),
    protagonist({ sway: [-1, 1], lift: [0, 2], bob: 1, arm: 0, thread: TRAILING_B }),
    protagonist({ sway: [3, -3], arm: 1, thread: TRAILING_A }),
    protagonist({ sway: [1, -1], lift: [2, 0], bob: 1, arm: 0, thread: TRAILING_B }),
  ],
  jump: protagonist({ sway: [-1, 2], lift: [3, 2], arm: 1, thread: [[-1, 1], [-1, 2], [-1, 3]] }),
  fall: protagonist({ sway: [-1, 1], arm: -1, thread: [[-1, 0], [-2, -1], [-3, -2]] }),
};

// --- Mum ---

function mum(breathe: boolean): RowSprite {
  const g = grid(13, 25);
  const b = breathe ? 1 : 0;
  // Hair tied up in a bun.
  span(g, 0 + b, 5, 7, 'o');
  // Head
  span(g, 1 + b, 5, 7, 'o');
  for (let y = 2; y <= 4; y++) {
    span(g, y + b, 4, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 5 + b, 5, 7, 'o');
  // A patterned shawl over her shoulders (placeholder signature detail), fringed at the bottom.
  // Outlined in shadow so her silhouette stays joined up even against mid-brown wood.
  put(g, 5, 6 + b, 'o');
  put(g, 6, 6 + b, 'o');
  put(g, 7, 6 + b, 'o');
  for (let y = 7; y <= 10; y++) {
    const half = Math.min(4, y - 5);
    for (let x = 6 - half; x <= 6 + half; x++) {
      const edge = Math.abs(x - 6) === half;
      put(g, x, y + b, edge ? (x > 6 ? '#' : 'o') : (x + y) % 3 === 0 ? 't' : 's');
    }
  }
  // Body and a long skirt, widening to the floor.
  for (let y = 11; y <= 15; y++) span(g, y + b, 3, 9, 'o');
  for (let x = 2; x <= 10; x += 2) put(g, x, 11 + b, 's');
  for (let y = 16; y <= 24; y++) {
    const w = Math.floor((y - 16) / 3);
    span(g, y, 3 - w, 9 + w, 'o');
    put(g, 10 + w, y, '#');
  }
  edgeShadowSide(g);
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, s: SHADES.amberDeep, t: SHADES.woodPale } };
}

export const MUM = { idle: [mum(false), mum(true)] };

// --- The Tender ---

/**
 * Tall, old and a little stooped, like a wizard: a long robe to the floor, a hood with the amber
 * crest of office (the design doc's signature detail), a long white beard and a staff.
 */
function tender(breathe: boolean): RowSprite {
  const g = grid(16, 32);
  const b = breathe ? 1 : 0;
  // Staff on the front side, taller than the Tender, with a knotted top.
  for (let y = 2; y <= 31; y++) put(g, 14, y, y <= 3 ? 'k' : 'w');
  put(g, 13, 2, 'k');
  put(g, 15, 3, 'k');
  // Hood, leaning slightly forward (stooped), with the amber crest at the brow.
  span(g, 1 + b, 5, 8, 'o');
  for (let y = 2; y <= 7; y++) span(g, y + b, 4, 9, 'o');
  put(g, 10, 3 + b, '#');
  put(g, 10, 4 + b, '#');
  put(g, 8, 1 + b, 'a');
  put(g, 8, 2 + b, 'a');
  put(g, 9, 2 + b, 'a');
  // Face in shadow under the hood, and a long white beard.
  span(g, 4 + b, 7, 9, 'f');
  span(g, 5 + b, 7, 9, 'f');
  for (let y = 6; y <= 12; y++) {
    const half = y < 10 ? 2 : Math.max(0, 12 - y);
    span(g, y + b, 8 - half, 8 + half, 'l');
  }
  // Robe: shoulders, then flaring to the floor; the front edge catches the light.
  for (let y = 7; y <= 31; y++) {
    const w = y < 12 ? 3 : 3 + Math.floor((y - 12) / 4);
    for (let x = 7 - w; x <= 7 + w; x++) if (g[y]![x] === '.' || (y > 12 + b && g[y]![x] !== 'w')) put(g, x, y, g[y]![x] === 'l' ? 'l' : 'o');
    put(g, 8 + w, y, '#');
  }
  // Hand on the staff.
  put(g, 13, 16 + b, 'f');
  put(g, 13, 17 + b, 'f');
  // A band of the amber crest's colour at the waist.
  for (let x = 4; x <= 10; x++) if (g[18]![x] === 'o') put(g, x, 18, 'd');
  edgeShadowSide(g);
  return {
    rows: rows(g),
    colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, a: SHADES.amber, d: SHADES.amberDeep, f: SHADES.woodPale, l: SHADES.light, w: SHADES.woodPale, k: SHADES.dim },
  };
}

export const TENDER = { idle: [tender(false), tender(true)] };

// --- Villagers ---

export interface VillagerLook {
  height: number; // 21–26
  width: number; // body half-width 2–4
  /** `helmet`: a guard's formal hat, a tall flat-topped crown with a band of the accent colour and a stiff peak. */
  head: 'bare' | 'hood' | 'cap' | 'bun' | 'helmet';
  /** Something carried on the back side. */
  bundle?: boolean;
  /** Skirt or robe to the floor instead of legs. */
  long?: boolean;
  /** Clothing accent colour (never red). */
  accent: number;
  /** Hair colour when it shows (bare heads and buns); default the body's shadow. Grey for elders. */
  hair?: number;
  /** A pale stole hanging down the front of a robe (elders' mark of office, placeholder). */
  stole?: boolean;
  /** A tall staff held in front, with a pale tip (guards). */
  staff?: boolean;
  /** The colour of the robe or clothes themselves (elders, told apart by their robes); default the body's shadow. */
  robe?: number;
}

/** A background figure, varied by `look`. Same lighting as everyone: rim on the right, faint edge on the left. */
function villager(look: VillagerLook, breathe: boolean, stride = 0): RowSprite {
  const W = 13;
  const H = look.height;
  const g = grid(W, H);
  const b = breathe ? 1 : 0;
  const cx = 6;
  const headTop = 0;
  // Head and headwear.
  const headRows = [headTop + 1, headTop + 2, headTop + 3, headTop + 4];
  for (const y of headRows) span(g, y + b, cx - 2, cx + 2, 'o');
  for (const y of headRows.slice(0, 3)) put(g, cx + 3, y + b, '#');
  if (look.head === 'hood') {
    span(g, headTop + b, cx - 2, cx + 2, 'o');
    for (let y = 1; y <= 5; y++) put(g, cx - 3, y + b, 'o');
  } else if (look.head === 'helmet') {
    span(g, headTop + b, cx - 3, cx + 3, 'o'); // the flat top, a little wider than the head
    put(g, cx + 4, headTop + b, '#');
    span(g, headTop + 1 + b, cx - 2, cx + 3, 'c'); // the band
    put(g, cx + 4, headTop + 2 + b, 'o'); // the peak
    put(g, cx + 5, headTop + 2 + b, 'o');
  } else if (look.head === 'cap') {
    span(g, headTop + b, cx - 2, cx + 3, 'c');
    put(g, cx + 4, headTop + 1 + b, 'c');
  } else if (look.head === 'bun') {
    span(g, headTop + b, cx - 1, cx, look.hair ? 'h' : 'o');
  }
  if (look.hair && look.head !== 'hood' && look.head !== 'cap' && look.head !== 'helmet') {
    span(g, headTop + 1 + b, cx - 2, cx + 1, 'h');
    put(g, cx - 2, headTop + 2 + b, 'h');
  }
  // Body.
  const bodyTop = 5;
  const legTop = H - 8;
  for (let y = bodyTop; y < legTop; y++) {
    span(g, y + b, cx - look.width, cx + look.width, 'o');
    put(g, cx + look.width + 1, y + b, '#');
  }
  // Coloured robes inside the outline.
  if (look.robe !== undefined) for (let y = bodyTop + 1; y < legTop; y++) span(g, y + b, cx - look.width + 1, cx + look.width - 1, 'R');
  // A band of accent colour across the chest.
  span(g, bodyTop + 2 + b, cx - look.width + 1, cx + look.width - 1, 'c');
  if (look.stole) for (let y = bodyTop + 1; y < H - 1; y++) put(g, cx + 1, y + (y < legTop ? b : 0), 's');
  if (look.bundle) for (let y = bodyTop + 1; y <= bodyTop + 5; y++) span(g, y + b, cx - look.width - 3, cx - look.width - 1, 'u');
  // Legs, or a long skirt/robe.
  for (let y = legTop; y < H; y++) {
    if (look.long) {
      const w = look.width + Math.floor((y - legTop) / 3);
      const sway = y > legTop + 3 ? stride : 0; // the hem swings when walking
      span(g, y, cx - w + sway, cx + w + sway, 'o');
      if (look.robe !== undefined && y < H - 1) span(g, y, cx - w + 1 + sway, cx + w - 1 + sway, 'R');
      put(g, cx + w + 1 + sway, y, '#');
    } else {
      // Legs apart when striding: the back leg angles back, the front leg forward.
      const t = (y - legTop) / Math.max(1, H - 1 - legTop);
      const back = cx - 2 - Math.round(stride * t);
      const front = cx + 1 + Math.round(stride * t);
      span(g, y, back, back + 1, 'o');
      span(g, y, front, front + 1, 'o');
      put(g, front + 2, y, y === H - 1 ? 'o' : '#');
      if (y === H - 1) put(g, front + 3, y, 'o'); // toes forward
    }
  }
  edgeShadowSide(g);
  if (look.staff) {
    const sx = cx + look.width + 2;
    for (let y = 0; y < H; y++) put(g, sx, y, y < 2 ? 't' : 'w');
    put(g, sx - 1, 8 + b, 'o'); // hand on the staff
  }
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, t: SHADES.light, w: SHADES.woodPale, c: look.accent, u: SHADES.amberDeep, h: look.hair ?? SHADES.shadow, s: SHADES.woodPale, R: look.robe ?? SHADES.shadow } };
}

/** Background villagers' looks (the crowd, stallholders); their portraits are drawn from the same looks. */
export const VILLAGER_LOOKS: VillagerLook[] = [
  { height: 25, width: 3, head: 'hood', accent: SHADES.greenDeep },
  { height: 23, width: 3, head: 'cap', accent: SHADES.cyanDeep },
  { height: 26, width: 2, head: 'bare', bundle: true, accent: SHADES.amberDeep },
  { height: 24, width: 3, head: 'bun', long: true, accent: SHADES.woodPale },
  { height: 22, width: 3, head: 'bare', accent: SHADES.woodLight },
  { height: 25, width: 3, head: 'hood', long: true, accent: SHADES.cyanDeep },
  { height: 21, width: 2, head: 'cap', accent: SHADES.greenMid },
];

/**
 * The elders who meet with the Tender in the shrine: old and grey, in long robes with a pale stole. They
 * share one look and are told apart by the colour of their robes (designer): amber (the eldest, who
 * leads), cyan, green and pale. Their portraits match.
 */
export const ELDER_LOOKS: VillagerLook[] = (
  [
    [SHADES.amberDeep, SHADES.amber],
    [SHADES.cyanDeep, SHADES.cyanMid],
    [SHADES.greenDeep, SHADES.greenMid],
    [SHADES.dim, SHADES.light],
  ] as const
).map(([robe, accent]) => ({ height: 24, width: 3, head: 'bare', long: true, accent, robe, hair: SHADES.light, stole: true }));
export const ELDERS = ELDER_LOOKS.map((look) => ({ idle: [villager(look, false), villager(look, true)] }));

/** The preacher: tall and thin in a long hooded robe with a band of the tube's cyan (placeholder look). */
export const PREACHER_LOOK: VillagerLook = { height: 26, width: 2, head: 'hood', long: true, accent: SHADES.cyanMid, stole: true };
export const PREACHER = (() => {
  const look = PREACHER_LOOK;
  return { idle: [villager(look, false), villager(look, true)] };
})();

/**
 * The celebrated master given to the tube on Day 1: old and calm in a long robe with an amber band and
 * a pale stole, grey hair, carrying their last carving (placeholder look; a one-off to design properly).
 */
export const MASTER = (() => {
  const look: VillagerLook = { height: 25, width: 3, head: 'bare', long: true, accent: SHADES.amber, hair: SHADES.light, stole: true, bundle: true };
  return { idle: [villager(look, false), villager(look, true)] };
})();

/** A guard of the middle tiers' checkpoint: capped, amber-banded, with a staff (placeholder look). */
export const GUARD_LOOK: VillagerLook = { height: 25, width: 3, head: 'helmet', accent: SHADES.amber, staff: true };
export const GUARD = (() => {
  const look = GUARD_LOOK;
  return { idle: [villager(look, false), villager(look, true)] };
})();

/** The night watch in the lower roots (Day 4 on): capped, cyan-banded (the Tender's colours). Carries a lantern, drawn by AreaScene. */
export const WATCHMAN = (() => {
  const look: VillagerLook = { height: 25, width: 3, head: 'cap', accent: SHADES.cyanMid };
  return { idle: [villager(look, false), villager(look, true)], walk: [villager(look, false, 2), villager(look, true, 0)] };
})();

/** The boy in the lower roots (Day 5 on): a sleazy fixer who can get anything. Small, capped, a bundle of goods on his back (placeholder look). */
export const DODGER = (() => {
  const look: VillagerLook = { height: 22, width: 2, head: 'cap', accent: SHADES.amber, bundle: true };
  return { idle: [villager(look, false), villager(look, true)] };
})();

/**
 * The hooded cloak from the boy (Day 6 on), drawn over the protagonist (facing right): a close, dark
 * hood with the face in its shadow, and a short cape to the waist that covers the red thread. Kept
 * discreet: dark wood colours, a faint lit edge, a couple of patches. 10×13, drawn onto the frames
 * (PROTAGONIST_CLOAKED) one pixel in from the left.
 */
export const CLOAK: RowSprite = {
  rows: [
    '...oooo...',
    '..occccl..',
    '.occckkl..',
    '.occckkkl.',
    '.occckkkl.',
    '.occcckl..',
    'occcpcccl.',
    'occccccccl',
    'occcccpccl',
    'occccccccl',
    '.occpccccl',
    '.occcccccl',
    '..ooooooo.',
  ],
  colours: { o: SHADES.shadow, c: SHADES.deep, k: SHADES.shadow, l: SHADES.woodLight, p: SHADES.greenDeep },
};

/**
 * Crouching (Day 6 on: creeping through low tunnels): bent forward from the hips, head low and out in
 * front, knees bent, the bandaged hand hanging forward; the red thread trails off the back of the neck.
 * Same 12×26 canvas as standing (feet on the bottom row), so it swaps in place.
 */
const crouchFrame = (legs: [string, string, string, string]): RowSprite => ({
  rows: [
    ...Array<string>(10).fill('............'),
    '.......ooo..',
    '......ooooo.',
    '......oooo#.',
    '.....ooooo..',
    '..r.ooooo...',
    '.r.ooooooo..',
    '..oooooooo#.',
    '.eooooooo#..',
    '.eoooooooo#.',
    '..ooooooo.#.',
    '..ooooo...hh',
    '..oooooo..hh',
    ...legs,
  ],
  colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, h: SHADES.light, r: SHADES.red },
});

export const PROTAGONIST_CROUCH = {
  idle: crouchFrame(['..oo..ooo...', '..oo...oo#..', '..oo...oo#..', '.ooo...ooo..']),
  walk: [
    crouchFrame(['..oo..ooo...', '..oo...oo#..', '..oo...oo#..', '.ooo...ooo..']),
    crouchFrame(['..oo..ooo...', '...oo.oo#...', '...oo.oo#...', '..ooo.ooo...']),
  ],
};

/** A frame with the cloak drawn onto it (`top`, `left` = where the hood starts: standing 0, 1; crouching, head forward, 10, 3). */
function withCloak(frame: RowSprite, top: number, left = 1): RowSprite {
  const rows = frame.rows.map((row, y) => {
    const cloakRow = CLOAK.rows[y - top];
    if (!cloakRow) return row;
    return [...row].map((ch, x) => {
      const c = cloakRow[x - left];
      return c && c !== '.' ? `C${c}` : ch;
    });
  });
  // Cloak pixels use upper-case keys (A.. ) so they can't clash with the frame's own colours.
  const map: Record<string, string> = { Co: 'o', Cc: 'C', Ck: 'K', Cl: 'L', Cp: 'P' };
  return {
    rows: rows.map((r) => (typeof r === 'string' ? r : r.map((ch) => map[ch] ?? ch).join(''))),
    colours: { ...frame.colours, o: SHADES.shadow, C: CLOAK.colours.c!, K: CLOAK.colours.k!, L: CLOAK.colours.l!, P: CLOAK.colours.p! },
  };
}

/** Every protagonist frame with the cloak on (Day 6 on, wherever you're not expected). */
export const PROTAGONIST_CLOAKED = {
  idle: PROTAGONIST.idle.map((f) => withCloak(f, 0)),
  walk: PROTAGONIST.walk.map((f) => withCloak(f, 0)),
  jump: withCloak(PROTAGONIST.jump, 0),
  fall: withCloak(PROTAGONIST.fall, 0),
  crouch: withCloak(PROTAGONIST_CROUCH.idle, 10, 3),
  crawl: PROTAGONIST_CROUCH.walk.map((f) => withCloak(f, 10, 3)),
};

/** Better-off residents of the middle tiers and upper branches: amber and pale accents, finer headwear (placeholder looks). */
export const RESIDENT_LOOKS: VillagerLook[] = [
  { height: 24, width: 3, head: 'bun', long: true, accent: SHADES.amber, hair: SHADES.dim },
  { height: 25, width: 3, head: 'cap', accent: SHADES.light },
  { height: 23, width: 3, head: 'bare', long: true, accent: SHADES.cyanMid, hair: SHADES.woodLight },
  { height: 26, width: 2, head: 'bare', accent: SHADES.amberDeep, hair: SHADES.amberDeep, stole: true },
];
export const RESIDENTS = RESIDENT_LOOKS.map((look) => ({
  idle: [villager(look, false), villager(look, true)],
  walk: [villager(look, false, 2), villager(look, true, 0)],
}));

/** Your friend's father: devout and well kept, fair like his son, a band of the tube's cyan (placeholder look). */
export const FRIEND_FATHER_LOOK: VillagerLook = { height: 26, width: 3, head: 'bare', accent: SHADES.cyanMid, hair: SHADES.amberDeep };
export const FRIEND_FATHER = { idle: [villager(FRIEND_FATHER_LOOK, false), villager(FRIEND_FATHER_LOOK, true)] };

/** Background villagers, each with a 2-frame breathing idle and a 2-frame walk. */
export const VILLAGERS = VILLAGER_LOOKS.map((look) => ({
  idle: [villager(look, false), villager(look, true)],
  walk: [villager(look, false, 2), villager(look, true, 0)],
}));

// --- Your friend ---

/**
 * Your age, neat and devout: tidy blond hair, hands clasped at the chest, and (placeholder signature
 * detail) a small cyan token of the tube on a cord round the neck. Their dream is to rise.
 */
function friend(breathe: boolean): RowSprite {
  const g = grid(12, 25);
  const b = breathe ? 1 : 0;
  // Head, with blond hair cut neat and flat across the top, lighter where the light catches it.
  span(g, 0 + b, 3, 7, 'y');
  put(g, 7, 0 + b, 'Y');
  put(g, 6, 0 + b, 'Y');
  for (let y = 1; y <= 3; y++) {
    span(g, y + b, 3, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 1 + b, 3, 6, 'y');
  put(g, 7, 1 + b, 'Y');
  put(g, 3, 2 + b, 'y');
  put(g, 3, 3 + b, 'y');
  span(g, 4 + b, 4, 6, 'o');
  put(g, 7, 4 + b, '#');
  // Neck, shoulders, body.
  span(g, 5 + b, 5, 6, 'o');
  for (let y = 6; y <= 15; y++) {
    span(g, y + b, 4, 8, 'o');
    put(g, 9, y + b, '#');
  }
  // Back arm in shadow; front arm bent up so the hands meet, clasped, at the chest.
  for (let y = 7; y <= 13; y++) put(g, 3, y + b, 'o');
  for (let y = 7; y <= 9; y++) put(g, 10, y + b, '#');
  span(g, 10 + b, 8, 10, 'k');
  span(g, 11 + b, 8, 9, 'k');
  // The tube token: a cord from the neck to a single cyan bead.
  put(g, 5, 6 + b, 't');
  put(g, 7, 6 + b, 't');
  put(g, 6, 7 + b, 't');
  put(g, 6, 8 + b, 'q');
  // Legs, standing straight; toes forward.
  for (let y = 16; y <= 24; y++) {
    span(g, y, 4, 5, 'o');
    put(g, 7, y, 'o');
    put(g, 8, y, '#');
  }
  put(g, 9, 24, 'o');
  put(g, 6, 24, 'o');
  edgeShadowSide(g);
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, k: SHADES.woodPale, t: SHADES.woodLight, q: SHADES.cyan, y: SHADES.amberDeep, Y: SHADES.amber } };
}

export const FRIEND = { idle: [friend(false), friend(true)] };

// --- The girl in the roots ---

/**
 * Your age, edgy, refuses to conform: choppy, messy hair with the glowing green strand
 * (the design doc's signature detail), a ring in her ear, tattoos in glowing fungus ink up her
 * arm, arms crossed and weight on one hip.
 */
function girl(breathe: boolean): RowSprite {
  const g = grid(12, 24);
  const b = breathe ? 1 : 0;
  // Head: messy hair, choppy and falling to the shoulders on both sides.
  for (let y = 0; y <= 3; y++) span(g, y + b, 3, 7, 'o');
  put(g, 8, 0 + b, 'o');
  for (let y = 1; y <= 5; y++) put(g, 8, y + b, y % 2 ? 'o' : '#');
  put(g, 9, 4 + b, 'o');
  span(g, 4 + b, 4, 6, 'o');
  for (let y = 1; y <= 7; y++) put(g, 2, y + b, 'o'); // hair falling down the back
  put(g, 3, 6 + b, 'o');
  put(g, 3, 7 + b, 'o');
  // The glowing strand, falling from the crown past her shoulder.
  put(g, 4, 0 + b, 'g');
  for (let y = 1; y <= 8; y++) put(g, 3 - (y > 5 ? 1 : 0), y + b, 'g');
  put(g, 7, 3 + b, 'p'); // ring in her ear, showing through her hair
  // Neck, body, a cropped top over a longer ragged skirt.
  span(g, 5 + b, 5, 6, 'o');
  for (let y = 6; y <= 14; y++) {
    span(g, y + b, 4, 8, 'o');
    put(g, 9, y + b, '#');
  }
  // Arms crossed over the chest: forearms across, tattooed arm glowing in lines.
  span(g, 9 + b, 4, 9, 'o');
  span(g, 10 + b, 3, 9, 'o');
  put(g, 10, 9 + b, '#');
  put(g, 10, 10 + b, '#');
  put(g, 6, 10 + b, 't');
  put(g, 8, 10 + b, 't');
  put(g, 9, 7 + b, 't');
  // Ragged hem, then legs with weight on the back one (the front knee bent out).
  for (let x = 3; x <= 9; x += 2) put(g, x, 15 + b, 'o');
  for (let y = 15; y <= 23; y++) {
    span(g, y, 4, 5, 'o');
    const front = y < 19 ? 7 : 8;
    put(g, front, y, 'o');
    put(g, front + 1, y, '#');
  }
  put(g, 10, 23, 'o');
  edgeShadowSide(g);
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, g: SHADES.green, t: SHADES.greenMid, p: SHADES.light } };
}

export const GIRL = { idle: [girl(false), girl(true)] };

// --- The archivist ---

/**
 * A reasonable member of high society who keeps the Ascension records: tall and neat in a long
 * coat with a high collar, spectacles that catch the light, hands folded behind their back, and the
 * pale ribbon of the upper branches (the design doc's signature detail) tied in their hair and
 * trailing behind.
 */
function archivist(breathe: boolean): RowSprite {
  const g = grid(13, 27);
  const b = breathe ? 1 : 0;
  // Neat hair, tied back.
  span(g, 0 + b, 4, 7, 'o');
  for (let y = 1; y <= 3; y++) {
    span(g, y + b, 3, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 4 + b, 4, 6, 'o');
  put(g, 7, 4 + b, '#');
  put(g, 7, 2 + b, 'g'); // spectacles glint
  // The pale ribbon: a bow at the back of the head, its tails trailing behind.
  put(g, 2, 1 + b, 'r');
  put(g, 2, 2 + b, 'r');
  put(g, 1, 3 + b, 'r');
  put(g, 1, 4 + b, 'r');
  put(g, 0, 5 + b, 'r');
  // High collar, then the long coat to below the knee.
  span(g, 5 + b, 5, 7, 'l');
  for (let y = 6; y <= 21; y++) {
    const w = y < 16 ? 0 : Math.floor((y - 16) / 3);
    span(g, y + (y < 16 ? b : 0), 4 - w, 8 + w, 'o');
    put(g, 9 + w, y + (y < 16 ? b : 0), '#');
  }
  // A line of pale buttons down the front edge.
  for (let y = 8; y <= 18; y += 3) put(g, 8, y + (y < 16 ? b : 0), 'l');
  // Legs below the coat.
  for (let y = 22; y <= 26; y++) {
    span(g, y, 4, 5, 'o');
    put(g, 7, y, 'o');
    put(g, 8, y, '#');
  }
  put(g, 9, 26, 'o');
  edgeShadowSide(g);
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, r: SHADES.white, l: SHADES.light, g: SHADES.cyanMid } };
}

export const ARCHIVIST = { idle: [archivist(false), archivist(true)] };

// --- The scavenger (Chapter 2's protagonist) ---

/**
 * The scavenger (designer: slim and fit, ginger, long hair in a ponytail, a satchel, fairly pale with
 * freckles, trousers and a crop top). Out in the borderland's daylight she's drawn in colour, not as a
 * rim-lit silhouette like the figures inside the tree. Her ginger hair carries the protagonist's red
 * (red is reserved: birds and the protagonist), with amber where the light catches it; the ponytail
 * swings out behind her as she moves, like the carver's thread. Her freckles show on her portrait.
 * 12×26 like the carver, so she uses the same body and animations.
 */
interface ScavengerPose {
  sway: [number, number];
  lift?: [number, number];
  bob?: number;
  arm?: number;
  /** The ponytail, as offsets from the tie at the back of her head. */
  tail: [number, number][];
}

const SCAVENGER_COLOURS = {
  R: SHADES.copper, r: SHADES.copperDeep, A: SHADES.amber, // hair: copper (reserved for the protagonist, like red), its shadow, amber where the light catches it
  K: SHADES.skinFair, W: SHADES.white, k: SHADES.skinFairShade, d: SHADES.deep, // fair skin, warm (designer: not too pale), and its shadow; eye
  C: SHADES.cyanMid, c: SHADES.cyanDeep, // the crop top
  P: SHADES.woodPale, p: SHADES.woodLight, b: SHADES.deep, // trousers, their shadow; boots
  S: SHADES.amberDeep, s: SHADES.wood, // the satchel and its strap
};

function scavenger(pose: ScavengerPose): RowSprite {
  const g = grid(PROTAGONIST_W, PROTAGONIST_H);
  const b = pose.bob ?? 0;
  // Copper, with amber where the light catches it and deep copper in shadow.
  const ginger = (x: number, y: number) => (y === 0 && x > 5 ? 'A' : 'R');
  // The ponytail first, so her head and body are drawn over its root.
  for (const [i, [dx, dy]] of pose.tail.entries()) {
    const x = 3 + dx;
    const y = 2 + b + dy;
    put(g, x, y, i >= pose.tail.length - 2 ? 'r' : i % 2 ? ginger(x, y) : 'r');
  }
  // Head: hair pulled back, a fringe, her face to the right.
  for (let x = 4; x <= 7; x++) put(g, x, 0 + b, ginger(x, 0));
  for (let x = 3; x <= 8; x++) put(g, x, 1 + b, x < 5 ? 'r' : ginger(x, 1));
  span(g, 2 + b, 3, 4, 'r');
  put(g, 5, 2 + b, ginger(5, 2));
  span(g, 2 + b, 6, 8, 'K');
  put(g, 7, 2 + b, 'd'); // her eye
  span(g, 3 + b, 3, 4, 'r');
  span(g, 3 + b, 5, 8, 'K');
  put(g, 5, 3 + b, 'k'); // her ear
  span(g, 4 + b, 5, 7, 'K');
  put(g, 5, 4 + b, 'k');
  put(g, 3, 2 + b, 'C'); // the tie
  // Neck and shoulders.
  span(g, 5 + b, 5, 6, 'k');
  // The crop top: short, bare midriff under it.
  span(g, 6 + b, 4, 8, 'C');
  for (let y = 7; y <= 10; y++) {
    span(g, y + b, 4, 8, 'C');
    put(g, 4, y + b, 'c');
  }
  for (let y = 11; y <= 12; y++) {
    span(g, y + b, 4, 8, 'K');
    put(g, 4, y + b, 'k');
  }
  // The satchel's strap across her chest, the bag at her back hip.
  for (const [x, y] of [[8, 6], [7, 7], [7, 8], [6, 9], [5, 10], [5, 11], [4, 12]] as const) put(g, x, y + b, 's');
  for (let y = 11; y <= 15; y++) span(g, y + b, 2, 3, y === 11 ? 'A' : 'S');
  put(g, 2, 15 + b, 's');
  put(g, 3, 13 + b, 'A'); // the buckle
  // Back arm (in shadow), swinging opposite the front one.
  const arm = pose.arm ?? 0;
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 10 ? -Math.sign(arm) * Math.min(Math.abs(arm), y - 9) : 0;
    if (g[y + b]?.[3 + swing] === '.') put(g, 3 + swing, y + b, 'k');
  }
  // Front arm, lit.
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 10 ? Math.sign(arm) * Math.min(Math.abs(arm), y - 9) : 0;
    put(g, 9 + swing, y + b, y === 7 ? 'C' : 'K');
  }
  put(g, 9 + arm, 14 + b, 'k'); // her hand
  // Trousers: the waist, then the legs; boots for the last three rows.
  span(g, 13 + b, 4, 8, 'p');
  for (let y = 14; y <= 16; y++) span(g, y + b, 4, 8, 'P');
  const [liftBack, liftFront] = pose.lift ?? [0, 0];
  const leg = (hipX: number, sway: number, lift: number, front: boolean) => {
    const bottom = PROTAGONIST_H - 1 - lift;
    for (let y = 17; y <= bottom; y++) {
      const x = hipX + Math.round((sway * (y - 17)) / Math.max(1, bottom - 17));
      const boot = y > bottom - 3;
      put(g, x, y, boot ? 'b' : front ? 'P' : 'p');
      put(g, x + 1, y, boot ? 'b' : front ? 'P' : 'p');
      if (y === bottom) put(g, x + 2, y, 'b');
    }
  };
  leg(4, pose.sway[0], liftBack, false);
  leg(6, pose.sway[1], liftFront, true);
  return { rows: rows(g), colours: SCAVENGER_COLOURS };
}

const TAIL_HANG: [number, number][] = [[-1, 0], [-1, 1], [-1, 2], [-1, 3], [-1, 4], [-2, 5]];
const TAIL_SWING_A: [number, number][] = [[-1, 0], [-2, 1], [-2, 2], [-3, 3], [-3, 4], [-4, 4]];
const TAIL_SWING_B: [number, number][] = [[-1, 0], [-1, 1], [-2, 2], [-2, 3], [-3, 4], [-3, 5]];

export const SCAVENGER = {
  idle: [scavenger({ sway: [0, 0], tail: TAIL_HANG }), scavenger({ sway: [0, 0], bob: 1, tail: TAIL_HANG })],
  walk: [
    scavenger({ sway: [-3, 3], arm: -1, tail: TAIL_SWING_A }),
    scavenger({ sway: [-1, 1], lift: [0, 2], bob: 1, arm: 0, tail: TAIL_SWING_B }),
    scavenger({ sway: [3, -3], arm: 1, tail: TAIL_SWING_A }),
    scavenger({ sway: [1, -1], lift: [2, 0], bob: 1, arm: 0, tail: TAIL_SWING_B }),
  ],
  jump: scavenger({ sway: [-1, 2], lift: [3, 2], arm: 1, tail: [[-1, 1], [-1, 2], [-1, 3], [-1, 4], [-1, 5], [-2, 6]] }),
  fall: scavenger({ sway: [-1, 1], arm: -1, tail: [[-1, 0], [-2, -1], [-3, -1], [-4, -2], [-5, -2], [-5, -3]] }),
};

/** Crouching: bent forward, head low and out in front, the ponytail falling over her back, the satchel hanging. */
const scavengerCrouch = (legs: [string, string, string, string]): RowSprite => ({
  rows: [
    ...Array<string>(10).fill('............'),
    '.......RAR..',
    '......ARARA.',
    '.rr..rRAKdW.',
    'r..ArCRKKKW.',
    '...rCCCCkK..',
    '...CCCCCCKK.',
    '...SCCCCCC..',
    '..SSKKKKK.K.',
    '..ASppppp.k.',
    '..SSPPPPP...',
    '..sPPPPP....',
    '..PPPPPPP...',
    ...legs,
  ],
  colours: SCAVENGER_COLOURS,
});

export const SCAVENGER_CROUCH = {
  idle: scavengerCrouch(['..pp..PPP...', '..pp...PP...', '..bb...bb...', '.bbb...bbb..']),
  walk: [
    scavengerCrouch(['..pp..PPP...', '..pp...PP...', '..bb...bb...', '.bbb...bbb..']),
    scavengerCrouch(['..pp..PPP...', '...pp.PP....', '...bb.bb....', '..bbb.bbb...']),
  ],
};

// --- The prince (Chapter 3's protagonist) ---

/**
 * The prince (designer: young and attractive, a shaved head, dark hair cut very short; not balding, not
 * old; tan skin, Claude's choice). Drawn in colour like the scavenger. A fitted, high-collared coat, dark
 * so he stands out against the citadel's pale marble, with gold trim down its front and at the cuffs; his
 * collar and sash are wine, his reserved colour (designer), as red is the carver's and copper the
 * scavenger's. 12×26 like the others, so he uses the same body and animations.
 */
interface PrincePose {
  sway: [number, number];
  lift?: [number, number];
  bob?: number;
  arm?: number;
}

const PRINCE_COLOURS = {
  H: SHADES.deep, h: SHADES.woodPale, // the dark hair, cut very short; where the light catches it
  K: SHADES.skinTan, k: SHADES.skinTanShade, d: SHADES.shadow, // tan skin, its shadow; his eye
  C: SHADES.cyanDeep, c: SHADES.deep, // the coat, dark, and its shadow
  A: SHADES.amber, // gold: the trim, the clasp, the cuffs
  R: SHADES.wine, r: SHADES.wineDeep, // the collar and sash: wine (reserved, like red)
  P: SHADES.wood, p: SHADES.deep, b: SHADES.shadow, // trousers, their shadow; boots
};

function prince(pose: PrincePose): RowSprite {
  const g = grid(PROTAGONIST_W, PROTAGONIST_H);
  const b = pose.bob ?? 0;
  // Head: a close dark crop over the crown and the back, the forehead and face bare, to the right.
  span(g, 0 + b, 4, 7, 'H');
  put(g, 6, 0 + b, 'h');
  span(g, 1 + b, 3, 6, 'H');
  put(g, 5, 1 + b, 'h');
  span(g, 1 + b, 7, 8, 'K');
  span(g, 2 + b, 3, 4, 'H');
  span(g, 2 + b, 5, 8, 'K');
  put(g, 7, 2 + b, 'd'); // his eye
  put(g, 3, 3 + b, 'H');
  span(g, 3 + b, 4, 8, 'K');
  put(g, 5, 3 + b, 'k'); // his ear
  span(g, 4 + b, 5, 7, 'K');
  put(g, 5, 4 + b, 'k');
  // The high collar, up to his jaw.
  span(g, 5 + b, 4, 7, 'R');
  put(g, 4, 5 + b, 'r');
  // The coat: dark, gold down its front edge, the wine sash at the waist, the skirt to the knee.
  for (let y = 6; y <= 17; y++) {
    span(g, y + b, 4, 8, y === 12 ? 'R' : 'C');
    put(g, 4, y + b, y === 12 ? 'r' : 'c');
    put(g, 8, y + b, 'A');
  }
  put(g, 7, 6 + b, 'A'); // the clasp at his throat
  put(g, 3, 16 + b, 'c');
  put(g, 3, 17 + b, 'c');
  // Back arm (in shadow), swinging opposite the front one.
  const arm = pose.arm ?? 0;
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 10 ? -Math.sign(arm) * Math.min(Math.abs(arm), y - 9) : 0;
    if (g[y + b]?.[3 + swing] === '.') put(g, 3 + swing, y + b, 'c');
  }
  // Front arm: the sleeve, a gold cuff, his hand.
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 10 ? Math.sign(arm) * Math.min(Math.abs(arm), y - 9) : 0;
    put(g, 9 + swing, y + b, y === 13 ? 'A' : 'C');
  }
  put(g, 9 + arm, 14 + b, 'K');
  // Legs below the coat; boots for the last two rows.
  const [liftBack, liftFront] = pose.lift ?? [0, 0];
  const leg = (hipX: number, sway: number, lift: number, front: boolean) => {
    const bottom = PROTAGONIST_H - 1 - lift;
    for (let y = 18; y <= bottom; y++) {
      const x = hipX + Math.round((sway * (y - 18)) / Math.max(1, bottom - 18));
      const boot = y > bottom - 2;
      put(g, x, y, boot ? 'b' : front ? 'P' : 'p');
      put(g, x + 1, y, boot ? 'b' : front ? 'P' : 'p');
      if (y === bottom) put(g, x + 2, y, 'b');
    }
  };
  leg(4, pose.sway[0], liftBack, false);
  leg(6, pose.sway[1], liftFront, true);
  return { rows: rows(g), colours: PRINCE_COLOURS };
}

export const PRINCE = {
  idle: [prince({ sway: [0, 0] }), prince({ sway: [0, 0], bob: 1 })],
  walk: [
    prince({ sway: [-3, 3], arm: -1 }),
    prince({ sway: [-1, 1], lift: [0, 2], bob: 1, arm: 0 }),
    prince({ sway: [3, -3], arm: 1 }),
    prince({ sway: [1, -1], lift: [2, 0], bob: 1, arm: 0 }),
  ],
  jump: prince({ sway: [-1, 2], lift: [3, 2], arm: 1 }),
  fall: prince({ sway: [-1, 1], arm: -1 }),
};

/** Crouching: bent forward, head low and out in front, the coat's skirt over his legs. */
const princeCrouch = (legs: [string, string, string, string]): RowSprite => ({
  rows: [
    ...Array<string>(10).fill('............'),
    '......HHH...',
    '.....HHHKK..',
    '.....HKKdK..',
    '....RRkKKK..',
    '...CCRRKK...',
    '..cCCCCCAK..',
    '..cCCCCCA.K.',
    '..cRRRRRA.k.',
    '..cCCCCCA...',
    '..cCCCCCA...',
    '..cCCCCCA...',
    '..ccCCCCA...',
    ...legs,
  ],
  colours: PRINCE_COLOURS,
});

export const PRINCE_CROUCH = {
  idle: princeCrouch(['..pp..PPP...', '..pp...PP...', '..bb...bb...', '.bbb...bbb..']),
  walk: [
    princeCrouch(['..pp..PPP...', '..pp...PP...', '..bb...bb...', '.bbb...bbb..']),
    princeCrouch(['..pp..PPP...', '...pp.PP....', '...bb.bb....', '..bbb.bbb...']),
  ],
};
