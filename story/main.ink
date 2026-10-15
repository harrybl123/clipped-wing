// ============================================================================
// The story's state: every variable the game reads or writes, and a few helpers. The days are in
// story/day*.ink, each area's people and things in story/<area>.ink. Draft text throughout, for the
// designer to rewrite.
// ============================================================================

// Narrative state lives here, in ink, and nowhere else (see CLAUDE.md).
VAR suspicion = 0
// Jars in the food store at home. Placeholder starting amount; shrinks nightly later.
VAR food_store = 8
// How you first handled your doubt: "hide" (a brave face), "joke" or "voice" (honest). Empty until chosen (Day 1 morning, with Mum).
VAR dialogue_style = ""

// What to do next: shown at the top of the screen, with the red bird marker over objective_target
// ("<area id>:<person, object or door id>"). Empty means nothing to point at.
VAR objective = "Talk to Mum"
VAR objective_target = "home:mum"

// Day 1 (story/day1.ink): the stage the day has reached, and a few things that happened.
// Stages: wake, bench, rite, friend, ascension, climb, home, bed, done.
VAR day1 = "wake"
VAR rite_done = false
VAR climb_tutorial = false
VAR met_friend_climb = false
VAR watched_lights = false

// Day 2 (story/day2.ink). Stages: wake, bench, rite, afternoon, evening, burn, hide, bed, done.
VAR day2 = ""
// The afternoon: your share from the ration hatch (you must), and one visit: "friend" or "thin_man".
VAR got_rations = false
VAR afternoon_with = ""
VAR shared_ration = false
// Your friend's trust in you (design doc: tracked through the act).
VAR friend_trust = 0
VAR mum_at_ceremony = false
VAR mum_in_bed = false
// Big choice 1, the reply to message 1: "fledgling" (reply) or "usual" (ignore). Ignoring twice gives the loyal ending.
VAR reply1 = ""
VAR times_ignored = 0

// Day 3 (story/day3.ink). Stages: wake, carve, rite, girl, sneak, evening, open, hide, bed, done.
VAR day3 = ""
// The fledgling you carved: "tiny" or "small"; which wing you clipped; its eye ("open" or "sleepy").
VAR fledgling_size = ""
VAR fledgling_wing = ""
VAR fledgling_eye = ""
// How many times the knife slipped carving today's bird (CarveScene counts them; every slip leaves a mark).
// 0–1 clean, 2–4 nicked, 5 or more botched. The Tender and the elders notice.
VAR carve_flaws = 0

VAR girl_with_you = false
// The top way back through the back routes starts coming down (after the window).
VAR routes_collapsing = false
VAR blessings_withheld = false
// You ignored message 1 on Day 2, then answered it on Day 3.
VAR answered_late = false
// Hiding the evidence before your friend climbs in: how many things are still out, and which.
VAR evidence_left = 0
VAR evidence_plate = false
VAR evidence_bird = false
VAR evidence_shavings = false
// The visit: you told your friend the truth (true) or lied (false); whether he knows you lied.
VAR confided = false
VAR friend_suspects = false

// Day 4 (story/day4.ink). Stages: wake, carve, shrine, market, girl, evening, open, sneak, visit, rot, back, bed, done.
VAR day4 = ""
// The Tender's summons, pushed under the door in the night (picked up on Day 4 morning).
VAR summons_on_floor = false
// Your reply to message 2, picked from three pictures: "yes" (open wings), "cant" (a clipped wing) or "why" (a hook and a dot).
VAR reply2 = ""
VAR tender_waiting = false
// Wrong answers to the Tender's questions; two and he asks to see your hands.
VAR tender_doubts = 0
VAR showed_hands = false
// Mum's out of the house (at the market, or at the ceremony).
VAR mum_away = false
VAR mum_at_market = false
// The market: you stepped in (the fight) or held back. The fight scene counts what you landed and what you took.
VAR fought = false
VAR held_back = false
VAR fight_landed = 0
VAR fight_taken = 0
VAR fight_won = false
VAR hurt = false
// The deep rot (Day 4 night): the beetles you and the girl fight (src/data/combat.ts, rot_beetles).
VAR rot_creatures = false
VAR rot_creatures_done = false
VAR rot_beetles_won = false
// The girl (design doc: tracked through the act).
VAR girl_trust = 0
VAR chalk_ring = false
VAR house_watched = false
VAR has_feather = false
// The night sneak through the lower roots: the watch is out.
VAR sneaking = false

