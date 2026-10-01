// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the girl's home (off the map; through her door in the lower roots).
// One knot per interactable/person in src/data/areas/girlsHome.ts. All text is placeholder.
// ============================================================================

=== girls_home_girl ===
{ day4 == "visit":
    "The board. Under the rug." #speaker:girl
- else:
    "Shh. You'll wake everyone." #speaker:girl
}
-> END

=== girls_home_board ===
{ day4 == "visit": -> day4_go_down }
The rug, back over the board.
-> END

=== girls_home_door ===
{ day4 == "visit":
    "Not yet. You came to look at something, remember?" #speaker:girl
- else:
    The door out to the lower roots.
}
-> END

=== girls_home_junk ===
Salvage, stacked to the ceiling: bent coils, cracked cells, a shoe with no partner, a carved bird with no head.
-> END

=== girls_home_curtain ===
A curtain across the back of the room. Behind it, slow breathing.
-> END
