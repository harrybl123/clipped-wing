// ============================================================================
// TEMPORARY PLACEHOLDER STORY — technical setup only.
// Nothing here is real story content. Replace it when the designer supplies
// Day 1 / prologue text.
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
// The girl (design doc: tracked through the act).
VAR girl_trust = 0
VAR chalk_ring = false
VAR house_watched = false
VAR has_feather = false
// The night sneak through the lower roots: the watch is out.
VAR sneaking = false

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

INCLUDE prologue.ink
INCLUDE day1.ink
INCLUDE day2.ink
INCLUDE day3.ink
INCLUDE day4.ink
INCLUDE home.ink
INCLUDE offering-floor.ink
INCLUDE roots-market.ink
INCLUDE friends-home.ink
INCLUDE lower-roots.ink
INCLUDE back-routes.ink
INCLUDE girls-home.ink
INCLUDE the-rot.ink
INCLUDE tenders-shrine.ink
INCLUDE trunk-climb.ink
INCLUDE middle-tiers.ink
INCLUDE upper-halls.ink
INCLUDE archive.ink
INCLUDE seed-grove.ink
INCLUDE ascension-gate.ink

// The game starts conversations by knot name via StoryBridge, so the root
// flow does nothing.
-> END
