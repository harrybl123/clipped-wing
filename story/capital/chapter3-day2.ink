// ============================================================================
// Chapter 3, Day 2: the art of war. Draft text from docs/sequences/chapter-3/plan.md, for the designer to
// rewrite. Your father fetches you himself (designer), to the simulation room behind his bookshelf (designer:
// you never knew it was there) and the war table: a lesson, then he turns it on and you can only lose
// (designer). The council and big choice 1, who goes without (doc). From your balcony you watch it happen;
// you report to your father; then your hand takes you below to see what you decided (designer: Day 2 is
// right for the first trip below). Stages in `c3day2` (main.ink).
// ============================================================================

// --- Dawn, your quarters ---

=== c3day2_start ===
~ c3day2 = "wake"
A knock. Your hand, in the doorway, without the blades. #beside:hand-2:-76
"Not today. Your father wants you." #speaker:diplomat
He steps aside, and your father's in the doorway behind him. #show:father-2 #beside:father-2:-60
He's never once come to your rooms.
"Come with me." #speaker:father
~ c3day2 = "study"
~ objective = "Go with your father"
~ objective_target = "fathers-study:father-2"
You follow him down through the halls. Guards straighten as he passes. The courtiers stop talking altogether. #goto:fathers-study:60:230:c3day2_study
-> END

// --- Morning, his study ---

=== c3day2_study ===
{ queried_requests:
    "You asked about the day's requests." #speaker:father
    "Good. Ask. Then sign." #speaker:father
}
He puts his hand flat on a shelf of the bookcase by the fire. Something clicks. #sound:latch
The whole shelf swings back into the wall. Behind it, a way through, and blue light. #sound:grate
~ sim_open = true
You've been in this study a thousand times. You hid under that desk as a boy.
"How long has this been here?" #speaker:prince
"Longer than you." #speaker:father #leave:father-2:128:40
~ objective = "Go through the bookshelf"
~ objective_target = "fathers-study:to-simulation-room"
-> END

=== c3day2_father_study ===
"Come." #speaker:father
-> END

// --- Morning, the simulation room ---

// Coming in (a trigger at the door).
=== c3day2_room ===
~ room2 = true
~ c3day2 = "room"
Dark. Then the table lights up, the length of the room: the whole city, side-on, every place and every lift, drawn in light.
"Where we practise the art of war." #speaker:father
"A district rises. You'll be the rising. I'll be the guard." #speaker:father
~ objective = "Practise the art of war"
~ objective_target = "simulation-room:table"
-> END

=== c3day2_father_room ===
{ c3day2 == "room":
    "Stand at the table." #speaker:father
- else:
    He doesn't say anything.
}
-> END

=== c3day2_table ===
{ c3day2 != "room": -> c3day2_table_dark }
~ c3day2 = "table"
You stand at the table. He stands across it from you. #wartable:lesson
-> END

=== c3day2_table_dark ===
The table's dark. Just glass.
-> END

// The war table's lines (src/data/warTable.ts, LESSON). The lesson is his: plain, a few words each, one
// thing at a time (designer: make it longer), then "Now." (designer: a fair fight he out-thinks you in).
=== c3day2_table_intro ===
"The low district has risen. You're the rising: the amber lights." #speaker:father
"I'm the guard: the blue." #speaker:father
"Each light is a squad. The number is how many." #speaker:father
"Pick one of yours, and send it along a street, a stair or a lift. Into an empty place, it takes it." #speaker:father
"Each turn, give orders to as many of your squads as you like. Then end the turn, and mine move." #speaker:father
-> END

=== c3day2_lesson_lifts ===
"First, the lifts. Whoever holds the lifts moves fastest: a lift goes anywhere the lifts go." #speaker:father
"Take the middle lifts." #speaker:father
"But read my arrows first. They show you what I'm going to do." #speaker:father
-> END

