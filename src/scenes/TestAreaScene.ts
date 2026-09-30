import Phaser from 'phaser';
import { GAME_HEIGHT as H } from '../config';
import { getSession } from '../session';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueBox } from '../ui/DialogueBox';
import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL, stampRows } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { FUNGUS, LAMP, PLAYER, VILLAGER } from '../ui/sprites';

// Placeholder stand-in for the lower roots, to prove movement, camera, dialogue and debug
// tools are wired together. Not a real area.

const WORLD_WIDTH = 960;
const FLOOR_Y = 250;
const PLATFORM = { x: 272, y: 202, width: 106, height: 6 };
const TUBE_X = 600;
const TUBE_HALF_WIDTH = 9;
const FUNGI: readonly number[] = [128, 168, 788];
const LAMP_POS = { x: 288, y: 90 };
const NPC_X = 462;

const RUN_SPEED = 105;
const JUMP_VELOCITY = -225; // with gravity 450 this clears ~56 px
const INTERACT_DISTANCE = 38;
const TEST_KNOT = 'test_conversation';

export class TestAreaScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private npc!: Phaser.GameObjects.Image;
  private prompt!: PixelText;
  private dialogue!: DialogueBox;
  private keys!: Record<'left' | 'right' | 'up' | 'a' | 'd' | 'w' | 'space' | 'e', Phaser.Input.Keyboard.Key>;
  /** Frame on which the dialogue closed, so the key that closed it doesn't also jump or reopen it. */
  private dialogueClosedFrame = -1;

  constructor() {
    super('TestArea');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow).fadeIn(400);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);

    makePaintedTexture(this, 'test-area-backdrop', WORLD_WIDTH, H, paintBackdrop());
    this.add.image(0, 0, 'test-area-backdrop').setOrigin(0);
    this.addTubeMotes();
    const solids = this.buildGround();

    this.npc = this.add.image(NPC_X, FLOOR_Y, makeSpriteTexture(this, 'villager', VILLAGER.rows, VILLAGER.colours)).setOrigin(0.5, 1);
    this.prompt = new PixelText(this, 0, 0, '[E] talk (test)', { color: SHADES.white, shadow: SHADES.shadow }).setVisible(false);
    this.prompt.setPosition(Math.round(NPC_X - this.prompt.width / 2), FLOOR_Y - this.npc.height - 14);

    this.player = this.physics.add.sprite(70, FLOOR_Y - 11, makeSpriteTexture(this, 'player', PLAYER.rows, PLAYER.colours)).setDepth(10);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
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

    new PixelText(this, 4, H - 11, 'Arrows/WASD move · Space jump · E talk · ` debug  [test area]', { color: SHADES.dim })
      .setScrollFactor(0)
      .setDepth(900);
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
    if (direction !== 0) this.player.setFlipX(direction < 0);
    if (!inputBlocked && jumpPressed && this.playerBody.blocked.down) this.playerBody.setVelocityY(JUMP_VELOCITY);

    const nearNpc = Math.abs(this.player.x - this.npc.x) < INTERACT_DISTANCE && Math.abs(this.player.y - (FLOOR_Y - 11)) < 20;
    this.prompt.setVisible(nearNpc && !this.dialogue.isOpen);
    if (nearNpc && interactPressed && !inputBlocked) {
      this.dialogue.open(TEST_KNOT, () => (this.dialogueClosedFrame = this.game.loop.frame));
    }
  }

  private buildGround(): Phaser.Physics.Arcade.StaticGroup {
    const solids = this.physics.add.staticGroup();
    const floor = this.add.rectangle(0, FLOOR_Y, WORLD_WIDTH, H - FLOOR_Y, SHADES.deep).setOrigin(0);
    this.add.rectangle(0, FLOOR_Y, WORLD_WIDTH, 1, SHADES.woodPale).setOrigin(0);
    const platform = this.add.rectangle(PLATFORM.x, PLATFORM.y, PLATFORM.width, PLATFORM.height, SHADES.deep).setOrigin(0);
    this.add.rectangle(PLATFORM.x, PLATFORM.y, PLATFORM.width, 1, SHADES.woodPale).setOrigin(0);
    solids.addMultiple([floor, platform]);
    solids.refresh();
    return solids;
  }

  private addTubeMotes(): void {
    this.add.particles(0, 0, PIXEL, {
      emitZone: {
        type: 'random',
        source: { getRandomPoint: (p) => { p.x = TUBE_X + Phaser.Math.Between(-TUBE_HALF_WIDTH + 2, TUBE_HALF_WIDTH - 2); p.y = Phaser.Math.Between(40, FLOOR_Y); } },
      },
      speedY: { min: -14, max: -5 },
      lifespan: 7000,
      frequency: 200,
      tint: SHADES.white,
      alpha: { start: 1, end: 0 },
    });
  }
}

/** Wood wall with vertical grain, lit by the tube, a lamp and the fungi; darker low down. */
function paintBackdrop(): (x: number, y: number) => PixelColour {
  const wood = rgb(SHADES.wood);
  const [white, cyan, green, amber] = [SHADES.white, SHADES.cyan, SHADES.green, SHADES.amber].map(rgb) as [RGB, RGB, RGB, RGB];

  const sprites = new Map<number, number>();
  const put = (x: number, y: number, c: number) => sprites.set(y * WORLD_WIDTH + x, c);
  for (let y = 0; y < LAMP_POS.y - 2; y++) put(LAMP_POS.x, y, SHADES.amberDeep); // cord
  stampRows(put, LAMP.rows, LAMP.colours, LAMP_POS.x - 1, LAMP_POS.y - 2);
  for (const fx of FUNGI) stampRows(put, FUNGUS.rows, FUNGUS.colours, fx - 2, FLOOR_Y - FUNGUS.rows.length);

  return (x, y) => {
    const sprite = sprites.get(y * WORLD_WIDTH + x);
    if (sprite !== undefined) return sprite;

    const dx = x - TUBE_X;
    if (Math.abs(dx) <= TUBE_HALF_WIDTH) {
      const edge = Math.abs(dx) / TUBE_HALF_WIDTH;
      return edge < 0.25 ? SHADES.white : edge < 0.75 ? SHADES.cyan : SHADES.cyanMid;
    }

    const grain = noise(x / 5 + noise(y / 90) * 0.5) * 0.6 + noise(x / 1.8 + 90) * 0.4;
    const shade = 1 - 0.55 * smoothstep(0.35, 1, y / FLOOR_Y) - 0.3 * smoothstep(0.3, 0, y / FLOOR_Y);
    let c = wood.map((v) => v * (1 + 0.3 * grain) * shade) as RGB;
    c = addLight(c, cyan, 0.4 * Math.exp(-((dx / 34) ** 2)));
    c = addLight(c, white, 0.12 * Math.exp(-((dx / 14) ** 2)));
    c = addLight(c, amber, 0.28 * falloff(x, y, LAMP_POS.x, LAMP_POS.y, 34, 30));
    for (const fx of FUNGI) c = addLight(c, green, 0.3 * falloff(x, y, fx, FLOOR_Y - 3, 13, 9));
    return c;
  };
}
