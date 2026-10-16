// ============================================================================
// Chapter 3, Day 5: terrorists. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite.
// The morning after the riot. Your father hardens, in the open now: his address from the throne, filmed, and
// the city watching it on every screen, place by place (designer: cut round the city as he speaks); the word,
// and the face of the man who led it (pushback 3). The captain's warrants for meeting places, the hideout's
// cellar among them (pushback 4): seal them all, or strike the cellar off. Your sister has found the gap in
// the sealed wing's guard. Below with your hand (why is he the one bringing you? designer): they want to talk
// to you, after last night, and you see what it's cost them; your hand steps out for air (clue 5); the raid,
// brutal (designer: more tension, more risk), and the medium choice: step in, and a standoff that's hard to
// defuse, or out the back way, and watch. Stages in `c3day5` (main.ink).
// ============================================================================

// --- Dawn, your quarters: the captain with the day ---

=== c3day5_start ===
~ c3day5 = "wake"
A knock, before it's light. Not your hand's knock. #show:captain-5
The captain, in the doorway, in yesterday's armour. #beside:captain-5:40:walk
"Highness. Your father's orders for the day." #speaker:captain
"His address, this morning, from the throne. Every screen in the city. You're to stand beside him." #speaker:captain
"Then my warrants, at my post. They need your seal." #speaker:captain
He goes. Under your door, a folded note, in your hand's writing. #leave:captain-5:36:50
"Tonight. Below. They want to talk to you. After last night. — H." #quote
They. Who's they? And since when does your hand carry messages from below?
~ c3day5 = "address"
~ objective = "Stand beside your father"
~ objective_target = "audience-hall:mark-5"
-> END

// --- Morning, the audience hall: the address (pushback 3), filmed; the city watching, place by place ---

=== c3day5_address ===
{ c3day5 != "address":
    -> END
}
~ c3day5 = "speech"
~ objective = ""
~ objective_target = ""
{ riot_leader == "firebrand":
    ~ screens5 = "brother_"
- else:
    ~ screens5 = "reformer_"
}
{ riot == "let_go":
    ~ screens5 = screens5 + "wanted"
- else:
    ~ screens5 = screens5 + "executed"
}
You take your place, a step below the throne. Your father's already on it.
The hall's full, courtiers to the doors. And on the dais, the screens' eyes: lenses on thin stalks, a dozen of them, all turned on him. And on you.
"Stand straight. The whole city's looking at you." #speaker:father
A small light comes on over every lens.
He waits until the hall is silent. Then he speaks, quietly, as if to each of them alone.
"Last night, a few hundred people set fire to their own streets." #speaker:father #cut:low-district:352:236:c3day5_cut_low
-> END

// The low district: the street under its screen.
=== c3day5_cut_low ===
The low district. The whole street's stopped under the screen. The cook's let his pan burn.
"They were not hungry. They were not cold." #speaker:father
"They were led." #speaker:father #bark:low-5a:Not hungry?
"There is a word for people who burn a city to frighten it." #speaker:father
"Terrorists." #speaker:father #shake
On the screen, the word. And under it, a face.
{ riot_leader == "firebrand":
    Somebody knows it. #bark:low-5c:That's the painter's brother!
    Someone starts to say his name, and someone else puts a hand over her mouth. #cut:promenade:410:232:c3day5_cut_promenade
- else:
    Somebody knows it. #bark:low-5c:That's the one who came to talk!
    Someone starts to say more, and someone else puts a hand on his arm. #cut:promenade:410:232:c3day5_cut_promenade
}
-> END

// The promenade: the square under the great screen, the morning's shoppers.
=== c3day5_cut_promenade ===
The promenade. Under the great screen, the shoppers have put their bags down.
{ riot == "let_go":
    "The man who led them is still among you." #speaker:father
    WANTED, under the face. And a reward, with more noughts than anyone on the square has seen. #bark:prom-5a:Look at that.
    "Anyone who shelters him shelters terror. Anyone who helps him, is him." #speaker:father #bark:prom-5b:He was let go. I heard.
    Somebody asks it out loud. #bark:prom-5c:Who let him go?
    Nobody answers. A few of them look up the hill, at the citadel.
- else:
    "The man who led them was executed at dawn." #speaker:father
    EXECUTED, under the face. #bark:prom-5a:Good.
    Someone says it, then wishes they hadn't. #bark:prom-5b:That was quick.
    Nobody says anything else.
}
{ riot_table == "won":
    "The guard held. My son commanded them himself, through the night, street by street." #speaker:father
    They look at each other. #bark:prom-5c:The prince? Him?
- else:
    "The guard held. My son stood with them, through the night." #speaker:father
}
A woman picks up her bags and walks off fast, as if she's late for something. #cut:lifts:110:770:c3day5_cut_lifts
-> END