=== c3day2_lesson_lifts_done ===
"Good." #speaker:father
"Into one of mine, it's a fight. The bigger number wins, and keeps what's left over. Equal, and whoever was there first holds." #speaker:father
-> END

=== c3day2_lesson_data ===
"The data centre. Two of mine." #speaker:father
"Two of yours won't do it. Bring them together first: send one into another and they join up." #speaker:father
-> END

=== c3day2_lesson_data_done ===
"Alone they're nothing. Together they're a district." #speaker:father
-> END

=== c3day2_lesson_promenade ===
"Now the promenade. Three of mine." #speaker:father
"Uphill, up a stair, costs you one. Go round by the streets, or go at it with more." #speaker:father
-> END

=== c3day2_table_dropin ===
"That one. Go down yourself." #speaker:father
"Some fights you don't leave to the table." #speaker:father
-> END

=== c3day2_table_good ===
"Good." #speaker:father
He looks at the table a long moment.
-> END

=== c3day2_table_now ===
He stands up straight, and steps back from the table.
"That was a lesson. Now I'll play." #speaker:father
He touches the table, and it sets itself again. Your rising holds the promenade and the low district: ten of you. The guard holds the lifts and the data centre, and eight in the citadel.
"Same rules. One move each. No arrows." #speaker:father
"Take the citadel." #speaker:father
"Now." #speaker:father
-> END

// The first time he cuts the power under your biggest squad.
=== c3day2_table_cut ===
He touches the table. Where your biggest squad stands, the lights go out.
"It helps to have a city on your side." #speaker:father
"In the dark, they can't move this turn. And they fight at one less." #speaker:father
-> END

// What he says about what you've just done, in the lesson (designer: his speech answers your choices).
=== c3day2_react_idle ===
"You didn't give any orders." #speaker:father
"Each turn, give an order to every squad you want to move. As many as you've got. Then end the turn." #speaker:father
-> END

=== c3day2_react_lost ===
"You went at more than you had. They hold, and your squad's gone." #speaker:father
"Count first." #speaker:father
-> END

=== c3day2_react_tie ===
"Equal numbers. Whoever's there first holds." #speaker:father
"You lost them for nothing." #speaker:father
-> END

=== c3day2_react_uphill ===
"Uphill. It cost you one. It always will." #speaker:father
-> END

=== c3day2_react_hit ===
"You didn't read my arrow." #speaker:father
-> END

=== c3day2_react_joined ===
"Together. Good." #speaker:father
-> END

=== c3day2_table_end ===
{ sim_wiped:
    It's over. Every light on the table is his.
- else:
    He stops. You've still got lights on the table, a few, cut off from each other, with nowhere to go.
    "I could finish it. I don't need to." #speaker:father
}
"{sim_turns} turns." #speaker:father
"I've played this table every night for thirty years. You won't ever be as good at it as I am." #speaker:father
"You took your mark and sat on it. I came at you from everywhere, every turn." #speaker:father
"Remember it from my side of the table. This is what happens if you don't quell an uprising with equal aggression, and just try to defend your mark." #speaker:father
He switches it off, and the city goes dark under your hands.
"I hope you never need it." #speaker:father
-> END

// Back in the room after the table.
=== c3day2_after_table ===
He goes out through the bookshelf without another word. #leave:father-sim:42:50
~ c3day2 = "council"
~ objective = "Go to the council chamber"
~ objective_target = "council-chamber:father-4"
The council sits this afternoon. You're to speak. #time:afternoon
-> END

// --- Afternoon, the council chamber ---

// Coming in (a trigger at the door): your father sets it out.
=== c3day2_council ===
~ council2 = true
The whole council, on its tiers. Your father at the top. Your hand by the door.
{ seated != "councillor":
    The old councillor's seat is empty. The first time you can remember.
}
"There's less power this season than the city needs. Not enough to go round." #speaker:father
"Someone goes without. You decide who. I'll watch." #speaker:father
"Hear them out first." #speaker:father
~ objective = "Hear the council out"
~ objective_target = "council-chamber:reformer-2"
-> END

