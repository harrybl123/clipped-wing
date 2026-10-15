// ============================================================================
// Chapter 3, Day 4: the riot. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// Your hand is "on errands" all day (clue: he's below), until the riot, when he's suddenly at your side. Your
// friend spars with you in his place, and you see the wing stitched inside his sleeve (medium choice); the
// physician asks you to get your father to rest (medium choice); a breath before it, two of three; then it
// starts: where depends on big choice 1 (the low district rises, led by the painter's brother; or the
// promenade, with the reformer). Your father hands you command of the guard on the war table (designer), and
// takes it back if you lose it; you go down to the square yourself, your hand beside you; and big choice 2:
// the leader. Stages in `c3day4` (main.ink).
// ============================================================================

// --- Dawn, your quarters ---

=== c3day4_start ===
~ c3day4 = "wake"
A note on your desk, in your hand's writing.
"Errands below all day. Your friend will spar with you. The physician wants a word. — H." #quote
Out on the balcony, someone's swishing a practice blade at the morning.
~ c3day4 = "spar"
~ objective = "Spar with your friend"
~ objective_target = "prince-quarters:heir-4"
-> END

=== c3day4_heir ===
{ c3day4 != "spar":
    "Go on. I'll find my own way out." #speaker:heir
    -> END
}
Your friend, in your hand's place, with your hand's practice blade. He salutes you with it, badly.
"He asked me to. Said you'd go soft without it." #speaker:heir
"He said that?" #speaker:prince
"He said worse. I'm being polite. Come on." #speaker:heir
He thumbs the blade on. Cyan. Yours hums into wine. #sound:shimmer #combat:spar_friend:c3day4_after_spar
-> END

// After the spar: what you saw, and the choice.
=== c3day4_after_spar ===
~ c3day4 = "sleeve"
{ spar4 == "won":
    He's on his back on the marble, laughing up at the sky. #beside:heir-4:24
    "Fine. Fine! You're still better than me." #speaker:heir
- else:
    Your blade's on the marble, and he's laughing. #beside:heir-4:24
    "First time for everything!" #speaker:heir
}
But you're not thinking about who won.
On his big lunge, his cuff turned back. Inside it, stitched small in dark thread: the wing.
He didn't see you see it. He's looking out at the city, pushing his sleeve straight.
His wing. The one on the walls below. Ask him about it, or tell the captain?
- (choose)
+ [Ask him. Just between you.]
    He'll tell you something, true or not, and he'll know you saw. Nobody else will.
    ++ [Yes. Ask him.]
        ~ sleeve = "asked"
        ~ lean += 1
        "Your cuff." #speaker:prince
        He looks down at it. Then he laughs.
        "That? A girl stitched it. Below. Don't tell my mother." #speaker:heir
        "Is that all it is?" #speaker:prince
        "It's a wing. It's pretty. Everyone's got one." #speaker:heir
        He holds your eye a moment longer than he needs to.
        "Thanks for asking me. And not someone else." #speaker:heir
    ++ [No. Think again.]
        -> choose
