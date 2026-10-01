# Plan: a face for everyone you speak to

Designer, 2026-10-01: "one of the highest leverage things we can do for this game, is create a face
for everyone you speak to, even if it's an NPC." **(designer)** = decided; **(suggestion)** = Claude's
proposal, for the designer to mark up.

## Where we are
- Seven speakers have portraits (`SPEAKERS` in `src/ui/portraits.ts`, 48×48 busts, lit from the
  right): you, Mum, the Tender, your friend, the girl, the archivist, the boy. Ink shows one with
  `#speaker:<id>`.
- Everyone else speaks under `#name:<Name>`: a name with no face, and the line takes the full width.
  Counted across the story: an elder (23 lines), the preacher (21), a guard (20, plus "the guard",
  "the guard at the post", "your escort"), the young man / zealot (14 + 3), the old man (14), the thin
  man (8), a woman (8), a man (8), a mother (7), the crowd (4), someone / someone else / someone in the
  crowd (8), the stew seller, the hatch keeper, his father, your friend once through a closed shutter,
  and a voice behind a curtain (Day 6).
- About 17 placeholder lines in the area knots (the middle tiers' carver and lift keeper, the
  market's stallholders, the gate guard and so on) have no tag at all, so they read as narration.

## The approach
1. **A baseline face for NPCs, varied by hair and items (designer: "a baseline with different hair
   or items, maybe you decide").** One shared bust in the style of the hand-made seven, with Claude
   choosing the variations: hair (style and colour: cropped, long, bun, balding, grey), headwear (cap,
   hood, scarf), items (a guard's band, an elder's stole, a stallholder's apron, a pipe, beads, a
   tube token, spectacles), plus a little face variety (beard, age lines, a brow). It's drawn from
   the same look the world sprite uses (`VillagerLook` in `src/ui/characters.ts`: headwear (bare,
   hood, cap, bun), hair colour (grey for elders), the accent colour of their clothes, a stole for
   elders, a guard's cap and band), plus a few face settings (face shape, age lines, beard, brow,
   expression). The recurring cast gets more than a swap of hair and items (point 2), and the
   one-offs and crowd voices are the baseline plus their swaps. **The face you see should match the person on screen:** the guard's portrait has the
   guard's amber band, an elder has the grey hair and pale stole. Red stays off everyone but you.
2. **Hand-tuned faces for the recurring cast**, built with the generator and then adjusted:
   - **The preacher:** hungry, smiling, the face of the one who means it most.
   - **The elders:** one face each for the four on the dais (suggestion), since "An elder" speaks
     23 times across Days 4 to 7. Their lines are tagged with which elder is speaking: the eldest
     leads the questioning, a sharper one has the contempt lines.
   - **The guards:** one face for the shrine and roots guards, one for the escort (the same man on
     Day 5 and Day 7?), the guard at the middle-tiers post, the gate guards.
   - **The crowd regulars:** the young man (the zealot), the old man, the mother, the thin man.
     They recur from Day 2 to Day 7 and deserve to be recognisable.
3. **One-offs:** the stew seller, the hatch keeper, your friend's father, the market stallholders,
   the middle-tiers carver and lift keeper, the upper-halls residents, the seed-grove gardener. Each
   gets a generated face from their sprite's look, so every talkable person in every area has one.
4. **Voices from a crowd** ("A woman", "A man", "Someone"): a small set of generic faces, each picked
   to match someone standing in that crowd (suggestion). **"The crowd"** chanting all at once gets a
   group portrait: three or four heads crowded into the frame.
5. **Retag the ink:** `#name:An elder` becomes `#speaker:elder_eldest` and so on, with a `SPEAKERS`
   entry (name and portrait) for each. The names shown stay as they are now.
6. **A test so nobody slips through:** every quoted line of speech in the ink must carry a
   `#speaker:` tag. `#name:` is only allowed for the voices on a short faceless list (below). It runs
   with the rest of the tests, so new dialogue can't lose its face.
7. **Gallery:** every portrait in `gallery.html`, beside its world sprite, to check that they match.

## Faceless on purpose (suggestion; designer to confirm)
- **The prologue** stays faceless (decided earlier: "no hands, no faces" at the bench). Mum's 19
  `#name:Mum` lines there stay as they are.
- **The voice behind the curtain** on Day 6 ("Noon. Where we said."): you hear it before you know it's
  the preacher. Keep it faceless, or show his face as the reveal?
- **Your friend through the closed shutter** on Day 7 ("Go away. Please."): his face is the point of
  that moment being hidden. Faceless, or his portrait?

## Decided (designer, 2026-10-01)
1. **Elders share one face,** told apart by different coloured robes (designer). Their sprites on the
   dais get the same colours, so each portrait matches its elder. Lines are tagged with which elder speaks.
2. **Crowd voices:** Claude's call. Generic baseline faces, each matched to someone standing in that
   crowd; "The crowd" chanting together gets the group portrait.
3. **Faceless:** Claude's call (designer: "I trust your judgement"). The prologue, the voice behind
   the curtain on Day 6 (hidden until you know it's the preacher), and your friend through the closed
   shutter on Day 7. Everyone else has a face.
4. **No expressions yet** (designer). One face per character.

## Order of work (suggestion)
1. The generator, a test (sizes, palette, no red), and the gallery section.
2. The recurring cast: the preacher, the four elders, the guards, the zealot, the old man, the mother,
   the thin man. Retag their lines.
3. The one-offs and every untagged placeholder line in the area knots.
4. The crowd voices and the group portrait.
5. The test that every line of speech has a face, then a play-through to check portraits against the
   people on screen. Record the decision in CLAUDE.md.
