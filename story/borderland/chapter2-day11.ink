// ============================================================================
// Chapter 2, Day 11: the fall. Draft text from docs/sequences/chapter-2/part-5.md, for the designer to rewrite
// (designer: the brand at the tally house in front of everyone; someone lets you out, depending on who you've
// helped, or the son; your brother manipulated (compound) or a hostage (home); everyone understands why by
// the end; each ending its own fight with different people beside you; an escape towards the woods, uneasy).
// After the first playtest (designer): no drains, no digging dog: someone breaks in, or you steal the key; the
// choice says what the rubbing can do and who; the scout leads you to their real camp; the boss and your
// brother at the heart of every ending; a reason they let you go; the farewell with your brother matters.
// The stages are in `c2day11` (main.ink): brand, cellar, out, hollow, choice, girl, truce, war, edge, done.
// ============================================================================

// --- First light, the tally house: the brand ---

=== c2day11_brand ===
~ c2day11 = "brand"
~ brand_morning11 = true
~ brand_night = false
~ objective = ""
~ objective_target = ""
They bring you up out of the cellar into the grey light. The tally house is fuller than it was last night. People have come in from the fields to see.
The tallyman has the iron in the stove. He won't look at you.
{ brother_moved:
    Your brother's at the boss's side, in his strap, with his chin up the way the boss holds his.
    "She sold us. She sold all of us. The boss said, and the boss knows." #speaker:brother
    They're not his words. You can hear the boss in every one of them.
- else:
    Your brother isn't here. The boss sees you looking for him, and leans in close, kind as ever.
    "He's being seen to. He'll stay seen to, for as long as you stay quiet." #speaker:boss
    So that's what your brother is now. Something to keep you quiet with.
}
{ friend_choice == "reported":
    Your friend's at the front. She doesn't shout this time. She just watches.
- else:
    Your friend's at the back, by the door. She can't look at you, and she can't look away.
}
The old scavenger's there too, at the very back, leaning on his hook.
"For selling us to them, the mark. So everybody knows you, wherever you go." #speaker:boss
They hold your arm on the counter. #dim:on
The iron. #shake #sound:hit
You don't remember the next bit. #dim:off
When you can see again there's a mark on the inside of your wrist, raw and shining: the rat. Like the chalk on your door.
"At dusk she's walked out past the tree's edge. Like the last one." #speaker:boss
They take you back down. #goto:tally-cellar:120:200:c2day11_cellar
-> END

// --- The cellar: someone lets you out (designer: whoever you've helped; someone breaking in, or a stolen key) ---

=== c2day11_cellar ===
~ c2day11 = "cellar"
~ brand_morning11 = false
~ in_cellar11 = true
The cellar. Dirt walls, a ladder up to the hatch, and the hatch locked from above. A guard sits on it. You can hear him scratch, and yawn, and shift.
The son's down here too, against the far wall, his hands tied. They haven't branded him. Not yet.
"He'll do it to me as well, you know. His own son. He'll find a way to make it kind." #speaker:boss_son
The hours go. The light through the hatch's cracks moves across the floor. #time:afternoon
{ watcher_ally:
    -> c2day11_out_watcher
}
{ friend_choice == "covered":
    -> c2day11_out_friend
}
// (Not if you walked away from him at the den: he sold you.)
{ gambler_choice == "fought" || gambler_choice == "paid" || (gambler_trust >= 1 && gambler_choice != "left"):
    -> c2day11_out_gambler
}
-> c2day11_out_son

// He respects you: he walks you out, in front of everybody.
=== c2day11_out_watcher ===
Voices over the hatch. The guard's, surprised. Then a quieter one, and the bolt goes back. #sound:latch
~ watcher_cellar11 = true
The watcher comes down the ladder with a length of rope.
"You brought me the truth about the board, when nobody else would. You were right about him. I'd like to have been, sooner." #speaker:watcher
"Hold your hands out. Like you mean it." #speaker:watcher
He ties them. Loose. A child could slip it.
"The boss wants her at the compound before dusk. Wants a word first. That's what I've told the man on the hatch, and that's what I'll tell anybody else." #speaker:watcher
"And the boss?" #speaker:scavenger
"Is upstairs at the counter. So we don't go past the counter." #speaker:watcher
He cuts the son's hands free.
"You've never seen me." #speaker:watcher
~ walkout11 = true
-> c2day11_up

