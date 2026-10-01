import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import titleMusicUrl from '../assets/audio/light-through-the-window.mp3';
import { AREAS } from '../data/areas';
import { getSession } from '../session';
import { SHADES } from '../ui/pixelArt';
import { PIXEL } from '../ui/pixelTextures';

/** Loads assets (the title music; everything else is generated) with a progress bar, then shows the title. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const barWidth = 120;
    const x = Math.round((GAME_WIDTH - barWidth) / 2);
    const y = Math.round(GAME_HEIGHT / 2);
    this.add.rectangle(x, y, barWidth, 2, SHADES.woodPale).setOrigin(0);
    const bar = this.add.rectangle(x, y, 0, 2, SHADES.white).setOrigin(0);
    this.load.on('progress', (p: number) => (bar.width = Math.round(barWidth * p)));
    // Audio files live in src/assets/audio/ and are imported, so Vite bundles them with hashed names.
    this.load.audio('title-music', titleMusicUrl);
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture(PIXEL, 1, 1);
    g.destroy();
    // Dev builds only: ?area=<id> skips the title and opens that area directly; ?scene=prologue opens the
    // prologue; ?scene=decode opens the first message's decoding; ?day=2 wakes at home on Day 2.
    const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    const areaId = params?.get('area');
    if (areaId && areaId in AREAS) this.scene.start('Area', { areaId });
    else if (params?.get('scene') === 'prologue') this.scene.start('Prologue');
    else if (params?.get('scene') === 'decode') this.scene.start('Decode', { message: 'message1' });
    else if (params?.get('day') === '2') {
      const { story, calendar } = getSession(this);
      calendar.jumpTo(2);
      for (const [name, value] of Object.entries({ dialogue_style: 'hide', day1: 'done', rite_done: true, watched_lights: true, day2: 'wake', objective: 'Talk to Mum', objective_target: 'home:mum' })) story.setVariable(name, value);
      this.scene.start('Area', { areaId: 'home', start: { x: 50, y: 150 }, card: 'Day 2' });
    } else this.scene.start('Title');
  }
}
