// ============================================================================
// Day 7: the mob. Draft text from docs/sequences/day-7.md, for the designer to rewrite.
// Stages in `day7` (main.ink): wake, carve, rite, visits (in custody) or goodbyes (at home), evening,
// open, mob, chase, fall, done.
// Two ways the day starts: in custody (you saved the girl: the cell behind the shrine) or at home under
// guard (you blamed her). Both reach the same fork (designer): up (fly: chased to the very top, into
// the tube) or down (fall: you give yourself up, and they throw you into the rot).
// ============================================================================

// --- Morning, in custody ---

=== day7_cell_wake ===
Grey light under the door. You slept sitting up against it, and every part of you aches.
The bolt goes back. A guard, with a block of wood under one arm, holding out a knife handle first, as if you might bite.
"Elders' orders. One bird, same as always. They want it for the rite." #speaker:guard
He puts them on the bench, sits down on the stool by the door, and doesn't take his eyes off you.
~ day7 = "carve"
~ objective = "Carve your offering"
~ objective_target = "shrine-cell:bench"
-> END

// --- Morning, at home under guard ---

=== day7_mum_morning ===
{ day7_mum_morning > 1: -> again }
Mum's already up. She hasn't slept either.
There's a guard outside the door. You can see the shadow of his boots under it, not moving.
"You're to carve, and he's to walk you to the rite. Like a prisoner. In your own home." #speaker:mum
"I heard what you said last night. About the girl." #speaker:mum
+ [Hide it: "I said what kept me alive."]
    "You told me to say whatever kept me alive." #speaker:you
    "I know I did." She looks away. "I know." #speaker:mum
+ [Joke about it: "At least I'm home for breakfast."]
    "At least I'm home for breakfast." #speaker:you
    There isn't any breakfast. She doesn't point it out.
+ [Voice it: "I'm ashamed of it."]
    "I'm ashamed of it." #speaker:you
    "Good. That means you're still you." #speaker:mum
- -> END
= again
"Carve, love. Let's get through today." #speaker:mum
-> END

// --- The last bird (both paths: the normal carving, designer) ---

=== day7_bench ===
{ in_custody:
    A block of wood, a knife, and the guard's eyes on the back of your neck.
- else:
    Your bench. Through the shutters, the guard's shoulder, outside the door.
}
+ [Carve]
    You sit down to it. #carve:day7_carving
+ [Not yet]
- -> END

=== day7_carving ===
Your hands know what to do, even now. That's the worst of it. They don't know they're in trouble.
{ in_custody || plate_found:
    No plate this time. You shave a sliver off the block, thin as a fingernail, to scratch on instead.
- else:
    You take his plate out from under the loose board, and turn it over to its clean side.
}
There's nobody left to ask for help but him. So you scratch the only thing that's true: a bird, in a cage. #plate:caged
~ reply5 = "caged"
Small. As small as you can make it. #step:scratch
A fledgling. The clipped wing. #step:rough
Hollow it, gently. #step:hollow
In it goes. The plug goes in after it. #step:seal
The wing. The eye.
-> carve_verdict ->
~ day7 = "rite"
~ objective = "Go with the guard"
{ in_custody:
    ~ objective_target = "shrine-cell:guard-cell"
- else:
    ~ objective_target = "home:guard-door"
}
"Done? Up, then. They're waiting." #speaker:guard #end
-> END

// --- The guard ---

=== day7_guard ===
{
- day7 == "rite": -> day7_to_rite
- day7 == "evening": -> day7_to_ceremony
- day7 == "goodbyes": -> ready
- day7 == "carve" && in_custody: -> carve_cell
- day7 == "carve": -> carve_home
- day7 == "visits": -> waiting
}
He looks at the wall over your head.
-> END
= carve_cell
{"Carve. I'm not here to talk."|"I said carve."|"The sooner it's done, the sooner I'm out of this room."} #speaker:guard
-> END
= carve_home
{"Get on with it. They want it at the rite."|"I don't like this any more than you do. Carve."} #speaker:guard
-> END
= waiting
{"Don't look at me like that. I've got a family too."|"It's not up to me. None of it's up to me."|"They say the baskets'll come down full again, once it's done with. You'd better hope so."} #speaker:guard
-> END
= ready
"Ceremony's at dusk. Say when." #speaker:guard
+ [Go to the ceremony]
    ~ day7 = "evening"
    "Now, then." #speaker:you
    He looks at you as if he'd rather be anywhere else. "Walk in front." #speaker:guard #time:evening
    -> day7_to_ceremony
