import type { MapLink, MapPlace } from './map';

// Chapter 2's map: a view across the borderland towards the tree (docs/chapter-2-world.md). The tree
// stands on the horizon with its roots spread along it; the settlement is a ring of scrap walls in the
// foreground with the grounds around it. Coordinates are map-screen pixels (480×270); placeholder
// until the designer changes them.

/** Where the plain meets the sky. */
export const BORDER_HORIZON_Y = 92;
/** The tree's trunk on the horizon. */
export const BORDER_TREE_X = 342;
/** The settlement's ring of scrap walls (an ellipse). */
export const SETTLEMENT = { x: 276, y: 206, rx: 104, ry: 44 } as const;
/** The rival line: a fence of junk running from the horizon down the right of the map. */
export const RIVAL_LINE = { from: { x: 404, y: BORDER_HORIZON_Y + 6 }, to: { x: 468, y: 256 } } as const;

export const BORDERLAND_PLACES: readonly MapPlace[] = [
  // The settlement: the compound on the rise at the top, your shack on the outer edge.
  { id: 'compound', x: 300, y: 172, level: 'the settlement', light: 'amber' },
  { id: 'tally-house', x: 258, y: 186, level: 'the settlement', light: 'amber' },
  { id: 'bar', x: 338, y: 196, level: 'the settlement', light: 'amber' },
  { id: 'swap-yard', x: 220, y: 208, level: 'the settlement', light: 'amber' },
  { id: 'scrap-stacks', x: 270, y: 216, level: 'the settlement', light: 'amber' },
  { id: 'gambling-den', x: 312, y: 228, level: 'the settlement', light: 'amber' },
  { id: 'brothel', x: 356, y: 234, level: 'the settlement', light: 'amber' },
  { id: 'shack', x: 198, y: 234, level: 'the settlement', light: 'amber' },
  // The grounds.
  { id: 'picked-fields', x: 214, y: 136, level: 'the grounds', light: 'white' },
  { id: 'trees-edge', x: BORDER_TREE_X, y: BORDER_HORIZON_Y + 12, level: 'the grounds', light: 'green' },
  { id: 'sunk-town', x: 112, y: 152, level: 'the grounds', light: 'cyan' },
  { id: 'deep-ground', x: 46, y: BORDER_HORIZON_Y + 10, level: 'the grounds', light: 'cyan' },
  // Your secret spot: not on the map until you've found the dog (designer).
  { id: 'dogs-hollow', x: 92, y: 226, level: 'the grounds', light: 'white', showIf: 'found_dog' },
  { id: 'rival-line', x: 428, y: 160, level: 'the grounds', light: 'amber' },
];

/** Tracks across the waste and lanes inside the settlement (drawn on the map only). */
export const BORDERLAND_LINKS: readonly MapLink[] = [
  { from: 'shack', to: 'swap-yard', kind: 'track' },
  { from: 'shack', to: 'scrap-stacks', kind: 'track' },
  { from: 'swap-yard', to: 'tally-house', kind: 'track' },
  { from: 'swap-yard', to: 'scrap-stacks', kind: 'track' },
  { from: 'tally-house', to: 'compound', kind: 'track' },
  { from: 'compound', to: 'bar', kind: 'track' },
  { from: 'bar', to: 'gambling-den', kind: 'track' },
  { from: 'bar', to: 'brothel', kind: 'track' },
  { from: 'scrap-stacks', to: 'gambling-den', kind: 'track' },
  { from: 'swap-yard', to: 'picked-fields', kind: 'track' },
  { from: 'picked-fields', to: 'trees-edge', kind: 'track' },
  { from: 'picked-fields', to: 'sunk-town', kind: 'track' },
  { from: 'picked-fields', to: 'rival-line', kind: 'track' },
  { from: 'sunk-town', to: 'deep-ground', kind: 'track' },
  { from: 'picked-fields', to: 'dogs-hollow', kind: 'track' },
];
