import Phaser from 'phaser';
import { PROTAGONIST } from '../ui/characters';
import { makeSpriteTexture } from '../ui/pixelTextures';
import type { RowSprite } from '../ui/sprites';

const RUN_SPEED = 105;
const JUMP_VELOCITY = -225; // with gravity 450 this clears ~56 px

/** Makes the protagonist's frame textures and animations (once per game). */
function createAnimations(scene: Phaser.Scene): void {
  const tex = (key: string, s: RowSprite) => makeSpriteTexture(scene, key, s.rows, s.colours);
  const idle = PROTAGONIST.idle.map((s, i) => ({ key: tex(`player-idle-${i}`, s) }));
  const walk = PROTAGONIST.walk.map((s, i) => ({ key: tex(`player-walk-${i}`, s) }));
  tex('player-jump', PROTAGONIST.jump);
  tex('player-fall', PROTAGONIST.fall);
  if (!scene.anims.exists('player-idle')) scene.anims.create({ key: 'player-idle', frames: idle, frameRate: 1.6, repeat: -1 });
  if (!scene.anims.exists('player-walk')) scene.anims.create({ key: 'player-walk', frames: walk, frameRate: 9, repeat: -1 });
}

type MoveKeys = Record<'left' | 'right' | 'up' | 'a' | 'd' | 'w' | 'space', Phaser.Input.Keyboard.Key>;

/** The protagonist: left/right movement and jumping with Arcade physics (arrows/WASD + Space). */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  private readonly keys: MoveKeys;

  /** (x, y) is where the feet stand. */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    createAnimations(scene);
    this.sprite = scene.physics.add.sprite(x, y, 'player-idle-0').setOrigin(0.5, 1).setDepth(10);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(8, 24, false).setOffset(2, 2);
    this.sprite.play('player-idle');
    this.body.setCollideWorldBounds(true);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard!.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, a: K.A, d: K.D, w: K.W, space: K.SPACE,
    }) as MoveKeys;
  }

  /** Where the feet are. */
  get feet(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

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
    this.body.setVelocityX(direction * RUN_SPEED);
    if (direction !== 0) this.sprite.setFlipX(direction < 0);
    if (!blocked && jumpPressed && this.onGround) this.body.setVelocityY(JUMP_VELOCITY);
    this.animate(direction);
  }

  private animate(direction: number): void {
    if (!this.onGround) {
      this.sprite.anims.stop();
      this.sprite.setTexture(this.body.velocity.y < 0 ? 'player-jump' : 'player-fall');
    } else {
      this.sprite.play(direction !== 0 ? 'player-walk' : 'player-idle', true);
    }
  }
}
