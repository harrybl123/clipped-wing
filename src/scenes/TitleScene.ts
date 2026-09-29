import Phaser from 'phaser';
import { css, GAME_HEIGHT, GAME_WIDTH } from '../config';

/** Placeholder title screen. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(css('carvedWood'));
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Clipped Wing', {
        fontFamily: 'Georgia, serif',
        fontSize: '120px',
        color: css('canopyWhite'),
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'press any key', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: css('canopyWhite'),
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = () => this.scene.start('TestArea');
    this.input.keyboard?.once('keydown', start);
    this.input.once('pointerdown', start);
  }
}
