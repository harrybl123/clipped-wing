// ============================================================================
// Chapter 3, Day 8: the broadcast. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// The last day. Dawn: your hand helps you into your coat ("Whatever you say today, say it out loud."). Your
// father at the war table first (designer: a game against him, to make a point): he plays the rising, you the
// guard, the city as it is this morning; then again, with the transfer list taken off the table, and it's easy.
// "Not cruelty. Arithmetic." Then the broadcast from the audience hall, the city watching in its streets, and
// big choice 3 (`broadcast`: backed / defied / middle), and the city's answer. Evening, your balcony: your hand
// tells you everything he's done, "Revolution is inevitable", and "Join me." No answer. The end card.
// Stages in `c3day8` (main.ink).
// ============================================================================

// --- Dawn, your quarters: your hand, as on Day 1, but no blades ---

=== c3day8_start ===
~ c3day8 = "wake"
Somebody knocks. Then the door opens anyway. #show:hand-8 #beside:hand-8:-60:walk
Your hand, in the doorway. No blades this time. Over his arm, your coat: the good one, with the wine collar.
"Up. The whole city's getting up to watch you." #speaker:diplomat
He helps you into it, and straightens the collar, the way he did when you were small.
{ helped_escape:
    Last night your friend went out through his office, past his lamp. You look for it in his face.
    Nothing. Not a flicker.
- else:
    "I hear your friend went out through my door last night. I wasn't there, of course." #speaker:diplomat
    He says it the way he'd say it looked like rain.
}
"Whatever you say today, say it out loud." #speaker:diplomat
"You said that before." #speaker:prince
"It's still true." #speaker:diplomat
"Your father wants you first. Behind the bookshelf." #speaker:diplomat
He goes. #leave:hand-8:36:50
~ sim_open = true
~ c3day8 = "study"
~ objective = "Go to your father"
~ objective_target = "simulation-room:father-8"
-> END

// --- The simulation room: your father at the war table ---

=== c3day8_father ===
{ c3day8 != "study":
    "The hall. They're waiting." #speaker:father
    -> END
}
~ c3day8 = "table"
~ objective = ""
~ objective_target = ""
He's already at the table, and the low district's lit on it. He doesn't look up.
"Before you read it to them, I want you to see why." #speaker:father
"You'll be the guard. I'll be them." #speaker:father
"You? The rising?" #speaker:prince
"Somebody should play them properly. Nobody ever has." #speaker:father
"This is the district as it is this morning. Everyone who was on the square. Everyone from that cellar. All of them still in it." #speaker:father
"Take their square by dawn." #speaker:father #wartable:father8
-> END

// The first game (src/scenes/RiotTableScene.ts, `father8`; `table8`).
=== c3day8_table_intro ===
"Your move. I won't wait for you." #speaker:father
-> END

=== c3day8_table_won ===
Your guard on the square, and the light there gone your colour.
He looks at you across the table, a long time.
"You play it as if you were the capital." #speaker:father
"Good. This morning, you are." #speaker:father
"Again." #speaker:father
-> END

=== c3day8_table_lost ===
The sun comes up on the table's edge, and the square's still theirs.
"Hard, isn't it? Even knowing how. Even knowing me." #speaker:father
"Again." #speaker:father
-> END

// The second game (`father8_list`; `list8`): the list taken off first.
=== c3day8_list_intro ===
"This time, with the list." #speaker:father
He touches the table, street by street, as if he's reading names.
The square too. Everyone who was on it.
{ struck == "none":
    He takes every one of them off.
- else:
    He stops at one, and leaves it where it is.
    "You kept one. Watch it." #speaker:father
}
-> END

=== c3day8_list_won ===
It's hardly a game. Your guard walk into the square.
"That's what you're reading out this morning." #speaker:father
"Not cruelty. Arithmetic." #speaker:father
-> END

