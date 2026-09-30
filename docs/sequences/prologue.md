# Sequence brief: the prologue

Built 2026-09-30 (`src/scenes/PrologueScene.ts`, `src/ui/prologueArt.ts`, `story/prologue.ink`).
**(doc)** = design doc; **(designer)** = decided in conversation; **(suggestion)** = Claude's proposal.

## The beats (designer)
1. It just starts: you and your mum sat together, her tenderly showing you how she carves her birds.
2. You interact: turning the bird and following her instructions. She praises you ("good", "well
   done"), hints that you're talented and the gods will like your work. You answer her.
3. Then it happens: the slip takes your left thumb and forefinger. Mum is shocked, you're in pain.
4. Cut to black.
5. Your older self: that day condemned you to the roots; you were talented, but the perfection the
   gods reward can't be made with hands like yours (your mind can, your hands can't). The real words
   are the designer's to write.
6. A little exposition about how the world works: a society of pure fairness (you receive according
   to what you contribute; the brilliant rise to better materials, food, housing, status), a brutal
   meritocracy that assumes everyone can show their merit. The protagonist can't.
7. You wake at home on Day 1.

## Presentation
- Intimate, not the usual distant side view. **(designer)** A close-up of the workbench by firelight:
  just the bird and the knife, no hands (hands were tried and looked wrong) and no faces; the scene is
  the two voices. **(designer)**
- The bird is your first offering, meant to go up the tube at the next morning's rite. **(designer)**
- It shouldn't rush to the slip: more tenderness, world-building, a couple more interactions.
  **(designer)** Steps **(suggestion)**:
  - turn it to the fire to see the grain (left/right or a click; the bird turns smoothly)
  - smooth the head by rocking it left and right (8 rocks; dust lifts off)
  - carve the first wing (hold E or the mouse: the knife cuts a groove, chips land on the bench)
  - cut the eye (press E when a pulsing ring is smallest; after 3 misses it just works)
  - turn it round and carve the other wing, which slips partway: a gouge, a red flash, blood drops
    onto the bird
  Between steps Mum explains the world to the child (the rite, blessings, the high branches) and
  shares a memory of learning at the same bench. **(suggestion)**
- After the black: narration as text on black, then two stills with the words beneath (the tree in
  cross-section; the tube, just the beam **(designer)**). **(designer left it to
  Claude)**
- No sound effects for now. **(designer)**

## Decided
- The injury: left thumb and index finger. **(designer)** The child is about 7. **(designer)**
- The reaction choice that introduces the three dialogue styles moves to Day 1: you wake and Mum
  asks how you're feeling. **(designer)** It sets the ink variable `dialogue_style`.

## Open
- The real words for Mum, the child and the narration.
- The art pass for the close-up (the bird, the bench, the stills).
- What happens next on Day 1, once you're up.
