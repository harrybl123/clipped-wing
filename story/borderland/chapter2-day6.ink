// ============================================================================
// Chapter 2, Day 6: the first raid. Draft text from docs/sequences/chapter-2/part-2.md, for the designer
// to rewrite. You start at the far end of the picked fields, the old scavenger's patch, where the watcher
// put you down for (Day 5's board night), and where the board says you'll be. (Designer: it was too obvious the boss was
// setting you up; nothing here points at him.) The other clan comes over the rise: the first raid on your turf (design
// doc: a story beat, not a choice), and the first fight beside him. It ends Part 2: "A month on".
// ============================================================================

=== c2day6_start ===
~ raid_day = true
~ digging = true
~ objective = "Find the old scavenger"
~ objective_target = "picked-fields:old-scav-fields"
The far end of the picked fields, out past the hull, as far from the settlement as the fields go. The old man's patch.
Past here, a long way off over the rise, is the line. The other clan's ground.
The old scavenger's here already, scraping at nothing.
-> END

=== c2day6_old ===
"Hmph. You came." #speaker:old_scav
"The watcher put me down. He says somebody's been on your patch." #speaker:scavenger
"Somebody has. Footprints, last few mornings. Pale threads caught on the wire." #speaker:old_scav
He nods out over the rise.
"Them. The other clan. Pale wraps, long staves. Their ground starts at the line." #speaker:old_scav
"There's a truce. Has been since before you were born. They keep their side, we keep ours." #speaker:old_scav
"Cost the boss something, that truce. More than he'll ever say." #speaker:old_scav
+ [What did it cost him?]
    "What did it cost him?" #speaker:scavenger
    "More than he'll ever say. I just told you." #speaker:old_scav
+ [So why are they over here?]
    "So why are they over here?" #speaker:scavenger
    "Hungry. Same as us. The truce doesn't feed anybody." #speaker:old_scav
- He scrapes his hook through the dirt and turns up nothing, the way he's turned up nothing for forty years.
"Four times the tribute. Off this?" #speaker:old_scav
"I'm not going to ask. Somebody will, though. Somebody always does." #speaker:old_scav
Then he goes very still, looking past you, out towards the rise.
"Don't turn round quick." #speaker:old_scav
~ raiders_here = true
~ digging = false
Three of them, coming over the rise in pale wraps, staves out. Walking, not running. In daylight. #move:raider-1:880 #move:raider-2:900 #move:raider-3:920
"In daylight. They've never come in daylight." #speaker:old_scav
All along the fields the pickers have seen them too. Sieves dropped. People running for the settlement. #leave:digger-7:20:110 #leave:digger-8:20:120 #leave:digger-9:20:100 #leave:digger-2:20:110
The one in front stops. They look as surprised to see you as you are to see them. #shake
"Thought this end was empty." #speaker:raider_lead
"Doesn't matter. Sacks down. Walk back to your boss, and tell him whose ground this is now." #speaker:raider_lead
+ [Stand with the old man]
    You stay where you are. Beside you, the old man takes a fresh grip on his hook.
    "Good. I'm too old to run." #speaker:old_scav
+ [Run]
    You turn to run, and your legs won't go. The old man's already got his hook up, and he's not going anywhere.
    You can't leave him.
- "Well? Get your stick up." #speaker:old_scav #combat:first_raid:c2day6_after_raid
-> END

=== c2day6_after_raid ===
{ raid_won:
    The leader goes down in the dirt, and the other two drag them up, and the three of them go back over the rise the way they came. #leave:raider-1:960:120 #leave:raider-2:960:120 #leave:raider-3:960:110
    The old scavenger leans on his hook, breathing hard.
    "Not bad. For a favourite." #speaker:old_scav
- else:
    You're down, and the old scavenger's down, and they take your sacks and his, and go back over the rise without hurrying. #leave:raider-1:960:60 #leave:raider-2:960:60 #leave:raider-3:960:55
    "Well. That's how it goes." #speaker:old_scav
}
~ raiders_here = false
~ c2day6 = "after"
"Raiders. On our ground. In daylight." #speaker:old_scav
"They said they thought this end was empty." #speaker:scavenger
"Then somebody's been telling them where's empty, and where isn't." #speaker:old_scav
He doesn't say who. He doesn't need to. Anyone can read the board.
~ objective = ""
~ objective_target = ""
~ c2day6 = "done"
The boss will want to know. Everyone will want to know. #wake:dogs-hollow:60:206:c2day7_start #endday:A month on
-> END
