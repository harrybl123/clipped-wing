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
// Which chapter you're playing: 1 (the carver, in the tree) or 2 (the scavenger, in the borderland).
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
