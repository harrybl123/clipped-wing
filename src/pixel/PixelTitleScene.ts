import Phaser from 'phaser';
import { PALETTE } from '../config';
import { pixelText } from './pixelFont';

// PROTOTYPE: the title screen as 480×270 pixel art, for comparing against the painterly
// direction. The whole backdrop is computed per pixel (light sources, wood grain, vignette)
// and ordered-dithered to a fixed 16-colour palette built from the six palette colours and
// their shades. Red is kept out of the backdrop: it's only on the bird.

export const PX_WIDTH = 480;
export const PX_HEIGHT = 270;

const TUBE_X = 345;
const VANISH_X = TUBE_X;

/** Backdrop palette: shades of the CLAUDE.md colours. No red. */
const SHADES = [
  0x0e0b08, 0x1c1611, PALETTE.carvedWood, 0x3b3027, 0x54463a, 0x7a6a58, 0xb3a898, PALETTE.canopyWhite,
  0x1f3a3a, 0x3d7d7e, PALETTE.tubeCyan,
  0x1e3b33, 0x3c8a74, PALETTE.rootGreen,
  0x5a3f22, PALETTE.lampAmber,
] as const;
const SHADOW = 0x0e0b08;
const DIM = 0x7a6a58;
const LIGHT = 0xb3a898;
const RED_DARK = 0x8f1f25; // shade of offeringRed

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const LAMPS: readonly [number, number][] = [[250, 44], [282, 60], [410, 50], [448, 72], [386, 30]];

type Pt = { x: number; y: number };
type Root = [Pt, Pt, Pt, Pt];
const ROOTS: Root[] = [
  [{ x: -10, y: 222 }, { x: 70, y: 206 }, { x: 150, y: 238 }, { x: 228, y: 275 }],
  [{ x: -10, y: 246 }, { x: 50, y: 238 }, { x: 90, y: 250 }, { x: 132, y: 275 }],
  [{ x: 490, y: 228 }, { x: 430, y: 214 }, { x: 380, y: 244 }, { x: 330, y: 275 }],
  [{ x: -10, y: 262 }, { x: 160, y: 256 }, { x: 320, y: 258 }, { x: 490, y: 260 }],
];
const FUNGUS_SPOTS: readonly [root: number, t: number][] = [[0, 0.18], [0, 0.42], [2, 0.25], [2, 0.5], [3, 0.55]];

interface MenuItem {
  label: string;
  action: () => void;
}

export class PixelTitleScene extends Phaser.Scene {
  private phase: 'gate' | 'menu' = 'gate';
  private items: Phaser.GameObjects.Image[] = [];
  private selected = 0;
  private bird!: Phaser.GameObjects.Container;
  private pressAnyKey!: Phaser.GameObjects.Image;
  private notice: Phaser.GameObjects.Image | null = null;
  private menu: MenuItem[] = [];

  constructor() {
    super('PixelTitle');
  }

  create(): void {
    const fungi = FUNGUS_SPOTS.map(([r, t]) => pointOn(ROOTS[r]!, t));
    this.makeBackdrop(fungi);
    this.add.image(0, 0, 'px-backdrop').setOrigin(0);
    this.makePixelTexture();
    this.addParticles();

    // Tube core shimmer.
    const core = this.add.rectangle(TUBE_X, 0, 1, 262, PALETTE.canopyWhite).setOrigin(0.5, 0);
    this.tweens.add({ targets: core, alpha: 0.4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title with a hard 1px drop shadow.
    pixelText(this, 33, 57, 'Clipped Wing', SHADOW, 3);
    pixelText(this, 32, 56, 'Clipped Wing', PALETTE.canopyWhite, 3);

    this.pressAnyKey = pixelText(this, 52, 132, 'press any key', LIGHT);
    this.tweens.add({ targets: this.pressAnyKey, alpha: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });

    this.menu = [
      { label: 'New Game', action: () => this.showNotice('Not built yet.') },
      { label: 'Continue', action: () => this.showNotice('Not built yet.') },
      { label: 'Settings', action: () => this.showNotice('Not built yet.') },
      { label: 'Credits', action: () => this.showNotice('Not built yet.') },
    ];
    this.items = this.menu.map((item, i) =>
      pixelText(this, 52, 132 + i * 13, item.label, DIM)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.phase === 'menu' && this.select(i))
        .on('pointerdown', () => this.phase === 'menu' && this.menu[i]!.action()),
    );
    const birdSprite = this.add.image(0, 0, this.makeBirdTexture());
    this.bird = this.add.container(38, 136, [birdSprite]).setVisible(false);
    this.tweens.add({ targets: birdSprite, y: '-=1', duration: 450, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [1] });

    pixelText(this, PX_WIDTH - 60, PX_HEIGHT - 12, '[pixel test]', DIM).setAlpha(0.6);

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.input.on('pointerdown', () => this.phase === 'gate' && this.openMenu());
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
    this.items.forEach((item, i) => {
      item.setTint(i === this.selected ? PALETTE.canopyWhite : DIM).setX(i === this.selected ? 54 : 52);
    });
    this.bird.setY(136 + this.selected * 13);
  }

  private showNotice(message: string): void {
    this.notice?.destroy();
    const notice = pixelText(this, 54, 132 + this.menu.length * 13 + 6, message, LIGHT);
    this.notice = notice;
    this.time.delayedCall(1800, () => notice.destroy());
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (this.phase === 'gate') return this.openMenu();
    const key = event.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.select(this.selected - 1);
    else if (key === 'arrowdown' || key === 's') this.select(this.selected + 1);
    else if (key === 'enter' || key === ' ' || key === 'e') this.menu[this.selected]!.action();
  }

  private makePixelTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture('px', 1, 1);
    g.destroy();
  }

