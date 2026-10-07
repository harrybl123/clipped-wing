// ============================================================================
// Chapter 2, Day 1: scraping by. Draft text from docs/sequences/chapter-2/part-1.md, for the designer to
// rewrite. Opens on the picked fields, digging (designer: not waking at home, as Act 1 did); stragglers
// from elsewhere take your finds (designer: stragglers first, then the food crisis); your brother gives up
// his light to buy food; tribute night at the tally house, where you come up short and the boss lets you off.
// The day moves on through the stages in `c2day1` (main.ink); the area knots send you here at the right stage.
// ============================================================================

// --- Morning, the picked fields ---

=== c2day1_start ===
The picked fields. Everybody's dug them. Everybody's still digging them.
Your brother hasn't eaten since yesterday morning. Neither have you.
~ c2day1 = "dig"
~ digging = true
~ objective = "Dig for finds"
~ objective_target = "picked-fields:dig-1"
-> END

=== c2day1_dig_1 ===
You work the edge of somebody's spoil heap, where the sieves miss things. #sound:scratch
A coil of wire, fine as hair, still bright inside. It'll weigh something.
~ dug_1 = true
~ finds += 1
~ objective_target = "picked-fields:dig-2"
-> END

=== c2day1_dig_2 ===
By the bent mast the ground's been turned so many times it's soft as flour. #sound:scratch
Your fingers find a ring of pale casing, no bigger than your palm, smooth as an egg. Somebody will want it, for something.
~ dug_2 = true
~ finds += 1
~ objective_target = "picked-fields:dig-3"
-> END

=== c2day1_dig_3 ===
Out past the hull, where nobody bothers. You dig down an arm's length, then another. #sound:scratch
A cube of dark glass. Inside it, faint, a light that turns when you turn it.
That's food for a week. More.
~ dug_3 = true
~ finds += 1
~ digging = false
~ stragglers_here = true
~ objective = ""
~ objective_target = ""
When you look up, there are three people standing over you. #show:straggler-1 #show:straggler-2 #show:straggler-3
Not pickers. Nobody you know. They've come in off the plain, from wherever people come from, and they look like they've walked the whole way.
"That's a nice bag." #speaker:straggler_thin
+ [Who are you?]
    "Who are you? You're not from here." #speaker:scavenger
    "Nobody's from here." #speaker:straggler_thin
+ [Walk away]
    You sling the satchel round your back and start for the settlement. The big one steps into your path. He doesn't hurry.
+ [Ready your staff]
    You slide the staff off your back. The blocks knock together along the core.
    "Oh, she's got a stick." #speaker:straggler_thin
- "We've walked a long way. Hand it over, and we'll walk on." #speaker:straggler_big
"I've got a brother to feed." #speaker:scavenger
"Everyone's got someone." #speaker:straggler_thin #combat:stragglers:c2day1_after_stragglers
-> END

=== c2day1_after_stragglers ===
{ stragglers_won:
    The thin one's on his back in the dirt. The big one's backing away, one hand pressed to his ribs.
    Then you feel how light your satchel is.
- else:
    You're on your knees in the dirt, and your staff is a long way off.
}
The third one, the small one, is already halfway to the horizon. Your satchel's strap has been cut clean through, and the flap hangs open. #hide:straggler-3
Everything you dug today is going with them.
{ stragglers_won:
    You could chase them. You'd never catch them: they run like people who've done this before. #hide:straggler-1 #hide:straggler-2
- else:
    The other two step over you and follow, not hurrying. #hide:straggler-1 #hide:straggler-2
}
~ finds = 0
~ stragglers_here = false
A whole morning, and nothing to show for it. #time:afternoon
~ c2day1 = "brother"
~ objective = "Find your brother"
~ objective_target = "swap-yard:brother"
-> END

=== c2day1_friend ===
"I saw them go past. Stragglers." #speaker:scav_friend
"That's the third lot this month, walking in from wherever it is they walk in from. Did they get much?" #speaker:scav_friend
"Everything." #speaker:scavenger
"Oh, love." #speaker:scav_friend
"Your brother was at the yard, with the kid. You should find him before he finds out from someone else." #speaker:scav_friend
-> END

// --- Afternoon, the swap yard ---

=== c2day1_brother ===
"There you are! Did you find anything? Show me. Show me!" #speaker:brother
+ [Tell him the truth]
    "I found plenty. Then someone took it." #speaker:scavenger
+ [Tell him nothing today]
    "Nothing today." #speaker:scavenger
    He looks at your satchel, at the cut strap hanging off it. He isn't stupid.
