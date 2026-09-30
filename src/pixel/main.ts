import Phaser from 'phaser';
import { PixelTitleScene, PX_HEIGHT, PX_WIDTH } from './PixelTitleScene';

// PROTOTYPE entry point (pixel.html): 480×270 pixel art, scaled up by whole numbers only
// so every pixel stays square and crisp.

const integerZoom = () => Math.max(1, Math.floor(Math.min(window.innerWidth / PX_WIDTH, window.innerHeight / PX_HEIGHT)));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: PX_WIDTH,
  height: PX_HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: integerZoom() },
  scene: [PixelTitleScene],
});

window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));
if (import.meta.env.DEV) Object.assign(window, { __game: game });
