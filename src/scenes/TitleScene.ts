import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL, stampRows } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { BIRD, FUNGI, LAMP } from '../ui/sprites';

// Title screen, visual only: looking up the inside of the trunk at the tube rising into the
// white Canopy, with the menu beside it. Only New Game does anything yet (parked menu ideas
// are in docs/ideas.md). The backdrop is painted per pixel and dithered; see src/ui/pixelArt.ts.

const TUBE_X = 345;
const MENU_X = 52;
const MENU_Y = 132;
const MENU_SPACING = 13;
/** How loud the title music gets once it has faded in (0–1). */
const MUSIC_VOLUME = 0.6;
/** Lamps: some sit in carved alcoves in the trunk wall, some hang on cords. */
const ALCOVE_LAMPS: readonly [number, number][] = [[250, 44], [410, 50], [448, 72]];
const HANGING_LAMPS: readonly [number, number][] = [[282, 60], [386, 30]];

type Pt = { x: number; y: number };
/** Top edges of the low root hills along the bottom, as cubic Béziers. */
type Root = [Pt, Pt, Pt, Pt];
const ROOTS: readonly Root[] = [
  [{ x: -10, y: 222 }, { x: 70, y: 206 }, { x: 150, y: 238 }, { x: 228, y: 275 }],
  [{ x: 490, y: 228 }, { x: 430, y: 214 }, { x: 380, y: 244 }, { x: 330, y: 275 }],
  [{ x: -10, y: 262 }, { x: 160, y: 256 }, { x: 320, y: 258 }, { x: 490, y: 260 }],
];

/** Fungi by x position; they grow on whatever surface is there. */
const FUNGUS_SPOTS: readonly [x: number, variant: keyof typeof FUNGI][] = [
  [36, 'cluster'], [84, 'tall'], [172, 'droop'], [300, 'bent'], [410, 'droop'], [455, 'cluster'],
];

interface MenuItem {
  label: string;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private phase: 'gate' | 'menu' | 'leaving' = 'gate';
  private items: PixelText[] = [];
  private selected = 0;
  private bird!: Phaser.GameObjects.Container;
  private pressAnyKey!: PixelText;
  private notice: PixelText | null = null;
  private menu: MenuItem[] = [];
  private music: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    this.phase = 'gate';
    this.selected = 0;
    this.cameras.main.fadeIn(800);
    this.startMusic();

    makePaintedTexture(this, 'title-backdrop', W, H, paintBackdrop());
    this.add.image(0, 0, 'title-backdrop').setOrigin(0);
    this.addMotes();

    // Shimmer on the tube's core.
    const core = this.add.rectangle(TUBE_X, 0, 1, HILL_TOP[TUBE_X]!, SHADES.white).setOrigin(0.5, 0);
    this.tweens.add({ targets: core, alpha: 0.4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    new PixelText(this, 32, 56, 'Clipped Wing', { color: SHADES.light, scale: 3, shadow: SHADES.shadow, chisel: { light: SHADES.white, dark: SHADES.dim } });

    this.pressAnyKey = new PixelText(this, MENU_X, MENU_Y, 'press any key', { color: SHADES.white, shadow: SHADES.shadow });
    // A slow, gentle breath rather than a blink.
    this.pressAnyKey.setAlpha(0);
    this.tweens.add({ targets: this.pressAnyKey, alpha: 1, duration: 1200, delay: 900, ease: 'Sine.easeOut', onComplete: () => this.tweens.add({ targets: this.pressAnyKey, alpha: 0.5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) });

    this.menu = [
      { label: 'New Game', action: () => this.startGame() },
      { label: 'Continue', action: () => this.showNotice('Not built yet.') },
      { label: 'Settings', action: () => this.showNotice('Not built yet.') },
      { label: 'Credits', action: () => this.showNotice('Not built yet.') },
    ];
    this.items = this.menu.map((item, i) =>
      new PixelText(this, MENU_X, MENU_Y + i * MENU_SPACING, item.label, { color: SHADES.dim })
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.phase === 'menu' && this.select(i))
        .on('pointerdown', () => this.phase === 'menu' && this.choose()),
    );
    const birdSprite = this.add.image(0, 0, makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours));
    this.bird = this.add.container(MENU_X - 14, MENU_Y + 4, [birdSprite]).setVisible(false);
    this.tweens.add({ targets: birdSprite, y: -1, duration: 450, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [1] });

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.input.on('pointerdown', () => this.phase === 'gate' && this.openMenu());
  }

