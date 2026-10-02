import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { PROTAGONIST, VILLAGERS } from '../ui/characters';
import { addLight, falloff, noise, rgb, SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { playConfirm } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import { StepScene } from './StepScene';

// The market fight (Day 4): you and the young zealot face to face, close up. A timing scene for now
// (designer; it may become real-time later), stepped through an ink knot (day4_fight) by StepScene.
// Each #step is one chance, and counts in ink: fight_landed if you pull it off, fight_taken if not.
//   dodge  a ring closes in on you as he swings: press as it crosses the green
//   shove  press as the marker passes the green, once
//   grab   hold E to keep your grip in the green; your hand keeps slipping (no thumb)
// You can't make a proper fist, so the ink offers a punch that does nothing.

/** The floor line, and where the two of you stand. */
const FLOOR = 196;
const YOU_X = 186;
const HIM_X = 292;
const SCALE = 3;
/** The timing bar. */
const BAR = { x: W / 2 - 70, y: 18, width: 140, height: 6 };
const DODGE_TIME = 1200;
const DODGE_GREEN: [number, number] = [7, 15];
const SHOVE_TIME = 1500;
const GRAB_GREEN: [number, number] = [0.45, 0.75];
const GRAB_HOLD = 1400;
const GRAB_TIME = 4200;
const HINTS: Record<string, string> = {
  dodge: 'Press E as the ring crosses the green',
  shove: 'Press E when the marker is in the green',
  grab: 'Hold E to keep your grip in the green',
};

type Step =
  | { kind: 'dodge'; t: number }
  | { kind: 'shove'; t: number; zone: [number, number] }
  | { kind: 'grab'; t: number; needle: number; velocity: number; held: number };

export class FightScene extends StepScene {
  private you!: Phaser.GameObjects.Image;
  private him!: Phaser.GameObjects.Image;
  private ui!: Phaser.GameObjects.Graphics;
  private step: Step | null = null;
  private keys!: Record<'e' | 'space', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('Fight');
  }

  create(): void {
    this.step = null;
    makePaintedTexture(this, 'fight-backdrop', W, 270, paintMarketCloseUp());
    this.add.image(0, 0, 'fight-backdrop').setOrigin(0);
    const you = PROTAGONIST.idle[0]!;
    const him = VILLAGERS[0]!.idle[0]!;
    this.you = this.add.image(YOU_X, FLOOR, makeSpriteTexture(this, 'fight-you', you.rows, you.colours)).setOrigin(0.5, 1).setScale(SCALE);
    this.him = this.add.image(HIM_X, FLOOR, makeSpriteTexture(this, 'fight-him', him.rows, him.colours)).setOrigin(0.5, 1).setScale(SCALE).setFlipX(true);
    this.ui = this.add.graphics().setDepth(4);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ e: K.E, space: K.SPACE }) as typeof this.keys;
    this.begin(30);
  }

  override update(time: number, delta: number): void {
    const step = this.step;
    if (!step) return;
    step.t += delta;
    const shake = Math.sin(time / 70) * 0.02 + Math.sin(time / 31) * 0.012;
    switch (step.kind) {
      case 'dodge':
        if (step.t >= DODGE_TIME) return this.result(false, 'He hits you.');
        break;
      case 'shove':
        if (step.t >= SHOVE_TIME) return this.result(false, 'Too slow. He shoves you back.');
        break;
      case 'grab': {
        const holding = this.keys.e.isDown || this.keys.space.isDown || this.input.activePointer.isDown;
        // Your grip keeps slipping: without a thumb, it never stays put.
        step.velocity = Phaser.Math.Clamp(step.velocity + (holding ? 1.5 : -1.8) * (delta / 1000), -1, 1);
        step.needle = Phaser.Math.Clamp(step.needle + step.velocity * (delta / 1000) + shake, 0, 1);
        if (step.needle === 0 || step.needle === 1) step.velocity = 0;
        if (step.needle >= GRAB_GREEN[0] && step.needle <= GRAB_GREEN[1]) step.held += delta;
        if (step.held >= GRAB_HOLD) return this.result(true, 'You drag him off balance.');
        if (step.t >= GRAB_TIME) return this.result(false, 'He tears free.');
        break;
      }
    }
    this.draw();
  }

  protected hasStep(name: string): boolean {
    return name in HINTS;
  }

  protected startStep(name: string): void {
    if (name === 'dodge') {
      this.step = { kind: 'dodge', t: 0 };
      // He winds up.
      this.tweens.add({ targets: this.him, x: HIM_X + 6, duration: 300, yoyo: true });
    } else if (name === 'shove') {
      const start = Phaser.Math.FloatBetween(0.35, 0.7);
      this.step = { kind: 'shove', t: 0, zone: [start, start + 0.18] };
    } else this.step = { kind: 'grab', t: 0, needle: 0.2, velocity: 0, held: 0 };
    this.setHint(HINTS[name]!);
  }

  protected press(): void {
    const step = this.step;
    if (!step) return;
    if (step.kind === 'dodge') {
      const r = this.dodgeRadius(step.t);
      this.result(r >= DODGE_GREEN[0] && r <= DODGE_GREEN[1], 'You duck under it.', r > DODGE_GREEN[1] ? 'Too soon. He hits you.' : 'He hits you.');
    } else if (step.kind === 'shove') {
      const m = step.t / SHOVE_TIME;
      this.result(m >= step.zone[0] && m <= step.zone[1], 'You shove him back.', 'You miss. He shoves you back.');
    }
  }

  /** One chance per step: it counts in ink, and you see it land (or not). */
  private result(won: boolean, yes: string, no = yes): void {
    const step = this.step;
    if (!step) return;
    this.step = null;
    this.ui.clear();
    const { story } = getSession(this);
    const variable = won ? 'fight_landed' : 'fight_taken';
    story.setVariable(variable, Number(story.getVariable(variable)) + 1);
    if (won) {
      playConfirm(this);
      playSound(this, step.kind === 'dodge' ? 'whoosh' : 'punch');
      if (step.kind === 'dodge') this.tweens.add({ targets: this.you, x: YOU_X - 14, y: FLOOR + 2, duration: 140, yoyo: true });
      else this.tweens.add({ targets: this.him, x: HIM_X + 24, duration: 160, yoyo: true, hold: 200 });
    } else {
      playSound(this, 'punch', 1.2);
      this.time.delayedCall(180, () => playSound(this, 'thump', 0.6));
      this.cameras.main.shake(260, 0.012).flash(200, 244, 241, 232);
      this.tweens.add({ targets: this.you, x: YOU_X - 20, angle: -8, duration: 140, yoyo: true, hold: 200 });
      this.tweens.add({ targets: this.him, x: HIM_X - 40, duration: 140, yoyo: true, hold: 200 });
    }
    this.setHint(won ? yes : no);
    this.time.delayedCall(900, () => this.endStep(200));
  }

  /** The ring closing in on you as his fist comes: from wide to nothing over DODGE_TIME. */
  private dodgeRadius(t: number): number {
    return Math.max(0, 40 * (1 - t / DODGE_TIME));
  }

  private draw(): void {
    const g = this.ui.clear();
    const step = this.step;
    if (!step) return;
    const bar = (zone: [number, number], marker: number) => {
      g.fillStyle(SHADES.shadow, 0.85).fillRect(BAR.x - 2, BAR.y - 2, BAR.width + 4, BAR.height + 4);
      g.fillStyle(SHADES.woodLight).fillRect(BAR.x, BAR.y, BAR.width, BAR.height);
      g.fillStyle(SHADES.greenMid).fillRect(BAR.x + zone[0] * BAR.width, BAR.y, (zone[1] - zone[0]) * BAR.width, BAR.height);
      g.fillStyle(SHADES.white).fillRect(Math.round(BAR.x + Phaser.Math.Clamp(marker, 0, 1) * BAR.width) - 1, BAR.y - 3, 2, BAR.height + 6);
    };
    const head = { x: YOU_X, y: FLOOR - 26 * SCALE + 14 };
    switch (step.kind) {
      case 'dodge': {
        const r = this.dodgeRadius(step.t);
        g.lineStyle(1, SHADES.greenMid).strokeCircle(head.x, head.y, DODGE_GREEN[0]).strokeCircle(head.x, head.y, DODGE_GREEN[1]);
        g.lineStyle(2, r >= DODGE_GREEN[0] && r <= DODGE_GREEN[1] ? SHADES.green : SHADES.amber).strokeCircle(head.x, head.y, r);
        break;
      }
      case 'shove':
        bar(step.zone, step.t / SHOVE_TIME);
        break;
      case 'grab':
        bar(GRAB_GREEN, step.needle);
        g.fillStyle(SHADES.amber).fillRect(BAR.x, BAR.y + BAR.height + 4, Math.round(BAR.width * Math.min(1, step.held / GRAB_HOLD)), 2);
        g.fillStyle(SHADES.dim).fillRect(BAR.x, BAR.y + BAR.height + 7, Math.round(BAR.width * Math.max(0, 1 - step.t / GRAB_TIME)), 1);
        break;
    }
  }
}

/** The market, close up and out of focus behind the two of you: stalls' warm light, the crowd's shapes, the floor. */
function paintMarketCloseUp() {
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  return (x: number, y: number) => {
    if (y >= FLOOR) return (x + y) % 9 === 0 ? SHADES.deep : y === FLOOR ? SHADES.woodPale : SHADES.woodLight;
    // Blurred shapes of the crowd standing round in a ring.
    const crowd = y > FLOOR - 70 && noise(Math.floor(x / 14) * 3.1) > 0.45 && Math.abs(x - 240) > 110 && y > FLOOR - 70 + noise(Math.floor(x / 14)) * 20;
    if (crowd) return SHADES.shadow;
    const c = addLight(wood, amber, falloff(x, y, 90, 120, 120, 90) * 0.35 + falloff(x, y, 400, 90, 110, 80) * 0.3);
    return noise(x / 5 + y / 40) > 0.7 ? addLight(c, rgb(SHADES.woodLight), 0.15) : c;
  };
}
