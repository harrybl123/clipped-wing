// ============================================================================
// Chapter 2, Day 7: two weeks on. Draft text from docs/sequences/chapter-2/part-3.md, for the designer to
// rewrite (designer: get the rough structure down, then playtest). The town turns on you, step by step,
// each step on screen (designer: it snapped from good to bad with no build-up; make the raids and why
// people think you're the informant clear): you put a false patch on the board every night, to keep the dog
// secret, and the raiders keep hitting the patch the board says you'll be on. Dawn in the sunk town with the
// dog and something down there; a raid on the old wells, last night's patch; the yard; your brother; the
// gambler's debt; the enforcer's accusation at the tally; your own people in the yard; the rat on your door.
// The stages are in `c2day7` (main.ink): dawn, wells, yard, brother, den, tribute, home, done.
// ============================================================================

// --- Dawn, the hollow ---

=== c2day7_start ===
~ c2day7 = "dawn"
~ dog_with_you = true
~ first_light = true
~ dawn7 = true
~ objective = "Go down the sunk town with " + dog_name
~ objective_target = "picked-fields:to-sunk-town"
Two weeks since the far end.
Every night since the son started asking where you go, you've put a patch of the fields up on the board. Never the sunk town. Nobody needs to know where you really dig. Nobody needs to find the dog.
The other clan's come once more since: the mast, last week, at dawn. You'd put the mast on the board the night before. You didn't think anything of it.
In the bar, people have started saying the boss's word. Informant.
Last night, you put down the old wells.
{dog_name} comes up out of the hollow and leans on your legs, the way it always does.
"Yip!" #speaker:dog
{ told_where == "sunk":
    And the sunk town isn't only yours any more. Since the bar heard you say it, people have been going down.
}
-> END

// --- The sunk town ---

=== c2day7_sunk_arrive ===
~ dawn7_arrived = true
~ objective = "Follow " + dog_name
~ objective_target = "sunk-town:nest"
{ told_where == "sunk":
    There's a new rope tied off at the top of the stairwell. Not yours. Somebody's been coming down after you.
- else:
    Nobody's been down here but you. Nobody ever is.
}
{dog_name} doesn't put its nose to the ground the way it does every morning. It stands at the top of the stairwell, very still, looking down.
"Grrr..." #speaker:dog #bark:dog-follow:grrr:growl
-> END

=== c2day7_nest ===
~ nest_found = true
The tunnel. Something's different down here. A smell like hot metal.
{ told_where == "sunk":
    A lamp lies on its side by the carriage, gone out. A sack beside it, half full. Nobody's come back for either.
}
And a sound, from inside the carriage, like a lot of small things tapping. #sound:scratch
Click. Click-click. Click.
{dog_name}'s hackles go up all along its back. #bark:dog-follow:GRRR:growl
They come out of the carriage's dark windows all at once: pale, shelled, low to the ground, as big as {dog_name}'s head. Nobody's ever said there was anything living down here.
Nobody who came back. #shake
"Stay by me." #speaker:scavenger #combat:tickers:c2day7_after_tickers
-> END

=== c2day7_after_tickers ===
~ nest_done = true
{ tickers_won:
    The last of them goes over on its back, legs folding, and the clicking stops.
    {dog_name} stands over it, growling, until you call it off.
- else:
    You get {dog_name} by the scruff and run, and they don't follow you past the carriage. They only want the dark.
}
{ told_where == "sunk":
    -> c2day7_lamp
}
-> c2day7_nest_done

=== c2day7_lamp ===
You pick up the lamp. There's a name scratched on the bottom, in signs. You know it: a picker from the fields. Ten days gone, people said. Ten days down here, with those.
He came down because of what you told the bar.
+ [Take the lamp]
    ~ has_lamp = true
    It goes in your satchel. Somebody should have it.
+ [Leave it]
    You set it back down, where it was. You can't look at it.
- -> c2day7_nest_done

