// ============================================================================
// Day 4: the girl in the roots. Draft text from docs/sequences/day-4.md, for the designer to rewrite.
// Stages in `day4` (main.ink): wake, carve, shrine, market, girl, evening, open, sneak, visit, rot, back, bed, done.
// Extra tags: #plate (carving only: the three reply pictures are shown with the choices)
// · #step:scratch|rough|hollow|seal (carving) · #combat:<encounter>:<then> (the turn-based fight,
// src/data/combat.ts; its outcome sets fight_won, then you're back where you were and <then> plays)
// · #turn (the crowd turns its back on you)
// ============================================================================

// --- Morning, at home: the summons ---

=== day4_summons ===
~ summons_on_floor = false
Something has been pushed under the door in the night: a cloth, folded small, in the colours of the banners on the offering floor. #inset:summons
Nobody in the roots can read. Nobody needs to. Everyone knows the Tender's summons.
Mum has seen it too. She's gone pale.
"No. Oh, no." #speaker:mum
"He wants you at the shrine. This morning, before the rite." #speaker:mum
+ [Hide it: "It'll be about the offerings, that's all."]
    "It'll be about the offerings, that's all." #speaker:you
    "Yes. Yes, that'll be it." She doesn't believe it either. #speaker:mum
+ [Joke about it: "Maybe he wants a bird for his mantelpiece."]
    "Maybe he wants a bird for his mantelpiece." #speaker:you
    "Don't. Not today." #speaker:mum
+ [Voice it: "What does he want with me?"]
    "What does he want with me?" #speaker:you
    "I don't know. Nobody ever comes back and says." #speaker:mum
- "Take him something. Something good. Show him there's still faith in your hands." #speaker:mum
"And come straight back to me after. Straight back." #speaker:mum
"I'll go to the market this afternoon. Blessings or no blessings, we have to eat." #speaker:mum
~ day4 = "carve"
~ objective = "Answer the message"
~ objective_target = "home:bench"
-> END

=== day4_mum_go_on ===
"Go on. Don't keep him waiting." #speaker:mum
-> END

=== day4_bench ===
{ answered_late:
    Your bench. A small block of wood, just big enough for a fledgling. A day late. You hope it isn't too late.
- else:
    Your bench. His plate is under the board where you hid it, and there's wood enough for one more fledgling.
}
+ [Answer him]
    You fetch the plate and sit down at the bench. #carve:day4_carving
+ [Not yet]
- -> END

// --- The carving close-up: your reply, and a hollow bird to carry it ---

=== day4_carving ===
{ answered_late: -> late }
First light. You turn his plate over. The back is bare metal, smooth as water.
He asked you a question. "Would you like to fly?"
You can't write. Nobody in the roots can. But you can answer him in his own pictures. #plate:reply2
+ [Open wings: yes]
    ~ reply2 = "yes"
