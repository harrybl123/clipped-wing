import type Phaser from 'phaser';
import type { Hired } from '../systems/Riot';
import { SHADES } from './pixelArt';

// The barracks' fighters on the war table (Jack): beige, hired, whoever they fight for (a thin ring in that side's
// colour says whose). Rogue mercenaries in a hooded cap with a feather and a knife at their side; archers with a
// bow and an arrow nocked; the assassin hooded, a dagger out. Draft looks.

const BEIGE = SHADES.skinFair;
const BEIGE_SHADE = SHADES.skinFairShade;

/** A hired fighter at (x, y), its body a beige circle (radius 7 at scale 1); `ring` the colour of its side. */
export function drawHired(g: Phaser.GameObjects.Graphics, x: number, y: number, kind: Hired, ring: number, k = 1, dark = false): void {
  const px = (dx: number) => x + dx * k;
  const py = (dy: number) => y + dy * k;
  // The bow and the knife sit outside the body, behind it.
  if (kind === 'archer') {
    // A bow, curved, to the right; its string; an arrow across.
    g.lineStyle(2 * k, SHADES.amberMid, 1);
    g.beginPath();
    g.arc(px(4), py(0), 9 * k, -1.1, 1.1, false);
    g.strokePath();
    g.lineStyle(1 * k, SHADES.light, 1).lineBetween(px(4 + 9 * Math.cos(-1.1)), py(9 * Math.sin(-1.1)), px(4 + 9 * Math.cos(1.1)), py(9 * Math.sin(1.1)));
    g.lineStyle(1 * k, SHADES.woodPale, 1).lineBetween(px(2), py(0), px(15), py(0));
    g.fillStyle(SHADES.light, 1).fillTriangle(px(15), py(-2), px(15), py(2), px(18), py(0));
    g.fillStyle(SHADES.white, 1).fillRect(px(1), py(-1), 2 * k, 2 * k);
  }
  if (kind === 'rogue') {
    // A knife at its side, point down.
    g.fillStyle(SHADES.woodLight, 1).fillRect(px(7), py(-1), 2 * k, 3 * k);
    g.fillStyle(SHADES.light, 1).fillTriangle(px(7), py(2), px(9), py(2), px(8), py(9));
  }
  if (kind === 'assassin') {
    // A dagger, out, blade up.
    g.fillStyle(SHADES.woodLight, 1).fillRect(px(8), py(2), 2 * k, 3 * k);
    g.fillStyle(SHADES.dim, 1).fillRect(px(6), py(1), 6 * k, 1 * k);
    g.fillStyle(SHADES.white, 1).fillTriangle(px(8), py(1), px(10), py(1), px(9), py(-8));
  }
  // The body: beige, ringed in its side's colour.
  g.fillStyle(SHADES.shadow, 1).fillCircle(x, y, 8 * k);
  g.fillStyle(ring, 1).fillCircle(x, y, 7.5 * k);
  g.fillStyle(dark ? BEIGE_SHADE : BEIGE, 1).fillCircle(x, y, 6.5 * k);
  g.fillStyle(BEIGE_SHADE, 1).fillRect(px(-5), py(3), 10 * k, 1 * k);
  if (kind === 'rogue') {
    // A Robin Hood cap: a peaked green cap tipped over to one side, a feather standing up out of it.
    g.fillStyle(SHADES.greenDeep, 1).fillTriangle(px(-8), py(-4), px(6), py(-4), px(-6), py(-12));
    g.fillStyle(SHADES.greenMid, 1).fillTriangle(px(-7), py(-5), px(4), py(-5), px(-5), py(-11));
    g.lineStyle(1 * k, SHADES.white, 1).lineBetween(px(1), py(-5), px(5), py(-14));
  }
  if (kind === 'archer') {
    // A plain cap.
    g.fillStyle(SHADES.woodPale, 1).fillRect(px(-5), py(-8), 10 * k, 3 * k);
  }
  if (kind === 'assassin') {
    // A dark hood drawn low, the eyes a slit.
    g.fillStyle(SHADES.deep, 1).fillTriangle(px(-8), py(0), px(8), py(0), px(0), py(-12));
    g.fillStyle(SHADES.deep, 1).fillRect(px(-7), py(-4), 14 * k, 4 * k);
    g.fillStyle(SHADES.white, 1).fillRect(px(-3), py(-3), 2 * k, 1 * k).fillRect(px(2), py(-3), 2 * k, 1 * k);
  }
}

