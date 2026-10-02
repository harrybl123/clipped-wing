// ============================================================================
// Day 6: scapegoat. Draft text from docs/sequences/day-6.md, for the designer to rewrite.
// Stages in `day6` (main.ink): wake, carve, shrine, market, disguise, tail, listen, evening, open, hide,
// interrogation, home, bed, done.
// The girl (a medium choice, designer): save her by declaring there's something beyond the Tree (a
// madman: a night in custody), or blame her (she's taken to the lower rot; you're sent home).
// ============================================================================

// --- Morning, at home: hungry ---

=== day6_mum_morning ===
{ day6_mum_morning > 1: -> again }
Mum puts a bowl in front of you. There's barely anything in it.
"Half a basket came down for the whole of the roots last night. Half a basket, for everyone." #speaker:mum
"Eat it. I've had mine." #speaker:mum
Her own bowl, on the side, is clean and dry. She hasn't had anything.
+ [Eat it]
    You eat it. You hate yourself a little, and you eat it anyway.
+ [Give it back to her]
    "You have it." #speaker:you
    "I said I've eaten." #speaker:mum
    You leave it on the table for her. Neither of you mentions it again.
- "They're saying it's because of you. All of it. The baskets coming down half empty." #speaker:mum
"I told them it's nonsense. I don't know if I believe me any more." #speaker:mum
-> END
= again
"Go on. Do what you have to." #speaker:mum
-> END

=== day6_bench ===
Your bench. The seed, wrapped in a scrap of cloth. A blank plate.
+ [Answer him]
    You sit down at the bench. #carve:day6_carving
+ [Not yet]
- -> END

=== day6_carving ===
First light. You turn the seed over in your fingers. Small enough to lose.
He asked for new life. Here it is. And you need to tell him what's happening to you.
Hands, pointing. All of them, at you. And one more, reaching down. Help me. #plate:blame
~ reply4 = "blame"
You scratch it into the metal. #step:scratch
A fledgling, big enough to hold a seed. #step:rough
Hollow it, gently. #step:hollow
The plate goes in, and the seed with it, and the plug after. #step:seal
The wing, the eye.
~ day6 = "shrine"
~ tender_waiting = true
~ objective = "Take your offering to the shrine"
~ objective_target = "tenders-shrine:tender-summons"
Dawn. #end
-> END

// --- The shrine at dawn: something's wrong ---

=== day6_shrine ===
The Tender is under the lamp, as always. But he isn't waiting for you. He's listening to something behind the curtain at the back of the dais.
Voices. Low. One of them is the preacher's.
You hold out the bird. He takes it without the cloth this time, without even turning round. He doesn't weigh it. He doesn't look at it.
He drops it into a basket of its own, a different one, with a mark chalked on the side.
"Noon. Where we said. Not here." It's the preacher, behind the curtain. #name:A voice
The Tender glances back at you, and sees from your face that you heard.
"Go home. Stay home today. Do you understand me?" #speaker:tender
+ [Hide it: "Yes, Tender."]
    "Yes, Tender." #speaker:you
+ [Joke about it: "I'm always home. Nobody wants me anywhere else."]
    "I'm always home. Nobody wants me anywhere else." #speaker:you
    He doesn't smile. He doesn't even hear you.
+ [Voice it: "What's that basket for?"]
    ~ suspicion += 1
    "What's that basket for?" #speaker:you
    "Go. Home." #speaker:tender
- Noon. Where they said. Not here. Something's happening, and it's happening about you.
~ tender_waiting = false
~ day6 = "market"
~ objective = "Get food at the market"
~ objective_target = "roots-market:food-seller"
But first: there's nothing to eat at home. Not a thing.
-> END

=== day6_not_here ===
The Tender doesn't even look up. "Home." #speaker:tender
-> END

// --- The market: blamed ---

=== day6_market ===
The market's half empty. The stalls that are open have hardly anything on them.
A woman is sitting on the floor by the ration hatch, white in the face. Someone's fanning her. She fainted in the queue.
You hold out a carving to the stew seller: a little bird, your best. "Anything. Whatever you've got." #speaker:you
The stew seller looks at you. Then at the people behind you. #shake
"It's the carver." #speaker:crowd_someone
And it spreads, the way it always does now.
"It's your fault! Since you started, the baskets come down half empty." #speaker:crowd_woman
"The Tree's starving us to get at it." #speaker:crowd_man
"My children haven't eaten in two days. Two days! Because of you!" #speaker:mother
+ [Hide it: "I'm sorry. I'll go."]
    "I'm sorry. I'll go." #speaker:you
    "Sorry!" Someone laughs. "It's sorry!" #speaker:crowd_someone