+ [Not yet]
    -> END

=== day7_to_rite ===
~ trial = true
{ in_custody:
    He ties your hands in front of you, loosely, so you can carry the bird.
- else:
    He looks at the bird, then at you. "Walk in front." #speaker:guard
}
They're all there. Every family in the roots, on the offering floor, at dawn. #goto:offering-floor:104:236:day7_trial
-> END

// --- The rite: the trial ---

=== day7_trial ===
The whole of the roots is on the floor, and nobody is talking.
Up on the landing, beside the Tender, two of the elders. The preacher stands on the stairs below them, where everyone can see him.
"Carver. Come up." #speaker:elder_amber
You climb the stairs with the bird in your hands. A hundred eyes, every step.
"The Tree has refused this child's birds five times. And every time, our baskets have come down lighter." #speaker:preacher
"So today we ask the Tree directly. In front of everyone." #speaker:preacher
An elder holds up a cage, a little thing of bent wire, like the ones the upper branches keep songbirds in. #show:caged-bird
They take your bird out of your hands and shut it inside. The latch clicks.
{
- carve_flaws >= 5: The preacher holds the cage up high, so the floor can see. "Look at it. Hacked about. Is that an offering, or an insult?" #speaker:preacher
- carve_flaws < 2: The pale-robed elder peers in at it. "It's good work. That's what I don't understand." #speaker:elder_pale
}
"If the Tree takes it, the carver is clean, and we'll all beg the carver's pardon." #speaker:elder_amber
"If it comes back, we'll know what the carver is." #speaker:elder_cyan
+ [Hide it: bow your head]
    You bow your head, the way you're supposed to.
+ [Joke about it: "And if it gets stuck halfway?"]
    ~ suspicion += 1
    "And if it gets stuck halfway?" #speaker:you
    Nobody laughs. Somebody at the back spits.
+ [Voice it: "It isn't a trial. You've already decided."]
    ~ suspicion += 1
    "It isn't a trial. You've already decided." #speaker:you
    The preacher smiles at you, as if you'd said something kind.
- The Tender lifts the cage into the mouth of the tube. He won't look at you. His hands are shaking.
The light takes it. Up it goes, the little cage, turning, smaller and smaller, and gone. #flash:cyan #move:caged-bird:240:-40
Inside it, folded in the dark, is your bird. And inside that, a bird in a cage, scratched as small as you could make it.
"Now we wait for the evening. Then we'll know." #speaker:elder_amber #hide:caged-bird
~ trial = false
{ in_custody: -> custody | -> home }
= custody
~ day7 = "visits"
~ objective = "Wait"
~ objective_target = ""
They take you back to the room behind the shrine, and bolt the door. #time:afternoon #goto:shrine-cell:250:236:day7_cell_afternoon
-> END
= home
~ day7 = "goodbyes"
~ archivist_goodbye = told_archivist
~ objective = "Talk to Mum"
~ objective_target = "home:mum"
The guard walks you home, and takes up his place outside the door again. #time:afternoon #goto:home:130:236
-> END

// --- The afternoon, in custody: visitors ---

=== day7_cell_afternoon ===
The afternoon goes by in the strip of light under the door.
Then voices outside. The guard, arguing with someone. A woman's voice, not giving up.
The bolt goes back. #show:mum-cell
~ objective = "Talk to Mum"
~ objective_target = "shrine-cell:mum-cell"
-> END

=== day7_mum_cell ===
She doesn't say anything at first. She takes your face in both hands and looks at it, as if she's checking it's all there.
"They said I could have a moment. A moment! I'm your mother." #speaker:mum
"You told the elders there's something beyond the Tree. Is it true?" #speaker:mum
+ [Hide it: "I said it to save her."]
    "I said it so they'd let the girl go." #speaker:you
    "That isn't what I asked." #speaker:mum
    But she doesn't ask again.
+ [Joke about it: "Well, it got me my own room."]
    "Well. It got me my own room." #speaker:you
    She laughs, and it turns into something else halfway, and she has to stop.
+ [Voice it: "Yes. I think it is."]
    "Yes. I think it is." #speaker:you
    She's quiet for a long time.
    "Your grandmother used to say the tube had two ends." #speaker:mum
    "I always thought she meant the Tree's end, and ours." #speaker:mum
