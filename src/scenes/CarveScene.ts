import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { carvedBird, CARVE_H, CARVE_W, eyePosition, wingPosition, type CarveOptions, type CarveStage } from '../ui/carveArt';
import { DialogueBox } from '../ui/DialogueBox';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import * as Art from '../ui/prologueArt';
import { playConfirm, playMove } from '../ui/sfx';
import type { AreaSceneData } from './AreaScene';

// The carving close-up (Day 3 onwards): the bench by firelight, like the prologue, but older, and with
// your ruined hand. The words and choices come from an ink knot (e.g. day3_carving), which this scene
// steps through itself. Choices are shown as menus; a line tagged #step:<stage> stays up while you do
// that stage's little timing game (designer: timing, not just holding):
//   rough   strike when the swinging marker is in the green, three times
//   smooth  hold E to press harder, let go to ease off; keep the shaky needle in the green
//   wing    press as the blade passes the mark where the wing is clipped
//   eye     press when the pulsing ring round the eye is smallest
// Your missing thumb makes everything a little shaky. Misses never fail you: you just go again (and the
// eye gives in after a few). A line tagged #end finishes, and you're back where you were.

export interface CarveSceneData {
  knot: string;
  /** Where to go back to afterwards. */
  back: AreaSceneData;
}

/** Where the bird sits (its centre), drawn at twice size. */
const BIRD_Y = 92;
const BIRD_SCALE = 2;
/** The timing bar under the bird. */
const BAR = { x: W / 2 - 70, y: 174, width: 140, height: 6 };
const STRIKES_NEEDED = 3;
/** Time (ms) the needle must spend in the green to finish smoothing. */
const SMOOTH_TIME = 2600;
const EYE_MISSES = 3;
const STAGES: Record<string, CarveStage> = { rough: 1, smooth: 2, wing: 3, eye: 4 };
const HINTS: Record<string, string> = {
  rough: 'Press E when the marker is in the green',
  smooth: 'Hold E to press harder, let go to ease off. Stay in the green',
  wing: 'Press E as the blade reaches the mark',
  eye: 'Press E when the ring is smallest',
};

type Step =
  | { kind: 'rough'; marker: number; dir: 1 | -1; zone: [number, number]; strikes: number }
  | { kind: 'smooth'; needle: number; velocity: number; inGreen: number }
  | { kind: 'wing'; blade: number; mark: number }
  | { kind: 'eye'; phase: number; misses: number };

export class CarveScene extends Phaser.Scene {
  private params!: CarveSceneData;
  private dialogue!: DialogueBox;
  private bird!: Phaser.GameObjects.Image;
  private knife!: Phaser.GameObjects.Image;
  private ui!: Phaser.GameObjects.Graphics;
  private hint!: PixelText;
  private stage: CarveStage = 0;
  private step: Step | null = null;
  private stepStage: CarveStage = 0;
  private keys!: Record<'e' | 'space', Phaser.Input.Keyboard.Key>;
  private ending = false;
  /** When the current step began, so the press that closed the last line doesn't count. */
  private stepStarted = 0;

  constructor() {
    super('Carve');
  }

  init(data: CarveSceneData): void {
    this.params = data;
    this.stage = 0;
    this.step = null;
    this.ending = false;
  }

