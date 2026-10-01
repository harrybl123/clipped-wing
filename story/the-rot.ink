// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the rot (off the map; under the girl's home).
// One knot per interactable/person in src/data/areas/theRot.ts. All text is placeholder.
// ============================================================================

=== the_rot_girl ===
{~"Don't stop. It's sticky."|"Watch the green."|"Under my bed. Far end."}
-> END

=== the_rot_dying_root ===
-> day4_rot_wood

=== the_rot_way_up ===
{ day4 == "back": -> day4_climb_up }
{ day4 == "rot":
    "Look at the wood first. That's what you're here for." #speaker:girl
}
-> END
