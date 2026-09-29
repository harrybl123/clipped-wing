import { Calendar, type CalendarState } from './Calendar';

/** Bump when the save format changes. Saves with a different version are reported as outdated. */
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'clipped-wing:save';

/** The subset of the Web Storage API we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface SaveFile {
  version: number;
  savedAt: string;
  calendar: CalendarState;
  /** Ink's own state JSON, from StoryBridge.saveState(). */
  ink: string;
}

export interface LoadedGame {
  savedAt: string;
  calendar: Calendar;
  ink: string;
}

export type LoadResult =
  | { ok: true; game: LoadedGame }
  | { ok: false; reason: 'unavailable' | 'missing' | 'corrupt' }
  | { ok: false; reason: 'outdated'; version: unknown };

export type SaveResult = { ok: true } | { ok: false; reason: 'unavailable' | 'write-failed' };

/**
 * Saves the calendar and ink state to localStorage. Never throws: every failure
 * (no storage, missing, corrupt or outdated save, full storage) comes back as a result.
 */
export class SaveSystem {
  private readonly storage: StorageLike | null;

  /** @param storage defaults to window.localStorage; pass null to simulate it being unavailable. */
  constructor(storage: StorageLike | null | undefined = defaultStorage()) {
    this.storage = storage ?? null;
  }

  get isAvailable(): boolean {
    return this.storage !== null;
  }

  save(calendar: Calendar, inkState: string, now: Date = new Date()): SaveResult {
    if (!this.storage) return { ok: false, reason: 'unavailable' };
    const file: SaveFile = { version: SAVE_VERSION, savedAt: now.toISOString(), calendar: calendar.toJSON(), ink: inkState };
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(file));
      return { ok: true };
    } catch {
      return { ok: false, reason: 'write-failed' };
    }
  }

  load(): LoadResult {
    if (!this.storage) return { ok: false, reason: 'unavailable' };
    let raw: string | null;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
    if (raw === null) return { ok: false, reason: 'missing' };

    let file: Partial<Record<keyof SaveFile, unknown>>;
    try {
      file = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'corrupt' };
    }
    if (!file || typeof file !== 'object') return { ok: false, reason: 'corrupt' };
    if (file.version !== SAVE_VERSION) return { ok: false, reason: 'outdated', version: file.version };

    try {
      const calendar = Calendar.fromJSON(file.calendar);
      if (typeof file.ink !== 'string' || typeof JSON.parse(file.ink) !== 'object') throw new Error('bad ink');
      return { ok: true, game: { savedAt: String(file.savedAt), calendar, ink: file.ink } };
    } catch {
      return { ok: false, reason: 'corrupt' };
    }
  }

  hasSave(): boolean {
    try {
      return this.storage?.getItem(SAVE_KEY) != null;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      // Nothing useful to do.
    }
  }
}

/** localStorage, or null if it doesn't exist or access throws (e.g. blocked cookies, sandboxed iframe). */
function defaultStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = `${SAVE_KEY}:probe`;
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