// You covered for her at the line: she breaks in.
=== c2day11_out_friend ===
Shouting overhead. Feet running. Then a smell, coming down through the cracks round the hatch. #sound:boots
Smoke.
"Fire! The sacks! The sacks are going up!" #sound:roar
~ smoke11 = true
The guard's gone off the hatch. Something heavy hits the lock, once, twice, and the hatch flies up, and the cellar fills with grey. #shake #sound:smash
~ friend_cellar11 = true
Your friend comes down the ladder in the smoke, with a lump hammer and a wet rag over her face.
"At the line, you told the watcher I was keeping you company. You could've had me in a cellar. I'm not leaving you in one." #speaker:scav_friend
"You set the tally house on fire?" #speaker:scavenger
"Only the sacks. Mostly. Come on, before they put it out." #speaker:scav_friend
-> c2day11_up

// You helped him at the den: he dices the guard for the key.
=== c2day11_out_gambler ===
Somebody sits down on the hatch beside the guard. A voice you know, cheerful, wheedling.
"Long day for you. Long dull day. Fancy a throw? Just to pass it." #speaker:gambler
The rattle of dice on the hatch, right over your head. #sound:hit
He loses. And loses. You hear him groan, and the guard laugh, and the stakes go up.
"Tell you what. Everything I've lost today, against that key on your belt." #speaker:gambler
A long quiet. The dice. #sound:hit
And the guard swearing, and the gambler laughing, and the key turning in the lock. #sound:latch
~ gambler_cellar11 = true
The gambler's face, upside down in the hatch.
"Never bet against a man who's got nothing left. He's gone to cry about it. Up you come." #speaker:gambler
"Why?" #speaker:scavenger
{ gambler_choice == "paid":
    "You paid my debt at the den with your whole week's haul. Nobody's ever done that. Nobody." #speaker:gambler
- else:
    { gambler_choice == "fought":
        "The house's men had me against the wall, and you stepped in. Nobody steps in for me." #speaker:gambler
    - else:
        "You gave me a find at the den, when I'd nothing. I don't forget the ones who give me something." #speaker:gambler
    }
}
-> c2day11_up

// Nobody comes: you and the son steal the guard's key.
=== c2day11_out_son ===
Nobody comes. The light goes yellow, and then it starts to go orange.
"Nobody's coming, are they." #speaker:boss_son
"No." #speaker:scavenger
"Everybody's too frightened of my father to come. So it's me. You're the only one who never lied to me about him." #speaker:boss_son
"Untie me. He comes down with water before dusk. He's done it every day I've been down here. And he's frightened of me, because of who I am." #speaker:boss_son
You get his knots open with your teeth, and he sits back against the wall with his hands behind him as if they're still tied.
The bolt. The hatch. The guard on the ladder with a bucket, and the key on his belt, swinging. #sound:latch
~ guard_down11 = true
"Water." #speaker:collector #name:The guard
"My father will hear how you treated me." #speaker:boss_son
The guard looks at him, and doesn't see you come round the ladder behind him.
+ [Take the key]
    You lift it off his belt while he's still looking at the son. He doesn't even feel it.
    Then he does, and turns, and the son puts the bucket over his head. #sound:hit
+ [Hit him]
    You hit him the way the old scavenger taught you, once, behind the ear, and catch him on the way down. #sound:hit
    The key's on his belt.
- You leave him in the dirt with the bucket, and go up the ladder, and lock the hatch on him from above. #leave:guard-cellar11:240:40
~ son_key11 = true
-> c2day11_up

