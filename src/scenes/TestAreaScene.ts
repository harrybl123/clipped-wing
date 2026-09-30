import Phaser from 'phaser';
import { css, GAME_HEIGHT, PALETTE } from '../config';
import { getSession } from '../session';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueBox } from '../ui/DialogueBox';
import { addCarvedBands, addFungus, addLamp, addTube } from '../ui/scenery';

// Placeholder stand-in for the lower roots: shapes only, to prove movement, camera,
// dialogue and debug tools are wired together. Not a real area.

const WORLD_WIDTH = 3840;
const FLOOR_Y = 1000;
const RUN_SPEED = 420;
const JUMP_VELOCITY = -900; // with gravity 1800 this clears ~225 px
const INTERACT_DISTANCE = 150;
const TEST_KNOT = 'test_conversation';

export class TestAreaScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private playerAccent!: Phaser.GameObjects.Rectangle;
  private npc!: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Text;
  private dialogue!: DialogueBox;
  private keys!: Record<'left' | 'right' | 'up' | 'a' | 'd' | 'w' | 'space' | 'e', Phaser.Input.Keyboard.Key>;
  private facing: 1 | -1 = 1;
  /** Frame on which the dialogue closed, so the key that closed it doesn't also jump or reopen it. */
  private dialogueClosedFrame = -1;

  constructor() {
    super('TestArea');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(css('carvedWood'));
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    addCarvedBands(this, WORLD_WIDTH, GAME_HEIGHT);
    const solids = this.buildGround();
    addTube(this, 2400, 0, FLOOR_Y);
    addFungus(this, 520, FLOOR_Y, 0.9);
    addFungus(this, 640, FLOOR_Y, 0.6);
    addFungus(this, 3150, FLOOR_Y, 1.1);
    addLamp(this, 1150, 360);

    this.npc = this.add.rectangle(1850, FLOOR_Y - 60, 56, 120, PALETTE.carvedWood).setStrokeStyle(3, PALETTE.canopyWhite, 0.35);
    this.prompt = this.add
      .text(this.npc.x, this.npc.y - 110, '[E] talk (test)', { fontFamily: 'Georgia, serif', fontSize: '28px', color: css('canopyWhite') })
      .setOrigin(0.5)
      .setVisible(false);

    this.createPlayer(300, FLOOR_Y - 48);
    this.physics.add.collider(this.player, solids);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const keyboard = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = keyboard.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, a: K.A, d: K.D, w: K.W, space: K.SPACE, e: K.E,
    }) as typeof this.keys;

    const session = getSession(this);
    this.dialogue = new DialogueBox(this, session.story);
    new DebugOverlay(this, session, () => (this.dialogue.isOpen ? 'Close the conversation first.' : null));

    this.add
      .text(24, GAME_HEIGHT - 24, 'Arrows/WASD move · Space jump · E interact · ` debug   [TEST AREA — placeholder]', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: css('canopyWhite'),
      })
      .setOrigin(0, 1)
      .setAlpha(0.5)
      .setScrollFactor(0);
  }

  override update(): void {
    // Always read JustDown so presses don't queue up while input is ignored.
    const jumpPressed = [this.keys.space, this.keys.up, this.keys.w].map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.keys.e);
    const inputBlocked = this.dialogue.isOpen || this.game.loop.frame === this.dialogueClosedFrame;

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const direction = inputBlocked ? 0 : Number(right) - Number(left);
    this.playerBody.setVelocityX(direction * RUN_SPEED);
    if (direction !== 0) this.facing = direction > 0 ? 1 : -1;
    if (!inputBlocked && jumpPressed && this.playerBody.blocked.down) this.playerBody.setVelocityY(JUMP_VELOCITY);
    this.playerAccent.setPosition(this.player.x + this.facing * 14, this.player.y - 18);

    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < INTERACT_DISTANCE;
    this.prompt.setVisible(nearNpc && !this.dialogue.isOpen);
    if (nearNpc && interactPressed && !inputBlocked) {
      this.dialogue.open(TEST_KNOT, () => (this.dialogueClosedFrame = this.game.loop.frame));
    }
  }

  private createPlayer(x: number, y: number): void {
    this.player = this.add.rectangle(x, y, 48, 96, PALETTE.carvedWood).setStrokeStyle(3, PALETTE.canopyWhite, 0.5).setDepth(10);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    // The protagonist's small red accent (red is reserved for birds and the protagonist).
    this.playerAccent = this.add.rectangle(x, y, 14, 14, PALETTE.offeringRed).setDepth(11);
  }

  private buildGround(): Phaser.Physics.Arcade.StaticGroup {
    const solids = this.physics.add.staticGroup();
    const floor = this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y + 40, WORLD_WIDTH, 80, PALETTE.carvedWood).setStrokeStyle(2, PALETTE.canopyWhite, 0.25);
    const platform = this.add.rectangle(1300, 820, 420, 30, PALETTE.carvedWood).setStrokeStyle(2, PALETTE.canopyWhite, 0.35);
    solids.addMultiple([floor, platform]);
    solids.refresh();
    return solids;
  }
}
