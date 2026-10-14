import Phaser from 'phaser';
import { createGameConfig } from './config';
import { screenZoom, toggleFullscreen } from './ui/displaySetting';
import { BootScene } from './scenes/BootScene';
import { CarveScene } from './scenes/CarveScene';
import { FightScene } from './scenes/FightScene';
import { CombatScene } from './scenes/CombatScene';
import { DecodeScene } from './scenes/DecodeScene';
import { ChapterScene } from './scenes/ChapterScene';
import { WarTableScene } from './scenes/WarTableScene';
import { EndingScene } from './scenes/EndingScene';
import { MapScene } from './scenes/MapScene';
import { PreloadScene } from './scenes/PreloadScene';
import { PrologueScene } from './scenes/PrologueScene';
import { AreaScene } from './scenes/AreaScene';
import { SoundButtonScene } from './scenes/SoundButtonScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game(createGameConfig([BootScene, PreloadScene, TitleScene, PrologueScene, AreaScene, MapScene, DecodeScene, CarveScene, FightScene, CombatScene, EndingScene, ChapterScene, WarTableScene, SoundButtonScene]));

// Rescale to the window whenever it changes size (or goes fullscreen), by the Screen setting.
const onResize = () => game.scale.setZoom(screenZoom());
window.addEventListener('resize', onResize);

// F goes fullscreen and back, anywhere but where you type (decoding).
const onKey = (e: KeyboardEvent) => {
  if ((e.key === 'f' || e.key === 'F') && !e.repeat && !game.scene.isActive('Decode')) toggleFullscreen(game);
};
window.addEventListener('keydown', onKey);

// Dev only: when the dev server swaps in new code, destroy the old game first, so two games (and two
// copies of the music) never run in the same page.
import.meta.hot?.dispose(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKey);
  game.destroy(true);
});

// Dev builds only: expose the game for poking at from the browser console.
if (import.meta.env.DEV) Object.assign(window, { __game: game });
