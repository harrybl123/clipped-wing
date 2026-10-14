import { SHADES } from './pixelArt';
import { SKIN, type SkinTone } from './borderlandFolk';
import type { RowSprite } from './sprites';

// PLACEHOLDER people of the capital (Chapter 3) until the art pass. Drawn in colour like the prince, and
// in more detail than the borderland's folk (designer: make sure every character is detailed enough):
// heads drawn like the prince's (a clean hairline, an ear, the eye), a dozen hair styles, beards; clothes
// shaded across the body (dark at the back, lit at the front edge) with the capital's look on them: high
// collars, gold trim down the front, at the cuffs and the hem, buttons, belts with a buckle, sashes,
// epaulettes, capes, embroidery on the gowns; the city's tech worn as glowing seams, visors, lenses and
// earpieces; patched clothes and aprons below. Arms at the side, behind the back, or clasped in front, and
// things carried: a guard's pike with a glowing blade, a baton, a slate, a cane, a glass, letters, a case,
// a spanner, chalk, a tray. Generated from a `CapitalLook` (which the portraits share, so a face matches
// its figure). All face right; the game flips them. Never red, copper or wine (reserved).

const S = SHADES;

export type CapitalHair =
  | 'crop' // shaved close, like the prince
  | 'short'
  | 'swept' // swept up and back, a quiff
  | 'receding' // swept back from a high forehead
  | 'long'
  | 'bob'
  | 'bun'
  | 'up' // piled high
  | 'tail'
  | 'braid'
  | 'bald'
  | 'curls'
  | 'messy'
  | 'undercut'; // the sides shaved, the top long and falling forward

export interface CapitalLook {
  /** 18 (a child) to 28. Headwear that stands up (a helmet's crest, a hat, hair piled up) adds a row. */
  height: number;
  /** Half the body's width. */
  width: 2 | 3 | 4;
  skin: SkinTone;
  hair: number;
  hairStyle: CapitalHair;
  beard?: 'trim' | 'full' | 'moustache' | 'stubble';
  /**
   * `circlet`: a gold band with a blue stone (the ruler's family); `helmet`: the citadel guard's, dark
   * with a gold crest and a glowing visor; `watchcap`: the city watch's peaked cap with its blue band;
   * `cap`: a round cap with a gold band (the lifts); `hood`; `hat`: wide-brimmed, for the road; `visor`: a
   * band of light across the eyes; `lens`: a glowing lens over one eye.
   */
  head?: 'circlet' | 'helmet' | 'watchcap' | 'cap' | 'hood' | 'hat' | 'visor' | 'lens';
  /** The colour of a hood or a hat, if not the top's. */
  headColour?: number;
  /** A light at the ear. */
  earpiece?: boolean;
  top: number;
  /**
   * `coat`: to the knee; `long`: a robe or coat to the floor; `gown`: fitted, the skirt flaring to the
   * floor; `jacket`: to the hip; `tunic`: to the thigh; `vest`: bare arms; `dress`: to the knee, flared;
   * `overalls`: one piece, top to boot.
   */
  topStyle: 'coat' | 'long' | 'gown' | 'jacket' | 'tunic' | 'vest' | 'dress' | 'overalls';
  /** The sleeves, if not the top's colour. */
  sleeve?: number;
  /** A high collar up to the jaw, in this colour. */
  collar?: number;
  /** What shows at the neck: a high collar, an open neck with the shirt in a V, a low neckline, an armoured gorget, a wrap. Default `high` with a collar, else `open`. */
  neck?: 'high' | 'open' | 'scoop' | 'gorget' | 'wrap';
  /** The shirt in an open neck; default white. */
  shirt?: number;
  /** Down the front edge, at the cuffs and the hem. */
  trim?: number;
  buttons?: number;
  belt?: number;
  sash?: number;
  epaulettes?: number;
  cape?: number;
  /** The city's tech worn on the clothes: seams that glow blue. */
  glow?: boolean;
  medal?: boolean;
  necklace?: number;
  apron?: number;
  /** Patches sewn on, in this colour (the low district). */
  patches?: number;
  /** Embroidery in this colour over a gown or a coat. */
  embroidery?: number;
  /** A scarf or a wrap at the neck. */
  scarf?: number;
  legs: number;
  boots?: number;
  /** A bag over the shoulder, in this colour. */
  bag?: number;
  hold?: 'pike' | 'baton' | 'slate' | 'cane' | 'glass' | 'letters' | 'case' | 'spanner' | 'chalk' | 'tray' | 'brush';
  /** Arms at the side (swinging), hands behind the back, or clasped in front. */
  pose?: 'side' | 'behind' | 'front' | 'reach';
  slender?: boolean;
  belly?: boolean;
}

/** A darker shade of a colour, for its shadowed side. */
const DARKER: Record<number, number> = {
  [S.white]: S.light, [S.light]: S.dim, [S.dim]: S.woodPale, [S.woodPale]: S.woodLight, [S.woodLight]: S.wood, [S.wood]: S.deep,
  [S.deep]: S.shadow, [S.shadow]: S.shadow, [S.amber]: S.amberMid, [S.amberMid]: S.amberDeep, [S.amberDeep]: S.wood, [S.cyan]: S.cyanMid, [S.cyanMid]: S.cyanDeep,
  [S.cyanDeep]: S.deep, [S.green]: S.greenMid, [S.greenMid]: S.greenDeep, [S.greenDeep]: S.deep,
};
/** A lighter shade, for the lit edge. */
const LIGHTER: Record<number, number> = {
  [S.white]: S.white, [S.light]: S.white, [S.dim]: S.light, [S.woodPale]: S.dim, [S.woodLight]: S.woodPale, [S.wood]: S.woodLight,
  [S.deep]: S.woodLight, [S.shadow]: S.wood, [S.amber]: S.amber, [S.amberMid]: S.amber, [S.amberDeep]: S.amberMid, [S.cyan]: S.white, [S.cyanMid]: S.cyanMid,
  [S.cyanDeep]: S.cyanMid, [S.green]: S.green, [S.greenMid]: S.green, [S.greenDeep]: S.greenMid,
};
export const shade = (c: number) => DARKER[c] ?? S.deep;
export const lit = (c: number) => LIGHTER[c] ?? c;

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));