+ [Joke about it: "I'm hungry too, you know."]
    "I'm hungry too, you know." #speaker:you
    That was the wrong thing to say.
+ [Voice it: "The Tree was giving less before me. You know it was."]
    ~ suspicion += 1
    "The Tree was giving less before any of this. You all know it was." #speaker:you
    For a moment nobody speaks. Then it's twice as loud.
- Something hits you in the back: a rotten root, then a stone. #throw
A man grabs for your collar. You twist away, and you run. #shake
Out of the market, past the offering floor, faces turning as you pass, all of them knowing exactly who you are.
You don't stop until you're home, with the door shut and your heart going like a drum.
You can't go anywhere looking like yourself any more. Not today. Not ever, maybe.
And you need to know what's happening at noon.
~ day6 = "disguise"
{ seed == "roots":
    ~ objective = "Get a disguise from the boy"
    ~ objective_target = "lower-roots:dodger"
- else:
    ~ objective = "Ask the girl for something to hide your face"
    ~ objective_target = "lower-roots:girl"
}
Someone in the lower roots will have something to hide your face. #time:afternoon #goto:home:40:236
-> END

// --- The lower roots: a disguise ---

=== day6_girl_disguise ===
"You look terrible. Worse than usual. What happened?" #speaker:girl
You tell her. The market. The stones.
"I heard. Half the roots heard." She looks at your face. "You need to not be you for a bit." #speaker:girl
"I know someone. Up on the high walkway. He can get anything, for a price, and he'll rob you blind. Come on." #speaker:girl
She points him out, and doesn't come any closer. "I don't do business with him. I just know him." #speaker:girl
~ objective = "Get a disguise from the boy"
~ objective_target = "lower-roots:dodger"
-> END

=== day6_dodger_disguise ===
{ seed == "roots":
    "Back again? Business is booming. What is it this time?" #speaker:boy
- else:
    A boy about your age is lounging on the high walkway, legs dangling over the street.
    "Well, well. The famous carver. Rot-hand, in person. My lucky day." #speaker:boy
    "What can I do you for? Don't be shy." #speaker:boy
}
You ask him for something to hide your face. Something so nobody knows you.
"Ah. Thought you might." He grins. "I've got just the thing." #speaker:boy
He pulls a cloak out of a bundle: patched, hooded, lower-roots cloth, smelling of fungus.
"One cloak. Nobody'll look at you twice in this. Down here, nobody looks at anybody." #speaker:boy
"Food, of course. Everyone's paying in food this week." #speaker:boy
+ [Pay him a jar]
    "One jar." #speaker:you
    "Done." #speaker:boy
+ [Ask what else he knows]
    "What else do you know? About the Tender?" #speaker:you
    He grins. "Now that's a better question. That's an extra jar." #speaker:boy
    "Tender and the preacher, every day this week. Noon, across the market, in behind the ration hatch. Then nobody sees them for an hour." #speaker:boy
    "Funny, eh? Holy men, in a storeroom." #speaker:boy
    { food_store > 0:
        ~ food_store -= 1
    }
-
{ food_store > 0:
    ~ food_store -= 1
}
~ has_disguise = true
You pull the hood up. In the shine of a puddle, there's nobody you know.
"It suits you. Very mysterious. Come back any time." #speaker:boy
~ day6 = "tail"
~ tailing = true
~ objective = "Follow the Tender without being seen"
~ objective_target = "roots-market:tender-tail;roots-market:ration-hatch"
Noon. The market. You'll be there before them.
-> END

// --- The tail: the market (src/data/areas/rootsMarket.ts: the `quarry` feature walks them) ---

=== day6_tail_hatch ===
{ tail_done:
    -> day6_follow_down
- else:
    The ration hatch. Wait for them.
}
-> END

=== day6_follow_down ===
Behind the hatch there's a storeroom, and behind the storeroom, a door you've never seen, standing open.
Steps go down into the dark. You can hear them below you.
~ tailing = false
~ meeting = true
~ day6 = "listen"
~ objective = "Get close enough to listen"
~ objective_target = "back-routes:listen-spot"
You go down after them. #goto:back-routes:646:120:day6_tail_down
-> END

=== day6_tail_down ===
The old routes, under the market. Voices, ahead, where the tunnel opens out under the offering floor.
The tube's cold light falls through the grate there, onto the heads of the elders.
The tunnel gets low before it opens out. You'll have to crawl to get close enough to hear.
-> END

// --- The elders' meeting, overheard ---

