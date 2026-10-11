// ============================================================================
// Chapter 2, Day 10: the reveal. Draft text from docs/sequences/chapter-2/part-4.md, for the designer to
// rewrite (designer: one dramatic day; the son turns; serve every choice; the brand at the tally house, in
// front of everyone; your friend, if you reported her, comes back calling you a traitor).
// Three nights after the line. Dawn at home (your brother and the kid, if he's still with you); the boss
// comes to meet the dog, and the dog knows him; your brother (the witness up the stacks, or the boss's men
// at your door); the yard (your friend, the gambler); the watcher (if he respects you); the cairn (if you
// let the scout go); night: the enforcer at your table, and the son; the tally house.
// The stages are in `c2day10` (main.ink): dawn, brother, yard, watcher, line, home, night, tally, done.
// ============================================================================

// --- Dawn, the shack ---

=== c2day10_start ===
~ c2day10 = "dawn"
~ dog_home = false
~ objective = ""
~ objective_target = ""
Three nights since the line. Three nights of nobody looking at you in the yard, and everybody watching.
{ scout_choice == "let_go":
    And a raid in the middle of them: the ditch, row nine, two nights back. Everybody knows you were out at the line that night. Nobody knows you let one of them go. Not yet.
- else:
    You brought one of them in. Half the yard believes you now. The other half says you'd sell your own mother to look clean.
}
{ brother_moved: -> c2day10_start_alone }
~ brother_dawn10 = true
The door bangs. Your brother, and the kid behind him, both white as ash. #sound:latch
"We saw him." #speaker:brother
"Saw who?" #speaker:scavenger
"At the dip, two nights ago. We were up the stacks. A big man, in a long coat, on his own. He went under the fence like he'd done it a hundred times." #speaker:brother
"Who was it?" #speaker:scavenger
"I'm not saying till I'm sure. You said. Not till we're sure." #speaker:brother
"He's going out again. We'll see his face this time. From the perch, in the light." #speaker:lookout
"No. Stay here. Both of you." #speaker:scavenger
They look at each other, the way boys do when they've already decided, and they're out of the door before you can catch hold of either of them. #leave:brother-dawn10:70:100 #leave:lookout-dawn10:70:110
-> c2day10_knock

=== c2day10_start_alone ===
The shack's quiet. Your brother's old blanket's still on his bed. You haven't moved it.
-> c2day10_knock

// The boss comes to you (so the dog stays out of sight of the town).
=== c2day10_knock ===
A knock. Not a runner's knock: slow, and heavy, and patient.
~ boss_visit10 = true
~ son_visit10 = true
The boss. In your doorway, in his long coat, with his son behind him carrying his stick.
"May I?" #speaker:boss
He doesn't wait. He has to stoop to get in. He looks round your shack like a man looking round a room he used to live in. #move:boss-shack10:150
{ boss_knows_dog:
    "Your brother can't stop talking about it. I thought I'd come and see for myself, before I go mad with wanting to." #speaker:boss
- else:
    { found_bed || found_bowl || found_hair:
        "The enforcer found a bed in here, last week. A bowl. Hair. He thinks it's for rats. I don't think it's for rats." #speaker:boss
    - else:
        { gambler_choice == "left":
            "Our friend at the den came to see me. Frightened man. He said you've a dog. I said, nonsense. Then I thought: but what if." #speaker:boss
        - else:
            "My son says you go out before it's light, with something low at your heels. My son sees a lot." #speaker:boss
            His son looks at the floor.
        }
    }
}
"A dog. Out here. Let me see it. I won't tell a soul. I keep secrets. It's what I'm for." #speaker:boss
~ objective = "Call " + dog_name
~ objective_target = "shack:floor-panel"
-> END

