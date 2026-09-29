# Clipped Wing — project context for Claude Code

Clipped Wing is a short (about 45 minutes) 2D narrative mystery game played in the browser. Act 1 is being built first. The full design lives in `docs/design-summary.md`; read it before making design-level decisions.

## One-paragraph pitch

A thumbless woodcarver lives in the lower roots of a vast tree whose people worship a glowing tube that runs up its trunk. Offerings go up the tube each morning; blessings come down each evening. When the protagonist's carved bird becomes the first rejection in living memory, they find a picture message hidden inside it, from a stranger outside the tree. Over one week they keep up a secret conversation through hollowed birds while the tree, hungry and frightened, turns them into a scapegoat. Days are for surviving; nights are for solving the mystery.

## Stack

- **Engine:** Phaser (latest stable), TypeScript in strict mode
- **Narrative:** ink, run in the browser with inkjs; `.ink` source compiled to `.json`
- **Build/dev:** Vite
- **Tests:** Vitest, for game logic (state, calendar, save, symbol matching), not rendering
- **Saving:** browser localStorage
- **Hosting:** itch.io (HTML5 build)
- **Version control:** Git + GitHub

## Principles

1. **Text files first.** Everything should be editable as code or data: scenes, areas, characters, messages, symbols, story. Avoid anything that needs a visual editor.
2. **Data-driven.** Areas, characters, messages and decoding symbols live in `src/data/*.json` (or typed `.ts` data modules). Adding content should rarely need new engine code.
3. **One source of truth for story state.** Narrative variables (suspicion, trust, choices) live in ink. TypeScript reads and writes them through the story bridge, never keeps a parallel copy.
4. **Placeholder art until the art pass.** Use simple shapes in the palette below. Never block on art.
5. **Small, verified steps.** After each meaningful change: type-check, run tests, build. Commit at milestones with clear messages.
6. **Don't invent story content.** Use obviously temporary placeholder dialogue unless the task provides the real text. Story decisions belong to the designer.
7. **Ask before adding heavy dependencies** beyond the stack above.

## Palette (art direction)

| Name | Hex | Meaning |
| --- | --- | --- |
| canopyWhite | #F4F1E8 | The unknowable top of the tree |
| tubeCyan | #AEF6F7 | The sacred tube |
| lampAmber | #F2B45A | Warmth, wealth, the upper branches |
| rootGreen | #6FE0C0 | Fungi of the lower roots |
| offeringRed | #D8323A | Reserved: birds and the protagonist only |
| carvedWood | #2A221B | The tree itself |

Red is reserved. Nothing else in the game uses it.

## Commands

(Keep this section up to date as scripts are added.)

