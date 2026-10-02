import { ARCHIVIST, GUARD, RESIDENTS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { ARCHWAY } from './offeringFloorProps';
import * as P from './seedGroveProps';
import { ropeBridge } from './lowerRootsProps';
import { PLANTER } from './middleTiersProps';
import type { AreaDefinition, Person, Solid } from './types';

// The seed grove: where healthy seeds grow, out along a branch. Night 5, if you told the archivist
// the truth: he brings you here for a living seed, and keeps out of the guard's way at the bridge while
// you slip past him to the vault (behind the beds, or up on the terrace, where he never looks). Reached over a rope bridge from the upper halls. The only gardens in
// the tree, lit by the Canopy's light pouring in through an opening in the branch: raised beds,
// saplings, glass cloches, a vine-covered trellis, irrigation from scavenged pipes, and at the far
// end a locked vault of seeds. A gardener by day; a guard walks it at night, and the beds and the
// terrace give cover. See docs/areas/seed-grove.md.

const W = 640;
const FLOOR = 236;
const TERRACE = 196;
const TERRACE_X = 330;
const DAY: Person['when'] = ['morning', 'afternoon'];

/** Steps up to the terrace from the left. */
function steps(): Solid[] {
  const count = (FLOOR - TERRACE) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = TERRACE_X - 8 * (count - 1 - i);
    return { x, y: top, width: TERRACE_X - x, height: FLOOR - top, oneWay: true };
  });
}

