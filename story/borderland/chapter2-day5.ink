// ============================================================================
// Chapter 2, Day 5: life in the circle. Draft text from docs/sequences/chapter-2/part-2.md, for the
// designer to rewrite. (Designer: get to know the crew more, gambling with them, the brothel; the chapter
// felt rushed; but don't drag it out.) A short day in town: two of three (designer): the den (bones with
// the gambler and the enforcer), the brothel (the madam; a hostess), your brother. Then board night at
// the bar: a talk with each of the circle, and the watcher puts you down for tomorrow (the old man's
// patch). Starts in the swap yard (designer: no need to start at home).
// ============================================================================

=== c2day5_start ===
~ town_day = true
~ objective = "Spend the day in town (2 things)"
-> c2day5_targets

=== c2day5_targets ===
~ temp left = ""
{ not saw_den:
    ~ left = left + "gambling-den:gambler,"
}
{ not saw_brothel:
    ~ left = left + "brothel:madam,"
}
{ not saw_brother && brother_moved:
    ~ left = left + "compound-house:brother-here,"
}
{ not saw_brother && not brother_moved:
    ~ left = left + "shack:brother,"
}
~ objective_target = left
{ town_visits == 0:
    The swap yard, first thing. It's different today.
    People step out of your way. The food trader nods to you, and you've never seen her nod to anyone.
    You're one of the circle. Everybody knows. You've got a day, and nothing you have to do with it, until board night.
}
-> END

// After each visit: the next, or, after two (designer: two of three), the evening.
=== c2day5_check ===
~ town_visits += 1
{ town_visits >= 2: -> c2day5_to_evening }
~ objective = "Spend the day in town (1 more)"
-> c2day5_targets

=== c2day5_to_evening ===
~ town_day = false
~ c2day5 = "evening"
~ circle_night = true
~ board_night5 = true
~ objective = "Board night at the bar"
~ objective_target = "bar:boss-bar"
The day's gone, somehow. It's board night: the circle will be at the bar, and the watcher will want to know where you're digging tomorrow. #time:evening
-> END

// Walking into the bar on board night.
=== c2day5_bar_arrive ===
~ bar5_arrived = true
~ board_night5 = false
The circle's at their table by the counter, and the bar leaves a little space round it, the way it does.
"Here she is. Sit, sit." #speaker:boss
-> c2_evening_start

// --- The den: bones with the gambler and the enforcer ---

=== c2day5_den ===
~ saw_den = true
The gambler's at the big table, and so's the enforcer, out of place in daylight. They both look up.
"Here she is! Sit, sit. Luck herself." #speaker:gambler
"Let's see if it works on bones." #speaker:enforcer
"Bones: the dealer throws one, you call higher or lower, then you throw yours. Three throws. Best of three takes the pot." #speaker:gambler
+ [Put a find in the pot]
    You put down the cable's offcut. The gambler whistles.
    -> c2day5_bones(1, 0)
+ [Just watch]
    "Not today." #speaker:scavenger
    "Not today, she says. With four times the tribute." #speaker:enforcer
    -> c2day5_den_talk

=== c2day5_bones(round, wins) ===
~ temp dealer = RANDOM(1, 6)
~ temp mine = RANDOM(1, 6)
The dealer throws: {dealer}.
+ [Higher]
    You throw: {mine}.
    { mine > dealer:
        -> c2day5_bones_won(round, wins)
    }
+ [Lower]
    You throw: {mine}.
    { mine < dealer:
        -> c2day5_bones_won(round, wins)
    }
- { round < 3: -> c2day5_bones(round + 1, wins) }
-> c2day5_bones_end(wins)

=== c2day5_bones_won(round, wins) ===
"Ha!" #speaker:gambler
{ round < 3: -> c2day5_bones(round + 1, wins + 1) }
-> c2day5_bones_end(wins + 1)

