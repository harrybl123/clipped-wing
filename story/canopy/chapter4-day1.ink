// ============================================================================
// Chapter 4, Day 1: out. DRAFT text from docs/sequences/chapter-4/plan.md, for the designer to rewrite.
// You're scared and shocked by everything (designer), and so is whoever's playing: nobody explains
// anything until Grounded does, and he doesn't do it all at once. The reveal comes in three layers:
//   1. Morning, in his house: only what's between you and him (why he chose you; why nobody could just
//      walk in and say it; that he knew what it would cost you, and did it anyway).
//   2. The afternoon is seen, not explained: the sorting deck, the blessings made by hand, the people you
//      watched go up the tube, alive. The child in the mess owns up to the bitten bird.
//   3. Dusk, at the lookout, with the capital's lights in front of you: the rest of what he has to tell
//      you, staged like the prologue (story/canopy/lore.ink, src/scenes/LoreScene.ts).
// Two ways in, the same shape after (designer): up the tube (the master finds you in the basin) or out of
// the rot (the hunter finds you at the foot of the tree, with the girl bickering if you fell after
// framing her). The day moves on through the stages in `c4day1` (main.ink).
// ============================================================================

// --- Dawn, up the tube: the basin at the tube mouth ---

=== c4day1_tube ===
~ c4day1 = "tube"
// (She's there from the first line, kneeling by the basin.)
~ c4_guide = "master"
White. Then blue. Then something too bright to look at. #flash:white
You're lying in something soft. Old cloth, piled up. And things digging into your back: a comb. A cup. A bowl.
The morning's offerings. You're lying in them.
Above you, the light you prayed to every morning of your life, pouring out of the end of the tube. Into nothing.
And past it, blue. Blue going up for ever. No bark. No roof. No end to it.
You can't breathe.
"Easy. Easy. Breathe out first. The breathing in looks after itself." #speaker:master #beside:master-guide:-14
A woman kneeling over you. Grey hair. A carver's hands.
You know her face.
The Ascension. The whole tree singing her up the tube, and you in the crowd, watching her go.
"You went up. I watched you go up." #speaker:you
"I did. Same as you, just now. Same basin." #speaker:master
"Am I dead?" #speaker:you
"No, love. Nobody's dead." #speaker:master
Round the basin, people have stopped what they were doing. Ordinary people, in ordinary clothes, staring at you.
"Where are the gods?" #speaker:you
She doesn't answer that.
"Can you stand? Somebody's waiting for you. He'll tell you better than I can." #speaker:master
"Who?" #speaker:you
"You've been writing to him all week." #speaker:master
"...Grounded?" #speaker:you
She helps you up out of the basin. Your legs don't feel like yours.
~ c4day1 = "led"
~ objective = "Go with the master to Grounded's house"
~ objective_target = "groundeds-house:grounded-1"
-> END

// The master, walking with you.
=== c4day1_master_guide ===
{ c4day1:
- "led": {"His house is at the top. It's a climb. Take it slowly."|"Don't look down yet. Look down tomorrow."|"I know. I know. Keep walking."} #speaker:master
- else: "Come on. Through here." #speaker:master
}
-> END

// --- Dawn, through the rot: out of the crack at the foot of the tree ---

=== c4day1_rot ===
~ c4day1 = "rot"
The light at the end of the crack gets bigger, and bigger, and then there isn't any more crack.
Just light. Everywhere. You can't see.
{ c4_girl == "follows": Behind you the girl drags herself out, swearing, and shoves past you into it. }
Grass under your hands. Real grass. Wind on your face, from nowhere.
And going up behind you, up and up until it's lost in green, a wall of bark. The tree. From the outside.
Nobody has ever seen the tree from the outside.
"Well. Fuck me." #speaker:hunter
A man, small and wiry, in a wolf's skin with the head for a hood. A bow across his back that crackles faintly, like a fire.
"Years I've been coming down here, and nobody's ever crawled out of that." #speaker:hunter
"Where... where am I?" #speaker:you
"Outside, rot-rat. Breathe it in. It's free." #speaker:hunter
{ c4_girl == "follows": -> c4day1_rot_bicker }
-> c4day1_rot_go

= c4day1_rot_bicker
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
-> c4day1_rot_go