  create(): void {
    makePaintedTexture(this, 'prologue-bench', W, 270, Art.paintBench());
    this.add.image(0, 0, 'prologue-bench').setOrigin(0);
    this.add.image(96, 170, makeSpriteTexture(this, 'prologue-shavings', Art.SHAVINGS.rows, Art.SHAVINGS.colours)).setOrigin(0);
    this.bird = this.add.image(W / 2, BIRD_Y, this.birdTexture()).setOrigin(0.5).setScale(BIRD_SCALE);
    this.knife = this.add.image(W / 2 + 120, 40, makeSpriteTexture(this, 'prologue-knife', Art.CARVING_KNIFE.rows, Art.CARVING_KNIFE.colours)).setOrigin(0, 1);
    this.ui = this.add.graphics();
    this.hint = new PixelText(this, 0, 184, '', { color: SHADES.light, shadow: SHADES.shadow });
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ e: K.E, space: K.SPACE }) as typeof this.keys;
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === 'e' || e.key === 'E' || e.key === ' ')) this.press();
    });
    this.input.on('pointerdown', () => this.press());
    this.dialogue = new DialogueBox(this, getSession(this).story);
    getSession(this).story.startKnot(this.params.knot);
    this.cameras.main.fadeIn(800);
    this.time.delayedCall(700, () => this.next());
  }

  override update(time: number, delta: number): void {
    const step = this.step;
    if (!step) return;
    const dt = delta / 1000;
    // Your hand isn't steady: a little tremor on everything.
    const shake = Math.sin(time / 90) * 0.012 + Math.sin(time / 37) * 0.008;
    switch (step.kind) {
      case 'rough':
        step.marker += step.dir * 0.9 * dt;
        if (step.marker > 1 || step.marker < 0) {
          step.dir = step.dir > 0 ? -1 : 1;
          step.marker = Phaser.Math.Clamp(step.marker, 0, 1);
        }
        break;
      case 'smooth': {
        const pushing = this.keys.e.isDown || this.keys.space.isDown || this.input.activePointer.isDown;
        step.velocity = Phaser.Math.Clamp(step.velocity + (pushing ? 1.6 : -1.4) * dt, -0.9, 0.9);
        step.needle = Phaser.Math.Clamp(step.needle + step.velocity * dt + shake * 0.6, 0, 1);
        if (step.needle === 0 || step.needle === 1) step.velocity = 0;
        const green = step.needle >= 0.4 && step.needle <= 0.65;
        if (green) {
          step.inGreen += delta;
          if (Math.random() < delta / 120) this.chip();
        }
        if (step.needle > 0.9) this.setHint('Too hard! Ease off.');
        else if (green) this.setHint(HINTS.smooth!);
        if (step.inGreen >= SMOOTH_TIME) return this.completeStep();
        break;
      }
      case 'wing':
        step.blade = (step.blade + 0.55 * dt) % 1.2;
        break;
      case 'eye':
        step.phase += dt * 2.6;
        break;
    }
    this.drawStep(shake);
  }

  // --- The timing games ---

  private press(): void {
    const step = this.step;
    if (!step || this.time.now - this.stepStarted < 200) return;
    switch (step.kind) {
      case 'rough': {
        if (step.marker >= step.zone[0] && step.marker <= step.zone[1]) {
          step.strikes += 1;
          playMove(this);
          for (let i = 0; i < 4; i++) this.chip();
          this.cameras.main.shake(80, 0.003);
          if (step.strikes >= STRIKES_NEEDED) return this.completeStep();
          step.zone = this.randomZone(0.16);
          this.setHint(`${HINTS.rough} (${step.strikes} of ${STRIKES_NEEDED})`);
        } else this.miss('The knife skids off the grain.');
        break;
      }
      case 'wing': {
        if (Math.abs(step.blade - step.mark) < 0.06) {
          for (let i = 0; i < 6; i++) this.chip();
          this.completeStep();
        } else this.miss('Not there. Wait for the mark.');
        break;
      }
      case 'eye': {
        if (this.ringRadius(step.phase) < 3.6 || step.misses >= EYE_MISSES) this.completeStep();
        else {
          step.misses += 1;
          this.miss('Your hand trembles. Again.');
        }
        break;
      }
      case 'smooth':
        break;
    }
  }

  private miss(text: string): void {
    this.cameras.main.shake(120, 0.005);
    this.knife.setAngle(16);
    this.tweens.add({ targets: this.knife, angle: 0, duration: 260 });
    this.setHint(text);
    this.time.delayedCall(900, () => this.step && this.setHint(HINTS[this.step.kind]!));
  }

  private completeStep(): void {
    this.step = null;
    this.stage = this.stepStage;
    this.bird.setTexture(this.birdTexture());
    this.ui.clear();
    this.setHint('');
    playConfirm(this);
    for (let i = 0; i < 6; i++) this.chip();
    this.dialogue.close();
    this.time.delayedCall(450, () => this.next());
  }

  private randomZone(width: number): [number, number] {
    const start = Phaser.Math.FloatBetween(0.1, 0.9 - width);
    return [start, start + width];
  }

  /** The eye ring's radius: it pulses, smallest for only a moment. */
  private ringRadius(phase: number): number {
    return 3 + Math.abs(Math.sin(phase)) * 11;
  }

  /** Canvas coordinates on the bird to screen coordinates. */
  private onBird(x: number, y: number): { x: number; y: number } {
    return { x: W / 2 + (x - CARVE_W / 2) * BIRD_SCALE, y: BIRD_Y + (y - CARVE_H / 2) * BIRD_SCALE };
  }

  private drawStep(shake: number): void {
    const g = this.ui.clear();
    const step = this.step;
    if (!step) return;
    const bar = (zone: [number, number] | null, marker: number | null) => {
      g.fillStyle(SHADES.shadow, 0.85).fillRect(BAR.x - 2, BAR.y - 2, BAR.width + 4, BAR.height + 4);
      g.fillStyle(SHADES.woodLight).fillRect(BAR.x, BAR.y, BAR.width, BAR.height);
      if (zone) g.fillStyle(SHADES.greenMid).fillRect(BAR.x + zone[0] * BAR.width, BAR.y, (zone[1] - zone[0]) * BAR.width, BAR.height);
      if (marker !== null) g.fillStyle(SHADES.white).fillRect(Math.round(BAR.x + Phaser.Math.Clamp(marker, 0, 1) * BAR.width) - 1, BAR.y - 3, 2, BAR.height + 6);
    };
    switch (step.kind) {
      case 'rough': {
        const m = Phaser.Math.Clamp(step.marker + shake, 0, 1);
        bar(step.zone, m);
        this.knife.setPosition(Math.round(W / 2 - 60 + m * 120), BIRD_Y - 30);
        break;
      }
      case 'smooth': {
        bar([0.4, 0.65], step.needle);
        // How much of the bird is smooth so far.
        g.fillStyle(SHADES.amber).fillRect(BAR.x, BAR.y + BAR.height + 4, Math.round(BAR.width * Math.min(1, step.inGreen / SMOOTH_TIME)), 2);
        this.knife.setPosition(Math.round(W / 2 + Math.cos(step.inGreen / 300) * 70), Math.round(BIRD_Y + 10 + Math.sin(step.inGreen / 300) * 30));
        break;
      }
      case 'wing': {
        const wing = wingPosition(this.birdOptions());
        const from = this.onBird(wing.from - 10, wing.y);
        const to = this.onBird(wing.x + 30, wing.y);
        const markX = Math.round(from.x + (to.x - from.x) * step.mark);
        const bladeX = from.x + (to.x - from.x) * (step.blade + shake);
        // The mark where the wing is clipped, and the blade sweeping along the wing towards it.
        g.lineStyle(1, SHADES.greenMid).lineBetween(markX, from.y - 26, markX, from.y + 18);
        g.fillStyle(SHADES.green).fillRect(markX - 1, from.y - 28, 3, 3);
        if (step.blade <= 1) this.knife.setPosition(Math.round(bladeX), Math.round(from.y - 4));
        bar([step.mark - 0.06, step.mark + 0.06], step.blade <= 1 ? step.blade : null);
        break;
      }
      case 'eye': {
        const at = eyePosition(this.birdOptions());
        const eye = this.onBird(at.x, at.y);
        const r = this.ringRadius(step.phase);
        g.lineStyle(1, r < 3.6 ? SHADES.green : SHADES.amber).strokeCircle(eye.x + shake * 20, eye.y, r);
        this.knife.setPosition(Math.round(eye.x + 14), Math.round(eye.y - 10));
        break;
      }
    }
  }

  // --- Stepping through the ink ---

  /** The next ink line: a menu if choices follow it, a timing game for #step, else a line to read. */
  private next(): void {
    const { story } = getSession(this);
    if (!story.canContinue) return this.finish();
    const line = story.nextLine();
    if (!line) return this.finish();
    const tags = line.tags;
    const stepName = tags.find((t) => t.startsWith('step:'))?.slice(5);
    const choices = story.canContinue ? [] : story.choices();
    if (choices.length) {
      this.dialogue.openMenu(line.text, choices.map((c) => ({ label: c.text, run: () => (story.choose(c.index), this.time.delayedCall(150, () => this.next())) })));
    } else if (stepName && STAGES[stepName] !== undefined) {
      this.dialogue.hold(line.text, tags);
      this.startStep(stepName);
    } else if (tags.includes('end')) {
      this.dialogue.line(line.text, tags, () => this.finish());
    } else {
      this.dialogue.line(line.text, tags, () => this.next());
    }
  }

  private startStep(name: string): void {
    this.stepStage = STAGES[name]!;
    this.stepStarted = this.time.now;
    switch (name) {
      case 'rough':
        this.step = { kind: 'rough', marker: 0, dir: 1, zone: this.randomZone(0.2), strikes: 0 };
        break;
      case 'smooth':
        this.step = { kind: 'smooth', needle: 0, velocity: 0, inGreen: 0 };
        break;
      case 'wing': {
        // The mark sits where the wing is clipped (or, on your usual bird, where it ends).
        const wing = wingPosition(this.birdOptions());
        const from = wing.from - 10;
        const to = wing.x + 30;
        this.step = { kind: 'wing', blade: 0, mark: (wing.x - from) / (to - from) };
        break;
      }
      default:
        this.step = { kind: 'eye', phase: 0, misses: 0 };
    }
    this.setHint(HINTS[name]!);
  }

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  private birdOptions(): CarveOptions {
    const { story } = getSession(this);
    return {
      kind: story.getVariable('reply1') === 'usual' ? 'usual' : 'fledgling',
      size: String(story.getVariable('fledgling_size')),
      eye: String(story.getVariable('fledgling_eye')),
    };
  }

  private birdTexture(): string {
    const opts = this.birdOptions();
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

  private setHint(text: string): void {
    this.hint.setText(text).setX(Math.round((W - this.hint.width) / 2)).setVisible(text !== '');
  }
}