- "Was it the other clan?" #speaker:brother
"No. Just people. From somewhere else." #speaker:scavenger
"I'm not that hungry anyway." #speaker:brother
His stomach makes a noise loud enough to hear over the yard.
He digs in his pocket and holds something out: his light, the tin thing off the end of his collection, the one that still glows a little at night.
"Trade it. It glows. That's worth something, isn't it?" #speaker:brother
+ [Take it]
    "I'll find you a better one. I promise." #speaker:scavenger
    "A brighter one." #speaker:brother
+ [Tell him to keep it]
    "Keep it. It's yours." #speaker:scavenger
    "Then we don't eat. That's stupid." #speaker:brother
    He pushes it into your hand and runs off before you can give it back.
- ~ traded_light = true
~ c2day1 = "trade"
~ objective = "Trade for food"
~ objective_target = "swap-yard:food-stall"
It's warm from his pocket. #hide:brother
-> END

=== c2day1_trade ===
The trader turns your brother's light over in her fingers, then cups her hands round it to see the glow.
"Glows, does it?" #speaker:food_trader
-> c2day1_trade_haggle

=== c2day1_trade_haggle ===
"At night." #speaker:scavenger
"Everything glows at night, if you want it to enough. Two bowls." #speaker:food_trader
+ [It's worth four]
    "It's worth four, and you know it." #speaker:scavenger
    "It's worth what I'll give you. Two." #speaker:food_trader
+ [Take the two]
- Dried root, and two scoops of whatever's in the pot. Your brother's light goes in a box under the counter with a hundred other things.
~ food = 2
The light's going. And tonight's tribute night. #time:evening
~ c2day1 = "tribute"
~ tribute_night = true
~ objective = "Pay your tribute"
~ objective_target = "tally-house:tallyman"
-> END

// --- Evening, the tally house ---

=== c2day1_tribute ===
The whole settlement's here, in a queue along the rail, everyone looking at what everyone else brought.
When it's your turn the tallyman doesn't look up.
"Name." #speaker:tallyman
You give it. He finds your sign on the slate.
"On the scale." #speaker:tallyman
+ [I was robbed]
    "I had finds. Good ones. Stragglers took them, out on the fields." #speaker:scavenger
    "The scale doesn't weigh stories." #speaker:tallyman
+ [Put the food on the scale]
    You set the bowls on the dish. It barely moves.
    "Food isn't finds. Take it off." #speaker:tallyman
+ [Say nothing]
    You put your empty hands on the counter.
- "Short." #speaker:tallyman
He draws a line through your sign. The queue goes quiet.
The enforcer comes off the wall.
"Short?" #speaker:enforcer
"It's the first time." #speaker:scavenger
"It's always the first time." #speaker:enforcer
The enforcer takes hold of your satchel, what's left of the strap, and pulls you round to face the queue.
"Let her go." #speaker:boss
The boss comes away from the grille, where he's been watching all evening, and the queue opens to let him through. The watcher comes after him, a step behind, the way he always is.
"Look at her. She's been rolled. Haven't you?" #speaker:boss
"Stragglers. Three of them. Out on the picked fields." #speaker:scavenger
"Hear that? Strangers on our ground, taking from our own." #speaker:boss
He puts a hand on your shoulder. It's warm, and heavy.
"Nobody goes hungry for being robbed. Not here. Not while I'm here." #speaker:boss
"Next week, you bring double. Yes?" #speaker:boss
+ [Thank him]
    "Thank you." #speaker:scavenger
    "Don't thank me. Bring double." #speaker:boss
+ [Double?]
    "Double? Off the picked fields?" #speaker:scavenger
    "I'm sure you'll find a way." #speaker:boss
    He smiles. Everybody in the queue looks somewhere else.
- ~ owe_double = true
~ c2day1 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
The watcher hasn't taken his eyes off you once. #time:night
~ tribute_night = false
-> END

// --- Night, the shack ---

=== c2day1_bed ===
Your brother's asleep in the loft, his hand open on the blanket where the light used to be.
You put one bowl by his pillow. You eat half the other, and put the rest by his.
Double, next week. Off the picked fields, where there's nothing left but bolts and dirt. Nobody brings double off the picked fields.
There's one place nobody's picked clean. The sunk town. Rich, they say, and people go down and don't come up.
~ c2day1 = "done"
~ objective = ""
~ objective_target = ""
You lie awake a long time, listening to him breathe. #wake:shack:382:184 #endday
-> END