=== c2day11_up ===
~ let_out11 = true
~ in_cellar11 = false
~ c2day11 = "out"
"Get your dog. I'll find you, after." #speaker:boss_son
{ walkout11:
    Up the ladder, with the watcher's hand on your arm, as if he's holding you. #goto:tally-house:300:236:c2day11_walkout
- else:
    { smoke11:
        Up the ladder, into the smoke. #goto:tally-house:300:236:c2day11_out_smoke
    - else:
        Up the ladder, into the afternoon. #goto:tally-house:300:236:c2day11_out_quiet
    }
}
-> END

// The watcher walks you out through the tally house, past the enforcer.
=== c2day11_walkout ===
The tally house is half full, people queuing with their finds as if nothing's happened. They look at you, and at the rope, and at the watcher, and look away.
At the door, the enforcer, his jaw strapped up in a rag. He sees you, and steps into the doorway. #beside:enforcer-door11:-30:walk
"Wheh's she going." #speaker:enforcer
"Compound. The boss wants a word." #speaker:watcher
The enforcer looks at you a long time. At the rope. At the watcher.
"He's ah the counteh." #speaker:enforcer
"Then he'll be at the compound after, won't he." #speaker:watcher
The watcher doesn't move, and doesn't look away, and doesn't blink. After a long time, the enforcer does. He steps aside. #leave:enforcer-door11:200:40
Outside, round the corner of the yard, the watcher pulls the rope off your wrists.
"Go. You've until dusk before anyone asks me where you are." #speaker:watcher
-> c2day11_find_dog

=== c2day11_out_smoke ===
The tally house is full of smoke and people beating at the sacks with anything they've got. Nobody's looking at the hatch.
Your friend pulls the rag over your face, and you walk out through the middle of all of it, coughing like everyone else.
"Go. I'll be there at the edge, if I can." #speaker:scav_friend
-> c2day11_find_dog

=== c2day11_out_quiet ===
The tally house in the afternoon heat, half empty, the tallyman asleep over his counter. Nobody looks at the hatch. Nobody's expecting anybody to come up out of it.
You walk out of the door like you've got business in the yard, and nobody stops you.
-> c2day11_find_dog

=== c2day11_find_dog ===
~ c2day11 = "hollow"
~ objective = "Find " + dog_name
~ objective_target = "dogs-hollow:dog"
{dog_name} will be where it always goes. And it'll have the hide.
-> END

// --- The hollow: Peggy, the rubbing, and what it can do (designer: make the power and the choice clear) ---

=== c2day11_hollow ===
~ c2day11 = "choice"
~ dog_with_you = true
~ objective = ""
~ objective_target = ""
{dog_name} comes out of the hollow like it's been waiting all day, which it has. #beside:dog-follow:14:walk
It drops the roll of hide at your feet, wet, and pushes its nose into your branded wrist, very gently.
"Whine..." #speaker:dog
You unroll it. Every square. Every name. And in the corner, his mark.
And you understand what you're holding.
It's the only proof there is. Nobody else has seen it. Whoever you put it in front of, it changes everything for them.
The yard would tear him apart for it. Everyone who lost a sack, everyone who got hurt at the wells.
{ watcher_ally:
    The watcher could use it to make a peace, a real one, in front of both clans, if the other side would come. 
- else:
    It could make a peace, if somebody on your side with any say would stand up with you. Nobody will.
}
{ scout_friend:
    And the scout knows where they keep his daughter. Free her, and he's got no reason left to sell anyone.
- else:
    And somewhere over the line, there's the reason he did it. You'd need somebody over there to take you to it. You've nobody.
}
You've until dusk, when they find you gone. One thing. You can do one thing with it.
-> c2day11_choice

// Big choice 3 (design doc). Each says who and what; the ones you can't take say why (designer: unclear until
// the second box). Each explains itself in a second box.
=== c2day11_choice ===
What do you do with the rubbing? #dim:on
- (choose)
+ { scout_friend } [Free the boss's daughter, with the scout]
    The scout takes you to where they keep her. You get her out. With his daughter free, the boss has nothing left to sell anyone for.
    But both clans will hate you for it: his, for what he did; theirs, for what you took from them.
    ++ [Yes. Get her out.]
        ~ last_act = "girl"
        -> c2day11_girl
    ++ [No. Think again.]
        -> choose
+ { not scout_friend } [Free the boss's daughter (you'd need someone over the line)]
    You don't know where they keep her, and nobody over there would take you. You turned the scout in. #dim:off
    -> c2day11_choice
