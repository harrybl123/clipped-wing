// ============================================================================
// Chapter 3, Day 8: the broadcast. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// The last day. Dawn: your hand helps you into your coat ("Whatever you say today, say it out loud."). Your
// father at the war table first (designer: a game against him, to make a point): he plays the rising, you the
// guard, the city as it is this morning; then again, with the transfer list taken off the table, and it's easy.
// "Not cruelty. Arithmetic." Then the broadcast from the audience hall, the city watching in its streets, and
// big choice 3 (`broadcast`: backed / defied / middle), and the city's answer; the afternoon in the city, and
// your sister. Evening, your balcony: your hand, proud of you, tells you everything he's done, slowly,
// "Revolution is inevitable", and "Join me." No answer. The end card.
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
// (Designer: the build-up shown round the city, while the prince doubts, an inner monologue; your father realises
// when you put the sheet away; the speech longer, with empathy for the people; the repercussions felt in the
// capital, not everyone just wandering off.)

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
Your hands are cold. You hadn't noticed until now.
"In your own time." #speaker:father
The small lights come on over every lens.
You look down at the sheet. You know it by heart. Your mouth won't open. #cut:lifts:110:770:c3day8_cut_lifts
-> END

// The foot of the lifts: the morning queue, under the screen on the tower, and your face on it, saying nothing yet.
=== c3day8_cut_lifts ===
The foot of the lifts. The queue for the first car up has stopped, under the screen on the tower.
On it, your face. Silent. Waiting, like them. #bark:lift-8b:Is it on?
The table's still lit somewhere behind your eyes. The square. The crowds going off it, one at a time.
Sent away. Sent away. Sent away.
It was so easy, once they were gone. That was the point. #cut:low-district:352:236:c3day8_cut_low
-> END

// The low district: the street under its screen, more of them than came out for your father.
=== c3day8_cut_low ===
The low district. The whole street's out under the screen, more of them than came out for your father.
Your face, bigger than the building. #bark:low-8a:That's him.
{ struck == "barkeep":
    Somebody says the barkeep's name, and that he's still here. Because of the prince. #bark:low-8c:He's still here. Because of him.
- else:
    Somebody says the barkeep's name, and nobody answers. #bark:low-8c:They took him from his own bar.
}
You think of the cellar. The names chalked on the wall, of the ones who went to the square and didn't come home.
The woman whose husband baked for the street. The kid under the little screen behind the bar.
They were never crowds. Not one of them was ever a number on a table.
And behind you, your father, who has never once been wrong in front of you. #cut:promenade:410:232:c3day8_cut_promenade
-> END

// The promenade: the square under the great screen.
=== c3day8_cut_promenade ===
The promenade. The shoppers have put their bags down again, under the great screen.
Somebody's lifting a child up to see. #bark:prom-8a:Look. The prince.
Somebody isn't sure. #bark:prom-8b:What's he going to say?
Your hand, this morning: say it out loud.
{ friend_gone:
    Your friend, somewhere on the road, who couldn't go home.
}
{ sister == "covered":
    Your sister, who trusted you with a secret, and is watching this from somewhere.
- else:
    Your sister, who asked you not to tell him, and you told him anyway.
}
What do you owe him? What do you owe them?
You don't know. You've never known. You've only ever known what he wanted.
Up on the screen, your mouth opens. #goto:audience-hall:610:212:c3day8_choice
-> END

// Back in the hall: big choice 3.
=== c3day8_choice ===
The silence has gone on too long. Somebody at the back coughs.
Behind you, very quietly, only for you: "Now." #speaker:father
What do you tell the city? #dim:on
- (choose)
+ [Read his order as written.]
    You read his order to the city, every word: everyone taken in the raids and on the square is sent away.
    Your father will trust you. The city will be afraid of you.
    ++ [Yes. Read it as written.]
        ~ broadcast = "backed"
        ~ standing += 2
        You take a breath. #dim:off
        -> c3day8_read
    ++ [No. Think again.]
        -> choose
+ [Defy him. Nobody will be sent away.]
    You tell the city, live, against his order, that no one will be sent away, and that things will change.
    The city will hear it. So will your father, in front of his whole court.
    ++ [Yes. Defy him.]
        ~ broadcast = "defied"
        ~ lean += 2
        You take a breath. #dim:off
        -> c3day8_defy
    ++ [No. Think again.]
        -> choose
