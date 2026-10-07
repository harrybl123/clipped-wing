import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER people of the borderland (Chapter 2) until the art pass. Out in the daylight they're drawn
// in colour, like the scavenger, not as the tree's rim-lit silhouettes: skin, hair, patched clothes, and
// the borderland's look: found tech worn as trinkets (a cyan glint), goggles pushed up, scarves against
// the dust, packs on frames, a plate of scrap strapped on as armour. Generated from a `FolkLook` so a
// walk cycle stays consistent. All face right; the game flips them. Never red or copper (reserved).

export type SkinTone = 'fair' | 'tan' | 'dark';

export const SKIN: Record<SkinTone, [lit: number, shade: number]> = {
  fair: [SHADES.skinFair, SHADES.skinFairShade],
  tan: [SHADES.skinTan, SHADES.skinTanShade],
  dark: [SHADES.skinDark, SHADES.skinDarkShade],
};

export interface FolkLook {
  /** 18 (a child) to 27. */
  height: number;
  /** Half the body's width, 2–4. */
  width: number;
  skin: SkinTone;
  hair: number;
  hairStyle: 'short' | 'long' | 'bald' | 'bun' | 'tail' | 'crest' | 'messy';
  head?: 'goggles' | 'cap' | 'wrap' | 'hood';
  /** The top's colour, and what it is: a vest (bare arms), a shirt, a coat to the knee, or a long coat or dress to the floor. */
  top: number;
  topStyle: 'vest' | 'shirt' | 'coat' | 'long';
  legs: number;
  boots?: number;
  pack?: 'frame' | 'bag';
  scarf?: number;
  /** A bit of found tech worn on a cord: a cyan glint at the chest. */
  trinket?: boolean;
  /** A plate of scrap strapped to the shoulder, as armour. */
  plate?: boolean;
  /** Carried in the front hand: a hook on a pole (for scavenging), or a staff. */
  tool?: 'hook' | 'staff';
  apron?: number;
}

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
const put = (g: Grid, x: number, y: number, c: string) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0]!.length) g[y]![x] = c;
};
const span = (g: Grid, y: number, x0: number, x1: number, c: string) => {
  for (let x = x0; x <= x1; x++) put(g, x, y, c);
};

/** A darker shade of a clothes colour, for its shadowed side. */
const DARKER: Record<number, number> = {
  [SHADES.light]: SHADES.dim, [SHADES.dim]: SHADES.woodPale, [SHADES.woodPale]: SHADES.woodLight, [SHADES.woodLight]: SHADES.wood,
  [SHADES.wood]: SHADES.deep, [SHADES.amber]: SHADES.amberDeep, [SHADES.amberDeep]: SHADES.wood, [SHADES.cyan]: SHADES.cyanMid,
  [SHADES.cyanMid]: SHADES.cyanDeep, [SHADES.cyanDeep]: SHADES.deep, [SHADES.greenMid]: SHADES.greenDeep, [SHADES.greenDeep]: SHADES.deep,
  [SHADES.white]: SHADES.light,
};
export const darker = (c: number) => DARKER[c] ?? SHADES.deep;