/** Headwear or hair that stands above the head, so the figure is a row taller. */
export const standsTall = (look: CapitalLook) => look.head === 'helmet' || look.head === 'hat' || look.hairStyle === 'up' || look.hairStyle === 'swept';

/** One frame: `breathe` bobs the upper body, `stride` spreads the legs (walking). */
export function courtly(look: CapitalLook, breathe = false, stride = 0): RowSprite {
  const W = 16;
  const t0 = standsTall(look) ? 1 : 0;
  const H = look.height + t0;
  const child = look.height < 21;
  const g = grid(W, H);
  const b = breathe ? 1 : 0;
  const cx = 7;
  const w = look.width;
  const x0 = cx - w;
  const x1 = cx + w;
  const hx = cx - 3; // the head's left edge
  const bodyTop = t0 + 6;
  const legTop = H - (child ? 6 : 8);
  /** Upper-body rows move with the breath; the legs don't. */
  const up = (y: number) => (y < legTop ? y + b : y);
  const put = (x: number, y: number, c: string) => {
    if (y >= 0 && y < H && x >= 0 && x < W) g[y]![x] = c;
  };
  const putUp = (x: number, y: number, c: string) => put(x, up(y), c);
  const span = (y: number, a: number, z: number, c: string) => {
    for (let x = a; x <= z; x++) put(x, y, c);
  };
  const empty = (x: number, y: number) => g[y]?.[x] === '.';
  /** A head pixel: column `ox` from the head's left edge, row `r` from its top. */
  const hd = (ox: number, r: number, c: string) => put(hx + ox, t0 + r + b, c);
  const hspan = (r: number, a: number, z: number, c: string) => {
    for (let ox = a; ox <= z; ox++) hd(ox, r, c);
  };
  const pose = look.pose ?? 'side';
  const long = look.topStyle === 'long' || look.topStyle === 'gown';
  const coatTo =
    look.topStyle === 'coat' ? Math.min(H - 3, legTop + 4)
    : long ? H - 1
    : look.topStyle === 'dress' ? legTop + 3
    : look.topStyle === 'tunic' ? legTop + 1
    : look.topStyle === 'overalls' ? H - 3
    : legTop - 1;

  // --- Behind the body: a cape, long hair, a pike's pole, a bag, the back arm ---
  if (look.cape !== undefined) {
    for (let y = bodyTop; y <= H - 2; y++) {
      const flare = y > legTop ? 1 + Math.floor((y - legTop) / 3) : 0;
      for (let x = x0 - 1 - flare; x <= x0; x++) putUp(x, y, x === x0 - 1 - flare ? 'K' : 'k');
    }
    span(up(bodyTop), x0 - 1, x1, 'k'); // over the shoulders
  }
  if (look.hairStyle === 'long') {
    for (let r = 1; r <= 8; r++) hd(-1, r, r > 6 ? 'H' : 'h');
    for (let r = 4; r <= 7; r++) hd(0, r, 'H');
  }
  if (look.hairStyle === 'braid') {
    for (let r = 2; r <= 11; r++) hd(-1, r, r === 11 ? 'g' : r % 2 === 0 ? 'h' : 'H');
  }
  if (look.hairStyle === 'tail') {
    hd(-1, 2, 'h');
    for (let r = 3; r <= 6; r++) hd(-2, r, r === 6 ? 'H' : 'h');
  }
  if (look.bag !== undefined) {
    for (let y = bodyTop + 4; y <= bodyTop + 8; y++) span(up(y), x0 - 2, x0 - 1, y === bodyTop + 4 ? 'Z' : 'z');
  }
  // The back arm, in the shadow of the body (hidden by a cape, or behind the back).
  if (look.cape === undefined) {
    for (let y = bodyTop + 1; y <= bodyTop + 6; y++) {
      const swing = pose === 'side' && y >= bodyTop + 4 ? -Math.sign(stride) : 0;
      const x = x0 - 1 + swing;
      if (empty(x, up(y))) putUp(x, y, 'T');
    }
    if (pose === 'side') putUp(x0 - 1 - Math.sign(stride), bodyTop + 7, 'S');
  }

  // --- The body ---
  for (let y = bodyTop; y <= coatTo; y++) {
    const below = y - legTop; // rows below the waist
    const flare = below >= 0 ? (look.topStyle === 'gown' ? 1 + Math.floor(below / 2) : look.topStyle === 'long' || look.topStyle === 'dress' ? Math.floor(below / 3) + (look.topStyle === 'long' ? 1 : 0) : look.topStyle === 'coat' ? Math.floor(below / 3) : 0) : 0;
    const sway = below >= 2 ? Math.round(stride / 2) : 0;
    const gut = look.belly && y >= bodyTop + 3 && y <= legTop + 1 ? (y >= bodyTop + 5 && y <= legTop - 1 ? 2 : 1) : 0;
    const waist = look.slender && y >= bodyTop + 4 && y <= legTop - 1 ? 1 : 0;
    const a = x0 - flare + sway + waist;
    const z = x1 + flare + sway + gut - waist;
    span(up(y), a, z, 't');
    put(a, up(y), 'T');
    if (z - a >= 3) put(a + 1, up(y), y > legTop && (y + a) % 3 === 0 ? 'T' : 't'); // a fold in the skirt
    put(z, up(y), look.trim !== undefined && look.topStyle !== 'gown' && look.topStyle !== 'dress' && look.topStyle !== 'vest' ? 'q' : 'U');
    // A coat parts below the waist: its front edge, the leg showing through the gap behind it.
    if ((look.topStyle === 'coat' || look.topStyle === 'long') && below >= 1) put(cx + 1 + sway, up(y), 'T');
    if (look.embroidery !== undefined && (look.topStyle === 'gown' || look.topStyle === 'long') && below >= 0 && (y === coatTo - 1 || (below > 0 && (y + a) % 4 === 0 && y < coatTo - 1)))
      for (let x = a + 1; x < z; x += 2) put(x, up(y), 'q');
  }
  // The hem: trim along a coat's, embroidery or trim along a gown's.
  if (look.trim !== undefined && coatTo > legTop) for (let x = 0; x < W; x++) if (g[up(coatTo)]![x] === 't' || g[up(coatTo)]![x] === 'T') put(x, up(coatTo), 'q');
  // Bare shoulders and collarbones over a low neckline; a gown's bodice and its waist.
  if (look.neck === 'scoop') {
    span(up(bodyTop), x0 + 1, x1 - 1, 's');
    put(x0 + 1, up(bodyTop), 'S');
    if (look.trim !== undefined) span(up(bodyTop + 1), x0, x1, 'q');
  }
  if (look.topStyle === 'gown' || look.topStyle === 'dress') span(up(legTop - 2), x0 + (look.slender ? 1 : 0), x1 - (look.slender ? 1 : 0), look.belt !== undefined ? 'b' : 'T');
  // An open neck: the shirt in a V, the lapels either side of it.
  const neck = look.neck ?? (look.collar !== undefined ? 'high' : 'open');
  if (neck === 'open' && !['vest', 'overalls'].includes(look.topStyle)) {
    putUp(x1 - 2, bodyTop, 'w');
    putUp(x1 - 1, bodyTop, 'w');
    putUp(x1 - 1, bodyTop + 1, 'w');
    putUp(x1 - 2, bodyTop + 1, 'T'); // the lapel's shadow
    putUp(x1 - 3, bodyTop, 'T');
  }
  if (neck === 'wrap' || look.scarf !== undefined) {
    span(up(bodyTop), x0, x1, 'f');
    putUp(x0, bodyTop + 1, 'f');
    putUp(x0, bodyTop + 2, 'F');
  }
  // Overalls: the straps, a pocket on the bib.
  if (look.topStyle === 'overalls') {
    putUp(x0 + 1, bodyTop, 'w');
    putUp(x1 - 1, bodyTop, 'w');
    putUp(x1 - 1, bodyTop + 2, 'T');
  }
  // Buttons down the front; a belt and its buckle; a sash across the chest; epaulettes; a medal.
  if (look.buttons !== undefined && look.trim === undefined) for (let y = bodyTop + 2; y <= legTop - 2; y += 2) putUp(x1 - 1, y, 'y');
  if (look.belt !== undefined && !['gown', 'dress'].includes(look.topStyle)) {
    span(up(legTop - 1), x0, x1 + (look.belly ? 1 : 0), 'b');
    putUp(x1 - 1, legTop - 1, 'g');
  }
  if (look.sash !== undefined) {
    for (let i = 0; i <= x1 - x0; i++) putUp(x0 + i, bodyTop + 1 + i, i === x1 - x0 ? 'X' : 'x');
    putUp(x1, bodyTop + 2 + x1 - x0, 'X'); // its end hanging at the hip
  }
  if (look.epaulettes !== undefined) {
    put(x0, up(bodyTop), 'Y');
    span(up(bodyTop), x1 - 1, x1 + 1, 'g');
    putUp(x1 + 1, bodyTop + 1, 'Y');
  }
  if (look.medal) {
    putUp(x1 - 2, bodyTop + 2, 'v');
    putUp(x1 - 2, bodyTop + 3, 'g');
  }
  if (look.necklace !== undefined) {
    putUp(cx, bodyTop, 'n');
    putUp(cx + 1, bodyTop + 1, 'N');
  }
  if (look.apron !== undefined) for (let y = bodyTop + 3; y <= Math.min(H - 3, legTop + 3); y++) span(up(y), cx - 1, x1, y === bodyTop + 3 ? 'A' : 'a');
  if (look.patches !== undefined) {
    span(up(bodyTop + 3), x0 + 1, x0 + 2, 'z');
    span(up(bodyTop + 4), x0 + 1, x0 + 2, 'Z');
  }
  // The city's tech: a seam of light down the side of the clothes.
  if (look.glow) for (let y = bodyTop + 2; y <= Math.min(coatTo, legTop - 2); y++) putUp(x0 + 1, y, y === bodyTop + 2 ? 'v' : 'G');
  // A cape's clasp at the throat.
  if (look.cape !== undefined) putUp(x1 - 1, bodyTop, 'g');

  // --- The head ---
  // Skin: the forehead and face to the right, an ear, the eye, the jaw; the neck.
  hspan(1, 4, 5, 's');
  hspan(2, 2, 5, 's');
  hd(4, 2, 'd');
  hspan(3, 1, 5, 's');
  hd(2, 3, 'S'); // the ear
  hspan(4, 2, 4, 's');
  hd(2, 4, 'S');
  hd(2, 5, 'S');
  hd(3, 5, 's');
  // Hair.
  const hair = look.hairStyle;
  if (hair === 'bald') {
    hspan(0, 1, 4, 's');
    hd(3, 0, 'e'); // the light on the scalp
    hspan(1, 0, 3, 's');
    hd(0, 2, 'h');
    hd(1, 2, 'S');
    hd(0, 3, 'h');
  } else if (hair === 'receding') {
    hspan(0, 1, 3, 'h');
    hd(4, 0, 's');
    hd(2, 0, 'i');
    hspan(1, 0, 2, 'h');
    hd(3, 1, 's');
    hspan(2, 0, 1, 'h');
    hd(0, 3, 'h');
  } else {
    // The crop, which most styles build on: a close dark cap of hair over the crown and the back.
    const crop = hair === 'crop';
    hspan(0, 1, 4, crop ? 'H' : 'h');
    hd(3, 0, 'i');
    hspan(1, 0, 3, crop ? 'H' : 'h');
    hd(2, 1, crop ? 'h' : 'i');
    hspan(2, 0, 1, crop ? 'H' : 'h');
    hd(0, 3, crop ? 'H' : 'h');
    if (hair === 'short' || hair === 'messy' || hair === 'curls' || hair === 'bob') hd(4, 1, 'h'); // a fringe
    if (hair === 'messy') {
      hd(0, 0, 'H');
      hd(5, 0, 'h');
      hd(-1, 1, 'H');
    }
    if (hair === 'curls') {
      hspan(0, 0, 5, 'h');
      hd(1, 0, 'i');
      hd(4, 0, 'i');
      hd(-1, 1, 'h');
      hd(-1, 2, 'H');
      hd(0, 4, 'H');
    }
    if (hair === 'bob') {
      for (let r = 1; r <= 4; r++) hd(0, r, 'h');
      hd(1, 3, 'h');
      hd(1, 4, 'H');
      for (let r = 1; r <= 3; r++) hd(-1, r, 'H');
    }
    if (hair === 'bun' && look.head !== 'watchcap' && look.head !== 'cap') {
      hd(-1, 0, 'h');
      hd(-1, 1, 'H');
      hd(0, 0, 'h');
    } else if (hair === 'bun') {
      hd(-1, 2, 'h'); // at the nape, under the cap
      hd(-1, 3, 'H');
    }
    if (hair === 'swept') {
      hspan(-1, 2, 4, 'h');
      hd(3, -1, 'i');
      hd(5, 0, 'h');
    }
    if (hair === 'up') {
      hspan(-1, 1, 3, 'h');
      hd(2, -1, 'i');
      hd(0, 0, 'h');
      hd(4, -1, 'g'); // a pin
    }
    if (hair === 'undercut') {
      hspan(0, 1, 5, 'h');
      hd(4, 0, 'i');
      hd(4, 1, 'h'); // falling over the forehead
      hspan(1, 0, 2, 'H'); // the shaved sides
      hd(0, 2, 'S');
      hd(1, 2, 'S');
      hd(0, 3, 'S');
    }
  }
  // Beards, in the hair's colour.
  if (look.beard === 'trim' || look.beard === 'full') {
    hspan(4, 2, 4, 'h');
    hd(4, 4, 'i');
    hd(3, 3, 'H');
    if (look.beard === 'full') {
      hspan(5, 3, 4, 'h');
      hd(4, 3, 'h');
    }
  }
  if (look.beard === 'moustache') hd(5, 3, 'h');
  if (look.beard === 'stubble') hspan(4, 3, 4, 'S');
  // Headwear.
  switch (look.head) {
    case 'circlet':
      hspan(1, 0, 3, 'Y');
      hspan(1, 4, 5, 'g');
      break;
    case 'helmet':
      hspan(-1, 1, 4, 'g'); // the crest
      hd(3, -1, 'n');
      hspan(0, 0, 5, 'M');
      hd(5, 0, 'm');
      hspan(1, 0, 5, 'M');
      hspan(1, 4, 5, 'm');
      hspan(2, 0, 1, 'M');
      hspan(2, 2, 5, 'V'); // the visor, glowing across the eyes
      hd(0, 3, 'M');
      hd(1, 3, 'M');
      break;
    case 'watchcap':
      hspan(0, 0, 4, 'j');
      hd(0, 0, 'J');
      hspan(1, 0, 3, 'v'); // its band
      hd(2, 1, 'G');
      hspan(1, 4, 6, 'J'); // the peak
      break;
    case 'cap':
      hspan(0, 1, 4, 'j');
      hd(1, 0, 'J');
      hspan(1, 1, 4, 'g');
      hd(1, 1, 'Y');
      break;
    case 'hood':
      hspan(0, 0, 4, 'k');
      for (let r = 1; r <= 5; r++) hd(-1, r, 'K');
      for (let r = 1; r <= 4; r++) hd(0, r, 'k');
      hspan(1, 1, 3, 'k');
      hd(1, 2, 'K');
      break;
    case 'hat':
      hspan(-1, 1, 4, 'k');
      hspan(0, 1, 4, 'K'); // the band
      hspan(1, -1, 6, 'k'); // the brim
      hd(6, 1, 'K');
      hd(4, 2, 'S'); // the brim's shadow over the eye
      break;
    case 'visor':
      hspan(2, 2, 6, 'V');
      hd(6, 2, 'v');
      break;
    case 'lens':
      hd(4, 2, 'V');
      hd(5, 2, 'v');
      hd(3, 2, 'M'); // its strap
      break;
  }
  if (look.earpiece) hd(2, 3, 'G');
  // A high collar to the jaw; an armoured gorget.
  if (neck === 'high' && look.collar !== undefined) {
    hspan(5, 1, 4, 'c');
    hd(1, 5, 'C');
    if (look.trim !== undefined) putUp(x1 - 1, bodyTop, 'g'); // the clasp at the throat
  }
  if (neck === 'gorget') {
    hspan(5, 1, 4, 'M');
    hd(4, 5, 'm');
    span(up(bodyTop), x0, x1, 'g');
  }

  // --- The front arm, and what it holds ---
  const armX = x1 + 1 + (look.belly ? 2 : 0);
  const sleeve = look.topStyle === 'vest' ? 's' : 'u';
  const cuff = look.trim !== undefined ? 'q' : look.glow ? 'G' : sleeve;
  let hand: [number, number] | undefined;
  if (pose === 'behind') {
    // The upper arm down the side, the forearm going back behind the body; the hands show behind.
    for (let y = bodyTop + 1; y <= bodyTop + 4; y++) putUp(armX - (look.belly && y < bodyTop + 3 ? 1 : 0), y, sleeve);
    putUp(armX - 1, bodyTop + 5, sleeve);
    if (look.cape === undefined) putUp(x0 - 1, bodyTop + 5, 'S');
  } else if (pose === 'reach') {
    // Reaching out ahead, working at a wall: the hand goes up and down with each frame (scrubbing).
    putUp(armX, bodyTop + 1, sleeve);
    putUp(armX + 1, bodyTop + 1, sleeve);
    putUp(armX + 2, bodyTop + (breathe ? -1 : 1), cuff);
    hand = [armX + 3, bodyTop + (breathe ? -2 : 1)];
    put(hand[0], hand[1], 's');
  } else if (pose === 'front') {
    for (let y = bodyTop + 1; y <= bodyTop + 4; y++) putUp(armX - (look.belly && y < bodyTop + 3 ? 1 : 0), y, sleeve);
    putUp(armX, bodyTop + 5, cuff);
    putUp(armX - 1, bodyTop + 6, 's'); // the hands clasped in front
    putUp(armX - 2, bodyTop + 6, 'S');
    hand = [armX - 1, bodyTop + 6];
  } else {
    for (let y = bodyTop + 1; y <= bodyTop + 6; y++) {
      const swing = y >= bodyTop + 4 ? Math.sign(stride) : 0;
      putUp(armX + (look.belly && y < bodyTop + 3 ? -1 : 0) + swing, y, y === bodyTop + 6 ? cuff : sleeve);
    }
    hand = [armX + Math.sign(stride), bodyTop + 7];
    putUp(hand[0], hand[1], 's');
  }
  if (look.hold && hand) {
    const [hX, hY] = hand;
    switch (look.hold) {
      case 'pike': {
        // A tall pole, gold at the head, and a blade edged with light.
        const px = hX + 1;
        for (let y = 0; y < H; y++) put(px, y, y < 4 ? 'g' : 'P');
        put(px + 1, 1, 'G');
        put(px + 1, 2, 'G');
        put(px, 0, 'G');
        put(px - 1, 3, 'Y');
        put(px + 1, 3, 'Y');
        break;
      }
      case 'baton':
        for (let y = hY + 1; y <= hY + 4; y++) putUp(hX, y, 'P');
        putUp(hX, hY + 5, 'G');
        break;
      case 'slate':
        putUp(hX, hY - 1, 'M');
        putUp(hX + 1, hY - 1, 'G');
        putUp(hX + 1, hY - 2, 'V');
        putUp(hX + 1, hY, 'v');
        break;
      case 'cane':
        putUp(hX + 1, hY - 1, 'g');
        for (let y = hY; y < H; y++) put(hX + 1, y < legTop ? y + b : y, 'P');
        break;
      case 'glass':
        putUp(hX + 1, hY - 2, 'a');
        putUp(hX + 1, hY - 1, 'w');
        putUp(hX + 1, hY, 'w');
        break;
      case 'letters':
        putUp(hX, hY + 1, 'p');
        putUp(hX + 1, hY + 1, 'p');
        putUp(hX + 1, hY, 'p');
        break;
      case 'case':
        span(up(hY + 1), hX - 1, hX + 1, 'z');
        span(up(hY + 2), hX - 1, hX + 1, 'z');
        putUp(hX, hY + 1, 'g');
        break;
      case 'spanner':
        for (let y = hY + 1; y <= hY + 3; y++) putUp(hX, y, 'M');
        putUp(hX - 1, hY + 4, 'M');
        putUp(hX + 1, hY + 4, 'M');
        break;
      case 'chalk':
        putUp(hX + 1, hY, 'p');
        break;
      case 'brush':
        // A scrubbing brush on a short handle, the bristles pale (held to a wall when reaching).
        if (pose === 'reach') for (let y = hY - 1; y <= hY + 1; y++) put(hX + 1, y, 'p');
        else {
          putUp(hX, hY + 1, 'P');
          span(up(hY + 2), hX - 1, hX + 1, 'p');
        }
        break;
      case 'tray':
        span(up(hY - 1), hX - 1, hX + 2, 'g');
        putUp(hX, hY - 2, 'w');
        putUp(hX + 1, hY - 2, 'a');
        break;
    }
  }

  // --- Legs and boots (a long coat or gown hides them) ---
  if (!long) {
    const bare = look.topStyle === 'dress';
    for (let y = Math.max(legTop, coatTo + 1); y < H; y++) {
      const t = (y - legTop) / Math.max(1, H - 1 - legTop);
      const back = cx - 2 - Math.round(stride * t);
      const front = cx + 1 + Math.round(stride * t);
      const boot = y >= H - 2;
      const legBack = look.topStyle === 'overalls' ? 'T' : bare ? 'S' : 'L';
      const legFront = look.topStyle === 'overalls' ? 't' : bare ? 's' : 'l';
      span(y, back, back + 1, boot ? 'B' : legBack);
      span(y, front, front + 1, boot ? 'B' : legFront);
      if (y === H - 2) put(front + 1, y, 'o'); // the shine on the boot
      if (y === H - 1) put(front + 2, y, 'B');
      if (look.patches !== undefined && y === legTop + 2) put(front, y, 'z');
    }
  } else {
    put(cx + 2 + Math.round(stride / 2) + (look.topStyle === 'gown' ? 3 : 1), H - 1, 'B'); // a toe under the hem
  }

  const [skin, skinShade] = SKIN[look.skin];
  const sleeveColour = look.sleeve ?? look.top;
  const trim = look.trim ?? S.amber;
  const hood = look.headColour ?? (look.head === 'hat' ? S.woodLight : look.top);
  const capColour = look.head === 'watchcap' ? S.cyanDeep : (look.headColour ?? look.top);
  return {
    rows: g.map((r) => r.join('')),
    colours: {
      s: skin, S: skinShade, e: skin === S.skinDark ? S.skinTanShade : S.skinFair, d: S.shadow,
      h: look.hair, H: shade(look.hair), i: lit(look.hair),
      t: look.top, T: shade(look.top), U: lit(look.top), u: sleeveColour,
      q: trim, Q: shade(trim),
      c: look.collar ?? look.top, C: shade(look.collar ?? look.top),
      j: capColour, J: shade(capColour),
      x: look.sash ?? S.cyanMid, X: shade(look.sash ?? S.cyanMid),
      y: look.buttons ?? S.amber,
      b: look.belt ?? S.deep, g: S.amber, Y: S.amberDeep,
      G: S.cyan, V: S.cyan, v: S.cyanMid,
      M: S.deep, m: S.woodPale, n: S.white,
      k: look.cape ?? hood, K: shade(look.cape ?? hood),
      l: look.legs, L: shade(look.legs), B: look.boots ?? S.shadow, o: lit(look.boots ?? S.shadow),
      w: look.shirt ?? S.white, p: S.white, P: S.amberDeep,
      a: look.apron ?? S.amber, A: shade(look.apron ?? S.amber),
      z: look.patches ?? look.bag ?? S.woodLight, Z: shade(look.patches ?? look.bag ?? S.woodLight),
      f: look.scarf ?? look.top, F: shade(look.scarf ?? look.top),
      N: S.cyan,
    },
  };
}