// After each side's heard: the marker moves on to whoever you haven't heard yet, then to your father.
=== c3day2_heard ===
~ heard2 += 1
{
- not heard_reformer2:
    ~ objective_target = "council-chamber:reformer-2"
- not heard_councillor2:
    ~ objective_target = "council-chamber:councillor-2;council-chamber:cousin-2"
- not heard_hand2:
    ~ objective_target = "council-chamber:hand-4"
- else:
    ~ objective = "Tell your father who goes without"
    ~ objective_target = "council-chamber:father-4"
}
-> END

=== c3day2_reformer ===
{ heard_reformer2:
    "You've heard me, Highness." #speaker:reformer
    -> END
}
~ heard_reformer2 = true
"Highness. The low district is where people freeze first." #speaker:reformer
"Cut the lights and the lifts down there and they climb eleven flights in the dark. Cut the heat and the old ones die." #speaker:reformer
"Give the power to the people who need it. Let the citadel dim for a season. We'd live." #speaker:reformer
-> c3day2_heard

=== c3day2_councillor ===
{ heard_councillor2:
    "I've said my piece, Highness." #speaker:councillor
    -> END
}
~ heard_councillor2 = true
"Highness. The citadel runs the city. Dim it and the city feels it." #speaker:councillor
"And the salons, the gala, the glasshouse: people up here notice what's taken from them. They remember who took it." #speaker:councillor
"Keep the power where the city's run from. The low district has been dark before." #speaker:councillor
-> c3day2_heard

=== c3day2_cousin ===
{ heard_councillor2:
    "I've said it, Highness." #speaker:cousin
    -> END
}
~ heard_councillor2 = true
"My cousin sends her regards, Highness. The old councillor sends nothing. He didn't come." #speaker:cousin
"The citadel runs the city. The salons run the citadel, whatever anyone pretends." #speaker:cousin
"Keep the power where it matters. The low district is used to the dark." #speaker:cousin
-> c3day2_heard

=== c3day2_hand_council ===
{ heard_hand2:
    "Choose it out loud." #speaker:diplomat
    -> END
}
~ heard_hand2 = true
"I won't tell you which." #speaker:diplomat
"Whatever you choose, choose it out loud. They'll all know whose choice it was." #speaker:diplomat
-> c3day2_heard

=== c3day2_father_council ===
{ heard2 < 3:
    "Hear them out first." #speaker:father
    -> END
}
"Well?" #speaker:father
Who goes without power this season: the low district, or the upper city and the citadel? #dim:on
- (choose)
+ [Keep the power up here. The low district goes dark.]
    The citadel, the glasshouse and the promenade stay lit, and the salons will warm to you.
    The low district goes dark in the evenings: no lights, no lifts, no heat.
    ++ [Yes. The low district goes dark.]
        ~ energy = "high"
        ~ lean -= 1
        ~ standing += 1
        "Keep it up here. The low district goes without." #speaker:prince #dim:off
        Nobody on the tiers looks surprised. The reformer sits down.
    ++ [No. Think again.]
        -> choose
+ [Give the power to the low district. The upper city goes dark.]
    The low district keeps its lights, its lifts and its heat.
    The citadel dims, and the promenade goes dark in the evenings. Upper society will call you soft, and your father won't like it.
    ++ [Yes. The upper city goes dark.]
        ~ energy = "people"
        ~ lean += 1
        ~ standing -= 1
        "Give it to the low district. The upper city goes without." #speaker:prince #dim:off
        The tiers go very quiet. Your father doesn't move at all.
    ++ [No. Think again.]
        -> choose
- The order goes out. The chamber's lights flicker, once. #flash:dark
"So be it." #speaker:father
~ c3day2 = "dusk"
~ objective = "Watch from your balcony"
~ objective_target = "prince-quarters:telescope"
The light's going outside. #time:evening
-> END

