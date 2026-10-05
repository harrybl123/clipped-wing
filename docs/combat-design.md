# Combat design

Settled by the designer on 2026-10-05 and reworked over the day through playtests: a traditional Persona-style turn-based system is the base, with reads and quick-time events (QTEs) on top. This describes it as it stands.

- **Rules:** `src/systems/Combat.ts` (`Battle`) and `src/systems/qte.ts` (the QTEs), pure and unit-tested (`tests/combat.test.ts`, `tests/qte.test.ts`).
- **Data:** `src/data/combat.ts` (moves, fighters, fights).
- **Scene:** `src/scenes/CombatScene.ts`, with the QTE runner `src/ui/QteRunner.ts`, the battle sprites `src/ui/battleSprites.ts` and the music `src/ui/fightMusic.ts`.

## The base: Persona-style turns

- **HP and SP.** Skills cost SP. No levelling and no XP: the story decides how strong you are.
- **Command menu** on your turn: **Attack**, **Skill**, **Guard** (half harm until your next turn, and no knockdowns), **Item** (only when you carry something), **Run** (only where the fight allows it). No move ends the fight early.
- **Turn order** by speed. Enemies take their own turns.
- **Weaknesses.** Hit a weakness or land a critical and the enemy is thrown **off balance**. Do it again before they recover (within about a round) and they're **knocked down**, and you get **One More** (another action, with a cut-in of your own sprite and a red slash). How many hits it takes is each enemy's `poise` (the zealot: 2). Knocked down, they lose their next turn getting up, and can't be floored again until they've acted.
- **Shove breaks a wind-up.** Land it before his wound-up blow comes and he loses the blow and his balance.
- **Harm** is the move's power × attack ÷ defence, ±10%. It's ×1.5 on a weakness or critical, and ×½ if resisted or guarded. A move can be `softened` instead: the Haymaker lets only a quarter through a guard, and almost nothing through a dodge.
- **All-out attack:** built, but off (designer: too much Persona). A fight can turn it back on with `allOut: true`.
- **Several enemies.** With more than one, pick who you go for with Left and Right (their panel lights up, with a marker), and E to go. Beaten enemies stumble off into the crowd, and the rest spread out again.
- **Back.** Esc, Backspace, X or a right-click goes back a step: from choosing who, to the skill list; from the skill list, to the commands. An `[Esc] Back` hint shows wherever you can.

## Reads, not announcements

What he's about to do isn't stated. As each round starts he takes a pose for it, and a vague line shows on his panel (his **tell**, `tell` on each move; the lines are placeholders):

| Pose | It could be |
| --- | --- |
| Squared up, fists raised | Swing, or Flurry |
| Shoulder dropped, an arm drawn back | Hook |
| Hands open, reaching | Collar |
| Weight back | Wind up (the Haymaker next) |
| Drawn right back | Haymaker |
| A glance at the crowd | Jeer (a free turn) |

