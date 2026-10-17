# The war table

Chapter 3's tactics game: taught on Day 2 (the lesson in the simulation room), played for real on Day 4 (the riot), and meant to be played again. Rules in `src/systems/Riot.ts`; maps and set-ups in `src/data/warTable.ts`; the screen in `src/scenes/RiotTableScene.ts`; computer players in `src/systems/RiotPlayers.ts`; the balance kept by `tests/riotGame.test.ts`.

**What the designer asked for:** a real game you can play, fun and tactical (2026-10-15); worked out by simulated play, taking from other games; then, after playing a first version that was confusing ("I almost liked the simplicity of the old game"): the old game's simplicity with the riot's additions, a middle ground, a clean design, every rule thought about, keep it simple; and the markers for who's who made clear. You lose only by losing the game.

## The rules

The old table's, as Harry knew them:

- Squads are numbers. Each turn every squad can move one step along a street, or stay.
- Your orders happen in the order you give them (designer): send a squad into another, then send that one on, and they go together. (The rising's happen all at once.)
- Into an empty place, it takes it. Into your own squad, they join.
- Into theirs, it's a fight: the bigger number wins and keeps what's over. A tie holds (the attackers are lost, and the defenders lose as many).
- The square's barricades add 1 to whoever holds it.

(Gone from the old table: uphill costing 1, which on these maps only touched the stair; the lifts joining every station (the district has one lifts' foot); and the barricades losing nothing when they hold, which made a big attack on the square vanish without a mark on it: the designer sent 21 at 23 and thought it was a bug.)

And four for the riot, each one sentence, each for a reason:

1. **What the other side will do this turn is shown first, as arrows.** You read them and answer them. (Into the Breach.)
2. **People keep joining the square: it grows by 1 every turn, and once it's over 9 it sends a crowd of 2 out at the guard (shown as an arrow first).** The clock, and the riot coming at you: without it the rising hoarded everything in the square and never fought (designer: too passive; tested, below).
3. **More of the guard come down the lifts: 2 every turn, while the guard hold the lifts' foot.** Time is on the guard's side, but only while they keep the lifts: something to protect, so you can't send everything at the square. (Advance Wars' factory.)
4. **Every few turns the guard can cut the power under a place: nobody there can move, the square doesn't grow, and they fight at 1 less.** The guard's one trick: when, and where.

**The goal:** the guard must take the square before dawn (18 turns); with enough to win it, you go down yourself (the fight). The rising wins if it still holds the square at dawn. Nothing else ends it.

Everything else is the rising playing by the same rules (`risingOrders`; `RISING_STYLE`): crowds go for the guard (the lifts' foot most of all, to cut off the guard coming down); they throw themselves at a squad even when they'll lose, if there are 2 or more of them, so it costs the guard; two crowds join up when together they could take a squad; they fall back into the square when the guard come for it. The rising's moves happen together: a squad moving out of a place goes before one moving in, so nobody's carried along.

## The screen

Hardly any words (designer: it was too cluttered). The district as a street plan in light; the rising's squads amber circles, each with fire and a crowd round it, smoke going up; the guard's blue shields; the number on each; a ring round every place in the colour of whoever holds it. The other side's arrows dashed (and the square's next crowd), yours solid and numbered in the order they'll happen, joins in green. A note in the corner: dawn, or the lesson's goal. A card only when the mouse rests on a place a moment (designer: big text boxes are annoying): its name, whose it is and how strong; choosing where to send a squad, just the sum, in a line by the place ("5 v 4: you take it, 1 left"). "+1" floats off the square each turn, "+2" off the lifts, "2 out" where a crowd's sent; after a fight, what each side lost.

Controls (the old table's): pick a squad of yours (E or click), the arrows step round where it can go, E or click to send it (its own place to hold), Esc or right-click back, Tab to the next squad, Enter or the button to end the turn; as the guard, P or the button for the power; Undo (or U) takes back your last order, one at a time (designer).

## Day 2: the lesson (you're the rising)

As planned: "A district rises. You'll be the rising. I'll be the guard." On the low district's map, his moves shown, one goal at a time, his line the first time each rule comes up (the square growing, his guard arriving; a tie, a lost fight, joining, giving no orders):

1. Take the Weavers' Row: 3 of yours against 2 of his (the bigger number wins, and keeps what's over).
2. Take the market street: 3 of his; join two of yours first.
3. Take the screens' street, and you go down yourself (the light-guards fight).

Then "Now.": the table set up again (your square 24 behind its barricades, crowds round the district, his guard along the top), no arrows, and he plays the guard to win: he cuts your power ("It helps to have a city on your side."), and takes your square. Tested: whatever the rising does (as the computer plays it, piling everything into the square, or doing nothing), he takes it, never at once, in 5 to 9 turns.

## Day 4: the riot (you're the guard)

The riot's set-up: the guard along the way up, 15 of them (4 at the lifts' foot, 4 on the stair, 4 at the arches, 3 at the lamp shop); the square 14; crowds of 3 across the district, two of them in the streets next to the square and one at the back stairs, close to yours.

## What simulation showed

Computer players of different skill as the guard, over 16 starting positions (the riot's, with the crowds varied):

| Player | Takes the square | When | The rising attacks them |
| --- | --- | --- | --- |
| Random orders, or none | never | | |
| Sensible (one turn ahead) | about two in three | turn 13 of 18 (the riot's own set-up: turn 16) | about 9 times a game, taking 2 or 3 squads |
| Careful (two turns ahead; thinks about order and the power) | always | turn 10 | about 8 times, taking 1 |

The rising's way of playing, tested against the same guard (designer: it just sat in the square): as it was, crowds attacked about 3 times a game; with no fleeing and hunting the guard, 4; the square stepping out to strike, easier for the guard (it left the square empty) and dropped; gathering into bigger crowds, no better; throwing themselves at the guard even when they'd lose, 5; the square sending crowds out, 5 to 6. Both of those together, with a bigger rising so it's still a fair fight (the square 10, crowds of 3): about 10. Without the square sending crowds out, it hoarded everything again (6 attacks) and nobody sensible could win. Then (designer, having played it: about 20% too hard) dawn comes 2 turns later (18) and the square sends crowds out from over 9 rather than 8: sensible play from half to two in three. (One more in each of the guard's squads made it as easy, but let a careful player rush the square on turn 3.)

How it got here: the first version was a different game (unrest from 0 to 3 that spread like a disease, charging and quelling, storming the barricades): tested well by the numbers, but it didn't make sense to play (designer). Back to the old table's rules, then: rushing with every squad at once took the square by turn 2, which was the old table letting a squad be joined and carried on in the same turn (now moves happen together) and the square being too small; with crowds falling back into the square, nobody could win at all, because the square grew as fast as the guard did and every fight cost what it won, so the guard now get 2 a turn to the square's 1. Risk's idea (the square growing with the places the rising holds) was tried and dropped: one more thing to count (designer: keep it simple).

## Orders in sequence (designer, 2026-10-15)

The designer asked to choose the order things happen in (a 4 joins a 5, then the 9 moves on), rather than the game deciding it. Simulated, 24 starting positions:

| | Sensible | Careful | Earliest win |
| --- | --- | --- | --- |
| All at once (before) | 63%, turn 13.5 | always, turn 10 | turn 3 |
| In order, chains allowed (square 10) | 58% | always, turn 4 (the riot's own board: turn 2) | turn 2: chain everything into one strike |
| In order, but people march only once a turn | 63% | always, turn 10 | turn 3 (the combo barely works) |
| **In order, chains allowed, square 14** | 50%, turn 15 | always, turn 11 | turn 7 |

Chosen (designer): in order, chains allowed, the square 14. Nobody can rush it; what separates players is planning combos (the sensible computer player doesn't, a person would, taught by the lesson). "Now." needed its square at 24 (at 22, he chained everything in on turn 2).

## Later

- Other days' games (the raid, the broadcast) can be new set-ups on the same rules.

## Fortify and rumbles (Jack's proposal, 2026-10-15, for the designer to confirm)

Jack, playing the riot: you make a big squad in the middle and then can't defend a 2 that a 3 is coming for on turn 2, and the arrows show it coming with nothing you can do about it. Two additions:

- **Buttons under the circles** (Jack: easier to play): Fortify under the squad you've picked up; Unfortify under every squad that's dug in; and, as the guard, Cut power under one of theirs you've clicked (greyed, with the turns to wait, when it isn't ready: still every 3 turns). The power button in the corner is gone (P still works).
- **Fortify** (always there): pick up a squad, and a Fortify button sits under it (or F). Fortifying puts it down, so you can pick up the next straight away (Jack). **Once every 3 turns, like the power cut** (Jack): till then the button's greyed, "Fortify in 2"; taken back the same turn, you have it again. It digs in for the turn: nobody can attack it (their attacks on it don't happen, and the attackers stay where they are: no mistake for them to make), but it can't move, and it gets no +1 or +2 that turn (no reinforcements at the lifts, no growth in the square). It survives a round while help comes round behind. An arrow at a squad that's dug in is crossed out. **Unfortify** sits under every squad that's dug in (Jack), to change your mind straight away; giving it an order after all undoes it too. Not in "Now." (he's showing you how it's done). The computer players don't use it, so it can only make the game easier for a person.
- **Rumbles** (the riot, not the lesson): with none on the map, each turn there's a one-in-three chance one appears on an empty street (not the square or the lifts' foot), for two turns: next to both sides if there's such a street (a race), else next to anyone (Jack never caught one: placed anywhere, most faded before anyone reached them, about 1 set off a game; now 3 to 4). Its arrival flashes, rumbles and sends out a ring. Whoever gets a squad onto it first sets it off: every squad next to it, either side, takes a dice of 1 to 3 (a squad that's dug in, nothing). The screen shakes, a distorted rumble, "Rumble!" across the table. The rising go for one when it would hurt the guard round it more than their own. The dice are a seeded sequence in the state (a new seed each game; fixed in tests).

