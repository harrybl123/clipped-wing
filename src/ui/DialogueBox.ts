import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { StoryBridge } from '../systems/StoryBridge';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PORTRAIT_SIZE, SPEAKERS } from './portraits';
import { PixelText } from './PixelText';
import { CROWD_VOICES, FACELESS_VOICES, type TypedLetter, typeLine, type Voice, VOICES } from '../systems/voices';
import { playConfirm, playMove } from './sfx';
import { playSyllable } from './voice';
import { MORE_ARROW } from './sprites';

const MARGIN = 8;
const HEIGHT = 70;
const PADDING = 7;
const CHOICE_SPACING = 11;
/** Choices are indented a little under the line they answer. */
const CHOICE_INDENT = 6;
const MAX_CHOICES = 9;

/** An option in a menu opened from code. */
export interface MenuOption {
  label: string;
  run: () => void;
}
const PORTRAIT_GAP = 7;

/**
 * Bottom-of-screen box that plays an ink knot through the StoryBridge.
 * Advance with Space, Enter, E or a click; pick choices with number keys or a click.
 */
export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly lineText: PixelText;
  private readonly nameText: PixelText;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  private readonly portraitBack: Phaser.GameObjects.Rectangle;
  private readonly portrait: Phaser.GameObjects.Image;
  private readonly top: number;
  private readonly width: number;
  private readonly continueHint: Phaser.GameObjects.Image;
  private readonly border: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private choiceTexts: PixelText[] = [];
  private options: MenuOption[] = [];
  /** 'ink' plays the story; 'menu' and 'message' are shown from code (door menus, notices); 'held' stays up until code closes it. */
  private mode: 'ink' | 'menu' | 'message' | 'held' = 'ink';
  private selected = 0;
  private onClose: (() => void) | null = null;
  private _isOpen = false;
  /** The line typing out: its letters' timing, how far it's got, and the voice speaking it. */
  private typing: { letters: TypedLetter[]; index: number; wait: number; voices: Voice[]; muffled: boolean } | null = null;
  /** Choices to show once the line has finished typing. */
  private pendingChoices: MenuOption[] | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly story: StoryBridge,
    /** Called with each line's tags as it's shown (the scene acts on ones like #time: or #show:). */
    private readonly onLine?: (tags: string[]) => void,
  ) {
    const width = GAME_WIDTH - MARGIN * 2;
    const top = GAME_HEIGHT - MARGIN - HEIGHT;
    this.width = width;
    this.top = top;
    // A 1px border made of two filled rectangles (crisper than a stroke at this scale).
    const border = scene.add.rectangle(MARGIN, top, width, HEIGHT, SHADES.dim).setOrigin(0);
    const panel = scene.add.rectangle(MARGIN + 1, top + 1, width - 2, HEIGHT - 2, SHADES.shadow).setOrigin(0);
    this.border = border;
    this.panel = panel;
    this.lineText = new PixelText(scene, MARGIN + PADDING, top + PADDING, '', { color: SHADES.white, wrapWidth: width - PADDING * 2 });
    this.nameText = new PixelText(scene, MARGIN + PADDING, top + PADDING, '', { color: SHADES.amber });
    // Speaker portrait on the left, in a thin frame.
    const portraitY = top + Math.floor((HEIGHT - PORTRAIT_SIZE) / 2);
    this.portraitFrame = scene.add.rectangle(MARGIN + PADDING - 1, portraitY - 1, PORTRAIT_SIZE + 2, PORTRAIT_SIZE + 2, SHADES.woodPale).setOrigin(0);
    this.portraitBack = scene.add.rectangle(MARGIN + PADDING, portraitY, PORTRAIT_SIZE, PORTRAIT_SIZE, SHADES.woodLight).setOrigin(0);
    this.portrait = scene.add.image(MARGIN + PADDING, portraitY, '__DEFAULT').setOrigin(0);
    this.continueHint = scene.add
      .image(MARGIN + width - PADDING, top + HEIGHT - PADDING, makeSpriteTexture(scene, 'more-arrow', MORE_ARROW.rows, MORE_ARROW.colours))
      .setOrigin(1, 1);
    scene.tweens.add({ targets: this.continueHint, y: '+=1', duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [1] });


    this.container = scene.add
      .container(0, 0, [border, panel, this.portraitFrame, this.portraitBack, this.portrait, this.nameText, this.lineText, this.continueHint])
      .setScrollFactor(0, 0, true) // children too, or input hit-tests use the camera scroll
      .setDepth(1000)
      .setVisible(false);

    scene.input.keyboard?.on('keydown', this.handleKey, this);
    scene.input.on('pointerdown', this.handlePointer, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown', this.handleKey, this);
      scene.input.off('pointerdown', this.handlePointer, this);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    });
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /** Starts the ink knot and shows its first line. `onClose` runs when the conversation ends. */
  open(knot: string, onClose?: () => void): void {
    this.story.startKnot(knot);
    this.show('ink', onClose);
    this.advance();
  }

  /**
   * Shows a line of narration with options, from code rather than ink (e.g. a door menu).
   * Picking an option closes the box, then runs it.
   */
  openMenu(text: string, options: MenuOption[], onClose?: () => void): void {
    this.show('menu', onClose);
    this.setLine(text, [], false);
    this.showChoices(options.map((o) => ({ label: o.label, run: () => { this.close(); o.run(); } })));
    this.continueHint.setVisible(false);
  }

  /** Shows a single line of narration from code; the next press closes it. */
  say(text: string, onClose?: () => void): void {
    this.show('message', onClose);
    this.setLine(text, []);
    this.continueHint.setVisible(false);
  }

  /**
   * Shows one line from code, with its tags (`speaker:<id>` for a portrait, `name:<Name>` for a name
   * without one). The next press closes it. Used by scenes that step through ink themselves (the prologue).
   */
  line(text: string, tags: string[], onClose?: () => void): void {
    this.show('message', onClose);
    this.setLine(text, tags);
    this.continueHint.setVisible(false);
  }

  /** Shows one line that stays up, ignoring key presses, until code calls close() (e.g. while the player follows an instruction). */
  hold(text: string, tags: string[]): void {
    this.show('held');
    this.setLine(text, tags);
    this.continueHint.setVisible(false);
  }

  private show(mode: 'ink' | 'menu' | 'message' | 'held', onClose?: () => void): void {
    this.clearChoices();
    this.typing = null;
    this.pendingChoices = null;
    this.mode = mode;
    this.onClose = onClose ?? null;
    this._isOpen = true;
    this.container.setVisible(true);
  }

  /** Shows a line, typing it out (unless `type` is false) in the speaker's voice. */
  private setLine(text: string, tags: string[], type = true): void {
    this.onLine?.(tags);
    this.showSpeaker(tags);
    this.lineText.setText(text);
    this.fit();
    this.typing = null;
    if (!type) return;
    const { voices, muffled } = this.voiceFor(tags);
    const letters = typeLine(this.lineText.laidOut, voices[0]);
    this.typing = { letters, index: 0, wait: 0, voices, muffled };
    this.lineText.setRevealed(0);
  }

  /** The voice a line is spoken in: the speaker's; a faceless voice's own (muffled behind a curtain or shutter); none for narration or a quote. */
  private voiceFor(tags: string[]): { voices: Voice[]; muffled: boolean } {
    if (tags.includes('quote')) return { voices: [], muffled: false };
    const id = tags.find((t) => t.startsWith('speaker:'))?.slice('speaker:'.length).trim();
    const voice = id ? SPEAKERS[id]?.voice : undefined;
    if (voice === 'crowd') return { voices: CROWD_VOICES.map((v) => VOICES[v]), muffled: false };
    if (voice) return { voices: [VOICES[voice]], muffled: false };
    const name = tags.find((t) => t.startsWith('name:'))?.slice('name:'.length).trim();
    const faceless = name ? FACELESS_VOICES[name] : undefined;
    return faceless ? { voices: [VOICES[faceless]], muffled: name === 'A voice' || name === 'Your friend' } : { voices: [], muffled: false };
  }

  get isTyping(): boolean {
    return this.typing !== null;
  }

  /** Types the line out letter by letter, sounding each syllable. */
  private tick(_time: number, delta: number): void {
    const t = this.typing;
    if (!t || !this._isOpen) return;
    t.wait -= delta / 1000;
    while (t.wait <= 0 && t.index < t.letters.length) {
      const letter = t.letters[t.index]!;
      t.index++;
      this.lineText.setRevealed(t.index);
      if (letter.syllable) {
        // The crowd: several voices at once, slightly out of step.
        t.voices.forEach((v, i) => playSyllable(this.scene, v, letter.syllable!, { muffled: t.muffled, gain: t.voices.length > 1 ? 0.55 : 1, delay: i * 0.018 + (i > 0 ? Math.random() * 0.03 : 0) }));
      }
      t.wait += t.letters[t.index]?.delay ?? 0;
    }
    if (t.index >= t.letters.length) this.finishTyping();
  }

  /** Shows the whole line at once (a key press while typing, or when it's done), then any choices. */
  private finishTyping(): void {
    this.typing = null;
    this.lineText.setRevealed(null);
    const pending = this.pendingChoices;
    this.pendingChoices = null;
    if (pending) this.showChoices(pending);
    if (this.mode !== 'held' && this.mode !== 'menu') this.continueHint.setVisible(this.choiceTexts.length === 0);
  }

  /**
   * Grows the box upwards when a long line and its choices won't fit in the usual height, so nothing
   * spills off the bottom of the screen. The box's bottom edge stays put.
   */
  private fit(): void {
    const last = this.choiceTexts[this.choiceTexts.length - 1];
    const bottom = last ? last.y + last.height : this.lineText.y + this.lineText.height;
    const extra = Math.max(0, Math.ceil(bottom - this.top + PADDING - HEIGHT));
    this.container.setY(-extra);
    this.border.setSize(this.width, HEIGHT + extra);
    this.panel.setSize(this.width - 2, HEIGHT + extra - 2);
    this.continueHint.setY(this.top + HEIGHT - PADDING + extra);
  }

  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.clearChoices();
    this.container.setVisible(false);
    const onClose = this.onClose;
    this.onClose = null;
    onClose?.();
  }

  /** Shows the next line, or the choices, or closes if the knot has finished. */
  private advance(): void {
    if (this.choiceTexts.length > 0) return; // waiting for a choice
    if (this.mode !== 'ink') {
      this.close();
      return;
    }
    // Skip blank lines (ink produces one after a choice with no text of its own).
    let line = this.story.nextLine();
    while (line !== null && line.text === '') line = this.story.nextLine();
    if (line === null) {
      // Nothing more to say: either ink is waiting on a choice (keep the last line up) or it's over.
      if (this.story.choices().length > 0) {
        this.typing = null;
        this.lineText.setRevealed(null);
        this.showChoices(this.inkOptions());
        this.continueHint.setVisible(false);
      } else {
        this.close();
      }
      return;
    }
    this.setLine(line.text, line.tags);
    // If ink now wants a choice, show the options under this line once it has typed out.
    if (!this.story.canContinue) this.pendingChoices = this.inkOptions();
    this.continueHint.setVisible(false);
  }

  /**
   * Shows the portrait and name for a `speaker:<id>` tag, just a name for a `name:<Name>` tag (a voice
   * with no face, as in the prologue), or neither for narration. With both, the name overrides the
   * speaker's usual one ("Your escort").
   */
  private showSpeaker(tags: string[]): void {
    const id = tags.find((t) => t.startsWith('speaker:'))?.slice('speaker:'.length).trim();
    const speaker = id ? SPEAKERS[id] : undefined;
    const name = tags.find((t) => t.startsWith('name:'))?.slice('name:'.length).trim();
    const nameOnly = speaker ? undefined : name;
    for (const o of [this.portraitFrame, this.portraitBack, this.portrait]) o.setVisible(!!speaker);
    this.nameText.setVisible(!!speaker || !!nameOnly);
    const textX = MARGIN + PADDING + (speaker ? PORTRAIT_SIZE + PORTRAIT_GAP : 0);
    this.lineText.setX(textX).setY(this.top + PADDING + (speaker || nameOnly ? 11 : 0));
    this.lineText.setWrapWidth(this.width - (textX - MARGIN) - PADDING);
    if (nameOnly) this.nameText.setText(nameOnly).setX(textX);
    if (!speaker || !id) return;
    this.portrait.setTexture(makeSpriteTexture(this.scene, `portrait-${id}`, speaker.portrait.rows, speaker.portrait.colours));
    this.nameText.setText(name ?? speaker.name).setX(textX);
  }

  /** The story's current choices as options: choosing one continues the story. */
  private inkOptions(): MenuOption[] {
    return this.story.choices().map((c) => ({ label: c.text, run: () => { this.clearChoices(); this.story.choose(c.index); this.advance(); } }));
  }

  private showChoices(options: MenuOption[]): void {
    const choices = options.slice(0, MAX_CHOICES);
    let y = this.lineText.y + this.lineText.height + 4;
    for (const [i, choice] of choices.entries()) {
      const text = new PixelText(this.scene, this.lineText.x + CHOICE_INDENT, y, `${i + 1}. ${choice.label}`, { color: SHADES.light })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.select(i))
        .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.choose(i);
        });
      this.container.add(text.setScrollFactor(0));
      this.choiceTexts.push(text);
      y += CHOICE_SPACING;
    }
    this.options = choices;
    this.select(0, false);
    this.fit();
  }

  /** Highlights choice i (wrapping around) in amber. No cursor: an arrow beside one option reads as a recommendation. */
  private select(i: number, sound = true): void {
    const count = this.choiceTexts.length;
    if (count === 0) return;
    const next = (i + count) % count;
    if (sound && next !== this.selected) playMove(this.scene);
    this.selected = next;
    this.choiceTexts.forEach((t, j) => t.setColor(j === this.selected ? SHADES.amber : SHADES.light));
  }

  private choose(i: number): void {
    const option = this.options[i];
    if (!option) return;
    playConfirm(this.scene);
    option.run();
  }

  private clearChoices(): void {
    for (const t of this.choiceTexts) t.destroy();
    this.choiceTexts = [];
    this.options = [];
    this.fit();
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this._isOpen || event.repeat || this.mode === 'held') return;
    const key = event.key.toLowerCase();
    const confirm = key === ' ' || key === 'enter' || key === 'e';
    if (this.typing) {
      if (confirm) this.finishTyping(); // the first press shows the whole line
      return;
    }
    if (this.choiceTexts.length > 0) {
      if (key === 'arrowup' || key === 'w') this.select(this.selected - 1);
      else if (key === 'arrowdown' || key === 's') this.select(this.selected + 1);
      else if (confirm) this.choose(this.selected);
      else {
        const n = Number.parseInt(key, 10);
        if (n >= 1 && n <= this.options.length) this.choose(n - 1);
      }
      return;
    }
    if (confirm) this.advance();
  }

  private handlePointer(): void {
    if (!this._isOpen || this.mode === 'held') return;
    if (this.typing) this.finishTyping();
    else if (this.choiceTexts.length === 0) this.advance();
  }
}
