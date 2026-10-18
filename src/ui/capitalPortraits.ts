import { SHADES } from './pixelArt';
import { lit, shade, type CapitalLook } from './capitalFolk';
import type { RowSprite } from './sprites';

// PLACEHOLDER portraits of the capital's people (Chapter 3) until the art pass, drawn like the prince's:
// a shaped head (a square, soft or pointed jaw), skin in two tones with real shadows (under the
// cheekbone, down the nose, under the jaw) rather than flat bands, eyes with a lid, an iris and a glint,
// brows of several kinds, a mouth with a lower lip; a dozen hair styles with their own volume, shadow and
// sheen; beards, lines with age, scars, glowing tattoos, freckles; and the clothes from the same
// `CapitalLook` as the figure in the world, in detail: high collars edged with gold, open necks with the
// shirt and its lapels, gowns' low necklines with a necklace, armoured gorgets, gold trim down the front,
// buttons, sashes, epaulettes with their fringe, capes with a chain across, the city's glowing seams,
// medals, aprons, patches; headwear: the circlet, the guard's crested helmet and visor, the watch's
// peaked cap, the lifts' cap, a hood, a hat for the road, a band of light across the eyes, a lens, an
// earpiece. Lit from the right like everyone. Never red, copper or wine.

const SIZE = 48;
const S = SHADES;

export interface CourtFace {
  build?: 'narrow' | 'plain' | 'broad' | 'heavy' | 'child';
  jaw?: 'square' | 'soft' | 'pointed';
  /** 0 young, 1 middle-aged (lines on the brow and beside the mouth), 2 old (more, sunken cheeks, bags). */
  age?: 0 | 1 | 2;
  brow?: 'straight' | 'arched' | 'thin' | 'heavy' | 'knit' | 'raised';
  eyes?: 'plain' | 'narrow' | 'wide' | 'tired' | 'lashes';
  eyeColour?: number;
  nose?: 'straight' | 'long' | 'broad' | 'small';
  mouth?: 'flat' | 'smile' | 'frown' | 'smirk' | 'thin' | 'full' | 'open';
  items?: ('earring' | 'spectacles' | 'scar' | 'tattoo' | 'freckles' | 'mole' | 'piercing')[];
}

/** Skin by tone: lit, shade, the deepest shadows (nostrils, under the jaw, the mouth), a highlight. */
const SKINS = {
  fair: { L: S.skinFair, S: S.skinFairShade, D: S.skinTanShade, A: S.skinFair },
  tan: { L: S.skinTan, S: S.skinTanShade, D: S.skinDark, A: S.skinFairShade },
  dark: { L: S.skinDark, S: S.skinDarkShade, D: S.shadow, A: S.skinTanShade },
} as const;

