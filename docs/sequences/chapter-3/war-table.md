# The war table

Chapter 3's tactics game: taught on Day 2 (the lesson in the simulation room), played for real on Day 4 (the riot), and meant to be played again. Rules in `src/systems/Riot.ts`; maps and set-ups in `src/data/warTable.ts`; the screen in `src/scenes/RiotTableScene.ts`; computer players in `src/systems/RiotPlayers.ts`; the balance kept by `tests/riotGame.test.ts`.

**What the designer asked for:** a real game you can play, fun and tactical (2026-10-15); worked out by simulated play, taking from other games; then, after playing a first version that was confusing ("I almost liked the simplicity of the old game"): the old game's simplicity with the riot's additions, a middle ground, a clean design, every rule thought about, keep it simple; and the markers for who's who made clear. You lose only by losing the game.

## The rules

The old table's, as Harry knew them:

- Squads are numbers. Each turn every squad can move one step along a street, or stay.
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

Everything else is the rising playing by the same rules (`risingOrders`; `RISING_STYLE`): crowds go for the guard (the lifts' foot most of all, to cut off the guard coming down); they throw themselves at a squad even when they'll lose, if there are 2 or more of them, so it costs the guard; two crowds join up when together they could take a squad; they fall back into the square when the guard come for it. Moves happen together: a squad moving out of a place goes before one moving in, so nobody's carried along.

## The screen

Hardly any words (designer: it was too cluttered). The district as a street plan in light; the rising's squads amber circles, each with fire and a crowd round it, smoke going up; the guard's blue shields; the number on each; a ring round every place in the colour of whoever holds it. The other side's arrows dashed (and the square's next crowd), yours solid. A note in the corner: dawn, or the lesson's goal. A card only when the mouse rests on a place a moment (designer: big text boxes are annoying): its name, whose it is and how strong; choosing where to send a squad, just the sum, in a line by the place ("5 v 4: you take it, 1 left"). "+1" floats off the square each turn, "+2" off the lifts, "2 out" where a crowd's sent; after a fight, what each side lost.

Controls (the old table's): pick a squad of yours (E or click), the arrows step round where it can go, E or click to send it (its own place to hold), Esc or right-click back, Tab to the next squad, Enter or the button to end the turn; as the guard, P or the button for the power.

## Day 2: the lesson (you're the rising)

As planned: "A district rises. You'll be the rising. I'll be the guard." On the low district's map, his moves shown, one goal at a time, his line the first time each rule comes up (the square growing, his guard arriving; a tie, a lost fight, joining, giving no orders):

1. Take the Weavers' Row: 3 of yours against 2 of his (the bigger number wins, and keeps what's over).
2. Take the market street: 3 of his; join two of yours first.
3. Take the screens' street, and you go down yourself (the light-guards fight).

Then "Now.": the table set up again (your square 12 behind its barricades, crowds round the district, his guard along the top), no arrows, and he plays the guard to win: he cuts your power ("It helps to have a city on your side."), and takes your square. Tested: whatever the rising does (as the computer plays it, piling everything into the square, or doing nothing), he takes it, never at once, in 3 to 7 turns.

## Day 4: the riot (you're the guard)

The riot's set-up: the guard along the way up, 15 of them (4 at the lifts' foot, 4 on the stair, 4 at the arches, 3 at the lamp shop); the square 10; crowds of 3 across the district, two of them in the streets next to the square and one at the back stairs, close to yours.

## What simulation showed

Computer players of different skill as the guard, over 16 starting positions (the riot's, with the crowds varied):

| Player | Takes the square | When | The rising attacks them |
| --- | --- | --- | --- |
| Random orders, or none | never | | |
| Sensible (one turn ahead) | about two in three | turn 13 of 18 (the riot's own set-up: turn 16) | about 9 times a game, taking 2 or 3 squads |
| Careful (two turns ahead; thinks about order and the power) | always | turn 10 | about 8 times, taking 1 |

The rising's way of playing, tested against the same guard (designer: it just sat in the square): as it was, crowds attacked about 3 times a game; with no fleeing and hunting the guard, 4; the square stepping out to strike, easier for the guard (it left the square empty) and dropped; gathering into bigger crowds, no better; throwing themselves at the guard even when they'd lose, 5; the square sending crowds out, 5 to 6. Both of those together, with a bigger rising so it's still a fair fight (the square 10, crowds of 3): about 10. Without the square sending crowds out, it hoarded everything again (6 attacks) and nobody sensible could win. Then (designer, having played it: about 20% too hard) dawn comes 2 turns later (18) and the square sends crowds out from over 9 rather than 8: sensible play from half to two in three. (One more in each of the guard's squads made it as easy, but let a careful player rush the square on turn 3.)

How it got here: the first version was a different game (unrest from 0 to 3 that spread like a disease, charging and quelling, storming the barricades): tested well by the numbers, but it didn't make sense to play (designer). Back to the old table's rules, then: rushing with every squad at once took the square by turn 2, which was the old table letting a squad be joined and carried on in the same turn (now moves happen together) and the square being too small; with crowds falling back into the square, nobody could win at all, because the square grew as fast as the guard did and every fight cost what it won, so the guard now get 2 a turn to the square's 1. Risk's idea (the square growing with the places the rising holds) was tried and dropped: one more thing to count (designer: keep it simple).

## Later

- Other days' games (the raid, the broadcast) can be new set-ups on the same rules.