/** Breathing idle frames and a two-step walk for a look. */
export function courtlyFrames(look: CapitalLook): { idle: RowSprite[]; walk: RowSprite[] } {
  return { idle: [courtly(look, false), courtly(look, true)], walk: [courtly(look, false, 2), courtly(look, true, -2)] };
}

// --- The cast (docs/chapter-3-design.md; looks are Claude's, names placeholders, designer) ---

/** The named people of the capital, by speaker id. */
export const CAPITAL_CAST_LOOKS = {
  /**
   * Your father, the ruler: tall and spare, a long black coat to the floor (sombre against the marble),
   * gold down its front, a high collar edged in gold, gold worked along the hem; a dark blue cape; grey hair swept
   * back from a high forehead, a trimmed grey beard, the circlet. Hands behind his back. Tan, like you.
   */
  father: { height: 27, width: 3, skin: 'tan', hair: S.light, hairStyle: 'receding', beard: 'trim', head: 'circlet', top: S.deep, topStyle: 'long', collar: S.deep, trim: S.amber, embroidery: S.amber, cape: S.cyanDeep, legs: S.deep, pose: 'behind' },
  /**
   * The diplomat, your hand: warm and neat; a fitted coat to the knee in deep gold-brown, open at the
   * neck over a white shirt, gold buttons, a belt; dark hair, short and parted, clean-shaven; a slate
   * of messages held in front of him.
   */
  diplomat: { height: 26, width: 2, skin: 'dark', hair: S.deep, hairStyle: 'short', top: S.amberDeep, topStyle: 'coat', neck: 'open', buttons: S.amber, belt: S.wood, legs: S.wood, boots: S.deep, hold: 'slate', pose: 'front' },
  /**
   * Your younger sister: small and quick; a fitted dark blue jacket with a high collar and gold buttons,
   * trousers and boots she can run in, a thin circlet; her dark hair in a long braid tied with gold.
   */
  sister: { height: 21, width: 2, slender: true, skin: 'tan', hair: S.deep, hairStyle: 'braid', head: 'circlet', top: S.cyanDeep, topStyle: 'jacket', collar: S.cyanMid, buttons: S.amber, belt: S.amberDeep, legs: S.wood, boots: S.deep },
  /**
   * The guard captain: broad and straight, the citadel guard's black armoured coat, a gorget, gold
   * epaulettes and trim, a medal, a dark blue cape; a baton with a glowing tip; grey hair cropped close.
   */
  captain: { height: 27, width: 3, skin: 'fair', hair: S.dim, hairStyle: 'crop', top: S.deep, topStyle: 'coat', neck: 'gorget', trim: S.amber, epaulettes: S.amber, medal: true, cape: S.cyanDeep, belt: S.shadow, buttons: S.amber, legs: S.deep, hold: 'baton' },
  /** The old councillor: a long stone-grey robe with a high dark blue collar and a gold sash, a cane; bald, white at the sides, a full white beard. */
  councillor: { height: 25, width: 3, skin: 'fair', hair: S.light, hairStyle: 'bald', beard: 'full', top: S.dim, topStyle: 'long', collar: S.cyanDeep, sash: S.amber, trim: S.amber, legs: S.dim, hold: 'cane' },
  /** The salon hostess: a gold gown, embroidered pale at the hem, bare shoulders, a gold necklace with a blue stone, her hair piled up and pinned, a glass. */
  salon_hostess: { height: 25, width: 2, slender: true, skin: 'dark', hair: S.shadow, hairStyle: 'up', top: S.amber, topStyle: 'gown', neck: 'scoop', trim: S.white, embroidery: S.white, necklace: S.amber, belt: S.amberDeep, legs: S.amber, hold: 'glass' },
  /** Your friend, a noble heir your age: a blue-green coat to the hip with gold trim and a high collar, a pale sash, his hair swept up. */
  heir: { height: 25, width: 2, skin: 'fair', hair: S.amberDeep, hairStyle: 'swept', top: S.cyanMid, topStyle: 'jacket', collar: S.cyanMid, trim: S.amber, sash: S.light, belt: S.deep, legs: S.light, boots: S.deep },
  /** The envoy, from one of the places the capital manages: nothing like the capital; dressed for the road in a wide hat, a long earth-coloured coat, a wrap, a bag. */
  envoy: { height: 25, width: 3, skin: 'tan', hair: S.woodLight, hairStyle: 'long', head: 'hat', headColour: S.dim, top: S.woodPale, topStyle: 'long', neck: 'wrap', scarf: S.dim, bag: S.amberDeep, legs: S.woodLight },
  /** The operator, in the data centre: a dark work jacket with glowing seams, a lens over one eye, a light at the ear, a slate; the sides of the head shaved. */
  operator: { height: 24, width: 2, skin: 'fair', hair: S.woodLight, hairStyle: 'undercut', head: 'lens', earpiece: true, top: S.deep, topStyle: 'jacket', glow: true, belt: S.shadow, legs: S.wood, hold: 'slate' },
  /** The lift operator: an old hand in the lifts' blue uniform, gold buttons and shoulders, a round cap with a gold band; a grey moustache. Hands behind his back. */
  lift_operator: { height: 25, width: 3, skin: 'dark', hair: S.light, hairStyle: 'short', beard: 'moustache', head: 'cap', headColour: S.cyanMid, top: S.cyanMid, topStyle: 'jacket', collar: S.cyanDeep, buttons: S.amber, epaulettes: S.amber, belt: S.deep, legs: S.deep, pose: 'behind' },
  /** The painter: a low-district kid; a big patched shirt, curls, chalk in hand. */
  painter: { height: 18, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'curls', top: S.dim, topStyle: 'tunic', patches: S.woodPale, legs: S.woodLight, hold: 'chalk' },
  /** The reformer: a young councillor; the council's long robe in white, a blue collar and sash; long hair tied back; a sheaf of letters. */
  reformer: { height: 26, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'tail', top: S.light, topStyle: 'long', collar: S.cyanMid, sash: S.cyanMid, trim: S.cyanMid, legs: S.light, hold: 'letters' },
  /** The commander of the city watch (not your father's guard): the watch's dark blue coat with glowing seams, gold at the shoulders, the peaked cap, grey hair in a bun. Very straight. */
  commander: { height: 26, width: 3, skin: 'tan', hair: S.light, hairStyle: 'bun', head: 'watchcap', top: S.cyanDeep, topStyle: 'coat', collar: S.cyanDeep, trim: S.cyanMid, epaulettes: S.amber, glow: true, belt: S.shadow, legs: S.deep, pose: 'behind' },
  /** The engineer, who keeps the lifts and the citadel running: overalls with glowing seams over a grey shirt, a band of light across the eyes, a spanner; untidy fair hair. */
  engineer: { height: 24, width: 2, skin: 'fair', hair: S.amber, hairStyle: 'messy', head: 'visor', top: S.woodPale, topStyle: 'overalls', sleeve: S.dim, glow: true, belt: S.deep, legs: S.woodPale, boots: S.deep, hold: 'spanner' },
  /** The hideout's barkeep: big, a dark vest over bare arms, a long pale apron; hair tied back, a full beard. */
  hideout_keeper: { height: 26, width: 4, skin: 'tan', hair: S.woodLight, hairStyle: 'tail', beard: 'full', top: S.deep, topStyle: 'vest', apron: S.light, belt: S.amberDeep, legs: S.wood },
  /** The physician, your father's doctor: a long white coat, a high blue collar and buttons, a case; greying hair. */
  physician: { height: 26, width: 2, skin: 'dark', hair: S.dim, hairStyle: 'short', beard: 'stubble', top: S.white, topStyle: 'coat', collar: S.cyanMid, buttons: S.cyanMid, belt: S.light, legs: S.woodLight, hold: 'case' },
  // Day 1's people (docs/sequences/chapter-3/plan.md).
  /** The woman from the low district whose street's lift is broken: her best, which isn't much; a worn long coat, a patched scarf, her hair tied up. */
  petitioner: { height: 23, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'bun', top: S.dim, topStyle: 'long', patches: S.woodPale, scarf: S.woodLight, legs: S.woodLight, pose: 'front' },
  /** The merchant with the glassworks on the promenade: prosperous and round, a gold-brown coat with gold trim, a pale sash, a sample of his glass in hand. */
  merchant: { height: 25, width: 3, belly: true, skin: 'fair', hair: S.woodPale, hairStyle: 'receding', beard: 'moustache', top: S.amberMid, topStyle: 'coat', collar: S.amberDeep, trim: S.amber, sash: S.light, buttons: S.amber, legs: S.wood, hold: 'glass' },
  /** The steward of the citadel's household: upright, grey, in the household's black and gold, the seating plan in hand. */
  /** The hostess's cousin (Day 2: in the old councillor's seat, if you passed him over): cold and exact; a dark blue gown, a high gold collar, her hair pinned up. */
  cousin: { height: 25, width: 2, slender: true, skin: 'fair', hair: S.woodLight, hairStyle: 'up', top: S.cyanDeep, topStyle: 'gown', collar: S.amber, trim: S.amber, necklace: S.amber, legs: S.cyanDeep },
  steward: { height: 26, width: 2, skin: 'tan', hair: S.light, hairStyle: 'short', top: S.deep, topStyle: 'long', collar: S.amber, trim: S.amber, buttons: S.amber, legs: S.deep, hold: 'letters' },
} satisfies Record<string, CapitalLook>;

