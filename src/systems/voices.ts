// Voices: no words, just syllables of sound as a line types out, so you can hear who's speaking
// (docs/audio-plan.md). This file is pure (no Phaser, no Web Audio): the voice presets as numbers, and
// the timing of a line, which letters sound and where it pauses. `src/ui/voice.ts` plays them.

/** Rounded tones only: buzzier waves sounded alien and abrasive (designer). */
export type Wave = 'sine' | 'triangle';

export interface Voice {
  /** Base pitch in Hz. */
  pitch: number;
  /** How far each syllable's pitch strays from the base, in semitones either way. */
  spread: number;
  /** The raw tone, before it's shaped into a vowel. */
  wave: Wave;
  /** How long each syllable rings, in seconds. */
  length: number;
  /** Talking speed: multiplies the text speed (1 = normal). */
  speed: number;
  /** One syllable every this many letters. */
  every: number;
  /** Pitch slide within a syllable, in semitones (negative falls). */
  glide: number;
  /** Breath mixed in (0–1): noise under the tone. */
  breath: number;
  /** Vibrato depth in semitones (a wobble or a waver). */
  wobble: number;
  /** Shifts the vowel formants (1 = neutral; under 1 hollower and darker, over 1 brighter and thinner). */
  formant: number;
  /** Loudness (0–1). */
  volume: number;
}

/** The fifteen voices (suggestion in docs/audio-plan.md, tuned by ear). Rounded tones only (sine, triangle): softer and smoother (designer). */
export const VOICES = {
  you: { pitch: 200, spread: 1.5, wave: 'triangle', length: 0.085, speed: 1, every: 2, glide: -0.7, breath: 0.4, wobble: 0, formant: 1, volume: 0.9 },
  mum: { pitch: 175, spread: 1.2, wave: 'sine', length: 0.1, speed: 0.85, every: 3, glide: -0.5, breath: 0.3, wobble: 0.12, formant: 0.95, volume: 1 },
  girl: { pitch: 255, spread: 2.5, wave: 'triangle', length: 0.07, speed: 1.15, every: 2, glide: 0.6, breath: 0.3, wobble: 0, formant: 1.1, volume: 0.85 },
  friend: { pitch: 235, spread: 2, wave: 'sine', length: 0.08, speed: 1.1, every: 2, glide: 0.8, breath: 0.2, wobble: 0, formant: 1.05, volume: 1 },
  archivist: { pitch: 225, spread: 1.5, wave: 'sine', length: 0.06, speed: 1.25, every: 2, glide: 0.3, breath: 0.15, wobble: 0.35, formant: 1.15, volume: 1 },
  boy: { pitch: 215, spread: 3.5, wave: 'triangle', length: 0.075, speed: 1.15, every: 2, glide: 1.5, breath: 0.15, wobble: 0, formant: 1.2, volume: 0.85 },
  tender: { pitch: 98, spread: 1.2, wave: 'triangle', length: 0.13, speed: 0.75, every: 3, glide: -0.4, breath: 0.35, wobble: 0.1, formant: 0.8, volume: 1 },
  preacher: { pitch: 135, spread: 3, wave: 'triangle', length: 0.11, speed: 0.95, every: 3, glide: 1.2, breath: 0.15, wobble: 0.25, formant: 0.95, volume: 0.9 },
  elder: { pitch: 112, spread: 1, wave: 'triangle', length: 0.09, speed: 0.8, every: 3, glide: -1, breath: 0.4, wobble: 0, formant: 0.85, volume: 0.9 },
  guard: { pitch: 104, spread: 1, wave: 'triangle', length: 0.075, speed: 1, every: 3, glide: -0.8, breath: 0.3, wobble: 0, formant: 0.8, volume: 0.95 },
  roots_man: { pitch: 135, spread: 1.5, wave: 'triangle', length: 0.085, speed: 1, every: 2, glide: -0.4, breath: 0.3, wobble: 0, formant: 0.9, volume: 0.95 },
  roots_woman: { pitch: 215, spread: 1.5, wave: 'sine', length: 0.085, speed: 1, every: 2, glide: 0, breath: 0.3, wobble: 0, formant: 1.05, volume: 1 },
  old: { pitch: 145, spread: 1.5, wave: 'triangle', length: 0.11, speed: 0.75, every: 3, glide: -0.7, breath: 0.5, wobble: 0.6, formant: 0.9, volume: 0.95 },
  young: { pitch: 165, spread: 2.5, wave: 'triangle', length: 0.07, speed: 1.1, every: 2, glide: -1.2, breath: 0.25, wobble: 0, formant: 1, volume: 0.9 },
  upper: { pitch: 160, spread: 1.2, wave: 'sine', length: 0.095, speed: 0.9, every: 3, glide: 0.3, breath: 0.15, wobble: 0, formant: 1.1, volume: 1 },
} satisfies Record<string, Voice>;

