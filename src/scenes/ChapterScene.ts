import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { BIRD } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';

export interface ChapterSceneData {
  /** "Chapter 1". */
  number: string;
  /** The chapter's name, large: "Fly or Fall". */
  title: string;
  /** Where the game goes next. */
  next: AreaSceneData;
}

/** How long the card holds before fading out (ms). */
const HOLD = 2800;

/**
 * A chapter's title card, on black (designer: after the prologue, "Chapter 1: Fly or Fall"): the number small,
 * the name large in the title's carved letters, a small red bird beneath. It fades in, holds, fades out,
 * and the game goes on. Any key or click skips it, after the first second.
 */
export class ChapterScene extends Phaser.Scene {
  private leaving = false;
  private next!: AreaSceneData;

  constructor() {
    super('Chapter');
  }

  create(data: ChapterSceneData): void {
    this.leaving = false;
    this.next = data.next;
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const number = new PixelText(this, 0, 92, data.number, { color: SHADES.dim });
    number.setX(Math.round((W - number.width) / 2));
    const title = new PixelText(this, 0, 108, data.title, { color: SHADES.light, scale: 3, shadow: SHADES.shadow, chisel: { light: SHADES.white, dark: SHADES.dim } });
    title.setX(Math.round((W - title.width) / 2));
    const bird = this.add.image(W / 2, title.y + title.height + 14, makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours)).setOrigin(0.5, 0);
    const parts = [number, title, bird];
    for (const p of parts) p.setAlpha(0);
    // The number first, then the name, then the bird.
    parts.forEach((p, i) => this.tweens.add({ targets: p, alpha: 1, duration: 1100, delay: 500 + i * 600, ease: 'Sine.easeOut' }));
    this.time.delayedCall(500 + 2 * 600 + 1100 + HOLD, () => this.leave());
    // Skippable after a moment (so a key still held from the prologue doesn't skip it).
    this.time.delayedCall(1000, () => {
      this.input.keyboard?.once('keydown', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    });
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.next));
  }
}