// Day 5 (story/day5.ink). Stages: wake, carve, shrine, escort, upper, evening, open, archive, steal, roots, deal, bed, done.
VAR day5 = ""
// Your reply to message 3: "who" (who are you?), "take" (take me) or "watched" (I'm being watched).
VAR reply3 = ""
// The guard sent to take you up to the archivist, and keep you at the ceremony.
VAR escort_waiting = false
VAR escorted = false
// Big choice 2 (design doc): you told the archivist about the messages (true), or pandered (false).
VAR told_archivist = false
VAR archivist_trust = 0
VAR archivist_waiting = false
// Night 5, with the archivist in the seed grove: the whole visit, and the sneak past the guard to the vault.
VAR in_grove = false
VAR grove_sneak = false
// You didn't tell him, so you try to steal a seed from the archive; it fails.
VAR stealing = false
VAR caught_stealing = false
// The seed you got for Grounded: "healthy" (from the archivist) or "roots" (from the boy in the lower roots; it grows rot, Chapter 2).
VAR seed = ""
// Night 5: the girl waits on her doorstep while you sneak down to her (the watch is out again).
VAR girl_on_doorstep = false

// Day 6 (story/day6.ink). Stages: wake, carve, shrine, market, disguise, tail, listen, evening, open, hide, interrogation, home, bed, done.
VAR day6 = ""
// Your plate on Day 6: the pointing hands ("they blame me; help me"). One picture, no choice.
VAR reply4 = ""
// Day 6, what you ask him beside the pointing hands: "help" (help me), "todo" (what do I do?) or "why" (why me?). Message 5 answers it.
VAR reply4_ask = ""
// The hooded cloak from the boy: worn from now on wherever you're not expected (designer).
VAR has_disguise = false
// Tailing the Tender and the preacher across the market (the `quarry` feature sets tail_done when they slip behind the ration hatch), then the elders' meeting.
VAR tailing = false
VAR tail_done = false
VAR meeting = false
// The guards found the plate when they came for you.
VAR plate_found = false
VAR interrogating = false
// The girl at the interrogation (a medium choice): "saved" (you declared there's something beyond the Tree: a night in custody) or "blamed" (she's taken to the lower rot).
VAR girl_fate = ""
VAR in_custody = false
// Blamed: she's taken down to the lower rot (and you find her there if you fall, Day 7). Your house is guarded.
VAR girl_in_rot = false
VAR house_guarded = false

// Day 7 (story/day7.ink). Stages: wake, carve, rite, visits (in custody) or goodbyes (at home), evening, open, mob, chase, fall, done.
VAR day7 = ""
// Your plate on Day 7: a bird in a cage ("I'm trapped"). One picture, no choice.
VAR reply5 = ""
// The trial: the elders and a guard on the offering floor while your bird goes up in a cage (and comes back).
VAR trial = false
// At home: the archivist will see you in the archive this afternoon (if he's your ally).
VAR archivist_goodbye = false
// Big choice 3, up: the mob is after you, all the way to the top. Your friend helps on the way up if you confided in him.
VAR chased = false
VAR friend_helps = false
VAR guard_passed = false
// In custody, the girl comes up with you, to see you off at the gate.
VAR girl_runs = false
// Down in the rot, the girl comes with you (if you blamed her, she's been down there all day).
VAR girl_follows = false

