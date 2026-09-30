import Phaser from 'phaser';
import { PALETTE } from '../config';
import { TEXTURES } from '../scenes/PreloadScene';

// Placeholder scenery built from shapes and generated textures, shared by the title
// screen and test areas until the art pass replaces it.

/** Far wall: faint vertical "carved" bands. */
export function addCarvedBands(scene: Phaser.Scene, width: number, height: number, scrollFactor = 0.5): Phaser.GameObjects.Graphics {
  const bands = scene.add.graphics().setScrollFactor(scrollFactor);
  for (let x = 0; x < width; x += 160) {
    bands.fillStyle(PALETTE.canopyWhite, 0.02 + ((x / 160) % 3) * 0.012);
    bands.fillRect(x, 0, 70 + ((x / 160) % 2) * 40, height);
  }
  return bands;
}

/** The sacred tube: a cyan column from `top` to `bottom` with a glow and motes drifting upwards. */
export function addTube(scene: Phaser.Scene, x: number, top: number, bottom: number, width = 90): void {
  const height = bottom - top;
  const midY = top + height / 2;
  scene.add
    .image(x, midY, TEXTURES.softGlow)
    .setDisplaySize(width * 6, height * 1.3)
    .setTint(PALETTE.tubeCyan)
    .setAlpha(0.25)
    .setBlendMode(Phaser.BlendModes.ADD);
  const tube = scene.add.rectangle(x, midY, width, height, PALETTE.tubeCyan, 0.85);
  tube.enableFilters();
  tube.filters?.internal.addGlow(PALETTE.tubeCyan, 6, 1, 2);
  scene.add.particles(0, 0, TEXTURES.dot, {
    emitZone: {
      type: 'random',
      source: {
        getRandomPoint: (point) => {
          point.x = x + Phaser.Math.Between(-width / 2 + 10, width / 2 - 10);
          point.y = Phaser.Math.Between(top + height * 0.2, bottom);
        },
      },
    },
    speedY: { min: -60, max: -20 },
    speedX: { min: -6, max: 6 },
    lifespan: 6000,
    frequency: 180,
    scale: { min: 0.2, max: 0.5 },
    alpha: { start: 0.9, end: 0 },
    tint: PALETTE.canopyWhite,
    blendMode: Phaser.BlendModes.ADD,
  });
}

/** A small glowing fungus standing on `groundY`. */
export function addFungus(scene: Phaser.Scene, x: number, groundY: number, size = 1): void {
  const halo = scene.add
    .image(x, groundY - 14 * size, TEXTURES.softGlow)
    .setScale(0.9 * size)
    .setTint(PALETTE.rootGreen)
    .setAlpha(0.5)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: halo, alpha: 0.3, duration: Phaser.Math.Between(1800, 2600), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.add.rectangle(x, groundY - 10 * size, 8 * size, 20 * size, PALETTE.rootGreen, 0.8);
  scene.add.ellipse(x, groundY - 22 * size, 44 * size, 20 * size, PALETTE.rootGreen);
}

/** An amber lamp hanging from the top of the screen on a line. */
export function addLamp(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.line(0, 0, x, 0, x, y - 20, PALETTE.lampAmber, 0.4).setOrigin(0);
  const halo = scene.add.image(x, y, TEXTURES.softGlow).setScale(1.6).setTint(PALETTE.lampAmber).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: halo, alpha: 0.3, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.add.circle(x, y, 18, PALETTE.lampAmber);
}