/** One frame: `breathe` bobs the upper body, `stride` spreads the legs (walking). */
export function folk(look: FolkLook, breathe = false, stride = 0): RowSprite {
  const W = 14;
  const H = look.height;
  const child = H < 21;
  const g = grid(W, H);
  const b = breathe ? 1 : 0;
  const cx = 6;
  const w = look.width;
  // A pack on a frame, or a bag, on the back (drawn first, behind the body).
  if (look.pack === 'frame') {
    for (let y = 3; y <= 13; y++) span(g, y + b, cx - w - 3, cx - w - 1, y === 3 || y === 13 ? 'P' : (y % 4 === 0 ? 'P' : 'p'));
    put(g, cx - w - 3, 2 + b, 'P');
  } else if (look.pack === 'bag') {
    for (let y = 9; y <= 13; y++) span(g, y + b, cx - w - 2, cx - w - 1, y === 9 ? 'P' : 'p');
  }
  // Head: hair behind and over it, the face on the right.
  const headTop = 0;
  for (let y = headTop + 1; y <= headTop + 4; y++) span(g, y + b, cx - 2, cx + 2, 's');
  for (let y = headTop + 1; y <= headTop + 3; y++) put(g, cx - 2, y + b, 'S');
  put(g, cx + 1, headTop + 2 + b, 'd'); // the eye
  const hairRow = (y: number, x0: number, x1: number) => span(g, y + b, x0, x1, 'h');
  switch (look.hairStyle) {
    case 'bald':
      span(g, headTop + b, cx - 1, cx + 1, 's');
      break;
    case 'crest':
      hairRow(headTop, cx - 1, cx + 1);
      put(g, cx, headTop - 1 + b, 'h');
      break;
    case 'messy':
      hairRow(headTop, cx - 2, cx + 2);
      hairRow(headTop + 1, cx - 3, cx + 1);
      put(g, cx + 2, headTop + b, 'H');
      put(g, cx - 3, headTop + 2 + b, 'h');
      break;
    default:
      hairRow(headTop, cx - 2, cx + 2);
      hairRow(headTop + 1, cx - 2, cx);
      put(g, cx - 3, headTop + 1 + b, 'H');
  }
  if (look.hairStyle === 'long') for (let y = 2; y <= 7; y++) span(g, y + b, cx - 3, cx - 2, y > 6 ? 'H' : 'h');
  if (look.hairStyle === 'tail') for (const [x, y] of [[cx - 3, 2], [cx - 4, 3], [cx - 4, 4], [cx - 4, 5]] as const) put(g, x, y + b, 'h');
  if (look.hairStyle === 'bun') span(g, headTop + b - 1 < 0 ? headTop + b : headTop - 1 + b, cx - 3, cx - 2, 'h');
  // Headwear.
  if (look.head === 'cap') {
    span(g, headTop + b, cx - 2, cx + 2, 'c');
    span(g, headTop + 1 + b, cx + 1, cx + 4, 'C');
  } else if (look.head === 'goggles') {
    put(g, cx, headTop + 1 + b, 'g');
    put(g, cx + 1, headTop + 1 + b, 'G');
    put(g, cx + 2, headTop + 1 + b, 'g');
  } else if (look.head === 'wrap' || look.head === 'hood') {
    span(g, headTop + b, cx - 2, cx + 2, 'c');
    for (let y = 1; y <= (look.head === 'hood' ? 6 : 3); y++) put(g, cx - 3, y + b, 'C');
    put(g, cx - 2, headTop + 1 + b, 'c');
  }
  // Neck, body.
  span(g, headTop + 5 + b, cx, cx + 1, 'S');
  const bodyTop = headTop + 6;
  const legTop = H - (child ? 6 : 8);
  const coatTo = look.topStyle === 'coat' ? Math.min(H - 3, legTop + 4) : look.topStyle === 'long' ? H - 1 : legTop - 1;
  for (let y = bodyTop; y <= coatTo; y++) {
    const yy = y + (y < legTop ? b : 0);
    const flare = y >= legTop ? Math.floor((y - legTop) / 3) + (look.topStyle === 'long' ? 1 : 0) : 0;
    const sway = y >= legTop + 2 ? stride : 0;
    span(g, yy, cx - w - flare + sway, cx + w + flare + sway, 't');
    put(g, cx - w - flare + sway, yy, 'T');
    put(g, cx + w + flare + sway, yy, 'U');
  }
  if (look.apron !== undefined) for (let y = bodyTop + 3; y <= Math.min(H - 3, legTop + 3); y++) span(g, y + (y < legTop ? b : 0), cx - 1, cx + w, 'a');
  if (look.scarf !== undefined) {
    span(g, bodyTop + b, cx - w, cx + w, 'f');
    put(g, cx - w, bodyTop + 1 + b, 'f');
    put(g, cx - w, bodyTop + 2 + b, 'F');
  }
  if (look.trinket) put(g, cx + 1, bodyTop + 2 + b, 'G');
  if (look.plate) {
    span(g, bodyTop + b, cx + 1, cx + w + 1, 'm');
    span(g, bodyTop + 1 + b, cx + 2, cx + w + 1, 'M');
  }
  // A belt.
  if (look.topStyle !== 'long') span(g, legTop - 1 + b, cx - w, cx + w, 'T');
  // Arms: the back one in shade, the front one swinging a little, bare on a vest.
  const sleeve = look.topStyle === 'vest' ? 's' : 'U';
  const backSleeve = look.topStyle === 'vest' ? 'S' : 'T';
  for (let y = bodyTop + 1; y <= bodyTop + 6; y++) {
    const swing = y >= bodyTop + 4 ? -Math.sign(stride) : 0;
    if (g[y + b]?.[cx - w - 1 + swing] === '.') put(g, cx - w - 1 + swing, y + b, backSleeve);
  }
  for (let y = bodyTop + 1; y <= bodyTop + 6; y++) {
    const swing = y >= bodyTop + 4 ? Math.sign(stride) : 0;
    put(g, cx + w + 1 + swing, y + b, sleeve);
  }
  put(g, cx + w + 1 + Math.sign(stride), bodyTop + 7 + b, 's'); // the hand
  // Legs (unless a long coat or dress hides them), boots.
  if (look.topStyle !== 'long') {
    for (let y = Math.max(legTop, coatTo + 1); y < H; y++) {
      const t = (y - legTop) / Math.max(1, H - 1 - legTop);
      const back = cx - 2 - Math.round(stride * t);
      const front = cx + 1 + Math.round(stride * t);
      const boot = y >= H - 2;
      span(g, y, back, back + 1, boot ? 'B' : 'L');
      span(g, y, front, front + 1, boot ? 'B' : 'l');
      if (y === H - 1) put(g, front + 2, y, 'B');
    }
  } else {
    put(g, cx + 2 + stride, H - 1, 'B');
  }
  // A tool in the front hand: a hook on a pole, or a staff.
  if (look.tool) {
    const tx = cx + w + 2;
    for (let y = 2; y < H; y++) put(g, tx, y, 'w');
    if (look.tool === 'hook') {
      put(g, tx + 1, 2, 'k');
      put(g, tx + 1, 3, 'k');
      put(g, tx, 1, 'k');
    } else put(g, tx, 1, 'k');
  }
  const [skin, skinShade] = SKIN[look.skin];
  const pack = look.pack === 'frame' ? SHADES.woodPale : SHADES.amberDeep;
  return {
    rows: g.map((r) => r.join('')),
    colours: {
      s: skin, S: skinShade, d: SHADES.shadow,
      h: look.hair, H: darker(look.hair),
      t: look.top, T: darker(look.top), U: look.top === SHADES.light ? SHADES.white : look.top,
      l: look.legs, L: darker(look.legs), B: look.boots ?? SHADES.deep,
      p: pack, P: darker(pack),
      c: look.scarf ?? SHADES.woodPale, C: darker(look.scarf ?? SHADES.woodPale),
      f: look.scarf ?? SHADES.woodPale, F: darker(look.scarf ?? SHADES.woodPale),
      g: SHADES.dim, G: SHADES.cyan,
      m: SHADES.light, M: SHADES.dim,
      w: SHADES.woodPale, k: SHADES.light,
      a: look.apron ?? SHADES.light,
    },
  };
}