+ { watcher_ally && rival_trust >= 1 } [Take it to the watcher and both clans: a truce]
    The watcher reads it out in the tally house in front of both clans, and you make a peace that holds.
    But a truce needs something both sides can trust. That'll be {dog_name}. Everyone will see it, and from then on, everyone will want it.
    ++ [Yes. End it.]
        ~ last_act = "truce"
        -> c2day11_truce
    ++ [No. Think again.]
        -> choose
+ { not (watcher_ally && rival_trust >= 1) } [Take it to the watcher and both clans (you'd need them both)]
    { not watcher_ally:
        The watcher's never trusted you enough to stand up beside you. Without him, it's a branded girl's word against the boss's. #dim:off
    - else:
        The other side has no reason to come to the table for you. You've never done them a kindness. #dim:off
    }
    -> c2day11_choice
+ [Throw it to the yard: let them tear the boss down]
    Stand up in the yard at dusk and throw it to everyone who's come to watch you go. They'll turn on him, and the clans will go to war over it.
    In all that, nobody will be looking for you. You'll get away. A lot of people won't.
    ++ [Yes. Let them have the boss.]
        ~ last_act = "war"
        -> c2day11_war
    ++ [No. Think again.]
        -> choose

// --- Free the boss's daughter: the scout takes you to their camp on the deep ground ---

=== c2day11_girl ===
~ c2day11 = "girl"
~ girl11 = true
~ objective = "To the line: the scout's watch is at the dip"
~ objective_target = "rival-line:scout-girl11"
"Then I need the scout." #speaker:scavenger #dim:off
The scout said you'd find them at the dip at dusk, any night, if you ever came looking. #time:evening
-> END

=== c2day11_girl_dip ===
~ girl_dip11 = true
The scout's at the dip, crouched, waiting.
"You came." #speaker:scout
"I want her out. His daughter." #speaker:scavenger
They look at you a long time. At the brand on your wrist.
"Our boss'll have my hide for this." #speaker:scout
"Then come with me, after. There's room in the woods." #speaker:scavenger
"...Not over the line. They'd see us before we were halfway. There's a way round, under the old ground and out across the deep. They keep her at the camp out there, where nobody from your side ever goes." #speaker:scout
"Stay behind me. Do what I do." #speaker:scout
The long way round, in the last of the light. #goto:deep-ground:60:232:c2day11_girl_deep
-> END

=== c2day11_girl_deep ===
~ scout_leading11 = true
~ objective = "Follow the scout"
~ objective_target = "deep-ground:scout-lead11"
The deep ground at dusk, flat and grooved and empty, going on forever. Far out on it, a fire.
"There. Keep low." #speaker:scout
-> END

=== c2day11_girl_hut ===
~ girl_hut11 = true
~ scout_leading11 = false
~ objective = ""
~ objective_target = ""
Their camp: a fire, a ring of packs, and a hut of pale cloth on poles, with a lamp inside.
Two guards by the hut's door, and a third coming round from the back with a staff. They see the scout first, and frown; and then they see you, and the dog, and they're up. #shake
"You brought one of them here?" #speaker:drop_guard
"Grrr." #speaker:dog #bark:dog-follow:GRRR:growl
The scout steps up beside you, and doesn't answer. #combat:camp_guards:c2day11_girl_after
-> END

=== c2day11_girl_after ===
The guards are down in the dirt by their own fire.
~ daughter11 = true
The hut's flap opens. A woman, older than you, with pale hair in a plait, a thread tied at the end of it. She's been listening.
"You're from his side." #speaker:daughter
"Your father's." #speaker:scavenger
"Is he alive?" #speaker:daughter
"Yes." #speaker:scavenger
"Every month they cut a piece of my hair and take it to the cairn, and I know he's still paying." #speaker:daughter
"He's still paying. That's why I'm here." #speaker:scavenger
-> c2day11_girl_father

// The boss comes after you (he knows the way: he's been coming over for years), with your brother.
=== c2day11_girl_father ===
~ father11 = true
Torches, coming across the deep ground from the way you came. Lots of them.
The boss, at the front, with his circle behind him. He's crossed this ground a hundred times. He knew where you'd go.
{ brother_moved:
    And your brother, at his side, with a torch of his own.
    "Give it back! It's the boss's! Give it back!" #speaker:brother
- else:
    And your brother, between two of the circle, with his arm twisted up his back and his face white. His leg's strapped, and he can hardly stand.
    "Give me the hide. Or I stop being kind about your brother." #speaker:boss
}
You don't say anything. You step aside, so the torchlight falls on who's standing behind you.
He sees her. #dim:on
~ boss_why = true
The torch goes out of his hand. He goes down on his knees on the hard ground, all that weight, as if somebody's cut his strings.
He says her name. Quietly, as if he hasn't said it out loud in years.
She walks to him. She stops a step away. She's taller than he remembers. You can see him see it.
"They said a boss's own child, or no truce. The old ones stood behind me and said it was her, or every child in the settlement starving in a war." #speaker:boss
"I carried her to their cairn myself. I was the one who let go of her hand." #speaker:boss
"And every square I've sold since, every raid, every one of you they hurt, I sold for a lock of her hair. So I'd know she was still breathing." #speaker:boss
He looks at you, over her shoulder.
"And when they wanted more than I could give, I put it on you. Because you came out of nowhere, and nobody would miss you." #speaker:boss #dim:off
His circle are looking at him. All of them. They heard every word.
She kneels down in the dirt in front of him, and puts her forehead against his, and neither of them says anything.
{ brother_moved:
    -> c2day11_girl_brother_stays
}
-> c2day11_girl_brother_free

=== c2day11_girl_brother_free ===
"Let him go." #speaker:boss
The circle look at each other.
"The boy. Let him go to his sister. And let her go, past the edge, wherever she wants." #speaker:boss
"That's an order. The last one I'll give." #speaker:boss
They let go of your brother's arm, and he comes to you on his bad leg, and falls the last step, and you catch him.
"I knew it was him. I said. Nobody listened." #speaker:brother
"I listened." #speaker:scavenger
He can't walk. Not out there, not for a long time. You both know it.
"The old man'll have him. I'll carry him there myself." #speaker:boss_son
The son, at the back of the torches. He came with them. He came for you.
~ brother_saved11 = true
-> c2day11_girl_go

=== c2day11_girl_brother_stays ===
Your brother's standing with his torch, looking at the boss on his knees, and at the woman with him.
"You said she sold us. You said." #speaker:brother
The boss doesn't answer him. He can't.
"Come with me." #speaker:scavenger
Your brother looks at you, a long time. Then he looks at the boss, kneeling in the dirt, holding his daughter's hands like they might go again.
"He's got nobody. Look at him. Somebody's got to stay." #speaker:brother
He goes and stands by the boss, and puts his hand on his shoulder, the way the boss used to put his on yours.
"Let her go. Past the edge, wherever she wants. That's an order. The last one I'll give." #speaker:boss
-> c2day11_girl_go

=== c2day11_girl_go ===
Nobody stops you. Nobody's going to stop anybody, tonight.
"Go. Before they remember they hate you." #speaker:scout
~ c2day11 = "edge"
~ edge_ready11 = true
Back across the deep ground in the dark, the long way round, to the tree's edge. #goto:trees-edge:200:232:c2day11_edge
-> END

// --- A truce: the watcher, the tally house, both clans ---

=== c2day11_truce ===
~ c2day11 = "truce"
~ truce11 = true
~ objective = "Take the rubbing to the watcher"
~ objective_target = "compound:watcher-truce11"
"Then let's end it." #speaker:scavenger #dim:off
-> END

=== c2day11_truce_watcher ===
~ truce_watcher11 = true
~ brother_beside11 = brother_moved
~ brother_held11 = not brother_moved
The watcher takes the hide, and unrolls it, and goes very still.
"His mark." #speaker:watcher
"Every square. Every name." #speaker:scavenger
"Then it'll be in front of everyone. Both sides. I'll send to the line under a flag. They'll come, for this." #speaker:watcher
He looks down at {dog_name}.
"And it comes too. They'll want something to trust us by. That's it." #speaker:watcher
~ objective = "The tally house, in front of both clans"
~ objective_target = "tally-house:boss-truce11"
They come at dusk, under a strip of white cloth on a pole. #time:evening
-> END

=== c2day11_truce_tally ===
~ truce_tally11 = true
The tally house at dusk, packed to the walls: your people on one side, theirs on the other, in their pale wraps, and the watcher between with the hide held up.
The boss at the counter.
{ brother_moved:
    Your brother beside him, in his strap, glaring at you.
- else:
    And at the back, between two of the circle, your brother, white-faced, his leg strapped, a hand on his collar. The boss wanted him where you'd see him.
}
The watcher reads it out. Every square. Every name. Every raid that hit a square on the board. And the mark in the corner, held up so the whole room can see whose it is.
Somebody shouts. Then everybody shouts.
"Take her!" #speaker:boss
{ brother_moved == false:
    The men at the back drag your brother up off his feet.
}
And half his circle comes over the counter at you, the ones who still don't know what else to do. #shake
"Grrrr." #speaker:dog #bark:dog-follow:GRRRR:growl
The watcher puts the hide in his coat, and stands beside you. #combat:loyal_circle:c2day11_truce_after
-> END

=== c2day11_truce_after ===
The last of his circle goes down across the counter, and the rest of them have stopped, and are looking at the boss.
{ brother_moved == false:
    The men holding your brother let go of him, and step back, and don't look at anybody. He comes to you on his bad leg and you catch him.
    ~ brother_saved11 = true
}
~ boss_why = true
The boss hasn't moved. He sits down on the tallyman's stool, heavily, like a much older man. #dim:on
"They said a boss's own child, or no truce. The old ones stood behind me and said it was her, or every child in the settlement starving in a war." #speaker:boss
"I carried her to their cairn myself. I was the one who let go of her hand." #speaker:boss
"And every square I've sold since, every raid, I sold for a lock of her hair. And when they wanted more, I put it on her." #speaker:boss
He looks at you.
"Because she came out of nowhere, and nobody would miss her." #speaker:boss #dim:off
Across the room, their leader nods, slowly. It's true. They held her. They took his squares.
{ brother_moved:
    Your brother's looking up at the boss as if he's never seen him before.
}
"A truce, then. A real one. His girl back across the line, and no more squares." #speaker:watcher
"With what to trust you by?" #speaker:raider_lead
The watcher looks at you. You look at {dog_name}.
You crouch, and put your hand on its back, and let them all see it. #dim:on
The whole tally house goes quiet. A dog. A living dog. Every face in the room changes. #dim:off
"It finds what's buried. It'll find for both sides, or neither. That's what you trust." #speaker:scavenger
~ dog_revealed11 = true
They agree. Over a dog. And by the time the shouting's turned into talking, every eye in the room is on {dog_name}, wanting it.
-> c2day11_truce_sentence

// Why they let you go (designer): the watcher's in charge now, and keeps your sentence.
=== c2day11_truce_sentence ===
The watcher takes you aside, by the door, while they're still talking.
"You're still branded." #speaker:watcher
"I know." #speaker:scavenger
"Half that room still thinks you sold them. The other half needs somebody to have been the rat, or this falls apart by the morning." #speaker:watcher
"The truce needs you gone. Both sides have to see it done. So I'll do it." #speaker:watcher
"And the dog?" #speaker:scavenger
"Goes with you. Tonight. Before either side decides it's theirs." #speaker:watcher
{ brother_moved:
    -> c2day11_truce_brother_stays
}
"And the boy goes to the old man's, and the circle will leave him be. You've my word." #speaker:watcher
-> c2day11_truce_go

=== c2day11_truce_brother_stays ===
Your brother's still standing by the boss's stool.
"Come with me." #speaker:scavenger
"He's got nobody. Look at him." #speaker:brother
He doesn't come. He puts his hand on the boss's shoulder, the way the boss used to put his on yours.
-> c2day11_truce_go

=== c2day11_truce_go ===
~ watcher_edge11 = true
~ c2day11 = "edge"
~ edge_ready11 = true
The watcher walks you out himself, through the middle of both clans, the way you'd walk out a rat. #goto:trees-edge:200:232:c2day11_edge
-> END

// --- Throw it to the yard: let them tear the boss down ---

=== c2day11_war ===
~ c2day11 = "war"
~ war11 = true
~ objective = "The yard: up on the crates, and throw it to them"
~ objective_target = "swap-yard:war-spot11"
"Let them have the boss." #speaker:scavenger #dim:off
You wait in the stacks with {dog_name} until the light goes, and the whole settlement goes to the yard to see you walked out. #time:evening
-> END

=== c2day11_war_yard ===
~ war_yard11 = true
The yard at dusk, full: everybody's come to see you walked out past the edge.
And the boss is at the tally gate, come out to see you go.
{ brother_moved:
    Your brother beside him, holding a torch.
- else:
    Your brother beside him too, held by the collar, his leg strapped. The boss keeps a hand on his shoulder, kind as ever, where you can see it.
}
You climb up on the crates, where everybody can see you, with your wrist bleeding through the rag. #shake
"Here's your rat!" #speaker:scavenger
You throw the hide out over their heads. It comes open in the air.
Somebody catches it. Somebody else reads it. Then it's going hand to hand, and you can hear the names going with it. The wells. The ditch. The mast. His mark.
~ boss_why = true
They turn, all of them, towards the tally gate. He doesn't run. #dim:on
"They said a boss's own child, or no truce! The old ones stood behind me and said it was her, or every child in this yard starving in a war!" #speaker:boss
"I carried her to their cairn myself! Every square I sold, I sold for her!" #speaker:boss
"What would you have done? Any of you? What would you have done?" #speaker:boss #dim:off
Nobody answers him. Somebody throws a stone. Then everybody's moving. #sound:roar
Then a horn from out at the line, because the other clan's heard the noise and come to see what's burning, and everyone's fighting everyone. #shake
{ brother_moved:
    In the crush, you lose sight of your brother. One moment he's at the boss's side. The next there's only smoke.
- else:
    The man holding your brother is knocked flat, and your brother goes down under the crowd's feet.
}
~ son_war11 = true
The son shoves through the crowd to you with his pipe. #beside:son-war11:-24:walk
{ brother_moved:
    "Your brother! I saw him! Over by the gate!" #speaker:boss_son #combat:riot:c2day11_war_after
- else:
    "Your brother's down! Come on!" #speaker:boss_son #combat:riot:c2day11_war_after
}
-> END

=== c2day11_war_after ===
{ brother_moved:
    -> c2day11_war_lost
}
You get to him. He's curled up in the dirt by the gate with his arms over his head, and he's alive.
~ brother_saved11 = true
You get him up between you and the son, and out through the back of the yard, with the smoke behind you and {dog_name} at your heels.
The old scavenger's there, in the lane, with a handcart, as if he's been waiting for this all his life.
"Put him in. Go on. I'll have him." #speaker:old_scav
-> c2day11_war_go

// He's lost in the smoke: you never say goodbye.
=== c2day11_war_lost ===
~ brother_lost11 = true
You get to the gate. He isn't there. The boss isn't there. There's only smoke, and people, and somebody's torch in the dirt.
You shout his name until you can't. Nobody answers.
"You can't stay! They'll have you!" #speaker:boss_son
He drags you out through the back of the yard, with {dog_name} at your heels.
-> c2day11_war_go

=== c2day11_war_go ===
"Go. I'm staying. Somebody has to pick up what's left." #speaker:boss_son
"What's left of him?" #speaker:scavenger
"What's left of everybody." #speaker:boss_son
He goes back into the smoke. #leave:son-war11:-20:90
~ c2day11 = "edge"
~ edge_ready11 = true
Nobody's looking for you now. Nobody's looking for anything but the next stone. You walk out of the settlement, and nobody stops you. #goto:trees-edge:200:232:c2day11_edge
-> END

// --- Dusk, the tree's edge: your brother, and the woods ---

=== c2day11_edge ===
~ edge11 = true
~ objective = ""
~ objective_target = ""
The warning signs, and then past them, where nobody goes. The roots coming up out of the ground like walls. #time:evening
{ watcher_edge11:
    The watcher stops at the last of the signs.
    "This is as far as anybody goes." #speaker:watcher
    "Thank you." #speaker:scavenger
    "Don't. I've done it to you as well as for you. I know which." #speaker:watcher
    He goes back. He doesn't look round. #leave:watcher-edge11:-30:40
}
{ brother_saved11:
    -> c2day11_edge_cart
}
{ brother_lost11:
    -> c2day11_edge_wait
}
-> c2day11_edge_brother

// You got him back, but he can't walk: the old scavenger brings him to say goodbye.
=== c2day11_edge_cart ===
~ old_edge11 = true
Somebody's coming after you. A handcart, squeaking, and a hook, tapping. #beside:old-edge11:-40:walk #beside:brother-cart11:-58:walk
The old scavenger, pushing your brother in the cart, his strapped leg out in front of him.
"He wouldn't stop asking. I'm too old to listen to it." #speaker:old_scav
"Take me with you." #speaker:brother
+ [Take him]
    You get his arm over your shoulders and lift him out of the cart.
    Three steps. Then his leg goes, and he bites his lip till it bleeds so he won't cry out, and you set him down in the dirt.
    The old man doesn't say anything. He doesn't have to.
+ [Tell him he can't]
    "You can't walk. Out there, you can't walk, you die." #speaker:scavenger
    "I could try." #speaker:brother
    "I know you could." #speaker:scavenger
- "I'll come back for you. When it's mended. When I've somewhere." #speaker:scavenger
"You'd better. You'd better." #speaker:brother
He takes {dog_name}'s ears in both hands, the way he did the very first night, and puts his forehead on its head, and holds it there a long time.
"I'll look after him. I'll do it badly. Come back." #speaker:old_scav
They go back, the cart squeaking all the way, and you watch until you can't hear it. #leave:old-edge11:-30:40 #leave:brother-cart11:-30:40
-> c2day11_woods

// He stayed with the boss.
=== c2day11_edge_brother ===
You stand at the last of the signs, and look back at the settlement, and wait.
You know he isn't coming. You wait anyway.
{dog_name} sits down beside you, and leans on your leg, and waits too.
-> c2day11_woods

// Lost in the smoke: you wait, and he doesn't come.
=== c2day11_edge_wait ===
You stand at the last of the signs, and look back at the smoke over the settlement, and wait.
Every shape on the track is him, until it isn't.
The light goes. Nobody comes.
{dog_name} whines, and pushes its head under your hand.
You don't know if he's alive. You won't, for a long time.
-> c2day11_woods

=== c2day11_woods ===
Then it's just you and {dog_name}, and the roots, and past the end of them, where the waste gives way to something else.
Trees. Not the tree. Small ones, hundreds of them, dark, going on further than you can see.
Nobody from the settlement has ever gone in there and come back to say what's in it.
You look at the brand on your wrist. Then at {dog_name}.
It trots on ahead, nose down, as if it knows something you don't.
~ c2day11 = "done"
{ last_act == "girl":
    You look back once. Then you follow it. #ending:c2_girl
- else:
    { last_act == "truce":
        You look back once. Then you follow it. #ending:c2_truce
    - else:
        You look back once. Then you follow it. #ending:c2_war
    }
}
-> END

// --- The cellar's hatch ---

=== tally_cellar_hatch ===
{ let_out11:
    Open. Up there, the tally house.
- else:
    The hatch, over your head. Locked from above, with a man sitting on it. You can hear him breathing.
}
-> END