- `npm run dev` — start the dev server (http://localhost:5173)
- `npm run build` — type-check, then production build into `dist/`
- `npm run preview` — serve the built `dist/` locally
- `npm run test` — run unit tests (Vitest)
- `npm run typecheck` — compile ink, then TypeScript check (`tsc --noEmit`)
- `npm run package` — build, then zip the contents of `dist/` into `clipped-wing.zip` for itch.io (see README)
- `npm run ink` — compile `story/main.ink` → `src/generated/main.ink.json` (also runs automatically in `dev`, with watch, and in `build`)

## Conventions

- Scenes in `src/scenes/`, systems in `src/systems/`, data in `src/data/`, ink in `story/`.
- British English in all player-facing text.
- Keep this file current: when an architectural decision is made, record it under "Decisions" below.

## Decisions

(Record decisions here as they're made, newest first.)

- **2026-09-29 — Hosting.** `npm run package` zips the contents of `dist/` (with `index.html` at the zip root) into `clipped-wing.zip`, which is gitignored. The build is one JS bundle plus `index.html` with relative paths, and has been checked running from a nested URL path. Dev-only code is guarded with `import.meta.env.DEV` and stripped from the build.

- **2026-09-29 — Scenes and UI.** The scene flow is `Boot` → `Preload` → `Title` → `TestArea`. `BootScene` creates the shared **session** `{ story, calendar, saves }` (`src/session.ts`) and stores it in the Phaser registry. Scenes get it with `getSession(this)`. `saveSession`/`loadSession` wrap SaveSystem and return player-facing messages. Placeholder textures (`dot`, `soft-glow`) are generated in code in `PreloadScene`. Glows combine additive tinted `soft-glow` images with Phaser 4's Glow filter (`enableFilters()` + `filters.internal.addGlow`). `DialogueBox` (`src/ui/`) plays a knot through StoryBridge: Space/Enter/E/click to advance, number keys or click to choose. `DebugOverlay` is toggled with the backtick key; its keys (T time, U afternoon action, K save, L load, X delete save) only work while it's visible, and save/load are refused mid-conversation. Gotchas: children of a `scrollFactor(0)` container also need `scrollFactor(0)`, or input hit-tests are offset by the camera scroll. Always read `JustDown` every frame so presses don't queue while input is blocked. Dev builds expose the game as `window.__game` for console debugging.

- **2026-09-29 — Core systems** (`src/systems/`, no Phaser imports, unit-tested in `tests/`).
  - **StoryBridge** is the only code that touches inkjs. It never caches variable values. Getting or setting an undeclared variable throws, which catches typos. Variable names are read from the compiled JSON's `global decl` because inkjs has no public API for this. Observers also fire after `loadState` (ink itself doesn't do this). A failed `loadState` keeps the previous state. `nextLine()` returns `{ text, tags }`.
  - **Calendar** runs from `prologue` to day 7 × `morning | afternoon | evening | night`, starting on the prologue morning. Every day, including the prologue, has all four slots; the game decides which to skip. Day 1 has unlimited afternoon actions, other days have `AFTERNOON_ACTIONS_PER_DAY` (2). `advance()` returns false at day 7 night.
  - **SaveSystem** writes one localStorage key (`clipped-wing:save`) holding `{ version, savedAt, calendar, ink }`, where `ink` is ink's own state JSON. `SAVE_VERSION` is currently 1. It never throws: failures come back as `unavailable | missing | corrupt | outdated | write-failed`. Storage is injectable for tests.
  - **SymbolMatcher** compares guesses after normalising them (lowercase, strip punctuation and apostrophes, drop a/an/the) and applying a simple suffix stemmer to both the guess and the accepted words. Irregular forms ("saw") must be listed explicitly. Wrong attempts are counted per symbol, with `NUDGE_AFTER` = 2, `HINT_AFTER` = 4 and `AUTO_SOLVE_AFTER` = 6. Blank guesses don't count. The glossary answer is the player's own words, or the first accepted word if auto-solved.

- **2026-09-29 — Ink pipeline.** `scripts/ink.mjs` compiles `story/main.ink` (plus its INCLUDEs, resolved relative to `story/`) with inkjs's own compiler (`inkjs/full`). No external binaries. Output goes to `src/generated/main.ink.json`, which is gitignored and imported directly by the game so no runtime fetch or asset path is needed. A Vite plugin in `vite.config.ts` runs it at dev start, on every `.ink` change in dev (errors go to the terminal and Vite's browser overlay, and the last good JSON is kept), and at build (an error fails the build). Errors print as `story/file.ink:LINE  message`. The script is plain JS checked by TypeScript (`checkJs`). The root ink flow does nothing; the game starts conversations by knot name.
- **2026-09-29 — Scaffold.** Phaser 4.2.1, TypeScript 7.0.2 (native compiler, used only for `tsc --noEmit`; Vite strips types), Vite 8, Vitest 5, inkjs 2.4. Versions pinned exactly. Strict TS plus `noUncheckedIndexedAccess`. Rendering: fixed 1920×1080, `Scale.FIT` + `CENTER_BOTH` (letterboxed), `pixelArt: false`, Arcade physics. Vite `base: './'` so `dist/` works from any folder (itch.io). A Vitest test checks that `PALETTE` in `src/config.ts` matches the palette table above.
