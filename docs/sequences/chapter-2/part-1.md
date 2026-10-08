# Sequence plan: Chapter 2, Part 1: Scraping by (Days 1–2)

Day 1 built 2026-10-07 (`story/borderland/chapter2-day1.ink`; dev `?chapter=2`); Day 2 built 2026-10-08 (`story/borderland/chapter2-day2.ink`; dev `?chapter=2&day=2`). **(doc)** = [the design doc](../../chapter-2-design.md); **(designer)** = decided in conversation; **(suggestion)** = Claude's proposal. Part of [the chapter's structure](../../chapter-2-story.md).

## What we have so far
- A nobody on the picked fields, feeding your brother. Tribute night shows how the town runs. You find the dog. **(doc)**
- The opening is you scavenging, and trouble from stragglers from elsewhere. **(designer)**
- The first couple of days include bringing the dog home to your brother. **(designer)**
- The dog choice (keep, sell, eat) always ends with you keeping it; eat: you're not a monster. **(designer)**
- The dog fights. **(designer)**

## The shape of the part (suggestion)

### Day 1: scraping by (built)
Opens with her scavenging, not waking at home (designer: Act 1 did that). Stragglers first, then the food crisis: they take your finds (designer).

| Time | Where | What happens | Objective shown |
| --- | --- | --- | --- |
| Morning | The picked fields | Hundreds of pickers in the same dirt. Dig anywhere (designer: search it yourself, no markers): three finds, given away only by a glint in the dirt now and then (a coil of wire, a ring of pale casing, a cube of glass with a light inside); each comes up out of the ground where you can see it | "Dig for finds" |
| Morning | The picked fields | **Stragglers** stand over you at the third find. The fight (no tutorial in Chapter 2: designer). Win or lose, the third one runs off with your finds (the strap cut) | — |
| Afternoon | The picked fields, the swap yard | Your friend saw them go. Your brother, at the yard: he gives you his light (the one thing in his collection that glows) to trade | "Find your brother" |
| Afternoon | The swap yard | The food trader gives you two bowls for it | "Trade for food" |
| Evening | The tally house | **Tribute night.** You're short; the enforcer grabs you; the boss lets you off, kind and frightening at once: "Next week, you bring double" (`owe_double`). The watcher never takes his eyes off you **(suggestion: it's her who's short, not someone else, since she's lost everything)** | "Pay your tribute" |
| Night | Your shack | His bowl by his pillow. Nobody brings double off the picked fields; the sunk town | "Go home" |

### Day 2: the dog (built)

| Time | Where | What happens | Objective shown |
| --- | --- | --- | --- |
| Morning | Your shack | Your brother: "double, double" in your sleep; ask the old man at the stacks. He wants to come; no | "Ask the old scavenger" |
| Morning | The scrap stacks | The old scavenger: nothing on the fields since before you were born; the sunk town, past where the rope stops; nobody goes deep twice; smoke coming up the stairwell, nights | "Go deep into the sunk town" |
| Afternoon | The sunk town | At the top, a dog barking far below (there aren't any dogs). No marker from there: the bark is your guide **(suggestion)**. Through the crawl: **the stragglers' camp**, the same three, with a dog wired to a pipe, the fire going. You step in; the dog bites through the wire | — |
| Afternoon | The sunk town | **The fight: you and the dog** (designer: fight to save it) against all three. Win: they run and leave their pack (the wire and the ring back). Lose: the dog has the big one by the leg and you both run | — |
| Afternoon | The sunk town | **The dog choice (medium):** keep it; sell it (it slips the wire on the way, and is sitting in the shack with your brother when you get home); eat it (you pick up the knife, and put it down: you're not a monster, designer) | — |
| Evening | Your shack | **Home to your brother.** "Is that a real dog?" He names it with you: **Peggy, Luna or Bear** (designer). Nobody can know; he promises (he'll tell). Hide it under the floor | "Hide {name} under the floor" |
| Night | Your shack → the dog's hollow | It gets out; prints across the fields (`found_dog`: the hollow appears). Its old den; it digs up a pale disc with a light in it, in the time it takes you to catch up | "Follow {name}" |

### The gap: weeks later
Training the dog in the hollow: bury a find, the dog finds it. A short montage you play, then a card ("Weeks later"), into Part 2. **(suggestion)**

## What it needs built (suggestion)
- **Starting Chapter 2:** a chapter card ("Chapter 2", a title) after an Act 1 ending, and for now from the title and a dev link.
- **Chapter 2's calendar:** its own days with gaps between parts, and access per day (the deep ground and rival line closed in Part 1, the compound off limits, the hollow hidden until `found_dog`).
- **Digging:** search spots in the picked fields and sunk town that give finds, counted in ink (your haul), which you trade and pay tribute with.
- **Combat:** her own moves (a pry bar? she's quick and fit), stragglers as enemies, the dog as a party member, a tutorial on the stragglers fight (`teaches`).
- **The dog in areas:** following you (the `follow` feature), hidden under the floor at home.

## Decided
- **The chapter is called "On the Scent".** (designer)
- **It starts from Chapter 1's ending:** "Begin Chapter 2" on the endings that finish the chapter (designer). Dev: `?chapter=2`.
- **The dog:** stragglers have it cornered in the sunk town and mean to eat it; you fight to save it (designer).
- **Naming the dog:** Peggy, Luna or Bear (designer); the player picks **(suggestion: how we read it)**. Day 2.
- **Her weapon:** a staff of different-shaped cuboid pieces, like the one in Tenet (designer): mismatched blocks of scrap on a core, one with a cyan glint.
- **Unique abilities** for her, the dog and the opposition; nothing borrowed from Act 1 (designer: Rot-ink doesn't fit; unique to the scavenger).

## Fighters (draft numbers, to playtest)
- **The scavenger:** Jab (basic); Sweep (takes their legs: off balance, interrupts a wind-up); Rattle (3 blows, building); **Brace** (4 SP: the next blow on her, a good dodge parries it and she hits back; designer: it was a little OP). She can parry from the start.
- **The dog** (Day 2): Bite (basic); **Sniff** (shows every enemy's real move this round: no feints); Worry (bites and hangs on: 2 hits).
- **The small straggler** (Day 2, the one who cut your strap): Pelt (two bits of thrown scrap); **Pinch** (into your things: takes 3 SP).
- **The thin straggler:** Shank; **Grit** (dirt in your eyes: for 2 rounds, dodging is harder); Snatch (grabs for your satchel).
- **The big straggler:** Club; Heave, then Crush (a wind-up: guard, or Sweep him).
