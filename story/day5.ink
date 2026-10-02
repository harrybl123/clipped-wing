// ============================================================================
// Day 5: the archivist. Draft text from docs/sequences/day-5.md, for the designer to rewrite.
// Stages in `day5` (main.ink): wake, carve, shrine, escort, upper, evening, open, archive, steal,
// roots, deal, bed, done. (archive: you told him, and go up to ask; steal: you didn't, and try to take
// one; roots: down to the girl, then the boy; deal: the boy's price.)
// Big choice 2 (design doc): tell the archivist the truth, or pander (told_archivist).
// ============================================================================

// --- Morning, at home: your reply to message 3 ---

=== day5_mum_morning ===
Mum is at the table, turning an empty jar round and round in her hands.
"There's a man still out there. He changed over in the night. A different one." #speaker:mum
"Go and do whatever it is you do at that bench. Just don't tell me about it." #speaker:mum
"If anyone asks me, I want to be able to say I don't know." #speaker:mum
-> END

=== day5_bench ===
Your bench. Last night's plate, his words still on it. The back is bare.
+ [Answer him]
    You sit down at the bench. #carve:day5_carving
+ [Not yet]
- -> END

=== day5_carving ===
First light. You turn the plate over.
"I am Grounded. There are many of us beyond the bark." #quote
So many questions. Room on the plate for one. #plate:reply3
+ [A pointing hand and a hook: who are you?]
    ~ reply3 = "who"
+ [You, and an arrow over the bark: take me]
    ~ reply3 = "take"
