import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { AREAS, PLANNED_AREAS } from '../data/areas';
import { MAP_CANOPY_Y, MAP_LINKS, MAP_PLACES, MAP_TUBE_X, neighbourInDirection, treeHalfWidth, type MapPlace } from '../data/map';
import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { BIRD } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';

export interface MapSceneData {
  /** The area the map was opened from (where "you are"). */
  current: string;
}

const CANOPY_Y = MAP_CANOPY_Y;
/** Where one band of the tree gives way to the next (carved floors on the map). */
const LEVELS: readonly { name: string; top: number }[] = [
  { name: 'Upper branches', top: CANOPY_Y },
  { name: 'Trunk', top: 90 },
  { name: 'Roots', top: 152 },
  { name: 'Beneath', top: 216 },
];
/** Window colours for each kind of light. */
const WINDOW_LIGHT: Record<MapPlace['light'], number> = { amber: SHADES.amber, cyan: SHADES.cyan, green: SHADES.green, white: SHADES.white };

const OFFERING_Y = MAP_PLACES.find((p) => p.id === 'offering-floor')!.y;

/**
 * The map: the whole tree as a cutaway, opened over the paused area. Arrow keys/WASD move between
 * places, Enter travels, Esc (or M) goes back. Unbuilt places are dim and can't be travelled to.
 */
export class MapScene extends Phaser.Scene {
  private current!: string;
  private selected!: MapPlace;
  /** Each place's window frame, which lights up when selected. */
  private frames = new Map<string, Phaser.GameObjects.Rectangle>();
  private cursor!: Phaser.GameObjects.Image;
  private label!: PixelText;
  private labelPlate!: Phaser.GameObjects.Rectangle;
  private info!: PixelText;
  private leaving = false;

  constructor() {
    super('Map');
  }

  init(data: MapSceneData): void {
    this.current = data.current;
    this.leaving = false;
    this.frames.clear();
  }

  create(): void {
    this.cameras.main.fadeIn(250);
    makePaintedTexture(this, 'map-tree', W, H, paintTree());
    this.add.image(0, 0, 'map-tree').setOrigin(0);

    new PixelText(this, 6, 6, 'The Tree', { color: SHADES.light, shadow: SHADES.shadow });
    for (const level of LEVELS) new PixelText(this, 6, level.top + 3, level.name, { color: SHADES.dim });

    for (const place of MAP_PLACES) {
      const built = place.id in AREAS;
      // A small window: glowing in the place's own light if you can go there, dark if it isn't built yet.
      const frame = this.add.rectangle(place.x - 3, place.y - 3, 7, 7, SHADES.deep).setOrigin(0);
      this.add.rectangle(place.x - 2, place.y - 2, 5, 5, built ? WINDOW_LIGHT[place.light] : SHADES.shadow).setOrigin(0);
      if (built) this.add.rectangle(place.x - 1, place.y - 1, 2, 2, SHADES.white).setOrigin(0);
      else this.add.rectangle(place.x, place.y - 2, 1, 5, SHADES.deep).setOrigin(0); // window bars
      this.frames.set(place.id, frame);
      if (place.id === this.current) {
        // You are here: a red pip (red is reserved for birds and the protagonist).
        this.add.rectangle(place.x - 1, place.y - 7, 3, 3, SHADES.red).setOrigin(0);
      }
    }

    this.cursor = this.add.image(0, 0, makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours)).setOrigin(1, 0.5);
    this.tweens.add({ targets: this.cursor, alpha: 0.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.labelPlate = this.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.85).setOrigin(0);
    this.label = new PixelText(this, 0, 0, '', { color: SHADES.amber });

    const bar = this.add.rectangle(0, H - 14, W, 14, SHADES.shadow, 0.9).setOrigin(0);
    bar.setDepth(5);
    this.info = new PixelText(this, 8, H - 12, '', { color: SHADES.light }).setDepth(6);

    this.select(MAP_PLACES.find((p) => p.id === this.current) ?? MAP_PLACES.find((p) => p.id === 'offering-floor')!);

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const near = MAP_PLACES.find((place) => Math.hypot(place.x - p.x, place.y - p.y) < 9);
      if (near && near !== this.selected) this.select(near);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const near = MAP_PLACES.find((place) => Math.hypot(place.x - p.x, place.y - p.y) < 9);
      if (near) {
        this.select(near);
        this.confirm();
      }
    });
  }

  private select(place: MapPlace): void {
    const previous = this.selected;
    if (previous) this.frames.get(previous.id)?.setFillStyle(SHADES.deep);
    this.selected = place;
    const built = place.id in AREAS;
    this.frames.get(place.id)?.setFillStyle(built ? SHADES.light : SHADES.dim);
    this.cursor.setPosition(place.x - 5, place.y);

    const name = PLANNED_AREAS[place.id] ?? place.id;
    this.label.setText(capitalise(name)).setColor(built ? SHADES.amber : SHADES.dim);
    // Label to the right of the marker, or to the left of the cursor if it would run off-screen.
    const labelX = place.x + 7 + this.label.width > W - 4 ? place.x - 16 - this.label.width : place.x + 7;
    this.label.setPosition(labelX, place.y - 4);
    this.labelPlate.setPosition(labelX - 2, place.y - 6).setSize(this.label.width + 4, this.label.height + 3);

    const status =
      place.id === this.current ? 'You are here. Esc to go back.' : built ? `Enter: go to ${name} · Esc: back` : `${capitalise(name)} isn't built yet. · Esc: back`;
    this.info.setText(`${place.level}: ${status}`);
  }

  private confirm(): void {
    if (this.leaving) return;
    if (this.selected.id === this.current) return this.close();
    if (!(this.selected.id in AREAS)) return;
    this.leaving = true;
    const target: AreaSceneData = { areaId: this.selected.id, from: this.current };
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop('Area');
      this.scene.start('Area', target);
    });
  }

  private close(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.resume('Area');
    this.scene.stop();
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat || this.leaving) return;
    const key = event.key.toLowerCase();
    const directions: Record<string, [number, number]> = {
      arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1],
    };
    const dir = directions[key];
    if (dir) {
      const next = neighbourInDirection(this.selected, dir[0], dir[1]);
      if (next) this.select(next);
    } else if (key === 'enter' || key === ' ' || key === 'e') {
      this.confirm();
    } else if (key === 'escape' || key === 'm') {
      this.close();
    }
  }
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Faint paths between places: ladders (rails and rungs), walkways (planks), a sagging rope bridge. */
function pathPixels(): Map<number, number> {
  const out = new Map<number, number>();
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) out.set(Math.round(y) * W + Math.round(x), c);
  };
  const place = (id: string) => MAP_PLACES.find((p) => p.id === id)!;
  for (const link of MAP_LINKS) {
    const a = place(link.from);
    const b = place(link.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    // Stop short of each window.
    for (let t = 6; t <= len - 6; t++) {
      const x = a.x + ux * t;
      const y = a.y + uy * t;
      if (link.kind === 'ladder') {
        // Two rails either side of the line, with a rung every third pixel.
        put(x - uy * 1.5, y + ux * 1.5, SHADES.woodLight);
        put(x + uy * 1.5, y - ux * 1.5, SHADES.woodLight);
        if (Math.round(t) % 3 === 0) put(x, y, SHADES.woodLight);
      } else if (link.kind === 'walkway') {
        put(x, y, SHADES.woodLight);
        put(x, y + 1, SHADES.deep);
      } else if (Math.round(t) % 2 === 0) {
        const sag = Math.sin((t / len) * Math.PI) * 4;
        put(x, y + sag, SHADES.dim);
      }
    }
  }
  return out;
}

