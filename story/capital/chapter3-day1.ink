// ============================================================================
// Chapter 3, Day 1: the heir. Draft text from docs/sequences/chapter-3/plan.md, for the designer to rewrite
// (snappy, short lines that land: designer). The spar with your hand on the balcony at dawn (designer), then
// duties together (designer): a petition at the audience, the official walk on the promenade, the day's
// requests at the data centre, seating the banquet; your friend on the balcony; your sister at your
// telescope. Each duty has a small decision you'll see the result of later (designer: your work carries
// weight), posed plainly by whoever hands you the work (designer: every decision clear and direct).
// The day moves on through the stages in `c3day1` (main.ink); people and things in the areas show by stage.
// ============================================================================

// --- Dawn, your quarters ---

=== c3day1_start ===
~ c3day1 = "wake"
Somebody knocks. Then the door opens anyway. #beside:hand:-76
"Up." #speaker:diplomat
Your hand, in the doorway, two practice blades under his arm.
"It's barely light." #speaker:prince
"Then you'll see me coming. Balcony." #speaker:diplomat #walk:hand:526:50
~ c3day1 = "spar"
~ objective = "Meet your hand on the balcony"
~ objective_target = "prince-quarters:hand"
-> END

// Stepping out onto the balcony (a trigger).
=== c3day1_tree ===
~ tree_seen1 = true
The whole city below you, pale in the early light. And far off, low on the horizon, the tree.
-> END

// Your hand, by stage: on the balcony, waiting for you.
=== c3day1_hand ===
{ c3day1 == "spar": -> c3day1_spar }
"Balcony." #speaker:diplomat
-> END

=== c3day1_spar ===
He tosses you a blade. You catch it by the hilt and thumb it on: it hums into a line of wine, turned down to a dull glow. #sound:shimmer
His is the city's cyan.
"Until one of us yields." #speaker:diplomat
"You always say that." #speaker:prince
"And you never do." #speaker:diplomat #combat:spar_hand:c3day1_after_spar
-> END

=== c3day1_after_spar ===
{ spar1 == "won":
    Your point's at his throat, and he's laughing. #beside:hand:24
    "Your father's son." #speaker:diplomat
- else:
    His point's at your throat. You didn't see it come. #beside:hand:24
    "Again tomorrow." #speaker:diplomat
}
At the end he'd stepped inside your guard. An elbow, a foot behind yours. Not a fencing master's trick.
"Where did a diplomat learn that?" #speaker:prince
"Here and there." #speaker:diplomat
He thumbs his blade off.
"Your duties." #speaker:diplomat
"The audience: your father's giving you a petition to decide." #speaker:diplomat
"The promenade: you're inspecting the city watch's new posts. Then the data centre: the day's requests want your mark." #speaker:diplomat
"And tonight you seat the banquet." #speaker:diplomat
"Seat it?" #speaker:prince
"Who sits where. You'll see. Get dressed. I'll walk you down." #speaker:diplomat
~ hand_with_you = true
~ c3day1 = "halls"
~ objective = "Take your seat in the audience hall"
~ objective_target = "audience-hall:seat-1"
Dressed, you go down with him. #goto:citadel-halls:110:136
-> END

// --- Morning, the halls ---

// Part way along the gallery (a trigger): who's at the audience, and who to watch.
=== c3day1_brief ===
~ brief1 = true
"Two people will ask your father for something this morning. Then he'll give you a third to decide yourself." #speaker:diplomat
"First, a merchant. He makes the glass for half the city's windows, and he wants more power for his furnaces." #speaker:diplomat
"Then an envoy, from one of the places outside the city that send us what we need. He's waited three days to be heard." #speaker:diplomat
"What should I watch for?" #speaker:prince
"Your father. What he says yes to, and what he won't talk about." #speaker:diplomat
-> END

// Your hand, walking with you.
=== c3day1_hand_walk ===
{ c3day2 == "below": -> c3day2_hand_below }
{ c3day1:
- "halls": "Your seat's below your father's. The audience is waiting." #speaker:diplomat
- "audience": "Your seat's below his. Sit." #speaker:diplomat
- "walk": "The commander's waiting for you, by the stalls." #speaker:diplomat
- "requests": "The data centre. Down the lifts." #speaker:diplomat
- else: "Highness." #speaker:diplomat
}
-> END

// --- Morning, the audience hall ---

// Waiting their turn by the benches.
=== c3day1_waiting ===
"Highness." #speaker:them
-> END

=== c3day1_father ===
{ c3day1:
- "audience": "Your seat, please." #speaker:father
- "walk": "The city's waiting for your face." #speaker:father
- else: He has his eyes shut.
}
-> END

=== c3day1_captain ===
"Highness." #speaker:captain
-> END

