// ============================================================================
// Chapter 3, Day 3: two weeks on. Draft text from docs/sequences/chapter-3/plan.md, for the designer to
// rewrite. The district you darkened has been dark for two weeks, and the symbol has spread. Your father's in
// the sealed wing more than he's out of it, so his work comes to you: you hold the audience alone (the warden;
// the envoy: the medium choice), sign the day's requests (he's cut the streets where the symbol keeps turning
// up: pushback 1), show your face at the salon, and go below with your hand: the screens pay for names
// (pushback 2) and you watch it work; you get to the hideout without being seen by anyone who'd report you
// (designer: informants, not your own guards); the hideout, the first time. Stages in `c3day3` (main.ink).
// ============================================================================

// --- Morning, your quarters ---

=== c3day3_start ===
~ c3day3 = "wake"
~ streets_cut = true
~ rewards = true
{ energy == "high":
    Two weeks. The low district's still dark every evening.
- else:
    Two weeks. The upper city's still dark every evening, and your rooms are still half-lit.
}
And the wing's everywhere now. On walls you can see from the lifts. Scratched into the lifts' glass.
Every so often, the citadel's own screens show it for a moment, then cut out. Nobody can find where it comes from.
Your hand, at the door. #beside:hand-3:-60
"Your father's in the sealed wing. He's been there all night again." #speaker:diplomat
"So his work's yours today. Three things." #speaker:diplomat
"Hold the audience. Alone: he won't be there." #speaker:diplomat
"Sign the day's requests." #speaker:diplomat
"And show your face at the salon tonight. Let them see you smiling." #speaker:diplomat
~ c3day3 = "audience"
~ hand_with_you = true
~ objective = "Hold the audience"
~ objective_target = "audience-hall:seat-3"
-> END

// Your hand, walking with you.
=== c3day3_hand ===
{ c3day3:
- "audience": "Your seat. He won't be in his." #speaker:diplomat
- "below": "Down. The lifts." #speaker:diplomat
- "sneak": "In. Quick." #speaker:diplomat
- "home": "Well? Now you know. Up, before it's light." #speaker:diplomat
- else: "Highness." #speaker:diplomat
}
-> END

// --- Morning, the audience hall: alone ---

=== c3day3_audience ===
~ c3day3 = "hearing"
The throne's empty. You sit on your seat, a step below it. Your hand stands at your shoulder.
The first time you've done this alone.
{ energy == "high":
    "The warden of the Weavers' Row, Highness. Under the promenade." #speaker:captain
- else:
    "The warden of the Weavers' Row, Highness. In the low district." #speaker:captain
}
A man in a worn coat comes up to the rope, with a list in his hand. #walk:warden:524
"Highness. The wing's on every wall in my streets. Every morning there are more." #speaker:warden
"My people are frightened of it. And frightened of being seen near it." #speaker:warden
"Give me men to scrub the walls. Twenty would do it." #speaker:warden
"Scrub them and they're clean by tonight. And painted again by morning." #speaker:diplomat
Send twenty men to scrub the Weavers' Row's walls?
+ [Send them. Scrub the walls clean.]
    ~ scrubbed = true
    ~ lean -= 1
    "Twenty men. Today." #speaker:prince
    "Thank you, Highness." #speaker:warden
    He bows, and goes, nearly smiling. #leave:warden:30:40
