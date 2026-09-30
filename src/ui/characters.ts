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

interface VillagerLook {
  height: number; // 21–26
  width: number; // body half-width 2–4
  head: 'bare' | 'hood' | 'cap' | 'bun';
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
  } else if (look.head === 'cap') {
    span(g, headTop + b, cx - 2, cx + 3, 'c');
    put(g, cx + 4, headTop + 1 + b, 'c');
  } else if (look.head === 'bun') {
    span(g, headTop + b, cx - 1, cx, look.hair ? 'h' : 'o');
  }
  if (look.hair && look.head !== 'hood' && look.head !== 'cap') {
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
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, t: SHADES.light, w: SHADES.woodPale, c: look.accent, u: SHADES.amberDeep, h: look.hair ?? SHADES.shadow, s: SHADES.woodPale } };
}

const LOOKS: VillagerLook[] = [
  { height: 25, width: 3, head: 'hood', accent: SHADES.greenDeep },
  { height: 23, width: 3, head: 'cap', accent: SHADES.cyanDeep },
  { height: 26, width: 2, head: 'bare', bundle: true, accent: SHADES.amberDeep },
  { height: 24, width: 3, head: 'bun', long: true, accent: SHADES.woodPale },
  { height: 22, width: 3, head: 'bare', accent: SHADES.woodLight },
  { height: 25, width: 3, head: 'hood', long: true, accent: SHADES.cyanDeep },
  { height: 21, width: 2, head: 'cap', accent: SHADES.greenMid },
];

/**
 * The elders who meet with the Tender in the shrine: old, grey-haired, long robes with an amber band
 * and a pale stole (placeholder looks until the designer describes them).
 */
export const ELDERS = ([
  { height: 24, width: 3, head: 'bare', long: true, accent: SHADES.amberDeep, hair: SHADES.light, stole: true },
  { height: 23, width: 3, head: 'bun', long: true, accent: SHADES.amberDeep, hair: SHADES.dim, stole: true },
  { height: 25, width: 2, head: 'bare', long: true, accent: SHADES.amberDeep, hair: SHADES.dim, stole: true },
  { height: 22, width: 3, head: 'hood', long: true, accent: SHADES.amberDeep, stole: true },
] satisfies VillagerLook[]).map((look) => ({ idle: [villager(look, false), villager(look, true)] }));

/** The preacher: tall and thin in a long hooded robe with a band of the tube's cyan (placeholder look). */
export const PREACHER = (() => {
  const look: VillagerLook = { height: 26, width: 2, head: 'hood', long: true, accent: SHADES.cyanMid, stole: true };
  return { idle: [villager(look, false), villager(look, true)] };
})();

/** A guard of the middle tiers' checkpoint: capped, amber-banded, with a staff (placeholder look). */
export const GUARD = (() => {
  const look: VillagerLook = { height: 25, width: 3, head: 'cap', accent: SHADES.amber, staff: true };
  return { idle: [villager(look, false), villager(look, true)] };
})();

/** Better-off residents of the middle tiers and upper branches: amber and pale accents, finer headwear (placeholder looks). */
export const RESIDENTS = ([
  { height: 24, width: 3, head: 'bun', long: true, accent: SHADES.amber, hair: SHADES.dim },
  { height: 25, width: 3, head: 'cap', accent: SHADES.light },
  { height: 23, width: 3, head: 'bare', long: true, accent: SHADES.cyanMid, hair: SHADES.woodLight },
  { height: 26, width: 2, head: 'bare', accent: SHADES.amberDeep, hair: SHADES.amberDeep, stole: true },
] satisfies VillagerLook[]).map((look) => ({
  idle: [villager(look, false), villager(look, true)],
  walk: [villager(look, false, 2), villager(look, true, 0)],
}));

/** Background villagers, each with a 2-frame breathing idle and a 2-frame walk. */
export const VILLAGERS = LOOKS.map((look) => ({
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
