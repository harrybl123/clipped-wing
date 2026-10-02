# Plan: voices and the sound of the tree

Designer, 2026-10-02: "the next two big things that would make the game come alive, is generic dialogue
sounds (need a plan for how many types we need), and environment sounds. Once we have these we can think
about music." **(designer)** = decided; **(suggestion)** = Claude's proposal, for the designer to mark up.

## Where we are
- Sound so far: the title music (the designer's track), and small UI sounds synthesised in code
  (`src/ui/sfx.ts`: a tick when a cursor moves, a chime when you choose). There are also a chisel
  scrape, a fire crackle and the slip, written for the prologue but switched off.
- Dialogue lines appear all at once. Character voices need the text to **type out**, so the sound has
  something to keep time with. That's a change worth making anyway: it gives every line a pace.
- Nothing in any area makes a sound yet.

## 1. Voices (suggestion)

**What they are:** no words. As a line types out, the speaker "talks" in short syllables of sound
(like Animal Crossing or Undertale), so you can hear who's speaking and how they feel without voice
acting. One sound every two or three letters, none on spaces, a short pause at commas and full stops,
a slight rise on a question mark, louder on an exclamation mark.

**Made in code, like the UI sounds** (suggestion): each voice is a small set of numbers (pitch, how
much it wobbles, how fast it talks, a breathy or a reedy or a hollow tone, how the pitch drifts), so
there are no sound files, and tuning a voice is changing a number. If a voice never sounds right
synthesised, a recorded syllable can replace it later without changing anything else.

**How many: 15 voices** (suggestion), assigned per speaker in `SPEAKERS`:

| # | Voice | Who | Sound |
| --- | --- | --- | --- |
| 1 | You | the protagonist | soft, mid, a little breathy; unsure |
| 2 | Mum | Mum | warm, low-mid, unhurried |
| 3 | The girl | the girl | bright, quick, clipped |
| 4 | Your friend | your friend | clear, eager, a touch high |
| 5 | The archivist | the archivist | thin, precise, fast, a nervous wobble |
| 6 | The boy | the boy | nasal, quick, sliding up and down (a salesman) |
| 7 | The Tender | the Tender | deep, slow, resonant |
| 8 | The preacher | the preacher | rich and sing-song, rising, too pleased |
| 9 | Elder | the four elders (one voice, shared like their face) | dry, low, slow, clipped ends |
| 10 | Guard | every guard | gruff, flat, short |
| 11 | Roots man | the thin man, his father, stallholders, a man, a local | plain, mid-low |
| 12 | Roots woman | the mother, the stew seller, a woman | plain, mid-high |
| 13 | Old | the old man, the curio seller | slow, cracked, wavering |
| 14 | Young | the zealot, someone | quick, sharp, a sneer in the tone |
| 15 | Upper folk | the carver, lift keeper, doorman, gardener, hatch keeper? | smooth, measured, a little nasal |

- **The crowd** ("The crowd", the chants) is several of 11–14 at once, slightly out of step.
- **Narration** is silent (suggestion), so the voices mean someone is speaking. Or a very soft
  paper-like tick: designer's call.
- **Faceless voices** (the prologue's Mum, the voice behind the curtain, your friend through the
  shutter) use their speaker's voice, muffled.
- **Later, if wanted:** a mood tag that changes a voice for one line (angry is lower and faster,
  frightened is higher and shakier). It fits with expressions, which are on hold.

**Typing out:** a line types at a set speed; pressing the key finishes the line at once, and pressing
again moves on (as now). Text speed becomes a setting (it's already on the list in `docs/ideas.md`).

## 2. The sound of the tree (suggestion)

Four layers, all made in code at first, and all data, like everything else:

**a. A bed for every area** (`ambience` on each area: a low, looping sound that sets the place):

| Area | Bed |
| --- | --- |
| Your home | the hearth, the tree creaking around you, the rot's faint wet sound by the gap |
| The offering floor | the tube's hum, wide and hollow; a murmuring crowd at the rites |
| The roots market | chatter and calls, pots, footsteps on boards |
| Your friend's home | quiet, tidy, the shrine's soft hum |
| The lower roots | dripping, the fungi's faint fizz, distant voices; hushed at night |
| The back routes | close, dripping, the tree groaning, things moving in the walls |
| The Tender's shrine | stillness, the lamp, a deep hum from the enshrined blessing |
| The trunk climb | wind rising as you climb, the tube's hum close by, creaking ropes |
| The middle tiers | busier and cleaner: workshops tapping, the lift's counterweight |
| The upper halls | airy, high, soft wind at the skylights, a clock ticking somewhere |
| The archive | hush, the index engine clicking, paper |
| The seed grove | open air, leaves, the seeds' faint chime |
| The Ascension gate | the tube loud and bright, wind, the glare almost a sound |
| The rot | wet, slow, bubbling, close |
| The cell | a drip, the guard shifting, the crowd outside (Day 7) |

**b. Things that make a sound where they are** (louder as you get near, panned left or right):
fire (crackle), drips (a plink), the tube (hum; the motes faintly), swinging lamps (creak), the lift and
movers (rope and creak), crumbling boards (a crack, then a fall), rubble (dust, then a thump), collapse
(a rumble), rot pools (bubbling), beetles (skittering, louder when they rush), the watch (footsteps,
the lantern's squeak), jars, the mob (torches, shouting, getting closer).

**c. You:** footsteps that change with the floor (wood, plank, metal, fungus, the wet rot), a jump, a
landing, crouching, the cloak's rustle, doors.

**d. Moments in the story,** on tags that already exist: the offerings going up the tube and the
blessings coming down (a rush), `#flash`, `#shake` (a deep thud), `#throw`, the knock at the door
(Day 6), `#recoil` and `#turn` (the crowd's shuffle), `#rise` (a long rising tone), `#daylight` (the
first outside sound: real wind).

**Time of day:** the same place sounds different by time: busy at the rites, quieter in the
afternoon, quiet and close at night.

## How it would be built (suggestion)
- `src/systems/voices.ts`: the voice presets and the syllable timing (pure, tested: which letters
  sound, pauses, question marks), and `SPEAKERS` gets a `voice` field.
- `DialogueBox` types lines out and calls the voice for each syllable.
- `src/ui/soundscape.ts`: the area bed, the sounds of features by distance, footsteps; started and
  stopped with the area.
- Three volumes (music, sounds, voices) under Phaser's master volume, ready for a settings screen,
  and a mute key in dev.

## Order of work (suggestion)
1. Lines typing out, and the voices (the biggest change you'll feel). Tune the 15 by ear together.
2. Footsteps and the sounds of features (fire, drips, the tube).
3. The area beds, by time of day.
4. Story moments.
5. Then music.

## Questions for the designer
1. **Synthesised or recorded?** Code-made sounds keep everything as text and need no licences, and
   suit voices, footsteps, hums and drips well. Busy places (market chatter, a crowd) are hard to fake
   well; recorded sounds (free, CC0, e.g. from freesound.org) would sound richer there. Suggestion:
   code for everything first, then swap in recordings for the few that don't convince.
2. **Is 15 voices right?** More unique voices for the regulars (the zealot, the thin man, the old man,
   the mother each their own), or fewer shared ones?
3. **Narration:** silent, or a soft tick?
4. **Should the text type out?** (Needed for the voices to work well.)
