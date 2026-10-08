# Sequence plan: Chapter 2, Part 1: Scraping by (Days 1–2)

Day 1 built 2026-10-07 (`story/borderland/chapter2-day1.ink`; dev `?chapter=2`); Day 2 still to build. **(doc)** = [the design doc](../../chapter-2-design.md); **(designer)** = decided in conversation; **(suggestion)** = Claude's proposal. Part of [the chapter's structure](../../chapter-2-story.md).

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

### Day 2: the dog

| Time | Where | What happens | Objective shown |
| --- | --- | --- | --- |
| Morning | Your shack, the scrap stacks | Your brother begs to come; you say no. The old scavenger warns you off the sunk town: rich, but people don't come back | "Go to the sunk town" |
| Afternoon | The sunk town | Down through its rooms (already built: the dome, the stairwell, the screen room, the long room, the box hall, the camp, the bright room). At the bottom, stragglers have something cornered: **a dog**, which you've only heard of, and which they mean to eat. You fight them; partway through, the dog joins in (its first fight, as a guest) | "Go deeper" |
| Afternoon | The sunk town, on the way out | **The dog choice (medium):** keep it, sell it or eat it, alone with it, hungry. Eat: you can't; you're not a monster. Sell: you take it to the swap yard, but it slips its rope and is waiting at your door when you get home (or your brother finds it first and won't let it go). Every way, you keep it | — |
| Evening | Your shack | **Home to your brother.** He's overjoyed. You hide it under the floor and make him promise not to tell anyone (he can't keep a secret). Skip the tally house tonight, or go and hide what you're carrying | "Hide the dog" |
| Night | Your shack → the dog's hollow | The dog won't settle; it gets out and you follow it to a hollow on the outskirts, its old den (`found_dog`: the hollow appears on the map). There it digs something up: the first sign of what it can do | "Follow the dog" |

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
- **The thin straggler:** Shank; **Grit** (dirt in your eyes: for 2 rounds, dodging is harder); Snatch (grabs for your satchel).
- **The big straggler:** Club; Heave, then Crush (a wind-up: guard, or Sweep him).