// The foot of the lifts: people on their way up to work, under the screen on the tower.
=== c3day5_cut_lifts ===
The foot of the lifts. The queue for the first car up has stopped shuffling.
"Some of you know these people. Some of you live beside them." #speaker:father
"You've seen the wing on your walls. You've heard what's said on your stairs." #speaker:father
"See something. Say something. You will be rewarded." #speaker:father
A man in the queue looks at the man beside him. The man beside him looks at the ground.
"You will be safe." #speaker:father #cut:hideout:300:226:c3day5_cut_hideout
-> END

// The hideout: a small screen behind the bar, the barkeep and the kid.
=== c3day5_cut_hideout ===
A cellar under the low district. A small screen up behind the bar, that nobody ever watches.
They're watching it now. The barkeep, a cloth in his hand. The kid, right under it.
~ screens5 = screens5 + "_hand"
On the screen, the word, and the face. Your father's voice goes on under it, calm.
"My son and I will keep you safe." #speaker:father
{ riot_leader == "firebrand":
    The kid hasn't taken his eyes off it. It's his brother's face.
- else:
    The kid hasn't taken his eyes off it, as if the face might change.
}
~ off5 = true
The barkeep reaches up, and turns it off. #goto:audience-hall:654:212:c3day5_address_end
-> END

// Back in the hall: his hand on your shoulder, put there on the last word, for the lenses.
=== c3day5_address_end ===
Your father's hand is on your shoulder. He put it there on the last word, for the lenses. The little lights over them go out.
By the doors, someone starts to clap. Then the whole hall.
Your father lifts his hand from your shoulder, and the clapping stops.
{ riot == "let_go":
    "That face is on every screen in the city now. Because of you." #speaker:father
    "Every day it's up there, they'll see what mercy costs. So will you." #speaker:father
- else:
    "There. It's said, and it's done. Nobody will ask about him again." #speaker:father
}
He goes down the dais, and out. The hall goes after him, talking. #leave:father-5:40:40 #leave:captain-5a:40:50 #leave:hall-50:30:40 #leave:hall-51:30:40 #leave:hall-52:30:40 #leave:hall-53:30:40 #leave:hall-54:30:40 #leave:hall-55:30:40 #leave:hall-56:30:40 #leave:hall-57:30:40 #leave:hall-58:30:40 #leave:hall-59:30:40
Your hand stays where he is, beside your seat.
"You looked the part." #speaker:diplomat
"Your note. Who are 'they'?" #speaker:prince
"The people you'll meet tonight." #speaker:diplomat
"And since when do the people below send messages to the prince through you?" #speaker:prince
"Since they started trusting me with them." #speaker:diplomat
"That's not an answer." #speaker:prince
"No. Tonight." #speaker:diplomat
He goes. #leave:hand-5a:40:50
~ c3day5 = "warrants"
The hall's empty but for the lenses, still turned on the throne. #time:afternoon
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
- They bow, and look past you at the lenses.
}
-> END

=== c3day5_hand_address ===
"Later, Highness. Not here." #speaker:diplomat
-> END

// The city, watching (anyone there, should you ever speak to them while it's on).
=== c3day5_watching ===
They don't take their eyes off the screen.
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
The last one's the hideout. The barkeep. The kid in the corner. Every table you listened in on. Tonight, you're meant to be there.
{ sleeve == "told":
    "And Highness. Your friend's been keeping late company. Below. We're keeping an eye, as you asked." #speaker:captain
}
"Seal them, and the guard goes into all four tonight. Whoever's inside is taken." #speaker:captain
"Strike one off, and your father will ask me why. And I'll have to tell him I don't know." #speaker:captain
Seal them all, or strike the cellar off?
+ [Seal them all. The cellar too.]
    ~ warrants = "sealed"
    ~ list5 = true
    ~ lean -= 1
    ~ standing += 1
    You press your seal on all four lines. Your hand's quite steady. You notice that.
    "Thank you, Highness. Tonight, then." #speaker:captain