/** Breathing idle frames and a two-step walk for a look. */
export function folkFrames(look: FolkLook): { idle: RowSprite[]; walk: RowSprite[] } {
  return { idle: [folk(look, false), folk(look, true)], walk: [folk(look, false, 2), folk(look, true, -2)] };
}

// --- The dog ---

/**
 * The dog (Chapter 2): a scruffy, rangy mutt, dusty brown with a pale chest and muzzle and one torn ear,
 * found out on the waste. Your secret, and your brother adores it. Facing right; tail up and wagging.
 */
function dog(tailUp: boolean, step: number): RowSprite {
  const rows = [
    '..........b.b...',
    '..........bbbb..',
    't........bbbbeo.',
    (tailUp ? '.t' : 't.') + '.......bbbmmm.',
    '.tbbbbbbbbbbmmn.',
    '..bbbbbbbbbbm...',
    '..bBBBBBBBpp....',
    '..bBBBBBBBpp....',
    step === 0 ? '..b.b.....b.b...' : '...b.b...b.b....',
    step === 0 ? '..b.b.....b.b...' : '...b.b...b.b....',
    step === 0 ? '..d.d.....d.d...' : '...d.d...d.d....',
  ];
  return { rows: rows.map((r) => r.padEnd(16, '.').slice(0, 16)), colours: { b: SHADES.woodPale, B: SHADES.woodLight, t: SHADES.woodPale, e: SHADES.shadow, o: SHADES.shadow, m: SHADES.dim, n: SHADES.shadow, p: SHADES.light, d: SHADES.deep } };
}