// The glossary: each decoded symbol in the player's own words (glossary_<symbol id>, see src/data/messages.ts).
// Little words like "that" fill themselves in and have no entry.
VAR glossary_self = ""
VAR glossary_see = ""
VAR glossary_you = ""
VAR glossary_clipped = ""
VAR glossary_wing = ""
VAR glossary_send = ""
VAR glossary_new = ""
VAR glossary_life = ""
VAR glossary_cant = ""
VAR glossary_fly = ""
VAR glossary_rest = ""
VAR glossary_beyond = ""
VAR glossary_bark = ""
VAR glossary_would = ""
VAR glossary_like = ""
VAR glossary_yet = ""
VAR glossary_also = ""
VAR glossary_because = ""
VAR glossary_carve = ""
VAR glossary_grounded = ""
VAR glossary_many = ""
VAR glossary_seed = ""
VAR glossary_lives = ""
VAR glossary_rot = ""
VAR glossary_deep = ""
VAR glossary_stayalive = ""
VAR glossary_need = ""
VAR glossary_hurry = ""
VAR glossary_not = ""
VAR glossary_master = ""
VAR glossary_if = ""
VAR glossary_can = ""
VAR glossary_fall = ""
VAR glossary_must = ""
VAR glossary_find = ""
VAR glossary_hide = ""
VAR glossary_climb = ""

