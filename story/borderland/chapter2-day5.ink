// ============================================================================
// Chapter 2, Day 5: the first raid. Draft text from docs/sequences/chapter-2/part-2.md, for the designer
// to rewrite. You start at the far end of the picked fields, where the boss sent you to dig, to be seen.
// The old scavenger beside you. The other clan comes over the rise: the first raid on your turf (design
// doc: a story beat, not a choice), and the first fight beside him. It ends Part 2: "A month on".
// ============================================================================

=== c2day5_start ===
~ raid_day = true
~ digging = true
~ objective = "Dig beside the old scavenger"
~ objective_target = "picked-fields:old-scav-fields"
The far end of the picked fields, out past the hull. Where the boss told you to dig, so you'd be seen digging.
There's nothing here. There's never been anything here. You dig anyway.
-> END

=== c2day5_old ===
"Hmph. The boss's new favourite." #speaker:old_scav
"Four times the tribute. Off this?" #speaker:old_scav
He scrapes his hook through the dirt and turns up nothing, the way he's turned up nothing for forty years.
"I'm not going to ask. Somebody will, though. Somebody always does." #speaker:old_scav
+ [Let them]
    "Let them." #speaker:scavenger
    "Said like somebody who's never been asked." #speaker:old_scav
+ [Thank you]
    "Thanks. For not asking." #speaker:scavenger
    "Don't thank me. I said I wasn't going to ask. I didn't say I wasn't going to wonder." #speaker:old_scav
- Then he goes very still, looking past you, out towards the far end of the fields.
"Down. Get down." #speaker:old_scav
~ raiders_here = true
~ digging = false
Three of them, coming over the rise in pale wraps, staves out. The other clan. On your ground, in daylight. #move:raider-1:880 #move:raider-2:900 #move:raider-3:920
All along the fields the pickers are dropping their sieves and running. #leave:digger-7:20:110 #leave:digger-8:20:120 #leave:digger-9:20:100 #leave:digger-2:20:110
They're not looking at the pickers. They're looking at you. #shake
"They came straight here. Like they knew." #speaker:old_scav
"Well? Get your stick up." #speaker:old_scav #combat:first_raid:c2day5_after_raid
-> END

=== c2day5_after_raid ===
{ raid_won:
    The leader goes down in the dirt, and the other two drag them up, and the three of them go back over the rise the way they came. #leave:raider-1:960:120 #leave:raider-2:960:120 #leave:raider-3:960:110
    The old scavenger leans on his hook, breathing hard.
    "Not bad. For a favourite." #speaker:old_scav
- else:
    You're down, and the old scavenger's down, and they take your sacks and his, and go back over the rise without hurrying. #leave:raider-1:960:60 #leave:raider-2:960:60 #leave:raider-3:960:55
    "Well. That's how it goes." #speaker:old_scav
}
~ raiders_here = false
~ c2day5 = "after"
"Raiders. On our ground. In daylight." #speaker:old_scav
"How did they know we'd be here? Nobody digs here. Nobody's dug here in years." #speaker:scavenger
He looks at you for a long time, and doesn't say anything, and you know exactly what he isn't saying.
~ objective = ""
~ objective_target = ""
~ c2day5 = "done"
The boss will want to know. Everyone will want to know. #wake:shack:382:184 #endday:A month on
-> END