+ [Read it, and soften it.]
    You read the order, and promise them it won't be for ever: that they'll be fed, and brought home.
    Your father never agreed to that. Neither side will be sure what you meant.
    ++ [Yes. Read it, and soften it.]
        ~ broadcast = "middle"
        ~ lean += 1
        ~ standing += 1
        You take a breath. #dim:off
        -> c3day8_read
    ++ [No. Think again.]
        -> choose

// Reading it (backed, and the middle way's start).
=== c3day8_read ===
"People of the capital." #speaker:prince
Your voice comes back to you off the walls, too loud. Then out of every screen in the city, a breath later.
"For a season now, a few have frightened the many. Streets burned. Doors broken. Our guard attacked in the dark." #speaker:prince
"That ends today." #speaker:prince
"Everyone taken in the raids, and on the square, will be sent out of the capital, to the managed places." #speaker:prince
"There they will be given work. Given purpose." #speaker:prince
You look up at the lenses on "purpose", the way he taught you.
"Their families will be told when they've arrived." #speaker:prince
Each word comes easier than the last. That's the worst of it.
{ broadcast == "backed":
    "My father and I will keep you safe." #speaker:prince
    Behind you, you hear him breathe out. He hadn't put that line in. You did.
    -> c3day8_spoken
}
That's where the sheet ends.
You don't stop.
Behind you, he shifts his weight. He knows exactly where it ends. He wrote it.
"I know what that means to some of you. Someone you love, on a list, with a word like 'purpose' next to their name." #speaker:prince
"I've been below. More than you'd think. I've seen what the dark does to a street." #speaker:prince
"So hear this from me, not from the paper." #speaker:prince
"It won't be for ever. They'll be fed. They'll be housed. Their families will hear from them." #speaker:prince
"And I will see them brought home. You have my word, in front of every one of you." #speaker:prince
Behind you, nothing. Your father hasn't moved. He won't, in front of the lenses.
-> c3day8_spoken

// Defying him.
=== c3day8_defy ===
You fold the sheet, once, and again, and put it inside your coat.
Behind you, a breath. Not loud. He's understood before anyone else in the hall has.
You feel him decide not to move. Not in front of every lens in the city.
"People of the capital." #speaker:prince
"My father has written an order. It says that everyone taken in the raids, and on the square, will be sent away. To be useful." #speaker:prince
"I'm not going to read it to you." #speaker:prince
A sound goes round the hall, like a gust through a door.
"I've been below. Some of you have seen me there, in a coat that didn't fool anyone." #speaker:prince
"I've sat in a cellar where there were names chalked on the wall. Husbands. Brothers. Sons. People who went to the square and didn't come home." #speaker:prince
"I've seen what the dark does to a street. The lifts stopped. The food going off. Children sleeping on the stairs because it's warmer than inside." #speaker:prince
"You were cold. You were hungry. And when you said so, out loud, we called you terrorists." #speaker:prince
"I'm sorry." #speaker:prince
It's very quiet. You can hear the lenses hum.
"Nobody will be sent away. Not while I'm standing here." #speaker:prince
"Things are going to change. I don't know how yet. I won't pretend to you that I do." #speaker:prince
"But it starts with somebody up here listening. So I'm listening." #speaker:prince
Behind you, your father lifts one finger.
The little lights over the lenses go out, all at once.
-> c3day8_spoken

// The lights go out over the lenses; the city's answer.
=== c3day8_spoken ===
~ c3day8 = "answer"
{ broadcast != "defied":
    The little lights over the lenses go out.
}
For a moment, nobody in the hall moves at all. #cut:promenade:410:232:c3day8_answer_promenade
-> END

// The city's answer: the promenade.
=== c3day8_answer_promenade ===
{ broadcast:
- "backed":
    The promenade. Nobody says anything. They pick up their bags. #bark:prom-8b:Everyone?
    Somebody looks up the hill at the citadel, and then quickly down. #bark:prom-8c:Don't.
    A man goes off fast, the way you'd go to warn someone. #bark:prom-8d:I have to tell her.
- "defied":
    The promenade. For a moment nobody moves. #bark:prom-8a:Did he just...
    The screen's gone back to the old notices. Nobody's looking at it any more.
    Then somebody shouts it. Then all of them. #bark:prom-8c:The prince! #sound:roar
    The woman with the child is crying, and laughing at herself for crying. #bark:prom-8e:He said sorry.
- else:
    The promenade. They look at each other. #bark:prom-8b:Brought home when?
    Nobody's sure whether to be glad. #bark:prom-8c:Was that a yes?
    An old man shakes his head. #bark:prom-8d:A promise is a promise.
}
Up the hill, in the citadel, the hall is still silent. #cut:low-district:352:236:c3day8_answer_low
-> END

