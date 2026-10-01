import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { REPLY_SETS, type ReplyOption } from '../data/messages';
import { getSession } from '../session';
import { bellyPosition, carvedBird, CARVE_H, CARVE_W, eyePosition, wingPosition, type CarveOptions, type CarveStage } from '../ui/carveArt';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import * as Art from '../ui/prologueArt';
import { playConfirm, playMove } from '../ui/sfx';
import { StepScene, type StepSceneData } from './StepScene';

// The carving close-up (Day 3 onwards): the bench by firelight, like the prologue, but older, and with
// your ruined hand. The words and choices come from an ink knot (e.g. day3_carving), stepped through by
// StepScene. Each #step:<stage> is a little timing game (designer: timing, not just holding):
//   rough    strike when the swinging marker is in the green, three times
//   smooth   hold E to press harder, let go to ease off; keep the shaky needle in the green
//   wing     press as the blade passes the mark where the wing is clipped
//   eye      press when the pulsing ring round the eye is smallest
//   scratch  (a reply) strike in the green three times; each strike scratches more of the picture
//   hollow   like smoothing, inside the bird, but press too hard and the wall cracks: start again
//   seal     press when the ring round the plug is smallest
// A line tagged #plate:<set> shows the three pictures you can reply with (REPLY_SETS), beside the choices (Day 4 on).
// Your missing thumb makes everything a little shaky. Misses never fail you: you just go again (the eye
// and the seal give in after a few).

export type CarveSceneData = StepSceneData;

/** Where the bird sits (its centre), drawn at twice size. */
const BIRD_Y = 92;
const BIRD_SCALE = 2;
/** The timing bar under the bird. */
const BAR = { x: W / 2 - 70, y: 174, width: 140, height: 6 };
const STRIKES_NEEDED = 3;
/** Time (ms) the needle must spend in the green to finish smoothing, or hollowing. */
const SMOOTH_TIME = 2600;
const HOLLOW_TIME = 2400;
/** Hollowing: the green, and how hard is too hard. */
const HOLLOW_GREEN: [number, number] = [0.35, 0.6];
const CRACK_AT = 0.82;
const RING_MISSES = 3;
/** The bird's look once each step is done (scratching the reply doesn't touch it). */
const STAGES: Record<string, CarveStage | null> = { rough: 1, smooth: 2, wing: 3, eye: 4, scratch: null, hollow: 2, seal: 4 };
const HINTS: Record<string, string> = {
  rough: 'Press E when the marker is in the green',
  smooth: 'Hold E to press harder, let go to ease off. Stay in the green',
  wing: 'Press E as the blade reaches the mark',
  eye: 'Press E when the ring is smallest',
  scratch: 'Press E when the marker is in the green',
  hollow: 'Hold E to dig, let go to ease off. Too hard and it cracks',
  seal: 'Press E when the ring is smallest',
};
/** The plate you scratch your reply on, and the pictures on it, drawn at three times size. */
const PLATE_SCALE = 3;
const PLATE_Y = 82;

type Step =
  | { kind: 'rough' | 'scratch'; marker: number; dir: 1 | -1; zone: [number, number]; strikes: number }
  | { kind: 'smooth'; needle: number; velocity: number; inGreen: number }
  | { kind: 'hollow'; needle: number; velocity: number; inGreen: number }
  | { kind: 'wing'; blade: number; mark: number }
  | { kind: 'eye' | 'seal'; phase: number; misses: number };

export class CarveScene extends StepScene {
  private bird!: Phaser.GameObjects.Image;
  private knife!: Phaser.GameObjects.Image;
  private ui!: Phaser.GameObjects.Graphics;
  private hole!: Phaser.GameObjects.Graphics;
  private stage: CarveStage = 0;
  private step: Step | null = null;
  private stepName = '';
  private keys!: Record<'e' | 'space', Phaser.Input.Keyboard.Key>;
  /** The three reply pictures shown with the choices (#plate), and the plate you scratch one onto. */
  private choicePlates: Phaser.GameObjects.GameObject[] = [];
  private plate: Phaser.GameObjects.Container | null = null;
  private platePicture: Phaser.GameObjects.Image | null = null;
  /** The hole in the bird's belly, between hollowing and sealing. */
  private holeOpen = false;
  /** Which set of reply pictures the last #plate line offered. */
  private replySet = REPLY_SETS.reply2!;

  constructor() {
    super('Carve');
  }

  override init(data: CarveSceneData): void {
    super.init(data);
    this.stage = 0;
    this.step = null;
    this.choicePlates = [];
    this.plate = null;
    this.platePicture = null;
    this.holeOpen = false;
  }

