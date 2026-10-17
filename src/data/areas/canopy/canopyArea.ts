import type { AmbienceLayer, Prop, Solid } from '../types';
import { behind, treehouse, treehouseTop, type Roof } from './canopyProps';

// Helpers for building the canopy's areas (Chapter 4).

/**
 * A stair of one-way steps 8 px high from a floor at `low` up to a landing at `high`, its top step at `edge`,
 * rising towards `side` (the promenade's way: every step reaches back under the one above, so from behind
 * you walk along the bottom).
 */
export function stair(edge: number, low: number, high: number, side: 'left' | 'right'): Solid[] {
  const steps = Math.round((low - high) / 8) - 1;
  return Array.from({ length: steps }, (_, i) => {
    const k = i + 1;
    const top = high + 8 * k;
    return side === 'left' ? { x: edge, y: top, width: 8 * k, height: low - top, oneWay: true } : { x: edge - 8 * k, y: top, width: 8 * k, height: low - top, oneWay: true };
  });
}

/** Invisible walls at an area's two sides. */
export const sides = (width: number, height: number): Solid[] => [
  { x: 0, y: 0, width: 4, height, invisible: true },
  { x: width - 4, y: 0, width: 4, height, invisible: true },
];

/** The treetop's sound: wind in the leaves (and the tentacles' hum, faint, from anywhere up here). */
export const CANOPY_AMBIENCE: AmbienceLayer[] = [
  { sound: 'wind', volume: 0.3 },
  { sound: 'leaves', volume: 0.45 },
  { sound: 'hum', volume: 0.08 },
];

/**
 * A treehouse standing on something (designer: nothing floats): its platform at `floor`, on the bough or
 * stilts under it, running down to `down` (the deck it stands on, or the bottom of the area, where it goes on
 * out of sight). `back`: further off (darker), and drawn behind the decks.
 */
export function standingHouse(x: number, floor: number, width: number, height: number, seed: number, roof: Roof, down: number, back = true): Prop {
  const top = treehouseTop(width, height, roof);
  const house = treehouse(width, height, seed, roof, Math.max(0, down - floor - 4));
  return { sprite: back ? behind(house) : house, x, y: floor - top, behind: back };
}
