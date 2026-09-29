import { describe, expect, it } from 'vitest';
import { Calendar } from '../src/systems/Calendar';
import { SAVE_KEY, SAVE_VERSION, SaveSystem, type StorageLike } from '../src/systems/SaveSystem';

class MemoryStorage implements StorageLike {
  readonly items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

const INK = '{"flows":{},"variablesState":{"suspicion":2}}';

describe('SaveSystem', () => {
  it('saves and loads the calendar and ink state', () => {
    const storage = new MemoryStorage();
    const saves = new SaveSystem(storage);
    const calendar = new Calendar({ day: 3, slot: 'afternoon', afternoonActionsUsed: 1 });

    expect(saves.save(calendar, INK, new Date('2026-01-02T03:04:05Z'))).toEqual({ ok: true });
    expect(saves.hasSave()).toBe(true);

    const result = saves.load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.game.calendar.toJSON()).toEqual(calendar.toJSON());
    expect(result.game.ink).toBe(INK);
    expect(result.game.savedAt).toBe('2026-01-02T03:04:05.000Z');
    expect(JSON.parse(storage.items.get(SAVE_KEY)!).version).toBe(SAVE_VERSION);
  });

  it('reports a missing save', () => {
    const saves = new SaveSystem(new MemoryStorage());
    expect(saves.hasSave()).toBe(false);
    expect(saves.load()).toEqual({ ok: false, reason: 'missing' });
  });

  it.each([
    ['not JSON', '{{{'],
    ['JSON null', 'null'],
    ['a bad calendar', JSON.stringify({ version: SAVE_VERSION, calendar: { day: 99 }, ink: INK })],
    ['missing ink', JSON.stringify({ version: SAVE_VERSION, calendar: new Calendar().toJSON() })],
    ['ink that is not JSON', JSON.stringify({ version: SAVE_VERSION, calendar: new Calendar().toJSON(), ink: 'oops' })],
  ])('reports a corrupt save: %s', (_label, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, raw);
    expect(new SaveSystem(storage).load()).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('detects saves from another version', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 0, calendar: new Calendar().toJSON(), ink: INK }));
    expect(new SaveSystem(storage).load()).toEqual({ ok: false, reason: 'outdated', version: 0 });
  });

  it('copes with no storage at all', () => {
    const saves = new SaveSystem(null);
    expect(saves.isAvailable).toBe(false);
    expect(saves.save(new Calendar(), INK)).toEqual({ ok: false, reason: 'unavailable' });
    expect(saves.load()).toEqual({ ok: false, reason: 'unavailable' });
    expect(saves.hasSave()).toBe(false);
    expect(() => saves.clear()).not.toThrow();
  });

  it('copes with storage that throws', () => {
    const saves = new SaveSystem(throwing);
    expect(saves.save(new Calendar(), INK)).toEqual({ ok: false, reason: 'write-failed' });
    expect(saves.load()).toEqual({ ok: false, reason: 'unavailable' });
    expect(saves.hasSave()).toBe(false);
    expect(() => saves.clear()).not.toThrow();
  });

  it('falls back to unavailable when there is no localStorage (as in Node)', () => {
    expect(new SaveSystem().load().ok).toBe(false);
  });

  it('clears the save', () => {
    const saves = new SaveSystem(new MemoryStorage());
    saves.save(new Calendar(), INK);
    saves.clear();
    expect(saves.load()).toEqual({ ok: false, reason: 'missing' });
  });
});
