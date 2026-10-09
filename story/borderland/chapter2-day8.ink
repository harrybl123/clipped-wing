// ============================================================================
// Chapter 2, Day 8: digging. Draft text from docs/sequences/chapter-2/part-3.md, for the designer to rewrite
// (designer: rough structure first, then playtest; a variety of locations). You dig for the truth while they
// dig into you. Dawn: the son waiting at the foot of the scrap stacks (over the top, or a fight); the hollow;
// the deep ground with the dog, where the raiders come in from: the other clan's drop, with your square from
// the board in it, and the vanished girl's bead; its guards (a fight, with the dog); the drop (medium choice);
// midday in the yard, what came of it; the enforcer searching your shack; the madam, and the bead.
// The stages are in `c2day8` (main.ink): dawn, hollow, deep, noon, search, brothel, home, done.
// ============================================================================

// --- Dawn, the shack: out the back ---

=== c2day8_start ===
~ c2day8 = "dawn"
~ stacks8 = true
~ objective = "Get to the hollow"
~ objective_target = "scrap-stacks:to-swap-yard"
First light. You go out the back, through the loose sheet, so the yard doesn't see you go.
Last night you put your sign in { board_mark == "hull": the hull, row two| the ditch, row nine}. You're not going anywhere near it.
The old scavenger said the raiders came at the wells from the east. The deep ground's east. Past the sunk town, further than you've ever had a reason to go.
-> END

// Into the stacks: he's waiting for you.
=== c2day8_stacks ===
~ son_met8 = true
~ son_waiting = true
Somebody's at the foot of the stacks, between you and the yard. Pacing.
The boss's son. Up before light, for once in his life, and watching the alleys.
{ spar_won:
    He's been waiting to find out where you go since the night you put him on the bar's floor.
- else:
    He won the wager. He's still not satisfied with the answer.
}
You're not going past him on the ground. Over the top, then. The stacks, the bridge, and down the far side.
~ objective = "Get past him unseen"
-> END

// Over the top and down the far side: he never saw you.
=== c2day8_slipped ===
~ son_waiting = false
~ son_slipped = true
Down the far side, quiet as you can. Behind you, he's still watching the wrong alley.
-> c2day8_to_hollow

// He saw you.
=== c2day8_caught ===
~ son_waiting = false
~ son_confront = true
"There you are." #speaker:boss_son #beside:boss-son-dawn:30
He's got a length of pipe in one hand. He doesn't hide it.
"Every morning. Before it's light. Out the back like a thief." #speaker:boss_son
"Three raids, and you're never where you say. My father won't hear a word against you. So I'll find out for him." #speaker:boss_son
"Where are you going?" #speaker:boss_son
+ [Home. Out of my way]
    "Home. Get out of my way." #speaker:scavenger
    "You've just come from home." #speaker:boss_son
+ [Follow me and find out]
    "Follow me and find out." #speaker:scavenger
    "That's the idea." #speaker:boss_son
- No crowd this time. No wager. Nobody to shout odds. #combat:son_rematch:c2day8_after_son
-> END

=== c2day8_after_son ===
{ rematch_won:
    He's down among the scrap, holding his arm. The pipe's rolled away under a tower.
    "Go home." #speaker:scavenger
    He gets up, and goes, and doesn't look back. He didn't see where you were headed. #leave:boss-son-dawn:16:60
- else:
    ~ son_saw = true
    You're down in the dirt. He stands over you a while, getting his breath.
    "Go on, then. Wherever it is." #speaker:boss_son
    He lets you up, and he watches you go, all the way to the end of the alley. He'll know you went towards the fields. #leave:boss-son-dawn:16:50
}
-> c2day8_to_hollow

=== c2day8_to_hollow ===
~ c2day8 = "hollow"
~ objective = "Get to the hollow"
~ objective_target = "dogs-hollow:dog"
-> END

// --- The hollow, then out to the deep ground ---

