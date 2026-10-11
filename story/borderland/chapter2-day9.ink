// ============================================================================
// Chapter 2, Day 9: the watch. Draft text from docs/sequences/chapter-2/part-3.md, for the designer to rewrite
// (designer: rough structure first; fold the drop's consequences in). Dawn at home (your brother out all
// night, if he's still with you); the boss's house: a night watch at the rival line, and what you've done
// catches up with you (your brother's tongue, the note, the drop you swapped, the son); the old scavenger on
// the fields, and the way out to the line; the fence (if you like); your friend at the line at dusk (medium
// choice); the dog; the watch, the raiders through the dip, the scout gone towards the settlement; the chase
// up the scrap stacks; the scout cornered; big choice 2.
// The stages are in `c2day9` (main.ink): morning, house, fields, dusk, dog, watch, chase, choice, home, done.
// ============================================================================

// --- Dawn, the shack ---

=== c2day9_start ===
~ c2day9 = "morning"
{ son_saw:
    ~ son_at_house = true
}
~ objective = "Go to the boss's house"
~ objective_target = "compound-house:boss"
{ brother_moved: -> c2day9_start_alone }
~ brother_out9 = true
Your brother's bed is empty. The blanket's cold.
You're at the door, about to go and turn the yard over looking for him, when it bangs open. #sound:latch
~ brother_back9 = true
He's muddy to the knees, and grinning, and trying not to.
"Where have you been?" #speaker:scavenger
"Nowhere. Out. With the kid." #speaker:brother
"We saw something. We're nearly sure. When we're sure, we'll tell you." #speaker:brother
+ [Tell me now]
    "Tell me now." #speaker:scavenger
    "Not till we're sure. You said, don't let anybody see you looking. Nobody saw." #speaker:brother