// ---- Chapter 2: the borderland (docs/chapter-2-design.md) ----
// You've found the dog: the dog's hollow, your secret spot, is on the map from then on.
VAR found_dog = false
// Which chapter you're playing: 1 (the carver, in the tree), 2 (the scavenger, in the borderland) or 3 (the prince, in the capital).
VAR chapter = 1
// Chapter 2, Day 1 (story/borderland/chapter2-day1.ink; docs/sequences/chapter-2/part-1.md).
// Stages: dig, brother, trade, tribute, home, done.
VAR c2day1 = ""
// What's in your satchel: finds, to trade for food or pay the tally house with.
VAR finds = 0
// The spots you're digging today, and which you've dug.
VAR digging = false
VAR dug_1 = false
VAR dug_2 = false
VAR dug_3 = false
// The stragglers from elsewhere: there on the fields, and whether you beat them off (the fight writes it).
VAR stragglers_here = false
VAR stragglers_won = false
// Your brother gave you his light (the one thing in his collection that glows) to trade for food.
VAR traded_light = false
// Food in the shack, in bowls.
VAR food = 0
// Tribute night at the tally house: the crowd, the boss and his circle are there.
VAR tribute_night = false
// You came up short at the tally house, and the boss let you off. Next week you owe double.
VAR owe_double = false
// Chapter 2, Day 2 (story/borderland/chapter2-day2.ink). Stages: wake, ask, deep, home, hide, night, search, hollow, done.
VAR c2day2 = ""
// Sent deep into the sunk town (by the old scavenger); you heard the bark from below; you found the camp.
VAR going_deep = false
VAR heard_bark = false
VAR camp_found = false
// The stragglers at their camp, and the dog they've tied up there.
VAR stragglers_camp = false
VAR dog_tied = false
// The fight at the camp: you won (the fight writes it).
VAR camp_won = false
// The medium choice (design doc): "keep", "sell" or "eat". Whatever you choose, you keep it (designer).
VAR dog_choice = ""
// Its name (designer): "Peggy", "Luna" or "Bear".
VAR dog_name = ""
// The dog's in the shack with you (before it goes under the floor); it's yours (named: its bed's in the shack from then on).
VAR dog_home = false
VAR dog_owned = false
// The stragglers' fire in the camp (lit from when you're sent deep).
VAR camp_fire = false
// The dog walking with you (from the camp, home); on a wire to be sold, until it slips it; on your way home.
VAR dog_with_you = false
VAR dog_on_wire = false
VAR going_home = false
// Night 2: out looking for the dog, before you hear it bark on the fields.
VAR searching = false
// Chapter 2, Day 3, weeks later (story/borderland/chapter2-day3.ink). Stages: sunk, tribute, home, done.
VAR c2day3 = ""
// Working the sunk town with the dog.
VAR seeking = false
VAR sought_1 = false
VAR sought_2 = false
VAR sought_3 = false
VAR sought = 0
VAR seek_arrived = false
// First light: out before anyone else, so nobody sees the dog (the fields are empty).
VAR first_light = false
// The haul's done; the dog's seen you back up to the surface, and been sent home.
VAR haul_done = false
// Day 3, on the way to the tally through the yard: the fence wants to know where.
VAR day3_yard = false
VAR fence_met = false
VAR sent_home = false
// The boss has asked you up to the house.
VAR summoned = false
// Chapter 2, Day 4 (story/borderland/chapter2-day4.ink). Stages: gate, house, tell, bar, home, done.
VAR c2day4 = ""
// In the circle: you tell the boss where you're digging, and when (design doc: he passes it on).
VAR in_circle = false
// Big choice 1 (design doc): your brother moves into the compound ("compound") or stays with you ("home").
VAR brother_choice = ""
VAR brother_moved = false
// The circle at the bar tonight, and the sparring with the boss's son (the fight writes spar_won).
VAR circle_night = false
VAR bar_arrived = false
VAR spar_won = false
// The sparring's wager: if you lost, what you told the bar ("sunk" or "deep").
VAR spar_done = false
VAR told_where = ""
// An evening to spend with one of the circle (or a friend): their knots offer it while this is true.
VAR evening_free = false
// This evening's talks: who you've sat with so far.
VAR eve_boss = false
VAR eve_watcher = false
VAR eve_enforcer = false
VAR eve_son = false
VAR eve_count = 0
// Board night on Day 5: walking into the bar.
VAR bar5_arrived = false
VAR board_night5 = false
// Who you've got to know, and how it's going (Part 2 on; the endings will read these). Evenings with each, counted.
VAR boss_trust = 0
VAR watcher_respect = 0
VAR enforcer_doubt = 0
VAR son_rivalry = 0
VAR gambler_trust = 0
VAR madam_trust = 0
VAR hostess_trust = 0
VAR boss_evenings = 0
VAR watcher_evenings = 0
VAR enforcer_evenings = 0
VAR son_evenings = 0
// Chapter 2, Day 5, life in the circle (story/borderland/chapter2-day5.ink). Stages: town, evening, home, done.
VAR c2day5 = ""
// The day in town: who you've been to see.
VAR saw_den = false
VAR saw_brothel = false
VAR saw_brother = false
VAR saw_old = false
VAR played_bones = false
VAR town_day = false
VAR town_visits = 0
// Your ground for tomorrow, as given to the watcher for the board.
VAR board_mark = ""
// Chapter 2, Day 6 (story/borderland/chapter2-day6.ink): the first raid. Stages: fields, raid, after, done.
VAR c2day6 = ""
VAR raid_day = false
VAR raiders_here = false
VAR raid_won = false
// The night of the first raid: the tally house full of it (the boss: an informant).
VAR raid_night = false
VAR raid_told = false
// Chapter 2, Day 7, a month on (story/borderland/chapter2-day7.ink; docs/sequences/chapter-2/part-3.md).
// Stages: dawn, yard, brother, den, tribute, home, done.
VAR c2day7 = ""
// Dawn in the sunk town with the dog: arrived; the tickers' nest found, fought (the fight writes tickers_won); the dog sent home.
VAR dawn7 = false
VAR dawn7_arrived = false
VAR nest_found = false
VAR nest_done = false
VAR tickers_won = false
VAR dawn7_home = false
// The old wells, raided at first light: last night's patch on the board.
VAR wells_raid = false
VAR wells_seen = false
// The lost picker's lamp (if you told the bar the sunk town), taken; given back to his sister.
VAR has_lamp = false
VAR sister_here = false
VAR sister_calmed = false
// The son in the yard with the deep ground's tracks (if you told the bar the deep ground).
VAR son_in_yard = false
// The rat on your door: there, seen, scrubbed. Your brother and the kid scrubbing it (at home), and set on catching the rat.
VAR door_marked = false
VAR door_seen = false
VAR mark_scrubbed = false
VAR brother_scrubbing = false
VAR brother_spying = false
VAR yard7_done = false
// Your brother at the compound: he asks why you go out before it's light.
VAR saw_brother7 = false
VAR brother_asked = false
// The den: the gambler at the debt wall, the house's men; your choice ("fought", "paid", "left"); the fight writes collectors_won.
VAR den7 = false
VAR gambler_in_yard = false
VAR den7_seen = false
VAR gambler_at_wall = false
VAR collectors_here = false
VAR gambler_choice = ""
VAR collectors_won = false
// Your week went to the den (short at the tally); his chain, if you helped him (doc: he gives you a weapon).
VAR week_paid = false
VAR has_chain = false
VAR tribute7_done = false
// On the way home: pickers waiting for you in the yard (the fight writes ambush_won); they cut your strap if you lost.
VAR ambush_night = false
VAR ambush_set = false
VAR ambush_done = false
VAR ambush_won = false
VAR strap_cut = false
// Chapter 2, Day 8, digging (story/borderland/chapter2-day8.ink). Stages: dawn, hollow, deep, noon, search, brothel, home, done.
VAR c2day8 = ""
// Dawn: the son waiting at the foot of the scrap stacks; you slipped past, or he caught you (the fight writes rematch_won); he saw which way you went.
VAR stacks8 = false
VAR son_met8 = false
VAR son_waiting = false
VAR son_slipped = false
VAR son_confront = false
VAR rematch_won = false
VAR son_saw = false
// The deep ground with the dog: the drop (your square, midday; the girl's bead); its guards (the fight writes guards_won).
VAR going_deep8 = false
VAR deep_arrived = false
VAR seeking8 = false
VAR drop_found = false
VAR has_bead = false
VAR drop_guards_here = false
VAR guards_won = false
// The medium choice (design doc): "leave" (and watch the pickup: the scout), "take" (the note's yours now), "swap" (row five).
VAR drop_choice = ""
VAR has_note = false
VAR scout_coming = false
VAR scout_seen = false
// Midday: back through the yard, what came of it; the dog home.
VAR noon8 = false
VAR noon8_seen = false
VAR sent_home8 = false
// The enforcer's search of your shack: coming; the things to hide (Act 1's evidence); what they found.
VAR searchers_coming = false
VAR search_started = false
VAR searchers_in = false
VAR evidence8_left = 0
VAR ev_bed = false
VAR ev_bowl = false
VAR ev_hair = false
VAR ev_note = false
VAR found_bed = false
VAR found_bowl = false
VAR found_hair = false
VAR found_note = false
// The madam and the bead; the hostess on your friend.
VAR saw_madam8 = false
VAR madam_told = false
VAR friend_lie_known = false
// Chapter 2, Day 9, the watch (story/borderland/chapter2-day9.ink). Stages: morning, house, fields, dusk, dog, watch, chase, choice, home, done.
VAR c2day9 = ""
// Dawn: your brother out all night with the kid, back muddy (if he's still with you).
VAR brother_out9 = false
VAR brother_back9 = false
VAR brother_asleep9 = false
// The boss's house: the son, if he saw you head for the fields; the boss knows about the dog (if your brother's there).
VAR house9_done = false
VAR son_at_house = false
VAR boss_knows_dog = false
// The old scavenger on the fields, and the track out to the line; the fence (if you go by).
VAR old9 = false
VAR old9_done = false
VAR line_open = false
VAR fence9 = false
// Dusk at the line: your friend at the dip (medium choice, `friend_choice`: "reported" or "covered"); the watcher.
VAR line9_arrived = false
VAR friend_at_line = false
VAR friend_seen9 = false
VAR watcher_at_line = false
VAR friend_choice = ""
// Trust with the other side (covering for your friend, letting the scout go).
VAR rival_trust = 0
// Night: the watch, the raiders through the dip (the fight writes line_won), the scout gone towards the settlement.
VAR watched9 = false
VAR line_raid = false
VAR line_won = false
VAR scout_gone9 = false
// The chase up the scrap stacks; the scout cornered on the perch (the fight writes scout_won).
VAR chase9 = false
VAR dog_leading = false // Day 9: the dog out in front on the scout's scent (you follow it)
VAR chase_seen = false
VAR scout_cornered = false
VAR scout_won = false
// Big choice 2 (design doc): "turned_in" (to the watcher) or "let_go" (and the scout's your friend over there).
VAR scout_choice = ""
VAR turnin9 = false
VAR letgo9 = false
VAR scout_held = false
VAR scout_friend = false
// Let go, the scout told you where and when their contact meets them: the cairn, three nights on, no moon.
VAR knows_meeting = false

