import { SHADES as S } from '../../../ui/pixelArt';
import { heartwoodSolids } from '../tunnels';
import * as P from './sunkTownProps';
import type { AreaDefinition, Rect, Solid } from '../types';
import { dog, dogFollowing, straggler } from './people';

// The sunk town (Chapter 2): half-buried ruins of the old society, rich but unstable. On the surface,
// domes and a tipped tower top poking out of the dirt, and the mouth of a deep stairwell with a
// scavenger's rope tied off beside it. Below, three levels, darker and stranger the deeper you go:
// 1. through a broken window, the screen room, then (past the door that still opens by itself, sticks
//    halfway and judders) the long room, which opens onto the stairwell;
// 2. the hall of boxes (walls of identical sealed boxes, some prised open), a room filled with earth
//    with a crawl dug through it, and someone's old camp;
// 3. a round tunnel with a carriage lying in it, and at its end the bright room, where a glass column
//    is still full of cyan light.
// More to find the deeper you go. Nothing is explained. See docs/areas/borderland/sunk-town.md.

const W = 1080;
const H = 880;
const SURFACE = 168;

// Everything carved out of the ground, on an 8 px grid (heartwoodSolids fills the rest with earth).
const SHAFT = { x: 304, y: 0, width: 32, height: 248 }; // through the broken window
const WELL = { x: 864, y: 0, width: 72, height: 832 }; // the deep stairwell
const SCREEN_ROOM = { x: 240, y: 248, width: 280, height: 80 };
const LONG_ROOM = { x: 520, y: 288, width: WELL.x - 520, height: 80 };
const HALL = { x: 520, y: 448, width: WELL.x - 520, height: 80 };
const FILLED = { x: 384, y: 512, width: 136, height: 16 }; // the crawl dug through the filled room
const CAMP = { x: 248, y: 456, width: 136, height: 72 };
const TUNNEL = { x: 264, y: 752, width: WELL.x - 264, height: 80 };
const BRIGHT = { x: 88, y: 672, width: 176, height: 160 };

const CARVED: Rect[] = [
  { x: 0, y: 0, width: W, height: SURFACE },
  SHAFT, WELL, SCREEN_ROOM, LONG_ROOM, HALL, FILLED, CAMP, TUNNEL, BRIGHT,
];

const floor = (r: Rect) => r.y + r.height;

/** Fallen slabs to climb on: [x, y, width]. Up the broken window's shaft, then both sides of the stairwell, every 40 px down. */
const LEDGES: [number, number, number][] = [
  [SHAFT.x, 288, 32], [SHAFT.x, 248, 32], [SHAFT.x, 208, 32],
  ...Array.from({ length: 16 }, (_, k): [number, number, number] => [k % 2 === 0 ? WELL.x : WELL.x + 40, 208 + k * 40, 32]),
];