=== c3day8_list_lost ===
Dawn comes up on the table, and the square's somehow still theirs.
{ struck != "none":
    He looks at the one you kept.
}
"One's enough, you see. One's always enough." #speaker:father
"That's what you're reading out this morning. Not cruelty. Arithmetic." #speaker:father
-> END

// Back in the room after.
=== c3day8_after_table ===
The table goes dark between you.
{ seen_gate:
    "Somebody helped the boy through the gate last night." #speaker:father
    He says it to the table, not to you.
    "The commander thinks she knows who." #speaker:father
    He doesn't say anything else. He doesn't need to.
}
"They're setting up the lenses. Go and stand where I put you." #speaker:father
~ c3day8 = "hall"
~ objective = "Speak to the city"
~ objective_target = "audience-hall:mark-8"
-> END

// --- Morning, the audience hall: the broadcast ---

=== c3day8_broadcast ===
{ c3day8 != "hall":
    -> END
}
~ c3day8 = "speech"
~ objective = ""
~ objective_target = ""
You take your place at the front of the dais. Not a step below him this time. In front of him.
The hall's full, courtiers to the doors. At the back, the guests, the heirs who can't go home.
{ friend_gone:
    There's a space among them, where your friend would have stood.
}
The lenses on their stalks, all turned on you. Your father, behind you, beside the throne.
"In your own time." #speaker:father
The small lights come on over every lens.
You look down at the sheet. You know it by heart. #cut:low-district:352:236:c3day8_cut_low
-> END

// The low district: the street under its screen, and you on it.
=== c3day8_cut_low ===
The low district. The whole street's out under the screen, more of them than came out for your father.
On the screen, you. Your face, bigger than the building. #bark:low-8a:That's him.
{ struck == "barkeep":
    Somebody says the barkeep's name, and that he's still here. Because of the prince. #bark:low-8c:He's still here. Because of him.
- else:
    Somebody says the barkeep's name, and nobody answers. #bark:low-8c:They took him from his own bar.
}
They wait. #cut:promenade:410:232:c3day8_cut_promenade
-> END

// The promenade: the square under the great screen.
=== c3day8_cut_promenade ===
The promenade. The shoppers have put their bags down again, under the great screen.
Somebody's lifting a child up to see. #bark:prom-8a:Look. The prince.
Somebody isn't sure. #bark:prom-8b:What's he going to say?
Up on the screen, your mouth opens. #goto:audience-hall:610:212:c3day8_choice
-> END

// Back in the hall: big choice 3.
=== c3day8_choice ===
The lights over the lenses. The whole city, waiting for your voice.
Behind you, your father hasn't moved.
What do you tell the city? #dim:on
- (choose)
+ [Read his order as written.]
    You read his order to the city, every word: everyone taken in the raids and on the square is sent away.
    Your father will trust you. The city will be afraid of you.
    ++ [Yes. Read it as written.]
        ~ broadcast = "backed"
        ~ standing += 2
        You read it. Every word, slowly, as he taught you. You look up at the lenses on "purpose". #dim:off
    ++ [No. Think again.]
        -> choose
+ [Defy him. Nobody will be sent away.]
    You tell the city, live, against his order, that no one will be sent away, and that things will change.
    The city will hear it. So will your father, in front of his whole court.
    ++ [Yes. Defy him.]
        ~ broadcast = "defied"
        ~ lean += 2
        You fold the sheet, and put it away. #dim:off
        "My father has written an order, sending away everyone taken in the raids. I won't read it." #speaker:prince
        "Nobody will be sent away. Not while I'm standing here. Things are going to change." #speaker:prince
        Behind you, nothing. Not a sound.
    ++ [No. Think again.]
        -> choose
