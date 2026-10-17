import type { AmbienceLayer, Prop, Solid } from '../types';
import { behind, C, treehouse, treehouseTop, type Roof } from './canopyProps';

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

/**
 * The side of a `stair` (designer: floating stairs!): a stepped beam under the treads, its planks following
 * them down, and a post from its lower end down to `postTo` (the deck below) if it hangs over nothing. Drawn
 * behind the solids, so the treads sit on it.
 */
export function stairSide(edge: number, low: number, high: number, side: 'left' | 'right', postTo?: number): Prop {
  const n = Math.round((low - high) / 8) - 1;
  const width = 8 * n;
  const x0 = side === 'left' ? edge : edge - width;
  const y0 = high + 8;
  const bottom = Math.max(postTo ?? 0, low) - y0;
  const rows: string[][] = Array.from({ length: bottom }, () => Array<string>(width).fill('.'));
  const put = (x: number, y: number, c: string) => {
    if (y >= 0 && y < bottom && x >= 0 && x < width) rows[y]![x] = c;
  };
  for (let x = 0; x < width; x++) {
    // Which step this column is under (the top step nearest the edge).
    const k = side === 'left' ? Math.floor(x / 8) + 1 : Math.floor((width - 1 - x) / 8) + 1;
    const tread = 8 * (k - 1) + 1; // just under the tread (sprite rows, from y0 + 8(k-1) ... )
    for (let y = tread; y < tread + 12; y++) put(x, y, y === tread + 11 ? 'd' : (x + y) % 9 === 0 ? 'o' : y < tread + 2 ? 'p' : 'n');
  }
  // Posts down from its lower end (and its middle) to the deck below.
  if (postTo !== undefined) {
    const lowX = side === 'left' ? width - 4 : 2;
    const midX = Math.round(width / 2);
    for (const px of [lowX, midX]) {
      const k = side === 'left' ? Math.floor(px / 8) + 1 : Math.floor((width - 1 - px) / 8) + 1;
      for (let y = 8 * (k - 1) + 12; y < bottom; y++) {
        put(px, y, 'o');
        put(px + 1, y, 'n');
      }
    }
  }
  return { sprite: { rows: rows.map((r) => r.join('')), colours: C }, x: x0, y: y0, behind: true };
}
