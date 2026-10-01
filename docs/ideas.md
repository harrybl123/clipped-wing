# Ideas and parked decisions

Things discussed but deliberately not built yet. Not decisions; revisit when the time comes.

## Title and menu flow (parked 2026-09-30)

The current title screen is visual only. When menus are built for real, consider:

- **Items:** Continue (only if a save exists) / New Game (confirm before overwriting) / Settings / Credits. No Quit (browsers can't close tabs). No Load screen.
- **Saving:** one autosave slot, written at each new time slot. Replays for the three endings could come later from a chapter select.
- **Settings to start with:** fullscreen (important on itch.io), text speed, text size. Volume once there's audio. Reduced motion is worth considering.
- **"Press any key" gate:** keep it. Browsers block audio until the player interacts.
- **Pause menu** on Esc: resume, settings, return to title.
- **Feel options:**
  - A diegetic title: inside the trunk, looking up the tube towards the white Canopy.
  - A red carved bird as the selection cursor (red is reserved for birds and the protagonist).
  - Roots-dwellers can't read, so the menu text could look carved or pictographic, or be the one place "proper" writing appears. Designer's call.
- **Open questions:**
  - What does New Game lead into: straight into the prologue, or a title card first?
  - One autosave slot, or player-chosen saves?

## Map art (parked 2026-09-30)

The current map is a simple cutaway with lit windows. The designer shared a reference of a
detailed pixel-art treehouse world and then decided the simple version is fine for now. For the art
pass, consider taking its structure and feel (not its bright daylight colours):

- A gnarled trunk with bark, branches reaching the upper places, roots spreading into the dark.
- Each place as a tiny lit room carved into the trunk, a branch or a root, with a small scene
  inside (hearth at home, stairs and tube at the offering floor, stalls at the market, shelves in
  the archive, saplings in the seed grove).
- Ladders, walkways and rope bridges between rooms; amber lanterns hanging from branches, more
  of them higher up; green fungi glowing in the roots; the Canopy as white glare.

## Danger in the back routes and the trunk climb (noted 2026-09-30)

The designer wants both to become more dangerous when their sequences are built (Days 3/6/7 in
the back routes; Night 1 and the Day 7 chase on the trunk climb). Ideas to explore then:

- Real-time events: the environment crumbling (soft wood giving way, boards snapping, ledges
  breaking off behind you, a rope fraying on the slider or lift), falling debris, drips turning to
  collapses.
- Combat or confrontation (the design doc already has a short real-time fight on Day 4: dodge,
  shove, grab; you can't make a proper fist), or being caught and chased.
- Ties to the weak grip (no thumb) and the rot (worse the deeper you go).

## The accident: thumb and index finger (noted 2026-09-30; confirmed, now in the design doc)

The designer is thinking that in the prologue the accident takes the protagonist's **left thumb and
index finger**, not just the thumb (the design doc and summary still say "thumb"; update them if
this is confirmed). The sprite's bandaged hand is already the left (near) hand when facing right;
the art pass could show two missing digits, and the carving flaw and the weak grip would follow from
it.

## To fix (noted 2026-10-01, from the designer's Day 3 playtest)

- **The rot drips in the back routes are too fast to get past** (the drip curtain down the first
  shaft, `drips` feature in `src/data/areas/backRoutes.ts`). Slow them down: a longer interval between
  bursts (`every`), and maybe fewer drops per burst or a slower fall.
- **Your friend shouldn't shun the girl from the lower roots.** People who live only just above the
  lower roots should be genuinely kind to them: a bit of scorn is fine, but not hatred. Soften his
  reaction at the window on Day 3 (`day3_window` in `story/day3.ink`: "He looks from her to you as if
  he doesn't know you any more"), and keep this in mind for how roots folk talk about the lower roots
  everywhere.
