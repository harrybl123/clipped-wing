# Combat design

Settled by the designer on 2026-10-05. Reworked the same day after a first playtest ("pretty mid": the guard/shove/grab mechanics were too far forward). Now a traditional Persona-style turn-based system is the base, and the timing and intents sit on top. Second pass the same day (designer: "much more like it"): no all-out attack, much easier timing early on, fewer knockdowns, a graphics step up, and fight music.

The rules are `src/systems/Combat.ts` (no Phaser), the fights are data in `src/data/combat.ts`, and `src/scenes/CombatScene.ts` stages them.

## The base: Persona-style turns

- **HP and SP.** Skills cost SP. No levelling and no XP: the story decides how strong you are.
- **Command menu** on your turn: **Attack**, **Skill**, **Guard** (half harm until your next turn, and no knockdowns), **Item** (when you carry something), **Run** (only where the fight allows it).
- **Turn order** by speed. Enemies take their own turns with their own attacks.
- **Weaknesses are the hook.** Hit a weakness, or land a critical, and the enemy is thrown **off balance**. Do it again before they recover (within about a round) and they're **knocked down**, and you get **One More**: another action. Knocked down, they lose their next turn getting up, and can't be knocked down again until they've acted. How many hits it takes is each enemy's **poise** (2 for the zealot; 1 would be Persona's every-hit knockdown).
- **No all-out attack** (designer: too much Persona). It's still in the engine, switched off; a fight can turn it on with `allOut: true` if it's wanted back.
- Harm is the move's power × attack ÷ defence, ±10%; ×1.5 on a weakness or a critical, ×½ if resisted or guarded.

## On top

- **Timed reactions.** When an enemy's attack comes at you, a ring closes on your head as he lunges (the "circle into the donut": designer, keep it). Press as it reaches the green band to **dodge** (half harm). The band lights up and chimes as the ring reaches it. Press too early and you can try again a moment later; a miss is only the normal harm. It's a bonus; the fight can be played without it.
- **Timing belongs to each fight** (`timing`: how long the ring takes to close, and how much wider the band is). The market scrap is slow and wide (1.6 seconds, band twice as wide); later fights can close faster and narrower.
- **Parrying comes later.** In Act 1 the carver can only dodge. The **parry** (late, in a bright inner ring: no harm, and you hit back, a **counter**) is a move the story hands out later (a combatant's `reactions`), e.g. when a lead learns it.
- **Intents** are a small hint over the enemy's head ("Next: Swing", "Building up..."), not the centre of the decision.

## Growth

- New skills handed out at story beats; gear that changes *how* you fight, not just how hard; the player's own timing.
- Each lead fights differently: their own weapon type and skills. The prince uses a futuristic lance; Chapter 3 opens with him training at sword and lance with his advisor.
- Fights grow more frequent and deeper through the game. Companions join, and the four leads eventually form the party: the engine takes a party of one or more against one or more enemies.
- **Chapter 1 is mostly fight-free.** The only fight is the market scrap. A lower-roots creature may be a second Act 1 fight (not designed yet).

## The market scrap (Day 4 afternoon)

Mum is snubbed at the market and a young zealot knocks her basket away. Step in and it's a fight. The carver is thumbless and can't make a proper fist, so his **Attack is a weak slap**. His scrappy moves are **skills**:

| Skill | SP | What it does |
| --- | --- | --- |
| Shove | 2 | A push, with good odds of a critical (throws him off balance) |
| Grab | 4 | Get hold and drag him down. His weakness *(suggestion)*: two before he recovers floor him |
| Hold back | 0 | Stop, and let him have it. Ends the fight |

He's weak to grabs *(suggestion)*. He picks from **Swing**, **Wind up** (his next move is a **Haymaker**, twice as hard, with a tighter band: guard, or time the dodge) and **Jeer** (a free turn for you). No running in this one.

**Outcomes** go to ink (the only store of story state), and the story takes it from there:

- **Win:** `fight_won = true`. Suspicion jumps.
- **Lose:** `fight_won = false`. You're hurt and lose food.
- **Hold back:** `held_back = true`. Mum sees it.

The numbers are a first pass, to playtest (you: 40 HP, 10 SP; him: 45 HP).

## Staging

Persona-style 3/4 framing on a dedicated stage, not the side-on view of the areas:

- **The stage:** the market seen down its length, painted and dithered like the areas (stalls and lamps receding, the crowd in a ring, floorboards in perspective). No red.
- **Bigger battle sprites** (`src/ui/battleSprites.ts`, about 2½ times the height of the area figures): you from behind, large in the near foreground and cropped at the waist; the enemy further back, facing you, with a shadow under him. Lit a step richer than the area figures: amber where the market's lamps catch the top edges, a pale rim, a mid-tone, a faint seam where a limb crosses the body. Idle breathing, and a pose for each thing they do: your slap, shove (both arms out) and grab (hunched, reaching low) look different; he winds up, swings, reels, jeers, sways off balance, and lies flat on the boards when knocked down (with a puff of dust), then gets back up.
- **The stage** in more depth: lamps on brackets with glows, bunting strung between them, stalls receding with goods on their counters, a dim far row of onlookers and a darker near one, a pool of lamplight where he stands, Mum's spilled jars, and a crate out of focus near the camera.
- **Camera:** the world is on its own camera. It pushes in on the attacker as he gets ready, swings to you for the dodge/parry prompt, punches in on a hit, and pulls back out for the menu. Hits freeze for a moment (hit-stop) and shake the screen in proportion to the harm; a perfect parry goes to slow motion for a beat.
- **UI** on a second camera that never moves (frames tidied: bordered panels, framed bars, pips under his bar for how close he is to going down): a slanted command menu that slides in from the right (the chosen item pulled out and lit), HP and SP bars that drain smoothly (a pale chunk shows what you just lost), damage numbers that pop, labels (WEAK!, CRITICAL!, RESIST, DODGE, PARRY!, DOWN), a banner with the move's name, and a full-screen **cut-in** (your silhouette and a red slash, red being yours) on One More and the all-out attack.

## Music

A **placeholder** fight track, synthesised (`src/ui/fightMusic.ts`, Web Audio, no files): a low drum and a wood block, a muted hat, a plucked bass riff in D minor that climbs a fourth every other phrase, and a low drone that swells under it. It fades in as the fight starts (any day's score gives way to it), and ends with a short sting for winning (rising) or losing (sinking). It's on the music bus, so the mute button applies. A real track would replace it in one place (loaded in `PreloadScene`, played by `CombatScene`).

## Not decided yet

- Whether Day 4 switches from the old timing close-up (`FightScene`) to this one in the real game (one ink tag: `#combat:market_scrap:day4_after_fight`), and what holding back in the middle of a fight says in the story.
- The fight's own text (the captions are placeholders), and the weaknesses marked *(suggestion)*.
- Gear, items in Chapter 1 (none yet), and how skills are handed out (a lead's `moves` list is what the story has given them).
- Whether enemies get One More too (not in this first version).
- Whether the all-out attack comes back for later, bigger fights (it's built, switched off).
- When, and to whom, the story gives the parry.
