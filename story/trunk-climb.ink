// ============================================================================
// Interactions on the trunk climb: one knot per interactable or person in src/data/areas/trunkClimb.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== trunk_climbers_marks ===
Little figures and notches scratched into the wall, one for each climber who made it to the top. Two of them are yours and his, from years ago.
-> END

=== trunk_lookout ===
{ day1 == "climb" && met_friend_climb: -> day1_lookout }
The tube rises past the lookout, up and up towards the Canopy's glow.
-> END

=== trunk_friend_on_climb ===
-> day1_friend_on_climb

=== trunk_friend_at_lookout ===
{ day1 == "climb": -> day1_lookout }
"Look at them go." #speaker:friend
-> END
