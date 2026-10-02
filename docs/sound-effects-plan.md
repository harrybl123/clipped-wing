# Sound effects plan

The designer asked for sound effects for what happens in the story (crowds roaring and so on), on top of
the music, footsteps and each place's own sounds, listed and then made systematically. Everything is
synthesised in `src/ui/soundscape.ts` like the rest (earthy, not synthy; no high whines). A sound plays
three ways:

- **By itself from a tag the story already uses** (`#throw`, `#recoil`, `#flash`, `#shake`…), so every
  scene that throws something or recoils gets it with no extra work.
- **From `#sound:<id>`** on the ink line where it happens, for moments only the text describes.
- **From the close-ups** (carving, decoding, the fight, the prologue), as you play.

## The sounds

### Crowds (the tree turning on you)

Made from many short "voice" blobs (a tone shaped into a vowel, with breath), each a little different
in pitch, length and timing, over filtered noise.

| Sound | What it is | Where |
| --- | --- | --- |
| `murmur` | a low babble of many voices, rising and settling | the crowd talking among itself: "A murmur goes round the floor" (Days 3, 5), the whispering wave on Day 4 |
| `gasp` | everyone drawing breath at once | every `#recoil` (with the shuffle of feet); "The whole floor gasps" (Day 2) |
| `roar` | a big swell of shouting, held, then falling away | the Ascension (Day 1), the cage coming back (Day 7), the mob outside (Day 7 night) |
| `jeer` | ugly laughter from many mouths | "The crowd laughs, and it's an ugly sound" (Day 3), "Someone laughs. It's sorry!" (Day 6) |
| `chant` | a two-beat word shouted together, over and over | "Cursed. Cursed. Cursed." (Days 2, 3), "Rot-hand! Rot-hand!" (Day 7), the counting (Day 5) |
| `whispers` | hissing, half-heard words, all round | Day 4's ritual |
| `scream` | one voice, a short cry | "A woman screams" (Day 2), "Someone at the front screams" (Day 6) |
| `sob` | a child crying, catching breath | Day 6's bitten bird |

### Things hitting, breaking, opening

| Sound | What it is | Where |
| --- | --- | --- |
| `hit` | something thrown landing on you: a dull smack | every `#throw`, after the whoosh |
| `spit` | a short wet spit | "Someone spits at your feet" (Day 2), the young man (Day 3), the trial (Day 7), the curio seller (Day 6 on) |
| `smash` | clay jars breaking and rolling | Mum's basket knocked over (Day 4) |
| `staff` | a staff cracked down on wood | the Tender silencing the floor (Day 2), "Enough!" (Day 3) |
| `latch` | a small catch clicking shut | the cage (Day 7) |
| `bolt` | a bolt sliding back or across | the cell door (Day 7, each time) |
| `pound` | fists on a door, many, heavy | the guards (Day 6), the mob at the shrine doors (Day 7) |
| `crash` | a door broken in: a boom and splintering | your front door (Day 7), the guards breaking in (Day 6) |
| `hammer` | boards being nailed down | the rot boarded over above you (Day 7, fall) |
| `splinter` | boards torn up | the boarded hole torn open (Day 7, fall) |
| `grate` | a heavy grate scraping up | the girl lifting the cell's grate (Day 7) |
| `boots` | several people's heavy steps outside | "boots, outside" (Day 6), the guards at the door |
| `punch` | a body blow | the fight (Day 4), the young man hitting you (Day 3) |

### Your hands (the close-ups)

| Sound | What it is | Where |
| --- | --- | --- |
| `chop` | the knife biting into wood | carving: each strike when roughing out, the wing cut; the prologue |
| `shave` | a long curl of wood coming off | carving: smoothing and hollowing (while you're in the green) |
| `skid` | the knife skidding off the grain | carving: every slip |
| `scratch` | a point scratching metal (low, not shrill) | scratching your reply on his plate |
| `pop` | a plug pushed home, a seam opening | sealing the bird; opening a bird at the hearth |
| `rub` | a rag rubbing soot off metal | decoding, while you rub |
| `slip` | the knife slipping into flesh: a cut and a sharp breath | the prologue's slip |

### Already there, now used in more places

`crack` (the hollowed bird cracking), `crackle` (soot crumbling off a found picture), `knock`, `door`,
`creak` (the window, Day 3), `thump` (falling in the fight), `whoosh` (dodging, throwing), `rush`,
`boom`, `shimmer`, `rise`, `heartbeat`.

## Not in this pass

- Individual voices crying out (Mum's "No, no, no", the girl shouting your name): the dialogue voices
  already speak them.
- A settings screen with separate volumes (the buses are ready; only the on/off speaker for now).
