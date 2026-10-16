// ============================================================================
// Chapter 3, Day 6: the guests. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// Days after the raid. It opens with your friend (designer: the war table hasn't been used enough): you take
// him through your father's bookshelf to the simulation room and challenge him to a duel on the table, the old
// castle's siege, you with fewer troops; and your father finds you there (designer: more damning), the captain
// behind him with an invitation: your friend is to be a guest of the citadel (pushback 5). You give it to him,
// or the captain does. Then the plan: your father in his study (the room, Day 5, the list); the guests arrive;
// in the guest wing your friend finds he can't leave ("I can't go home, can I?"); the banquet in the guests'
// honour, and the commander and the engineer leaving your hand's office (clue 6); at night, your sister to the
// sealed door, and the hum (medium choice: cover for her, or tell). Stages in `c3day6` (main.ink).
// ============================================================================

// --- Dawn, your quarters: your friend ---

=== c3day6_start ===
~ c3day6 = "wake"
// (The bookshelf's been shut since the riot: you know how it opens.)
~ sim_open = false
Grey light. The screen in your sitting room's showing the face again. It's never off now.
Someone's on your couch, eating your breakfast.
~ objective = "Talk to your friend"
~ objective_target = "prince-quarters:heir-6"
-> END

=== c3day6_heir ===
{ c3day6 != "wake":
    -> c3day6_heir_walk
}
"Your door wasn't locked. Your eggs weren't guarded." #speaker:heir
"Days, you've been shut up in here. My mother says you're ill. Her friends say worse." #speaker:heir
{ raid == "stepped_in":
    "They say you were seen below. In a cellar. With your hood down." #speaker:heir
    "Were you?" #speaker:heir
    You don't answer. He grins anyway.
    "Thought so." #speaker:heir
- else:
    "Every screen in the city's got that face on it. Your father's hand on your shoulder." #speaker:heir
    "You looked like you'd swallowed a wasp." #speaker:heir
}
"I'm bored. The whole city's holding its breath. Show me something." #speaker:heir
Something nobody's seen. Your father's at the council all morning.
"Come with me." #speaker:prince
~ c3day6 = "friend"
~ heir_with_you = true
~ objective = "Show your friend the war table"
~ objective_target = "fathers-study:shelf-6"
-> END

// Him at your side, on the way.
=== c3day6_heir_walk ===
{ shuffle:
- "Where are we going? Tell me it's somewhere I'm not allowed." #speaker:heir
- "Your father's study? He'll have us hanged." #speaker:heir
- "Lead on, Highness." #speaker:heir
}
-> END

// --- Your father's study: the bookshelf ---

=== c3day6_shelf ===
{ c3day6 != "friend":
    -> END
}
You reach in behind the third shelf, where your father reached. #sound:latch
The bookshelf swings back, on a room of black and blue light. #sound:grate
~ sim_open = true
"No." #speaker:heir
"No. That's been there the whole time?" #speaker:heir
"Since before I was born. I found out a few weeks ago." #speaker:prince
~ c3day6 = "room"
~ objective = "Show your friend the war table"
~ objective_target = "simulation-room:table-6"
-> END

// --- The simulation room ---

=== c3day6_room ===
~ room6 = true
The points of light go on and on into the dark. Your friend turns round slowly, as if they might touch him.
"What is this place?" #speaker:heir
"Where my father practises the art of war." #speaker:prince
"Of course it is." #speaker:heir
-> END

=== c3day6_table ===
{ c3day6 != "room":
    -> END
}
You put your hands on the table, and it lights under them: the crag, before there was a citadel on it. The old castle, and an army round it.
"The siege of the crag. My great-great-something held it through a winter. Every child in this family's played it." #speaker:prince
"You want to play me at your family's own game?" #speaker:heir
"I'll give you the bigger army." #speaker:prince
"Then I'll take it." #speaker:heir
He comes round to the other side of the table, rubbing his hands.
"Where do you want to fight it? It'll paint it anywhere." #speaker:prince
"Anywhere?" #speaker:heir
* [A rainforest.]
    ~ duel6_map = "forest"
    "A rainforest. I've never seen one." #speaker:heir
    The crag goes green under your hands: a canopy so thick you can't see the ground, paths worn through it.
