import { Story } from 'inkjs';

/** Values ink global variables can hold that the game uses. (Ink lists are not used yet.) */
export type InkValue = string | number | boolean;

export interface StoryLine {
  text: string;
  tags: string[];
}

export interface StoryChoice {
  index: number;
  text: string;
}

export type VariableObserver = (name: string, value: InkValue) => void;

/**
 * The only way TypeScript talks to ink. Ink is the single source of truth for narrative
 * variables: this class never caches their values, it reads and writes ink's state directly.
 */
export class StoryBridge {
  private readonly story: Story;
  private readonly names: readonly string[];
  private readonly observers = new Map<string, Set<VariableObserver>>();

  /** @param storyJson compiled ink JSON, as a string or parsed object */
  constructor(storyJson: string | object) {
    const parsed: unknown = typeof storyJson === 'string' ? JSON.parse(storyJson) : storyJson;
    this.story = new Story(parsed as object);
    this.names = globalVariableNames(parsed);
  }

  /** Jumps to a knot (or `knot.stitch`) and clears any current flow. */
  startKnot(name: string): void {
    try {
      this.story.ChoosePathString(name);
    } catch {
      throw new Error(`StoryBridge: no knot or stitch called "${name}"`);
    }
  }

  get canContinue(): boolean {
    return this.story.canContinue;
  }

  /** True when there is nothing more to show: no next line and no choices. */
  get isFinished(): boolean {
    return !this.story.canContinue && this.story.currentChoices.length === 0;
  }

  /** The next line of text, or null if the story is waiting on a choice or has ended. */
  nextLine(): StoryLine | null {
    if (!this.story.canContinue) return null;
    const text = (this.story.Continue() ?? '').trim();
    return { text, tags: [...(this.story.currentTags ?? [])] };
  }

  choices(): StoryChoice[] {
    return this.story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
  }

  choose(index: number): void {
    const count = this.story.currentChoices.length;
    if (!Number.isInteger(index) || index < 0 || index >= count) {
      throw new Error(`StoryBridge: choice ${index} out of range (${count} available)`);
    }
    this.story.ChooseChoiceIndex(index);
  }

  /** Names of all global variables declared with VAR in the story. */
  variableNames(): readonly string[] {
    return this.names;
  }

  getVariable(name: string): InkValue {
    this.assertDeclared(name);
    return this.story.variablesState[name] as InkValue;
  }

  setVariable(name: string, value: InkValue): void {
    this.assertDeclared(name);
    this.story.variablesState[name] = value;
  }

  /**
   * Calls `observer` whenever the variable changes, whether from ink or from setVariable,
   * and after loadState. Returns an unsubscribe function.
   */
  observe(name: string, observer: VariableObserver): () => void {
    this.assertDeclared(name);
    let set = this.observers.get(name);
    if (!set) {
      set = new Set();
      this.observers.set(name, set);
      this.story.ObserveVariable(name, (n: string, value: unknown) => this.notify(n, value as InkValue));
    }
    set.add(observer);
    return () => set.delete(observer);
  }

  /** Ink's own serialised state: variables, visit counts, current position. */
  saveState(): string {
    return this.story.state.ToJson();
  }

  /** Restores state from saveState(). On failure the current state is kept and an error thrown. */
  loadState(json: string): void {
    const previous = this.story.state.ToJson();
    try {
      this.story.state.LoadJson(json);
    } catch (error) {
      this.story.state.LoadJson(previous);
      throw new Error(`StoryBridge: could not load ink state (${(error as Error).message})`);
    }
    // Ink doesn't fire observers on load, so tell everyone the (possibly) new values.
    for (const name of this.observers.keys()) this.notify(name, this.getVariable(name));
  }

  private notify(name: string, value: InkValue): void {
    for (const observer of this.observers.get(name) ?? []) observer(name, value);
  }

  private assertDeclared(name: string): void {
    if (!this.names.includes(name)) throw new Error(`StoryBridge: no ink variable called "${name}"`);
  }
}

/** Reads VAR names from the compiled JSON's "global decl" container (inkjs has no public API for this). */
function globalVariableNames(json: unknown): string[] {
  const root = (json as { root?: unknown[] } | null)?.root;
  const named = Array.isArray(root) ? root[root.length - 1] : null;
  const decl = (named as Record<string, unknown> | null)?.['global decl'];
  if (!Array.isArray(decl)) return [];
  return decl.flatMap((item) =>
    item && typeof item === 'object' && typeof (item as Record<string, unknown>)['VAR='] === 'string'
      ? [(item as Record<string, string>)['VAR=']!]
      : [],
  );
}