export const DOG = { idle: [dog(true, 0), dog(false, 0)], walk: [dog(true, 0), dog(true, 1)] };

// --- The cast (docs/chapter-2-design.md; looks are Claude's, designer: "up to your judgement") ---

const S = SHADES;

/** The named people of the borderland, by speaker id. */
export const CAST_LOOKS = {
  /** Your brother: small, in a coat handed down and far too big, sandy hair sticking up, a tin trinket he found. */
  brother: { height: 19, width: 2, skin: 'fair', hair: S.amber, hairStyle: 'messy', top: S.woodPale, topStyle: 'coat', legs: S.woodLight, trinket: true },
  /** The boss: charming and protective; a good long coat, greying hair, a warm scarf, a found gem at his throat. */
  boss: { height: 26, width: 3, skin: 'tan', hair: S.dim, hairStyle: 'short', top: S.amberDeep, topStyle: 'coat', legs: S.wood, scarf: S.amber, trinket: true },
  /** The watcher: tall, quiet, always at the boss's shoulder; a long dark coat, a hood. */
  watcher: { height: 27, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'bald', head: 'hood', top: S.woodLight, topStyle: 'long', legs: S.wood, scarf: S.wood },
  /** The enforcer: loyal muscle; broad, bare arms, a scrap plate strapped on as armour, head shaved but for a crest. */
  enforcer: { height: 26, width: 4, skin: 'tan', hair: S.woodLight, hairStyle: 'crest', top: S.woodPale, topStyle: 'vest', legs: S.woodLight, plate: true },
  /** The boss's son: your age, dressed better than anyone else your age, a bright scarf, jealous. */
  boss_son: { height: 24, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'messy', top: S.cyanMid, topStyle: 'shirt', legs: S.woodPale, scarf: S.amber, trinket: true },
  /** Your friend: long dark hair, an amber shirt, a cyan scarf. */
  scav_friend: { height: 23, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'long', top: S.amber, topStyle: 'shirt', legs: S.woodPale, scarf: S.cyanMid },
  /** The old scavenger: gruff, goggles pushed up, a frame pack, a hook on a pole, white hair. */
  old_scav: { height: 24, width: 3, skin: 'tan', hair: S.light, hairStyle: 'short', head: 'goggles', top: S.woodLight, topStyle: 'coat', legs: S.woodPale, pack: 'frame', tool: 'hook' },
  /** The gambler: thin and twitchy, a cap pulled low, a shirt that was good once. */
  gambler: { height: 25, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'messy', head: 'cap', scarf: S.dim, top: S.dim, topStyle: 'shirt', legs: S.woodLight },
  /** The kid lookout: small and quick, a cap, sees everything. */
  lookout: { height: 18, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'short', head: 'cap', scarf: S.amber, top: S.amberDeep, topStyle: 'shirt', legs: S.woodPale },
  /** The tallyman: neat, bald, a pale shirt and a leather apron, the weigher of everything. */
  tallyman: { height: 24, width: 3, skin: 'fair', hair: S.dim, hairStyle: 'bald', top: S.light, topStyle: 'shirt', legs: S.wood, apron: S.amberDeep },
  /** The barkeep: big, a pale apron. */
  barkeep: { height: 25, width: 4, skin: 'tan', hair: S.woodLight, hairStyle: 'short', top: S.woodPale, topStyle: 'shirt', legs: S.wood, apron: S.light },
  /** The madam: tall, a long amber dress, hair up, a cyan wrap, a glint of tech at her throat. */
  madam: { height: 25, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'bun', top: S.amber, topStyle: 'long', legs: S.wood, scarf: S.cyanMid, trinket: true },
  /** The fence: hooded, a coat full of pockets, a bag, things glinting. */
  fence: { height: 24, width: 2, skin: 'fair', hair: S.woodLight, hairStyle: 'short', head: 'hood', scarf: S.woodLight, top: S.wood, topStyle: 'coat', legs: S.woodLight, pack: 'bag', trinket: true },
} satisfies Record<string, FolkLook>;