+ [Read it, and soften it.]
    You read the order, and promise them it won't be for ever: that they'll be fed, and brought home.
    Your father never agreed to that. Neither side will be sure what you meant.
    ++ [Yes. Read it, and soften it.]
        ~ broadcast = "middle"
        ~ lean += 1
        ~ standing += 1
        You read it. Every word. #dim:off
        And then you keep going.
        "It won't be for ever. They'll be fed. And I will see them brought home." #speaker:prince
        Behind you, your father shifts his weight. That's all.
    ++ [No. Think again.]
        -> choose
- ~ c3day8 = "answer"
The lights over the lenses go out. #cut:promenade:410:232:c3day8_answer_promenade
-> END

// The city's answer: the promenade.
=== c3day8_answer_promenade ===
{ broadcast:
- "backed":
    The promenade. Nobody says anything. They pick up their bags, and go. #bark:prom-8b:...
    Somebody looks up the hill at the citadel, and then quickly down. #bark:prom-8c:Don't.
- "defied":
    The promenade. For a moment nobody moves. #bark:prom-8a:Did he just...
    Then somebody shouts it. Then all of them. #bark:prom-8c:The prince! #sound:roar
- else:
    The promenade. They look at each other. #bark:prom-8b:Brought home when?
    Nobody's sure whether to be glad. #bark:prom-8c:Was that a yes?
}
The screen goes back to the old notices. #cut:low-district:352:236:c3day8_answer_low
-> END

// The low district.
=== c3day8_answer_low ===
{ broadcast:
- "backed":
    The low district. A woman sits down on the step under the screen, as if her legs have gone. #bark:low-8b:Everyone?
    Quiet, all the way down the street. Quiet isn't the same as over.
- "defied":
    The low district. They're shouting it up at the screen, at your face on it. #bark:low-8a:He said nobody!
    Somebody's crying. Somebody's laughing. #bark:low-8b:He said it out loud.
- else:
    The low district. Somebody spits. Somebody else says to wait and see. #bark:low-8a:Brought home. Right.
    The street stays out under the screen a long time, as if it might say more.
}
Up in the hall, the lenses' lights are still out. #goto:audience-hall:610:212:c3day8_answer_hall
-> END

// Back in the hall: your father.
=== c3day8_answer_hall ===
{ broadcast:
- "backed":
    By the doors, someone starts to clap. Then the whole hall.
    Your father's hand comes down on your shoulder, for the lenses that aren't watching any more.
    "Now they know you're mine." #speaker:father
    For the first time in your life, he sounds as if he trusts you.
- "defied":
    Nobody claps. Nobody moves. A courtier coughs, and looks horrified at himself.
    Your father comes down off the dais, past you, close enough to touch. He doesn't raise his voice.
    "Go to your rooms." #speaker:father
- else:
    The hall doesn't know whether to clap. A few of them do, and stop.
    Your father comes to stand beside you, and looks out over the hall with you, as if nothing's happened.
    "You think I enjoy it." #speaker:father
    "One day you'll carry what I carry. Then you'll understand the paper." #speaker:father
    He doesn't say what it is. He doesn't let go of your arm for a long moment.
}
He goes down the dais, and out. The hall goes after him, talking under its breath. #leave:father-8:40:40 #leave:captain-8:40:50 #leave:hall-80:30:40 #leave:hall-81:30:40 #leave:hall-82:30:40 #leave:hall-83:30:40 #leave:hall-84:30:40 #leave:hall-85:30:40 #leave:hall-86:30:40 #leave:hall-87:30:40
~ c3day8 = "evening"
The hall's empty, but for the lenses, still turned on where you stood. #time:evening
~ objective = "Go out to the balcony"
~ objective_target = "prince-quarters:hand-8b"
-> END

// Waiting for the broadcast (anyone you speak to on the way to your place).
=== c3day8_father_wait ===
"Your place." #speaker:father
-> END

// The city, watching.
=== c3day8_watching ===
They don't take their eyes off the screen.
-> END

// --- Evening, your balcony: your hand, and everything ---

