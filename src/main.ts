import Phaser from 'phaser';
import { createGameConfig } from './config';
import { BootScene } from './scenes/BootScene';

new Phaser.Game(createGameConfig([BootScene]));
