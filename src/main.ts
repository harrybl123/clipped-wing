import Phaser from 'phaser';
import { createGameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TestAreaScene } from './scenes/TestAreaScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game(createGameConfig([BootScene, PreloadScene, TitleScene, TestAreaScene]));

// Dev builds only: expose the game for poking at from the browser console.
if (import.meta.env.DEV) Object.assign(window, { __game: game });
