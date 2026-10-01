# Sequence plan: Day 7, The Mob

Built 2026-10-01 (`story/day7.ink`, the cell's knots in `story/shrine-cell.ink`; message 6 and the
caged-bird plate in `src/data/messages.ts`; the cell is `src/data/areas/shrineCell.ts`; the chase is
the `mob` feature in the trunk climb, middle tiers, upper halls and gate; the endings are in
`src/scenes/EndingScene.ts`). Dev: `?day=7` (in the cell) or `?day=7&girl=blamed` (at home), with
`&at=evening`, `&at=night`, `&at=chase` or `&at=fall`; `&lied=1` if you lied to your friend. Claude's
calls are under "Build shape" at the end. In custody you have no plate (the guards have it, or it's at
home), so you scratch your picture on a sliver of the wood instead.
After the designer's first playthrough: the guard speaks for himself (by situation, and if you try the
door) and steps out while your friend is at the grate; the cage rises right out of sight; "can" is a
tick (the opposite of "can't"'s cross) and "must" a great hand shoving someone on (designer: the hand and
"!" didn't read); the spiral stays for "martyr" (designer: clever, and the answers are generous); long
replies on the decoding screen wrap; the fork is weightier (the room dims, a beat on what each way
means); on the custody path the girl comes up with you and sees you off at the gate ("Farewell,
soldier", designer); the jump is a choice of its own, and you rise up the tube on screen; the girl in
the rot is hostile; daylight comes in as a shaft from a crack in the wall (`#daylight`).

A plan for the designer to mark up before it's built. **(doc)** = design doc; **(designer)** = decided
in conversation; **(suggestion)** = Claude's proposal. Dialogue here is a sketch; the full draft comes
once the shape is agreed. The last day of Act 1.

## What the design doc asks for
- Morning: you send your bird in a cage. **(doc)**
- Evening: message 6. The plate shows a bird rising up the tube among eyes, two paths out, and the
  master's spiral carving (the spiral from the Ascension, Day 1). **(doc)**
- Night: the escape, a tube chase or a roots crawl. **(doc)**
- Big choice 3, the ending: jump into the tube (Act 1 ends as you rise), or refuse and be cast into
  the lower roots (Act 1 ends as natural light breaks in). **(doc)**
- Your friend: if you confided in him, he bursts in to warn you as the mob comes; if you lied, you
  glimpse him among the torches. Your last visits include him only if things are intact. **(doc)**

## Decided in conversation
- **Message 6's words:** "Clipped wing, make yourself a martyr. Fly if you can, fall if you must. I will
  find you." **(designer)**
- **The caged bird is the elders' public trial:** your bird goes up at the morning rite locked in a
  cage, in front of everyone. "If the Tree takes it, the carver is clean. If it comes back, we'll know
  what the carver is." Your reply is still hidden inside it. **(designer; Claude's suggestion,
  accepted)**
- **You still have to get your offering up, either way:** at home under guard (you blamed the girl),
  or carving in custody (you saved her). **(designer)**
- **Message 6 gets no reply:** your answer is what you do that night. Jump into the tube (fly), or
  refuse and be cast into the lower roots (fall). "I will find you" holds either way. **(designer)**
- **Custody lasts all day** (if you saved the girl): you stay locked in the shrine's back room while
  people come to you, depending on the choices you've made about them. **(designer)**
- **Both endings are possible from both paths** (custody or home). **(designer)**
- **If you choose to fly, you're chased to the very top** (up to the Ascension gate and the tube).
  **(designer)**
- **The choice is a fork in the escape:** the girl asks you where you want to go. **(designer)** Up
  (fly) is the chase to the top; **down means you turn yourself in**, and they cast you into the lower
  roots (the doc's "refuse and be cast into the lower roots"). **(designer)** On the home path, with no
  girl there, it's your friend who asks (if you confided), or you choose alone at the same fork.
  **(suggestion)**
- **The chase to the top is platforming** (real-time, the mob behind you). **(designer)**
- **Mum's fate stays ambiguous**, for tension into Chapter 2: she's lost in the chaos when the mob
  comes, and you don't know what becomes of her. **(designer)**
- **The custody carving is the normal carving.** **(designer)**
- **Who comes with you (suggestion, accepted for now):**
  - **Fly:** alone. The girl (custody path) gets you to the foot of the climb and stays behind to slow
    the mob ("Go on. One of us should see what's up there."). Your friend, if you confided, helps on
    the way up (a door held, a guard distracted); if you lied, he's in the crowd below.
  - **Fall:** alone. You give yourself up, and they throw you down. If you saved the girl, she can't stop
    it (she might come after you in Chapter 2). If you blamed her, you find her down there in the
    lower rot, and the Act ends with the two of you, on bad terms, as natural light breaks in.

## The two ways the day starts (suggestion)

| | In custody (you saved the girl) | At home under guard (you blamed her) |
| --- | --- | --- |
| Morning | They bring wood and a knife to the back room. You carve under a guard's eye: hide the plate inside without him seeing | You carve at your bench with a guard at the door; he walks you to the rite |
| The rite | Marched out to the offering floor: the cage, the trial | The same |
| Afternoon | Back in the cell. Visitors, by your choices: Mum (always); the archivist (if he's your ally); your friend (if you confided) | Free to move, in your cloak, under watch: goodbyes, by your choices. The girl is in the lower rot (on bad terms) |
| Evening | The caged bird comes back, with message 6. The roots turn into a mob | The same |
| Night | The mob comes for the shrine. The girl gets you out through the floor grate into the back routes | The mob comes for your house. Your friend bursts in to warn you (if you confided), or you glimpse him among the torches (if you lied). Out through the rot gap |
| The end | The tube (chased to the top) or the lower roots | The same |

## Beats (suggestion)

### 1. Morning: your reply, and the cage
- Your plate: a bird in a cage ("I'm trapped"), one fixed picture like Day 6's.
- **In custody:** a new twist on the carving: the guard watches. The hollowing and sealing have to be
  done when he looks away (a timing game: work while his back is turned).
- **The rite:** the whole roots on the floor, hungry and silent. The elders put your bird in a little
  cage and hang it in the tube's mouth. "If the Tree takes it, the carver is clean." It goes up.

### 2. Afternoon: the last visits
- **In custody:** visitors at the cell door or through the floor grate.
  - Mum (always): the goodbye; what she says depends on your dialogue style and what's happened to her.
  - The archivist (if he's your ally): frightened, but he came. Maybe something he found in the
    records (the spiral?).
  - Your friend (if you confided): through the grate, from the back routes.
- **At home:** in your cloak, you can go to people while there's still time.
  - Mum, at home.
  - Your friend's window (if you confided; if you lied, he won't come to it).
  - The archivist (if he's your ally), through the trunk climb's hatch.
  - The boy (he could come back here: selling you out, or helping for a price; `docs/ideas.md`).
- People you've lost (the girl if you blamed her, your friend if you lied) aren't there to say
  goodbye to.

### 3. Evening: the cage comes back, and message 6
- The tube goes dark. The cage drops into the basin, and your bird is still in it. The trial's answer.
- The mob: not a crowd any more. The hunger, the blame, the preacher's words, all at once.
- Message 6, decoded: "Clipped wing, make yourself a martyr. Fly if you can, fall if you must. I will
  find you." The pictures: a bird rising up the tube among eyes; two paths out; the master's spiral.
  (Where you decode it depends on the path: in the cell, or at home before the mob comes.)

### 4. Night: the escape, and the choice
- **In custody:** torches outside the shrine; the girl comes up through the floor grate. "Told you I'd
  owe you."
- **At home:** your friend at the window ("They're coming. Now."), or his face among the torches.
- **Fly:** chased up through the tree to the very top: the middle tiers, the trunk climb, the upper
  branches, the Ascension gate. The mob behind you all the way. You jump into the tube, and Act 1
  ends as you rise.
- **Fall:** down through the back routes and the lower roots into the rot (with the girl, if you
  saved her; and if you blamed her, you find her down there, on bad terms). Act 1 ends as natural
  light breaks in.

## Open questions
None for now: all answered (above). Small calls during the build are Claude's, marked (suggestion).

## Build shape (suggestion; Claude's calls during the build)
- **Text:** `story/day7.ink`, stages in `day7`: wake, carve, rite, visits (custody) or goodbyes (home),
  evening, open, mob, chase, fall, done. Draft lines throughout, for the designer to rewrite.
- **Waking somewhere else:** Day 6's save ends with `#wake:shrine-cell:…` before `#endday`, so Day 7
  starts in the cell. Retrying Day 7 after an ending starts in the same place.
- **The cell** (`shrine-cell`, off the map like her home): a small back room behind the shrine with a
  bench (the wood and knife), the guard's stool, a locked door, and a grate in the floor. Visitors come
  one after another (Mum, then the archivist if he's your ally, then your friend at the grate if you
  confided), then the guard takes you to the evening ceremony.
- **Your plate:** a bird in a cage ("I'm trapped"), one fixed picture (`#plate:caged`, `reply5`).
- **The trial:** at the morning rite the cage hangs in the tube's mouth and goes up; at the evening
  ceremony it comes back down with the bird still in it, and the crowd becomes a mob. The Tender hands
  you the bird as always ("It always comes back to you").
- **Message 6:** two rows. *clipped · wing · make yourself a martyr (the master's spiral) · fly · if
  (a fork: two paths) · can (a whole hand)* / *fall · if · must (a stroke and a dot) · I · will find
  (an eye, a trail and a mark) · you*. Six new pictures: martyr, if, can, fall, must, find.
- **Home path:** a guard on your door. You carve at your bench, he walks you to the rite and back, and
  in the afternoon you slip out the rot gap in your cloak for goodbyes: Mum at home, your friend's window
  (if you confided), the archivist (if he's your ally). Talk to the guard when you're ready for the ceremony.
- **The mob** (`mob` feature): a crowd with torches that follows the exact path you took through an
  area (so it works for stairs, ledges and lifts alike), starting a few seconds after you arrive and
  walking a little slower than you run. Stop too long and they catch you: you're thrown back to where
  you came in, and they start again. On in the trunk climb, middle tiers, upper halls and the gate
  while `chased`.
- **The chase route:** the shrine's back stair → the trunk climb → the middle tiers → the upper halls
  → the Ascension gate (the archive hatch is barred tonight). From home you go out through the rot gap and
  up through the shrine's grate first. The gate guards have gone down to join the mob.
- **Your friend on the way up** (if you confided): at the guard post in the middle tiers, sending the
  guard the wrong way (a `trigger`: a knot that plays once when you reach a spot).
- **Fall:** you walk out to the torches; they drag you down and throw you into the rot. You walk towards
  the far end (the girl is down here if you blamed her), and natural light breaks in.
- **Endings** ("Fly if you can." / "Fall if you must."): words on black, "End of Act 1", then try
  again from Day 7 or the title.
- **Left for later:** the boy's return (`docs/ideas.md`).