=== c3day8_hand ===
{ c3day8 != "evening":
    -> END
}
~ c3day8 = "balcony"
~ objective = ""
~ objective_target = ""
Your hand, at the rail, where he waited for you with the blades the first morning. The city below, lighting up. The tree, far off.
{ broadcast == "backed":
    Boots in the hall behind your rooms. A lot of them, in a hurry.
    "Your father reads reports quickly. They'll be in my office by now." #speaker:diplomat
    "So I'll be quick." #speaker:diplomat
- else:
    "Sit with me a minute." #speaker:diplomat
    He's in no hurry at all.
}
"The wing on the walls. Mine. My chalk, the first ones. Then the painter's. Then everyone's." #speaker:diplomat
You remember him on this balcony, the first morning, fighting like a soldier, not a fencer.
"The commander. The engineer. The physician who put your father to bed the night it caught. Your friend's sleeve." #speaker:diplomat
"I put them together. One at a time. Nobody knows all of them but me." #speaker:diplomat
"The reformer?" #speaker:prince
"A good man. He thinks he's leading something. He's what your father watches, so nobody watches me." #speaker:diplomat
"He doesn't know?" #speaker:prince
"He mustn't. It's kinder." #speaker:diplomat
"Every time I took you below. The streets, the cellar, the people who knew my name." #speaker:diplomat
You remember them greeting him on the stairs, and the crowd on the square going quiet for him.
"I wanted you to see it. I chose what you saw." #speaker:diplomat
"And the raid?" #speaker:prince
"I went up for air." #speaker:diplomat
He doesn't say any more about it.
{ helped_escape:
    "And last night, a door left unlocked, and a lamp lit." #speaker:diplomat
- else:
    "And last night, a door left unlocked. Your friend found it on his own." #speaker:diplomat
}
Every one of them lines up, the whole long way back to the first morning.
"Why tell me?" #speaker:prince
"Because it's coming. Whatever any of us does." #speaker:diplomat
"Revolution is inevitable." #speaker:diplomat
"Don't be on the wrong side of history." #speaker:diplomat
He holds out his hand.
"Join me." #speaker:diplomat
{ broadcast:
- "backed":
    The boots are at your door.
    He steps up onto the rail, and over it, and down, towards the lifts, into the city, before you can say anything at all. #leave:hand-8b:560:70
- "defied":
    You don't take it. You don't not take it.
    He leaves his hand there, easily, and looks out at the city with you. Below, they're still chanting your name.
- else:
    You don't take it.
    He nods, as if you'd answered. He steps back, a proper distance, and bows, and goes in. #leave:hand-8b:30:40
}
-> c3day8_end

=== c3day8_end ===
~ c3day8 = "done"
{ broadcast:
- "backed":
    { helped_escape:
        You stand at the rail until the city's all lit. #ending:c3_backed_out
    - else:
        You stand at the rail until the city's all lit. #ending:c3_backed_alone
    }
- "defied":
    { helped_escape:
        You stand at the rail until the city's all lit. #ending:c3_defied_out
    - else:
        You stand at the rail until the city's all lit. #ending:c3_defied_alone
    }
- else:
    { helped_escape:
        You stand at the rail until the city's all lit. #ending:c3_middle_out
    - else:
        You stand at the rail until the city's all lit. #ending:c3_middle_alone
    }
}
-> END

// The court, waiting for the broadcast.
=== c3day8_courtier ===
{ shuffle:
- "Highness." #speaker:them
- They bow, and look past you at the lenses.
- "The whole city, Highness. Imagine." #speaker:them
}
-> END

// The guests at the back, the heirs who can't go home.
=== c3day8_guest ===
{ shuffle:
- "Highness." #speaker:them
- They look at you as if you might say something about them. You don't.
}
-> END

// The captain's men on the gallery (if you backed your father).
=== c3day8_guards ===
"Captain's orders, Highness. Nothing to trouble you." #speaker:them
-> END