* [A space station.]
    ~ duel6_map = "station"
    "Somewhere in the sky. Up past the stars." #speaker:heir
    The crag goes to metal plates and lit corridors, with the stars all round the edge.
* [The crag, as it really was.]
    ~ duel6_map = "crag"
    "The real thing, then. Fine." #speaker:heir
    The crag stays the crag: the keep, the walls, the old town below, the fields.
- ~ c3day6 = "table"
~ heir_with_you = false
"Take my camp and you win. Take my keep, and I do." #speaker:prince #wartable:duel
-> END

// --- The duel (src/scenes/RiotTableScene.ts, `duel`) ---

=== c3day6_duel_intro ===
"More men every turn coming into my camp, and you've a few farmers behind a wall." #speaker:heir
"One a turn. And I'm coming for your camp." #speaker:prince
"Your move, Highness." #speaker:heir
-> END

=== c3day6_duel_won ===
Your army in his camp, and the light there gone your colour.
"That's not fair. I had more of everything." #speaker:heir
"You had more. I brought mine together." #speaker:prince
He laughs, and leans across the table to shake your hand.
-> END

=== c3day6_duel_lost ===
{ duel6_how == "keep":
    His army over the walls, into the keep, the light gone his colour.
- else:
    The sun comes up on the table's edge, and his camp's still standing.
}
"The crag falls! History is rewritten!" #speaker:heir
He's doing a little dance round his side of the table.
"Don't tell anyone." #speaker:prince
"I'm telling everyone." #speaker:heir
-> END

// Your father, in the doorway (designer: damning). The captain behind him, and the invitation.
=== c3day6_caught ===
~ c3day6 = "caught"
{ duel6 == "won":
    "Again. Same armies. I've worked it out now." #speaker:heir
- else:
    "Again. You can have the big army this time. Go on." #speaker:heir
}
"No. I don't think so." #speaker:father #show:father-6s
Your father, in the doorway of his own room.
Your friend stands up very straight.
Behind your father, the captain. Behind the captain, two of the guard. #show:captain-6s #show:guard-6a #show:guard-6b
Your father walks the length of the table, slowly, looking at it. At the camp, and the keep, and whose colour each is. #walk:father-6s:268 #walk:captain-6s:120 #walk:guard-6a:80 #walk:guard-6b:96
"The siege of the crag." #speaker:father
"I taught you that one." #speaker:father
He doesn't look at your friend. Not once.
"I came to find you because I have a gift for your friend. How fortunate that he's here." #speaker:father
He holds out a card, sealed in gold, to you. The captain holds out his hand for it too.
"An invitation. To live in the citadel, as our guest, for as long as these times last. His family will be proud." #speaker:father
"Someone takes it to him. You, or the captain." #speaker:father
Hand it to your friend yourself, or let the captain give it to him?
- (choose)
+ [Give it to him yourself.]
    He'll take it gladly, from you. And later, he'll remember whose hand it came from.
    ++ [Yes. Give it to him.]
        ~ invitation = "you"
        You take the card. It's heavy, for a card.
        You hold it out across the table. Your friend looks at it, then at you.
        "From you?" #speaker:heir
        "From me." #speaker:prince
        He breaks the seal. He reads it twice.
        "A guest of the citadel. Me." #speaker:heir
        "My mother will faint." #speaker:heir
        He's smiling. He doesn't know yet. You do.
    ++ [No. Think again.]
        -> choose
+ [Let the captain give it to him.]
    It won't be your hand on it. But you'll stand there while it's done.
    ++ [Yes. Let the captain.]
        ~ invitation = "captain"
        ~ lean -= 1
        You don't take it. The captain does.
        He reads it out, the whole thing, every honour in it, in the voice he uses for warrants.
        Your friend listens to all of it. Then he looks at you.
        You look at the table.
    ++ [No. Think again.]
        -> choose