// --- Evening: your balcony, then his study ---

// On the balcony (a trigger): you see it happen, block by block (designer: make it dramatic; he doubts it).
=== c3day2_dusk ===
~ dusk2 = true
The sun's down. Below you the city lights up, row on row, the way it does every night. #view
{ energy == "high":
    ~ dark_district = "low"
    ~ dark_fade = 15
    Then, right at the bottom, a street goes dark. #repaint #sound:thump #view
    ~ dark_fade = 45
    Another. Then three together. #repaint #sound:thump #view
    ~ dark_fade = 75
    The lifts' lights, going down the stacks, go out one by one. #repaint #sound:thump #view
    ~ dark_fade = 100
    Then the whole low district, all at once, like a hand closing over it. #repaint #sound:boom #shake #view
    Here and there, a candle. #view
    "That was me." #speaker:prince #view
    You think of eleven flights of stairs in the dark. {lift_mended: Of a lift you had mended this morning, standing dead.} #view
    One season, you tell yourself. It sounded like nothing in the council chamber. #view
- else:
    ~ dark_district = "promenade"
    ~ dark_fade = 20
    Then the upper city starts to go out. The towers nearest the citadel first: their blue strips, then every window, until they're just glass, dead, giving back the last of the sky. #repaint #sound:thump #view
    ~ dark_fade = 60
    The promenade, its shops, its street lamps along the square. #repaint #sound:thump #view
    ~ dark_fade = 100
    The great screen last of all: your father's face, and yours, and then nothing. Only the low district's still lit, right down at the bottom. #repaint #sound:boom #shake #view
    ~ citadel_dimmed = true
    Then the lights in your own rooms flicker, and drop, and stay down. #repaint #flash:dark
    "That was me." #speaker:prince #view
    The low district's lights look very small from here, under all that dark. #view
    Tomorrow the whole citadel will know whose choice it was. #view
}
+ [Look through the telescope]
    { energy == "high":
        On a stair up the side of a stack, a lamp, going up. Very slowly. It stops on every landing.
    - else:
        On the promenade, people standing about in the dark, looking up. At the citadel. At you.
    }
+ [Go inside]
- ~ c3day2 = "report"
~ objective = "Report to your father"
~ objective_target = "fathers-study:father-5"
-> END

=== c3day2_report ===
{ reported2:
    "Go on." #speaker:father
    -> END
}
~ reported2 = true
He's by the fire. He doesn't turn round.
{ energy == "high":
    "You kept it with the citadel." #speaker:father
    "Now you know what it costs." #speaker:father
    He sounds tired. He sounds pleased.
- else:
    "You gave it to the low district." #speaker:father
    "It was yours to give. I said so." #speaker:father
    "Tomorrow the salons will call you soft. You'll hear it everywhere you go. Don't answer them." #speaker:father
    He looks at the fire a long time.
    "Next time, come and tell me first. Not to ask. So I'm not the last to know." #speaker:father
}
In the doorway, your sister, listening. When you look again, she's gone. #leave:sister-5:16:80
"Your hand's waiting for you. Go on." #speaker:father
~ objective = "Go to your hand's office"
~ objective_target = "diplomats-office:hand-6"
-> END

=== c3day2_sister_door ===
She puts a finger to her lips.
-> END

// --- Night: below, with your hand ---

=== c3day2_office ===
{ energy == "high":
    "The low district went dark at dusk. You should see what you decided." #speaker:diplomat #time:night
- else:
    "Your father's not pleased. The low district is. The middle of the city isn't. You should see what you decided." #speaker:diplomat #time:night
}
He holds out a plain coat with a hood.
"Over yours. The wine shows." #speaker:diplomat
~ plain_coat = true
He opens the door at the back of his office: his own way down to the lifts, a narrow stair.
~ hand_with_you = true
~ c3day2 = "below"
{ energy == "high":
    ~ objective = "Go down to the low district"
    ~ objective_target = "low-district:painter-2"
- else:
    ~ objective = "Go down to the promenade"
    ~ objective_target = "promenade:painter-2"
}
He goes down it like he's done it a hundred times. #goto:lifts:64:130:c3day2_lifts
-> END