+ [Strike the cellar off. Seal the rest.]
    ~ warrants = "struck"
    ~ lean += 1
    ~ standing -= 1
    You draw a line through the cellar, and seal the other three.
    The captain watches the line go through it. He doesn't ask why. He doesn't need to: your father will.
    "The day he named them terrorists, Highness. You've struck a nest of them off his list." #speaker:captain
    "I'll take it to him as it is." #speaker:captain
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
The cellar, struck through in your ink. And beside it, his seal. Pressed hard enough to tear the paper.
Under it, in his hand: We will talk about this. #quote
The guard goes into the cellar tonight anyway. And he knows you tried to stop it.
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
Your hand, the plain coat already over his arm. #time:night
"Coat. They're waiting." #speaker:diplomat
"Tell me first. Why you?" #speaker:prince
"Why me what?" #speaker:diplomat
"Why do they come to you? You're my father's hand. You sit on his council." #speaker:prince
"And they come to you with messages for his son. How do they even know your name?" #speaker:prince
He holds the coat out, and waits until you take it.
"Because I go down there and listen. Nobody else from up here does." #speaker:diplomat
"That's all?" #speaker:prince
"That's enough to be going on with. Come on." #speaker:diplomat
~ plain_coat = true
~ hand_with_you = true
~ c3day5 = "below"
~ objective = "Go down to the low district"
~ objective_target = "lifts:to-low-district"
He's through his door before you can ask anything else. #goto:lifts:64:130
-> END

// Coming into the low district (a trigger): the new word on the screens, and nobody out.
=== c3day5_low ===
~ low5 = true
The low district, and not a soul in the street. Every door shut. Every window dark.
Every screen says the same thing. TERRORISTS. The face.
{ riot == "let_go":
    WANTED. The man you let go, up there for anyone who wants the reward.
- else:
    EXECUTED. The man you brought in.
}
"Nobody's out." #speaker:prince
"Nobody's going to be out for a long time. Not now they know their neighbours are watching." #speaker:diplomat
"Hood up. The cellar." #speaker:diplomat
~ objective = "Go down to the cellar"
~ objective_target = "low-district:to-hideout"
-> END

// --- Night, the hideout: they want to talk to you (a trigger at the foot of the steps) ---

=== c3day5_hideout ===
~ c3day5 = "hideout"
~ hand_with_you = false
The cellar goes quiet as you come down the steps. Not the quiet of strangers. Every head turns.
They know who you are. All of them. They watched you on the screen this morning.
A man at the long table gets up, and goes out past you without a word, rather than stay in the same room.
Your hand comes down behind you, and leans on the wall by the steps, as if he's leaned there a hundred times.
On the wall by the long table, where the notices were, there are names now. Chalked. A lot of them.
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
- "Highness." Said flat, like it's a name for a dog. #speaker:them
- "My cousin's name's on that wall." #speaker:them
}
-> END

// The names on the wall: the ones who went to the square and didn't come home.
=== c3day5_names ===
Names, in chalk, in different hands. Some with a line under them. Some with a word beside: "square". "taken". "?".
Someone's started a new row since you came in.
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

// The barkeep: what they know you did, and what it's cost them.
=== c3day5_keeper ===
{ keeper5:
    "Talk to them, not me." #speaker:hideout_keeper
    -> END
}
~ keeper5 = true
He puts a cup in front of you you didn't ask for.
{ riot_table == "won":
    "They're saying you gave the guard every order yourself last night. Street by street." #speaker:hideout_keeper
    "Took the square before dawn." #speaker:hideout_keeper
- else:
    "They're saying you had the guard all night. And the square burned till morning, and then your father took it in an hour." #speaker:hideout_keeper
}
"Is that true?" #speaker:hideout_keeper
"Yes." #speaker:prince
He nods slowly, and looks at the wall. The names.
"Fourteen. Went to the square last night, and haven't come home. That's just the ones who drink here." #speaker:hideout_keeper
"My father poured in this cellar. Forty years. Tonight's the first night I've been afraid to open the door." #speaker:hideout_keeper
* ["I'm sorry."]
    "I'm sorry." #speaker:prince
    "I know you are. That's why they let you in." #speaker:hideout_keeper
* ["What do you want from me?"]
    "What do you want from me?" #speaker:prince
    "Me? Nothing. I want you to sit there and hear it." #speaker:hideout_keeper
- "They'll all want a word. Let them have it." #speaker:hideout_keeper
-> c3day5_heard