// --- Chapter 2, Day 10: the reveal (story/borderland/chapter2-day10.ink) ---
// Stages: dawn, brother, yard, watcher, line, home, tally, done.
VAR c2day10 = ""
// Dawn: your brother and the kid (at home); the boss and his son come to meet the dog, and the dog knows him.
VAR brother_dawn10 = false
VAR boss_visit10 = false
VAR son_visit10 = false
VAR boss_growled10 = false
VAR knock10 = false
VAR boss_in10 = false
// Following him at the line: along the track under your post, and you tail him to the dip.
VAR tail10 = false
// Winning against the enforcer (you have to): the boss's rubbing of the board, gone into the dark in the dog's teeth.
VAR has_rubbing10 = false
VAR dog_up10 = false // the dog up out of the hole under your floor (Day 10)
// What you know at the end (Part 5's endings): it's the boss (always); a witness (your brother, at home); why
// (his daughter, if you let the scout go); the watcher with you (if he respects you).
VAR knows_boss = false
VAR witness10 = false
VAR knows_why = false
VAR watcher_ally = false
// Your brother. At home: up the stacks with the kid, the circle's men (the fight writes circle_won10), he falls
// and is taken. At the compound: he brings two of the circle to take the dog.
VAR stacks10 = false
VAR perch10_seen = false
VAR circle_stacks10 = false
VAR brother_taken10 = false
VAR circle_shack10 = false
VAR circle_won10 = false
// The yard: the gambler, your friend (or her mother); the watcher's runner.
VAR yard10 = false
VAR yard10_seen = false
VAR gambler_yard10 = false
VAR friend_yard10 = false
VAR friend_mother10 = false
VAR watcher10 = false
VAR watcher10_seen = false
// The cairn (if you let the scout go): you lie up on the post; the boss through the dip; the scout tells you why.
VAR cairn10 = false
VAR line10_seen = false
VAR lying_up10 = false
VAR boss_crossed10 = false
VAR cairn10_seen = false
VAR cairn_meet10 = false
VAR scout_cairn10 = false
// Night: the enforcer at your table, the son (the fight writes enforcer_won); the dog gets away.
VAR night10 = false
VAR night10_seen = false
VAR enforcer_night10 = false
VAR son_night10 = false
VAR enforcer_won = false
VAR dog_ran10 = false
// The tally house, in front of everyone; your friend back (if you reported her).
VAR brand_night = false
VAR friend_back10 = false
VAR brother_brand10 = false

