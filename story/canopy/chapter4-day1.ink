// ============================================================================
// Chapter 4, Day 1: out. DRAFT text from docs/sequences/chapter-4/plan.md, for the designer to rewrite.
// You're scared and shocked by everything (designer), and so is whoever's playing. Up to the evening the
// day is a set piece, guided (designer: you'd never be left alone at this point; people stop and stare):
//   - It opens cinematically (story/canopy/lore.ink): halfway up the tube (you flew), or crawling to the
//     light at the end of the rot (you fell, alone or with the girl).
//   - Up the tube, the master in the basin leads you out; out of the rot, the hunter at the foot of the tree
//     leads you to the cage, and across the top. Nobody explains anything.
//   - Grounded's welcome: a big event (designer): happy, shocked, tea and a seat, Mum. The truth waits for
//     tonight; he wants to tell it properly.
//   - Your seed; then the master shows you round: the sorting deck (your mum's bird in this morning's pile),
//     the workshop (the blessings: food, cloth, medicine, and the canopy's share), the hall (why the ascended
//     never came back to tell anyone: they chose not to, and Grounded made sure of it).
//   - Dusk at the lookout: he tells you everything (the telling), "why me" in the middle of it.
//   - Night: the child in the mess; bed in the hall.
// The day moves on through the stages in `c4day1` (main.ink).
// ============================================================================

// --- Up the tube: out of the light, into the basin (after the rise, story/canopy/lore.ink) ---

=== c4day1_tube ===
~ c4day1 = "tube"
~ c4_guide = "master"
The light lets go of you. #flash:white
You fall. Not far. Into something soft. #sound:hit #shake
Cloth, old cloth, piled up. And things digging into your back: a comb. A cup. A bowl.
The morning's offerings. You're lying in them.
Above you, the light you prayed to every morning of your life, pouring out of the end of the tube. Into nothing.
And past it, blue. Blue going up for ever. No bark. No roof. No end.
You can't breathe.
"Easy. Easy. Breathe out first. The breathing in looks after itself." #speaker:master
A woman kneeling over you. Grey hair. A carver's hands.
You know her face.
The Ascension. The whole tree singing her up the tube, and you in the crowd, watching her go.
"You went up. I watched you go up." #speaker:you
"I did. Same as you, just now. Same basin." #speaker:master
"Am I dead?" #speaker:you
"No, love. Nobody's dead." #speaker:master
Round the basin, people have stopped what they were doing. Ordinary people, in ordinary clothes, staring at you.
"What is this place?" #speaker:you
She looks at you for a long moment.
"Somebody's waiting for you. Somebody who'll tell it better than I can." #speaker:master
"Who?" #speaker:you
"You've been writing to him all week." #speaker:master
"...Grounded?" #speaker:you
She helps you up out of the basin. Your legs don't feel like yours.
"Stay close to me. Don't look down. Not yet." #speaker:master
~ c4day1 = "led"
~ objective = "Go with the master"
~ objective_target = "tube-mouth:master-lead"
-> END

// Along the tube mouth, at the far end (a trigger): across the bridges, and up.
=== c4day1_tube_walk ===
"This way. Across, then up. Hold the rope." #speaker:master
She takes you over a bridge of rope and plank with nothing under it but leaves. Past doors. Washing. Faces at windows, turning to watch you go by.
Up a stair wound round a limb as wide as your house. Up again. And again.
Every face you pass knows something you don't.
At the very top, a house older than all the others, its door open. #goto:groundeds-house:40:240:c4day1_grounded
-> END

// The master, leading you.
=== c4day1_master_guide ===
{"Stay close."|"Nearly there."|"I know. I know. Keep walking."} #speaker:master
-> END

// --- Out of the rot: the end of the crack (after the crawl, story/canopy/lore.ink) ---