  private addParticles(): void {
    // Motes rising up the tube, and dust hanging in the air.
    this.add.particles(0, 0, 'px', {
      emitZone: { type: 'random', source: { getRandomPoint: (p) => { const y = Phaser.Math.Between(60, PX_HEIGHT); p.y = y; p.x = TUBE_X + Phaser.Math.Between(-tubeHalfWidth(y) + 1, tubeHalfWidth(y) - 1); } } },
      speedY: { min: -14, max: -5 },
      lifespan: 7000,
      frequency: 220,
      tint: PALETTE.canopyWhite,
      alpha: { start: 1, end: 0 },
    });
    this.add.particles(0, 0, 'px', {
      emitZone: { type: 'random', source: { getRandomPoint: (p) => { p.x = Phaser.Math.Between(0, PX_WIDTH); p.y = Phaser.Math.Between(0, PX_HEIGHT - 40); } } },
      speedX: { min: -2, max: 2 },
      speedY: { min: -3, max: 1 },
      lifespan: 9000,
      frequency: 350,
      tint: LIGHT,
      alpha: { start: 0.7, end: 0 },
    });
  }

  private makeBirdTexture(): string {
    // A small red carved bird with a heavy, clipped wing. o = eye, d = darker red wing.
    const rows = [
      '......##..',
      '.....#o##.',
      '#...######',
      '##.######.',
      '.#dd####..',
      '..dd......',
    ];
    const tex = this.textures.createCanvas('px-bird', rows[0]!.length, rows.length)!;
    const ctx = tex.getContext();
    rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        const color = c === '#' ? PALETTE.offeringRed : c === 'd' ? RED_DARK : c === 'o' ? SHADOW : null;
        if (color === null) return;
        ctx.fillStyle = hex(color);
        ctx.fillRect(x, y, 1, 1);
      }),
    );
    tex.refresh();
    return 'px-bird';
  }

  /** Computes the static backdrop pixel by pixel and dithers it to SHADES. */
  private makeBackdrop(fungi: Pt[]): void {
    const tex = this.textures.createCanvas('px-backdrop', PX_WIDTH, PX_HEIGHT)!;
    const ctx = tex.getContext();
    const image = ctx.createImageData(PX_WIDTH, PX_HEIGHT);
    const shades = SHADES.map(rgb);
    const wood = rgb(PALETTE.carvedWood);
    const white = rgb(PALETTE.canopyWhite);
    const cyan = rgb(PALETTE.tubeCyan);
    const green = rgb(PALETTE.rootGreen);
    const amber = rgb(PALETTE.lampAmber);
    const rootTops = ROOTS.map(rootTopLookup);

    for (let y = 0; y < PX_HEIGHT; y++) {
      const t = y / PX_HEIGHT;
      for (let x = 0; x < PX_WIDTH; x++) {
        const i = (y * PX_WIDTH + x) * 4;

        // Foreground roots: flat silhouette with a faint rim of green near fungi.
        const rootTop = Math.min(...rootTops.map((top) => top[x] ?? Infinity));
        if (y >= rootTop) {
          const nearFungus = fungi.some((f) => Math.hypot(f.x - x, f.y - y) < 22);
          put(image, i, y === rootTop ? (nearFungus ? 0x3c8a74 : 0x1c1611) : SHADOW);
          continue;
        }

        // The tube itself: white core, cyan body, darker cyan edges.
        const dx = x - TUBE_X;
        const hw = tubeHalfWidth(y);
        if (Math.abs(dx) <= hw) {
          const edge = Math.abs(dx) / hw;
          put(image, i, edge < 0.25 ? PALETTE.canopyWhite : edge < 0.75 ? PALETTE.tubeCyan : 0x3d7d7e);
          continue;
        }

        // Wood: grain lines converging up towards the Canopy, darker at the edges.
        const s = 0.08 + 0.92 * Math.pow(t, 0.75);
        const u = VANISH_X + (x - VANISH_X) / s;
        const grain = noise(u / 7) * 0.6 + noise(u / 2.3 + 40) * 0.4;
        const vignette = smoothstep(0.3, 1.05, Math.hypot((x - 290) / 300, (y - 100) / 190));
        let c = wood.map((v) => v * (1 + 0.28 * grain) * (1 - 0.8 * vignette)) as [number, number, number];

        // Light sources.
        c = add(c, white, 1.25 * Math.exp(-((dx / 95) ** 2 + ((y + 12) / 48) ** 2)));
        c = add(c, cyan, (0.18 + 0.2 * (1 - t)) * Math.exp(-((dx / (9 + 14 * t)) ** 2)));
        for (const f of fungi) c = add(c, green, 0.55 * Math.exp(-(((x - f.x) / 11) ** 2 + ((y - f.y + 3) / 9) ** 2)));
        for (const [lx, ly] of LAMPS) c = add(c, amber, 0.6 * Math.exp(-(((x - lx) / 6) ** 2 + ((y - ly) / 6) ** 2)));

        const d = (BAYER[y % 4]![x % 4]! / 16 - 0.5) * 20;
        put(image, i, SHADES[nearest(shades, [c[0] + d, c[1] + d, c[2] + d])]!);
      }
    }

    // Lamps and fungi as small crisp sprites on top.
    for (const [lx, ly] of LAMPS) setPx(image, lx, ly, PALETTE.lampAmber);
    for (const f of fungi) {
      const fx = Math.round(f.x);
      const fy = Math.round(f.y);
      for (const [ox, oy, col] of [
        [0, -1, 0x3c8a74], [0, -2, 0x3c8a74],
        [-2, -3, PALETTE.rootGreen], [-1, -3, PALETTE.rootGreen], [0, -3, PALETTE.rootGreen], [1, -3, PALETTE.rootGreen], [2, -3, PALETTE.rootGreen],
        [-1, -4, PALETTE.rootGreen], [0, -4, PALETTE.canopyWhite], [1, -4, PALETTE.rootGreen],
      ] as const) setPx(image, fx + ox, fy + oy, col);
    }

    ctx.putImageData(image, 0, 0);
    tex.refresh();
  }
}