+ [Tell the captain. It's his job.]
    The captain will watch him from now on. Your friend won't know it was you. The captain will trust you more.
    ++ [Yes. Tell the captain.]
        ~ sleeve = "told"
        ~ lean -= 1
        ~ standing += 1
        You say nothing. You laugh at his joke about your footwork.
    ++ [No. Think again.]
        -> choose
- "Same time tomorrow? I'll bring my own blade. His is heavy." #speaker:heir
He goes in, tossing the practice blade from hand to hand. #leave:heir-4:36:50
{ sleeve == "told":
    ~ c3day4 = "captain"
    ~ objective = "Tell the captain"
    ~ objective_target = "citadel-halls:captain-4"
- else:
    ~ c3day4 = "physician"
    ~ objective = "Talk to the physician"
    ~ objective_target = "citadel-halls:physician-4"
}
-> END

// --- Morning, the halls ---

=== c3day4_captain ===
{ c3day4 != "captain":
    "Highness." #speaker:captain
    -> END
}
"Highness." #speaker:captain
"My friend. He's got the wing stitched inside his sleeve." #speaker:prince
He doesn't write it down. He doesn't need to.
"Thank you, Highness. We'll keep an eye. He won't know." #speaker:captain
"Your father will hear you told me." #speaker:captain
~ c3day4 = "physician"
~ objective = "Talk to the physician"
~ objective_target = "citadel-halls:physician-4"
-> END

// The physician on the stair: your father hasn't slept.
=== c3day4_physician ===
{ c3day4 != "physician":
    "Highness." #speaker:physician
    -> END
}
"Highness. A word, while there's nobody on the stair." #speaker:physician
"Your father hasn't slept since the streets were cut. He's in the sealed wing half the night." #speaker:physician
"Persuade him to rest. Take some of it off him. He'll hear it from you. He won't from me." #speaker:physician
Go to your father and get him to rest, taking his work on yourself? Or leave him be?
- (choose)
+ [Do it. Take some of it off him.]
    You'll go to his study now. If he listens, more of his work is yours, tonight's too.
    ++ [Yes. Go to him.]
        ~ physician = "yes"
        "I'll go now." #speaker:prince
        "Thank you, Highness." #speaker:physician
        ~ c3day4 = "persuade"
        ~ objective = "Go to your father's study"
        ~ objective_target = "fathers-study:father-4"
    ++ [No. Think again.]
        -> choose
+ [Refuse. He wouldn't thank you.]
    He goes on as he is. The physician will remember you said no.
    ++ [Yes. Refuse.]
        ~ physician = "no"
        "He wouldn't thank me. You know he wouldn't." #speaker:prince
        "No, Highness. I suppose he wouldn't." #speaker:physician
        He goes on up the stair, without looking back.
        -> c3day4_afternoon
    ++ [No. Think again.]
        -> choose
- -> END

// In his study: you persuade him.
=== c3day4_father ===
{ c3day4 != "persuade":
    He doesn't look up.
    -> END
}
Your father, at his desk. The fire's out. He's still in yesterday's clothes.
"You should be with your friend." #speaker:father
"You should be in bed." #speaker:prince
He looks up at that.
"Who sent you? The physician." #speaker:father
"I did. Let me take some of it. You taught me the table. Let me use it." #speaker:prince
For a long moment he says nothing. Then he puts his pen down.
"Then tonight's yours." #speaker:father
"Whatever happens in this city tonight, it's yours to answer. I'll sleep." #speaker:father
-> c3day4_afternoon

// --- Afternoon: a breath before it (two of three) ---

=== c3day4_afternoon ===
~ c3day4 = "afternoon"
~ objective = "Wait for the evening"
-> c3day4_next
// After each: the markers on what's left, until you've done two.
=== c3day4_next ===
{ afternoon4 >= 2:
    -> c3day4_dusk
}
{
- table4:
    ~ objective_target = "lifts:painter-4,citadel-halls:sister-4"
- painter4:
    ~ objective_target = "council-chamber:table-4,citadel-halls:sister-4"
- sister4:
    ~ objective_target = "council-chamber:table-4,lifts:painter-4"
- else:
    ~ objective_target = "council-chamber:table-4,lifts:painter-4,citadel-halls:sister-4"
}
{ afternoon4 == 0:
    It's past noon. #time:afternoon
}
-> END

// The table of light in the council chamber: the dark district on it, and a crowd.
=== c3day4_table_light ===
~ table4 = true
~ afternoon4 += 1
The table of light, alone in the empty chamber. The whole city on it, drawn small.
{ energy == "high":
    The low district's a darker blue than yesterday. And in the middle of it, a smudge of light that wasn't there: people. A lot of them, in one place.
- else:
    The promenade's a darker blue than yesterday. And in the middle of it, a smudge of light that wasn't there: people. A lot of them, in one place.
}
It grows while you watch.
-> c3day4_next

// The kid, at the foot of the lifts.
=== c3day4_painter ===
{ painter4:
    He's gone back into the street.
    -> END
}
~ painter4 = true
~ afternoon4 += 1
The kid from the cellar, at the foot of the lifts, where the street starts. Watching the lifts come down.
He sees you, and doesn't run.
"They're moving my brother tonight. Up to you. Through the streets, so everyone sees." #speaker:painter
"Who told you that?" #speaker:prince
"Everyone knows. Everyone's going to be there." #speaker:painter
He looks at you a moment longer, then goes back into the street. #leave:painter-4:30:40
-> c3day4_next

// Your sister, in the halls.
=== c3day4_sister ===
{ sister4:
    "Go on. I'm counting." #speaker:sister
    -> END
}
~ sister4 = true
~ afternoon4 += 1
Your sister, at the gallery's rail, looking down at the great doors.
"The captain's men have been arming since noon. Pikes, not batons." #speaker:sister
"I've counted forty go out. Nobody's told me why. Has anyone told you?" #speaker:sister
"No." #speaker:prince
"Then it's something he doesn't want us to know until it's happened." #speaker:sister
-> c3day4_next

// Two done: the evening.
=== c3day4_dusk ===
~ c3day4 = "evening"
~ objective = "Go back to your rooms"
~ objective_target = "prince-quarters:telescope"
The light's going. #time:evening
-> END

// --- Evening: it starts (a trigger on the balcony) ---

=== c3day4_riot_start ===
~ c3day4 = "table"
{ energy == "high":
    ~ riot_leader = "firebrand"
- else:
    ~ riot_leader = "reformer"
}
A sound comes up from the city that you've never heard from up here. Thousands of voices at once.
Then fire.
{ riot_leader == "firebrand":
    Down in the low district, in the dark streets, something's burning. Then something else.
- else:
    On the promenade, in the dark, the glass is breaking. Then something's burning.
}
The captain, behind you, out of breath. #beside:captain-4e:-40
{ riot_leader == "firebrand":
    "They were moving a prisoner up through the low district. The street closed round the watch, and he got free." #speaker:captain
    "The painter's brother. He's leading them." #speaker:captain
- else:
    "The reformer went down to the promenade to speak to them. There was a crowd already waiting." #speaker:captain
    "They're calling his name." #speaker:captain
}
"Your father wants you. The simulation room." #speaker:captain
~ objective = "Go to your father"
~ objective_target = "simulation-room:father-4s"
-> END

// The simulation room: the table, lit with the real city.
=== c3day4_father_room ===
{ c3day4 != "table" || room4:
    "The table." #speaker:father
    -> END
}
~ room4 = true
The table's lit. Not the lesson's soft blue: the city as it is tonight, the district close up, burning.
{ physician == "yes":
    "You wanted some of it off me. Tonight's yours." #speaker:father
    "The guard is yours. Your orders." #speaker:father
- else:
    "Show me what you learnt." #speaker:father
    "The guard is yours tonight. Your orders." #speaker:father
}
"If you lose it, I take it back." #speaker:father
~ objective = "Put down the riot"
~ objective_target = "simulation-room:table-4"
-> END

=== c3day4_table ===
{ c3day4 != "table":
    The table's dark.
    -> END
}
{ riot_leader == "firebrand":
    You put your hands on the table. It knows them. #wartable:riot_low
- else:
    You put your hands on the table. It knows them. #wartable:riot_promenade
}
-> END

// --- The war table, for real (src/data/warTable.ts, RIOTS; src/scenes/RiotTableScene.ts) ---

=== c3day4_riot_intro ===
"The guard's yours: the blue." #speaker:father
"The rising's the amber. It grows in the square, behind its barricades. Every few turns it sends a crowd out into any empty street next to it." #speaker:father
"The crowds want the stair up, to us. If they take it, I take the table back." #speaker:father
"Every couple of turns, more of the guard comes off the lifts. Every few, you can cut the power under a crowd." #speaker:father
"Same rules as before. Except the guard's pikes: they hold at one more than their number." #speaker:father
-> END

=== c3day4_riot_goal_market ===
{ riot_leader == "firebrand":
    "First, the market street. It's theirs. Take it back." #speaker:father
- else:
    "First, the shopfronts. They're theirs. Take them back." #speaker:father
}
-> END

=== c3day4_riot_goal_screens ===
{ riot_leader == "firebrand":
    "Now the screens' street. Then the square's on its own." #speaker:father
- else:
    "Now the great screen. Then the square's on its own." #speaker:father
}
-> END

=== c3day4_riot_goal_seal ===
"Seal the square. A squad on every street into it." #speaker:father
"While a street into it's empty, it'll keep pouring out." #speaker:father
-> END

=== c3day4_riot_goal_clear ===
"Sealed. Now break whatever's still out in the streets." #speaker:father
-> END

=== c3day4_riot_goal_square ===
"It's on its own. Nothing gets in, nothing gets out." #speaker:father
"The square. You'll go down yourself. Some fights you don't leave to the table." #speaker:father
-> END

// Things going badly (each once). He only speaks when you're losing (plan).
=== c3day4_riot_lost ===
"You lost that one." #speaker:father
"They're not soldiers. They don't need to be. There are more of them." #speaker:father
-> END

=== c3day4_riot_spread ===
"There. Out of the square, into the street. It'll keep doing that." #speaker:father
-> END

=== c3day4_riot_stair ===
"They're next to the stair." #speaker:father
He doesn't say anything else. He doesn't need to.
-> END

=== c3day4_riot_reinforce ===
"More of the guard, off the lifts." #speaker:father
-> END

=== c3day4_riot_power ===
"The power. Use it. It's what it's for." #speaker:father
-> END

// They took the stair: he takes command (designer).
=== c3day4_riot_taken ===
His hand comes down on the table over yours.
"Enough." #speaker:father
He moves your squads without looking at them. Every crowd outside the square, broken, one after another.
"Go down. Bring me their leader. You can manage that." #speaker:father
-> END

// Going down to the square yourself.
=== c3day4_riot_dropin ===
Down. In the plain coat, open: the wine at your collar showing, for once.
Your hand's at your side before you reach the lifts. From nowhere.
"Where have you been?" #speaker:prince
"Below. Errands. Blade on. All the way." #speaker:diplomat
Your blade hums into wine, bright, for the first time not dulled. #sound:shimmer
-> END

// --- The square (after the fight; played in the district) ---

=== c3day4_square ===
~ c3day4 = "square"
~ hand_with_you = false
The square. Smoke, and the barricades burning down. The guard's line of pikes across it, the crowd held back behind.
{ scrubbed:
    The walls the warden's men scrubbed are painted again. Fresh: wings, top to bottom, the paint still running.
- else:
    Every wall's a wall of wings, chalk and paint and scratches, one on another.
}
{ riot_leader == "firebrand":
    On the ground in front of the guard, held down by two of them: the painter's brother. #show:leader-4
- else:
    On the ground in front of the guard, held down by two of them: the reformer, in his council robe, torn. #show:leader-4
}
{ riot_table == "taken":
    The captain's here. He looks at you the way he'd look at a boy. #show:captain-4q
- else:
    The captain's here. "Your orders held, Highness." #speaker:captain #show:captain-4q
}
The crowd sees your face. The screens over the square show it too, a moment, then cut out.
Your hand, close, quiet.
"Make an example of him. They'll remember what you do now." #speaker:diplomat
{ riot_leader == "firebrand":
    The painter's brother looks up at you. The man walked past you to the lifts. This time he knows who you are.
- else:
    The reformer looks up at you. "I only came to talk to them, Highness. They were already here."  #speaker:reformer
}
What do you do with him?
- (choose)
+ [Bring him in. Up to the citadel.]
    He's taken up to the citadel, in front of all of them. Upper society will approve. What happens to him there is your father's.
    ++ [Yes. Bring him in.]
        ~ riot = "brought_in"
        ~ lean -= 2
        ~ standing += 2
        "Bring him in." #speaker:prince
        The captain's men lift him, and walk him through the line, towards the lifts. #leave:leader-4:500:40 #leave:guard-4a:500:40 #leave:guard-4b:500:40
        The crowd makes a sound you'll remember. Then it starts to go, a few at a time, then all of it.
        ~ objective = ""
    ++ [No. Think again.]
        -> choose
+ [Let him go. Here, in front of them.]
    He walks back into the crowd. They'll see mercy. Your father will see that you let the man who led it go.
    ++ [Yes. Let him go.]
        ~ riot = "let_go"
        ~ lean += 2
        ~ standing -= 2
        "Let him go." #speaker:prince
        The guard looks at the captain. The captain looks at you. Then they let go of him.
        He gets up slowly, and walks back into the crowd. It closes round him. #leave:leader-4:900:40
        Your hand steps past you, up onto the edge of the fountain, where they can all see him.
        "Go home. You've been heard. Tonight, you've been heard. Go home." #speaker:diplomat
        And they listen to him. A few at a time, then all of it, they go.
        He steps down. He doesn't look at you.
    ++ [No. Think again.]
        -> choose
- The square empties. #leave:crowd-4a:960:50 #leave:crowd-4b:960:50 #leave:crowd-4c:960:50 #leave:crowd-4d:960:50 #leave:crowd-4e:960:50 #leave:crowd-4f:960:50
~ c3day4 = "night"
~ objective = "Go to your father's study"
~ objective_target = "fathers-study:father-4n"
"Home, Highness. It's done." #speaker:diplomat #time:night #goto:fathers-study:60:230
-> END

// The crowd, held back behind the pikes.
=== c3day4_crowd ===
{ shuffle:
- They look at you, and don't say anything.
- "We were only asking for the lights!" #speaker:them
- "Look at him. Look at his coat." #speaker:them
- "You'll remember tonight. So will we." #speaker:them
}
-> END

// --- Night ---

=== c3day4_father_night ===
{ c3day4 != "night":
    He's asleep in his chair.
    -> END
}
{ c3day4_father_night > 1:
    "Go to bed." #speaker:father
    -> END
}
Your father, by his fire. It's lit tonight. Smoke still over the city, out of his window.
{ riot == "brought_in":
    "You did what had to be done." #speaker:father
    "He'll be dealt with. You don't need to think about it again." #speaker:father
- else:
    "Mercy is something you can afford once." #speaker:father
    "You've had your once." #speaker:father
}
{ riot_table == "taken":
    "And next time, keep the stair." #speaker:father
}
~ objective = "Go to bed"
~ objective_target = "prince-quarters:bed-4"
-> END

=== c3day4_sister_night ===
Your sister, at your telescope, on your balcony. Not looking through it.
"You were down there." #speaker:sister
"Yes." #speaker:prince
"I watched. I could see your blade from here. A little line of light, in all of that." #speaker:sister
She doesn't say anything else, and neither do you.
-> END

=== c3day4_bed ===
~ plain_coat = false
~ c3day4 = "done"
~ c3day5 = "wake"
~ objective = ""
~ objective_target = ""
You lie in the dark. Your hands still smell of the smoke. #wake:prince-quarters:120:226 #endday:Day 5
-> END