=== c2day10_call_dog ===
~ boss_growled10 = true
~ knows_boss = true
~ dog_home = true
You lift the panel. {dog_name} comes up out of the hole, low, and shakes itself, and looks at the stranger in its house. #beside:dog-home:20:walk
"Oh. Oh, look at you." #speaker:boss
He crouches, slowly, the way a big man does, and holds out his hand.
{dog_name} goes to it. Sniffs his fingers. His sleeve. His coat.
And stops.
Its hackles go up, all down its back. #shake
"Grrrrr..." #speaker:dog #bark:dog-home:GRRRR:growl #dim:on
You know that growl. You heard it in the deep ground, over the drop under the marker stone.
{ drop_choice == "take" && found_note:
    It's got its nose against his coat. The inside pocket. Where he put your note.
- else:
    The drop's scent. On him. On his hands, on his coat.
}
The boss doesn't move. Then he looks up at you, past the dog.
And for one moment his face isn't smiling at all.
He sees that you know.
"Dogs." #speaker:boss #dim:off
He laughs, and stands, and brushes his knees.
"Never trust a thing that won't take bread from you. Keep it close. Things like that are worth more than people, out here." #speaker:boss
{ scout_choice == "turned_in":
    "Oh. That scout you brought in. Slipped out of the watcher's cellar in the night. Door still locked. Isn't that strange." #speaker:boss
- else:
    "Oh. And that business at the ditch. They say you were out at the line that night. I told them you were on my business." #speaker:boss
}
He goes. #leave:boss-shack10:70:40
~ boss_visit10 = false
His son doesn't, not at once. He's looking at you. At the dog. At the door his father went out of.
"What did it smell?" #speaker:boss_son
You don't answer. He goes after his father. #leave:son-shack10:70:60
~ son_visit10 = false
~ c2day10 = "brother"
{ brother_moved: -> c2day10_circle_come }
~ stacks10 = true
~ objective = "Find your brother: up the stacks with the kid"
~ objective_target = "scrap-stacks:brother-perch10"
And your brother and the kid haven't come back. Up the stacks, watching for a face. #time:afternoon
-> END

// --- Afternoon: your brother (big choice 1) ---

// At home: the witness (design doc). He saw the boss meet the rivals, and he tells you before he's caught.
=== c2day10_perch ===
~ perch10_seen = true
They're flat on the perch's planks, the pair of them, looking down at the compound's back gate.
"Get down! He'll see you!" #speaker:lookout
You get down. Your brother's shaking, and it's not the cold.
"It's him. I saw his face. He came out the back gate with a bundle, and the kid saw what was in it." #speaker:brother
"Pale things. Like what they wear over there." #speaker:lookout
"It's the boss. The one at the dip. It was the boss." #speaker:brother
~ witness10 = true
You put your hand over his mouth. Too late. Somebody's coming up the ledges below. Two of the circle, and they're not climbing like men out for a look. #shake
~ circle_stacks10 = true
"Well. Look who's up here." #speaker:collector #name:One of the circle
"Boss wants a word with the little ones." #speaker:collector #name:One of the circle
{dog_name}'s not here. It's just you. #combat:circle_men:c2day10_after_perch
-> END

=== c2day10_after_perch ===
{ circle_won10:
    One goes over the edge of the ledge, and lands hard a long way down, and lies there moaning.
    And in the scramble your brother's foot goes off the planks.
- else:
    You're down on the planks, and one of them's got your brother by the collar, and he kicks, and he twists free, and his foot goes off the edge.
}
He falls. #shake #sound:crash #route:brother-perch10:fall:120
Two ledges. He lands wrong, and doesn't get up.
By the time you're down to him, there are more of them at the foot of the stacks, and they lift him between them, very gently, like they're doing him a kindness.
"He'll be seen to at the compound. Boss's orders." #speaker:collector #name:One of the circle
They carry him away, down the stacks. He's awake. He looks back at you the whole way. #route:brother-perch10:carried:60:leave #route:circle-stacks-1:carried:60:leave #route:circle-stacks-2:carried:60:leave
The kid's gone too, the way kids go. #route:lookout-perch10:dog-home:130:leave
~ brother_taken10 = true
-> c2day10_to_yard

