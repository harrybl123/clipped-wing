import { SHADES as S } from '../../../ui/pixelArt';
import { CAGED_BEASTS, GUARD_BEASTS, STRANGER_WRITHING } from '../../../ui/borderlandFolk';
import * as P from './kennelsProps';
import type { AreaDefinition, Feature, Person } from '../types';
import { AWAKE } from './people';

// The kennels (Chapter 2; Jack's idea, for Harry to confirm): a fenced yard off the scrap stacks, loud
// before you can see it. Nobody has dogs (they're all but extinct), so whoever needs something guarded
// keeps rabid, diseased creatures instead (Jack): scrap hyenas, tusked hogs, nameless hairless things. A
// row of scrap cages along the way in, one in each, hurling itself at the bars; they can't reach you,
// they're noise and fear. At the far end, behind tall bars with a gate, three of them (one of each) keep a
// wooden box with a key hidden in it. Come near the bars and they come up to them; go in and they run at
// you, and if they reach you, it's game over. All of it so loud it distorts.
// See docs/areas/borderland/kennels.md.

const W = 640;
const FLOOR = 236;
/** The cages along the way in: left x, width and height. The second is a small one (the strange man lands on it). */
const CAGES = [
  { x: 96, width: 64, height: 40 },
  { x: 176, width: 52, height: 28 },
  { x: 256, width: 64, height: 40 },
  { x: 336, width: 64, height: 40 },
];
type Cage = (typeof CAGES)[number];
/** Where the strange man lands: on top of the small cage (Jack: he breaks his back on it). */
const SMALL = CAGES[1]!;
/** The pen's fence (and its gate) at the far end, up to the wire roof. */
const GATE = 470;
const ROOF = 100;

/** A creature pacing its cage. */
const caged = (n: number, look: number, cage: Cage, flipX = false): Person => ({
  id: `cage-${n}`,
  sprite: CAGED_BEASTS[look]!.idle[0]!,
  idleFrames: CAGED_BEASTS[look]!.idle,
  walkFrames: CAGED_BEASTS[look]!.walk,
  x: cage.x + cage.width / 2,
  y: FLOOR,
  flipX,
  wander: { from: cage.x + 18, to: cage.x + Math.max(19, cage.width - 18) },
});

/** One of the three guarding the box: 1 the hyena, 2 the hog, 3 the nameless thing. */
const guard = (n: number, x: number): Person => ({
  id: `guard-${n}`,
  sprite: GUARD_BEASTS[n - 1]!.idle[0]!,
  idleFrames: GUARD_BEASTS[n - 1]!.idle,
  walkFrames: GUARD_BEASTS[n - 1]!.walk,
  x,
  y: FLOOR,
  flipX: true,
});

/** A cage's bars, rattling now and then in front of what's in it. */
const cageBars = ({ x, width, height }: Cage, every: number): Feature => ({
  type: 'frames',
  frames: [P.cageFront(width, height, false), P.cageFront(width, height, true)],
  x,
  y: FLOOR - height,
  every,
  front: true,
});

