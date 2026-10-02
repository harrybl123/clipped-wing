import type Phaser from 'phaser';

// Sound on or off, chosen with the speaker in the corner (SoundButtonScene) and remembered in the
// browser between visits. Dev links with &mute=1 mute for that visit only, without changing it.

const KEY = 'clipped-wing:muted';

/** Whether the player last turned the sound off (false if it can't be read). */
export function savedMuted(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Turns all sound on or off, and remembers it. */
export function setMuted(game: Phaser.Game, muted: boolean): void {
  game.sound.setMute(muted);
  try {
    window.localStorage.setItem(KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked: it still works for this visit.
  }
}
