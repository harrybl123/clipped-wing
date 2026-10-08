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
  | { type: 'fire'; x: number; y: number; showIf?: string } // animated flames, bottom-centre at (x, y), with sparks (only while the ink variable showIf is true, if given)
  | { type: 'smoke'; x: number; y: number; top: number; showIf?: string } // grey smoke rising from (x, y) up to `top` (a crack in a ceiling), while showIf is true
  | { type: 'swing'; sprite: RowSprite; x: number; y: number; ropeTop: number } // hanging from ropeTop, sways
  | { type: 'drip'; x: number; y: number; floorY: number } // a drop falls from (x, y) every so often
  | { type: 'motes'; x: number; top: number; bottom: number; halfWidth: number } // pale motes rising in a column (the tube)
  | { type: 'mover'; sprite: RowSprite; x: number; y: number; to: { x: number; y: number }; speed: number; ropeTop?: number } // a one-way platform (top-left at x, y) going to `to` and back at `speed` px/s, pausing at each end; optional ropes up to ropeTop
  | { type: 'hint'; x: number; y: number; reach: number; text: string; showIf?: string } // a tutorial hint shown at the top of the screen while the player is here (and the ink variable showIf is true)
  | { type: 'jars'; sprite: RowSprite; x: number; y: number; variable: string; max: number; perRow: number; rowSpacing: number } // one jar per unit of an ink variable, rows stacked upwards
  | { type: 'rubble'; x: number; top: number; floorY: number; every: number; reset: { x: number; y: number } } // a lump of wood drops from (x, top) to floorY every `every` ms, after a trickle of dust; if it hits you, you're knocked back to `reset`
  | { type: 'crumble'; x: number; y: number; width: number; steadyIf?: string } // a rotten board (one-way, top-left at x, y) that gives way a moment after you stand on it, then grows back; it holds while the ink variable steadyIf is true
  | { type: 'collapse'; from: number; to: number; y: number; top: number; reset: { x: number; y: number }; showIf?: string } // a stretch of tunnel (floor y, ceiling top) that starts coming down round you as you run through it: lumps fall just ahead and behind (dust first); a hit knocks you back to `reset`. Only while the ink variable showIf is true
  | { type: 'rot'; x: number; y: number; width: number; height: number; reset: { x: number; y: number } } // a pool of glowing rot (e.g. at the bottom of a pit); touching it knocks you back to `reset`
  | { type: 'drips'; xs: number[]; top: number; bottom: number; count: number; every: number; reset: { x: number; y: number } } // rot dripping in a rhythm down a shaft: a drop gathers at the top of each column, then falls; `count` drops in a burst every `every` ms; a hit knocks you back
  | { type: 'beetle'; from: number; to: number; y: number; speed: number; reset: { x: number; y: number } } // a big beetle pacing between from and to on floor y, rushing when you're close and on its level; touching it knocks you back. Jump it or slip past
  | {
      type: 'watch'; from: number; to: number; y: number; speed: number; range: number; pause?: number; see?: number; reset: { x: number; y: number }; showIf?: string;
      /** Starts here and walks to his post (`from`) first; caught, you're both back where you started. */
      start?: number;
      /** A standing watch's usual way of facing (1 right, -1 left). With `glance`, he faces it and only glances back. */
      face?: 1 | -1;
      /** A standing watch who glances back over his shoulder now and then: `tell` over his head first, then he looks the other way for `for` ms (with a longer reach, `range`), and someone may call him back round (`back`). */
      glance?: { every: number; for: number; range?: number; tell?: string; back?: { who: string; text: string } };
    } // a watchman with a lantern on floor y, pacing from..to (pausing `pause` ms at each end) or, if from === to, standing and turning round every `pause` ms. He sees you if you're in his lantern's light (up to `range` px ahead, and no more than `see` px above him, default 60) and not in a shadow: you're sent back to `reset`. Only while showIf is true
  | { type: 'shadow'; x: number; y: number; width: number; crouch?: boolean; showIf?: string } // a dark doorway or nook on floor y, x..x+width: standing in it (or with `crouch`, crouching in it: low cover like a seed bed), the watch (or a quarry) can't see you
  | { type: 'mob'; delay: number; speed: number; showIf: string } // a crowd with torches that follows the exact path you took through the area (stairs, ledges, lifts alike), setting off `delay` ms after you arrive and walking at `speed` px/s. Stop too long and they catch you: you're thrown back to where you came in, and they start again. Only while showIf is true
  | { type: 'barks'; lines: { who: string; text: string; wait?: number }[]; loopFrom?: number; showIf?: string } // lines spoken over people's heads while you keep playing (`who`: a person id, or `watch` for the area's watchman), one after another, each for `wait` ms (default 2600); then round again from `loopFrom`. Only while showIf is true (or `<variable>=<value>`: while it has that value, e.g. `day4=evening`)
  | { type: 'autodoor'; sprite: RowSprite; x: number; y: number; range: number } // a door of the old society (top-left at x, y) that still slides up by itself when you come within `range` px, then stops halfway and judders there (the sunk town). Just to look at: it doesn't block you
  | {
      type: 'dig'; y: number; from: number; to: number; showIf: string;
      finds: { x: number; reach: number; knot: string; done: string; item: FindItem }[];
    } // ground you search by digging anywhere along floor y, from..to, while showIf is true (designer: search it yourself, nothing signposted). Most of it gives nothing; at a find (within `reach` of x, until the ink variable `done`) the thing comes up out of the dirt where you can see it, then its knot plays. A faint glint in the dirt now and then gives each find away, and digging close by turns up a hint
  | {
      type: 'seek'; dog: string; range: number; showIf: string;
      finds: { x: number; y: number; knot: string; done: string; item: FindItem }[];
    } // the dog finds things (Chapter 2): while showIf is true and the dog (person id, following you) is with you, when you come within `range` of a find on the floor you're both on, it runs to it, sniffs and digs there; dig beside it (E) and the thing comes up (as with `dig`), its knot plays, and the dog follows you again
  | { type: 'slide'; x: number; width: number; top: number; bottom: number } // a long drop you slide down rather than fall (designer: the sunk town's gap was a huge drop): falling through x..x+width between top and bottom, you're slowed, crouched against the earth, dust flying
  | { type: 'trigger'; x: number; y: number; reach: number; knot: string; showIf?: string; hideIf?: string } // plays a knot by itself once when you reach this spot on surface y (while showIf is true and hideIf isn't; the knot should set hideIf so it doesn't play again on the next visit)
  | { type: 'quarry'; people: string[]; y: number; path: { x: number; wait?: number; look?: boolean }[]; speed: number; range: number; lose: number; reset: { x: number; y: number }; showIf: string; done: string }; // people you tail (the first leads, the rest keep their distance from him): they walk the path on floor y, stopping `wait` ms at each point, and at `look` points turn round. If they see you (in front of them, too close, or behind within `range` while they look, not in a shadow), or you fall more than `lose` px behind, you're back at `reset` and they start again. At the end they slip away and the ink variable `done` becomes true. Only while showIf is true

