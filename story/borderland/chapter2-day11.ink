// ============================================================================
// Chapter 2, Day 11: the fall. Draft text from docs/sequences/chapter-2/part-5.md, for the designer to rewrite
// (designer: the brand at the tally house in front of everyone; someone lets you out, depending on who you've
// helped, or the son; your brother manipulated (compound) or a hostage (home); everyone understands why by
// the end; each ending its own fight with different people beside you; an escape towards the woods, uneasy).
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

// --- The cellar: someone lets you out (designer: whoever you've helped; or, if nobody, the son) ---

=== c2day11_cellar ===
~ c2day11 = "cellar"
~ brand_morning11 = false
~ in_cellar11 = true
The cellar. Dirt walls, a drain grate in the floor, the hatch over your head, and feet going back and forth over it all day.
The son's down here too, against the far wall, his hands tied. They haven't branded him. Not yet.
"He'll do it to me as well, you know. His own son. He'll find a way to make it kind." #speaker:boss_son
The hours go. The light through the hatch's cracks moves across the floor. #time:afternoon
{ watcher_ally:
    -> c2day11_out_watcher
}
{ friend_choice == "covered":
    -> c2day11_out_friend
}
{ gambler_trust >= 1 || gambler_choice == "fought" || gambler_choice == "paid":
    -> c2day11_out_gambler
}
-> c2day11_out_son

// He respects you, and he's got the other key.
=== c2day11_out_watcher ===
A key in the hatch. Slow, careful, the way he does everything. #sound:latch
~ watcher_cellar11 = true
The watcher comes down the ladder, and shuts the hatch over his head.
"The scout had one key out of my cellar. I had the other. So did he." #speaker:watcher
"I've served that man twenty years. I'd like to know what for." #speaker:watcher
He cuts the son's hands free, and then he stands aside.
"I didn't see you. I was counting sacks." #speaker:watcher
-> c2day11_out_drain

// You covered for her at the line.
=== c2day11_out_friend ===
Something scrapes under the drain grate. The grate lifts. #sound:grate
~ friend_cellar11 = true
Your friend's face, filthy, grinning up at you out of the drain.
"You covered for me. I don't forget." #speaker:scav_friend
"The drain comes out behind the stacks. It's horrible. Come on." #speaker:scav_friend
-> c2day11_out_drain

// You helped him at the den.
=== c2day11_out_gambler ===
A scratching at the hatch's lock, and swearing, and more scratching. Then a click. #sound:latch
~ gambler_cellar11 = true
The gambler, upside down in the hatch, with a bent nail in his teeth.
"Locks are like dice. Everybody thinks they're honest." #speaker:gambler
"Not the hatch, they'll see. The drain. Go on, I'll put the lock back how I found it." #speaker:gambler
-> c2day11_out_drain

// Nobody came: the son knows his father's house.
=== c2day11_out_son ===
Nobody comes. The light goes yellow, and then it starts to go orange.
"Nobody's coming, are they." #speaker:boss_son
"No." #speaker:scavenger
"Then untie me, and I'll show you something my father doesn't know I know." #speaker:boss_son
You get his knots open with your teeth.
He kneels by the drain grate, and works the bolt out of the stone with his fingers, the way you'd work a loose tooth.
"I used to hide down here when I was small. From him. It comes out behind the stacks." #speaker:boss_son
-> c2day11_out_drain

=== c2day11_out_drain ===
~ let_out11 = true
~ c2day11 = "out"
~ objective = "Out through the drain"
~ objective_target = "tally-cellar:drain"
"Go. Get your dog. I'll find you." #speaker:boss_son
-> END

=== tally_cellar_drain ===
{ not let_out11:
    The drain grate. Bolted into the stone. Your fingers won't shift it.
    -> END
}
The drain's horrible, and narrow, and long. And then there's daylight, and the back of the scrap stacks. #goto:scrap-stacks:40:510:c2day11_out_stacks
-> END

=== tally_cellar_hatch ===
{ let_out11:
    Not the hatch. They'll see.
- else:
    The hatch, over your head. Locked. Feet going over it all day.
}
-> END