+ [You, small, under a great eye: I'm being watched]
    ~ reply3 = "watched"
- { reply3:
- "who": Who is he? Who are any of them? What do they look like, out there?
- "take": Take me with you. You've never said anything so dangerous, even in your head.
- else: The guard across the way. The Tender weighing your bird. The whole floor turning its back. Every eye in the tree is on you now. He should know.
}
You scratch it into the metal. #step:scratch
Another fledgling. #step:rough
Hollow it, gently. #step:hollow
The plate goes in, and the plug after it. #step:seal
The wing, the eye. Your hands know it by heart now.
-> carve_verdict ->
~ day5 = "shrine"
~ tender_waiting = true
~ objective = "Take your offering to the shrine"
~ objective_target = "tenders-shrine:tender-summons"
Dawn. The Tender will be waiting. #end
-> END

// --- The shrine, at dawn: the token ---

=== day5_shrine ===
The Tender is waiting under the lamp, the same as yesterday. He doesn't ask you to sit.
He holds out the cloth. You put the bird in it.
He weighs it. He looks at you. He says nothing about the weight this time, and somehow that's worse.
{
- carve_flaws >= 5: He runs a finger along a gouge in the wing. "Your hands are getting worse, child. Or you've stopped caring which." #speaker:tender
- carve_flaws >= 2:
- else: "Fine work," he says, almost to himself. "It makes no sense." #speaker:tender
}
"There's something else." #speaker:tender
He takes a brass token from his robe and drops it into your palm. It's stamped with a stack of little plaques: the archive's mark. Everyone knows it, even down here.
"The archivist wants you. This afternoon. He'll send someone." #speaker:tender
+ [Hide it: "I'll go wherever I'm sent."]
    "I'll go wherever I'm sent." #speaker:you
    "Yes. You will." #speaker:tender
+ [Joke about it: "Moving up in the world."]
    "Moving up in the world." #speaker:you
    "Nobody from the roots goes up for good news." #speaker:tender
+ [Voice it: "What does he want with me?"]
    ~ suspicion += 1
    "What does the archivist want with me?" #speaker:you
    "I don't know. And I don't like not knowing. Remember that, when you're up there." #speaker:tender
- "Go home. Wait." #speaker:tender
~ tender_waiting = false
~ escort_waiting = true
~ day5 = "escort"
~ objective = "Go home and wait"
~ objective_target = "home:escort-home"
By the time you're home, the morning has gone. #time:afternoon
-> END

// --- Afternoon: summoned upward ---

=== day5_mum_escort ===
Mum is standing well back from the door, as if the guard might bite.
"A guard. From up there. In my house." #speaker:mum
She straightens your collar, as if that would help.
"Whatever they ask you, love... be careful what you say." #speaker:mum
-> END

=== day5_escort ===
A guard from the middle tiers fills the doorway: cap, amber band, a staff. He looks at the token in your hand, not at you.
"The archive's mark. Right. Come on, then." #speaker:escort
"Stay close. Don't touch anything. Don't talk to anyone." #speaker:escort
~ escort_waiting = false
~ escorted = true
~ day5 = "upper"
~ objective = "Meet the archivist in the upper halls"
~ objective_target = "middle-tiers:to-upper-halls;upper-halls:archivist"
He walks you up through the roots, past the shrine, to the foot of the great stair. #goto:middle-tiers:60:360:day5_checkpoint
-> END

=== day5_checkpoint ===
The guard post at the foot of the stair. The guard there steps out to bar the way.
"Roots folk don't come up here." #speaker:post_guard
Your escort holds up the token.
"This one's sent for. The archivist." #speaker:escort #name:Your escort
The guard at the post looks at your hand, and steps aside like you might be catching.
"Up you go, then. Mind the stairs. They're clean." #speaker:post_guard
-> END

=== day5_middle_stare ===
People in the doorways stop talking as you pass. A woman pulls a curtain shut.
-> END

=== day5_archivist ===
The archivist looks up from a heavy book open on the rail. Ink on his fingers, spectacles, a pale ribbon in his hair.
"So you're the carver." #speaker:archivist
He looks past you, at the guard standing at your shoulder.
"Wait downstairs, would you? The carver's hardly going to make off with the books." #speaker:archivist
The guard hesitates, then shrugs and goes back down the stairs. #hide:escort
He studies you the way your mother studies a block of wood before she cuts it.
"Sit. Please. I only want to ask a few questions." #speaker:archivist
"I keep the records. Every Ascension, every family, every offering of note. In all the records, back to the very first plaque, nothing has ever come back down the tube that went up it." #speaker:archivist
"Until you. So you're going in the book, and I'd like to get it right." #speaker:archivist
+ [Hide it: "I'll help however I can."]
    "I'll help however I can." #speaker:you
    "Good. Good." He doesn't sound as if he believes you. #speaker:archivist
+ [Joke about it: "Will I get a nice plaque?"]
    "Will I get a nice plaque?" #speaker:you
    For a moment, he almost smiles. "Not that kind of record." #speaker:archivist
+ [Voice it: "Getting it right? Does anybody know why it happened?"]
    ~ archivist_trust += 1
    "Getting it right? Does anybody actually know why it happened?" #speaker:you
    He looks at you properly for the first time. "No. Nobody does. That's rather the point." #speaker:archivist
- He turns the book round. A page of writing you can't read, and beside it, in a careful hand, your family's mark. And your mother's. And yours.
"Your mother's birds went up the tube for thirty years. Not one came back. Then her child's comes back. Twice. Three times. Four, tonight, I expect." #speaker:archivist
"The Tender says the Tree is pruning you. The preacher says you're rotten. The elders want it to stop." #speaker:archivist
"What do you say?" #speaker:archivist
+ [Hide it: "That the Tree knows best."]
    "That the Tree knows best." #speaker:you
    "Yes, that's what everyone says." #speaker:archivist
+ [Joke about it: "That I should have been a potter."]
    "That I should have been a potter." #speaker:you
    "Potters' pots go up the tube too. They come back filled." #speaker:archivist
+ [Voice it: "That nobody knows what's up there. Not really."]
    ~ archivist_trust += 1
    ~ suspicion += 1
    "That nobody knows what's up there. Not really." #speaker:you
    He glances at the stairs, where the guard went, then back at you. He lowers his voice.
    "No. We don't." #speaker:archivist
- He takes off his spectacles and rubs his eyes.
"May I tell you something? I've never said it aloud." #speaker:archivist
"I've always wondered what's past the Canopy. Past the bark. Where it all goes. The records only go up to the gate, and then they stop." #speaker:archivist
"Forty years, keeping a record of a door I'll never see through." #speaker:archivist
"We keep a record of everything, up here. Every plaque. Every craft. Even a seed of everything the grove has ever grown, in the drawers downstairs, in case it's ever needed again." #speaker:archivist
"But nothing about what's beyond. Nothing at all." #speaker:archivist
He looks at you, and waits. He knows there's something you're not saying. #dim:on
This is it. He's asking. If you tell him about the plates, there's no taking it back. If you don't, he'll write you down as cursed and close the book.
- (choose)
+ [Show him the feather]
    The feather is against your skin, under your shirt. Show it to him, and there'll be no taking it back: he'll want everything. Trust a man from the upper branches with your life, and your mother's.
    ++ [Yes. Show him.]
        -> truth
    ++ [No. Think again.]
        -> choose
+ [Pander: the Tree is right to reject you]
    Tell him what everyone wants to hear: you're cursed, you're sorry, you'll carve what you're told. Keep the plates to yourself.
    ++ [Yes. Keep the secret.]
        -> pander
    ++ [No. Think again.]
        -> choose

= truth
~ told_archivist = true
~ archivist_trust += 2
You reach under your shirt and take out the feather, and lay it on his open book. #dim:off #inset:feather
He doesn't move. He doesn't breathe.
Then he takes off his spectacles, very slowly, and bends so close his nose almost touches it.
"That isn't carved." #speaker:archivist
"That isn't carved. Look at it. Every strand. Nobody could... nothing in the tree could..." #speaker:archivist
He reaches out one ink-stained finger, and stops just short of touching it, as if it might fly away.
"Where did you get this?" #speaker:archivist
"No. Wait. Sit down. Start at the beginning, and tell me everything. Everything." #speaker:archivist
So you tell him. The seam in your bird. The plate, black with soot. The pictures. "I see you, clipped wing."
He doesn't interrupt once. When you get to "beyond the bark", his hand goes to the rail, as if the floor has tilted.
"Grounded," he says, very softly. "Many of us." #speaker:archivist
"I knew it. I knew the records stopped too neatly." #speaker:archivist
He's frightened. You can see it. But his eyes are bright, the way yours were by the fire.
"Listen to me. If anything else comes down to you, anything at all, come to me. Not by the stair. There's a hatch at the top of the trunk climb, into the archive. Nobody watches it at night." #speaker:archivist
"And not a word of this to anyone. Not the Tender. Not your friends. I have a great deal more to lose than you think." #speaker:archivist
-> leave

= pander
~ told_archivist = false
"The Tree's right. I'm cursed. I don't know what I did, but I'm sorry, and I'll carve whatever I'm told." #speaker:you #dim:off
Something goes out of his face. Relief, maybe. Or disappointment.
"Yes. Well. That's what I'll write, then." #speaker:archivist
He turns the book back round and writes something underneath your mother's mark. It doesn't take long.
"Thank you, carver. The guard will see you down." #speaker:archivist
-> leave

= leave
~ day5 = "evening"
~ chalk_ring = true
~ mum_at_ceremony = true
~ mum_away = true
~ objective = "Stand in the ring"
~ objective_target = "offering-floor:chalk-ring"
The escort doesn't take you home. He takes you straight down to the ceremony. #time:evening #goto:offering-floor:60:236
-> END

// --- The evening: the ceremony, with a guard at your shoulder ---

=== day5_crowd_mother ===
She sees the guard behind you, and pulls her children closer.
"They've sent a guard for it now. Thank the Tree. Someone's finally doing something." #speaker:mother
"I hope they take it up there and never bring it back." #speaker:mother
-> END

=== day5_crowd_old_man ===
"A guard from up the trunk." He shakes his head. "That's not the Tender's doing. That's the elders." #speaker:old_man
"When the elders start, child, they don't stop." #speaker:old_man
He glances round, at who's watching. "Don't stand by me. Please. I've grandchildren." #speaker:old_man
-> END

=== day5_crowd_zealot ===
The young man from the market is in the front row tonight, his stole freshly washed.
"Four times, and they still let it walk around. Not for much longer." #speaker:zealot
"Enjoy your guard, rot-hand. He goes home at night. We don't." #speaker:zealot
-> END

=== day5_ceremony ===
You step into the chalk ring. The guard steps in behind you, one hand on his staff, close enough that you can hear him breathing.
Mum is across the floor among the others. She doesn't come over. She's not allowed.
The crowd presses right up to the edge of the chalk. The guard has to hold his staff out across them to keep them off you.
"Why's he got a guard? What's it done now?" #speaker:crowd_someone #name:Someone in the crowd
"I heard it went up to the archive. Up the trunk. Like it had business there." #speaker:crowd_someone_else
"A blessing, for the weavers. A blessing, for the potters." #speaker:tender
The tube goes dark. #flash:dark
Your bird drops into the basin. #show:rejected-bird
Nobody gasps this time. Nobody turns away. A low sound goes round the floor, like something growling.
"Four." #speaker:zealot
Someone starts counting, out loud, and the floor takes it up: "One. Two. Three. Four." #speaker:crowd
A stone cracks against the guard's staff. It was meant for you. He doesn't even look round to see who threw it. #throw #shake
"The carver's case will go before the elders." #speaker:tender
A murmur goes round the floor. Nobody ever goes before the elders. Not from the roots.
+ [Hide it: lower your eyes]
    You lower your eyes, and keep them on the chalk.
+ [Joke about it: "Can I bring a friend?"]
    "Can I bring a friend?" #speaker:you
    The guard's hand closes on your shoulder, hard.
+ [Voice it: "For what? For carving?"]
    ~ suspicion += 1
    "For what? For carving?" #speaker:you
    "For whatever the Tree is telling us," the Tender says. #speaker:tender
- The guard walks you up the steps, and waits while you take your bird out of the basin. #hide:rejected-bird
~ escorted = false
~ chalk_ring = false
~ mum_at_ceremony = false
~ mum_away = false
~ day5 = "open"
~ objective = ""
~ objective_target = ""
Then he walks you home, and leaves you at the door, and goes to stand with the watcher across the way. #time:night #goto:home:130:236:day5_mum_night
-> END

// --- Night, at home: message 4 ---

=== day5_mum_night ===
"The elders." Mum sits down very slowly. #speaker:mum
"My mother used to say you'd go before the elders once in your life, if you were very good or very bad." #speaker:mum
She takes your face in her hands and looks at you for a long moment, as if she's trying to remember it.
"I'm going to bed. I can't... I'm going to bed." #speaker:mum
~ mum_in_bed = true
~ objective = "Open the bird"
~ objective_target = "home:hearth"
-> END

=== day5_open_bird ===
You sit by the hearth with the bird. The seam. The plate.
Your reply's gone. He's read it. He's read your words, out there, wherever he is.
{ reply3:
- "who": You start rubbing at the soot. #decode:message4_who:day5_decoded
- "take": You start rubbing at the soot. #decode:message4_take:day5_decoded
- "watched": You start rubbing at the soot. #decode:message4_watched:day5_decoded
- else: You start rubbing at the soot. #decode:message4:day5_decoded
}
-> END

// He answers what you asked (reply3), then asks for a seed.
=== day5_decoded ===
{ reply3:
- "who":
    "You are Grounded too." #speaker:you
    You asked who he is, and he told you who you are.
    Grounded. A bird that can't fly. A carver whose hand slipped. Is that what he means? That you're one of them, whatever they are, and always were?
- "take":
    "Soon." #speaker:you
    Not no. Not never. Soon.
    You say it again in your head, and again, and it frightens you how much you want it.
- "watched":
    "Hide, as I do." #speaker:you
    As he does. So he's hiding too, out there. From what? Who watches someone beyond the bark?
    The plate's suddenly heavy in your hand. You look at the shutter, at the gap under the door.
}
"Clipped wing, send me new life that can't fly." #speaker:you
The same words as the first plate. Almost.
But where "new life" was an egg and a shoot, this time it's a seed. A seed, sprouting. And above it, branches: the upper branches.
He wants a seed. From up there.
Why a seed? What would anyone grow out there, where nothing lives? What is he going to do with it?
And how is someone from the roots supposed to get one?
{ told_archivist:
    You think of the archivist, his bright, frightened eyes. "If anything else comes down to you, come to me."
    And you think of the girl. If anyone in the lower roots can get hold of something, it's someone she knows.
- else:
    "Even a seed of everything the grove has ever grown, in the drawers downstairs." The archive. #quote
    The archivist wrote you down as cursed and closed the book. He won't help you.
    But there's a hatch at the top of the trunk climb, and everyone says nobody watches the archive at night.
}
-> choose
= choose
{ told_archivist:
    -> ask
- else:
    -> steal
}
= ask
+ [Go up to the archivist]
    ~ day5 = "archive"
    ~ archivist_waiting = true
    ~ objective = "Go up to the archive"
    ~ objective_target = "archive:archivist-night"
    Up, then. The back routes to the shrine, then the trunk climb, and the hatch at the top.
+ [Go down to the lower roots]
    -> roots
- -> END
= steal
~ day5 = "steal"
~ stealing = true
~ objective = "Steal a seed from the archive"
~ objective_target = "archive:drawers"
You've never stolen anything in your life. Out through the rot gap, then. The back routes to the shrine, the trunk climb, the hatch.
-> END
= roots
~ day5 = "roots"
~ sneaking = true
~ girl_on_doorstep = true
~ objective = "Get to the girl without being seen"
~ objective_target = "lower-roots:girl-doorstep"
Down, then. If anyone knows how to get hold of something they shouldn't, it's the girl.
-> END

// --- Night: the archive (you told him) ---

=== day5_archive ===
He's waiting by the index engine with a shaded lamp, in a coat over his nightclothes.
"You came. I hoped you would. I've hardly slept." #speaker:archivist
You tell him: the fourth plate, the seed, the upper branches.
"A seed." He breathes out. "Of course. Something that grows. Something to start with." #speaker:archivist
He looks at the drawers behind the glass, and shakes his head.
"Not from in there. Those are records. A seed forty years in a drawer may never wake." #speaker:archivist
"If it matters, and I think it does, it should be a living one. From the grove." #speaker:archivist
"There's a guard on it at night. I'm allowed to be there. You're not." #speaker:archivist
"So you go in first and keep low. I'll call him over and keep him talking. You get to the vault at the far end." #speaker:archivist
"He'll look round now and then. He never looks up. Remember that." #speaker:archivist
~ archivist_waiting = false
~ in_grove = true
~ grove_sneak = true
~ day5 = "grove"
~ objective = "Get to the seed vault without being seen"
~ objective_target = "seed-grove:seed-vault"
He takes you up through the sleeping halls, past the feast tables and the skylights, to the rope bridge. #goto:seed-grove:156:236:day5_grove_arrive
-> END

// --- Night: the seed grove, with the archivist ---

=== day5_grove_arrive ===
Gardens. Real ones, out on the branch, under a hole in the bark full of night sky. You've never smelt anything like it.
At the far end, a lantern. The guard.
You drop down behind the nearest bed. Behind you, on the bridge, the archivist clears his throat.
-> END

=== day5_grove_archivist ===
{ grove_sneak:
    "Go on. Keep low." #speaker:archivist
- else:
    "Quickly, now." #speaker:archivist
}
-> END

=== day5_grove_vault ===
The vault: a cabinet of glass jars at the end of the branch, every one glowing a soft amber.
Behind you, the archivist says goodnight, loud and cheerful, and sends the guard down for a lamp to look at the saplings by. The lantern goes off over the bridge.
~ grove_sneak = false
A moment later the archivist is beside you, out of breath, with a key on a ribbon. #move:archivist-grove:568:236
"Help me find it. My eyes aren't what they were, and you know marks better than I do." #speaker:archivist
Each jar has a mark scratched on its lid: a thorn, a vine, a fish, a leaf curled round a seed.
- (search)
+ [The thorn]
    "Bramble. Grows anywhere and chokes everything. Not that one." #speaker:archivist
    -> search
+ [The vine]
    "Gourds. No." #speaker:archivist
    -> search
+ [The leaf curled round a seed]
    He turns the key. The glass door swings open with a breath of warm air.
- He tips one seed out of the jar into your palm. Small, hard, and warm, as if it's been holding its breath.
"From the grove's first planting. Alive. You can feel it, can't you?" #speaker:archivist
"Tell me what happens. Promise me. Even if it's nothing." #speaker:archivist
~ seed = "healthy"
~ in_grove = false
~ day5 = "bed"
~ objective = "Go home to bed"
~ objective_target = "home:bed"
"Now go. I'll see you out the back way, before the watchman does his round." #speaker:archivist
He takes you back over the bridge and down through the halls, to the hatch at the back of the archive. #goto:archive:60:236
-> END

// --- Night: the archive (you didn't tell him): the theft that fails ---

=== day5_theft ===
The drawers. Rows and rows of them, every one with a mark. You find the leaf curled round a seed.
You pull. The drawer squeals like something alive.
A lamp flares behind you. #show:archivist-catch
"I thought as much." #speaker:archivist
The archivist, in a coat over his nightclothes, the lamp shaking a little in his hand.
"I wondered why the records stopped so neatly at the gate. And here you are, robbing them." #speaker:archivist
+ [Hide it: "I'm sorry. I'll go."]
    "I'm sorry. I'll go." #speaker:you
+ [Joke about it: "I was just admiring the drawers."]
    "I was just admiring the drawers." #speaker:you
    He doesn't laugh.
+ [Voice it: "Something came down. Something you'd want to see."]
    "Something came down to me. Something you'd want to see." #speaker:you
    For a moment he hesitates. Then he shakes his head. "Whatever it is, I don't want to know. I can't know." #speaker:archivist
- "I should call the watch. I should." #speaker:archivist
He doesn't. He's never been brave enough to do anything, and tonight that's the only thing saving you.
"Go. Back down the hatch. And if I ever see you up here again, I'll have no choice." #speaker:archivist
~ stealing = false
~ caught_stealing = true
~ suspicion += 1
~ day5 = "roots"
~ sneaking = true
~ girl_on_doorstep = true
~ objective = "Get to the girl without being seen"
~ objective_target = "lower-roots:girl-doorstep"
You climb back down into the dark with empty hands. There's one place left: the lower roots, and the girl. #goto:trunk-climb:201:118
-> END

// --- Night: the lower roots, the girl and the boy ---

=== day5_girl_seed ===
She's sitting on her doorstep in the dark, as if she was expecting somebody.
"Get in the shadow, idiot. The watch'll be back round in a minute." #speaker:girl
"Look who it is. Come to check the rot hasn't eaten me?" #speaker:girl
You tell her: a seed. From the upper branches, or as near as you can get.
"A seed. You came all the way down here at night for a seed." #speaker:girl
"...Course I won't ask what for. Not my business. I'm going to ask later, though." #speaker:girl
"There's someone. Up on the high walkway, by the great root, where the watch can't be bothered to climb. He can get anything, if you don't ask where it came from, and you don't mind being robbed blind." #speaker:girl
"Don't let him near your pockets. And don't believe a word." #speaker:girl
~ day5 = "deal"
~ objective = "Find the boy on the high walkway"
~ objective_target = "lower-roots:dodger"
-> END

=== day5_dodger ===
A boy about your age is lounging on the high walkway with his legs dangling over the street, cleaning his nails with a little knife. He smiles as you come, and it's not a nice smile.
"Well, well. The famous carver. Rot-hand, in person, in my humble shop." #speaker:boy
"What can I do you for? Don't be shy. Everyone wants something." #speaker:boy
You tell him. A seed.
"A seed." He whistles. "Oh, that's a big ask, that is. Those are upper-branch goods. Very rare. Very dangerous." #speaker:boy
He produces one from nowhere: small, dark, a little soft. He rolls it across his knuckles.
"Straight from the grove. Fell off a cart. You know how it is." #speaker:boy
"Now. What's it worth to you?" #speaker:boy
+ [Offer a jar of food]
    "A jar of food." #speaker:you
    "A jar? For this? I'm wounded. Three." #speaker:boy
    ++ [Two. That's all I can spare.]
        "Two. That's all we've got to spare." #speaker:you
        "Two, and you owe me a favour. Done." #speaker:boy
        ~ food_store -= 2
    ++ [Fine. Three.]
        ~ food_store -= 3
        "Lovely doing business with you." #speaker:boy
+ [Ask him where it really came from]
    "Where did it really come from?" #speaker:you
    "Where does anything come from? Up. Down. Round about." He grins. "Three jars, and I'll stop asking questions about your birds." #speaker:boy
    ~ food_store -= 3
- He drops the seed into your palm. It's lighter than you expected, and a little warm. It looks fine.
"Pleasure. Come back any time. I'm always here. Like the rot." #speaker:boy
~ seed = "roots"
~ day5 = "bed"
~ objective = "Go home to bed"
~ objective_target = "home:bed"
-> END

=== day5_sleep ===
Your bed. The seed is in your fist. You don't let go of it.
+ [Sleep]
    ~ day5 = "done"
    ~ mum_in_bed = false
    ~ sneaking = false
    ~ girl_on_doorstep = false
    ~ objective = ""
    ~ objective_target = ""
    ~ day6 = "wake"
    ~ objective = "Answer Grounded"
    ~ objective_target = "home:bench"
    Tomorrow, the elders. Tomorrow, the seed goes up the tube. #endday:Day 6
+ [Not yet]
- -> END