/**
 * A sound the whole area makes, under everything else (docs/audio-plan.md). Continuous: `room` (the tree's
 * body, a low hush), `hum` (the tube), `buzz` (the tube up close: loud), `wind`, `leaves`.
 * Made of moments: `chatter` (people talking nearby), `crowd` (a murmuring crowd), `footfall` (other
 * people walking about, on the area's floor), `pages` (paper), `fizz` (the fungi: tiny soft pops), `creaks` (the tree settling), `drips`, `bubbles` (the
 * rot), `clock`, `workshop` (tapping), `engine` (the archive's clicking), `chime` (the seeds), `hearth`
 * (a fire's crackle, heard from anywhere in the room).
 */
export type AmbienceSound = 'room' | 'hum' | 'buzz' | 'wind' | 'fizz' | 'leaves' | 'chatter' | 'crowd' | 'footfall' | 'creaks' | 'drips' | 'bubbles' | 'clock' | 'workshop' | 'engine' | 'pages' | 'chime' | 'hearth';

export interface AmbienceLayer {
  sound: AmbienceSound;
  /** 0–1, default 0.5. */
  volume?: number;
  /** Only at these times of day. */
  when?: TimeSlot[];
  /** Only while this ink variable is true. */
  showIf?: string;
  /** Not while this ink variable (or any of these) is true. */
  hideIf?: string | string[];
}

