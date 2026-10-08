// ============================================================================
// Chapter 2, Day 4: the compound. Draft text from docs/sequences/chapter-2/part-2.md, for the designer to
// rewrite. You start at the gate (designer: no need to start at home). The boss's offer: his circle, his
// table, and he'll know where you dig (the design doc: he passes it on). Big choice 1: your brother. The
// circle at the bar, and the boss's son wants to see what you've got.
// ============================================================================

// --- Morning, the compound ---

=== c2day4_start ===
~ objective = "Go in"
~ objective_target = "compound:enforcer"
The compound's gate. You've walked past it every day of your life, and never once looked straight at it.
-> END

=== c2day4_gate ===
"Nobody goes in unless they're asked." #speaker:enforcer
"I was asked." #speaker:scavenger
The enforcer looks at you a long moment, the way you'd look at a find you were sure was fake.
"So I hear. Four times the tribute, off ground that's been picked clean since before we were born." #speaker:enforcer
"Funny, that." #speaker:enforcer
The enforcer steps aside. Not far. #move:enforcer:96
~ c2day4 = "house"
~ objective = "See the boss"
~ objective_target = "compound-house:boss"
-> END

// --- The boss's house ---

=== c2day4_boss ===
"There she is. Sit, sit. Eat something. You look like you've never seen bread." #speaker:boss
You haven't, not like this. You sit. You eat. He watches you do it, smiling, and the watcher watches him.
"You've a gift. Finds come to you like they come to nobody else." #speaker:boss
"I don't ask how. I don't need to know how. A gift's a gift." #speaker:boss
+ [I just know where to look]
    "I just know where to look." #speaker:scavenger
    "Of course you do." #speaker:boss
+ [Say nothing]
    You keep eating. It seems safest.
    "Quiet. Good. I like quiet." #speaker:boss
- "Here's what I'm offering. A place in my circle. A seat at this table. Nobody touches you, nobody touches your share." #speaker:boss
"And?" #speaker:scavenger
"And you tell me where you're digging, and when. Every time. So my people can keep you safe out there." #speaker:boss
"The other clan's getting bold. I'd hate for anything to happen to you." #speaker:boss
He holds out his hand. It's not really a question.
You take it.
~ in_circle = true
"Good girl. Now. That brother of yours." #speaker:boss
"A boy shouldn't be living in a shack on the edge of nowhere, eating when his sister has a good day." #speaker:boss
"Bring him here. He'll eat every day. He'll sleep warm. He'll be safe, which is more than you can promise him." #speaker:boss #dim:on
+ [Yes. Bring him here]
    ~ brother_choice = "compound"
    "Yes. Thank you." #speaker:scavenger #dim:off
    "There. That wasn't hard." #speaker:boss
+ [No. He stays with me]
    ~ brother_choice = "home"
    "No. He stays with me." #speaker:scavenger #dim:off
    The boss's smile doesn't move at all.
    "Of course. Family's family. The offer stands." #speaker:boss
- "Now. Tonight, when the tally's in, my circle drinks at the bar. You'll drink with us." #speaker:boss
"Everyone should see you're one of mine. That's half of what keeps you safe." #speaker:boss
"The bar. Tonight. Don't be late, and don't be early." #speaker:boss
~ c2day4 = "tell"
~ objective = "Tell your brother"
~ objective_target = "swap-yard:brother"
The watcher says nothing the whole time. But when you get up to go, he's looking at your boots, at the dirt on them, as if he could tell where it came from. #time:afternoon
-> END

// --- Afternoon, the swap yard ---

=== c2day4_tell ===
{ brother_choice == "compound":
    "The compound? Live there? In the compound?" #speaker:brother
    He's already running. Then he stops.
    "What about {dog_name}?" #speaker:brother
    "{dog_name} stays with me. Nobody there can ever know. Not ever. Not even if he's kind to you. Especially not then." #speaker:scavenger
    "I know. I know! I'm not stupid." #speaker:brother
    "I'll get my things. I'll get my things right now!" #speaker:brother
    He's off across the yard to pack his collection, every last bolt, before you can say anything else. He'll be at the compound's gate before you are. #leave:brother:20:110
    ~ brother_moved = true
- else:
    "You said no? To the boss?" #speaker:brother
    "He asked. I said no. You stay with me." #speaker:scavenger
    "But they have bread there. Every day. The kid says." #speaker:brother
    "We'll have bread." #speaker:scavenger
    He kicks at the dirt, and doesn't say anything, and after a while he takes your hand anyway.
}
~ c2day4 = "bar"
~ circle_night = true
~ objective = "Go to the bar"
~ objective_target = "bar:boss-bar"
The day's going. Tonight, the bar. #time:evening
-> END

