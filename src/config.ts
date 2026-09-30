import Phaser from 'phaser';

/** Internal resolution in game pixels. Pixel art: scaled up by whole numbers only (see integerZoom). */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export { PALETTE } from './palette';

/** Largest whole-number scale at which the game fits the window (at least 1). */
export function integerZoom(): number {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)));
}

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
      zoom: integerZoom(),
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 450 }, debug: false },
    },
    scene: scenes,
  };
}