export const sunkTown: AreaDefinition = {
  id: 'sunk-town',
  name: 'the sunk town',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 150, treeX: 420, treeScale: 0.85, groundY: SURFACE },
  ambient: 1,
  playerStart: { x: 30, y: SURFACE },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    // The earth: everything that isn't carved, painted as dirt.
    ...heartwoodSolids(CARVED, W, H).map((s): Solid => ({ ...s, invisible: false })),
    { x: -8, y: 0, width: 8, height: H, invisible: true },
    { x: W, y: 0, width: 8, height: H, invisible: true },
    ...LEDGES.map(([x, y, width]): Solid => ({ x, y, width, height: 4, oneWay: true, invisible: true })),
  ],

  lights: [
    // Glow leaking into the earth round the rooms (props aren't lit, the dirt is).
    { x: 330, y: 300, colour: S.cyan, radius: 70, radiusY: 30, strength: 0.12 }, // the screens
    { x: 740, y: 300, colour: S.cyan, radius: 40, radiusY: 16, strength: 0.08 }, // the strip light's one cell
    { x: 180, y: 760, colour: S.cyan, radius: 150, radiusY: 110, strength: 0.45 }, // the bright room
  ],

  lines: [],

  props: [
    // The surface: domes, the tower top, the stairs into the dirt, the stairwell's mouth.
    { sprite: P.dome(70, 30, 1), x: 90, y: SURFACE - 30 },
    { sprite: P.TOWER_TOP, x: 200, y: SURFACE - 44 },
    { sprite: P.brokenFrame(SHAFT.width), x: SHAFT.x - 4, y: SURFACE - 4 },
    { sprite: P.dome(110, 44, 2), x: 380, y: SURFACE - 44 },
    { sprite: P.STAIRS_DOWN, x: 540, y: SURFACE - 20 },
    { sprite: P.dome(56, 22, 3), x: 650, y: SURFACE - 22 },
    { sprite: P.wellMouth(WELL.width), x: WELL.x - 12, y: SURFACE - 12 },
    { sprite: P.dome(64, 28, 4), x: 980, y: SURFACE - 28 },

    // The ways down.
    { sprite: P.earth(SHAFT.width, SCREEN_ROOM.y - SURFACE), x: SHAFT.x, y: SURFACE },
    { sprite: P.stairwell(WELL.width, floor(WELL) - SURFACE, 470), x: WELL.x, y: SURFACE },

    // Level 1: the screen room, the long room.
    { sprite: P.screenRoom(SCREEN_ROOM.width, SCREEN_ROOM.height), x: SCREEN_ROOM.x, y: SCREEN_ROOM.y },
    { sprite: P.seats(4), x: 408, y: floor(SCREEN_ROOM) - 16 },
    { sprite: P.HANGING_PANEL, x: 470, y: SCREEN_ROOM.y },
    { sprite: P.longRoom(LONG_ROOM.width, LONG_ROOM.height), x: LONG_ROOM.x, y: LONG_ROOM.y },

    // Level 2: the hall of boxes, the filled room's crawl, the camp.
    { sprite: P.boxHall(HALL.width, HALL.height), x: HALL.x, y: HALL.y },
    { sprite: P.FALLEN_BOX, x: 770, y: floor(HALL) - 10 },
    { sprite: P.FALLEN_BOX, x: 560, y: floor(HALL) - 10 },
    { sprite: P.filledRoom(FILLED.width, 64, 48), x: FILLED.x, y: FILLED.y - 48 },
    { sprite: P.camp(CAMP.width, CAMP.height), x: CAMP.x, y: CAMP.y },
    { sprite: P.BEDROLL, x: 262, y: floor(CAMP) - 6 },
    { sprite: P.DEAD_LAMP, x: 300, y: floor(CAMP) - 6 },
    { sprite: P.SHOVEL, x: 368, y: floor(CAMP) - 20 },

    // Level 3: the tunnel, the bright room.
    { sprite: P.tunnel(TUNNEL.width, TUNNEL.height), x: TUNNEL.x, y: TUNNEL.y },
    { sprite: P.rail(TUNNEL.width), x: TUNNEL.x, y: floor(TUNNEL) - 4 },
    { sprite: P.CARRIAGE, x: 680, y: floor(TUNNEL) - 36 },
    { sprite: P.brightRoom(BRIGHT.width, BRIGHT.height), x: BRIGHT.x, y: BRIGHT.y },

    ...LEDGES.map(([x, y, width]) => ({ sprite: P.slab(width), x, y })),
  ],

  features: [
    { type: 'autodoor', sprite: P.AUTODOOR, x: SCREEN_ROOM.x + SCREEN_ROOM.width - 5, y: LONG_ROOM.y, range: 50 },
    // The column's light, rising (and humming).
    { type: 'motes', x: BRIGHT.x + BRIGHT.width / 2, top: BRIGHT.y, bottom: floor(BRIGHT) - 8, halfWidth: 6 },
    // Chapter 2, Day 2: sent deep, you hear a dog bark from below as you arrive; then, coming out of the
    // crawl, the stragglers' camp.
    { type: 'trigger', x: 60, y: SURFACE, reach: 50, knot: 'c2day2_bark', showIf: 'going_deep', hideIf: 'heard_bark' },
    // (Clear of the crawl's low ceiling, so you stand up to face them: designer.)
    { type: 'trigger', x: CAMP.x + CAMP.width - 20, y: floor(CAMP), reach: 4, knot: 'c2day2_camp', showIf: 'heard_bark', hideIf: 'camp_found' },
    { type: 'trigger', x: 60, y: SURFACE, reach: 50, knot: 'c2day3_arrive', showIf: 'seeking', hideIf: 'seek_arrived' },
    { type: 'trigger', x: 90, y: SURFACE, reach: 70, knot: 'c2day3_send_home', showIf: 'haul_done', hideIf: 'sent_home' },
    // Chapter 2, Day 3 (weeks later): working the sunk town with the dog. It finds what nobody else could.
    {
      type: 'seek', dog: 'dog-follow', range: 150, showIf: 'seeking',
      finds: [
        { x: 600, y: floor(LONG_ROOM), knot: 'c2day3_find_1', done: 'sought_1', item: 'lens' },
        { x: 790, y: floor(HALL), knot: 'c2day3_find_2', done: 'sought_2', item: 'box' },
        { x: 420, y: floor(TUNNEL), knot: 'c2day3_find_3', done: 'sought_3', item: 'cable' },
      ],
    },
    // Their fire, and its smoke going up a crack in the ceiling.
    { type: 'fire', x: 318, y: floor(CAMP), showIf: 'camp_fire' },
    { type: 'smoke', x: 318, y: floor(CAMP) - 12, top: CAMP.y, showIf: 'camp_fire' },
  ],
  people: [
    // The stragglers round their fire, facing the dog they've tied up in the corner.
    // (Round the fire: the thin one this side of it, the big one and the small one beyond.)
    straggler('camp-thin', 0, 294, floor(CAMP), 'stragglers_camp', { flipX: true }),
    straggler('camp-big', 1, 334, floor(CAMP), 'stragglers_camp', { flipX: true }),
    straggler('camp-small', 2, 348, floor(CAMP), 'stragglers_camp', { flipX: true }),
    dog(266, floor(CAMP), { id: 'dog-tied', showIf: 'dog_tied' }),
    dogFollowing(40, SURFACE),
  ],

  interactables: [
    // The surface.
    { id: 'dome', x: 435, y: SURFACE, reach: 30, label: 'Look', knot: 'sunk_town_dome' },
    { id: 'stairs', x: 560, y: SURFACE, reach: 14, label: 'Look', knot: 'sunk_town_stairs' },
    { id: 'rope', x: WELL.x - 12, y: SURFACE, reach: 12, label: 'Look', knot: 'sunk_town_rope' },
    // Level 1.
    { id: 'screen', x: 376, y: floor(SCREEN_ROOM), reach: 20, label: 'Look', knot: 'sunk_town_screen' },
    { id: 'seats', x: 440, y: floor(SCREEN_ROOM), reach: 16, label: 'Search', knot: 'sunk_town_search_seats' },
    { id: 'door', x: SCREEN_ROOM.x + SCREEN_ROOM.width - 12, y: floor(SCREEN_ROOM), reach: 10, label: 'Look', knot: 'sunk_town_door' },
    { id: 'shelves', x: 640, y: floor(LONG_ROOM), reach: 24, label: 'Search', knot: 'sunk_town_search' },
    { id: 'tallies', x: 820, y: floor(LONG_ROOM), reach: 16, label: 'Look', knot: 'sunk_town_tallies' },
    // Level 2.
    { id: 'boxes', x: 800, y: floor(HALL), reach: 24, label: 'Search', knot: 'sunk_town_search_boxes' },
    { id: 'crawl', x: FILLED.x + FILLED.width + 10, y: floor(HALL), reach: 10, label: 'Look', knot: 'sunk_town_crawl' },
    { id: 'chalk', x: 340, y: floor(CAMP), reach: 18, label: 'Look', knot: 'sunk_town_chalk' },
    { id: 'camp', x: 280, y: floor(CAMP), reach: 18, label: 'Search', knot: 'sunk_town_search_camp' },
    // Level 3.
    { id: 'carriage', x: 744, y: floor(TUNNEL), reach: 24, label: 'Search', knot: 'sunk_town_search_carriage' },
    { id: 'column-look', x: BRIGHT.x + BRIGHT.width / 2 + 40, y: floor(BRIGHT), reach: 16, label: 'Look', knot: 'sunk_town_column' },
    { id: 'column', x: BRIGHT.x + BRIGHT.width / 2, y: floor(BRIGHT), reach: 14, label: 'Search', knot: 'sunk_town_search_column' },
  ],

  exits: [
    { id: 'to-picked-fields', x: 16, y: SURFACE, reach: 12, to: 'picked-fields' },
    { id: 'to-deep-ground', x: W - 16, y: SURFACE, reach: 12, to: 'deep-ground' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.4 },
    { sound: 'hum', volume: 0.08 }, // something, somewhere, still powered
    { sound: 'drips', volume: 0.2 },
    { sound: 'creaks', volume: 0.25 }, // the ground settling over the rooms
  ],
};
