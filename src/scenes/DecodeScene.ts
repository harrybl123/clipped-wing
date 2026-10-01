import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { glossaryVariable, MESSAGES, type DecodeSymbol, type Message } from '../data/messages';
import { comparable, SymbolMatcher } from '../systems/SymbolMatcher';
import { getSession } from '../session';
import { addLight, falloff, noise, rgb, SHADES, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL } from '../ui/pixelTextures';
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
/** The rag's reach (px) when rubbing the soot away. */
const RUB_RADIUS = 8;
/** How fast the rag moves with the arrow keys, px per second. */
const RAG_SPEED = 150;
/** How much of a picture must be rubbed clean before it counts as found. */
const FOUND_AT = 0.5;
const MAX_INPUT = 20;
const COLD = ['Cold.', 'No. Look again.', "That's not it."];

/** rub: rubbing off the soot to find the pictures; read: typing; solved: the line is on its way; done: it's shown. */
type Phase = 'rub' | 'read' | 'solved' | 'done';

/** One place on the plate. The same symbol can sit in more than one place ("I" … "me"). */
interface Slot {
  symbol: DecodeSymbol;
  x: number;
  y: number;
  scratch: Phaser.GameObjects.Image;
  glint: Phaser.GameObjects.Image;
  found: boolean;
  /** Indexes into the soot grid of the pixels this picture's scratches cover. */
  pixels: number[];
}

/** A rag for rubbing (light cloth with a darker fold). */
const RAG = {
  rows: ['..llll.', '.llllll', 'llddlll', 'lllldll', '.llllll', '..lll..'],
  colours: { l: SHADES.light, d: SHADES.dim },
};

