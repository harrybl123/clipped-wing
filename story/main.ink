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
// Afternoon visits left today (two a day from Day 2).
VAR visits_left = 0
VAR shared_ration = false
VAR mum_at_ceremony = false
VAR mum_in_bed = false
// Big choice 1, the reply to message 1: "fledgling" (reply) or "usual" (ignore). Ignoring twice gives the loyal ending.
VAR reply1 = ""
VAR times_ignored = 0

// The glossary: each decoded symbol in the player's own words (glossary_<symbol id>, see src/data/messages.ts).
VAR glossary_eye = ""
VAR glossary_clipped_bird = ""
VAR glossary_fledgling = ""

INCLUDE prologue.ink
INCLUDE day1.ink
INCLUDE day2.ink
INCLUDE home.ink
INCLUDE offering-floor.ink
INCLUDE roots-market.ink
INCLUDE friends-home.ink
INCLUDE lower-roots.ink
INCLUDE back-routes.ink
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
