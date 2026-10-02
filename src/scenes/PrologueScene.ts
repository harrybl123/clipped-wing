import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { tubeColumn } from '../data/areas/offeringFloorProps';
import { getSession } from '../session';
import { DialogueBox } from '../ui/DialogueBox';
import { addLight, falloff, noise, rgb, SHADES, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import * as Art from '../ui/prologueArt';
import { MORE_ARROW, type RowSprite } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';
import type { ChapterSceneData } from './ChapterScene';
import { paintTree } from './MapScene';

// The prologue: a close-up memory. The workbench by firelight, the half-carved bird big in the middle,
// the carving knife beside it; no hands, no faces, just you and Mum talking. You follow her
// instructions (turn the bird; hold E to carve along the wing) while she praises you, until the knife
// slips and takes your left thumb and forefinger (blood drops onto the bird). Black. Then your
// older self's narration on black, and the world explained over two stills (the tree; the tube),
// before you wake at home on Day 1.
//
// The words and the order live in story/prologue.ink (knot `prologue`). Each ink line can carry tags
// that this scene acts on:
//   #name:Mum        a voice with no face (shown in the dialogue box)
//   #step:turn       show the line and wait for the player to turn the bird (left/right)
//   #step:smooth     show the line and wait for the player to smooth the head (rock it: left, right, left…)
//   #step:carve      show the line and wait for the player to carve along the wing (hold E)
//   #step:eye        show the line and wait for the player to cut the eye (press E when the ring is smallest)
//   #step:slip       as carve, but the knife slips partway
//   #black           cut to black before this line
//   #narration       show the line as narration (on black, or under a still)
//   #tableau:<id>    show a still (tree, tube) with this line
//   #end             after this line, fade out and wake at home on Day 1

/** Carving speed: fraction of the wing per second while E is held. */
const CARVE_SPEED = 0.32;
/** How far along the wing the knife slips on the last cut. */
const SLIP_AT = 0.6;
/** Little chips of wood the knife cuts out (pale fresh wood, a darker edge). */
const CHIPS: RowSprite[] = [
  { rows: ['.pp', 'ppl', 'l..'], colours: { p: SHADES.light, l: SHADES.woodPale } },
  { rows: ['pp.', '.pl'], colours: { p: SHADES.light, l: SHADES.woodPale } },
  { rows: ['.p..', 'pppl', '..l.'], colours: { p: SHADES.woodPale, l: SHADES.woodLight } },
  { rows: ['p', 'l'], colours: { p: SHADES.light, l: SHADES.woodPale } },
];

/** Rocks needed to smooth the head (alternating left and right). */
const SMOOTH_ROCKS = 8;
/** Misses allowed on the eye before it just works (it's a kindness, not a test). */
const EYE_MISSES = 3;

type Step =
  | { kind: 'turn'; target: 'left' | 'right' }
  | { kind: 'smooth'; rocks: number; last: 'left' | 'right' | null }
  | { kind: 'eye'; misses: number; ring: Phaser.GameObjects.Graphics; phase: number }
  | { kind: 'carve' | 'slip'; facing: 'left' | 'right'; progress: number; lastChip: number };

export class PrologueScene extends Phaser.Scene {
  private dialogue!: DialogueBox;
  private layers!: { closeup: Phaser.GameObjects.Container; tableau: Phaser.GameObjects.Container; black: Phaser.GameObjects.Rectangle };
  private bird!: Phaser.GameObjects.Image;
  private facing: 'left' | 'right' = 'left';
  /** How far the carving has got: each wing, the head, the eye. */
  private carved = { left: false, right: false, head: false, eye: false };
  private knife!: Phaser.GameObjects.Image;
  private guide!: Phaser.GameObjects.Graphics;
  private hint!: PixelText;
  private narration!: PixelText;
  private narrationArrow!: Phaser.GameObjects.Image;
  private step: Step | null = null;
  /** When the current step began (so the click that started it doesn't also count). */
  private stepStarted = 0;
  private waitingForNarration = false;
  private endAfterNarration = false;
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'e' | 'space', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('Prologue');
  }

  create(): void {
    this.step = null;
    this.facing = 'left';
    this.carved = { left: false, right: false, head: false, eye: false };
    this.waitingForNarration = false;
    this.endAfterNarration = false;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, e: K.E, space: K.SPACE }) as typeof this.keys;

    const closeup = this.buildCloseup();
    const tableau = this.add.container(0, 0).setVisible(false);
    const black = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setDepth(40).setAlpha(0);
    this.layers = { closeup, tableau, black };

    this.hint = new PixelText(this, 0, 0, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(45).setVisible(false);
    this.narration = new PixelText(this, 0, 0, '', { color: SHADES.light, wrapWidth: 340, centred: true }).setDepth(50).setVisible(false);
    this.narrationArrow = this.add.image(0, 0, makeSpriteTexture(this, 'more-arrow', MORE_ARROW.rows, MORE_ARROW.colours)).setDepth(50).setVisible(false);
    this.tweens.add({ targets: this.narrationArrow, y: '+=1', duration: 400, yoyo: true, repeat: -1 });
    this.dialogue = new DialogueBox(this, getSession(this).story);

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat || !this.waitingForNarration) return;
      if ([' ', 'enter', 'e'].includes(e.key.toLowerCase())) this.continueNarration();
    });
    this.input.on('pointerdown', () => {
      if (this.waitingForNarration) this.continueNarration();
      // A click turns the bird, unless it's the same click that just closed the previous line.
      else if (this.step?.kind === 'turn' && this.time.now - this.stepStarted > 150) this.turnBird(this.step.target);
    });

    getSession(this).story.startKnot('prologue');
    this.cameras.main.fadeIn(1600);
    this.time.delayedCall(1400, () => this.next());
  }

  // --- The close-up ---

  /** The bench, the bird and the knife. */
  private buildCloseup(): Phaser.GameObjects.Container {
    const closeup = this.add.container(0, 0);
    const tex = (key: string, s: RowSprite) => makeSpriteTexture(this, key, s.rows, s.colours);
    makePaintedTexture(this, 'prologue-bench', W, H, Art.paintBench());
    closeup.add(this.add.image(0, 0, 'prologue-bench').setOrigin(0));
    closeup.add(this.add.image(96, 170, tex('prologue-shavings', Art.SHAVINGS)).setOrigin(0));
    closeup.add(this.add.image(360, 150, tex('prologue-shavings', Art.SHAVINGS)).setOrigin(0).setFlipX(true));
    closeup.add(this.add.image(370, 40, tex('prologue-spare-chisel', Art.SPARE_CHISEL)).setOrigin(0).setAngle(-12));
    // Anchored on its centre line so it can turn (narrow and widen) about it.
    this.bird = this.add.image(Art.BIRD_CX, 0, this.birdTexture('left')).setOrigin(Art.BIRD_CX / W, 0);
    closeup.add(this.bird);
    this.guide = this.add.graphics();
    closeup.add(this.guide);
    this.knife = this.add.image(0, 0, tex('prologue-knife', Art.CARVING_KNIFE)).setOrigin(0);
    closeup.add(this.knife);
    this.restKnife();
    return closeup;
  }

  private birdTexture(facing: Art.BirdFacing): string {
    const state: Art.BirdState = { nearWingCarved: this.carved[facing], headSmooth: this.carved.head, eyeCarved: this.carved.eye };
    const key = `prologue-bird-${facing}-${Number(state.nearWingCarved)}${Number(state.headSmooth)}${Number(state.eyeCarved)}`;
    const sprite = Art.birdLayer(facing, state);
    return makeSpriteTexture(this, key, sprite.rows, sprite.colours);
  }

  /** A point on the bird given where it is when facing left (mirrored when it faces right). */
  private onBird(p: { x: number; y: number }): { x: number; y: number } {
    return this.facing === 'left' ? p : { x: 2 * Art.BIRD_CX - p.x, y: p.y };
  }

  /** Moves the knife so its tip is at (x, y). */
  private knifeTo(x: number, y: number): void {
    this.knife.setPosition(Math.round(x - Art.KNIFE_TIP.x), Math.round(y - Art.KNIFE_TIP.y));
  }

  /** Rests the knife just above the start of the wing. */
  private restKnife(): void {
    const start = this.wingPoint(0);
    this.knifeTo(start.x + (this.facing === 'left' ? 16 : 10), start.y - 22);
  }

  private wingPoint(t: number): { x: number; y: number } {
    const path = Art.wingPath(this.facing);
    return path[Math.min(path.length - 1, Math.max(0, Math.round(t * (path.length - 1))))]!;
  }

  /**
   * Draws the carving line along the wing: a faint dotted guide ahead of the knife, and behind it the
   * groove actually cut into the wood (a dark cut with a pale lip below where the wood's been shaved).
   */
  private drawGuide(progress: number): void {
    const path = Art.wingPath(this.facing);
    this.guide.clear();
    path.forEach((p, i) => {
      const done = i / (path.length - 1) <= progress;
      if (done) {
        this.guide.fillStyle(SHADES.shadow).fillRect(p.x, p.y - 1, 1, 2);
        this.guide.fillStyle(SHADES.light).fillRect(p.x, p.y + 1, 1, 1);
      } else if (i % 3 === 0) {
        this.guide.fillStyle(SHADES.white, 0.7).fillRect(p.x, p.y, 1, 1);
      }
    });
  }

  private showHint(text: string): void {
    this.hint.setText(text).setVisible(true);
    this.hint.setPosition(Math.round((W - this.hint.width) / 2), 8);
  }

  // --- Stepping through the ink ---

  /** Takes the next line of ink and acts on its tags. */
  private next(): void {
    const story = getSession(this).story;
    let line = story.nextLine();
    while (line && line.text === '' && line.tags.length === 0) line = story.nextLine();
    if (!line) return this.finish();
    const tags = line.tags;
    const tag = (name: string) => tags.find((t) => t === name || t.startsWith(`${name}:`))?.split(':').slice(1).join(':');
    const has = (name: string) => tags.some((t) => t === name || t.startsWith(`${name}:`));
    if (has('black')) this.cutToBlack();
    if (has('tableau')) this.showTableau(tag('tableau') ?? 'tree');
    if (has('end')) this.endAfterNarration = true;

    if (has('narration')) return this.showNarration(line.text);
    const step = tag('step');
    if (step === 'turn') {
      this.dialogue.hold(line.text, tags);
      this.step = { kind: 'turn', target: this.facing === 'left' ? 'right' : 'left' };
      this.stepStarted = this.time.now;
      this.showHint('< > (or click)  turn the bird');
      return;
    }
    if (step === 'smooth') {
      this.dialogue.hold(line.text, tags);
      this.step = { kind: 'smooth', rocks: 0, last: null };
      this.stepStarted = this.time.now;
      this.showHint('< >  rock it, left and right');
      return;
    }
    if (step === 'eye') {
      this.dialogue.hold(line.text, tags);
      const ring = this.add.graphics().setDepth(7);
      this.layers.closeup.add(ring);
      this.step = { kind: 'eye', misses: 0, ring, phase: 0 };
      this.stepStarted = this.time.now;
      this.showHint('press E when the ring is smallest');
      return;
    }
    if (step === 'carve' || step === 'slip') {
      this.dialogue.hold(line.text, tags);
      this.step = { kind: step, facing: this.facing, progress: 0, lastChip: 0 };
      this.stepStarted = this.time.now;
      this.drawGuide(0);
      this.showHint('hold E (or the mouse)  carve');
      return;
    }
    this.dialogue.line(line.text, tags, () => this.next());
  }

  override update(time: number, delta: number): void {
    const step = this.step;
    if (!step) return;
    const pressed = (k: Phaser.Input.Keyboard.Key) => Phaser.Input.Keyboard.JustDown(k);
    if (step.kind === 'smooth') {
      const dir = pressed(this.keys.left) || pressed(this.keys.a) ? 'left' : pressed(this.keys.right) || pressed(this.keys.d) ? 'right' : null;
      if (dir && dir !== step.last) this.rock(step, dir);
      return;
    }
    if (step.kind === 'eye') {
      this.updateEye(step, delta);
      return;
    }
    if (step.kind === 'turn') {
      const wantsRight = pressed(this.keys.right) || pressed(this.keys.d);
      const wantsLeft = pressed(this.keys.left) || pressed(this.keys.a);
      if ((step.target === 'right' && wantsRight) || (step.target === 'left' && wantsLeft)) this.turnBird(step.target);
      return;
    }
    // Carving: hold E, Space or the mouse button to move the knife along the wing (not with the key or
    // click that closed the previous line).
    const pointerHeld = this.input.activePointer.isDown && this.input.activePointer.downTime > this.stepStarted;
    if (!(this.keys.e.isDown || this.keys.space.isDown || pointerHeld)) return;
    step.progress = Math.min(1, step.progress + (CARVE_SPEED * delta) / 1000);
    const tip = this.wingPoint(step.progress);
    this.knifeTo(tip.x + Phaser.Math.Between(0, 1), tip.y);
    this.drawGuide(step.progress);
    if (time - step.lastChip > 140) {
      step.lastChip = time;
      this.chip(tip);
    }
    if (step.kind === 'slip' && step.progress >= SLIP_AT) return this.slip();
    if (step.progress >= 1) {
      this.carved[this.facing] = true;
      this.bird.setTexture(this.birdTexture(this.facing));
      this.guide.clear();
      this.restKnife();
      this.endStep();
    }
  }

  private endStep(): void {
    this.step = null;
    this.hint.setVisible(false);
    this.dialogue.close();
    this.time.delayedCall(250, () => this.next());
  }

  /**
   * Turns the bird round smoothly: it narrows as it turns edge-on, swaps to its other side at the
   * thinnest point, then widens again. The knife lifts away while it turns.
   */
  private turnBird(to: 'left' | 'right'): void {
    this.step = null;
    this.hint.setVisible(false);
    this.tweens.add({ targets: this.knife, alpha: 0, duration: 150 });
    this.tweens.chain({
      targets: this.bird,
      tweens: [
        { scaleX: 0.06, duration: 260, ease: 'Sine.easeIn' },
        {
          scaleX: 1, duration: 320, ease: 'Sine.easeOut',
          onStart: () => {
            this.facing = to;
            this.bird.setTexture(this.birdTexture(to));
          },
        },
      ],
      onComplete: () => {
        this.restKnife();
        this.tweens.add({ targets: this.knife, alpha: 1, duration: 200 });
        this.endStep();
      },
    });
  }

  /** One rock of the bird while smoothing its head: it shifts a little, dust lifts off; enough rocks and it's smooth. */
  private rock(step: Extract<Step, { kind: 'smooth' }>, dir: 'left' | 'right'): void {
    step.last = dir;
    step.rocks += 1;
    this.tweens.add({ targets: this.bird, x: Art.BIRD_CX + (dir === 'left' ? -3 : 3), duration: 90, yoyo: true, ease: 'Sine.easeOut' });
    const head = this.onBird(Art.HEAD);
    for (let i = 0; i < 3; i++) {
      const dust = this.add.rectangle(head.x + Phaser.Math.Between(-12, 12), head.y + Phaser.Math.Between(-10, 8), 1, 1, SHADES.light).setOrigin(0).setDepth(6);
      this.tweens.add({ targets: dust, y: dust.y - Phaser.Math.Between(6, 14), alpha: 0, duration: 600, onComplete: () => dust.destroy() });
    }
    if (step.rocks >= SMOOTH_ROCKS) {
      this.carved.head = true;
      this.bird.setTexture(this.birdTexture(this.facing));
      this.time.delayedCall(200, () => this.endStep());
      this.step = null;
    }
  }

  /** The eye: a ring pulses round the mark; press E (or click) when it's smallest. A few misses and it just works. */
  private updateEye(step: Extract<Step, { kind: 'eye' }>, delta: number): void {
    step.phase += delta / 1000;
    const eye = this.onBird(Art.EYE);
    const radius = 3 + (Math.sin(step.phase * 3.2) + 1) * 4; // 3 to 11
    step.ring.clear().lineStyle(1, SHADES.white, 0.9).strokeCircle(eye.x, eye.y, radius);
    const pointer = this.input.activePointer;
    const hit = Phaser.Input.Keyboard.JustDown(this.keys.e) || Phaser.Input.Keyboard.JustDown(this.keys.space) || (pointer.isDown && pointer.downTime > this.stepStarted && pointer.getDuration() < 30);
    if (!hit) return;
    if (radius < 5 || step.misses >= EYE_MISSES) {
      step.ring.destroy();
      this.carved.eye = true;
      this.bird.setTexture(this.birdTexture(this.facing));
      this.knifeTo(eye.x + 2, eye.y + 1);
      this.time.delayedCall(350, () => {
        this.restKnife();
        this.endStep();
      });
      this.step = null;
    } else {
      step.misses += 1;
      this.tweens.add({ targets: this.bird, x: Art.BIRD_CX + 1, duration: 40, yoyo: true, repeat: 1 }); // not quite
    }
  }

  /** A chip of wood cut out by the knife: it flicks away in a little arc and lands on the bench, where it stays. */
  private chip(at: { x: number; y: number }): void {
    const shape = CHIPS[Phaser.Math.Between(0, CHIPS.length - 1)]!;
    const key = makeSpriteTexture(this, `prologue-chip-${CHIPS.indexOf(shape)}`, shape.rows, shape.colours);
    const bit = this.add.image(at.x, at.y, key).setDepth(6);
    const dx = Phaser.Math.Between(-26, 26);
    const land = { x: at.x + dx, y: at.y + Phaser.Math.Between(40, 70) };
    const arc = { t: 0 };
    this.tweens.add({
      targets: arc, t: 1, duration: 420, ease: 'Linear',
      onUpdate: () => {
        bit.setPosition(Math.round(at.x + dx * arc.t), Math.round(at.y + (land.y - at.y) * arc.t - Math.sin(arc.t * Math.PI) * 16));
      },
      onComplete: () => {
        bit.setPosition(land.x, land.y).setAngle(Phaser.Math.Between(0, 3) * 90);
        this.layers.closeup.add(bit); // stays on the bench
      },
    });
  }

  /** The knife skids off the line, gouges the wood and cuts you: a red flash, and blood drops onto the bird. */
  private slip(): void {
    const step = this.step;
    this.step = null;
    this.hint.setVisible(false);
    const from = this.wingPoint(step && 'progress' in step ? step.progress : SLIP_AT);
    const to = { x: from.x - 34, y: from.y + 46 };
    this.tweens.add({ targets: this.knife, x: to.x - Art.KNIFE_TIP.x, y: to.y - Art.KNIFE_TIP.y, duration: 70, ease: 'Expo.easeIn' });
    // The gouge: a jagged line torn off the carving line and down the bird.
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      this.guide.fillStyle(SHADES.shadow).fillRect(Math.round(from.x + (to.x - from.x) * t * 0.6 + (i % 3) - 1), Math.round(from.y + (to.y - from.y) * t * 0.6), 1, 1);
    }
    this.time.delayedCall(70, () => {
      this.cameras.main.flash(160, 216, 50, 58);
      this.cameras.main.shake(260, 0.012);
      this.bleed(from);
    });
    this.time.delayedCall(900, () => {
      this.dialogue.close();
      this.next();
    });
  }

  /** Drops of blood (red: the protagonist's colour) falling onto the bird and the bench. */
  private bleed(near: { x: number; y: number }): void {
    for (let i = 0; i < 9; i++) {
      this.time.delayedCall(i * 140 + Phaser.Math.Between(0, 80), () => {
        const x = near.x - 10 + Phaser.Math.Between(-8, 8);
        const y = near.y + Phaser.Math.Between(4, 30);
        const drop = this.add.rectangle(x, y - 14, 1, 2, SHADES.red).setOrigin(0).setDepth(6);
        this.tweens.add({
          targets: drop, y, duration: 180, ease: 'Quad.easeIn',
          onComplete: () => {
            drop.setSize(2, 1);
            this.layers.closeup.add(drop);
          },
        });
      });
    }
  }

  // --- After the slip ---

  private cutToBlack(): void {
    this.tweens.killTweensOf(this.knife);
    this.dialogue.close();
    this.layers.black.setAlpha(1);
    this.layers.closeup.setVisible(false);
  }

  private showNarration(text: string): void {
    const onTableau = this.layers.tableau.visible;
    this.narration.setText(text).setVisible(true).setAlpha(0);
    const x = Math.round((W - this.narration.width) / 2);
    const y = onTableau ? H - 30 - Math.round(this.narration.height / 2) : Math.round((H - this.narration.height) / 2);
    this.narration.setPosition(x, y);
    this.narrationArrow.setPosition(W / 2, y + this.narration.height + 8).setVisible(false);
    this.waitingForNarration = false;
    this.tweens.add({
      targets: this.narration, alpha: 1, duration: 900, ease: 'Sine.easeOut',
      onComplete: () => {
        this.waitingForNarration = true;
        this.narrationArrow.setVisible(true);
      },
    });
  }

  private continueNarration(): void {
    this.waitingForNarration = false;
    this.narrationArrow.setVisible(false);
    this.tweens.add({
      targets: this.narration, alpha: 0, duration: 500,
      onComplete: () => (this.endAfterNarration ? this.finish() : this.next()),
    });
  }

  /** Shows a still behind the narration: the tree in cross-section, or the tube with offerings and blessings. */
  private showTableau(id: string): void {
    const t = this.layers.tableau;
    t.removeAll(true);
    t.setVisible(true).setAlpha(0).setDepth(45);
    if (id === 'tube') this.buildTubeTableau(t);
    else {
      makePaintedTexture(this, 'prologue-tree', W, H, paintTree());
      t.add(this.add.image(0, 0, 'prologue-tree').setOrigin(0));
    }
    // A dark band at the bottom for the words.
    t.add(this.add.rectangle(0, H - 58, W, 58, 0x000000, 0.75).setOrigin(0));
    this.narration.setDepth(50);
    this.tweens.add({ targets: t, alpha: 1, duration: 1200 });
  }

  /** The tube glowing up through the dark. */
  private buildTubeTableau(t: Phaser.GameObjects.Container): void {
    const cyan = rgb(SHADES.cyan);
    makePaintedTexture(this, 'prologue-tube-bg', W, H, (x, y) => {
      let c: RGB = rgb(SHADES.shadow).map((v) => v * (0.8 + 0.4 * noise(x / 7 + noise(y / 20)))) as RGB;
      c = addLight(c, cyan, 0.45 * falloff(x, y, W / 2, H / 2, 70, 260));
      return c;
    });
    t.add(this.add.image(0, 0, 'prologue-tube-bg').setOrigin(0));
    const column = tubeColumn(24, H);
    t.add(this.add.image(W / 2 - 12, 0, makeSpriteTexture(this, 'prologue-tube', column.rows, column.colours)).setOrigin(0));
  }

  /** The end of the prologue: the chapter's title card, then Day 1, waking at home. */
  private finish(): void {
    this.waitingForNarration = false;
    this.cameras.main.fadeOut(1400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      getSession(this).calendar.jumpTo(1);
      // The chapter's title card, then waking at home on Day 1.
      const next: AreaSceneData = { areaId: 'home', start: { x: 50, y: 150 }, card: 'Day 1: Ascension Day' };
      this.scene.start('Chapter', { number: 'Chapter 1', title: 'Seen', next } satisfies ChapterSceneData);
    });
  }
}
