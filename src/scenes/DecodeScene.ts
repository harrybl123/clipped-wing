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

const PLATE = { x: W / 2, y: 72, width: 432, height: 104 };
/** The centre line of each row of pictures on the plate. */
const ROW_Y = [46, 98];
/** Space each picture takes along a row. */
const SLOT_WIDTH = 56;
const PICTURE_SCALE = 2;
/** How near the band of firelight (px) must be for a picture to catch it. */
const GLINT_REACH = 40;
/** How long a picture must catch the light to be found, in ms. */
const FIND_TIME = 150;
const TURN_SPEED = 0.6; // tilt per second
const MAX_INPUT = 20;
const COLD = ['Cold.', 'No. Look again.', "That's not it."];

/** turn: finding the pictures; read: typing; solved: the line is on its way; done: it's shown. */
type Phase = 'turn' | 'read' | 'solved' | 'done';

/** One place on the plate. The same symbol can sit in more than one place ("I" … "me"). */
interface Slot {
  symbol: DecodeSymbol;
  x: number;
  y: number;
  scratch: Phaser.GameObjects.Image;
  glint: Phaser.GameObjects.Image;
  found: boolean;
  litFor: number;
}

/**
 * The decoding screen: the plate from inside a bird, by firelight, a sentence of pictures in two
 * rows, one per word. First you turn it (Left/Right, or the mouse) and a band of firelight slides
 * across, picking out the faint scratches; then you pick a picture and type what you think it means.
 * Close guesses are warm, others cold; nudges, then hints, then the picture solves itself, so nobody
 * gets stuck. Pictures already in your glossary (ink) come filled in. Your words fill a strip along
 * the bottom; when all are solved your inner voice reads the line, and the area resumes with the next
 * knot. Opened over the paused area by the #decode tag (dev: ?scene=decode).
 */
