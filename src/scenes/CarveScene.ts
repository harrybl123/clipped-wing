import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { carvedBird, type CarveStage } from '../ui/carveArt';
import { DialogueBox } from '../ui/DialogueBox';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import * as Art from '../ui/prologueArt';
import type { AreaSceneData } from './AreaScene';

// The carving close-up (Day 3 onwards): the bench by firelight, like the prologue, but older, and with
// your ruined hand. The words and choices come from an ink knot (e.g. day3_carving), which this scene
// steps through itself. Choices are shown as menus; a line tagged #hold:<stage> stays up while you hold
// E (or Space, or the mouse) to carve that stage (rough, smooth, wing, eye). Partway through, your grip
// slips: let go and hold again to steady it. A line tagged #end finishes, and you're back where you were.

export interface CarveSceneData {
  knot: string;
  /** Where to go back to afterwards. */
  back: AreaSceneData;
}

/** Fraction of a stage carved per second of holding. */
const CARVE_SPEED = 0.4;
/** Where the bird sits (its centre), drawn at twice size. */
const BIRD_Y = 92;
const STAGES: Record<string, CarveStage> = { rough: 1, smooth: 2, wing: 3, eye: 4 };

interface Holding {
  stage: CarveStage;
  progress: number;
  /** Where the grip slips (it slips once per stage). */
  slipAt: number;
  /** The grip has slipped: let go before carving on. */
  slipped: boolean;
  lastChip: number;
}

export class CarveScene extends Phaser.Scene {
  private params!: CarveSceneData;
  private dialogue!: DialogueBox;
  private bird!: Phaser.GameObjects.Image;
  private knife!: Phaser.GameObjects.Image;
  private bar!: Phaser.GameObjects.Graphics;
  private hint!: PixelText;
  private stage: CarveStage = 0;
  private holding: Holding | null = null;
  private keys!: Record<'e' | 'space', Phaser.Input.Keyboard.Key>;
  private ending = false;

  constructor() {
    super('Carve');
  }

  init(data: CarveSceneData): void {
    this.params = data;
    this.stage = 0;
    this.holding = null;
    this.ending = false;
  }