/** What the floor's made of, for footsteps. */
export type Surface = 'wood' | 'plank' | 'metal' | 'fungus' | 'wet' | 'dirt';

/** Something the player can walk up to and press E on, which runs an ink knot. */
/** Things you can dig up (a small sprite each, shown coming out of the ground). */
export type FindItem = 'wire' | 'ring' | 'cube' | 'box' | 'cable' | 'lens' | 'disc';

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
  /** Only usable while this ink variable is true / none of these are (e.g. a spot to dig, until you've dug it). */
  showIf?: string;
  hideIf?: string | string[];
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
  /** Only there while this ink variable is true (a place you don't know about yet, like the dog's hollow). */
  showIf?: string;
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

/**
 * An area out in the open (the borderland, Chapter 2): instead of a hollow carved in heartwood, a sky
 * and the tree on the horizon behind (a far layer that moves slower than you walk, so the tree stays
 * put), the far plain receding beneath it, and the solids as packed dirt. Painted for the time of day.
 */
export interface Outdoor {
  /** Where the far plain meets the sky, in screen pixels. */
  horizon: number;
  /** Where the tree stands on the horizon, in the far layer's pixels (0 is the left of the first screen). */
  treeX: number;
  /** How far away the tree is: 1 is as seen from the settlement, bigger is nearer (the tree's edge). */
  treeScale?: number;
  /** At the roots (the tree's edge): the trunk rises straight up out of sight, too close to see the canopy or the pipes (designer). */
  atRoots?: boolean;
  /** What's between you and the tree: the open plain (default), or the settlement's rooftops (inside its walls). */
  backdrop?: 'plain' | 'settlement';
  /** The ground: scrapland dirt (default), or the deep ground's (harder, darker, no junk, cut with straight grooves running away to the horizon). */
  ground?: 'scrap' | 'deep';
  /** Ground level, when there's earth far below it (the sunk town): dirt is darker and layered by its depth below this, unlit by the sky, with no sunlit crust on floors underground. */
  groundY?: number;
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
  /**
   * What the room is built of: carved heartwood (the tree, default), or scrap (the borderland's
   * settlement: walls of mismatched panels, bare metal, painted, pale casing and dead glass, riveted
   * together, with riveted plate floors), or hull (inside something enormous: smooth curved plates
   * with ribs running up and over, the tally house), or matched (whole matched panels, clean and warm:
   * the boss's house).
   */
  walls?: 'heartwood' | 'scrap' | 'hull' | 'matched';
  /** Below ground (the gambling den): around a scrap or hull room is packed earth with junk in it, not the dark. */
  underground?: boolean;
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
  /** The area's sound bed, layered (docs/audio-plan.md). */
  ambience?: AmbienceLayer[];
  /** The space, for echo and the room's hush (default small). */
  acoustics?: 'small' | 'hall' | 'tunnel' | 'street' | 'high' | 'open';
  /** Out in the open (Chapter 2): a sky and the tree behind; the cavity is then just the area's bounds. */
  outdoor?: Outdoor;
  /** What the floor's made of (footsteps; default wood). One-way boards always sound like planks. */
  surface?: Surface;
}