=== c2day8_hollow ===
~ going_deep8 = true
~ dog_with_you = true
~ first_light = true
~ c2day8 = "deep"
~ objective = "Go out to the deep ground with " + dog_name
~ objective_target = "sunk-town:to-deep-ground"
{dog_name} comes up out of the hollow at a run, and stops, and smells your hands, your boots.
"Sniff sniff." #speaker:dog
"I know. I know. Not the sunk town today. Further." #speaker:scavenger
"Through the sunk town, and out the other side. Where they come in from." #speaker:scavenger
-> END

=== c2day8_deep_arrive ===
~ deep_arrived = true
~ seeking8 = true
~ objective = "Follow " + dog_name
~ objective_target = "deep-ground:dig-spot"
The deep ground. Hard, flat, and long, cut with grooves as straight as a ruler, going on towards nothing.
Nobody digs here. There's nothing to dig.
{dog_name} puts its nose down, and its tail goes up, and it's off along the grooves at a trot.
"Sniff... sniff sniff." #speaker:dog
Somebody's been along here. A lot of somebodies. Often.
{ told_where == "deep":
    The son was right about one thing. Pale threads, caught on the old wire.
}
-> END

// The dog digs at the foot of the fallen marker stone: the drop.
=== c2day8_drop ===
~ drop_found = true
~ seeking8 = false
~ has_bead = true
Under the fallen marker, a casing, buried a hand deep. Somebody's put it back carefully, more than once: the dirt's soft.
Inside: a scrap of hide, scratched with scavenger signs. And something small and bright rolling about loose.
The signs first. A square of the fields.
{ board_mark == "hull":
    The hull. Row two.
- else:
    The ditch. Row nine.
}
And a sun, high. Midday.
Your square. The one you put your sign in last night, for the board. For the circle. Nobody else saw it.
Somebody who reads the board wrote it down, and brought it out here, for the other clan to find.
The bright thing is a bead. Blue glass, with a twist of copper wire through it. You've never seen glass that colour.
"Yip?" #speaker:dog
Then {dog_name} stops wagging, and turns to face the posts, and growls. #bark:dog-follow:grrr:growl
~ drop_guards_here = true
Two of them, pale wraps, staves, coming in from the posts at a walk. #beside:drop-guard-1:60:walk #beside:drop-guard-2:84:walk
They've seen the casing in your hands.
"That's not yours." #speaker:drop_guard
"Neither's the hull." #speaker:scavenger
They look at each other. Then at the dog. Then their staves come level. #combat:drop_guards:c2day8_after_guards
-> END

=== c2day8_after_guards ===
{ guards_won:
    They go back the way they came, the one helping the other, and they don't stop till they're past the posts. #leave:drop-guard-1:1400:90 #leave:drop-guard-2:1400:80
    They'll tell someone there was a girl at the drop. With a dog.
- else:
    You're on the ground, and {dog_name}'s standing over you, snarling, and they don't come any closer.
    They back off, staves up, all the way to the posts. They didn't get the casing. They were too busy looking at the dog. #leave:drop-guard-1:1400:60 #leave:drop-guard-2:1400:55
}
"Whine." #speaker:dog
The note's still in your hand. Your square, midday. The raid hasn't happened yet.
-> c2day8_drop_choice

// The medium choice (design doc): leave it, take it, or swap in a fake.
=== c2day8_drop_choice ===
+ [Put it back, and watch who comes for it]
    ~ drop_choice = "leave"
    -> c2day8_drop_leave
+ [Take it]
    ~ drop_choice = "take"
    ~ has_note = true
    You fold the hide into your satchel. Without it, they don't know where to go.
    And now you're the one carrying a note to the other clan, with your own square on it.
    -> c2day8_drop_done