=== c4day1_rot ===
~ c4day1 = "rot"
Light. Everywhere. You can't see. #flash:white
{ c4_girl == "follows": Behind you the girl drags herself out, swearing, and shoves past you into it. }
Grass under your hands. Real grass. Wind on your face, from nowhere.
And going up behind you, up and up until it's lost in green, a wall of bark. The tree. From the outside.
Nobody has ever seen the tree from the outside.
{ c4_girl != "follows": You lie in the grass, and you shake, and you can't stop. }
"Well. Fuck me." #speaker:hunter
A man, small and wiry, a mantle of grey fur over his shoulders, squatting on a root and watching you. A bow across his back that crackles faintly, like a fire.
"Years I've been coming down here, and nobody's ever crawled out of that." #speaker:hunter
"Where... where am I?" #speaker:you
"Outside, rot-rat. Breathe it in. It's free." #speaker:hunter
{ c4_girl == "follows": -> bicker }
"Did you see... was there anyone else? Down there?" #speaker:you
"Just you. Lucky you." #speaker:hunter
-> go

= bicker
"Who the hell are you?" #speaker:girl
"I was about to ask you that." #speaker:hunter
"Don't look at me. I'm not with them." #speaker:girl
"You came out of the same hole." #speaker:hunter
"Because they told the elders it was me." #speaker:girl
"They'd have thrown me down anyway." #speaker:you
"So you thought you'd bring company." #speaker:girl
"I didn't ask you to follow me." #speaker:you
"Follow you? I was down there a whole day before you—" #speaker:girl
"Shut up. Both of you. Shut the fuck up." #speaker:hunter
Silence. Somewhere, a bird you've never heard sings three notes.
"Gods. Five minutes." #speaker:hunter
-> go

= go
He gets up off the root.
"Grounded's been waiting for you. Didn't think you'd come out this end, mind." #speaker:hunter
"Grounded? You know Grounded?" #speaker:you
"Everyone knows Grounded. Unfortunately." #speaker:hunter
"Cage is round the side. Keep up. And don't touch anything: most of it's trying to kill you." #speaker:hunter
~ c4day1 = "cage"
~ c4_guide = "hunter"
~ objective = "Go with the hunter"
~ objective_target = "trees-edge:hunter-edge"
-> END

// The hunter, leading you.
=== c4day1_hunter_guide ===
{ c4day1:
- "cage": {"Cage. That way. You can walk, can't you?"|"Stop gawping at the grass. It's grass."} #speaker:hunter
- else: {"Up. Keep going."|"No, I'm not carrying you."|"If you're going to be sick, do it over the side."} #speaker:hunter
}
-> END

// The girl, with you (if you fell after framing her).
=== c4day1_girl_guide ===
{"Don't talk to me."|"I can walk on my own."|"..."} #speaker:girl
-> END

// At the cage (a trigger by the platform's foot): up the outside of the tree.
=== c4day1_cage ===
~ c4day1 = "platform"
An iron cage on a cable, hanging against the bark. He shoves you in{ c4_girl == "follows": , and her after you}, and yanks a rope.
The cage jerks, and the ground drops away. #shake
Up the bark. Past where the roots must be, inside. Past the offering floor, the market, the upper halls. The whole tree you ever knew, gone by in the time it takes to say it.
Then leaves. Then light. #goto:lowering-platform:600:230:c4day1_cage_top
-> END

=== c4day1_cage_top ===
A platform. A great drum wound with cable, and people turning it. They stop turning, and stare.
And crates, stacked up, nailed shut, going down the way you came.
"What's in those?" #speaker:you
"Your lot's work. Ask him." #speaker:hunter
~ objective = "Go with the hunter"
~ objective_target = "lowering-platform:hunter-top"
-> END

// The far end of the platform (a trigger): across, and up.
=== c4day1_platform_walk ===
"Up. All the way up." #speaker:hunter
He takes you over a bridge of rope and plank with nothing under it but leaves. Past doors. Washing. Faces at windows, turning to watch you go by.
Up a stair wound round a limb as wide as your house. Up again. And again.
Every face you pass knows something you don't.
At the very top, a house older than all the others, its door open. #goto:groundeds-house:40:240:c4day1_grounded
-> END

// --- Morning, Grounded's house: the welcome (designer: a big event) ---

=== c4day1_grounded ===
~ c4day1 = "house"
A room full of books. A man at a desk in the middle of it, his back to you, writing.
{ c4_guide:
- "master": "Grounded." #speaker:master
- "hunter": "Delivered. One carver. Slightly used." #speaker:hunter
}
The pen stops.
He turns round, slowly, the way you'd turn towards a sound you'd been waiting for so long you'd stopped believing in it. #face:grounded-1:0
Older than his plates. A scar through one eyebrow. And then his whole face breaks open.
"Clipped wing." #speaker:grounded
That's what the plates called you. Nobody else has ever called you that.
He laughs. A big, cracked laugh, like it's been stuck in him for years. He's across the room in three strides, and then he stops short, as if he's not sure he's allowed to touch you. #walk:grounded-1:66
"You came. You actually— look at you. You're here." #speaker:grounded
{ c4_left == "rot":
    "Out of the rot. Nobody comes out of the rot. And you crawled out of it." #speaker:grounded
- else:
    "Up the tube. Of course up the tube. I watched the light go up and I didn't dare hope." #speaker:grounded
}
He sees you're shaking. The laugh goes out of him, and something gentler comes into his face.
"Sit. Sit, before you fall down." #speaker:grounded
He sits you in the chair by the door, an old one, the arms worn pale. Then he's gone, and back, and there's a cup in your good hand. Hot. Sweet. Something in it like flowers.
"Drink. Slowly." #speaker:grounded
He crouches in front of you, so he isn't looking down at you. He looks at your bandaged hand for a long moment.
"I'd know that hand anywhere. I've been reading it for years." #speaker:grounded
{ c4_girl == "follows": -> girl }
-> mum

= girl
He looks up, past you, at the girl in the doorway.
"And you are?" #speaker:grounded
"Leaving." #speaker:girl
"She was in the rot with this one. They bicker." #speaker:hunter
"Then she's welcome too. Get her fed. Get her warm." #speaker:grounded
"Come on, then." #speaker:hunter
"Touch me and lose a hand." #speaker:girl
"Love, I've lost worse." #speaker:hunter
~ c4_girl = "mess"
They go, still arguing. #leave:girl-guide:0 #leave:hunter-guide:0
-> mum

// Your want (designer): Mum.
= mum
"My mum." #speaker:you
It comes out of you before anything else does.
"I left her at the door. They were coming. Is she all right?" #speaker:you
He doesn't answer quickly, and he doesn't look away.
"I don't know. I'm sorry. I can't see into the tree. Only what comes out of it." #speaker:grounded
"Then send me back." #speaker:you
"I will. Not today. But I'll find out how she is. I swear it." #speaker:grounded
-> ask

// Ask what you like, once each (designer: you could ask the same question again and again).
= ask
* ["What is this place?"]
    "What is this place?" #speaker:you
    "Home, of a sort. Ours. Yours, if you want it." #speaker:grounded
    "That's not an answer." #speaker:you
    "No. The answer's long, and it's hard, and I want to tell it properly, from the beginning. Tonight." #speaker:grounded
    -> ask
* ["Who are you?"]
    "Who are you?" #speaker:you
    "Grounded. Same as the plates." #speaker:grounded
    "I carved, once. Like you. And one day the whole tree sang, and I went up the tube with my last piece in my arms." #speaker:grounded
    "Like her." #speaker:you
    "Like her. A long time ago. I've been angry ever since." #speaker:grounded
    -> ask
* ["Why me?"]
    "Why me? Out of everyone in there. Why me?" #speaker:you
    He smiles, but it doesn't reach his eyes.
    "That one most of all. Tonight, I promise you." #speaker:grounded
    -> ask
* ["..."]
    You don't ask anything else. The cup's shaking in your hand.
    -> rest
* ->
    -> rest

= rest
He takes the cup from you before you drop it.
"You'll want to see it all for yourself before you believe a word I say. So see it." #speaker:grounded
"But not alone. Not today."
{ c4_guide == "master":
    "She'll take you round. Stay close to her." #speaker:grounded
    "I'll be outside." #speaker:master #leave:master-guide:0
- else:
    "There's someone who'll take you round." #speaker:grounded
    { c4_girl != "mess":
        "Right. Places to be. Things to shoot." #speaker:hunter #leave:hunter-guide:0
    }
    ~ c4_guide = "master"
    Someone's in the doorway. An older woman. Grey hair. A carver's hands. #beside:master-guide:-20:walk
    You know her face.
    The Ascension. The whole tree singing her up the tube, and you in the crowd, watching her go.
    "You went up. I watched you go up." #speaker:you
    "I did. And here I am." #speaker:master
}
"Tonight, at the lookout, I'll tell you everything. I swear it on every bird you ever sent me." #speaker:grounded
"First, though. Next door. There's something of yours I want to see." #speaker:grounded #goto:seed-bed:250:230:c4day1_seed
~ c4day1 = "seed"
-> END

// Grounded at his desk before he turns (talk to him).
=== c4day1_grounded_desk ===
He's writing. He doesn't look up.
-> END

// --- Late morning, the seed bed: the seed sets the treehouse town's sentiment (designer) ---

=== c4day1_seed ===
He crouches by a glass bell in the middle of the beds, as close to it as he can get. #beside:grounded-seed:24
"Your seed. The one you sent up." #speaker:grounded
{ seed == "roots":
    Under the glass, it's sprouted. But wrong: pale, and green at the tip, like the rot.
    He doesn't say anything for a long time.
    "The rot's in it." #speaker:grounded
    "Is that bad?" #speaker:you
    "What's in the seed is what's in the wood. It's the tree." #speaker:grounded
    "Everyone up here will know by tonight. They watch this bed the way you watched the tube. It'll be a quiet night."
- else:
    Under the glass, it's sprouted. Green, and glowing amber at the tip.
    He laughs, once, under his breath.
    "Look at that. Strong. Stronger than I'd dared to hope." #speaker:grounded
    "What does it mean?" #speaker:you
    "That the tree's still strong. That there's still time." #speaker:grounded
    "Everyone up here will know by tonight. They watch this bed the way you watched the tube. You'll hear them singing."
}
"Go with her. I'll see you at sundown." #speaker:grounded
~ c4day1 = "look"
She takes you down through the walkways, round and down, to a great house built round a limb. Inside, up, to the top floor. #time:afternoon #goto:great-house:430:204:c4day1_sorting
-> END

// --- Afternoon, the master shows you round (a set piece) ---

// The sorting deck: everything the tree sent up this morning; your mum's bird among it.
=== c4day1_sorting ===
Long tables, and on them everything the tree sent up this morning. #beside:master-tour:-18
A woman with a board at the end of them, counting. She takes a comb off the pile, turns it over, and drops it in a basket. A cup goes in a crate. A bowl in the basket.
"You're the carver. Thought you'd be taller." #speaker:quartermaster
"What are you doing with them?" #speaker:you
"Sorting. Baskets, we keep. Crates go down." #speaker:quartermaster
"Keep them? They're offerings. They're for the Tree." #speaker:you
Nobody answers that.
And then you see it, on the pile, waiting its turn. A bird.
The tail cut a little too long. The wing done in three strokes, the way she taught you, the way you can't any more.
Mum's.
She sent a bird up this morning. Of course she did. Whatever happened at the door last night, she got up, and she carved, and she sent it up.
Your hand's on it before you know you've moved.
"That's for the crates." #speaker:quartermaster
"It's my mum's." #speaker:you
The quartermaster looks at you. At the bird. At the master.
"...Keep it, then. One bird. I'll have counted wrong." #speaker:quartermaster
~ c4_mums_bird = true
You hold it against your chest. It's still warm from the tube.
"Come on, love. There's more." #speaker:master
She takes you down a floor, to the workshop. #goto:great-house:180:292:c4day1_workshop
-> END

// The workshop: the blessings (designer: food, clothing, medicine), and the canopy's share of them.
=== c4day1_workshop ===
Benches, and people at them, packing. #beside:master-tour:-18
Bread, wrapped in cloth. Little glass vials, stoppered. Shirts, folded small. Every bundle tied with the same cord you've watched come down the tube every evening of your life.
Blessings.
"You make the blessings." #speaker:you
"We pack them. What's in them comes up from below, on the cable." #speaker:master
You watch a man take a loaf out of a bundle and put it in a basket at his feet. Then a vial. Then he ties the bundle up again, smaller, and puts it with the others.
"He took some." #speaker:you
"We take some." #speaker:master
She says it the way you'd admit to something you'd stopped being ashamed of a long time ago, and then started again.
You pick up a bundle. It's so light.
The winter the baby next door had the cough, a vial like this came down for him. The whole street said the Tree had seen him.
"They're smaller than they used to be." #speaker:you
"They are. Every year." #speaker:master
"Why?" #speaker:you
"Tonight. Ask him tonight." #speaker:master
"Through here. There's people you'll know." #speaker:master #goto:ascended-hall:200:240:c4day1_hall
~ c4day1 = "workshop"
-> END

// The ascended's hall: everyone who ever went up the tube, alive; and why none of them ever came back.
=== c4day1_hall ===
~ c4day1 = "hall"
A long hall. In niches along the wall, carvings: a last piece in every one, the spiral cut into each. #beside:master-tour:-18
And people. Old people, mostly. Reading. Mending. Asleep in chairs with their mouths open.
You know that one. And that one.
And him, on the bench, shelling beans. You were small. Mum held you up on her shoulders so you could see him go up the tube.
"They're alive." #speaker:you
"Every one." #speaker:master
"Then why didn't anyone come back? Why didn't anyone tell us?" #speaker:you
She doesn't answer for a long time. When she does, she doesn't look at you.
"Because once we knew, we decided you were better off not knowing." #speaker:master
"All of us. Every one of us, the day we came up, sat where you're sitting today and heard what you'll hear tonight. And every one of us chose."
"A hard thing, for a greater good. Leave them their faith. It's kinder. That's what we told ourselves."
"Kinder." #speaker:you
"And he made sure none of us ever went back on it." #speaker:master
Down the hall, the old man you watched go up shells his beans, and hums, and doesn't look up.
"The whole tree sang you up. Mum cried. Happy tears." #speaker:you
"I know. I heard them." #speaker:master
The light through the roof has gone gold.
"Sundown. He'll be at the lookout." #speaker:master
~ c4_guide = ""
~ c4day1 = "lookout"
She walks you up, as far as the foot of the ladder, and no further. The rest you climb alone. #time:evening #goto:lookout:172:210:c4day1_lookout
-> END

// The old master on the bench, whom you watched go up as a child.
=== c4day1_old_master ===
"From the roots? I can hear it. You've the roots in your voice." #speaker:c4_ascended_2
"I watched you go up. I was on my mum's shoulders." #speaker:you
"Did you now. Was I any good? I don't remember it. It was a long time ago." #speaker:c4_ascended_2
He goes back to his beans.
-> END

// The master, showing you round (talk to her between places).
=== c4day1_master_tour ===
{"Stay close."|"Look all you like. Ask him tonight."} #speaker:master
-> END

// --- Dusk, the lookout: the telling ---

=== c4day1_lookout ===
{ c4day1 != "lookout": -> c4day1_grounded_lookout }
~ c4day1 = "lore"
He's at the rail, at the very top of everything. The sun's going down. #beside:grounded-lookout:30
"Come and stand here." #speaker:grounded
Leaves below you, all the way to the edge of the world. And on the edge of the world, lights.
"I said I'd tell it properly. From the beginning." #speaker:grounded
"There. See them?" #speaker:grounded #lore:c4lore:c4day1_after_lore
-> END

// Back on the lookout, after: dark now.
=== c4day1_after_lore ===
It's dark now. The lights on the horizon haven't moved.
You realise you're holding Mum's bird so tight the wing's cut into your palm.
{ not c4_mums_bird: You realise you're holding the rail so tight your hand's gone numb. }
+ ["I want to go home."]
    "I want to go home." #speaker:you
    "I know." #speaker:grounded
    "There's no home to go back to. Not the one you mean. There never was." #speaker:grounded
    "But there's the one we could make. That's all I'm asking you to think about. Not tonight."
+ ["Everything I ever did..."]
    "Everything I ever did. Every prayer. Every bird." #speaker:you
    "All for them." #speaker:you
    "Not every bird." #speaker:grounded
    "One of them found me."
+ [Say nothing.]
    You don't say anything. You can't. You just look at the lights.
    He lets you. He stands beside you a long time, saying nothing either.
-
"Come down. Eat something. Even if you can't." #speaker:grounded
~ c4day1 = "mess"
He takes you down, through the dark walkways, lanterns lit now, to the great house. The mess is full, and loud, and then it isn't. #time:night #goto:great-house:120:380:c4day1_mess
-> END

// Grounded at the lookout, any other time.
=== c4day1_grounded_lookout ===
"Sleep, if you can." #speaker:grounded
-> END

// --- Night, the mess: the child who bit your bird (designer: a child's hunger; it should carry weight) ---

=== c4day1_mess ===
Long tables, people eating. Every head turns. #beside:grounded-mess:20
Somebody puts a bowl in front of you. One bowl. Not much in it.
{ seed == "roots": Nobody's singing. They know about the seed. | Somebody near the back is singing. They know about the seed. }
"Eat." #speaker:grounded
At the end of the table, a child is staring at you over their bowl. When you look back, they look away, fast. Then back. Their face is going red.
A woman beside them puts a hand on their back, and gives them a little push.
"Go on. You said you would." #speaker:c4_folk_2
The child comes round the table. Stops in front of you. Can't look at you.
"You're the bird one." #speaker:child
"The red birds. With the heavy wing."
"I bit one. A long time ago. Not a long time. Days." #speaker:child
The ceremony. The bird dropping into the basin with a bite out of it. The marks of teeth. The whole tree backing away from you as if you'd brought the rot up out of the floor.
They said it was a curse. They said it was you.
"It was going down in a crate, and I was so hungry, and it was just there. I wanted to see if it was nice." #speaker:child
"I'm sorry. I'm sorry. I didn't know it went back to anyone." #speaker:child
"Kids chew things. Bowls have been short." #speaker:quartermaster
Short. Up here too. The same price, the same hunger, all the way up.
+ ["It's all right."]
    "It's all right." #speaker:you
    It isn't. It nearly killed you. But the child's crying, and it's not their fault, and you know exactly whose it is now.
    The child throws their arms round you, and holds on, and you let them.
+ ["Do you know what they did to me?"]
    "Do you know what they did to me? For that?" #speaker:you
    The child shakes their head. They're crying now.
    You look at their arms, thin as yours were. And you can't. You can't make it theirs.
    "...No. Course you don't. It's all right." #speaker:you
+ [Say nothing.]
    You don't say anything. You put your hand on their head, the bad one, the bandage, and leave it there a moment.
    The child cries, and the whole mess pretends not to see.
-
~ c4day1_owned = true
{ c4_girl == "mess": Across the table, the girl's watching you. She doesn't say anything. For once. }
"Sleep. Your bed's in the hall." #speaker:grounded
~ c4day1 = "bed"
{ c4_girl != "":
    ~ c4_girl = "bed"
}
~ objective = "Go to bed"
~ objective_target = "ascended-hall:bed"
-> END

// Grounded in the mess.
=== c4day1_grounded_mess ===
"Sleep, if you can." #speaker:grounded
-> END

// The others in the mess (optional, short).
=== c4day1_quartermaster ===
{ c4day1:
- "look": "Workshop's the floor below. Mind the steps, they're older than me." #speaker:quartermaster
- else: "One bowl. That's the rule. Even for you." #speaker:quartermaster
}
-> END

=== c4day1_child ===
"I really am sorry." #speaker:child
-> END

=== c4day1_doubter ===
"You're from the roots too? Then you'll know. It's good up here. It's so good up here." #speaker:doubter
"You'll see. Don't make trouble, and it's so good." #speaker:doubter
-> END

=== c4day1_keeper ===
"You've been inside! You've actually been inside! What's it like? Is it dark? Is it warm? Do they really all sing?" #speaker:keeper
"...Yes. They sing." #speaker:you
"I knew it. I knew it." #speaker:keeper
-> END

=== c4day1_messenger ===
He's eating standing up, his coat still on.
"Passing through." #speaker:messenger
-> END

=== c4day1_girl_mess ===
"They gave me soup. Real soup. Don't talk to me while I'm eating it." #speaker:girl
-> END

// --- Night, your bed in the ascended's hall ---

=== c4day1_bed ===
A bed. A cup. A pair of slippers, set side by side. Someone's made it up for you.
{ c4_mums_bird: You put Mum's bird on the shelf by the bed, where you can see it. }
{ c4_girl == "bed": -> girl }
You lie down. Somewhere down the hall, an old man is snoring. Somebody the Tree chose.
Mum. Is Mum all right?
You don't sleep for a long time.
-> sleep

= girl
In the next alcove, the girl, on her back, eyes open.
"He told me too. After you." #speaker:girl
"..." #speaker:you
"Do you believe him?" #speaker:girl
"I don't know." #speaker:you
"Me neither. That's the worst of it." #speaker:girl
She turns over, away from you.
"I'm still not talking to you." #speaker:girl
-> sleep

= sleep
~ c4day1 = "done"
~ objective = ""
~ objective_target = ""
Sleep comes in the end, all at once. #wake:ascended-hall:520:240 #endday:Day 2 (not built yet)
-> END