+ [A clipped wing: I can't]
    ~ reply2 = "cant"
+ [A hook and a dot: why?]
    ~ reply2 = "why"
- { reply2:
- "yes": Yes. Whatever it means, and wherever he is. Yes.
- "cant": You'd like to. You can't. Look at you.
- else: Why you? Why any of it?
}
You scratch it into the metal with the point of your knife. #step:scratch
Now a bird to carry it: another fledgling, like the one he sent back to you. #step:rough
Then the hard part. You hollow it from the inside, the way he hollowed yours. Too hard and the wall will crack. #step:hollow
The plate slides inside. Now a plug of wood, cut to fit, so nobody would ever know. #step:seal
You give it the clipped wing and the eye, quick and sure. Your hands remember yesterday.
-> carve_verdict ->
~ day4 = "shrine"
~ tender_waiting = true
~ mum_away = true
~ objective = "Go to the Tender's shrine"
~ objective_target = "tenders-shrine:tender-summons"
Downstairs, the door closes softly: Mum, gone out already. The bird feels like any other in your hand. Only a little lighter. #end
-> END

// If you answered message 1 a day late (Day 3 night): the fledgling now, the answer he asked for twice.
= late
First light. A fledgling with a clipped wing: the answer he asked for twice, a day late.
How small should it be?
+ [Tiny, small enough to cup in one hand]
    ~ fledgling_size = "tiny"
+ [Small, but strong enough to last]
    ~ fledgling_size = "small"
- You rough out the shape. #step:rough
Now smooth it. Slowly, the way Mum taught you. #step:smooth
Which wing do you clip?
+ [The left, like your hand]
    ~ fledgling_wing = "left"
+ [The right]
    ~ fledgling_wing = "right"
- You cut the wing short, clean and straight. #step:wing
And the eye. Open, or half closed?
+ [Open, looking up]
    ~ fledgling_eye = "open"
+ [Half closed, as if asleep]
    ~ fledgling_eye = "sleepy"
- One small cut. #step:eye
-> carve_verdict ->
~ day4 = "shrine"
~ tender_waiting = true
~ mum_away = true
~ objective = "Go to the Tender's shrine"
~ objective_target = "tenders-shrine:tender-summons"
Downstairs, the door closes softly: Mum, gone out already. It sits in your palm: a fledgling that will never fly. Will he still be there? #end
-> END

// --- The Tender's shrine: the long conversation ---

=== day4_shrine ===
The shrine is quiet. No elders on the dais this early, only their empty chairs. The Tender is waiting.
"Come in, child. Sit." #speaker:tender
He points to the stool under the lamp. You sit. The elders' chairs look down at you.
"I've known your family a long time. I took your mother's birds up the tube when she was younger than you are now." #speaker:tender
"Beautiful work. Every feather. The Tree never once sent one back." #speaker:tender
+ [Hide it: "I try to carve like her."]
    "I try to carve like her." #speaker:you
    "I know you do. I've watched you try." #speaker:tender
+ [Joke about it: "She got all the thumbs in the family."]
    "She got all the thumbs in the family." #speaker:you
    He doesn't smile. "Not today, child." #speaker:tender
+ [Voice it: "Why am I here?"]
    ~ suspicion += 1
    "Why am I here?" #speaker:you
    "Straight to it. Very well." #speaker:tender
- "Twice now, the Tree has sent your offering back. The whole roots saw it." #speaker:tender
"People are frightened. Frightened people do foolish things. You saw that last night." #speaker:tender
"So, for everyone's sake, this is how it will be." #speaker:tender
"You won't come to the morning rite. You'll bring your offering here, at dawn, and I'll take it up myself, away from the crowd." #speaker:tender
"But every evening, you'll stand on that floor. The Tree gives its answer in public, and the tree must see you receive it." #speaker:tender
+ [Hide it: "Thank you. That's kind."]
    "Thank you. That's kind." #speaker:you
    "It isn't kindness. It's order." #speaker:tender
+ [Joke about it: "Too cursed for mornings, but evenings are fine?"]
    "So I'm too cursed for mornings, but evenings are fine?" #speaker:you
    "Mornings, the tree feeds the Tree. Evenings, the Tree speaks. I won't have you spoiling the food." #speaker:tender
+ [Voice it: "So they can all watch it happen to me."]
    ~ suspicion += 1
    "So they can all watch it happen to me." #speaker:you
    "So they can see it isn't happening to them." #speaker:tender
- He comes round the desk and stands under the lamp with you. Close up, he's older than he looks on the landing.
"Now. Some questions. Answer them honestly, and we'll both feel better." #speaker:tender
"Have you ever opened an offering? Yours, or anyone's?" #speaker:tender
+ [Hide it: "Never. It's holy."]
    "Never. It's holy." #speaker:you
    He nods slowly.
+ [Joke about it: "I'd have to get the lid off first."]
    ~ tender_doubts += 1
    "I'd have to find the lid first." #speaker:you
    "That isn't an answer." #speaker:tender
+ [Voice it: "Why? What would I find inside one?"]
    ~ suspicion += 1
    ~ tender_doubts += 1
    "Why? What would I find inside one?" #speaker:you
    "Nothing. Wood. That is the point." #speaker:tender
- "Have you spoken against the Tree? To anyone?" #speaker:tender
+ [Hide it: "No. Never."]
    "No. Never." #speaker:you
+ [Joke about it: "Only to the Tree, and it didn't answer."]
    "Only to the Tree, and it didn't answer." #speaker:you
    "It answered twice, I'd say." #speaker:tender
+ [Voice it: "Is asking questions speaking against it?"]
    ~ suspicion += 1
    ~ tender_doubts += 1
    "Is asking questions speaking against it?" #speaker:you
    "It can be. It depends who's listening." #speaker:tender
- "Have you been down to the lower roots?" #speaker:tender
+ [Lie: "No."]
    ~ tender_doubts += 1
    "No." #speaker:you
    "Someone saw you on the way down yesterday. With a girl from down there." #speaker:tender
    "Don't lie to me in my own shrine, child." #speaker:tender
+ [The truth: "Yesterday. Someone showed me round."]
    "Yesterday. Someone showed me round." #speaker:you
    "Good people down there, most of them. But they live close to the rot, and the rot gets into things." #speaker:tender
+ [Voice it: "Why does everyone say that like it's a crime?"]
    ~ suspicion += 1
    ~ tender_doubts += 1
    "Why does everyone say that like it's a crime?" #speaker:you
    "Because of what's down there. You'll keep away from it, if you've any sense." #speaker:tender
- { tender_doubts >= 2: -> hands }
-> theory

= hands
"Show me your hands." #speaker:tender
You hold them out: the good one, and the other, with its stump of a thumb, the missing finger, the old white scars.
He turns them over in his own, slowly, as if something might be written there.
~ showed_hands = true
"No rot. Good." #speaker:tender
"People have started calling you rot-hand. I wanted to see for myself." #speaker:tender
-> theory

= theory
"Do you know what I think?" #speaker:tender
"The Tree doesn't punish. It prunes. A branch that grows the wrong way, it lets go of." #speaker:tender
"Perhaps it's telling you your work belongs somewhere else. Not up the tube." #speaker:tender
"There's always need for hands at the rot-clearing. Or the lamp-oil presses. Honest work. Nobody would think less of you." #speaker:tender
"Stop carving birds. Carve what you're told. Let the Tree forget it ever saw your hands." #speaker:tender
+ [Hide it: "If that's what the Tree wants."]
    "If that's what the Tree wants." #speaker:you
    "Good. Think on it." #speaker:tender
+ [Joke about it: "The rot-clearing. Do they need many carvers?"]
    "The rot-clearing. Do they need many carvers there?" #speaker:you
    "They need people who know their place." #speaker:tender
+ [Voice it: "Birds are all my family's ever had."]
    ~ suspicion += 1
    "Birds are all I've got. They're all my family's ever had." #speaker:you
    "Then your family has had a long run of luck." #speaker:tender
- "Hear me, child. The elders are talking. The preacher wants an answer." #speaker:tender
"If it happens again, it won't be up to me." #speaker:tender
"Now. Your offering." #speaker:tender
You hold out the bird. He takes it with the cloth, like yesterday, and weighs it in his hand.
{
- carve_flaws >= 5: "Rough. Your mother would never have let this leave the bench." #speaker:tender
- carve_flaws >= 2: He frowns at the nicks in the wing, but says nothing.
- else: "Good work. Better than I've seen from you in years." #speaker:tender
}
Then he stops.
"Lighter than your usual." #speaker:tender
A long moment. The lamp hums. You don't breathe. #sound:heartbeat
+ [Hide it: "I carved it smaller. Humbler."]
    "I carved it smaller. To be humble." #speaker:you
+ [Joke about it: "Someone told me I was heavy-handed."]
    "Someone told me I was heavy-handed." #speaker:you
+ [Say nothing]
    You say nothing.
- He lays it in a basket on the desk, alone, and covers it with the cloth.
The exchange is holy. Nobody opens an offering. Not even him.
"Go on. And be on that floor this evening." #speaker:tender
~ tender_waiting = false
~ mum_at_market = true
~ day4 = "market"
~ objective = "Find Mum at the market"
~ objective_target = "roots-market:mum-market"
By the time you come out, the morning has gone. #time:afternoon
-> END

=== day4_not_here ===
The Tender sees you at the edge of the crowd and gives a small shake of the head. Not here. The shrine.
-> END

// --- The market: Mum snubbed, and the fight ---

=== day4_market ===
Mum is at the stew stall with her basket, holding out a jar to trade.
"Two bowls, please. Whatever you've got." #speaker:mum
The stew seller looks at her, then at you behind her, and puts the lid back on the pot.
"Not today, love. I'm sorry." #speaker:stew_seller
"I've bought from you for twenty years." #speaker:mum
"I know. I've got children." #speaker:stew_seller
The people in the queue have stepped away from her. Nobody wants to stand near the carver's house. #recoil
Then someone shoves through the crowd: the young man from the rite, in his zealot's stole. #show:zealot-market
"You've got a nerve, bringing that out among decent people." #speaker:zealot
He knocks Mum's basket out of her hands. Jars roll across the floor. One breaks. #shake #sound:smash
~ food_store -= 1
"Rot-hand's mother. Buying rot-hand's supper." #speaker:zealot
+ [Step in]
    ~ fought = true
    You step between them. #combat:market_scrap:day4_after_fight
    -> END
+ [Hold back]
    -> hold_back

= hold_back
~ held_back = true
You don't move. You tell yourself it's because it would only make things worse.
Mum gets down on her knees and gathers the jars back into her basket, one by one. She looks up once, and sees you standing there.
She doesn't say anything. She doesn't need to.
"That's right. Know your place." #speaker:zealot
He walks off laughing. #hide:zealot-market
-> after

= after
Mum gets up, and holds her basket close.
"Home. I'm going home." #speaker:mum
~ mum_at_market = false
~ mum_away = false
She goes without looking back. #hide:mum-market
Someone is watching you from under the balcony. The girl from the lower roots. #show:girl-market
~ day4 = "girl"
~ objective = "Talk to the girl"
~ objective_target = "roots-market:girl-market"
-> END

=== day4_after_fight ===
{ fight_won:
    He's on the floor among the jars, and the whole market is staring at you. #show:zealot-market
    ~ suspicion += 2
    "Did you see that? Rot-hand went for him!" #speaker:crowd_someone
    He gets up, wiping his mouth, and backs away. "You'll pay for that. All of you." #speaker:zealot
- else:
    You're on the floor. Your lip is split and every breath hurts. #show:zealot-market
    ~ hurt = true
    ~ food_store -= 2
    He takes two jars out of Mum's basket, tucks them under his arm, and strolls away. "For the shrine. Since you owe it."  #speaker:zealot
}
He's gone. #hide:zealot-market
-> day4_market.after

// --- The girl: why she needs you, in secret ---

=== day4_girl ===
She isn't smirking. For once she isn't joking at all.
"Not here. Come on." #speaker:girl
She pulls you in behind the sacks under the balcony, where nobody can see.
{ fought:
    "Saw that. Brave. Stupid, but brave." #speaker:girl
- else:
    "Saw that. You were right to keep out of it. Didn't look like it felt right, though." #speaker:girl
}
"Listen. Something's happened, down at mine." #speaker:girl
"Last night the floor of the house next to ours gave way. Just went. Down into the rot." #speaker:girl
+ [Was anyone hurt?]
    "Was anyone hurt?" #speaker:you
    "Nobody fell, if that's what you mean. That's not the worst of it." #speaker:girl
+ [Into the rot? Under the lower roots?]
    "Into the rot? Under the lower roots?" #speaker:you
    "It's not just at the edges, like they tell you. It's under us. That's not even the worst of it." #speaker:girl
+ [Joke about it: "Bet the Tender sent flowers."]
    "Bet the Tender sent flowers." #speaker:you
    "He sent his men. That's the worst of it." #speaker:girl
- "They came before it was light. Took the family 'somewhere safe'. Nailed boards over the hole." #speaker:girl
"Nobody's seen them since. Nobody's even saying their names." #speaker:girl
She drops her voice even lower.
"The rot's under my house too. I've seen it. I keep a rug over the board." #speaker:girl
"If anyone finds out, we're next." #speaker:girl
"You're a carver. You know wood better than anyone down there. I need you to look at it, and tell me if my house is going to fall in." #speaker:girl
+ [Of course I'll come.]
    ~ girl_trust += 1
    "Of course I'll come." #speaker:you
    "Don't say it like that. Like it's nothing." #speaker:girl
+ [Why me?]
    "Why me?" #speaker:you
    "Because you won't run and tell anyone. And nobody listens to you anyway." #speaker:girl
+ [Voice it: "Shouldn't you tell the Tender?"]
    "Shouldn't you tell the Tender?" #speaker:you
    "And have us taken 'somewhere safe'? I'd rather fall in." #speaker:girl
- "Come after dark. And don't let anyone see you. Not the watch, not the neighbours, nobody." #speaker:girl
"If they see me with the cursed child, they'll start asking why. Then they'll start looking." #speaker:girl
"The far end of the lower roots. My door's the one under the big root." #speaker:girl
She's gone into the crowd before you can answer. #hide:girl-market
~ day4 = "evening"
~ chalk_ring = true
~ mum_at_ceremony = true
~ mum_away = true
~ objective = "Go to the evening ceremony"
~ objective_target = "offering-floor:chalk-ring"
The light's going. The ceremony will be starting. #time:evening
-> END

// --- The evening: the ceremony becomes a ritual ---

=== day4_tender_evening ===
"Your place is in the ring." #speaker:tender
He points with his staff to the foot of the stairs.
-> END

// The crowd before the ritual: talk to them first if you like (src/data/areas/offeringFloor.ts).
=== day4_crowd_mother ===
She sees you coming and turns her children round by the shoulders, so they face the tube.
"We've been told not to speak to it." She says it to her children, not to you. #speaker:mother
"And I've nothing to say to it anyway." #speaker:mother
-> END

=== day4_crowd_old_man ===
"The elders came round this afternoon. Every house in the roots." #speaker:old_man
"Told us how it would be tonight. Not to shout. Not to throw. Just to turn away, all together, if it comes back." #speaker:old_man
+ [Why are you telling me?]
    "Why are you telling me?" #speaker:you
    "Because somebody ought to warn you. And because I'm old, and nobody listens to me anyway." #speaker:old_man
+ [Will you turn away too?]
    "Will you turn away too?" #speaker:you
    He doesn't answer. He looks at his feet.
- -> END

=== day4_crowd_zealot ===
{
- fight_won:
    The young man from the market has a split lip, and a crowd of friends round him now. He doesn't come near you.
    "Look at it. Rot-hand. Couldn't wait to lay hands on a believer." #speaker:zealot
    "Everyone saw. Everyone." #speaker:zealot
- fought:
    The young man from the market grins when he sees you holding your ribs.
    "Still standing? The Tree'll see to that." #speaker:zealot
- else:
    The young man from the market smirks.
    "Your mother's carrying her own basket tonight, is she? Good." #speaker:zealot
}
-> END

=== day4_ritual ===
A ring has been chalked on the floor at the foot of the stairs, away from everyone. Nobody needs to tell you who it's for.
You step into it.
Mum starts towards you. A woman takes her arm, gently, and steers her back among the others. #move:mum-ceremony:62
"Not with them, love. Stand with us." #speaker:crowd_woman
Nobody shouts tonight. Nobody throws anything. It's worse.
The whispering starts at the back, and moves forward like a draught. #sound:whispers
"Third time, if it comes back." #speaker:crowd_someone #name:Someone in the crowd
"It'll come back. Look at it, standing there." #speaker:crowd_someone_else
"My sister's boy had the cough after the last one. Since it touched the basin." #speaker:crowd_woman
"Hush. Don't look at it. They said not to look at it." #speaker:crowd_man
"A blessing, for the weavers. A blessing, for the potters. A blessing, for the lamp-makers." #speaker:tender
The tube goes dark. #flash:dark
Your bird drops into the basin. #show:rejected-bird
A gasp goes round the floor, then a sound like a breath let out. Some of them were praying it wouldn't. Some of them were praying it would. #sound:gasp
Nobody makes a sound. Then, all together, as if they'd practised it, the whole crowd turns its back on you. #turn
Even the children. A small girl peeks back over her shoulder at you, and her father turns her head away.
+ [Hide it: bow your head]
    You bow your head, the way you would at a blessing.
+ [Joke about it: "Was it something I said?"]
    "Was it something I said?" #speaker:you
    Nobody laughs. Nobody turns round.
+ [Voice it: "Look at me!"]
    ~ suspicion += 1
    "Look at me! At least look at me!" #speaker:you
    Not one of them turns round.
- "The Tree has answered a third time." #speaker:tender
"From tonight, for the safety of the roots, the carver's house will be watched." #speaker:tender
"Take your offering." #speaker:tender
You climb the steps alone. Every back stays turned. #hide:rejected-bird
~ house_watched = true
~ chalk_ring = false
~ mum_at_ceremony = false
~ mum_away = false
~ day4 = "open"
~ objective = ""
~ objective_target = ""
A man with a lamp follows you and Mum home, and stays across the way, watching your door. #time:night #goto:home:130:236:day4_mum_night
-> END

// --- Night, at home: message 3 and the feather ---

=== day4_mum_night ===
{
- held_back:
    Mum puts her basket on the table and doesn't unpack it.
    "You just stood there." #speaker:mum
    "I know. I know why. It's just... you just stood there." #speaker:mum
- hurt:
    Mum sits you by the fire and dabs at your lip with a wet rag.
    "You stupid, brave thing. Look at you." #speaker:mum
- else:
    "What were you thinking? In front of the whole market?" #speaker:mum
    "They'll say you're violent now, as well as cursed." #speaker:mum
}
"And now there's a man outside, watching our door, as if we were thieves." #speaker:mum
"I'm going to bed." #speaker:mum
~ mum_in_bed = true
~ objective = "Open the bird"
~ objective_target = "home:hearth"
She doesn't ask about the bird. She doesn't want to know.
-> END

=== day4_open_bird ===
{ answered_late: -> late }
You sit by the hearth with the bird. The seam along its belly is there again: opened, and closed.
Your plate is gone. In its place, another, blackened like the others.
And something else, tucked in beside it. Something soft. You put it to one side; the plate first.
Your hands know the way now: the seam, the soot, the rag. A third one. They wrote back again. #sound:pop
You realise you've been waiting for this all day: through the shrine, the market, the turned backs. This.
{ reply2:
- "yes": You start rubbing at the soot. #decode:message3_yes:day4_decoded
- "cant": You start rubbing at the soot. #decode:message3_cant:day4_decoded
- else: You start rubbing at the soot. #decode:message3_why:day4_decoded
}
-> END

= late
You sit by the hearth with the fledgling. There's a seam along its belly: opened, and closed. #sound:pop
He's hollowed it out, neatly, from the inside. You'd never get a wall that thin with your hands.
Inside, a plate, blackened like the others. And something else, tucked in beside it. Something soft. You put it to one side; the plate first.
He answered. A day late, and he answered anyway. He waited for you.
You start rubbing at the soot. #decode:message3_late:day4_decoded
-> END

=== day4_decoded ===
{ answered_late: -> late }
{ reply2:
- "yes": "Not yet. I am Grounded. There are many of us beyond the bark." #speaker:you
- "cant": "Neither can I. I am Grounded. There are many of us beyond the bark." #speaker:you
- else: "Because I have watched you carve. I am Grounded. There are many of us beyond the bark." #speaker:you
}
Grounded. He has a name.
A name like a bird that can't fly. Like yours. Is that why he chose you?
And there are many of them. Out there, beyond the bark, where nobody lives.
How many? What do they eat? What do they worship, out there, with no tube and no Tree?
Do they know about you? Has he told them about the clipped wing in the roots?
You should be terrified, and you are: of being found out, of what the elders would do to you, and to Mum. Of what you're turning into.
But you can't stop now. You need to know.
- (feather)
Then you remember the other thing, and take it out. #inset:feather
A feather. Not carved: real. Light as ash, and red, red like nothing else in the tree.
You've carved ten thousand feathers. You've never touched one.
You turn it in the firelight. It's lighter than anything you've ever held, and every strand of it is perfect, finer than any knife.
Somewhere out there, something grew this.
Birds are real. They're real, and he's seen them.
~ has_feather = true
You hide the feather under your shirt, against your skin.
And you remember the girl. "Come after dark. Don't let anyone see you."
~ day4 = "sneak"
~ sneaking = true
~ objective = "Get to her home without being seen"
~ objective_target = "lower-roots:girls-door"
Not by the front door, with a man watching it. The rot gap, then, and down through the back routes.
-> END

// A day late: message 2 folded into message 3, so the outside, and his name, all at once.
= late
"Clipped wing, I rest beyond the bark. I am Grounded. There are many of us." #speaker:you
The words go through you like cold water.
Beyond the bark. Outside the tree. Nobody lives outside the tree. Is there even an outside? The tree is the world.
Grounded. He has a name. A name like a bird that can't fly. Like yours. Is that why he chose you?
And there are many of them. Out there, where nobody lives. How many? What do they eat? What do they worship, with no tube and no Tree?
You turned away from him once, and answered a day late, and he wrote back anyway, as if he'd known all along you would.
You should be terrified, and you are: of being found out, of what the elders would do to you, and to Mum. Of what you're turning into.
But you can't stop now. You need to know.
-> day4_decoded.feather

// --- Night: her home, and the rot beneath it ---

=== day4_girls_door ===
{ day4 != "sneak": -> shut }
~ sneaking = false
You tap on the door, very softly. It opens before you've finished, and a hand pulls you inside. #goto:girls-home:150:236:day4_girls_home
-> END
= shut
A rag curtain hangs over a doorway under the great root. It's drawn shut.
-> END

=== day4_girls_home ===
~ day4 = "visit"
"Nobody saw you?" #speaker:girl
+ [Nobody.]
    "Nobody." #speaker:you
    "Look at you. A natural." #speaker:girl
+ [The watch nearly did.]
    "The watch nearly did." #speaker:you
    "Nearly doesn't count." #speaker:girl
- "Welcome to the palace. Mind the..." #speaker:girl
You walk into something hanging from the ceiling, and it clanks.
"...everything." #speaker:girl
Her home is smaller than yours, and every bit of it is full: salvage hung from the ceiling, jars of glowing fungus, a hammock, junk stacked to the roof.
"Keep your voice down. Everyone's asleep behind the curtain." #speaker:girl
She kneels on the rug in the middle of the floor and rolls it back. Underneath is a board, newer than the rest.
"There. It's under there." #speaker:girl
~ objective = "Go down through the floor"
~ objective_target = "girls-home:board"
-> END

=== day4_go_down ===
She lifts the board. Warm, wet air breathes up out of the dark, with a faint green light and a smell like old fruit.
"I'll go first. It's not far. Don't touch anything you don't have to." #speaker:girl
~ day4 = "rot"
~ girl_with_you = true
~ rot_creatures = true
~ objective = "Look at the wood under her house"
~ objective_target = "the-rot:dying-root"
You climb down after her. #goto:the-rot:40:232:day4_rot_arrive
-> END

=== day4_rot_arrive ===
It's worse than you imagined.
The roots down here are soft and black, slick with something that sticks to your hands and your boots. Rot glows in the hollows, bright as the tube.
"Mind where you put your feet. It's sticky. And the green eats boots." #speaker:girl
"The wood you want's at the far end. Right under my bed." #speaker:girl
-> END

// Further in, past the pits: the beetles, and the first fight with a friend beside you (compulsory: the trigger
// spans the whole floor between the second pit and the far end). The fight (src/data/combat.ts, rot_beetles)
// sets rot_beetles_won, and day4_rot_after_beetles plays when you're back. She saw the market from under the
// balcony, so what she says afterwards depends on what you did there (fought and won / fought and lost / held back).
=== day4_rot_creatures ===
~ rot_creatures_done = true
The tunnel widens. The green is brighter here, pooled in the hollows.
Something in it moves.
A shape lifts out of the slime: a beetle, big as a dog, its shell black and veined with glowing green. #shake
Then another beside it. Then a third.
Neither of you says anything. You can't. Your heart is going so hard you can feel it in your teeth. #sound:heartbeat
The girl's hand finds your sleeve and grips it, hard enough to hurt.
"Those aren't..." #speaker:girl
She doesn't finish. Her mouth stays open.
"What are they?" #speaker:you
"They're beetles. They were beetles." #speaker:girl
"Oh, Tree. Oh, Tree, they're looking at us." #speaker:girl
Their legs click on the wet wood, all together. They turn, slowly, towards the two of you.
You take a step back. Your heel finds nothing but slime. The ladder is a long way behind you.
"Right. Right. No way round, and I am not turning my back on those." #speaker:girl
She fumbles a sliver of pale bone from her belt and nearly drops it. Her hand's shaking. So is yours.
"Stay close. Please." #speaker:girl #combat:rot_beetles:day4_rot_after_beetles
-> END

=== day4_rot_after_beetles ===
{ rot_beetles_won:
    ~ girl_trust += 1
    The last one folds up on its back, legs kicking. The others shy away into the dark, clicking.
    For a long moment neither of you moves. You're both breathing hard. There's green slime up to your elbows.
    Then she laughs: one short, shaky breath of a laugh.
    {
    - fight_won:
        "So the market wasn't a fluke. Rot-hand, the terror of the lower roots." #speaker:girl
        "Don't let it go to your head. You still fight like you're slapping flies." #speaker:girl
        "...You held your own, though." #speaker:girl
    - fought:
        "Well. Better than the market, anyway. I watched that boy sit on you." #speaker:girl
        "Don't look at me like that. You held your own here. Mostly." #speaker:girl
    - else:
        "Look at you. In the market you just stood there while he kicked your mum's jars about." #speaker:girl
        "Turns out you do have hands. Who knew." #speaker:girl
        She looks at you a moment longer than she needs to.
        "Not bad. Honestly." #speaker:girl
    }
- else:
    The world goes green and sticky and a long way off.
    When it comes back, she's dragging you along the tunnel by your collar, swearing steadily. Behind you, the clicking fades into the dark.
    She drops you against the wall and sits down hard beside you.
    {
    - fight_won:
        "So much for the hero of the market. One zealot, fine. Three beetles, flat on your back." #speaker:girl
        "...You did get two of them off me, though. I saw." #speaker:girl
    - fought:
        "That's twice today you've ended up on the floor. Is it a habit?" #speaker:girl
        "You stood your ground, though. Longer than I would've bet." #speaker:girl
    - else:
        "At least this time you didn't just stand there." #speaker:girl
        "You stood your ground. That's something." #speaker:girl
    }
}
"Come on. It's just ahead." #speaker:girl
-> END

=== day4_rot_wood ===
{ day4 != "rot": -> again }
The great root that holds up her house comes down here into the dark. You put your hand on it.
It gives, like bread.
You press your knife into it, the way Mum taught you to test a block. It slides in up to the handle.
Above you, through the floor, someone is snoring.
"Well?" #speaker:girl
+ [Tell her the truth]
    ~ girl_trust += 1
    "It won't hold. Not forever." #speaker:you
    She nods, as if she already knew.
+ [Soften it]
    "It's not good. But it's not going anywhere tonight." #speaker:you
    "That's the nicest way anyone's ever told me I'm doomed." #speaker:girl
+ [Voice it: "How long has the tree been like this?"]
    ~ girl_trust += 1
    "How long has the tree been like this?" #speaker:you
    "Longer than they'll ever tell you." #speaker:girl
- "How long have I got?" #speaker:girl
"A season, maybe. Less, if it keeps spreading." #speaker:you
"It's not just my house, is it." #speaker:girl
You look along the tunnel. The rot runs on into the dark: under the lower roots, under everything. Further than anyone above would ever admit.
"Come on. Let's get you home before the watch changes." #speaker:girl
~ day4 = "back"
~ objective = "Go back up"
~ objective_target = "the-rot:way-up"
-> END
= again
The root that holds up her house, soft as bread.
-> END

=== day4_climb_up ===
You climb back up into her house. She drops the board into place behind you and pulls the rug over it. #goto:girls-home:200:236:day4_girls_goodbye
~ girl_with_you = false
-> END

=== day4_girls_goodbye ===
"Thank you. For coming. For not lying to me." #speaker:girl
+ [Hide it: "Anyone would have."]
    "Anyone would have." #speaker:you
    "No. They wouldn't." #speaker:girl
+ [Joke about it: "I'll send you my bill."]
    "I'll send you my bill." #speaker:you
    "Ha. Put it on the Tender's tab." #speaker:girl
+ [Voice it: "What will you do?"]
    ~ girl_trust += 1
    "What will you do?" #speaker:you
    "Keep the rug down. Keep my mouth shut. Find somewhere else, if there's anywhere left." #speaker:girl
- "Go home the back way. The watch never goes down there." #speaker:girl
"And be careful. You're more interesting alive." #speaker:girl
~ day4 = "bed"
~ objective = "Go to bed"
~ objective_target = "home:bed"
She lets you out into the dark, and you go home the long way, under everything. #goto:home:440:236:day4_home_late
-> END

=== day4_home_late ===
Home. The house is quiet. Through the crack by the door, you can still see the watcher's lamp across the way.
-> END

=== day4_sleep ===
Your bed. The feather is still against your skin.
+ [Sleep]
    ~ day4 = "done"
    ~ mum_in_bed = false
    ~ day5 = "wake"
    ~ objective = "Answer Grounded"
    ~ objective_target = "home:bench"
    You dream of something red, high up, where nothing lives. #endday:Day 5
+ [Not yet]
- -> END
