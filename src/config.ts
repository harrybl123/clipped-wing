import Phaser from 'phaser';

/** Fixed internal resolution. The canvas is scaled to fit the window and letterboxed. */
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

/** Art-direction palette. Must match the table in CLAUDE.md exactly. */
export const PALETTE = {
  /** The unknowable top of the tree */
  canopyWhite: 0xf4f1e8,
  /** The sacred tube */
  tubeCyan: 0xaef6f7,
  /** Warmth, wealth, the upper branches */
  lampAmber: 0xf2b45a,
  /** Fungi of the lower roots */
  rootGreen: 0x6fe0c0,
  /** Reserved: birds and the protagonist only */
  offeringRed: 0xd8323a,
  /** The tree itself */
  carvedWood: 0x2a221b,
} as const;

export type PaletteName = keyof typeof PALETTE;

/** CSS hex string for a palette colour, for Phaser text styles. */
export function css(name: PaletteName): string {
  return `#${PALETTE[name].toString(16).padStart(6, '0')}`;
}

export function createGameConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000',
    pixelArt: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1800 }, debug: false },
    },
    scene: scenes,
  };
}