+ [Scratch a different square on it]
    ~ drop_choice = "swap"
    You turn the hide over, and scratch the square out, and scratch another. Row five. Nobody's dug row five in years. Nobody'll be there.
    You bury it again, the way you found it.
    If they go to row five, the note was real. And whoever wrote it will know someone's been at their drop.
    -> c2day8_drop_done

=== c2day8_drop_leave ===
You bury it again, the way you found it, and lie flat behind the old sled with {dog_name} pressed against you.
It's a long wait.
~ scout_coming = true
Then someone. Small, quick, in a pale wrap, coming in from the posts at a jog. #beside:scout:330:walk
~ scout_seen = true
They kneel at the marker stone, and dig, and read, and go back the way they came, fast. They never once look towards the sled. #leave:scout:1400:110
Whoever reads the board, the other side has somebody to carry it.
-> c2day8_drop_done

=== c2day8_drop_done ===
~ c2day8 = "noon"
~ noon8 = true
~ objective = "Get back before you're missed"
~ objective_target = "sunk-town:to-picked-fields"
The sun's climbing. If you're seen coming back from this direction, with a dog, nothing you say will matter.
-> END

// Up out of the sunk town: the dog home.
=== c2day8_send_home ===
~ sent_home8 = true
~ dog_with_you = false
~ first_light = false
"Home. Go on." #speaker:scavenger
It goes, low and quick, and the fields swallow it. #leave:dog-follow:300:120
~ objective = "Go home"
~ objective_target = "swap-yard:to-shack"
-> END

// --- Midday, the swap yard: what came of the drop ---

// Home round the back, through the stacks: the yard's noise brings you out to it.
=== c2day8_noon_back ===
Out front, the yard's loud. Louder than it should be at midday. You go out to see. #goto:swap-yard:60:232:c2day8_noon
-> END

=== c2day8_noon ===
~ noon8_seen = true
~ noon8 = false
{ drop_choice == "leave": -> c2day8_noon_raid }
{ drop_choice == "take": -> c2day8_noon_quiet }
-> c2day8_noon_empty

=== c2day8_noon_raid ===
{ board_mark == "hull":
    The yard's full of it. They came at midday, to the hull, row two. Your square. #bark:swapper-1:The hull #bark:haggler:At midday
    There were pickers all over the hull. There always are. Somebody's lost an eye. #bark:swapper-2:Her square again
- else:
    The yard's full of it. They came at midday, to the ditch, row nine. Your square. #bark:swapper-1:The ditch #bark:haggler:Her square again
    Nobody was digging the ditch. Nobody got hurt. That's not what anybody's saying.
}
You knew. You let it happen, to find out who came. You found out.
-> c2day8_search_coming

=== c2day8_noon_quiet ===
The yard's quiet. The fields were quiet. People keep saying it, like they don't trust it. #bark:swapper-1:Nothing today #bark:haggler:Not yet
The note's in your satchel. Nobody came, because nobody knew where to go.
-> c2day8_search_coming

=== c2day8_noon_empty ===
The yard's laughing about it, a nervous kind of laughing. #bark:swapper-1:Row five #bark:haggler:Nobody digs row five
They came at midday, to row five. Stood about in the empty dirt, and went home.
Nobody hurt. And somebody, somewhere, is wondering why.
-> c2day8_search_coming

// The enforcer, coming up the yard with two of the circle's men.
=== c2day8_search_coming ===
~ c2day8 = "search"
~ searchers_coming = true
Then the yard goes quiet. The enforcer's coming up it, with two of the circle's men, and people are getting out of the way. #time:afternoon
They're heading for your door.
~ objective = "Get home first"
~ objective_target = "swap-yard:to-shack"
-> END

// --- Afternoon, your shack: the search ---

