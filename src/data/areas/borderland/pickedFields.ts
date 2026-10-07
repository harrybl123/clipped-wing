import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './scrapProps';
import type { AreaDefinition, Solid } from '../types';

// The picked fields (Chapter 2): scavenged clean, where everyone works. The first open sky in the game:
// a wide waste of dug-over dirt under a pale haze, the tree vast on the horizon with its top lost in
// white. What's left is what nobody could shift or sell: the stuck hull (the curved back of something
// enormous, half buried, stripped of every panel that would come off; climb it to see the tree), a mast
// bent double, cracked glass, cable. Under the hull's low end a crack where something still glows.
// The track back to the settlement at the left; on to the dog's hollow, the sunk town and the tree's
// edge. See docs/areas/borderland/picked-fields.md. People come with the cast.

const W = 960;
const FLOOR = 232;
const HULL = { x: 400, width: 232, height: 64 };

/** The hull's back as one-way blocks, 8px wide, each down to the ground (like stairs): walk up its gentle right side, jump up its steep left. */
function hullSurface(): Solid[] {
  const out: Solid[] = [];
  for (let lx = 4; lx < HULL.width - 8; lx += 8) {
    let top = HULL.height;
    for (let i = 0; i < 8; i++) top = Math.min(top, P.hullTop(HULL.width, HULL.height, lx + i));
    const y = FLOOR - HULL.height + top;
    if (FLOOR - y < 6) continue;
    out.push({ x: HULL.x + lx, y, width: 8, height: FLOOR - y, oneWay: true, invisible: true });
  }
  return out;
}

const HULL_SOLIDS = hullSurface();
/** The highest block of the hull: where you stand to look at the tree. */
const CROWN = HULL_SOLIDS.reduce((a, b) => (b.y < a.y ? b : a));

export const pickedFields: AreaDefinition = {
  id: 'picked-fields',
  name: 'the picked fields',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 168, treeX: 372 },
  ambient: 1,
  playerStart: { x: 60, y: FLOOR },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
    // Spoil heaps you can step onto.
    { x: 152, y: FLOOR - 7, width: 26, height: 7, oneWay: true, invisible: true },
    { x: 752, y: FLOOR - 7, width: 26, height: 7, oneWay: true, invisible: true },
    ...HULL_SOLIDS,
  ],

  lights: [
    { x: HULL.x + 201, y: FLOOR, colour: S.cyan, radius: 16, radiusY: 6, strength: 0.25 }, // the glow in the crack
  ],

  lines: [],

  props: [
    // The track from the settlement.
    { sprite: P.trackMarker(30), x: 30, y: FLOOR - 30 },
    // Dug holes, spoil, tools.
    { sprite: P.dugHole(14), x: 100, y: FLOOR - 4 },
    { sprite: P.spoilHeap(34, 9), x: 148, y: FLOOR - 9 },
    { sprite: P.dugHole(10), x: 196, y: FLOOR - 4 },
    { sprite: P.toolsLeft, x: 214, y: FLOOR - 7 },
    { sprite: P.dugHole(18), x: 248, y: FLOOR - 4 },
    { sprite: P.bentMast(74), x: 336, y: FLOOR - 74 },
    { sprite: P.cableCoil(22), x: 372, y: FLOOR - 8 },
    // The stuck hull.
    { sprite: P.stuckHull(HULL.width, HULL.height), x: HULL.x, y: FLOOR - HULL.height },
    // Past it: glass, a ring standing out of the ground, more holes.
    { sprite: P.glassSlab(30, 16), x: 664, y: FLOOR - 16 },
    { sprite: P.buriedRing(34), x: 704, y: FLOOR - 17 },
    { sprite: P.spoilHeap(34, 9), x: 748, y: FLOOR - 9 },
    { sprite: P.dugHole(12), x: 790, y: FLOOR - 4 },
    { sprite: P.trackMarker(26), x: 818, y: FLOOR - 26 },
    { sprite: P.dugHole(16), x: 860, y: FLOOR - 4 },
    { sprite: P.trackMarker(30), x: 930, y: FLOOR - 30 },
    // Tech scraps: what's too broken to sell, but still bright.
    { sprite: P.casingPod(20), x: 122, y: FLOOR - 11 },
    { sprite: P.screenSlab(16), x: 228, y: FLOOR - 5 },
    { sprite: P.paintedPanel(24, 13), x: 272, y: FLOOR - 13 },
    { sprite: P.wireBundle(26), x: 384, y: FLOOR - 9 },
    { sprite: P.screenSlab(12), x: 640, y: FLOOR - 5 },
    { sprite: P.paintedPanel(18, 10), x: 738, y: FLOOR - 10 },
    { sprite: P.casingPod(26), x: 878, y: FLOOR - 14 },
    { sprite: P.wireBundle(20), x: 906, y: FLOOR - 9 },
  ],

  features: [],
  people: [],

  interactables: [
    { id: 'hole', x: 255, y: FLOOR, reach: 12, label: 'Look', knot: 'picked_fields_hole' },
    { id: 'mast', x: 346, y: FLOOR, reach: 12, label: 'Look', knot: 'picked_fields_mast' },
    { id: 'hull', x: HULL.x + 30, y: FLOOR, reach: 14, label: 'Look', knot: 'picked_fields_hull' },
    { id: 'glow', x: HULL.x + 201, y: FLOOR, reach: 10, label: 'Look', knot: 'picked_fields_glow' },
    { id: 'tree', x: CROWN.x + 4, y: CROWN.y, reach: 12, label: 'Look', knot: 'picked_fields_tree' },
    { id: 'glass', x: 680, y: FLOOR, reach: 12, label: 'Look', knot: 'picked_fields_glass' },
  ],

  exits: [
    { id: 'to-swap-yard', x: 20, y: FLOOR, reach: 16, to: 'swap-yard' },
    { id: 'to-dogs-hollow', x: 300, y: FLOOR, reach: 10, to: 'dogs-hollow', showIf: 'found_dog' }, // a secret until you've found the dog
    { id: 'to-sunk-town', x: 822, y: FLOOR, reach: 12, to: 'sunk-town' },
    { id: 'to-trees-edge', x: 940, y: FLOOR, reach: 16, to: 'trees-edge' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.55 },
    { sound: 'workshop', volume: 0.15, when: ['morning', 'afternoon'] }, // someone digging, far off
  ],
};
