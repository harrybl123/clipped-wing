import type { AreaDefinition } from './areas/types';

/**
 * The next area to go through on the way from `from` to `to`, following doors (exits) and only
 * through areas `canEnter` allows, or null if there's no way (or you're already there).
 * Breadth-first, so it's the fewest doors.
 */
export function nextHop(from: string, to: string, areas: Record<string, AreaDefinition>, canEnter: (areaId: string) => boolean = () => true): string | null {
  if (from === to) return null;
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length > 0) {
    const here = queue.shift()!;
    for (const exit of areas[here]?.exits ?? []) {
      if (previous.has(exit.to) || !(exit.to in areas) || (exit.to !== to && !canEnter(exit.to))) continue;
      previous.set(exit.to, here);
      if (exit.to === to) {
        let step = to;
        while (previous.get(step) !== from) step = previous.get(step)!;
        return step;
      }
      queue.push(exit.to);
    }
  }
  return null;
}