=== c2day7_nest_done ===
"Whine." #speaker:dog
You won't be digging down here today. Maybe not again.
~ objective = "Climb back out"
~ objective_target = "sunk-town:to-picked-fields"
-> END

// Back up top: the dog sent home before anyone's about.
=== c2day7_send_home ===
~ dawn7_home = true
The sky's grey. Out on the fields, the first pickers.
"Home. Go on." #speaker:scavenger
It goes, low through the spoil heaps, looking back at you once. #leave:dog-follow:-30:120
~ dog_with_you = false
~ first_light = false
~ c2day7 = "wells"
~ wells_raid = true
Then, from out on the fields: shouting. Somebody screaming a name.
~ objective = "Go and see"
~ objective_target = "picked-fields:old-wells"
-> END

// --- Morning, the old wells: the patch you put on the board, raided at first light ---

=== c2day7_wells ===
~ wells_seen = true
The old wells. Your patch, on the board.
Pickers standing round, the way people stand round something that's already happened. Sieves trampled into the dirt. One man holding his arm against his chest. A woman with blood down the side of her face.
The old scavenger's there, tying a rag round somebody's head. He sees you, and his hands stop.
"They came at first light. Four of them, pale wraps. Walked straight to the wells like they'd been told the way." #speaker:old_scav
"Took every sack. Broke his arm for him when he held on to his." #speaker:old_scav
"She was down for the wells." #speaker:picker
One of the pickers is pointing at you.
"It was on the board. Her name, the wells. So where was she?" #speaker:picker
+ [I was digging somewhere else]
    "I was digging somewhere else." #speaker:scavenger
    "Where?" #speaker:picker
    You can't tell him. You can't tell anybody. Your alibi's under the floor of your shack.
+ [Say nothing]
    You don't answer. You can't. Your alibi's under the floor of your shack.
- The old scavenger finishes his knot, and stands up slowly, and comes over to you, close, so the others don't hear.
"The far end. You were down for it, with me. They came." #speaker:old_scav
"The mast, last week. You were down for it. They came. You weren't there." #speaker:old_scav
"Now the wells." #speaker:old_scav
"Every time, where the board says you'll be. And you're never there." #speaker:old_scav
"I'm not saying it's you. I'm saying that's what an informant looks like. Somebody who says one thing on the board and does another." #speaker:old_scav
Every lie you've put on the board to keep the dog safe, they've hit.
"Go on. Before they stop just pointing." #speaker:old_scav
-> c2day7_wells_done

=== c2day7_wells_done ===
~ c2day7 = "yard"
{ told_where == "sunk":
    ~ sister_here = true
}
{ told_where == "deep":
    ~ son_in_yard = true
}
~ objective = "Trade for food"
~ objective_target = "swap-yard:food-stall"
-> END

// --- Morning, outside your door ---

// --- The swap yard ---

=== c2day7_yard ===
~ yard7_done = true
The word's got to the yard before you. People stop talking as you pass, and start again behind you. #bark:swapper-1:The wells #bark:haggler:Her patch
The food trader takes your find, and gives you your bowl, and doesn't look at you once.
Last month she nodded to you. You'd never seen her nod to anyone.
{ told_where == "sunk": -> c2day7_sister }
{ told_where == "deep": -> c2day7_son_tracks }
-> c2day7_gossip

