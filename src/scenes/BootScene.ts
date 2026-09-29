import Phaser from 'phaser';
import { createSession } from '../session';

/** Creates the shared session (story, calendar, saves), then hands over to loading. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createSession(this.game);
    this.scene.start('Preload');
  }
}
