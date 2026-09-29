import Phaser from 'phaser';
import { css, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../config';
import type { StoryBridge } from '../systems/StoryBridge';

const MARGIN = 80;
const HEIGHT = 300;
const PADDING = 36;
const FONT = 'Georgia, serif';
const MAX_CHOICES = 9;

/**
 * Bottom-of-screen box that plays an ink knot through the StoryBridge.
 * Advance with Space, Enter, E or a click; pick choices with number keys or a click.
 */
export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly lineText: Phaser.GameObjects.Text;
  private readonly continueHint: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private onClose: (() => void) | null = null;
  private _isOpen = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly story: StoryBridge,
  ) {
    const width = GAME_WIDTH - MARGIN * 2;
    const top = GAME_HEIGHT - MARGIN - HEIGHT;
    const panel = scene.add
      .rectangle(MARGIN, top, width, HEIGHT, PALETTE.carvedWood, 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, PALETTE.canopyWhite, 0.35);
    this.lineText = scene.add.text(MARGIN + PADDING, top + PADDING, '', {
      fontFamily: FONT,
      fontSize: '36px',
      color: css('canopyWhite'),
      wordWrap: { width: width - PADDING * 2 },
      lineSpacing: 8,
    });
    this.continueHint = scene.add
      .text(MARGIN + width - PADDING, top + HEIGHT - PADDING, '▼', { fontFamily: FONT, fontSize: '28px', color: css('canopyWhite') })
      .setOrigin(1, 1);
    scene.tweens.add({ targets: this.continueHint, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.container = scene.add
      .container(0, 0, [panel, this.lineText, this.continueHint])
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
    this.lineText.setText(line.text);
    // If ink now wants a choice, show the options under this line straight away.
    if (!this.story.canContinue) this.showChoices();
    this.continueHint.setVisible(this.choiceTexts.length === 0);
  }

  private showChoices(): void {
    const choices = this.story.choices().slice(0, MAX_CHOICES);
    let y = this.lineText.y + this.lineText.height + 24;
    for (const [i, choice] of choices.entries()) {
      const text = this.scene.add
        .text(this.lineText.x + 24, y, `${i + 1}. ${choice.text}`, { fontFamily: FONT, fontSize: '32px', color: css('canopyWhite') })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => text.setColor(css('lampAmber')))
        .on('pointerout', () => text.setColor(css('canopyWhite')))
        .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.choose(choice.index);
        });
      this.container.add(text.setScrollFactor(0));
      this.choiceTexts.push(text);
      y += text.height + 10;
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
