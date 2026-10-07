import { BORDER_HORIZON_Y, BORDER_TREE_X, BORDERLAND_LINKS, BORDERLAND_PLACES, RIVAL_LINE, SETTLEMENT } from '../data/borderlandMap';
import { addLight, cellRandom, falloff, noise, rgb, SHADES as S, smoothstep, type PixelColour, type RGB } from './pixelArt';
import { skyFor, treePainter } from './paintOutdoor';

// The borderland map (Chapter 2; docs/chapter-2-world.md), looking across the waste towards the tree.
// Everything on it is drawn on purpose, so it reads: the settlement's shacks in rows along its lanes
// inside a ring of scrap-plate walls, a landmark at every place (the boss's walled compound on its rise,
// the tally house's long hull roof, the swap yard's awnings, the scrap stacks' towers...), the grounds'
// own marks (dug holes, the sunk town's domes, the dog's hollow, the fence and its watch post, the deep
// ground's lines), and a few junk heaps on the plain. The tree stands on the horizon behind it all.

const W = 480;
const H = 270;
const HY = BORDER_HORIZON_Y;

type Put = (x: number, y: number, c: number) => void;
const at = (id: string) => BORDERLAND_PLACES.find((p) => p.id === id)!;

/** A shack: base at (x, y), its roof `roof`, a dark door, maybe a lit window, a shadow to the right. */
function shack(put: Put, x: number, y: number, w: number, h: number, roof: number, lit: boolean): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const py = y - h + dy;
      let c: number = dx === w - 1 ? S.deep : S.woodLight; // walls, shaded on the right
      if (dy === 0) c = S.light === roof ? S.white : S.dim; // the roof's lit edge
      else if (dy === 1) c = roof;
      else if (dx === 1 && dy >= h - 2) c = S.shadow; // the door
      else if (lit && dx === w - 3 && dy === h - 2) c = S.amber; // a window
      put(x + dx, py, c);
    }
  }
  for (let dx = 1; dx <= w; dx++) put(x + dx, y, S.deep); // shadow on the ground
}

/** A heap of junk: a mound with a lit top edge and the odd coloured part. */
function heap(put: Put, cx: number, base: number, w: number, h: number, seed: number): void {
  for (let dx = -w; dx <= w; dx++) {
    const top = Math.round(base - h * (1 - (dx / (w + 0.5)) ** 2) - (cellRandom(dx, seed, 3) > 0.7 ? 1 : 0));
    for (let y = top; y <= base; y++) {
      const r = cellRandom(cx + dx, y, seed);
      let c: number = y === top ? S.dim : r > 0.75 ? S.deep : S.woodLight;
      if (y === top && r > 0.85) c = [S.amber, S.cyan, S.white][Math.floor(r * 30) % 3]!;
      put(cx + dx, y, c);
    }
  }
}

function rect(put: Put, x: number, y: number, w: number, h: number, c: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) put(x + dx, y + dy, c);
}

/** Distance from a point to a link's line (to keep lanes clear of shacks). */
function nearLink(x: number, y: number): number {
  let best = Infinity;
  for (const l of BORDERLAND_LINKS) {
    const a = at(l.from);
    const b = at(l.to);
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
    best = Math.min(best, Math.hypot(x - a.x - vx * t, y - a.y - vy * t));
  }
  return best;
}

