import { noise } from '../ui/pixelArt';
import { BORDERLAND_LINKS, BORDERLAND_PLACES } from './borderlandMap';

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
  /** Which part of the world it's in, shown in the map's info bar (the tree's bands; the borderland's settlement or grounds). */
  level: 'upper branches' | 'trunk' | 'roots' | 'beneath' | 'the settlement' | 'the grounds';
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
  kind: 'ladder' | 'walkway' | 'rope' | 'track';
}

/** Faint paths between places: ladders, walkways and a rope bridge (placeholder, drawn on the map only). */
export const MAP_LINKS: readonly MapLink[] = [
  { from: 'home', to: 'offering-floor', kind: 'walkway' },
  { from: 'offering-floor', to: 'tenders-shrine', kind: 'ladder' },
  { from: 'offering-floor', to: 'roots-market', kind: 'ladder' },
  { from: 'offering-floor', to: 'friends-home', kind: 'walkway' },
  { from: 'offering-floor', to: 'back-routes', kind: 'ladder' },
  { from: 'roots-market', to: 'friends-home', kind: 'walkway' },
  { from: 'friends-home', to: 'back-routes', kind: 'ladder' },
  { from: 'home', to: 'back-routes', kind: 'walkway' },
  { from: 'tenders-shrine', to: 'back-routes', kind: 'ladder' },
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

/** A map: the places in one world and the paths between them. The map opens on the world of the area you're in. */
export interface MapWorld {
  id: 'tree' | 'borderland';
  /** The title in the map's corner. */
  title: string;
  places: readonly MapPlace[];
  links: readonly MapLink[];
  /** Where the cursor starts if you're somewhere that isn't on this map. */
  start: string;
}

export const WORLDS: readonly MapWorld[] = [
  { id: 'tree', title: 'The Tree', places: MAP_PLACES, links: MAP_LINKS, start: 'offering-floor' },
  { id: 'borderland', title: 'The borderland', places: BORDERLAND_PLACES, links: BORDERLAND_LINKS, start: 'swap-yard' },
];

/** The world an area is in (the tree for anything not on a map, e.g. hidden areas in Act 1). */
export function worldOf(areaId: string): MapWorld {
  return WORLDS.find((w) => w.places.some((p) => p.id === areaId)) ?? WORLDS[0]!;
}