  create(): void {
    makePaintedTexture(this, 'prologue-bench', W, 270, Art.paintBench());
    this.add.image(0, 0, 'prologue-bench').setOrigin(0);
    this.add.image(96, 170, makeSpriteTexture(this, 'prologue-shavings', Art.SHAVINGS.rows, Art.SHAVINGS.colours)).setOrigin(0);
    this.bird = this.add.image(W / 2, BIRD_Y, this.birdTexture()).setOrigin(0.5).setScale(2);
    this.knife = this.add.image(W / 2 + 120, 40, makeSpriteTexture(this, 'prologue-knife', Art.CARVING_KNIFE.rows, Art.CARVING_KNIFE.colours)).setOrigin(0, 1);
    this.bar = this.add.graphics();
    this.hint = new PixelText(this, 0, 182, '', { color: SHADES.light, shadow: SHADES.shadow });
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ e: K.E, space: K.SPACE }) as typeof this.keys;
    this.dialogue = new DialogueBox(this, getSession(this).story);
    getSession(this).story.startKnot(this.params.knot);
    this.cameras.main.fadeIn(800);
    this.time.delayedCall(700, () => this.next());
  }

  override update(_time: number, delta: number): void {
    const h = this.holding;
    if (!h) return;
    const down = this.keys.e.isDown || this.keys.space.isDown || this.input.activePointer.isDown;
    if (h.slipped) {
      if (!down) {
        h.slipped = false;
        this.setHint('Hold E to carve');
      }
      this.drawBar();
      return;
    }
    if (!down) return;
    h.progress = Math.min(1, h.progress + CARVE_SPEED * (delta / 1000));
    // The knife works round the bird as you carve.
    const a = h.progress * Math.PI * 2.5;
    this.knife.setPosition(Math.round(W / 2 + Math.cos(a) * 80), Math.round(BIRD_Y + 10 + Math.sin(a) * 40));
    if (h.progress - h.lastChip > 0.06) {
      h.lastChip = h.progress;
      this.chip();
    }
    if (h.progress >= h.slipAt && h.slipAt < 1) {
      // Your grip goes: the missing thumb.
      h.slipAt = 2;
      h.slipped = true;
      this.cameras.main.shake(140, 0.006);
      this.knife.setAngle(18);
      this.tweens.add({ targets: this.knife, angle: 0, duration: 300 });
      this.setHint('Your grip slips. Let go, and steady it.');
    }
    if (h.progress >= 1) {
      this.stage = h.stage;
      this.bird.setTexture(this.birdTexture());
      this.holding = null;
      this.bar.clear();
      this.setHint('');
      for (let i = 0; i < 6; i++) this.chip();
      this.dialogue.close();
      this.time.delayedCall(400, () => this.next());
      return;
    }
    this.drawBar();
  }

  /** The next ink line: a menu if choices follow it, a held line for #hold, else a line to read. */
  private next(): void {
    const { story } = getSession(this);
    if (!story.canContinue) {
      this.finish();
      return;
    }
    const line = story.nextLine();
    if (!line) return this.finish();
    const tags = line.tags;
    const hold = tags.find((t) => t.startsWith('hold:'))?.slice(5);
    const choices = story.canContinue ? [] : story.choices();
    if (choices.length) {
      this.dialogue.openMenu(line.text, choices.map((c) => ({ label: c.text, run: () => (story.choose(c.index), this.time.delayedCall(150, () => this.next())) })));
    } else if (hold && STAGES[hold] !== undefined) {
      this.dialogue.hold(line.text, tags);
      this.holding = { stage: STAGES[hold]!, progress: 0, slipAt: Phaser.Math.FloatBetween(0.3, 0.7), slipped: false, lastChip: 0 };
      this.setHint('Hold E to carve');
      this.drawBar();
    } else if (tags.includes('end')) {
      this.dialogue.line(line.text, tags, () => this.finish());
    } else {
      this.dialogue.line(line.text, tags, () => this.next());
    }
  }

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  private birdTexture(): string {
    const { story } = getSession(this);
    const opts = {
      kind: story.getVariable('reply1') === 'usual' ? ('usual' as const) : ('fledgling' as const),
      size: String(story.getVariable('fledgling_size')),
      eye: String(story.getVariable('fledgling_eye')),
    };
    const key = `carve-${opts.kind}-${opts.size}-${opts.eye}-${this.stage}`;
    const sprite = carvedBird(this.stage, opts);
    return makeSpriteTexture(this, key, sprite.rows, sprite.colours);
  }

  /** A chip of wood flicking off the bird onto the bench. */
  private chip(): void {
    const x = this.knife.x;
    const y = this.knife.y;
    const p = this.add.image(x, y, PIXEL).setTint(Phaser.Math.RND.pick([SHADES.light, SHADES.woodPale])).setScale(Phaser.Math.Between(1, 2));
    this.tweens.add({ targets: p, x: x + Phaser.Math.Between(-30, 30), y: Math.max(y + 10, BIRD_Y + 60 + Phaser.Math.Between(0, 16)), duration: 500, ease: 'Quad.easeIn' });
  }

  private drawBar(): void {
    const h = this.holding;
    if (!h) return;
    const w = 80;
    const x = Math.round(W / 2 - w / 2);
    this.bar.clear().fillStyle(SHADES.deep).fillRect(x - 1, 175, w + 2, 4).fillStyle(h.slipped ? SHADES.dim : SHADES.amber).fillRect(x, 176, Math.round(w * h.progress), 2);
  }

  private setHint(text: string): void {
    this.hint.setText(text).setX(Math.round((W - this.hint.width) / 2)).setVisible(text !== '');
  }
}

