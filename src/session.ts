import type Phaser from 'phaser';
import storyJson from './generated/main.ink.json';
import { Calendar } from './systems/Calendar';
import { SaveSystem } from './systems/SaveSystem';
import { StoryBridge } from './systems/StoryBridge';

/** The live game state shared by every scene. Created once in BootScene. */
export interface Session {
  story: StoryBridge;
  calendar: Calendar;
  saves: SaveSystem;
}

const REGISTRY_KEY = 'session';

export function createSession(game: Phaser.Game): Session {
  const session: Session = { story: new StoryBridge(storyJson), calendar: new Calendar(), saves: new SaveSystem() };
  game.registry.set(REGISTRY_KEY, session);
  return session;
}

export function getSession(scene: Phaser.Scene): Session {
  const session = scene.registry.get(REGISTRY_KEY) as Session | undefined;
  if (!session) throw new Error('Session not created; BootScene must run first');
  return session;
}

/** Saves the game and returns a short status message for the player/debug overlay. */
export function saveSession(session: Session): string {
  const result = session.saves.save(session.calendar, session.story.saveState());
  if (result.ok) return 'Saved.';
  return result.reason === 'unavailable' ? 'Cannot save: browser storage is unavailable.' : 'Save failed (storage full?).';
}

/** Loads the saved game into the session and returns a short status message. */
export function loadSession(session: Session): string {
  const result = session.saves.load();
  if (!result.ok) {
    switch (result.reason) {
      case 'missing':
        return 'No save found.';
      case 'unavailable':
        return 'Cannot load: browser storage is unavailable.';
      case 'outdated':
        return `Save is from an older version (${String(result.version)}) and cannot be loaded.`;
      case 'corrupt':
        return 'Save is damaged and cannot be loaded.';
    }
  }
  try {
    session.story.loadState(result.game.ink);
  } catch {
    return 'Save is damaged and cannot be loaded.';
  }
  session.calendar = result.game.calendar;
  return 'Loaded.';
}
