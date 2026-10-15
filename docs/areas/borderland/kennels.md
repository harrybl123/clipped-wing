# Area brief: the kennels

Chapter 2. Planned and built 2026-10-14 (`src/data/areas/borderland/kennels.ts`, `story/borderland/kennels.ink`; dev `?area=kennels`). Proposed by Jack, for Harry to confirm.

**(Jack)** = Jack's idea, **(designer)** = decided by Harry, **(suggestion)** = Claude's proposal (Jack agreed to the ones marked **(suggestion, Jack agreed)**). Nothing here is settled until Harry confirms it.

## Purpose
A new place in the settlement with a locked-away secret. **(Jack)**
- Three creatures at the far end guard a wooden box with a key hidden in it. You can't see the key yet, and you can't get past them. **(Jack)**
- The key could tie into the story, or be a secret for later. **(Jack)** That's for Harry to decide (see the open questions).

## No dogs
- Dogs are all but extinct, and the scavenger's dog is her secret, so the kennels can't hold dogs. **(designer)**
- Instead: nobody has dogs, so whoever needs something guarded keeps **rabid, diseased creatures**, half-wild, kept hungry, as likely to bite their owners as obey them. **(Jack)** It makes her dog more precious by contrast: everyone else's "guard dog" is a sick thing, and hers is loyal. **(suggestion)**
- **A mix of three kinds** **(Jack)**:
  - **Scrap hyenas:** high hunched shoulders, round ears, a mangy spotted coat, a big frothing jaw, and a cackle.
  - **Tusked hogs:** low and heavy, a bristled ridge, sores, tusks, and a squeal.
  - **Nameless things:** hairless and hunched, spine and ribs showing, a milky eye, a long jaw of too many teeth, and a shriek.

  (Looks are Claude's.) Sores weep amber; no red, no blood.
- **Is it the rot that's made them sick?** It would tie into Chapter 1's rot and the roots' seed. Harry's call, so for now nothing glows green.

## When it's visited
- Open every day, so you can find it and be warned off early. **(suggestion)**
- Getting past them comes later, once the story gives you a way. **(Jack: we'll get to that later)**

## Mood and sound
- Loud and frightening from the moment you arrive. Creatures in cages all round, and the most aggressive ones at the far end. **(Jack)**
- **So loud and aggressive the sound distorts.** **(Jack)** And it shouldn't sound 8-bit or like any real dog. **(Jack)**
  - Each cry is made from real (public-domain) snarl recordings, pitched, stuttered and ring-modulated until it sounds like no one animal.
  - Under them, wet rattling breath and gurgling.
  - Everything goes through a saturating overdrive.
  - Sounds: `cackle` (hyena), `squeal` (hog), `shriek` (the nameless thing), `snarl`, `wheeze`, `maul` (`creature()` in `src/ui/soundscape.ts`).
  - Each one plays from the creature, so it's louder the nearer you are. The caged ones are at half the volume of the three at the end.
- **The music ramps up in ominous intensity as you get closer**, more ominous and disturbing. **(Jack)** Built as the `dread` score (`src/ui/score.ts`):
  - At the way in, a low uneasy drone.
  - Nearer, a clashing cluster shakes faster through harsher distortion, its notes bending sickly out of tune, and a heartbeat quickens from slow to racing.
  - Then a scrape like a bow on a wire and a thin wavering whine come in.
  - Full intensity at the gate and in the pen; it cuts out when they get you.
- A fenced yard off the scrap stacks, under the settlement's sky, with a burning drum by the way in. **(suggestion)**

## Size and layout
A little wider than a screen (640). Left to right:
1. **The way in**, from the scrap stacks (a post with a chain and a heavy collar marks the lane). **(suggestion)**
2. **The cages:** four scrap cages with creatures pacing in them, hurling themselves at the bars (the bars rattle in front of them). **(Jack)** They can't reach you; they're noise and fear. **(suggestion, Jack agreed)**
3. **The pen**, at the right-hand edge: tall bars up to a wire roof, with a gate. One of each kind inside, in front of a wooden box. **(Jack)**

## Key props
- **Signature:** the wooden box behind the three, nailed shut with a rope round it. **(Jack, suggestion)**
- The cages, their bars rattling; the pen's tall fence, its chain hanging loose and the padlock open. **(suggestion)**
- Gnawed bones, kicked-over feed tins. **(suggestion)**
- No red anywhere: no blood and no red eyes, since red stays reserved (and copper is hers). **(suggestion, Jack agreed)**

## Interactions
- **Coming near the pen:** the three come forward to the bars, as a warning. **(suggestion, Jack agreed)**
- **The gate:** you can go into the pen whenever you like. That would obviously be stupid unless you have a way past them (later). **(Jack)** The choices are "Go in." or "Leave it."
- **Inside the pen** they run at you, and if they reach you they eat you: they pile on, the screen shakes, and it cuts to black over their cries, with no gore. Then it's **game over**. **(Jack, suggestion, Jack agreed)**
- **Looking** at the cages gives a short line. **(suggestion)**

## The game over system (Jack)
A general game over: an ending screen with "Game over" and **Try again from Day N**, the day it happened, back to how that day began. For now only the kennels use it, to test it out. **(Jack)**
- Built as a `retryDay: 'today'` and `gameOver` on an ending in `src/scenes/EndingScene.ts` (`mauled`: "Torn apart.", draft words for Harry).
- Any area can use it through the `guards` feature's `ending`, or `#ending:mauled` from ink.

## Exits
- To the scrap stacks (a lane off its floor, between the towers). On the map, a fenced yard of little cages below the scrap stacks. **(suggestion)**

## Open questions (for Harry)
1. **Whose creatures are they, and who keeps the key there?** The boss? The other clan? Someone nobody knows?
2. **What does the key open?** Something in Chapter 2's story, or a secret that pays off in a later chapter?
3. **How do you get past them in the end?** Some ideas: your dog faces them down, you find meat to distract them, someone tells you the keeper's call, or a stealth route round the back.
4. **What's made them sick:** the rot, or a sickness of their own?
5. **Game over:** is "eaten, game over" the right weight for the game? Every other loss so far sends you back or carries on. Should other deadly moments use it?
6. **The words:** the look lines, the gate and the game-over card are drafts.

## The strange man (Jack; a separate proposal)
- Once you're past the first cage, **a strange man falls out of the sky**, lands on the small cage and breaks his back. "Oof!" Then: "Damn!" **(Jack)**
- He rolls off into the dirt and lies there writhing. Walk up and talk to him: "What are you doing?" "Just came to check up on you. I'm your father." **(Jack)**
- Then the screen cuts to black: **Chapter 7: Epilogue. (He was your father.)** **(Jack)**
- His look (wild grey hair, goggles, a long patched coat) is Claude's. It's a one-off: the scene plays once a day, and the card offers "Try again from Day N" or the title.
