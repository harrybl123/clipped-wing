// ============================================================================
// Chapter 3, Day 5: terrorists. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// The morning after the riot. Your father hardens, in the open now: his address from the throne, the word on
// every screen, your face beside his (pushback 3). The captain's warrants for meeting places, the hideout's
// cellar among them (pushback 4): seal them all, or strike the cellar off. Your sister has found the gap in
// the sealed wing's guard. Below with your hand: they want to talk to you, after last night; your hand steps
// out for air (clue 5); the raid (medium choice: step in, or out the back way and watch). Stages in `c3day5`
// (main.ink).
// ============================================================================

// --- Dawn, your quarters: the captain with the day ---

=== c3day5_start ===
~ c3day5 = "wake"
A knock, before it's light. Not your hand's knock. #show:captain-5
The captain, in the doorway, in yesterday's armour. #beside:captain-5:40:walk
"Highness. Your father's orders for the day." #speaker:captain
"His address, this morning, from the throne. You're to stand beside him." #speaker:captain
"Then my warrants, at my post. They need your seal." #speaker:captain
He goes. Under your door, a folded note, in your hand's writing. #leave:captain-5:36:50
"Tonight. Below. They want to talk to you. After last night. — H." #quote
~ c3day5 = "address"
~ objective = "Stand beside your father"
~ objective_target = "audience-hall:mark-5"
-> END

// --- Morning, the audience hall: the address (pushback 3) ---

=== c3day5_address ===
{ c3day5 != "address":
    -> END
}
~ c3day5 = "speech"
You take your place, a step below the throne. Your father's already on it.
The hall's full. Courtiers to the doors. And everywhere, the screens' eyes, little lenses, turned on the dais.
"Stand straight." #speaker:father
He waits until the hall is silent. Then he speaks, quietly, and every screen in the city speaks with him.
"Last night, a few hundred people set fire to their own streets." #speaker:father
"They were not hungry. They were not cold. They were led." #speaker:father
"There is a word for people who burn a city to frighten it." #speaker:father
"Terrorists." #speaker:father
~ screens5 = "terror"
On the great screen over his head, the word. TERRORISTS. And under it, his face, and yours. #shake
{ riot_table == "won":
    "The guard held. My son commanded them himself, through the night, and took the square back street by street." #speaker:father
- else:
    "The guard held. My son stood with them through the night." #speaker:father
}
{ riot == "brought_in":
    "The man who led them was executed at dawn." #speaker:father
    A murmur, round the hall. Nobody looks at you. #sound:murmur
    You believe it. Why wouldn't you?
- else:
    ~ screens5 = "wanted"
    "The man who led them is still among you." #speaker:father
    His face goes up on the screen beside the word. WANTED. #shake
    "Anyone who shelters him shelters terror." #speaker:father
    He doesn't look at you. He doesn't need to.
}
"See something, say something. You will be rewarded. You will be safe." #speaker:father
At the end, he stands, and puts his hand on your shoulder.
{ screens5 == "wanted":
    ~ screens5 = "wanted_hand"
- else:
    ~ screens5 = "terror_hand"
}
On the great screen, and on every screen in the city, there it is. His hand on your shoulder.
~ c3day5 = "warrants"
The hall empties. The captain's already gone. #time:afternoon
~ objective = "Sign the warrants"
~ objective_target = "citadel-halls:captain-5h"
-> END

// Waiting for the address (anyone you speak to on the way to your place).
=== c3day5_father_wait ===
"Your place, please." #speaker:father
-> END

=== c3day5_courtier ===
{ shuffle:
- "Highness." #speaker:them
- "A terrible night, Highness. Terrible." #speaker:them
- They bow, and look past you at the screens.
}
-> END

=== c3day5_hand_address ===
"Later, Highness. Not here." #speaker:diplomat
-> END

// --- Afternoon, the halls: the captain's warrants (pushback 4) ---

=== c3day5_warrants ===
{ c3day5 != "warrants":
    "Highness." #speaker:captain
    -> END
}
"Highness. The warrants." #speaker:captain
"Now the word's been said, we can go in." #speaker:captain
He hands you the list. Four places "of concern", each with a line for your seal.
A laundry on the stair-street. #quote
The back room of a noodle shop. #quote
A school, after hours. #quote
A cellar under the low district, past the lamp shop. #quote
The last one's the hideout. The kid in the corner. The barkeep. Every table you listened in on.
{ sleeve == "told":
    "And Highness. Your friend's been keeping late company. Below. We're keeping an eye, as you asked." #speaker:captain
}
"Seal them, and the guard goes in tonight. All four." #speaker:captain
Seal them all, or strike the cellar off?
+ [Seal them all.]
    ~ warrants = "sealed"
    ~ lean -= 1
    ~ standing += 1
    ~ list5 = true
    You press your seal on all four lines. The cellar too.
    "Thank you, Highness. Tonight, then." #speaker:captain
