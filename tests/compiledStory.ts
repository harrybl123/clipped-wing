import { compileInk } from '../scripts/ink.mjs';

let compiled: ReturnType<typeof compileInk> | undefined;

/**
 * The story, compiled once per test file and kept in memory (compiling it takes about a second now, and
 * every test doing it pushed slow runs past the time limit; nor does it write the JSON, so it never races
 * the dev server rewriting the same file).
 */
export function compiledInk(): ReturnType<typeof compileInk> {
  return (compiled ??= compileInk({ write: false }));
}

/** The compiled story's JSON (throws with the compiler's errors if it doesn't compile). */
export function storyJson(): string {
  const result = compiledInk();
  if (!result.ok || !result.json) throw new Error(result.errors.join('\n'));
  return result.json;
}