= c4day1_rot_go
"Grounded's been waiting for you. Didn't think you'd come out this end, mind." #speaker:hunter
"Grounded? You know Grounded?" #speaker:you
"Everyone knows Grounded. Unfortunately." #speaker:hunter
"There's a cage round the side. Up we go. And don't touch anything. Most of it's trying to kill you." #speaker:hunter
~ c4day1 = "cage"
~ c4_guide = "hunter"
~ objective = "Go with the hunter"
~ objective_target = "trees-edge:to-lowering-platform"
-> END

// The hunter, walking with you.
=== c4day1_hunter_guide ===
{ c4day1:
- "cage": {"Cage. That way. You can walk, can't you?"|"Stop gawping at the grass. It's grass."} #speaker:hunter
- else: {"Up. Keep going up."|"No, I'm not carrying you."|"If you're going to be sick, do it over the side."} #speaker:hunter
}
-> END

// The girl, walking with you (if you fell after framing her).
=== c4day1_girl_guide ===
{"Don't talk to me."|"I can walk on my own."|"..."} #speaker:girl
-> END

// The cage, up the outside of the tree (a trigger at the top of the lowering platform).
=== c4day1_cage ===
~ c4day1 = "led"
The cage jerks, and the ground drops away.
Up the bark. Past where the roots must be, inside. Past the offering floor, the market, the upper halls. The whole tree you ever knew, gone by in the time it takes to say it.
Then leaves. Then light.
A platform. A great drum wound with cable, and people turning it. And crates, stacked up, nailed shut, going down the way you came.
"What's in those?" #speaker:you
"Your lot's work. Ask him." #speaker:hunter
~ objective = "Go with the hunter to Grounded's house"
~ objective_target = "groundeds-house:grounded-1"
-> END

// --- Morning, Grounded's house ---

