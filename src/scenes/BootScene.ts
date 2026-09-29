import Phaser from 'phaser';
import { css, GAME_HEIGHT, GAME_WIDTH } from '../config';

/** Temporary scene proving the scaffold renders. Replaced in milestone 4. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(css('carvedWood'));
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Clipped Wing — scaffold OK', {
        fontFamily: 'Georgia, serif',
        fontSize: '64px',
        color: css('canopyWhite'),
      })
      .setOrigin(0.5);
  }
}