// At the compound: the boss sends men for the dog, and your brother brings them, proud.
=== c2day10_circle_come ===
~ circle_shack10 = true
And then your brother's at the door. In his strap, with two of the circle behind him.
"I asked him! I asked the boss, and he said yes!" #speaker:brother
"Asked him what?" #speaker:scavenger
"To keep {dog_name} safe. At the compound. With me. Nobody'll ever find it there. These two are to help carry it." #speaker:brother
The two of the circle look past him, at the dog. One of them's got a sack.
"No." #speaker:scavenger
"It's the boss! He said!" #speaker:brother
"Step aside, girl." #speaker:collector #name:One of the circle
"Grrrr." #speaker:dog #bark:dog-home:GRRR:growl
{dog_name} comes and stands with you. #combat:circle_men_dog:c2day10_after_circle
-> END

=== c2day10_after_circle ===
{ circle_won10:
    They go back out of your door with the empty sack, and your brother between them.
- else:
    They've got the sack over {dog_name}'s head, and it twists, and bites, and it's out, and down the hole under the floor before they can get it back. They leave cursing, with your brother between them.
}
"You hit them. They're the boss's. You hit the boss's men." #speaker:brother
"He's not what you think he is." #speaker:scavenger
"You're just jealous! He said you'd be like this! He said!" #speaker:brother
He goes with them. He doesn't look back. #leave:brother-circle10:70:60 #leave:circle-shack-1:70:60 #leave:circle-shack-2:70:60
~ circle_shack10 = false
{ circle_won10:
    {dog_name} pushes its head under your hand, and leaves it there.
}
-> c2day10_to_yard

=== c2day10_to_yard ===
~ c2day10 = "yard"
~ yard10 = true
{ friend_choice == "covered":
    ~ friend_yard10 = true
- else:
    ~ friend_mother10 = true
}
~ gambler_yard10 = true
~ objective = "Go through the yard"
~ objective_target = "swap-yard:gambler-yard10"
You need to think. You need people round you. You go out to the yard. #time:afternoon
-> END

// --- Afternoon, the swap yard: the gambler, your friend ---

=== c2day10_yard ===
~ yard10_seen = true
The yard goes quiet when you come into it, and then louder than before.
{ gambler_choice == "left":
    -> c2day10_gambler_sold
}
-> c2day10_gambler_warns

// You walked away from him at the den: he's the one who sold you (design doc).
=== c2day10_gambler_sold ===
The gambler, crossing the yard, counting coins into his palm. Real coin. More than he's had in his life. #beside:gambler-yard10:30:walk
He sees you, and stops counting.
"You walked away. You stood there and watched them, and you walked away." #speaker:gambler
"What did you tell them?" #speaker:scavenger
"Everything. That you go out before it's light. That you've something with four legs. That you never declare the half of it." #speaker:gambler
"The enforcer pays well. Better than you ever did." #speaker:gambler
He goes, quickly, with his fist shut round the coin. #leave:gambler-yard10:552:70
~ gambler_yard10 = false
-> c2day10_friend_yard

=== c2day10_gambler_warns ===
The gambler, out of the den in daylight, which you've never seen. He comes straight at you, and grabs your arm. #beside:gambler-yard10:20:walk
"Not here. Listen." #speaker:gambler
"The enforcer's been at the den all morning, asking about a dog. Asking who's seen you with one." #speaker:gambler
"Nobody had. I said nobody had. But he's coming for you tonight, I heard him say it. Him and two more." #speaker:gambler
{ has_chain:
    "You've still got my chain? Good. Keep it on your wrist tonight." #speaker:gambler
}
"I owe you. Don't make me pay it at your funeral." #speaker:gambler
He's gone into the crowd before you can thank him. #leave:gambler-yard10:552:70
~ gambler_yard10 = false
-> c2day10_friend_yard

// Your friend (Day 9).
=== c2day10_friend_yard ===
{ friend_choice == "covered":
    Your friend, by the soup pot, not eating. She comes over like she's only passing. #beside:friend-yard10:24:walk
    "From them. Over there." #speaker:scav_friend
    "They say: keep off the lanes tonight. They say whoever's been selling us to them is done with you, and wants you gone." #speaker:scav_friend
    { scout_choice == "let_go":
        "They know it was you who let the small one go. They said to say thank you." #speaker:scav_friend
    - else:
        "They know you brought the small one in. They said: tell her it's not her we're angry with." #speaker:scav_friend
    }
    She squeezes your hand once, and goes back to the pot. #leave:friend-yard10:300:50
    ~ friend_yard10 = false
- else:
    -> c2day10_friend_mother
}
-> c2day10_after_yard