// --- Chapter 2, Day 11: the fall (story/borderland/chapter2-day11.ink) ---
// Stages: brand, cellar, out, hollow, choice, girl, truce, war, edge, done.
VAR c2day11 = ""
// First light: the brand, in front of everyone (the morning crowd).
VAR brand_morning11 = false
// The cellar, and who lets you out (designer: whoever you've helped; or the son).
VAR in_cellar11 = false
VAR watcher_cellar11 = false
VAR friend_cellar11 = false
VAR gambler_cellar11 = false
// How you got out: the watcher walks you out (walkout11), your friend's fire (smoke11), the gambler's dice, or the guard's key (guard_down11, son_key11).
VAR walkout11 = false
VAR smoke11 = false
VAR guard_down11 = false
VAR son_key11 = false
VAR let_out11 = false
// Big choice 3 (design doc): "girl", "truce" or "war".
VAR last_act = ""
// Save the girl: the scout at the dip, the hut past the cairn (the fight), the daughter, her father at the fence.
VAR girl11 = false
VAR girl_dip11 = false
VAR girl_hut11 = false
VAR daughter11 = false
VAR father11 = false
VAR scout_leading11 = false
// End the conflict: the watcher, the tally house with both clans (the fight), the dog shown to everyone.
VAR truce11 = false
VAR truce_watcher11 = false
// Your brother at the truce: at the boss's side (compound) or held at the back (home).
VAR brother_beside11 = false
VAR brother_held11 = false
VAR truce_tally11 = false
VAR dog_revealed11 = false
// Keep it raging: the crates in the yard, the riot (the fight), the son.
VAR war11 = false
VAR war_yard11 = false
VAR son_war11 = false
// Everyone hears why, in every ending (designer).
VAR boss_why = false
// Dusk, the tree's edge: your brother (compound) or the old scavenger (home), then the woods.
VAR edge_ready11 = false
VAR edge11 = false
VAR brother_edge11 = false
VAR old_edge11 = false
// Your brother at the end: got back (brother_saved11) or lost in the smoke (brother_lost11); the watcher walks you to the edge (truce).
VAR brother_saved11 = false
VAR brother_lost11 = false
VAR watcher_edge11 = false
// The fights write these.
VAR hut_won = false
VAR circle_won11 = false
VAR riot_won = false
// Your friend: Day 7 in the yard (the pale thread at her wrist), Day 8 at midday (she warns you of the search).
VAR friend7 = false
VAR friend8 = false

