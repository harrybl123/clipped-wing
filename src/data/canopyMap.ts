import type { MapLink, MapPlace } from './map';

// Chapter 4's map: the treetop side-on, a cutaway like the tree's (docs/chapter-4-world.md): the crown of
// leaves filling the screen, the tentacles (the tubes) rising out of its middle, the great house round
// their foot, walkways out to the treehouses on the branches; Grounded's house at the top with the lookout
// above it and the seed bed beside it; the lowering platform out on a long branch on the right, its cable
// running down off the map to the ground; the hatches at the bottom, where the trunk begins and the way
// goes down inside the bark. Height means status (doc). Placeholder until the designer changes it.

/** Where the tentacles rise out of the crown. */
export const CANOPY_TUBE_X = 232;
/** The top of the crown's leaves (the sky above it). */
export const CROWN_TOP = 34;
/** Where the trunk comes up into the crown, at the bottom. */
export const CROWN_BOTTOM = 222;

export const CANOPY_PLACES: readonly MapPlace[] = [
  // The top: the people who run things.
  { id: 'lookout', x: 336, y: 26, level: 'the top', light: 'white' },
  { id: 'groundeds-house', x: 322, y: 62, level: 'the top', light: 'amber' },
  { id: 'seed-bed', x: 378, y: 76, level: 'the top', light: 'amber' },
  // The middle: the tentacles, the great house, the ascended, the walkways between.
  { id: 'tube-mouth', x: CANOPY_TUBE_X, y: 108, level: 'the middle', light: 'cyan' },
  { id: 'ascended-hall', x: 140, y: 112, level: 'the middle', light: 'white' },
  { id: 'walkways', x: 316, y: 128, level: 'the middle', light: 'green' },
  { id: 'great-house', x: 228, y: 156, level: 'the middle', light: 'amber' },
  // The edges and the bottom.
  { id: 'lowering-platform', x: 420, y: 168, level: 'the edges', light: 'amber' },
  { id: 'hatches', x: 232, y: 206, level: 'the edges', light: 'cyan' },
];

/** Walkways and rope bridges between the treehouses, ladders up and down (drawn on the map only). */
export const CANOPY_LINKS: readonly MapLink[] = [
  { from: 'tube-mouth', to: 'great-house', kind: 'ladder' },
  { from: 'tube-mouth', to: 'walkways', kind: 'walkway' },
  { from: 'tube-mouth', to: 'ascended-hall', kind: 'walkway' },
  { from: 'great-house', to: 'walkways', kind: 'walkway' },
  { from: 'ascended-hall', to: 'great-house', kind: 'rope' },
  { from: 'walkways', to: 'groundeds-house', kind: 'ladder' },
  { from: 'groundeds-house', to: 'lookout', kind: 'ladder' },
  { from: 'groundeds-house', to: 'seed-bed', kind: 'rope' },
  { from: 'walkways', to: 'lowering-platform', kind: 'rope' },
  { from: 'great-house', to: 'hatches', kind: 'ladder' },
];
