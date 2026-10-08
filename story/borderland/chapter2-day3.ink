// ============================================================================
// Chapter 2, Day 3: weeks later. Draft text from docs/sequences/chapter-2/part-2.md, for the designer to
// rewrite. Dawn at the hollow (designer: no need to start at home): training, the dog finding what you
// buried; then the sunk town, where nobody can see it, following it to finds (designer liked: the dog as a
// way of playing); then tribute night, where you pay double and more, and the boss sends for you.
// The stages are in `c2day3` (main.ink).
// ============================================================================

// --- Dawn, the hollow ---

=== c2day3_start ===
~ dog_with_you = true
~ training = true
~ objective = "Follow " + dog_name + " down into the hollow"
~ objective_target = ""
You've been coming out here for weeks now, every morning before it's light, while the settlement sleeps.
You bury something. You walk {dog_name} round the rim and back. You let it go.
"Woof!" #speaker:dog
At first it found nothing but bones. Now it finds everything. This morning you buried two things, deep, down in the bottom of the hollow.
Go down with it. When it starts to dig, dig beside it.
-> END

=== c2day3_train_1 ===
~ trained_1 = true
The wire you dug up on the fields, a lifetime ago. {dog_name} had it in a breath.
"Huff." #speaker:dog
-> c2day3_trained

=== c2day3_train_2 ===
~ trained_2 = true
The disc, the first thing it ever found for you, buried an arm's length down. It dug straight to it.
"Woof!" #speaker:dog
-> c2day3_trained

=== c2day3_trained ===
{ not (trained_1 && trained_2):
    ~ objective = "Follow " + dog_name + " to the other one"
}
{ trained_1 && trained_2:
    ~ training = false
    ~ seeking = true
    ~ c2day3 = "sunk"
    ~ objective = "Work the sunk town with " + dog_name
    ~ objective_target = "picked-fields:to-sunk-town"
    It sits, and looks at you, and waits.
    "Woof." #speaker:dog
    It's ready. You've known that for a week. You just haven't wanted to find out what happens next.
}
-> END

// --- The sunk town ---

=== c2day3_find_1 ===
~ sought_1 = true
In the long room, under the shelves everyone's already cleared, {dog_name} digs out a lens as wide as your palm. Clear as water. Not a scratch on it.
-> c2day3_found

=== c2day3_find_2 ===
~ sought_2 = true
In the hall of boxes, where every box was prised open years ago, there's one more, buried under the others. Sealed. Heavy. Something inside it shifts when you tilt it.
-> c2day3_found

=== c2day3_find_3 ===
~ sought_3 = true
In the tunnel, under the carriage, a coil of cable as thick as your arm, its sheath cracked and something bright inside.
-> c2day3_found

// Coming down into the sunk town with it: no marker from here (the dog's nose is the guide).
=== c2day3_arrive ===
~ seek_arrived = true
~ objective_target = ""
{dog_name} puts its nose to the ground at the top of the stairwell, and its tail goes up.
"sniff sniff" #speaker:dog
-> END

=== c2day3_found ===
~ sought += 1
"Woof!" #speaker:dog
{ sought >= 3:
    ~ seeking = false
    ~ c2day3 = "tribute"
    ~ objective = "Pay your tribute"
    ~ objective_target = "tally-house:tallyman"
    Your satchel's so heavy the new strap creaks.
    More than you've found in a year. More than double. In one afternoon.
    You send {dog_name} back to the hollow before you go anywhere near the settlement. It knows the way.
    "Woof." #speaker:dog
    It goes, low and quick, and doesn't look back. #leave:dog-follow:1060:130 #time:evening
    ~ dog_with_you = false
- else:
    ~ objective = "Work the sunk town with " + dog_name + " (" + sought + " found)"
}
-> END

// --- Evening, the tally house ---

=== c2day3_tribute ===
~ tribute_night = true
The queue along the rail. Everyone looking at what everyone else brought.
When it's your turn, you put it all on the scale. The lens. The box. The cable.
The dish goes down, and stays down.
The tallyman stops writing.
"Where?" #speaker:tallyman
+ [The sunk town]
    "The sunk town." #speaker:scavenger
    "People don't come back from the sunk town with this. People don't come back from the sunk town." #speaker:tallyman
+ [Here and there]
    "Here and there." #speaker:scavenger
    "Nobody finds this here and there." #speaker:tallyman
- The queue's gone quiet behind you. You can feel every one of them looking at your satchel.
"Double, I said." #speaker:boss
He's come away from the grille. He picks up the box, and weighs it in one hand, and smiles.
"And she brings me four times." #speaker:boss
"Well. Look who's found her feet." #speaker:boss
+ [I had a good day]
    "I had a good day." #speaker:scavenger
    "Nobody has a day that good." #speaker:boss
+ [Say nothing]
    You say nothing. It seems the safest thing.
- "Come up to the house tomorrow. We should talk, you and I." #speaker:boss
He puts the box back on the scale, gently, and goes.
The watcher stays a moment longer, looking at you, and then follows him.
~ owe_double = false
~ summoned = true
~ c2day3 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
"Next." #speaker:tallyman #time:night
~ tribute_night = false
-> END

// --- Night, the shack ---

=== c2day3_bed ===
{dog_name}'s under the floor already, the way you taught it. You can hear it breathing.
"Is it true?" #speaker:brother
He's awake in his bed, whispering.
"The kid says you put four times on the scale. The kid says the boss talked to you." #speaker:brother
"The kid says a lot." #speaker:scavenger
"I didn't tell him. About. You know." #speaker:brother
"I said it was rats, under the floor. Is a dog like a rat?" #speaker:brother
+ [Not really]
    "Not really." #speaker:scavenger
    "Oh." #speaker:brother
+ [Good thinking]
    "Good thinking." #speaker:scavenger
    He goes quiet, pleased with himself, and is asleep in a minute.
- The boss wants to see you tomorrow. You lie awake a long time, wondering what for.
~ c2day3 = "done"
~ c2day4 = "gate"
~ objective = ""
~ objective_target = ""
And whether he already knows. #wake:compound:40:232:c2day4_start #endday:Day 4
-> END