- "Whatever happens tonight..." #speaker:mum
She can't finish it. She presses something into your hand: a heel of bread, wrapped in a cloth.
"Eat it. Don't argue with me. Not today." #speaker:mum
"Time." The guard, at the door. #speaker:guard
She goes. She looks back twice. #hide:mum-cell
-> day7_next_visitor

// Who comes next: the archivist if he's your ally, then your friend if you confided in him (designer).
=== day7_next_visitor ===
{
- told_archivist && not day7_archivist_cell: -> archivist
- confided && not day7_friend_cell: -> friend
- else: -> day7_cell_dusk
}
= archivist
Later, the bolt again. You don't expect the man behind it. #show:archivist-cell
He sends the guard out with a look. The upper branches can do that. #hide:guard-cell
~ objective = "Talk to the archivist"
~ objective_target = "shrine-cell:archivist-cell"
-> END
= friend
Later, someone calls the guard out into the shrine. The bolt goes across behind him. #hide:guard-cell
And the moment it does: a scrape, under the floor. Someone's down in the back routes, under the grate. #show:friend-cell
~ objective = "Go to the grate"
~ objective_target = "shrine-cell:friend-cell"
-> END

=== day7_archivist_cell ===
The archivist, out of breath from the stairs. He looks wrong down here, like a lamp in a cellar.
"I told them I had to take your statement, for the archive. It's even true." #speaker:archivist
He sits on the guard's stool and lowers his voice.
-> day7_archivist_talk ->
He stands, tugs his coat straight, and is an upper-branches man again.
"Statement taken." #speaker:archivist #hide:archivist-cell
The guard comes back in, scowling, and sits down by the door. #show:guard-cell
-> day7_next_visitor

=== day7_friend_cell ===
Your friend's face, pressed to the grate from below, white in the dark.
"I came up through the routes. I didn't know they went everywhere." #speaker:friend
-> day7_friend_talk ->
Something moves in the tunnel behind him. He's gone, as quietly as he came. #hide:friend-cell
-> day7_next_visitor

=== day7_cell_dusk ===
The light under the door turns from grey to amber. The bolt; the guard, back on his stool. #show:guard-cell
Outside, feet. A lot of them, all going the same way: down, to the offering floor.
~ day7 = "evening"
~ objective = "Go with the guard"
~ objective_target = "shrine-cell:guard-cell"
"Up. They want you to see this." #speaker:guard #time:evening
-> END

// --- The afternoon, at home: goodbyes, in your cloak ---

=== day7_mum_goodbye ===
{ day7_mum_goodbye > 1: -> again }
"He's watching the front. Not the back." She doesn't look at the gap by the rot. She doesn't need to. #speaker:mum
"Pull your hood up. Go and see whoever you need to see. While you can." #speaker:mum
+ [Hide it: "I'm not going anywhere."]
    "I'm not going anywhere, Mum." #speaker:you
    "Yes, you are. One way or another." #speaker:mum
+ [Joke about it: "Are you throwing me out?"]
    "Are you throwing me out?" #speaker:you
    "Somebody has to." She tries to smile. #speaker:mum
+ [Voice it: "What if it comes back tonight?"]
    "What if it comes back? The cage?" #speaker:you
    "Then it comes back." She holds you, hard. "And you'll still be mine." #speaker:mum
- { confided: Your friend. You could knock on his window, from the back routes. }
{ told_archivist: The archivist. Up the trunk climb, and in through the hatch. }
~ objective = "Say your goodbyes. The guard will take you to the ceremony"
~ objective_target = "home:guard-door"
-> END
= again
"Go on. Be back before he comes for you." #speaker:mum
-> END

=== day7_friend_window ===
{ day7_friend_window > 1: -> again }
{ confided:
    You knock. The shutter opens at once, as if he's been sitting right beside it. #show:friend-window
    "You! Everyone's saying... I didn't think I'd see you again." #speaker:friend
    -> day7_friend_talk ->
    His mother calls him from somewhere in the house. He closes the shutter, slowly. #hide:friend-window
- else:
    You knock. You can hear him on the other side. He doesn't open it.
    "Go away." Quietly. "Please. Just go away." #name:Your friend
}
-> END
= again
The shutter stays closed.
-> END