  private addMotes(): void {
    // Motes rising up the tube, and dust hanging in the air.
    this.add.particles(0, 0, PIXEL, {
      emitZone: {
        type: 'random',
        source: {
          getRandomPoint: (p) => {
            p.y = Phaser.Math.Between(60, H);
            p.x = TUBE_X + Phaser.Math.Between(-tubeHalfWidth(p.y) + 1, tubeHalfWidth(p.y) - 1);
          },
        },
      },
      speedY: { min: -14, max: -5 },
      lifespan: 7000,
      frequency: 220,
      tint: SHADES.white,
      alpha: { start: 1, end: 0 },
    });
    this.add.particles(0, 0, PIXEL, {
      emitZone: { type: 'random', source: { getRandomPoint: (p) => { p.x = Phaser.Math.Between(0, W); p.y = Phaser.Math.Between(0, H - 40); } } },
      speedX: { min: -2, max: 2 },
      speedY: { min: -3, max: 1 },
      lifespan: 9000,
      frequency: 350,
      tint: SHADES.light,
      alpha: { start: 0.7, end: 0 },
    });
  }

  /**
   * Starts the title music as soon as the title appears, fading in. Browsers block sound until the
   * player first clicks or presses a key, so if audio is still locked it starts the moment it unlocks.
   * Only one copy ever plays: any earlier one is removed first.
   */
  private startMusic(): void {
    this.sound.removeByKey('title-music');
    const music = this.sound.add('title-music', { loop: true, volume: 0 });
    this.music = music;
    const play = () => {
      if (this.music !== music || music.isPlaying) return;
      music.play();
      this.tweens.add({ targets: music, volume: MUSIC_VOLUME, duration: 2500, ease: 'Sine.easeInOut' });
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, play);
    else play();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.off(Phaser.Sound.Events.UNLOCKED, play);
      music.destroy();
      if (this.music === music) this.music = null;
    });
  }

  private openMenu(): void {
    this.phase = 'menu';
    playConfirm(this);
    this.tweens.killTweensOf(this.pressAnyKey);
    this.pressAnyKey.destroy();
    // Fade the menu in, one item after another.
    for (const [i, item] of [this.bird, ...this.items].entries()) {
      item.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: item, alpha: 1, duration: 450, delay: i * 70, ease: 'Sine.easeOut' });
    }
    this.select(0, false);
  }

  /** Highlights menu item `index` (wrapping), with a soft click if the selection moved and `sound` is on. */
  private select(index: number, sound = true): void {
    const next = (index + this.items.length) % this.items.length;
    if (sound && next !== this.selected) playMove(this);
    this.selected = next;
    this.items.forEach((item, i) => item.setColor(i === this.selected ? SHADES.white : SHADES.dim).setX(MENU_X + (i === this.selected ? 2 : 0)));
    this.bird.setY(MENU_Y + 4 + this.selected * MENU_SPACING);
  }

  private choose(): void {
    playConfirm(this);
    this.menu[this.selected]!.action();
  }

  private showNotice(message: string): void {
    this.notice?.destroy();
    const notice = new PixelText(this, MENU_X + 2, MENU_Y + this.menu.length * MENU_SPACING + 6, message, { color: SHADES.light });
    this.notice = notice;
    this.time.delayedCall(1800, () => notice.destroy());
  }

  private startGame(): void {
    this.phase = 'leaving';
    if (this.music) this.tweens.add({ targets: this.music, volume: 0, duration: 600 });
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Prologue'));
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (this.phase === 'gate') return this.openMenu();
    if (this.phase !== 'menu') return;
    const key = event.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.select(this.selected - 1);
    else if (key === 'arrowdown' || key === 's') this.select(this.selected + 1);
    else if (key === 'enter' || key === ' ' || key === 'e') this.choose();
  }
}

/** Half-width of the tube at row y: narrow at the top, wider below (perspective). */
function tubeHalfWidth(y: number): number {
  return Math.round(3 + 8 * (y / H));
}

function pointOn([p0, p1, p2, p3]: Root, t: number): Pt {
  const u = 1 - t;
  const b = (a: number, c: number, d: number, e: number) => u * u * u * a + 3 * u * u * t * c + 3 * u * t * t * d + t * t * t * e;
  return { x: b(p0.x, p1.x, p2.x, p3.x), y: b(p0.y, p1.y, p2.y, p3.y) };
}