- "The captain will see you to your rooms. Your things will follow." #speaker:father
"My rooms? I've rooms at home." #speaker:heir
"You have better ones here." #speaker:father
The guard step either side of him. Nobody touches him. Nobody needs to. #walk:guard-6a:386 #walk:guard-6b:422
They walk him out of the dark, between them, the captain behind. #leave:heir-6s:30:40 #leave:guard-6a:30:40 #leave:guard-6b:30:40 #leave:captain-6s:30:40
At the bookshelf, he looks back at you. Then he's gone.
"My study, when you're ready." #speaker:father
He goes. #leave:father-6s:30:40
~ c3day6 = "study"
~ objective = "Go to your father's study"
~ objective_target = "fathers-study:father-6"
-> END

// --- Your father's study: the room, what you did below, the list ---

=== c3day6_father ===
{ c3day6 != "study":
    "Later." #speaker:father
    -> END
}
~ father6 = true
Your father at his desk. The bookshelf's shut again, as if it were only ever books.
~ sim_open = false
"Sit." #speaker:father
You sit.
"That room has been in this family for four generations. Nobody outside it has ever stood in it." #speaker:father
"Until this morning. You took a doubtful family's son in there, and played games on my table." #speaker:father
"He's my friend." #speaker:prince
"Yes. That's what makes it a mistake." #speaker:father
{ raid == "stepped_in":
    "And there's the other thing." #speaker:father
    "The captain tells me you were in a cellar under the low district, the night we took it. Without your hood." #speaker:father
    { standoff5 == "held":
        "You ordered my guard out. And they went." #speaker:father
    - else:
        "You tried to order my guard out. They brought their boy in anyway." #speaker:father
    }
    "I haven't asked you why. I'm not going to. I want you to wonder, every day, when I will." #speaker:father
}
{ warrants == "struck":
    "You struck a cellar off the captain's list. I sealed it myself. You know which cellar." #speaker:father
}
He slides a sheet across the desk. Names, in the captain's hand. Old names: the families who've stopped coming to dinner.
"Our guests. The heirs of every family that's been careless lately. Their families will be proud." #speaker:father
"And careful." #speaker:father
Your friend's name, halfway down.
{ sleeve == "told":
    "His name came from you. The wing in his sleeve. The captain wrote it down the day you told him." #speaker:father
    "You did right." #speaker:father
- else:
    "His name was on this before this morning. After this morning, it would have been anyway." #speaker:father
}
"They arrive at noon. You'll greet them in the halls, and see them settled. They'll take it better from you." #speaker:father
~ c3day6 = "arrive"
~ objective = "Greet the guests"
~ objective_target = "citadel-halls:guest-6a"
-> END

// --- Noon, the halls: the guests arrive ---

=== c3day6_arrive ===
{ c3day6 != "arrive":
    -> c3day6_guest
}
They're at the foot of the stair in their best: the sons and daughters of the empty seats at dinner. Their servants have gone home without them.
"Highness! What an honour. Mother wept." #speaker:them
"We weren't told how long. Do you know how long?" #speaker:c3_courtier_2
"As long as these times last." #speaker:prince
"Oh. Good. Good." #speaker:c3_courtier_2
{ seated != "councillor":
    At the back, a thin young man you half know. The old councillor's grandson. His grandfather's seat at council has been empty since you passed him over at the banquet.
    "My grandfather says hello, Highness." #speaker:c3_courtier_5 #name:The councillor's grandson
    He doesn't say it warmly.
}
"Is it true your friend's one of us? They say he came up before any of us." #speaker:c3_courtier_6
"He's upstairs." #speaker:prince
"This way." #speaker:prince
You lead them up. They go up the stair behind you, looking at everything, touching the gold. #leave:guest-6a:480:36 #leave:guest-6b:480:36 #leave:guest-6c:480:36 #leave:guest-6d:480:36 #leave:grandson-6:480:36
~ c3day6 = "wing"
~ objective = "See the guests settled"
~ objective_target = "guest-wing:heir-6w"
They chatter all the way to the guest wing. #time:afternoon
-> END

// --- The afternoon, the guest wing: he can't leave ---

=== c3day6_barrier ===
~ barrier6 = true
At the barrier, your friend, a coat over his arm, and two of the guard in his way.
"I only want my blue coat. It's at home. I'll be an hour." #speaker:heir
"The captain's orders, sir. The guests stay in the wing." #speaker:c3_guard_0
"For the afternoon?" #speaker:heir
The guard doesn't answer that.
Your friend sees you. He looks at the guard, at the barrier, at the windows behind him with their gold lattice that doesn't open.
"I can't go home, can I?" #speaker:heir
He doesn't wait for you to answer. He walks off down the corridor, towards his room. #walk:heir-6w:70:40
~ objective = "Talk to your friend"
-> END

