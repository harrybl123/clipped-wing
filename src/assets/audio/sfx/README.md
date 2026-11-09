# Recorded sound effects

Drop a recording here named after the sound it replaces, and the game plays it instead of the
synthesised version, everywhere that sound plays (`src/ui/recordings.ts`). Any of `.ogg`, `.mp3`,
`.wav`, `.m4a`, `.webm`. The names are the ids in `SOUND_IDS` (`src/ui/soundscape.ts`); the soundboard
(`soundboard.html`) shows which ones have a recording.

Waiting for recordings (silent until then; designer, 2026-10-02: the synthesised crowds didn't sound
real): `murmur`, `gasp`, `roar`, `jeer`, `chant`, `whispers`, `scream`, `sob`. See
`docs/sound-effects-plan.md` for what each should be and where it plays.

## Where the recordings came from

- `shing.wav` (the war table: a hero arriving, a sword drawn; Jack): "Sword" by Joseph Sardin, BigSoundBank, sound 0129 (https://bigsoundbank.com/sword-s0129.html), public domain (CC0). Trimmed, and pitched up a little (1.1) for a brighter ring. Their hero's sword (`shingLow`) is the same recording slowed to 0.6.

`hero` (someone calling "Hero!") is waiting for a recording: Jack's going to record it.
- `cackle.ogg` (the witch arriving): "Witch Cackle" by AntumDeluge, OpenGameArt (https://opengameart.org/content/witch-cackle), public domain (CC0). Left as it is.
- `grunt.wav` (the king's guard arriving; the barbarians: the same, slowed to 0.75): "3grunt1" from "Male Grunt/Yelling sounds" by HaelDB, OpenGameArt (https://opengameart.org/content/male-gruntyelling-sounds), CC0. Trimmed, pitched down a little (0.95).
- `giggle.wav` (the maiden arriving) and `kiss.wav` (a seduction): provided by Jack ("girl-chuckle-laugh" and "mystic-kiss-acappella"), from a sample site that marked them public domain, standard licence, royalty free. The giggle trimmed; the kiss given a long, dark reverb (mysterious, Jack).
- `bubble.wav` (a squad poisoned on the war table; Jack): "bubbles-loop1" from "Bubble sound effects" by Brian MacIntosh (BMacZero), OpenGameArt (https://opengameart.org/content/bubble-sound-effects), CC0. The first 1.4 seconds, slowed to 0.8 (deeper, gloopier), faded out.
- `warcry.wav` (a clash on the war table: both sides' war cries; the rising's, `warcryLow`, the same slowed to 0.8): six yells from "Male Grunt/Yelling sounds" by HaelDB, OpenGameArt (https://opengameart.org/content/male-gruntyelling-sounds), CC0 (1yell1, 1yell3, 2yell5, 2yell6, 3yell1, 3yell6), layered a little apart at different pitches into a crowd, 1.8 seconds, faded out.
- `clash.ogg` (swords meeting in a clash): "sword_clash.1" from "20 sword sound effects (attacks and clashes)" by StarNinjas, OpenGameArt (https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes), CC0. Left as it is.
- `deal.ogg` (the diviner dealing a card; Jack: a subtle paper swish) and `flip.ogg` (a card turned over): "card-slide-1" and "card-place-1" from "Casino Audio" by Kenney (www.kenney.nl), OpenGameArt (https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips), CC0. Left as they are.
- `angel.ogg` (the Lord's judgement on the war table: a loyal servant, the light turning golden; Jack: an angelic "ahhh"): "aah_sun.ogg" by j2l with Aosi, an extract from their "Turn to the Sun", OpenGameArt (https://opengameart.org/node/139502), **CC-BY-SA 3.0** (http://creativecommons.org/licenses/by-sa/3.0/): it must be credited, and a changed version shared under the same licence. Left as it is. (The only recording here that isn't public domain; swap in a CC0 one if that's simpler for the release.)
- `gallop.mp3` (a race on the war table: both sides' horses galloping in; Jack): "ground" from "Horse gallop on different surfaces" by congusbongus, OpenGameArt (https://opengameart.org/node/167525), CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/), adapted from "Single Horse Galopp" by D4XX (https://freesound.org/people/D4XX/sounds/564628/, CC0). Credit congusbongus (and D4XX). Left as it is.
- `slam` (the heretic: the windows slamming shut) is synthesised.
- `diviner`, `thief`, `plague` are synthesised (the thief replays `shing`, higher); `plague` (Jack: a hollow, dark sound) could take a recording.
- `aha.wav` (the architect unrolling his plans on the war table; Jack: an "aha!" sound): "2 AHA" from "Aha! voice pack Female Fighter Voice Over" by JeanMyna_VA, OpenGameArt (https://opengameart.org/content/aha-voice-pack-female-fighter-voice-over-vocal-sound-for-character), **CC-BY 3.0** (http://creativecommons.org/licenses/by/3.0/): credit @JeanMyna_VA. Trimmed and pitched down (0.8) for the architect, a man.
- `paper` (his scroll unrolling) is synthesised.