+ [Strike the cellar off. Seal the rest.]
    ~ warrants = "struck"
    ~ lean += 1
    You draw a line through the cellar, and seal the other three.
    The captain watches the line go through it. He doesn't ask why.
    "I'll take it to your father as it is, Highness." #speaker:captain
- He goes. #leave:captain-5h:530:40
~ c3day5 = "evening"
The light's going. #time:evening
~ objective = "Go back to your rooms"
~ objective_target = "prince-quarters:sister-5"
-> END

// --- Evening, your quarters ---

// If you struck the cellar off: the list, back on your desk (a trigger as you come in).
=== c3day5_list ===
~ list5 = true
On your desk, the captain's list. Sent back.
The cellar, struck through in your ink. And beside it, his seal. Pressed hard.
He's corrected you again.
-> END

// Your sister, short and sharp: she's found the gap in the sealed wing's guard (sets up Day 6).
=== c3day5_sister ===
{ c3day5 != "evening":
    "Go on. Wherever it is you go." #speaker:sister
    -> END
}
Your sister, on the end of your bed, waiting for you.
"You were on every screen in the city this morning. You looked like him." #speaker:sister
"I've found it. The gap." #speaker:sister
"The sealed wing. At the third bell the guard changes, and the corridor's empty. A minute. Not even." #speaker:sister
"I'm going in. One night." #speaker:sister
"What do you think's in there?" #speaker:prince
"Whatever he goes in there for, half the night. Every night." #speaker:sister
"Don't tell him." #speaker:sister
She goes before you can answer. #leave:sister-5:36:50
~ c3day5 = "office"
~ objective = "Go below with your hand"
~ objective_target = "diplomats-office:hand-5o"
-> END

// --- Night: below, with your hand ---

=== c3day5_office ===
"Coat. They're waiting." #speaker:diplomat #time:night
~ plain_coat = true
~ hand_with_you = true
~ c3day5 = "below"
~ objective = "Go down to the low district"
~ objective_target = "lifts:to-low-district"
He's through his door before you've got it on. #goto:lifts:64:130
-> END

// Coming into the low district (a trigger): the new word on the screens, and nobody out.
=== c3day5_low ===
~ low5 = true
The low district, and not a soul in the street.
{ screens5 == "wanted_hand":
    Every screen says the same thing: TERRORISTS. Then WANTED, and the face of the man you let go.
- else:
    Every screen says the same thing: TERRORISTS. Then the old notice. REPORT. REWARD.
}
And between them, a moment, every time: your father's hand on your shoulder.
"They asked for you. By name." #speaker:diplomat
"Who did?" #speaker:prince
"All of them. Hood up. Down you go." #speaker:diplomat
~ objective = "Go down to the cellar"
~ objective_target = "low-district:to-hideout"
-> END

// --- Night, the hideout: they want to talk to you (a trigger at the foot of the steps) ---

=== c3day5_hideout ===
~ c3day5 = "hideout"
~ hand_with_you = false
The cellar goes quiet as you come down the steps. Not the quiet of strangers. Every head turns.
They know who you are. All of them.
Your hand comes down behind you, and leans on the wall by the steps.
"Keep your hood up, Highness. Not for us. For whoever's watching the door." #speaker:hideout_keeper
~ objective = "Hear them out"
~ objective_target = "hideout:keeper-5"
-> END

// Your hand, by the steps.
=== c3day5_hand ===
"Go on. They're waiting for you, not me." #speaker:diplomat
-> END

// Everyone else, looking at you.
=== c3day5_crowd ===
{ shuffle:
- They look at you, and don't say anything.
- "Go on. Talk to them. They've waited all day." #speaker:them
- "Highness." Said flat, like a name for a dog. #speaker:them
}
-> END

// After each of them: the marker moves on; after the third, the raid.
=== c3day5_heard ===
~ heard5 += 1
{
- not keeper5:
    ~ objective_target = "hideout:keeper-5"
- not angry5:
    ~ objective_target = "hideout:angry-5"
- not painter5:
    ~ objective_target = "hideout:painter-5"
- else:
    -> c3day5_air
}
-> END

