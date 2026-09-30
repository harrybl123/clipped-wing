import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SHADES } from '../ui/pixelArt';
import { PIXEL } from '../ui/pixelTextures';

/** Loads assets (none yet besides generated placeholders) with a progress bar, then shows the title. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const barWidth = 120;
    const x = Math.round((GAME_WIDTH - barWidth) / 2);
    const y = Math.round(GAME_HEIGHT / 2);
    this.add.rectangle(x, y, barWidth, 2, SHADES.woodPale).setOrigin(0);
    const bar = this.add.rectangle(x, y, 0, 2, SHADES.white).setOrigin(0);
    this.load.on('progress', (p: number) => (bar.width = Math.round(barWidth * p)));
    // Future: this.load.image(...) etc. from public/assets/.
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture(PIXEL, 1, 1);
    g.destroy();
    this.scene.start('Title');
  }
}
