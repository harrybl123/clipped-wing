import Phaser from 'phaser';
import { screenZoom } from './ui/displaySetting';

/** Internal resolution in game pixels. Pixel art, scaled up to the window (see screenZoom in src/ui/displaySetting.ts). */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export { PALETTE } from './palette';

export function createGameConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: screenZoom(),
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 450 }, debug: false },
    },
    scene: scenes,
  };
}