  create(): void {
    makePaintedTexture(this, 'prologue-bench', W, 270, Art.paintBench());
    this.add.image(0, 0, 'prologue-bench').setOrigin(0);
    this.add.image(96, 170, makeSpriteTexture(this, 'prologue-shavings', Art.SHAVINGS.rows, Art.SHAVINGS.colours)).setOrigin(0);
    this.bird = this.add.image(W / 2, BIRD_Y, this.birdTexture()).setOrigin(0.5).setScale(BIRD_SCALE);
    this.knife = this.add.image(W / 2 + 120, 40, makeSpriteTexture(this, 'prologue-knife', Art.CARVING_KNIFE.rows, Art.CARVING_KNIFE.colours)).setOrigin(0, 1).setDepth(5);
    this.hole = this.add.graphics().setDepth(3);
    this.ui = this.add.graphics().setDepth(4);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ e: K.E, space: K.SPACE }) as typeof this.keys;
    this.begin(184);
  }

  override update(time: number, delta: number): void {
    const step = this.step;
    this.drawHole();
    if (!step) return;
    const dt = delta / 1000;
    // Your hand isn't steady: a little tremor on everything.
    const shake = Math.sin(time / 90) * 0.012 + Math.sin(time / 37) * 0.008;
    const pushing = this.keys.e.isDown || this.keys.space.isDown || this.input.activePointer.isDown;
    switch (step.kind) {
      case 'rough':
      case 'scratch':
        step.marker += step.dir * 0.9 * dt;
        if (step.marker > 1 || step.marker < 0) {
          step.dir = step.dir > 0 ? -1 : 1;
          step.marker = Phaser.Math.Clamp(step.marker, 0, 1);
        }
        break;
      case 'smooth': {
        this.pushNeedle(step, pushing, shake, dt);
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
      case 'hollow': {
        this.pushNeedle(step, pushing, shake, dt);
        if (step.needle >= CRACK_AT) return this.crack(step);
        const green = step.needle >= HOLLOW_GREEN[0] && step.needle <= HOLLOW_GREEN[1];
        if (green) {
          step.inGreen += delta;
          if (Math.random() < delta / 160) this.chip();
        }
        if (step.needle > HOLLOW_GREEN[1] + 0.08) this.setHint('Careful! The wall is thin.');
        else if (green) this.setHint(HINTS.hollow!);
        if (step.inGreen >= HOLLOW_TIME) return this.completeStep();
        break;
      }
      case 'wing':
        step.blade = (step.blade + 0.55 * dt) % 1.2;
        break;
      case 'eye':
      case 'seal':
        step.phase += dt * 2.6;
        break;
    }
    this.drawStep(shake);
  }

  /** Pressure: holding pushes the needle up (with your hand's shake), letting go eases it down. */
  private pushNeedle(step: { needle: number; velocity: number }, pushing: boolean, shake: number, dt: number): void {
    step.velocity = Phaser.Math.Clamp(step.velocity + (pushing ? 1.6 : -1.4) * dt, -0.9, 0.9);
    step.needle = Phaser.Math.Clamp(step.needle + step.velocity * dt + shake * 0.6, 0, 1);
    if (step.needle === 0 || step.needle === 1) step.velocity = 0;
  }

  // --- The timing games ---

  protected hasStep(name: string): boolean {
    return name in STAGES;
  }

  protected press(): void {
    const step = this.step;
    if (!step) return;
    switch (step.kind) {
      case 'rough':
      case 'scratch': {
        if (step.marker >= step.zone[0] && step.marker <= step.zone[1]) {
          step.strikes += 1;
          playMove(this);
          for (let i = 0; i < 4; i++) this.chip();
          this.cameras.main.shake(80, 0.003);
          if (step.kind === 'scratch') this.showReply(step.strikes / STRIKES_NEEDED);
          if (step.strikes >= STRIKES_NEEDED) return this.completeStep();
          step.zone = this.randomZone(0.16);
          this.setHint(`${HINTS[step.kind]} (${step.strikes} of ${STRIKES_NEEDED})`);
        } else this.miss(step.kind === 'scratch' ? 'The point skids across the metal.' : 'The knife skids off the grain.');
        break;
      }
      case 'wing': {
        if (Math.abs(step.blade - step.mark) < 0.06) {
          for (let i = 0; i < 6; i++) this.chip();
          this.completeStep();
        } else this.miss('Not there. Wait for the mark.');
        break;
      }
      case 'eye':
      case 'seal': {
        if (this.ringRadius(step.phase) < 3.6 || step.misses >= RING_MISSES) this.completeStep();
        else {
          step.misses += 1;
          this.miss(step.kind === 'seal' ? "It won't go in straight. Again." : 'Your hand trembles. Again.');
        }
        break;
      }
      case 'smooth':
      case 'hollow':
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

  /** Too hard: the wall of the bird splits. You start the hollowing again (the crack is glued and clamped off-screen). */
  private crack(step: Extract<Step, { kind: 'hollow' }>): void {
    step.inGreen = 0;
    step.needle = 0.1;
    step.velocity = 0;
    this.cameras.main.shake(260, 0.01);
    playMove(this);
    const at = this.onBird(bellyPosition(this.birdOptions()).x, bellyPosition(this.birdOptions()).y);
    const crack = this.add.graphics().setDepth(6).lineStyle(1, SHADES.white).lineBetween(at.x - 4, at.y - 14, at.x + 2, at.y - 6).lineBetween(at.x + 2, at.y - 6, at.x - 2, at.y + 2);
    this.tweens.add({ targets: crack, alpha: 0, duration: 1200, delay: 400, onComplete: () => crack.destroy() });
    this.setHint('It cracked! Start again, gently.');
    this.time.delayedCall(1400, () => this.step === step && this.setHint(HINTS.hollow!));
  }

  private completeStep(): void {
    const done = STAGES[this.stepName];
    this.step = null;
    if (done !== null && done !== undefined) this.stage = done;
    if (this.stepName === 'hollow') this.holeOpen = true;
    if (this.stepName === 'seal') this.holeOpen = false;
    if (this.stepName === 'scratch') this.putPlateAside();
    this.bird.setTexture(this.birdTexture());
    this.ui.clear();
    playConfirm(this);
    for (let i = 0; i < 6; i++) this.chip();
    this.endStep();
  }

  private randomZone(width: number): [number, number] {
    const start = Phaser.Math.FloatBetween(0.1, 0.9 - width);
    return [start, start + width];
  }

  /** The eye's (or the plug's) ring: it pulses, smallest for only a moment. */
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
      case 'rough':
      case 'scratch': {
        const m = Phaser.Math.Clamp(step.marker + shake, 0, 1);
        bar(step.zone, m);
        this.knife.setPosition(Math.round(W / 2 - 60 + m * 120), step.kind === 'scratch' ? PLATE_Y - 10 : BIRD_Y - 30);
        break;
      }
      case 'smooth':
      case 'hollow': {
        const green = step.kind === 'smooth' ? ([0.4, 0.65] as [number, number]) : HOLLOW_GREEN;
        bar(green, step.needle);
        if (step.kind === 'hollow') g.fillStyle(SHADES.dim).fillRect(BAR.x + CRACK_AT * BAR.width, BAR.y - 1, BAR.width * (1 - CRACK_AT), BAR.height + 2);
        // How much is done so far.
        const total = step.kind === 'smooth' ? SMOOTH_TIME : HOLLOW_TIME;
        g.fillStyle(SHADES.amber).fillRect(BAR.x, BAR.y + BAR.height + 4, Math.round(BAR.width * Math.min(1, step.inGreen / total)), 2);
        if (step.kind === 'smooth') this.knife.setPosition(Math.round(W / 2 + Math.cos(step.inGreen / 300) * 70), Math.round(BIRD_Y + 10 + Math.sin(step.inGreen / 300) * 30));
        else {
          const at = this.onBird(bellyPosition(this.birdOptions()).x, bellyPosition(this.birdOptions()).y);
          this.knife.setPosition(Math.round(at.x - 2 + Math.sin(step.inGreen / 200) * 3), Math.round(at.y + 4 - step.needle * 6));
        }
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
      case 'eye':
      case 'seal': {
        const at = step.kind === 'eye' ? eyePosition(this.birdOptions()) : bellyPosition(this.birdOptions());
        const p = this.onBird(at.x, at.y);
        const r = this.ringRadius(step.phase);
        g.lineStyle(1, r < 3.6 ? SHADES.green : SHADES.amber).strokeCircle(p.x + shake * 20, p.y, r);
        this.knife.setPosition(Math.round(p.x + 14), Math.round(p.y - 10));
        break;
      }
    }
  }

  /** The dark hole in the belly while the bird is hollow and open. */
  private drawHole(): void {
    this.hole.clear();
    if (!this.holeOpen && this.step?.kind !== 'hollow') return;
    const at = this.onBird(bellyPosition(this.birdOptions()).x, bellyPosition(this.birdOptions()).y);
    const depth = this.step?.kind === 'hollow' ? Math.min(1, this.step.inGreen / HOLLOW_TIME) : 1;
    this.hole.fillStyle(SHADES.shadow).fillEllipse(at.x, at.y, 6 + depth * 10, 4 + depth * 5);
  }

  // --- Your reply (Day 4 on) ---

  protected override onLine(tags: string[]): void {
    const plate = tags.find((t) => t === 'plate' || t.startsWith('plate:'));
    if (plate) {
      this.replySet = REPLY_SETS[plate.slice(6)] ?? REPLY_SETS.reply2!;
      this.showChoices();
    } else this.clearChoices();
  }

  /** The three pictures you could scratch, numbered like the choices beneath them. */
  private showChoices(): void {
    this.clearChoices();
    this.bird.setVisible(false);
    this.replySet.options.forEach(({ value, picture }, i) => {
      const x = W / 2 + (i - 1) * 110;
      const w = picture[0]!.length * PLATE_SCALE + 12;
      const h = picture.length * PLATE_SCALE + 12;
      const back = this.add.rectangle(x, PLATE_Y, w, h, SHADES.light).setStrokeStyle(1, SHADES.dim);
      const image = this.add.image(x, PLATE_Y, makeSpriteTexture(this, `reply-${value}`, picture, { '#': SHADES.deep })).setScale(PLATE_SCALE);
      const label = new PixelText(this, 0, PLATE_Y + h / 2 + 4, String(i + 1), { color: SHADES.amber, shadow: SHADES.shadow });
      label.setX(Math.round(x - label.width / 2));
      this.choicePlates.push(back, image, label);
    });
  }

  private clearChoices(): void {
    for (const o of this.choicePlates) o.destroy();
    this.choicePlates = [];
  }

  /** The back of his plate, with as much of your picture as you've scratched so far (0–1). */
  private showReply(fraction: number): void {
    const { value, picture } = this.reply();
    const cut = Math.round(picture[0]!.length * fraction);
    const rows = picture.map((row) => [...row].map((ch, x) => (x < cut ? ch : '.')).join(''));
    const key = makeSpriteTexture(this, `reply-${value}-${cut}`, rows, { '#': SHADES.deep });
    if (!this.plate) {
      const w = picture[0]!.length * PLATE_SCALE + 16;
      const h = picture.length * PLATE_SCALE + 16;
      this.platePicture = this.add.image(0, 0, key).setScale(PLATE_SCALE);
      this.plate = this.add.container(W / 2, PLATE_Y, [this.add.rectangle(0, 0, w, h, SHADES.light).setStrokeStyle(1, SHADES.dim), this.platePicture]);
    } else this.platePicture?.setTexture(key);
  }

  /** The reply's scratched: the plate goes to the side of the bench, and the wood comes out. */
  private putPlateAside(): void {
    if (this.plate) this.tweens.add({ targets: this.plate, x: 74, y: 150, scale: 0.4, duration: 600, ease: 'Sine.easeInOut' });
    this.time.delayedCall(500, () => {
      this.bird.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.bird, alpha: 1, duration: 400 });
    });
  }

  /** The picture you chose from the current set (the first, if somehow none). */
  private reply(): ReplyOption {
    const chosen = String(getSession(this).story.getVariable(this.replySet.variable));
    return this.replySet.options.find((o) => o.value === chosen) ?? this.replySet.options[0]!;
  }

  protected startStep(name: string): void {
    this.stepName = name;
    switch (name) {
      case 'rough':
        this.step = { kind: 'rough', marker: 0, dir: 1, zone: this.randomZone(0.2), strikes: 0 };
        break;
      case 'scratch':
        this.showReply(0);
        this.step = { kind: 'scratch', marker: 0, dir: 1, zone: this.randomZone(0.2), strikes: 0 };
        break;
      case 'smooth':
        this.step = { kind: 'smooth', needle: 0, velocity: 0, inGreen: 0 };
        break;
      case 'hollow':
        this.step = { kind: 'hollow', needle: 0, velocity: 0, inGreen: 0 };
        break;
      case 'wing': {
        // The mark sits where the wing is clipped (or, on your usual bird, where it ends).
        const wing = wingPosition(this.birdOptions());
        const from = wing.from - 10;
        const to = wing.x + 30;
        this.step = { kind: 'wing', blade: 0, mark: (wing.x - from) / (to - from) };
        break;
      }
      case 'seal':
        this.step = { kind: 'seal', phase: 0, misses: 0 };
        break;
      default:
        this.step = { kind: 'eye', phase: 0, misses: 0 };
    }
    this.setHint(HINTS[name]!);
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
}
