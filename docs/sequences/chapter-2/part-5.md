# Chapter 2, Part 5: The fall (Day 11)

Plan agreed with the designer (2026-10-13): **(designer)** = decided in conversation; the rest is **(suggestion)**.

## Decided
- **The brand is at the tally house, at first light, in front of everyone.** (designer)
- **Someone lets you out, depending on who you've helped; if nobody, the boss's son.** (designer)
- **Your brother:** at the compound, he's clearly been manipulated; at home, he's held hostage. (designer) Either way you leave without him. (design doc)
- **Everyone understands why the boss did it, by the end.** (designer)
- **The end is an escape towards the woods**, to build a new life in the wilderness: you leave uneasy, unsure where life will take you. (designer)
- **Each ending has its own fight, with different people beside you.** (designer)
- Order: the brand at dawn, locked in the cellar until dusk, let out in the day, Peggy and the rubbing, big choice 3 (the last act), out past the tree's edge at dusk. (designer: sounds good)

## The day (Day 11)

1. **First light, the tally house: the brand.** In front of everyone. Your brother at the boss's side, parroting him (compound), or not there: the boss, quietly, "He's being seen to. He'll stay seen to, as long as you're quiet" (home: a hostage). Your friend in the crowd (reported: "traitor"; covered: she can't look). The old scavenger at the back. The brand on your wrist. The sentence: walked out past the tree's edge at dusk, like the girl before you. Back down to the cellar.
2. **The cellar** (a new room under the tally house): you and the son, in the dark, the noise of the yard overhead. **Who lets you out**, everyone you've earned, in turn: the watcher (`watcher_ally`: the other key), your friend (covered: up the drain), the gambler (helped: picks the lock); or, if nobody comes, the son, who knows his father's house: the old drain under the scale room. Out into the stacks.
3. **The hollow: Peggy**, with the rubbing in its teeth.
4. **Big choice 3** (design doc), each only if your choices allow it, each explained in a second box:
   - **Save the girl** (needs: you let the scout go). Over the line to their camp, with the scout, to get the boss's daughter out. **Fight: the camp's guards** — beside you: **the dog and the scout**. The boss is freed of their hold; both clans are angry.
   - **End the conflict** (needs: the watcher with you, and the other clan's trust). The rubbing to the watcher; the tally house, in front of both clans under a truce flag. **Fight: the boss's loyal circle**, when he won't go quietly — beside you: **the dog and the watcher**. The truce is sealed, and the price is the dog: both clans see it, and everyone wants it.
   - **Keep it raging** (anyone). Throw the rubbing to the crowd and let them have him; the clans go to war. **Fight: out through the riot in the yard** — beside you: **the dog and the son**.
5. **The why, for everyone:** cornered, in every ending, the boss says it himself: his daughter, the truce, the choice your clan's old ones forced on him.
6. **Your brother at the end:** at the compound, he stays (with the boss, or whoever's left); at home, he's freed but too hurt to travel, and the old scavenger takes him in; you promise to come back.
7. **Dusk, the tree's edge:** you and the dog, past the warning signs, along the roots, to where the waste gives way to the woods. Uneasy; no idea where it goes. **End of Chapter 2.**

## As built
- `story/borderland/chapter2-day11.ink`; the calendar runs to Day 11; Day 10 ends with the card "First light", waking in the tally house.
- **The cellar** (`tally-cellar`): a room inside the tally house you're only taken to (no doors); the hatch, the drain. Let out by the watcher (`watcher_ally`), your friend (covered), the gambler (helped him at the den), or else the son, in that order.
- **Big choice 3** (`last_act`), each option explained in a second box, each only where your choices allow it:
  - **Save the girl** (`scout_friend`): the scout at the dip, under the fence, the hut past the cairn; `camp_guards` (you, the dog, the scout); his daughter; her father at the fence, and the why.
  - **End the conflict** (`watcher_ally` and `rival_trust` ≥ 1): the rubbing to the watcher at the compound; the tally house at dusk before both clans; `loyal_circle` (you, the dog, the watcher); the why; the dog shown to everyone to seal the truce.
  - **Keep it raging** (anyone): up on the crates in the yard at dusk, the rubbing thrown to the crowd; the why, shouted; the other clan's horns; `riot` (you, the dog, the son).
- All three fights must be won (`mustWin`).
- **The tree's edge at dusk:** your brother comes after you and won't come (compound), or the old scavenger has him, his leg broken (home); then the woods, and the ending card (`c2_girl`, `c2_truce`, `c2_war`, "End of Chapter 2"; try again from Day 11).
- Dev: `?chapter=2&day=11`, `&at=cellar|hollow|choice|edge`, `&last=girl|truce|war`, `&watcher=2`, `&scout=turned_in`, `&brother=compound`, `&friend=reported`.

