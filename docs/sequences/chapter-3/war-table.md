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
