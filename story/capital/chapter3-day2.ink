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

// The war table's lines (src/data/warTable.ts, LESSON). The lesson is his: plain, a few words each.
=== c3day2_table_intro ===
"The low district has risen. You're the rising: the amber lights." #speaker:father
"I'm the guard: the blue." #speaker:father
"Each light is a squad. The number is how many." #speaker:father
"Pick one of yours and send it along a street, a stair or a lift. Into an empty place, it takes it. Into one of yours, they join up." #speaker:father
"Into one of mine, it's a fight. The bigger number wins, and keeps what's left over. Going uphill costs you one. The citadel's worth one more to whoever holds it." #speaker:father
"A lift goes anywhere the lifts go." #speaker:father
"My arrows show you what I'm going to do. Read them. Then take the promenade." #speaker:father
-> END

=== c3day2_table_dropin ===
"That one. Go down yourself." #speaker:father
"Some fights you don't leave to the table." #speaker:father
-> END

=== c3day2_table_good ===
"Good." #speaker:father
-> END

=== c3day2_table_now ===
He stands up straight, and steps back from the table.
"Now." #speaker:father
-> END

=== c3day2_table_end ===
It's over. Every light on the table is his.
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
~ objective_target = "council-chamber:reformer-2;council-chamber:councillor-2;council-chamber:cousin-2;council-chamber:hand-4"
-> END

=== c3day2_heard ===
~ heard2 += 1
{ heard2 >= 3:
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
Who goes without power this season? #dim:on
- (choose)
+ [The low district goes without]
    The citadel, the glasshouse and the promenade stay lit, and the salons will warm to you.
    The low district goes dark in the evenings: no lights, no lifts, no heat.
    ++ [Yes. The low district goes without.]
        ~ energy = "high"
        ~ lean -= 1
        ~ standing += 1
        "The low district goes without." #speaker:prince #dim:off
        Nobody on the tiers looks surprised. The reformer sits down.
    ++ [No. Think again.]
        -> choose
+ [The upper city goes without]
    The low district keeps its lights, its lifts and its heat.
    The citadel dims, and the promenade goes dark in the evenings. Upper society will call you soft, and your father won't like it.
    ++ [Yes. The upper city goes without.]
        ~ energy = "people"
        ~ lean += 1
        ~ standing -= 1
        "The upper city goes without." #speaker:prince #dim:off
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

// On the balcony (a trigger): you see it happen.
=== c3day2_dusk ===
~ dusk2 = true
{ energy == "high":
    ~ dark_district = "low"
    Down at the bottom of the city, the lights go out. Street by street, until the low district's just a darker dark. #repaint
    Here and there, a candle.
- else:
    ~ dark_district = "promenade"
    Halfway down the city, the promenade goes dark, its great screen and all. #repaint
    Then the lights in your own rooms lower round you.
}
~ c3day2 = "report"
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
    "You gave it away." #speaker:father
    He doesn't raise his voice. He doesn't need to.
    "The salons will call you soft. Let them." #speaker:father
    "Don't do it again without me." #speaker:father
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
"You should see what you decided." #speaker:diplomat #time:night
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
He says nothing.
"Keep your head down, and keep out of the watch's light. If they see you, your father hears of it by morning." #speaker:diplomat
-> END

// Your hand, walking with you below.
=== c3day2_hand_below ===
{ c3day2:
- "below": "Keep out of their light." #speaker:diplomat
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
-> END

// The people below: they go quiet, then they want to tell you (designer).
=== c3day2_cold ===
"You're him." #speaker:them
"It's cold in there with no heat, Highness. My kids are sleeping in their coats." #speaker:them
-> END

=== c3day2_stairs ===
"The lifts stop at dusk now. Eleven flights to my door, in the dark." #speaker:them
"My father can't do them. He's sleeping on the step." #speaker:them
-> END

=== c3day2_food ===
"The cold stores are off. Everything in them'll spoil by morning." #speaker:them
"A week's food. Who's paying for that, Highness?" #speaker:them
-> END

// The painter, chalking a bird by a dead lamp: he doesn't know who you are.
=== c3day2_painter ===
{ painter2:
    "Go away, I'm busy." #speaker:painter
    -> END
}
~ painter2 = true
A kid, chalking on the wall by a dead lamp. A bird, wings up, rising off a line of bare ground, in a ring. Quick, like he's done it a hundred times.
"What are you looking at?" #speaker:painter
"What is it?" #speaker:prince
"A bird. What does it look like?" #speaker:painter
"What does it mean?" #speaker:prince
"Means the lights went out." #speaker:painter
He doesn't know who you are. He goes back to his bird.
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
    "Thank you, Highness." #speaker:petitioner
    She doesn't smile, but she means it.
- else:
    Her street's lift is still broken, dark at the bottom of its shaft.
    The woman from the audience is at its foot, with an old woman leaning on her arm. She sees you.
    She doesn't look at you again.
}
-> c3day2_below_done

=== c3day2_woman_again ===
{ lift_mended:
    "Highness." #speaker:petitioner
- else:
    She doesn't look at you.
}
-> END

// Once you've seen the painter and the woman's street: dawn's coming.
=== c3day2_below_done ===
{ painter2 && woman2:
    "Dawn soon. Back up, before anyone's awake to see us." #speaker:diplomat
    ~ c3day2 = "home"
    ~ objective = "Go back up to your rooms"
    ~ objective_target = "prince-quarters:bed-2"
- else:
    { painter2:
        "Her street's in the low district. Come on." #speaker:diplomat
        ~ objective = "Find the woman's street"
        ~ objective_target = "low-district:woman-2"
    - else:
        ~ objective = "See what you decided"
        { energy == "high":
            ~ objective_target = "low-district:painter-2"
        - else:
            ~ objective_target = "promenade:painter-2"
        }
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
It's nearly light. You lie down anyway. #wake:prince-quarters:120:226 #endday:Two weeks on.
-> END

// Coming into the dark district (a trigger at the way in): only the one that went without.
=== c3day2_dark_low ===
{ energy != "high": -> END }
-> c3day2_dark

=== c3day2_dark_promenade ===
{ energy != "people": -> END }
-> c3day2_dark
