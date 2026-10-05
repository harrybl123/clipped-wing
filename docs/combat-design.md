# Combat design

Settled by the designer on 2026-10-05. The engine is `src/systems/Combat.ts` (rules, no Phaser), the fights are data in `src/data/combat.ts`, and `src/scenes/CombatScene.ts` shows them.

## The shape of it

- **Turn-based.** Every enemy shows its **intent**, what it is about to do next, over its head. The player picks moves around it: break a wind-up, wait out a big swing, take the opening when it comes.
- **Timed reactions.** When an enemy attack lands, there's a short window to **dodge** or **parry** with one key press (Clair Obscur style). A dodge takes no harm. A parry is tighter, takes no harm and throws the attacker off: a **counter** (he loses his next turn and is open).
- **No levelling, no XP.** The story decides how strong you are. You grow through:
  - **new moves** handed out at story beats,
  - **gear** that changes *how* you fight, not just how hard,
  - your own **timing**.
- **Each lead fights differently:** their own weapon type and move set. (The prince uses a futuristic lance; Chapter 3 opens with him training at sword and lance with his advisor.)
- **It grows through the game.** Fights get more frequent and deeper; companions join, and the four leads eventually form the party. The engine takes a party of one or more against one or more enemies, though the first fight is one against one.
- **Chapter 1 is mostly fight-free.** The only fight is the market scrap. A lower-roots creature may be a second Act 1 fight (not designed yet).

## The market scrap (Day 4 afternoon)

Mum is snubbed at the market and a young zealot knocks her basket away. Step in and it's a fight. The carver is thumbless and can't make a proper fist, so the moves are scrappy:

| Move | What it does |
| --- | --- |
| Dodge | Watch him: wider dodge and parry windows until your next turn |
| Shove | A little harm; breaks a wind-up (he's staggered and open) |
| Grab | Real harm, but only when he's open (after a jeer, a broken wind-up or a parry) |
| Hold back | Stop, and let him have it. Ends the fight |

He picks from **Swing** (2), **Wind up** (his next move is a **Haymaker**, 4, with tighter windows) and **Jeer** (playing to the crowd leaves him open).

**Outcomes** go to ink (the only store of story state), and the story takes it from there:

- **Win** (he goes down): `fight_won = true`. Suspicion jumps.
- **Lose** (you go down): `fight_won = false`. You're hurt and lose food.
- **Hold back:** `held_back = true`. Mum sees it.

Numbers are a first pass, to playtest (you 7, him 6; speed decides who goes first, and you're quicker).

## Showing it

The sprites are tiny code-drawn row sprites, so there's no frame-by-frame animation. Tweens sell the timing:

- a **flash and shudder** before an attack (the tell),
- the **lunge**, and a ring closing on your head as it comes: press as it crosses the outer green band to dodge, or late, in the bright inner ring, to parry,
- **screen shake** and a white flash on a hit, harder for a big one,
- **sparks** and a brief **freeze** on a good parry.

## Not decided yet

- Whether the Day 4 fight switches from the old timing close-up (`FightScene`) to this one in the real game (one ink tag: `#combat:market_scrap:day4_after_fight`), and what holding back in the middle of a fight says in the story.
- The fight's own text (the captions are placeholders).
- Gear, and how moves are handed out (data is ready for it: a lead's `moves` list is what the story has given them).
