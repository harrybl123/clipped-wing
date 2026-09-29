// Compiles story/main.ink (and anything it INCLUDEs) to src/generated/main.ink.json
// using inkjs's built-in compiler. Used by `npm run ink` and by the Vite plugin in
// vite.config.ts (on dev start, on every .ink change in dev, and at build).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { Compiler, CompilerOptions } from 'inkjs/full';

export const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const STORY_DIR = resolve(PROJECT_ROOT, 'story');
const ENTRY_FILE = 'main.ink';
const OUT_FILE = resolve(PROJECT_ROOT, 'src/generated/main.ink.json');

/**
 * @typedef {{ ok: boolean, errors: string[], warnings: string[], outFile: string }} InkResult
 */

/**
 * Compiles the story and writes the JSON. On failure nothing is written, so the last
 * good JSON stays in place (the dev server keeps running the previous version).
 * @returns {InkResult}
 */
export function compileInk() {
  const entryPath = resolve(STORY_DIR, ENTRY_FILE);
  const fileHandler = {
    /** @param {string} filename */
    ResolveInkFilename: (filename) => resolve(STORY_DIR, filename),
    /** @param {string} fullPath */
    LoadInkFileContents: (fullPath) => readFileSync(fullPath, 'utf8'),
  };
  // An error handler stops the compiler from throwing on the first problem, so we get them all.
  const options = new CompilerOptions(ENTRY_FILE, [], false, () => {}, fileHandler);

  let source;
  try {
    source = readFileSync(entryPath, 'utf8');
  } catch {
    return { ok: false, errors: [`Could not read ${relative(PROJECT_ROOT, entryPath)}`], warnings: [], outFile: OUT_FILE };
  }

  const compiler = new Compiler(source, options);
  let json = null;
  try {
    json = compiler.Compile().ToJson();
  } catch {
    // Details are in compiler.errors.
  }
  const errors = [...compiler.errors];
  const warnings = [...compiler.warnings];
  if (json == null || errors.length > 0) {
    if (errors.length === 0) errors.push('Compilation failed with no error message.');
    return { ok: false, errors, warnings, outFile: OUT_FILE };
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, /** @type {string} */ (json));
  return { ok: true, errors, warnings, outFile: OUT_FILE };
}

/**
 * Turns "ERROR: 'main.ink' line 3: Divert target not found" into
 * "story/main.ink:3  Divert target not found", which most terminals and editors make clickable.
 * @param {string} message
 */
function formatMessage(message) {
  // inkjs 2.4 leaves an unfilled template in one message; drop it.
  message = message.replace(' after searching: {this.descriptionOfScope}', '');
  const match = /^(?:ERROR|WARNING|TODO): '(.+?)' line (\d+): (.*)$/s.exec(message);
  if (!match) return message;
  const [, file, line, text] = match;
  return `${relative(PROJECT_ROOT, resolve(STORY_DIR, /** @type {string} */ (file)))}:${line}  ${text}`;
}

/**
 * Human-readable, coloured summary for the terminal.
 * @param {InkResult} result
 */
export function formatInkResult(result) {
  const lines = [];
  for (const w of result.warnings) lines.push(`${styleText('yellow', 'ink warning')}  ${formatMessage(w)}`);
  for (const e of result.errors) lines.push(`${styleText(['red', 'bold'], 'ink error')}    ${formatMessage(e)}`);
  if (result.ok) {
    lines.push(`${styleText('green', '✓ ink')} compiled → ${relative(PROJECT_ROOT, result.outFile)}`);
  } else {
    const n = result.errors.length;
    lines.push(styleText(['red', 'bold'], `✗ ink compilation failed (${n} error${n === 1 ? '' : 's'}); previous story JSON left unchanged`));
  }
  return lines.join('\n');
}

/**
 * Plain-text version of the errors, for the browser error overlay in dev.
 * @param {InkResult} result
 */
export function inkErrorText(result) {
  return result.errors.map(formatMessage).join('\n');
}

// CLI: `node scripts/ink.mjs`
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = compileInk();
  console.log(formatInkResult(result));
  process.exitCode = result.ok ? 0 : 1;
}