// --- Evening, the bar ---

// Walking in: the room goes quiet, and the boss waves you over.
=== c2day4_bar_arrive ===
~ bar_arrived = true
The bar's full, and loud, and then, as you come in, it isn't.
Every face turns your way, and turns away again. Over by the counter, the boss raises his cup.
"There she is! Come, come. Over here." #speaker:boss
~ objective = "Join the boss"
-> END

=== c2day4_bar ===
"Here she is. My lucky find." #speaker:boss
"Barkeep. Whatever she wants." #speaker:boss
"You know my watcher. You've met my enforcer." #speaker:boss
"We've met." #speaker:enforcer
"And this is my son." #speaker:boss
He's your age. Good shirt, whole, not a patch on it. He looks at you the way you'd look at something on the bottom of your boot.
"So this is her. The one with the luck." #speaker:boss_son
"Four times the tribute. Out before first light every morning, back after, never with anybody." #speaker:boss_son
"Where do you go?" #speaker:boss_son
+ [Wherever the finds are]
    "Wherever the finds are." #speaker:scavenger
    "That's not an answer." #speaker:boss_son
+ [Ask your father]
    "Ask your father. He doesn't need to know." #speaker:scavenger
    The boss laughs. The son doesn't.
- "My father thinks you're lucky. I think you're a liar." #speaker:boss_son
He puts a hand flat on your chest, and shoves. #shake
You go back a step into somebody's table, and a cup goes over, and the whole bar's watching now.
+ [Shove him back]
    You shove him back, harder. He grins like that's what he wanted. #shake
    "There she is." #speaker:boss_son
+ [Look at the boss]
    You look at the boss. The boss shrugs, and smiles, and drinks.
    "Boys will be boys. Go on. Indulge him." #speaker:boss
- "Fists. Put the stick down, unless you need it." #speaker:boss_son
You lean your staff against the counter.
"Not near the bottles!" #speaker:barkeep
The crews pull their stools back to make a ring, and somebody's already taking bets. #move:crew-3:180 #move:drinker:420 #move:son-bar:270
"First one down." #speaker:boss_son #combat:son_spar:c2day4_after_spar
-> END

=== c2day4_after_spar ===
{ spar_won:
    He's on the floor, and he doesn't get up straight away. The bar doesn't make a sound.
    Then the boss laughs, too loud, and claps, and everybody claps with him.
    "This isn't over." #speaker:boss_son
    He says it quietly, so only you hear.
- else:
    You're on the floor. He stands over you with his arms up while the bar cheers him.
    "Lucky. Not tough." #speaker:boss_son
    "There. Now everyone's happy." #speaker:boss
}
"Tomorrow, the picked fields." #speaker:boss
"The old man says there's been someone on our ground at the far end. Go and dig there with him. Just to be seen." #speaker:boss
~ c2day4 = "home"
~ circle_night = false
~ objective = "Go home"
~ objective_target = "shack:bed"
You pick up your staff from the counter. On your way out, the watcher speaks to you for the first time. #time:night
"Where do you dig, when you're not where you say?" #speaker:watcher
He doesn't wait for an answer.
-> END

// --- Night, the shack ---

=== c2day4_bed ===
{ brother_moved:
    His bed's empty. The shack's never been this quiet.
    Under the floor, {dog_name} shifts, and sighs, and you hear it settle with its nose against the gap in the panel, where it can smell you.
- else:
    Your brother's asleep. He hasn't said a word to you since the yard.
    Under the floor, {dog_name} sighs.
}
~ c2day4 = "done"
~ c2day5 = "fields"
~ objective = ""
~ objective_target = ""
Tomorrow, the far end of the fields, to be seen. #wake:picked-fields:860:232:c2day5_start #endday:Day 5
-> END