export const seedGrove: AreaDefinition = {
  id: 'seed-grove',
  name: 'the seed grove',
  width: W,
  height: 270,
  cavity: { x: 12, y: 20, width: W - 24, height: FLOOR - 20, radius: 40 },
  ambient: 1,
  playerStart: { x: 150, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...steps(),
    { x: TERRACE_X, y: TERRACE, width: 150, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: W - 12, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    // The Canopy's light pouring in from the opening.
    { x: 300, y: 60, colour: S.white, radius: 170, radiusY: 110, strength: 0.34 },
    { x: 300, y: 200, colour: S.white, radius: 140, radiusY: 50, strength: 0.14 },
    { x: 586, y: 200, colour: S.amber, radius: 34, radiusY: 40, strength: 0.32 }, // the seed vault
    { x: 60, y: 200, colour: S.amber, radius: 30, strength: 0.2 },
  ],

  lines: [],

  props: [
    { sprite: P.canopyOpening(260), x: 170, y: 20 },
    { sprite: P.trailingVines(40, 50, 1), x: 170, y: 26 },
    { sprite: P.trailingVines(36, 40, 2), x: 396, y: 26 },
    { sprite: P.trailingVines(24, 30, 3), x: 280, y: 36 },
    { sprite: P.irrigationPipe(520), x: 60, y: 50 },
    { sprite: PLANTER, x: 120, y: 60 },
    { sprite: PLANTER, x: 520, y: 70 },
    // The way in: an arch from the upper halls, the drop and the rope bridge.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: P.drop(64), x: 50, y: FLOOR },
    { sprite: ropeBridge(72), x: 46, y: FLOOR - 12 },
    // The gardens.
    { sprite: P.seedBed(60, 1), x: 128, y: FLOOR - 14 },
    { sprite: P.sapling(60, 1), x: 196, y: FLOOR - 60 },
    { sprite: P.seedBed(48, 2), x: 222, y: FLOOR - 14 },
    { sprite: P.sapling(44, 7), x: 118, y: FLOOR - 44 },
    { sprite: P.CLOCHE, x: 278, y: FLOOR - 11 },
    { sprite: P.WATERING_CAN, x: 266, y: FLOOR - 6 },
    { sprite: P.TRELLIS, x: 352, y: TERRACE - 56 },
    { sprite: P.seedBed(40, 3), x: 400, y: TERRACE - 14 },
    { sprite: P.CLOCHE, x: 446, y: TERRACE - 11 },
    { sprite: P.seedBed(48, 4), x: 486, y: FLOOR - 14 },
    { sprite: P.sapling(54, 5), x: 538, y: FLOOR - 54 },
    // The seed vault at the far end.
    { sprite: P.SEED_VAULT, x: 564, y: FLOOR - 56 },
  ],

  features: [
    { type: 'motes', x: 300, top: 30, bottom: FLOOR - 10, halfWidth: 90 }, // dust and pollen in the light
    { type: 'drip', x: 135, y: 55, floorY: FLOOR - 10 },
    { type: 'drip', x: 225, y: 55, floorY: FLOOR - 10 },
    { type: 'drip', x: 405, y: 55, floorY: TERRACE - 10 },
    { type: 'drip', x: 495, y: 55, floorY: FLOOR - 10 },
    // Night 5, with the archivist: a set piece. You start crouched behind the first bed; the archivist
    // calls the guard over from the far end, and he walks right past you to the bridge. Then he stands
    // with his back to the grove while the archivist keeps him talking, and you creep to the vault. Now
    // and then he glances back down the grove with his lantern ("...", then a long look): be crouched
    // behind a bed or up on the terrace (he doesn't look up). Seen: back behind the first bed, and he
    // walks over again.
    {
      type: 'watch', start: 520, from: 124, to: 124, face: -1, y: FLOOR, speed: 28, range: 60, see: 24, reset: { x: 156, y: FLOOR }, showIf: 'grove_sneak',
      glance: { every: 5200, for: 2400, range: 270, tell: '...', back: { who: 'archivist-grove', text: 'No, no, here. Look at this.' } },
    },
    {
      type: 'barks', showIf: 'grove_sneak', loopFrom: 3,
      lines: [
        { who: 'archivist-grove', text: 'You there! Guard! A word, if you would.', wait: 3200 },
        { who: 'watch', text: 'Archivist? At this hour?' },
        { who: 'archivist-grove', text: "Can't sleep. I never can, in the frost." },
        { who: 'archivist-grove', text: "These saplings by the bridge. The cold's got into them. See?", wait: 3200 },
        { who: 'watch', text: 'They look all right to me, sir.' },
        { who: 'archivist-grove', text: "And that pipe's been dripping since spring. Somebody ought to write it down.", wait: 3400 },
        { who: 'watch', text: 'Yes, sir.' },
        { who: 'archivist-grove', text: "Forty years I've been coming up here. It's never been this cold.", wait: 3200 },
        { who: 'watch', text: 'No, sir.' },
      ],
    },
    { type: 'shadow', x: 128, y: FLOOR, width: 60, crouch: true, showIf: 'grove_sneak' },
    { type: 'shadow', x: 222, y: FLOOR, width: 48, crouch: true, showIf: 'grove_sneak' },
    { type: 'shadow', x: 486, y: FLOOR, width: 48, crouch: true, showIf: 'grove_sneak' },
    { type: 'hint', x: 160, y: FLOOR, reach: 50, text: 'Keep low behind the beds (hold down). When he looks round, stay out of his light.', showIf: 'grove_sneak' },
    { type: 'trigger', x: 586, y: FLOOR, reach: 14, knot: 'day5_grove_vault', showIf: 'grove_sneak' },
  ],

  people: [
    { id: 'gardener', sprite: RESIDENTS[2]!.idle[0]!, idleFrames: RESIDENTS[2]!.idle, x: 250, y: FLOOR, knot: 'grove_gardener', when: DAY },
    { id: 'night-guard', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 400, y: FLOOR, when: ['night'], wander: { from: 140, to: 550 }, walkFrames: GUARD.idle, hideIf: 'in_grove' },
    // Night 5: the archivist, keeping the guard talking at the bridge, then at the vault.
    { id: 'archivist-grove', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 98, y: FLOOR, flipX: true, knot: 'day5_grove_archivist', when: ['night'], showIf: 'in_grove' },
  ],

  interactables: [
    { id: 'cloche', x: 283, y: FLOOR, reach: 8, label: 'Look', knot: 'grove_cloche' },
    { id: 'saplings', x: 206, y: FLOOR, reach: 10, label: 'Look', knot: 'grove_saplings' },
    { id: 'seed-vault', x: 586, y: FLOOR, reach: 14, label: 'Look', knot: 'grove_seed_vault' },
  ],

  acoustics: 'high',
  ambience: [{ sound: 'wind', volume: 0.35 }, { sound: 'leaves', volume: 0.6 }, { sound: 'chime', volume: 0.5 }],
  surface: 'fungus',
  exits: [{ id: 'to-upper-halls', x: 27, y: FLOOR, reach: 12, to: 'upper-halls' }],
};