/** The barracks (Jack): a long low hut with a peaked roof, a door, and a flag on a pole. */
export function drawBarracks(g: Phaser.GameObjects.Graphics, x: number, y: number, k = 1, flag: number = SHADES.white): void {
  const px = (dx: number) => x + dx * k;
  const py = (dy: number) => y + dy * k;
  g.fillStyle(SHADES.shadow, 1).fillRoundedRect(px(-9), py(-9), 19 * k, 19 * k, 3 * k);
  g.fillStyle(SHADES.woodPale, 1).fillRect(px(-7), py(-1), 15 * k, 8 * k);
  g.fillStyle(SHADES.amberDeep, 1).fillTriangle(px(-8), py(-1), px(9), py(-1), px(0.5), py(-6));
  g.fillStyle(SHADES.deep, 1).fillRect(px(-1), py(2), 3 * k, 5 * k);
  g.fillStyle(SHADES.shadow, 1).fillRect(px(-6), py(1), 2 * k, 2 * k).fillRect(px(5), py(1), 2 * k, 2 * k);
  g.fillStyle(SHADES.light, 1).fillRect(px(6), py(-9), 1 * k, 8 * k);
  g.fillStyle(flag, 1).fillTriangle(px(7), py(-9), px(7), py(-5), px(11), py(-7));
}

/** The architect on the map (Jack): a small scroll, half unrolled, and a pencil across it. */
export function drawArchitectToken(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SHADES.shadow, 1).fillRoundedRect(x - 9, y - 9, 19, 19, 3);
  g.fillStyle(0xe9dcc0, 1).fillRect(x - 6, y - 5, 12, 10);
  g.fillStyle(0xcdbb98, 1).fillRect(x - 7, y - 6, 3, 12).fillRect(x + 5, y - 6, 3, 12);
  g.fillStyle(SHADES.amberDeep, 1).fillRect(x - 3, y - 2, 6, 1).fillRect(x - 3, y + 1, 4, 1);
  // The pencil, corner to corner: yellow body, a dark point.
  g.lineStyle(2, SHADES.amber, 1).lineBetween(x - 6, y + 8, x + 5, y - 3);
  g.fillStyle(SHADES.deep, 1).fillRect(x + 5, y - 5, 2, 2);
}

/** A building of the architect's (Jack), in its side's colour, at (x, y). */
export function drawBuilding(g: Phaser.GameObjects.Graphics, x: number, y: number, kind: 'artillery' | 'storehouse' | 'fortress', colour: number, dark = false): void {
  const body = dark ? SHADES.woodPale : colour;
  if (kind === 'fortress') {
    // Stone walls with battlements, two squat towers, a gate; ringed in its colour.
    g.fillStyle(SHADES.shadow, 1).fillRect(x - 11, y - 8, 23, 17);
    g.fillStyle(SHADES.dim, 1).fillRect(x - 10, y - 4, 21, 12);
    g.fillStyle(SHADES.light, 1).fillRect(x - 11, y - 9, 6, 15).fillRect(x + 6, y - 9, 6, 15);
    for (let i = 0; i < 3; i++) g.fillStyle(SHADES.light, 1).fillRect(x - 4 + i * 3, y - 6, 2, 2);
    g.fillStyle(SHADES.deep, 1).fillRect(x - 2, y + 2, 5, 6);
    g.lineStyle(1, body, 1).strokeRect(x - 12, y - 10, 25, 20);
    return;
  }
  if (kind === 'artillery') {
    // A cannon on its wheel, pointing up and out, over a shield in its colour.
    g.fillStyle(SHADES.shadow, 1).fillRoundedRect(x - 8, y - 6, 17, 15, 3);
    g.fillStyle(body, 1).fillRoundedRect(x - 7, y - 5, 15, 13, 2);
    // (The barrel sticks out past its wall, up and to the right, so it reads even dug in.)
    g.lineStyle(4, SHADES.shadow, 1).lineBetween(x + 5, y - 6, x + 17, y - 16);
    g.lineStyle(2, SHADES.light, 1).lineBetween(x + 5, y - 6, x + 17, y - 16);
    g.fillStyle(SHADES.shadow, 1).fillCircle(x + 17, y - 16, 2);
    g.fillStyle(SHADES.woodPale, 1).fillCircle(x + 6, y - 5, 3);
    g.fillStyle(SHADES.deep, 1).fillCircle(x + 6, y - 5, 1);
    return;
  }
  // A storehouse: a little granary, its roof in its colour, sacks by the door.
  g.fillStyle(SHADES.shadow, 1).fillRect(x - 9, y - 4, 19, 13);
  g.fillStyle(SHADES.woodPale, 1).fillRect(x - 8, y - 3, 17, 11);
  g.fillStyle(body, 1).fillTriangle(x - 10, y - 3, x + 11, y - 3, x + 0.5, y - 12);
  g.fillStyle(SHADES.deep, 1).fillRect(x - 2, y + 2, 5, 6);
  g.fillStyle(SHADES.skinFair, 1).fillCircle(x + 11, y + 6, 2.5).fillCircle(x + 13, y + 2, 2);
}
