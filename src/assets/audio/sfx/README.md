# Recorded sound effects

Drop a recording here named after the sound it replaces, and the game plays it instead of the
synthesised version, everywhere that sound plays (`src/ui/recordings.ts`). Any of `.ogg`, `.mp3`,
`.wav`, `.m4a`, `.webm`. The names are the ids in `SOUND_IDS` (`src/ui/soundscape.ts`); the soundboard
(`soundboard.html`) shows which ones have a recording.

Waiting for recordings (silent until then; designer, 2026-10-02: the synthesised crowds didn't sound
real): `murmur`, `gasp`, `roar`, `jeer`, `chant`, `whispers`, `scream`, `sob`. See
`docs/sound-effects-plan.md` for what each should be and where it plays.