// The low district.
=== c3day8_answer_low ===
{ broadcast:
- "backed":
    The low district. A woman sits down on the step under the screen, as if her legs have gone. #bark:low-8b:Everyone?
    Nobody helps her up. Everyone's looking at everyone else, working out who'll be on it.
    Quiet, all the way down the street. Quiet isn't the same as over.
- "defied":
    The low district. They're shouting it up at the screen, at where your face was. #bark:low-8a:He said nobody!
    Somebody's crying. Somebody's laughing. #bark:low-8b:He said it out loud.
    An old man takes his cap off, to a dark screen. #bark:low-8d:Sorry. He said sorry.
- else:
    The low district. Somebody spits. Somebody else says to wait and see. #bark:low-8a:Brought home. Right.
    A woman's already writing a name on a scrap of paper, to ask after. #bark:low-8b:He gave his word.
    The street stays out under the screen a long time, as if it might say more.
}
Back in the hall, someone finally moves. #goto:audience-hall:610:212:c3day8_answer_hall
-> END

// Back in the hall: your father, and the court.
=== c3day8_answer_hall ===
{ broadcast:
- "backed":
    By the doors, someone starts to clap. Then the whole hall.
    Your father's hand comes down on your shoulder, for the lenses that aren't watching any more.
    "Now they know you're mine." #speaker:father
    For the first time in your life, he sounds as if he trusts you. It's warm, and you hate how warm it is.
    "Captain. Begin." #speaker:father
    "Highness." #speaker:captain
    The captain's gone before the clapping stops. #leave:captain-8:40:90
    The court comes up to the foot of the dais to tell you how well you spoke. You don't hear a word of it.
- "defied":
    Nobody claps. Nobody moves. A courtier coughs, and looks horrified at himself.
    At the back, one of the guests, one of the heirs who can't go home, takes a step forward, and is pulled back by the sleeve.
    The court is moving away from the dais. Not quickly. Just away, the way you'd move away from a fire.
    Your father comes down beside you, close enough to touch. He doesn't raise his voice. He never has to.
    "Go to your rooms." #speaker:father
    "Captain. See that he gets there." #speaker:father
    "Highness." #speaker:captain
    The captain won't look at you. He looks at your coat, where the sheet is.
- else:
    The hall doesn't know whether to clap. A few of them do, and stop, and look at each other.
    Your father comes to stand beside you, and looks out over the hall with you, as if nothing has happened.
    "You think I enjoy it." #speaker:father
    "One day you'll carry what I carry. Then you'll understand the paper." #speaker:father
    He doesn't say what it is. His hand's on your arm, and it doesn't let go for a long moment.
    "Brought home. You'll have to find a way to keep that now, won't you?" #speaker:father
    "Captain. Begin. Slowly." #speaker:father
    "Highness." #speaker:captain
}
{ broadcast == "defied":
    He goes down the dais, and out. The court goes after him, not one of them looking back. #leave:father-8:40:40 #leave:hall-80:30:40 #leave:hall-81:30:40 #leave:hall-82:30:40 #leave:hall-83:30:40 #leave:hall-84:30:40 #leave:hall-85:30:40 #leave:hall-86:30:40 #leave:hall-87:30:40 #leave:guest-80:30:40 #leave:guest-81:30:40 #leave:guest-82:30:40
    The captain walks you to your rooms, one pace behind, all the way, without a word. #time:afternoon
- else:
    He goes down the dais, and out. The court goes after him, talking under its breath. #leave:father-8:40:40 #leave:captain-8:40:90 #leave:hall-80:30:40 #leave:hall-81:30:40 #leave:hall-82:30:40 #leave:hall-83:30:40 #leave:hall-84:30:40 #leave:hall-85:30:40 #leave:hall-86:30:40 #leave:hall-87:30:40 #leave:guest-80:30:40 #leave:guest-81:30:40 #leave:guest-82:30:40
    The lenses stay turned on where you stood. #time:afternoon
}
~ c3day8 = "city"
By the afternoon, the whole city's heard it. #cut:low-district:352:236:c3day8_city_low
-> END

