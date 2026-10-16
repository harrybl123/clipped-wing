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
