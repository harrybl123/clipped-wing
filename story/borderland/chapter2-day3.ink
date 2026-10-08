// ============================================================================
// Chapter 2, Day 3: weeks later. Draft text from docs/sequences/chapter-2/part-2.md, for the designer to
// rewrite. Dawn at the hollow (designer: no need to start at home), three weeks in (designer: no training
// scene; it didn't fit "three weeks running"); then the sunk town, where nobody can see it, following it to
// finds (designer liked: the dog as a way of playing), a bite of food for each (designer); then tribute
// night, the third big haul running, and the boss sends for you.
// The stages are in `c2day3` (main.ink).
// ============================================================================

// --- Dawn, the hollow ---

=== c2day3_start ===
~ dog_with_you = true
~ first_light = true
~ seeking = true
~ c2day3 = "sunk"
~ objective = "Work the sunk town with " + dog_name
~ objective_target = "picked-fields:to-sunk-town"
Three weeks now. Every morning, out here before it's light, while the settlement sleeps.
{dog_name} hears you coming before you're over the rim, and comes up out of the hollow at a run.
"Yip! Yip!" #speaker:dog
"Morning, you." #speaker:scavenger
It goes round and round your legs, and noses your satchel for the dried root it knows is in there.
"Not yet. You know the rule. Find something first." #speaker:scavenger
"Huff." #speaker:dog
Three weeks, and the sunk town's given you more than the picked fields gave you in a year. Three tribute nights, three big hauls. People are starting to talk.
The sky's going grey. Soon the fields will be full of pickers. If you're going, it's now, while there's nobody out there to see a dog.
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
~ objective_target = "sunk-town:dig-spot"
{dog_name} puts its nose to the ground at the top of the stairwell, and its tail goes up.
"sniff sniff" #speaker:dog
-> END

=== c2day3_found ===
~ sought += 1
You give {dog_name} a bit of dried root from your satchel, the way you always do. It's gone before it touches the ground.
"Yip!" #speaker:dog
{ sought >= 3:
    ~ seeking = false
    ~ haul_done = true
    ~ objective = "Climb back out with " + dog_name
    ~ objective_target = "sunk-town:to-picked-fields"
    Your satchel's so heavy the new strap creaks.
    More value than you've found in a year. In one morning.
- else:
    ~ objective = "Work the sunk town with " + dog_name + " (" + sought + " found)"
}
-> END

// Back up top with the haul: the dog sent home before anyone's about.
=== c2day3_send_home ===
~ sent_home = true
The fields are filling up with pickers now, out past the hull. Nobody's looking this way yet.
You crouch down beside {dog_name}.
"Home. The hollow. Go on." #speaker:scavenger
"Whine..." #speaker:dog
"I know. Go on." #speaker:scavenger
It goes, low and quick through the spoil heaps, and doesn't look back. #leave:dog-follow:-30:120
~ c2day3 = "tribute"
~ objective = "Pay your tribute"
~ objective_target = "tally-house:tallyman"
You sit on the stairs to the deep for the rest of the day, with your satchel between your feet, until it's time. #time:evening
~ dog_with_you = false
~ first_light = false
// The tally house fills up for tribute night (there when you arrive, not when you reach the counter).
~ tribute_night = true
// On the way, through the yard: the fence.
~ day3_yard = true
-> END

// Through the swap yard on the way to the tally: the fence has noticed too.
=== c2day3_fence ===
~ fence_met = true
"A moment. Just a moment." #speaker:fence
The fence has come out of the alcove, which you've never seen the fence do.
"Three big hauls in three weeks. Everyone in the yard's talking." #speaker:fence
"I don't ask where. Nobody asks where. But I'd pay a great deal to know where." #speaker:fence
+ [It's not for sale]
    "It's not for sale." #speaker:scavenger
    "Everything's for sale. Some things just haven't heard the price." #speaker:fence
+ [What would you pay?]
    "What would you pay?" #speaker:scavenger
    "More than the boss pays you. Think about it." #speaker:fence
- The fence goes back into the alcove, and the lamp goes down again.
-> END

// --- Evening, the tally house ---

=== c2day3_tribute ===
The queue along the rail. Everyone looking at what everyone else brought, and tonight, everyone looking at you.
Down the rail, people mutter as you pass. #bark:tribute-2:Third week running #bark:tribute-4:Where's she getting it?
The first week, they called it luck. The second, the tallyman looked twice. This is the third.
When it's your turn, you put it all on the scale. The lens. The box. The cable.
The dish goes down, and stays down.
The tallyman stops writing.
"Third week running." #speaker:tallyman
"Where?" #speaker:tallyman
+ [The sunk town]
    "The sunk town." #speaker:scavenger
    "People don't come back from the sunk town with this. People don't come back from the sunk town." #speaker:tallyman
+ [Here and there]
    "Here and there." #speaker:scavenger
    "Nobody finds this here and there." #speaker:tallyman
- The queue's gone quiet behind you. You can feel every one of them looking at your satchel.
"Out before first light every morning, this one. Back after." #speaker:enforcer
"I see you go. Never with anybody. Where to, every morning?" #speaker:enforcer
"Nowhere." #speaker:scavenger
"Nowhere's done well by you." #speaker:enforcer
"Once is luck." #speaker:boss
He's come away from the grille. He picks up the box, and weighs it in one hand, and smiles.
"Twice, I noticed. Three times..." #speaker:boss
"Well. Look who's found her feet." #speaker:boss
+ [I had a good day]
    "I had a good day." #speaker:scavenger
    "Nobody has three weeks that good." #speaker:boss
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
"Next." #speaker:tallyman
-> END

// --- Night, the shack ---

=== c2day3_bed ===
~ tribute_night = false
It's dark by the time you're home. #time:night
{dog_name}'s under the floor already, the way you taught it. You can hear it breathing.
"Is it true?" #speaker:brother
He's awake in his bed, whispering.
"The kid says you've had the biggest haul three weeks running. The kid says the boss talked to you." #speaker:brother
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