=== day6_meeting ===
You crouch in the dark where the tunnel narrows, and listen.
"...fewer every week. Half what came down last season. Less." #speaker:elder_green
"The tallies don't lie. The Tree is giving less, and it has been for a long time." #speaker:tender
"And the roots are counting their bowls." #speaker:elder_green
"Then give them something else to count." The preacher. #speaker:preacher
"The carver's bird comes back, and the baskets come down light. The roots have already made the connection. We only have to agree with them." #speaker:preacher
"It's a child. A child with a ruined hand." #speaker:tender
"It's a cause. Hunger without a cause is a riot. Hunger with a cause is a congregation." #speaker:preacher
A long silence.
"Bring the carver in tonight. A hearing. It need only look like one." #speaker:elder_amber
"And the girl from the lower roots. The watch saw the carver going down there at night. To her door, they say." #speaker:elder_cyan
"Of course they did. Where else would a roots child learn to turn against the Tree?" #speaker:preacher
"The lower roots have always lived closest to the rot. Thieves and grumblers, half of them. They'd sell the bark off the tree and complain it was rough." #speaker:preacher
"Then she'll do. A lower-roots girl filling a cursed child's head with poison. The roots will believe that before they'll believe anything else." #speaker:elder_cyan
"And a little fear keeps the lower roots quiet." #speaker:preacher
You don't hear the rest. Your ears are ringing.
The girl. They're going to take the girl.
~ meeting = false
~ day6 = "evening"
~ chalk_ring = true
~ mum_at_ceremony = true
~ mum_away = true
~ objective = "Go to the evening ceremony"
~ objective_target = "offering-floor:chalk-ring"
They're getting up. You back away into the dark before they come past. #time:evening
-> END

// --- The evening: the bitten bird ---

=== day6_crowd_mother ===
"Look at it. It's eating. It's eating, and my children aren't." #speaker:mother
-> END

=== day6_crowd_old_man ===
"I've never been hungry like this. Not in seventy years." #speaker:old_man
"I don't believe in curses, child. But I'm hungry enough to start." #speaker:old_man
-> END

=== day6_crowd_zealot ===
"Tonight they'll ask you what you are. And then they'll know what to do with you." #speaker:zealot
-> END

=== day6_ceremony ===
{ has_disguise: You pull back your hood before you step into the ring. They should see you. Let them. }
The ring. The crowd is bigger than you've ever seen it, and thinner, every face hollowed out.
Nobody whispers tonight. They're too hungry to waste the breath.
"A blessing, for the weavers." #speaker:tender
One basket comes down for all the weavers. One for the potters. The crowd watches every one like a dog watches a table.
The tube goes dark. #flash:dark
Your bird drops into the basin. #show:bitten-bird
Someone at the front screams.
There's a bite out of it. A real bite: the marks of teeth, in the wood, where its tail should be. #shake
"Teeth! It's been bitten!" #speaker:crowd_woman
"Something ate it. Something up there ate it!" #speaker:crowd_man
"You sent rot up to the Tree, and the Tree bit into it and spat it back at you!" #speaker:preacher
A man faints. A child is sobbing and can't stop. People push back from you so hard the ring of chalk is lost under their feet. #recoil
+ [Hide it: shut your eyes and pray]
    You shut your eyes and pray, because everyone else is, and you don't know what else to do.
+ [Joke about it: "At least something's eating."]
    "At least something up there is eating." #speaker:you
    You don't know why you said it. Nobody laughs. The silence is horrible.
    ~ suspicion += 1
+ [Voice it: stare at the bite]
    You can't stop looking at it. The marks are small. Neat. Like a mouth that knew exactly what it was doing.
- Something bit your bird. Something out there, beyond the bark.
Is he hungry, out there? Is he angry? Is it a warning? You don't know. You don't know anything any more.
"Take it. And go home. They'll come for you tonight." #speaker:tender
You climb up and take the bird out of the basin. Nobody comes within ten paces of you. #hide:bitten-bird
~ chalk_ring = false
~ mum_at_ceremony = false
~ mum_away = false
~ day6 = "open"
~ objective = "Open the bird"
~ objective_target = "home:hearth"
They part to let you leave, the way you'd step back from a fire. #time:night #goto:home:130:236:day6_mum_night
-> END

// --- Night, at home: message 5, then the knock ---

=== day6_mum_night ===
Mum doesn't say anything. She just holds you, for a long time, in the middle of the floor.
"Whatever they ask you tonight... say whatever keeps you alive. Do you hear me? Whatever keeps you alive." #speaker:mum
"I'll be here." #speaker:mum
~ mum_in_bed = true
She goes to bed, but you can hear she isn't sleeping.
-> END