/** Everything drawn on purpose, as exact pixels. */
function decor(): Map<number, number> {
  const out = new Map<number, number>();
  const put: Put = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < W && y < H) out.set(Math.round(y) * W + Math.round(x), c);
  };
  const ring = (x: number, y: number) => Math.hypot((x - SETTLEMENT.x) / SETTLEMENT.rx, (y - SETTLEMENT.y) / SETTLEMENT.ry);

  // Junk heaps out on the plain, bigger nearer; none in the settlement or on a place.
  for (let i = 0; i < 70; i++) {
    const x = Math.round(cellRandom(i, 1, 51) * W);
    const y = Math.round(HY + 4 + cellRandom(i, 2, 51) ** 0.8 * (H - HY - 20));
    if (ring(x, y) < 1.15 || BORDERLAND_PLACES.some((p) => Math.hypot(p.x - x, p.y - y) < 16)) continue;
    if (Math.abs(x - BORDER_TREE_X) < 120 && y < HY + 12) continue;
    const depth = (y - HY) / (H - HY);
    heap(put, x, y, Math.round(2 + depth * 5 * (0.6 + cellRandom(i, 3, 51))), Math.round(1 + depth * 3), i);
  }

  // The settlement's filler shacks, in rows, clear of the lanes and the places.
  for (let gy = SETTLEMENT.y - SETTLEMENT.ry + 8; gy < SETTLEMENT.y + SETTLEMENT.ry - 2; gy += 8) {
    for (let gx = SETTLEMENT.x - SETTLEMENT.rx + 6; gx < SETTLEMENT.x + SETTLEMENT.rx; gx += 12) {
      const k = Math.floor(gx / 12) * 31 + gy;
      const x = gx + Math.round((cellRandom(k, 1, 61) - 0.5) * 4) + ((gy / 8) % 2) * 6;
      const y = gy + Math.round((cellRandom(k, 2, 61) - 0.5) * 2);
      const w = 6 + Math.floor(cellRandom(k, 3, 61) * 4);
      if (ring(x, y) > 0.88 || ring(x + w, y) > 0.88) continue;
      if (BORDERLAND_PLACES.some((p) => Math.abs(p.x - x - w / 2) < 14 && Math.abs(p.y - y) < 11)) continue;
      if (nearLink(x + w / 2, y - 2) < 4) continue;
      const r = cellRandom(k, 4, 61);
      const roof = r > 0.85 ? S.amberDeep : r > 0.72 ? S.cyanDeep : r > 0.6 ? S.light : S.dim;
      shack(put, x, y, w, 4 + (r > 0.5 ? 1 : 0), roof, cellRandom(k, 5, 61) > 0.6);
    }
  }

  // The walls: scrap plates standing round the ring, lit along the top, with gates where the tracks leave.
  const gates = [Math.atan2((at('swap-yard').y - SETTLEMENT.y) / SETTLEMENT.ry, (at('swap-yard').x - SETTLEMENT.x) / SETTLEMENT.rx) - 0.35];
  for (let a = 0; a < Math.PI * 2; a += 0.004) {
    if (gates.some((g) => Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.07)) continue;
    const x = SETTLEMENT.x + Math.cos(a) * SETTLEMENT.rx;
    const y = SETTLEMENT.y + Math.sin(a) * SETTLEMENT.ry;
    const plate = Math.floor(a * 40);
    const h = 3 + (plate % 3 === 0 ? 1 : 0) + (Math.sin(a) > 0 ? 1 : 0); // taller nearer
    const colour = plate % 7 === 0 ? S.amberDeep : plate % 5 === 0 ? S.light : S.dim;
    put(x, y - h, S.light);
    for (let dy = h - 1; dy >= 0; dy--) put(x, y - dy, Math.floor(a * 160) % 4 === 0 ? S.deep : colour);
  }

  // Landmarks, each round its place's marker.
  // The boss's compound: a walled yard on a rise, a big pale house with a tower.
  {
    const p = at('compound');
    for (let dx = -18; dx <= 18; dx++) for (let dy = 0; dy < 4 - Math.abs(dx) / 6; dy++) put(p.x + dx, p.y + 4 - dy, S.woodPale); // the rise
    for (let dx = -15; dx <= 15; dx++) {
      put(p.x + dx, p.y - 4, S.light);
      put(p.x + dx, p.y - 3, S.dim);
      put(p.x + dx, p.y + 2, S.dim);
    }
    for (let dy = -4; dy <= 2; dy++) {
      put(p.x - 15, p.y + dy, S.dim);
      put(p.x + 15, p.y + dy, S.deep);
    }
    rect(put, p.x - 9, p.y - 11, 18, 8, S.woodLight);
    rect(put, p.x - 10, p.y - 12, 20, 2, S.white); // a roof of whole matched panels
    rect(put, p.x + 4, p.y - 18, 5, 7, S.light); // the tower
    put(p.x + 6, p.y - 16, S.cyan); // the working light
    for (const wx of [-7, -3, 1]) put(p.x + wx, p.y - 8, S.amber);
  }
  // The tally house: a long hull roof with ribs, the door lit.
  {
    const p = at('tally-house');
    for (let dx = -13; dx <= 13; dx++) {
      const top = Math.round(p.y - 2 - 8 * Math.sqrt(1 - (dx / 13.5) ** 2));
      for (let y = top; y <= p.y + 2; y++) put(p.x + dx, y, y === top ? S.light : dx % 4 === 0 ? S.deep : S.dim);
    }
    rect(put, p.x - 2, p.y - 1, 4, 3, S.amberDeep);
  }
  // The bar: two storeys, a row of lit windows.
  {
    const p = at('bar');
    rect(put, p.x - 8, p.y - 12, 16, 15, S.woodLight);
    rect(put, p.x - 9, p.y - 13, 18, 1, S.dim);
    for (let dx = -6; dx <= 6; dx += 3) {
      put(p.x + dx, p.y - 9, S.amber);
      put(p.x + dx, p.y - 4, S.amber);
    }
    rect(put, p.x + 8, p.y - 12, 1, 15, S.deep);
  }
  // The swap yard: striped awnings over stalls.
  {
    const p = at('swap-yard');
    const stripes = [S.amber, S.cyanMid, S.light, S.amberDeep];
    for (let i = -1; i <= 1; i++) {
      const x0 = p.x + i * 9 - 3;
      for (let dx = 0; dx < 7; dx++) {
        put(x0 + dx, p.y - 6, stripes[(dx + i + 4) % 4]!);
        put(x0 + dx, p.y - 5, stripes[(dx + i + 5) % 4]!);
        put(x0 + dx, p.y - 1, S.woodLight); // the stall
      }
      put(x0, p.y - 4, S.deep);
      put(x0, p.y - 3, S.deep);
      put(x0 + 6, p.y - 4, S.deep);
      put(x0 + 6, p.y - 3, S.deep);
      put(x0 + 2 + i, p.y - 2, [S.cyan, S.amber, S.white][i + 1]!); // wares
    }
  }
  // The scrap stacks: towers of junk.
  {
    const p = at('scrap-stacks');
    for (const [dx, h] of [[-8, 13], [0, 19], [8, 11]] as const) {
      for (let y = 0; y < h; y++) {
        const wobble = Math.round(noise(y / 3 + dx) * 1.5);
        for (let w = -2; w <= 2; w++) {
          const r = cellRandom(dx + w, y, 71);
          put(p.x + dx + w + wobble, p.y + 2 - y, w === -2 ? S.dim : r > 0.85 ? [S.amberDeep, S.cyanDeep, S.light][Math.floor(r * 20) % 3]! : r > 0.4 ? S.woodLight : S.deep);
        }
      }
    }
  }
  // The gambling den: low and half sunk, a dark ramp down, a lamp.
  {
    const p = at('gambling-den');
    rect(put, p.x - 8, p.y - 5, 16, 6, S.woodLight);
    rect(put, p.x - 9, p.y - 6, 18, 1, S.dim);
    for (let i = 0; i < 4; i++) rect(put, p.x - 3 + i, p.y - 3 + i, 6 - i * 2 + 1, 1, S.shadow);
    put(p.x + 6, p.y - 4, S.amber);
  }
  // The brothel: cloth hung over the front in colours, a lantern.
  {
    const p = at('brothel');
    rect(put, p.x - 8, p.y - 10, 16, 12, S.woodLight);
    rect(put, p.x - 9, p.y - 11, 18, 1, S.dim);
    const cloth = [S.amber, S.cyanMid, S.amberDeep, S.light];
    for (let dx = -7; dx <= 7; dx += 2) for (let dy = 0; dy < 3 + ((dx + 7) % 3); dy++) put(p.x + dx, p.y - 9 + dy, cloth[((dx + 7) / 2) % 4]!);
    put(p.x - 10, p.y - 6, S.amber);
  }
  // Your shack: one small patched shack on the edge.
  {
    const p = at('shack');
    shack(put, p.x - 5, p.y + 2, 10, 7, S.dim, false);
    put(p.x + 2, p.y - 2, S.cyanMid); // a patch of dead glass in the wall
  }
  // The picked fields: rows of dug holes, a spoil heap, the stuck hull and a bent mast.
  {
    const p = at('picked-fields');
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 9; i++) {
        const x = p.x - 40 + i * 10 + (row % 2) * 5 + Math.round(cellRandom(i, row, 81) * 3);
        const y = p.y - 8 + row * 5;
        if (Math.hypot(x - p.x, y - p.y) < 8) continue;
        rect(put, x, y, 3, 1, S.shadow);
        put(x + 3, y, S.dim);
      }
    }
    for (let dx = -10; dx <= 10; dx++) {
      const top = Math.round(p.y - 12 - 6 * Math.sqrt(1 - (dx / 10.5) ** 2));
      for (let y = top; y <= p.y - 12; y++) put(p.x + 26 + dx, y, y === top ? S.light : dx % 4 === 0 ? S.deep : S.dim);
    }
    for (let y = 0; y < 8; y++) put(p.x - 30, p.y - 12 - y, S.dim); // the mast
    for (let i = 0; i < 5; i++) put(p.x - 30 + i, p.y - 20 + i, S.dim);
  }
  // The sunk town: domes and tower tops poking out of the ground, rounded windows.
  {
    const p = at('sunk-town');
    for (const [dx, r] of [[-16, 6], [-4, 9], [10, 5], [20, 7]] as const) {
      for (let x = -r; x <= r; x++) {
        const top = Math.round(p.y + 2 - Math.sqrt(r * r - x * x) * 0.8);
        for (let y = top; y <= p.y + 2; y++) put(p.x + dx + x, y, y === top ? S.light : S.dim);
      }
      put(p.x + dx, p.y + 2 - Math.round(r * 0.4), S.cyanMid);
      put(p.x + dx + 1, p.y + 2 - Math.round(r * 0.4), S.cyanMid);
    }
    rect(put, p.x + 1, p.y - 14, 3, 9, S.dim); // a tower top, at an angle
    put(p.x + 2, p.y - 11, S.cyan);
  }
  // The dog's hollow is a secret: nothing marks it on the map (its lamp appears once you've found the dog).
  // The rival line: a watch post on stilts beside the fence.
  {
    const p = at('rival-line');
    rect(put, p.x - 12, p.y - 10, 8, 2, S.dim);
    for (const dx of [-12, -5]) for (let y = -8; y <= 2; y++) put(p.x + dx, p.y + y, S.deep);
    put(p.x - 8, p.y - 11, S.amber);
  }
  // The tree's edge: a line of warning posts nobody goes past.
  {
    const p = at('trees-edge');
    for (const dx of [-30, -18, 18, 30]) {
      for (let y = 0; y < 6; y++) put(p.x + dx, p.y + 4 - y, S.dim);
      put(p.x + dx + 1, p.y - 1, S.light);
    }
  }
  // The deep ground: a last marker post.
  {
    const p = at('deep-ground');
    for (let y = 0; y < 8; y++) put(p.x + 10, p.y + 2 - y, S.dim);
    rect(put, p.x + 11, p.y - 5, 3, 2, S.light);
  }
  return out;
}

