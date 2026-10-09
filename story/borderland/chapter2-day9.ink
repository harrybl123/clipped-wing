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
The boss is at his table, and the watcher's beside him with the board. A side room's door is open behind them.
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
He puts his hand on your shoulder. The whole table sees it.
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
And somebody at the dip under it, by their sign. Two somebodies.
~ objective = "Get closer"
~ objective_target = "rival-line:our-sign"
-> END

=== c2day9_friend ===
~ friend_seen9 = true
One of them's in a pale wrap, crouched on the far side of the dip. The other's on this side, on her knees, holding their hand through the gap.
Your friend.
She sees you, and lets go. The one in the pale wrap's gone, back into the dark on their side, before you can see a face. #leave:friend-rival:900:90
"Oh. Oh, no." #speaker:scav_friend
"You're not here. Tell me you're not here." #speaker:scavenger
"It's not what it looks like." #speaker:scav_friend
"It looks like you're holding hands with the other clan through the fence." #speaker:scavenger
"Then it's exactly what it looks like." #speaker:scav_friend
"Eight months. They're a picker, same as us. On their side. We found each other at the fence, and we kept coming back." #speaker:scav_friend
"They've never asked me a thing. Not where we dig. Not the board. Nothing. I swear it on my mother." #speaker:scav_friend
Then, behind you: boots on the track. The watcher, come to set the watch. #beside:watcher-line:-60:walk
~ watcher_at_line = true
She looks at you. She doesn't ask. She just looks.
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
~ objective = "After the scout"
~ objective_target = "scrap-stacks:scout-stacks"
-> END

// --- Night, the scrap stacks: the chase ---

=== c2day9_stacks ===
~ chase_seen = true
There. At the foot of the stacks. The small one, in the pale wrap, looking back at the noise you're making.
They go up the stacks like they were born on them. #hop:scout-stacks:540:250:500:180:470:112
~ objective = "Up after them"
~ objective_target = "scrap-stacks:view"
They're on the kid's perch, at the top. There's no way down the far side that isn't a long fall.
-> END

=== c2day9_cornered ===
~ scout_cornered = true
~ objective = ""
~ objective_target = ""
They're backed up to the edge of the perch, with the whole settlement below them, and a blade in their hand.
{dog_name} puts itself between you, low, growling. #bark:dog-follow:GRRR:growl
The scout looks at the dog, and their eyes go wide.
"A dog. A real one." #speaker:scout
{ drop_choice == "swap": -> c2day9_cornered_swap }
{ drop_choice == "leave": -> c2day9_cornered_leave }
-> c2day9_cornered_take

// You swapped the drop: they went to row five for nothing.
=== c2day9_cornered_swap ===
"Row five. That was you, wasn't it." #speaker:scout
"You sent us to dirt. We stood about in empty dirt half the day, and went back with nothing." #speaker:scout
"Do you know what they do to us, when we go back with nothing? Somebody's going to pay for row five." #speaker:scout
"Who wrote the note?" #speaker:scavenger
"Our contact on your side. The one who's paid in pale things." #speaker:scout
"And our contact's in trouble too, now. Because of you. They'll want to know who's been at their drop." #speaker:scout
They don't wait for you to answer. They come at you, blade first, careless with fury. #combat:scout_angry:c2day9_after_scout
-> END

// You watched them collect it: you know their face.
=== c2day9_cornered_leave ===
"I saw you. At the drop. Under the marker, yesterday morning." #speaker:scavenger
They go still.
"Then you saw nothing. I carry. I don't read." #speaker:scout
"Who writes them?" #speaker:scavenger
"I carry. I don't ask." #speaker:scout
You know how they move, now. Where they look before they jump. #combat:scout_known:c2day9_after_scout
-> END

// You took the note: they want it back.
=== c2day9_cornered_take ===
{ found_note:
    "Where is it? The note. Who's got it?" #speaker:scout
    "Not me. Not any more." #speaker:scavenger
    "Then who?" #speaker:scout
    You think of the boss's coat, and the inside pocket. You don't say.
    They don't believe you.
- else:
    "You. You've got it. The note." #speaker:scout
    Their eyes go to your satchel.
    "Give it here. You don't know what you're holding." #speaker:scout
}
They come for your satchel with both hands. #combat:scout_desperate:c2day9_after_scout
-> END

