# Clipped Wing

A 2D narrative mystery game for the browser, built with Phaser, TypeScript and ink, with Claude Code. Designed by Harry Breeze-Lamb.

Act 1 follows a thumbless woodcarver in a vast tree whose people worship a glowing tube; Chapter 2, a scavenger in the borderland outside it; Chapter 3, a prince in the capital that governs them both.

## Running it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Where things are

| Path | What it is |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to set up, make a change, and open a pull request |
| [CLAUDE.md](CLAUDE.md) | What Claude Code reads every session: the stack, the rules for working on the game, commands, and every decision so far |
| `docs/` | The design: [design summary](docs/design-summary.md), each chapter's design, world and story docs, area briefs (`docs/areas/`), day-by-day plans (`docs/sequences/`) |
| `src/` | The game: scenes, systems, data (areas, combat, messages) and UI |
| `story/` | The story, in ink |
| `tests/` | Unit tests (`npm test`) |