/**
 * The tree in cross-section: outside is dark; inside is carved wood, warmer and more amber towards
 * the top (wealth), greener towards the bottom-left (the rot), with the tube glowing up the middle
 * into the white glare of the Canopy. The back routes wind beneath the roots.
 */
function paintTree(): (x: number, y: number) => PixelColour {
  const wood = rgb(SHADES.wood);
  const [white, cyan, green, amber] = [SHADES.white, SHADES.cyan, SHADES.green, SHADES.amber].map(rgb) as [RGB, RGB, RGB, RGB];
  const backRoutesY = (x: number) => 226 + Math.round(Math.sin(x / 22) * 4);
  const windowGlows = MAP_PLACES.filter((p) => p.id in AREAS).map((p) => ({ x: p.x, y: p.y, rgb: rgb(WINDOW_LIGHT[p.light]) }));
  const paths = pathPixels();

  return (x, y) => {
    const path = paths.get(y * W + x);
    if (path !== undefined) return path;
    const hw = treeHalfWidth(y);
    const d = Math.abs(x - MAP_TUBE_X) - hw; // < 0 inside the tree
    // The Canopy: blinding white glare across the top.
    const glare = falloff(x, y, MAP_TUBE_X, -40, 230, 52);
    if (y < CANOPY_Y && glare > 0.3) return [...white.map((v) => v * Math.min(1, glare * 1.5))] as RGB;

    if (d > 0) {
      // Outside the tree: darkness, with the Canopy's glow bleeding down a little.
      let c: RGB = [8, 6, 5];
      c = addLight(c, white, 0.25 * glare);
      return c;
    }
    if (d > -1.5) return SHADES.woodPale; // the cut edge
    if (d > -3) return SHADES.woodLight;

    // Faint carved floors between the levels.
    if (LEVELS.slice(1).some((l) => y === l.top) && (x + y) % 4 !== 0) return SHADES.woodLight;

    // The tube, from the Canopy down to the offering floor.
    const dx = x - MAP_TUBE_X;
    if (y < OFFERING_Y && Math.abs(dx) <= 2) return Math.abs(dx) === 0 ? SHADES.white : SHADES.cyan;
    // The back routes: a hidden crawlway winding beneath the roots.
    if (Math.abs(y - backRoutesY(x)) <= 1 && d < -12) return y === backRoutesY(x) ? SHADES.shadow : SHADES.deep;

    const grain = noise(x / 4 + noise(y / 30) * 2) * 0.5 + noise(y / 3 + x / 40) * 0.2;
    const depth = smoothstep(CANOPY_Y, H, y);
    let c = wood.map((v) => v * (1 + 0.3 * grain) * (0.85 - 0.3 * depth)) as RGB;
    c = addLight(c, amber, 0.35 * (1 - smoothstep(40, 110, y))); // wealth and warmth up high
    c = addLight(c, green, 0.35 * falloff(x, y, 120, 262, 110, 45)); // the rot, bottom-left
    c = addLight(c, cyan, 0.3 * Math.exp(-((dx / 16) ** 2)) * (y < OFFERING_Y + 6 ? 1 : 0));
    c = addLight(c, white, 0.12 * glare);
    for (const w of windowGlows) c = addLight(c, w.rgb, 0.35 * falloff(x, y, w.x, w.y, 13, 10));
    return c;
  };
}
