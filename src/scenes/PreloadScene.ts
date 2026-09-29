import Phaser from 'phaser';
import { css, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../config';

/** Placeholder textures generated in code (no art files yet). */
export const TEXTURES = {
  /** Small white dot for particles. */
  dot: 'dot',
  /** Soft white radial falloff, tinted and blended additively for halos. */
  softGlow: 'soft-glow',
} as const;

/** Loads assets (none yet besides generated placeholders) with a progress bar, then shows the title. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const barWidth = 600;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;
    this.add.rectangle(x, y, barWidth, 6, PALETTE.canopyWhite, 0.15).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x, y, 0, 6, PALETTE.canopyWhite).setOrigin(0, 0.5);
    this.add
      .text(GAME_WIDTH / 2, y - 40, 'Loading…', { fontFamily: 'Georgia, serif', fontSize: '28px', color: css('canopyWhite') })
      .setOrigin(0.5);
    this.load.on('progress', (p: number) => (bar.width = barWidth * p));
    // Future: this.load.image(...) etc. from public/assets/.
  }

  create(): void {
    this.makeDotTexture();
    this.makeSoftGlowTexture();
    this.scene.start('Title');
  }

  private makeDotTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(8, 8, 8);
    g.generateTexture(TEXTURES.dot, 16, 16);
    g.destroy();
  }

  private makeSoftGlowTexture(): void {
    const size = 256;
    const texture = this.textures.createCanvas(TEXTURES.softGlow, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }
}