// At the top of the lifts.
=== c3day2_lifts ===
The lift operator looks at you a long moment, at your hood, at your face under it.
{ energy == "high":
    "The low district's own lifts are off tonight, Highness. Ours still run to the bottom. After that it's stairs." #speaker:lift_operator
- else:
    "Half power up here tonight, Highness. She'll go slow." #speaker:lift_operator
}
He doesn't ask where you're going.
"Keep your hood up. Down there, they'd know you." #speaker:diplomat
-> END

// Your hand, walking with you below.
=== c3day2_hand_below ===
{ c3day2:
- "below": "Keep your hood up." #speaker:diplomat
- else: "Highness." #speaker:diplomat
}
-> END

// Coming into the dark district (a trigger).
=== c3day2_dark ===
~ dark_seen2 = true
{ energy == "high":
    The low district, without power. No lamps, no signs, no lifts. Fires in doorways, and people round them.
- else:
    The promenade, without power. The great screen's dead. The shutters are down, and people sit out on the dark steps.
}
They look at you. They know who you are, hood or not. They go quiet.
Your hand knows the way: which turning, which stair, which door to knock on. Too well.
{ energy == "high":
    "The woman from your audience lives up there, on the walkway. Her street. You should see it." #speaker:diplomat
    ~ objective = "Find the woman from your audience"
    ~ objective_target = "low-district:woman-2"
- else:
    "Somebody's still out, look. By the dead lamp." #speaker:diplomat
    ~ objective = "See who's out in the dark"
    ~ objective_target = "promenade:painter-2"
}
-> END

// The people below, in the district that went without: they go quiet, then they want to tell you (designer),
// and what they tell you is that district's own (designer: the places you visit should show your choice).
=== c3day2_cold ===
{ energy == "high":
    "You're him." #speaker:them
    "It's cold in there with no heat, Highness. My kids are sleeping in their coats." #speaker:them
- else:
    "You're him. Aren't you." #speaker:them
    "My shop's dark. Nobody buys in the dark, Highness. Three generations, that shop." #speaker:them
}
-> END

=== c3day2_stairs ===
{ energy == "high":
    "The lifts stop at dusk now. Eleven flights to my door, in the dark." #speaker:them
    "My father can't do them. He's sleeping on the step." #speaker:them
- else:
    "They say it was you. That you gave our light to the low district." #speaker:them
    "Good for them, I suppose. Funny how it's always us in the middle that pays." #speaker:them
}
-> END

=== c3day2_food ===
{ energy == "high":
    "The cold stores are off. Everything in them'll spoil by morning." #speaker:them
    "A week's food. Who's paying for that, Highness?" #speaker:them
- else:
    "The great screen's off. First time in my life. It's very quiet without your father's face." #speaker:them
    "Is that what you wanted? Quiet?" #speaker:them
}
-> END

// The lit low district, if you gave it the power: out in the light, glad of it, and they know whose it was.
=== c3day2_glad ===
{ shuffle:
- "Lights all night! Lifts running! Is it true it was you, Highness?" #speaker:them
- "My mother's warm tonight. First time this season. Thank you." #speaker:them
- "They're saying up top they'll make you pay for this. Don't let them." #speaker:them
}
-> END

// The citadel that evening, talking about it.
=== c3day2_halls_courtier ===
{ energy == "high":
    { shuffle:
    - "Highness. The gala goes ahead after all. My wife will be thrilled." #speaker:them
    - "A wise choice, Highness. Very wise. Your father must be proud." #speaker:them
    }
- else:
    { shuffle:
    - "Candles, Highness. In the citadel. Candles." #speaker:them
    - "I do hope they're grateful down there." #speaker:them
    }
}
-> END

