// ============================================================================
// Chapter 3, Day 7: the order. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// The day before the broadcast. Your father hands you his last pushback to read out: everyone taken in the raids
// and on the square is to be sent away "to be useful" (pushback 6); you read it back, or ask him to soften it.
// The captain's transfer list: your father allows you one name to strike. Your friend in the guest wing. At
// night, if you promised: you get him out (the barrier's guards sent off by your rank; the gallery past the
// night guard; your hand's office, unlocked, a lamp lit, as if he was expected: clue 7; the lift operator looks
// away; the commander turns her back) and at the gate, two of her watch who don't (designer: a normal fight).
// Lost, he still gets away, but the commander sees your face (designer). If you didn't promise, you hear at
// dawn that he's gone. Stages in `c3day7` (main.ink).
// ============================================================================

// --- Dawn, your quarters ---

=== c3day7_start ===
~ c3day7 = "wake"
Grey light. The face on the screen again, and under it, a new line: TOMORROW. THE PRINCE SPEAKS.
A note under your door, in your father's hand. "My study. Early."
~ objective = "Go to your father's study"
~ objective_target = "fathers-study:father-7"
-> END

// --- Your father's study: the order ---

=== c3day7_order ===
{ c3day7 != "wake":
    He doesn't turn round from the window.
    "Learn it. By tomorrow you won't need the paper." #speaker:father
    -> END
}
~ order7 = true
Your father at the window, his back to you. He doesn't turn round.
"Tomorrow you speak to the city. From the hall. Every screen." #speaker:father
"About what?" #speaker:prince
He holds a sheet out behind him, without looking. You take it.
"Read it." #speaker:father
It's short. Everyone taken in the raids, and on the square, is to be sent out of the capital, to the managed places, to be useful. Given work. Given purpose. Their families will be told when they've arrived.
It doesn't say where the managed places are. It doesn't say what the work is.
"Where are they going?" #speaker:prince
"Where they're needed." #speaker:father
"For how long?" #speaker:prince
"As long as they're needed." #speaker:father
He turns round, at last. He's smiling, a little, the way he smiles at the council. #face:father-7:300
"You'll read it to the city tomorrow. They should hear it from you." #speaker:father
"Read it back to me." #speaker:father
Read it back to him as it's written, or ask him to soften it?
+ [Read it back as written.]
    ~ asked_soften = false
    ~ standing += 1
    You read it back to him. Every word. Your voice doesn't shake, and you hate that it doesn't.
    "Good." #speaker:father
    "Again tomorrow. Slower. Look up at the lenses on 'purpose'." #speaker:father
+ [Ask him to soften it.]
    ~ asked_soften = true
    ~ lean += 1
    "Could we say where? How long? Let them write home?" #speaker:prince
    "Soften it how?" #speaker:father
    "They'll be fed. They'll be useful. That's kinder than the street." #speaker:father
    He takes the sheet back, and reads it through, as if he's thinking about it.
    He hands it back. He hasn't changed a word.
    "Learn it." #speaker:father
    You know exactly where you stand now.
- "The captain has the list of who goes. Look it over." #speaker:father
"I've told him you may take one name off it. Every list should have a kindness on it." #speaker:father
~ c3day7 = "list"
He turns back to the window before you're out of the door. #face:father-7:476 #time:afternoon
~ objective = "See the transfer list"
~ objective_target = "citadel-halls:captain-7"
-> END

// --- The halls: the captain's transfer list ---

=== c3day7_list ===
{ c3day7 != "list":
    { struck == "none":
        "Highness." #speaker:captain
    - else:
        "It's done, Highness. As you asked." #speaker:captain
    }
    -> END
}
~ list7 = true
The captain at his post at the foot of the stair, a sheaf of sheets under his arm.
"The list, Highness. Everyone who goes, the morning after you speak." #speaker:captain
Pages of names, in his tidy hand. The cellars first.
The barkeep from the cellar under the low district.
{ raid == "stayed_out":
    "Taken the night of the raid, from behind his own bar." #speaker:captain
- else:
    "They went back for him the night after, Highness. With nobody to order them out." #speaker:captain
}
{ raid == "stayed_out" or standoff5 == "taken":
    The kid from the cellar. The one who chalks the wing on the walls.
}
{ raid == "stayed_out":
    The woman whose husband was on the square. She's going where he went, perhaps.
}
Then the square, page after page.
{ riot == "brought_in":
    Not the man who led it.
    "Executed, Highness. At dawn, after the riot. It was on the screens." #speaker:captain
- else:
    Not the man who led it.
    "Still out there. Your father's doubled what he's offering for him." #speaker:captain
}
"Your father allows you one name, Highness. One you can take off. A kindness." #speaker:captain
Whoever you strike goes home tonight. Everyone else goes, wherever it is.
* { raid == "stayed_out" or standoff5 == "taken" } [Strike the kid.]
    ~ struck = "kid"
    ~ lean += 1
    You take his pen, and draw a line through the kid's name.
    "He'll be home tonight, Highness. His mother will know who to thank." #speaker:captain
    You don't know yet whether that's a kindness either.
