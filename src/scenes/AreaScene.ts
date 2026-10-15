import { DAYS } from '../systems/Calendar';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { closedReason, ON_FOOT } from '../data/access';
import { AREAS, AREA_NAMES, placeOf } from '../data/areas';
import { worldOf } from '../data/map';
import type { AmbienceLayer, AreaDefinition, Exit, Feature, FindItem, Person, Surface } from '../data/areas/types';
import { nextHop } from '../data/route';
import { Player } from '../objects/Player';
import type { CarveSceneData } from './CarveScene';
import type { DecodeResult, DecodeSceneData } from './DecodeScene';
import type { EndingSceneData } from './EndingScene';
import type { StepSceneData } from './StepScene';
import type { WarTableSceneData } from './WarTableScene';
import type { RiotTableSceneData } from './RiotTableScene';
import { RIOTS } from '../data/warTable';
import type { CombatSceneData } from './CombatScene';
import type { MapSceneData } from './MapScene';
import { getSession, type WakePlace } from '../session';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueBox } from '../ui/DialogueBox';
import { paintArea } from '../ui/paintArea';
import { FAR_SCROLL, farSize, paintFar, paintOutdoorNear } from '../ui/paintOutdoor';
import { VILLAGERS, WATCHMAN } from '../ui/characters';
import { CAST, type CastId } from '../ui/borderlandFolk';
import { SHADES, type Power } from '../ui/pixelArt';
import { CAPITAL_PLACES } from '../data/capitalMap';
import { cityViewPainter } from '../ui/paintCityView';
import { CITIZENS, WATCH } from '../ui/capitalFolk';
import { duckScore, updateScore, type ScoreId } from '../ui/score';
import { setMuted } from '../ui/soundSetting';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { ObjectiveMarker } from '../ui/ObjectiveMarker';
import { type SoundId, SOUND_IDS, Soundscape } from '../ui/soundscape';
import { FIND_SPRITES, FIRE_FRAMES, type RowSprite } from '../ui/sprites';

export interface AreaSceneData {
  areaId: string;
  /** The area the player came from; they appear at the exit that leads back there. */
  from?: string;
  /** Where the player appears instead (e.g. waking in bed), overriding `from`. */
  start?: { x: number; y: number };
  /** A title card faded in over the start of the scene (e.g. "Day 1: Ascension Day"). */
  card?: string;
  /** An ink knot that plays by itself on arrival (a scripted scene, e.g. the Ascension). */
  script?: string;
}

/** A person placed in the area, and whether the story has them here right now. */
interface PersonEntry {
  person: Person;
  image: Phaser.GameObjects.Image;
  /** Hidden or shown by #hide:/#show: tags. */
  scriptHidden: boolean;
  /** A shy person who has slipped away. */
  gone: boolean;
  /** A follower's copy of the path you took, and how far along it they've walked. */
  trail?: { x: number; y: number; d: number }[];
  along?: number;
  /** Jumping along a route set by `#hop:` (shown until they land, whatever the story says). */
  racing?: boolean;
  /** Their idle and walking textures (walking ones only if they have `walkFrames`). */
  idleKeys: string[];
  walkKeys: string[];
  /** Walking: the walk frames are playing (the idle cycle waits). */
  walking?: boolean;
  /** Moved by the story (#beside, #move, #leave): they stop wandering. */
  scripted?: boolean;
}

/**
 * A story condition (people's and things' `showIf`/`hideIf`, `barks`): a variable that's true, or
 * `<variable>=<value>` (it has that value), or `<variable>=<value>,<value>` (one of those).
 */
function barksOn(condition: string, get: (variable: string) => unknown): boolean {
  const [variable, values] = condition.split('=');
  return values === undefined ? !!get(variable!) : values.split(',').includes(String(get(variable!)));
}

/** How far behind you (along your path) a follower walks, in px. */
const FOLLOW_GAP = 16;