// The barkeep: they know what you did at the table.
=== c3day5_keeper ===
{ keeper5:
    "Talk to them, not me." #speaker:hideout_keeper
    -> END
}
~ keeper5 = true
He puts a cup in front of you you didn't ask for.
{ riot_table == "won":
    "They're saying you gave the guard every order yourself last night. Street by street." #speaker:hideout_keeper
    "Took the square before dawn. Quicker than your father ever did." #speaker:hideout_keeper
    "Is that true?" #speaker:hideout_keeper
    "Yes." #speaker:prince
    He nods slowly, as if you'd told him the price of something.
- else:
    "They're saying you had the guard all night. And the square burned till morning, and then your father took it in an hour." #speaker:hideout_keeper
    "Is that true?" #speaker:prince
    "Near enough." #speaker:hideout_keeper
    "Then you lost." #speaker:hideout_keeper
    "Some of us think that's the best thing anyone's ever said about you." #speaker:hideout_keeper
}
"They'll all want a word. Let them have it." #speaker:hideout_keeper
-> c3day5_heard

// A woman whose husband was on the square.
=== c3day5_angry ===
{ angry5:
    She's turned her back on you.
    -> END
}
{ not keeper5:
    She looks at you, then at the barkeep. Him first.
    -> END
}
~ angry5 = true
A woman at the long table, her coat still on. She doesn't wait to be spoken to.
"My husband was on the square last night. He went to see. That's all. To see." #speaker:them
"Your guard came through it with pikes. He's not come home." #speaker:them
{ riot == "let_go":
    "You let the one who led it walk. Everyone's saying it. Good for you." #speaker:them
    "My husband led nobody." #speaker:them
- else:
    "And the one who led it's dead by dawn, they're saying. On your say-so." #speaker:them
    "My husband led nobody." #speaker:them
}
"Will you find him? You can, can't you. You've only to ask." #speaker:them
"I'll ask." #speaker:prince
"You'll ask." #speaker:them
She looks at you a long moment.
"Why am I even telling you." #speaker:them
"Because nobody else up there would listen." #speaker:prince
She doesn't say yes. She doesn't say no.
-> c3day5_heard

// The painter: his brother.
=== c3day5_painter ===
{ painter5:
    He's watching the steps.
    -> END
}
{ not angry5:
    The kid, in his corner. He's watching you, waiting his turn.
    -> END
}
~ painter5 = true
The kid, in his corner, his knees up, as before.
{ riot_leader == "firebrand":
    { riot == "brought_in":
        "They're saying my brother's dead. Executed, at dawn. Your father said it on every screen." #speaker:painter
        "Your father said it, with his hand on your shoulder." #speaker:painter
        "Is it true?" #speaker:painter
        "That's what I was told." #speaker:prince
        "That's not what I asked." #speaker:painter
    - else:
        "You let my brother go. On the square. I saw." #speaker:painter
        "And this morning his face is on every screen in the city." #speaker:painter
        "He can't go home. He can't come here. Anyone who sees him gets a reward." #speaker:painter
        "So thanks. I think." #speaker:painter
    }
- else:
    "They never brought my brother through the streets. Last night was meant to be for him." #speaker:painter
    "Nobody's seen him since. Up. Where they all go, your hand said." #speaker:painter
    "You said you'd find out." #speaker:painter
    "I'm trying." #speaker:prince
    "Try harder." #speaker:painter
}
-> c3day5_heard

// Your hand steps out for air (clue 5). Then the raid (pushback 4).
=== c3day5_air ===
~ c3day5 = "raid"
Your hand pushes himself off the wall.
"Air. I'll be up by the door." #speaker:diplomat
He goes up the steps, unhurried. #leave:hand-5:30:40
The cellar starts talking again, low. The barkeep wipes the same cup.
A minute. Two.
The door at the top of the steps comes in. #shake #sound:smash:boots
Lamps. Pikes. Your father's guard, the captain's men, down the steps four at a time. #show:raid-1 #show:raid-2 #show:raid-3 #show:raid-4
"Nobody moves!" #speaker:c3_guard_0
{ warrants == "sealed":
    The warrant's in the first one's hand. Your seal's on it.
- else:
    The warrant's in the first one's hand. Your line through it. Your father's seal beside it.
}
Behind you, someone's already got the back way open. People are going through it, into the dark.
Step in, or go out the back way with them?
- (choose)
+ [Step in. Throw back your hood and order them to stand down.]
    They'll stop for you. But everyone here will see your face, and so will the guard, and the captain will tell your father where you've been.
    ++ [Yes. Step in.]
        -> c3day5_step_in
    ++ [No. Think again.]
        -> choose
