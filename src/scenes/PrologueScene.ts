import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { LIGHT_CELL } from '../data/areas/homeProps';
import { tubeColumn } from '../data/areas/offeringFloorProps';
import { getSession } from '../session';
import { DialogueBox } from '../ui/DialogueBox';
import { addLight, falloff, noise, rgb, SHADES, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import * as Art from '../ui/prologueArt';
import { BIRD, MORE_ARROW, type RowSprite } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';
import { paintTree } from './MapScene';

// The prologue: a close-up memory. You and Mum at the workbench, her hands around yours, carving a
// bird together by firelight. You follow her instructions (turn the bird; hold E to carve along the
// wing) while she praises you, until the slip takes your left thumb and forefinger. Black. Then your
// older self's narration on black, and the world explained over two stills (the tree; the tube),
// before you wake at home on Day 1.
//
// The words and the order live in story/prologue.ink (knot `prologue`). Each ink line can carry tags
// that this scene acts on:
//   #name:Mum        a voice with no face (shown in the dialogue box)
//   #step:turn       show the line and wait for the player to turn the bird (left/right)
//   #step:carve      show the line and wait for the player to carve along the wing (hold E)
//   #step:slip       as carve, but the chisel slips partway
//   #black           cut to black before this line
//   #narration       show the line as narration (on black, or under a still)
//   #tableau:<id>    show a still (tree, tube) with this line
//   #end             after this line, fade out and wake at home on Day 1

/** Carving speed: fraction of the wing per second while E is held. */
const CARVE_SPEED = 0.32;
/** How far along the wing the chisel slips on the last cut. */
const SLIP_AT = 0.6;

type Step = { kind: 'turn'; target: 'left' | 'right' } | { kind: 'carve' | 'slip'; facing: 'left' | 'right'; progress: number; lastScrape: number };

export class PrologueScene extends Phaser.Scene {
  private dialogue!: DialogueBox;
  private layers!: { closeup: Phaser.GameObjects.Container; tableau: Phaser.GameObjects.Container; black: Phaser.GameObjects.Rectangle };
  private bird!: Phaser.GameObjects.Image;
  private facing: 'left' | 'right' = 'left';
  private wingsCarved = 0;
  private leftHand!: Phaser.GameObjects.Image;
  private carvingHand!: Phaser.GameObjects.Container;
  private guide!: Phaser.GameObjects.Graphics;
  private hint!: PixelText;
  private narration!: PixelText;
  private narrationArrow!: Phaser.GameObjects.Image;
  private step: Step | null = null;
  private waitingForNarration = false;
  private endAfterNarration = false;
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'e' | 'space', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('Prologue');
  }

  create(): void {
    this.step = null;
    this.facing = 'left';
    this.wingsCarved = 0;
    this.waitingForNarration = false;
    this.endAfterNarration = false;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({ left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, e: K.E, space: K.SPACE }) as typeof this.keys;

    const closeup = this.buildCloseup();
    const tableau = this.add.container(0, 0).setVisible(false);
    const black = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setDepth(40).setAlpha(0);
    this.layers = { closeup, tableau, black };

    this.hint = new PixelText(this, 0, 0, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(45).setVisible(false);
    this.narration = new PixelText(this, 0, 0, '', { color: SHADES.light, wrapWidth: 340 }).setDepth(50).setVisible(false);
    this.narrationArrow = this.add.image(0, 0, makeSpriteTexture(this, 'more-arrow', MORE_ARROW.rows, MORE_ARROW.colours)).setDepth(50).setVisible(false);
    this.tweens.add({ targets: this.narrationArrow, y: '+=1', duration: 400, yoyo: true, repeat: -1 });
    this.dialogue = new DialogueBox(this, getSession(this).story);

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat || !this.waitingForNarration) return;
      if ([' ', 'enter', 'e'].includes(e.key.toLowerCase())) this.continueNarration();
    });
    this.input.on('pointerdown', () => this.waitingForNarration && this.continueNarration());


    getSession(this).story.startKnot('prologue');
    this.cameras.main.fadeIn(1600);
    this.time.delayedCall(1400, () => this.next());
  }

  // --- The close-up ---

  /** The bench, the bird, and the hands (full-screen layers, drawn in this order so the hands are over the bird). */
  private buildCloseup(): Phaser.GameObjects.Container {
    const closeup = this.add.container(0, 0);
    const tex = (key: string, s: RowSprite) => makeSpriteTexture(this, key, s.rows, s.colours);
    makePaintedTexture(this, 'prologue-bench', W, H, Art.paintBench());
    closeup.add(this.add.image(0, 0, 'prologue-bench').setOrigin(0));
    closeup.add(this.add.image(96, 170, tex('prologue-shavings', Art.SHAVINGS)).setOrigin(0));
    closeup.add(this.add.image(360, 150, tex('prologue-shavings', Art.SHAVINGS)).setOrigin(0).setFlipX(true));
    closeup.add(this.add.image(370, 40, tex('prologue-spare-chisel', Art.SPARE_CHISEL)).setOrigin(0).setAngle(-12));
    this.bird = this.add.image(0, 0, this.birdTexture('left')).setOrigin(0);
    closeup.add(this.bird);
    this.guide = this.add.graphics();
    closeup.add(this.guide);
    this.leftHand = this.add.image(0, 0, tex('prologue-child-left', Art.childLeftLayer(false))).setOrigin(0);
    closeup.add(this.leftHand);
    closeup.add(this.add.image(0, 0, tex('prologue-mum-left', Art.mumLeftLayer())).setOrigin(0));
    this.carvingHand = this.add.container(0, 0);
    this.carvingHand.add(this.add.image(0, 0, tex('prologue-carving', Art.carvingLayer())).setOrigin(0));
    closeup.add(this.carvingHand);
    this.restCarvingHand();
    return closeup;
  }

  private birdTexture(facing: Art.BirdFacing): string {
    const sprite = Art.birdLayer(facing, this.wingsCarved);
    return makeSpriteTexture(this, `prologue-bird-${facing}-${this.wingsCarved}`, sprite.rows, sprite.colours);
  }

  /** Moves the carving layer so the chisel tip is at (x, y). */
  private chiselTo(x: number, y: number): void {
    this.carvingHand.setPosition(x - Art.CHISEL_TIP.x, y - Art.CHISEL_TIP.y);
  }

  /** Puts the chisel hand back to rest, just above the start of the wing. */
  private restCarvingHand(): void {
    const start = this.wingPoint(0);
    this.chiselTo(start.x + 14, start.y - 12);
  }

  private wingPoint(t: number): { x: number; y: number } {
    const path = Art.wingPath(this.facing);
    return path[Math.min(path.length - 1, Math.max(0, Math.round(t * (path.length - 1))))]!;
  }

  /** Draws the carving line along the wing: dotted ahead of the chisel, solid behind it. */
  private drawGuide(progress: number): void {
    const path = Art.wingPath(this.facing);
    this.guide.clear();
    path.forEach((p, i) => {
      const done = i / (path.length - 1) <= progress;
      if (!done && i % 2 === 1) return;
      this.guide.fillStyle(done ? SHADES.deep : SHADES.white, done ? 1 : 0.8).fillRect(p.x, p.y, 1, 1);
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
      this.showHint('< >  turn the bird');
      return;
    }
    if (step === 'carve' || step === 'slip') {
      this.dialogue.hold(line.text, tags);
      this.step = { kind: step, facing: this.facing, progress: 0, lastScrape: 0 };
      this.drawGuide(0);
      this.showHint('hold E  carve');
      return;
    }
    this.dialogue.line(line.text, tags, () => this.next());
  }

  override update(time: number, delta: number): void {
    const step = this.step;
    if (!step) return;
    if (step.kind === 'turn') {
      const pressed = (k: Phaser.Input.Keyboard.Key) => Phaser.Input.Keyboard.JustDown(k);
      const wantsRight = pressed(this.keys.right) || pressed(this.keys.d);
      const wantsLeft = pressed(this.keys.left) || pressed(this.keys.a);
      if ((step.target === 'right' && wantsRight) || (step.target === 'left' && wantsLeft)) this.turnBird(step.target);
      return;
    }
    // Carving: hold E (or Space) to move the chisel along the wing.
    if (!(this.keys.e.isDown || this.keys.space.isDown)) return;
    step.progress = Math.min(1, step.progress + (CARVE_SPEED * delta) / 1000);
    const tip = this.wingPoint(step.progress);
    this.chiselTo(tip.x + Phaser.Math.Between(0, 1), tip.y);
    this.drawGuide(step.progress);
    if (time - step.lastScrape > 110) {
      step.lastScrape = time;
      this.shaving(tip);
    }
    if (step.kind === 'slip' && step.progress >= SLIP_AT) return this.slip();
    if (step.progress >= 1) {
      this.wingsCarved += 1;
      this.bird.setTexture(this.birdTexture(this.facing));
      this.guide.clear();
      this.restCarvingHand();
      this.endStep();
    }
  }

  private endStep(): void {
    this.step = null;
    this.hint.setVisible(false);
    this.dialogue.close();
    this.time.delayedCall(250, () => this.next());
  }

  private turnBird(to: 'left' | 'right'): void {
    this.step = null;
    this.bird.setTexture(this.birdTexture('turning'));
    this.tweens.add({ targets: this.carvingHand, alpha: 0.4, duration: 120, yoyo: true });
    this.time.delayedCall(170, () => {
      this.facing = to;
      this.bird.setTexture(this.birdTexture(to));
      this.restCarvingHand();
      this.endStep();
    });
  }

  /** A curl of wood peeling off the chisel. */
  private shaving(at: { x: number; y: number }): void {
    const bit = this.add.image(at.x, at.y, PIXEL).setTint(Math.random() < 0.5 ? SHADES.woodPale : SHADES.light).setDepth(5);
    this.tweens.add({ targets: bit, x: at.x + Phaser.Math.Between(4, 14), y: at.y + Phaser.Math.Between(6, 18), alpha: 0, duration: 700, onComplete: () => bit.destroy() });
  }

  /** The chisel skids off the wing into the child's hand. */
  private slip(): void {
    this.step = null;
    this.hint.setVisible(false);
    this.guide.clear();
    this.tweens.add({ targets: this.carvingHand, x: Art.THUMB.x - Art.CHISEL_TIP.x, y: Art.THUMB.y - Art.CHISEL_TIP.y, duration: 60, ease: 'Expo.easeIn' });
    this.time.delayedCall(60, () => {
      this.cameras.main.flash(160, 216, 50, 58);
      this.cameras.main.shake(260, 0.012);
      const hurt = Art.childLeftLayer(true);
      this.leftHand.setTexture(makeSpriteTexture(this, 'prologue-child-left-hurt', hurt.rows, hurt.colours));
      this.tweens.add({ targets: this.leftHand, x: -1, duration: 50, yoyo: true, repeat: -1 }); // trembling
    });
    this.time.delayedCall(700, () => {
      this.dialogue.close();
      this.next();
    });
  }

  // --- After the slip ---

  private cutToBlack(): void {
    this.tweens.killTweensOf([this.leftHand, this.carvingHand]);
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

  /** The tube glowing up through the dark: offerings (red birds) rising, blessings drifting down. */
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
    const birdKey = makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours);
    const cellKey = makeSpriteTexture(this, 'prologue-cell', LIGHT_CELL.rows, LIGHT_CELL.colours);
    const rise = () => {
      if (!t.visible) return;
      const bird = this.add.image(W / 2 - 18 + Phaser.Math.Between(-4, 4), H + 8, birdKey).setAlpha(0.95);
      t.add(bird);
      this.tweens.add({ targets: bird, y: -10, duration: 5200, onComplete: () => bird.destroy() });
      const cell = this.add.image(W / 2 + 18 + Phaser.Math.Between(-4, 4), -8, cellKey);
      t.add(cell);
      this.tweens.add({ targets: cell, y: H + 10, duration: 6800, onComplete: () => cell.destroy() });
      this.time.delayedCall(1100, rise);
    };
    rise();
  }

  /** The end of the prologue: into Day 1, waking at home. */
  private finish(): void {
    this.waitingForNarration = false;
    this.cameras.main.fadeOut(1400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      getSession(this).calendar.jumpTo(1);
      this.scene.start('Area', { areaId: 'home', start: { x: 50, y: 150 }, card: 'Day 1: Ascension Day' } satisfies AreaSceneData);
    });
  }
}
