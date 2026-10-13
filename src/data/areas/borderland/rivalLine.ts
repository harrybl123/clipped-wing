import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './rivalLineProps';
import { cableCoil, dugHole, trackMarker } from './scrapProps';
import type { AreaDefinition, Solid } from '../types';
import { AWAKE, LATE, cast, dogFollowing, dogLeading, local, rival } from './people';

// The rival line (Chapter 2): the border with another clan's turf. Where you catch the rival scout (big
// choice 2), and where crossing over begins if you befriend them. Your side, picked bare, with a watch post
// on stilts (climb the crates to its platform) and your clan's sign on a pole facing out. Then the fence:
// junk piled and wired between posts, too high to climb, with a dip under it where people cross unseen,
// crouching. Beyond, their side: no different, but you're not allowed on it, their sign facing back at
// yours, a cairn, footprints. See docs/areas/borderland/rival-line.md.

const W = 960;
const FLOOR = 232;
const DIP = { x: 580, end: 640, floor: 244 };
const FENCE = { x: 600, top: 150, bottom: 222 };
const POST = { x: 160, y: 176 };

/** Crates up to the watch post's platform: [x, top, width]. */
const CRATES: [number, number, number][] = [[124, FLOOR - 18, 22], [138, FLOOR - 36, 18]];