export type CastId = keyof typeof CAST_LOOKS;
export const CAST = Object.fromEntries(Object.entries(CAST_LOOKS).map(([id, look]) => [id, folkFrames(look)])) as Record<CastId, ReturnType<typeof folkFrames>>;

/** Townsfolk: scavengers, traders, drinkers, workers. Background people (no lines), varied. */
export const TOWNSFOLK_LOOKS: FolkLook[] = [
  { height: 23, width: 2, skin: 'tan', hair: S.woodPale, hairStyle: 'long', head: 'wrap', scarf: S.amber, top: S.dim, topStyle: 'vest', legs: S.woodLight, pack: 'bag', tool: 'hook' },
  { height: 25, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'short', head: 'goggles', top: S.woodPale, topStyle: 'shirt', legs: S.woodLight, pack: 'frame' },
  { height: 24, width: 2, skin: 'fair', hair: S.amberDeep, hairStyle: 'crest', top: S.cyanDeep, topStyle: 'vest', legs: S.wood, trinket: true },
  { height: 23, width: 2, skin: 'fair', hair: S.woodLight, hairStyle: 'tail', top: S.cyanMid, topStyle: 'shirt', legs: S.woodPale, scarf: S.light },
  { height: 22, width: 3, skin: 'tan', hair: S.light, hairStyle: 'bun', top: S.woodPale, topStyle: 'long', legs: S.wood, scarf: S.amberDeep },
  { height: 25, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'bald', top: S.amber, topStyle: 'shirt', legs: S.wood, apron: S.woodPale },
  { height: 19, width: 2, skin: 'fair', hair: S.dim, hairStyle: 'messy', top: S.woodPale, topStyle: 'shirt', legs: S.woodLight },
  { height: 26, width: 3, skin: 'tan', hair: S.woodLight, hairStyle: 'short', head: 'cap', scarf: S.cyanDeep, top: S.woodLight, topStyle: 'vest', legs: S.woodPale, plate: true },
  { height: 24, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'messy', top: S.dim, topStyle: 'coat', legs: S.wood },
  { height: 24, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'long', top: S.cyanMid, topStyle: 'long', legs: S.wood, scarf: S.amber, trinket: true },
  { height: 25, width: 3, skin: 'dark', hair: S.woodLight, hairStyle: 'short', head: 'wrap', scarf: S.dim, top: S.amberDeep, topStyle: 'coat', legs: S.woodLight, pack: 'frame', tool: 'hook' },
  { height: 21, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'tail', top: S.amberDeep, topStyle: 'shirt', legs: S.woodPale, pack: 'bag' },
];
export const TOWNSFOLK = TOWNSFOLK_LOOKS.map(folkFrames);

/** The other clan, across the rival line: pale wraps over their heads and faces, so they're known at a distance. */
export const RIVAL_LOOKS: FolkLook[] = [
  { height: 25, width: 3, skin: 'tan', hair: S.shadow, hairStyle: 'short', head: 'wrap', scarf: S.light, top: S.light, topStyle: 'coat', legs: S.woodPale, tool: 'staff' },
  { height: 24, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'long', head: 'wrap', scarf: S.light, top: S.dim, topStyle: 'vest', legs: S.woodLight },
];
export const RIVALS = RIVAL_LOOKS.map(folkFrames);
