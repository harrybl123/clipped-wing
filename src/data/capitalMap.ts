import type { MapLink, MapPlace } from './map';

// Chapter 3's map: the capital side-on, climbing to the citadel (docs/chapter-3-world.md): the citadel's
// marble towers crown the top, its rooms shown as lit windows (the sealed wing the tallest tower, dark); the
// city steps down below it, the glass lifts up its face; the low district at the bottom under its cables;
// the gate in the wall at ground level, the road going out; the tree small on the far horizon.
// Coordinates are map-screen pixels (480×270); placeholder until the designer changes them.

/** Where the plain meets the sky behind the city. */
export const CAPITAL_HORIZON_Y = 196;
/** The tree, small and far off on the horizon. */
export const CAPITAL_TREE_X = 432;
/** The citadel's middle, where the lifts come up the city's face. */
export const CITADEL_X = 240;
/** The city wall along the bottom, with the gate in it. */
export const CITY_WALL_Y = 214;

export const CAPITAL_PLACES: readonly MapPlace[] = [
  // The citadel: the private rooms up high, the halls between, the state rooms below.
  { id: 'sealed-wing', x: 228, y: 22, level: 'the citadel', light: 'cyan' },
  { id: 'fathers-study', x: 226, y: 46, level: 'the citadel', light: 'amber' },
  { id: 'prince-quarters', x: 258, y: 40, level: 'the citadel', light: 'amber' },
  { id: 'diplomats-office', x: 196, y: 54, level: 'the citadel', light: 'amber' },
  { id: 'guest-wing', x: 288, y: 52, level: 'the citadel', light: 'amber' },
  { id: 'citadel-halls', x: CITADEL_X, y: 72, level: 'the citadel', light: 'white' },
  { id: 'glasshouse', x: 172, y: 78, level: 'the citadel', light: 'green' },
  { id: 'council-chamber', x: 204, y: 98, level: 'the citadel', light: 'amber' },
  { id: 'audience-hall', x: CITADEL_X, y: 104, level: 'the citadel', light: 'white' },
  { id: 'banquet-gallery', x: 280, y: 96, level: 'the citadel', light: 'amber' },
  // The city.
  { id: 'lifts', x: CITADEL_X + 4, y: 140, level: 'the city', light: 'cyan' },
  { id: 'data-centre', x: 304, y: 156, level: 'the city', light: 'cyan' },
  { id: 'promenade', x: 184, y: 168, level: 'the city', light: 'amber' },
  { id: 'low-district', x: 250, y: 226, level: 'the city', light: 'amber' },
  { id: 'city-gate', x: 84, y: 228, level: 'the city', light: 'amber' },
];

/** Halls inside the citadel, the lifts down its face, streets in the city (drawn on the map only). */
export const CAPITAL_LINKS: readonly MapLink[] = [
  { from: 'citadel-halls', to: 'prince-quarters', kind: 'hall' },
  { from: 'citadel-halls', to: 'fathers-study', kind: 'hall' },
  { from: 'fathers-study', to: 'sealed-wing', kind: 'hall' },
  { from: 'citadel-halls', to: 'diplomats-office', kind: 'hall' },
  { from: 'citadel-halls', to: 'guest-wing', kind: 'hall' },
  { from: 'citadel-halls', to: 'glasshouse', kind: 'hall' },
  { from: 'citadel-halls', to: 'council-chamber', kind: 'hall' },
  { from: 'citadel-halls', to: 'audience-hall', kind: 'hall' },
  { from: 'citadel-halls', to: 'banquet-gallery', kind: 'hall' },
  { from: 'audience-hall', to: 'lifts', kind: 'lift' },
  { from: 'lifts', to: 'data-centre', kind: 'lift' },
  { from: 'lifts', to: 'promenade', kind: 'lift' },
  { from: 'lifts', to: 'low-district', kind: 'lift' },
  { from: 'promenade', to: 'low-district', kind: 'street' },
  { from: 'promenade', to: 'city-gate', kind: 'street' },
];
