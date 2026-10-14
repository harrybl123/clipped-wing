# Working on Clipped Wing

Clipped Wing is Harry's game. Harry designs it (the story, the characters, the world) and decides what goes into `main`. You work on your own branch, open a pull request, Harry tries it, and merges it when it's right.

## Getting set up

You need [Node](https://nodejs.org) 22.12 or newer, Git, and [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/harrybl123/clipped-wing.git
cd clipped-wing
npm install
npm run dev
```

Then open http://localhost:5173. `npm install` also switches on a small check that stops you pushing to `main` by mistake.

**Playing without playing through:** the dev server has shortcuts. A few:

- `http://localhost:5173/?area=<id>` opens any area directly (`?area=picked-fields` for Chapter 2's borderland, `?area=prince-quarters` for Chapter 3's capital). M opens the map anywhere.
- `?day=3` starts Act 1 on that day; `?chapter=2` starts Chapter 2 (`&day=5` and so on).
- Press the backtick key for the debug overlay: T moves the time of day on.
- `gallery.html` shows every sprite and portrait; `soundboard.html` plays every sound.

The full list is under **Commands** in [CLAUDE.md](CLAUDE.md).

## Using Claude Code

Start Claude Code in the folder (`claude`). It reads [CLAUDE.md](CLAUDE.md) at the start of every session: the stack, the rules for working on this game, and every decision made so far. Read its **Working together** section yourself too.

Good first asks: "play me Chapter 2's Day 1 in the browser", "explain how areas are built", "what's left to do in docs/ideas.md?".

## Making a change

1. **Start from the latest main:** `git checkout main && git pull`.
2. **Make a branch** named after you and the change: `git checkout -b sam/promenade-signs`.
3. **Make the change.** Small, verified steps: after each, `npm test` and `npm run build`. Commit as you go with clear messages.
4. **Push your branch and open a pull request:** `git push -u origin sam/promenade-signs`, then `gh pr create` (or ask Claude Code to do it). Fill in the template, especially **How to try it**: the dev links that show your change.
5. **The checks run** on GitHub (tests and a build). Fix anything red.
6. **Harry tries it and merges it,** or asks for changes on the pull request.

Keep each pull request to one thing, so it's quick to try. If `main` moves on while you work, bring your branch up to date with `git pull origin main` (or ask Claude Code to).

**Story and design are Harry's.** Proposals are welcome, marked **(suggestion)**, but don't write real story, change a character, or settle a design question in a pull request without agreeing it with Harry first.

## Trying a pull request (for Harry)

Ask Claude Code: "try pull request 12" (it'll check it out and start the game), or yourself:

```bash
gh pr checkout 12
npm install
npm run dev
```

Then play it from the links in the pull request. To approve and merge: `gh pr review 12 --approve` and `gh pr merge 12 --squash`, or the buttons on GitHub. `git checkout main && git pull` takes you back.