export const rivalLine: AreaDefinition = {
  id: 'rival-line',
  name: 'the rival line',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 160, treeX: 220, treeScale: 0.8 },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    { x: 0, y: FLOOR, width: DIP.x, height: 270 - FLOOR },
    { x: DIP.x, y: DIP.floor, width: DIP.end - DIP.x, height: 270 - DIP.floor },
    { x: DIP.end, y: FLOOR, width: W - DIP.end, height: 270 - FLOOR },
    // The fence: a wall you can only get past crouching, through the dip under it.
    { x: FENCE.x + 2, y: FENCE.top, width: 20, height: FENCE.bottom - FENCE.top, invisible: true },
    // The watch post.
    ...CRATES.map(([x, y, width]): Solid => ({ x, y, width, height: FLOOR - y, oneWay: true, invisible: true })),
    { x: POST.x - 2, y: POST.y, width: 54, height: 4, oneWay: true, invisible: true },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [
    { x: 880, y: FLOOR, colour: S.amber, radius: 40, radiusY: 8, strength: 0.15 }, // their fires, far off
  ],

  lines: [],

  props: [
    { sprite: P.WATCH_POST, x: POST.x - 4, y: POST.y - 26 },
    ...CRATES.map(([x, y, width]) => ({ sprite: { rows: Array.from({ length: FLOOR - y }, (_, r) => Array.from({ length: width }, (_, c) => (r === 0 ? 'h' : c === 0 || c === width - 1 || r === FLOOR - y - 1 ? 'd' : 'p')).join('')), colours: { h: S.light, d: S.deep, p: S.woodPale } }, x, y })),
    { sprite: trackMarker(28), x: 40, y: FLOOR - 28 },
    { sprite: dugHole(12), x: 280, y: FLOOR - 4 },
    { sprite: cableCoil(18), x: 340, y: FLOOR - 6 },
    // The line: wire running along it, your sign, the fence, theirs.
    { sprite: P.wire(160), x: 420, y: FLOOR - 30 },
    { sprite: P.sign(false), x: 540, y: FLOOR - 50 },
    { sprite: P.fence(FLOOR - FENCE.top + 12, FENCE.bottom - FENCE.top), x: FENCE.x, y: FENCE.top },
    { sprite: P.sign(true), x: 660, y: FLOOR - 50 },
    { sprite: P.wire(160), x: 700, y: FLOOR - 30 },
    { sprite: P.FOOTPRINTS, x: 650, y: FLOOR - 2 },
    { sprite: P.CAIRN, x: 800, y: FLOOR - 6 },
    { sprite: P.HUT, x: 862, y: FLOOR - 30 }, // past the cairn, where they keep his daughter
  ],

  features: [
    // Chapter 2, Day 11 (save the girl): the scout at the dip; the hut past the cairn.
    { type: 'trigger', x: 545, y: FLOOR, reach: 30, knot: 'c2day11_girl_dip', showIf: 'girl11', hideIf: 'girl_dip11' },
    { type: 'trigger', x: 830, y: FLOOR, reach: 30, knot: 'c2day11_girl_hut', showIf: 'girl_dip11', hideIf: 'girl_hut11' },
    { type: 'lead', person: 'dog-lead', route: 'scent', near: 70 },
    // Chapter 2, Day 9: at dusk, your friend at the dip; at night, the watch.
    { type: 'trigger', x: 50, y: FLOOR, reach: 40, knot: 'c2day9_line_arrive', showIf: 'line_open', hideIf: 'line9_arrived' },
    { type: 'trigger', x: 520, y: FLOOR, reach: 30, knot: 'c2day9_friend', showIf: 'friend_at_line', hideIf: 'friend_seen9' },
    // Day 10 (if you let the scout go): the line at nightfall; up to the wire once he's gone under it.
    { type: 'trigger', x: 50, y: FLOOR, reach: 40, knot: 'c2day10_line_arrive', showIf: 'cairn10', hideIf: 'line10_seen' },
    { type: 'trigger', x: 540, y: FLOOR, reach: 24, knot: 'c2day10_cairn', showIf: 'boss_crossed10', hideIf: 'cairn10_seen' },
    // Day 10: tailing him from your post to the dip (designer: he should notice if you get close). He stops and
    // looks back; get down in the dark (the dug hole, the coil, the wire's foot, behind your sign) or he sees you.
    {
      type: 'quarry', people: ['boss-line10'], y: FLOOR,
      path: [{ x: 16 }, { x: 230, wait: 2200, look: true }, { x: 330, wait: 2400, look: true }, { x: 460, wait: 2600, look: true }, { x: 574, wait: 2200, look: true }, { x: 592 }],
      speed: 24, range: 120, lose: 260, reset: { x: POST.x + 24, y: POST.y }, showIf: 'tail10', done: 'boss_crossed10',
    },
    { type: 'shadow', x: 270, y: FLOOR, width: 26, crouch: true },
    { type: 'shadow', x: 334, y: FLOOR, width: 24, crouch: true },
    { type: 'shadow', x: 408, y: FLOOR, width: 24, crouch: true },
    { type: 'shadow', x: 528, y: FLOOR, width: 28, crouch: true },
  ],
  people: [
    // Day 11 (save the girl): the scout at the dip, then beside you; the hut's guards; his daughter; her father at the fence.
    rival('scout-girl11', 1, 572, FLOOR, ['evening', 'night'], { showIf: 'girl11', hideIf: 'girl_dip11' }),
    rival('scout-follow11', 1, 560, FLOOR, ['evening', 'night'], { showIf: 'girl_dip11', hideIf: 'edge_ready11', follow: true }),
    rival('hut-guard-1', 0, 862, FLOOR, ['evening', 'night'], { showIf: 'girl_dip11', hideIf: 'daughter11', flipX: true }),
    rival('hut-guard-2', 1, 900, FLOOR, ['evening', 'night'], { showIf: 'girl_dip11', hideIf: 'daughter11', flipX: true }),
    rival('daughter11', 2, 884, FLOOR, ['evening', 'night'], { showIf: 'daughter11', flipX: true }),
    cast('boss', 566, FLOOR, { id: 'boss-girl11', when: ['evening', 'night'], showIf: 'father11' }),
    local('circle-girl-1', 7, 520, FLOOR, ['evening', 'night'], { showIf: 'father11' }),
    local('circle-girl-2', 10, 540, FLOOR, ['evening', 'night'], { showIf: 'father11' }),
    // Our side's watch, by the post (not on Day 9: you're the watch).
    local('our-watch', 7, 236, FLOOR, AWAKE, { hideIf: 'line_open' }),
    // Day 9, dusk: your friend at the dip, and the one from their side, through the gap; the watcher, come to set the watch.
    cast('scav_friend', 568, FLOOR, { id: 'friend-line', when: ['evening'], showIf: 'friend_at_line' }),
    rival('friend-rival', 1, 652, FLOOR, ['evening'], { showIf: 'friend_at_line' }),
    cast('watcher', 30, FLOOR, { id: 'watcher-line', when: ['evening'], showIf: 'watcher_at_line' }),
    // Day 9, night: two of them and the scout, through the dip on your watch.
    rival('line-raider-1', 0, 660, FLOOR, ['night'], { showIf: 'line_raid' }),
    rival('line-raider-2', 1, 680, FLOOR, ['night'], { showIf: 'line_raid' }),
    rival('scout-line', 1, 700, FLOOR, ['night'], { showIf: 'line_raid', hideIf: 'scout_gone9' }),
    // If you let the scout go, you walk them back out to the dip.
    rival('scout-free', 1, 572, FLOOR, ['night'], { showIf: 'letgo9' }),
    dogFollowing(30, FLOOR),
    // Day 10: the boss along the track and under the fence; the scout at the cairn.
    // (Along the track under your post, and on to the dip, tailed; then at the cairn.)
    cast('boss', 16, FLOOR, { id: 'boss-line10', when: ['night'], showIf: 'tail10' }),
    cast('boss', 780, FLOOR, { id: 'boss-cairn10', when: ['night'], showIf: 'cairn_meet10', flipX: true }),
    rival('scout-cairn10', 1, 760, FLOOR, ['night'], { showIf: 'cairn_meet10', flipX: true }),
    dogLeading(200, FLOOR), // Day 9: on the scout's scent
    // Theirs, by their fire across the line.
    rival('their-watch', 0, 712, FLOOR, AWAKE),
    rival('their-fire-1', 1, 776, FLOOR, LATE),
    rival('their-fire-2', 0, 840, FLOOR, LATE),
  ],

  interactables: [
    { id: 'hut', x: 880, y: FLOOR, reach: 14, label: 'Look', knot: 'rival_line_hut', showIf: 'girl_dip11' },
    { id: 'post', x: POST.x + 24, y: POST.y, reach: 26, label: 'Watch', knot: 'rival_line_post' },
    { id: 'our-sign', x: 548, y: FLOOR, reach: 10, label: 'Look', knot: 'rival_line_our_sign' },
    { id: 'gap', x: 590, y: DIP.floor, reach: 10, label: 'Look', knot: 'rival_line_gap' },
    { id: 'their-sign', x: 668, y: FLOOR, reach: 10, label: 'Look', knot: 'rival_line_their_sign' },
    { id: 'cairn', x: 805, y: FLOOR, reach: 12, label: 'Look', knot: 'rival_line_cairn' },
  ],

  routes: {
    // Day 9: the dog on the scout's scent, from under the post back along the track.
    scent: [{ x: 200, y: FLOOR }, { x: 150, y: FLOOR }, { x: 96, y: FLOOR }, { x: 44, y: FLOOR }, { x: 18, y: FLOOR }],
    // Day 10: the boss, along the track, down into the dip, under the fence and up to the cairn; and back.
    'boss-out': [{ x: 650, y: FLOOR }, { x: 622, y: DIP.floor }, { x: 600, y: DIP.floor }, { x: 578, y: FLOOR }, { x: 0, y: FLOOR }],
  },

  exits: [{ id: 'to-picked-fields', x: 16, y: FLOOR, reach: 12, to: 'picked-fields' }],

  ambience: [{ sound: 'wind', volume: 0.5 }],
};