=== day6_open_bird ===
You sit by the hearth with the bitten bird. Your fingers find the teeth marks in the dark. Small. Sharp.
The seam is still there, under the bite. Whatever bit it didn't get inside.
You open it. A plate. And the seed's gone.
{ seed == "healthy":
    You start rubbing at the soot. #decode:message5_lives:day6_decoded
- else:
    You start rubbing at the soot. #decode:message5_sleeps:day6_decoded
}
-> END

=== day6_decoded ===
{ seed == "healthy":
    "New life lives. Clipped wing, stay alive. You are not the rot. We need you. Hurry." #speaker:you
    It lives. It's been a day: it can't have grown yet. But he knows it's alive, somehow, the way you know a block of wood is sound by the weight of it in your hand.
- else:
    "New life sleeps. The rot is deep. Clipped wing, stay alive. You are not the rot. We need you. Hurry." #speaker:you
    It sleeps. It's only been a day, but he already knows it won't wake. Something was wrong with it. The rot is deep. Does he mean the seed? Or the tree?
}
"You are not the rot." Nobody has said that to you in days. Nobody has said anything kind to you at all. #quote
"We need you." Who? For what? "Hurry." Hurry where? #quote
Then: boots, outside. Several. And a fist on the door. #shake #sound:knock
"Open up! In the name of the elders!" #speaker:guard
The plate's in your hand, and the bird's on the hearth, opened up for anyone to see.
~ day6 = "hide"
~ evidence_left = 1
~ evidence_plate = true
~ objective = "Hide the plate! (1 left)"
~ objective_target = "home:evidence-plate"
Hide it! #when:evidence_left:day6_guards:5
-> END

=== day6_hide_plate ===
~ evidence_plate = false
~ evidence_left = 0
~ objective = ""
~ objective_target = ""
You shove the plate into the loose board under the loft ladder and kick ash over the bird.
-> END

=== day6_guards ===
~ plate_found = evidence_plate
~ evidence_plate = false
~ evidence_left = 0
The door gives. Three guards, and the Tender's lamp behind them.
{ plate_found:
    One of them goes straight to the hearth and picks up the blackened plate. He turns it to the light, frowning at the scratches.
    "What's this, then?" He drops it into a bag. "The elders will want to see that." #speaker:guard
    ~ suspicion += 2
- else:
    They look around. The hearth, the ash, the bed. They don't know what they're looking for.
}
"You're to come with us. Now." #speaker:guard
Mum is in the doorway of her room. She doesn't say anything. She can't.
~ day6 = "interrogation"
~ interrogating = true
~ objective = ""
They march you through the dark, up to the shrine. #goto:tenders-shrine:218:236:day6_interrogation
-> END

// --- The interrogation ---

=== day6_interrogation ===
The shrine. The stool, alone under the lamp. They sit you on it.
The elders are on the dais in their high chairs, faces in shadow. The preacher stands at the end. The Tender is at his desk with his tallies, and won't look at you.
"Carver." The eldest elder. "Your birds have come back to the Tree five times. Never in living memory has the Tree refused an offering. We would like to understand why." #speaker:elder_amber
"What is different about you?" #speaker:elder_amber
+ [Hide it: "Nothing. I've carved like my mother taught me."]
    "Nothing. I've carved the way my mother taught me, every day of my life." #speaker:you
+ [Joke about it: "I'm a bit short on fingers."]
    "Well. I'm a bit short on fingers." #speaker:you
    Nobody laughs. The preacher writes something down.
+ [Voice it: "You tell me. You're the ones who know the Tree."]
    ~ suspicion += 1
    "You tell me. You're the ones who speak for the Tree." #speaker:you
- "Your first returned bird was your usual. Then you changed. A fledgling, with a clipped wing. Why?" #speaker:elder_amber
+ [Hide it: "To be humble. To show the Tree I knew I was flawed."]
    "To be humble. To show the Tree I know my flaws." #speaker:you
+ [Joke about it: "I was bored of the old one."]
    "I was bored of the old one." #speaker:you
    ~ suspicion += 1
+ [Voice it: "Because something asked me to."]
    ~ suspicion += 2
    "Because something asked me to." #speaker:you
    The elders look at each other. "Something," one repeats. "The Tree?" You don't answer. #speaker:elder_pale