/** Half-width of the tube at row y: narrow at the top, wider below (perspective). */
function tubeHalfWidth(y: number): number {
  return Math.round(3 + 8 * (y / PX_HEIGHT));
}

function pointOn([p0, p1, p2, p3]: Root, t: number): Pt {
  const u = 1 - t;
  const b = (a: number, c: number, d: number, e: number) => u * u * u * a + 3 * u * u * t * c + 3 * u * t * t * d + t * t * t * e;
  return { x: b(p0.x, p1.x, p2.x, p3.x), y: b(p0.y, p1.y, p2.y, p3.y) };
}

/** For each screen column, the y of the root's top edge (or undefined where it doesn't reach). */
function rootTopLookup(root: Root): (number | undefined)[] {
  const tops: (number | undefined)[] = [];
  for (let s = 0; s <= 2000; s++) {
    const p = pointOn(root, s / 2000);
    const x = Math.round(p.x);
    if (x < 0 || x >= PX_WIDTH) continue;
    const y = Math.round(p.y);
    tops[x] = Math.min(tops[x] ?? Infinity, y);
  }
  return tops;
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

/** Smooth 1D value noise in [-1, 1]. */
function noise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const k = f * f * (3 - 2 * f);
  return hash(i) * (1 - k) + hash(i + 1) * k;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type RGB = [number, number, number];
const rgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
const add = (c: RGB, light: RGB, k: number): RGB => [c[0] + light[0] * k, c[1] + light[1] * k, c[2] + light[2] * k];

function nearest(palette: RGB[], c: RGB): number {
  let best = 0;
  let bestD = Infinity;
  palette.forEach((p, i) => {
    const d = (p[0] - c[0]) ** 2 * 0.3 + (p[1] - c[1]) ** 2 * 0.59 + (p[2] - c[2]) ** 2 * 0.11;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

function put(image: ImageData, i: number, color: number): void {
  const [r, g, b] = rgb(color);
  image.data[i] = r;
  image.data[i + 1] = g;
  image.data[i + 2] = b;
  image.data[i + 3] = 255;
}

function setPx(image: ImageData, x: number, y: number, color: number): void {
  if (x < 0 || y < 0 || x >= PX_WIDTH || y >= PX_HEIGHT) return;
  put(image, (y * PX_WIDTH + x) * 4, color);
}

