import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture, PIXEL, stampRows } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { BIRD, FUNGUS, LAMP } from '../ui/sprites';

// Title screen, visual only: looking up the inside of the trunk at the tube rising into the
// white Canopy, with the menu beside it. Only New Game does anything yet (parked menu ideas
// are in docs/ideas.md). The backdrop is painted per pixel and dithered; see src/ui/pixelArt.ts.

const TUBE_X = 345;
const MENU_X = 52;
const MENU_Y = 132;
const MENU_SPACING = 13;
const LAMPS: readonly [number, number][] = [[250, 44], [282, 60], [410, 50], [448, 72], [386, 30]];

type Pt = { x: number; y: number };
/** Top edges of the foreground roots, as cubic Béziers. */
type Root = [Pt, Pt, Pt, Pt];
const ROOTS: readonly Root[] = [
  [{ x: -10, y: 222 }, { x: 70, y: 206 }, { x: 150, y: 238 }, { x: 228, y: 275 }],
  [{ x: 490, y: 228 }, { x: 430, y: 214 }, { x: 380, y: 244 }, { x: 330, y: 275 }],
  [{ x: -10, y: 262 }, { x: 160, y: 256 }, { x: 320, y: 258 }, { x: 490, y: 260 }],
];
const FUNGUS_SPOTS: readonly [root: number, t: number][] = [[0, 0.18], [0, 0.42], [1, 0.25], [1, 0.5], [2, 0.55]];

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

  constructor() {
    super('Title');
  }

  create(): void {
    this.phase = 'gate';
    this.selected = 0;
    this.cameras.main.fadeIn(800);

    makePaintedTexture(this, 'title-backdrop', W, H, paintBackdrop());
    this.add.image(0, 0, 'title-backdrop').setOrigin(0);
    this.addMotes();

    // Shimmer on the tube's core.
    const core = this.add.rectangle(TUBE_X, 0, 1, 262, SHADES.white).setOrigin(0.5, 0);
    this.tweens.add({ targets: core, alpha: 0.4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    new PixelText(this, 32, 56, 'Clipped Wing', { color: SHADES.white, scale: 3, shadow: SHADES.shadow });

    this.pressAnyKey = new PixelText(this, MENU_X, MENU_Y, 'press any key', { color: SHADES.light });
    this.tweens.add({ targets: this.pressAnyKey, alpha: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });

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
        .on('pointerdown', () => this.phase === 'menu' && this.menu[i]!.action()),
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

  private openMenu(): void {
    this.phase = 'menu';
    this.pressAnyKey.destroy();
    for (const item of this.items) item.setVisible(true);
    this.bird.setVisible(true);
    this.select(0);
  }

  private select(index: number): void {
    this.selected = (index + this.items.length) % this.items.length;
    this.items.forEach((item, i) => item.setColor(i === this.selected ? SHADES.white : SHADES.dim).setX(MENU_X + (i === this.selected ? 2 : 0)));
    this.bird.setY(MENU_Y + 4 + this.selected * MENU_SPACING);
  }

  private showNotice(message: string): void {
    this.notice?.destroy();
    const notice = new PixelText(this, MENU_X + 2, MENU_Y + this.menu.length * MENU_SPACING + 6, message, { color: SHADES.light });
    this.notice = notice;
    this.time.delayedCall(1800, () => notice.destroy());
  }

  private startGame(): void {
    this.phase = 'leaving';
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('TestArea'));
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (this.phase === 'gate') return this.openMenu();
    if (this.phase !== 'menu') return;
    const key = event.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.select(this.selected - 1);
    else if (key === 'arrowdown' || key === 's') this.select(this.selected + 1);
    else if (key === 'enter' || key === ' ' || key === 'e') this.menu[this.selected]!.action();
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

/** For each screen column, the y of the root's top edge (undefined where it doesn't reach). */
function rootTops(root: Root): (number | undefined)[] {
  const tops: (number | undefined)[] = [];
  for (let s = 0; s <= 2000; s++) {
    const p = pointOn(root, s / 2000);
    const x = Math.round(p.x);
    if (x >= 0 && x < W) tops[x] = Math.min(tops[x] ?? Infinity, Math.round(p.y));
  }
  return tops;
}

/**
 * The backdrop painter: wood grain converging up towards the Canopy, vignette, light from
 * the Canopy, tube, lamps and fungi, crisp tube and sprites, and dark foreground roots.
 */
function paintBackdrop(): (x: number, y: number) => PixelColour {
  const fungi = FUNGUS_SPOTS.map(([r, t]) => pointOn(ROOTS[r]!, t));
  const tops = ROOTS.map(rootTops);
  const wood = rgb(SHADES.wood);
  const [white, cyan, green, amber] = [SHADES.white, SHADES.cyan, SHADES.green, SHADES.amber].map(rgb) as [RGB, RGB, RGB, RGB];

  const sprites = new Map<number, number>();
  const put = (x: number, y: number, c: number) => sprites.set(y * W + x, c);
  for (const [x, y] of LAMPS) stampRows(put, LAMP.rows, LAMP.colours, x - 1, y - 2);
  for (const f of fungi) stampRows(put, FUNGUS.rows, FUNGUS.colours, Math.round(f.x) - 2, Math.round(f.y) - FUNGUS.rows.length);

  return (x, y) => {
    const sprite = sprites.get(y * W + x);
    if (sprite !== undefined) return sprite;

    const rootTop = Math.min(...tops.map((t) => t[x] ?? Infinity));
    if (y >= rootTop) {
      if (y > rootTop) return SHADES.shadow;
      return fungi.some((f) => Math.hypot(f.x - x, f.y - y) < 22) ? SHADES.greenMid : SHADES.deep;
    }

    const dx = x - TUBE_X;
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
    for (const f of fungi) c = addLight(c, green, 0.55 * falloff(x, y, f.x, f.y - 3, 11, 9));
    for (const [lx, ly] of LAMPS) c = addLight(c, amber, 0.6 * falloff(x, y, lx, ly, 6));
    return c;
  };
}