=== c2day9_after_scout ===
{ scout_won:
    They're down on the perch's planks, the blade gone over the edge, {dog_name}'s teeth an inch from their face.
- else:
    You're down. They've got their blade up, and then {dog_name} is between you, and they don't use it.
    They could run. They don't. They're looking at the dog.
}
They pull the wrap down off their face. Younger than you, with a burn down one cheek, breathing hard.
They look at your strap. The circle's mark, stitched into it.
"That mark. You're his." #speaker:scout
"Everyone says I'm his." #speaker:scavenger
~ c2day9 = "choice"
-> c2day9_choice

// Big choice 2 (design doc): turn them in to the watcher, or let them go.
=== c2day9_choice ===
"Well? Shout for them. That's what the watch is for." #speaker:scout #dim:on
+ [Take them to the watcher]
    ~ scout_choice = "turned_in"
    "Get up." #speaker:scavenger #dim:off
    -> c2day9_turned_in
+ [Let them go]
    ~ scout_choice = "let_go"
    "Get up. I'll walk you out." #speaker:scavenger #dim:off
    -> c2day9_let_go

=== c2day9_turned_in ===
At the foot of the stacks, you send {dog_name} home. Nobody in the settlement can see it now. #leave:dog-follow:16:120
~ dog_with_you = false
~ turnin9 = true
Then you walk the scout through the sleeping yard and the tally house, all the way to the compound. #goto:compound:60:232:c2day9_gate
-> END

=== c2day9_gate ===
The watcher's at the compound gate, as if he's been waiting up.
He looks at the scout a long time. Then at you.
"On your watch. Through the dip, like the old man said." #speaker:watcher
"They had two with them. They kept me busy. This one went for the settlement." #speaker:scavenger
"For the settlement. For who?" #speaker:watcher
"They wouldn't say." #speaker:scavenger
"They'll say to me." #speaker:watcher
He takes the scout by the arm, and stops, and says one more thing, low.
"You did the right thing tonight. Whatever they say in the yard tomorrow." #speaker:watcher
He takes them in through the gate, and it shuts behind them. #leave:watcher-gate:320:50 #leave:scout-gate:320:50
~ watcher_respect += 1
~ scout_held = true
-> c2day9_home_go

=== c2day9_let_go ===
~ letgo9 = true
You walk them down off the stacks, and out across the fields in the dark, all the way back to the line. {dog_name} trots between you. #goto:rival-line:540:232:c2day9_dip
-> END

=== c2day9_dip ===
At the dip, they stop.
"Why?" #speaker:scout
+ [Because it isn't me]
    "Because everyone on my side thinks I'm the one talking to you. And it isn't me." #speaker:scavenger
    "I know it isn't you. We'd know." #speaker:scout
+ [Because of the dog]
    "Because you looked at the dog like it was a miracle." #speaker:scavenger
    "It is a miracle. Do you know how long since anyone saw one?" #speaker:scout
- "Our contact's on your side. Somebody who gets paid in pale things, and writes your squares on hide." #speaker:scout
"I don't know who. I carry. But I know where they meet us, when it's more than a note." #speaker:scout
"Come to the cairn on our side, one night. Ask for me. I'll find out what I can." #speaker:scout
They go under the fence on their belly, and stand up on the far side, and look back once at the dog. #leave:scout-free:900:90
~ rival_trust += 1
~ scout_friend = true
-> c2day9_home_go

=== c2day9_home_go ===
~ c2day9 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
First light's not far off.
-> END

// --- Before dawn, the shack ---

=== c2day9_bed ===
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
    The other side has a contact on yours. Somebody paid in pale things. Somebody who reads the board.
}
{ boss_knows_dog:
    And the boss knows about the dog.
}
~ c2day9 = "done"
~ objective = ""
~ objective_target = ""
You lie down in your clothes, and don't sleep, and it's light. #wake:shack:382:184 #endday:Day 10
-> END