=== c2day5_bones_end(wins) ===
~ played_bones = true
{ wins >= 2:
    You take the pot. The gambler slaps the table and laughs like it's his.
    "Lucky at everything." #speaker:enforcer
    He doesn't laugh.
    ~ enforcer_doubt += 1
- else:
    The house takes the pot. It always does, in the end.
    "Not lucky at everything, then." #speaker:enforcer
    He sounds almost pleased.
}
-> c2day5_den_talk

=== c2day5_den_talk ===
"Board says the sunk town, most mornings. Funny place to be lucky." #speaker:enforcer
"You read the board?" #speaker:scavenger
"Everyone reads the board." #speaker:enforcer
The enforcer gets up and goes. The gambler leans in close, the moment he's gone.
"You couldn't spare me something? I'm in deep with the house. Deep. Just until my luck turns." #speaker:gambler
+ [Give him a find]
    You give him one. He holds it like it's his firstborn.
    "I won't forget this. I won't. You'll see." #speaker:gambler
    ~ gambler_trust += 1
+ [Not today]
    "Not today." #speaker:scavenger
    "No. No, course not. Course not." #speaker:gambler
    He's already looking at the cage.
- -> c2day5_check

// --- The brothel: the madam, and a hostess ---

=== c2day5_brothel ===
~ saw_brothel = true
~ madam_trust += 1
"Well. The boss's new favourite, in my house. Sit." #speaker:madam
"Everyone tells me things. Mostly they don't mean to. Today they're all telling me about you." #speaker:madam
+ [What are they saying?]
    "What are they saying?" #speaker:scavenger
    "That you're lucky. That luck like that is never luck. The usual." #speaker:madam
+ [Why should I trust you?]
    "Why should I trust you?" #speaker:scavenger
    "You shouldn't. That's the first useful thing I'll ever tell you." #speaker:madam
- She pours two cups, and pushes one across.
"There was a girl last year. The boss's new favourite, like you. Clever with finds, like you." #speaker:madam
"What happened to her?" #speaker:scavenger
"Nobody says." #speaker:madam
"That's what happened to her." #speaker:madam
-> c2day5_check

=== c2day5_hostess ===
~ hostess_trust += 1
"You're the one everyone's talking about." #speaker:hostess
"I came in off the plain, the same as those stragglers. Two winters ago. The madam took me in when nobody else would." #speaker:hostess
"So I know what it's like, everyone looking at you, wondering what you are." #speaker:hostess
"Come and sit with us, if it gets too much out there. Nobody asks questions in here. Not out loud." #speaker:hostess
-> END

// --- Your brother ---

=== c2day5_brother ===
~ saw_brother = true
{ brother_moved: -> c2day5_brother_compound }
"There's bread! You brought bread!" #speaker:brother
"The kid asked about the noise under the floor again. I said it was the wind. Is it the wind?" #speaker:brother
"It's the wind." #speaker:scavenger
"I knew it was the wind." #speaker:brother
-> c2day5_check

=== c2day5_brother_compound ===
"Look! Look at my boots! They gave me boots!" #speaker:brother
"And I eat with them, at the big table. He lets me sit by him." #speaker:brother
"He asked if we ever had rats, at home. I said no! Was that right?" #speaker:brother
+ [That was right]
    "That was right." #speaker:scavenger
    He beams.
+ [What else did he ask?]
    "What else did he ask?" #speaker:scavenger
    "Just stuff. About you. Where you go. I said I didn't know! Because I don't!" #speaker:brother
- He runs off to show someone else his boots.
-> c2day5_check

// --- The evening ---

=== c2day5_evening_done ===
~ circle_night = false
~ c2day5 = "home"
~ objective = "Go home"
~ objective_target = "shack:bed"
The night's wearing on. #time:night
-> END

=== c2day5_bed ===
{ brother_moved:
    The shack's quiet without him. Under the floor, {dog_name} sighs.
- else:
    Your brother's asleep, an arm hanging off the bed. Under the floor, {dog_name} sighs.
}
~ c2day5 = "done"
~ c2day6 = "fields"
~ objective = ""
~ objective_target = ""
First light, the far end of the fields. #wake:picked-fields:860:232:c2day6_start #endday:Day 6
-> END