/** For each column, the top of the root hills (the highest of the three curves). */
const HILL_TOP: number[] = (() => {
  const tops = Array.from({ length: W }, () => H);
  for (const root of ROOTS) {
    for (let s = 0; s <= 2000; s++) {
      const p = pointOn(root, s / 2000);
      const x = Math.round(p.x);
      if (x >= 0 && x < W) tops[x] = Math.min(tops[x]!, Math.round(p.y));
    }
  }
  return tops;
})();

/** The low root hills along the bottom, as a silhouette. */
function isSilhouette(x: number, y: number): boolean {
  return x >= 0 && x < W && y >= HILL_TOP[x]!;
}

/** Topmost silhouette row in a column. */
function surfaceAt(x: number): number {
  for (let y = 0; y < H; y++) if (isSilhouette(x, y)) return y;
  return H;
}

/**
 * The backdrop painter: wood grain converging up towards the Canopy, vignette, light from
 * the Canopy, tube, lamps and fungi, lamp alcoves and cords, and the low root hills in front.
 */
function paintBackdrop(): (x: number, y: number) => PixelColour {
  const wood = rgb(SHADES.wood);
  const [white, cyan, green, amber] = [SHADES.white, SHADES.cyan, SHADES.green, SHADES.amber].map(rgb) as [RGB, RGB, RGB, RGB];
  const fungi = FUNGUS_SPOTS.map(([x, variant]) => ({ x, y: surfaceAt(x), sprite: FUNGI[variant] }));

  const overlay = new Map<number, number>();
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) overlay.set(y * W + x, c);
  };
  // Carved alcoves in the trunk wall, each holding a lamp.
  for (const [lx, ly] of ALCOVE_LAMPS) {
    for (let dy = -8; dy <= 5; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dy < -6 && Math.abs(dx) > 2) continue;
        const rim = Math.abs(dx) === 4 || dy === -8 || (dy <= -6 && Math.abs(dx) === 2 && dy === -7);
        put(lx + dx, ly + dy, dy === 5 ? SHADES.woodPale : rim ? SHADES.woodLight : SHADES.deep);
      }
    }
  }
  for (const [lx, ly] of HANGING_LAMPS) for (let y = 0; y < ly - 2; y++) put(lx, y, SHADES.deep);
  for (const [lx, ly] of [...ALCOVE_LAMPS, ...HANGING_LAMPS]) stampRows(put, LAMP.rows, LAMP.colours, lx - 1, ly - 2);
  for (const f of fungi) stampRows(put, f.sprite.rows, f.sprite.colours, f.x - Math.floor(f.sprite.rows[0]!.length / 2), f.y - f.sprite.rows.length);

  return (x, y) => {
    const exact = overlay.get(y * W + x);
    if (exact !== undefined) return exact;

    const dx = x - TUBE_X;
    if (isSilhouette(x, y)) {
      // A faint rim on the top edge, green near the fungi.
      if (isSilhouette(x, y - 1)) return SHADES.shadow;
      return fungi.some((f) => Math.hypot(f.x - x, f.y - y) < 22) ? SHADES.greenMid : SHADES.deep;
    }

    const hw = tubeHalfWidth(y);
    if (Math.abs(dx) <= hw) {
      const edge = Math.abs(dx) / hw;
      return edge < 0.25 ? SHADES.white : edge < 0.75 ? SHADES.cyan : SHADES.cyanMid;
    }

    const t = y / H;
    const s = 0.08 + 0.92 * Math.pow(t, 0.75);
    const u = TUBE_X + dx / s;
    const grain = noise(u / 7) * 0.6 + noise(u / 2.3 + 40) * 0.4;
    const vignette = smoothstep(0.3, 1.05, Math.hypot((x - 290) / 300, (y - 100) / 190));
    let c = wood.map((v) => v * (1 + 0.28 * grain) * (1 - 0.8 * vignette)) as RGB;
    c = addLight(c, white, 1.25 * falloff(x, y, TUBE_X, -12, 95, 48));
    c = addLight(c, cyan, (0.18 + 0.2 * (1 - t)) * Math.exp(-((dx / (9 + 14 * t)) ** 2)));
    for (const f of fungi) c = addLight(c, green, 0.45 * falloff(x, y, f.x, f.y - 4, 12, 10));
    for (const [lx, ly] of [...ALCOVE_LAMPS, ...HANGING_LAMPS]) c = addLight(c, amber, 0.6 * falloff(x, y, lx, ly, 6));
    return c;
  };
}
