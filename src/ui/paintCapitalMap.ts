import { CAPITAL_HORIZON_Y, CAPITAL_PLACES, CAPITAL_TREE_X, CITADEL_X, CITY_WALL_Y } from '../data/capitalMap';
import { addLight, cellRandom, falloff, noise, rgb, SHADES as S, smoothstep, type PixelColour, type RGB } from './pixelArt';
import { skyFor, treePainter } from './paintOutdoor';

// The capital's map (Chapter 3; docs/chapter-3-world.md), side-on at night so its lights read: the
// citadel's marble towers crowning the top with gold on their tops (the sealed wing the tallest, dark,
// a line of blue light up it; the glasshouse a dome on its shoulder), the city stepping down the hill
// below in blocks lit cyan and amber, the glass lifts down its face, the data centre's racks, the
// promenade's awnings and its great screen, the low district stacked under its cables at the bottom,
// the wall with the gate and the road going out, and the tree small and dark on the far horizon.

const W = 480;
const H = 270;
const HY = CAPITAL_HORIZON_Y;

type Put = (x: number, y: number, c: number) => void;
const at = (id: string) => CAPITAL_PLACES.find((p) => p.id === id)!;

function rect(put: Put, x: number, y: number, w: number, h: number, c: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) put(x + dx, y + dy, c);
}

/** A marble tower: lit white on its right, shaded on its left, a gold cap and a spire, small lit windows. */
function tower(put: Put, x: number, top: number, w: number, bottom: number, seed: number, spire = true): void {
  for (let y = top; y < bottom; y++) {
    for (let dx = 0; dx < w; dx++) {
      let c: number = dx === 0 ? S.dim : dx === w - 1 ? S.white : S.light;
      if (y < top + 2) c = y === top ? S.amber : S.amberDeep; // the gold cap
      else if (dx > 0 && dx < w - 1 && (y - top) % 5 === 3 && dx % 3 === 1 && cellRandom(x + dx, y, seed) > 0.35) c = cellRandom(x + dx, y, seed + 1) > 0.5 ? S.amber : S.cyan; // windows
      else if ((y - top) % 10 === 9) c = dx === w - 1 ? S.light : S.dim; // a course line
      put(x + dx, y, c);
    }
  }
  if (spire) for (let y = top - 6; y < top; y++) put(x + Math.floor(w / 2), y, y === top - 6 ? S.white : S.amber);
}

/** A stacked low block: dark walls, a pale top edge, windows lit amber (and the odd cyan sign). */
function block(put: Put, x: number, y: number, w: number, h: number, seed: number, cyanEvery = 0.12): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let c: number = dx === w - 1 ? S.deep : S.woodLight;
      if (dy === 0) c = S.dim;
      else if (dy % 3 === 2 && dx % 2 === 1 && dx < w - 1) {
        const r = cellRandom(x + dx, y + dy, seed);
        if (r > 0.45) c = r > 1 - cyanEvery ? S.cyan : S.amber;
      }
      put(x + dx, y - h + dy, c);
    }
  }
}