export type CapitalCastId = keyof typeof CAPITAL_CAST_LOOKS;
export const CAPITAL_CAST = Object.fromEntries(Object.entries(CAPITAL_CAST_LOOKS).map(([id, look]) => [id, courtlyFrames(look)])) as Record<CapitalCastId, ReturnType<typeof courtlyFrames>>;

/** The citadel guard: black armoured coats, gorgets, gold, crested helmets with a visor of light, pikes. */
export const GUARD_LOOKS: CapitalLook[] = [
  { height: 26, width: 3, skin: 'fair', hair: S.deep, hairStyle: 'crop', head: 'helmet', top: S.deep, topStyle: 'coat', neck: 'gorget', trim: S.amber, epaulettes: S.amber, belt: S.shadow, legs: S.deep, hold: 'pike' },
  { height: 26, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'crop', head: 'helmet', top: S.deep, topStyle: 'coat', neck: 'gorget', trim: S.amber, epaulettes: S.amber, belt: S.shadow, legs: S.deep, hold: 'pike' },
  { height: 25, width: 3, skin: 'tan', hair: S.deep, hairStyle: 'crop', head: 'helmet', top: S.deep, topStyle: 'coat', neck: 'gorget', trim: S.amber, belt: S.shadow, legs: S.deep, hold: 'baton', pose: 'side' },
];
export const GUARDS = GUARD_LOOKS.map(courtlyFrames);