/**
 * The decoding screen: the plate from inside a bird, by firelight, a sentence of pictures in two
 * rows, one per word. It comes out of the fire black with soot: first you rub it clean with a rag
 * (drag the mouse, or the arrow keys) and the scratches appear where you rub; then you pick a
 * picture and type what you think it means.
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
  private phase: Phase = 'rub';
  /** Soot over the plate: drawn on a canvas, rubbed away pixel by pixel. */
  private soot!: Phaser.Textures.CanvasTexture;
  private sootImage!: Phaser.GameObjects.Image;
  private clean!: Uint8Array;
  private sootDirty = false;
  private rag!: Phaser.GameObjects.Image;
  private ragAt: { x: number; y: number } | null = null;
  private rubbing = false;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Patches of soot crumbling away round found pictures (plate pixel indexes still to clear). */
  private dissolving: number[][] = [];
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
  private keys!: Record<'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's', Phaser.Input.Keyboard.Key>;

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
    this.phase = 'rub';
    this.ragAt = null;
    this.rubbing = false;
    this.dissolving = [];
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
        const glint = this.add.image(x, y + 1, makeSpriteTexture(this, `glyph-${id}-lit`, symbol.picture, { '#': SHADES.white })).setScale(PICTURE_SCALE).setDepth(1).setAlpha(0.5);
        this.slots.push({ symbol, x, y, scratch, glint, found: false, pixels: this.picturePixels(symbol, x, y) });
      });
    });
    this.drawPlate();
    this.makeSoot();
    this.frame = this.add.graphics().setDepth(5);
    this.rag = this.add.image(PLATE.x, PLATE.y + PLATE.height / 2 + 14, makeSpriteTexture(this, 'rag', RAG.rows, RAG.colours)).setScale(2).setDepth(6);
    this.ragAt = { x: this.rag.x, y: this.rag.y };
    this.dust = this.add.particles(0, 0, PIXEL, { speedY: { min: 10, max: 30 }, speedX: { min: -8, max: 8 }, lifespan: 700, tint: [SHADES.deep, SHADES.woodLight], alpha: { start: 0.9, end: 0 }, emitting: false }).setDepth(6);

    this.prompt = new PixelText(this, 0, 6, 'Rub the soot off the plate.   Drag the mouse, or the arrow keys', { color: SHADES.light, shadow: SHADES.shadow });
    this.inputText = new PixelText(this, 0, 136, '', { color: SHADES.white, shadow: SHADES.shadow });
    this.feedback = new PixelText(this, 0, 152, '', { color: SHADES.amber, shadow: SHADES.shadow });
    this.help = new PixelText(this, 0, 166, '', { color: SHADES.light, shadow: SHADES.shadow, wrapWidth: 400 });
    this.strip = new PixelText(this, 0, 218, '', { color: SHADES.dim, shadow: SHADES.shadow });

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), up: kb.addKey(K.UP), down: kb.addKey(K.DOWN),
      a: kb.addKey(K.A, false), d: kb.addKey(K.D, false), w: kb.addKey(K.W, false), s: kb.addKey(K.S, false),
    };
    kb.on('keydown', this.onKey, this);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'rub') this.moveRag(p.x, p.y, p.isDown);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'rub') this.moveRag(p.x, p.y, true);
      if (this.phase !== 'read') return;
      const hit = this.slots.findIndex((s) => !s.symbol.given && Math.abs(p.x - s.x) < SLOT_WIDTH / 2 && Math.abs(p.y - s.y) < 24);
      if (hit >= 0) this.select(hit);
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => ((this.cursorOn = !this.cursorOn), this.renderInput()) });
    this.renderStrip();
    this.centreText();
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'rub') {
      const dx = (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0) - (this.keys.left.isDown || this.keys.a.isDown ? 1 : 0);
      const dy = (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0) - (this.keys.up.isDown || this.keys.w.isDown ? 1 : 0);
      if (dx || dy) {
        const step = (RAG_SPEED * delta) / 1000 / Math.hypot(dx, dy);
        this.moveRag(this.rag.x + dx * step, this.rag.y + dy * step, true);
      }
      // A little scrubbing wobble while rubbing.
      this.rag.setAngle(this.rubbing ? Math.sin(_time / 40) * 12 : 0);
      this.rubbing = false;
    }
    this.updateDissolving(delta);
    if (this.sootDirty) {
      this.soot.refresh();
      this.sootDirty = false;
    }
    this.drawFrame();
  }

  // --- Rubbing off the soot ---

  /** The plate pixels under each scratch of a picture (one per picture pixel, at its centre). */
  private picturePixels(symbol: DecodeSymbol, x: number, y: number): number[] {
    const w = symbol.picture[0]!.length;
    const h = symbol.picture.length;
    const left = Math.round(x - (w * PICTURE_SCALE) / 2 - (PLATE.x - PLATE.width / 2));
    const top = Math.round(y - (h * PICTURE_SCALE) / 2 - (PLATE.y - PLATE.height / 2));
    const out: number[] = [];
    symbol.picture.forEach((row, py) => [...row].forEach((ch, px) => ch === '#' && out.push((top + py * PICTURE_SCALE) * PLATE.width + left + px * PICTURE_SCALE)));
    return out;
  }

  /** A thick, uneven layer of soot over the whole plate. */
  private makeSoot(): void {
    const { width: w, height: h } = PLATE;
    if (this.textures.exists('decode-soot')) this.textures.remove('decode-soot');
    this.soot = this.textures.createCanvas('decode-soot', w, h)!;
    const ctx = this.soot.getContext();
    const image = ctx.createImageData(w, h);
    const tones = [SHADES.shadow, SHADES.deep, SHADES.deep, SHADES.wood, SHADES.woodLight].map(rgb);
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      const n = 0.5 + 0.5 * noise(x * 0.13 + noise(y * 0.21) * 4);
      const c = tones[Math.min(tones.length - 1, Math.floor(n * 3 + Math.random() * 2))]!;
      image.data.set([c[0], c[1], c[2], 255], i * 4);
    }
    ctx.putImageData(image, 0, 0);
    this.soot.refresh();
    this.sootImage = this.add.image(PLATE.x - w / 2, PLATE.y - h / 2, 'decode-soot').setOrigin(0).setDepth(4);
    this.clean = new Uint8Array(w * h);
  }

  /** Moves the rag to (x, y), rubbing the soot away along the way if `rub`. */
  private moveRag(x: number, y: number, rub: boolean): void {
    const left = PLATE.x - PLATE.width / 2;
    const top = PLATE.y - PLATE.height / 2;
    x = Phaser.Math.Clamp(x, left - 4, left + PLATE.width + 4);
    y = Phaser.Math.Clamp(y, top - 4, top + PLATE.height + 20);
    const from = this.ragAt ?? { x, y };
    this.rag.setPosition(Math.round(x), Math.round(y));
    this.ragAt = { x, y };
    if (!rub) return;
    this.rubbing = true;
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / 3));
    for (let i = 1; i <= steps; i++) this.rubAt(from.x + ((x - from.x) * i) / steps - left, from.y + ((y - from.y) * i) / steps - top);
    this.checkFound();
  }

  /** Clears the soot in a rough circle around (cx, cy), in plate coordinates. */
  private rubAt(cx: number, cy: number): void {
    const ctx = this.soot.getContext();
    let cleared = 0;
    for (let dy = -RUB_RADIUS; dy <= RUB_RADIUS; dy++) {
      for (let dx = -RUB_RADIUS; dx <= RUB_RADIUS; dx++) {
        const x = Math.round(cx + dx);
        const y = Math.round(cy + dy);
        if (x < 0 || y < 0 || x >= PLATE.width || y >= PLATE.height) continue;
        // A ragged edge: the outer ring only comes clean some of the time.
        const d = Math.hypot(dx, dy) / RUB_RADIUS;
        if (d > 1 || (d > 0.7 && Math.random() < 0.6)) continue;
        const i = y * PLATE.width + x;
        if (this.clean[i]) continue;
        this.clean[i] = 1;
        ctx.clearRect(x, y, 1, 1);
        cleared++;
      }
    }
    if (cleared > 0) {
      this.sootDirty = true;
      if (Math.random() < 0.5) this.dust.emitParticleAt(PLATE.x - PLATE.width / 2 + cx, PLATE.y - PLATE.height / 2 + cy, 1);
    }
  }

  /** Any picture rubbed clean enough is found: the rest of its soot falls away. */
  private checkFound(): void {
    for (const slot of this.slots) {
      if (slot.found) continue;
      const cleaned = slot.pixels.filter((i) => this.clean[i]).length;
      if (cleaned / slot.pixels.length >= FOUND_AT) this.find(slot);
    }
  }

  private find(slot: Slot): void {
    slot.found = true;
    this.dissolveAround(slot);
    this.tweens.add({ targets: slot.scratch, scale: PICTURE_SCALE * 1.15, duration: 120, yoyo: true });
    // A picture you've read before: your words come back to you.
    const known = this.matcher.answer(slot.symbol.id);
    if (known !== null && !slot.symbol.given) this.feedback.setColor(SHADES.amber).setText(`I recognise this one: ${known}.`);
    this.renderStrip();
    const left = this.slots.filter((s) => !s.found).length;
    if (left > 0) {
      playMove(this);
      this.setPrompt(`${this.slots.length - left} of ${this.slots.length} pictures found.   Keep rubbing`);
      return;
    }
    playConfirm(this);
    this.phase = 'read';
    this.tweens.add({ targets: [this.sootImage, this.rag], alpha: 0, duration: 700 });
    this.time.delayedCall(500, () => {
      this.setPrompt('Left / Right or click: choose a picture.   Type what it means, then Enter.');
      const first = this.nextUnsolvedFrom(-1);
      if (first === null) this.complete();
      else this.select(first);
    });
  }

  /** The rest of the soot round a found picture crumbles away over a moment, in a ragged patch (not a neat square). */
  private dissolveAround(slot: Slot): void {
    const rx = (slot.symbol.picture[0]!.length * PICTURE_SCALE) / 2 + 5;
    const ry = (slot.symbol.picture.length * PICTURE_SCALE) / 2 + 5;
    const cx = slot.x - (PLATE.x - PLATE.width / 2);
    const cy = slot.y - (PLATE.y - PLATE.height / 2);
    const pixels: number[] = [];
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) {
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
        if (x < 0 || y < 0 || x >= PLATE.width || y >= PLATE.height) continue;
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 0.85 + 0.3 * noise(x * 0.4 + y * 0.9) && !this.clean[y * PLATE.width + x]) pixels.push(y * PLATE.width + x);
      }
    }
    Phaser.Utils.Array.Shuffle(pixels);
    this.dissolving.push(pixels);
  }

  /** Clears a little more of each dissolving patch every frame. */
  private updateDissolving(delta: number): void {
    if (!this.dissolving.length) return;
    const ctx = this.soot.getContext();
    const perFrame = Math.ceil(delta * 1.2);
    for (const pixels of this.dissolving) {
      for (const i of pixels.splice(0, perFrame)) {
        this.clean[i] = 1;
        ctx.clearRect(i % PLATE.width, Math.floor(i / PLATE.width), 1, 1);
      }
    }
    this.dissolving = this.dissolving.filter((p) => p.length);
    this.sootDirty = true;
  }

  /** The plate: pale metal, finely machined. */
  private drawPlate(): void {
    const g = this.plate.clear();
    const { width: w, height: h } = PLATE;
    const left = PLATE.x - w / 2;
    const top = PLATE.y - h / 2;
    g.fillStyle(SHADES.deep).fillRect(left - 2, top - 2, w + 4, h + 4);
    g.fillStyle(SHADES.dim).fillRect(left, top, w, h);
    g.fillStyle(SHADES.light).fillRect(left + 1, top + 1, w - 2, h - 3);
    g.fillStyle(SHADES.white).fillRect(left + 1, top + 1, w - 2, 1);
    // Fine machining lines across the metal (a precision no tree carver could manage).
    g.fillStyle(SHADES.dim, 0.25);
    for (let y = top + 5; y < top + h - 3; y += 4) g.fillRect(left + 3, y, w - 6, 1);
  }

  /** The amber frame around the chosen picture, and a small mark under each solved one. */
  private drawFrame(): void {
    const g = this.frame.clear();
    if (this.phase !== 'read') return;
    const chosen = this.slots[this.selected]?.symbol;
    this.slots.forEach((slot) => {
      const w = slot.symbol.picture[0]!.length * PICTURE_SCALE + 8;
      const h = slot.symbol.picture.length * PICTURE_SCALE + 8;
      const x = Math.round(slot.x - w / 2);
      const y = Math.round(slot.y - h / 2);
      // Every place the chosen symbol appears is framed: solving it fills them all.
      if (slot.symbol === chosen) g.lineStyle(1, SHADES.amber).strokeRect(x, y, w, h);
      if (this.matcher.isSolved(slot.symbol.id) && !slot.symbol.given) g.fillStyle(SHADES.amberDeep).fillRect(Math.round(slot.x - 5), y + h + 1, 10, 2);
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
    const letters = this.isSolved() ? '' : this.matcher.revealedLetters(symbol.id);
    const help = level === 'hint' ? symbol.hint : level === 'nudge' ? symbol.nudge : '';
    this.help.setText(letters ? `${help}\n\nIt begins:  ${letters}` : help);
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

  /** Your words so far, in the plate's two rows: blanks for pictures still under the soot or still to solve. */
  private renderStrip(): void {
    let i = 0;
    const rows = this.message.rows.map((row) => row.map((id) => (this.slots[i++]?.found ? (this.matcher.answer(id) ?? '___') : '___')).join('  '));
    this.strip.setText(rows.join('\n'));
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