// ---- Chapter 3: the prince, in the capital (docs/sequences/chapter-3/plan.md) ----
// Chapter 3's story is running: the day's own people are where the story has them, and Claude's placeholder
// schedule for the capital's named cast steps aside (src/data/areas/capital/people.ts).
VAR c3_story = false
// What carries through the chapter (and later chapters): small decisions, counted quietly, never shown.
// `lean`: your duties' answers, towards the people (+1) or towards order (-1). `standing`: how upper society takes you.
VAR lean = 0
VAR standing = 0
// Your hand is walking with you (a follower).
VAR hand_with_you = false
// Chapter 3, Day 1 (story/capital/chapter3-day1.ink). Stages: wake, spar, halls, audience, after, walk,
// requests, banquet, cards, toast, friend, night, done.
VAR c3day1 = ""
// The spar with your hand at dawn: "won" or "lost" (the fight writes it).
VAR spar1 = ""
VAR tree_seen1 = false
VAR brief1 = false
// The petition: you had the woman's street's lift mended today (the glassworks waited a day for its power).
VAR lift_mended = false
// The promenade: the stall keeper; inspecting the watch, and its commander asks to clear the street sellers off
// the square for good (you'll see the square without them from Day 3); the chalk bird behind the stalls.
VAR stalls_cleared = false
VAR stall1 = false
VAR bird1 = false
// The day's requests at the data centre: you asked about the low district's line; you signed them.
VAR queried_requests = false
VAR signed_requests = false
// The banquet: who sat at your father's right ("councillor", "hostess" or "merchant"), and the cards put out.
VAR seated = ""
VAR right_placed = false
VAR cards_done = false
// Night: your sister at your telescope.
VAR sister_called1 = false
VAR sister_talked1 = false
// The capital's power (big choice 1, Day 2): who went without, "high" (the low district) or "people" (the
// upper city: the promenade, and the citadel dims); and the district that's dark from dusk ("low" or
// "promenade"), which the areas paint dark (and the citadel's views of it).
VAR energy = ""
VAR dark_district = ""
// How far it's gone dark (0–100), as you watch it happen from your balcony; and the citadel's own lights lowered.
VAR dark_fade = 100
VAR citadel_dimmed = false
// Chapter 3, Day 2 (story/capital/chapter3-day2.ink). Stages: wake, study, room, table, council, dusk,
// report, below, home, done.
VAR c3day2 = ""
// The bookshelf in your father's study is open (the simulation room behind it).
VAR sim_open = false
// The war table, when he turned it on: how many turns you lasted (never mentioned again until Chapter 7, plan),
// and whether he took every light you had.
VAR sim_turns = 0
VAR sim_wiped = false
VAR room2 = false
// The council: you've heard each side (the reformer; the old councillor or, if you passed him over, the
// hostess's cousin; your hand), and how many.
VAR council2 = false
VAR heard2 = 0
VAR heard_reformer2 = false
VAR heard_councillor2 = false
VAR heard_hand2 = false
VAR dusk2 = false
VAR reported2 = false
// Below with your hand at night, in a plain coat (the prince's own look, hooded: Player.cloaked).
VAR plain_coat = false
VAR dark_seen2 = false
VAR painter2 = false
VAR woman2 = false
// Chapter 3, Day 3 (story/capital/chapter3-day3.ink): two weeks on. Stages: wake, audience, hearing,
// requests, salon, friend, office, below, sneak, hideout, home, done.
VAR c3day3 = ""
// Your father's pushbacks from Day 3: the streets where the symbol keeps turning up, cut, in whichever district
// still had its power (the areas paint them dark); and the screens paying for names (the reward notice).
VAR streets_cut = false
VAR rewards = false
// The audience, alone: you sent men to scrub the warden's walls; the envoy's plea ("granted" or "refused": medium).
VAR scrubbed = false
VAR envoy = ""
// The day's requests: you signed, under your father's mark.
VAR signed3 = false
// The salon: you told the hostess the truth about the streets (rather than covering for your father); your friend.
VAR salon_truth = false
VAR hostess3 = false
VAR friend3 = false
// Below: you saw the watch take the neighbour; you got into the hideout unseen; who you've heard there.
VAR low3 = false
VAR met_hideout = false
VAR heard3 = 0
VAR heard_sister3 = false
VAR heard_stairs3 = false
VAR heard_chalk3 = false
VAR painter3 = false
// Chapter 3, Day 4 (not built yet).
VAR c3day4 = ""

