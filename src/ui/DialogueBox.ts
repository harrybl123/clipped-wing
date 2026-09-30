import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { StoryBridge } from '../systems/StoryBridge';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PORTRAIT_SIZE, SPEAKERS } from './portraits';
import { PixelText } from './PixelText';
import { BIRD, MORE_ARROW } from './sprites';

const MARGIN = 8;
const HEIGHT = 70;
const PADDING = 7;
const CHOICE_SPACING = 11;
/** Choices are indented to leave room for the bird cursor. */
const CHOICE_INDENT = 14;
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
  private choiceTexts: PixelText[] = [];
  private options: MenuOption[] = [];
  /** 'ink' plays the story; 'menu' and 'message' are shown from code (door menus, notices). */
  private mode: 'ink' | 'menu' | 'message' = 'ink';
  private selected = 0;
  private readonly cursor: Phaser.GameObjects.Image;
  private onClose: (() => void) | null = null;
  private _isOpen = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly story: StoryBridge,
  ) {
    const width = GAME_WIDTH - MARGIN * 2;
    const top = GAME_HEIGHT - MARGIN - HEIGHT;
    this.width = width;
    this.top = top;
    // A 1px border made of two filled rectangles (crisper than a stroke at this scale).
    const border = scene.add.rectangle(MARGIN, top, width, HEIGHT, SHADES.dim).setOrigin(0);
    const panel = scene.add.rectangle(MARGIN + 1, top + 1, width - 2, HEIGHT - 2, SHADES.shadow).setOrigin(0);
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

    // The small red bird marks the selected choice (the same cursor as the title menu).
    this.cursor = scene.add.image(0, 0, makeSpriteTexture(scene, 'bird', BIRD.rows, BIRD.colours)).setOrigin(0).setVisible(false);

    this.container = scene.add
      .container(0, 0, [border, panel, this.portraitFrame, this.portraitBack, this.portrait, this.nameText, this.lineText, this.continueHint, this.cursor])
      .setScrollFactor(0, 0, true) // children too, or input hit-tests use the camera scroll
      .setDepth(1000)
      .setVisible(false);

    scene.input.keyboard?.on('keydown', this.handleKey, this);
    scene.input.on('pointerdown', this.handlePointer, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown', this.handleKey, this);
      scene.input.off('pointerdown', this.handlePointer, this);
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
    this.setLine(text, []);
    this.showChoices(options.map((o) => ({ label: o.label, run: () => { this.close(); o.run(); } })));
    this.continueHint.setVisible(false);
  }

  /** Shows a single line of narration from code; the next press closes it. */
  say(text: string, onClose?: () => void): void {
    this.show('message', onClose);
    this.setLine(text, []);
    this.continueHint.setVisible(true);
  }

  private show(mode: 'ink' | 'menu' | 'message', onClose?: () => void): void {
    this.clearChoices();
    this.mode = mode;
    this.onClose = onClose ?? null;
    this._isOpen = true;
    this.container.setVisible(true);
  }

  private setLine(text: string, tags: string[]): void {
    this.showSpeaker(tags);
    this.lineText.setText(text);
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
        this.showChoices(this.inkOptions());
        this.continueHint.setVisible(false);
      } else {
        this.close();
      }
      return;
    }
    this.setLine(line.text, line.tags);
    // If ink now wants a choice, show the options under this line straight away.
    if (!this.story.canContinue) this.showChoices(this.inkOptions());
    this.continueHint.setVisible(this.choiceTexts.length === 0);
  }

  /** Shows the portrait and name for a `speaker:<id>` tag, or hides them for narration. */
  private showSpeaker(tags: string[]): void {
    const id = tags.find((t) => t.startsWith('speaker:'))?.slice('speaker:'.length).trim();
    const speaker = id ? SPEAKERS[id] : undefined;
    for (const o of [this.portraitFrame, this.portraitBack, this.portrait, this.nameText]) o.setVisible(!!speaker);
    const textX = MARGIN + PADDING + (speaker ? PORTRAIT_SIZE + PORTRAIT_GAP : 0);
    this.lineText.setX(textX).setY(this.top + PADDING + (speaker ? 11 : 0));
    this.lineText.setWrapWidth(this.width - (textX - MARGIN) - PADDING);
    if (!speaker || !id) return;
    this.portrait.setTexture(makeSpriteTexture(this.scene, `portrait-${id}`, speaker.portrait.rows, speaker.portrait.colours));
    this.nameText.setText(speaker.name).setX(textX);
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
    this.select(0);
  }

  /** Highlights choice i (wrapping around) and moves the bird cursor beside it. */
  private select(i: number): void {
    const count = this.choiceTexts.length;
    if (count === 0) return;
    this.selected = (i + count) % count;
    this.choiceTexts.forEach((t, j) => t.setColor(j === this.selected ? SHADES.amber : SHADES.light));
    const chosen = this.choiceTexts[this.selected]!;
    this.cursor.setPosition(this.lineText.x + 1, chosen.y + 1).setVisible(true);
  }

  private choose(i: number): void {
    const option = this.options[i];
    if (option) option.run();
  }

  private clearChoices(): void {
    for (const t of this.choiceTexts) t.destroy();
    this.choiceTexts = [];
    this.options = [];
    this.cursor.setVisible(false);
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this._isOpen || event.repeat) return;
    const key = event.key.toLowerCase();
    const confirm = key === ' ' || key === 'enter' || key === 'e';
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
    if (this._isOpen && this.choiceTexts.length === 0) this.advance();
  }
}
