# Combat design

Settled by the designer on 2026-10-05. Reworked the same day after a first playtest ("pretty mid": the guard/shove/grab mechanics were too far forward). Now a traditional Persona-style turn-based system is the base, and the timing and intents sit on top.

The rules are `src/systems/Combat.ts` (no Phaser), the fights are data in `src/data/combat.ts`, and `src/scenes/CombatScene.ts` stages them.

## The base: Persona-style turns

- **HP and SP.** Skills cost SP. No levelling and no XP: the story decides how strong you are.
- **Command menu** on your turn: **Attack**, **Skill**, **Guard** (half harm until your next turn, and no knockdowns), **Item** (when you carry something), **Run** (only where the fight allows it).
- **Turn order** by speed. Enemies take their own turns with their own attacks.
- **Weaknesses are the hook.** Hit a weakness, or land a critical, and the enemy is **knocked down**, and you get **One More**: another action. Knocked down, they lose their next turn getting up. When every enemy is down, an **all-out attack** is offered. This holds even one on one.
- Harm is the move's power × attack ÷ defence, ±10%; ×1.5 on a weakness or a critical, ×½ if resisted or guarded.

## On top

- **Timed reactions.** When an enemy's attack comes at you, a ring closes on your head as he lunges. Press as it crosses the green to **dodge** (half harm), or late, in the bright inner ring, to **parry** (no harm, and you hit back: a **counter**). It's a bonus; the fight can be played without it.
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
| Shove | 2 | A push, with good odds of a critical (knocks him down) |
| Grab | 4 | Get hold and drag him down. His weakness *(suggestion)* |
| Hold back | 0 | Stop, and let him have it. Ends the fight |

He's weak to grabs and shrugs off slaps *(suggestion)*. He picks from **Swing**, **Wind up** (his next move is a **Haymaker**, twice as hard, with tighter windows: guard, or time a parry) and **Jeer** (a free turn for you). No running in this one.

**Outcomes** go to ink (the only store of story state), and the story takes it from there:

- **Win:** `fight_won = true`. Suspicion jumps.
- **Lose:** `fight_won = false`. You're hurt and lose food.
- **Hold back:** `held_back = true`. Mum sees it.

The numbers are a first pass, to playtest (you: 40 HP, 10 SP; him: 60 HP).

## Staging

Persona-style 3/4 framing on a dedicated stage, not the side-on view of the areas:

- **The stage:** the market seen down its length, painted and dithered like the areas (stalls and lamps receding, the crowd in a ring, floorboards in perspective). No red.
- **Bigger battle sprites** (`src/ui/battleSprites.ts`, about 2½ times the height of the area figures): you from behind, large in the near foreground and cropped at the waist; the enemy further back, facing you. Idle breathing, and poses swapped in for winding up, attacking, being hit, guarding, dodging; knocked down, he falls flat.
- **Camera:** the world is on its own camera. It pushes in on the attacker as he gets ready, swings to you for the dodge/parry prompt, punches in on a hit, and pulls back out for the menu. Hits freeze for a moment (hit-stop) and shake the screen in proportion to the harm; a perfect parry goes to slow motion for a beat.
- **UI** on a second camera that never moves: a slanted command menu that slides in from the right (the chosen item pulled out and lit), HP and SP bars that drain smoothly (a pale chunk shows what you just lost), damage numbers that pop, labels (WEAK!, CRITICAL!, RESIST, DODGE, PARRY!, DOWN), a banner with the move's name, and a full-screen **cut-in** (your silhouette and a red slash, red being yours) on One More and the all-out attack.

## Not decided yet

- Whether Day 4 switches from the old timing close-up (`FightScene`) to this one in the real game (one ink tag: `#combat:market_scrap:day4_after_fight`), and what holding back in the middle of a fight says in the story.
- The fight's own text (the captions are placeholders), and the weaknesses marked *(suggestion)*.
- Gear, items in Chapter 1 (none yet), and how skills are handed out (a lead's `moves` list is what the story has given them).
- Whether enemies get One More too (not in this first version).
