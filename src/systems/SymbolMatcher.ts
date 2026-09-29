/** A symbol in one of Grounded's messages, and the words the player may type for it. */
export interface SymbolDefinition {
  id: string;
  /** Accepted answers, e.g. ["see", "eye", "look"]. Multi-word answers are fine. The first is used on auto-solve. */
  accepted: readonly string[];
}

/** Wrong attempts on one symbol before each level of help. */
export const NUDGE_AFTER = 2;
export const HINT_AFTER = 4;
export const AUTO_SOLVE_AFTER = 6;

export type HelpLevel = 'none' | 'nudge' | 'hint';

export type GuessResult =
  /** Blank after tidying up; not counted as an attempt. */
  | { kind: 'empty' }
  | { kind: 'correct'; answer: string }
  | { kind: 'wrong'; wrongAttempts: number; help: HelpLevel }
  /** Too many wrong attempts: the symbol is now solved with the first accepted answer. */
  | { kind: 'auto-solved'; wrongAttempts: number; answer: string }
  | { kind: 'already-solved'; answer: string };

/** Words ignored when comparing, so "the eye" matches "eye". */
const IGNORED_WORDS = new Set(['a', 'an', 'the']);

/** Lowercase, trimmed, punctuation removed (including apostrophes), whitespace collapsed. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A deliberately simple English suffix stripper so that "sees", "seeing" and "see" compare equal,
 * as do "carve"/"carved"/"carving" and "fly"/"flies"/"flying". Both the guess and the accepted words
 * go through it, so the stems only need to be consistent, not real words. Irregular forms
 * ("saw", "flew") must be listed as accepted words.
 */
export function stem(word: string): string {
  let w = word;
  const undouble = (s: string) => (/([^aeioulsz])\1$/.test(s) ? s.slice(0, -1) : s);
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('ing') && w.length - 3 >= 3) w = undouble(w.slice(0, -3));
  else if (w.endsWith('ed') && w.length - 2 >= 3) w = undouble(w.slice(0, -2));
  else if (/[sxzh]es$/.test(w) && w.length - 2 >= 3) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length - 1 >= 3) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/** The comparable form of a phrase: normalised, articles dropped, each word stemmed. */
export function comparable(text: string): string {
  return normalise(text)
    .split(' ')
    .filter((word) => word && !IGNORED_WORDS.has(word))
    .map(stem)
    .join(' ');
}

interface SymbolProgress {
  wrongAttempts: number;
  /** What goes in the glossary: the player's own words, or the first accepted word if auto-solved. */
  answer: string | null;
}

/** Checks guesses for decoding symbols and tracks wrong attempts per symbol. No UI. */
export class SymbolMatcher {
  private readonly symbols = new Map<string, { accepted: Set<string>; first: string }>();
  private readonly progress = new Map<string, SymbolProgress>();

  constructor(definitions: readonly SymbolDefinition[]) {
    for (const def of definitions) {
      if (this.symbols.has(def.id)) throw new Error(`SymbolMatcher: duplicate symbol id "${def.id}"`);
      const first = def.accepted[0];
      if (first === undefined) throw new Error(`SymbolMatcher: symbol "${def.id}" has no accepted words`);
      this.symbols.set(def.id, { accepted: new Set(def.accepted.map(comparable)), first });
      this.progress.set(def.id, { wrongAttempts: 0, answer: null });
    }
  }

  guess(symbolId: string, text: string): GuessResult {
    const symbol = this.symbol(symbolId);
    const progress = this.progress.get(symbolId)!;
    if (progress.answer !== null) return { kind: 'already-solved', answer: progress.answer };

    const guess = comparable(text);
    if (guess === '') return { kind: 'empty' };

    if (symbol.accepted.has(guess)) {
      progress.answer = text.trim();
      return { kind: 'correct', answer: progress.answer };
    }

    progress.wrongAttempts += 1;
    if (progress.wrongAttempts >= AUTO_SOLVE_AFTER) {
      progress.answer = symbol.first;
      return { kind: 'auto-solved', wrongAttempts: progress.wrongAttempts, answer: symbol.first };
    }
    return { kind: 'wrong', wrongAttempts: progress.wrongAttempts, help: this.helpLevel(symbolId) };
  }

  helpLevel(symbolId: string): HelpLevel {
    this.symbol(symbolId);
    const n = this.progress.get(symbolId)!.wrongAttempts;
    if (n >= HINT_AFTER) return 'hint';
    if (n >= NUDGE_AFTER) return 'nudge';
    return 'none';
  }

  wrongAttempts(symbolId: string): number {
    this.symbol(symbolId);
    return this.progress.get(symbolId)!.wrongAttempts;
  }

  isSolved(symbolId: string): boolean {
    return this.answer(symbolId) !== null;
  }

  /** The glossary entry for a solved symbol, or null if unsolved. */
  answer(symbolId: string): string | null {
    this.symbol(symbolId);
    return this.progress.get(symbolId)!.answer;
  }

  private symbol(symbolId: string) {
    const symbol = this.symbols.get(symbolId);
    if (!symbol) throw new Error(`SymbolMatcher: unknown symbol "${symbolId}"`);
    return symbol;
  }
}