+ [Leave it. It's only chalk.]
    ~ lean += 1
    "Leave it. It's chalk. It washes off." #speaker:prince
    "It isn't washing off, Highness. It's spreading." #speaker:warden
    He bows, and goes. #leave:warden:30:40
- "The envoy, Highness. He's waited two weeks." #speaker:captain
The envoy comes up to the rope, the same dust on his coat. #walk:envoy-3:524
"Highness. I said I'd wait." #speaker:envoy
"Your father hasn't heard me in two weeks. So I'll ask you." #speaker:envoy
"My people can't keep sending what the capital asks of them. Next season, let us send less." #speaker:envoy
"Yes or no. I'll take either home. I've been gone a month." #speaker:envoy
The envoy's people: let them send less next season, or not?
- (choose)
+ [Grant it. His people send less.]
    His people keep more of what they make next season. He goes home with your word.
    The capital gets less, and your father will hear that you gave it.
    ++ [Yes. Grant it.]
        ~ envoy = "granted"
        ~ lean += 1
        "Granted. Send less next season." #speaker:prince
        He looks at you a long moment, as if to check you meant it. Then he bows, low.
        "They'll remember who said yes, Highness." #speaker:envoy #leave:envoy-3:30:40
    ++ [No. Think again.]
        -> choose
+ [Refuse it. They send what they always have.]
    Nothing changes. The capital gets what it always has.
    He goes home after a month with nothing, and his people will know it was you who said no.
    ++ [Yes. Refuse it.]
        ~ envoy = "refused"
        ~ lean -= 1
        ~ standing += 1
        "No. The same as always." #speaker:prince
        "Then I've waited two weeks to hear what your father said in a breath." #speaker:envoy
        He bows exactly as low as he has to, and goes. #leave:envoy-3:30:40
    ++ [No. Think again.]
        -> choose
- The hall empties. #leave:petitioner-1:30:40 #leave:petitioner-2:30:40 #leave:petitioner-3:30:40 #leave:petitioner-4:30:40 #leave:petitioner-5:30:40 #leave:courtier-1:30:40
{ envoy == "granted":
    "He won't like that one." #speaker:diplomat
- else:
    "You said it the way he would have." #speaker:diplomat
}
"The day's requests next. I've letters to see to. You know the way." #speaker:diplomat #leave:hand:34:50
~ hand_with_you = false
~ c3day3 = "requests"
~ objective = "Sign the day's requests"
~ objective_target = "data-centre:operator-3"
It's past noon already. #time:afternoon
-> END

=== c3day3_captain ===
"Highness." #speaker:captain
-> END

// --- Afternoon, the data centre ---

// Your duty, as on Day 1, but this time you read it: your father's cut the streets where the wing is
// (pushback 1), and, if you granted the envoy, put his place's line back as it was.
=== c3day3_requests ===
{ c3day3 != "requests":
    "That's today's, Highness. All done." #speaker:operator
    -> END
}
~ c3day3 = "signing"
"The day's sheet, Highness." #speaker:operator
This time you read it. Every line.
Less power again, everywhere, a little.
{ scrubbed:
    Your own order, from this morning: twenty men to the Weavers' Row, to scrub the walls.
}
Then a line you didn't write, with your father's mark on it, made last night.
{ energy == "high":
    STREETS CUT: the Weavers' Row, and five streets round it. Power off, day and night, until the walls are clean.
- else:
    STREETS CUT: the Weavers' Row, and five streets of the low district round it. The power you gave them, off, day and night, until the walls are clean.
}
"Six streets. Where the wing keeps turning up." #speaker:operator
{ envoy == "granted":
    And under it, in his hand, the ink still fresh: the envoy's place. What it sends next season: the same as always.
    You granted it this morning. He's put it back.
}
"His mark's already on it, Highness. It goes through either way." #speaker:operator
Sign under his mark? Or leave it unsigned: it goes through anyway, and he'll hear that you didn't.
+ [Sign it.]
    ~ signed3 = true
    ~ lean -= 1
    You sign it, under his.
+ [Leave it unsigned.]
    ~ lean += 1
    You hand it back without your mark.
    "He'll hear, Highness." #speaker:operator
    "Let him." #speaker:prince
- The captain's in the doorway. You don't know how long he's been there. #show:captain-3d
"His word, Highness. Last night." #speaker:captain
"Nobody asked me." #speaker:prince
"No, Highness." #speaker:captain
~ c3day3 = "salon"
~ objective = "Show your face at the salon"
~ objective_target = "glasshouse:hostess-3"
It's getting dark outside. #time:evening
-> END

// --- Evening, the glasshouse: the salon ---

// Upper society, warm to your face and careful (designer: high society isn't safe either).
=== c3day3_guest ===
{ shuffle:
- "Highness! You came. We'd heard you were terribly busy." #speaker:them
- "A councillor's nephew was asked some questions last week. By whom, nobody will say." #speaker:them
- "We don't talk about the low district here any more, Highness. It's bad luck." #speaker:them
- "Fewer of us every week. People are going to the country early." #speaker:them
}
-> END

=== c3day3_councillor ===
"Highness. I'm told I should be careful what I say at salons now." #speaker:councillor
"So: a lovely evening." #speaker:councillor
-> END

=== c3day3_cousin ===
"Highness. My cousin's salon has never been so well behaved." #speaker:cousin
-> END

=== c3day3_hostess ===
{ hostess3:
    "Your friend's by the fountain, darling. Go on." #speaker:salon_hostess
    -> END
}
~ hostess3 = true
She takes your arm before you've said a word, and walks you to the edge of the terrace, away from everyone.
"Darling. Tell me something true." #speaker:salon_hostess
{ energy == "high":
    "Is it true your father cut the lights on the Weavers' Row? Half my guests have cousins there." #speaker:salon_hostess
- else:
    "Is it true your father's cut the lights you gave the low district? Over your head?" #speaker:salon_hostess
}
"Whatever you tell me, they'll believe. By morning, so will everyone up here." #speaker:salon_hostess
Tell her the truth, or cover for your father?
+ [The truth: "Yes. Last night."]
    ~ salon_truth = true
    ~ lean += 1
    ~ standing += 1
    "Yes. Last night. Six streets." #speaker:prince
    She looks at you for a moment. Then she squeezes your arm.
    "Thank you, darling. Nobody up here tells me anything any more." #speaker:salon_hostess
+ [Cover for him: "A fault. It'll be mended."]
    ~ lean -= 1
    "A fault. It'll be mended." #speaker:prince
    "Of course it will." #speaker:salon_hostess
    She smiles. She doesn't believe a word, and she'll repeat every one of them.
- "Your friend's down by the fountain. He's been quiet all evening. Go and cheer him up." #speaker:salon_hostess
~ c3day3 = "friend"
~ objective = "Find your friend"
~ objective_target = "glasshouse:heir-3"
-> END

// Your friend, quieter than usual: a joke that doesn't land.
=== c3day3_friend ===
{ friend3:
    "Go on. You've somewhere to be. You always do now." #speaker:heir
    -> END
}
{ not hostess3:
    "The hostess is looking for you. Go and be charming first." #speaker:heir
    -> END
}
~ friend3 = true
Your friend, on the edge of the fountain, turning his glass. He doesn't see you until you sit.
"There he is. The prince who holds audiences now." #speaker:heir
"Two weeks, and you're doing his job. Next you'll grow the beard." #speaker:heir
He waits for you to laugh.
"Have you heard? Below, they're paying people for names now. Anyone who says the wrong thing." #speaker:heir
"I've been thinking of turning in my mother. I'd make a fortune." #speaker:heir
He laughs. Nobody near the fountain does. He stops, and looks at his glass.
"Joke." #speaker:heir
+ [Careful.]
    "Careful." #speaker:prince
    "Always am." #speaker:heir
+ [It was funny.]
    "It was funny." #speaker:prince
    "Liar." #speaker:heir
    But he smiles.
- "Go on. You've somewhere to be. You always do now." #speaker:heir
~ c3day3 = "office"
~ objective = "Go to your hand's office"
~ objective_target = "diplomats-office:hand-3o"
-> END

// --- Night: below, with your hand ---

=== c3day3_office ===
"Faster tonight. Coat." #speaker:diplomat #time:night
~ plain_coat = true
~ hand_with_you = true
~ c3day3 = "below"
~ objective = "Go down to the low district"
~ objective_target = "lifts:to-low-district"
He holds out the plain coat, and he's through his door before you've got your arm in the sleeve. #goto:lifts:64:130:c3day3_lifts
-> END

// At the top of the lifts: the wing, scratched into the glass.
=== c3day3_lifts ===
The lift operator isn't looking at you tonight. He's looking at the glass.
Someone's scratched the wing into it, at eye height. He's been rubbing at it with his sleeve.
"Won't come off, Highness." #speaker:lift_operator
-> END

// Coming into the low district (a trigger): it's dark; only the screens are lit, and you watch them work
// (pushback 2). Then your hand goes on ahead to the hideout, openly (people greet him: clue 3), and you
// follow without being seen.
=== c3day3_low ===
~ low3 = true
{ energy == "high":
    The low district, two weeks dark.
- else:
    The low district. Dark again: your father's cut the streets you gave their light.
}
Only the screens are lit. Every one says the same thing, white on blue.
REPORT IT. Anyone who speaks against the citadel. Anyone who chalks the wing. A reward, for every name.
On his step across the street, a man shouts something at the nearest screen.
Two of the city watch come up the street, with lanterns. #show:watch-3a #show:watch-3b #walk:watch-3a:500:60 #walk:watch-3b:520:60
A door opens. A woman steps out, and points at him. #show:informer #walk:informer:424:40
"Him. He shouts at the screens. Every night." #speaker:c3_citizen_10
The watch take him by the arms. #walk:watch-3a:412:50 #walk:watch-3b:388:50
"I shouted at a screen! That's all!" #speaker:painter_brother #name:Her neighbour
He looks at her. She won't look at him.
They walk him up the street towards the lifts, right past you. #leave:brother-3:16:40 #leave:watch-3a:16:40 #leave:watch-3b:16:40
"Head down." #speaker:diplomat
He looks at you as he goes by. He doesn't know who you are.
The woman stands a moment in the street with her arms round herself. Then she goes back in, and shuts her door. #leave:informer:444:30
"That's what the screens buy." #speaker:diplomat
"The cellar door, past the lamp shop. There's a bar down there. People talk in it." #speaker:diplomat
"I can't go in with you. They know me: they'd mind what they said." #speaker:diplomat
"Go down with your hood up. Don't talk to anyone. Listen." #speaker:diplomat
"And don't let anyone up here see your face going in. They'd sell it by morning, and everyone down there would be taken." #speaker:diplomat
"I'll wait by the door." #speaker:diplomat
~ c3day3 = "sneak"
He walks off down the middle of the street, in the open. #walk:hand:624:55
People call out to him as he goes. They know him. #bark:informant-1:Evening! #bark:informant-2:Back again?
~ objective = "Get to the cellar without being seen"
~ objective_target = "low-district:to-hideout"
-> END

// --- Night, the hideout ---

// Coming in (a trigger at the foot of the steps). It's busy and loud, and you're one more hood: nobody knows
// you (designer: you listen in; only the kid recognises you). Your hand waits up in the street.
=== c3day3_hideout ===
~ met_hideout = true
~ c3day3 = "hideout"
A cellar under the street, warm and low, lamps in cages. Every table's full, and loud.
The wing's painted on the old stone, taller than a man.
Nobody looks twice at one more hood.
"Sit. Drink. Don't stare at anyone." #speaker:hideout_keeper
~ objective = "Listen"
~ objective_target = "hideout:rewards-1"
-> END

=== c3day3_keeper ===
"Sit, or go. Don't stand there looking." #speaker:hideout_keeper
-> END

// Anyone you try to talk to: you're a stranger.
=== c3day3_stranger ===
{ shuffle:
- "Busy, friend." #speaker:them
- "Not now." #speaker:them
- "Do I know you?" #speaker:them
}
You keep your head down, and move on.
-> END

// After each table you listen in on: the marker moves on, then to the kid, then it's time to go.
=== c3day3_heard ===
~ heard3 += 1
{
- not heard_sister3:
    ~ objective_target = "hideout:rewards-1"
- not heard_stairs3:
    ~ objective_target = "hideout:rewards-2"
- not heard_counter3:
    ~ objective_target = "hideout:counter-3"
- not painter3:
    ~ objective = "Talk to the kid in the corner"
    ~ objective_target = "hideout:painter-3"
- else:
    Time to go. Your hand's waiting up in the street.
    ~ c3day3 = "home"
    ~ objective = "Go back up to your rooms"
    ~ objective_target = "prince-quarters:bed-3"
}
-> END

// What the rewards are doing, overheard table by table (a trigger by each).
=== c3day3_overhear_sister ===
~ heard_sister3 = true
You stop by a table, head down, as if you're waiting for a seat.
"My sister said one thing about the lights. At her own table." #speaker:c3_citizen_5
"And?" #speaker:c3_citizen_0
"Her husband went to the watch the next morning. For the reward." #speaker:c3_citizen_5
"She's gone. He's bought a new coat." #speaker:c3_citizen_5
Nobody at the table says anything for a while.
-> c3day3_heard

=== c3day3_overhear_stairs ===
~ heard_stairs3 = true
Two men, close together over one drink. You lean on the wall behind them.
"You've not been home?" #speaker:c3_citizen_7
"Four days. I chalked one wing, on my own wall, and my neighbour's boy saw me." #speaker:c3_citizen_9
"I sleep here now. Under that table." #speaker:c3_citizen_9
"Nobody talks on the stairs any more. You don't know who's behind on their rent." #speaker:c3_citizen_7
"Then we talk here." #speaker:c3_citizen_9
-> c3day3_heard

=== c3day3_overhear_counter ===
~ heard_counter3 = true
At the counter, someone's telling the barkeep about tonight.
"They took the kid's brother. On the old woman's word, across the street." #speaker:c3_citizen_13
"For what?" #speaker:hideout_keeper
"Shouting at a screen." #speaker:c3_citizen_13
"Third this week." #speaker:hideout_keeper
He nods at the corner, by the steps.
"The kid won't go home. Says they'll come for him next." #speaker:hideout_keeper
-> c3day3_heard

// The painter: his brother was the man taken. He's the only one who knows you.
=== c3day3_painter ===
{ painter3:
    He doesn't look up.
    -> END
}
{ heard3 < 3:
    A kid in the corner, his knees up. He doesn't look up.
    -> END
}
~ painter3 = true
The kid you saw chalking in the dark, two weeks ago. He's in the corner with his knees up. He's been crying.
He sees your face under the hood, and goes very still.
"You're him. The prince." #speaker:painter
He says it under his breath. Nobody else has looked twice at you.
"Have you come for me too?" #speaker:painter
"No." #speaker:prince
"They took my brother tonight. You were there. You saw." #speaker:painter
"She pointed at him. She's lived across from us my whole life. He mended her door." #speaker:painter
"He only ever shouted at the screens. It's me that chalks the wings." #speaker:painter
"They took him for mine." #speaker:painter
"Where will they take him? You'd know. You live up there." #speaker:painter
"I don't know." #speaker:prince
"Then find out." #speaker:painter
-> c3day3_heard

// Back up the steps: your hand, waiting by the door.
=== c3day3_outside ===
~ outside3 = true
Your hand's by the door, where he said he'd be. #beside:hand:24
"Well?" #speaker:diplomat
"They're turning on each other. For a reward." #speaker:prince
"For your father's reward." #speaker:diplomat
"The kid's brother. Where will they take him?" #speaker:prince
He looks up the street, at the citadel's lights over the rooftops.
"Up. Where they all go." #speaker:diplomat
"Come on. It's nearly light." #speaker:diplomat
-> END

// --- Back up, before dawn ---

=== c3day3_bed ===
~ plain_coat = false
~ hand_with_you = false
You hang up the plain coat. It smells of the cellar's smoke.
~ c3day3 = "done"
~ c3day4 = "wake"
~ objective = ""
~ objective_target = ""
You lie awake, thinking of a man walked past you to the lifts, looking at you, not knowing who you were. #wake:prince-quarters:120:226:c3day4_start #endday:Day 4
-> END
