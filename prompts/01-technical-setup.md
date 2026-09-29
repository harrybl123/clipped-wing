# Prompt 01 — Technical setup

Paste everything below the line into Claude Code, run from inside the `clipped-wing` folder.

---

You're helping me build **Clipped Wing**, a short 2D narrative mystery game for the browser. Before doing anything, read `CLAUDE.md` and `docs/design-summary.md` in this folder. They're the source of truth for the stack, principles and design.

## Goal of this session

Set up the technical foundation: a clean, well-structured Phaser + TypeScript + ink project that runs in the browser, with the core systems stubbed out and one tiny playable test scene proving everything is wired together.

This session is **plumbing, not content.** No real story, no real art. Placeholder shapes and obviously temporary text only.

## How to work

1. **Plan first.** Read the two files, check the current stable versions of Phaser, inkjs, Vite and Vitest on npm, then show me a short plan: the folder structure, package choices and versions, and how ink will be compiled. Wait for my go-ahead before writing code.
2. **Build in the milestones below, in order.** After each one: run `npm run typecheck`, `npm run test` and `npm run build`, fix anything that fails, then commit with a clear message.
3. **Verify, don't assume.** If something can't be verified in this environment (like how it looks in a browser), say so plainly and tell me exactly what to check.
4. **Keep it simple.** Prefer the smallest clean solution. No speculative abstractions for systems we haven't designed yet.
5. **Record decisions** in the "Decisions" section of `CLAUDE.md`, and keep its "Commands" section accurate.

## Milestones

### 1. Project scaffold
- Initialise git with a sensible `.gitignore` (node_modules, dist, compiled ink output if generated).
- Vite + TypeScript (strict) + Phaser.
- Scripts: `dev`, `build`, `preview`, `test`, `typecheck`, `ink`.
- Vitest configured for logic tests.
- Folder structure:
  ```
  src/
    main.ts            # creates the Phaser game
    config.ts          # game config, resolution, palette constants
    scenes/            # Phaser scenes
    systems/           # plain TypeScript game logic (no Phaser imports where avoidable)
    data/              # areas, characters, messages, symbols
    ui/                # reusable UI pieces (dialogue box, debug overlay)
  story/               # .ink source files
  public/assets/       # future art and audio
  tests/               # Vitest tests
  ```
- Game renders at a fixed internal resolution of 1920×1080, scaled to fit the window (letterboxed), with smooth (non-pixel-art) rendering.
- Palette constants in `config.ts`, matching `CLAUDE.md` exactly.

### 2. Ink pipeline
- `.ink` files in `story/` compile to JSON the game can load.
- Use the inkjs compiler (no external binaries), via `npm run ink` and automatically during `dev` (watch mode) and `build`.
- Clear, readable errors in the terminal when an ink file has a mistake.
- A placeholder `story/main.ink` that includes one test conversation with two choices and one variable (for example `suspicion`), clearly marked as temporary.

### 3. Core systems (logic only, fully typed, with unit tests)
- **StoryBridge** (`systems/StoryBridge.ts`): wraps inkjs. Start a knot, get the next line, list choices, pick a choice, read and write variables, observe variable changes, and save/restore ink state. Per `CLAUDE.md`, ink is the single source of truth for narrative variables.
- **Calendar** (`systems/Calendar.ts`): day (prologue, 1–7) and time slot (morning, afternoon, evening, night); advancing time; a limit on afternoon actions (unlimited on day 1, two per afternoon otherwise). Keep day content out of it; this is just the clock.
- **SaveSystem** (`systems/SaveSystem.ts`): save and load the calendar plus ink state to localStorage, with a version number so old saves can be detected. Must cope gracefully with missing or corrupt saves and with localStorage being unavailable.
- **SymbolMatcher** (`systems/SymbolMatcher.ts`): the logic for the decoding mechanic. Given a symbol definition with a list of accepted words, check a typed guess: case-insensitive, trims whitespace, ignores simple punctuation, and tolerates simple variations (for example "seeing" or "sees" for "see"). Track wrong attempts per symbol and report when to show a nudge, a stronger hint, or auto-solve (thresholds as named constants). No UI yet.

### 4. Scenes and a tiny playable test
- `BootScene` → `PreloadScene` → `TitleScene` (placeholder title "Clipped Wing" and "press any key") → `TestAreaScene`.
- **TestAreaScene**, a stand-in for the lower roots, using only placeholder shapes in the palette:
  - dark carved-wood background, a floor and one raised platform
  - a glowing tube: a tall cyan rectangle with a soft glow effect and a few drifting particles
  - a couple of small green glowing "fungi" and one amber lamp
  - a player (simple dark shape with a small red accent) with left/right movement and jump, using Arcade physics; keyboard controls (arrows/WASD + space), and the camera follows within world bounds wider than the screen
  - one NPC placeholder; walking up to it shows an "interact" prompt, and pressing E starts the test ink conversation
- **Dialogue box** (`ui/DialogueBox.ts`): shows lines and numbered choices from the StoryBridge; choose with number keys or mouse; player movement pauses while it's open.
- **Debug overlay** (toggle with the backtick key): current day, time slot, afternoon actions left, and live ink variables. Include keys to advance the time slot, save and load, so I can test the systems by hand.

### 5. Hosting readiness
- `npm run build` produces a self-contained `dist/` using relative asset paths, so it works when uploaded to itch.io.
- Add a short "Publishing to itch.io" note to `README.md` (zip `dist/`, upload as an HTML5 game).

## Acceptance criteria

- [ ] `npm install` then `npm run dev` starts the game with no console errors.
- [ ] Title → test area works; I can move, jump, follow the camera, talk to the NPC and make a choice.
- [ ] Making the choice changes the ink variable, and the debug overlay shows it.
- [ ] Save, reload the page, load: day, time slot and ink variables are restored.
- [ ] Editing `story/main.ink` while `npm run dev` runs recompiles it; a deliberate ink error shows a readable message.
- [ ] `npm run typecheck`, `npm run test` and `npm run build` all pass.
- [ ] Unit tests cover StoryBridge, Calendar, SaveSystem and SymbolMatcher.
- [ ] `CLAUDE.md` Commands and Decisions are up to date, and work is committed in logical steps.

## Out of scope for this session

The map screen, real areas, real story or dialogue, the decoding UI, night set pieces, portraits, audio and real art. We'll do those in later sessions.

When you're done, give me a short summary: what was built, what I should test by hand, anything you couldn't verify, and what you'd suggest for the next session.