=== c3day2_halls_servant ===
{ energy == "high":
    "Evening, Highness. All the lamps lit, as usual." #speaker:them
- else:
    She's lighting candles along the gallery, one by one.
    "Half the lamps are off, Highness. We're to light the corridors by hand tonight." #speaker:them
}
-> END

// The painter, chalking a wing by a dead lamp: he doesn't know who you are.
=== c3day2_painter ===
{ painter2:
    "Go away, I'm busy." #speaker:painter
    -> END
}
~ painter2 = true
A kid, chalking on the wall by a dead lamp. A wing over a line of bare ground, the tips of its feathers cut off straight. Quick, like he's done it a hundred times.
"What are you looking at?" #speaker:painter
"What is it?" #speaker:prince
"A wing. What does it look like?" #speaker:painter
"What does it mean?" #speaker:prince
"Means the lights went out." #speaker:painter
He doesn't know who you are. He goes back to his wing.
-> c3day2_below_done

// Day 1's petition: the woman's street.
=== c3day2_woman ===
{ woman2: -> c3day2_woman_again }
~ woman2 = true
{
- lift_mended && energy == "high":
    Her street's lift is mended. And dead: there's no power to run it.
    The woman from the audience is at its foot, with an old woman leaning on her arm. She sees you. She knows you, hood or not.
    "You mended it, Highness. Then you turned it off." #speaker:petitioner
    She doesn't say it angrily. That's worse.
- lift_mended:
    Her street's lift is running. A kid rides it up and down, up and down, for the joy of it.
    The woman from the audience is at its foot. She sees you. She knows you, hood or not.
    "It runs, Highness. My mother came down to the street tonight, for the first time in a month." #speaker:petitioner
    "Thank you." #speaker:petitioner
    She doesn't smile, but she means it.
- else:
    Her street's lift is still broken, dark at the bottom of its shaft.
    The woman from the audience is at its foot, with an old woman leaning on her arm. She sees you. She knows you, hood or not.
    "'It'll be seen to,' you said." #speaker:petitioner
    She turns back to her mother, and helps her onto the first step of eleven flights.
}
-> c3day2_below_done

=== c3day2_woman_again ===
{ lift_mended:
    "Highness." #speaker:petitioner
- else:
    She doesn't look at you.
}
-> END

// Once you've seen the painter and the woman's street: dawn's coming. Your hand points you to whichever's left.
=== c3day2_below_done ===
{
- painter2 && woman2:
    "Dawn soon. Back up, before anyone's awake to see us." #speaker:diplomat
    ~ c3day2 = "home"
    ~ objective = "Go back up to your rooms"
    ~ objective_target = "prince-quarters:bed-2"
- painter2:
    "And the woman from your audience. She lives in the low district, up on a walkway. You should see her street." #speaker:diplomat
    ~ objective = "Find the woman from your audience"
    ~ objective_target = "low-district:woman-2"
- else:
    "Somebody's still out, chalking. Over by the dead lamp." #speaker:diplomat
    ~ objective = "See who's out in the dark"
    { energy == "high":
        ~ objective_target = "low-district:painter-2"
    - else:
        ~ objective_target = "promenade:painter-2"
    }
}
-> END

// --- Back up, before dawn ---

=== c3day2_bed ===
~ plain_coat = false
~ hand_with_you = false
You take off the plain coat. It smells of smoke.
~ c3day2 = "done"
~ c3day3 = "wake"
~ objective = ""
~ objective_target = ""
It's nearly light. You lie down anyway. #wake:prince-quarters:120:226:c3day3_start #endday:Two weeks on.
-> END

// Coming into the dark district (a trigger at the way in): only the one that went without.
=== c3day2_dark_low ===
{ energy != "high": -> END }
-> c3day2_dark

=== c3day2_dark_promenade ===
{ energy != "people": -> END }
-> c3day2_dark