export class DecodeScene extends Phaser.Scene {
  private message!: Message;
  private then: string | undefined;
  private matcher!: SymbolMatcher;
  private slots: Slot[] = [];
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
  private keys!: Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('Decode');
  }

  init(data: DecodeSceneData): void {
    const message = MESSAGES[data.message];
    if (!message) throw new Error(`DecodeScene: no message called "${data.message}"`);
    this.message = message;
    this.then = data.then;
    this.matcher = new SymbolMatcher(message.symbols);
    this.slots = [];
    this.phase = 'turn';
    this.tilt = -1;
    this.selected = 0;
    this.typed = '';
    this.leaving = false;
  }

  create(): void {
    const { story } = getSession(this);
    // Little words fill themselves in, and so does anything already in the glossary.
    for (const s of this.message.symbols) {
      const known = s.given ?? String(story.getVariable(glossaryVariable(s.id)) ?? '');
      if (known) this.matcher.preset(s.id, known);
    }

    this.cameras.main.fadeIn(500);
    makePaintedTexture(this, 'decode-backdrop', W, H, paintFirelight());
    this.add.image(0, 0, 'decode-backdrop').setOrigin(0);
    this.addFire(34, H - 6);

    this.plate = this.add.graphics();
    const byId = new Map(this.message.symbols.map((s) => [s.id, s]));
    this.message.rows.forEach((row, r) => {
      row.forEach((id, i) => {
        const symbol = byId.get(id)!;
        const x = Math.round(PLATE.x + (i - (row.length - 1) / 2) * SLOT_WIDTH);
        const y = ROW_Y[r]!;
        const scratch = this.add.image(x, y, makeSpriteTexture(this, `glyph-${id}`, symbol.picture, { '#': SHADES.deep })).setScale(PICTURE_SCALE).setDepth(2);
        // The light catching the lower edge of each scratch.
        const glint = this.add.image(x, y + 1, makeSpriteTexture(this, `glyph-${id}-lit`, symbol.picture, { '#': SHADES.white })).setScale(PICTURE_SCALE).setDepth(1);
        this.slots.push({ symbol, x, y, scratch, glint, found: false, litFor: 0 });
      });
    });
    this.frame = this.add.graphics().setDepth(3);

    this.prompt = new PixelText(this, 0, 6, 'Turn the plate in the firelight.   Left / Right', { color: SHADES.light, shadow: SHADES.shadow });
    this.inputText = new PixelText(this, 0, 136, '', { color: SHADES.white, shadow: SHADES.shadow });
    this.feedback = new PixelText(this, 0, 152, '', { color: SHADES.amber, shadow: SHADES.shadow });
    this.help = new PixelText(this, 0, 166, '', { color: SHADES.light, shadow: SHADES.shadow, wrapWidth: 400 });
    this.strip = new PixelText(this, 0, 218, '', { color: SHADES.dim, shadow: SHADES.shadow });

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), a: kb.addKey(K.A, false), d: kb.addKey(K.D, false) };
    kb.on('keydown', this.onKey, this);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'turn') this.tilt = Phaser.Math.Clamp((p.x - PLATE.x) / (PLATE.width / 2), -1, 1);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.phase !== 'read') return;
      const hit = this.slots.findIndex((s) => !s.symbol.given && Math.abs(p.x - s.x) < SLOT_WIDTH / 2 && Math.abs(p.y - s.y) < 24);
      if (hit >= 0) this.select(hit);
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => ((this.cursorOn = !this.cursorOn), this.renderInput()) });
    this.renderStrip();
    this.centreText();
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'turn') {
      const dir = (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0) - (this.keys.left.isDown || this.keys.a.isDown ? 1 : 0);
      this.tilt = Phaser.Math.Clamp(this.tilt + dir * TURN_SPEED * (delta / 1000), -1, 1);
    }
    const band = this.drawPlate();
    for (const slot of this.slots) {
      const light = band === null ? 0.35 : Phaser.Math.Clamp(1 - Math.abs(band - slot.scratch.x) / GLINT_REACH, 0, 1);
      if (this.phase === 'turn' && !slot.found) {
        slot.litFor = light > 0.4 ? slot.litFor + delta : 0;
        if (slot.litFor >= FIND_TIME) this.find(slot);
      }
      slot.scratch.setAlpha(slot.found ? 1 : 0.08 + 0.92 * light);
      slot.glint.setAlpha(slot.found ? Math.max(0.35, light) : light);
    }
    this.drawFrame();
  }

  // --- Turning the plate ---

  private find(slot: Slot): void {
    slot.found = true;
    this.tweens.add({ targets: slot.scratch, scale: PICTURE_SCALE * 1.15, duration: 120, yoyo: true });
    const left = this.slots.filter((s) => !s.found).length;
    if (left > 0) {
      playMove(this);
      this.setPrompt(`${this.slots.length - left} of ${this.slots.length} pictures found.   Left / Right`);
      return;
    }
    playConfirm(this);
    this.phase = 'read';
    this.time.delayedCall(500, () => {
      this.setPrompt('Left / Right: choose a picture.   Type what it means, then Enter.');
      const first = this.nextUnsolvedFrom(-1);
      if (first === null) this.complete();
      else this.select(first);
    });
  }

  /** The plate: pale metal, narrower as it turns away, with a band of firelight sliding across it. Returns the band's x while turning. */
  private drawPlate(): number | null {
    const g = this.plate.clear();
    const squash = 1 - 0.06 * Math.abs(this.tilt);
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
    for (const slot of this.slots) {
      const x = Math.round(PLATE.x + (slot.x - PLATE.x) * squash);
      slot.scratch.setX(x);
      slot.glint.setX(x + (this.phase === 'turn' ? Math.sign(this.tilt) : 0));
    }
    if (this.phase !== 'turn') return null;
    const band = PLATE.x + this.tilt * (w / 2);
    const x0 = Math.max(left + 1, Math.round(band - 20));
    const x1 = Math.min(left + w - 1, Math.round(band + 20));
    if (x1 > x0) {
      g.fillStyle(SHADES.white, 0.35).fillRect(x0, top + 1, x1 - x0, PLATE.height - 3);
      g.fillStyle(SHADES.amber, 0.2).fillRect(x0 + 6, top + 1, Math.max(0, x1 - x0 - 12), PLATE.height - 3);
    }
    return band;
  }

  /** The amber frame around the chosen picture, and a small mark under each solved one. */
  private drawFrame(): void {
    const g = this.frame.clear();
    if (this.phase !== 'read') return;
    const chosen = this.slots[this.selected]?.symbol;
    this.slots.forEach((slot) => {
      const w = slot.symbol.picture[0]!.length * PICTURE_SCALE + 8;
      const h = slot.symbol.picture.length * PICTURE_SCALE + 8;
      const x = Math.round(slot.scratch.x - w / 2);
      const y = Math.round(slot.y - h / 2);
      // Every place the chosen symbol appears is framed: solving it fills them all.
      if (slot.symbol === chosen) g.lineStyle(1, SHADES.amber).strokeRect(x, y, w, h);
      if (this.matcher.isSolved(slot.symbol.id) && !slot.symbol.given) g.fillStyle(SHADES.amberDeep).fillRect(Math.round(slot.scratch.x - 5), y + h + 1, 10, 2);
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

  /** Moves the choice left or right along the sentence, skipping the little given words. */
  private step(dir: 1 | -1): void {
    const n = this.slots.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.selected + dir * k + n * 2) % n;
      if (!this.slots[i]!.symbol.given) {
        this.select(i);
        return;
      }
    }
  }

  private onKey(event: KeyboardEvent): void {
    if (this.leaving) return;
    if (this.phase === 'done') {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'e' || event.key === 'E') this.finish();
      return;
    }
    if (this.phase !== 'read') return;
    if (event.key === 'ArrowLeft') this.step(-1);
    else if (event.key === 'ArrowRight' || event.key === 'Tab') this.step(1);
    else if (event.key === 'Backspace') this.typed = this.typed.slice(0, -1);
    else if (event.key === 'Enter') this.guess();
    else if (/^[a-zA-Z' -]$/.test(event.key) && this.typed.length < MAX_INPUT && !this.isSolved()) this.typed += event.key.toLowerCase();
    if (event.key === 'Tab' || event.key === ' ' || event.key === 'Backspace') event.preventDefault();
    this.renderInput();
  }

  private isSolved(index = this.selected): boolean {
    return this.matcher.isSolved(this.slots[index]!.symbol.id);
  }

  private guess(): void {
    const { symbol } = this.slots[this.selected]!;
    if (this.isSolved()) return;
    const result = this.matcher.guess(symbol.id, this.typed);
    const guessed = comparable(this.typed);
    switch (result.kind) {
      case 'empty':
      case 'already-solved':
        return;
      case 'correct':
      case 'auto-solved': {
        getSession(this).story.setVariable(glossaryVariable(symbol.id), result.answer);
        playConfirm(this);
        this.feedback.setColor(SHADES.amber).setText(result.kind === 'correct' ? 'Yes. That feels right.' : `It comes to you: ${result.answer}.`);
        this.typed = '';
        this.help.setText('');
        this.renderStrip();
        const next = this.nextUnsolvedFrom(this.selected);
        if (next === null) this.complete();
        else this.time.delayedCall(900, () => this.phase === 'read' && this.select(next));
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

  /** The nudge, then the hint, once enough wrong guesses have gone in on this picture. */
  private showHelp(): void {
    const { symbol } = this.slots[this.selected]!;
    const level = this.isSolved() ? 'none' : this.matcher.helpLevel(symbol.id);
    this.help.setText(level === 'hint' ? symbol.hint : level === 'nudge' ? symbol.nudge : '');
    this.centreText();
  }

  /** The next place along (after `from`) whose picture is still unsolved, or null when all are. */
  private nextUnsolvedFrom(from: number): number | null {
    const n = this.slots.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + k + n) % n;
      if (!this.isSolved(i)) return i;
    }
    return null;
  }

  /** Every picture solved: the strip glows, then your inner voice reads the line. */
  private complete(): void {
    this.phase = 'solved';
    this.inputText.setText('');
    this.time.delayedCall(900, () => {
      this.feedback.setText('');
      this.help.setText('');
      this.strip.setColor(SHADES.amber);
      this.setPrompt('');
    });
    this.time.delayedCall(1900, () => {
      this.help.setColor(SHADES.white).setText(`"${this.message.line}"`).setY(150).setAlpha(0);
      this.tweens.add({ targets: this.help, alpha: 1, duration: 900 });
      this.feedback.setColor(SHADES.dim).setText('Enter: put the plate down').setY(186);
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
    if (this.phase !== 'read') {
      this.inputText.setText('');
      return;
    }
    const answer = this.matcher.answer(this.slots[this.selected]!.symbol.id);
    this.inputText.setText(answer !== null ? answer : `> ${this.typed}${this.cursorOn ? '_' : ' '}`);
    this.inputText.setColor(answer !== null ? SHADES.amber : SHADES.white);
    this.centreText();
  }

  /** Your words so far, in the plate's two rows, with blanks for the pictures still to solve. */
  private renderStrip(): void {
    this.strip.setText(this.message.rows.map((row) => row.map((id) => this.matcher.answer(id) ?? '___').join('  ')).join('\n'));
    this.centreText();
  }

  private setPrompt(text: string): void {
    this.prompt.setText(text);
    this.centreText();
  }

  private centreText(): void {
    for (const t of [this.prompt, this.inputText, this.feedback, this.help, this.strip]) t.setX(Math.round((W - t.width) / 2));
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
    c = addLight(c, amber, 0.12 * falloff(x, y, PLATE.x, PLATE.y, 220, 70));
    return c;
  };
}