// You told the bar the sunk town: a picker went down, and didn't come up. His sister.
=== c2day7_sister ===
"You." #speaker:picker_sister #beside:sister:30:walk
A woman's pushed through the queue. You know her face from the fields.
"My brother went down the sunk town. Ten days ago. Because you stood in the bar and said that's where the finds are." #speaker:picker_sister
"He never came up." #speaker:picker_sister
{ has_lamp: -> c2day7_sister_lamp }
+ [I'm sorry]
    "I'm sorry." #speaker:scavenger
    "Sorry." #speaker:picker_sister
    She spits in the dirt at your feet.
+ [I never told anyone to go]
    "I never told anyone to go down there." #speaker:scavenger
    "You didn't have to." #speaker:picker_sister
- She goes. The queue lets her through, and closes up behind her. #leave:sister:700:60
-> c2day7_yard_done

=== c2day7_sister_lamp ===
You take his lamp out of your satchel, and hold it out.
She looks at it a long time. Then she takes it, in both hands, and turns it over and finds his name.
"Where?" #speaker:picker_sister
"The deepest tunnel. There are things down there. I didn't know." #speaker:scavenger
She doesn't say anything else. She goes, holding it against her chest. #leave:sister:700:50
~ sister_calmed = true
-> c2day7_yard_done

// You told the bar the deep ground: the son went out there to prove you a liar, and found tracks.
=== c2day7_son_tracks ===
"There she is." #speaker:boss_son #beside:son-yard:34:walk
The boss's son, with dirt on his good boots, and half the yard watching.
"I went out to the deep ground. To see where you go every morning." #speaker:boss_son
"Nobody's dug there. Not a hole. But there's tracks. Pale threads on the wire. Theirs." #speaker:boss_son
"Right where they come in from." #speaker:boss_son
+ [So you went looking for raiders]
    "So you went looking for raiders, and found raiders." #speaker:scavenger
    "I went looking for you." #speaker:boss_son
+ [I lied to you]
    "I lied. I don't go to the deep ground." #speaker:scavenger
    "Then where do you go?" #speaker:boss_son
    You don't answer. Everyone in the yard hears you not answer.
- He goes off towards the tally house, to tell somebody else. #leave:son-yard:552:70
-> c2day7_yard_done

// You won the spar: nobody told anything. The son's been telling his own version.
=== c2day7_gossip ===
Behind you, the haggler's telling the queue about the spar. #bark:haggler:She fought dirty
"The son let her win, I heard. Felt sorry for her." #bark:swapper-1:He let her win
"And now look." #bark:haggler:And now look
Nobody looks at you while they say it.
-> c2day7_yard_done

=== c2day7_yard_done ===
{ brother_moved:
    ~ c2day7 = "brother"
    ~ objective = "See your brother"
    ~ objective_target = "compound-house:brother-here"
    You haven't seen your brother in a week. The compound's on the way to nowhere you need to be. You go anyway.
- else:
    -> c2day7_to_den
}
-> END

// --- Your brother at the compound (big choice 1) ---

=== c2day7_brother ===
~ saw_brother7 = true
He's at the boss's table with a bowl of something hot, and he's wearing a strap with the circle's mark on it, like yours.
"You came!" #speaker:brother
Then he remembers something, and stops smiling.
"He says there's a rat. In the circle. He says it could be anybody." #speaker:brother
"Even family. He says especially family, because nobody thinks to look." #speaker:brother
"Why do you go out before it's light? Every morning. The kid says." #speaker:brother
+ [I like the quiet]
    "I like the quiet." #speaker:scavenger
    "That's what I said. When he asked." #speaker:brother
+ [Don't ask me that]
    "Don't ask me that. Not here." #speaker:scavenger
    "Why not here?" #speaker:brother
    You look at the boss's empty chair. He follows your eyes, and doesn't understand.
- "He's nice to me. He says I'm sharp." #speaker:brother
~ brother_asked = true
-> c2day7_to_den

// --- Afternoon: the den ---

=== c2day7_to_den ===
~ c2day7 = "den"
~ den7 = true
~ gambler_at_wall = true
~ collectors_here = true
~ objective = "See what the gambler wants"
~ objective_target = "gambling-den:gambler-wall"
Word gets round the way it does, mouth to mouth, until somebody says it to you: the gambler's in trouble at the den, and he's asking for you. #time:afternoon
-> END

=== c2day7_den ===
~ den7_seen = true
Down the steps, and it's quiet in the den. Nobody's playing.
The house's men have the gambler up against the debt wall, where everyone can see. One's talking. One's holding a cosh, and isn't.
"Thirty strokes on the wall, and a month past due." #speaker:collector
{ gambler_trust > 0:
    "She'll help! She helped me once! Tell them!" #speaker:gambler
    They both turn round, and look at you.
- else:
    The gambler sees you, and looks away. Somebody at the next table says he was drinking with the enforcer last night, and that he talked a lot.
    "I didn't say anything. I didn't. Help me?" #speaker:gambler
}
"Friend of yours?" #speaker:collector
+ [Step in]
    ~ gambler_choice = "fought"
    "Let him go." #speaker:scavenger
    "Or what?" #speaker:collector
    You slide the staff off your back. The pieces knock together along the core. The whole den hears it.
    "Ah. Or that." #speaker:collector #combat:debt_collectors:c2day7_den_after
    -> END
+ [Pay his debt]
    ~ gambler_choice = "paid"
    -> c2day7_den_paid
+ [Walk away]
    ~ gambler_choice = "left"
    -> c2day7_den_left

=== c2day7_den_paid ===
You tip out your satchel on the nearest table. Everything you dug this week. It doesn't look like much, all together.
The talker counts it with one finger.
"That's ten strokes. Not thirty." #speaker:collector
"Then it's ten." #speaker:scavenger
He thinks about it, and sweeps it into a bag, and wipes ten strokes off the wall with his thumb.
"Ten. We'll be back for the rest." #speaker:collector
They go up the steps, taking their time. #leave:collector-1:40:50 #leave:collector-2:40:45
~ week_paid = true
~ collectors_here = false
-> c2day7_den_gift

=== c2day7_den_left ===
You turn round, and go back to the steps.
The muscle's there before you, blocking them. You didn't hear him move.
"Friend of his? Then you can pay." #speaker:collector #beside:collector-2:-26:walk
"I'm not his friend." #speaker:scavenger
"Everybody's somebody's friend." #speaker:collector #combat:debt_collectors:c2day7_den_after
-> END

=== c2day7_den_after ===
~ collectors_here = false
{ collectors_won:
    The muscle's on the floor among the stools. The talker helps him up, and they back away to the steps, and go. #leave:collector-1:40:80 #leave:collector-2:40:60
    "The house doesn't forget." #speaker:collector
- else:
    They take your satchel, and tip it out, and take what's in it. Everything you dug this week. #leave:collector-1:40:50 #leave:collector-2:40:45
    "That'll do for today." #speaker:collector
    ~ week_paid = true
}
{ gambler_choice == "left":
    -> c2day7_den_left_after
}
-> c2day7_den_gift

// You helped him: he gives you his weapon (doc).
=== c2day7_den_gift ===
The gambler's sitting on the floor under the debt wall, holding his ribs.
"Nobody's ever. Nobody's ever done that." #speaker:gambler
He unwinds something from round his waist, under his shirt: a chain, a short one, with a weight on the end the size of a fist, cut from something that isn't metal and isn't stone.
"I won it. Years ago. Only good thing I ever won. It's yours." #speaker:gambler
"I won't forget this. I said that before. This time I mean it." #speaker:gambler
~ has_chain = true
~ gambler_trust += 1
-> c2day7_to_tribute

// You walked away: you fought them anyway, and he watched you try to leave him.
=== c2day7_den_left_after ===
The gambler's still against the wall where they left him. He watched the whole thing.
"You were going to leave me." #speaker:gambler
He doesn't say anything else. He doesn't need to.
-> c2day7_to_tribute

=== c2day7_to_tribute ===
~ den7 = false
~ c2day7 = "tribute"
~ tribute_night = true
~ objective = "Pay your tribute"
~ objective_target = "tally-house:tallyman"
Upstairs, the bar's filling up. It's tribute night. #time:evening
-> END

// --- Evening, the tally house ---

=== c2day7_tribute ===
~ tribute7_done = true
The queue along the rail. Tonight nobody's looking at what anybody else brought. They're looking at you. #bark:tribute-2:That's her #bark:tribute-5:Rat
{ week_paid:
    You've nothing to put on the counter. Everything you dug this week went to the den.
    "Short." #speaker:tallyman
    He draws a line through your sign.
- else:
    You put your week on the counter. A ring. A coil of wire. Small things, the way the watcher said.
    The tallyman turns the ring under the lamp.
    "Picked-fields stuff. You used to bring me things I'd never seen." #speaker:tallyman
}
The enforcer comes off the wall, and the queue goes quiet to listen.
"The far end of the fields. The mast. The old wells, this morning." #speaker:enforcer
"Three raids. Every one on ground that was on the board. Every one where she said she'd be." #speaker:enforcer
"Out every morning before it's light. Never with anybody. Never where she says." #speaker:enforcer
"Four times the tribute, a month ago. Where from? Nobody finds that much. Unless somebody's paying them for something." #speaker:enforcer
"Who's she been bringing it to instead?" #speaker:enforcer
+ [I've never been near them]
    "I've never been near the other clan. Not once." #speaker:scavenger
    "That's what a rat would say." #speaker:enforcer
+ [Anyone can read the board]
    "Anyone in the circle can read the board. You read it. You told me so." #speaker:scavenger
    The queue mutters. The enforcer's face doesn't move, but something behind it does.
    ~ enforcer_doubt += 1
- "Enough." #speaker:boss
He doesn't shout. He doesn't need to. The queue opens for him.
"I'll hear no more of this. Not in my tally house. She's one of mine." #speaker:boss
He puts his hand on your shoulder, warm and heavy, the way he did the first night. He leaves it there a long moment, so everyone sees it.
"Anyone who has something to say about her says it to me." #speaker:boss
Nobody does. The enforcer goes back to the wall.
{ week_paid:
    "And she's short. Next week, double. Like old times." #speaker:boss
    He says it like a joke. Nobody laughs.
}
-> c2day7_board

// Board night, short: the watcher, at the tally house tonight.
=== c2day7_board ===
The watcher's beside you, with the board's chalk.
"Tomorrow?" #speaker:watcher
You're going somewhere new tomorrow. Wherever the raiders are coming in from. But that isn't going on the board.
+ [The sunk town]
    ~ board_mark = "sunk town"
    "The sunk town." #speaker:scavenger
+ [The picked fields]
    ~ board_mark = "fields"
    "The picked fields." #speaker:scavenger
- He writes it down. He looks at you a moment longer than he needs to.
~ ambush_set = true
~ door_marked = true
{ not brother_moved:
    ~ brother_scrubbing = true
}
"Fill your satchel less, I said. Not fill it with nothing." #speaker:watcher
~ c2day7 = "home"
~ ambush_night = true
~ objective = "Go home"
~ objective_target = "shack:bed"
"Next." #speaker:tallyman
-> END

// --- Night, the swap yard: your own people ---

=== c2day7_ambush ===
~ ambush_done = true
The yard's packing up as you come through. The traders cover their stalls and go, quick, not looking at you. #time:night
When they've gone, there are still people standing between the stalls. Pickers. You know some of their faces.
They come out into the open, slowly, and stand between you and your door. #beside:mob-1:-34:walk #beside:mob-2:40:walk #beside:mob-3:60:walk
-> c2day7_ambush_face

// Home another way (round the back, through the stacks): they're waiting outside your door instead.
=== c2day7_ambush_door ===
~ ambush_done = true
Before you can get the door shut, there are voices outside it. Your name. Then "rat".
You go back out. #goto:swap-yard:70:232:c2day7_ambush_outside
-> END

=== c2day7_ambush_outside ===
Pickers, in the dark outside your door. You know some of their faces. They've been waiting. #time:night #beside:mob-1:-30:walk #beside:mob-2:34:walk #beside:mob-3:54:walk
-> c2day7_ambush_face

=== c2day7_ambush_face ===
{ told_where == "sunk" && not sister_calmed:
    His sister's at the front.
    "Ten days he was down there." #speaker:picker_sister
}
"The fields fed us. Thin, but it fed us. Now they're raiding it every week." #speaker:picker
"And every week it's somewhere you've been." #speaker:picker
+ [It isn't me]
    "It isn't me. I swear on my brother, it isn't me." #speaker:scavenger
    "Swear on what you like." #speaker:picker
+ [Go home]
    "Go home. All of you. Before somebody gets hurt." #speaker:scavenger
    "Somebody's already hurt." #speaker:picker
- Somebody picks up a stone. #combat:angry_pickers:c2day7_after_ambush
-> END

=== c2day7_after_ambush ===
~ ambush_night = false
{ ambush_won:
    They back off, the ones who can still walk dragging the ones who can't.
    You didn't want to hit them. You hit them anyway. They're your people. #leave:mob-1:420:80 #leave:mob-2:440:70 #leave:mob-3:460:60
    "Rat." #speaker:picker
- else:
    You're on the ground in the yard's dirt, and they're standing over you.
    Somebody gets a knife under the strap with the circle's mark on it, and cuts it, and throws it in the dirt beside you.
    ~ strap_cut = true
    "Tell him that. Your boss." #speaker:picker
    They go, not hurrying. #leave:mob-1:420:50 #leave:mob-2:440:45 #leave:mob-3:460:40
}
~ objective = "Go home"
~ objective_target = "swap-yard:to-shack"
-> END

// --- Night, outside your door: the last straw ---
=== c2day7_door ===
~ door_seen = true
Somebody's been at your door while you were at the tally.
A rat, in chalk, as long as your arm. Everyone knows the sign. Everyone in the yard will see it in the morning.
{ brother_moved:
    -> c2day7_door_alone
}
Your brother's on his knees in front of it with a wet rag and a bucket, scrubbing. He came out when he heard the shouting.
He's crying. He's trying not to.
"It won't come off. It just goes grey." #speaker:brother
"I saw them do it. From the window. I didn't open the door. I'm sorry. I'm sorry." #speaker:brother
"The kid says everyone's saying you're telling the other clan things. I said you'd never. I said it loud." #speaker:brother
"We're going to find the real one, me and the kid. Then they'll all have to say sorry." #speaker:brother
+ [Leave it to me]
    "Leave it to me. I mean it." #speaker:scavenger
    "You always say that." #speaker:brother
+ [Be careful]
    "Then be careful. Don't let anybody see you looking." #speaker:scavenger
    He nods, very seriously, and wipes his nose on his sleeve.
- ~ brother_spying = true
You take the rag off him, and finish it yourself. It goes grey, and stays grey.
He goes in ahead of you. #leave:brother-door:30:50
-> c2day7_door_done

=== c2day7_door_alone ===
Nobody's here to scrub it but you. You spit on your sleeve and get to work, in the dark, on your own.
It goes grey, and stays grey.
-> c2day7_door_done

=== c2day7_door_done ===
~ mark_scrubbed = true
~ brother_scrubbing = false
~ objective = "Go to bed"
~ objective_target = "shack:bed"
-> END


// --- Night, the shack ---

=== c2day7_bed ===
~ tribute_night = false
{ brother_moved:
    The shack's dark, and cold, and empty.
    You lift the loose panel. {dog_name} is there, already awake, and it puts its nose against your face, and whines.
- else:
    Your brother's gone up to the loft. You can hear him not sleeping.
    Under the floor, {dog_name} whines.
}
Every patch you put on the board, they hit. Somebody reads that board, and tells them.
Tomorrow, you find out where they're coming in from. Before somebody in the yard finds out where you go.
~ c2day7 = "done"
~ c2day8 = "dawn"
~ ambush_set = false
~ gambler_at_wall = false
~ collectors_here = false
~ objective = ""
~ objective_target = ""
You don't sleep. #wake:shack:382:184 #endday:Day 8
-> END