+ [Don't do it again]
    "Don't you ever do that again. Not now. Not with everything." #speaker:scavenger
    "You go out before it's light every day." #speaker:brother
    You haven't got an answer to that.
- He climbs up to the loft in his muddy boots, and he's asleep before you've finished being angry. #leave:brother-back:236:50
~ brother_asleep9 = true
And there's a runner at the door from the compound. The watcher wants you. The house, now.
-> END

=== c2day9_start_alone ===
The shack's empty, and cold.
There's a runner at the door from the compound before you've got your boots on. The watcher wants you. The house, now.
-> END

// --- Morning, the boss's house ---

=== c2day9_house ===
~ c2day9 = "house"
~ house9_done = true
The boss is at his table, and the watcher's beside him with the board.
"Sit. Eat. You look like you've had a week." #speaker:boss
{ found_note: -> c2day9_house_note }
-> c2day9_house_board

// The enforcer took the note from your satchel: the boss has it now.
=== c2day9_house_note ===
He waits until you've sat. Then he puts something on the table between the bread and the cups: a scrap of hide, scratched with signs.
Your square. Midday.
"The enforcer brought me this. Out of your satchel." #speaker:boss
"I took it off their drop. I was finding out who-" #speaker:scavenger
"I know. I believe you." #speaker:boss
He folds it, and puts it inside his coat.
"I've told the enforcer it's nothing. Don't make me a liar." #speaker:boss
He smiles. It's the same smile as always. It sits differently now.
-> c2day9_house_board

=== c2day9_house_board ===
{ drop_choice == "swap":
    "And one more thing. From tonight, the circle gives me its squares. Me, not the board. The watcher will keep the board in the side room." #speaker:boss
    "Keeps things tidy. Too many eyes on that board." #speaker:boss
    The watcher's face doesn't change. But he looks at the boss, just for a moment, the way he looks at everything.
}
{ son_saw:
    "She was out at first light again yesterday. I saw her go. Towards the fields." #speaker:boss_son #beside:son-house:40:walk
    The boss's son, in the doorway. You didn't see him come in.
    "Enough." #speaker:boss
    "You never want to hear it." #speaker:boss_son
    "I said enough." #speaker:boss
    His son goes. The boss watches him go, and then turns back to you, all smiles again. #leave:son-house:20:60
}
{ brother_moved:
    -> c2day9_house_brother
}
-> c2day9_house_watch

// Big choice 1 closes on you: your brother has told him about the dog.
=== c2day9_house_brother ===
Your brother's at the end of the table, wiping his bowl with his bread. He waves. You wave back.
The boss leans in close, and says it kindly, the way he says everything.
"Your brother tells me you've a friend. Four legs." #speaker:boss #dim:on
The bread's dry in your mouth.
"Don't look at him like that. He's proud of you. He couldn't keep it in." #speaker:boss
"A dog. Out here. I'd heard there weren't any left." #speaker:boss
+ [He's making it up]
    "He's a boy. He makes things up." #speaker:scavenger #dim:off
    "Does he." #speaker:boss
+ [Say nothing]
    You don't say anything. You can't. #dim:off
- "Your secret's safe with me. I keep a lot of secrets. It's what I'm for." #speaker:boss
~ boss_knows_dog = true
-> c2day9_house_watch

=== c2day9_house_watch ===
"Now. The line." #speaker:boss
"Three raids, and they're coming in somewhere. The watcher wants a pair of eyes on the line tonight. I said yours." #speaker:boss
"Sunset to first light. The post at the line. Nobody else will be out there." #speaker:watcher
"Prove them all wrong." #speaker:boss
He puts his hand on your shoulder. The watcher watches him do it.
And the watcher writes it down: your name, the line, sunset to first light. On the board, in the side room, for anyone who reads it.
~ c2day9 = "fields"
~ old9 = true
~ objective = "Find out about the line"
~ objective_target = "picked-fields:old-scav-9"
You've never been out to the line. The old scavenger has. #time:afternoon
-> END

// --- Afternoon, the picked fields: the old scavenger, and the way out to the line ---

=== fields_old9 ===
{ old9_done:
    "Go on. Before the light goes. And keep your head down at that dip." #speaker:old_scav
    -> END
}
-> c2day9_old

=== c2day9_old ===
~ old9_done = true
He's sitting on an upturned crate at the edge of the fields, rubbing his knee. He's moving like the raid's still in him.
"The line? Tonight?" #speaker:old_scav
"On my own." #speaker:scavenger
"On your own. Course you are." #speaker:old_scav
He looks at you a long time.
"For what it's worth. I don't think it's you." #speaker:old_scav
"You're the first person who's said that." #speaker:scavenger
"I'm old. I've seen a rat. Rats are careful. You're not careful, you're just secret. It's not the same." #speaker:old_scav
"Listen. Nobody climbs the fence at the line. Too high, too much wire. There's a dip under it, by their sign, where the ground's gone soft. You go through that on your belly." #speaker:old_scav
"If they're coming in, they're coming in there." #speaker:old_scav
He points his hook out past the fields, at a track you've never had a reason to take.
~ line_open = true
~ c2day9 = "dusk"
~ objective = "Go out to the line by sunset"
~ objective_target = "picked-fields:to-rival-line"
-> END

// --- The fence, if you go through the yard ---

=== c2day9_fence ===
~ fence9 = true
"You. A moment." #speaker:fence
The fence doesn't come out of the alcove this time. Just the voice, and the lamp turned low.
"Someone's selling where you dig. Not me. I don't sell people." #speaker:fence
"But I know who's buying. I get offered their goods, see. Things from past the line. Pale things. More of them every week." #speaker:fence
"Somebody's being paid in those. Somebody on our side, with things they can't sell to anybody but me." #speaker:fence
"Who's been bringing them to you?" #speaker:scavenger
"That I don't say. Nobody asks where. That's the whole trick of it." #speaker:fence
"But it isn't you. You've never brought me anything pale in your life." #speaker:fence
-> END

// --- Dusk, the rival line: your friend at the dip ---

=== c2day9_line_arrive ===
~ line9_arrived = true
~ friend_at_line = true
The sun's going down behind you as you get there. #time:evening
The rival line. The post on its stilts. Your clan's sign, facing out. The fence, junk and wire, too high to climb.
Voices. Low, somewhere up by the dip.
Then somebody laughs, a short, snorting laugh, cut off quick. You know that laugh.
~ objective = "Get closer"
~ objective_target = "rival-line:our-sign"
-> END

// Designer: the discovery should be more dramatic.
=== c2day9_friend ===
~ friend_seen9 = true
Two of them, at the dip. One on the far side in a pale wrap. One on this side, on her knees in the mud, her forehead pressed to the wire.
Their hands are through the gap, holding on. Then they lean in through it, and kiss.
The one on this side is your friend.
The pale thread's round her wrist. Of course it is. It always was.
You don't mean to make a sound. You make one. #sound:skid
The pale one's on their feet in a heartbeat, and there's a blade in their hand, pointing through the wire at you. #shake
"No! No, don't, she's mine, she's my friend!" #speaker:scav_friend
Your friend's between you and the wire, arms out. The blade wavers, and drops.
"Go. Go! I'll find you." #speaker:scav_friend
They go, back into the dark on their side, without a word. #leave:friend-rival:900:110
Your friend turns round. She's crying already. #beside:friend-line:24:walk
"How long?" #speaker:scavenger
"Eight months." #speaker:scav_friend
"Eight months. And the brothel door. That was this." #speaker:scavenger
"I lied to everybody. I had to." #speaker:scav_friend
"They hit the wells. They hit the mast. People are hurt, and they've chalked rat on my door. And you've been out here every night with one of them." #speaker:scavenger
"They've never asked me a thing! Not where we dig, not the board, nothing. I swear it on my mother." #speaker:scav_friend
"They're a picker, same as us. That's all. That's all it is." #speaker:scav_friend
She grabs your hands. Hers are freezing.
"If the boss finds out, they'll hang me off the tally gate. You know they will." #speaker:scav_friend
Then, behind you: boots on the track. Somebody coming up from the fields. #sound:boots #beside:watcher-line:-60:walk
~ watcher_at_line = true
The watcher, come to set the watch.
"Please," she says, without any sound at all.
-> c2day9_friend_choice

// The medium choice (design doc): report her, or cover for her.
=== c2day9_friend_choice ===
"Who's this?" #speaker:watcher
+ [Tell him]
    ~ friend_choice = "reported"
    "She was at the dip. With one of them. Holding hands through the fence." #speaker:scavenger
    The watcher looks at her a long time. She doesn't look at him. She looks at you.
    "Go home. Somebody will come for you in the morning." #speaker:watcher
    "I'll remember this." #speaker:scav_friend
    She goes, past you, without touching you. #leave:friend-line:16:70
    "That can't have been easy." #speaker:watcher
    ~ watcher_respect += 1
+ [Cover for her]
    ~ friend_choice = "covered"
    "She walked out with me. Keeping me company, till you came." #speaker:scavenger
    The watcher looks at her a long time, and at the dip, and at you.
    "Go home, then. It's no place to keep anybody company." #speaker:watcher
    She goes. At the edge of the track she looks back at you, just once. #leave:friend-line:16:70
    ~ rival_trust += 1
- "Sunset to first light. The post. Anything comes through that dip, you shout." #speaker:watcher
"And if nobody hears?" #speaker:scavenger
"Then you'll have to be enough." #speaker:watcher
He goes back the way he came. #leave:watcher-line:16:60
~ c2day9 = "dog"
~ objective = "Fetch " + dog_name
~ objective_target = "dogs-hollow:dog"
Nobody comes out to the line at night. Nobody would see a dog. #time:night
-> END

// --- Night, the hollow: the dog comes too ---

=== c2day9_hollow ===
~ dog_with_you = true
~ c2day9 = "watch"
~ objective = "Keep watch at the post"
~ objective_target = "rival-line:post"
{dog_name} comes out of the hollow into the dark, and sniffs at the night, at you, at where you've been.
"Yip?" #speaker:dog
"Work. Quiet work. Stay close." #speaker:scavenger
-> END

// --- Night, the post at the line ---

=== c2day9_watch ===
~ watched9 = true
~ line_raid = true
Up on the post's platform, with {dog_name} pressed against your leg, and the whole night in front of you.
Their fires, far off. Wind in the wire. Nothing.
For a long time, nothing.
Then {dog_name}'s head comes up.
"Grrr..." #speaker:dog #bark:dog-follow:grrr:growl
Three shapes at the dip, coming through on their bellies, one after another. Pale wraps. Staves. And a small one, quick.
{ drop_choice == "leave":
    The small one. You know them. The one who dug up the drop.
}
They're through. Two of them stand up, and see the post, and see you on it.
The small one doesn't stop. Low and fast, past the post, past you, towards the settlement. #leave:scout-line:16:130
"Go! Go on!" #speaker:raider_lead
~ scout_gone9 = true
The other two put themselves between you and the track. Staves level. #combat:line_raid:c2day9_after_line
-> END

=== c2day9_after_line ===
{ line_won:
    They go back under the fence the way they came, one dragging the other. #leave:line-raider-1:900:90 #leave:line-raider-2:900:80
- else:
    They leave you in the dirt, and go back under the fence, not hurrying. They only came to keep you busy. #leave:line-raider-1:900:60 #leave:line-raider-2:900:55
}
And the small one's still out there. Towards the settlement. In the dark.
{dog_name} has its nose to the track already.
"Sniff... sniff sniff!" #speaker:dog
~ c2day9 = "chase"
~ chase9 = true
~ dog_leading = true
It's off down the track, nose to the ground, and it looks back to see if you're coming.
~ objective = "Follow " + dog_name
~ objective_target = "rival-line:dog-lead;picked-fields:dog-lead;swap-yard:dog-lead;scrap-stacks:scout-stacks"
-> END

// --- Night, the scrap stacks: the chase ---

=== c2day9_stacks ===
~ chase_seen = true
~ dog_leading = false
{dog_name} stops dead at the foot of the stacks, and growls up at the dark. #bark:dog-follow:grrr:growl
There. The small one, in the pale wrap, looking back at the noise you're making.
They go up the stacks like they were born on them, ledge to ledge, never missing a hold. #route:scout-stacks:climb:120
~ objective = "Up after them"
~ objective_target = "scrap-stacks:view"
They're making for the kid's perch, at the top. There's no way down the far side that isn't a long fall.
-> END

// Designer: beat them first, then make them talk.
=== c2day9_cornered ===
~ scout_cornered = true
~ chase9 = false
~ objective = ""
~ objective_target = ""
They're backed up to the edge of the perch, with the whole settlement below them, and a blade in their hand.
{dog_name} puts itself between you, low, growling. #bark:dog-follow:GRRR:growl
The scout looks at the dog, and their eyes go wide.
"A dog. A real one." #speaker:scout
{ drop_choice == "leave":
    And you know that face. You watched it dig up the drop under the marker stone, yesterday.
}
"Where were you going?" #speaker:scavenger
{ drop_choice == "swap": -> c2day9_cornered_swap }
{ drop_choice == "take": -> c2day9_cornered_take }
"Get out of my way." #speaker:scout
You don't. They come at you. #combat:scout_known:c2day9_after_scout
-> END

// You swapped the drop: they went to row five for nothing.
=== c2day9_cornered_swap ===
"Somebody sent us to row five yesterday. Empty dirt, half a day." #speaker:scout
They look at you, and work it out.
"That was you." #speaker:scout
They don't wait for you to answer. They come at you, blade first, careless with fury. #combat:scout_angry:c2day9_after_scout
-> END

// You took the note: they want it back.
=== c2day9_cornered_take ===
"Somebody took a note off our drop yesterday." #speaker:scout
{ found_note:
    "Where is it? Who's got it?" #speaker:scout
    You think of the boss's coat, and the inside pocket. You don't say. They don't believe you.
- else:
    Their eyes go to your satchel.
}
They come for it with both hands. #combat:scout_desperate:c2day9_after_scout
-> END

=== c2day9_after_scout ===
{ scout_won:
    They're down on the perch's planks, the blade gone over the edge, and {dog_name}'s teeth an inch from their face.
- else:
    You're down. They've got their blade up, and then {dog_name} has their wrist in its jaws, and the blade's gone over the edge.
    Now they're the one on the planks, and {dog_name} won't let go.
}
"Where were you going?" #speaker:scavenger
They spit, and say nothing.
+ [Let the dog closer]
    "{dog_name}." #speaker:scavenger
    It leans in, and growls, right in their face. #bark:dog-follow:GRRRR:growl
    "All right! All right." #speaker:scout
+ [Pin them]
    You put your staff across their chest, and lean on it, until they can't breathe.
    "All right! All right." #speaker:scout
- You ease off. They pull the wrap down off their face: younger than you, with a burn down one cheek, breathing hard.
They look at your strap. The circle's mark, stitched into it.
"That mark. You're his. You're one of the circle." #speaker:scout
"Everyone over here says I'm the one telling you where we dig." #speaker:scavenger
They laugh, and it hurts them to.
"You? We'd know. It isn't you." #speaker:scout
"Then who?" #speaker:scavenger
"You don't know how it works over here, do you? None of you down in the dirt do." #speaker:scout
"Somebody on your side sells you to us. Where you'll dig, when you'll be there. Our people pay for it in pale things, and we take the sacks." #speaker:scout
"I was going in tonight to meet them. The other two were only there to keep your watch busy. And they knew the watch would be you, on your own. It's on your board." #speaker:scout
"You were picked. If anybody saw us come through tonight, it was your watch we came through." #speaker:scout
"Why tell me any of this?" #speaker:scavenger
"Because it isn't what it looks like. It's not your clan against mine. It's somebody on your side who wants it that way, and we're tired of getting fat on your hunger." #speaker:scout
"And because they're going to hang you for it. That isn't fair, and you ought to know." #speaker:scout
They look at {dog_name}.
"And if it ever comes to it, we'd rather have you with us than on the end of a rope." #speaker:scout
~ c2day9 = "choice"
-> c2day9_choice

// Big choice 2 (design doc), with a reason each way (designer: there was no incentive to let them go):
// your name, or the truth. Each option explains itself in a second box, as in Chapter 1 (designer).
=== c2day9_choice ===
"So. Shout for your watcher, and he gets one of us on his floor. Or let me go, and I'll tell you where our contact meets us, and when. You can see their face for yourself." #speaker:scout
Your name back, or the truth.
Take them in, and the yard has its proof. Let them go, and you might find out who's been doing this to you. #dim:on
- (choose)
+ [Take them to the watcher]
    The watcher gets one of the other clan on his floor: proof of how they come in, and proof it wasn't you. The yard will have to stop saying rat.
    But whatever the scout knows, the watcher hears it, and the watcher tells the boss everything. And you'll never see the contact's face.
    ++ [Yes. Take them in.]
        ~ scout_choice = "turned_in"
        "Get up. You're coming with me." #speaker:scavenger #dim:off
        -> c2day9_turned_in
    ++ [No. Think again.]
        -> choose
+ [Let them go, for the meeting place]
    They tell you where and when the contact meets them, and you can lie up and see for yourself who's been selling you.
    But you go home with nothing. The yard still says rat. And if anyone ever finds out you let one of them walk, that's the rope.
    ++ [Yes. Let them go.]
        ~ scout_choice = "let_go"
        "Where? When?" #speaker:scavenger #dim:off
        -> c2day9_let_go
    ++ [No. Think again.]
        -> choose

=== c2day9_turned_in ===
You send {dog_name} home. It goes down the stacks the way it came up, ledge by ledge, and off towards the shack, looking back at you once. #route:dog-follow:dog-home:110:leave
~ dog_with_you = false
~ turnin9 = true
Then you walk the scout down, and through the sleeping yard and the tally house, all the way to the compound. #goto:compound:60:232:c2day9_gate
-> END

=== c2day9_gate ===
The watcher's at the compound gate, as if he's been waiting up.
He looks at the scout a long time. Then at you.
"On your watch. Through the dip, like the old man said." #speaker:watcher
"Two of them kept me busy. This one went into the settlement. To meet somebody on our side." #speaker:scavenger
"Who?" #speaker:watcher
"They won't say." #speaker:scavenger
"They'll say to me." #speaker:watcher
He takes the scout by the arm, and stops, and says one more thing, low.
"You did the right thing tonight. Whatever they say in the yard, I'll say this: you brought one in." #speaker:watcher
He takes them in through the gate, and it shuts behind them. #leave:watcher-gate:320:50 #leave:scout-gate:320:50
~ watcher_respect += 1
~ scout_held = true
-> c2day9_dawn

=== c2day9_let_go ===
"Not here. Walk me out, and I'll tell you at the dip." #speaker:scout
~ letgo9 = true
You walk them down off the stacks, and out across the fields in the dark, all the way back to the line. {dog_name} trots between you. #goto:rival-line:540:232:c2day9_dip
-> END

=== c2day9_dip ===
At the dip, they stop, and keep their word.
"The cairn, on our side. Three nights from now, when there's no moon. Your contact comes through the dip alone, and we meet them there." #speaker:scout
"Lie up by your post, and you'll see who comes." #speaker:scout
"You didn't shout. I won't forget that." #speaker:scout
They look at {dog_name} one last time.
"Nor that. Nobody's seen a dog in my whole life." #speaker:scout
They go under the fence on their belly, and stand up on the far side, and they're gone. #leave:scout-free:900:90
~ rival_trust += 1
~ scout_friend = true
~ knows_meeting = true
-> c2day9_dawn

// No walking home through every area (designer): the night ends here.
=== c2day9_dawn ===
~ c2day9 = "done"
~ objective = ""
~ objective_target = ""
You get home as the sky goes grey.
{ dog_with_you:
    ~ dog_with_you = false
    {dog_name} goes down the hole under the floor without being told, and you hear it turn round three times and settle.
}
{ brother_moved:
    The shack's empty.
- else:
    Your brother's still asleep in his muddy boots.
}
{ scout_choice == "turned_in":
    The watcher has the scout. Whatever they say to him, they'll say it tonight.
- else:
    Three nights. The cairn, and the dip, and whoever comes through it alone.
}
{ boss_knows_dog:
    And the boss knows about the dog.
}
You lie down in your clothes, and don't sleep, and it's light. #wake:shack:382:184 #endday:Day 10
-> END