An enemy can **feint** (`feint`: the chance a tell is another move's). The zealot never does.

## Quick-time events

Any move can have a QTE (`qte`, one per blow). On an enemy's attack it's your reaction: a good one dodges (half harm, or less for a softened move), a miss takes the full blow with a heavier impact. On your own skill, it decides how well the blow lands: good ×1.3, perfect ×1.6, a miss glances off (×0.6).

Every QTE stops where you press and holds a moment. A miss says why (TOO EARLY, TOO LATE, WRONG WAY, TOO SLOW, HE HELD ON...). The blow lands on that beat: the QTE drives the animation, so they can't drift apart. Each kind's instruction shows only the first time you meet it. A move can name an `alt`, used instead when the last QTE shown was the same kind, so the same kind never comes twice running. Each fight eases them (`timing: { lunge, ease }`; the market scrap is gentle).

| Kind | What you do |
| --- | --- |
| Ring | A ring closes on your head. Press E while it's inside the green donut, not before, not after |
| Side | The same ring, but Left or Right, away from his swing (in the library, unused just now) |
| Key | Press the arrow shown, quickly |
| Bar | A marker sweeps along a bar: press E in the green |
| Hold | Hold E to fill a meter; let go in the green |
| Mash | Press E fast enough to break free |
| Notes | Arrows fall down lanes (Guitar Hero style): press each as it reaches the line, one per blow |
| Draw | A quick draw: wait, then press E the instant it flashes (any sooner is a miss) |
| Weave | A quick run of directions by your head as the punches come: Up to duck, Left or Right to lean |
| Balance | Keep a wobbling needle in the middle with Left and Right (in the library, unused just now) |
| Carve | Trace a short pattern of arrows, shown as a carved line (the carver's craft) |
| Grip | A struggle: he's got your collar and tugs in bursts (with short lulls), yanking a marker about; hold Left/Right to keep it in a light that wanders and narrows, and mash E to claw back a little; your grip fills slowly inside and slips faster outside, and the edges darken as you slip; fill it to break free (you have 5 seconds, about 2½–3 in the light) or he throws you. The camera's in tight on the two of you, swaying with his tugs |

**Parrying comes later.** In Act 1 the carver can only dodge. A **perfect** reaction is a **parry** (no harm, and you hit back) only for someone the story has taught to parry (a combatant's `reactions`).

### Who uses what (the market scrap)

| Move | QTE | Alt |
| --- | --- | --- |
| **His** Swing | Ring (the only ring) | Bar |
| Hook (two blows) | Weave | Key |
| Flurry (two blows) | Notes (Left, Up, Right: lean and duck) | Weave |
| Collar | Grip | Mash |
| Haymaker (after Wind up) | Draw | Bar |
| **Your** Slap (Attack) | Key | Bar |
| Shove | Bar | Key |
| Grab | Carve (three strokes) | Hold |
| 1, 2, 3! | Notes (one per blow) | Carve (one stroke per blow) |

## His temperament (AI)

Each enemy picks its intent by weights plus a temperament (`ai`), so it behaves like a person. The zealot (hot-headed, a suggestion):

- **Opening:** his first moves are swing, hook, flurry, wind-up (the Haymaker follows), collar, so you meet each way of reacting.
- **Variety:** after that he mixes his moves. Ones he used in his last two turns are less likely (`recent`), and he never uses the same move three times running (`maxRepeat`).
- **Reacting to the fight:**
  - When he's hurt, he escalates (more wind-ups and flurries, no jeering).
  - When you're nearly done, he goes for the big one.
  - If you keep guarding, he grabs you.

A test runs 200 seeded fights: each of his five attacking moves comes up more than 12% of the time, and none more than twice running.

## The carver

Thumbless, he can't make a fist, so every blow is open-handed:

- **Attack** is a slap.
- **Shove** (2 SP) can throw him off balance, and breaks a wind-up.
- **Grab** (4 SP) is his weakness *(suggestion)*.
- **1, 2, 3!** (3 SP) is a jab with the fingers, a slap and the heel of the bandaged hand. Each blow you land makes the next harder, and land all three and he's thrown off balance.

## The market scrap (Day 4 afternoon)

Mum is snubbed at the market and a young zealot knocks her basket away; step in and it's a fight. The numbers are a first pass, to playtest: you have 40 HP and 10 SP, he has 70 HP.

**Outcomes** are written to ink (the only store of story state), and the story takes it from there: **win** sets `fight_won = true` (suspicion jumps), **lose** sets `fight_won = false` (hurt, less food).

**Holding back** is no longer a move (designer). The `held_back` variable stays in ink, but nothing in combat sets it now. Holding back is the story's choice, made before the fight (Day 4 already has "Hold back" as a choice at the market).

**Not wired in yet:** Day 4 still plays the old timing close-up (`FightScene`). To switch, in `story/day4.ink` replace `#fight:day4_fight:day4_after_fight` with `#combat:market_scrap:day4_after_fight`. `day4_after_fight` already reads `fight_won`.

## Staging

- **Framing:** Persona-style 3/4 on a painted market stage. You're seen from behind, big in the near foreground. Enemies stand further back, facing you, each with a shadow.
- **Battle sprites:** about 2½ times the area figures, lit by the market's lamps, with a pose per move and per tell. The zealot is a young man like his market figure (face, hair, tunic, the zealot's stole), with a lying-down sprite. His friend (a test enemy) is a recolour.
- **Two cameras:** the world one pushes in on whoever acts, swings to you when you're attacked, punches in on hits and pulls back for the menu. Hits freeze for a moment and shake the screen in proportion to the harm.
- **The UI camera** never moves. It holds:
  - the slanted command menu, sized to its longest item
  - a brief Persona-style banner with the move's name (no descriptions; designer: no helpers at the top)
  - HP and SP bars that drain smoothly
  - each enemy's panel (name, health, balance pips, tell), on a dark plate that never overlaps another
  - popping numbers and labels
  - the cut-ins
- **Music:** a placeholder fight track, synthesised (drums, a wood block, a bass riff, a drone), with stings for winning and losing. A real track can replace it in one place.

## Trying it (dev)

- `npm run dev`, then `http://localhost:5173/?scene=combat` opens a **fight picker**:
  - the market scrap
  - two test fights with two and three enemies
  - practice of each of his moves on its own (its QTE)
- `&encounter=<id>` starts a fight directly. `&foe=<move>` makes him use only that move. `&mute=1` silences it.
- In any area, open the debug overlay with backtick and press **C** for the picker; you come back where you were afterwards.
- **Controls:**
  - Up/Down to choose, E/Space/Enter to confirm, Esc/Backspace/X or right-click to go back
  - Left/Right to pick an enemy
  - in QTEs: E, or the arrows (WASD too)

## Not decided yet

- Wiring Day 4 to this fight, and the fight's own text (captions and tells are placeholders).
- The weaknesses and temperament marked *(suggestion)*.
- Gear, items in Chapter 1 (none yet), how skills and the parry are handed out.
- Whether enemies get One More too, and whether the all-out attack comes back for bigger fights.