// The afternoon: what it's done to the city (designer: the repercussions felt in the capital).
=== c3day8_city_low ===
{ broadcast:
- "backed":
    The low district. The watch at the end of the street, with a list. #show:watch-8a #show:watch-8b
    They read a name out. A door opens, and a man comes out with a bag he's already packed. #bark:low-8c:Take care of her.
    Somebody's scrubbing the wing off their own wall, hard, before anyone can see it there. #bark:low-8e:Quick. Quick.
- "defied":
    The low district. The watch at the end of the street, with a list. Nobody's come out for them. #show:watch-8a #show:watch-8b
    They stand there a long time. Then they fold the list up, and go. #bark:low-8a:Go on! Go home!
    Someone's chalking the wing on the wall under the screen, big, as big as they can reach. Nobody stops them. #bark:low-8e:For him.
- else:
    The low district. The watch at the end of the street, with a list nobody's sure of. #show:watch-8a #show:watch-8b
    A queue's formed in front of them, people asking after names. #bark:low-8b:Where's he going? When's he back?
    The watch don't know. They've only got the list. #bark:low-8c:The prince said!
}
Up the hill, the citadel's lights are coming on. #cut:promenade:410:232:c3day8_city_promenade
-> END

=== c3day8_city_promenade ===
{ broadcast:
- "backed":
    The promenade's half empty for an afternoon. The shops putting their shutters down early. #bark:prom-8a:Not today.
    Somebody's put a little screen in a shop window, showing your face reading it, over and over. #bark:prom-8b:He meant it.
- "defied":
    The promenade's fuller than it's been in weeks. Nobody's buying anything. #bark:prom-8a:Again! Play it again!
    Somebody's got it up in a shop window, your face, saying sorry, over and over, and people are standing three deep to watch it. #bark:prom-8e:He said sorry.
    At the edge of the square, the watch. Standing. Not moving in. #bark:prom-8c:Look at them. They don't know what to do.
- else:
    The promenade. People arguing in twos and threes about what you meant. #bark:prom-8a:He gave his word!
    Somebody else isn't so sure. #bark:prom-8d:His father's word's the one that counts.
}
The light's going. #goto:prince-quarters:120:226:c3day8_sister
-> END

// Back in your rooms: your sister waiting for you.
=== c3day8_sister ===
~ c3day8 = "home"
{ broadcast == "defied":
    The captain leaves you at your door. You hear him tell the guard on it that you're not to go out. #time:evening
- else:
    Your rooms. The light's going. #time:evening
}
Your sister on the end of your bed, the way she used to sit when you were small and she couldn't sleep.
{ broadcast:
- "backed":
    "I watched." #speaker:sister
    "You didn't even shake." #speaker:sister
    { sister == "told":
        "You told him about me, and now this. I suppose I should have known." #speaker:sister
    - else:
        "I kept thinking you'd stop. At the end. That you'd say something else." #speaker:sister
    }
    "Father's very pleased. He's having a dinner. You're to sit at his right." #speaker:sister
    She gets up, and goes, and doesn't look back. #leave:sister-8:40:50
- "defied":
    "You've done it now." #speaker:sister
    She's half laughing. She's been crying.
    "Father went straight to the sealed wing. He hasn't come out." #speaker:sister
    "Half the citadel's saying you've lost your mind. The other half's saying it very quietly, so it can change its mind later." #speaker:sister
    "I didn't know you had it in you." #speaker:sister
    { sister == "told":
        "I'm still angry with you. About telling him. I'm just less angry." #speaker:sister
    }
    She hugs you, hard, quickly, and goes before you can say anything. #leave:sister-8:40:50
- else:
    "What was that?" #speaker:sister
    "Brought home. Did he say you could say that?" #speaker:sister
    "No." #speaker:prince
    "Then you've made a promise only he can keep." #speaker:sister
    "Or I can." #speaker:prince
    She looks at you for a long time, as if she's seeing somebody she doesn't know yet.
    "Be careful." #speaker:sister
    She goes. #leave:sister-8:40:50
}
~ c3day8 = "evening"
Out on the balcony, against the last of the light, someone at the rail.
~ objective = "Go out to the balcony"
~ objective_target = "prince-quarters:hand-8b"
-> END

// Waiting for the broadcast (anyone you speak to on the way to your place).
=== c3day8_father_wait ===
"Your place." #speaker:father
-> END

