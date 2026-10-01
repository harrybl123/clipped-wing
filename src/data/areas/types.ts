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
  | { type: 'hint'; x: number; y: number; reach: number; text: string; showIf?: string } // a tutorial hint shown at the top of the screen while the player is here (and the ink variable showIf is true)
  | { type: 'jars'; sprite: RowSprite; x: number; y: number; variable: string; max: number; perRow: number; rowSpacing: number } // one jar per unit of an ink variable, rows stacked upwards
  | { type: 'rubble'; x: number; top: number; floorY: number; every: number; reset: { x: number; y: number } } // a lump of wood drops from (x, top) to floorY every `every` ms, after a trickle of dust; if it hits you, you're knocked back to `reset`
  | { type: 'crumble'; x: number; y: number; width: number } // a rotten board (one-way, top-left at x, y) that gives way a moment after you stand on it, then grows back
  | { type: 'collapse'; from: number; to: number; y: number; top: number; reset: { x: number; y: number }; showIf?: string } // a stretch of tunnel (floor y, ceiling top) that starts coming down round you as you run through it: lumps fall just ahead and behind (dust first); a hit knocks you back to `reset`. Only while the ink variable showIf is true
  | { type: 'rot'; x: number; y: number; width: number; height: number; reset: { x: number; y: number } } // a pool of glowing rot (e.g. at the bottom of a pit); touching it knocks you back to `reset`
  | { type: 'drips'; xs: number[]; top: number; bottom: number; count: number; every: number; reset: { x: number; y: number } } // rot dripping in a rhythm down a shaft: a drop gathers at the top of each column, then falls; `count` drops in a burst every `every` ms; a hit knocks you back
  | { type: 'beetle'; from: number; to: number; y: number; speed: number; reset: { x: number; y: number } } // a big beetle pacing between from and to on floor y, rushing when you're close and on its level; touching it knocks you back. Jump it or slip past
  | { type: 'watch'; from: number; to: number; y: number; speed: number; range: number; pause?: number; reset: { x: number; y: number }; showIf?: string } // a watchman with a lantern on floor y, pacing from..to (pausing `pause` ms at each end) or, if from === to, standing and turning round every `pause` ms. He sees you if you're in his lantern's light (up to `range` px ahead, and not too far above or below) and not in a shadow: you're sent back to `reset`. Only while showIf is true
  | { type: 'shadow'; x: number; y: number; width: number; showIf?: string } // a dark doorway or nook on floor y, x..x+width: standing in it, the watch (or a quarry) can't see you
  | { type: 'quarry'; people: string[]; y: number; path: { x: number; wait?: number; look?: boolean }[]; speed: number; range: number; lose: number; reset: { x: number; y: number }; showIf: string; done: string }; // people you tail (the first leads, the rest keep their distance from him): they walk the path on floor y, stopping `wait` ms at each point, and at `look` points turn round. If they see you (in front of them, too close, or behind within `range` while they look, not in a shadow), or you fall more than `lose` px behind, you're back at `reset` and they start again. At the end they slip away and the ink variable `done` becomes true. Only while showIf is true

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
  /** A hidden way (a back window): it works even when the area it leads to is closed today. */
  secret?: boolean;
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
  /** Only here while this ink variable is true / false (the story decides, e.g. someone who's moved on). */
  showIf?: string;
  hideIf?: string | string[];
  /** Hidden until a scripted `#show:<id>` tag brings them on (e.g. the master at the Ascension). */
  hidden?: boolean;
  /** Slips away (fades out) when the player comes within this many px, e.g. someone watching from the edges. */
  shy?: number;
  /** Follows the player around (e.g. the girl showing you the back routes). */
  follow?: boolean;
  /** Verb shown in the prompt instead of "Talk" (e.g. "Hide" for an object made a person so the story can show and hide it). */
  label?: string;
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