=== c4day1_grounded ===
~ c4day1 = "house"
A room full of books. A man at a desk in the middle of it, his back to you, writing. He doesn't turn round.
"Sit down before you fall down." #speaker:grounded
{ c4_guide:
- "master": "He's here." #speaker:master
- "hunter": "Delivered. One carver. Slightly used." #speaker:hunter
}
{ c4_girl == "follows": "And one I didn't order." #speaker:hunter }
He turns round. #face:grounded-1:0
Older than his plates. A scar through one eyebrow. He looks at you as if he's known you for years.
"Clipped wing." #speaker:grounded
That's what the plates called you. Nobody else has ever called you that.
"You're Grounded." #speaker:you
"I am." #speaker:grounded
{ c4_girl == "follows": -> c4day1_grounded_girl }
-> c4day1_grounded_guides

= c4day1_grounded_girl
He looks past you, at the girl.
"And you are?" #speaker:grounded
"Leaving." #speaker:girl
"She was in the rot with this one. They bicker." #speaker:hunter
"Feed her. Then bring her back to me." #speaker:grounded
"Come on, then." #speaker:hunter
"Touch me and lose a hand." #speaker:girl
"Love, I've lost worse." #speaker:hunter
~ c4_girl = "mess"
~ c4_guide = ""
They go, still arguing. #leave:hunter-guide:10 #leave:girl-guide:10
-> c4day1_mum

= c4day1_grounded_guides
{ c4_guide:
- "master": "I'll be in the workshop." #speaker:master #leave:master-guide:10
- "hunter": "Right. Places to be. Things to shoot." #speaker:hunter #leave:hunter-guide:10
}
~ c4_guide = ""
-> c4day1_mum

// Your want (designer): the first thing out of your mouth.
= c4day1_mum
"My mum. Is she all right?" #speaker:you
He's quiet for a moment.
"I don't know. I'm sorry. I can't see into the tree. Only what comes out of it." #speaker:grounded
"Then send me back." #speaker:you
"Not yet." #speaker:grounded
-> c4day1_ask

= c4day1_ask
+ ["What is this place?"]
    "What is this place?" #speaker:you
    "Ask me tonight. By tonight you'll have seen enough to believe me." #speaker:grounded
    -> c4day1_ask
+ ["Where are the gods?"]
    "Where are the gods?" #speaker:you
    He looks at you a long moment, and doesn't answer.
    "Tonight." #speaker:grounded
    -> c4day1_ask
+ ["Why me?"]
    "Why me?" #speaker:you
    -> c4day1_why

// Why he chose you (designer): every piece of your work had the same deficiency.
= c4day1_why
"Every bird you ever sent up had the same heavy wing. The same slip, in the same place." #speaker:grounded
"Everyone else in that tree sends up something different every morning. They're told to. I couldn't tell one of them from the next."
"You, I could pick out of a pile of a thousand. I could write to you, and know it was you who wrote back." #speaker:grounded
"Because of my hand." #speaker:you
"Because of your hand." #speaker:grounded
-> c4day1_cost

// He knew what it would cost you, and did it anyway (designer).
= c4day1_cost
"The bird they sent back. The crowds. The hunger. They blamed me for all of it." #speaker:you
"I know." #speaker:grounded
"Did you know they would?" #speaker:you
"Yes. Before I sent the first plate, I knew what it would cost you. And I sent it anyway." #speaker:grounded
+ ["They nearly killed me."]
    "They nearly killed me." #speaker:you
    "I know. Be angry. You've every right to be." #speaker:grounded
+ ["Why?"]
    "Why?" #speaker:you
    "Because nobody else could do what you can. You'll understand that tonight, or you won't. Either way you can hate me." #speaker:grounded
+ [Say nothing.]
    You don't say anything. You don't trust what would come out.
    "Go on. Hate me a little. It helps." #speaker:grounded
-
-> c4day1_devout

// Why nobody could just go in and say it (designer): everyone is so devout.
= c4day1_devout
"Why didn't you just come in? Tell us yourself?" #speaker:you
"Walk into the tree and tell them their god's not what they think?" #speaker:grounded
{ c4_left == "rot":
    "You know what they'd do. You've been where they'd put me." #speaker:grounded
- else:
    "They'd have thrown me in the rot before I'd finished the sentence. Every one of them would have helped." #speaker:grounded
}
"Not because they're cruel. Because they believe. That's harder to break than any lock." #speaker:grounded
He gets up.
"Come on. There's something of yours I want to look at." #speaker:grounded #leave:grounded-1:600
~ c4day1 = "seed"
~ objective = "Follow Grounded"
~ objective_target = "seed-bed:grounded-seed"
-> END

// Grounded, in his house before you come in (talk to him and the trigger's knot plays).
=== c4day1_grounded_desk ===
{ c4day1 == "led": -> c4day1_grounded }
"Through there." #speaker:grounded
-> END

// --- Morning, the seed bed ---

// The seed sets the treehouse town's sentiment (designer).
=== c4day1_seed ===
{ c4day1 != "seed": -> c4day1_grounded_later }
He's crouched by a glass bell in the middle of the beds, as close to it as he can get.
"Your seed. The one you sent up." #speaker:grounded
{ seed == "roots":
    Under the glass, it's sprouted. But wrong: pale, and green at the tip, like the rot.
    He doesn't say anything for a long time.
    "The rot's in it." #speaker:grounded
    "Is that bad?" #speaker:you
    "What's in the seed is what's in the wood. It's the tree." #speaker:grounded
    "They'll all know by tonight. Up here they watch this bed the way you watched the tube. It'll be a quiet night."
- else:
    Under the glass, it's sprouted. Green, and glowing amber at the tip.
    He laughs, once, under his breath.
    "Look at that. Strong. Stronger than I'd dared to hope." #speaker:grounded
    "What does it mean?" #speaker:you
    "That the tree's still strong. That there's still time." #speaker:grounded
    "They'll all know by tonight. Up here they watch this bed the way you watched the tube. You'll hear them singing."
}
"Go and look round. The great house, down past the walkways. See how we live. Eat something." #speaker:grounded
"When will you tell me?" #speaker:you
"Tonight. Come up to the lookout when the sun's going." #speaker:grounded
"Why not now?" #speaker:you
"Because you wouldn't believe me now. Go and look first." #speaker:grounded #time:afternoon
~ c4day1 = "look"
~ objective = "Look round the great house"
~ objective_target = "great-house:quartermaster-sort"
-> END

// Grounded, any other time today.
=== c4day1_grounded_later ===
{ c4day1:
- "look": "Go and look. I'm not going anywhere." #speaker:grounded
- "hall": "Go and look. I'm not going anywhere." #speaker:grounded
- "mess": "Eat first. Then the lookout." #speaker:grounded
- else: "Tonight." #speaker:grounded
}
-> END

// --- Afternoon, the great house: seen, not explained ---

// The sorting deck: the quartermaster, with everything the tree sent up this morning.
=== c4day1_sorting ===
{ c4day1 != "look" || c4day1_sorted: -> c4day1_quartermaster }
~ c4day1_sorted = true
Long tables, and on them everything the tree sent up this morning. A woman at the end of them with a board, counting.
"You're the carver. Thought you'd be taller." #speaker:quartermaster
She takes a comb off the pile, turns it over, and drops it in a basket. A cup goes in a crate. A bowl, in the basket.
"What are you doing with them?" #speaker:you
"Sorting. Baskets, we keep. Crates go down." #speaker:quartermaster
"Keep them? They're offerings. They're for the Tree." #speaker:you
She looks at you over the board. Then she lifts the hem of her shirt, just a little, so you can see the stitching.
You know that stitching. There's a woman in the roots market who does it like that. She sent a shirt up last spring.
"Everything up here came up that tube, love. My shirt. The bowl you'll eat out of tonight." #speaker:quartermaster
"And the crates?" #speaker:you
"Down the chute. Where they go isn't my job. I only count them." #speaker:quartermaster
~ objective = "Find the master in the workshop"
~ objective_target = "great-house:master-bench"
-> END

=== c4day1_quartermaster ===
{ c4day1:
- "look": "Workshop's the floor below. Mind the steps, they're older than me." #speaker:quartermaster
- "hall": "Workshop's the floor below. Mind the steps, they're older than me." #speaker:quartermaster
- else: "One bowl. Bowl's by the stove." #speaker:quartermaster
}
-> END

// The blessing workshop: the master at her bench.
=== c4day1_workshop ===
{ c4day1 != "look": -> c4day1_master_guide }
{ not c4day1_sorted:
    "Sorting deck first. Up the top. Then come back to me." #speaker:master
    -> END
}
{ c4_left == "rot":
    An older woman at a bench, a knife in her hand, something half carved in front of her. She looks up.
    You know her face.
    The Ascension. The whole tree singing her up the tube, and you in the crowd, watching her go.
    "You went up. I watched you go up." #speaker:you
    "I did. And here I am, carving. Same as ever." #speaker:master
- else:
    She's at a bench, a knife in her hand, something half carved in front of her. She smiles.
    "You found your way down. Good." #speaker:master
}
Round her, shelves. Jars of light. Bundles. Little carvings. You know these shapes. You've waited for them at the evening ceremony every night of your life.
"Those are blessings." #speaker:you
"They are." #speaker:master
"You make them?" #speaker:you
"Some of them. Every blessing that ever came down that tube was made by somebody's hands, up here." #speaker:master
"Mum got one once, when I was small. She kept it on the shelf for years." #speaker:you
"Then I hope it was a good one." #speaker:master
You pick up a jar of light. It's smaller than the ones you remember. They all are.
"They're smaller than they used to be." #speaker:you
"They are. Every year." #speaker:master
She doesn't say why.
"Come through to the hall. There's people there you'll know." #speaker:master
~ c4day1 = "hall"
~ c4_guide = "master"
~ objective = "Go through to the ascended's hall"
~ objective_target = "ascended-hall:old-master"
-> END

// --- Afternoon, the ascended's hall ---

// A trigger, coming up into the hall.
=== c4day1_hall ===
A long hall. In niches along the wall, carvings: a last piece in every one, the spiral cut into each.
And people. Old people, mostly. Reading. Mending. Asleep in chairs with their mouths open.
You know that one. And that one.
And him, on the bench, shelling beans. You were small. Mum held you up on her shoulders so you could see him go up the tube.
"They're alive." #speaker:you
"Every one." #speaker:master
"Why doesn't anyone ever come back down? To tell us?" #speaker:you
"Would you have believed them?" #speaker:master
You don't answer. You know you wouldn't.
"Your bed's down the end, by the way. Same as all of us." #speaker:master
"Go and eat. The mess is under the workshop. I'll be at my bench." #speaker:master #leave:master-guide:10 #time:evening
~ c4_guide = ""
~ c4day1 = "mess"
~ objective = "Eat in the mess"
~ objective_target = "great-house:child-mess"
-> END

// The old master on the bench, whom you watched go up as a child.
=== c4day1_old_master ===
"From the roots? I can hear it. You've the roots in your voice." #speaker:c4_ascended_2
"I watched you go up. I was on my mum's shoulders." #speaker:you
"Did you now. Was I any good? I don't remember it. It was a long time ago." #speaker:c4_ascended_2
He goes back to his beans.
-> END

// --- Evening, the mess ---

// The child who bit your bird (designer: a child's hunger, something silly).
=== c4day1_child ===
{ c4day1_owned: -> c4day1_child_after }
~ c4day1_owned = true
A child at the end of the table, staring at you over their bowl. When you look back they look away, fast.
"You're the bird one." #speaker:child
"The bird one?" #speaker:you
"The red birds. With the heavy wing." #speaker:child
Their face goes red to the ears.
"I bit one. I'm sorry. It was going down in a crate and I was ever so hungry and I just wanted to see if it was nice." #speaker:child
The bitten bird. The ceremony. The whole tree backing away from you, and the teeth marks in the wood.
"Was it?" #speaker:you
"No." #speaker:child
{ seed == "roots":
    You don't know whether to laugh or cry. You do neither.
- else:
    You laugh. You don't mean to. It comes out of you like something breaking, and the child laughs too, uncertainly.
}
"Kids chew things. Bowls have been short." #speaker:quartermaster
~ objective = "Go up to the lookout"
~ objective_target = "lookout:grounded-lookout"
-> END

=== c4day1_child_after ===
"I really am sorry." #speaker:child
-> END

// The others in the mess (optional, short).
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

// The girl in the mess, if she's here.
=== c4day1_girl_mess ===
"They gave me soup. Real soup. Don't talk to me while I'm eating it." #speaker:girl
-> END

// Folk in the mess tonight: the town's mood by the seed (designer).
=== c4day1_folk_mess ===
{ seed == "roots":
    {"Did you see the bed? Pale as anything."|"The rot's in it. In the seed. What's that mean for us?"|"Eat up. Might be less tomorrow."} #speaker:them
- else:
    {"Did you see the bed? Glowing! Glowing!"|"There's time. That's what he said. There's time."|"Somebody fetch the fiddle!"} #speaker:them
}
-> END

// --- Dusk, the lookout ---

=== c4day1_lookout ===
{ c4day1 != "mess" && c4day1 != "dusk": -> c4day1_grounded_later }
{ not c4day1_owned:
    "Eat first. Then come back." #speaker:grounded
    -> END
}
~ c4day1 = "lore"
He's at the rail, at the very top of everything. The sun's going down.
"Come and stand here." #speaker:grounded
Leaves below you, all the way to the edge of the world. And on the edge of the world, lights.
"There. See them?" #speaker:grounded #lore:c4lore:c4day1_after_lore
-> END

// Back on the lookout, after.
=== c4day1_after_lore ===
It's dark now. The lights on the horizon haven't moved.
+ ["What do you want from me?"]
    "What do you want from me?" #speaker:you
    "Nothing you don't want to give. Not tonight. Tonight, sleep." #speaker:grounded
+ ["I want to go home."]
    "I want to go home." #speaker:you
    "I know. I'll get you there. Not the way you came." #speaker:grounded
+ [Say nothing.]
    You don't say anything. You can't. You just look at the lights.
    He lets you.
-
"Your bed's in the hall. Sleep, if you can." #speaker:grounded #time:night
~ c4day1 = "bed"
{ c4_girl != "":
    ~ c4_girl = "bed"
}
~ objective = "Go to bed"
~ objective_target = "ascended-hall:bed"
-> END

// Grounded at the lookout, any other time.
=== c4day1_grounded_lookout ===
{ c4day1:
- "mess": -> c4day1_lookout
- "dusk": -> c4day1_lookout
- else: "Sleep, if you can." #speaker:grounded
}
-> END

// --- Night, your bed in the ascended's hall ---

=== c4day1_bed ===
A bed. A cup. A pair of slippers, set side by side. Someone's made it up for you.
{ c4_girl == "bed": -> c4day1_bed_girl }
You lie down. Somewhere down the hall, an old man is snoring. Somebody who was chosen by the Tree.
Mum. Is Mum all right?
You don't sleep for a long time.
-> c4day1_sleep

= c4day1_bed_girl
In the next alcove, the girl, on her back, eyes open.
"He showed me too. After you." #speaker:girl
"..." #speaker:you
"Do you believe him?" #speaker:girl
"I don't know." #speaker:you
"Me neither. That's the worst of it." #speaker:girl
She turns over, away from you.
"I'm still not talking to you." #speaker:girl
-> c4day1_sleep

= c4day1_sleep
~ c4day1 = "done"
~ objective = ""
~ objective_target = ""
Sleep comes in the end, all at once. #wake:ascended-hall:520:240 #endday:Day 2 (not built yet)
-> END
