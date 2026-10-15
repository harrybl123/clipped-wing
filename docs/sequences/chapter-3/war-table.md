# The war table: the riot game

Chapter 3's tactics minigame, first played for real on Day 4 (the riot) and meant to be played again (designer, 2026-10-15: "we're going to be playing this minigame more, so we may as well figure out the mechanics in more depth and make it a fun tactical game"). The designer asked for it to be worked out by simulated play, taking from other games, with thought for board design and squad numbers. This is what came out of that. **(suggestion)** throughout, until the designer has played it.

## Where it comes from

- **Pandemic:** the riot spreads like a disease. Each place has unrest from 0 to 3; a place pushed past 3 boils over into every street next to it.
- **Into the Breach:** everything the rising will do this turn is shown before you act, as arrows, so each turn is a puzzle with no hidden dice. No randomness at all.
- **Advance Wars:** a few kinds of squad with clear jobs; one goal to capture (their HQ is the square); worn-out squads go back to base to be repaired.
- **The chapter itself:** force against calm. Charging a crowd breaks it fast, but it scatters into the streets round it and angers the district; quelling is slow and calm. Political choices change the board.

## The rules

**The board** is the district that's risen, close up, as a street plan: 15 places, the way up (the stair to the citadel, the lifts' foot) along the top, the square in the middle with five streets into it.

**Unrest** in every place, 0 to 3. At 3 it's burning: held by the rising, and no squad can walk into it.

**Your squads** (the guard), each with health:

| Squad | Health | Moves | Can |
| --- | --- | --- | --- |
| Pikes | 3 | 1 | quell, charge, storm |
| Shield wall | 4 | 1 | quell, charge, storm twice as hard |
| City watch | 2 | 2 | quell only (fast, for putting out sparks) |

**Your turn:** each squad does one thing, in any order, and you see it happen:
- **Move** (through places that aren't burning, not through other squads).
- **Quell** its own place or one next to it: unrest −1.
- **Charge** a place next to it: unrest −2. The crowd scatters: +1 into every street next to it that hasn't got a squad in it. It angers the district (every 3 charges, the barricades go up 1). Charging a burning place costs the squad 1.
- **Storm** the square's barricades, from a street next to it: −1 (shields −2). Costs the squad 1.
- A squad that does nothing is **braced**: nothing hurts it this turn.

**The power cut**, once every 3 turns: cut a place, and it can't spread or catch fire this turn.

**The rising's turn** (all of it shown at the start of yours):
- Places at 2 next to a fire catch (unless a squad's standing in them, or their power's cut).
- Every burning place spreads +1 into one street next to it (the arrow); the square, behind its barricades, into two. Into a squad: the squad takes 1 (unless braced). Into a burning place: it boils over into every street round it.
- A turn nobody storms the barricades, they go back up 1.
- A squad standing in a burning place takes 1 (unless braced).
- A squad worn to nothing withdraws to regroup, and comes back fresh at the way up 2 turns later.
- Every 3 turns, more of the guard arrive at the way up (if it isn't burning).

**Winning:** bring the barricades down and get a squad into the square: you go down yourself (the fight at the square). **Losing:** dawn (16 turns), and the square's still theirs. Nothing else loses it (designer: you lose the riot if you lose the overall game, not because one thing happened).

**The numbers** (the riot): barricades 16; you start with pikes on the stair, the arches and the back stairs, a shield wall at the lifts, the watch at the lamp shop; the square burning, three streets at 2, four at 1.

## What simulation showed

Computer players of different skill (`src/systems/RiotPlayers.ts`), over 30 varied starting positions, in the game's own engine (`tests/riotGame.test.ts` keeps the balance on the riot's board):

| Player | Wins | When |
| --- | --- | --- |
| Random, or doing nothing | 0% | |
| Sensible (one turn ahead) | about 67% | turn 12 of 16 |
| Only quells, never charges | about 53% | turn 12 to 14 |
| Only charges (brute force) | about 13% | |
| Careful (two turns ahead, thinks about order) | 97% | turn 9 |

On the riot's own starting board: careful play wins on turn 9, sensible on turn 11, quelling only scrapes it on turn 14, and brute force loses. About 3 good options per squad per turn: not one obvious move, not random.

What changed along the way: at first there was no pressure and the square fell in 4 turns, so places on the edge of a fire now catch and the square is barricaded; then sitting tight until dawn won, so the goal became taking the square; then the barricades fell to a rush, so they go back up when nobody storms them; then the power cut did nothing (a bug), and once it worked it made the biggest difference to a sensible player; then losing squads for good made one early mistake fatal, so worn-out squads regroup (it doubled a sensible player's wins without helping the careful one); moved into the game, it played a little harder than the prototype, so the guard comes every 3 turns rather than 4 and regroups in 2 (lowering the barricades only shortened a careful game); and the brute-force player loses because the district's anger raises the barricades.

## Later (open)

- Day 2's lesson still teaches the old rules (squads against squads). If this is the war table from now on, the lesson could teach this game instead.
- Other days' scenarios (the raid, the broadcast) can be new boards and starting positions with the same rules.
- Charging is used rarely by good players (a heavy hand that pays only when the streets round a place are covered). It could count towards `lean`, so how you put the riot down is political too.