=== c2day11_out_stacks ===
~ in_cellar11 = false
~ c2day11 = "hollow"
~ objective = "Find " + dog_name
~ objective_target = "dogs-hollow:dog"
The stacks, in the last of the afternoon. Nobody's looking this way. They're all looking at the tally house, waiting for dusk.
{dog_name} will be where it always goes.
-> END

// --- The hollow: Peggy, and the rubbing ---

=== c2day11_hollow ===
~ c2day11 = "choice"
~ dog_with_you = true
~ objective = ""
~ objective_target = ""
{dog_name} comes out of the hollow like it's been waiting all day, which it has. #beside:dog-follow:14:walk
It drops the roll of hide at your feet, wet, and pushes its nose into your branded wrist, very gently.
"Whine..." #speaker:dog
You unroll it. Every square. Every name. And in the corner, his mark.
You've got until dusk. Then they'll come for you, and find the cellar empty, and come looking.
One thing you can do with it, before you go. Only one.
-> c2day11_choice

// Big choice 3 (design doc): each one only if your choices allow it; each explains itself in a second box.
=== c2day11_choice ===
What do you do, before you go? #dim:on
- (choose)
+ { scout_friend } [Save the girl]
    Over the line, with the scout, to the camp where they keep his daughter. Get her out, and he's free of them: no more squares, no more raids.
    But both clans will hate you for it: his, for what he did; theirs, for what you took.
    ++ [Yes. Get her out.]
        ~ last_act = "girl"
        -> c2day11_girl
    ++ [No. Think again.]
        -> choose
+ { watcher_ally && rival_trust >= 1 } [End the conflict]
    Take the rubbing to the watcher, and stand up in the tally house in front of both clans. Expose him, and make a truce that holds.
    But a truce needs something to trust. Both clans will see {dog_name}, and from then on everybody will want it.
    ++ [Yes. End it.]
        ~ last_act = "truce"
        -> c2day11_truce
    ++ [No. Think again.]
        -> choose
+ [Keep it raging]
    Throw the rubbing to the yard, and let them have him. The clans will go to war over it, and in all that, nobody will be looking for you.
    You'll get away. A lot of people won't.
    ++ [Yes. Let it burn.]
        ~ last_act = "war"
        -> c2day11_war
    ++ [No. Think again.]
        -> choose

// --- Save the girl: the camp, with the scout and the dog ---

=== c2day11_girl ===
~ c2day11 = "girl"
~ girl11 = true
~ objective = "To the line: the scout's waiting at the dip"
~ objective_target = "rival-line:scout-girl11"
"Then we go now." #speaker:scavenger #dim:off
To the line, and the dip, and over. The scout said they'd be there at dusk if you ever needed them. #time:evening
-> END

=== c2day11_girl_dip ===
~ girl_dip11 = true
The scout's at the dip, crouched, waiting.
"You came." #speaker:scout
"I want her out. His daughter." #speaker:scavenger
They look at you a long time.
"Our boss'll have my hide for this." #speaker:scout
"Then come with me after. There's room in the woods." #speaker:scavenger
"...Under the fence. Keep low. She's in the hut past the cairn." #speaker:scout
~ objective = "Under the fence: the hut past the cairn"
~ objective_target = "rival-line:hut"
-> END

=== c2day11_girl_hut ===
~ girl_hut11 = true
Two of their guards at the hut, by the fire, staves across their knees. They see the dog first, and then you, and they're up. #shake
"Grrr." #speaker:dog #bark:dog-follow:GRRR:growl
The scout steps up beside you. #combat:camp_guards:c2day11_girl_after
-> END

=== c2day11_girl_after ===
The guards are down in the dirt by their own fire.
~ daughter11 = true
The hut's flap opens. A woman, older than you, with pale hair in a plait, a thread tied at the end of it. She's been listening.
"You're from his side." #speaker:daughter
"Your father's." #speaker:scavenger
"Is he alive?" #speaker:daughter
"Yes. He's... yes." #speaker:scavenger
"Every month they cut a piece of my hair and take it to the cairn, and I know he's still paying." #speaker:daughter
"He's still paying. That's why I'm here." #speaker:scavenger
-> c2day11_girl_father

