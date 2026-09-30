import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREAS, PLANNED_AREAS } from '../data/areas';
import type { AreaDefinition, Exit, Feature } from '../data/areas/types';
import { Player } from '../objects/Player';
import type { MapSceneData } from './MapScene';
import { getSession } from '../session';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueBox } from '../ui/DialogueBox';
import { paintArea } from '../ui/paintArea';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { FIRE_FRAMES } from '../ui/sprites';

export interface AreaSceneData {
  areaId: string;
  /** The area the player came from; they appear at the exit that leads back there. */
  from?: string;
  /** Where the player appears instead (e.g. waking in bed), overriding `from`. */
  start?: { x: number; y: number };
  /** A title card faded in over the start of the scene (e.g. "Day 1: Ascension Day"). */
  card?: string;
}

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
  /** Frame on which the dialogue closed, so the key that closed it doesn't also jump or reopen it. */
  private dialogueClosedFrame = -1;

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
    this.wanderers = [];
    this.movers = [];
    this.current = null;
    this.leaving = false;
  }

  create(): void {
    const { area } = this;
    this.cameras.main.setBackgroundColor(SHADES.shadow).fadeIn(400);
    this.physics.world.setBounds(0, 0, area.width, area.height);
    this.cameras.main.setBounds(0, 0, area.width, area.height);

    makePaintedTexture(this, `area-${area.id}`, area.width, area.height, paintArea(area));
    this.add.image(0, 0, `area-${area.id}`).setOrigin(0);

    for (const feature of area.features) this.addFeature(feature);

    const closed = () => (this.dialogueClosedFrame = this.game.loop.frame);
    const talk = (knot: string) => () => this.dialogue.open(knot, closed);
    this.usables = area.interactables.map((it) => ({ ...it, use: talk(it.knot) }));
    for (const exit of area.exits) this.usables.push({ ...exit, label: 'Leave', use: () => this.openDoorMenu(exit) });
    const session = getSession(this);
    const present = (when?: string[]) => !when || when.includes(session.calendar.slot);
    const peopleImages: { image: Phaser.GameObjects.Image; when?: string[] }[] = [];
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
      peopleImages.push({ image, when: person.when });
      if (person.knot && !person.wander) this.usables.push({ x: person.x, y: person.y, reach: 14, label: 'Talk', use: talk(person.knot), enabled: () => present(person.when) });
    }

    // Who's here depends on the time of day; refresh when the clock changes (e.g. from the debug overlay).
    const refreshPeople = () => peopleImages.forEach(({ image, when }) => image.setVisible(present(when)));
    refreshPeople();
    this.events.on('calendar-changed', refreshPeople);

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
    this.player = new Player(this, arrival.x, arrival.y);
    // Pressing down drops through one-way platforms (walkways, bridges, roofs, stairs).
    const notDroppingThrough = (_p: unknown, other: unknown) => !(this.player.dropping && (other as Phaser.GameObjects.GameObject).getData('oneWay'));
    this.physics.add.collider(this.player.sprite, solids, undefined, notDroppingThrough);
    if (this.movers.length) this.physics.add.collider(this.player.sprite, this.movers.map((m) => m.image), undefined, notDroppingThrough);
    if (area.width > GAME_WIDTH || area.height > GAME_HEIGHT) this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.promptPlate = this.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.85).setOrigin(0).setDepth(19).setVisible(false);
    this.prompt = new PixelText(this, 0, 0, '', { color: SHADES.white }).setDepth(20).setVisible(false);
    this.dialogue = new DialogueBox(this, session.story);
    new DebugOverlay(this, session, () => (this.dialogue.isOpen ? 'Close the conversation first.' : null));

    if (this.card) this.showCard(this.card);

    // Dev builds only: M opens the map from anywhere, for quick testing.
    if (import.meta.env.DEV) {
      this.input.keyboard?.on('keydown-M', () => {
        if (!this.dialogue.isOpen && !this.leaving) this.openMap();
      });
    }
  }

  override update(_time: number, delta: number): void {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
    const blocked = this.leaving || this.dialogue.isOpen || this.game.loop.frame === this.dialogueClosedFrame;
    this.player.update(blocked);
    this.stepUp();
    this.updateWanderers(delta);
    this.updateMovers(delta);

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

  /** Using a door: go straight next door, open the map, or stay. */
  private openDoorMenu(exit: Exit): void {
    const closed = () => (this.dialogueClosedFrame = this.game.loop.frame);
    const name = PLANNED_AREAS[exit.to] ?? exit.to;
    const built = exit.to in AREAS;
    this.dialogue.openMenu(
      '[PLACEHOLDER] Where to?',
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

  private goTo(areaId: string): void {
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ areaId, from: this.area.id } satisfies AreaSceneData);
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

/** Tallest ledge (px) the player walks up without jumping, e.g. a stair. */
const MAX_STEP = 8;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