const BUILD = {
  narrow: { rx: 7.6, shoulders: 8 },
  plain: { rx: 8.4, shoulders: 9 },
  broad: { rx: 9.2, shoulders: 10 },
  heavy: { rx: 10, shoulders: 12 },
  child: { rx: 8.6, shoulders: 6 },
} as const;

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** A face for one of the capital's people, from their figure's look plus the face's own settings. */
export function capitalPortrait(look: CapitalLook, face: CourtFace = {}): RowSprite {
  const build = face.build ?? 'plain';
  const child = build === 'child';
  const jaw = face.jaw ?? (look.slender ? 'soft' : 'square');
  const age = face.age ?? 0;
  const items = new Set(face.items ?? []);
  const cx = 24;
  const cy = child ? 23 : 21;
  const ry = child ? 11 : 12;
  const rx = BUILD[build].rx;
  const eyeY = cy;
  const mY = eyeY + (child ? 7 : 8);
  const hair = look.hairStyle;

  /** Half the head's width at row y (negative outside it). */
  const hw = (y: number): number => {
    const t = (y - cy - 0.5) / ry;
    if (t < -1 || t > 0.95) return -1;
    if (t <= 0) return rx * Math.cbrt(1 - Math.abs(t) ** 3); // a rounded crown
    if (build === 'heavy') return rx * (1 - Math.max(0, t - 0.6) ** 1.5 * 1.6);
    if (jaw === 'soft') return rx * (1 - t ** 2.2 * 0.72);
    if (jaw === 'pointed') return rx * (1 - t ** 1.5 * 0.82);
    return rx * (1 - Math.max(0, t - 0.45) ** 1.6 * 1.9); // square
  };
  const dxOf = (x: number) => x - cx + 0.5;
  const inHead = (x: number, y: number) => hw(y) >= 0 && Math.abs(dxOf(x)) <= hw(y);
  let chinY = cy;
  while (inHead(cx, chinY + 1)) chinY++;
  const T = chinY + 6; // the tops of the shoulders
  const shoulders = BUILD[build].shoulders;
  const slope = look.slender ? 1.8 : child ? 1.6 : 2.2;
  const spread = (y: number) => shoulders + (y - T) * slope;
  const neck = look.neck ?? (look.collar !== undefined ? 'high' : 'open');
  const hooded = look.head === 'hood' || look.head === 'pelt';
  const helmet = look.head === 'helmet';
  const hat = look.head === 'hat';

  // --- Hair ---
  /** Where the hair meets the forehead, by column. */
  const hairline = (x: number): number => {
    const a = Math.abs(dxOf(x));
    switch (hair) {
      case 'bald':
        return -99;
      case 'receding':
        return a > 6 ? eyeY - 2 : a > 2.5 ? cy - 8 : cy - 7;
      case 'bob':
        return a > 6 ? eyeY : cy - 3;
      case 'curls':
      case 'messy':
        return a > 6 ? eyeY - 1 : cy - 4 + ((x * 7) % 5 === 0 ? 1 : (x * 3) % 4 === 0 ? -1 : 0);
      case 'undercut': // a lock falling forward over his lit side
        return x >= cx - 1 && x <= cx + 6 ? cy - 3 + Math.round((x - cx) * 0.3) : cy - 6;
      case 'long':
      case 'tail':
      case 'braid':
      case 'bun':
      case 'up':
        return a > 6 ? eyeY - 1 : a < 1 ? cy - 6 : cy - 5; // parted in the middle
      default:
        return a > 6 ? eyeY - 2 : cy - 5;
    }
  };
  const volume = { crop: 0, short: 1, swept: 1.2, receding: 0.6, long: 1.5, bob: 2, bun: 0.6, up: 0.6, tail: 0.6, braid: 0.8, bald: 0, curls: 3, messy: 1.6, undercut: 1 }[hair];
  /** Hair outside the head: its volume, buns and quiffs, long hair falling, a tail, a braid. */
  const outerHair = (x: number, y: number): boolean => {
    const u = dxOf(x);
    if (hair === 'bald') return Math.abs(u) > hw(y) - 0.5 && Math.abs(u) <= hw(y) + 1 && y >= eyeY - 4 && y <= eyeY + 1;
    const r = hair === 'curls' ? volume + Math.sin(Math.atan2(y - cy, u) * 7) * 0.8 : volume;
    if (r > 0 && inEllipse(x, y, cx - 0.5, cy - 1.5, rx + r, ry + r * 0.7) && y < eyeY + (hair === 'bob' ? 8 : hair === 'curls' ? 4 : 0)) return true;
    const covered = look.head === 'watchcap' || look.head === 'cap' || helmet || hat || hooded; // nothing piled on top under these
    if (!covered && hair === 'swept' && inEllipse(x, y, cx + 1, cy - 12, 6.5, 3.4) && y < cy - 9) return true;
    if (!covered && hair === 'up' && inEllipse(x, y, cx, cy - 14, 6.5, 4.6)) return true;
    if (!covered && hair === 'bun' && inEllipse(x, y, cx - 3, cy - 13, 4.6, 3.4)) return true;
    if (hair === 'long') {
      const side = hw(eyeY);
      return Math.abs(u) >= side - 1 && Math.abs(u) <= side + 3 - (y > 40 ? (y - 40) * 0.5 : 0) && y >= eyeY - 4 && y <= 44 - ((x * 5) % 3);
    }
    if (hair === 'tail') return x >= cx - 13 && x <= cx - 9 && y >= eyeY - 2 && y <= eyeY + 13 && Math.abs(x - (cx - 11) - (y - eyeY) * 0.08) <= 2 - Math.max(0, y - eyeY - 8) * 0.3;
    return false;
  };
  /** A braid over his right shoulder, link by link, tied in gold. */
  const braid = (x: number, y: number): string | null => {
    if (hair !== 'braid') return null;
    for (let k = 0; k < 8; k++) {
      const bx = cx + 9 + k * 0.5;
      const by = eyeY + 3 + k * 2.6;
      if (inEllipse(x, y, bx, by, 1.8, 1.5)) return k === 7 ? 'g' : x < bx ? 'H' : (k % 2 === 0 ? 'h' : 'i');
    }
    return null;
  };
  /** Where the light catches the hair: a sheen on the crown's lit side, broken into strands. */
  const sheen = (x: number, y: number) => {
    const [sx, sy] = hair === 'up' ? [cx + 2, cy - 15] : hair === 'swept' ? [cx + 3, cy - 12] : [cx + rx * 0.35, cy - ry * 0.62];
    return inEllipse(x, y, sx, sy, rx * 0.42, 2.3) && (x * 2 + y) % 5 !== 0;
  };
  const hairPixel = (x: number, y: number, inside: boolean): string => {
    const u = dxOf(x);
    if (hair === 'undercut' && Math.abs(u) > 5 && y > cy - 7) return 'S'; // the shaved sides
    if (hair === 'long' && !inside && y > eyeY - 2) return x % 3 === 0 ? 'H' : u > 0 ? 'h' : 'H';
    if (u < -rx * 0.45) return (x + y * 2) % 7 === 0 ? 'h' : 'H';
    if (sheen(x, y)) return 'i';
    if (!inside && u >= -2 && !outerHair(x, y - 1) && !inHead(x, y - 1)) return 'i'; // where the light catches the top
    return 'h';
  };

  // --- The face ---
  const browY = eyeY - 3;
  const brow = (x: number, y: number): boolean => {
    const kind = face.brow ?? 'straight';
    for (const [bx, outerLeft] of [[cx - 6, true], [cx + 1, false]] as const) {
      const l = x - bx; // 0..4 across the brow
      if (l < 0 || l > 4) continue;
      const inner = outerLeft ? l >= 3 : l <= 1;
      switch (kind) {
        case 'straight':
          if (y === browY) return true;
          break;
        case 'heavy':
          if (y === browY || (y === browY - 1 && l >= 1 && l <= 3)) return true;
          break;
        case 'arched':
          if (y === (l >= 1 && l <= 3 ? browY - 1 : browY)) return true;
          break;
        case 'thin':
          if (outerLeft ? l === 0 && y === browY : l === 4 && y === browY) return true;
          if (y === browY - 1 && l >= 1 && l <= 3) return true;
          break;
        case 'knit':
          if (y === (inner ? browY + 1 : browY)) return true;
          break;
        case 'raised': // one brow up, sceptical
          if (y === (outerLeft ? browY : browY - 1 - (l >= 1 && l <= 3 ? 1 : 0))) return true;
          break;
      }
    }
    return false;
  };
  const eye = (x: number, y: number): string | null => {
    const kind = face.eyes ?? 'plain';
    for (const ex of [cx - 5, cx + 1]) {
      const l = x - ex;
      const litSide = ex > cx;
      if (kind === 'lashes') {
        if (y === eyeY - 2 && l === (litSide ? 4 : 0)) return 'e'; // a flick at the outer corner
      }
      if (y === eyeY - 1 && l >= (kind === 'lashes' && !litSide ? 0 : 1) && l <= (kind === 'lashes' && litSide ? 4 : 3)) return 'e'; // the upper lid
      if (y === eyeY) {
        if (kind === 'narrow') return l === 2 ? 'I' : l === 1 || l === 3 ? 'S' : null;
        if (l === 1 || l === 2) return litSide && l === 2 ? 'w' : 'I';
        if (kind === 'wide' && l === (litSide ? 3 : 0)) return 'W';
        if (kind !== 'plain' && l === (litSide ? 3 : 0)) return 'W';
      }
      if ((kind === 'tired' || kind === 'wide' || age >= 2) && y === eyeY + 1 && l >= 1 && l <= 2) return 'S'; // the lower lid
      if (kind === 'tired' && y === eyeY + 2 && l >= 1 && l <= 3 && age >= 1) return 'S'; // bags
      if (age >= 2 && y === eyeY && l === (litSide ? 5 : -1)) return 'S'; // crow's feet
    }
    return null;
  };
  const nose = (x: number, y: number): string | null => {
    const kind = face.nose ?? 'straight';
    const bottom = kind === 'long' ? eyeY + 6 : kind === 'small' ? eyeY + 4 : eyeY + 5;
    const top = kind === 'small' ? eyeY + 2 : eyeY + 1;
    if (x === cx - 1 && y >= top && y < bottom) return 'S';
    if (y === bottom) {
      if (kind === 'broad' && (x === cx - 3 || x === cx + 1)) return 'D';
      if (x === cx - 2 || x === cx) return kind === 'broad' ? 'S' : 'D';
      if (x === cx - 1) return 'S';
    }
    if (y === bottom - 1 && x === cx) return 'A'; // light on the tip
    return null;
  };
  const mouth = (x: number, y: number): string | null => {
    const u = x - cx;
    switch (face.mouth ?? 'flat') {
      case 'flat':
        if (y === mY && u >= -3 && u <= 2) return 'D';
        if (y === mY + 1 && u >= -1 && u <= 0) return 'S';
        break;
      case 'smile':
        if (y === mY && u >= -2 && u <= 1) return 'D';
        if (y === mY - 1 && (u === -3 || u === 2)) return 'D';
        if (y === mY + 1 && u >= -1 && u <= 0) return 'S';
        if (y === mY - 2 && u === 3) return 'S'; // the cheek lifting
        break;
      case 'frown':
        if (y === mY && u >= -2 && u <= 1) return 'D';
        if (y === mY + 1 && (u === -3 || u === 2)) return 'D';
        break;
      case 'smirk':
        if (y === mY && u >= -3 && u <= 1) return 'D';
        if (y === mY - 1 && u === 2) return 'D';
        if (y === mY + 1 && u >= -1 && u <= 0) return 'S';
        break;
      case 'thin':
        if (y === mY && u >= -2 && u <= 1) return 'D';
        break;
      case 'full':
        if (y === mY - 1 && u >= -2 && u <= 1) return 'S';
        if (y === mY && u >= -3 && u <= 2) return 'D';
        if (y === mY + 1 && u >= -2 && u <= 1) return u === 0 ? 'A' : 'S';
        break;
      case 'open':
        if ((y === mY || y === mY + 1) && u >= -2 && u <= 1) return y === mY && u >= -1 && u <= 0 ? 'W' : 'D';
        break;
    }
    return null;
  };
  const beard = (x: number, y: number, inside: boolean): string | null => {
    const u = dxOf(x);
    const h = hw(y);
    switch (look.beard) {
      case 'moustache':
        if (inside && y >= mY - 2 && y <= mY - 1 && u >= -4 && u <= 4) return u < -1 ? 'H' : y === mY - 2 && u > 1 ? 'i' : 'h';
        if (inside && y === mY && (u === -4.5 || u === 3.5)) return 'h';
        return null;
      case 'stubble':
        if (inside && y >= mY - 2 && (Math.abs(u) > h - 3 || y >= mY + 1) && !(y === mY)) return 'S';
        return null;
      case 'trim':
      case 'full': {
        const full = look.beard === 'full';
        if (inside) {
          if (y === mY && Math.abs(u + 0.5) <= 2.5) return null; // the mouth shows through
          if (y === mY - 1 && u >= -3.5 && u <= 3.5) return u < -1 ? 'H' : 'h'; // a moustache over it
          if (y >= mY - (full ? 4 : 2) && (Math.abs(u) > h - (full ? 4 : 2.5) || y >= mY + 1)) return u < -h * 0.4 ? 'H' : (x + y) % 4 === 0 && u > 0 ? 'i' : 'h';
          if (full && y >= eyeY + 2 && Math.abs(u) > h - 1.5) return 'h'; // up to the ears
          return null;
        }
        if (full && y > chinY && y <= chinY + 4 && Math.abs(u) <= hw(chinY) + 1 - (y - chinY) * 0.8) return u < -1 ? 'H' : 'h';
        return null;
      }
    }
    return null;
  };
  const ageLines = (x: number, y: number): boolean => {
    const u = x - cx;
    if (age >= 1 && y === eyeY - 6 && u >= -2 && u <= 1) return true;
    if (age >= 1 && (u === -4 || u === 3) && y >= mY - 3 && y <= mY - 2) return true;
    if (age >= 2 && y === eyeY - 7 && u >= -3 && u <= 2 && hairline(x) < eyeY - 7) return true;
    return false;
  };
  const faceItems = (x: number, y: number): string | null => {
    const u = x - cx;
    // A scar down through the brow and the cheek, the eye spared, its raised edge catching the light.
    if (items.has('scar') && y >= browY - 2 && y <= eyeY + 5 && y !== eyeY && y !== eyeY - 1 && (u === 5 || u === 6)) return u === 5 ? 'D' : 'A';
    if (items.has('tattoo') && ((u === -6 && y >= eyeY + 2 && y <= eyeY + 4) || (u === -5 && y === eyeY + 5) || (u === -7 && y === eyeY + 2))) return y === eyeY + 2 ? 'G' : 'v';
    if (items.has('freckles') && ([[-3, 2], [-1, 3], [2, 2], [3, 3], [-4, 3], [4, 2]] as const).some(([a, b]) => u === a && y === eyeY + b)) return 'S';
    if (items.has('mole') && u === 4 && y === mY - 2) return 'D';
    if (items.has('piercing') && ((u === 5 && y === browY - 1) || (u === 0 && y === eyeY + 5))) return 'n';
    return null;
  };
  const spectacles = (x: number, y: number): string | null => {
    if (!items.has('spectacles')) return null;
    for (const ex of [cx - 3.5, cx + 2.5]) {
      const r = Math.hypot((x - ex) / 2.9, (y - eyeY) / 2.1);
      if (r >= 0.78 && r <= 1.18) return 'g';
    }
    if (y === eyeY - 1 && (x === cx - 1 || x === cx)) return 'g';
    if (y === eyeY - 1 && Math.abs(dxOf(x)) > 5.6 && Math.abs(dxOf(x)) <= hw(y)) return 'Y';
    return null;
  };

  // --- Headwear ---
  const headwear = (x: number, y: number): string | null => {
    const u = dxOf(x);
    const inside = inHead(x, y);
    switch (look.head) {
      case 'circlet':
        if (y === cy - 7 && (x === cx - 1 || x === cx)) return 'g'; // its point
        if ((y === cy - 6 || y === cy - 5) && Math.abs(u) <= hw(y) + 0.7) {
          if ((x === cx - 1 || x === cx) && y >= cy - 6) return y === cy - 6 && x === cx - 1 ? 'v' : 'G'; // the stone
          return y === cy - 6 && u > -hw(y) * 0.4 ? 'g' : 'Y';
        }
        return null;
      case 'helmet': {
        if (Math.abs(u) <= 1 && y >= cy - 17 && y <= cy - 12) return u < 0 ? 'Y' : 'g'; // the crest
        if (y < eyeY - 2 && inEllipse(x, y, cx - 0.5, cy - 2, rx + 1.6, ry + 1.4)) {
          if (y === eyeY - 3) return u < -rx * 0.4 ? 'Y' : 'g'; // its gold brow
          if (!inEllipse(x, y - 1, cx - 0.5, cy - 2, rx + 1.6, ry + 1.4) && u > 0) return 'n';
          return u > rx * 0.35 ? 'm' : u < -rx * 0.5 ? 'K' : 'M';
        }
        if (y >= eyeY - 2 && y <= eyeY + 1 && Math.abs(u) <= hw(y) + 1.2) { // the visor
          if (Math.abs(u) > hw(y) + 0.2) return 'M';
          if (y === eyeY - 1 && u >= 3 && u <= 5) return 'w';
          return y === eyeY - 2 || y === eyeY + 1 ? 'v' : 'G';
        }
        if (inside && y >= eyeY + 2 && y <= eyeY + 9 && Math.abs(u) > hw(y) - 2.5) return u > 0 ? 'm' : 'M'; // cheek guards
        return null;
      }
      case 'watchcap':
        if (y === cy - 4 && u >= -rx && u <= rx + 4) return u > rx ? 'j' : 'J'; // the peak
        if ((y === cy - 6 || y === cy - 5) && Math.abs(u) <= rx + 1.5) return y === cy - 6 ? (u > 0 ? 'G' : 'v') : 'v'; // its band
        if (y < cy - 6 && inEllipse(x, y, cx - 0.5, cy - 7, rx + 1.5, 6.8)) {
          if (y >= cy - 10 && y <= cy - 9 && Math.abs(u) <= 1) return 'g'; // a badge
          return u < -rx * 0.4 ? 'J' : 'j';
        }
        if (inside && y >= cy - 3 && y <= cy - 2) return 'S'; // its shadow on the brow
        return null;
      case 'cap':
        if (y >= cy - 12 && y <= cy - 5 && Math.abs(u) <= rx - 0.5) {
          if (y >= cy - 6) return u < -rx * 0.4 ? 'Y' : 'g';
          if (y === cy - 12) return u > 0 ? 'U' : 'j';
          return u < -rx * 0.4 ? 'J' : 'j';
        }
        return null;
      case 'hat':
        if ((y === cy - 7 || y === cy - 6) && Math.abs(u) <= rx + 6) return y === cy - 7 && u > -rx ? 'k' : 'K'; // the brim
        if (y >= cy - 16 && y < cy - 7 && Math.abs(u) <= rx - 1 - (y < cy - 14 ? 1 : 0)) return y >= cy - 9 ? 'K' : u < -rx * 0.4 ? 'K' : 'k';
        if (inside && y < eyeY - 1) return y >= cy - 5 && u > 0 ? 'S' : 'D'; // in its shade
        return null;
      case 'visor':
        if (y >= eyeY - 2 && y <= eyeY + 1 && Math.abs(u) <= hw(y) + 1) {
          if (Math.abs(u) > hw(y)) return 'M';
          if (y === eyeY - 1 && u >= 3 && u <= 4) return 'w';
          return y === eyeY - 2 || y === eyeY + 1 ? 'v' : 'G';
        }
        return null;
      case 'lens': {
        const r = Math.hypot(x - (cx + 2.5), y - eyeY);
        if (r < 2.3) return r < 1 ? 'w' : 'G';
        if (r < 3.4) return 'M';
        if (y === eyeY - 1 && u > 5 && u <= hw(y) + 1) return 'M'; // its strap
        return null;
      }
    }
    return null;
  };

  // --- Clothes ---
  const clothes = (x: number, y: number): string | null => {
    const u = dxOf(x);
    const a = Math.abs(u);
    const half = spread(y);
    if (y < T || a > half) return null;
    const style = look.topStyle;
    // A cape over the shoulders, a chain across the chest between its clasps.
    if (look.cape !== undefined && a > half - 4.5 && y >= T + 1) return u < 0 ? 'K' : 'k';
    if (look.cape !== undefined && y >= T + 2 && y <= T + 4 && a >= 5.5 && a <= 7.5) return u > 0 && y === T + 3 && a < 6.6 ? 'G' : 'g';
    if (look.cape !== undefined && y === T + 3 && a < 5.5) return (x + y) % 2 === 0 ? 'g' : 'Y';
    // Bare arms in a vest.
    if (style === 'vest' && a > half - 5) return u < 0 ? 'S' : 'L';
    // Epaulettes on the shoulders, with their fringe.
    if (look.epaulettes !== undefined) {
      const sx = spread(T + 3);
      if (y >= T + 1 && y <= T + 4 && a >= sx - 7 && a <= sx - 1.5) return y === T + 1 && u > 0 ? 'g' : u < 0 ? 'Y' : y === T + 4 ? 'Y' : 'g';
      if (y === T + 5 && a >= sx - 7 && a <= sx - 1.5 && x % 2 === 0) return 'g';
    }
    // Patches, stitched on.
    if (look.patches !== undefined) {
      const inPatch = (u >= -12 && u <= -7 && y >= T + 5 && y <= T + 9) || (u >= 6 && u <= 10 && y >= T + 9 && y <= T + 12);
      if (inPatch) return (u === -12 || u === -7 || u === 6 || u === 10 || y === T + 5 || y === T + 9 || y === T + 12) && (x + y) % 2 === 0 ? 'Z' : 'z';
    }
    // A bag's strap across from the right shoulder.
    if (look.bag !== undefined && Math.abs(u - (8.5 - (y - T) * 1.3)) <= 1) return 'z';
    // A sash from the right shoulder down to the left.
    if (look.sash !== undefined) {
      const c = 9 - (y - T) * 1.15;
      if (Math.abs(u - c) <= 1.7) return u - c < -0.7 ? 'X' : 'x';
    }
    // A medal on the chest.
    if (look.medal && u >= 5 && u <= 7 && y >= T + 6 && y <= T + 9) return y <= T + 7 ? 'x' : u === 7 ? 'Y' : 'g';
    // The city's glowing seams: across the yoke, and down each side.
    if (look.glow && a >= 7.5 && a <= 8.5 && y > T + 2) return u > 0 ? 'G' : 'v';
    // Overalls: the shirt under the bib, the straps.
    if (style === 'overalls') {
      if (a >= 4.5 && a <= 5.5 && y < T + 7) return u < 0 ? 'T' : 't';
      if (y < T + 7 || a > 7.5) return u < -half * 0.4 ? 'o' : 'O';
      if (y === T + 9 && u >= 1 && u <= 5) return 'T'; // the bib's pocket
    }
    // An apron: its bib, the straps over the shoulders.
    if (look.apron !== undefined && ((y >= T + 5 && a <= 8) || (a >= 4.5 && a <= 5.5 && y < T + 5))) return u < -3 ? 'b' : y === T + 5 ? 'b' : 'a';
    // Trim down the front of a closed coat; two rows of buttons on a uniform, one down an open coat.
    const closed = neck === 'high' || neck === 'gorget' || neck === 'wrap';
    if (look.trim !== undefined && closed && style !== 'gown' && (x === cx - 1 || x === cx)) return x === cx - 1 ? 'Q' : 'q';
    if (look.buttons !== undefined && look.trim === undefined) {
      if (look.epaulettes !== undefined && a >= 3.5 && a <= 4.5 && (y - T) % 3 === 2 && y > T + 3) return 'y';
      if (!closed && x === cx && y > T + 8 && (y - T) % 3 === 0) return 'y';
      if (closed && look.trim === undefined && x === cx && y > T + 2 && (y - T) % 3 === 0) return 'y';
    }
    // Embroidery along a gown's neckline.
    if (look.embroidery !== undefined && neck === 'scoop' && y === T + 7 && a < half - 2 && x % 2 === 0) return 'q';
    // The cloth itself: shaded across, a lit edge, folds on the shadowed side.
    if (a > half - 1.2) return u > 0 ? 'U' : 'T';
    if (u < -half * 0.4) return 'T';
    if (u < 0 && (x + Math.floor(y / 3)) % 7 === 0 && y > T + 3) return 'T';
    if (u > half * 0.55 && y < T + 3) return 'U'; // the light along the shoulder
    return 't';
  };
  /** What's at the neck: the neck itself, a collar, a gorget, a wrap, a low neckline and a necklace, an open neck. */
  const neckline = (x: number, y: number): string | null => {
    const u = dxOf(x);
    const a = Math.abs(u);
    if (y <= chinY - 1) return null;
    switch (neck) {
      case 'high':
        if (y >= chinY + 2 && y <= T + 2 && a <= 6.5) {
          if (y === chinY + 2 && a > 5.5) return null;
          if (look.trim !== undefined && (y === chinY + 2 || (x === cx && y > chinY + 2))) return 'g';
          if (x === cx && y > chinY + 2) return 'C'; // where it closes
          if (y === chinY + 2 && u > 0) return lit(look.collar ?? look.top) === (look.collar ?? look.top) ? 'c' : 'R';
          return u < -2.5 ? 'C' : 'c';
        }
        break;
      case 'gorget':
        if (y >= chinY + 2 && y <= T + 3 && a <= 7.5) {
          if (y === T + 3) return u < -3 ? 'Y' : 'g';
          if ((a === 4.5 || a === 5.5) && y === T + 1) return 'g'; // rivets
          if (y === chinY + 2 && u > 0) return 'n';
          return u > 2.5 ? 'm' : u < -3.5 ? 'K' : 'M';
        }
        break;
      case 'wrap':
        if (y >= chinY + 3 && y <= T + 4 && a <= 8.5 + (y - chinY - 3) * 0.5) return u < -3 || ((y - chinY) % 3 === 0 && a < 7) ? 'F' : 'f';
        break;
      case 'scoop':
        if (y >= T && y < T + 6) {
          if (look.necklace !== undefined) {
            if (a <= 5.5 && y === T + 1 + Math.round((5.5 - a) * 0.55)) return u < -2 ? 'Y' : 'g';
            if (a <= 1 && (y === T + 5 || y === T + 4)) return y === T + 5 ? 'G' : 'v'; // the stone
          }
          if (y === T + 1 && a >= 2.5 && a <= 7.5) return 'S'; // collarbones
          if (y === T + 5 && a < spread(y) - 1) return look.trim !== undefined ? 'q' : 'T'; // the neckline
          if (a <= spread(y)) return u < -spread(y) * 0.5 ? 'S' : 'L';
        }
        break;
      case 'open':
        if (look.topStyle === 'vest' || look.topStyle === 'overalls') break;
        if (y >= T - 1 && y <= T + 8) {
          const v = (T + 8 - y) * 0.55;
          if (a <= v) return y <= T + 1 && a >= 2 ? (u < 0 ? 'o' : 'O') : u < -0.5 ? 'o' : y <= T + 2 ? (u < 0 ? 'S' : 'L') : 'O';
          if (a <= v + 2.5 && y >= T) return u < 0 ? 'T' : a <= v + 1 ? 'U' : 't'; // lapels
        }
        break;
    }
    // The neck.
    if (a <= (build === 'heavy' ? 6 : 4.5) && y < T + 3) return y <= chinY + 1 ? (u < 2 ? 'D' : 'S') : u < -1.5 ? 'S' : 'L';
    return null;
  };

  const ears = (x: number, y: number): string | null => {
    if (hooded || helmet || hair === 'long' || hair === 'bob' || hair === 'curls') return null;
    if (y < eyeY - 1 || y > eyeY + 3) return null;
    const h = hw(eyeY + 1);
    const left = Math.floor(cx - 0.5 - h);
    const right = Math.ceil(cx - 0.5 + h);
    if (x === left) return 'S';
    if (x === right) {
      if (look.earpiece && (y === eyeY + 1 || y === eyeY)) return 'G';
      return y === eyeY + 1 ? 'S' : 'L';
    }
    return null;
  };
  const belowEars = (x: number, y: number): string | null => {
    const h = hw(eyeY + 1);
    const right = Math.ceil(cx - 0.5 + h);
    const left = Math.floor(cx - 0.5 - h);
    if (items.has('earring') && !hooded && !helmet) {
      if (x === right && (y === eyeY + 4 || y === eyeY + 5)) return y === eyeY + 5 ? 'G' : 'g';
      if (x === left && y === eyeY + 4 && hair !== 'long' && hair !== 'bob') return 'Y';
    }
    if (look.earpiece) {
      // The mic arm from the ear towards the mouth.
      const t = (y - (eyeY + 3)) / 4;
      if (t >= 0 && t <= 1 && x === Math.round(right - 1 - t * 2.5)) return 'M';
    }
    return null;
  };
  /** A guard's pike, upright behind the shoulder at the right. */
  const pike = (x: number, y: number): string | null => {
    if (look.hold !== 'pike') return null;
    const px = 42;
    if (y < 9 && Math.abs(x - px) <= (y < 4 ? y * 0.6 : (9 - y) * 0.5)) return x > px ? 'G' : 'g';
    if (y === 9 && x >= px - 3 && x <= px + 2) return 'g';
    if (y > 9 && (x === px || x === px - 1)) return x === px ? 'Y' : 'P';
    return null;
  };

  const pick = (x: number, y: number): string => {
    const u = dxOf(x);
    const inside = inHead(x, y);
    const wear = headwear(x, y);
    if (wear) return wear;
    // A hood round the face.
    if (hooded && !inside && y < T + 3) {
      if (inEllipse(x, y, cx - 0.5, cy, rx + 5, ry + 4) || (y > cy + 6 && Math.abs(u) <= rx + 1 + (y - cy - 6) * 1.2)) return Math.abs(u) > rx + 3 || u < 0 ? 'K' : 'k';
    }
    const plait = braid(x, y);
    if (plait && !(inside && y < chinY)) return plait;
    if (inside) {
      const specs = spectacles(x, y);
      if (specs) return specs;
      const hairHere = !hooded && !hat && y < hairline(x) && !(helmet && y < eyeY - 2);
      if (hairHere) return hairPixel(x, y, true);
      if (hooded && y < cy - 4) return u > rx - 3 ? 'S' : 'D'; // in the hood's shadow
      if (brow(x, y)) return 'B';
      const e = eye(x, y);
      if (e) return e;
      const item = faceItems(x, y);
      if (item) return item;
      const b = beard(x, y, true);
      if (b) return b;
      const n = nose(x, y);
      if (n) return n;
      const m = mouth(x, y);
      if (m) return m;
      if (ageLines(x, y)) return 'S';
      const h = hw(y);
      const t = u / h;
      // Shadow: the far side, under the cheekbone, under the chin; a sunken cheek when old.
      if (t < -0.58) return 'S';
      if (t < -0.32 && y >= eyeY + 3 && y <= mY + 1) return 'S';
      if (age >= 2 && t < -0.2 && y >= eyeY + 2 && y <= eyeY + 5) return 'S';
      if (!inHead(x, y + 1)) return t < 0.2 ? 'S' : 'L';
      // The light on the cheekbone.
      if (t > 0.38 && t < 0.8 && y >= eyeY + 2 && y <= eyeY + 3) return 'A';
      return 'L';
    }
    const b = beard(x, y, false);
    if (b) return b;
    if (!hooded && !hat && outerHair(x, y) && !(helmet && y < eyeY + 2)) return hairPixel(x, y, false);
    const ear = ears(x, y);
    if (ear) return ear;
    const below = belowEars(x, y);
    if (below) return below;
    const n = neckline(x, y);
    if (n) return n;
    const c = clothes(x, y);
    if (c) return c;
    return pike(x, y) ?? '.';
  };

  const rows = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => pick(x, y)).join(''));
  const skin = SKINS[look.skin];
  const hairColour = look.hair;
  const grey = hairColour === S.white || hairColour === S.light;
  const capColour = look.head === 'watchcap' ? S.cyanDeep : (look.headColour ?? look.top);
  const hoodColour = look.headColour ?? (hat ? S.woodLight : look.top);
  return {
    rows,
    colours: {
      L: skin.L, S: skin.S, D: skin.D, A: skin.A,
      e: S.shadow, w: S.white, W: S.light, I: face.eyeColour ?? S.shadow,
      h: hairColour, H: shade(hairColour), i: lit(hairColour), B: grey ? S.dim : hairColour === S.amber ? S.amberDeep : shade(hairColour),
      t: look.top, T: shade(look.top), U: lit(look.top),
      c: look.collar ?? look.top, C: shade(look.collar ?? look.top), R: lit(look.collar ?? look.top),
      q: look.trim ?? S.amber, Q: shade(look.trim ?? S.amber),
      g: S.amber, Y: S.amberDeep, G: S.cyan, v: S.cyanMid,
      M: S.deep, m: S.woodPale, n: S.light,
      x: look.sash ?? S.cyanMid, X: shade(look.sash ?? S.cyanMid),
      k: look.cape ?? hoodColour, K: shade(look.cape ?? hoodColour),
      O: look.shirt ?? (look.topStyle === 'overalls' ? (look.sleeve ?? S.light) : S.white), o: shade(look.shirt ?? (look.topStyle === 'overalls' ? (look.sleeve ?? S.light) : S.white)),
      a: look.apron ?? S.amber, b: shade(look.apron ?? S.amber),
      f: look.scarf ?? look.top, F: shade(look.scarf ?? look.top),
      j: capColour, J: shade(capColour),
      y: look.buttons ?? S.amber,
      z: look.patches ?? look.bag ?? S.woodLight, Z: shade(look.patches ?? look.bag ?? S.woodLight),
      P: S.amberDeep,
    },
  };
}
