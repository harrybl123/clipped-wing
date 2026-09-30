import type Phaser from 'phaser';
import { hexString, paintPixels, type PixelColour } from './pixelArt';

/** A 1×1 white texture, for particles and tinted pixels. */
export const PIXEL = 'px';

/** Creates a texture by painting every pixel (see paintPixels). Replaces any texture with the same key. */
export function makePaintedTexture(scene: Phaser.Scene, key: string, width: number, height: number, colourAt: (x: number, y: number) => PixelColour): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, width, height)!;
  const ctx = texture.getContext();
  const image = ctx.createImageData(width, height);
  image.data.set(paintPixels(width, height, colourAt));
  ctx.putImageData(image, 0, 0);
  texture.refresh();
}

/**
 * Creates a small sprite texture from rows of characters, e.g. ['.##.', '#rr#'], where each
 * character maps to a colour in `colours` and '.' is transparent. Does nothing if it exists.
 */
export function makeSpriteTexture(scene: Phaser.Scene, key: string, rows: readonly string[], colours: Record<string, number>): string {
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, rows[0]!.length, rows.length)!;
  const ctx = texture.getContext();
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const colour = colours[ch];
      if (colour === undefined) return;
      ctx.fillStyle = hexString(colour);
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  texture.refresh();
  return key;
}

/** Paints a sprite made of character rows straight into a pixel buffer at (x, y) (top-left). */
export function stampRows(
  put: (x: number, y: number, colour: number) => void,
  rows: readonly string[],
  colours: Record<string, number>,
  x: number,
  y: number,
): void {
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      const colour = colours[ch];
      if (colour !== undefined) put(x + dx, y + dy, colour);
    }),
  );
}