=== day7_archivist_goodbye ===
{ day7_archivist_goodbye > 1: -> again }
The archivist looks up from his desk, and goes white, and then comes round it quickly to pull you behind the drawers.
"You can't be here. Do you know what they'd do to me?" #speaker:archivist
"...I'm glad you came." #speaker:archivist
-> day7_archivist_talk ->
~ archivist_goodbye = false
"Now go, before the watch changes." #speaker:archivist
-> END
= again
"Go!" #speaker:archivist
-> END

// --- Shared: what the archivist found, and what your friend says (custody or home) ---

=== day7_archivist_talk ===
"I went through the Ascension records last night. Every master who's ever gone up the tube, back to the very first. Name, mark, the day they went up." #speaker:archivist
"And nothing after. Not one word. Not ever. As if they stopped being anything the moment the gate shut." #speaker:archivist
"The last one's mark. You'll have seen it." #speaker:archivist #inset:spiral
The spiral. Cut into the master's last carving, the night of the Ascension.
+ [Hide it: "It's just a mark."]
    "It's just a mark. Plenty of carvers use a spiral." #speaker:you
    "Do they? Name one." #speaker:archivist
+ [Joke about it: "So they're all up there having a feast."]
    "So they're all up there having a feast, and nobody thought to write home." #speaker:you
    He almost smiles.
+ [Voice it: "What happens to them?"]
    "What happens to them, up there?" #speaker:you
    "That's what I'd like to know. I don't think the elders know either." #speaker:archivist
- "Whatever you decide tonight, decide it yourself. Not them. Not me." #speaker:archivist
~ archivist_trust += 1
->->

=== day7_friend_talk ===
"Everyone's saying you're mad. That you told the elders there's something beyond the Tree." #speaker:friend
"You told me, that night. About the messages. I never told anyone. I want you to know that. I never told." #speaker:friend
+ [Hide it: "I know you didn't."]
    "I know you didn't." #speaker:you
    He lets out a breath, as if he's been holding it for days.
+ [Joke about it: "Not even your mum?"]
    "Not even your mum?" #speaker:you
    "Especially not my mum." #speaker:friend
+ [Voice it: "Do you believe me?"]
    "Do you believe me? That there's something out there?" #speaker:you
    "I don't know." A long pause. "I want to. Does that count?" #speaker:friend
- "If anything happens tonight... I'll be there. I don't know how. But I will." #speaker:friend
~ friend_trust += 1
->->

// --- The evening: the cage comes back ---

=== day7_to_ceremony ===
~ trial = true
{ in_custody:
    They walk you down through the shrine with your hands tied.
- else:
    You walk out of your own front door ahead of him. Nobody on the floor looks surprised to see you.
}
The offering floor. #goto:offering-floor:104:236:day7_return
-> END

=== day7_return ===
The floor's fuller than this morning. People are standing on the stairs, on the baskets, on each other's shoulders.
Nobody's here for a blessing. They're here for the cage.
"A blessing, for the weavers." The Tender's voice cracks on it. #speaker:tender
One basket. Half full. Nobody even looks at it.
Then the tube goes dark. #flash:dark
And the cage drops into the basin, and your bird is still inside it. #show:caged-bird #shake
For a moment there's no sound at all.
Then all of it, at once. #recoil
"It came back! It came back!" #speaker:crowd_woman
"The Tree's answered! You heard the elders! Now we know what it is!" #speaker:crowd_man
"The Tree has spoken. This child is the rot in the root." #speaker:preacher
"Rot-hand! Rot-hand! Rot-hand!" #speaker:crowd #throw
+ [Hide it: cover your head]
    You cover your head with your arms, and make yourself small.
+ [Joke about it: "Best of three?"]
    "Best of three?" #speaker:you
    Nobody hears it. Nobody's listening to you any more.
+ [Voice it: "It doesn't mean what you think!"]
    "It doesn't mean what you think it means!" #speaker:you
    Nobody hears it. Nobody's listening to you any more.
- Something hits you. Then something else. #throw
The guards close round you. Not to hold you now. To keep you in one piece.
The Tender reaches into the basin, opens the cage, and holds out your bird, the way he always has. #hide:caged-bird
"It always comes back to you," he says, so quietly only you can hear. #speaker:tender
~ trial = false
~ day7 = "open"
~ objective = "Open the bird"
{ in_custody: -> custody | -> home }
= custody
~ objective_target = "shrine-cell:bench"
They drag you back up to the shrine and bolt the door, and the noise follows you all the way. #time:night #goto:shrine-cell:250:236:day7_cell_night
-> END
= home
~ objective_target = "home:hearth"
The guard gets you home with his staff held out in front of him. At the door he stops, and looks back at the floor, and walks away. #time:night #goto:home:130:236:day7_home_night
-> END

