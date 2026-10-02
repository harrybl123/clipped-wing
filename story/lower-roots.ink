// ============================================================================
// Interactions in the lower roots: one knot per interactable or person in src/data/areas/lowerRoots.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== lower_roots_girl ===
{ day5 == "roots": -> day5_girl_seed }
{ day6 == "disguise" && !has_disguise: -> day6_girl_disguise }
{ day5 == "deal": -> deal }
{ today() >= 5:
    "Careful, carver. Half the roots wants you in a box. Don't make it easy for them." #speaker:girl
    -> END
}
"Well. Look who wandered all the way down here again. Lost, or just nosy?" #speaker:girl
+ [Nosy]
    "Nosy suits you. Don't let it go to your head." #speaker:girl
+ [Lost]
    "Shame. I was about to be flattered." #speaker:girl
- -> END

= deal
"Up on the high walkway. Mind your pockets." #speaker:girl
-> END

=== lower_roots_local ===
// Lower roots folk don't hate you; they just don't want the trouble you bring (designer: kind, mostly).
{
- today() >= 6: "They'll be down here next, looking for you. Kicking doors in. Go. Please." #speaker:local
- today() == 5: "Go on up home, carver. Whatever you've brought down here, take it back up with you." #speaker:local
- today() == 4:
    "Folk from upstairs have been down, asking about you. Asking who you talk to." #speaker:local
    "We don't need that sort of trouble down here." #speaker:local
- today() == 3: "You're the one whose bird came back? Huh. Never thought anything up there would notice us down here." #speaker:local
- else: "Mind your elbows, it's packed down here." #speaker:local
}
-> END

=== lower_roots_pot ===
The shared pot. Everyone puts something in. {today() >= 5: It's just water now, and a root for the taste.| It's mostly water today.}
-> END

=== lower_roots_soft_wood ===
The wood here is soft and damp. The fungi grow thickest on it. Press it and it gives, like bread.
-> END

=== lower_roots_scratches ===
Lines scratched into the wall, turning and branching. A map of the tunnels, maybe, for people who can't read.
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