/** The map's backdrop: sky, the tree, the plain, the deep ground's lines, the fence, then the decor and tracks. */
export function paintBorderlandMap(paths: Map<number, number>, glows: { x: number; y: number; rgb: RGB }[]): (x: number, y: number) => PixelColour {
  const sky = skyFor('morning');
  const tree = treePainter(BORDER_TREE_X, HY, 0.7, sky, false);
  const drawn = decor();
  const [amber, white] = [S.amber, S.white].map(rgb) as [RGB, RGB];
  const dust = rgb(S.woodPale).map((v, i) => v * 0.7 + rgb(S.amberDeep)[i]! * 0.3) as RGB;
  const near = rgb(S.woodLight);
  const fenceX = (y: number) => RIVAL_LINE.from.x + ((RIVAL_LINE.to.x - RIVAL_LINE.from.x) * (y - RIVAL_LINE.from.y)) / (RIVAL_LINE.to.y - RIVAL_LINE.from.y);
  const fires = [{ x: 452, y: 128 }, { x: 470, y: 176 }, { x: 440, y: 108 }, { x: 476, y: 222 }];

  return (x, y) => {
    const path = paths.get(y * W + x);
    if (path !== undefined) return path;
    const d = drawn.get(y * W + x);
    if (d !== undefined) return d;

    if (y < HY) {
      const t = tree(x, y);
      if (t !== null) return t;
      let c = [...sky.top] as RGB;
      c = c.map((v, i) => v + (sky.horizon[i]! - v) * smoothstep(0, HY, y) ** 0.8) as RGB;
      c = addLight(c, white, 0.35 * falloff(x, y, BORDER_TREE_X - 150, -10, 120, 50));
      return c.map((v) => Math.min(255, v)) as RGB;
    }

    // The plain: hazy at the horizon, darker nearer, smooth.
    const depth = smoothstep(HY, H, y);
    let c = dust.map((v, i) => v * (1 - depth) + near[i]! * depth) as RGB;
    c = c.map((v, i) => v + (sky.horizon[i]! - v) * 0.4 * (1 - smoothstep(HY, HY + 22, y))) as RGB;
    c = c.map((v) => v * (1 + 0.06 * noise(x / 9 + noise(y / 5) * 2))) as RGB;

    // The deep ground: straight lines in the earth running away to a point on the horizon, far left.
    if (x < 150 && y > HY + 1 && y < HY + 54) {
      const slope = (x - 20) / (y - HY + 0.001);
      for (const s of [-3.2, -1.6, -0.4, 0.8, 2.2]) if (Math.abs(slope - s) < 0.05 + 0.02 * Math.abs(s)) return S.deep;
    }
    c = c.map((v) => v * (1 - 0.18 * falloff(x, y, 40, HY + 20, 90, 26))) as RGB; // the deep ground, darker

    // Inside the settlement: trodden darker ground, lamplight.
    const ring = Math.hypot((x - SETTLEMENT.x) / SETTLEMENT.rx, (y - SETTLEMENT.y) / SETTLEMENT.ry);
    if (ring < 1) {
      c = c.map((v) => v * 0.88) as RGB;
      c = addLight(c, amber, 0.1 * falloff(x, y, SETTLEMENT.x, SETTLEMENT.y, SETTLEMENT.rx, SETTLEMENT.ry));
    }

    // The rival line: posts and two wires; their side's fires far off.
    if (y > RIVAL_LINE.from.y) {
      const off = x - fenceX(y);
      const post = Math.round(y) % 8 < 1 + depth * 2;
      if (post && off > -1 && off < 1 + depth) return S.deep;
      if (Math.abs(off) < 0.6 && y % 3 === 0) return S.dim;
      if (off > 0) c = c.map((v) => v * 0.9) as RGB;
    }
    for (const f of fires) {
      if (Math.abs(x - f.x) < 1 && Math.abs(y - f.y) < 1) return S.amber;
      c = addLight(c, amber, 0.45 * falloff(x, y, f.x, f.y, 5, 3));
    }

    // The dog's hollow and the tree's roots get a little shade; built places glow.
    for (const g of glows) c = addLight(c, g.rgb, 0.3 * falloff(x, y, g.x, g.y, 11, 8));
    return c;
  };
}
