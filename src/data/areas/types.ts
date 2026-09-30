import type { TimeSlot } from '../../systems/Calendar';
import type { RowSprite } from '../../ui/sprites';

// The shape of an area: a side-on room built from data by AreaScene. Coordinates are in
// game pixels (the screen is 480×270); y grows downwards.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A solid surface. `oneWay` platforms can be jumped up through from below; `invisible` ones aren't painted (e.g. walls that are already heartwood). */
export interface Solid extends Rect {
  oneWay?: boolean;
  invisible?: boolean;
}

/** A light source painted into the backdrop (dithered). */
export interface Light {
  x: number;
  y: number;
  colour: number;
  /** Horizontal and vertical radius of the falloff, in pixels. */
  radius: number;
  radiusY?: number;
  /** Brightness added at the centre (0–1 is typical). */
  strength: number;
}

/** A static sprite baked into the backdrop, placed by its top-left corner. */
export interface Prop {
  sprite: RowSprite;
  x: number;
  y: number;
}

/** A straight line of pixels baked into the backdrop (ropes, cords, pipes, beams). */
export interface Line {
  from: { x: number; y: number };
  to: { x: number; y: number };
  colour: number;
}

/** Something with behaviour, built by AreaScene according to its `type`. */
export type Feature =
  | { type: 'fire'; x: number; y: number } // animated flames, bottom-centre at (x, y), with smoke
  | { type: 'swing'; sprite: RowSprite; x: number; y: number; ropeTop: number } // hanging from ropeTop, sways
  | { type: 'drip'; x: number; y: number; floorY: number } // a drop falls from (x, y) every so often
  | { type: 'motes'; x: number; top: number; bottom: number; halfWidth: number } // pale motes rising in a column (the tube)
  | { type: 'mover'; sprite: RowSprite; x: number; y: number; to: { x: number; y: number }; speed: number; ropeTop?: number } // a one-way platform (top-left at x, y) going to `to` and back at `speed` px/s, pausing at each end; optional ropes up to ropeTop
  | { type: 'jars'; sprite: RowSprite; x: number; y: number; variable: string; max: number; perRow: number; rowSpacing: number }; // one jar per unit of an ink variable, rows stacked upwards

/** Something the player can walk up to and press E on, which runs an ink knot. */
export interface Interactable {
  id: string;
  /** Centre of the interaction zone along the floor/platform, and the y of that surface. */
  x: number;
  y: number;
  /** Half-width of the zone. */
  reach: number;
  /** Verb shown in the prompt: "[E] Talk". */
  label: string;
  knot: string;
}

/**
 * A way out. Using it offers: go straight to the neighbouring area `to`, open the map, or stay.
 * When the player arrives from `to`, they appear at this exit.
 */
export interface Exit {
  id: string;
  /** Centre of the zone along the floor, and the y of that surface. */
  x: number;
  y: number;
  reach: number;
  /** Id of the neighbouring area (from PLANNED_AREAS; it may not be built yet). */
  to: string;
}

/** A person standing in the area, drawn at (x, y) = bottom-centre. Talking runs `knot` (no knot: background only). */
export interface Person {
  id: string;
  sprite: RowSprite;
  x: number;
  y: number;
  knot?: string;
  flipX?: boolean;
  /** Time slots when they're here (default: always). */
  when?: TimeSlot[];
  /** Idle animation frames (e.g. breathing), cycled slowly. Defaults to just `sprite`. */
  idleFrames?: RowSprite[];
  /** Walks back and forth between these x positions (with `walkFrames`), pausing now and then. Wanderers can't be talked to. */
  wander?: { from: number; to: number };
  walkFrames?: RowSprite[];
}

export interface AreaDefinition {
  id: string;
  /** Shown in door menus and on the map, e.g. "your home". */
  name: string;
  width: number;
  height: number;
  /** The hollow the room is carved into; outside it is solid heartwood. */
  cavity: Rect & { radius: number };
  /** Extra carved hollows joined onto the cavity (a crawlway seen through a window, a side passage). Painted only; add solids to walk in them. */
  nooks?: (Rect & { radius: number })[];
  /** How the solid heartwood outside the hollows looks: growth rings round a room (default), or dense packed wood for tunnels. */
  heartwood?: 'rings' | 'packed';
  /** How bright the bare wood is before lights (1 = normal). */
  ambient: number;
  playerStart: { x: number; y: number };
  solids: Solid[];
  lights: Light[];
  lines: Line[];
  props: Prop[];
  features: Feature[];
  people: Person[];
  interactables: Interactable[];
  exits: Exit[];
}
