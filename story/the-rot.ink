// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the rot (off the map; under the girl's home).
// One knot per interactable/person in src/data/areas/theRot.ts. All text is placeholder.
// ============================================================================

=== the_rot_girl ===
{ girl_follows: -> day7_girl_in_rot.again }
{~"Don't stop. It's sticky."|"Watch the green."|"Under my bed. Far end."}
-> END

=== the_rot_dying_root ===
-> day4_rot_wood

// Day 7 (fall): the girl, if you blamed her; and the far end, where the light breaks in.
=== the_rot_girl_fallen ===
-> day7_girl_in_rot

=== the_rot_crack ===
{ day7 == "fall": -> day7_light }
The far end of the hollow. A cold draught comes through the dead wood here, from somewhere.
-> END

=== the_rot_way_up ===
{ day4 == "back": -> day4_climb_up }
{ day4 == "rot":
    "Look at the wood first. That's what you're here for." #speaker:girl
}
-> END