* { raid == "stayed_out" } [Strike the woman whose husband was on the square.]
    ~ struck = "woman"
    ~ lean += 1
    You draw a line through her name.
    "She has a girl at home, Highness. Did you know?" #speaker:captain
    "I knew." #speaker:prince
* [Strike the barkeep.]
    ~ struck = "barkeep"
    ~ lean += 1
    You draw a line through the barkeep's name.
    "Forty years behind that bar, they tell me. He'll have it back by tonight." #speaker:captain
* [Strike no one.]
    ~ struck = "none"
    ~ standing += 1
    You hand the sheets back. Every name still on them.
    "They'll know you could have, Highness." #speaker:captain
    "I know." #speaker:prince
- He tucks the list back under his arm, as if it weighs nothing.
"Your friend's asking for you, in the guest wing. Politely. Every hour." #speaker:captain
~ c3day7 = "friend"
~ objective = "See your friend"
~ objective_target = "guest-wing:heir-7"
The light outside the tall windows goes amber, then blue. #time:evening
-> END

// --- The guest wing: your friend ---

=== c3day7_friend ===
{ c3day7 != "friend":
    -> c3day7_friend_after
}
~ wing7 = true
{ friend_cool:
    He's at his window, looking through the lattice at the city.
    "Highness." #speaker:heir
    "Are you all right?" #speaker:prince
    "I'm a guest. Everything's beautiful." #speaker:heir
    You wait. He doesn't say anything else. Whatever he's thinking about, he isn't going to say it to you.
    "Goodnight, Highness." #speaker:heir
    ~ c3day7 = "bed"
    ~ objective = "Go to bed"
    ~ objective_target = "prince-quarters:bed-7s"
    -> END
}
He's at his window. He doesn't turn round, and he keeps his voice down, under the guards' talk at the barrier.
"There's a way out. Someone's arranged it." #speaker:heir
"Who?" #speaker:prince
"I can't say. I promised too." #speaker:heir
"Through your hand's office. His door to the lifts is going to be open tonight. Down, out of the gate, and after that I'm met." #speaker:heir
"I just need to get past the barrier. And I can't do that. You can." #speaker:heir
"Tonight, then. After the last bell. I'll come for you." #speaker:prince
Now he looks round.
"Wear something nobody bows to." #speaker:heir
~ c3day7 = "night"
~ objective = "Wait for the last bell"
~ objective_target = "prince-quarters:bed-7"
-> END

=== c3day7_friend_after ===
{ friend_cool:
    He nods at you, politely, and goes on looking at the window.
- else:
    "After the last bell." #speaker:heir
}
-> END

// Him at your side, on the way out.
=== c3day7_heir_walk ===
{ shuffle:
- "Keep going. Don't look back at him." #speaker:heir
- "If this goes wrong, I'll say I took you hostage." #speaker:heir
- "Quiet, Highness." #speaker:heir
}
-> END

// --- Night, your quarters: the last bell ---

=== c3day7_wait ===
You sit on the end of your bed in the dark, and wait. #time:night
The last bell, far off in the citadel.
You take the plain coat down from the back of the wardrobe. It still smells of the cellar.
~ plain_coat = true
~ c3day7 = "barrier"
~ objective = "Get your friend past the barrier"
~ objective_target = "guest-wing:guard-7a"
-> END

// --- The guest wing: the barrier ---

=== c3day7_barrier ===
{ c3day7 != "barrier":
    -> END
}
~ barrier7 = true
The two of the guard at the barrier straighten, and one puts a hand up.
"Stop there. Who's that?" #speaker:c3_guard_0
You push your hood back.
"Highness? At this hour?" #speaker:c3_guard_0
"The captain wants you both at the foot of the stair. Now." #speaker:prince
"We're not to leave the barrier, Highness. His orders." #speaker:c3_guard_1
"Then you can tell him that yourselves. I'll mind it till you're back." #speaker:prince
They look at each other. Then at you: the prince, in a plain coat, at midnight.
"Highness." #speaker:c3_guard_0
They go. #leave:guard-7a:620:50 #leave:guard-7b:620:50
Your friend comes out of his room, in his darkest coat, and down the corridor to you. #walk:heir-7:560:60
"Your face." #speaker:heir
You pull the hood back up.
~ heir_with_you = true
~ c3day7 = "halls"
One of the night guard walks the gallery outside, between this door and your hand's. Keep to the doorways, and go when his back's turned.
~ objective = "Get him to your hand's office unseen"
~ objective_target = "citadel-halls:to-office"
-> END

// --- The halls: the gallery guard ---
// (Seen: back to the guest wing's door, by the watch feature: "Who's that? Stop there!".)

// --- Your hand's office: unlocked, a lamp lit (clue 7) ---

=== c3day7_office ===
~ office7 = true
Your hand's office. Nobody here.
But a lamp's lit on his desk, turned low. As if someone was expected.
And at the far end, his private door, down to the lifts. Standing open.
"Told you. Someone's arranged it." #speaker:heir
"Him?" #speaker:prince
"I didn't say that." #speaker:heir
He won't look at you.
~ c3day7 = "lifts"
~ objective = "Get him to the gate"
~ objective_target = "diplomats-office:to-lifts;lifts:to-promenade;promenade:to-gate;city-gate:commander-7"
-> END