=== c3day1_audience ===
~ c3day1 = "audience"
You take your seat, a step below the throne. Your hand stands at your shoulder.
Your father doesn't look at you. He lifts two fingers.
"Begin." #speaker:father
The merchant comes up to the rope. #walk:merchant:524
"Majesty. Highness." #speaker:merchant
"My furnaces want more power than I'm allowed. More power, more glass. The city's short of windows." #speaker:merchant
"He's right. He's also rich." #speaker:diplomat
Your father nods, once.
"Granted." #speaker:father
"Majesty." #speaker:merchant #walk:merchant:330
The envoy next, dust still on his coat. #walk:envoy-1:524
"Majesty. I've come a long way." #speaker:envoy
"I know." #speaker:father
"Then you know what I've come to ask." #speaker:envoy
"My people can't keep sending what the capital asks of them. I've come to ask you to take less." #speaker:envoy
"Not today." #speaker:father
The envoy looks at him for a long moment. Then he bows, and goes. #leave:envoy-1:30:40
"Three days, he's waited." #speaker:diplomat
"The third is yours." #speaker:father
He still doesn't look at you.
A woman comes up to the rope, in her best coat, which isn't much. #walk:woman:524
"Highness. The lift on my street's been broken a month." #speaker:petitioner
"Eleven flights. My mother can't do them. Half the street can't." #speaker:petitioner
"I've asked every week. Today I came up here." #speaker:petitioner
"The engineer's crew could go today. But this afternoon they're putting in the glassworks' power." #speaker:diplomat
"Mend her lift, and the merchant waits a day for what your father just gave him. Or tell her it'll be seen to." #speaker:diplomat
Your father says nothing. It's yours.
Her street's lift. What do you tell her?
+ [Mend it today. The glassworks waits.]
    ~ lift_mended = true
    ~ lean += 1
    "The crew goes to your street today." #speaker:prince
    She stares at you. Then she bows, too low, and nearly loses her footing on the step.
    "Thank you, Highness. Thank you." #speaker:petitioner
    The merchant, back at the benches, has heard. He bows to you anyway. His smile doesn't move.