- "The Tender says your birds have been lighter." #speaker:elder_green
"Lighter than your usual. Every one." #speaker:tender
{ plate_found:
    "And this was in your home." The guard's bag is upended on the floor in front of you. The blackened plate. #speaker:elder_cyan
    "Scratches. Pictures. Like children's marks. What is it?" #speaker:elder_cyan
    You say it's nothing. A scrap. They don't believe you, and you don't expect them to.
}
{ told_archivist:
    "You were seen going up to the archive. What did the archivist want with you?" #speaker:elder_pale
    "To record the rejection. That's all." You keep your face still. You promised him. #speaker:you
}
{ caught_stealing:
    "And the archivist tells us someone was in the archive at night. Someone small. Someone who ran." #speaker:elder_pale
    He didn't say it was you. He didn't say it wasn't.
}
"You've been seen in the lower roots. At night. With a girl from down there." #speaker:preacher
"Bring her in." #speaker:elder_amber
They bring her in between two guards. Her hands are tied. Her sleeve is torn, and there's dirt on her face, as if they dragged her here. #show:girl-shrine
She looks at you, just once, and then at the floor.
"The watch saw you at her door, at night. Twice." #speaker:elder_cyan
"A lower-roots girl. You know what they're like down there. Living in the rot, with their glowing paint and their thieving and their grudges against everyone above them." #speaker:preacher
"She's been kind to you. Why? What would a girl like that want with a carver's child, except to drag it down to her level?" #speaker:preacher
"What has she been putting in your head?" #speaker:preacher
"Tell us the truth, carver. Who taught you to make birds the Tree won't take?" #speaker:elder_amber #dim:on
This is it. They want someone to blame for the birds, and for the hunger. You, or her.
- (choose)
+ [Save her: "There's something beyond the Tree"]
    Tell them the truth, or near enough. That there's something out there, beyond the bark. Something other than the Tree. They'll think you're mad, or worse. But they'll have no reason to keep her.
    ++ [Yes. Say it.]
        -> save
    ++ [No. Think again.]
        -> choose
+ [Blame her: "She's been filling my head with it"]
    Say it's her. That she's been talking to you about things beyond the bark, and you listened. They'll take her. You'll go home.
    ++ [Yes. Blame her.]
        -> blame
    ++ [No. Think again.]
        -> choose

= save
~ girl_fate = "saved"
~ girl_trust += 2
~ suspicion += 2
"She's never said a word to me about the Tree. It's me." #speaker:you #dim:off
"There's something beyond the bark. Something other than the Tree. I know there is. I've always known." #speaker:you
The shrine goes so quiet you can hear the lamp.
"Blasphemy." The preacher, almost happy. "There. You hear it. It's mad. The child is mad." #speaker:preacher
"A madness the Tree can see, and won't accept. That's your rejection. That's your hunger." #speaker:preacher
"Let the girl go. She's nothing. Lock the carver in the back room until we decide." #speaker:elder_amber
They cut her ropes. On the way past, she looks at you, and her face does something you've never seen it do. #hide:girl-shrine
"Idiot," she whispers. "Thank you." #speaker:girl
~ in_custody = true
~ interrogating = false
~ day6 = "done"
~ day7 = "wake"
~ objective = ""
~ objective_target = ""
They lock you in the back room of the shrine, in the dark, and you sit with your back against the door and wait for morning. #wake:shrine-cell:250:236:day7_cell_wake #endday:Day 7
-> END

= blame
~ girl_fate = "blamed"
~ girl_trust = -2
~ girl_in_rot = true
~ house_guarded = true
"It's her. She's been talking to me. About things beyond the bark. Things that aren't the Tree." #speaker:you #dim:off
"I listened. I'm sorry. I listened." #speaker:you
She doesn't look up. She doesn't argue. She doesn't say anything at all.
"There. Lower-roots poison, in a roots child's ear. Just as I said. They're all the same down there." #speaker:preacher
"Take her down to the lower rot. Let her keep her ideas down there, where they can't do any harm." #speaker:elder_cyan
They take her out. She doesn't look back. Not once. #hide:girl-shrine
"And the carver?" #speaker:tender
"Home. Under guard. Its birds will be watched until the Tree is satisfied." #speaker:elder_amber
~ interrogating = false
~ day6 = "bed"
~ objective = "Go home"
~ objective_target = "home:bed"
They walk you home through the dark. Nobody says a word. #goto:home:130:236:day6_home_after
-> END

=== day6_home_after ===
Mum is waiting up. She sees your face and doesn't ask.
You can't stop seeing the girl's back, going out of the door, not looking round.
-> END

=== day6_sleep ===
Your bed. You won't sleep.
+ [Lie down]
    ~ day6 = "done"
    ~ day7 = "carve"
    ~ mum_in_bed = false
    ~ objective = "Carve your offering"
    ~ objective_target = "home:bench"
    Somewhere below, under everything, they're taking her down into the dark. #endday:Day 7
+ [Not yet]
- -> END
