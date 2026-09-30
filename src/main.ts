import Phaser from 'phaser';
import { createGameConfig, integerZoom } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TestAreaScene } from './scenes/TestAreaScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game(createGameConfig([BootScene, PreloadScene, TitleScene, TestAreaScene]));

// Keep pixels square and crisp: rescale by whole numbers when the window changes size.
window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));

// Dev builds only: expose the game for poking at from the browser console.
if (import.meta.env.DEV) Object.assign(window, { __game: game });
