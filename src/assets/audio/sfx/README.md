# Recorded sound effects

Drop a recording here named after the sound it replaces, and the game plays it instead of the
synthesised version, everywhere that sound plays (`src/ui/recordings.ts`). Any of `.ogg`, `.mp3`,
`.wav`, `.m4a`, `.webm`. The names are the ids in `SOUND_IDS` (`src/ui/soundscape.ts`); the soundboard
(`soundboard.html`) shows which ones have a recording.

Waiting for recordings (silent until then; designer, 2026-10-02: the synthesised crowds didn't sound
real): `murmur`, `gasp`, `roar`, `jeer`, `chant`, `whispers`, `scream`, `sob`. See
`docs/sound-effects-plan.md` for what each should be and where it plays.

## Where the recordings came from

All public domain (CC0): free to use and share, no credit required (credited here anyway).

- `snarl-1.wav` to `snarl-3.wav` (the kennels' creatures: twisted into every one of their cries, see
  `creature()` in `src/ui/soundscape.ts`): "Dog Snarl Grunt Grumble" by qubodup,
  OpenGameArt (https://opengameart.org/content/dog-snarl-grunt-grumble; Freesound 122183), pitched
  down to 0.7.

Several takes of one sound (`<id>-1`, `<id>-2`…) are picked at random each time it plays.
