import * as P from './treesEdgeProps';
import { dugHole } from './scrapProps';
import type { AreaDefinition, Solid } from '../types';
import { cast, dogFollowing } from './people';

// The tree's edge (Chapter 2): where the borderland meets the tree's roots. Nobody goes close. The tree's
// mystery, seen from outside: the waste running up to roots that come out of the ground like walls, bigger
// than anything in the settlement, dark wet bark, the green glow of fungus in the cracks (the only green out
// here besides the canopy). Above, the trunk goes up into the canopy. Scavengers' warning signs stand a
// long way back. In the root, a crack, glowing at its lips and dark inside, that you can't go into.
// Something in the wood creaks and settles: the sound of the tree from Act 1, heard from outside.
// See docs/areas/borderland/trees-edge.md.

const W = 720;
const FLOOR = 232;
/** One great root, rising smoothly out of the ground and up to the top-right corner (designer: one smooth thing, not two). */
const ROOT = { x: 300, width: 420, height: 210, thickness: 56 };

/** Walk up the root's lower end: one-way blocks along its top, 8px wide, down to the ground (like stairs). */
function rootPath(r: typeof ROOT, upTo: number): Solid[] {
  const out: Solid[] = [];
  for (let lx = 0; lx < upTo; lx += 8) {
    let top = r.height;
    for (let i = 0; i < 8; i++) top = Math.min(top, P.rootTop(r.width, r.height, lx + i));
    const y = FLOOR - r.height + top;
    if (FLOOR - y < 4) continue;
    out.push({ x: r.x + lx, y, width: 8, height: FLOOR - y, oneWay: true, invisible: true });
  }
  return out;
}

const ROOT_PATH = rootPath(ROOT, 140);
/** The highest point you can climb to on the root. */
const ROOT_TOP = ROOT_PATH.reduce((a, b) => (b.y < a.y ? b : a));

export const treesEdge: AreaDefinition = {
  id: 'trees-edge',
  name: "the tree's edge",
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 200, treeX: 420, treeScale: 2.6, atRoots: true },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: 690, y: 0, width: 30, height: 270, invisible: true }, // the roots: no further
    ...ROOT_PATH,
  ],

  lights: [
    { x: 615, y: FLOOR, colour: 0x6fe0c0, radius: 40, radiusY: 10, strength: 0.3 }, // the glow from the crack on the ground
  ],

  lines: [],

  props: [
    { sprite: P.WARNING, x: 70, y: FLOOR - 36 },
    { sprite: P.WARNING, x: 170, y: FLOOR - 36 },
    { sprite: dugHole(10), x: 120, y: FLOOR - 4 },
    { sprite: P.root(ROOT.width, ROOT.height, ROOT.thickness, 2), x: ROOT.x, y: FLOOR - ROOT.height },
    { sprite: P.CRACK, x: 600, y: FLOOR - 96 },
    { sprite: P.FUNGUS, x: 360, y: FLOOR - 40 },
    { sprite: P.FUNGUS, x: 520, y: FLOOR - 120 },
  ],

  features: [
    // Chapter 2, Day 11, dusk: out past the signs, where nobody goes.
    { type: 'trigger', x: 250, y: FLOOR, reach: 50, knot: 'c2day11_edge', showIf: 'edge_ready11', hideIf: 'edge11' },
  ],
  people: [
    dogFollowing(30, FLOOR),
    // Day 11: the watcher, walking you out (the truce); the old scavenger pushing your brother in a cart.
    cast('watcher', 170, FLOOR, { id: 'watcher-edge11', showIf: 'watcher_edge11', hideIf: 'old_edge11' }),
    cast('old_scav', 30, FLOOR, { id: 'old-edge11', showIf: 'old_edge11' }),
    cast('brother', 16, FLOOR, { id: 'brother-cart11', showIf: 'old_edge11' }),
  ],

  interactables: [
    { id: 'warning', x: 78, y: FLOOR, reach: 12, label: 'Look', knot: 'trees_edge_warning' },
    { id: 'roots', x: 290, y: FLOOR, reach: 14, label: 'Touch', knot: 'trees_edge_roots' },
    { id: 'listen', x: ROOT_TOP.x + 4, y: ROOT_TOP.y, reach: 12, label: 'Listen', knot: 'trees_edge_listen' },
    { id: 'crack', x: 615, y: FLOOR, reach: 16, label: 'Look', knot: 'trees_edge_crack' },
  ],

  exits: [{ id: 'to-picked-fields', x: 16, y: FLOOR, reach: 12, to: 'picked-fields' }],

  ambience: [
    { sound: 'creaks', volume: 0.55 }, // the tree settling: Act 1's sound, from outside
    { sound: 'fizz', volume: 0.2 },
    { sound: 'drips', volume: 0.2 },
    { sound: 'wind', volume: 0.2 },
  ],
};