// --- The lifts: the operator looks away ---

=== c3day7_lifts ===
~ lifts7 = true
The lift operator, in his booth at the top, the only light on the platform.
He sees you both. Two hoods, at midnight, out of a door that's always locked.
Then he turns to his panel, and doesn't look round again. #face:lift-operator:180
-> END

// --- The gate: the commander turns her back ---

=== c3day7_commander ===
~ gate_seen7 = true
The commander, at the booth, under the screens. Her watch with her.
She looks at you both, for a long moment. #face:commander-7:760
Then she turns to the booth, and reads the screens, with her back to you. #face:commander-7:480
-> END

=== c3day7_commander_talk ===
She doesn't turn round.
-> END

// The arch, the road beyond, and two of her watch who don't look away.
=== c3day7_gate ===
~ c3day7 = "fight"
The arch. Beyond it, the road, going off into the dark across the waste.
"This is it, then." #speaker:heir
"Come with me." #speaker:heir
"I can't." #speaker:prince
"I know. I just wanted to have asked." #speaker:heir
"Hey! You two! Hoods down!" #speaker:c3_watch_1
One of the commander's watch, a young one, his lantern up, coming at you from the booth. #walk:watch-7a:470:60
"Over here! Over here!" #speaker:c3_watch_1
Another comes out of the booth's light, his baton out. #walk:watch-7b:500:40
The commander doesn't turn round.
Your friend's blade is already in his hand.
~ objective = ""
~ objective_target = ""
"Together, then. For once." #speaker:heir #combat:gate_watch:c3day7_after_fight
-> END

=== c3day7_after_fight ===
~ heir_with_you = false
~ friend_gone = true
{ gate7 == "won":
    The two of them are down on the wet stones, and not getting up yet. #down:watch-7a #down:watch-7b
    "Go. Now." #speaker:prince
    ~ helped_escape = true
    He goes through the arch at a run. #leave:heir-7g:0:70
    He looks back once, from the dark beyond it.
    Then the dark has him.
    The young one groans, and gropes on the stones for his whistle. At the booth, the commander still hasn't turned round.
    You don't wait for either of them. Hood pulled low, you slip off into the city's dark.
- else:
    ~ helped_escape = true
    ~ seen_gate = true
    They have you down on the wet stones, a knee in your back, your arm up behind you. #show:watch-7b
    "Run!" #speaker:prince
    He runs. Through the arch, and out. #leave:heir-7g:0:80
    The young one goes after him, and comes back alone, out of breath. #walk:watch-7a:470:70
    Footsteps. The commander, walking over from the booth at last. #walk:commander-7:500:30
    She crouches, and pulls your hood back.
    "Highness." #speaker:commander
    The two of her watch look at you. At each other.
    "They've seen you now. Both of them. I can't make them not have." #speaker:commander
    "My report goes up at dawn. I'm sorry." #speaker:commander
    "Back to the booth, both of you." #speaker:commander
    They go. #leave:watch-7a:600:40 #leave:watch-7b:600:40
}
~ c3day7 = "home"
You walk back up through the sleeping city, and in by his door. You won't remember any of it. #goto:prince-quarters:110:226:c3day7_bed
-> END

// --- Back up ---

=== c3day7_bed ===
{ c3day7 == "home":
    ~ plain_coat = false
    You hang up the plain coat. It's soaked through, and there's blood on the cuff that isn't yours.
    { gate7 == "lost":
        You lie awake, and listen for the captain's boots. By morning, your father will know.
    - else:
        You lie awake. Somewhere out on the road, in the dark, your friend is walking. You don't know where to.
    }
    -> c3day7_end
}
// (You didn't promise: he goes without you.)
You lie awake. Across the citadel, in the guest wing, his light still on behind the lattice. #time:night
You sleep, in the end. #sleep:on
Knocking. It isn't light yet. #sleep:off
~ friend_gone = true
~ c3day7 = "dawn"
{ sister == "covered":
    Your sister at your door, in her nightdress, a candle in her hand.
    "Your friend's gone." #speaker:sister
    "Gone where?" #speaker:prince
    "Out. Through the diplomat's door. Somebody sent the barrier's guards to the stair, with the captain's voice." #speaker:sister
    "Nobody saw him go. Nobody's even pretending they did." #speaker:sister
    She looks at you a long time.
    "I thought you'd want to hear it from me. Before Father." #speaker:sister
- else:
    The captain at your door, already dressed, as if he's never been to bed.
    "Your friend's gone from the guest wing, Highness. Out through the diplomat's door, as far as we can tell." #speaker:captain
    "Your father would like to know whether you knew." #speaker:captain
    "I didn't." #speaker:prince
    "No, Highness. I didn't think you would have." #speaker:captain
}
-> c3day7_end

=== c3day7_end ===
~ c3day7 = "done"
~ c3day8 = "wake"
~ objective = ""
~ objective_target = ""
Tomorrow, the city hears it from you. #wake:prince-quarters:120:226 #endday:Day 8
-> END
