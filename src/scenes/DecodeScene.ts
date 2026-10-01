import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { glossaryVariable, MESSAGES, type DecodeSymbol, type Message } from '../data/messages';
import { comparable, SymbolMatcher } from '../systems/SymbolMatcher';
import { getSession } from '../session';
import { addLight, falloff, noise, rgb, SHADES, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { FIRE_FRAMES } from '../ui/sprites';

export interface DecodeSceneData {
  /** Which message (an id in MESSAGES). */
  message: string;
  /** An ink knot for the area to play once the plate is put down. */
  then?: string;
}

/** Data the area gets back when it resumes. */
export interface DecodeResult {
  script?: string;
}

const PLATE = { x: W / 2, y: 92, width: 228, height: 76 };
/** How far each picture sits from the plate's centre, by position. */
const SLOT_SPACING = 74;
const PICTURE_SCALE = 2;
/** How close (in tilt) the plate must be to a picture's glint for it to show. */
const GLINT_WIDTH = 0.32;
/** How long a picture must catch the light to be found, in ms. */
const FIND_TIME = 350;
const TURN_SPEED = 0.9; // tilt per second
const MAX_INPUT = 20;
const COLD = ['Cold.', 'No. Look again.', "That's not it."];

/** turn: finding the pictures; read: typing; solved: the line is on its way; done: it's shown. */
type Phase = 'turn' | 'read' | 'solved' | 'done';

interface Picture {
  symbol: DecodeSymbol;
  x: number;
  scratch: Phaser.GameObjects.Image;
  glint: Phaser.GameObjects.Image;
  found: boolean;
  litFor: number;
}

/**
 * The decoding screen: the plate from inside a bird, by firelight. First you turn it (Left/Right, or
 * the mouse) until each faint picture catches the light; then you pick a picture and type what you
 * think it means. Close guesses are warm, others cold; nudges, then memories, then the picture solves
 * itself, so nobody gets stuck. Your words fill a strip along the bottom and go into the glossary (ink);
 * when all are solved your inner voice reads the line, and the area resumes with the next knot.
 * Opened over the paused area by the #decode tag (dev: ?scene=decode).
 */
export class DecodeScene extends Phaser.Scene {
  private message!: Message;
  private then: string | undefined;
  private matcher!: SymbolMatcher;
  private pictures: Picture[] = [];
  private phase: Phase = 'turn';
  private tilt = 0;
  private selected = 0;
  private typed = '';
  private coldIndex = 0;
  private plate!: Phaser.GameObjects.Graphics;
  private frame!: Phaser.GameObjects.Graphics;
  private prompt!: PixelText;
  private inputText!: PixelText;
  private feedback!: PixelText;
  private help!: PixelText;
  private strip!: PixelText;
  private cursorOn = true;
  private leaving = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };

  constructor() {
    super('Decode');
  }

  init(data: DecodeSceneData): void {
    const message = MESSAGES[data.message];
    if (!message) throw new Error(`DecodeScene: no message called "${data.message}"`);
    this.message = message;
    this.then = data.then;
    this.matcher = new SymbolMatcher(message.symbols);
    this.pictures = [];
    this.phase = 'turn';
    this.tilt = -1;
    this.selected = 0;
    this.typed = '';
    this.leaving = false;
  }

  create(): void {
    this.cameras.main.fadeIn(500);
    makePaintedTexture(this, 'decode-backdrop', W, H, paintFirelight());
    this.add.image(0, 0, 'decode-backdrop').setOrigin(0);
    this.addFire(34, H - 6);

    this.plate = this.add.graphics();
    this.message.symbols.forEach((symbol, i) => {
      const x = PLATE.x + (i - (this.message.symbols.length - 1) / 2) * SLOT_SPACING;
      const colours = { '#': SHADES.deep };
      const scratch = this.add.image(x, PLATE.y, makeSpriteTexture(this, `glyph-${symbol.id}`, symbol.picture, colours)).setScale(PICTURE_SCALE);
      // The light catching the lower edge of each scratch.
      const glint = this.add.image(x, PLATE.y + 1, makeSpriteTexture(this, `glyph-${symbol.id}-lit`, symbol.picture, { '#': SHADES.white })).setScale(PICTURE_SCALE);
      scratch.setDepth(2);
      glint.setDepth(1);
      this.pictures.push({ symbol, x, scratch, glint, found: false, litFor: 0 });
    });
    this.frame = this.add.graphics().setDepth(3);

    this.prompt = this.centred(8, 'Turn the plate in the firelight.   Left / Right', SHADES.light);
    this.inputText = new PixelText(this, 0, 150, '', { color: SHADES.white, shadow: SHADES.shadow });
    this.feedback = new PixelText(this, 0, 166, '', { color: SHADES.amber, shadow: SHADES.shadow });
    this.help = new PixelText(this, 0, 180, '', { color: SHADES.light, shadow: SHADES.shadow, wrapWidth: 380 });
    this.strip = new PixelText(this, 0, 236, '', { color: SHADES.dim, shadow: SHADES.shadow });

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), a: kb.addKey(K.A, false), d: kb.addKey(K.D, false) };
    kb.on('keydown', this.onKey, this);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'turn') this.tilt = Phaser.Math.Clamp((p.x - PLATE.x) / (PLATE.width / 2), -1, 1);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'read') return;
      const hit = this.pictures.findIndex((pic) => Math.abs(p.x - pic.x) < SLOT_SPACING / 2 && Math.abs(p.y - PLATE.y) < PLATE.height / 2);
      if (hit >= 0) this.select(hit);
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => ((this.cursorOn = !this.cursorOn), this.renderInput()) });
    this.renderStrip();
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'turn') {
      const dir = (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0) - (this.keys.left.isDown || this.keys.a.isDown ? 1 : 0);
      this.tilt = Phaser.Math.Clamp(this.tilt + dir * TURN_SPEED * (delta / 1000), -1, 1);
    }
    this.drawPlate();
    for (const pic of this.pictures) {
      const light = this.phase === 'turn' ? Phaser.Math.Clamp(1 - Math.abs(this.tilt - pic.symbol.glint) / GLINT_WIDTH, 0, 1) : 0.35;
      if (this.phase === 'turn' && !pic.found) {
        pic.litFor = light > 0.75 ? pic.litFor + delta : 0;
        if (pic.litFor >= FIND_TIME) this.find(pic);
      }
      pic.scratch.setAlpha(pic.found ? 1 : 0.1 + 0.9 * light);
      pic.glint.setAlpha(pic.found ? Math.max(0.35, light) : light);
    }
    this.drawFrame();
  }

  // --- Turning the plate ---

  private find(pic: Picture): void {
    pic.found = true;
    playConfirm(this);
    this.tweens.add({ targets: pic.scratch, scale: PICTURE_SCALE * 1.15, duration: 140, yoyo: true });
    const left = this.pictures.filter((p) => !p.found).length;
    if (left > 0) {
      this.setPrompt(`A picture catches the light. ${left === 1 ? 'One more.' : `${left} more.`}   Left / Right`);
      return;
    }
    this.phase = 'read';
    this.time.delayedCall(500, () => {
      this.setPrompt('Left / Right: choose a picture.   Type what it means, then Enter.');
      this.select(0);
    });
  }

  /** The plate: pale metal, narrower as it turns away, with a band of firelight sliding across it. */
  private drawPlate(): void {
    const g = this.plate.clear();
    const squash = 1 - 0.1 * Math.abs(this.tilt);
    const w = Math.round(PLATE.width * squash);
    const left = Math.round(PLATE.x - w / 2);
    const top = PLATE.y - PLATE.height / 2;
    g.fillStyle(SHADES.deep).fillRect(left - 2, top - 2, w + 4, PLATE.height + 4);
    g.fillStyle(SHADES.dim).fillRect(left, top, w, PLATE.height);
    g.fillStyle(SHADES.light).fillRect(left + 1, top + 1, w - 2, PLATE.height - 3);
    g.fillStyle(SHADES.white).fillRect(left + 1, top + 1, w - 2, 1);
    // Fine machining lines across the metal (a precision no tree carver could manage).
    g.fillStyle(SHADES.dim, 0.25);
    for (let y = top + 5; y < top + PLATE.height - 3; y += 4) g.fillRect(left + 3, y, w - 6, 1);
    if (this.phase === 'turn') {
      const band = PLATE.x + this.tilt * (w / 2);
      const x0 = Math.max(left + 1, Math.round(band - 18));
      const x1 = Math.min(left + w - 1, Math.round(band + 18));
      if (x1 > x0) {
        g.fillStyle(SHADES.white, 0.35).fillRect(x0, top + 1, x1 - x0, PLATE.height - 3);
        g.fillStyle(SHADES.amber, 0.2).fillRect(x0 + 6, top + 1, Math.max(0, x1 - x0 - 12), PLATE.height - 3);
      }
    }
    for (const pic of this.pictures) {
      const x = Math.round(PLATE.x + (pic.x - PLATE.x) * squash);
      pic.scratch.setX(x);
      pic.glint.setX(x + (this.phase === 'turn' ? Math.sign(this.tilt) : 0));
    }
  }

  /** The amber frame around the chosen picture, and a small mark under each solved one. */
  private drawFrame(): void {
    const g = this.frame.clear();
    if (this.phase !== 'read') return;
    this.pictures.forEach((pic, i) => {
      const w = pic.symbol.picture[0]!.length * PICTURE_SCALE + 10;
      const h = pic.symbol.picture.length * PICTURE_SCALE + 10;
      const solved = this.matcher.isSolved(pic.symbol.id);
      if (i === this.selected) g.lineStyle(1, SHADES.amber).strokeRect(Math.round(pic.x - w / 2), Math.round(PLATE.y - h / 2), w, h);
      if (solved) g.fillStyle(SHADES.amberDeep).fillRect(Math.round(pic.x - 6), PLATE.y + PLATE.height / 2 - 7, 12, 2);
    });
  }

  // --- Reading ---

  private select(index: number): void {
    this.selected = index;
    playMove(this);
    this.typed = '';
    this.feedback.setText('');
    this.showHelp();
    this.renderInput();
  }

  private onKey(event: KeyboardEvent): void {
    if (this.leaving) return;
    if (this.phase === 'done') {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'e' || event.key === 'E') this.finish();
      return;
    }
    if (this.phase !== 'read') return;
    const n = this.pictures.length;
    if (event.key === 'ArrowLeft') this.select((this.selected + n - 1) % n);
    else if (event.key === 'ArrowRight' || event.key === 'Tab') this.select((this.selected + 1) % n);
    else if (event.key === 'Backspace') this.typed = this.typed.slice(0, -1);
    else if (event.key === 'Enter') this.guess();
    else if (/^[a-zA-Z' -]$/.test(event.key) && this.typed.length < MAX_INPUT && !this.isSolved()) this.typed += event.key.toLowerCase();
    if (event.key === 'Tab' || event.key === ' ' || event.key === 'Backspace') event.preventDefault();
    this.renderInput();
  }

  private isSolved(index = this.selected): boolean {
    return this.matcher.isSolved(this.pictures[index]!.symbol.id);
  }

  private guess(): void {
    const { symbol } = this.pictures[this.selected]!;
    if (this.isSolved()) return;
    const result = this.matcher.guess(symbol.id, this.typed);
    const guessed = comparable(this.typed);
    switch (result.kind) {
      case 'empty':
      case 'already-solved':
        return;
      case 'correct':
      case 'auto-solved': {
        const { story } = getSession(this);
        story.setVariable(glossaryVariable(symbol.id), result.answer);
        playConfirm(this);
        this.feedback.setColor(SHADES.amber).setText(result.kind === 'correct' ? 'Yes. That feels right.' : `It comes to you: ${result.answer}.`);
        this.typed = '';
        this.help.setText('');
        this.renderStrip();
        this.nextUnsolved();
        break;
      }
      case 'wrong': {
        const near = symbol.near.find((n) => n.words.some((w) => comparable(w) === guessed));
        if (near) this.feedback.setColor(SHADES.amber).setText(near.reply);
        else this.feedback.setColor(SHADES.light).setText(COLD[this.coldIndex++ % COLD.length]!);
        this.typed = '';
        this.showHelp();
        break;
      }
    }
    this.centreText();
  }

  /** The nudge, then the memory, once enough wrong guesses have gone in on this picture. */
  private showHelp(): void {
    const { symbol } = this.pictures[this.selected]!;
    const level = this.isSolved() ? 'none' : this.matcher.helpLevel(symbol.id);
    this.help.setText(level === 'hint' ? symbol.memory : level === 'nudge' ? symbol.nudge : '');
    this.centreText();
  }

  private nextUnsolved(): void {
    const n = this.pictures.length;
    for (let step = 1; step <= n; step++) {
      const i = (this.selected + step) % n;
      if (!this.isSolved(i)) {
        this.time.delayedCall(900, () => this.select(i));
        return;
      }
    }
    this.complete();
  }

  /** Every picture solved: the strip glows, then your inner voice reads the line. */
  private complete(): void {
    this.phase = 'solved';
    this.selected = -1;
    this.inputText.setText('');
    this.time.delayedCall(900, () => {
      this.feedback.setText('');
      this.help.setText('');
      this.strip.setColor(SHADES.amber);
      this.setPrompt('');
    });
    this.time.delayedCall(1900, () => {
      this.help.setColor(SHADES.white).setText(`"${this.message.line}"`);
      this.centreText();
      this.help.setAlpha(0);
      this.tweens.add({ targets: this.help, alpha: 1, duration: 900 });
      this.feedback.setColor(SHADES.dim).setText('Enter: put the plate down');
      this.feedback.setY(212);
      this.centreText();
      this.phase = 'done';
    });
  }

  private finish(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.scene.isPaused('Area')) {
        this.scene.resume('Area', { script: this.then } satisfies DecodeResult);
        this.scene.stop();
      } else {
        this.scene.start('Title');
      }
    });
  }

  // --- Text ---

  private renderInput(): void {
    if (this.phase !== 'read' || this.selected < 0) {
      this.inputText.setText('');
      return;
    }
    const answer = this.matcher.answer(this.pictures[this.selected]!.symbol.id);
    this.inputText.setText(answer !== null ? answer : `> ${this.typed}${this.cursorOn ? '_' : ' '}`);
    this.inputText.setColor(answer !== null ? SHADES.amber : SHADES.white);
    this.centreText();
  }

  /** Your words so far, in order, with blanks for the pictures still to solve. */
  private renderStrip(): void {
    this.strip.setText(this.message.symbols.map((s) => this.matcher.answer(s.id) ?? '____').join('  ·  '));
    this.centreText();
  }

  private setPrompt(text: string): void {
    this.prompt.setText(text);
    this.centreText();
  }

  private centreText(): void {
    for (const t of [this.prompt, this.inputText, this.feedback, this.help, this.strip]) t.setX(Math.round((W - t.width) / 2));
  }

  private centred(y: number, text: string, color: number): PixelText {
    const t = new PixelText(this, 0, y, text, { color, shadow: SHADES.shadow });
    t.setX(Math.round((W - t.width) / 2));
    return t;
  }

  private addFire(x: number, y: number): void {
    const keys = FIRE_FRAMES.map((f, i) => makeSpriteTexture(this, `fire-${i}`, f.rows, f.colours));
    const fire = this.add.image(x, y, keys[0]!).setOrigin(0.5, 1).setScale(3);
    let frame = 0;
    this.time.addEvent({ delay: 140, loop: true, callback: () => fire.setTexture(keys[(frame = (frame + 1) % keys.length)]!) });
  }
}

/** Near-dark, warmed by the hearth in the bottom-left corner. */
function paintFirelight(): (x: number, y: number) => RGB {
  const base = rgb(SHADES.shadow);
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  return (x, y) => {
    const grain = 0.5 + 0.5 * noise(y * 0.35 + noise(x * 0.02) * 3);
    let c: RGB = addLight(base, wood, 0.25 + 0.2 * grain);
    c = addLight(c, amber, 0.55 * falloff(x, y, 34, H - 10, 190, 150));
    c = addLight(c, amber, 0.12 * falloff(x, y, PLATE.x, PLATE.y, 170, 70));
    return c;
  };
}