Simulated on the riot's own set-up (`RIOT_START`, the computer guard players, 40 and 12 games):

| | Sensible | Careful |
| --- | --- | --- |
| Without rumbles | wins every time, turn 16 | wins every time, turn 10 |
| With rumbles, placed anywhere (first try) | wins 78%, turn 16 | wins every time, turn 9.4 |
| With rumbles, where both sides meet (now) | wins 85%, turn 15.3 | wins every time, turn 8.3 |

So rumbles make it a little harder for an average player and different every time, and don't trouble a careful one. Rules in `src/systems/Riot.ts` (`fortify`, `unfortify`, `RUMBLE`, `setOff`), tests in `tests/riotFortifyRumble.test.ts`; the balance tests above are unchanged (they play without rumbles).

## Match the square's number and you take it (Jack's proposal, 2026-10-15)

Jack: 9 on the square's 8 didn't take it, which was confusing (he took it for the +2 coming first; it was the barricades: 9 v 9 is a tie, a tie holds, and the defenders keep at least 1, so the square's number never reaches 0). Your orders already come before the square grows and the guard arrive. The change: **match the square's number and you take it**; the barricades still cost one more, so you keep what's over after them, at least 1 (9 on 8: taken, 1 left). The card says it: "9 v 8 (+1 barricades): you take it, 1 left". Elsewhere a tie still holds.

Tried for every fight first, it was too much (and the rising's ties started winning too). Simulated, 30 and 10 games:

| | Sensible (rumbles) | Careful (rumbles) | Sensible (no rumbles) | "Now." takes the square on turn |
| --- | --- | --- | --- | --- |
| Before | 85% | turn 8.3 | always, turn 16 | 3 or more (tested) |
| Every fight | 80% | turn 8.8 | never | 2, 8, 2 (broken: "never at once") |
| **The square only** | 97% | turn 6.7 | always, turn 16 | 5, 9, 4 |

The lesson's line on the barricades now says they cost one more to take, and that matching it takes it (draft wording; it said it holds at one more and loses nothing when it holds, from before that changed).

## After Jack's changes (designer, 2026-10-15)

Merged: fortify, rumbles, Cut power under their circles, and matching the square's number takes it (Jack's). Then, having played it (designer: still really hard, we're outnumbered; "remember, we're the guard"; does that look like 97%?):

- **The balance was measured against players too good to be real.** The sensible computer player thinks a turn ahead and uses the power cut perfectly; on Jack's version it won 96%, but a naive one (`naive`: straight for the square, attacks what it can beat, no power cut, no fortify, as a person plays first time) won none. Balanced against the naive player now too, and a test keeps it winning (`tests/riotGame.test.ts`).
- **The guard come faster: +3 a turn at the lifts' foot (was 2).** You start up against it and end the bigger force. Naive play wins nearly always, late (turn 14 of 18); sensible always (turn 10); careful by turn 6 (never before 4). A bigger guard at the start was tried and dropped: chaining carries people three streets in a turn, so any square smaller than your whole guard could be rushed on turn 2.
- **"Now." crushes you** (designer: make it impossible; "I nearly had him"): he plays until he's taken your square. Your square 30, and 12 on his lifts' foot: going all out for his lifts (the way the designer nearly held him) had held him off for good, and between "he crushes you in a turn or two" and "a determined rising holds" nothing held against every plan, so it's the decisive one: 2 to 5 turns, whatever you do.
- **The tutorial teaches fortify** (after the Weavers' Row) and **rumbles** (the first one, with his word: "War's a game of chance, whatever anyone tells you. The trick is to need the dice less than the other man."). Rumbles are in the lesson too now.
- **Cut power is in the corner again** (designer: it wasn't obvious it could be done), as well as under their circles.
- **Losing, you can play it again** (designer), or go on (your father comes in).
- **Place names back on the table**, small and dim (designer).
- **The fight at the citadel steps has its own stage** (designer: it had the low district's square): the citadel's marble steps up to the great gate, the portcullis down, firelight from the city below (`steps`).

## Day 6: the duel with your friend (2026-10-16)

Designer: show your friend the table and challenge him to a duel on a new map, where you've fewer troops, technically, but it's as easy as the riot; then: the map considerably bigger than the riot's. **The siege of the old castle** (`CASTLE_BOARD`, `DUEL` in `src/data/warTable.ts`): the crag before it was the citadel, 27 places to the riot's 15, on a table bigger than the screen (800 by 440: `RiotBoard.width`/`height`; the view pans to the cursor, and to each move as it's shown; the mouse at a screen edge pans it too; the corner buttons stay put). You hold the keep (the rising's side of the same rules: walls +1, it grows by 1 a turn, match it and it's taken), with its inner yard, towers, postern, walls and gatehouse, and a few out at the bridge, the mill and the orchards; he has the bigger army (the guard's side) spread along the bottom, and his siege camp, where 2 more arrive each turn (the lifts' rule). Hold the keep for 14 turns. No power cuts (`powerEvery` 999); rumbles as ever; the keep doesn't pour crowds out (`style.pour` 0: your orders are your own). Your orders go first, in the order you give them; his are shown as arrows at the start of the turn (he plays `sensible`). Lose, and you can play it again.

Tuned by simulation (`tests/riotGame.test.ts`): you 40 (12 in the keep), him 52. Against his sensible play, a first go (hit what you can beat next to you, pull back towards the keep what could be beaten) held the keep 12 times in 16, about the riot's rate (the test asks for at least 10); doing nothing, or random orders, lose it; pulling everything into the keep and sitting there holds. His naive play (straight at the keep) was too brittle to balance against: a point either way and it won or lost every time.

**Then (designer, 2026-10-16): take his main base; drag the map; choose where to fight.** The objective is his siege camp, not holding out (`RiotRules.siege`: the rising win by taking the lifts' place; the guard by taking the heart). **No turn limit for now** (designer: a good game first, restrictions after; 18 turns was tried). Your friend never empties his camp (`besieger` in `RiotPlayers.ts`: sensible, the camp's squad held back), which gains 1 a turn; your keep grows by 1 and, over 9, sends 2 out (the square's rule, back on: squads can't split, so without it the keep's growth was stuck inside it). Set-up: you 41 (9 in the keep), him 42 (18 in his camp, eight 3s across the country). Simulated: a first go (everyone at his camp, beating what they can on the way, joining as they meet) takes it about 10 times in 16 within 18 turns, between turns 7 and 16, never in a rush; with no limit, more; random orders, or none, never take it. **Click and drag** anywhere off the places to move round the table (a click without dragging still backs out). **Where do you want to fight?** (a choice before it, `duel6_map`): a rainforest (canopy crowns, earth paths), a space station (hull plates, lit corridors, stars round the edge), or the crag as it was; only the picture changes (`forestPainter`, `stationPainter` in `RiotTableScene.ts`). Dev: `&map=forest|station`.

**Then (designer, after playing it): the camera, reinforcements, and a friend who moves.** "Stuff happens and it's hard to see": on a big table the camera goes to each move before it happens, and moves are slower. "No new units coming in; we need people to reinforce the base, on both sides": **mustering** (`RiotRules.muster`, 2): every turn each base (the keep, his camp) sends 2 new men out onto a road next to it, towards the other base (free roads first, else joining one of its own there), whatever's in the base (designer: lose it and you've lost anyway); a dashed arrow shows where they'll come out, and you see them arrive. A garrison never grows (the first try let a besieged keep's men pile into it, and nobody could ever win), and a base whose every road out is held by the other side gets none: "Cut off" (a siege). "He plays too static": `besieger` was rewritten: everything but his camp's garrison is always moving, hits what it can beat, marches on your keep joining up at its door, and the nearest two come back if you're at his camp with enough to take it. Set-up: you 31 (6 in the keep), him 32 (8 in his camp, eight 3s). Simulated: a first go that gathers at his camp's door and goes in when it's enough takes it about 10 times in 16 (games of 7 to 30 turns); only defending stalls; doing nothing, or random orders, loses the keep (turn 4 to 20).

## Split, fortify's bonus, and the hero (Jack's trial, 2026-10-16)

- **Split:** with a squad picked up, Split sits beside Fortify. Pick where the bigger half goes (7: "4 | 3"); the rest stays, and can be given its own order the same turn, so a squad can go two ways. A split half fights like any squad. Not a hero, a 1, or a squad dug in. (The computer players don't split.)
- **Fortify keeps its bonus:** dug in, the lifts still get their +2 and the square its +1 (Jack: it didn't feel like it had enough benefit).
- **The hero** (the riot only): with none about, one in six turns the guard's reinforcements come as a hero instead of +2, at the lifts' foot (or a street next to it). A warrior's helmet. Always 7: it wins without losing any, a rumble or a beaten-off attack doesn't touch it, and nobody joins it. It goes up to two streets a turn, through an empty place or its own, never through theirs. Beaten, it's gone. Its arrival: "Hero!" across the table, a sword drawn (`shing`), and someone calling "Hero!" (`hero`, silent until a recording's dropped in).

Simulated on the riot's set-up, with rumbles (30 and 10 games):

| | Sensible | Careful |
| --- | --- | --- |
| Before (rumbles, the square rule) | 97%, turn 14.0 | turn 6.7 |
| With heroes (about 0.7 a game) | 100%, turn 8.6 | turn 5.8 |

The hero makes the riot a good deal easier: rarer heroes, or a smaller one, if it's too much.
- **Their hero, the bastard** (Jack): the rising have one too. With none about, one in six turns the square sends one out instead of growing, onto a street next to it (where it would pour a crowd). The same as yours, in amber with a dark plume: always 7, two streets a turn, joins nobody. It goes for a squad of the guard it beats, the lifts' foot first, or towards the nearest. Its arrival: "Bastard!" in amber, the light dimming and a shake, and the sword pitched down (`shingLow`). With heroes on both sides (rumbles too): sensible wins 90% by turn 7.7, careful by 5.3; about 0.5 heroes and 0.9 bastards a game.

## The elite squad (Jack's trial, 2026-10-16; replaces the random hero and bastard above)

Each side has three, along the bottom of the table, shown as their emblems (the name beside them under the mouse): **the hero, the maiden and the king's guard** (the rising's: **the bastard, the witch and the barbarians**). Each once a game, for a crest (below). Click one (or 1, 2, 3), then a place next to your base (the lifts' foot; the rising's, the square): it appears there, and a squad of yours that was there steps back into the base, joining it, so nobody's lost; the king's guard goes straight round the base. None of them joins anyone, or is joined.

- **Hero / bastard** (a plumed helmet): 7 to deal out; nothing can attack it; 3 turns. Two streets a turn ("2 moves" over it when picked up), fighting its way through the first if it has to and on if it wins its way in (Jack: a 2, then the 3 beside it). Each fight spends what it takes to wipe them out: more than enough, it moves in; just enough, it clears the place and is spent; too little, it wears them down and is spent. It never stays on the square or the lifts' foot (it clears them). Dug in, it's **crusted**: fixed there for the rest of its time.
- **Maiden / witch** (fair hair; dark hair under a pointed hat): 1, so easily killed; 5 turns. **Seduce** (the button under her): a squad of theirs next to her, 5 or fewer, not the square, is yours ("Seduced!", a kiss), and she's gone; its order from its old side doesn't happen.
- **King's guard / barbarians** (a closed steel helm and crest, armoured; a horned helmet): three of 2, round the base, moving only between the places next to it, never growing, never joining anyone; dug in as they arrive (free) and for 2 turns whenever fortified; there for good (Jack: their only downside is they can't merge).
- Their arrivals: "Hero!" and a sword drawn ("Bastard!", pitched down); "Maiden!" and a giggle ("Witch!", a cackle); "King's Guard!" ("Barbarians!", the grunt slowed) and a grunt; a seduction, "Seduced!" and a kiss with a long dark reverb. All recordings (credited in `src/assets/audio/sfx/README.md`); "Hero!" itself waits for Jack's.
- The rising play theirs simply (`eliteActs`; so does the computer guard in the tests): a witch next to one she can seduce does; and when one's ready, the barbarians if you're closing on the square, else the bastard if there's one of yours within reach, else the witch if there's one to seduce.

Simulated with both sides playing their elite squads that way (rumbles too). At first an elite replaced the squad it was put on, and its points were lost: **sensible won only 17%**, and its own elite squad made things worse (70% with only the guard's; 97% with none), since the places next to the lifts are usually taken. Capping seduce at 3 changed nothing (17%). With the displaced squad stepping back into the base: **sensible 83%** (turn 11.1), careful always (turn 6.0); with only the guard's elite squad, always (turn 6.4); with only the rising's, 30%. 

**Crests** (Jack, replacing one every 3 turns: the rising's bastard and barbarians came out on turn 1): like a rumble, a gold crest appears on an empty street on turn 3 and every 4 turns after, for 3 turns ("Elite!", a bright glint). It's never on or next to either base; it's about as far from both sides (two streets, if it can), a street nearer the guard when even (the rising have more crowds out, and won most races otherwise) and nearer whichever side has taken fewer. A squad onto it takes it, and its side can put in any one of its elite squad it hasn't used. Both sides only go for one in reach (the computer guard marching for them lost games: 98% to 65% with nobody even spending them).

**Poison** (Jack): a maiden (witch) can merge into one of her side's squads (her 1 joins it); it turns green and bubbles ("Poisoned!", a recorded bubbling). Attacking, half the time it lands a critical hit ("Critical! +n"): 10 to 60% of its attack more, rounded; won, it never keeps more than it had. Split, the half that goes takes the poison.

Simulated with crests, poison, the king's guard for good, rumbles: sensible about 60% (turn 15.7), careful 92% (turn 9). Switched off one at a time: without the rising's bastard, sensible 63%; without their barbarians, 33% (they tie up the rising's own crowds); critical hits change nothing in these (the computer players rarely merge). (Earlier figures of "sensible always, turn 16" were simulated without the riot's rules, by mistake.)

### Clashes (Jack's trial)

Jack: equal numbers head-on lost you your whole squad (a tie holds), the worst result in the game; make it a fight. When one of yours goes straight at one of theirs whose arrow points straight back at it, with exactly the same number, it's a clash, every time (Jack): heroes and the king's guard too; not the maiden (she seduces instead), not on the square (its own rule), not a squad dug in or with its power cut, not half a split. The rising trigger them the same way (the rules don't care whose turn order it is).

The odds are morale, nothing else (Jack: odds only, no button to press), for the side striking first:

| | |
| --- | --- |
| Start | 50% |
| Strength: your share of everything on the board | up to ±15% |
| Each of yours next to either end of the street (not dug in: Jack) | +5% |
| Each of theirs there (not dug in) | −5% |
| Home ground: the places round it mostly yours (or theirs) | +10% (−10%) |
| An elite there: a hero, the king's guard, a poisoned squad (yours; theirs) | +5% (−5%) |
| Kept between | 20% and 80% (Jack) |

The winner takes the loser's place with 1 left (Jack), or now and then 2 (27%), rarely 3 (8%; Jack: so winning a clash can beat holding), never more than it had; its own place stays its side's, empty. Choosing the attack, the card shows "Clash! 74% to win" and each part. It's shown as a short scene: "Clash!", into the street, the two sides (up to six each, in the city's looks), war cries, a charge, swords, falling one by one until only the winners' last stand. Simulated: sensible about 60% (turn 15.2), careful 83% (turn 8.6), from 60% and 92% without.

Split is once every 3 turns, like fortify (Jack): the button greys with the turns to wait, or "Split used" once another squad's split is ordered this turn.

Holding against a matching squad still wins for sure (a tie holds: they're lost, you keep 1), while striking at it is a clash, a gamble; the clash's reward is their place. Kept as it is for now (Jack's question, 2026-10-16).

### The mystery square (Jack's trial)

One thing on the map at a time: a rumble, a crest or a mystery square (a crest that's due waits for the map to clear). From turn 4, with the map clear, there's a 30% chance each turn of a mystery square on an empty street (placed like a crest, a street nearer the guard), for 3 turns; a quarter of them are the diviner's own mark (an eye under a hood), the rest a "?". First there finds out. A "?" is:

- **The diviner** (40%): a sly old hooded figure leans in close over the table and deals three cards face down ("Choose, and the city chooses with you."). You pick one; it's turned over, then the two you didn't take. The cards: any of your elite you've not used (yours to put in, no crest needed), the **Joker** (every squad next to it but the bases, either side's, thrown up: 1 to the most there, at most 10), the **Jack** (+2 to each of yours next to it), the **King** (+5 to your base), the **Queen** (+3 to one of yours), the **Ace** (+5 to the squad that found it), the **Plague** card (as below). The rising's are picked for them.
- **The thief** (35%): "Thief!" and a knife drawn; you pick any of theirs but their base, and it steals up to 3 (it can wipe a squad out), added to your base. The rising's robs your biggest.
- **The plague** (25%; Jack: renamed from poison, since the maiden's poison is something else): a skull fills the screen and decays, with a hollow, dark sound; for 3 turns each of your squads but the base loses 1, never below 1. The note in the corner counts it down.

### The king's guard hold (Jack)

The king's guard never move. A squad of yours can step onto their place and stand beside them (drawn as its own shield, down and to the right of them), passing through: it can go on again later. An attack there faces both together; the king's guard take it first, then whoever's beside them.

### The trickster (Jack)

A mystery square can turn out to be the trickster (15%; the "?" is now diviner 35%, thief 30%, plague 20%, trickster 15%), and a tenth of mystery squares show its own mark (two arrows crossing). First there changes every street on the table: the same places, joined up differently, so somewhere two or three streets away can be next door. Kept easy to read: no streets crossing, none running past a place, at most four from any place, about as many as before, everywhere still reachable, and the square at least three streets from the lifts' foot. "Trickster!", a tumble of bells, the streets flicker, and the street plan under the table is painted again.

### Home bases (Jack)

The guard's base is drawn as a keep (battlements, a gate, a white flag), the rising's as a camp under their ragged banner, with the number in the middle.

### The skirmish (Jack, for playtesting)

A game mode of its own (dev: `?scene=wartable`): the riot's table and rules, no story, no dawn. Take their base and you've won; lose yours and you've lost. Every 6 turns, a shake-up: each side gets a crest, to put in any elite it chooses (Jack: not one picked for you), or, a quarter of the time, it's the trickster and the streets change instead (Jack; the note in the corner counts down). Here the elite come back once they're gone from the table. The maiden can't be fortified (Jack: she's left open).

### Jack's third round (2026-10-16)

**The skirmish moves to Harry's castle map** (`SKIRMISH_BOARD`, from `CASTLE_BOARD`): the keep at the top is yours (the guard's base), the siege camp at the bottom the rebels' hideout (24; tuned by simulation: careful play takes it about turn 16, sensible 15, naive 13 games in 16, turn 25); three places round each base (so the barbarians cover theirs as the king's guard do yours), drawn close together and ringed faintly in the side's colour. **View mode** (Jack; top right, or V; remembered): zoomed out, the whole map on the screen (`SKIRMISH_BOARD`, `RiotBoard.compact`: names without "the"), or zoomed in, Harry's spacing, dragged round (`SKIRMISH_WIDE`); switching keeps the game where it is (`RiotTableSceneData.resume`). **The hero goes step by step** (`Order.via`): click next to it, then where next (or there again to stop); clicking two away still works. **Split**: click Split, where the bigger half goes, then where the rest goes (their own place: they stay). **The brothel** (`BROTHEL`, the skirmish): a token like the others; first there is stuck there the next turn (and can be attacked: `RiotSquad.stuck`), then +15% in its next clash (`cheer`). **The audience** (`AUDIENCE`, the skirmish; Jack's "community square"; `src/ui/audienceScene.ts`, draft looks and lines): first there chooses the accountant (weighs your gold on his scales: morale ±10% for 5 turns; the gold waits for the shop), the townsfolk (a stage in a square, four things to say, two go down well, a fresh two each time: morale and every base +1 a turn for 5 turns, or -1 for 2) or the commander (their moves two turns ahead for 5 turns, or clouded judgement: none for 5); half and half. A crier calls each side to one, half the time, once in each 7 turns ("Lord, your people require attention!"). Morale counts in clash odds (`moraleOf`). **Races** (Jack): both sides onto the same token the same turn, the odds as for a clash; the winner takes it and the place, the loser stays where it was, untouched (`race`, `RiotState.held`). **More clashes** (Jack): the same number each onto the same empty place (`meet`), and an attack on a base with exactly its number (`base`: the final clash; win and it's yours, 1 to 3 left; lose and the base holds with 1 to 3; replaces matching the square's number taking it). **The maiden seduces by moving** onto one of theirs (no button; "Seduce" over the arrow), and turns their bastard into your hero (the witch, your hero into their bastard); she can be put in beside the king's guard. **Only a hero hurts the other side's king's guard** (barbarians); ordinary squads can't attack them. **The king's guard**: no Unfortify; one or two missing, a crest makes them up (`guardsShort`). **Rumbles and the diviner's cards reach the elite squad; the plague doesn't**, and it shows: plagued squads sickly green, dripping, a small skull at the shoulder; its words "All active squads lose -1 health per turn". **One thing at a time on screen** (`banner`): what appears on the map, shake-ups (with what they are, held longer), elite arrivals, rumbles, the plague. **Game over (no moves possible)** when a side has nothing left anywhere. Merged Harry's main first (Days 5 and 6, the duel, the guard +3).

### An audience with the Lord (Jack, 2026-10-16)

**An audience with the Lord** replaces the crier (`AUDIENCE.call`, `judged`; `RiotState.pending` `prayer`; `judge`; `hearPrayer` in `src/ui/audienceScene.ts`, draft looks): half the time, once in each 7 turns, a side's people pray: a church, the sun through stained glass onto a man on his knees at the altar ("O please, Lord, won't you hear our prayer?!"). The Lord's judgement, half and half, for 5 turns (`favour`; `Mood` `blessed`/`cursed`): **heretics** (the windows slam shut one by one, `slam`, synthesised; the church goes dark): every clash and race lost, no critical hits, audiences go badly, rumbles hit them hardest, and attacks on them win on a tie; **loyal servants** (the light turns gold, an angelic "ahhh": `angel.ogg`, j2l and Aosi's "aah_sun", CC-BY-SA 3.0, credited): the opposite (critical hits always, and in full). Clashes with a cursed side play out with the street plunged into darkness, a blessed one lit gold; On the table, every squad of the judged side is wrapped in it for as long as it lasts (Jack): the blessed in a slow-pulsing golden light, rays turning, motes of light rising; the cursed in a looming darkness, wisps creeping round, ash drifting off. **The hero can be put in beside the king's guard** (like the maiden; it doesn't count in an attack there). **Crests, mystery squares, brothels and audiences appear only where both sides can reach them before they go** (within 3 streets of each), where there's such a place. **A squad in the brothel is drawn inside it** (Jack): the lit doorway, curtains and lantern round its shield and number.

### Races on horseback (Jack, 2026-10-16)

**A race's odds come from the two squads' numbers** (Jack: "7 v 6"; `clashOdds(..., race)`: half and half, plus the share of the two numbers, plus morale as for a clash, kept between 10% and 90%, `RACE`); the card shows "Race! 7 v 6: 54%" and what makes it up. **It plays out on horseback** (`playRace` in `src/ui/clashScene.ts`): "Race!" and the camera dives in; "7 v 6" in each side's colour; both sides gallop in from the edges of the screen (`gallop.mp3`: congusbongus's "ground", CC-BY 4.0, from D4XX's CC0 recording; credited), war cries, swords ringing; the loser turns and rides off, untouched. **The Lord's judgement shows itself in clashes and races** (`Judged`): "Lord's grace!", that side's half of the street filling with golden light; "Heretic!", plunged into darkness. In a race under it (and only then), the loser's wiped out (`race.wiped`): the heretic's riders, or whoever faced the blessed. **The results of an audience and the Lord's judgement stay up until you click** (Jack: so you can read them), for either side. Clash and race scenes are pinned to the screen (they drifted off on the zoomed in table).

### The Lord less often, and the holy cross (Jack, 2026-10-16)

(Jack: too frequent.) An audience with the Lord comes to one side only (by the dice) in each 12 turns, about a third of the time (`AUDIENCE.call`: once in about 35 turns; it was each side, half the time, in each 7). **A holy cross on the map** now and then (`CHURCH`, the skirmish: from turn 8, 8% a turn with the map clear, 3 turns, within reach of both; a gold cross on a dark tile, glowing; "A holy cross!"): first there has the audience with the Lord (`takeChurch`); races for it like any other. Only the player's side (the guard) is called to an audience with the Lord out of the blue (Jack; `AUDIENCE.prays`); either side can still reach the holy cross for one.


### Wired into the chapter (2026-10-17, designer)

Harry merged Jack's work and asked for it in the story: the first go against your father just numbers, then the
tutorial. **Day 2**: the lesson and "Now." with `simple` rules (no fortify, no split, nothing on the map). **The
tutorial** (`TUTORIAL`): Day 4's district and rules, you the guard; the things on the map come by `script`, not
the dice: a rumble (turn 2), a crest (3), the diviner's mark (5), an audience (6), the barracks (7), the architect
(8), the holy cross (9), each waiting for the map to clear, each on an empty street next to one of yours and none
of theirs, nearest the square (`scriptPlace`). With the riot's start the district filled with the rising's crowds
and nothing could appear; a first go (`naive`) never won (it doesn't chase the bonuses, and only one crest comes).
Three crowds fewer (the back stairs, the wash house, the drain bridge): a first go wins about three in four, and
all seven things appear in nearly every game. Dawn 24. **Day 6**: the duel is the skirmish on the crag (`DUEL`),
your friend the rebels' computer player. Simulated (16 games): with the skirmish's even armies, a first go took
his camp 3 times and sensible play 16; with 2 more in his camp, 0 and 16; with 4 more, 0 and 14. Even, then.
**Day 8**: `father8` and `father8_list` with the riot's rules (`RIOT_FEATURES`). With the old start (a crowd of 3
in the cellar lane, dawn 16), a first go won none of 24; the cellar's crowd (next to the square) was decisive:
with it 2, dawn 18, a first go 12 in 32, sensible 21, careful 32 (the riot's start alone: 19 in 32). The list
game is over in 2 to 4 turns whichever name you kept.
