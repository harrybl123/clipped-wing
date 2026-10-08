# Sequence plan: Chapter 2, Part 2: The rise (Days 3–6)

Built 2026-10-08 (`story/borderland/chapter2-day3.ink` to `chapter2-day5.ink`; dev `?chapter=2&day=3|4|5`). **(doc)** = [the design doc](../../chapter-2-design.md); **(designer)** = decided in conversation; **(suggestion)** = Claude's proposal. Part of [the chapter's structure](../../chapter-2-story.md). Draft text throughout.

## Decided
- **"Weeks later" lands on tribute night:** you pay double and more, and the boss notices. **(designer accepted the suggestion)**
- **The dog is a way of playing:** on the grounds it runs ahead, sniffs, and digs where something is; you follow it to finds (the `seek` feature). **(designer accepted)**
- **Days needn't start at home:** Day 3 starts at the hollow, Day 4 at the compound's gate, Day 5 out on the fields. **(designer)**
- **The dog has its own speech box:** a portrait, its name once it has one, and its own sounds (bark, growl, whimper, sniff) for its lines. **(designer)**
- "You know the answers; we can do this over multiple days." **(designer)** The rest is Claude's, below.

## Day 3: weeks later (suggestion)

| Time | Where | What happens | Objective |
| --- | --- | --- | --- |
| Dawn | The dog's hollow | Weeks of training before light. Two things buried; it finds them (`seek`) | "Let {name} find what you buried" |
| Day | The sunk town | No marker inside: its nose is the guide. It runs ahead and digs: a lens in the long room, a sealed box in the hall, a cable in the tunnel. Then you send it back to the hollow | "Work the sunk town with {name}" |
| Evening | The tally house | Four times the tribute. The tallyman stops writing: "Where?" The boss: "Look who's found her feet. Come up to the house tomorrow." The watcher looks a moment longer | "Pay your tribute" |
| Night | Your shack | Your brother's heard from the kid. "I said it was rats. Is a dog like a rat?" | "Go home" |

## Day 4: the compound (suggestion)

| Time | Where | What happens | Objective |
| --- | --- | --- | --- |
| Morning | The compound's gate | The enforcer: "Four times the tribute, off ground that's been picked clean. Funny, that." | "Go in" |
| Morning | The boss's house | Bread. "You've a gift. I don't ask how." His circle, his table; **you tell him where you dig, and when** (`in_circle`: the design doc's setup for the frame). **Big choice 1:** bring your brother to live here (`brother_choice`) | "See the boss" |
| Afternoon | The swap yard | Tell your brother: he packs his collection and goes (`brother_moved`; he's at the boss's table from then on, not at home), or he sulks and takes your hand anyway | "Tell your brother" |
| Evening | The bar | The circle. The boss's son: "Let's see some luck." **Sparring** (`son_spar`): his Cheap shot, Showboat into a Big swing, and a Breather when he's losing. The boss sends you to dig the far fields tomorrow, "to be seen". The watcher: "Where do you dig, when you're not where you say?" | "Meet the circle at the bar" |
| Night | Your shack | Empty without him, or silent with him | "Go home" |

## Day 5: the first raid (suggestion)

| Time | Where | What happens | Objective |
| --- | --- | --- | --- |
| Morning | The picked fields' far end | Digging for show beside the old scavenger. "I'm not going to ask. Somebody will." | "Dig beside the old scavenger" |
| Morning | The picked fields | **The raid** (design doc: a story beat): three of the other clan over the rise; the pickers run; they're looking at you. **You and the old scavenger fight** (`first_raid`). "How did they know we'd be here?" He looks at you and says nothing. Then "A month on" | — |

## Fighters (draft numbers)
- **The boss's son:** Cheap shot (feints often); **Showboat** into Big swing (a wind-up: guard or Sweep him); **Breather** (heals himself when he's losing).
- **The old scavenger** (with you on the raid): Hook (basic); **Yank** (hooks a staff or a leg: knocks raiders off balance, interrupts a wind-up); **Patch up** (heals you both).
- **Raiders:** Thrust; Whirl (two blows); weak to grabs. **Their leader:** **Mark** (picks you out: you take more damage for 2 rounds), Thrust, Whirl.
- New rules: `heals` / `healsSide`.