=== c2day8_search_start ===
~ search_started = true
~ evidence8_left = 3
~ ev_bed = true
~ ev_bowl = true
~ ev_hair = true
{ has_note:
    ~ evidence8_left = 4
    ~ ev_note = true
}
~ objective = "Hide the dog's things"
~ objective_target = "shack:ev-bed"
You get the door shut behind you. Outside, the boots are coming up the yard.
{ brother_moved: -> c2day8_search_alone }
Your brother's at the table. He sees your face, and then he hears the boots.
"I'll keep them talking." #speaker:brother
He's in the doorway before you can stop him, arms out, talking loud: something about the boss, and his boots, and the kid. #move:brother-search:72
{ has_note:
    The dog's bed. Its bowl. The hairs all over the blanket. The note in your satchel. Quick. #when:evidence8_left:c2day8_search:26
- else:
    The dog's bed. Its bowl. The hairs all over the blanket. Quick. #when:evidence8_left:c2day8_search:20
}
-> END

=== c2day8_search_alone ===
Nobody's here to stall them.
{ has_note:
    The dog's bed. Its bowl. The hairs all over the blanket. The note in your satchel. Quick. #when:evidence8_left:c2day8_search:20
- else:
    The dog's bed. Its bowl. The hairs all over the blanket. Quick. #when:evidence8_left:c2day8_search:15
}
-> END

=== c2day8_hide_bed ===
~ ev_bed = false
~ evidence8_left -= 1
You stuff the sacking down the hole, on top of the dog. It doesn't make a sound.
-> c2day8_hide_next

=== c2day8_hide_bowl ===
~ ev_bowl = false
~ evidence8_left -= 1
The bowl goes in the fire's ash, upside down.
-> c2day8_hide_next

=== c2day8_hide_hair ===
~ ev_hair = false
~ evidence8_left -= 1
You turn the blanket over. Grey hairs on the other side, too. You turn it back, and sit on it.
-> c2day8_hide_next

=== c2day8_hide_note ===
~ ev_note = false
~ evidence8_left -= 1
The note goes inside your boot, flat against your foot.
-> c2day8_hide_next

=== c2day8_hide_next ===
{ evidence8_left > 0:
    ~ objective = "Hide the dog's things (" + evidence8_left + " left)"
- else:
    ~ objective = ""
}
{
- ev_bed: ~ objective_target = "shack:ev-bed"
- ev_bowl: ~ objective_target = "shack:ev-bowl"
- ev_hair: ~ objective_target = "shack:ev-hair"
- ev_note: ~ objective_target = "shack:ev-note"
- else: ~ objective_target = ""
}
-> END

=== c2day8_search ===
~ searchers_in = true
~ objective = ""
~ objective_target = ""
{ evidence8_left > 0:
    Too late. The door bangs open.
}
The enforcer comes in first, and the two of them after, filling the shack. #sound:boots
{ not brother_moved:
    Your brother's in the doorway behind them, white, still talking. Nobody's listening.
}
"The boss doesn't know we're here. Let's keep it that way." #speaker:enforcer
They turn the place over. Your kit, the water drum, the table that was a hatch.
{ ev_bed:
    ~ found_bed = true
    The enforcer picks up the dog's bed, and turns it over, and smells it.
    "What sleeps in this?" #speaker:enforcer
}
{ ev_bowl:
    ~ found_bowl = true
    One of them kicks the bowl. It skids across the floor.
    "Feeding something?" #speaker:enforcer
}
{ ev_hair:
    ~ found_hair = true
    The enforcer pinches a grey hair off your blanket, and holds it up to the light, and says nothing at all.
}
The enforcer stands on the loose panel. It creaks.
Under it, {dog_name} doesn't make a sound. Not one.
{ ev_note:
    -> c2day8_search_note
}
{ found_bed || found_bowl || found_hair:
    "You keep something. I don't know what yet." #speaker:enforcer
- else:
    "Nothing." #speaker:enforcer
    The enforcer says it like it's worse than finding something.
}
-> c2day8_search_done

