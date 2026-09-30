import { noise } from '../ui/pixelArt';

// Where each area sits on the map: a cross-section of the tree (docs/design-doc.md, "The map").
// Top to bottom: the Canopy; the upper branches with the Ascension gate on the tube; the trunk;
// the roots, a tight hub around the offering floor, with your home on the edge by the rot;
// the back routes beneath; the lower roots at the bottom. The tube runs up the middle.
// Coordinates are map-screen pixels (480×270); positions are placeholder until the designer
// supplies the map diagram.

export const MAP_TUBE_X = 240;

export interface MapPlace {
  /** Area id (a key of PLANNED_AREAS). */
  id: string;
  x: number;
  y: number;
  /** Which band of the tree it's in (for the key and future access rules). */
  level: 'upper branches' | 'trunk' | 'roots' | 'beneath';
  /** The colour its window glows when it's reachable. */
  light: 'amber' | 'cyan' | 'green' | 'white';
}

export const MAP_PLACES: readonly MapPlace[] = [
  { id: 'ascension-gate', x: MAP_TUBE_X, y: 38, level: 'upper branches', light: 'white' },
  { id: 'archive', x: 176, y: 56, level: 'upper branches', light: 'amber' },
  { id: 'upper-halls', x: 300, y: 50, level: 'upper branches', light: 'amber' },
  { id: 'seed-grove', x: 326, y: 78, level: 'upper branches', light: 'green' },
  { id: 'middle-tiers', x: 286, y: 110, level: 'trunk', light: 'amber' },
  { id: 'trunk-climb', x: 200, y: 128, level: 'trunk', light: 'amber' },
  { id: 'tenders-shrine', x: 186, y: 172, level: 'roots', light: 'amber' },
  { id: 'roots-market', x: 300, y: 172, level: 'roots', light: 'amber' },
  { id: 'offering-floor', x: MAP_TUBE_X, y: 192, level: 'roots', light: 'cyan' },
  { id: 'friends-home', x: 344, y: 200, level: 'roots', light: 'amber' },
  { id: 'home', x: 116, y: 204, level: 'roots', light: 'amber' },
  { id: 'back-routes', x: 262, y: 226, level: 'beneath', light: 'green' },
  { id: 'lower-roots', x: 142, y: 244, level: 'beneath', light: 'green' },
];

/** The top of the tree's cutaway on the map; the Canopy's glare is above it. */
export const MAP_CANOPY_Y = 22;

/** Half-width of the tree's cutaway at row y: canopy spread, narrow trunk, roots spreading wide. */
export function treeHalfWidth(y: number): number {
  if (y < MAP_CANOPY_Y) return 0;
  const wobble = noise(y / 6) * 5;
  if (y < 88) return 150 - (y - MAP_CANOPY_Y) * 0.9 + wobble; // upper branches
  if (y < 150) return 94 + wobble * 0.6; // trunk
  return Math.min(212, 94 + (y - 150) ** 1.3 * 0.95) + wobble; // roots spreading
}

/** How two places are joined on the map. */
export interface MapLink {
  from: string;
  to: string;
  kind: 'ladder' | 'walkway' | 'rope';
}

/** Faint paths between places: ladders, walkways and a rope bridge (placeholder, drawn on the map only). */
export const MAP_LINKS: readonly MapLink[] = [
  { from: 'home', to: 'offering-floor', kind: 'walkway' },
  { from: 'offering-floor', to: 'tenders-shrine', kind: 'ladder' },
  { from: 'offering-floor', to: 'roots-market', kind: 'ladder' },
  { from: 'offering-floor', to: 'friends-home', kind: 'walkway' },
  { from: 'offering-floor', to: 'back-routes', kind: 'ladder' },
  { from: 'back-routes', to: 'lower-roots', kind: 'walkway' },
  { from: 'home', to: 'lower-roots', kind: 'ladder' },
  { from: 'tenders-shrine', to: 'trunk-climb', kind: 'ladder' },
  { from: 'trunk-climb', to: 'middle-tiers', kind: 'walkway' },
  { from: 'trunk-climb', to: 'archive', kind: 'ladder' },
  { from: 'middle-tiers', to: 'upper-halls', kind: 'ladder' },
  { from: 'upper-halls', to: 'seed-grove', kind: 'rope' },
  { from: 'archive', to: 'ascension-gate', kind: 'walkway' },
  { from: 'upper-halls', to: 'ascension-gate', kind: 'walkway' },
];

/**
 * The place to move to from `from` when pressing a direction: the nearest place roughly that way
 * (within 45° of the direction), preferring straighter, then closer ones. Null if nothing lies that way.
 */
export function neighbourInDirection(from: MapPlace, dx: number, dy: number, places: readonly MapPlace[] = MAP_PLACES): MapPlace | null {
  let best: MapPlace | null = null;
  let bestScore = Infinity;
  for (const p of places) {
    if (p === from) continue;
    const vx = p.x - from.x;
    const vy = p.y - from.y;
    const dist = Math.hypot(vx, vy);
    const cos = (vx * dx + vy * dy) / (dist * Math.hypot(dx, dy));
    if (cos < 0.7) continue; // more than about 45° off
    const score = dist * (1 + 4 * (1 - cos)); // straighter, then closer, wins
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}
