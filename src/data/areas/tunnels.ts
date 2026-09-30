import type { Rect, Solid } from './types';

// Helpers for areas made of tunnels (the back routes): the carved spaces are listed as rectangles,
// and everything else is solid heartwood the player can't walk through.

/**
 * Invisible solids filling everything in the area that isn't inside one of `carved`, on a grid of
 * `cell` px (carved rectangles should line up with it). Runs of solid cells are merged along rows,
 * then identical runs are merged down columns, so there are few bodies.
 */
export function heartwoodSolids(carved: readonly Rect[], width: number, height: number, cell = 8): Solid[] {
  const cols = Math.ceil(width / cell);
  const rowCount = Math.ceil(height / cell);
  const isCarved = (cx: number, cy: number) => {
    const x = cx * cell + cell / 2;
    const y = cy * cell + cell / 2;
    return carved.some((r) => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height);
  };
  // Runs of solid cells in each row, as [start, end) in cells.
  const runs: [number, number][][] = [];
  for (let cy = 0; cy < rowCount; cy++) {
    const row: [number, number][] = [];
    let start = -1;
    for (let cx = 0; cx <= cols; cx++) {
      const solid = cx < cols && !isCarved(cx, cy);
      if (solid && start < 0) start = cx;
      if (!solid && start >= 0) {
        row.push([start, cx]);
        start = -1;
      }
    }
    runs.push(row);
  }
  // Merge identical runs in consecutive rows into taller blocks.
  const out: Solid[] = [];
  const open = new Map<string, Solid>();
  runs.forEach((row, cy) => {
    const next = new Map<string, Solid>();
    for (const [a, b] of row) {
      const key = `${a}:${b}`;
      let block = open.get(key);
      if (block) {
        block.height += cell;
      } else {
        block = { x: a * cell, y: cy * cell, width: (b - a) * cell, height: cell, invisible: true };
        out.push(block);
      }
      next.set(key, block);
    }
    open.clear();
    next.forEach((v, k) => open.set(k, v));
  });
  return out;
}