=== c3day6_friend ===
{ c3day6 != "wing":
    -> c3day6_friend_after
}
He's sitting on the end of a bed that isn't his, the invitation in his hands.
{ invitation == "you":
    "You gave me this. You knew." #speaker:heir
- else:
    "You stood there while he read it. You knew." #speaker:heir
}
"I knew this morning." #speaker:prince
"My mother's alone in that house. If they come for her..." #speaker:heir
He stops.
"Tell me straight. Can I go home?" #speaker:heir
Promise to get him out, or tell him to stay?
- (choose)
+ ["I'll get you out."]
    A promise. You'll have to keep it, past your father's guard, and he'll know you did.
    ++ [Yes. Promise him.]
        ~ promised = true
        ~ lean += 1
        "I'll get you out." #speaker:prince
        He looks at you a long time.
        "When?" #speaker:heir
        "When I can. Not yet." #speaker:prince
        "Not yet." #speaker:heir
        He nods.
        "All right. Not yet." #speaker:heir
        He holds out his hand, and you take it.
    ++ [No. Think again.]
        -> choose
+ ["It's an honour. Stay."]
    You'll keep your father's peace. He'll know where you stand, and things between you won't be the same.
    ++ [Yes. Tell him to stay.]
        ~ promised = false
        ~ friend_cool = true
        ~ standing += 1
        "It's an honour. Stay. It won't be for ever." #speaker:prince
        He looks at you a long time.
        "Right." #speaker:heir
        "Thank you, Highness." #speaker:heir
        He's never called you that. Not once, since you were six.
    ++ [No. Think again.]
        -> choose
- ~ c3day6 = "banquet"
~ objective = "Go to the banquet"
~ objective_target = "banquet-gallery:father-6b"
Somewhere below, the musicians are tuning up. #time:evening
-> END

=== c3day6_friend_after ===
{ friend_cool:
    He nods at you, politely, and goes on looking at the window.
- else:
    "Not yet. I know." #speaker:heir
}
-> END

// The other guests, about the wing.
=== c3day6_guest ===
{ shuffle:
- "The rooms are lovely. The windows don't open. Is that usual?" #speaker:them
- "I asked to send a note home. They said they'd send it for me." #speaker:them
- "Highness. Thank you so much for having us!" #speaker:them
- "We'll be home for the season, won't we?" #speaker:them
}
-> END

=== c3day6_grandson ===
"Grandfather sat at your father's right for thirty years." #speaker:c3_courtier_5 #name:The councillor's grandson
"Now I sit in a room with a lattice on the window. Funny how things go." #speaker:c3_courtier_5 #name:The councillor's grandson
-> END

// --- Evening, the banquet gallery: in the guests' honour ---

=== c3day6_banquet ===
~ banquet6 = true
The banquet gallery, lit gold. The guests along the table in their best, one seat between each of them, where their families would sit.
Two of the guard at the doors. They face in.
Your father at the head of the table, standing. He waits for you to take your place.
"To our guests." #speaker:father
He lifts his glass. The guests lift theirs. Nobody drinks quite at the same time.
{ friend_cool:
    Halfway down the table, your friend drinks, and doesn't look at you.
- else:
    Halfway down the table, your friend lifts his glass an inch higher, at you. Just you.
}
"They're the future of this city. We'll keep them safe." #speaker:father
~ c3day6 = "office"
~ objective = "Go to bed"
~ objective_target = "prince-quarters:bed-6"
-> END

=== c3day6_father_banquet ===
"Smile, Highness. They're watching you to see whether to be afraid." #speaker:father
-> END

=== c3day6_heir_banquet ===
{ friend_cool:
    He's talking to the girl beside him. He doesn't stop.
- else:
    "Not here." #speaker:heir
    He says it under the music, and goes on smiling at the table.
}
-> END

// --- The halls, on the way up: your hand's door (clue 6) ---

