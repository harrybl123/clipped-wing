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

**Wired in.** Day 4's "Step in" plays `#combat:market_scrap:day4_after_fight`, and `day4_after_fight` reads `fight_won`. The old timing close-up (`FightScene`, the `day4_fight` knot) is no longer used by the story.

**The fight is its own tutorial** (designer). The market scrap has `teaches: true`, and the first time each thing comes up, the fight holds on a short, plain explanation (`LESSONS` in `src/data/combat.ts`) in a card at the left of the stage until you press E. There is no internal dialogue and no flavour text in it. Each shows once:

| Lesson | When | Says |
| --- | --- | --- |
| `turns` | your first turn | the menu keys; Attack is the basic melee attack; skills cost SP; Guard |
| `tells` | your first turn, after that | his pose and the line over his head show his next move |
| `react` | his first attack | follow the prompt in time to dodge; a miss takes the full hit |
| `offBalance` | the first time he's thrown off balance | hit him again before he recovers to knock him down |
| `windUp` | when he's charging the Haymaker | Guard, or Shove before it lands |

The card waits 450 ms before it can be dismissed, so a press meant for something else doesn't skip it.

## The deep rot (Day 4 night): fighting with a friend

**(Designer.)** Past the pits in the rot under the girl's house, you and the girl meet **three rot beetles**: the first fight with a friend beside you, and the first against several enemies. `ENCOUNTERS.rot_beetles`; the story is `day4_rot_creatures` (before) and `day4_rot_after_beetles` (after; draft text). A `trigger` in `theRot.ts` plays it once. It writes `rot_beetles_won`: winning gives `girl_trust` +1; losing is no worse than being dragged along by her collar, and the story carries on.

**It teaches only one thing** (designer: not too hand-holdy): you fight alongside friends, each with their own abilities (`teaches: ['allies']`). Everything else was taught at the market, and her skills explain themselves in the Skill list.

**The girl** has her own skillset on the same mechanics (30 HP, 10 SP, fast, slighter, dodges):

| Move | What it does | QTE | Alt |
| --- | --- | --- | --- |
| Clout (Attack) | a proper punch | Key | Bar |
| Flick (2 SP) | a shard of rot-bone: *pierce*, cracks shells | Bar | Key |
| **Lure** (1 SP) | every enemy that hasn't acted yet turns on her this round, and she braces (half harm) | none | |
| Rot-ink (3 SP) | the target is **weakened**: 1.5× harm for 3 rounds | Hold | Bar |

The engine gained `taunts` (Lure) and `exposes` (Rot-ink; `weakened` events), both pure and tested.

**The beetles** (26 HP each, speed 8): the shell *resists* strikes, but they're *weak* to pierce (Flick) and shove (yours); poise 2. Moves: Pincer (Bar/Key), Scuttle (two blows: Weave/Key), Rear up then Slam (Draw/Bar; Guard or Shove it before it lands). Their tells never lie. A 200-fight test checks a good player nearly always wins, an average one usually does, and a careless one fares worse.

**Staging** (designer: each character needs their own space; a different background; separate health bars):
- **Its own stage** (`stage: 'rot'`): a grim cave of rotten wood, lumpy brown muck underfoot with dark cracks and fallen roots, roots hanging from the arch, and the green only in the glowing pools and far off down the hollow.
- **Space for each:** you and the girl stand apart on the left (the girl is drawn from behind like you, with the green strand), the enemies further right.
- **Turn framing:** on each one's turn the camera leans over their shoulder towards the enemies, and the other falls into shadow.
- **A panel under each** party member (name, HP and SP bars), following the camera; whose turn it is is raised with a white edge. This replaces the stacked panel in the corner, for the market too.

Dev: `?scene=combat&encounter=rot_beetles`; the gallery shows the girl's and the beetle's poses.

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

- The fight's own text (tells and the lessons are drafts).
- The weaknesses and temperament marked *(suggestion)*.
- Gear, items in Chapter 1 (none yet), how skills and the parry are handed out.
- Whether enemies get One More too, and whether the all-out attack comes back for bigger fights.
