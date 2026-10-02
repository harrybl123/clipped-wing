import Phaser from 'phaser';
import { createGameConfig, integerZoom } from './config';
import { BootScene } from './scenes/BootScene';
import { CarveScene } from './scenes/CarveScene';
import { FightScene } from './scenes/FightScene';
import { DecodeScene } from './scenes/DecodeScene';
import { ChapterScene } from './scenes/ChapterScene';
import { EndingScene } from './scenes/EndingScene';
import { MapScene } from './scenes/MapScene';
import { PreloadScene } from './scenes/PreloadScene';
import { PrologueScene } from './scenes/PrologueScene';
import { AreaScene } from './scenes/AreaScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game(createGameConfig([BootScene, PreloadScene, TitleScene, PrologueScene, AreaScene, MapScene, DecodeScene, CarveScene, FightScene, EndingScene, ChapterScene]));

// Keep pixels square and crisp: rescale by whole numbers when the window changes size.
const onResize = () => game.scale.setZoom(integerZoom());
window.addEventListener('resize', onResize);

// Dev only: when the dev server swaps in new code, destroy the old game first, so two games (and two
// copies of the music) never run in the same page.
import.meta.hot?.dispose(() => {
  window.removeEventListener('resize', onResize);
  game.destroy(true);
});

// Dev builds only: expose the game for poking at from the browser console.
if (import.meta.env.DEV) Object.assign(window, { __game: game });
