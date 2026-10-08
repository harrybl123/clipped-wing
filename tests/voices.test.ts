import { describe, expect, it } from 'vitest';
import { FACELESS_VOICES, TEXT_SPEED, typeLine, VOICES } from '../src/systems/voices';
import { SPEAKERS } from '../src/ui/portraits';

const voice = { every: 2, speed: 1 };
const syllables = (text: string, v = voice) => typeLine(text, v).flatMap((l, i) => (l.syllable ? [text[i]] : []));

describe('typing a line out', () => {
  it('has one letter per character, and narration is silent', () => {
    const letters = typeLine('The tube hums.');
    expect(letters).toHaveLength('The tube hums.'.length);
    expect(letters.some((l) => l.syllable)).toBe(false);
  });

  it('sounds every few letters within a word, starting each word, never on spaces or punctuation', () => {
    expect(syllables('Hello, you.')).toEqual(['H', 'l', 'o', 'y', 'u']);
    expect(syllables('Hello, you.', { every: 3, speed: 1 })).toEqual(['H', 'l', 'y']);
  });

  it('pauses after punctuation', () => {
    const letters = typeLine('No. Yes', voice);
    const plain = 1 / TEXT_SPEED;
    expect(letters[1]!.delay).toBeCloseTo(plain);
    expect(letters[3]!.delay).toBeGreaterThan(plain * 5); // the space after the full stop
  });

  it('rises at the end of a question, and is emphatic in an exclamation', () => {
    const q = typeLine('Where are you going?', voice).flatMap((l) => (l.syllable ? [l.syllable] : []));
    expect(q[0]!.rise).toBe(false);
    expect(q[q.length - 1]!.rise).toBe(true);
    expect(typeLine('Get out!', voice).every((l) => !l.syllable || l.syllable.emphatic)).toBe(true);
  });

  it('is the same every time for the same words', () => {
    expect(typeLine('Rot-hand.', voice)).toEqual(typeLine('Rot-hand.', voice));
  });

  it('talks faster with a faster voice', () => {
    const slow = typeLine('abc', { every: 2, speed: 1 });
    const fast = typeLine('abc', { every: 2, speed: 2 });
    expect(fast[1]!.delay).toBeCloseTo(slow[1]!.delay / 2);
  });
});

describe('voices', () => {
  it('every speaker has a voice (the dog has its sounds instead)', () => {
    for (const [id, s] of Object.entries(SPEAKERS)) expect(s.voice === 'crowd' || s.voice === 'dog' || s.voice in VOICES, id).toBe(true);
  });
  it('the faceless voices belong to someone', () => {
    for (const v of Object.values(FACELESS_VOICES)) expect(v in VOICES).toBe(true);
  });
});

describe('story sounds', () => {
  it('every #sound: in the ink is a sound that exists', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { SOUND_IDS } = await import('../src/ui/soundscape');
    const dir = join(__dirname, '..', 'story');
    const used = readdirSync(dir).filter((f) => f.endsWith('.ink')).flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/#sound:([a-z:]+)/g)].flatMap((m) => m[1]!.split(':')));
    expect(used.length).toBeGreaterThan(0);
    for (const id of used) expect(SOUND_IDS as readonly string[]).toContain(id);
  });
});