/** High society: fine coats and gowns, gold, glasses in hand. */
export const COURTIER_LOOKS: CapitalLook[] = [
  { height: 26, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'swept', top: S.cyanDeep, topStyle: 'coat', collar: S.cyanDeep, trim: S.amber, sash: S.amber, legs: S.deep },
  { height: 24, width: 2, slender: true, skin: 'tan', hair: S.shadow, hairStyle: 'bun', top: S.cyanMid, topStyle: 'gown', neck: 'scoop', trim: S.amber, embroidery: S.amber, necklace: S.amber, belt: S.amber, legs: S.cyanMid, hold: 'glass' },
  { height: 26, width: 3, skin: 'tan', hair: S.light, hairStyle: 'receding', beard: 'moustache', top: S.deep, topStyle: 'long', collar: S.amber, trim: S.amber, legs: S.deep, hold: 'cane' },
  { height: 25, width: 2, slender: true, skin: 'fair', hair: S.amber, hairStyle: 'braid', top: S.white, topStyle: 'gown', neck: 'scoop', trim: S.amber, necklace: S.amber, cape: S.cyanDeep, belt: S.amber, legs: S.white },
  { height: 26, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'short', top: S.amberDeep, topStyle: 'jacket', neck: 'open', buttons: S.amber, belt: S.deep, legs: S.light, hold: 'glass' },
  { height: 24, width: 2, slender: true, skin: 'fair', hair: S.light, hairStyle: 'long', top: S.cyanDeep, topStyle: 'dress', neck: 'scoop', trim: S.amber, necklace: S.amber, belt: S.amber, legs: S.deep, boots: S.amberDeep },
  { height: 27, width: 3, skin: 'dark', hair: S.dim, hairStyle: 'bald', beard: 'full', top: S.woodLight, topStyle: 'long', collar: S.amberDeep, embroidery: S.amber, trim: S.amber, legs: S.woodLight, hold: 'letters' },
  { height: 25, width: 2, slender: true, skin: 'tan', hair: S.amberDeep, hairStyle: 'up', top: S.deep, topStyle: 'gown', neck: 'scoop', embroidery: S.amber, trim: S.amber, necklace: S.white, belt: S.amber, legs: S.deep, hold: 'glass' },
];
export const COURTIERS = COURTIER_LOOKS.map(courtlyFrames);