export const kennels: AreaDefinition = {
  id: 'kennels',
  name: 'the kennels',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 150, treeX: 420, backdrop: 'settlement' },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'dirt',
  acoustics: 'street',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
    // The pen's fence, all the way up: the only way in is the gate.
    { x: GATE - 3, y: 0, width: 6, height: FLOOR, invisible: true },
  ],

  lights: [],
  lines: [
    // The pen's wire roof.
    { from: { x: GATE, y: ROOF }, to: { x: W, y: ROOF }, colour: S.dim },
    { from: { x: GATE, y: ROOF + 4 }, to: { x: W, y: ROOF + 4 }, colour: S.woodLight },
  ],

  props: [
    { sprite: P.DRUM, x: 40, y: FLOOR - 14 },
    ...CAGES.map(({ x, width, height }) => ({ sprite: P.cageBack(width, height), x, y: FLOOR - height })),
    { sprite: P.TINS, x: 420, y: FLOOR - 4 },
    { sprite: P.BONES, x: 520, y: FLOOR - 4 },
    { sprite: P.BONES, x: 580, y: FLOOR - 4 },
    { sprite: P.BOX, x: 608, y: FLOOR - 18 },
  ],

  features: [
    { type: 'fire', x: 46, y: FLOOR - 14 },
    ...CAGES.map((cage, i) => cageBars(cage, 300 + i * 70)),
    // The strange man (Jack): once you're past the first cage, he falls out of the sky onto the small one.
    { type: 'trigger', x: 120, y: FLOOR, reach: 16, knot: 'kennels_stranger_falls', hideIf: 'stranger_fell' },
    {
      type: 'frames',
      frames: [P.penFence(FLOOR - ROOF, false), P.penFence(FLOOR - ROOF, true)],
      x: GATE - 6,
      y: ROOF,
      every: 260,
      front: true,
    },
    // The caged ones, one after another and over each other: loud, but it's the far end that's worst.
    {
      type: 'barks',
      lines: [
        { who: 'cage-1', text: 'Ha-ha-HAAA!', wait: 700, sound: 'cackle', volume: 0.5 },
        { who: 'cage-2', text: 'SKREEE!', wait: 600, sound: 'squeal', volume: 0.5 },
        { who: 'cage-3', text: 'Hhhhkkk...', wait: 800, sound: 'wheeze', volume: 0.5 },
        { who: 'cage-5', text: 'HRAAH!', wait: 500, sound: 'snarl', volume: 0.5 },
        { who: 'cage-4', text: 'Ha-ha-ha!', wait: 650, sound: 'cackle', volume: 0.5 },
        { who: 'cage-3', text: 'KHHAAA!', wait: 600, sound: 'shriek', volume: 0.45 },
        { who: 'cage-2', text: 'GRRNK!', wait: 550, sound: 'snarl', volume: 0.5 },
      ],
    },
    // The three at the end, so loud it distorts: the hyena, the hog and the nameless thing, and their
    // sick breathing in between.
    {
      type: 'barks',
      lines: [
        { who: 'guard-1', text: 'HRAAH!', wait: 400, sound: 'snarl', volume: 1 },
        { who: 'guard-2', text: 'SKREEEE!', wait: 450, sound: 'squeal', volume: 1 },
        { who: 'guard-3', text: 'KHHHAAA!', wait: 500, sound: 'shriek', volume: 1 },
        { who: 'guard-1', text: 'Ha-ha-HAAA!', wait: 550, sound: 'cackle', volume: 1 },
        { who: 'guard-3', text: 'Hhhhkkk...', wait: 700, sound: 'wheeze', volume: 1 },
        { who: 'guard-2', text: 'GRRNK!', wait: 400, sound: 'snarl', volume: 1 },
      ],
    },
    // The music: uneasy at the way in, more and more ominous and disturbing towards the pen (Jack).
    { type: 'dread', x: GATE, range: 440 },
    { type: 'guards', beasts: ['guard-1', 'guard-2', 'guard-3'], gate: GATE, warn: 110, speed: 140, ending: 'mauled' },
  ],

  people: [
    caged(1, 0, CAGES[0]!),
    caged(2, 1, SMALL, true),
    caged(3, 2, CAGES[2]!),
    caged(4, 3, CAGES[3]!, true),
    caged(5, 1, CAGES[3]!),
    // The strange man, flat on his back in the dirt where he rolled off the small cage, writhing.
    {
      id: 'stranger',
      sprite: STRANGER_WRITHING[0]!,
      idleFrames: STRANGER_WRITHING,
      idleEvery: 170,
      x: SMALL.x + SMALL.width + 18,
      y: FLOOR,
      showIf: 'stranger_fell',
      knot: 'kennels_stranger',
      label: 'Talk',
    },
    guard(1, 516),
    guard(2, 550),
    guard(3, 584),
  ],

  interactables: [
    { id: 'cages', x: 220, y: FLOOR, reach: 60, label: 'Look', knot: 'kennels_cages' },
    { id: 'gate', x: GATE - 10, y: FLOOR, reach: 10, label: 'Open', knot: 'kennels_gate' },
  ],

  exits: [{ id: 'to-scrap-stacks', x: 16, y: FLOOR, reach: 12, to: 'scrap-stacks' }],

  ambience: [
    { sound: 'wind', volume: 0.2 },
    { sound: 'chatter', volume: 0.06, when: AWAKE }, // the settlement beyond the fence
  ],
};