## After the playtest (designer)
- **The text matches the screen** (designer: the boxes weren't corresponding to what's happening): tribute night's crowd is there from the evening, not when you reach the counter, and there are more of them; the enforcer steps aside; your brother runs off to pack; at the bar, the crews pull back to make a ring.
- **The sunk town's big drop is gone** (designer: clunky and awkward): the deepest level is down the stairwell.
- **An invitation to the bar** (designer: there seemed to be none): the boss says it plainly ("Tonight, when the tally's in, my circle drinks at the bar. You'll drink with us."), and walking in, the room goes quiet and he waves you over.
- **A build-up to the sparring** (designer: rushed and weird): the son asks where you go every morning, calls you a liar, shoves you into a table; you shove back or look to the boss ("Boys will be boys"); "Fists. Put the stick down"; you lean it on the counter ("Not near the bottles!"). **Fists only, no staff** (designer): `scavenger_fists`, her moves without it (Punch, Low kick, Combination, Read him). The son's knocked-down sprite keeps his colours (designer: he changed colour).
- **A build-up to the raid** (designer: too rushed, too little explanation): the old scavenger explains the other clan (pale wraps, long staves, their ground past the line), the truce ("Cost the boss something. More than he'll ever say."), the footprints at this end; they come over the rise walking, in daylight; the pickers run; their leader points at you ("Her. That's the one.") and calls out terms; stand with him, or try to run and find you can't leave him.

## Revised: getting to know the circle (designer)
(Designer: it made it obvious the boss was setting you up; the spar needed a reason, and the bettors should react; we need a way to build relationships with the boss and the crew, gambling with them, the brothel; the chapter felt rushed, but don't drag it out.)
- **Nothing points at the boss.** The board is routine: every night the watcher puts up where each of the circle is digging tomorrow ("Saves fights. Saves knives."), and anyone in the circle can read it (the enforcer does). The boss doesn't send you anywhere; the old scavenger asks you to his patch. The raiders are surprised to find anyone there ("Thought this end was empty"); afterwards: "Somebody's been telling them where's empty. Anyone can read the board."
- **The spar is a wager:** the son bets you'll tell the bar where you go every morning; if you win, he never asks again. The barkeep shouts odds; the bettors react over their heads after. Lose, and you tell the bar: the sunk town (true, not the whole truth) or the deep ground (a lie nobody believes). `told_where`.
- **Evenings with the circle:** after the spar, and on Day 5, you sit with one of them (`evening_free`): the boss (his father built the place; "I keep the line, and everybody eats"; "Everything worth having costs something"), the watcher (a straight answer earns respect), the enforcer (the last raid, his mother's season; "I don't do nothing now"), the son (a drink, or rub it in). Relationships counted for the endings: `boss_trust`, `watcher_respect`, `enforcer_doubt`, `son_rivalry`, `gambler_trust`, `madam_trust`, `hostess_trust`.
- **A new Day 5, life in the circle** (short): the yard treats you differently; the old scavenger asks you to his patch tomorrow (needed); then the den (bones with the gambler and the enforcer: three throws, higher or lower; the enforcer reads the board; the gambler's debt) and/or the brothel (the madam: "There was a girl last year. The boss's new favourite, like you." "What happened to her?" "Nobody says. That's what happened to her."; a hostess who came in off the plain); your brother if you like (fed, new boots, "he asked if we ever had rats"). Then the bar, an evening with one of them, and your ground goes up on the board.
- **The raid is Day 6.**

## Smoothed (designer: the whole sequence was a bit clunky)
- **The rise builds over weeks** (designer: four times once could be a fluke): Day 3's tribute is the third big week running; the queue mutters it over their heads; on the way the fence comes out of the alcove ("Three big hauls in three weeks. I'd pay a great deal to know where."); the boss: "Once is luck. Twice, I noticed. Three times..."
- **Board night:** the circle meets at the bar every evening because the watcher puts up the board. **You talk to each of the four** (designer: talking to one just ended it): boss, watcher, enforcer, son, in any order (a repeat doesn't count), then the watcher asks "Tomorrow?" and writes it up. Day 4: the sunk town, or the fields (a lie he writes down anyway). Day 5: he puts you down for the old man's patch himself.
- **Day 5 in town is two of three** (designer): the den, the brothel, your brother; then board night. The old scavenger no longer needs visiting: the watcher sends you to him.
- **No training scene** (designer: it didn't fit "three weeks running"): Day 3 opens at the hollow with you and the dog, three weeks in ("Not yet. You know the rule. Find something first."), straight on to the sunk town. **A bite of food for each find** (designer). **The tribute queue stays** when your talk at the counter ends (designer: they vanished): night falls when you get home, on Days 1 and 3.