// They found the note: your square, in your shack.
=== c2day8_search_note ===
~ found_note = true
One of them tips out your satchel on the table. The note falls out with everything else.
The enforcer unfolds it, and reads the signs, slowly.
{ board_mark == "hull":
    "The hull. Row two. Midday." #speaker:enforcer
- else:
    "The ditch. Row nine. Midday." #speaker:enforcer
}
"Your square. In your satchel." #speaker:enforcer
"I took it off them. Off their drop, out on the deep ground. I was finding out who-" #speaker:scavenger
"The deep ground." #speaker:enforcer
The enforcer folds the note, very carefully, and puts it away.
"The boss will want to see this." #speaker:enforcer
-> c2day8_search_done

=== c2day8_search_done ===
They go, the way they came, and leave the door open behind them. #leave:enforcer-search:20:60 #leave:searcher-1:20:60 #leave:searcher-2:20:60
~ c2day8 = "brothel"
~ objective = "Ask the madam about the bead"
~ objective_target = "brothel:madam"
{ not brother_moved:
    Your brother comes and sits on the floor by the loose panel, and puts his hand flat on it. #move:brother-search:268
    "It didn't make a sound. Not one. Good dog." #speaker:brother
}
The bead's still in your pocket. Blue glass, copper wire. There was a girl last year, the madam said. Clever with finds, like you.
The light's going. #time:evening
-> END

// --- Evening, the brothel: the madam and the bead ---

=== c2day8_madam ===
~ saw_madam8 = true
"You've got a face on you like you've been dug up." #speaker:madam
You put the bead on her desk.
She doesn't touch it. She looks at it for a long time.
"Where?" #speaker:madam
+ [The deep ground]
    "The deep ground. Under a marker stone. With a note for the other clan." #speaker:scavenger
    ~ madam_told = true
    She closes her eyes.
+ [Somewhere I shouldn't have been]
    "Somewhere I shouldn't have been." #speaker:scavenger
    "That's where all the true things are." #speaker:madam
- "She wore that in her hair. The girl. She found it herself, out on the fields, and she wouldn't sell it, not for anything." #speaker:madam
"She was the boss's favourite. Clever with finds. Hauls like nobody'd seen. Then the raids started." #speaker:madam
"Wherever she'd been. Wherever she said she'd be. They said she was the one telling the other clan." #speaker:madam
"They marked her for a rat, at the tally house, in front of everybody. And they walked her out past the tree's edge, and told her not to come back." #speaker:madam
"Nobody does come back from past the edge." #speaker:madam
She pushes the bead back across the desk to you.
"You keep it. And you be careful whose hand's on your shoulder." #speaker:madam
~ madam_trust += 1
-> c2day8_hostess_word

// On the way out, the hostess: your friend's lie.
=== c2day8_hostess_word ===
The hostess catches your arm on your way out, and pulls you in close. #beside:hostess-1:16:walk
"Your friend. The one who says she's here, nights." #speaker:hostess
"She's not here. She hasn't been here in weeks. She goes out the back, past the stacks." #speaker:hostess
"I'm only telling you because you're in trouble, and she's your friend. Somebody should know where everybody is." #speaker:hostess
~ friend_lie_known = true
~ c2day8 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
-> END

// --- Night, the shack ---

=== c2day8_bed ===
It's dark. #time:night
~ search_started = false
You pull the dog's bed back up out of the hole, and shake it out.
{ brother_moved:
    The shack's empty. The door's still got a scuff where the enforcer kicked it.
- else:
    Your brother's asleep with one arm hanging down, his fingers resting on the loose panel.
}
You lie with the bead in your fist.
The girl last year was clever with finds. Then the raids started, wherever she'd been. Then they marked her, and walked her out past the edge.
Wherever she'd been. Wherever she said she'd be.
Somebody reads the board, and writes it down, and carries it out to the deep ground. They did it to her. They're doing it to you.
~ c2day8 = "done"
~ c2day9 = "morning"
~ objective = ""
~ objective_target = ""
You don't let go of it all night. #wake:shack:382:184 #endday:Day 9
-> END