/** Builds the exact-colour pixels: the landmarks. */
function landmarks(): Map<number, number> {
  const out = new Map<number, number>();
  const put: Put = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < W && y < H) out.set(Math.round(y) * W + Math.round(x), c);
  };

  // The low district: stacked boxes crowding the bottom of the hill, under cables.
  for (let i = 0, x = 196; x < 312; i++) {
    const w = 6 + Math.floor(cellRandom(i, 0, 61) * 8);
    const h = 8 + Math.floor(cellRandom(i, 1, 61) * 14);
    block(put, x, CITY_WALL_Y + 22, w, h, 60 + i, 0.05);
    if (cellRandom(i, 2, 61) > 0.5) block(put, x + 1, CITY_WALL_Y + 22 - h, w - 2, 5 + Math.floor(cellRandom(i, 3, 61) * 6), 70 + i, 0.05);
    x += w;
  }
  for (const [a, b] of [[198, 236], [230, 272], [262, 310]] as const) {
    for (let x = a; x <= b; x++) {
      const t = (x - a) / (b - a);
      put(x, CITY_WALL_Y - 4 + Math.round(Math.sin(t * Math.PI) * 4), S.deep); // a cable, sagging
    }
  }

  // The city wall along the bottom, crenellated, with the gate: a dark arch, a lamp, the road out.
  for (let x = 24; x < 456; x++) {
    if (x > 196 && x < 312) continue; // the low district's stacks stand in front of it here
    for (let y = CITY_WALL_Y; y < CITY_WALL_Y + 22; y++) {
      const top = y === CITY_WALL_Y || (y === CITY_WALL_Y + 1 && x % 6 < 3);
      put(x, y, top ? S.dim : (y - CITY_WALL_Y) % 7 === 0 || (x + Math.floor((y - CITY_WALL_Y) / 7) * 3) % 12 === 0 ? S.deep : S.woodLight);
    }
    if (x % 6 < 3) put(x, CITY_WALL_Y - 1, S.dim);
  }
  const gate = at('city-gate');
  for (let y = CITY_WALL_Y + 4; y < CITY_WALL_Y + 22; y++) {
    const half = y < CITY_WALL_Y + 9 ? Math.round(Math.sqrt(Math.max(0, 25 - (CITY_WALL_Y + 9 - y) ** 2))) : 5;
    for (let dx = -half; dx <= half; dx++) put(gate.x + dx, y, Math.abs(dx) === half ? S.amberDeep : S.shadow);
  }
  put(gate.x - 7, CITY_WALL_Y + 6, S.amber);
  put(gate.x + 7, CITY_WALL_Y + 6, S.amber);
  for (let x = 0; x < gate.x - 4; x++) {
    const y = CITY_WALL_Y + 22 + Math.round((gate.x - 4 - x) * 0.18);
    put(x, y, S.dim); // the road out, across the waste
    if (x % 5 !== 0) put(x, y + 1, S.woodLight);
  }

  // The city on the hill: blocks of every height stepping up towards the citadel (drawn behind it).
  const hill = (x: number) => HY - 6 - 82 * Math.exp(-(((x - CITADEL_X) / 118) ** 2));
  for (let i = 0, x = 40; x < 440; i++) {
    const w = 7 + Math.floor(cellRandom(i, 4, 62) * 9);
    // Each block stands on the wall's foot and rises to the hill's line, give or take a storey or two.
    const top = Math.round(hill(x + w / 2) - cellRandom(i, 5, 62) * 16);
    if (top < CITY_WALL_Y - 4) block(put, x, CITY_WALL_Y, w, CITY_WALL_Y - top, 80 + i, 0.3);
    x += w;
  }

  // The data centre: a squat block banded with racks of blue light.
  const dc = at('data-centre');
  for (let y = dc.y - 10; y < dc.y + 10; y++) {
    for (let x = dc.x - 14; x < dc.x + 14; x++) {
      const edge = x === dc.x - 14 || x === dc.x + 13 || y === dc.y - 10;
      put(x, y, edge ? S.dim : (y - dc.y) % 3 === 0 ? ((x + y) % 4 === 0 ? S.white : S.cyan) : S.cyanDeep);
    }
  }

  // The promenade: a terrace of shopfronts under striped awnings, the great screen over its square.
  const pr = at('promenade');
  rect(put, pr.x - 30, pr.y + 4, 60, 2, S.dim);
  for (let x = pr.x - 28; x < pr.x + 28; x++) {
    put(x, pr.y - 2, Math.floor((x - pr.x) / 3) % 2 ? S.amber : S.amberDeep);
    put(x, pr.y - 1, S.deep);
    if (x % 7 === 3) for (let y = pr.y; y < pr.y + 4; y++) put(x, y, S.amber);
  }
  for (let y = pr.y - 18; y < pr.y - 8; y++) for (let x = pr.x - 9; x < pr.x + 9; x++) put(x, y, y === pr.y - 18 || y === pr.y - 9 || x === pr.x - 9 || x === pr.x + 8 ? S.deep : (x + y) % 5 === 0 ? S.white : S.cyan);
  for (let y = pr.y - 8; y < pr.y - 2; y++) put(pr.x, y, S.deep); // its post

  // The citadel's base: a marble platform with a gold band, under its towers.
  for (let y = 100; y < 120; y++) {
    const half = 74 + (y - 100) * 1.4;
    for (let x = Math.round(CITADEL_X - half); x <= CITADEL_X + half; x++) {
      const lit = x > CITADEL_X + half - 2;
      put(x, y, y === 101 ? S.amber : y === 100 ? S.white : lit ? S.white : (y - 100) % 6 === 5 ? S.dim : S.light);
    }
  }
  // The great hall and its doors, over the lifts.
  rect(put, CITADEL_X - 22, 88, 44, 12, S.light);
  rect(put, CITADEL_X - 22, 88, 44, 1, S.amber);
  rect(put, CITADEL_X - 4, 92, 8, 8, S.amberDeep);
  rect(put, CITADEL_X - 3, 93, 6, 7, S.amber);
  // Towers: the halls in the middle, the private rooms high up, the state rooms below.
  tower(put, at('council-chamber').x - 12, 86, 24, 100, 1, false);
  tower(put, at('banquet-gallery').x - 14, 84, 28, 100, 2, false);
  tower(put, CITADEL_X - 18, 62, 36, 88, 3, false);
  tower(put, at('diplomats-office').x - 6, 46, 12, 100, 4);
  tower(put, at('fathers-study').x - 7, 40, 14, 62, 5);
  tower(put, at('prince-quarters').x - 7, 32, 14, 62, 6);
  tower(put, at('guest-wing').x - 9, 44, 18, 84, 7);
  tower(put, CITADEL_X + 50, 58, 10, 84, 8);
  tower(put, CITADEL_X - 64, 60, 10, 100, 9);
  // The sealed wing: the tallest tower, dark, with a line of blue light up it.
  const sw = at('sealed-wing');
  for (let y = sw.y - 8; y < 40; y++) {
    for (let dx = -4; dx <= 4; dx++) put(sw.x + dx, y, dx === 0 ? (y % 4 === 0 ? S.white : S.cyan) : Math.abs(dx) === 4 ? S.shadow : S.deep);
  }
  for (let y = sw.y - 14; y < sw.y - 8; y++) put(sw.x, y, S.dim);
  // The glasshouse: a glass dome on the citadel's shoulder, green under its ribs.
  const gh = at('glasshouse');
  for (let y = gh.y - 12; y <= gh.y + 6; y++) {
    for (let x = gh.x - 14; x <= gh.x + 14; x++) {
      const d = Math.hypot((x - gh.x) / 14, (y - gh.y - 6) / 18);
      if (y > gh.y + 4) {
        put(x, y, y === gh.y + 5 ? S.amber : S.light);
        continue;
      }
      if (d > 1) continue;
      const rib = Math.abs(x - gh.x) % 5 === 0 || d > 0.9;
      put(x, y, rib ? S.cyanMid : y > gh.y - 2 ? (cellRandom(x, y, 9) > 0.5 ? S.green : S.greenMid) : S.cyanDeep);
    }
  }

  // The lifts: a glass shaft from the great hall down the city's face to the low district, two cars in it.
  const lifts = at('lifts');
  for (let y = 120; y < CITY_WALL_Y + 4; y++) {
    put(lifts.x - 4, y, S.cyanMid);
    put(lifts.x + 4, y, S.cyanMid);
    for (let x = lifts.x - 3; x <= lifts.x + 3; x++) put(x, y, S.cyanDeep);
  }
  for (const carY of [128, 182]) rect(put, lifts.x - 2, carY, 5, 4, S.white);
  return out;
}