// --- Night: message 6 ---

=== day7_cell_night ===
No guard on the stool tonight. He's outside, with his back to the door, and from the sound of him he's afraid.
You can hear the roots, not far off. Roaring.
-> END

=== day7_home_night ===
Mum is at the shutters, watching the torches gather on the floor.
"Open it," she says, without turning round. "Whatever's in it. Quickly." #speaker:mum
-> END

=== day7_mum_night ===
"Quickly, love." She doesn't take her eyes off the torches. #speaker:mum
-> END

=== day7_open_bird ===
Your hands are shaking so much you nearly drop it.
The seam, under the wing. You work the plug out with the tip of the knife.
Your sliver of scratches is gone. In its place, a plate, black with soot, like all the others.
You start rubbing. #decode:message6:day7_decoded
-> END

=== day7_decoded ===
"Clipped wing, make yourself a master. Fly if you can, fall if you must. I will find you." #speaker:you
A master. The spiral on the master's last carving, the night of the Ascension, the whole tree singing them up the tube. Gone, and never a word after.
Fly if you can. Fall if you must.
He isn't telling you what to do. He's telling you there are two ways out, and he'll be waiting at the end of either one.
I will find you.
~ day7 = "mob"
~ objective = ""
~ objective_target = ""
{ in_custody: -> custody | -> home }
= custody
Outside, the roar comes closer, and closer, and stops. Right outside. #shake
"Burn it out! Burn out the rot!" #speaker:crowd
Fists on the shrine's front doors. Then something heavier. #shake
Under you, a scrape. The grate in the floor lifts an inch, falls back, and lifts again. #show:girl-cell
The girl's face, filthy, grinning up at you out of the dark.
"Told you I'd owe you." #speaker:girl
She heaves the grate aside.
"Come on. Half the roots is at the front doors, and the other half's on its way." #speaker:girl
"They went past your house on the way up. I didn't see your mum. I don't know. I'm sorry." #speaker:girl
Fly if you can. Fall if you must.
Up: the tube, and whatever's at the top of it. Nobody has ever come back down to say.
Down: the rot, where the tree throws everything it doesn't want.
"So. Where do you want to go?" #speaker:girl #dim:on
-> day7_fork
= home
Mum turns from the shutters.
"They're coming. All of them." #speaker:mum #shake
{ confided:
    Something bangs in the gap by the rot, and your friend tumbles out of it, black with dust. #show:friend-home
    "They're coming! Now! I ran the back way..." #speaker:friend
    "Where will you go? Up, or down? Tell me, and I'll help." #speaker:friend
- else:
    Through the gap in the shutters, the torches. And among them, near the front, a face you know. Your friend. He isn't shouting. He isn't stopping them, either.
}
"Whatever you do, go now. I'll talk to them." Mum, at the door, with her hand on the bar. #speaker:mum
Fly if you can. Fall if you must.
Up: the tube, and whatever's at the top of it. Nobody has ever come back down to say.
Down: the rot, where the tree throws everything it doesn't want.
Where do you go? #dim:on
-> day7_fork

// --- Big choice 3: the fork (designer: up is flying, down is giving yourself up) ---

=== day7_fork ===
- (choose)
+ [Up: fly if you can]
    Up. Up the trunk, all the way to the top, and into the tube. They'll be behind you every step.
    ++ [Yes. Up.]
        -> up
    ++ [No. Think again.]
        -> choose
+ [Down: fall if you must]
    Down. Walk out to them. Let them throw you down into the rot, and stop running.
    ++ [Yes. Down.]
        -> down
    ++ [No. Think again.]
        -> choose

= up
~ chased = true
~ girl_runs = in_custody
~ friend_helps = confided
~ day7 = "chase"
~ objective = "Climb. Get to the top"
~ objective_target = "ascension-gate:gate;back-routes:to-shrine;tenders-shrine:up-to-trunk"
"Up." #speaker:you #dim:off
{ in_custody: -> up_custody | -> up_home }

= up_custody
She looks at you for a long moment. Then she nods, as if she knew all along.
"Then up. Back through the routes and out of the shrine's own grate, while they're all at the front." #speaker:girl
"And I'm coming. To the top, anyway. Somebody has to see you off." #speaker:girl
She drops back into the dark, and you go down after her. #hide:girl-cell #goto:tenders-shrine:182:236:day7_shrine_escape
-> END