/** The point `d` px along a path of points (each with its distance from the start). */
function pointAlong(t: { x: number; y: number; d: number }[], d: number): { x: number; y: number } {
  let lo = 0;
  let hi = t.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (t[mid]!.d <= d) lo = mid;
    else hi = mid - 1;
  }
  const a = t[lo]!;
  const b = t[lo + 1];
  if (!b) return { x: a.x, y: a.y };
  const f = (d - a.d) / (b.d - a.d || 1);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** A small carving shown up close for a moment during a scripted scene (#inset:<id>). */
const INSETS: Record<string, RowSprite> = {
  // The master's mark: a spiral cut into their last carving.
  spiral: {
    rows: [
      'ffffffffffffffff',
      'fwwwwwwwwwwwwwwf',
      'fwwssssssssswwwf',
      'fwwswwwwwwwwswwf',
      'fwwswssssswwswwf',
      'fwwswswwwswwswwf',
      'fwwswswswswwswwf',
      'fwwswswsswwwswwf',
      'fwwswswwwwwwswwf',
      'fwwswsssssssswwf',
      'fwwswwwwwwwwwwwf',
      'fwwssssssssssswf',
      'fwwwwwwwwwwwwwwf',
      'ffffffffffffffff',
    ],
    colours: { f: SHADES.woodLight, w: SHADES.woodPale, s: SHADES.deep },
  },
  // The Tender's summons: a small cloth in the banners' colours, folded, with the tube's mark.
  summons: {
    rows: [
      'pppppppppppppppp',
      'eaaaaaaaaaaaaaae',
      'eaaaaaacaaaaaaae',
      'eaaaaacwcaaaaaae',
      'eaaaaccwccaaaaae',
      'eaaaacaccacaaaae',
      'eaaaacacaacaaaae',
      'eaaaaccaccaaaaae',
      'eaaaaaccccaaaaae',
      'eaaaaaacaaaaaaae',
      'eeeeeeeeeeeeeeee',
      'a.a.a.a.a.a.a.a.',
    ],
    colours: { p: SHADES.woodPale, a: SHADES.amberDeep, e: SHADES.woodLight, c: SHADES.cyanMid, w: SHADES.cyan },
  },
  // A real feather from outside: red, like nothing else in the tree (red is for birds).
  feather: {
    rows: [
      '..............rR',
      '...........rrRR.',
      '.........rrRRr..',
      '.......rrRRrr...',
      '.....rrRRrrr....',
      '....rRRrrr......',
      '...rRrrrd.......',
      '..rRrrd.........',
      '..Rrd...........',
      '.Rd.............',
      'q...............',
    ],
    colours: { r: SHADES.red, R: SHADES.redDark, d: SHADES.redDark, q: SHADES.light },
  },
};

/** A person pacing between two points. */
interface Wanderer {
  image: Phaser.GameObjects.Image;
  entry: PersonEntry;
  from: number;
  to: number;
  dir: 1 | -1;
  /** Milliseconds left standing still before walking on. */
  pause: number;
  walkKeys: string[];
  idleKey: string;
  stepTimer: number;
  frame: number;
}

/** Anything the player can walk up to and press E on. */
interface Usable {
  /** Only offered when nothing else is in reach (digging, wherever you stand). */
  fallback?: boolean;
  /** False while unavailable (e.g. a person who isn't here at this time of day). */
  enabled?: () => boolean;
  x: number;
  y: number;
  reach: number;
  label: string;
  use: () => void;
}

/** A platform travelling between two points (a lift on ropes, a plank sliding along a rope). */
interface Mover {
  image: Phaser.Physics.Arcade.Image;
  from: { x: number; y: number };
  to: { x: number; y: number };
  speed: number;
  dir: 1 | -1;
  pause: number;
  width: number;
  ropes?: { graphics: Phaser.GameObjects.Graphics; top: number };
}

/** How long a moving platform waits at each end, in ms. */
const MOVER_PAUSE = 900;
/** How long a rotten board holds once you've stepped on it, and how long before it grows back, in ms. */
const CRUMBLE_HOLD = 450;
const CRUMBLE_REGROW = 3200;

/** A rotten board that gives way a moment after you step on it. */
interface Crumble {
  x: number;
  y: number;
  width: number;
  zone: Phaser.GameObjects.Zone;
  image: Phaser.GameObjects.Image;
  /** Ms since you first stood on it (null: not yet). */
  standing: number | null;
  /** It holds while this ink variable is true. */
  steadyIf?: string;
}

/** A stretch of tunnel coming down round you (see the `collapse` feature). */
interface Collapse {
  feature: Extract<Feature, { type: 'collapse' }>;
  active: boolean;
  /** The side you came in from: once you're out the other side, it's over. */
  enteredFrom: -1 | 1;
  done: boolean;
  untilNext: number;
}


/** A watchman with a lantern (the `watch` feature). */
interface Watchman {
  feature: Extract<Feature, { type: 'watch' }>;
  image: Phaser.GameObjects.Image;
  lantern: Phaser.GameObjects.Rectangle;
  cone: Phaser.GameObjects.Graphics;
  callout: PixelText;
  dir: 1 | -1;
  /** Ms left standing at the end of his round, or before he turns round (standing watch). */
  wait: number;
  /** Ms left before you're sent back, once he's seen you (null: he hasn't). */
  alarm: number | null;
  walkKeys: string[];
  idleKey: string;
  step: number;
  /** With `start`: whether he's reached his post. */
  arrived: boolean;
  /** With `glance`: facing his usual way, saying his tell, or looking back. */
  glance: 'idle' | 'tell' | 'look';
}

interface Barks {
  feature: Extract<Feature, { type: 'barks' }>;
  index: number;
  left: number;
}

/** People you're tailing (the `quarry` feature). */
interface Quarry {
  feature: Extract<Feature, { type: 'quarry' }>;
  /** Each person's distance from the leader at the start, kept as they walk. */
  offsets: number[];
  /** The path point they're heading for. */
  next: number;
  wait: number;
  looking: boolean;
  /** At a stop where he'll look round: ms before he turns (a moment to get out of sight). */
  turnIn: number;
  /** Ms until you're sent back, once they've seen you or you've lost them (null: neither). */
  alarm: number | null;
  done: boolean;
  callout: PixelText;
}

/** The mob chasing you (the `mob` feature): torch-bearers following the path you took. */
interface Mob {
  feature: Extract<Feature, { type: 'mob' }>;
  /** Your path through the area: points a couple of px apart, each with its distance along the path. */
  trail: { x: number; y: number; d: number }[];
  /** How far along your path the front of the mob has got. */
  head: number;
  /** Ms before they set off (after you arrive, or after they've caught you). */
  wait: number;
  /** Ms until you're thrown back, once they've caught you (null: they haven't). */
  alarm: number | null;
  members: { image: Phaser.GameObjects.Image; torch: Phaser.GameObjects.Rectangle; walkKeys: string[] }[];
  callout: PixelText;
  step: number;
}

/** How far apart the mob walk along your path (px), and how close the front has to get to catch you. */
const MOB_SPACING = 13;
const MOB_REACH = 10;

/** How long someone you're tailing pauses before looking round (ms): a moment to get out of sight. */
const QUARRY_TURN = 900;

/** How far above or below his feet the watch's lantern reaches. */
const WATCH_VIEW_Y = 60;
/** A standing watchman turns round this often (ms), unless the feature says otherwise; a pacing one waits this long at each end. */
const WATCH_PAUSE = 2600;

/** Any side-on area, built from its AreaDefinition in src/data/areas. */
export class AreaScene extends Phaser.Scene {
  private area!: AreaDefinition;
  private player!: Player;
  private dialogue!: DialogueBox;
  private prompt!: PixelText;
  private promptPlate!: Phaser.GameObjects.Rectangle;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private usables: Usable[] = [];
  private current: Usable | null = null;
  /** The dog's finding, checked every frame (`seek`); where it's digging now, for the marker. */
  private seeks: (() => void)[] = [];
  private seekSpot: { x: number; y: number } | null = null;
  /** Long drops you slide down (`slide`), and whether you're sliding now (and how long till the next puff of dust). */
  private slides: Extract<Feature, { type: 'slide' }>[] = [];
  private sliding = false;
  private slideDust = 0;
  /** Things there only while the story says (a camp's fire and smoke): shown and hidden with the people. */
  private storyShown: { objects: (Phaser.GameObjects.Image | Phaser.GameObjects.Particles.ParticleEmitter)[]; on: () => boolean }[] = [];
  /** Down on one knee, digging (input held a moment). */
  private digBusy = false;
  private from: string | undefined;
  private start: { x: number; y: number } | undefined;
  private card: string | undefined;
  private leaving = false;
  private wanderers: Wanderer[] = [];
  private movers: Mover[] = [];
  private people = new Map<string, PersonEntry>();
  private hints: Extract<Feature, { type: 'hint' }>[] = [];
  private hintText!: PixelText;
  /** A dark plate behind the hint, so it reads over bright backdrops. */
  private hintPlate!: Phaser.GameObjects.Rectangle;
  private objective!: ObjectiveMarker;
  /** Things to do once the current conversation closes (e.g. travel after a #goto: tag). */
  private afterClose: (() => void)[] = [];
  private inset: Phaser.GameObjects.Container | null = null;
  /** A close-up of the city (`#view`), kept up from line to line and repainted as the story changes it. */
  private cityView: { container: Phaser.GameObjects.Container; image: Phaser.GameObjects.Image } | null = null;
  /** Darkens the room for a weighty moment (#dim:on / #dim:off). */
  private dimmer!: Phaser.GameObjects.Rectangle;
  private script: string | undefined;
  /** Frame on which the dialogue closed, so the key that closed it doesn't also jump or reopen it. */
  private dialogueClosedFrame = -1;
  private crumbles: Crumble[] = [];
  private countdownText!: PixelText;
  private collapses: Collapse[] = [];
  /** Hazards that knock you back on touch: rot pools, and beetles (whose rectangles move). */
  private hazards: { rect: () => Phaser.Geom.Rectangle; reset: { x: number; y: number } }[] = [];
  private beetles: { image: Phaser.GameObjects.Image; feature: Extract<Feature, { type: 'beetle' }>; dir: 1 | -1; frames: string[]; step: number }[] = [];
  private crumbleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private watchmen: Watchman[] = [];
  private shadows: Extract<Feature, { type: 'shadow' }>[] = [];
  private shadowGraphics: Phaser.GameObjects.Graphics | null = null;
  private quarries: Quarry[] = [];
  /** Someone leading you along a route (the `lead` feature): the point they're at, and whether they're on the move. */
  private leads: { feature: Extract<Feature, { type: 'lead' }>; index: number; moving: boolean; idle: number }[] = [];
  private mobs: Mob[] = [];
  private triggers: Extract<Feature, { type: 'trigger' }>[] = [];
  private barks: Barks[] = [];
  /** Lines over people's heads, by who's saying them. */
  private speech = new Map<string, { text: PixelText; left: number }>();
  /** Where you came in (the mob throws you back here). */
  private arrival = { x: 0, y: 0 };
  /** Where tomorrow starts, if not in your bed (#wake). */
  private wakeAt: WakePlace | null = null;

  constructor() {
    super('Area');
  }

  init(data: AreaSceneData): void {
    const area = AREAS[data.areaId];
    if (!area) throw new Error(`AreaScene: no area called "${data.areaId}"`);
    this.area = area;
    this.from = data.from;
    this.start = data.start;
    this.card = data.card;
    this.script = data.script;
    this.wanderers = [];
    this.outdoorLayers = undefined;
    this.roomImage = undefined;
    this.movers = [];
    this.people = new Map();
    this.hints = [];
    this.afterClose = [];
    this.inset = null;
    this.current = null;
    this.leaving = false;
    this.crumbles = [];
    this.collapses = [];
    this.hazards = [];
    this.beetles = [];
    this.watchmen = [];
    this.shadows = [];
    this.shadowGraphics = null;
    this.quarries = [];
    this.leads = [];
    this.wakeAt = null;
    this.mobs = [];
    this.triggers = [];
    this.storyShown = [];
    this.seeks = [];
    this.seekSpot = null;
    this.slides = [];
    this.sliding = false;
    this.digBusy = false;
    this.barks = [];
    this.speech = new Map();
  }

  /** Out in the open: the far layer (sky, the tree) and the near layer (dirt, props), painted for the time of day. */
  private outdoorLayers?: { far: Phaser.GameObjects.Image; near: Phaser.GameObjects.Image };

  /** Paints (or repaints, when the time changes) an outdoor area's two layers for the time of day. */
  private paintOutdoor(): void {
    const { area } = this;
    const outdoor = area.outdoor!;
    const { slot } = getSession(this).calendar;
    const far = farSize(area, GAME_WIDTH, GAME_HEIGHT);
    const farKey = `far-${area.id}-${slot}`;
    const nearKey = `area-${area.id}-${slot}-${this.powerKey()}`;
    makePaintedTexture(this, farKey, far.width, far.height, paintFar(outdoor, slot, far.height));
    makePaintedTexture(this, nearKey, area.width, area.height, paintOutdoorNear(area, slot, this.power()));
    if (this.outdoorLayers) {
      this.outdoorLayers.far.setTexture(farKey);
      this.outdoorLayers.near.setTexture(nearKey);
      return;
    }
    this.outdoorLayers = {
      far: this.add.image(0, 0, farKey).setOrigin(0).setScrollFactor(FAR_SCROLL),
      near: this.add.image(0, 0, nearKey).setOrigin(0),
    };
  }

  /** A room's backdrop (one image; repainted when the time changes if it has views out over the city). */
  private roomImage?: Phaser.GameObjects.Image;

  /**
   * The capital's power here, as the story has it (Chapter 3, big choice 1: `dark_district`, from dusk):
   * the district that went without is dark (from up in the citadel too); if the citadel gave its power
   * away (`energy` "people"), its own rooms are dimmer. From Day 3 (`streets_cut`) your father has cut the
   * streets where the symbol keeps turning up, in the other district: those are dark too (the views show
   * them in patches).
   */
  private power(): Power {
    const { story, calendar } = getSession(this);
    if (calendar.slot !== 'evening' && calendar.slot !== 'night') return {};
    const dark = String(story.getVariable('dark_district') ?? '');
    const also = story.getVariable('streets_cut') ? (dark === 'low' ? 'promenade' : dark === 'promenade' ? 'low' : '') : '';
    const where = placeOf(this.area.id);
    const citadel = CAPITAL_PLACES.some((p) => p.id === where && p.level === 'the citadel');
    const off = (district: string) => (district === 'low' && where === 'low-district') || (district === 'promenade' && where === 'promenade');
    const view = (district: string) => (district === 'low' ? 'low' : district === 'promenade' ? 'middle' : undefined);
    return {
      views: view(dark),
      also: view(also),
      fade: Number(story.getVariable('dark_fade')) / 100,
      cut: off(dark) || off(also),
      dim: citadel && story.getVariable('energy') === 'people' && story.getVariable('citadel_dimmed') ? 0.62 : undefined,
    };
  }

  /** Whether a story condition holds: a variable that's true, or `<variable>=<value>[,<value>]`. */
  private holds(condition: string): boolean {
    return barksOn(condition, (v) => getSession(this).story.getVariable(v));
  }

  private powerKey(): string {
    const p = this.power();
    return `${p.views ?? ''}${p.also ? `+${p.also}` : ''}${p.fade ?? ''}${p.cut ? 'cut' : ''}${p.dim ?? ''}`;
  }

  /** Paints a room, or repaints it for the time of day if it looks out over the city (the citadel's windows). */
  private paintRoom(): void {
    const { area } = this;
    const slot = getSession(this).calendar.slot;
    const key = area.views ? `area-${area.id}-${slot}-${this.powerKey()}` : `area-${area.id}-${this.powerKey()}`;
    makePaintedTexture(this, key, area.width, area.height, paintArea(area, slot, this.power()));
    if (this.roomImage) this.roomImage.setTexture(key);
    else this.roomImage = this.add.image(0, 0, key).setOrigin(0);
  }

  /** The area's sounds (docs/audio-plan.md). */
  private soundscape!: Soundscape;
  /** For footsteps, jumps and landings: distance walked since the last step, and last frame's state. */
  private stepping = { since: 0, next: 15, wasOnGround: true, fallSpeed: 0 };

  create(): void {
    const { area } = this;
    this.soundscape = new Soundscape(this, area.ambience ?? [], (layer) => this.layerOn(layer), area.acoustics, area.surface);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.soundscape.stop());
    this.cameras.main.setBackgroundColor(SHADES.shadow).fadeIn(400);
    this.physics.world.setBounds(0, 0, area.width, area.height);
    this.cameras.main.setBounds(0, 0, area.width, area.height);

    if (area.outdoor) this.paintOutdoor();
    else this.paintRoom();
    this.crumbleGroup = this.physics.add.staticGroup();

    for (const feature of area.features) this.addFeature(feature);

    const closed = () => this.conversationClosed();
    const talk = (knot: string) => () => this.dialogue.open(knot, closed);
    const story = getSession(this).story;
    this.usables = area.interactables.map((it) => ({
      ...it,
      use: talk(it.knot),
      enabled: it.showIf || it.hideIf ? () => (!it.showIf || barksOn(it.showIf, (v) => story.getVariable(v))) && ![it.hideIf ?? []].flat().some((v) => barksOn(v, (w) => story.getVariable(w))) : undefined,
    }));
    for (const exit of area.exits) {
      const known = exit.showIf ? () => !!this.holds(exit.showIf!) : undefined;
      this.usables.push({ ...exit, label: 'Leave', use: () => this.openDoorMenu(exit), enabled: known });
    }
    const session = getSession(this);
    for (const person of area.people) {
      const frames = (person.idleFrames ?? [person.sprite]).map((f, i) => makeSpriteTexture(this, `person-${person.id}-${i}`, f.rows, f.colours));
      const walkKeys = (person.walkFrames ?? []).map((f, i) => makeSpriteTexture(this, `person-${person.id}-walk-${i}`, f.rows, f.colours));
      const image = this.add.image(person.x, person.y, frames[0]!).setOrigin(0.5, 1).setFlipX(person.flipX ?? false).setDepth(8);
      const entry: PersonEntry = { person, image, scriptHidden: person.hidden ?? false, gone: false, idleKeys: frames, walkKeys };
      if (person.wander) {
        this.wanderers.push({ image, entry, from: person.wander.from, to: person.wander.to, dir: person.flipX ? -1 : 1, pause: Phaser.Math.Between(0, 1500), walkKeys: walkKeys.length ? walkKeys : [frames[0]!], idleKey: frames[0]!, stepTimer: 0, frame: 0 });
      } else if (frames.length > 1) {
        let frame = 0;
        this.time.addEvent({ delay: 650, loop: true, callback: () => !entry.walking && image.setTexture(frames[(frame = (frame + 1) % frames.length)]!) });
      }
      this.people.set(person.id, entry);
      // (Wanderers with something to say can be talked to too, wherever they've got to: the dog.)
      if (person.knot) {
        // Where they stand now (people can be moved by the story, or follow you).
        this.usables.push({
          get x() { return entry.image.x; },
          get y() { return entry.image.y; },
          reach: 14,
          label: person.label ?? 'Talk',
          use: () => {
            // Some people turn to face you while you talk, and back again after (unless the story turned them).
            const before = entry.image.flipX;
            const toYou = this.player.sprite.x < entry.image.x;
            if (person.turns) entry.image.setFlipX(toYou);
            this.dialogue.open(person.knot!, () => {
              if (person.turns && !person.wander && entry.image.flipX === toYou) entry.image.setFlipX(before);
              closed();
            }, person.speaker);
          },
          enabled: () => this.isPresent(entry),
          // Someone at your heels (the dog) doesn't get in the way of everything else you walk past.
          fallback: person.follow,
        });
      }
    }

    // Who's here depends on the time of day and the story; refresh when either changes.
    this.refreshPeople();
    // (Removed when the scene shuts down: otherwise every area you'd been through kept listening, and an
    // outdoor area's listener repainted the sky in a room with none, and the game froze on a black screen.)
    const calendarChanged = () => {
      if (area.outdoor) this.paintOutdoor();
      else if (area.views) this.paintRoom();
      this.refreshPeople();
      this.refreshObjective();
    };
    this.events.on('calendar-changed', calendarChanged);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off('calendar-changed', calendarChanged));

    const solids = this.physics.add.staticGroup();
    for (const s of area.solids) {
      const zone = this.add.zone(s.x, s.y, s.width, s.height).setOrigin(0);
      solids.add(zone);
      const body = zone.body as Phaser.Physics.Arcade.StaticBody;
      if (s.oneWay) {
        zone.setData('oneWay', true);
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
      }
    }

    const arrival = this.start ?? area.exits.find((e) => e.to === this.from) ?? area.playerStart;
    this.arrival = { x: arrival.x, y: arrival.y };
    // Room to stand up: no solid wall or ceiling in the way (one-way platforms don't count).
    const canStand = (r: Phaser.Geom.Rectangle) => !area.solids.some((s) => !s.oneWay && r.right > s.x && r.left < s.x + s.width && r.bottom > s.y && r.top < s.y + s.height);
    this.player = new Player(this, arrival.x, arrival.y, canStand);
    const world = worldOf(placeOf(area.id)).id;
    if (world === 'borderland') this.player.look = 'scavenger';
    if (world === 'capital') this.player.look = 'prince';
    // Anyone following you comes in with you (whether or not they're showing yet: after a fight, the
    // dog comes back beside you, not where it stands when you first come into the area).
    for (const entry of this.people.values()) if (entry.person.follow) entry.image.setPosition(Math.max(this.area.cavity.x + 8, arrival.x - 16), arrival.y);
    // Pressing down drops through one-way platforms (walkways, bridges, roofs, stairs).
    const notDroppingThrough = (_p: unknown, other: unknown) => !(this.player.dropping && (other as Phaser.GameObjects.GameObject).getData('oneWay'));
    this.physics.add.collider(this.player.sprite, solids, undefined, notDroppingThrough);
    if (this.movers.length) this.physics.add.collider(this.player.sprite, this.movers.map((m) => m.image), undefined, notDroppingThrough);
    if (this.crumbles.length) this.physics.add.collider(this.player.sprite, this.crumbleGroup, undefined, notDroppingThrough);
    if (area.width > GAME_WIDTH || area.height > GAME_HEIGHT) this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.promptPlate = this.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.85).setOrigin(0).setDepth(19).setVisible(false);
    this.prompt = new PixelText(this, 0, 0, '', { color: SHADES.white }).setDepth(20).setVisible(false);
    this.dialogue = new DialogueBox(this, session.story, (tags) => this.handleTags(tags));
    this.objective = new ObjectiveMarker(this);
    this.countdownText = new PixelText(this, 0, 18, '', { color: SHADES.amber, shadow: SHADES.shadow, scale: 2 }).setScrollFactor(0).setDepth(27).setVisible(false);
    this.dimmer = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SHADES.shadow).setOrigin(0).setScrollFactor(0).setDepth(28).setAlpha(0);
    this.hintText = new PixelText(this, 0, 18, '', { color: SHADES.white, shadow: SHADES.shadow }).setScrollFactor(0).setDepth(26).setVisible(false);
    this.hintPlate = this.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.75).setOrigin(0).setScrollFactor(0).setDepth(25).setVisible(false);
    this.refreshObjective();
    if (this.script) {
      const knot = this.script;
      this.time.delayedCall(700, () => this.dialogue.open(knot, closed));
    }
    new DebugOverlay(this, session, () => (this.dialogue.isOpen ? 'Close the conversation first.' : null));
    // Dev: C in the debug overlay opens the fight picker, and comes back here afterwards.
    const debugCombat = (encounter: string) => {
      if (!this.dialogue.isOpen && !this.leaving) this.leaveFor('Combat', { encounter, pick: true, back: { areaId: this.area.id, start: { ...this.player.feet } } } satisfies CombatSceneData);
    };
    this.events.on('debug-combat', debugCombat);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off('debug-combat', debugCombat));

    if (this.card) this.showCard(this.card);

    // Coming back from the decoding screen: play the knot it hands back, if any.
    const resumed = (_sys: unknown, data?: DecodeResult) => {
      if (data?.script) this.dialogue.open(data.script, closed);
    };
    this.events.on(Phaser.Scenes.Events.RESUME, resumed);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, resumed));

    // Dev builds only: M opens the map from anywhere, for quick testing.
    if (import.meta.env.DEV) {
      this.input.keyboard?.on('keydown-M', () => {
        if (!this.dialogue.isOpen && !this.leaving) this.openMap();
      });
      // N mutes and unmutes everything.
      this.input.keyboard?.on('keydown-N', () => setMuted(this.game, !this.sound.mute));
    }
  }

  override update(_time: number, delta: number): void {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
    const caught = this.watchmen.some((w) => w.alarm !== null) || this.quarries.some((q) => q.alarm !== null) || this.mobs.some((m) => m.alarm !== null);
    const blocked = this.leaving || caught || this.dialogue.isOpen || this.game.loop.frame === this.dialogueClosedFrame || this.digBusy;
    this.player.update(blocked);
    this.stepUp();
    this.updateWanderers(delta);
    this.updateMovers(delta);
    this.updateShyPeople();
    this.updateFollowers(delta);
    for (const seek of this.seeks) seek();
    this.updateSlides(delta);
    this.updateCrumbles(delta);
    this.updateCollapses(delta);
    this.updateBeetles(delta);
    this.updateWatch(delta);
    this.updateQuarries(delta);
    this.updateLeads(delta);
    this.updateMobs(delta);
    this.updateTriggers();
    this.updateBarks(delta);
    updateScore(this, this.scoreForToday(), delta);
    this.updateCloak();
    this.checkHazards();
    this.updateWaiting(delta);
    this.updateHints();
    this.objective.pointAt(this.objectivePoints());
    this.updatePlayerSounds(delta);
    this.soundscape.update(delta, this.player.feet);

    this.setCurrent(this.dialogue.isOpen || !this.player.onGround ? null : this.nearestInteractable());
    if (this.current && interactPressed && !blocked) {
      this.current.use();
      this.setCurrent(null);
    }
  }

  /** The day's music, if it has any: Day 6 is eerie from start to finish (designer). */
  private scoreForToday(): ScoreId | null {
    const { story } = getSession(this);
    return story.getVariable('day6') !== '' && story.getVariable('day7') === '' ? 'day6' : null;
  }

  /** Lines spoken over people's heads, one after another, while you keep playing. */
  private updateBarks(delta: number): void {
    const { story } = getSession(this);
    for (const b of this.barks) {
      const f = b.feature;
      if (f.showIf && !barksOn(f.showIf, (v) => story.getVariable(v))) continue;
      if (this.dialogue.isOpen) continue;
      b.left -= delta;
      if (b.left > 0) continue;
      const line = f.lines[b.index];
      if (!line) continue;
      const wait = line.wait ?? 2600;
      this.say(line.who, line.text, wait - 300);
      b.left = wait;
      b.index = b.index + 1 < f.lines.length ? b.index + 1 : (f.loopFrom ?? 0);
    }
    for (const [who, s] of this.speech) {
      s.left -= delta;
      const at = this.speakerAt(who);
      // The watchman's own "..." (his tell) takes the place of anything he's saying.
      const busy = who === 'watch' && this.watchmen.some((w) => w.glance !== 'idle');
      if (s.left <= 0 || !at || busy || this.dialogue.isOpen) s.text.setVisible(false);
      else s.text.setPosition(Math.round(Phaser.Math.Clamp(at.x - s.text.width / 2, 4, this.area.width - s.text.width - 4)), at.y - 40);
    }
  }

  /** Where someone speaking over their head is: a person, `watch` for the area's watchman, or a watch by its `id`. */
  private speakerAt(who: string): { x: number; y: number } | null {
    const named = this.watchmen.find((m) => m.feature.id === who);
    if (who === 'watch' || named) {
      const w = named ?? this.watchmen.find((m) => m.image.visible);
      return w && w.image.visible ? { x: w.image.x, y: w.image.y } : null;
    }
    const entry = this.people.get(who);
    return entry && entry.image.visible ? { x: entry.image.x, y: entry.image.y } : null;
  }

  /** Shows a line over someone's head for `ms`. */
  private say(who: string, text: string, ms: number): void {
    let s = this.speech.get(who);
    if (!s) {
      s = { text: new PixelText(this, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, wrapWidth: 150 }).setDepth(21), left: 0 };
      this.speech.set(who, s);
    }
    s.text.setText(text).setVisible(true);
    s.left = ms;
  }

  /** Whether an ambience layer is playing now: its time of day and story variables. */
  private layerOn(layer: AmbienceLayer): boolean {
    const { calendar } = getSession(this);
    if (layer.when && !layer.when.includes(calendar.slot)) return false;
    if (layer.showIf && !this.holds(layer.showIf)) return false;
    return ![layer.hideIf ?? []].flat().some((v) => this.holds(v));
  }

  /** What's underfoot: boards (one-way platforms, lifts) sound like planks; otherwise the area's floor. */
  private surfaceUnderfoot(): Surface {
    const { x, y } = this.player.feet;
    const onBoard = this.area.solids.some((s) => s.oneWay && Math.abs(s.y - y) <= 1 && x >= s.x && x <= s.x + s.width)
      || this.movers.some((m) => Math.abs(m.image.y - y) <= 2 && x >= m.image.x && x <= m.image.x + m.width);
    return onBoard ? 'plank' : (this.area.surface ?? 'wood');
  }

  /** Footsteps as you walk (softer and slower crouching), a breath of cloth when you jump, a landing by how hard you fell. */
  private updatePlayerSounds(delta: number): void {
    const body = this.player.body;
    const onGround = this.player.onGround;
    const st = this.stepping;
    if (!body.enable) return;
    if (onGround && !st.wasOnGround) {
      if (st.fallSpeed > 60) this.soundscape.play('land', undefined, Math.min(1, st.fallSpeed / 260) * 0.6, undefined, this.surfaceUnderfoot());
      st.since = 0;
    }
    if (!onGround && st.wasOnGround && body.velocity.y < -50) this.soundscape.play('jump', undefined, 0.4);
    if (onGround && Math.abs(body.velocity.x) > 5) {
      st.since += (Math.abs(body.velocity.x) * delta) / 1000;
      if (st.since >= st.next) {
        st.since = 0;
        // Not quite even (designer: too regular): each stride a little longer or shorter.
        st.next = (this.player.crouching ? 10 : 15) * Phaser.Math.FloatBetween(0.82, 1.2);
        this.soundscape.play('step', undefined, this.player.crouching ? 0.25 : 0.45, undefined, this.surfaceUnderfoot());
      }
    }
    st.fallSpeed = onGround ? 0 : Math.max(st.fallSpeed, body.velocity.y);
    st.wasOnGround = onGround;
  }

  /** The closest interactable whose zone the player's feet are in, on the same surface. */
  private nearestInteractable(): Usable | null {
    const { x, y } = this.player.feet;
    let best: Usable | null = null;
    let fallback: Usable | null = null;
    for (const it of this.usables) {
      if (it.enabled && !it.enabled()) continue;
      const dx = Math.abs(x - it.x);
      if (Math.abs(y - it.y) > 4 || dx > it.reach) continue;
      if (it.fallback) fallback ??= it;
      else if (!best || dx < Math.abs(x - best.x)) best = it;
    }
    return best ?? fallback;
  }

  private setCurrent(it: Usable | null): void {
    // (A prompt that moves with you, like digging, follows you.)
    if (it === this.current && !it?.fallback) return;
    this.current = it;
    if (!it) {
      this.prompt.setVisible(false);
      this.promptPlate.setVisible(false);
      return;
    }
    this.prompt.setText(`[E] ${it.label}`).setVisible(true);
    const x = Phaser.Math.Clamp(Math.round(it.x - this.prompt.width / 2), 2, this.area.width - this.prompt.width - 2);
    this.prompt.setPosition(x, it.y - 38);
    this.promptPlate.setPosition(x - 2, it.y - 40).setSize(this.prompt.width + 4, this.prompt.height + 3).setVisible(true);
  }

  /** Wanderers pace between their two points at a stroll, stopping for a moment now and then. */
  private updateWanderers(delta: number): void {
    const SPEED = 22; // px per second
    for (const w of this.wanderers) {
      if (!w.image.visible || w.entry.scripted) continue;
      // Someone you're talking to stands still.
      if (w.entry.person.knot && this.dialogue.isOpen) {
        w.image.setTexture(w.idleKey);
        continue;
      }
      if (w.pause > 0) {
        w.pause -= delta;
        w.image.setTexture(w.idleKey);
        continue;
      }
      w.image.x += w.dir * SPEED * (delta / 1000);
      w.image.setFlipX(w.dir < 0);
      w.stepTimer += delta;
      if (w.stepTimer > 180) {
        w.stepTimer = 0;
        w.frame = (w.frame + 1) % w.walkKeys.length;
        w.image.setTexture(w.walkKeys[w.frame]!);
      }
      const atEnd = (w.dir > 0 && w.image.x >= w.to) || (w.dir < 0 && w.image.x <= w.from);
      if (atEnd || Math.random() < delta / 9000) {
        w.pause = Phaser.Math.Between(700, 2600);
        if (atEnd) w.dir = w.dir > 0 ? -1 : 1;
      }
    }
  }

  /** Moves each platform towards the end it's heading for, pausing there before coming back. Riders are carried by the physics. */
  private updateMovers(delta: number): void {
    for (const m of this.movers) {
      const body = m.image.body as Phaser.Physics.Arcade.Body;
      if (m.pause > 0) {
        m.pause -= delta;
        body.setVelocity(0, 0);
      } else {
        const target = m.dir > 0 ? m.to : m.from;
        const dx = target.x - m.image.x;
        const dy = target.y - m.image.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= (m.speed * delta) / 1000 + 0.5) {
          body.reset(target.x, target.y);
          m.dir = m.dir > 0 ? -1 : 1;
          m.pause = MOVER_PAUSE;
        } else {
          body.setVelocity((dx / dist) * m.speed, (dy / dist) * m.speed);
        }
      }
      if (m.ropes) {
        const { graphics, top } = m.ropes;
        const x = Math.round(m.image.x);
        const y = Math.round(m.image.y);
        graphics.clear().fillStyle(SHADES.woodPale).fillRect(x + 2, top, 1, y - top).fillRect(x + m.width - 3, top, 1, y - top);
      }
    }
  }

  /**
   * People following you (the girl in the back routes, the escort) walk the path you took, a little way
   * behind: up the stairs a step at a time, along the ledges, over the gaps you jumped (designer: they
   * flew straight up to your level). Close by on the same level, they just stand and wait.
   */
  private updateFollowers(delta: number): void {
    if (!this.player.body.enable) return; // e.g. rising up the tube: they stay where they are
    const { x, y } = this.player.feet;
    for (const entry of this.people.values()) {
      if (!entry.person.follow || !entry.image.visible || entry.scripted) continue;
      const img = entry.image;
      let trail = entry.trail;
      const last = trail?.[trail.length - 1];
      // A fresh start: just arrived, or you were thrown back, or you're right beside them.
      if (!trail || !last || Math.hypot(x - last.x, y - last.y) > 40 || (Math.abs(img.y - y) <= 2 && Math.abs(img.x - x) <= 20)) {
        trail = entry.trail = [{ x: img.x, y: img.y, d: 0 }];
        entry.along = 0;
      }
      const end = trail[trail.length - 1]!;
      const moved = Math.hypot(x - end.x, y - end.y);
      if (moved >= 2) trail.push({ x, y, d: end.d + moved });
      const total = trail[trail.length - 1]!.d;
      const gap = total - FOLLOW_GAP - (entry.along ?? 0);
      if (gap <= 0) {
        img.setFlipX(x < img.x);
        if (entry.walking) img.setTexture(entry.idleKeys[0]!);
        entry.walking = false;
        continue;
      }
      // A little quicker than you when they've fallen behind.
      entry.along = (entry.along ?? 0) + Math.min(gap, (gap > 40 ? 150 : 95) * (delta / 1000));
      const at = pointAlong(trail, entry.along);
      if (Math.abs(at.x - img.x) > 0.2) img.setFlipX(at.x < img.x);
      // Their walk frames (if they have any), a step every few pixels.
      if (entry.walkKeys.length) {
        entry.walking = true;
        img.setTexture(entry.walkKeys[Math.floor(entry.along / 5) % entry.walkKeys.length]!);
      }
      img.setPosition(at.x, at.y);
      // Forget the path they've already walked.
      while (trail.length > 2 && trail[1]!.d < entry.along) trail.shift();
    }
  }

  /** Rotten boards: once stood on, they shake, then give way, then grow back. */
  private updateCrumbles(delta: number): void {
    const { x, y } = this.player.feet;
    for (const c of this.crumbles) {
      const body = c.zone.body as Phaser.Physics.Arcade.StaticBody;
      if (!body.enable) continue;
      if (c.steadyIf && getSession(this).story.getVariable(c.steadyIf)) continue;
      if (c.standing === null && this.player.onGround && Math.abs(y - c.y) <= 1 && x >= c.x && x <= c.x + c.width) c.standing = 0;
      if (c.standing === null) continue;
      c.standing += delta;
      c.image.setX(c.x + (Math.random() < 0.5 ? -1 : 1));
      if (c.standing < CRUMBLE_HOLD) continue;
      body.enable = false;
      c.standing = null;
      this.soundscape.play('crack', { x: c.x + c.width / 2, y: c.y });
      this.tweens.add({ targets: c.image, y: c.y + 40, alpha: 0, duration: 600, ease: 'Quad.easeIn' });
      this.time.delayedCall(CRUMBLE_REGROW, () => {
        body.enable = true;
        c.image.setPosition(c.x, c.y).setAlpha(0);
        this.tweens.add({ targets: c.image, alpha: 1, duration: 400 });
      });
    }
  }

  /** #when: once its variable reaches 0, or its time runs out, its knot plays (after any conversation that's open). */
  private updateWaiting(delta: number): void {
    const session = getSession(this);
    const w = session.waiting;
    if (!w || this.leaving) {
      this.countdownText.setVisible(false);
      return;
    }
    if (w.left !== undefined) w.left -= delta;
    const outOfTime = w.left !== undefined && w.left <= 0;
    if (!outOfTime && Number(session.story.getVariable(w.variable)) > 0) {
      if (w.left !== undefined) {
        const text = String(Math.ceil(w.left / 1000));
        if (this.countdownText.text !== text) this.countdownText.setText(text).setX(Math.round((GAME_WIDTH - this.countdownText.width) / 2));
        this.countdownText.setVisible(true);
      }
      return;
    }
    this.countdownText.setVisible(false);
    session.waiting = null;
    const play = () => this.dialogue.open(w.knot, () => this.conversationClosed());
    if (this.dialogue.isOpen) this.afterClose.push(play);
    else play();
  }

  /** Collapsing tunnel: while you're in it, lumps keep coming down just ahead of you and behind. */
  private updateCollapses(delta: number): void {
    const { x, y } = this.player.feet;
    for (const c of this.collapses) {
      const f = c.feature;
      if (c.done || (f.showIf && !this.holds(f.showIf))) continue;
      const inside = Math.abs(y - f.y) <= 6 && x >= f.from && x <= f.to;
      if (!c.active) {
        if (!inside) continue;
        c.active = true;
        c.enteredFrom = x - f.from < f.to - x ? -1 : 1;
        c.untilNext = 0;
        this.cameras.main.shake(400, 0.004);
        this.soundscape.play('rumble');
      }
      if (!inside) {
        c.active = false;
        // Out the far side: it's settled. (Knocked back out the way you came: it starts again when you return.)
        const outFar = c.enteredFrom < 0 ? x > f.to : x < f.from;
        if (outFar) c.done = true;
        continue;
      }
      c.untilNext -= delta;
      if (c.untilNext > 0) continue;
      c.untilNext = Phaser.Math.Between(220, 380);
      const ahead = c.enteredFrom < 0 ? 1 : -1;
      const lx = Phaser.Math.Clamp(x + ahead * Phaser.Math.Between(-30, 80), f.from, f.to);
      this.dropLump(lx, f.top, f.y, 420, f.reset);
      if (Math.random() < 0.3) this.cameras.main.shake(120, 0.003);
    }
  }

  /** Beetles pace their stretch, and rush when you're close and on their level. */
  private updateBeetles(delta: number): void {
    const { x, y } = this.player.feet;
    for (const b of this.beetles) {
      const f = b.feature;
      const near = Math.abs(y - f.y) <= 4 && Math.abs(x - b.image.x) < 56;
      if (near) b.dir = x < b.image.x ? -1 : 1;
      const speed = near ? f.speed * 1.8 : f.speed;
      b.image.x += b.dir * speed * (delta / 1000);
      if (b.image.x <= f.from || b.image.x >= f.to) {
        b.image.x = Phaser.Math.Clamp(b.image.x, f.from, f.to);
        b.dir = b.image.x <= f.from ? 1 : -1;
      }
      b.image.setFlipX(b.dir < 0);
      b.step += delta;
      b.image.setTexture(b.frames[Math.floor(b.step / (near ? 90 : 160)) % b.frames.length]!);
    }
  }

  /**
   * The night watch: each watchman paces his round (or stands and turns), his lantern lighting the way
   * ahead. If you're in its light and not in a shadow, he calls out, and you're sent back to his `reset`.
   */
  private updateWatch(delta: number): void {
    if (!this.watchmen.length) return;
    const { x: px, y: py } = this.player.feet;
    const inShadow = this.inShadow();
    for (const w of this.watchmen) {
      const f = w.feature;
      const on = !f.showIf || !!this.holds(f.showIf);
      w.image.setVisible(on);
      w.lantern.setVisible(on);
      w.cone.setVisible(on);
      if (!on) continue;
      if (w.alarm !== null) {
        w.alarm -= delta;
        if (w.alarm <= 0) {
          w.alarm = null;
          w.callout.setVisible(false);
          if (f.caught && !this.dialogue.isOpen) {
            // Caught by someone who'll have it out with you there and then (the son at dawn).
            this.dialogue.open(f.caught, () => this.conversationClosed());
            continue;
          }
          this.knockBack(f.reset);
          if (f.start !== undefined) {
            // Back to the start of the scene: he walks to his post again.
            w.image.x = f.start;
            w.arrived = false;
            w.glance = 'idle';
          }
        }
      } else if (!w.arrived) {
        // Walking to his post (holding still while a conversation's open).
        if (!this.dialogue.isOpen) {
          w.dir = f.from < w.image.x ? -1 : 1;
          w.image.x += w.dir * f.speed * (delta / 1000);
          w.step += delta;
          w.image.setTexture(w.walkKeys[Math.floor(w.step / 220) % w.walkKeys.length]!);
          if (Math.abs(w.image.x - f.from) < 1) {
            w.image.x = f.from;
            w.arrived = true;
            w.dir = f.face ?? w.dir;
            w.wait = f.glance?.every ?? f.pause ?? WATCH_PAUSE;
            w.image.setTexture(w.idleKey);
          }
        }
      } else if (f.from === f.to && f.glance) {
        // Facing his usual way; now and then a tell, then a look back over his shoulder.
        const g = f.glance;
        w.wait -= this.dialogue.isOpen ? 0 : delta;
        if (w.wait <= 0) {
          if (w.glance === 'idle') {
            w.glance = 'tell';
            w.wait = 1000;
            w.callout.setText(g.tell ?? '...').setPosition(Math.round(w.image.x - w.callout.width / 2), f.y - 44).setVisible(true);
          } else if (w.glance === 'tell') {
            w.glance = 'look';
            w.wait = g.for;
            w.dir = (f.face ?? 1) > 0 ? -1 : 1;
            w.callout.setVisible(false);
          } else {
            w.glance = 'idle';
            w.wait = g.every * Phaser.Math.FloatBetween(0.8, 1.2);
            w.dir = f.face ?? 1;
            if (g.back) this.say(g.back.who, g.back.text, 2200);
          }
        }
      } else if (f.from === f.to) {
        // Standing watch: turns round now and then.
        w.wait -= delta;
        if (w.wait <= 0) {
          w.dir = w.dir > 0 ? -1 : 1;
          w.wait = f.pause ?? WATCH_PAUSE;
        }
      } else if (w.wait > 0) {
        w.wait -= delta;
        w.image.setTexture(w.idleKey);
      } else {
        w.image.x += w.dir * f.speed * (delta / 1000);
        w.step += delta;
        w.image.setTexture(w.walkKeys[Math.floor(w.step / 220) % w.walkKeys.length]!);
        if (w.image.x <= f.from || w.image.x >= f.to) {
          w.image.x = Phaser.Math.Clamp(w.image.x, f.from, f.to);
          w.dir = w.image.x <= f.from ? 1 : -1;
          w.wait = f.pause ?? WATCH_PAUSE;
        }
      }
      w.image.setFlipX(w.dir < 0);
      const lx = Math.round(w.image.x + w.dir * 6);
      const ly = f.y - 13;
      const range = w.glance === 'look' ? (f.glance?.range ?? f.range) : f.range;
      w.lantern.setPosition(lx, ly);
      // The lantern's light: a wedge spreading out ahead of him.
      w.cone.clear().fillStyle(f.who ? SHADES.white : SHADES.amber, w.alarm !== null ? 0.28 : f.who ? 0.12 : 0.13).fillTriangle(lx, ly, lx + w.dir * range, f.y - (f.see ?? WATCH_VIEW_Y), lx + w.dir * range, f.y + 2);
      w.cone.fillTriangle(lx, ly, lx + w.dir * range, f.y + 2, lx, f.y + 2);
      if (w.alarm !== null || this.dialogue.isOpen || this.leaving) continue;
      const ahead = (px - w.image.x) * w.dir;
      // Up in the air (jumping), you're in his light whatever `see` says: only standing somewhere high (a terrace) is out of it.
      const seeUp = this.player.onGround ? (f.see ?? WATCH_VIEW_Y) : WATCH_VIEW_Y;
      const seen = !inShadow && py <= f.y + 4 && f.y - py <= seeUp && ahead >= -8 && ahead <= range;
      if (seen) {
        w.alarm = 900;
        w.callout.setText(f.call ?? (f.who ? 'There you are.' : "Who's there?")).setPosition(Math.round(w.image.x - w.callout.width / 2), f.y - 44).setVisible(true);
        this.cameras.main.flash(300, 242, 180, 90);
      }
    }
  }

  /** Whether you're hidden in a dark doorway or nook (a `shadow` that's active now), or crouched behind low cover (`crouch`). */
  private inShadow(): boolean {
    const { x, y } = this.player.feet;
    return this.shadows.some((s) => (!s.showIf || this.holds(s.showIf)) && (!s.crouch || this.player.crouching) && Math.abs(y - s.y) <= 2 && x >= s.x && x <= s.x + s.width);
  }

  /**
   * The cloak: once you have it, you wear it wherever you're not expected (designer). Off at home, at
   * the evening ceremony (you stand in the ring as yourself), before the elders, at the trial and in the
   * cell. You fade a little while you're hidden in a shadow that matters.
   */
  private updateCloak(): void {
    const { story, calendar } = getSession(this);
    const sprite = this.player.sprite;
    const expected = this.area.id === 'home' || this.area.id === 'shrine-cell' || (this.area.id === 'offering-floor' && calendar.slot === 'evening') || !!story.getVariable('interrogating') || !!story.getVariable('trial');
    // (The prince: a plain coat over his own, going below: `plain_coat`.)
    this.player.cloaked = this.player.look === 'prince' ? !!story.getVariable('plain_coat') : !!story.getVariable('has_disguise') && !expected;
    const watched = this.watchmen.some((w) => w.image.visible) || this.quarries.some((q) => !q.done && !!this.holds(q.feature.showIf));
    const hidden = watched && this.inShadow();
    sprite.setAlpha(hidden ? 0.45 : 1);
    this.shadowGraphics?.setVisible(this.shadows.some((s) => !s.showIf || this.holds(s.showIf)));
  }

  /**
   * Tailing someone: they walk their path, stop, and at some stops turn round to look. If they see you
   * (you're in front of them, too close, or behind them within range while they look, and not in a
   * shadow), or you fall too far behind, you're sent back and they start again. At the end they slip
   * away, and the ink variable `done` is set.
   */
  private updateQuarries(delta: number): void {
    const { story } = getSession(this);
    const { x: px, y: py } = this.player.feet;
    for (const q of this.quarries) {
      const f = q.feature;
      if (q.done || !this.holds(f.showIf)) continue;
      const entries = f.people.map((id) => this.people.get(id)).filter((e): e is PersonEntry => !!e);
      const leader = entries[0];
      if (!leader) continue;
      const place = (x: number) => entries.forEach((e, i) => e.image.setX(x + q.offsets[i]!));
      if (q.alarm !== null) {
        q.alarm -= delta;
        if (q.alarm <= 0) {
          q.alarm = null;
          q.callout.setVisible(false);
          this.knockBack(f.reset);
          place(f.path[0]!.x);
          q.next = 1;
          q.wait = 1500;
          q.looking = false;
          q.turnIn = 0;
        }
        continue;
      }
      const target = f.path[q.next];
      const dir = target ? Math.sign(target.x - leader.image.x) || 1 : 1;
      if (q.turnIn > 0) {
        // About to look round: he pauses first.
        q.turnIn -= delta;
        if (q.turnIn <= 0) {
          q.looking = true;
          q.callout.setVisible(false);
        }
      } else if (q.wait > 0) {
        q.wait -= delta;
      } else if (target) {
        q.looking = false;
        const step = f.speed * (delta / 1000);
        const x = Math.abs(target.x - leader.image.x) <= step ? target.x : leader.image.x + dir * step;
        place(x);
        if (x === target.x) {
          q.wait = target.wait ?? 0;
          q.looking = false;
          q.turnIn = target.look ? QUARRY_TURN : 0;
          if (target.look) q.callout.setText('...').setPosition(Math.round(leader.image.x - 4), f.y - 46).setVisible(true);
          q.next += 1;
          if (q.next >= f.path.length) {
            // Gone: they slip away (behind the ration hatch).
            q.done = true;
            for (const e of entries) {
              e.scriptHidden = true;
              this.tweens.add({ targets: e.image, alpha: 0, duration: 500, onComplete: () => e.image.setVisible(false).setAlpha(1) });
            }
            story.setVariable(f.done, true);
            this.refreshObjective();
            continue;
          }
        }
      }
      const travel = f.path[q.next] ? Math.sign(f.path[q.next]!.x - leader.image.x) || dir : dir;
      // Facing: the way they're going, or back the way they came while they look round.
      for (const e of entries) e.image.setFlipX((q.looking ? -travel : travel) < 0);
      if (this.dialogue.isOpen || this.leaving) continue;
      const rear = entries.reduce((a, e) => ((e.image.x - a.image.x) * travel < 0 ? e : a), leader);
      const behind = (rear.image.x - px) * travel; // how far behind them you are (negative: in front)
      const nearest = Math.min(...entries.map((e) => Math.abs(e.image.x - px)));
      // Up off their level (on the post above them) they don't see you; but stay up there and you lose them.
      const level = Math.abs(py - f.y) <= 40;
      const seen = level && !this.inShadow() && (behind < -6 || nearest < 18 || (q.looking && q.wait > 0 && behind <= f.range));
      const lost = !q.looking && q.turnIn <= 0 && behind > f.lose;
      if (seen || lost) {
        q.alarm = 1000;
        q.callout
          .setText(seen ? 'Hm? Who\'s that?' : "You've lost them.")
          .setPosition(Math.round((seen ? leader.image.x : px) - 30), f.y - 46)
          .setVisible(true);
        if (seen) this.cameras.main.flash(300, 242, 180, 90);
      }
    }
  }

  /**
   * The mob: they follow the exact path you took, a little slower than you run. Wait too long (for a
   * lift, a gap) and they catch you: you're thrown back to where you came in, and they start again.
   */
  private updateMobs(delta: number): void {
    const { x: px, y: py } = this.player.feet;
    for (const m of this.mobs) {
      const on = !!this.holds(m.feature.showIf);
      for (const member of m.members) {
        member.image.setVisible(on && m.wait <= 0);
        member.torch.setVisible(on && m.wait <= 0);
      }
      if (!on || this.leaving || !m.trail.length) continue;
      if (m.alarm !== null) {
        m.alarm -= delta;
        if (m.alarm <= 0) {
          m.alarm = null;
          m.callout.setVisible(false);
          this.knockBack(this.arrival);
          this.resetMob(m);
        }
        continue;
      }
      if (this.dialogue.isOpen) continue;
      // Your path: a new point whenever you've moved a couple of px.
      const last = m.trail[m.trail.length - 1]!;
      const moved = Math.hypot(px - last.x, py - last.y);
      if (moved >= 2) m.trail.push({ x: px, y: py, d: last.d + moved });
      if (m.wait > 0) {
        m.wait -= delta;
        continue;
      }
      const end = m.trail[m.trail.length - 1]!.d;
      m.head = Math.min(end, m.head + m.feature.speed * (delta / 1000));
      m.step += delta;
      m.members.forEach((member, i) => {
        const at = this.alongTrail(m, Math.max(0, m.head - i * MOB_SPACING));
        const ahead = this.alongTrail(m, Math.max(0, m.head - i * MOB_SPACING) + 4);
        member.image.setPosition(Math.round(at.x), Math.round(at.y)).setFlipX(ahead.x < at.x);
        member.image.setTexture(member.walkKeys[Math.floor(m.step / 200 + i) % member.walkKeys.length]!);
        const dir = member.image.flipX ? -1 : 1;
        member.torch.setPosition(Math.round(at.x + dir * 5), Math.round(at.y - 27)).setAlpha(0.7 + Math.random() * 0.3);
      });
      const front = m.members[0]!.image;
      if (Math.abs(front.x - px) < MOB_REACH && Math.abs(front.y - py) < 16) {
        m.alarm = 800;
        m.callout.setText('Got it!').setPosition(Math.round(front.x - 18), Math.round(front.y - 46)).setVisible(true);
        this.cameras.main.flash(300, 242, 180, 90).shake(300, 0.008);
      }
    }
  }

  /** The point `d` px along the mob's copy of your path. */
  private alongTrail(m: Mob, d: number): { x: number; y: number } {
    return pointAlong(m.trail, d);
  }

  /** The mob starts again from where you came in. */
  private resetMob(m: Mob): void {
    m.trail = [{ ...this.arrival, d: 0 }];
    m.head = 0;
    m.wait = m.feature.delay;
    for (const member of m.members) member.image.setPosition(this.arrival.x, this.arrival.y);
  }

  /** Spots where a knot plays by itself as you reach them. */
  private updateTriggers(): void {
    if (this.dialogue.isOpen || this.leaving || !this.player.onGround) return;
    const { story } = getSession(this);
    const { x, y } = this.player.feet;
    const t = this.triggers.find((t) => Math.abs(x - t.x) <= t.reach && Math.abs(y - t.y) <= 4 && (!t.showIf || barksOn(t.showIf, (v) => story.getVariable(v))) && !(t.hideIf && barksOn(t.hideIf, (v) => story.getVariable(v))));
    if (!t) return;
    this.triggers = this.triggers.filter((other) => other !== t);
    this.dialogue.open(t.knot, () => this.conversationClosed());
  }

  /** Touching rot or a beetle knocks you back. */
  private checkHazards(): void {
    if (this.leaving) return;
    const body = this.player.body;
    const me = new Phaser.Geom.Rectangle(body.left + 1, body.top + 2, body.width - 2, body.height - 2);
    for (const h of this.hazards) {
      if (Phaser.Geom.Rectangle.Overlaps(me, h.rect())) {
        this.knockBack(h.reset);
        return;
      }
    }
  }

  /** Dust trickles from (x, top) for `warn` ms, then a lump of wood falls to floorY; if it hits you, you're knocked back to `reset`. */
  private dropLump(x: number, top: number, floorY: number, warn: number, reset: { x: number; y: number }): void {
    const dust = this.add.particles(0, 0, PIXEL, { x: { min: x - 3, max: x + 3 }, y: top, speedY: { min: 25, max: 50 }, lifespan: 600, frequency: 30, tint: [SHADES.light, SHADES.dim] }).setDepth(11);
    const size = Phaser.Math.Between(5, 8);
    // A dark patch on the floor where it's going to land.
    const mark = this.add.rectangle(x, floorY - 1, size + 4, 2, SHADES.shadow, 0.8).setDepth(7);
    this.time.delayedCall(warn, () => {
      dust.stop();
      const lump = this.add.rectangle(x, top, size, size - 1, Phaser.Math.RND.pick([SHADES.light, SHADES.woodPale])).setStrokeStyle(1, SHADES.deep).setDepth(11);
      let hit = false;
      this.tweens.add({
        targets: lump, y: floorY - 2, duration: 420, ease: 'Quad.easeIn',
        onUpdate: () => {
          const body = this.player.body;
          if (!hit && Math.abs(lump.x - body.center.x) < 4 + size / 2 && lump.y >= body.top && lump.y <= body.bottom) {
            hit = true;
            this.knockBack(reset);
          }
        },
        onComplete: () => {
          this.soundscape.play('thump', { x, y: floorY }, 0.8);
          lump.destroy();
          mark.destroy();
          dust.explode(8, x, floorY - 2);
          this.time.delayedCall(700, () => dust.destroy());
        },
      });
    });
  }

  /** Knocked back by falling rubble: a jolt, and you're back at `reset` (anyone following comes too). */
  private knockBack(reset: { x: number; y: number }): void {
    this.cameras.main.shake(200, 0.01).flash(250, 40, 28, 18);
    this.player.body.reset(reset.x, reset.y);
    // (Anyone following you comes back with you, unless the story's sent them on somewhere: #walk.)
    for (const entry of this.people.values()) if (entry.person.follow && entry.image.visible && !entry.scripted) entry.image.setPosition(reset.x - 16, reset.y);
  }

  // --- The story: who's here, what to do next, and what ink's tags ask for ---

  /** Whether a person is here now: the time of day, the story's variables, and any scripted hiding. */
  private isPresent(entry: PersonEntry): boolean {
    const { person } = entry;
    const { calendar, story } = getSession(this);
    if (entry.racing) return true;
    if (entry.scriptHidden || entry.gone) return false;
    if (person.when && !person.when.includes(calendar.slot)) return false;
    if (person.showIf && !barksOn(person.showIf, (v) => story.getVariable(v))) return false;
    if ([person.hideIf ?? []].flat().some((v) => barksOn(v, (w) => story.getVariable(w)))) return false;
    return true;
  }

  private refreshPeople(): void {
    for (const entry of this.people.values()) entry.image.setVisible(this.isPresent(entry));
    for (const s of this.storyShown) {
      const on = s.on();
      for (const o of s.objects) o.setVisible(on);
    }
  }

  /** After any conversation: run what it queued (travel, the end of the day), then refresh the scene. */
  private conversationClosed(): void {
    this.dialogueClosedFrame = this.game.loop.frame;
    this.clearInset();
    this.clearCityView();
    this.refreshPeople();
    this.refreshObjective();
    const queued = this.afterClose;
    this.afterClose = [];
    for (const run of queued) run();
  }

  private refreshObjective(): void {
    this.objective.setObjective(String(getSession(this).story.getVariable('objective') ?? ''));
  }

  /**
   * Where the marker bird goes: over the objective's person, object or door if it's in this area, or
   * over the door on the way if it's somewhere else (only through areas that are open now). The target
   * can list several places separated by ";" (e.g. the way in, then the person): one in this area wins,
   * otherwise the first one there's a way to.
   */
  /**
   * Every marker to show: the target can offer a choice of places separated by "," (your friend or the
   * thin man), each getting a bird (one, if they're through the same door). Kept on screen.
   */
  private objectivePoints(): { x: number; y: number }[] {
    const choices = String(getSession(this).story.getVariable('objective_target') ?? '').split(',');
    const points: { x: number; y: number }[] = [];
    for (const choice of choices) {
      const at = this.onScreen(this.objectivePoint(choice));
      if (at && !points.some((p) => Math.abs(p.x - at.x) < 6 && Math.abs(p.y - at.y) < 6)) points.push(at);
    }
    return points;
  }

  private objectivePoint(target: string): { x: number; y: number } | null {
    const { calendar } = getSession(this);
    const targets = target.split(';').map((t) => t.split(':') as [string, string | undefined]).filter(([a]) => a);
    // The first one here that's showing (e.g. someone you're following, then where they went).
    const here = targets.filter(([areaId]) => areaId === this.area.id);
    for (const [, thing] of here) {
      const point = this.pointAt(thing);
      if (point) return point;
    }
    if (here.length) return null;
    for (const [areaId] of targets) {
      const hop = nextHop(this.area.id, areaId, AREAS, (id) => closedReason(id, calendar.day, calendar.slot) === null);
      const exit = this.area.exits.find((e) => e.to === hop);
      if (exit) return { x: exit.x, y: exit.y - 42 };
    }
    return null;
  }

  /** Keeps the marker on screen: something off to one side is shown at the edge, in its direction. */
  private onScreen(at: { x: number; y: number } | null): { x: number; y: number } | null {
    if (!at) return null;
    const view = this.cameras.main.worldView;
    return { x: Phaser.Math.Clamp(at.x, view.x + 12, view.right - 12), y: Phaser.Math.Clamp(at.y, view.y + 24, view.bottom - 8) };
  }

  /** Over a person, object or door in this area (`dig-spot`: wherever the dog is digging, if it is). */
  private pointAt(thing: string | undefined): { x: number; y: number } | null {
    if (thing === 'dig-spot') return this.seekSpot ? { x: this.seekSpot.x, y: this.seekSpot.y - 26 } : null;
    const entry = thing ? this.people.get(thing) : undefined;
    if (entry) return entry.image.visible ? { x: entry.image.x, y: entry.image.y - entry.image.height - 5 } : null;
    const it = this.area.interactables.find((i) => i.id === thing);
    if (it) return { x: it.x, y: it.y - 30 };
    const exit = this.area.exits.find((e) => e.id === thing);
    if (exit) return { x: exit.x, y: exit.y - 42 };
    return null;
  }

  /** Shy people slip away when you come close. */
  private updateShyPeople(): void {
    for (const entry of this.people.values()) {
      const { shy } = entry.person;
      if (!shy || entry.gone || !entry.image.visible) continue;
      if (Math.abs(this.player.feet.x - entry.image.x) < shy) {
        entry.gone = true;
        this.tweens.add({ targets: entry.image, alpha: 0, duration: 500, onComplete: () => entry.image.setVisible(false).setAlpha(1) });
      }
    }
  }

  /** Tutorial hints: shown at the top of the screen while the player is in a hint's zone. */
  private updateHints(): void {
    const { x, y } = this.player.feet;
    const hint = this.dialogue.isOpen ? undefined : this.hints.find((h) => Math.abs(x - h.x) <= h.reach && Math.abs(y - h.y) <= 40 && (!h.showIf || this.holds(h.showIf)));
    if (!hint) {
      this.hintText.setVisible(false);
      this.hintPlate.setVisible(false);
      return;
    }
    if (this.hintText.text !== hint.text) this.hintText.setText(hint.text);
    this.hintText.setPosition(Math.round((GAME_WIDTH - this.hintText.width) / 2), 18).setVisible(true);
    this.hintPlate.setPosition(this.hintText.x - 4, 15).setSize(this.hintText.width + 8, this.hintText.height + 6).setVisible(true);
  }

  /**
   * Acts on a line's tags as it's shown:
   *   #time:<slot>            the day moves on (morning → afternoon → evening → night)
   *   #show:<id> #hide:<id>   bring a person on, or take them off
   *   #move:<id>:<x>[:<y>]    walk a person somewhere
   *   #flash:<cyan|white|dark>  a flash of light (or of darkness)
   *   #inset:<id>             show a small carving up close until the next line
   *   #lights:<x>:<top>:<bottom>  lights rise up the tube
   *   #card:<text>            a title card
   *   #goto:<area>[:<x>:<y>[:<knot>]]  after the conversation, go there (optionally to a spot, playing a knot)
   *   #beside:<id>:<dx>       someone there beside you, dx px away, facing you
   *   #endday[:<card>]        after the conversation, the day ends (the card shows on the next morning)
   *   #wake:<area>:<x>:<y>[:<knot>]  the next morning starts there instead of in your bed (with #endday)
   *   #shake                  the screen shakes
   *   #recoil                 the crowd steps back from you
   *   #decode:<message>[:<knot>]  after the conversation, the decoding screen; then the knot plays
   *   #dim:on / #dim:off      the room darkens around the conversation, or lightens again
   *   #throw                  something is thrown at you from the crowd
   *   #carve:<knot>           after the conversation, the carving close-up plays the knot
   *   #when:<variable>:<knot>[:<seconds>]  once the variable reaches 0 (e.g. everything hidden), or the time runs out, the knot plays
   *   #ending:<id>            after the conversation, an ending (e.g. loyal)
   *   #fight:<knot>[:<then>]  after the conversation, the fight close-up plays the knot; back here, <then> plays
   *   #combat:<encounter>[:<then>]  after the conversation, a turn-based fight (src/data/combat.ts); its outcome is written to ink, and back here, <then> plays
   *   #view                   the city close up above the dialogue box, as through your telescope (kept up on each line tagged with it)
   *   #repaint                the room is painted again, as the story now has it (a district's power going off)
   *   #wartable:<scenario>     after the conversation, the war table (src/data/warTable.ts); back here, its `after` knot plays
   *   #walk:<id>:<x>[:<speed>]  they walk to x on their floor and stay there, facing you
   *   #turn                   the crowd turns its back on you
   *   #rise                   you're taken up into the tube: you lift off the floor and rise out of sight
   *   #daylight:<x>:<top>:<floor>  daylight breaks in through the wall at (x, top), a shaft down to the floor
   */
  private handleTags(tags: string[]): void {
    // Who's here follows the story line by line (a variable set just before a line brings people on or takes them off).
    this.refreshPeople();
    this.clearInset();
    if (!tags.includes('view')) this.clearCityView();
    const { calendar } = getSession(this);
    for (const tag of tags) {
      const [name, ...args] = tag.split(':').map((a) => a.trim());
      const entry = args[0] ? this.people.get(args[0]) : undefined;
      switch (name) {
        case 'time':
          calendar.advanceTo(args[0] as typeof calendar.slot);
          this.events.emit('calendar-changed');
          break;
        case 'show':
        case 'hide':
          if (entry) {
            entry.scriptHidden = name === 'hide';
            entry.image.setVisible(this.isPresent(entry));
          }
          break;
        case 'move':
          if (entry) {
            const x = Number(args[1]);
            const y = args[2] !== undefined ? Number(args[2]) : entry.image.y;
            entry.image.setFlipX(x < entry.image.x);
            const duration = (Math.hypot(x - entry.image.x, y - entry.image.y) / 26) * 1000;
            this.tweens.add({ targets: entry.image, x, y, duration });
          }
          break;
        case 'beside':
          // #beside:<id>:<dx>[:walk]: they're there, dx px from you (wherever you are), facing you; with
          // `walk`, they walk over to there instead.
          if (entry) {
            // (Someone following you carries on following from there.)
            if (!entry.person.follow) entry.scripted = true;
            const x = Phaser.Math.Clamp(this.player.feet.x + Number(args[1] ?? 16), 8, this.area.width - 8);
            if (args[2] === 'walk') this.walkTo(entry, x, 30, () => entry.image.setFlipX(x > this.player.feet.x));
            else entry.image.setPosition(x, this.player.feet.y).setFlipX(x > this.player.feet.x);
          }
          break;
        case 'leave':
          // #leave:<id>:<x>[:<speed>]: they go (run, at a speed above 50) to x on their floor, and are gone.
          // (They finish walking off even if the story stops showing them meanwhile: nobody vanishes mid-stride.)
          if (entry) {
            entry.scripted = true;
            entry.racing = true;
            entry.image.setVisible(true);
            this.walkTo(entry, Number(args[1]), Number(args[2] ?? 70), () => {
              entry.racing = false;
              entry.scriptHidden = true;
              entry.image.setVisible(false);
            });
          }
          break;
        case 'walk':
          // #walk:<id>:<x>[:<speed>]: they walk to x on their floor and stay there, turning back to face you.
          if (entry) {
            entry.scripted = true;
            entry.image.setVisible(true);
            this.walkTo(entry, Number(args[1]), Number(args[2] ?? 40), () => entry.image.setFlipX(this.player.feet.x < entry.image.x));
          }
          break;
        case 'bark': {
          // #bark:<id>:<words>[:<sound>]: words over their head (a dog's growl), and a sound if given.
          // (Someone keeping watch, by the watch's `id`, too.)
          const [, words, sound] = args;
          const at = entry ? { x: entry.image.x, y: entry.image.y - entry.image.height } : this.speakerAt(args[0] ?? '');
          if (at && words) {
            this.floatText(words, at.x, entry ? at.y - 12 : at.y - 38, SHADES.white);
            if (sound && (SOUND_IDS as readonly string[]).includes(sound)) this.soundscape.play(sound as SoundId);
          }
          break;
        }
        case 'face': {
          // #face:<id>:<other id or x>: they turn to face someone (or a spot).
          const other = args[1] ? this.people.get(args[1]) : undefined;
          const x = other ? other.image.x : Number(args[1]);
          if (entry && !Number.isNaN(x)) entry.image.setFlipX(x < entry.image.x);
          break;
        }
        case 'route': {
          // #route:<id>:<route>[:<speed>][:leave]: they go along one of the area's routes (walking, and
          // jumping or dropping between levels), and with `leave`, are gone at the end of it.
          const points = this.area.routes?.[args[1] ?? ''];
          if (entry && points) {
            entry.scripted = true;
            entry.racing = true;
            entry.image.setVisible(true);
            this.travelRoute(entry, points, Number(args[2] || 80), () => {
              entry.racing = false;
              if (args[3] === 'leave') entry.scriptHidden = true;
              this.refreshPeople();
            });
          }
          break;
        }
        case 'hop':
          // #hop:<id>:<x>:<y>[:<x>:<y>...]: they jump from point to point (ledge to ledge), then the scene
          // settles (so if the story has hidden them meanwhile, they go once they land).
          if (entry) this.hopAlong(entry, args.slice(1).map(Number));
          break;
        case 'flash': {
          // dark: the light goes out for a moment and slowly comes back.
          const [r, g, b] = args[0] === 'cyan' ? [174, 246, 247] : args[0] === 'dark' ? [0, 0, 0] : [244, 241, 232];
          this.cameras.main.flash(args[0] === 'dark' ? 1600 : 700, r, g, b);
          // cyan: the offerings rushing up the tube, or the blessings coming down; white: a bright shimmer; dark: a boom.
          this.soundscape.play(args[0] === 'cyan' ? 'rush' : args[0] === 'dark' ? 'boom' : 'shimmer');
          break;
        }
        case 'inset':
          this.showInset(args[0] ?? '');
          break;
        case 'lights':
          this.riseLights(Number(args[0]), Number(args[1]), Number(args[2]));
          break;
        case 'card':
          this.showCard(args.join(':'));
          break;
        case 'goto': {
          const [areaId, x, y, knot] = args;
          if (areaId) this.afterClose.push(() => this.goTo(areaId, { start: x && y ? { x: Number(x), y: Number(y) } : undefined, script: knot || undefined }));
          break;
        }
        case 'endday':
          this.afterClose.push(() => this.endDay(args.join(':') || undefined));
          break;
        case 'wake': {
          const [areaId, x, y, knot] = args;
          if (areaId) this.wakeAt = { areaId, start: { x: Number(x), y: Number(y) }, script: knot || undefined };
          break;
        }
        case 'shake':
          this.cameras.main.shake(260, 0.006);
          this.soundscape.play('thump', undefined, 0.7);
          break;
        case 'recoil':
          this.recoil();
          this.soundscape.play('gasp');
          this.soundscape.play('shuffle');
          break;
        case 'throw':
          this.throwAtPlayer();
          this.soundscape.play('whoosh');
          this.time.delayedCall(280, () => this.soundscape.play('hit')); // and it lands
          break;
        case 'sound':
          // A sound for a moment in the story (a knock at the door): any one-off sound by name, or
          // several in turn (#sound:pound:crash), a moment apart.
          args.forEach((id, i) => this.time.delayedCall(i * 600, () => this.soundscape.play(id as SoundId)));
          break;
        case 'carve': {
          const knot = args[0];
          const start = { ...this.player.feet };
          if (knot) this.afterClose.push(() => this.leaveFor('Carve', { knot, back: { areaId: this.area.id, start } } satisfies CarveSceneData));
          break;
        }
        case 'fight': {
          const [knot, then] = args;
          const start = { ...this.player.feet };
          if (knot) this.afterClose.push(() => this.leaveFor('Fight', { knot, back: { areaId: this.area.id, start, script: then || undefined } } satisfies StepSceneData));
          break;
        }
        case 'combat': {
          const [encounter, then] = args;
          const start = { ...this.player.feet };
          if (encounter) this.afterClose.push(() => this.leaveFor('Combat', { encounter, back: { areaId: this.area.id, start, script: then || undefined } } satisfies CombatSceneData));
          break;
        }
        case 'view':
          this.showCityView();
          break;
        case 'repaint':
          // #repaint: the room is painted again (a district's lights going out, seen from up here).
          if (this.area.outdoor) this.paintOutdoor();
          else this.paintRoom();
          break;
        case 'wartable': {
          // #wartable:<scenario>: after the conversation, the war table (src/scenes/WarTableScene.ts); back here, the scenario's `after` knot plays.
          const start = { ...this.player.feet };
          // (A riot, Day 4: the riot's own table, src/scenes/RiotTableScene.ts; it comes out in the riot's square.)
          if (args[0] && RIOTS[args[0]]) this.afterClose.push(() => this.leaveFor('RiotTable', { scenario: args[0]!, back: { areaId: this.area.id, start } } satisfies RiotTableSceneData, 900));
          else if (args[0]) this.afterClose.push(() => this.leaveFor('WarTable', { scenario: args[0]!, back: { areaId: this.area.id, start } } satisfies WarTableSceneData, 900));
          break;
        }
        case 'turn':
          this.turnAway();
          this.soundscape.play('shuffle');
          break;
        case 'rise':
          this.riseUp();
          this.soundscape.play('rise');
          break;
        case 'daylight':
          this.breakDaylight(Number(args[0]), Number(args[1]), Number(args[2]));
          // The first sound from outside: real wind.
          this.soundscape.play('shimmer', undefined, 0.6);
          this.soundscape.addLayer({ sound: 'wind', volume: 0.7 });
          break;
        case 'when': {
          // The clock (if any) starts once the conversation closes, so it isn't running while you read.
          const [variable, knot, seconds] = args;
          if (variable && knot) this.afterClose.push(() => (getSession(this).waiting = { variable, knot, left: seconds ? Number(seconds) * 1000 : undefined }));
          break;
        }
        case 'ending':
          if (args[0]) this.afterClose.push(() => this.leaveFor('Ending', { ending: args[0]! } satisfies EndingSceneData, 1500));
          break;
        case 'sleep':
          // #sleep:on: the screen goes black (you fall asleep; the lines go on in the dark); #sleep:off: you wake.
          this.tweens.add({ targets: this.dimmer, alpha: args[0] === 'off' ? 0 : 1, duration: args[0] === 'off' ? 500 : 1800 });
          break;
        case 'dim':
          this.tweens.add({ targets: this.dimmer, alpha: args[0] === 'off' ? 0 : 0.75, duration: 900 });
          // The big choices: a sting, then your heartbeat until it's made.
          this.soundscape.setTension(args[0] !== 'off');
          duckScore(this, args[0] !== 'off');
          break;
        case 'decode': {
          const [message, then] = args;
          if (message) this.afterClose.push(() => this.openDecode({ message, then: then || undefined }));
          break;
        }
      }
    }
  }

  /** Someone goes along a list of points: walking along a level, jumping up or dropping down between levels. */
  private travelRoute(entry: PersonEntry, points: { x: number; y: number }[], speed: number, then?: () => void): void {
    const next = (i: number) => {
      const to = points[i];
      if (!to) return then?.();
      this.stepTo(entry, to, speed, () => next(i + 1));
    };
    next(0);
  }

  /** One step of a route: a walk if it's on their level, otherwise a jump up or a drop down. */
  private stepTo(entry: PersonEntry, to: { x: number; y: number }, speed: number, then: () => void): void {
    const img = entry.image;
    if (Math.abs(to.y - img.y) <= 2) {
      if (Math.abs(to.x - img.x) < 1) return then();
      this.walkTo(entry, to.x, speed, to.y, then);
      return;
    }
    const from = { x: img.x, y: img.y };
    const up = from.y - to.y;
    // A jump goes up and over; a drop is a little hop off the edge, then falling.
    const height = up > 0 ? 10 + up * 0.35 : 6;
    img.setFlipX(to.x < from.x);
    img.setTexture(entry.walkKeys[1] ?? entry.idleKeys[0]!);
    const arc = { t: 0 };
    this.tweens.add({
      targets: arc, t: 1, duration: 260 + Math.abs(up) * 5 + Math.abs(to.x - from.x) * 2,
      ease: up > 0 ? 'Sine.easeOut' : 'Quad.easeIn',
      onUpdate: () => img.setPosition(Phaser.Math.Linear(from.x, to.x, arc.t), Phaser.Math.Linear(from.y, to.y, up > 0 ? Math.sqrt(arc.t) : arc.t * arc.t) - Math.sin(Math.PI * arc.t) * height),
      onComplete: () => {
        img.setPosition(to.x, to.y).setTexture(entry.idleKeys[0]!);
        this.time.delayedCall(90, then);
      },
    });
  }

  /**
   * Someone leading you (the dog on the scout's scent, designer: actually follow it): they go on a point
   * at a time while you keep up, sniffing as they go, and wait for you, looking back and barking now and
   * then, when you don't.
   */
  private updateLeads(delta: number): void {
    const { x, y } = this.player.feet;
    for (const lead of this.leads) {
      const entry = this.people.get(lead.feature.person);
      const route = this.area.routes?.[lead.feature.route];
      if (!entry || !route || !entry.image.visible || lead.moving || this.dialogue.isOpen) continue;
      const img = entry.image;
      const near = Math.abs(x - img.x) <= lead.feature.near && Math.abs(y - img.y) <= 60;
      if (near && lead.index < route.length - 1) {
        lead.moving = true;
        lead.idle = 0;
        const to = route[++lead.index]!;
        this.stepTo(entry, to, 100, () => {
          lead.moving = false;
          const ahead = route[lead.index + 1];
          if (ahead) img.setFlipX(ahead.x < img.x);
          if (Math.random() < 0.35) this.floatText(Math.random() < 0.5 ? 'sniff' : 'sniff sniff', img.x, img.y - img.height - 12, SHADES.white);
        });
        continue;
      }
      if (near) continue;
      img.setFlipX(x < img.x);
      lead.idle += delta;
      if (lead.idle > 3200) {
        lead.idle = 0;
        this.floatText('Woof!', img.x, img.y - img.height - 12, SHADES.white);
        this.soundscape.play('bark', { x: img.x, y: img.y });
      }
    }
  }

  /** Jumps someone through a list of points (x, y pairs), one arc each, then refreshes who's present. */
  private hopAlong(entry: PersonEntry, coords: number[]): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i + 1 < coords.length; i += 2) points.push({ x: coords[i]!, y: coords[i + 1]! });
    entry.racing = true;
    entry.image.setVisible(true);
    const next = (i: number) => {
      const to = points[i];
      if (!to) {
        entry.racing = false;
        this.refreshPeople();
        return;
      }
      const from = { x: entry.image.x, y: entry.image.y };
      const height = 14 + Math.max(0, from.y - to.y) * 0.5;
      entry.image.setFlipX(to.x < from.x);
      const arc = { t: 0 };
      this.tweens.add({
        targets: arc, t: 1, duration: 380 + Math.abs(to.x - from.x) * 1.5,
        onUpdate: () => entry.image.setPosition(Phaser.Math.Linear(from.x, to.x, arc.t), Phaser.Math.Linear(from.y, to.y, arc.t) - Math.sin(Math.PI * arc.t) * height),
        onComplete: () => this.time.delayedCall(120, () => next(i + 1)),
      });
    };
    next(0);
  }

  private showInset(id: string): void {
    const sprite = INSETS[id];
    if (!sprite) return;
    const key = makeSpriteTexture(this, `inset-${id}`, sprite.rows, sprite.colours);
    const w = sprite.rows[0]!.length * 3;
    const frame = this.add.rectangle(0, 0, w + 6, sprite.rows.length * 3 + 6, SHADES.shadow).setOrigin(0.5);
    const image = this.add.image(0, 0, key).setScale(3);
    this.inset = this.add.container(GAME_WIDTH / 2, 70, [frame, image]).setScrollFactor(0).setDepth(27).setAlpha(0);
    this.tweens.add({ targets: this.inset, alpha: 1, duration: 400 });
  }

  private clearInset(): void {
    this.inset?.destroy();
    this.inset = null;
  }

  /**
   * `#view`: the city close up, as through your telescope (Chapter 3: watching a district go dark), framed
   * above the dialogue box. Repainted on every line it's on, so you see each change; gone when a line
   * without it comes, or the conversation ends.
   */
  private showCityView(): void {
    const { calendar } = getSession(this);
    const power = this.power();
    const [w, h] = [300, 96];
    makePaintedTexture(this, 'city-view-close', w, h, cityViewPainter({ x: 0, y: 0, width: w, height: h, horizon: 10, treeX: 262, treeScale: 0.12 }, calendar.slot, power.views, power.fade, power.also));
    if (this.cityView) {
      this.cityView.image.setTexture('city-view-close');
      return;
    }
    const frame = this.add.rectangle(0, 0, w + 6, h + 6, SHADES.shadow).setStrokeStyle(1, SHADES.amberDeep).setOrigin(0.5);
    const image = this.add.image(0, 0, 'city-view-close');
    const container = this.add.container(GAME_WIDTH / 2, 16 + h / 2, [frame, image]).setScrollFactor(0).setDepth(27).setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 500 });
    this.cityView = { container, image };
  }

  private clearCityView(): void {
    this.cityView?.container.destroy();
    this.cityView = null;
  }

  /** Lights rising one after another up the tube (the Ascension lights). */
  private riseLights(x: number, top: number, bottom: number): void {
    for (let i = 0; i < 14; i++) {
      this.time.delayedCall(i * 380, () => {
        // Amber, so they show against the tube's white-hot core.
        const light = this.add.rectangle(x + Phaser.Math.Between(-2, 2), bottom, 3, 3, SHADES.amber).setDepth(9);
        this.tweens.add({ targets: light, y: top, duration: 3200, ease: 'Sine.easeIn', onComplete: () => light.destroy() });
      });
    }
  }

  /** The crowd steps back from you: everyone here but the Tender and Mum, as far as the walls allow. */
  private recoil(): void {
    const px = this.player.feet.x;
    for (const [id, entry] of this.people) {
      if (!entry.image.visible || entry.person.wander || id === 'tender' || id.startsWith('mum')) continue;
      const dir = entry.image.x < px ? -1 : 1;
      const x = Phaser.Math.Clamp(entry.image.x + dir * Phaser.Math.Between(20, 40), 20, this.area.width - 20);
      // They back away still facing you, too frightened to turn their backs.
      entry.image.setFlipX(dir > 0);
      this.tweens.add({ targets: entry.image, x, duration: 450, ease: 'Quad.easeOut', delay: Phaser.Math.Between(0, 200) });
    }
  }

  /** Into the tube: you lift off the floor, slowly at first, then faster, rising out of sight. */
  private riseUp(): void {
    const sprite = this.player.sprite;
    this.player.body.enable = false;
    this.cameras.main.stopFollow();
    this.tweens.chain({
      targets: sprite,
      tweens: [
        { y: sprite.y - 6, duration: 900, ease: 'Sine.easeOut' },
        { y: sprite.y - 320, alpha: 0.2, duration: 2200, ease: 'Quad.easeIn' },
      ],
    });
    this.cameras.main.shake(2400, 0.003);
  }

  /** Daylight breaking in: a bright crack in the wall, and a dusty shaft spreading down from it to the floor. */
  private breakDaylight(x: number, top: number, floor: number): void {
    const g = this.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    // Layers of pale light, narrow at the crack and wide where it lands, brightest in the middle.
    for (let i = 0; i < 7; i++) {
      const spread = 30 + i * 22;
      g.fillStyle(SHADES.white, 0.09).fillTriangle(x, top - 6, x, top + 14, x - spread * 2, floor);
      g.fillTriangle(x, top + 14, x - spread * 2, floor, x - spread * 0.4, floor);
    }
    g.fillStyle(SHADES.white, 0.16).fillEllipse(x - 130, floor - 2, 260, 12); // where it lands
    g.fillStyle(SHADES.white, 1).fillRect(x - 2, top - 6, 4, 20); // the crack itself
    this.tweens.add({ targets: g, alpha: 1, duration: 2500, ease: 'Sine.easeOut' });
    // Dust turning slowly in the light.
    this.add.particles(0, 0, PIXEL, {
      emitZone: { type: 'random', source: { getRandomPoint: (p) => { const t = Math.random(); p.x = x - t * 120 * Math.random() - t * 20; p.y = top + t * (floor - top); } } },
      speedX: { min: -4, max: 4 }, speedY: { min: -3, max: 3 }, lifespan: 3000, frequency: 90, tint: SHADES.white, alpha: { start: 0.9, end: 0 },
    }).setDepth(12);
  }

  /** The crowd turns its back on you, all at once. */
  private turnAway(): void {
    const px = this.player.feet.x;
    for (const [id, entry] of this.people) {
      if (!entry.image.visible || !id.startsWith('crowd')) continue;
      // Sprites face right; someone to your left faces left to turn away.
      entry.image.setFlipX(entry.image.x < px);
    }
  }

  /** Something thrown from the crowd: it arcs from someone near the back and hits you. */
  private throwAtPlayer(): void {
    const throwers = [...this.people.values()].filter((e) => e.image.visible && e.person.id.startsWith('crowd'));
    const from = throwers.length ? throwers[Math.floor(Math.random() * throwers.length)]!.image : { x: this.player.feet.x + 120, y: this.player.feet.y };
    const to = { x: this.player.feet.x, y: this.player.feet.y - 18 };
    const lump = this.add.rectangle(from.x, from.y - 20, 3, 3, SHADES.greenMid).setDepth(12);
    const arc = { t: 0 };
    this.tweens.add({
      targets: arc, t: 1, duration: 420,
      onUpdate: () => lump.setPosition(from.x + (to.x - from.x) * arc.t, from.y - 20 + (to.y - from.y + 20) * arc.t - Math.sin(arc.t * Math.PI) * 30),
      onComplete: () => lump.destroy(),
    });
  }

  /** Fades out and hands over to another scene (the carving, an ending). */
  private leaveFor(scene: string, data: object, fade = 500): void {
    this.leaving = true;
    this.cameras.main.fadeOut(fade, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene, data));
  }

  /** Opens the decoding screen over this area (paused); it resumes the area when the plate is put down. */
  private openDecode(data: DecodeSceneData): void {
    this.scene.pause();
    this.scene.launch('Decode', data);
  }

  /** The end of the day: on to the next morning, waking in bed (or wherever #wake said), with a card (days not built yet say so). */
  private endDay(card?: string): void {
    const { calendar } = getSession(this);
    const next = calendar.day === 'prologue' ? 1 : Math.min(DAYS[DAYS.length - 1] as number, calendar.day + 1);
    const wake = this.wakeAt ?? undefined;
    this.leaving = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      calendar.jumpTo(next as typeof calendar.day);
      // Remember how each day began, so an ending can send you back to it.
      getSession(this).dayStarts[next] = { ink: getSession(this).story.saveState(), calendar: calendar.toJSON(), wake };
      const text = card ?? `Day ${next} (not built yet)`;
      this.scene.restart((wake ? { ...wake, card: text } : { areaId: 'home', start: this.area.id === 'home' ? { x: 50, y: 150 } : undefined, card: text }) satisfies AreaSceneData);
    });
  }

  /** Fades a title card in over the middle of the screen, holds it, then fades it away. */
  private showCard(text: string): void {
    const card = new PixelText(this, 0, 0, text, { color: SHADES.white, shadow: SHADES.shadow }).setScrollFactor(0).setDepth(30).setAlpha(0);
    card.setPosition(Math.round((GAME_WIDTH - card.width) / 2), 96);
    this.tweens.chain({
      targets: card,
      tweens: [
        { alpha: 1, duration: 900, delay: 400, ease: 'Sine.easeOut' },
        { alpha: 0, duration: 900, delay: 2200, ease: 'Sine.easeIn' },
      ],
      onComplete: () => card.destroy(),
    });
  }

  /** Walks the player up low one-way ledges (stairs) instead of making them jump each one. */
  private stepUp(): void {
    const body = this.player.body;
    if (!body.blocked.down || body.velocity.x === 0 || this.player.dropping) return;
    const right = body.velocity.x > 0;
    const ahead = right ? body.right + 1 : body.left - 1;
    // The edge of a ledge you'd walk into: its left side going right, its right side going left.
    const edgeOf = (s: { x: number; width: number }) => (right ? s.x : s.x + s.width);
    const ledges = this.area.solids.filter((s) => s.oneWay);
    for (const s of ledges) {
      const rise = Math.round(body.bottom) - s.y;
      if (rise < 1 || rise > MAX_STEP || ahead < s.x || ahead > s.x + s.width) continue;
      // Only from its edge, not from partway along it (walking through under a staircase).
      const edge = edgeOf(s);
      if (Math.abs(ahead - edge) > 4) continue;
      // The back of a staircase: every step's block ends at the same edge there, so walk along the bottom
      // instead of climbing (designer). Up the front, each step's edge is its own.
      if (ledges.some((o) => o !== s && o.y !== s.y && edgeOf(o) === edge)) continue;
      this.player.sprite.y -= rise;
      return;
    }
  }

  /** Using a door: go straight next door, open the map, or stay. Doors to areas that are closed today just say why. */
  private openDoorMenu(exit: Exit): void {
    const closed = () => this.conversationClosed();
    const name = AREA_NAMES[exit.to] ?? exit.to;
    const built = exit.to in AREAS;
    const { calendar } = getSession(this);
    const shut = exit.secret ? null : closedReason(exit.to, calendar.day, calendar.slot);
    const { story } = getSession(this);
    const onFoot = ON_FOOT.some((v) => story.getVariable(v));
    if (shut) {
      this.dialogue.say(shut, closed);
      return;
    }
    this.dialogue.openMenu(
      'Where to?',
      [
        {
          label: built ? `Go to ${name}` : `Go to ${name} (not built yet)`,
          run: () => (built ? this.goTo(exit.to) : this.dialogue.say(`${capitalise(name)} isn't built yet.`, closed)),
        },
        // On a journey that has to be made on foot, the map isn't offered: door to door.
        ...(onFoot ? [] : [{ label: 'Open the map', run: () => this.openMap() }]),
        { label: 'Stay', run: () => {} },
      ],
      closed,
    );
  }

  /** Opens the map over this area (paused), which either travels or comes back here. */
  private openMap(): void {
    this.scene.pause();
    this.scene.launch('Map', { current: placeOf(this.area.id) } satisfies MapSceneData);
  }

  private goTo(areaId: string, extra: Omit<AreaSceneData, 'areaId' | 'from'> = {}): void {
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ areaId, from: this.area.id, ...extra } satisfies AreaSceneData);
    });
  }

  /**
   * Ground to search (`dig`): an E prompt wherever you stand on it. Most of it is picked clean; at a find
   * the thing comes up out of the dirt, then its knot plays. Each find glints faintly now and then.
   */
  private addDig(f: Extract<Feature, { type: 'dig' }>): void {
    const story = getSession(this).story;
    const on = () => !!this.holds(f.showIf);
    const scene = this;
    this.usables.push({
      fallback: true,
      get x() { return scene.player.feet.x; },
      y: f.y,
      reach: 1,
      label: 'Dig',
      enabled: () => on() && this.player.feet.x >= f.from && this.player.feet.x <= f.to,
      use: () => this.dig(f),
    });
    // A glint in the dirt over each find not yet dug: a pixel of light, now and then.
    for (const find of f.finds) {
      const glint = this.add.rectangle(find.x, f.y + 1, 1, 1, SHADES.white).setDepth(9).setAlpha(0);
      this.time.addEvent({
        delay: 2600 + Math.random() * 1800,
        loop: true,
        callback: () => {
          if (!on() || story.getVariable(find.done)) return;
          glint.setPosition(find.x + Phaser.Math.Between(-3, 3), f.y + Phaser.Math.Between(1, 3));
          this.tweens.add({ targets: glint, alpha: { from: 0, to: 1 }, scaleX: { from: 1, to: 3 }, duration: 160, yoyo: true, hold: 60 });
        },
      });
    }
  }

  /**
   * The dog finds things (`seek`): near a find on your floor, it leaves you, runs to it, and sniffs and digs
   * there until you come and dig beside it.
   */
  private addSeek(f: Extract<Feature, { type: 'seek' }>): void {
    const story = getSession(this).story;
    const on = () => !!this.holds(f.showIf);
    const state: { find: (typeof f.finds)[number] | null; ready: boolean; timer: Phaser.Time.TimerEvent | null } = { find: null, ready: false, timer: null };
    this.seeks.push(() => {
      const dog = this.people.get(f.dog);
      if (state.find && (story.getVariable(state.find.done) || !on() || !dog?.image.visible)) {
        // Found (or stopped): back to following you.
        state.timer?.remove();
        state.find = null;
        state.ready = false;
        this.seekSpot = null;
        if (dog) dog.scripted = false;
        return;
      }
      if (state.find || !on() || !dog?.image.visible || this.dialogue.isOpen) return;
      const { x, y } = this.player.feet;
      const find = f.finds.find((s) => !story.getVariable(s.done) && Math.abs(s.y - y) <= 30 && Math.abs(dog.image.y - s.y) <= 30 && Math.abs(s.x - x) <= f.range);
      if (!find) return;
      state.find = find;
      dog.scripted = true;
      this.soundscape.play('bark', undefined, 0.6);
      this.floatText('!', dog.image.x, dog.image.y - 24, SHADES.amber);
      this.walkTo(dog, find.x, 90, find.y, () => {
        state.ready = true;
        this.seekSpot = { x: find.x, y: find.y };
        // Sniffing and scrabbling at the spot, dirt flying, until you come.
        state.timer = this.time.addEvent({
          delay: 900, loop: true,
          callback: () => {
            dog.image.setFlipX(!dog.image.flipX);
            this.soundscape.play('scratch', undefined, 0.5);
            for (let n = 0; n < 3; n++) {
              const clod = this.add.rectangle(find.x, find.y - 1, 1, 1, SHADES.woodPale).setDepth(11);
              this.tweens.add({ targets: clod, x: clod.x + Phaser.Math.Between(-10, 10), y: clod.y - Phaser.Math.Between(3, 8), duration: 170, yoyo: true, onComplete: () => clod.destroy() });
            }
            if (Math.random() < 0.35) this.floatText(Math.random() < 0.5 ? 'sniff sniff' : 'Woof!', dog.image.x, dog.image.y - 24, SHADES.white);
          },
        });
      });
    });
    for (const find of f.finds) {
      this.usables.push({
        x: find.x, y: find.y, reach: 14, label: 'Dig',
        enabled: () => state.find === find && state.ready,
        use: () => {
          if (this.digBusy) return;
          this.digBusy = true;
          this.player.kneeling = true;
          this.soundscape.play('scratch', undefined, 0.6);
          this.time.delayedCall(700, () => {
            this.player.kneeling = false;
            state.timer?.remove();
            this.showFind(find.item, find.x, find.y, () => {
              this.digBusy = false;
              this.dialogue.open(find.knot, () => this.conversationClosed());
            });
          });
        },
      });
    }
  }

  /** Digging where you stand: a moment on one knee, then whatever's there. */
  private dig(f: Extract<Feature, { type: 'dig' }>): void {
    if (this.digBusy) return;
    const story = getSession(this).story;
    const { x, y } = this.player.feet;
    this.digBusy = true;
    this.player.kneeling = true;
    // Dirt thrown up behind you, three scrapes.
    const back = this.player.sprite.flipX ? 1 : -1;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 260, () => {
        this.soundscape.play('scratch', undefined, 0.6);
        for (let n = 0; n < 4; n++) {
          const clod = this.add.rectangle(x + back * 2, y - 1, 1, 1, n % 2 ? SHADES.woodPale : SHADES.dim).setDepth(11);
          this.tweens.add({ targets: clod, x: clod.x + back * Phaser.Math.Between(4, 12), y: clod.y - Phaser.Math.Between(4, 10), duration: 180, yoyo: true, ease: 'Quad.easeOut', onComplete: () => clod.destroy() });
        }
      });
    }
    this.time.delayedCall(820, () => {
      this.player.kneeling = false;
      const find = f.finds.find((s) => !story.getVariable(s.done) && Math.abs(x - s.x) <= s.reach);
      if (find) {
        this.showFind(find.item, x, y, () => {
          this.digBusy = false;
          this.dialogue.open(find.knot, () => this.conversationClosed());
        });
        return;
      }
      this.digBusy = false;
      // Nothing; but close to something, you can tell.
      const near = f.finds.some((s) => !story.getVariable(s.done) && Math.abs(x - s.x) <= s.reach + 40);
      const lines = near ? ['Something hard, close by.', 'Not here. Near, though.'] : ['Dirt.', 'Bolts.', 'Nothing.', 'A bent nail.', 'Picked clean.', 'Grit.'];
      this.floatText(lines[Math.floor(Math.random() * lines.length)]!, x, y - 30, near ? SHADES.amber : SHADES.light);
    });
  }

  /** What you dug up, coming up out of the dirt into the light over your head, with a glint and a chime. */
  private showFind(item: FindItem, x: number, y: number, then: () => void): void {
    const sprite = FIND_SPRITES[item];
    const image = this.add.image(x, y, makeSpriteTexture(this, `find-${item}`, sprite.rows, sprite.colours)).setOrigin(0.5, 1).setDepth(12);
    this.soundscape.play('chime');
    this.tweens.add({ targets: image, y: y - 34, duration: 600, ease: 'Back.easeOut' });
    // A glint: a small cross of light.
    this.time.delayedCall(560, () => {
      const h = this.add.rectangle(x, y - 40, 9, 1, SHADES.white).setDepth(13);
      const v = this.add.rectangle(x, y - 40, 1, 9, SHADES.white).setDepth(13);
      this.tweens.add({ targets: [h, v], scale: { from: 0.2, to: 1.4 }, alpha: { from: 1, to: 0 }, duration: 420, onComplete: () => [h, v].forEach((o) => o.destroy()) });
    });
    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: image, alpha: 0, duration: 300, onComplete: () => image.destroy() });
      then();
    });
  }

  /** Sliding down a long drop: slowed, crouched against the earth, dust and a scrape. */
  private updateSlides(delta: number): void {
    const { x, y } = this.player.feet;
    const body = this.player.body;
    const on = !body.blocked.down && body.velocity.y > 0 && this.slides.some((s) => x >= s.x - 4 && x <= s.x + s.width + 4 && y >= s.top && y <= s.bottom);
    if (on) {
      body.setVelocityY(Math.min(body.velocity.y, 75));
      this.slideDust -= delta;
      if (this.slideDust <= 0) {
        this.slideDust = 90;
        const puff = this.add.rectangle(x + Phaser.Math.Between(-4, 4), y - 2, 2, 2, SHADES.woodPale).setDepth(11);
        this.tweens.add({ targets: puff, y: puff.y - Phaser.Math.Between(6, 14), x: puff.x + Phaser.Math.Between(-6, 6), alpha: 0, duration: 400, onComplete: () => puff.destroy() });
        if (Math.random() < 0.3) this.soundscape.play('skid', undefined, 0.35);
      }
    }
    if (on !== this.sliding) this.player.kneeling = on;
    this.sliding = on;
  }

  /** Someone walks (or runs) along their floor to x, their walk frames playing, then `then`. */
  private walkTo(entry: PersonEntry, x: number, speed: number, yOrThen?: number | (() => void), maybeThen?: () => void): void {
    const y = typeof yOrThen === 'number' ? yOrThen : entry.image.y;
    const then = typeof yOrThen === 'function' ? yOrThen : maybeThen;
    const img = entry.image;
    img.setFlipX(x < img.x);
    entry.walking = entry.walkKeys.length > 0;
    let frame = 0;
    const step = entry.walking ? this.time.addEvent({ delay: speed > 50 ? 90 : 160, loop: true, callback: () => img.setTexture(entry.walkKeys[(frame = (frame + 1) % entry.walkKeys.length)]!) }) : null;
    this.tweens.add({
      targets: img, x, y, duration: (Math.max(Math.abs(x - img.x), Math.abs(y - img.y)) / speed) * 1000,
      onComplete: () => {
        step?.remove();
        entry.walking = false;
        img.setTexture(entry.idleKeys[0]!);
        then?.();
      },
    });
  }

  /** A word or two floating up over a spot and fading. */
  private floatText(text: string, x: number, y: number, colour: number): void {
    const t = new PixelText(this, 0, 0, text, { color: colour, shadow: SHADES.shadow }).setDepth(30);
    t.setPosition(Math.round(Phaser.Math.Clamp(x - t.width / 2, 2, this.area.width - t.width - 2)), y);
    this.tweens.add({ targets: t, y: y - 10, alpha: { from: 1, to: 0 }, duration: 1600, ease: 'Sine.easeIn', onComplete: () => t.destroy() });
  }

  private addFeature(feature: Feature): void {
    switch (feature.type) {
      case 'fire': {
        const keys = FIRE_FRAMES.map((f, i) => makeSpriteTexture(this, `fire-${i}`, f.rows, f.colours));
        const fire = this.add.image(feature.x, feature.y, keys[0]!).setOrigin(0.5, 1).setDepth(5);
        const lit = () => !feature.showIf || !!this.holds(feature.showIf);
        this.soundscape.addEmitter('fire', () => (lit() ? { x: feature.x, y: feature.y } : null), 70);
        let frame = 0;
        this.time.addEvent({ delay: 140, loop: true, callback: () => fire.setTexture(keys[(frame = (frame + 1) % keys.length)]!) });
        const sparks = this.add.particles(0, 0, PIXEL, {
          x: { min: feature.x - 3, max: feature.x + 3 },
          y: feature.y - 10,
          speedY: { min: -12, max: -6 },
          speedX: { min: -2, max: 2 },
          lifespan: 1400,
          frequency: 260,
          tint: SHADES.amber,
          alpha: { start: 1, end: 0 },
        }).setDepth(5);
        if (feature.showIf) this.storyShown.push({ objects: [fire, sparks], on: lit });
        break;
      }
      case 'smoke': {
        const on = () => !feature.showIf || !!this.holds(feature.showIf);
        const smoke = this.add.particles(0, 0, PIXEL, {
          x: { min: feature.x - 2, max: feature.x + 2 },
          y: feature.y,
          speedY: { min: -16, max: -9 },
          speedX: { min: -3, max: 3 },
          scale: { start: 1, end: 3 },
          lifespan: ((feature.y - feature.top) / 12) * 1000,
          frequency: 120,
          tint: SHADES.dim,
          alpha: { start: 0.7, end: 0 },
        }).setDepth(4);
        this.storyShown.push({ objects: [smoke], on });
        break;
      }
      case 'autodoor': {
        // It slides up into the lintel (cropped as it goes) when you come near, sticks halfway and judders.
        const key = makeSpriteTexture(this, `autodoor-${feature.x}-${feature.y}`, feature.sprite.rows, feature.sprite.colours);
        const door = this.add.image(feature.x, feature.y, key).setOrigin(0).setDepth(4);
        const h = feature.sprite.rows.length;
        const lift = { by: 0 };
        const show = () => door.setY(feature.y - Math.round(lift.by)).setCrop(0, Math.round(lift.by), door.width, h - Math.round(lift.by));
        let woken = false;
        this.time.addEvent({
          delay: 120, loop: true, callback: () => {
            if (woken || !this.player) return;
            const p = this.player.sprite;
            if (Math.abs(p.x - (feature.x + door.width / 2)) > feature.range || Math.abs(p.y - (feature.y + h)) > 30) return;
            woken = true;
            this.soundscape.play('grate', { x: feature.x, y: feature.y + h }, 0.7);
            this.tweens.add({
              targets: lift, by: h / 2, duration: 900, ease: 'Sine.easeOut', onUpdate: show,
              onComplete: () => this.tweens.add({ targets: lift, by: h / 2 - 2, duration: 70, yoyo: true, repeat: -1, repeatDelay: 1600, onUpdate: show }),
            });
          },
        });
        break;
      }
      case 'rain': {
        // Fine streaks falling slantwise across the whole area, over everything but the dialogue.
        const when = feature.when ?? ['night'];
        const drop = makeSpriteTexture(this, 'rain-drop', ['c', 'c', 'C'], { c: SHADES.cyanMid, C: SHADES.light });
        const rain = this.add.particles(0, 0, drop, {
          x: { min: -60, max: this.area.width + 20 },
          y: -8,
          speedY: { min: 290, max: 340 },
          speedX: { min: 50, max: 60 },
          lifespan: ((this.area.height + 20) / 290) * 1000,
          frequency: 12,
          quantity: Math.ceil(this.area.width / 320),
          alpha: { min: 0.35, max: 0.7 },
        }).setDepth(9);
        const on = () => when.includes(getSession(this).calendar.slot) && (!feature.showIf || !!this.holds(feature.showIf));
        this.storyShown.push({ objects: [rain], on });
        break;
      }
      case 'frames': {
        const keys = feature.frames.map((f, i) => makeSpriteTexture(this, `frames-${feature.x}-${feature.y}-${i}`, f.rows, f.colours));
        const image = this.add.image(feature.x, feature.y, keys[0]!).setOrigin(0).setDepth(3);
        let frame = 0;
        // (A place without power: its screens and signs are off.)
        const powered = () => {
          const cut = !!this.power().cut;
          return feature.power === 'any' || (feature.power === 'without' ? cut : !cut);
        };
        const shown = () => powered() && (!feature.showIf || barksOn(feature.showIf, (v) => getSession(this).story.getVariable(v)));
        image.setVisible(shown());
        this.time.addEvent({ delay: feature.every, loop: true, callback: () => image.setTexture(keys[(frame = (frame + 1) % keys.length)]!).setVisible(shown()) });
        break;
      }
      case 'pulse': {
        // Along the line at a steady speed; each one waits `every` ms at the end before setting off again.
        const pts = feature.points;
        const lengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y));
        const total = lengths.reduce((a, b) => a + b, 0);
        const at = (d: number) => {
          let left = d;
          for (let i = 0; i < lengths.length; i++) {
            if (left <= lengths[i]! || i === lengths.length - 1) {
              const t = lengths[i]! ? Math.min(1, left / lengths[i]!) : 0;
              return { x: pts[i]!.x + (pts[i + 1]!.x - pts[i]!.x) * t, y: pts[i]!.y + (pts[i + 1]!.y - pts[i]!.y) * t };
            }
            left -= lengths[i]!;
          }
          return pts[0]!;
        };
        const key = feature.sprite
          ? makeSpriteTexture(this, `pulse-${pts[0]!.x}-${pts[0]!.y}`, feature.sprite.rows, feature.sprite.colours)
          : makeSpriteTexture(this, `pulse-dot-${feature.colour ?? SHADES.cyan}`, ['cc', 'cc'], { c: feature.colour ?? SHADES.cyan });
        const shown = () => !feature.showIf || !!this.holds(feature.showIf);
        const duration = (total / feature.speed) * 1000;
        for (let n = 0; n < (feature.count ?? 1); n++) {
          const image = this.add.image(pts[0]!.x, pts[0]!.y, key).setDepth(3).setVisible(false);
          const run = { d: 0 };
          this.tweens.add({
            targets: run, d: total, duration, delay: (n * (duration + feature.every)) / (feature.count ?? 1), repeat: -1, repeatDelay: feature.every,
            onStart: () => image.setVisible(shown()),
            onRepeat: () => image.setVisible(shown()),
            onUpdate: () => {
              const p = at(run.d);
              image.setPosition(Math.round(p.x), Math.round(p.y)).setVisible(shown() && run.d < total);
            },
          });
        }
        break;
      }
      case 'swing': {
        const rope = this.add.line(0, 0, feature.x, feature.ropeTop, feature.x, feature.y, feature.ropeColour ?? SHADES.woodPale).setOrigin(0).setDepth(4);
        const key = makeSpriteTexture(this, `swing-${feature.x}-${feature.y}`, feature.sprite.rows, feature.sprite.colours);
        const item = this.add.image(feature.x, feature.y, key).setOrigin(0.5, 0).setDepth(4);
        if (!feature.quiet) this.soundscape.addEmitter('creak', () => ({ x: feature.x, y: feature.y }), 50, 0.5);
        const sway = { offset: -1 };
        this.tweens.add({
          targets: sway, offset: 1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          onUpdate: () => {
            const x = Math.round(feature.x + sway.offset);
            item.setX(x);
            rope.setTo(feature.x, feature.ropeTop, x, feature.y);
          },
        });
        break;
      }
      case 'mover': {
        const key = makeSpriteTexture(this, `mover-${feature.x}-${feature.y}`, feature.sprite.rows, feature.sprite.colours);
        const width = feature.sprite.rows[0]!.length;
        const image = this.physics.add.image(feature.x, feature.y, key).setOrigin(0).setDepth(6).setData('oneWay', true);
        const body = image.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false).setImmovable(true).setSize(width, 4, false).setOffset(0, 0);
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        const ropes = feature.ropeTop === undefined ? undefined : { graphics: this.add.graphics().setDepth(5), top: feature.ropeTop };
        this.soundscape.addEmitter('rope', () => ({ x: image.x + width / 2, y: image.y }), 90);
        this.movers.push({ image, from: { x: feature.x, y: feature.y }, to: feature.to, speed: feature.speed, dir: 1, pause: MOVER_PAUSE, width, ropes });
        break;
      }
      case 'motes': {
        // The tube hums all along its length: heard from the nearest point of it.
        this.soundscape.addEmitter('tube', () => ({ x: feature.x, y: Phaser.Math.Clamp(this.player?.feet.y ?? feature.bottom, feature.top, feature.bottom) }), 110);
        this.add.particles(0, 0, PIXEL, {
          emitZone: {
            type: 'random',
            source: {
              getRandomPoint: (p) => {
                p.x = feature.x + Phaser.Math.Between(-feature.halfWidth, feature.halfWidth);
                p.y = Phaser.Math.Between(feature.top + 20, feature.bottom);
              },
            },
          },
          speedY: { min: -14, max: -5 },
          lifespan: 6000,
          frequency: 200,
          tint: SHADES.white,
          alpha: { start: 1, end: 0 },
        }).setDepth(3);
        break;
      }
      case 'drip': {
        const drop = this.add.rectangle(feature.x, feature.y, 1, 2, SHADES.light).setOrigin(0).setDepth(4).setVisible(false);
        const fall = () => {
          drop.setPosition(feature.x, feature.y).setVisible(true);
          this.tweens.add({
            targets: drop, y: feature.floorY, duration: 700, ease: 'Quad.easeIn',
            onComplete: () => {
              drop.setVisible(false);
              this.soundscape.play('plink', { x: feature.x, y: feature.floorY }, 0.6, 90);
            },
          });
        };
        this.time.addEvent({ delay: 2600, loop: true, callback: fall });
        break;
      }
      case 'hint':
        this.hints.push(feature);
        break;
      case 'crumble': {
        const rows = [0, 1, 2].map((r) => Array.from({ length: feature.width }, (_, i) => (r === 0 ? (i % 7 === 3 ? 'd' : 'p') : (i * 5 + r * 3) % 9 === 0 ? '.' : r === 2 ? 'd' : 'w')).join(''));
        // Out in the borderland it's a cracked slab, not a rotten board.
        const colours = this.area.outdoor ? { p: SHADES.light, w: SHADES.dim, d: SHADES.deep } : { p: SHADES.woodPale, w: SHADES.woodLight, d: SHADES.deep };
        const key = makeSpriteTexture(this, `crumble-${this.area.outdoor ? 'slab-' : ''}${feature.width}`, rows, colours);
        const image = this.add.image(feature.x, feature.y, key).setOrigin(0).setDepth(6);
        const zone = this.add.zone(feature.x, feature.y, feature.width, 3).setOrigin(0).setData('oneWay', true);
        this.crumbleGroup.add(zone);
        const body = zone.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        this.crumbles.push({ x: feature.x, y: feature.y, width: feature.width, zone, image, standing: null, steadyIf: feature.steadyIf });
        break;
      }
      case 'rubble': {
        const drop = () => this.dropLump(feature.x, feature.top, feature.floorY, 800, feature.reset);
        this.time.delayedCall(Phaser.Math.Between(0, feature.every), () => {
          drop();
          this.time.addEvent({ delay: feature.every, loop: true, callback: drop });
        });
        break;
      }
      case 'collapse':
        this.collapses.push({ feature, active: false, enteredFrom: -1, done: false, untilNext: 0 });
        break;
      case 'rot': {
        // A glowing pool: bright surface, deeper green below, bubbles rising off it.
        const g = this.add.graphics().setDepth(7);
        g.fillStyle(SHADES.greenMid).fillRect(feature.x, feature.y, feature.width, feature.height);
        g.fillStyle(SHADES.green).fillRect(feature.x, feature.y, feature.width, 1);
        g.fillStyle(SHADES.greenDeep).fillRect(feature.x, feature.y + feature.height - 2, feature.width, 2);
        this.add.particles(0, 0, PIXEL, { x: { min: feature.x + 1, max: feature.x + feature.width - 1 }, y: feature.y, speedY: { min: -14, max: -6 }, lifespan: 900, frequency: 180, tint: SHADES.green, alpha: { start: 1, end: 0 } }).setDepth(7);
        const rect = new Phaser.Geom.Rectangle(feature.x, feature.y, feature.width, feature.height);
        this.hazards.push({ rect: () => rect, reset: feature.reset });
        this.soundscape.addEmitter('bubbles', () => ({ x: feature.x + feature.width / 2, y: feature.y }), 60);
        break;
      }
      case 'drips': {
        const height = feature.bottom - feature.top;
        const fall = (x: number) => {
          // A drop gathers at the top, then falls.
          const bead = this.add.rectangle(x, feature.top, 1, 1, SHADES.green).setDepth(11);
          this.tweens.add({
            targets: bead, scaleX: 3, scaleY: 3, duration: 350,
            onComplete: () => {
              bead.setScale(1).setSize(2, 4);
              const rect = new Phaser.Geom.Rectangle(x - 1, feature.top, 2, 4);
              const hazard = { rect: () => rect.setTo(bead.x - 1, bead.y, 2, 4), reset: feature.reset };
              this.hazards.push(hazard);
              this.tweens.add({
                targets: bead, y: feature.bottom - 4, duration: (height / 260) * 1000, ease: 'Quad.easeIn',
                onComplete: () => {
                  this.hazards = this.hazards.filter((h) => h !== hazard);
                  bead.destroy();
                  this.soundscape.play('splash', { x, y: feature.bottom }, 0.3, 70);
                  this.add.particles(0, 0, PIXEL, { speed: { min: 10, max: 30 }, angle: { min: 200, max: 340 }, lifespan: 300, tint: SHADES.green, emitting: false }).setDepth(11).explode(4, x, feature.bottom - 1);
                },
              });
            },
          });
        };
        const burst = () => {
          for (let i = 0; i < feature.count; i++) this.time.delayedCall(i * 170, () => feature.xs.forEach(fall));
        };
        burst();
        this.time.addEvent({ delay: feature.every, loop: true, callback: burst });
        break;
      }
      case 'beetle': {
        const frames = BEETLE_FRAMES.map((f, i) => makeSpriteTexture(this, `beetle-${i}`, f.rows, f.colours));
        const image = this.add.image(feature.from, feature.y, frames[0]!).setOrigin(0.5, 1).setDepth(9);
        // Silent while it paces (a constant rattle, designer); a scratch of legs only when it rushes you.
        this.soundscape.addEmitter('skitter', () => {
          const { x, y } = this.player.feet;
          const rushing = Math.abs(y - feature.y) <= 4 && Math.abs(x - image.x) < 56;
          return rushing && image.visible ? { x: image.x, y: image.y } : null;
        }, 70, 0.7);
        this.beetles.push({ image, feature, dir: 1, frames, step: 0 });
        this.hazards.push({ rect: () => new Phaser.Geom.Rectangle(image.x - image.width / 2 + 2, image.y - image.height + 2, image.width - 4, image.height - 2), reset: feature.reset });
        break;
      }
      case 'watch': {
        // (Chapter 2: one of the cast keeping watch, by daylight, without a lantern.)
        // (Chapter 3: `capital-watch-<n>`, one of the city watch, with a lantern; `capital-citizen-<n>`, someone
        // of the city's who'd report you, without.)
        const capital = feature.who?.startsWith('capital-watch-');
        const citizen = feature.who?.startsWith('capital-citizen-');
        const look = capital ? WATCH[Number(feature.who!.slice('capital-watch-'.length))]! : citizen ? CITIZENS[Number(feature.who!.slice('capital-citizen-'.length))]! : feature.who ? CAST[feature.who as CastId] : WATCHMAN;
        const key = feature.who ? `watch-${feature.who}` : 'watchman';
        const idleKey = makeSpriteTexture(this, `${key}-0`, look.idle[0]!.rows, look.idle[0]!.colours);
        const walkKeys = (look.walk ?? look.idle).map((f, i) => makeSpriteTexture(this, `${key}-walk-${i}`, f.rows, f.colours));
        const start = feature.start ?? (feature.from === feature.to ? feature.from : Math.round((feature.from + feature.to) / 2));
        const image = this.add.image(start, feature.y, idleKey).setOrigin(0.5, 1).setDepth(9);
        this.soundscape.addEmitter('footsteps', () => (image.visible ? { x: image.x, y: image.y } : null), 90);
        const lantern = this.add.rectangle(start, feature.y - 13, 3, 4, SHADES.amber).setStrokeStyle(1, SHADES.deep).setDepth(10).setAlpha(feature.who && !capital ? 0 : 1);
        const cone = this.add.graphics().setDepth(7);
        const callout = new PixelText(this, 0, 0, '', { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(21).setVisible(false);
        this.watchmen.push({ feature, image, lantern, cone, callout, dir: feature.face ?? 1, wait: feature.pause ?? WATCH_PAUSE, alarm: null, walkKeys, idleKey, step: 0, arrived: feature.start === undefined, glance: 'idle' });
        break;
      }
      case 'shadow': {
        this.shadows.push(feature);
        this.shadowGraphics ??= this.add.graphics().setDepth(7);
        this.shadowGraphics.fillStyle(SHADES.shadow, 0.6).fillRect(feature.x, feature.y - 22, feature.width, 22);
        break;
      }
      case 'quarry': {
        const first = this.area.people.find((p) => p.id === feature.people[0]);
        const offsets = feature.people.map((id) => (this.area.people.find((p) => p.id === id)?.x ?? 0) - (first?.x ?? 0));
        const callout = new PixelText(this, 0, 0, '', { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(21).setVisible(false);
        this.quarries.push({ feature, offsets, next: 1, wait: 3000, looking: false, turnIn: 0, alarm: null, done: false, callout });
        break;
      }
      case 'mob': {
        const members = [0, 1, 2, 3, 4].map((i) => {
          const look = VILLAGERS[(i * 2 + 1) % VILLAGERS.length]!;
          const walkKeys = look.walk.map((f, k) => makeSpriteTexture(this, `mob-${i}-${k}`, f.rows, f.colours));
          const image = this.add.image(0, 0, walkKeys[0]!).setOrigin(0.5, 1).setDepth(9 - i * 0.01).setVisible(false);
          const torch = this.add.rectangle(0, 0, 2, 3, SHADES.amber).setStrokeStyle(1, SHADES.amberDeep).setDepth(10).setVisible(false);
          return { image, torch, walkKeys };
        });
        const callout = new PixelText(this, 0, 0, '', { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(21).setVisible(false);
        const mob: Mob = { feature, trail: [], head: 0, wait: 0, alarm: null, members, callout, step: 0 };
        this.soundscape.addEmitter('mob', () => {
          const lead = members.find((m) => m.image.visible);
          return lead ? { x: lead.image.x, y: lead.image.y } : null;
        }, 120);
        this.mobs.push(mob);
        // The player isn't placed yet: set off once the scene has started.
        this.time.delayedCall(0, () => this.resetMob(mob));
        break;
      }
      case 'trigger':
        this.triggers.push(feature);
        break;
      case 'lead': {
        const lead = { feature, index: 0, moving: false, idle: 0 };
        this.leads.push(lead);
        // They start at the route's first point (once everyone's placed).
        this.time.delayedCall(0, () => {
          const start = this.area.routes?.[feature.route]?.[0];
          if (start) this.people.get(feature.person)?.image.setPosition(start.x, start.y);
        });
        break;
      }
      case 'dig':
        // (Set up once you're in the area: its prompt goes where you stand.)
        this.time.delayedCall(0, () => this.addDig(feature));
        break;
      case 'seek':
        this.time.delayedCall(0, () => this.addSeek(feature));
        break;
      case 'slide':
        this.slides.push(feature);
        break;
      case 'barks':
        this.barks.push({ feature, index: 0, left: 0 });
        break;
      case 'jars': {
        const { story } = getSession(this);
        const jars = Array.from({ length: feature.max }, (_, i) =>
          this.add
            .image(feature.x + (i % feature.perRow) * 6, feature.y - Math.floor(i / feature.perRow) * feature.rowSpacing, makeSpriteTexture(this, `jar-${feature.variable}`, feature.sprite.rows, feature.sprite.colours))
            .setOrigin(0, 1)
            .setDepth(4),
        );
        const show = () => {
          const count = Number(story.getVariable(feature.variable));
          jars.forEach((jar, i) => jar.setVisible(i < count));
        };
        show();
        const unsubscribe = story.observe(feature.variable, show);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
        break;
      }
    }
  }
}

/** A big rot-beetle (side view, facing right), two frames of scuttling legs. Glowing green, never red. */
const BEETLE_FRAMES: RowSprite[] = [
  ['..l...l...l...l...l...', '.l...l...l...l...l....'],
  ['...l...l...l...l...l..', '..l...l...l...l...l...'],
].map((legs) => ({
  rows: [
    '........ssssss........',
    '.....sssggggggsss.....',
    '...ssgggGGggggggss....',
    '..sggGGgggggGGgggss...',
    '.sggggggggggggggggsss.',
    'sgggGggggggggGgggsseee',
    'sggggggggggggggggssse.',
    'ssssssssssssssssssss..',
    ...legs,
  ],
  colours: { s: SHADES.greenDeep, g: SHADES.greenMid, G: SHADES.green, e: SHADES.white, l: SHADES.greenDeep },
}));

/** Tallest ledge (px) the player walks up without jumping, e.g. a stair. */
const MAX_STEP = 8;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
