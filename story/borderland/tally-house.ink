// ============================================================================
// Interactions in the tally house (Chapter 2): one knot per interactable in
// src/data/areas/borderland/tallyHouse.ts. Draft text for the designer to rewrite.
// ============================================================================

=== tally_house_queue ===
The queue forms here every evening, along the rail. Nobody talks much.
Everyone is looking at what everyone else brought.
-> END

=== tally_house_slate ===
The slate: a sign for each name, and strokes for what they brought in.
Some rows are crossed through.
-> END

=== tally_house_counter ===
The tallyman's counter. Polished by every haul that's ever been pushed across it.
-> END

=== tally_house_scale ===
The great scale. Nobody knows what it was made for.
The dish is smooth as water. The weights on the other side are finds, strung on a chain.
-> END

=== tally_house_share ===
The clan's share, behind the grille. More than the whole settlement eats in a month.
-> END

=== tally_house_walkway ===
From up here, you'd see every hand at the counter. That's the point of it.
-> END

// --- People (draft) ---

=== tally_house_tallyman ===
{ c2day1 == "tribute": -> c2day1_tribute }
{ c2day3 == "tribute": -> c2day3_tribute }
"Next. Everything on the scale, nothing in the pockets." #speaker:tallyman
"The scale doesn't lie. I make sure of it." #speaker:tallyman
-> END

=== tally_house_enforcer ===
"Move along. Queue's that way." #speaker:enforcer
"I'm watching the weighing. Someone has to." #speaker:enforcer
-> END