// A woman whose husband was on the square.
=== c3day5_angry ===
{ angry5:
    She's looking at the names on the wall.
    -> END
}
{ not keeper5:
    She looks at you, then at the barkeep. Him first.
    -> END
}
~ angry5 = true
A woman at the long table, her coat still on. She's been here since this morning, waiting for news.
"My husband went to the square last night. He went to see. That's all. To see." #speaker:them
"He bakes, for the street. There's been no bread on our street today. That's how everyone knows." #speaker:them
"Our girl keeps asking where he is. I've told her he's working." #speaker:them
"Your guard came through the square with pikes. Your orders, they're saying." #speaker:them
{ riot == "let_go":
    "And you let the one who led it walk. Good for you. Everyone's saying it, like it was a kindness." #speaker:them
- else:
    "And the one who led it's dead by dawn. On your say-so." #speaker:them
}
"My husband led nobody." #speaker:them
"Will you find him?" #speaker:them
* ["I'll find him. I promise."]
    ~ promised5 = true
    "I'll find him. I promise." #speaker:prince
    "Don't." #speaker:them
    "Don't promise. Everyone up there promises." #speaker:them
    But she writes something on the back of a scrap of paper, and pushes it across to you. His name. #quote
* ["I can't promise anything."]
    "I can't promise anything." #speaker:prince
    "No. At least you said so." #speaker:them
- "Why am I even telling you. You did this." #speaker:them
She doesn't wait for an answer.
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
The kid, in his corner by the steps, his knees up, as before. He's been waiting for you.
"I watched you this morning. Standing next to him while he said it." #speaker:painter
{ riot_leader == "firebrand":
    { riot == "brought_in":
        "They're saying my brother's dead. Executed, at dawn. They put his face up so everyone would know." #speaker:painter
        "Mum saw it in the street. She was carrying the washing. She just sat down where she was." #speaker:painter
        "Is it true?" #speaker:painter
        "That's what I was told." #speaker:prince
        "That's not what I asked." #speaker:painter
    - else:
        "You let my brother go. On the square. I saw." #speaker:painter
        "And this morning his face is on every screen in the city, and a reward big enough to buy our whole street." #speaker:painter
        "He can't go home. He can't come here. Our neighbour already pointed at him once for less." #speaker:painter
        "So thanks. I think." #speaker:painter
    }
- else:
    "They never brought my brother through the streets. Last night was meant to be for him." #speaker:painter
    "Nobody's seen him since. Mum goes up to the lifts every morning and asks. They don't even write it down." #speaker:painter
    "You said you'd find out." #speaker:painter
    "I'm trying." #speaker:prince
    "Try harder." #speaker:painter
}
He looks at you a long moment.
"Why do you even come down here?" #speaker:painter
* ["Because nobody up there will tell me the truth."]
    "Because nobody up there will tell me the truth." #speaker:prince
    "Nobody down here's going to make you feel better either." #speaker:painter
* ["I don't know any more."]
    "I don't know any more." #speaker:prince
    "That's the first true thing anyone from up there's ever said in here." #speaker:painter
- -> c3day5_heard

// Your hand steps out for air (clue 5). Then the raid (pushback 4): brutal.
=== c3day5_air ===
~ c3day5 = "raid"
Your hand pushes himself off the wall.
"Air. I'll be up by the door." #speaker:diplomat
He goes up the steps, unhurried. He doesn't look back. #leave:hand-5:30:40
The cellar starts talking again, low. The barkeep wipes the same cup. Somebody laughs, too loud, and stops.
A minute. Two.
Boots, in the street. A lot of them.
The barkeep's head comes up.
The door at the top of the steps comes off its hinges. #shake #sound:smash:boots
Lamps. Pikes. Your father's guard, down the steps four at a time, shouting. #show:raid-1 #walk:raid-1:100:110 #show:raid-2 #walk:raid-2:128:100 #show:raid-3 #walk:raid-3:172:100 #show:raid-4 #walk:raid-4:206:100 #shake
"On the floor! All of you, on the floor!" #speaker:c3_guard_0
Everyone's moving at once. Chairs go over. People shove past each other for the back way. #leave:folk-50:456:110 #leave:folk-51:456:120 #leave:folk-53:456:110 #leave:folk-54:456:100 #sound:crash
A table goes over. Then another. Someone at the long table is thrown against the wall, and goes down, and doesn't get up. #walk:raid-3:150:90 #sound:crash #shake
The barkeep comes round the bar, and a pike-butt takes him in the stomach. #walk:keeper-5:376:60 #walk:raid-4:356:110 #sound:punch
The woman's screaming her husband's name at them, as if they'd know him.
{ warrants == "sealed":
    The first one through has the warrant in his fist. Your seal's on it.
- else:
    The first one through has the warrant in his fist. Your line through it. Your father's seal beside it.
}
Behind you, someone's got the back way open. People are going through it, into the dark, as fast as they can.
And the kid, in the corner by the steps, right under their boots, is not going to make it.
One of the guard's got him by the collar.
~ objective = ""
~ objective_target = ""
Step in, or go out the back way? #dim:on
- (choose)
+ [Step in. Throw back your hood and stand in front of them.]
    Everyone in this cellar sees your face, and so does the guard. The captain will tell your father where you were tonight, and who with. And they might not stop for you.
    ++ [Yes. Step in.]
        -> c3day5_step_in
    ++ [No. Think again.]
        -> choose