/** The citadel's staff: white tunics with gold buttons, trays; a page with letters; the glasshouse's gardener. */
export const SERVANT_LOOKS: CapitalLook[] = [
  { height: 25, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'short', top: S.white, topStyle: 'tunic', collar: S.white, buttons: S.amber, belt: S.amberDeep, legs: S.deep, hold: 'tray' },
  { height: 22, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'bob', top: S.white, topStyle: 'jacket', collar: S.cyanMid, buttons: S.amber, legs: S.deep, hold: 'letters' },
  { height: 24, width: 3, skin: 'dark', hair: S.light, hairStyle: 'short', top: S.dim, topStyle: 'tunic', apron: S.greenDeep, legs: S.woodLight, boots: S.woodLight },
];
export const SERVANTS = SERVANT_LOOKS.map(courtlyFrames);

/** The council: robes, collars of office, sashes. */
export const COUNCIL_LOOKS: CapitalLook[] = [
  { height: 26, width: 3, skin: 'tan', hair: S.dim, hairStyle: 'short', beard: 'trim', top: S.light, topStyle: 'long', collar: S.cyanDeep, sash: S.amber, legs: S.light },
  { height: 25, width: 2, slender: true, skin: 'fair', hair: S.woodLight, hairStyle: 'bun', top: S.dim, topStyle: 'long', collar: S.amber, trim: S.amber, legs: S.dim },
  { height: 26, width: 3, skin: 'dark', hair: S.white, hairStyle: 'receding', top: S.light, topStyle: 'long', collar: S.amberDeep, sash: S.cyanMid, legs: S.light, hold: 'slate' },
];
export const COUNCILLORS = COUNCIL_LOOKS.map(courtlyFrames);

