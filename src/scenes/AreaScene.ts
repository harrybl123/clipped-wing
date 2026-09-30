import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { AREAS } from '../data/areas';
import type { AreaDefinition, Feature, Interactable } from '../data/areas/types';
import { Player } from '../objects/Player';
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
}

/** Any side-on area, built from its AreaDefinition in src/data/areas. */
export class AreaScene extends Phaser.Scene {
  private area!: AreaDefinition;
  private player!: Player;
  private dialogue!: DialogueBox;
  private prompt!: PixelText;
  private promptPlate!: Phaser.GameObjects.Rectangle;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactables: Interactable[] = [];
  private current: Interactable | null = null;
  /** Frame on which the dialogue closed, so the key that closed it doesn't also jump or reopen it. */
  private dialogueClosedFrame = -1;

  constructor() {
    super('Area');
  }

  init(data: AreaSceneData): void {
    const area = AREAS[data.areaId];
    if (!area) throw new Error(`AreaScene: no area called "${data.areaId}"`);
    this.area = area;
    this.current = null;
  }

  create(): void {
    const { area } = this;
    const session = getSession(this);
    this.cameras.main.setBackgroundColor(SHADES.shadow).fadeIn(400);
    this.physics.world.setBounds(0, 0, area.width, area.height);
    this.cameras.main.setBounds(0, 0, area.width, area.height);

    makePaintedTexture(this, `area-${area.id}`, area.width, area.height, paintArea(area));
    this.add.image(0, 0, `area-${area.id}`).setOrigin(0);

    for (const feature of area.features) this.addFeature(feature);

    this.interactables = [...area.interactables];
    for (const person of area.people) {
      const frames = (person.idleFrames ?? [person.sprite]).map((f, i) => makeSpriteTexture(this, `person-${person.id}-${i}`, f.rows, f.colours));
      const image = this.add.image(person.x, person.y, frames[0]!).setOrigin(0.5, 1).setFlipX(person.flipX ?? false).setDepth(8);
      if (frames.length > 1) {
        let frame = 0;
        this.time.addEvent({ delay: 650, loop: true, callback: () => image.setTexture(frames[(frame = (frame + 1) % frames.length)]!) });
      }
      this.interactables.push({ id: person.id, x: person.x, y: person.y, reach: 14, label: 'Talk', knot: person.knot });
    }

    const solids = this.physics.add.staticGroup();
    for (const s of area.solids) {
      const zone = this.add.zone(s.x, s.y, s.width, s.height).setOrigin(0);
      solids.add(zone);
      const body = zone.body as Phaser.Physics.Arcade.StaticBody;
      if (s.oneWay) {
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
      }
    }

    this.player = new Player(this, area.playerStart.x, area.playerStart.y);
    this.physics.add.collider(this.player.sprite, solids);
    if (area.width > GAME_WIDTH || area.height > GAME_HEIGHT) this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.promptPlate = this.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.85).setOrigin(0).setDepth(19).setVisible(false);
    this.prompt = new PixelText(this, 0, 0, '', { color: SHADES.white }).setDepth(20).setVisible(false);
    this.dialogue = new DialogueBox(this, session.story);
    new DebugOverlay(this, session, () => (this.dialogue.isOpen ? 'Close the conversation first.' : null));
  }

  override update(): void {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
    const blocked = this.dialogue.isOpen || this.game.loop.frame === this.dialogueClosedFrame;
    this.player.update(blocked);

    this.setCurrent(this.dialogue.isOpen || !this.player.onGround ? null : this.nearestInteractable());
    if (this.current && interactPressed && !blocked) {
      this.dialogue.open(this.current.knot, () => (this.dialogueClosedFrame = this.game.loop.frame));
      this.setCurrent(null);
    }
  }

  /** The closest interactable whose zone the player's feet are in, on the same surface. */
  private nearestInteractable(): Interactable | null {
    const { x, y } = this.player.feet;
    let best: Interactable | null = null;
    for (const it of this.interactables) {
      const dx = Math.abs(x - it.x);
      if (Math.abs(y - it.y) > 4 || dx > it.reach) continue;
      if (!best || dx < Math.abs(x - best.x)) best = it;
    }
    return best;
  }

  private setCurrent(it: Interactable | null): void {
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

