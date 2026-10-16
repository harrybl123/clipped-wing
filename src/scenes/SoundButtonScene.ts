import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { toggleFullscreen } from '../ui/displaySetting';
import { setMuted } from '../ui/soundSetting';

// A small speaker in the top-right corner, over every screen: click it to turn all sound off or on
// (designer); beside it, fullscreen (or F). It runs alongside the other scenes from the start and keeps
// itself on top. Each icon has a dark outline, so it shows on any background (designer: it vanished on pale
// ones).

const SPEAKER = ['....w....', '...ww....', 'wwwww.w..', 'wwwww..w.', 'wwwww..w.', 'wwwww.w..', '...ww....', '....w....'];
const SPEAKER_OFF = ['....w....', '...ww....', 'wwwww....', 'wwwww.w.w', 'wwwww..w.', 'wwwww.w.w', '...ww....', '....w....'];
/** Four corners pointing out (go fullscreen), or in (come back). */
const FULL = ['ww....ww', 'w......w', '........', '........', '........', '........', 'w......w', 'ww....ww'];
const UNFULL = ['.w....w.', 'ww....ww', '........', '........', '........', '........', 'ww....ww', '.w....w.'];

/** The icon with a dark outline round it, a pixel wider on every side. */
function outlined(rows: string[]): string[] {
  const h = rows.length + 2;
  const w = rows[0]!.length + 2;
  const at = (x: number, y: number) => rows[y - 1]?.[x - 1] === 'w';
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      if (at(x, y)) return 'w';
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy)) return 'o';
      return '.';
    }).join(''),
  );
}

export class SoundButtonScene extends Phaser.Scene {
  private icon!: Phaser.GameObjects.Image;
  private full!: Phaser.GameObjects.Image;

  constructor() {
    super('SoundButton');
  }

  create(): void {
    makeSpriteTexture(this, 'sound-on', outlined(SPEAKER), { w: SHADES.light, o: SHADES.shadow });
    makeSpriteTexture(this, 'sound-off', outlined(SPEAKER_OFF), { w: SHADES.dim, o: SHADES.shadow });
    this.icon = this.add.image(W - 5, 4, 'sound-on').setOrigin(1, 0).setAlpha(0.85);
    // A bigger target than the little icon.
    this.icon.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-3, -3, 15, 14), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.icon.on('pointerover', () => this.icon.setAlpha(1));
    this.icon.on('pointerout', () => this.icon.setAlpha(0.85));
    this.icon.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      setMuted(this.game, !this.sound.mute);
    });
    makeSpriteTexture(this, 'screen-full', outlined(FULL), { w: SHADES.light, o: SHADES.shadow });
    makeSpriteTexture(this, 'screen-unfull', outlined(UNFULL), { w: SHADES.light, o: SHADES.shadow });
    this.full = this.add.image(W - 19, 4, 'screen-full').setOrigin(1, 0).setAlpha(0.85);
    this.full.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-3, -3, 14, 14), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.full.on('pointerover', () => this.full.setAlpha(1));
    this.full.on('pointerout', () => this.full.setAlpha(0.85));
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