+ [Get out. Go out the back way with the others.]
    Nobody ever knows you were here. But whoever doesn't get out is taken. The kid won't get out. You'll have to leave him.
    ++ [Yes. Get out.]
        -> c3day5_stay_out
    ++ [No. Think again.]
        -> choose

// --- Step in: a standoff (designer: hard to defuse). Each answer calms it, or makes it worse. ---

=== c3day5_step_in ===
~ raid = "stepped_in"
~ seen_below = true
~ lean += 1
~ standing -= 1
~ plain_coat = false
You step into the lamplight, between them and the kid, and throw back your hood. #dim:off
"Stand down!" #speaker:prince
Nobody stands down. The nearest one shoves you back with the shaft of his pike, hard. #shake
"Against the wall! I said against the wall!" #speaker:c3_guard_0
He hasn't looked at your face. None of them have. They're not looking at faces tonight.
* [Make him look: "Look at me. Look at who I am."]
    ~ calm5 += 1
    "Look at me. Look at who I am." #speaker:prince
    He looks. The pike comes down an inch.
    "...Highness?" #speaker:c3_guard_0
* [Draw your blade.]
    ~ calm5 -= 1
    Your blade hums into wine. #sound:shimmer
    Every pike in the cellar turns on you at once. Someone shouts. The man by the wall tries to get up, and one of them kicks him down again. #shake #sound:punch
    "Put it away! Put it away, now!" #speaker:c3_guard_0
    It takes him a long moment to see whose face is behind it.
    "...Highness?" #speaker:c3_guard_0
* [Shout to the room: "Everyone stay still! Nobody move!"]
    "Everyone stay still! Nobody move!" #speaker:prince
    Some of them do. The kid stops struggling.
    The guard looks round at you then, and stops.
    "...Highness?" #speaker:c3_guard_0
- He doesn't let go of the kid.
"The warrant's sealed, Highness. The captain's orders. I can't stand down for a face." #speaker:c3_guard_0
* {warrants == "sealed"} [Take it on yourself: "That's my seal. I'm taking it back."]
    ~ calm5 += 1
    "That's my seal on it. I sealed it. I'm taking it back." #speaker:prince
    He looks at the warrant in his fist. At the seal. At you.
* {warrants == "struck"} [Take it on yourself: "I struck this cellar off. You're here over my word."]
    ~ calm5 += 1
    "I struck this cellar off. You're here over my word." #speaker:prince
    He looks at the warrant in his fist. At the line through it. At you.
* [Grab the kid away from him.]
    ~ calm5 -= 1
    You get a hand on the kid's arm and pull. The guard pulls back. The kid cries out, and something in his shoulder gives. #shake #sound:punch
    "Let go of him, Highness! Let go!" #speaker:c3_guard_0
* ["Then take me instead."]
    "Then take me instead." #speaker:prince
    He stares at you. Nobody's ever said that to him. He doesn't know what to do with it.
- Boots on the steps. #show:captain-5r
The captain, in the doorway. He takes it all in: the tables, the man by the wall, you, without your hood, between his men and a boy.
"Highness." #speaker:captain
"I'll have to tell your father where I found you. And who you were standing in front of." #speaker:captain
* ["Tell him. And tell him I ordered you out. All of it's on me."]
    ~ calm5 += 1
    "Tell him. And tell him I ordered you out. Whatever comes of it, it's on me." #speaker:prince
    For a long moment, he says nothing.
