import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { setMuted } from '../ui/soundSetting';

// A small speaker in the top-right corner, over every screen: click it to turn all sound off or on
// (designer). It runs alongside the other scenes from the start and keeps itself on top.

const SPEAKER = ['....w....', '...ww....', 'wwwww.w..', 'wwwww..w.', 'wwwww..w.', 'wwwww.w..', '...ww....', '....w....'];
const SPEAKER_OFF = ['....w....', '...ww....', 'wwwww....', 'wwwww.w.w', 'wwwww..w.', 'wwwww.w.w', '...ww....', '....w....'];

export class SoundButtonScene extends Phaser.Scene {
  private icon!: Phaser.GameObjects.Image;

  constructor() {
    super('SoundButton');
  }

  create(): void {
    makeSpriteTexture(this, 'sound-on', SPEAKER, { w: SHADES.light });
    makeSpriteTexture(this, 'sound-off', SPEAKER_OFF, { w: SHADES.dim });
    this.icon = this.add.image(W - 6, 5, 'sound-on').setOrigin(1, 0).setAlpha(0.7);
    // A bigger target than the little icon.
    this.icon.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-3, -3, 15, 14), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.icon.on('pointerover', () => this.icon.setAlpha(1));
    this.icon.on('pointerout', () => this.icon.setAlpha(0.7));
    this.icon.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      setMuted(this.game, !this.sound.mute);
    });
  }

  override update(): void {
    this.icon.setTexture(this.sound.mute ? 'sound-off' : 'sound-on');
    // Stay above whatever scene was started or launched since.
    const scenes = this.scene.manager.getScenes(false);
    if (scenes[scenes.length - 1] !== this) this.scene.bringToTop();
  }
}