+ [Stay out of it. Go out the back way with the others.]
    You'll keep your cover. Whoever doesn't get out will be taken, and you'll watch it happen.
    ++ [Yes. Go out the back way.]
        -> c3day5_stay_out
    ++ [No. Think again.]
        -> choose

// Step in: they stop, slowly. Your face is seen below.
=== c3day5_step_in ===
~ raid = "stepped_in"
~ seen_below = true
~ lean += 1
~ standing -= 1
~ plain_coat = false
You step in front of them and throw back your hood.
"Stand down." #speaker:prince
The first pike stops a hand from your chest. The man behind it looks at your face. Then at your collar.
"Highness...?" #speaker:c3_guard_0
"I said stand down." #speaker:prince
Slowly, one after another, the pikes come up. #show:captain-5r
The captain, on the steps. He looks at you. Then round the cellar, at all the faces looking at yours.
"You heard His Highness." #speaker:captain
They go back up the steps, one at a time. #leave:raid-1:30:40 #leave:raid-2:30:40 #leave:raid-3:30:40 #leave:raid-4:30:40
"I'll have to tell your father where I found you, Highness." #speaker:captain
"Tell him." #speaker:prince
He goes. #leave:captain-5r:30:40
Nobody in the cellar says anything. Every one of them has seen your face now. The kid's looking at you as if he's never seen you before.
"You'd better go. Before they come back with someone you can't order." #speaker:hideout_keeper
~ c3day5 = "out"
~ objective = "Get out"
~ objective_target = "hideout:to-low-district"
-> END

// Stay out: the back way, into the dark (the low district, beyond the cellar).
=== c3day5_stay_out ===
~ raid = "stayed_out"
~ lean -= 1
You keep your hood down and go with them. Through the back way, up a crawl of old steps, out. #goto:low-district:910:236:c3day5_backway
-> END

=== c3day5_backway ===
~ c3day5 = "hide"
Out into the rain. The others are gone already, every way at once.
Lanterns at the cellar door. One of the guard walking the street with his lamp up, looking in every doorway.
~ objective = "Get to a dark doorway without being seen"
~ objective_target = "low-district:doorway-5"
-> END

// From a dark doorway, you watch them brought up (the painter among them).
=== c3day5_watch ===
You press yourself into the doorway, and watch.
They bring them up out of the cellar one at a time, and walk them off up the street, towards the lifts. #show:taken-1 #leave:taken-1:16:30
The woman whose husband was on the square. #show:taken-2 #leave:taken-2:16:30
Then the kid, between two of the guard. #show:painter-5t #show:escort-5a #show:escort-5b #leave:painter-5t:16:28 #leave:escort-5a:4:28 #leave:escort-5b:28:28
He isn't struggling. He's looking at every doorway as he passes, as if he's looking for someone.
He doesn't see you. You make sure of it.
Below, the sound of tables going over, and bottles. Then nothing. #sound:smash:crash
~ c3day5 = "out"
The lanterns go up the street after them, and the street's dark. #leave:door-5:16:40
-> c3day5_after

// Either way: your hand, from nowhere.
=== c3day5_after ===
~ after5 = true
{ raid == "stepped_in":
    Your hand, by the door, as if he'd never left it. #show:hand-5w #beside:hand-5w:20
- else:
    Your hand, beside you in the doorway. You didn't hear him come. #show:hand-5w #beside:hand-5w:14
}
"I'm sorry. I didn't know." #speaker:diplomat
"Where were you?" #speaker:prince
"Up here. Air. They came past me. I couldn't..." #speaker:diplomat
He doesn't finish.
"Go home, Highness. Separately. It's safer." #speaker:diplomat
He goes off into the dark, the other way. #leave:hand-5w:940:50
~ c3day5 = "home"
~ objective = "Go back up to your rooms"
~ objective_target = "prince-quarters:bed-5"
-> END

// --- Back up ---

=== c3day5_bed ===
~ plain_coat = false
~ hand_with_you = false
You hang up the plain coat. It smells of the cellar's smoke, and the rain.
~ c3day5 = "done"
~ c3day6 = "wake"
~ objective = ""
~ objective_target = ""
{ raid == "stepped_in":
    You lie awake. Every face in that cellar has seen yours now. And by morning, your father will know. #wake:prince-quarters:120:226 #endday:Days later.
- else:
    You lie awake. The kid, looking in every doorway as he passed. #wake:prince-quarters:120:226 #endday:Days later.
}
-> END
