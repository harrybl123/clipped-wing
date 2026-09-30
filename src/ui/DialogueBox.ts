import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { StoryBridge } from '../systems/StoryBridge';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PORTRAIT_SIZE, SPEAKERS } from './portraits';
import { PixelText } from './PixelText';
import { MORE_ARROW } from './sprites';

const MARGIN = 8;
const HEIGHT = 70;
const PADDING = 7;
const CHOICE_SPACING = 11;
const MAX_CHOICES = 9;
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

    this.container = scene.add
      .container(0, 0, [border, panel, this.portraitFrame, this.portraitBack, this.portrait, this.nameText, this.lineText, this.continueHint])
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
    this.onClose = onClose ?? null;
    this._isOpen = true;
    this.container.setVisible(true);
    this.advance();
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
    const line = this.story.nextLine();
    if (line === null) {
      this.close();
      return;
    }
    this.showSpeaker(line.tags);
    this.lineText.setText(line.text);
    // If ink now wants a choice, show the options under this line straight away.
    if (!this.story.canContinue) this.showChoices();
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

  private showChoices(): void {
    const choices = this.story.choices().slice(0, MAX_CHOICES);
    let y = this.lineText.y + this.lineText.height + 4;
    for (const [i, choice] of choices.entries()) {
      const text = new PixelText(this.scene, this.lineText.x + 6, y, `${i + 1}. ${choice.text}`, { color: SHADES.light })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => text.setColor(SHADES.amber))
        .on('pointerout', () => text.setColor(SHADES.light))
        .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.choose(choice.index);
        });
      this.container.add(text.setScrollFactor(0));
      this.choiceTexts.push(text);
      y += CHOICE_SPACING;
    }
  }

  private choose(index: number): void {
    this.clearChoices();
    this.story.choose(index);
    this.advance();
  }

  private clearChoices(): void {
    for (const t of this.choiceTexts) t.destroy();
    this.choiceTexts = [];
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this._isOpen || event.repeat) return;
    if (this.choiceTexts.length > 0) {
      const n = Number.parseInt(event.key, 10);
      const choice = this.story.choices()[n - 1];
      if (choice && n <= this.choiceTexts.length) this.choose(choice.index);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') this.advance();
  }

  private handlePointer(): void {
    if (this._isOpen && this.choiceTexts.length === 0) this.advance();
  }
}