// You reported her (Day 9): she's been taken, and her mother's looking for her.
=== c2day10_friend_mother ===
A woman's going from stall to stall, asking everyone the same thing. Your friend's mother.
"Have you seen her? They took her to the compound, three days back. The circle came for her. They said somebody told the watcher." #speaker:picker #name:Her mother
She comes to you. She doesn't know it was you. She asks you too. #beside:friend-mother10:26:walk
"Have you seen her?" #speaker:picker #name:Her mother
+ [I'm sorry]
    "I'm sorry." #speaker:scavenger
    "Sorry for what?" #speaker:picker #name:Her mother
    You don't say. She moves on to the next stall. #leave:friend-mother10:900:40
+ [Say nothing]
    You shake your head. She moves on to the next stall. #leave:friend-mother10:900:40
- -> c2day10_after_yard

=== c2day10_after_yard ===
{ watcher_respect >= 2:
    ~ c2day10 = "watcher"
    ~ watcher10 = true
    A runner, at your elbow. Not one of the boss's. One of the watcher's. #beside:runner10:24:walk
    "He wants you. The compound. Quiet." #speaker:picker #name:A runner
    ~ objective = "See the watcher"
    ~ objective_target = "compound:watcher-10"
    -> END
}
-> c2day10_evening

// --- Afternoon, the compound: the watcher (if he respects you) ---

=== c2day10_watcher ===
~ watcher10_seen = true
~ watcher_ally = true
He's by the tribute shed, with the board under his arm, as if he's only carrying it somewhere.
"Walk with me." #speaker:watcher
"The board's been copied. Every square, every night. There's chalk dust on the back of it where somebody's laid hide over it and rubbed." #speaker:watcher
{ drop_choice == "swap":
    "And since the boss started taking the squares himself, the raids have only hit squares he's been told." #speaker:watcher
}
{ scout_choice == "turned_in":
    "And the one you brought me. Gone out of a locked cellar. I've one key. He has the other." #speaker:watcher
}
He doesn't say the name. Neither do you.
"I've thought it. I haven't said it. I've served that man twenty years." #speaker:watcher
"Then don't say it. But don't stand in front of me when it comes." #speaker:scavenger
He looks at you a long time, the way he looks at everything. Then he nods, once. #leave:watcher-10:400:40
~ watcher10 = false
-> c2day10_evening

// --- Evening: the cairn (if you let the scout go), or home ---

=== c2day10_evening ===
{ scout_choice == "let_go":
    ~ c2day10 = "line"
    ~ objective = "Fetch " + dog_name
    ~ objective_target = "shack:floor-panel"
    Three nights. No moon tonight. The cairn, and the dip, and whoever comes through it alone. #time:evening
    You'll want {dog_name}. It knows his scent better than you know his face.
    -> END
}
~ c2day10 = "home"
~ night10 = true
~ objective = "Go home"
~ objective_target = "shack:door"
There's nothing left to do but go home, and bar the door, and wait. #time:evening
-> END

=== c2day10_fetch_dog ===
~ cairn10 = true
~ dog_home = false
~ dog_with_you = true
You lift the panel. {dog_name} is up out of the hole before you've said its name. #beside:dog-follow:16
"Quiet work. Very quiet." #speaker:scavenger
~ objective = "Go out to the line: lie up by the post"
~ objective_target = "rival-line:post"
-> END

=== c2day10_line_arrive ===
~ line10_seen = true
The line, in the last of the light. Nobody on the post. Nobody anywhere. #time:night
~ objective = "Lie up on the post"
~ objective_target = "rival-line:post"
-> END

=== c2day10_lie_up ===
~ lying_up10 = true
~ objective = ""
~ objective_target = ""
You lie flat on the post's planks with {dog_name} pressed against you, and wait.
Their fires, far off. Wind in the wire. Your heart.
Then {dog_name}'s ears go up. It doesn't growl. It goes very, very still.
~ boss_at_line10 = true
Somebody's coming along the track from the fields. Big. A long coat. No lamp. #route:boss-line10:boss-in:55
He walks right under the post. You could drop a stone on his head.
He goes down into the dip, and under the fence, like he's done it a hundred times.
~ boss_crossed10 = true
~ objective = "Get closer"
~ objective_target = "rival-line:our-sign"
-> END

=== c2day10_cairn ===
~ cairn10_seen = true
~ cairn_meet10 = true
You get as close as the wire, and lie flat behind your own clan's sign.
At the cairn on their side, he's crouched with two of them, by their fire. And the scout.
He hands over a scrap of hide. The square, and the time. Somebody's square. Tomorrow's.
They hand him a bundle. Pale cloth, pale things, like the fence gets offered.
And then he says something you can't hear, and holds out his hand, and waits.
One of them puts something in it. Small. A plait of pale hair, tied with thread.
He holds it against his face, a long time. #dim:on
Then he puts it away inside his coat, and comes back to the fence. #route:boss-line10:boss-out:55:leave #dim:off
~ boss_at_line10 = false
He passes so close to the sign you could touch his coat. {dog_name} shakes, and doesn't make a sound.
~ scout_cairn10 = true
When he's gone, the scout comes to the wire. They knew you'd be there. #beside:scout-cairn10:40:walk
"Now you've seen." #speaker:scout
"Whose hair was that?" #speaker:scavenger
"His daughter's." #speaker:scout
~ knows_why = true
"Years back, when your clan and mine made the truce, he gave her to us. To seal it. A boss's own child, so nobody would break it." #speaker:scout
"She's alive. She's grown. Our boss keeps her, and every time yours wants to see a lock of her hair, he brings us your squares." #speaker:scout
"Every secret he sells keeps her breathing." #speaker:scout
"And you're the one he's picked to hang for it. Like the girl before you." #speaker:scout
"We'd rather you didn't hang. Remember who told you." #speaker:scout
They go back into the dark. #leave:scout-cairn10:900:70
~ scout_cairn10 = false
~ cairn10 = false
~ c2day10 = "home"
~ night10 = true
~ objective = "Go home"
~ objective_target = "shack:door"
-> END

// --- Night, the shack: the enforcer, and the son (designer: the son turns) ---

=== c2day10_night ===
~ night10_seen = true
~ dog_with_you = false
~ enforcer_night10 = true
~ dog_home = true
~ dog_with_you = false
The door's open. It was shut when you left. #time:night
The enforcer's sitting at your table, in the dark, with two of the circle standing behind him.
{dog_name} comes up out of the hole under the floor, and sees them, and stands between you and them. #beside:dog-home:20:walk
"There she is." #speaker:enforcer
"The boss says you're the rat. He's got the proof." #speaker:enforcer
{ found_note:
    "A rival note, out of your own satchel. Your square, and midday, in their signs." #speaker:enforcer
- else:
    { has_note:
        "And a rival note, in your satchel, to prove it." #speaker:enforcer
        He's holding it up. He went through your things while you were out.
    - else:
        { found_bed || found_bowl || found_hair:
            "A bed for a dog, under a rat's roof. The whole yard'll believe that." #speaker:enforcer
        - else:
            { gambler_choice == "left":
                "The gambler's word. Told me everything, for a fistful of coin." #speaker:enforcer
            - else:
                "His word. That's proof enough round here." #speaker:enforcer
            }
        }
    }
}
"And he wants the dog. Somewhere safe, he says." #speaker:enforcer
He stands up. He's bigger standing.
~ son_night10 = true
"No." #speaker:boss_son
The son, in your doorway. No stick to carry for anybody now. A length of pipe.
"Go home, boy." #speaker:enforcer
"I've watched her for weeks. I followed her before it was light, I sat at the foot of the stacks, I told my father every time." #speaker:boss_son
{ spar_won:
    "She beat me in front of the whole bar, and I wanted it to be her. I wanted it so much." #speaker:boss_son
- else:
    "I put her on her back in front of the whole bar, and I still wanted it to be her." #speaker:boss_son
}
"Three nights ago I watched him instead." #speaker:boss_son
"He went under the fence at the dip. My father. He's been selling us to them for years." #speaker:boss_son
"And he sends you to hang her for it. And you go." #speaker:boss_son
The enforcer looks at him a long time.
"You don't know what you're saying." #speaker:enforcer
"I know what I saw." #speaker:boss_son
He comes and stands beside you. On your other side, {dog_name}, growling. #beside:son-night10:-24:walk
"Then you can hang with her." #speaker:enforcer #combat:enforcer_night:c2day10_after_night
-> END

=== c2day10_after_night ===
{ enforcer_won:
    The enforcer goes down across your table, and the table goes with him, and he doesn't get up. #shake #sound:crash
    For one breath it's quiet. The son looks at you. You look at him.
    Then torches in the lane. Shouting. Half the circle, and half the yard behind them, woken by the noise.
- else:
    You're on the floor with the enforcer's knee in your back. The son's beside you, the same, his pipe kicked away into the corner.
    And torches in the lane. Half the circle, and half the yard behind them.
}
{dog_name} goes for the nearest leg in the door, and bites, and then it's out between their feet and into the dark. #leave:dog-home:-30:150
~ dog_home = false
~ dog_ran10 = true
Nobody catches it. Nobody even sees which way it went.
They take you by the arms. They take the son by the arms too, and he lets them, and he looks at nobody.
"Tally house. Now. Everyone's to see." #speaker:enforcer
~ enforcer_night10 = false
~ son_night10 = false
~ c2day10 = "tally"
~ brand_night = true
~ friend_back10 = friend_choice == "reported"
~ brother_brand10 = brother_moved
They walk you up the lane, through the yard, with the whole settlement coming out of their doors to watch. #goto:tally-house:120:236:c2day10_tally
-> END

// --- Night, the tally house: in front of everyone (designer) ---

=== c2day10_tally ===
The tally house is full. Fuller than tribute night. Every picker in the settlement, packed to the walls.
The boss is at the counter, under the lamp, where the tallyman prices the finds. He looks tired, and sad, and kind.
"I took her in. I fed her. I gave her my strap, and a seat at my table." #speaker:boss
"And she sold you. Every one of you. Every raid. The mast, the wells, the ditch." #speaker:boss
The crowd moves like water. Somebody spits. #sound:jeer
{ brother_moved:
    Your brother's at the boss's side, in his strap. He's crying. He won't look at you.
- else:
    Your brother isn't here. They took him up to the compound to be "seen to", and nobody's said a word about him since.
}
The son's held between two men by the door. His father hasn't looked at him once.
{ watcher_ally:
    The watcher's by the counter with the board. He's not looking at you. He's looking at the boss.
}
{ friend_back10: -> c2day10_friend_back }
-> c2day10_sentence

// Designer: if you reported her, she comes back calling you a traitor; now you know what was happening, it's on you.
=== c2day10_friend_back ===
And somebody pushes through to the front. Your friend. #beside:friend-brand:22:walk
They let her go, then. Her lip's split, and there's a bruise up one side of her face the shape of a hand.
"Traitor!" #speaker:scav_friend #shake
"You gave me to the watcher for holding somebody's hand through a fence. And all that time it was you!" #speaker:scav_friend
"I didn't, it was never-" #speaker:scavenger
"Three days in the cellar! Three days they asked me where we dig! I never even knew!" #speaker:scav_friend
She spits at your feet. The crowd roars for her. #sound:roar
And you know now who it really was, and who it was never going to be, and you sent her there anyway.
-> c2day10_sentence

=== c2day10_sentence ===
The boss holds up his hand, and the tally house goes quiet.
"At first light. In front of everyone. The brand, and out past the tree's edge, like the last one." #speaker:boss
"And nobody here will feed her, or hide her, or speak her name again." #speaker:boss
He looks at you then. Only you. The same look as in your shack, when the dog growled.
He knows you know. And it's too late for it to matter.
~ c2day10 = "done"
~ objective = ""
~ objective_target = ""
They take you down to the tally house's cellar to wait for the light.
-> END

=== c2day10_not_now ===
Not now. Not today.
-> END