INCLUDE prologue.ink
INCLUDE day1.ink
INCLUDE day2.ink
INCLUDE day3.ink
INCLUDE day4.ink
INCLUDE day5.ink
INCLUDE day6.ink
INCLUDE day7.ink
INCLUDE home.ink
INCLUDE offering-floor.ink
INCLUDE roots-market.ink
INCLUDE friends-home.ink
INCLUDE lower-roots.ink
INCLUDE back-routes.ink
INCLUDE girls-home.ink
INCLUDE the-rot.ink
INCLUDE shrine-cell.ink
INCLUDE tenders-shrine.ink
INCLUDE trunk-climb.ink
INCLUDE middle-tiers.ink
INCLUDE upper-halls.ink
INCLUDE archive.ink
INCLUDE seed-grove.ink
INCLUDE ascension-gate.ink
INCLUDE borderland/chapter2-day1.ink
INCLUDE borderland/chapter2-day2.ink
INCLUDE borderland/chapter2-day3.ink
INCLUDE borderland/chapter2-day4.ink
INCLUDE borderland/chapter2-day5.ink
INCLUDE borderland/chapter2-day6.ink
INCLUDE borderland/chapter2-day7.ink
INCLUDE borderland/chapter2-day8.ink
INCLUDE borderland/chapter2-day9.ink
INCLUDE borderland/chapter2-day10.ink
INCLUDE borderland/chapter2-day11.ink
INCLUDE borderland/picked-fields.ink
INCLUDE borderland/shack.ink
INCLUDE borderland/swap-yard.ink
INCLUDE borderland/tally-house.ink
INCLUDE borderland/bar.ink
INCLUDE borderland/gambling-den.ink
INCLUDE borderland/brothel.ink
INCLUDE borderland/compound.ink
INCLUDE borderland/scrap-stacks.ink
INCLUDE borderland/sunk-town.ink
INCLUDE borderland/dogs-hollow.ink
INCLUDE borderland/rival-line.ink
INCLUDE borderland/deep-ground.ink
INCLUDE borderland/trees-edge.ink
INCLUDE capital/chapter3-day1.ink
INCLUDE capital/chapter3-day2.ink
INCLUDE capital/chapter3-day3.ink
INCLUDE capital/cast.ink
INCLUDE capital/folk.ink
INCLUDE capital/looks.ink

// The game starts conversations by knot name via StoryBridge, so the root
// flow does nothing.
-> END

// Which day it is (1–7), from how far the days have got. For people whose lines change as the week goes on.
=== function today() ===
{
- day7 != "": ~ return 7
- day6 != "": ~ return 6
- day5 != "": ~ return 5
- day4 != "": ~ return 4
- day3 != "": ~ return 3
- day2 != "": ~ return 2
- else: ~ return 1
}
