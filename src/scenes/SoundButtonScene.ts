import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { toggleFullscreen } from '../ui/displaySetting';
import { setMuted } from '../ui/soundSetting';

// A small speaker in the top-right corner, over every screen: click it to turn all sound off or on
// (designer); beside it, fullscreen (or F). It runs alongside the other scenes from the start and keeps
// itself on top.

const SPEAKER = ['....w....', '...ww....', 'wwwww.w..', 'wwwww..w.', 'wwwww..w.', 'wwwww.w..', '...ww....', '....w....'];
const SPEAKER_OFF = ['....w....', '...ww....', 'wwwww....', 'wwwww.w.w', 'wwwww..w.', 'wwwww.w.w', '...ww....', '....w....'];
/** Four corners pointing out (go fullscreen), or in (come back). */
const FULL = ['ww....ww', 'w......w', '........', '........', '........', '........', 'w......w', 'ww....ww'];
const UNFULL = ['.w....w.', 'ww....ww', '........', '........', '........', '........', 'ww....ww', '.w....w.'];

export class SoundButtonScene extends Phaser.Scene {
  private icon!: Phaser.GameObjects.Image;
  private full!: Phaser.GameObjects.Image;

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
    makeSpriteTexture(this, 'screen-full', FULL, { w: SHADES.light });
    makeSpriteTexture(this, 'screen-unfull', UNFULL, { w: SHADES.light });
    this.full = this.add.image(W - 20, 5, 'screen-full').setOrigin(1, 0).setAlpha(0.7);
    this.full.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-3, -3, 14, 14), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.full.on('pointerover', () => this.full.setAlpha(1));
    this.full.on('pointerout', () => this.full.setAlpha(0.7));
    this.full.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      toggleFullscreen(this.game);
    });
  }

  override update(): void {
    this.icon.setTexture(this.sound.mute ? 'sound-off' : 'sound-on');
    this.full.setTexture(this.scale.isFullscreen ? 'screen-unfull' : 'screen-full');
    // Stay above whatever scene was started or launched since.
    const scenes = this.scene.manager.getScenes(false);
    if (scenes[scenes.length - 1] !== this) this.scene.bringToTop();
  }
}
