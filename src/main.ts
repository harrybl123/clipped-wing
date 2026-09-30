import Phaser from 'phaser';
import { createGameConfig, integerZoom } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { AreaScene } from './scenes/AreaScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game(createGameConfig([BootScene, PreloadScene, TitleScene, AreaScene]));

// Keep pixels square and crisp: rescale by whole numbers when the window changes size.
window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));

// Dev builds only: expose the game for poking at from the browser console.
if (import.meta.env.DEV) Object.assign(window, { __game: game });
