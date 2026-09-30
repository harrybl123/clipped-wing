import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W, PALETTE } from '../config';

// Code-drawn placeholder art for the title screen: canvas gradients and curves in the
// palette. Replaced by painted art in the art pass.

/** A darker shade of carvedWood for shadow and silhouettes (shading, not a new colour). */
export const SHADOW_RGB = '14,11,8';

const rgba = (hex: number, alpha: number) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${alpha})`;

/** Seeded so the look is the same on every load. */
const random = () => new Phaser.Math.RandomDataGenerator(['clipped-wing']);

/**
 * The inside of the trunk, looking up: wood grain and carved grooves curving up towards
 * a vanishing point above the tube, lighter near the Canopy, dark at the edges.
 */
export function makeTrunkTexture(scene: Phaser.Scene, key: string, vanishX: number): void {
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return;
  const ctx = tex.getContext();
  const rnd = random();

  ctx.fillStyle = rgba(PALETTE.carvedWood, 1);
  ctx.fillRect(0, 0, W, H);

  const light = ctx.createLinearGradient(0, 0, 0, H);
  light.addColorStop(0, rgba(PALETTE.canopyWhite, 0.12));
  light.addColorStop(0.45, rgba(PALETTE.canopyWhite, 0.02));
  light.addColorStop(1, `rgba(${SHADOW_RGB},0.5)`);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  const vanishY = -300;
  const grain = (bx: number, width: number, style: string) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(bx, H + 20);
    // Bowing outwards, like the walls of a hollow cylinder seen from inside.
    ctx.quadraticCurveTo(vanishX + (bx - vanishX) * 0.8, H * 0.35, vanishX + (bx - vanishX) * 0.12, vanishY);
    ctx.stroke();
  };
  for (let i = 0; i < 26; i++) grain(rnd.realInRange(-900, W + 900), rnd.realInRange(8, 22), `rgba(${SHADOW_RGB},${rnd.realInRange(0.15, 0.35)})`);
  for (let i = 0; i < 140; i++) grain(rnd.realInRange(-900, W + 900), rnd.realInRange(1, 3), rgba(PALETTE.canopyWhite, rnd.realInRange(0.015, 0.06)));

  // A few knots in the wood.
  for (let i = 0; i < 5; i++) {
    const x = rnd.realInRange(100, W - 100);
    const y = rnd.realInRange(250, H - 250);
    for (let r = 1; r <= 4; r++) {
      ctx.strokeStyle = rgba(PALETTE.canopyWhite, 0.035);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 10 * r, 22 * r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const vignette = ctx.createRadialGradient(vanishX - 250, H * 0.35, 150, vanishX - 250, H * 0.45, 1350);
  vignette.addColorStop(0, `rgba(${SHADOW_RGB},0)`);
  vignette.addColorStop(0.55, `rgba(${SHADOW_RGB},0.35)`);
  vignette.addColorStop(1, `rgba(${SHADOW_RGB},0.92)`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  tex.refresh();
}

/** The tube: narrow at the top, wider below (perspective), with a white-hot core and soft edges. */
export function makeTubeTexture(scene: Phaser.Scene, key: string, topWidth: number, bottomWidth: number): void {
  const texWidth = bottomWidth * 2;
  const tex = scene.textures.createCanvas(key, texWidth, H);
  if (!tex) return;
  const ctx = tex.getContext();
  const mid = texWidth / 2;
  for (let y = 0; y < H; y += 2) {
    const w = topWidth + (bottomWidth - topWidth) * (y / H);
    const g = ctx.createLinearGradient(mid - w, 0, mid + w, 0);
    g.addColorStop(0, rgba(PALETTE.tubeCyan, 0));
    g.addColorStop(0.3, rgba(PALETTE.tubeCyan, 0.55));
    g.addColorStop(0.44, rgba(PALETTE.tubeCyan, 0.95));
    g.addColorStop(0.5, rgba(PALETTE.canopyWhite, 1));
    g.addColorStop(0.56, rgba(PALETTE.tubeCyan, 0.95));
    g.addColorStop(0.7, rgba(PALETTE.tubeCyan, 0.55));
    g.addColorStop(1, rgba(PALETTE.tubeCyan, 0));
    ctx.fillStyle = g;
    ctx.fillRect(mid - w, y, w * 2, 2);
  }
  tex.refresh();
}

/** A long soft wedge of light, for shafts falling from the Canopy. Origin at the top point. */
export function makeShaftTexture(scene: Phaser.Scene, key: string): void {
  const w = 400;
  const tex = scene.textures.createCanvas(key, w, H);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 10, 0);
  ctx.lineTo(w / 2 + 10, 0);
  ctx.lineTo(w, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // Fade out downwards.
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(0, 0, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, H);
  tex.refresh();
}

type Pt = { x: number; y: number };
/** Top edge of a root as a cubic Bézier. */
export type Root = [Pt, Pt, Pt, Pt];

export function pointOnRoot([p0, p1, p2, p3]: Root, t: number): Pt {
  const u = 1 - t;
  const b = (a: number, c: number, d: number, e: number) => u * u * u * a + 3 * u * u * t * c + 3 * u * t * t * d + t * t * t * e;
  return { x: b(p0.x, p1.x, p2.x, p3.x), y: b(p0.y, p1.y, p2.y, p3.y) };
}

/** Dark foreground roots framing the bottom of the screen, rim-lit faintly green by the fungi. */
export function makeRootsTexture(scene: Phaser.Scene, key: string, roots: readonly Root[]): void {
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return;
  const ctx = tex.getContext();
  for (const [p0, p1, p2, p3] of roots) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.lineTo(p3.x, H + 10);
    ctx.lineTo(p0.x, H + 10);
    ctx.closePath();
    ctx.fillStyle = `rgba(${SHADOW_RGB},1)`;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.strokeStyle = rgba(PALETTE.rootGreen, 0.22);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  tex.refresh();
}