// The city, watching.
=== c3day8_watching ===
{ c3day8 == "city":
    They don't want to talk to anybody from up there. Not today.
- else:
    They don't take their eyes off the screen.
}
-> END

// --- Evening, your balcony: your hand, and everything (designer: slower; he's proud of you, and has something to tell you) ---

=== c3day8_hand ===
{ c3day8 != "evening":
    -> END
}
~ c3day8 = "balcony"
~ objective = ""
~ objective_target = ""
Your hand, at the rail, where he waited for you with the blades the first morning. The city below, lighting up. The tree, far off.
{ broadcast == "backed":
    Boots, somewhere in the halls behind your rooms. A lot of them, going the other way.
    "They'll start with my office. It'll take them a while to understand what they're looking at." #speaker:diplomat
- else:
    He doesn't turn round. He's in no hurry at all.
}
"Do you remember the first morning? Out here. You were so angry I'd beaten you." #speaker:diplomat
"You fought dirty." #speaker:prince
"I fought like a soldier. I was one, once, before I learned to talk instead." #speaker:diplomat
He's quiet for a while. Below, a lift goes down the tower, a little bead of light.
"Whatever you said up there today, you said it out loud. In front of everyone. You chose." #speaker:diplomat
{ broadcast == "backed":
    "I didn't like what you chose. But you chose it, with your own mouth. He never does that. He has other people do it for him." #speaker:diplomat
}
"Most people never do that once, their whole lives." #speaker:diplomat
"I'm proud of you." #speaker:diplomat
Nobody's said that to you before. Not like that.
"There's something I have to tell you. I've been trying to find the way to start for a long time." #speaker:diplomat
"I wanted you to hear it from me. Not from a report on his desk." #speaker:diplomat
"Tell me what?" #speaker:prince
He looks down at the city for a long moment, as if he's going to change his mind.
"The wing. On the walls." #speaker:diplomat
"What about it?" #speaker:prince
"The first ones were mine." #speaker:diplomat
You don't say anything. You can't think of anything to say.
"My chalk. In the low district, at night, years ago. Then the painter's. Then everyone's." #speaker:diplomat
"You?" #speaker:prince
"Me." #speaker:diplomat
And all at once you're remembering the first morning below: how well he knew the way down. Every turn, in the dark.
"The people below. They knew your name." #speaker:prince
"They did." #speaker:diplomat
The stairs, the people greeting him. The square on the night of the riot, going quiet for him when he spoke.
"Who else?" #speaker:prince
"The commander. The engineer. The physician, who put your father to bed the night it caught." #speaker:diplomat
"My friend." #speaker:prince
"The stitch on his sleeve was his own idea. I told him it was foolish." #speaker:diplomat
"The reformer?" #speaker:prince
"No. Not him. He's a good man, and he believes every word he says." #speaker:diplomat
"He's what your father watches. So nobody watches me." #speaker:diplomat
"He doesn't know." #speaker:prince
"He mustn't. It's kinder." #speaker:diplomat
"And the night of the raid. You went up for air." #speaker:prince
"I did." #speaker:diplomat
"Did you know?" #speaker:prince
"I knew they'd come for that cellar one night. I didn't know it would be that one." #speaker:diplomat
"I said I was sorry. I meant it. I still do." #speaker:diplomat
{ helped_escape:
    "And last night. Your office. The door unlocked, and a lamp lit." #speaker:prince
    "As if you were expected." #speaker:diplomat
- else:
    "And last night. Your door, unlocked." #speaker:prince
    "Your friend found it on his own. I only left it open." #speaker:diplomat
}
"Every time you took me below." #speaker:prince
"I wanted you to see it. I chose what you saw." #speaker:diplomat
"I'm not sorry for that." #speaker:diplomat
Every one of them lines up, the whole long way back to the first morning on this balcony.
"Why tell me? Nobody knew. You could have gone on." #speaker:prince
"Because after today, you're not only his any more. Whatever you said." #speaker:diplomat
"And because it's coming. Whatever any of us does." #speaker:diplomat
"Revolution is inevitable." #speaker:diplomat
"Don't be on the wrong side of history." #speaker:diplomat
He turns round, at last, and holds out his hand.
"Join me." #speaker:diplomat
{ broadcast:
- "backed":
    The boots have turned. They're coming this way now. They're at your door.
    He smiles at you, as if you've answered, though you haven't.
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