=== c3day6_office ===
~ office6 = true
Up on the gallery, your hand's door opens.
Two people come out. The commander of the watch, in her coat, and the engineer from the sealed wing, her visor up. #show:commander-6 #show:engineer-6
Nobody has business in that office at this hour. They walk along the gallery to the lift, talking low, and don't see you. #leave:commander-6:900:30 #leave:engineer-6:900:30
Your hand, in his doorway behind them. He sees you. #show:hand-6h
"Highness. Late, isn't it?" #speaker:diplomat
"Late for visitors." #speaker:prince
"Old friends. They keep odd hours. So do I." #speaker:diplomat
"Goodnight, Highness." #speaker:diplomat
He goes in. The door shuts. #leave:hand-6h:720:30
~ c3day6 = "home"
-> END

// --- Night, your quarters: the third bell ---

=== c3day6_bed ===
You lie down. You don't sleep.
{ invitation == "you":
    Your friend's face, when he broke the seal. Pleased. #time:night
- else:
    Your friend's face, while the captain read it. Looking at you. #time:night
}
The third bell, far off in the citadel.
Then, outside your door, very soft: someone going past in stockinged feet.
Your sister. She told you she'd found a gap in the guard on the sealed wing: the third bell, when it changes.
~ c3day6 = "follow"
~ objective = "Follow your sister"
~ objective_target = "citadel-halls:sister-6n;fathers-study:to-sealed-wing;sealed-wing:sister-6w;sealed-wing:sister-6d"
-> END

// The gallery: your sister, the guard gone from your father's door.
=== c3day6_gallery ===
~ gallery6 = true
Along the gallery, your sister, her shoes in her hand.
Where the night guard stands at your father's door, nobody. The change of the guard.
If she sees you, she'll go straight back to bed, and you'll never know.
-> END

// The study, dark, and the door to the sealed wing.
=== c3day6_study_night ===
~ study6 = true
~ c3day6 = "sealed"
The study's dark. The fire's down to embers.
The door to the sealed wing is open a hand's width. The hum comes through it, louder than you've ever heard it.
-> END

// The sealed wing: the door, her hand on it, and the hum.
=== c3day6_door ===
~ door6 = true
She's at the door at the end, her hand flat on it.
She doesn't jump when you come up. She knew.
"You walk like Father. I heard you from the stair." #speaker:sister
"What are you doing?" #speaker:prince
"Put your hand on it." #speaker:sister
You do. It's warm. It hums, through your palm and up your arm, into your teeth. #sound:shimmer
"Feel it. Every night he goes in there, and stays till it's light. Talking." #speaker:sister
"Not yet tonight. He's late." #speaker:sister
"To who?" #speaker:prince
"I don't know. I've never heard anyone answer." #speaker:sister
Neither of you says anything for a while. The hum goes on.
"It's never opened for me. Not once. I've tried every night since the gap." #speaker:sister
"Will you tell him?" #speaker:sister
Cover for her, or tell your father she's been here?
- (choose)
+ [Cover for her.]
    You'll say nothing. She'll trust you, and be your eyes around the citadel. If he finds out, he'll know you hid it.
    ++ [Yes. Cover for her.]
        ~ sister = "covered"
        ~ lean += 1
        "I was never here. Neither were you." #speaker:prince
        She lets out a breath.
        "Then I'll tell you what I see. Everything. Where he goes. Who comes up." #speaker:sister
        "You'll be my eyes?" #speaker:prince
        "Someone has to be." #speaker:sister
    ++ [No. Think again.]
        -> choose
+ [Tell your father.]
    He'll trust you more. She'll stop telling you things.
    ++ [Yes. Tell him.]
        ~ sister = "told"
        ~ standing += 1
        "I have to tell him. You know I do." #speaker:prince
        She takes her hand off the door.
        "Yes. I suppose you do." #speaker:sister
        She goes past you without another word.
    ++ [No. Think again.]
        -> choose
- ~ c3day6 = "done"
~ c3day7 = "wake"
~ objective = ""
~ objective_target = ""
You walk back to your rooms the long way. The hum stays in your teeth till morning. #wake:prince-quarters:120:226 #endday:Day 7
-> END
