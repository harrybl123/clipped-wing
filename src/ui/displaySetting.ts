import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

// How the game is scaled to the window (Settings on the title; remembered between visits):
//   fill   as big as fits (designer: whole-number scaling left big black borders); pixels may come
//          out a screen pixel uneven here and there, which is hard to see
//   sharp  whole-number steps only (2×, 3×…), every pixel exactly square, with borders where the next
//          step doesn't fit

export type ScreenFit = 'fill' | 'sharp';
const KEY = 'clipped-wing:screen';

export function savedScreenFit(): ScreenFit {
  try {
    return window.localStorage.getItem(KEY) === 'sharp' ? 'sharp' : 'fill';
  } catch {
    return 'fill';
  }
}

/** The scale for the window as it is now. */
export function screenZoom(fit: ScreenFit = savedScreenFit()): number {
  const fits = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  return fit === 'sharp' ? Math.max(1, Math.floor(fits)) : Math.max(1, fits);
}

export function setScreenFit(game: Phaser.Game, fit: ScreenFit): void {
  try {
    window.localStorage.setItem(KEY, fit);
  } catch {
    // Storage blocked: it still works for this visit.
  }
  game.scale.setZoom(screenZoom(fit));
}

/** Into fullscreen, or out of it (needs a key press or click to be allowed). */
export function toggleFullscreen(game: Phaser.Game): void {
  if (game.scale.isFullscreen) game.scale.stopFullscreen();
  else game.scale.startFullscreen();
}