export type VoiceId = keyof typeof VOICES;

/** The crowd, all at once: several of the plain voices, slightly out of step. */
export const CROWD_VOICES: VoiceId[] = ['roots_man', 'roots_woman', 'old', 'young'];

/** Letters per second at normal text speed (a setting later). */
export const TEXT_SPEED = 45;
/** Extra pause after these, in letters' worth of time. */
const PAUSES: Record<string, number> = { ',': 4, ';': 5, ':': 5, '.': 9, '!': 9, '?': 9, '…': 12 };

/** One letter of a typed line: how long to wait before showing it, and whether a syllable sounds with it. */
export interface TypedLetter {
  /** Seconds after the previous letter. */
  delay: number;
  syllable?: Syllable;
}

export interface Syllable {
  /** The vowel shape, from the letters round it, so the same words always sound the same. */
  vowel: 'a' | 'e' | 'i' | 'o' | 'u';
  /** Semitones from the voice's base, chosen by the letter (deterministic). */
  step: number;
  /** Rising at the end of a question. */
  rise: boolean;
  /** Louder and sharper, in a sentence ending in "!". */
  emphatic: boolean;
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;

/** The vowel a chunk of letters sounds most like: its first vowel, else one picked from its letters. */
function vowelOf(chunk: string): Syllable['vowel'] {
  const found = [...chunk.toLowerCase()].find((c): c is Syllable['vowel'] => (VOWELS as readonly string[]).includes(c));
  if (found) return found;
  const code = [...chunk].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return VOWELS[code % VOWELS.length]!;
}

/**
 * The timing of a typed line, letter by letter. Narration passes no voice and is silent. A syllable
 * sounds every `voice.every` letters within a word (and on a word's first letter); never on spaces or
 * punctuation. Punctuation adds a pause. The last few syllables before a "?" rise; every syllable in a
 * sentence ending "!" is emphatic.
 */
export function typeLine(text: string, voice?: Pick<Voice, 'every' | 'speed'>, speed = TEXT_SPEED): TypedLetter[] {
  const letters = [...text];
  const perLetter = 1 / (speed * (voice?.speed ?? 1));
  // Where each sentence ends, and how it ends.
  const endOf = (i: number) => {
    for (let j = i; j < letters.length; j++) if ('.!?…'.includes(letters[j]!)) return { at: j, mark: letters[j]! };
    return { at: letters.length, mark: '' };
  };
  let sinceSyllable = Infinity;
  return letters.map((ch, i) => {
    const prev = letters[i - 1];
    const delay = i === 0 ? 0 : perLetter * (1 + (prev ? PAUSES[prev] ?? 0 : 0) * (prev === '.' && ch === '.' ? 0.3 : 1));
    if (!voice || !/[\p{L}\p{N}]/u.test(ch)) {
      if (ch === ' ' || !/[\p{L}\p{N}]/u.test(ch)) sinceSyllable = Infinity; // a new word starts a new syllable
      return { delay };
    }
    sinceSyllable++;
    if (sinceSyllable < voice.every) return { delay };
    sinceSyllable = 0;
    const end = endOf(i);
    const chunk = letters.slice(i, i + voice.every).join('');
    const lettersToEnd = end.at - i;
    return {
      delay,
      syllable: {
        vowel: vowelOf(chunk),
        step: (ch.toLowerCase().charCodeAt(0) * 7) % 5 - 2,
        rise: end.mark === '?' && lettersToEnd <= voice.every * 3,
        emphatic: end.mark === '!',
      },
    };
  });
}

/** Which voice a line is spoken in: the speaker's, or for a faceless `#name:` voice, the voice it belongs to. */
export const FACELESS_VOICES: Record<string, VoiceId> = { Mum: 'mum', 'A voice': 'preacher', 'Your friend': 'friend' };