=== c2day11_girl_father ===
Boots on our side of the fence. Torches. They've found the cellar empty.
~ father11 = true
And at the front of them, the boss, with his men behind him, come to drag you back.
He sees who's standing beside you, and stops dead.
"No." #speaker:boss #dim:on
~ boss_why = true
She's at the fence before anybody can stop her, and he's on his knees in the dip with his hands through it, and she takes them. #move:daughter11:640
"They said a boss's own child, or no truce. Our old ones stood behind me and said it was her or everybody's." #speaker:boss
"I carried her to the cairn myself. Every square I've sold since, I sold for a lock of her hair." #speaker:boss
"And I put it on you. Because you came out of nowhere, and nobody would miss you." #speaker:boss #dim:off
His men are looking at him. All of them. They heard every word.
Nobody stops you. Nobody's going to stop anybody, tonight. Both sides of the fence are shouting now.
"Go. Before they remember you." #speaker:scout
~ c2day11 = "edge"
~ edge_ready11 = true
~ objective = "Out past the tree's edge"
~ objective_target = "trees-edge:crack"
You go. #time:evening
-> END

// --- End the conflict: the watcher, the tally house, both clans ---

=== c2day11_truce ===
~ c2day11 = "truce"
~ truce11 = true
~ objective = "Take the rubbing to the watcher"
~ objective_target = "compound:watcher-truce11"
"Then let's end it." #speaker:scavenger #dim:off
-> END

=== c2day11_truce_watcher ===
~ truce_watcher11 = true
The watcher takes the hide, and unrolls it, and goes very still.
"His mark." #speaker:watcher
"Every square. Every name." #speaker:scavenger
"Then it'll be in front of everyone. Both sides. I'll send to the line under a flag. They'll come, for this." #speaker:watcher
He looks down at {dog_name}.
"And it comes too. They'll want a reason to trust us. That's the reason." #speaker:watcher
~ objective = "The tally house, in front of both clans"
~ objective_target = "tally-house:boss-truce11"
They come at dusk, under a strip of white cloth on a pole. #time:evening
-> END

=== c2day11_truce_tally ===
~ truce_tally11 = true
The tally house at dusk, packed to the walls: your people on one side, theirs on the other, in their pale wraps, and the watcher between with the hide held up.
The boss at the counter. He reads it upside down, from where he stands, and you watch him understand.
"It's his mark. On every square that was raided." #speaker:watcher
Somebody shouts. Then everybody shouts.
"Take her!" #speaker:boss
And half his circle comes over the counter at you, the ones who still don't know what else to do. #shake
"Grrrr." #speaker:dog #bark:dog-follow:GRRRR:growl
The watcher puts the hide in his coat, and stands beside you. #combat:loyal_circle:c2day11_truce_after
-> END

=== c2day11_truce_after ===
The last of his circle goes down across the counter, and the rest of them have stopped, and are looking at the boss.
~ boss_why = true
He hasn't moved. He sits down on the tallyman's stool, heavily, like a much older man. #dim:on
"They said a boss's own child, or no truce. Our old ones stood behind me and said it was her or everybody's." #speaker:boss
"I carried her to the cairn myself. Every square I've sold since, I sold for a lock of her hair." #speaker:boss
"And I put it on her. Because she came out of nowhere, and nobody would miss her." #speaker:boss #dim:off
Their people look at each other across the room. They knew. Some of them, they knew.
"A truce, then. A real one. Her back, and no more squares." #speaker:watcher
"With what to trust you by?" #speaker:raider_lead
The watcher looks at you. You look at {dog_name}.
You crouch, and put your hand on its back, and let them all see it. #dim:on
The whole tally house goes quiet. A dog. A living dog. Every face in the room changes. #dim:off
"It finds what's buried. It'll find for both sides, or neither. That's what you trust." #speaker:scavenger
~ dog_revealed11 = true
They agree. Over a dog. And by the time the shouting's turned into talking, every eye in the room is on {dog_name}, wanting it.
"Go now. While they're busy wanting it and haven't decided to take it." #speaker:watcher
~ c2day11 = "edge"
~ edge_ready11 = true
~ objective = "Out past the tree's edge"
~ objective_target = "trees-edge:crack"
-> END

// --- Keep it raging: the yard, and the riot ---