/**
 * The capital map's painter, with this map's paths and the glow of built places. Night: a dark sky with
 * the city's glow bleeding up into it, blue over the citadel and amber over the low district.
 */
export function paintCapitalMap(paths: Map<number, number>, glows: { x: number; y: number; rgb: RGB }[]): (x: number, y: number) => PixelColour {
  const sky = skyFor('night');
  const tree = treePainter(CAPITAL_TREE_X, HY, 0.24, sky, true, false, 44);
  const marks = landmarks();
  const [cyan, amber, deep, shadow] = [S.cyan, S.amber, S.deep, S.shadow].map(rgb) as [RGB, RGB, RGB, RGB];

  return (x, y) => {
    const path = paths.get(y * W + x);
    if (path !== undefined) return path;
    const mark = marks.get(y * W + x);
    if (mark !== undefined) return mark;
    let c: RGB;
    if (y < HY) {
      const t = tree(x, y);
      if (t !== null) return t;
      c = deep.map((v, i) => v + (shadow[i]! - v) * (1 - smoothstep(0, HY, y))) as RGB;
      // A few stars, high up.
      if (y < 90 && cellRandom(x, y, 33) > 0.997) return S.dim;
    } else {
      // The waste beyond the walls, dark.
      c = shadow.map((v) => v * (1 + 0.08 * noise(x / 7 + y / 3))) as RGB;
    }
    // The city's glow: blue round the citadel, amber low down over the streets.
    c = addLight(c, cyan, 0.16 * falloff(x, y, CITADEL_X, 70, 120, 70));
    c = addLight(c, amber, 0.12 * falloff(x, y, CITADEL_X, CITY_WALL_Y, 170, 40));
    for (const g of glows) c = addLight(c, g.rgb, 0.3 * falloff(x, y, g.x, g.y, 11, 8));
    return c;
  };
}
