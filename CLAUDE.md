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
- `npm run typecheck` — TypeScript check (`tsc --noEmit`)

## Conventions

- Scenes in `src/scenes/`, systems in `src/systems/`, data in `src/data/`, ink in `story/`.
- British English in all player-facing text.
- Keep this file current: when an architectural decision is made, record it under "Decisions" below.

## Decisions

(Record decisions here as they're made, newest first.)

- **2026-09-29 — Scaffold.** Phaser 4.2.1, TypeScript 7.0.2 (native compiler, used only for `tsc --noEmit`; Vite strips types), Vite 8, Vitest 5, inkjs 2.4. Versions pinned exactly. Strict TS plus `noUncheckedIndexedAccess`. Rendering: fixed 1920×1080, `Scale.FIT` + `CENTER_BOTH` (letterboxed), `pixelArt: false`, Arcade physics. Vite `base: './'` so `dist/` works from any folder (itch.io). A Vitest test checks that `PALETTE` in `src/config.ts` matches the palette table above.