* ["Get out. All of you. Before I have you flogged."]
    ~ calm5 -= 1
    "Get out. All of you. Before I have every one of you flogged." #speaker:prince
    Something closes in the captain's face.
    "With respect, Highness. You can't." #speaker:captain
- { calm5 >= 2:
    ~ standoff5 = "held"
    "Stand down." #speaker:captain
    The guard lets go of the kid. Slowly, one after another, the pikes come up.
    They go back up the steps. The last one walks backwards, watching you all the way. #leave:raid-1:30:40 #leave:raid-2:30:40 #leave:raid-3:30:40 #leave:raid-4:30:40
    "He'll hear it tonight, Highness. From me." #speaker:captain
    He goes. #leave:captain-5r:30:40
  - else:
    ~ standoff5 = "taken"
    "Stand down. Bring that one." #speaker:captain
    "No!" #speaker:prince
    "He's on the list by name, Highness. Not the cellar. Him. Your father wrote it himself." #speaker:captain
    They take the kid up the steps between two of them. He looks back at you once, all the way up. #leave:painter-5:30:30 #leave:raid-1:30:40 #leave:raid-2:30:40
    The rest go after him. #leave:raid-3:30:40 #leave:raid-4:30:40
    "He'll hear it tonight, Highness. From me." #speaker:captain
    He goes. #leave:captain-5r:30:40
  }
Nobody in the cellar says anything. Everyone who's left has seen your face now: the prince, without his hood, standing in their cellar.
The barkeep gets up off the floor, holding his stomach.
{ standoff5 == "held":
    "You stopped them." #speaker:hideout_keeper
    "Tonight. They'll be back with someone you can't order. Go, before they are." #speaker:hideout_keeper
- else:
    "You tried." #speaker:hideout_keeper
    He looks at the steps, where the kid went.
    "Go. Before they're back for the rest of us." #speaker:hideout_keeper
}
~ c3day5 = "out"
~ objective = "Get out"
~ objective_target = "hideout:to-low-district"
-> END

// --- Stay out: the back way, into the dark (the low district, beyond the cellar) ---

=== c3day5_stay_out ===
~ raid = "stayed_out"
~ lean -= 1
You keep your hood down, and turn your back on him. #dim:off
Behind you, the kid's shouting. You don't look round.
Through the back way, up a crawl of old steps, out. #goto:low-district:910:236:c3day5_backway
-> END

=== c3day5_backway ===
~ c3day5 = "hide"
Out into the rain. The others are gone already, every way at once.
Lanterns at the cellar door. One of the guard walking the street with his lamp up, looking in every doorway.
If he sees your face out here tonight, there's no explaining it.
~ objective = "Get to a dark doorway without being seen"
~ objective_target = "low-district:doorway-5"
-> END

// From a dark doorway, you watch them brought up (the painter among them).
=== c3day5_watch ===
You press yourself into the doorway, and watch.
They bring them up out of the cellar one at a time, and walk them off up the street, towards the lifts. #show:taken-1 #leave:taken-1:16:30
The woman whose husband was on the square. She's not screaming any more. #show:taken-2 #leave:taken-2:16:30
Then the kid, between two of the guard. He's limping. #show:painter-5t #show:escort-5a #show:escort-5b #leave:painter-5t:16:28 #leave:escort-5a:4:28 #leave:escort-5b:28:28
He isn't struggling now. He's looking at every doorway as he passes, as if he's looking for someone.
He looks right at yours.
He doesn't see you. You make sure of it.
Below, the sound of the barkeep's bottles going, one shelf at a time. Then nothing. #sound:smash:crash
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
"Up here. Air. They came past me, so many of them. I couldn't..." #speaker:diplomat
He doesn't finish.
"You brought me here. Tonight, of all nights." #speaker:prince
"I know." #speaker:diplomat
That's all he says.
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
    { standoff5 == "taken":
        You lie awake. The kid, looking back at you all the way up the steps. And by morning, your father will know where you were. #wake:prince-quarters:120:226 #endday:Days later.
    - else:
        You lie awake. Every face in that cellar has seen yours now. And by morning, your father will know where you were. #wake:prince-quarters:120:226 #endday:Days later.
    }
- else:
    You lie awake. The kid, looking right at your doorway. #wake:prince-quarters:120:226 #endday:Days later.
}
-> END