/** The city watch (the commander's, not your father's guard): dark blue coats with glowing seams, peaked caps, batons. */
export const WATCH_LOOKS: CapitalLook[] = [
  { height: 26, width: 3, skin: 'tan', hair: S.deep, hairStyle: 'crop', head: 'watchcap', top: S.cyanDeep, topStyle: 'coat', collar: S.cyanDeep, trim: S.cyanMid, glow: true, belt: S.shadow, legs: S.deep, hold: 'baton' },
  { height: 25, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'tail', head: 'watchcap', top: S.cyanDeep, topStyle: 'coat', collar: S.cyanDeep, trim: S.cyanMid, glow: true, belt: S.shadow, legs: S.deep, hold: 'baton' },
];
export const WATCH = WATCH_LOOKS.map(courtlyFrames);

/** City folk: the promenade and the low district. Work clothes with the city's tech in them, hoods in the rain, aprons, patches; a few dyed blue. */
export const CITIZEN_LOOKS: CapitalLook[] = [
  { height: 24, width: 2, skin: 'fair', hair: S.cyanMid, hairStyle: 'undercut', top: S.woodLight, topStyle: 'jacket', glow: true, belt: S.deep, legs: S.wood, earpiece: true },
  { height: 25, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'bald', beard: 'moustache', top: S.woodPale, topStyle: 'tunic', apron: S.amber, legs: S.wood },
  { height: 24, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'long', head: 'hood', headColour: S.cyanDeep, top: S.deep, topStyle: 'coat', legs: S.wood, bag: S.woodPale },
  { height: 23, width: 2, skin: 'fair', hair: S.light, hairStyle: 'bun', top: S.dim, topStyle: 'long', scarf: S.amberDeep, legs: S.woodPale, hold: 'cane' },
  { height: 25, width: 2, skin: 'tan', hair: S.deep, hairStyle: 'crop', top: S.deep, topStyle: 'vest', glow: true, belt: S.amberDeep, legs: S.woodLight, earpiece: true },
  { height: 24, width: 2, slender: true, skin: 'dark', hair: S.shadow, hairStyle: 'braid', top: S.amberDeep, topStyle: 'jacket', neck: 'open', bag: S.woodPale, belt: S.wood, legs: S.woodLight },
  { height: 19, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'messy', top: S.cyanMid, topStyle: 'tunic', patches: S.dim, legs: S.woodLight },
  { height: 25, width: 3, skin: 'tan', hair: S.woodLight, hairStyle: 'short', beard: 'stubble', top: S.woodPale, topStyle: 'overalls', sleeve: S.woodLight, glow: true, legs: S.woodPale, hold: 'spanner' },
  { height: 24, width: 2, slender: true, skin: 'fair', hair: S.cyanMid, hairStyle: 'bob', head: 'visor', top: S.woodLight, topStyle: 'coat', glow: true, belt: S.deep, legs: S.deep },
  { height: 26, width: 3, skin: 'dark', hair: S.shadow, hairStyle: 'short', beard: 'full', head: 'hood', headColour: S.woodLight, top: S.woodLight, topStyle: 'long', legs: S.wood },
  { height: 24, width: 2, skin: 'tan', hair: S.shadow, hairStyle: 'bun', top: S.deep, topStyle: 'dress', apron: S.white, legs: S.woodPale, boots: S.deep },
  { height: 25, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'crop', head: 'lens', top: S.cyanDeep, topStyle: 'jacket', glow: true, belt: S.shadow, legs: S.wood, hold: 'slate' },
  { height: 24, width: 3, skin: 'tan', hair: S.woodLight, hairStyle: 'tail', top: S.dim, topStyle: 'jacket', patches: S.woodLight, belt: S.wood, legs: S.woodLight, scarf: S.cyanMid },
  { height: 22, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'curls', top: S.amber, topStyle: 'dress', legs: S.wood, boots: S.woodLight },
  // A city worker with a scrubbing brush (Day 1: scrubbing a chalk bird off a wall on the promenade).
  { height: 24, width: 2, skin: 'tan', hair: S.deep, hairStyle: 'crop', head: 'cap', headColour: S.woodLight, top: S.woodLight, topStyle: 'overalls', sleeve: S.dim, legs: S.woodLight, boots: S.deep, hold: 'brush', pose: 'reach' },
];
export const CITIZENS = CITIZEN_LOOKS.map(courtlyFrames);
