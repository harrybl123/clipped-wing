// ============================================================================
// Interactions in the sunk town (Chapter 2): one knot per interactable in
// src/data/areas/borderland/sunkTown.ts. Draft text for the designer to rewrite.
// Finds aren't kept yet (no finds or tally in Chapter 2's story so far); a second
// search says there's nothing more.
// ============================================================================

// --- The surface ---

=== sunk_town_dome ===
The top of something round and smooth, sticking out of the ground. No joins anywhere.
Whoever built it built it all in one piece.
-> END

=== sunk_town_stairs ===
Stairs, going down into the dirt. They were meant to go somewhere.
-> END

=== sunk_town_rope ===
A stake hammered into the dirt, and a rope tied to it, going down into the dark.
Old knots, retied over newer ones. Plenty of people have trusted it.
-> END

// --- The first level ---

=== sunk_town_screen ===
A dark panel in the wall, still glowing, very faintly. Touch it and nothing happens.
-> END

=== sunk_town_search_seats ===
{ sunk_town_search_seats > 1:
    Nothing left under the seats but dirt.
- else:
    Seats, all in one piece with the floor, facing the dark panel. As if people sat here to watch it.
    Under the last one, pressed into the dirt: a thin ring of pale casing, light as nothing.
}
-> END

=== sunk_town_door ===
The door slid up by itself when you came near. Then it stopped, halfway, and it's been shaking ever since.
-> END

=== sunk_town_search ===
{ sunk_town_search > 1:
    The shelves are bare now.
- else:
    Hollows in the wall, like shelves. Most are empty, picked clean long ago.
    At the back of one, behind a drift of dirt: a coil of wire finer than hair, every strand a different colour.
}
-> END

=== sunk_town_tallies ===
Chalk marks on the wall by the stairwell. Groups of five, crossed through.
Someone was counting something. People going down, maybe. Or coming back.
-> END

// --- The second level ---

=== sunk_town_search_boxes ===
{ sunk_town_search_boxes > 1:
    The rest won't open. You've tried.
- else:
    Boxes, hundreds of them, all the same, all shut. No handles. No hinges you can find.
    Someone's prised a few open with a bar. Empty, every one.
    One near the floor gives when you push it. Inside, a slab of glass the size of your palm. It warms in your hand, and a line of light crawls across it, then goes out.
}
-> END

=== sunk_town_crawl ===
The room beyond is full of earth to the ceiling. Someone's dug a crawl along the bottom of it, and propped it with bent plates.
You'll have to go on your belly.
-> END

=== sunk_town_chalk ===
The walls are covered in chalk. Tallies, rows of them. An arrow pointing back the way you came.
And a circle, crossed through. Whatever it meant, they drew it hard.
-> END

=== sunk_town_search_camp ===
{ sunk_town_search_camp > 1:
    You leave the rest of the camp alone.
- else:
    A blanket gone stiff with dust. A cup cut down from something else. A lamp with the fat burnt out of it.
    Somebody lived down here, for a while. They didn't take their things when they left.
    Folded in the blanket: a strip of soft grey cloth that won't tear, however hard you pull.
}
-> END

// --- The third level ---

=== sunk_town_search_carriage ===
{ sunk_town_search_carriage > 1:
    Nothing else in the carriage you can reach.
- else:
    A long rounded shell lying on its side in the tunnel, one door hanging open. Seats inside, in rows, like the room above.
    A line of light still runs along its flank, flickering.
    Wedged under a seat: a little cylinder that ticks, very quietly, when you hold it to your ear.
}
-> END

=== sunk_town_column ===
A column of glass from floor to ceiling, full of light. Still on, after all this time.
It hums. No dirt has come in here at all.
-> END

=== sunk_town_search_column ===
{ sunk_town_search_column > 1:
    The slot's empty now. The column hums on.
- else:
    At the foot of the column, a slot. In the slot, something small and smooth, warm as a hand.
    It comes out easily. The column's light doesn't change.
}
-> END
