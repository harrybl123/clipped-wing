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
"And you work like the rest of us. Tribute at the tally, a share for the circle, and your ground on the board, so nobody digs over anybody." #speaker:boss
"The board?" #speaker:scavenger
"In the side room. Every night the watcher puts up where each of us is digging tomorrow. Saves fights. Saves knives." #speaker:boss
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
{ evening_free: -> c2_evening_boss }
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
+ [It's on the board]
    "It'll be on the board. Like everyone's." #speaker:scavenger
    "The board says where you're going. It doesn't say where you've been." #speaker:boss_son
- "My father thinks you're lucky. I think you're a liar." #speaker:boss_son
"Let's settle it. You and me, here, now." #speaker:boss_son
"If I win, you tell the whole bar where you go every morning. Every one of them." #speaker:boss_son
"And if I win?" #speaker:scavenger
"Then I never ask again. And I'll tell anyone who does to mind their own." #speaker:boss_son
Everyone in the bar is listening now. Somebody's already shouting odds.
"Two to one the boy!" #speaker:barkeep
+ [Take the wager]
    "Fine." #speaker:scavenger
    The bar roars.
    ~ son_rivalry += 1
+ [Look at the boss]
    You look at the boss. The boss shrugs, and smiles, and drinks.
    "It's his wager, not mine. But I'd take it, if I were you. He's been asking everyone." #speaker:boss
    "Fine." #speaker:scavenger
- "Fists. Put the stick down, unless you need it." #speaker:boss_son
You lean your staff against the counter.
"Not near the bottles!" #speaker:barkeep
The crews pull their stools back to make a ring, and coins go down on the tables. #move:crew-3:180 #move:drinker:420 #move:son-bar:270
"First one down." #speaker:boss_son #combat:son_spar:c2day4_after_spar
-> END

=== c2day4_after_spar ===
~ spar_done = true
{ spar_won:
    -> c2day4_spar_won
- else:
    -> c2day4_spar_lost
}

=== c2day4_spar_won ===
He's on the floor, and he doesn't get up straight away. For a moment the bar doesn't make a sound.
Then it does. #bark:crew-1:Pay up!:hit #bark:crew-3:She dropped him! #bark:drinker:Ha!
Coins slap down on tables. Someone who bet on the boy kicks a stool over. #bark:crew-2:Rigged! #bark:player:Told you she had it
The boss laughs, too loud, and claps, and everybody claps with him.
"Never ask again. That was the wager." #speaker:scavenger
"This isn't over." #speaker:boss_son
He says it quietly, so only you hear.
~ son_rivalry += 1
-> c2day4_after_spar_end

=== c2day4_spar_lost ===
You're on the floor. He stands over you with his arms up, and the bar goes up with him. #bark:crew-1:Pay up!:hit #bark:crew-3:Told you! #bark:drinker:Ha!
Coins slap down on tables. #bark:crew-2:Easy money #bark:player:She nearly had him
"Well? The wager. Where do you go every morning?" #speaker:boss_son
The whole bar's waiting.
+ [The sunk town]
    ~ told_where = "sunk"
    "The sunk town. Deep. Deeper than anyone goes." #speaker:scavenger
    It's true. Just not the whole truth. A murmur goes round the room.
    "The sunk town. On her own." #speaker:boss_son
    He doesn't look like he believes it. Nobody else looks like they don't.
+ [The deep ground]
    ~ told_where = "deep"
    "The deep ground." #speaker:scavenger
    The bar goes quiet. Nobody goes to the deep ground.
    "Liar." #speaker:boss_son
    "You asked. I answered. That was the wager." #speaker:scavenger
    ~ enforcer_doubt += 1
- The bar goes back to its drinking, a little louder than before.
-> c2day4_after_spar_end

=== c2day4_after_spar_end ===
You take your staff back from the counter. The barkeep's already pouring you another, on the house, whichever way the bets went.
"Sit with us a while. The night's young." #speaker:boss
~ evening_free = true
~ c2day4 = "evening"
~ objective = "Sit with one of the circle"
~ objective_target = "bar:boss-bar,bar:watcher-bar,bar:enforcer-bar,bar:son-bar"
-> END

// --- The evening: sitting with one of the circle (your first; there'll be others) ---

=== c2_evening_done ===
~ evening_free = false
~ circle_night = false
~ c2day4 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
The night wears on. When you get up to go, the watcher's eyes follow you to the door. #time:night
-> END

=== c2_evening_boss ===
~ boss_trust += 1
~ boss_evenings += 1
{ boss_evenings == 1: -> c2_evening_boss_first }
"You again. Good." #speaker:boss
"My son doesn't like you. Don't take it hard. He doesn't like anyone I like." #speaker:boss
"He thinks everything I give away is his." #speaker:boss
-> c2_evening_end

=== c2_evening_boss_first ===
He pulls out the chair beside him, and pours for you himself.
"My father built this place. Out of scrap and shouting." #speaker:boss
"When I was your age there were five clans out here, and they all ate each other. Now there's two, and a line, and everybody eats." #speaker:boss
"That's what I do. I keep the line, and everybody eats." #speaker:boss
+ [It must cost you]
    "That must cost you something." #speaker:scavenger
    He looks at you a long moment, and for once the smile isn't there.
    "Everything worth having costs something." #speaker:boss
    ~ boss_trust += 1
+ [Everybody eats?]
    "Not everybody. Not on the edge." #speaker:scavenger
    "Not yet. Not yet." #speaker:boss
    He says it like he means it, and you believe him.
- -> c2_evening_end

=== c2_evening_watcher ===
~ watcher_evenings += 1
{ watcher_evenings == 1: -> c2_evening_watcher_first }
"You came back." #speaker:watcher
"Most people don't, to my table." #speaker:watcher
~ watcher_respect += 1
-> c2_evening_end

=== c2_evening_watcher_first ===
You sit down across from the watcher. He doesn't look up for a long time.
"The sunk town. Which way in?" #speaker:watcher
+ [The stairwell]
    "Down the stairwell. Past where the rope stops." #speaker:scavenger
    He nods, once, as if that's what he already knew.
    ~ watcher_respect += 1
+ [Why do you want to know?]
    "Why do you want to know?" #speaker:scavenger
    "Because you'd rather I didn't." #speaker:watcher
- "I don't care how you find things. I care who else knows where you go." #speaker:watcher
"Keep it that way." #speaker:watcher
-> c2_evening_end

=== c2_evening_enforcer ===
~ enforcer_evenings += 1
{ enforcer_evenings == 1: -> c2_evening_enforcer_first }
"Still lucky?" #speaker:enforcer
"Luck runs out. That's the thing about it." #speaker:enforcer
-> c2_evening_end

=== c2_evening_enforcer_first ===
The enforcer doesn't move to make room, so you sit on the end of the bench.
"Ten years I've held that gate. Nobody's ever brought four times." #speaker:enforcer
"Last time the other clan came over the line, I was younger than you. I watched them take my mother's whole season off her, and I did nothing." #speaker:enforcer
"I don't do nothing now." #speaker:enforcer
+ [Neither do I]
    "Neither do I." #speaker:scavenger
    "We'll see." #speaker:enforcer
+ [I'm not your enemy]
    "I'm not your enemy." #speaker:scavenger
    "Everyone says that. Right up until." #speaker:enforcer
    ~ enforcer_doubt += 1
- -> c2_evening_end

=== c2_evening_son ===
~ son_evenings += 1
{ spar_won: -> c2_evening_son_won }
"Sunk town, she says." #speaker:boss_son
"I'm going to find out where you really go. And when I do, my father will know too." #speaker:boss_son
~ son_rivalry += 1
-> c2_evening_end

=== c2_evening_son_won ===
He's nursing a cup and a swollen eye. He doesn't look at you.
+ [Offer him a drink]
    You put a cup in front of him. He looks at it a long time, and then drinks it.
    "Don't think this makes us friends." #speaker:boss_son
    ~ son_rivalry -= 1
+ [Rub it in]
    "Never ask again. You said." #speaker:scavenger
    "I remember what I said." #speaker:boss_son
    ~ son_rivalry += 1
- -> c2_evening_end

=== c2_evening_end ===
{ c2day4 == "evening": -> c2_evening_done }
{ c2day5 == "evening": -> c2day5_evening_done }
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
~ c2day5 = "town"
~ objective = ""
~ objective_target = ""
You're one of the circle now. You lie awake trying to work out what that means. #wake:swap-yard:600:232:c2day5_start #endday:Day 5
-> END
