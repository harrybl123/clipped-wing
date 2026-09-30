import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import titleMusicUrl from '../assets/audio/light-through-the-window.mp3';
import { AREAS } from '../data/areas';
import { SHADES } from '../ui/pixelArt';
import { PIXEL } from '../ui/pixelTextures';

/** Loads assets (the title music; everything else is generated) with a progress bar, then shows the title. */
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
    // Audio files live in src/assets/audio/ and are imported, so Vite bundles them with hashed names.
    this.load.audio('title-music', titleMusicUrl);
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture(PIXEL, 1, 1);
    g.destroy();
    // Dev builds only: ?area=<id> skips the title and opens that area directly; ?scene=prologue opens the prologue.
    const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    const areaId = params?.get('area');
    if (areaId && areaId in AREAS) this.scene.start('Area', { areaId });
    else if (params?.get('scene') === 'prologue') this.scene.start('Prologue');
    else this.scene.start('Title');
  }
}
