# Clipped Wing

A short 2D narrative mystery game for the browser, built with Phaser, TypeScript and ink, using Claude Code.

## What's in this folder

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Project context Claude Code reads at the start of every session: stack, principles, palette, commands, decisions |
| `docs/design-doc.md` | The full design doc (Act 1) |
| `docs/design-summary.md` | A condensed, build-focused version of the design |
| `prompts/` | Numbered prompts to paste into Claude Code, one per build session |

## How to use it

1. Put this folder where you keep your projects, and open a terminal in it.
2. Start Claude Code in the folder (`claude`).
3. Open `prompts/01-technical-setup.md`, copy everything below the line, and paste it in.
4. Review Claude Code's plan before letting it build, then test what it made by hand.
5. After each session, add the next prompt to `prompts/` (02, 03, …).

## Build order (rough)

1. Technical setup (this prompt)
2. Art test scene of the lower roots
3. Map and moving between areas
4. Day loop: offerings, the evening ceremony, the food store
5. Decoding screen
6. Day 1 and the prologue, with real story in ink
7. Night set pieces, one at a time
8. Days 2–7

## Running it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Press any key on the title, then use arrows/WASD to move, Space to jump and E to talk. The backtick key (`` ` ``) opens the debug overlay. See `CLAUDE.md` for all commands.

## Publishing to itch.io

1. Run `npm run package`. It type-checks, builds into `dist/`, and zips the *contents* of `dist/` into `clipped-wing.zip`, so `index.html` sits at the top of the zip (itch.io needs this).
2. On itch.io, create a new project (or edit the existing one) and set **Kind of project** to **HTML**.
3. Upload `clipped-wing.zip` and tick **This file will be played in the browser**.
4. Under **Embed options**, set the viewport to 1920 × 1080 or 1280 × 720. The game scales to fit and letterboxes, so any 16:9 size works. Tick **Fullscreen button**.
5. Save, then open the page to test it. Use **Draft** or **Restricted** visibility until you're ready to go public.

The build uses relative asset paths (`base: './'` in `vite.config.ts`), so it works from itch.io's subfolder and from any other static host. Saves use the browser's localStorage, which works inside itch.io's iframe. If a browser blocks storage, the game still runs; it just can't save.
