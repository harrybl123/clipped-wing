// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the lower roots.
// One knot per interactable/person in src/data/areas/lowerRoots.ts. All text is placeholder.
// ============================================================================

=== lower_roots_girl ===
{ day5 == "roots": -> day5_girl_seed }
{ day6 == "disguise" && !has_disguise: -> day6_girl_disguise }
{ day5 == "deal": -> deal }
[PLACEHOLDER] "Well. Look who wandered all the way down here. Lost, or just nosy?" #speaker:girl
+ [Nosy]
    [PLACEHOLDER] "Nosy suits you. Don't let it go to your head." #speaker:girl
+ [Lost]
    [PLACEHOLDER] "Shame. I was about to be flattered." #speaker:girl
- -> END

= deal
"Up on the high walkway. Mind your pockets." #speaker:girl
-> END

=== lower_roots_local ===
[PLACEHOLDER] "Mind your elbows, it's packed down here."
-> END

=== lower_roots_pot ===
[PLACEHOLDER] The shared pot. Everyone puts something in. It's mostly water today.
-> END

=== lower_roots_soft_wood ===
[PLACEHOLDER] The wood here is soft and damp. The fungi grow thickest on it.
-> END

=== lower_roots_scratches ===
[PLACEHOLDER] Lines scratched into the wall, turning and branching. They mean something to someone.
-> END

// Her doorway, under the great root (her home is its own area: girls-home).
=== lower_roots_girls_door ===
-> day4_girls_door

// The boy (Day 5 on): a sleazy fixer who hangs around by the boarded hole. Gets anything, for a price.
=== lower_roots_dodger ===
{ day5 == "deal": -> day5_dodger }
{ day6 == "disguise": -> day6_dodger_disguise }
{ seed == "roots": -> customer }
{~"Looking for something? I've got it. Whatever it is."|"Psst. Rot-hand. Need anything? Food, light, a nice knife? Discreet."|"Don't look at me like that. I'm a businessman."} #speaker:boy
-> END
= customer
"My favourite customer! How's the seed? Growing nicely, I bet." #speaker:boy
-> END
