import Phaser from 'phaser';
import { PROTAGONIST, PROTAGONIST_CLOAKED, PROTAGONIST_CROUCH, SCAVENGER, SCAVENGER_CROUCH } from '../ui/characters';
import { makeSpriteTexture } from '../ui/pixelTextures';
import type { RowSprite } from '../ui/sprites';

const RUN_SPEED = 105;
/** How long one-way platforms are ignored after pressing down (long enough to fall through a 10px walkway). */
const DROP_TIME = 300;
const JUMP_VELOCITY = -225; // with gravity 450 this clears ~56 px
/** Crouching: slower, and low enough to get under a 16px ceiling. */
const CROUCH_SPEED = 48;
const STAND_HEIGHT = 24;
const CROUCH_HEIGHT = 14;

/**
 * Makes the protagonist's frame textures and animations (once per game): the carver, plain and with the
 * cloak on (keys ending "-cloak"), and the scavenger, Chapter 2's protagonist (keys ending "-scav").
 */
function createAnimations(scene: Phaser.Scene): void {
  const tex = (key: string, s: RowSprite) => makeSpriteTexture(scene, key, s.rows, s.colours);
  const sets = [
    { suffix: '', idle: PROTAGONIST.idle, walk: PROTAGONIST.walk, jump: PROTAGONIST.jump, fall: PROTAGONIST.fall, crouch: PROTAGONIST_CROUCH.idle, crawl: PROTAGONIST_CROUCH.walk },
    { suffix: '-cloak', ...PROTAGONIST_CLOAKED },
    { suffix: '-scav', idle: SCAVENGER.idle, walk: SCAVENGER.walk, jump: SCAVENGER.jump, fall: SCAVENGER.fall, crouch: SCAVENGER_CROUCH.idle, crawl: SCAVENGER_CROUCH.walk },
  ];
  for (const set of sets) {
    const anim = (name: string, frames: readonly RowSprite[], frameRate: number) => {
      const keys = frames.map((s, i) => ({ key: tex(`player-${name}${set.suffix}-${i}`, s) }));
      if (!scene.anims.exists(`player-${name}${set.suffix}`)) scene.anims.create({ key: `player-${name}${set.suffix}`, frames: keys, frameRate, repeat: -1 });
    };
    anim('idle', set.idle, 1.6);
    anim('walk', set.walk, 9);
    anim('crawl', set.crawl, 5);
    tex(`player-jump${set.suffix}`, set.jump);
    tex(`player-fall${set.suffix}`, set.fall);
    tex(`player-crouch${set.suffix}`, set.crouch);
  }
}

type MoveKeys = Record<'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's' | 'space', Phaser.Input.Keyboard.Key>;

/**
 * The protagonist: left/right movement and jumping with Arcade physics (arrows/WASD + Space). Down drops
 * through one-way platforms; held on the ground, it crouches (slower, no jumping, low enough for crawlways).
 * You stay crouched while there's no room to stand (`canStand`, from the scene).
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  private readonly keys: MoveKeys;

  /** (x, y) is where the feet stand. */
  /** Whether you're crouching. */
  crouching = false;
  /** Down on one knee (digging): drawn crouched while the scene holds you still. */
  kneeling = false;
  /** Wearing the cloak (Day 6 on, wherever you're not expected): set by the scene. */
  cloaked = false;
  /** Who you are: the carver (in the tree) or the scavenger (Chapter 2, in the borderland). Set by the scene. */
  look: 'carver' | 'scavenger' = 'carver';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    /** Whether there's room to stand up here: the rectangle a standing body would fill. */
    private readonly canStand: (area: Phaser.Geom.Rectangle) => boolean = () => true,
  ) {
    createAnimations(scene);
    this.sprite = scene.physics.add.sprite(x, y, 'player-idle-0').setOrigin(0.5, 1).setDepth(10);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(8, STAND_HEIGHT, false).setOffset(2, 26 - STAND_HEIGHT);
    this.sprite.play('player-idle');
    this.body.setCollideWorldBounds(true);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard!.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN, a: K.A, d: K.D, w: K.W, s: K.S, space: K.SPACE,
    }) as MoveKeys;
  }

  /** Where the feet are. */
  get feet(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /** True for a moment after pressing down on a one-way platform, so the player drops through it. */
  get dropping(): boolean {
    return this.sprite.scene.time.now < this.dropUntil;
  }

  private dropUntil = 0;

  get onGround(): boolean {
    return this.body.blocked.down;
  }

  /** Call every frame. While `blocked` (e.g. in a conversation) the player stands still. */
  update(blocked: boolean): void {
    // Always read JustDown so presses don't queue up while input is blocked.
    const jumpPressed = [this.keys.space, this.keys.up, this.keys.w].map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const direction = blocked ? 0 : Number(right) - Number(left);
    const downHeld = !blocked && (this.keys.down.isDown || this.keys.s.isDown);
    this.setCrouching(this.onGround && (downHeld || (this.crouching && !this.roomToStand())));
    // Standing, you can't walk into a gap too low to stand in (a crawlway): crouch to get in.
    const tooLow = direction !== 0 && !this.crouching && !this.roomToStand(direction * 3);
    this.body.setVelocityX(tooLow ? 0 : direction * (this.crouching ? CROUCH_SPEED : RUN_SPEED));
    if (direction !== 0) this.sprite.setFlipX(direction < 0);
    const downPressed = [this.keys.down, this.keys.s].map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
    if (!blocked && jumpPressed && this.onGround && !this.crouching) this.body.setVelocityY(JUMP_VELOCITY);
    else if (!blocked && downPressed && this.onGround) this.dropUntil = this.sprite.scene.time.now + DROP_TIME;
    this.animate(direction);
  }

  /** Whether a standing body would fit where you are. */
  private roomToStand(dx = 0): boolean {
    const b = this.body;
    return this.canStand(new Phaser.Geom.Rectangle(b.left + dx, b.bottom - STAND_HEIGHT, b.width, STAND_HEIGHT - CROUCH_HEIGHT));
  }

  private setCrouching(on: boolean): void {
    if (on === this.crouching) return;
    this.crouching = on;
    const h = on ? CROUCH_HEIGHT : STAND_HEIGHT;
    this.body.setSize(8, h, false).setOffset(2, 26 - h);
  }

  private animate(direction: number): void {
    const c = this.look === 'scavenger' ? '-scav' : this.cloaked ? '-cloak' : '';
    if (this.crouching || this.kneeling) {
      if (direction !== 0 && !this.kneeling) this.sprite.play(`player-crawl${c}`, true);
      else {
        this.sprite.anims.stop();
        this.sprite.setTexture(`player-crouch${c}`);
      }
    } else if (!this.onGround) {
      this.sprite.anims.stop();
      this.sprite.setTexture(`${this.body.velocity.y < 0 ? 'player-jump' : 'player-fall'}${c}`);
    } else {
      this.sprite.play(`${direction !== 0 ? 'player-walk' : 'player-idle'}${c}`, true);
    }
  }
}
