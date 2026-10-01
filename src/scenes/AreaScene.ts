import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { closedReason } from '../data/access';
import { AREAS, AREA_NAMES } from '../data/areas';
import type { AreaDefinition, Exit, Feature, Person } from '../data/areas/types';
import { nextHop } from '../data/route';
import { Player } from '../objects/Player';
import type { CarveSceneData } from './CarveScene';
import type { DecodeResult, DecodeSceneData } from './DecodeScene';
import type { EndingSceneData } from './EndingScene';
import type { StepSceneData } from './StepScene';
import type { MapSceneData } from './MapScene';
import { getSession, type WakePlace } from '../session';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueBox } from '../ui/DialogueBox';
import { paintArea } from '../ui/paintArea';
import { VILLAGERS, WATCHMAN } from '../ui/characters';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { ObjectiveMarker } from '../ui/ObjectiveMarker';
import { FIRE_FRAMES, type RowSprite } from '../ui/sprites';

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
  /** A follower mid-hop to catch up with you. */
  hopping?: boolean;
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
  private from: string | undefined;
  private start: { x: number; y: number } | undefined;
  private card: string | undefined;
  private leaving = false;
  private wanderers: Wanderer[] = [];
  private movers: Mover[] = [];
  private people = new Map<string, PersonEntry>();
  private hints: Extract<Feature, { type: 'hint' }>[] = [];
  private hintText!: PixelText;
  private objective!: ObjectiveMarker;
  /** Things to do once the current conversation closes (e.g. travel after a #goto: tag). */
  private afterClose: (() => void)[] = [];
  private inset: Phaser.GameObjects.Container | null = null;
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
  private mobs: Mob[] = [];
  private triggers: Extract<Feature, { type: 'trigger' }>[] = [];
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
    this.wakeAt = null;
    this.mobs = [];
    this.triggers = [];
  }

  create(): void {
    const { area } = this;
    this.cameras.main.setBackgroundColor(SHADES.shadow).fadeIn(400);
    this.physics.world.setBounds(0, 0, area.width, area.height);
    this.cameras.main.setBounds(0, 0, area.width, area.height);

    makePaintedTexture(this, `area-${area.id}`, area.width, area.height, paintArea(area));
    this.add.image(0, 0, `area-${area.id}`).setOrigin(0);
    this.crumbleGroup = this.physics.add.staticGroup();

    for (const feature of area.features) this.addFeature(feature);

    const closed = () => this.conversationClosed();
    const talk = (knot: string) => () => this.dialogue.open(knot, closed);
    this.usables = area.interactables.map((it) => ({ ...it, use: talk(it.knot) }));
    for (const exit of area.exits) this.usables.push({ ...exit, label: 'Leave', use: () => this.openDoorMenu(exit) });
    const session = getSession(this);
    for (const person of area.people) {
      const frames = (person.idleFrames ?? [person.sprite]).map((f, i) => makeSpriteTexture(this, `person-${person.id}-${i}`, f.rows, f.colours));
      const image = this.add.image(person.x, person.y, frames[0]!).setOrigin(0.5, 1).setFlipX(person.flipX ?? false).setDepth(8);
      if (person.wander) {
        const walkKeys = (person.walkFrames ?? [person.sprite]).map((f, i) => makeSpriteTexture(this, `person-${person.id}-walk-${i}`, f.rows, f.colours));
        this.wanderers.push({ image, from: person.wander.from, to: person.wander.to, dir: person.flipX ? -1 : 1, pause: Phaser.Math.Between(0, 1500), walkKeys, idleKey: frames[0]!, stepTimer: 0, frame: 0 });
      } else if (frames.length > 1) {
        let frame = 0;
        this.time.addEvent({ delay: 650, loop: true, callback: () => image.setTexture(frames[(frame = (frame + 1) % frames.length)]!) });
      }
      const entry: PersonEntry = { person, image, scriptHidden: person.hidden ?? false, gone: false };
      this.people.set(person.id, entry);
      if (person.knot && !person.wander) {
        // Where they stand now (people can be moved by the story, or follow you).
        this.usables.push({
          get x() { return entry.image.x; },
          get y() { return entry.image.y; },
          reach: 14,
          label: person.label ?? 'Talk',
          use: talk(person.knot),
          enabled: () => this.isPresent(entry),
        });
      }
    }

    // Who's here depends on the time of day and the story; refresh when either changes.
    this.refreshPeople();
    this.events.on('calendar-changed', () => {
      this.refreshPeople();
      this.refreshObjective();
    });

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
    // Anyone following you comes in with you.
    for (const entry of this.people.values()) if (entry.person.follow && entry.image.visible) entry.image.setPosition(Math.max(this.area.cavity.x + 8, arrival.x - 16), arrival.y);
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
    this.refreshObjective();
    if (this.script) {
      const knot = this.script;
      this.time.delayedCall(700, () => this.dialogue.open(knot, closed));
    }
    new DebugOverlay(this, session, () => (this.dialogue.isOpen ? 'Close the conversation first.' : null));

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
    }
  }

  override update(_time: number, delta: number): void {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
    const caught = this.watchmen.some((w) => w.alarm !== null) || this.quarries.some((q) => q.alarm !== null) || this.mobs.some((m) => m.alarm !== null);
    const blocked = this.leaving || caught || this.dialogue.isOpen || this.game.loop.frame === this.dialogueClosedFrame;
    this.player.update(blocked);
    this.stepUp();
    this.updateWanderers(delta);
    this.updateMovers(delta);
    this.updateShyPeople();
    this.updateFollowers(delta);
    this.updateCrumbles(delta);
    this.updateCollapses(delta);
    this.updateBeetles(delta);
    this.updateWatch(delta);
    this.updateQuarries(delta);
    this.updateMobs(delta);
    this.updateTriggers();
    this.updateCloak();
    this.checkHazards();
    this.updateWaiting(delta);
    this.updateHints();
    this.objective.pointAt(this.onScreen(this.objectivePoint()));

    this.setCurrent(this.dialogue.isOpen || !this.player.onGround ? null : this.nearestInteractable());
    if (this.current && interactPressed && !blocked) {
      this.current.use();
      this.setCurrent(null);
    }
  }

  /** The closest interactable whose zone the player's feet are in, on the same surface. */
  private nearestInteractable(): Usable | null {
    const { x, y } = this.player.feet;
    let best: Usable | null = null;
    for (const it of this.usables) {
      if (it.enabled && !it.enabled()) continue;
      const dx = Math.abs(x - it.x);
      if (Math.abs(y - it.y) > 4 || dx > it.reach) continue;
      if (!best || dx < Math.abs(x - best.x)) best = it;
    }
    return best;
  }

  private setCurrent(it: Usable | null): void {
    if (it === this.current) return;
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
      if (!w.image.visible) continue;
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

  /** People following you (the girl in the back routes) walk after you, and catch up when you change level. */
  private updateFollowers(delta: number): void {
    const { x, y } = this.player.feet;
    for (const entry of this.people.values()) {
      if (!entry.person.follow || !entry.image.visible) continue;
      const img = entry.image;
      if (entry.hopping) continue;
      const behind = x + (this.player.sprite.flipX ? 16 : -16);
      if (this.player.onGround && Math.abs(img.y - y) > 2) {
        // You've changed level: she jumps (or drops) after you, in an arc.
        const from = { x: img.x, y: img.y };
        const peak = Math.min(from.y, y) - 24;
        const hop = { t: 0 };
        entry.hopping = true;
        img.setFlipX(behind < from.x);
        this.tweens.add({
          targets: hop, t: 1, duration: 420 + Math.min(300, Math.abs(y - from.y) * 2), ease: 'Sine.easeInOut',
          onUpdate: () => {
            const t = hop.t;
            img.setPosition(from.x + (behind - from.x) * t, (1 - t) ** 2 * from.y + 2 * (1 - t) * t * peak + t * t * y);
          },
          onComplete: () => (entry.hopping = false),
        });
        continue;
      }
      const dx = behind - img.x;
      if (Math.abs(dx) > 3) {
        img.x += Math.sign(dx) * Math.min(Math.abs(dx), (Math.abs(dx) > 60 ? 140 : 70) * (delta / 1000));
        img.setFlipX(dx < 0);
      }
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
    const { story } = getSession(this);
    for (const c of this.collapses) {
      const f = c.feature;
      if (c.done || (f.showIf && !story.getVariable(f.showIf))) continue;
      const inside = Math.abs(y - f.y) <= 6 && x >= f.from && x <= f.to;
      if (!c.active) {
        if (!inside) continue;
        c.active = true;
        c.enteredFrom = x - f.from < f.to - x ? -1 : 1;
        c.untilNext = 0;
        this.cameras.main.shake(400, 0.004);
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
    const { story } = getSession(this);
    const { x: px, y: py } = this.player.feet;
    const inShadow = this.inShadow();
    for (const w of this.watchmen) {
      const f = w.feature;
      const on = !f.showIf || !!story.getVariable(f.showIf);
      w.image.setVisible(on);
      w.lantern.setVisible(on);
      w.cone.setVisible(on);
      if (!on) continue;
      if (w.alarm !== null) {
        w.alarm -= delta;
        if (w.alarm <= 0) {
          w.alarm = null;
          w.callout.setVisible(false);
          this.knockBack(f.reset);
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
      w.lantern.setPosition(lx, ly);
      // The lantern's light: a wedge spreading out ahead of him.
      w.cone.clear().fillStyle(SHADES.amber, w.alarm !== null ? 0.28 : 0.13).fillTriangle(lx, ly, lx + w.dir * f.range, f.y - WATCH_VIEW_Y, lx + w.dir * f.range, f.y + 2);
      w.cone.fillTriangle(lx, ly, lx + w.dir * f.range, f.y + 2, lx, f.y + 2);
      if (w.alarm !== null || this.dialogue.isOpen || this.leaving) continue;
      const ahead = (px - w.image.x) * w.dir;
      const seen = !inShadow && py <= f.y + 4 && f.y - py <= WATCH_VIEW_Y && ahead >= -8 && ahead <= f.range;
      if (seen) {
        w.alarm = 900;
        w.callout.setText("Who's there?").setPosition(Math.round(w.image.x - w.callout.width / 2), f.y - 44).setVisible(true);
        this.cameras.main.flash(300, 242, 180, 90);
      }
    }
  }

  /** Whether you're standing in a dark doorway or nook (a `shadow` that's active now). */
  private inShadow(): boolean {
    const { story } = getSession(this);
    const { x, y } = this.player.feet;
    return this.shadows.some((s) => (!s.showIf || story.getVariable(s.showIf)) && Math.abs(y - s.y) <= 2 && x >= s.x && x <= s.x + s.width);
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
    this.player.cloaked = !!story.getVariable('has_disguise') && !expected;
    const watched = this.watchmen.some((w) => w.image.visible) || this.quarries.some((q) => !q.done && !!story.getVariable(q.feature.showIf));
    const hidden = watched && this.inShadow();
    sprite.setAlpha(hidden ? 0.45 : 1);
    this.shadowGraphics?.setVisible(this.shadows.some((s) => !s.showIf || story.getVariable(s.showIf)));
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
      if (q.done || !story.getVariable(f.showIf)) continue;
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
      if (this.dialogue.isOpen || this.leaving || Math.abs(py - f.y) > 40) continue;
      const rear = entries.reduce((a, e) => ((e.image.x - a.image.x) * travel < 0 ? e : a), leader);
      const behind = (rear.image.x - px) * travel; // how far behind them you are (negative: in front)
      const nearest = Math.min(...entries.map((e) => Math.abs(e.image.x - px)));
      const seen = !this.inShadow() && (behind < -6 || nearest < 18 || (q.looking && q.wait > 0 && behind <= f.range));
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
    const { story } = getSession(this);
    const { x: px, y: py } = this.player.feet;
    for (const m of this.mobs) {
      const on = !!story.getVariable(m.feature.showIf);
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
    const t = m.trail;
    let lo = 0;
    let hi = t.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (t[mid]!.d <= d) lo = mid;
      else hi = mid - 1;
    }
    const a = t[lo]!;
    const b = t[lo + 1];
    if (!b) return a;
    const f = (d - a.d) / (b.d - a.d || 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
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
    const t = this.triggers.find((t) => Math.abs(x - t.x) <= t.reach && Math.abs(y - t.y) <= 4 && (!t.showIf || story.getVariable(t.showIf)) && !(t.hideIf && story.getVariable(t.hideIf)));
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
    for (const entry of this.people.values()) if (entry.person.follow && entry.image.visible) entry.image.setPosition(reset.x - 16, reset.y);
  }

  // --- The story: who's here, what to do next, and what ink's tags ask for ---

  /** Whether a person is here now: the time of day, the story's variables, and any scripted hiding. */
  private isPresent(entry: PersonEntry): boolean {
    const { person } = entry;
    const { calendar, story } = getSession(this);
    if (entry.scriptHidden || entry.gone) return false;
    if (person.when && !person.when.includes(calendar.slot)) return false;
    if (person.showIf && !story.getVariable(person.showIf)) return false;
    if ([person.hideIf ?? []].flat().some((v) => story.getVariable(v))) return false;
    return true;
  }

  private refreshPeople(): void {
    for (const entry of this.people.values()) entry.image.setVisible(this.isPresent(entry));
  }

  /** After any conversation: run what it queued (travel, the end of the day), then refresh the scene. */
  private conversationClosed(): void {
    this.dialogueClosedFrame = this.game.loop.frame;
    this.clearInset();
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
  private objectivePoint(): { x: number; y: number } | null {
    const { story, calendar } = getSession(this);
    const targets = String(story.getVariable('objective_target') ?? '').split(';').map((t) => t.split(':') as [string, string | undefined]).filter(([a]) => a);
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

  /** Over a person, object or door in this area. */
  private pointAt(thing: string | undefined): { x: number; y: number } | null {
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
    const { story } = getSession(this);
    const hint = this.dialogue.isOpen ? undefined : this.hints.find((h) => Math.abs(x - h.x) <= h.reach && Math.abs(y - h.y) <= 40 && (!h.showIf || story.getVariable(h.showIf)));
    if (!hint) {
      this.hintText.setVisible(false);
      return;
    }
    if (this.hintText.text !== hint.text) this.hintText.setText(hint.text);
    this.hintText.setPosition(Math.round((GAME_WIDTH - this.hintText.width) / 2), 18).setVisible(true);
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
   *   #turn                   the crowd turns its back on you
   *   #rise                   you're taken up into the tube: you lift off the floor and rise out of sight
   *   #daylight:<x>:<top>:<floor>  daylight breaks in through the wall at (x, top), a shaft down to the floor
   */
  private handleTags(tags: string[]): void {
    this.clearInset();
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
        case 'flash': {
          // dark: the light goes out for a moment and slowly comes back.
          const [r, g, b] = args[0] === 'cyan' ? [174, 246, 247] : args[0] === 'dark' ? [0, 0, 0] : [244, 241, 232];
          this.cameras.main.flash(args[0] === 'dark' ? 1600 : 700, r, g, b);
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
          break;
        case 'recoil':
          this.recoil();
          break;
        case 'throw':
          this.throwAtPlayer();
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
        case 'turn':
          this.turnAway();
          break;
        case 'rise':
          this.riseUp();
          break;
        case 'daylight':
          this.breakDaylight(Number(args[0]), Number(args[1]), Number(args[2]));
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
        case 'dim':
          this.tweens.add({ targets: this.dimmer, alpha: args[0] === 'off' ? 0 : 0.75, duration: 900 });
          break;
        case 'decode': {
          const [message, then] = args;
          if (message) this.afterClose.push(() => this.openDecode({ message, then: then || undefined }));
          break;
        }
      }
    }
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
    const next = calendar.day === 'prologue' ? 1 : Math.min(7, calendar.day + 1);
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
    const ahead = body.velocity.x > 0 ? body.right + 1 : body.left - 1;
    for (const s of this.area.solids) {
      if (!s.oneWay) continue;
      const rise = Math.round(body.bottom) - s.y;
      if (rise >= 1 && rise <= MAX_STEP && ahead >= s.x && ahead <= s.x + s.width) {
        this.player.sprite.y -= rise;
        return;
      }
    }
  }

  /** Using a door: go straight next door, open the map, or stay. Doors to areas that are closed today just say why. */
  private openDoorMenu(exit: Exit): void {
    const closed = () => this.conversationClosed();
    const name = AREA_NAMES[exit.to] ?? exit.to;
    const built = exit.to in AREAS;
    const { calendar } = getSession(this);
    const shut = exit.secret ? null : closedReason(exit.to, calendar.day, calendar.slot);
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
        { label: 'Open the map', run: () => this.openMap() },
        { label: 'Stay', run: () => {} },
      ],
      closed,
    );
  }

  /** Opens the map over this area (paused), which either travels or comes back here. */
  private openMap(): void {
    this.scene.pause();
    this.scene.launch('Map', { current: this.area.id } satisfies MapSceneData);
  }

  private goTo(areaId: string, extra: Omit<AreaSceneData, 'areaId' | 'from'> = {}): void {
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ areaId, from: this.area.id, ...extra } satisfies AreaSceneData);
    });
  }

  private addFeature(feature: Feature): void {
    switch (feature.type) {
      case 'fire': {
        const keys = FIRE_FRAMES.map((f, i) => makeSpriteTexture(this, `fire-${i}`, f.rows, f.colours));
        const fire = this.add.image(feature.x, feature.y, keys[0]!).setOrigin(0.5, 1).setDepth(5);
        let frame = 0;
        this.time.addEvent({ delay: 140, loop: true, callback: () => fire.setTexture(keys[(frame = (frame + 1) % keys.length)]!) });
        this.add.particles(0, 0, PIXEL, {
          x: { min: feature.x - 3, max: feature.x + 3 },
          y: feature.y - 10,
          speedY: { min: -12, max: -6 },
          speedX: { min: -2, max: 2 },
          lifespan: 1400,
          frequency: 260,
          tint: SHADES.amber,
          alpha: { start: 1, end: 0 },
        }).setDepth(5);
        break;
      }
      case 'swing': {
        const rope = this.add.line(0, 0, feature.x, feature.ropeTop, feature.x, feature.y, SHADES.woodPale).setOrigin(0).setDepth(4);
        const key = makeSpriteTexture(this, `swing-${feature.x}-${feature.y}`, feature.sprite.rows, feature.sprite.colours);
        const item = this.add.image(feature.x, feature.y, key).setOrigin(0.5, 0).setDepth(4);
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
        this.movers.push({ image, from: { x: feature.x, y: feature.y }, to: feature.to, speed: feature.speed, dir: 1, pause: MOVER_PAUSE, width, ropes });
        break;
      }
      case 'motes': {
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
          this.tweens.add({ targets: drop, y: feature.floorY, duration: 700, ease: 'Quad.easeIn', onComplete: () => drop.setVisible(false) });
        };
        this.time.addEvent({ delay: 2600, loop: true, callback: fall });
        break;
      }
      case 'hint':
        this.hints.push(feature);
        break;
      case 'crumble': {
        const rows = [0, 1, 2].map((r) => Array.from({ length: feature.width }, (_, i) => (r === 0 ? (i % 7 === 3 ? 'd' : 'p') : (i * 5 + r * 3) % 9 === 0 ? '.' : r === 2 ? 'd' : 'w')).join(''));
        const key = makeSpriteTexture(this, `crumble-${feature.width}`, rows, { p: SHADES.woodPale, w: SHADES.woodLight, d: SHADES.deep });
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
        this.beetles.push({ image, feature, dir: 1, frames, step: 0 });
        this.hazards.push({ rect: () => new Phaser.Geom.Rectangle(image.x - image.width / 2 + 2, image.y - image.height + 2, image.width - 4, image.height - 2), reset: feature.reset });
        break;
      }
      case 'watch': {
        const idleKey = makeSpriteTexture(this, 'watchman-0', WATCHMAN.idle[0]!.rows, WATCHMAN.idle[0]!.colours);
        const walkKeys = WATCHMAN.walk.map((f, i) => makeSpriteTexture(this, `watchman-walk-${i}`, f.rows, f.colours));
        const start = feature.from === feature.to ? feature.from : Math.round((feature.from + feature.to) / 2);
        const image = this.add.image(start, feature.y, idleKey).setOrigin(0.5, 1).setDepth(9);
        const lantern = this.add.rectangle(start, feature.y - 13, 3, 4, SHADES.amber).setStrokeStyle(1, SHADES.deep).setDepth(10);
        const cone = this.add.graphics().setDepth(7);
        const callout = new PixelText(this, 0, 0, '', { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(21).setVisible(false);
        this.watchmen.push({ feature, image, lantern, cone, callout, dir: 1, wait: feature.pause ?? WATCH_PAUSE, alarm: null, walkKeys, idleKey, step: 0 });
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
        this.mobs.push(mob);
        // The player isn't placed yet: set off once the scene has started.
        this.time.delayedCall(0, () => this.resetMob(mob));
        break;
      }
      case 'trigger':
        this.triggers.push(feature);
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
