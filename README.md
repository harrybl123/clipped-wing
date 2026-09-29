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

## Publishing to itch.io

(Claude Code will fill this in during setup.)