=== c2day11_war ===
~ c2day11 = "war"
~ war11 = true
~ objective = "The yard: throw it to them"
~ objective_target = "swap-yard:war-spot11"
"Let them have him." #speaker:scavenger #dim:off
You wait in the stacks with {dog_name} until the light goes, and the whole settlement goes to the yard to watch you walked out. #time:evening
-> END

=== c2day11_war_yard ===
~ war_yard11 = true
The yard at dusk, full: everybody's come to see you walked out past the edge.
You climb up on the crates, where everybody can see you, with your wrist bleeding through the rag. #shake
"Here's your rat!" #speaker:scavenger
You throw the hide out over their heads. It comes open in the air.
Somebody catches it. Somebody else reads it. Then it's going hand to hand, and you can hear the names going with it.
~ boss_why = true
And the boss is there, at the tally gate, come out to see you go. He hears his own name come back across the yard at him, and he doesn't run.
"They said a boss's own child, or no truce. Our old ones stood behind me and said it was her or everybody's!" #speaker:boss
"I carried her to the cairn myself. Every square I sold, I sold for her!" #speaker:boss
It doesn't help him. Nothing would have. #sound:roar
Then a raider's horn from the line, because the other clan's heard the noise and come to see what's burning. And everyone's fighting everyone. #shake
~ son_war11 = true
The son shoves through the crowd to you with his pipe. #beside:son-war11:-24:walk
"This way! Out through the back!" #speaker:boss_son #combat:riot:c2day11_war_after
-> END

=== c2day11_war_after ===
You're out of the back of the yard, with smoke behind you, and the son, and {dog_name}.
"Go. I'm staying. Somebody has to pick up what's left." #speaker:boss_son
"What's left of him?" #speaker:scavenger
"What's left of everybody." #speaker:boss_son
~ c2day11 = "edge"
~ edge_ready11 = true
~ objective = "Out past the tree's edge"
~ objective_target = "trees-edge:crack"
He goes back into the smoke. #leave:son-war11:-20:90
-> END

// --- Dusk, the tree's edge: your brother, and the woods ---

=== c2day11_edge ===
~ edge11 = true
~ objective = ""
~ objective_target = ""
The warning signs, and then past them, where nobody goes. The roots coming up out of the ground like walls. #time:evening
{ brother_moved:
    -> c2day11_edge_brother
}
-> c2day11_edge_old

// He's been manipulated: he stays.
=== c2day11_edge_brother ===
~ brother_edge11 = true
Somebody's following you. Small, and out of breath. #beside:brother-edge11:-40:walk
Your brother. Still in his strap.
"I heard what he said. I heard it." #speaker:brother
"Then come with me." #speaker:scavenger
He looks back the way he came, at the settlement, at the smoke or the lamps or whatever's happening there now.
"I can't. It's all I know. And somebody's got to... I can't." #speaker:brother
He takes {dog_name}'s ears in both hands, the way he did the first night, and puts his forehead on its head.
Then he lets go, and goes back. He doesn't look back. You watch him all the way. #leave:brother-edge11:-30:60
-> c2day11_woods

// Held hostage: freed, but too hurt to come.
=== c2day11_edge_old ===
~ old_edge11 = true
Somebody's following you. A hook, tapping on the hard ground. #beside:old-edge11:-40:walk
The old scavenger.
"Your brother's at mine. They let him go when it all came apart. His leg's broken in two places." #speaker:old_scav
"He can't walk on it. Not for months. He wanted to come. I sat on him." #speaker:old_scav
"Look after him." #speaker:scavenger
"I'm old. I'll do what I can, and I'll do it badly. Come back for him." #speaker:old_scav
"I will." #speaker:scavenger
"I know." #speaker:old_scav
He turns round, and goes back, tapping. #leave:old-edge11:-30:40
-> c2day11_woods

=== c2day11_woods ===
Then it's just you and {dog_name}, and the roots, and past the end of them, where the waste gives way to something else.
Trees. Not the tree. Small ones, hundreds of them, dark, going on further than you can see.
Nobody from the settlement has ever gone in there and come back to say what's in it.
{dog_name} looks up at you. Then it trots on ahead, nose down, as if it knows.
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