= up_home
{ confided:
    "Up. Right." He's pale, but he nods. "Through the routes and up the shrine's grate. Then the trunk. I'll go round by the stairs and slow them down." #speaker:friend
    He's gone back into the gap before you can thank him. #hide:friend-home
}
Behind you, the front door crashes in. You hear Mum's voice, raised, and then you're in the gap, and you can't hear her any more. #shake #goto:back-routes:120:232:day7_routes_escape
-> END

= down
~ day7 = "fall"
"Down." #speaker:you #dim:off
{ in_custody: -> down_custody | -> down_home }

= down_custody
"Down? Down where?" Then she understands. "No. No, you idiot. They'll throw you in the rot." #speaker:girl
"If I run, they'll take it out on someone. On you. On Mum." #speaker:you
"And if they throw me down there... he said he'd find me." #speaker:you
She stares at you. Then she laughs, once, and it's an awful sound.
"You're mad. You really are." #speaker:girl
"I'll find you too. Down there. Somehow." #speaker:girl
She lets the grate drop, and you're on your own. #hide:girl-cell
You go to the door, and knock, and wait for them to open it.
-> day7_given_up

= down_home
{ confided:
    "Down?" Your friend stares at you. "They'll kill you." #speaker:friend
    "They'll throw me in the rot. It isn't the same thing. I hope." #speaker:you
    He doesn't argue. He just holds on to your sleeve, until you take his hand off it. #hide:friend-home
}
-> day7_given_up

=== day7_given_up ===
{ in_custody:
    The bolt goes back. It isn't the guard. It's all of them.
- else:
    You lift the bar off the door. Mum grabs for your sleeve, and misses.
    "No. No, no, no..." #speaker:mum
    You step out into the torchlight.
}
For a moment, nobody moves. They came to drag you out, and you've walked out on your own.
"I'm the one you want." #speaker:you
Then they have you. Hands everywhere: on your arms, your collar, your hair. #shake
"Down! Throw it down! Down where the rot belongs!" #speaker:crowd
They carry you down. Through the roots, past doors you know, down the long stairs into the lower roots, with faces at every window.
To a boarded-up hole where a house once fell into the rot. They tear the boards up. Green light, and the smell.
{ girl_fate == "saved": Somewhere behind the crowd, someone's shouting your name. The girl. She can't get through. }
They throw you in. #flash:dark #goto:the-rot:100:232:day7_cast_down
-> END

// --- Fly: the chase to the very top (the `mob` feature follows your path, designer: platforming) ---

=== day7_shrine_escape ===
The shrine, dark. The front doors bow in on their bar, and through the gap: torchlight, and faces.
{ not confided: And among them, a face you know. Your friend, shouting with the rest. }
The way up is at the back, behind the dais. Run.
-> END

=== day7_routes_escape ===
The routes, dark and dripping. Up above, the whole roots is at your door.
The shrine's grate is at the top, at the far end. Nobody will be in the shrine tonight.
-> END

// The girl on the way up (in custody), if you stop to talk.
=== day7_girl_runs ===
{"Don't stop! Climb!"|"Talk at the top! Go!"|"They're right behind us!"} #speaker:girl
-> END

// The middle tiers: the guard at the post (a trigger as you reach it).
=== day7_middle_guard ===
~ guard_passed = true
{ friend_helps:
    The guard at the post steps out, staff up. And then someone comes tearing up the street behind him, yelling. #show:friend-chase
    "Down there! It went down the lift! Quick!" #speaker:friend
    The guard runs past you without a glance. #move:guard:20
    Your friend doesn't look at you. His hands are shaking. He sets off after the guard, still yelling, pointing the wrong way. #move:friend-chase:20
    Then they're both gone, down towards the trunk. #hide:guard #hide:friend-chase
- else:
    The guard at the post steps out, staff up. "Stop! Stop there!" #speaker:post_guard
    You duck under his staff, and he grabs at your cloak and gets a handful of nothing, and you're past.
}
-> END