+ [It'll be seen to.]
    ~ lean -= 1
    "It'll be seen to." #speaker:prince
    "Yes, Highness." #speaker:petitioner
    She's heard it before.
- She goes, back down to her eleven flights. #leave:woman:30:40
~ c3day1 = "after"
The audience is over. The hall empties. #leave:merchant:30:40 #leave:petitioner-1:30:40 #leave:petitioner-2:30:40 #leave:petitioner-3:30:40 #leave:petitioner-4:30:40 #leave:petitioner-5:30:40 #leave:courtier-1:30:40 #leave:courtier-2:30:40
For a moment your father sits with his eyes shut.
"Every yes is a no somewhere else." #speaker:father
+ [Then say no less often.]
    ~ lean += 1
    "Then say no less often." #speaker:prince
    He opens his eyes, and looks at you for the first time today.
    "Spoken like someone who's never had to." #speaker:father
+ [Then choose who it's to.]
    ~ lean -= 1
    "Then choose who it's to." #speaker:prince
    He opens his eyes, and looks at you for the first time today.
    "Yes. That's the whole of it." #speaker:father
- "The watch is waiting for you on the promenade. Let the city see your face." #speaker:father #time:afternoon
~ c3day1 = "walk"
~ objective = "Inspect the watch on the promenade"
~ objective_target = "promenade:commander-1"
-> END

// --- Afternoon, the promenade ---

// The stall keeper, as you pass (a trigger).
=== c3day1_stall ===
~ stall1 = true
"Highness! Taste it. Please. Fresh this morning." #speaker:c3_citizen_1
He pushes a hot bun into your hand before your guard can stop him. It's very good.
-> END

// Your duty: inspecting the city watch with its commander (designer: a job to be doing when you see the
// chalk). He asks to clear the street sellers off the square for good; then he shows you why.
=== c3day1_commander ===
{ bird1: -> c3day1_commander_after }
"Highness. The city watch, at your inspection." #speaker:commander
"The commander of the city watch. Your father's guard keeps the citadel; the watch keeps the city." #speaker:diplomat
"Two to a post, all along the promenade. But my men can't see across the square for the stalls." #speaker:commander
"I want the street sellers cleared off the square. For good. Then the watch can see from one end to the other." #speaker:commander
"Where do the sellers go?" #speaker:prince
"Somewhere else, Highness." #speaker:commander
"Most of them live on what they sell here." #speaker:diplomat
Clear the street sellers off the square for good? The watch sees everything, and the sellers lose their pitches. Or they stay, and the watch keeps looking round them.
+ [Clear the square.]
    ~ stalls_cleared = true
    ~ lean -= 1
    "Clear it." #speaker:prince
    "Tomorrow, Highness." #speaker:commander
    The cook at the nearest stall has heard you. He stops stirring.
+ [Let the sellers stay.]
    ~ lean += 1
    "They stay." #speaker:prince
    "Then my men keep looking round them, Highness." #speaker:commander
    She doesn't argue. She doesn't look pleased, either.
- "Then you should see why I asked. Behind the stalls, at the back of the square." #speaker:commander #walk:commander-1:282
-> c3day1_bird

// The chalk bird, being scrubbed off the back wall of the square.
=== c3day1_bird ===
~ bird1 = true
Up on the great screen over the square, your face, ten feet high, beside your father's.
Under it, at the back wall, a man in the city's overalls is scrubbing.
Chalk, half gone already: a bird, wings up, rising off a line of bare ground, in a ring.
One of your guards steps between you and it. #walk:escort:286:60
"Don't look, Highness." #speaker:c3_guard_0
"What is it?" #speaker:prince
"The third this week, here. Kids, after dark, behind the stalls where my men can't see." #speaker:commander
Your hand doesn't say anything. But he looks at it a moment too long.
"The data centre. The day's requests." #speaker:diplomat
~ c3day1 = "requests"
~ objective = "Sign the day's requests"
~ objective_target = "data-centre:operator-1"
-> END

=== c3day1_commander_after ===
"Highness." #speaker:commander
-> END

=== c3day1_scrubber ===
"Nearly gone, Highness. Sorry, Highness." #speaker:them
-> END

// --- Afternoon, the data centre ---

=== c3day1_requests ===
"Highness." #speaker:operator
She walks you down the racks. Lights run along them, in and out, never stopping.
"Requests, going out. Output, coming in." #speaker:operator
"Going out where?" #speaker:prince
"Out, Highness." #speaker:operator
Nobody ever says further.
She hands you the day's sheet. Short of power again: every line a little less than yesterday's.
And one line on its own: low district, evenings, reduce.
"It wants your mark, Highness." #speaker:operator
Sign the day's requests, low district and all? Or ask about that line first?
+ [Sign it.]
    ~ signed_requests = true
    You sign it. Under your father's mark: it's already on it.
+ [Ask about the low district.]
    ~ queried_requests = true
    "The low district. Reduce what?" #speaker:prince
    "Power, Highness. In the evenings." #speaker:operator
    "Who decided that?" #speaker:prince
    She turns the sheet so you can see the corner. Your father's mark is already on it.
    "It goes through on his mark, Highness. Yours is the custom." #speaker:operator
    Sign it anyway, under his? Or leave it unsigned: it goes through either way, and your father hears you asked.
    ++ [Sign it anyway.]
        ~ signed_requests = true
        You sign it, under his.
    ++ [Leave it unsigned.]
        You hand it back without your mark. She takes it as if it might go off.
        "He'll hear I asked." #speaker:prince
        "Yes, Highness." #speaker:operator
- "That's the day's work. Go and change for the banquet. I'll see you there." #speaker:diplomat #leave:hand:34:50
~ hand_with_you = false
~ c3day1 = "banquet"
~ objective = "Seat the banquet"
~ objective_target = "banquet-gallery:steward"
It's later than you thought. #time:evening
-> END

// --- Evening, the banquet gallery ---

=== c3day1_steward ===
{ c3day1 == "cards": -> c3day1_steward_cards }
"Highness. The plan." #speaker:steward
He holds it out: the whole table, every place named but one.
"His Majesty's right hand. Three expect it." #speaker:steward
"The old councillor, his oldest friend. He's sat there twenty years." #speaker:steward
"The hostess. Her salon decides what's said about everyone at this table." #speaker:steward
{ lift_mended:
    "The merchant. You kept him waiting today. This would make up for it." #speaker:steward
- else:
    "The merchant. His Majesty gave him his power today. He'd like to be seen to have it." #speaker:steward
}
"Whoever you pass over will remember, Highness." #speaker:steward
Who sits at your father's right?
+ [The old councillor.]
    ~ seated = "councillor"
+ [The hostess.]
    ~ seated = "hostess"
    ~ standing += 1
+ [The merchant.]
    ~ seated = "merchant"
    ~ standing -= 1
- "Very good, Highness." #speaker:steward
He gives you three cards: one for your father's right, two for further down.
~ c3day1 = "cards"
~ objective = "Put the card at your father's right"
~ objective_target = "banquet-gallery:card-right"
-> END

=== c3day1_steward_cards ===
"Their cards, Highness." #speaker:steward
-> END

=== c3day1_card_right ===
~ right_placed = true
{ seated:
- "councillor": The old councillor's card, at your father's right hand. Where it's always been.
- "hostess": The hostess's card, at your father's right hand. The old councillor's sat there twenty years.
- "merchant": The merchant's card, at your father's right hand. The old councillor's sat there twenty years.
}
~ objective = "Put the other two cards down the table"
~ objective_target = "banquet-gallery:card-down"
-> END

=== c3day1_card_down ===
~ cards_done = true
The other two, further down, among everyone else.
The doors open, and the music starts. #sound:murmur
~ c3day1 = "toast"
Your father comes in last, and the room stands.
"To the steady ship." #speaker:father
The table answers him, glasses up. "The steady ship."
{ seated != "councillor":
    The old councillor finds his card halfway down the table. He reads it twice. He sits.
}
{ seated != "hostess":
    The hostess reads her card, smiles at you, and says something behind her glass to the woman beside her.
}
{ seated != "merchant":
    The merchant looks at his card, and then at you, and laughs, too loudly.
}
{ seated != "councillor":
    Before the second course, the old councillor's chair is empty. #leave:councillor-down:30:40
}
One chair stays empty all evening. A family that sent its regrets.
Your friend's out on the balcony. He lifts his glass to you.
~ c3day1 = "friend"
~ objective = "Talk to your friend"
~ objective_target = "banquet-gallery:heir-1"
-> END

// The banquet's guests, by stage (the ones who expected your father's right hand).
=== c3day1_councillor ===
{ seated == "councillor":
    "Thank you, Highness. Your father's lucky in his son." #speaker:councillor
- else:
    "Highness." #speaker:councillor
    He doesn't look up from his plate.
}
-> END

=== c3day1_hostess ===
{ seated == "hostess":
    "Darling. You've made me very happy. My salon will talk of nothing else." #speaker:salon_hostess
- else:
    "Highness. Such a brave seating plan. Everyone's saying so." #speaker:salon_hostess
}
-> END

=== c3day1_merchant ===
{
- seated == "merchant": "Highness! At his right hand. My wife won't believe it." #speaker:merchant
- lift_mended: "Highness. My furnaces will be lit tomorrow, I'm told." #speaker:merchant
- else: "Highness." #speaker:merchant
}
-> END

=== c3day1_father_banquet ===
"You chose." #speaker:father
"Was it wrong?" #speaker:prince
"It was a choice. That's all any of them are." #speaker:father
-> END

// Your friend, on the balcony.
=== c3day1_friend ===
"There he is. The man who left me mid-move." #speaker:heir
"You were losing." #speaker:prince
"I was luring you in." #speaker:heir
Below you the city's lights, row on row, all the way down.
"All those people, and not one of them has to sit through my mother's dinners." #speaker:heir
"Finish the game tomorrow?" #speaker:heir
+ [Tomorrow.]
    "Tomorrow." #speaker:prince
    "I'll leave the board as it is. Don't touch it." #speaker:heir
+ [When I'm not seating banquets.]
    "When I'm not seating banquets." #speaker:prince
    "So never, then." #speaker:heir
- He clinks his glass on yours.
"Go on. Your father's watching you talk to me instead of them." #speaker:heir
~ c3day1 = "night"
~ objective = "Go to bed"
~ objective_target = "prince-quarters:bed-1"
-> END

// --- Night, your quarters ---

// Coming in (a trigger): somebody at your telescope.
=== c3day1_home ===
~ sister_called1 = true
Your rooms are dark. Somebody's at your telescope. #time:night
"Don't turn the lights on. You'll ruin it." #speaker:sister
~ objective = "Talk to your sister"
~ objective_target = "prince-quarters:sister-1"
-> END

=== c3day1_sister ===
{ sister_talked1: -> c3day1_sister_busy }
~ sister_talked1 = true
"Father went through the sealed door again tonight. Third time this week." #speaker:sister
"You were watching him?" #speaker:prince
"Somebody has to." #speaker:sister
"It hums when he's in there. Can you hear it? Up here, if everyone's quiet." #speaker:sister
You listen. Wind. The city. And under it, maybe, something.
"And look. Down there." #speaker:sister
She steps back from the telescope.
"The lights went out down there. Just one street. Just for a moment." #speaker:sister
You look. At the bottom of the city, every street's lit.
"They're back." #speaker:prince
"They are now." #speaker:sister
{ signed_requests:
    You think of the sheet you signed. Low district, evenings, reduce.
- else:
    You think of the sheet you wouldn't sign. Low district, evenings, reduce.
}
~ objective = "Go to bed"
~ objective_target = "prince-quarters:bed-1"
-> END

=== c3day1_sister_busy ===
"Go to bed. I'm busy." #speaker:sister
-> END

=== c3day1_bed ===
{ not sister_talked1: -> c3day1_sister_first }
Your sister's still at the telescope when you lie down.
~ c3day1 = "done"
~ c3day2 = "wake"
~ objective = ""
~ objective_target = ""
You lie awake a long time, listening for a hum. #wake:prince-quarters:120:226:c3day2_start #endday:Day 2
-> END

=== c3day1_sister_first ===
"Not yet. Come and look at this first." #speaker:sister
-> END