// The Ascension gate: the gate guards have gone down to join the mob.
=== day7_gate ===
The gate. Up close it hums, a sound you feel in your teeth more than hear.
Behind you, the torches spill into the hall and stop at the foot of the steps. #shake
Nobody comes up. Nobody has ever set foot on the dais but the masters. Not even now.
"Come down! Come down from there!" #speaker:crowd
"Let it go. Let it go up, and let the Tree have it, and be done." #speaker:preacher
{ girl_runs: -> farewell }
-> edge
= farewell
The girl comes up the last of the steps behind you, bent double, getting her breath back.
"Well. This is it, then." #speaker:girl
+ [Hide it: "Come with me."]
    "Come with me." #speaker:you
    She looks at the light, and for a moment you think she will.
    "Somebody's got to stay down here and be a nuisance." #speaker:girl
+ [Joke about it: "Race you to the top."]
    "Race you to the top." #speaker:you
    She laughs, and it cracks halfway.
    "You'd cheat." #speaker:girl
+ [Voice it: "I'm scared."]
    "I'm scared." #speaker:you
    "Good. Means you're not as mad as they say." #speaker:girl
- She hugs you, hard and quick, and doesn't let go straight away.
"If you find him, tell him he owes me a feather." #speaker:girl
"Farewell, soldier." #speaker:girl
-> edge
= edge
The gate isn't locked. Nobody has ever needed to lock it.
Inside, light. Nothing but light, rushing upwards, so bright it has a sound. It pulls at your clothes, your hair, the red thread at your neck.
Mum at the bench, the night of your very first bird. "Hold it gently, like it might fly off."
The bird that came back, and back, and back.
Fly if you can.
+ [Jump]
- ~ chased = false
~ day7 = "done"
You don't have wings. You never did. You go anyway. #rise #flash:white #ending:fly
-> END

// --- Fall: the rot ---

=== day7_cast_down ===
You land in something soft and wet that gives under you like rotten fruit.
Above you, the square of torchlight, and faces looking down. Then the boards go back over the hole, and the hammering starts, and then there's only the green.
~ objective = "Find a way through"
{ girl_in_rot:
    ~ objective_target = "the-rot:girl-fallen;the-rot:crack"
    Somewhere further in, someone is breathing.
- else:
    ~ objective_target = "the-rot:crack"
}
The rot goes on into the dark, further than you went with her that first night.
-> END

// If you blamed her, she's been down here a day (designer: on bad terms).
=== day7_girl_in_rot ===
{ day7_girl_in_rot > 1: -> again }
She's sitting against the wall with her knees up, her sleeve still torn.
She sees who it is, and her face goes hard as bark.
"Get away from me." #speaker:girl
+ [Hide it: "I'm sorry."]
    "I'm sorry. I'm so sorry." #speaker:you
    "Sorry doesn't get me out of here. Sorry doesn't get my family their door back." #speaker:girl
+ [Joke about it: "Room for one more?"]
    "Room for one more?" #speaker:you
    She's on her feet before you see her move, and her hand's round your collar. #shake
    "Say one more funny thing. Go on." #speaker:girl
    She lets go. You don't say anything.
+ [Voice it: "I told them it was you because I was scared."]
    "I told them it was you because I was scared. That's all. There isn't a better reason." #speaker:you
    "I was tied up in front of the elders while you told them I'd poisoned you. I was scared too." #speaker:girl
- "So they threw you down as well. Good. I hope it stinks for you the way it stinks for me." #speaker:girl
You feel it on your face: a draught, from the far end of the dark. Cold.
"There's a draught. I'm going to it." #speaker:you
"Follow if you want. You don't have to talk to me." #speaker:you
She doesn't answer. But when you set off, she gets up and comes after you, a long way behind.
~ girl_follows = true
-> END
= again
She doesn't answer. She doesn't even look round.
-> END

=== day7_light ===
{ girl_in_rot && not day7_girl_in_rot:
    Someone's back there in the dark. You can hear them breathing. You can't just leave them.
    -> END
}
The end of the rot. A wall of dead wood, soft as bread, and a cold draught coming through it.
You push your hand into it, and it gives. And your hand on the other side is cold. Cold like nothing in the tree is ever cold.
{ girl_in_rot: She doesn't look at you. She starts digging too, as far from you as the wall allows. }
You dig. You don't know for how long.
Then the wood gives way all at once, and light comes in. #daylight:702:134:232 #flash:white
Not the tube's light. Not lamplight, not fungus light. Something else: pale, and enormous, and moving, like breath.
I will find you.
~ day7 = "done"
{ girl_in_rot: -> together }
You crawl towards it. #ending:fall
-> END
= together
You crawl towards it, side by side, not touching. #ending:fall_together
-> END
