// ============================================================================
// TEMPORARY PLACEHOLDER — interactions on the trunk climb.
// One knot per interactable in src/data/areas/trunkClimb.ts. All text is placeholder.
// ============================================================================

=== trunk_climbers_marks ===
[PLACEHOLDER] Little figures and notches scratched into the wall, one for each climber who made it to the top.
-> END

=== trunk_lookout ===
{ day1 == "climb" && met_friend_climb: -> day1_lookout }
[PLACEHOLDER] The tube rises past the lookout, up and up towards the Canopy's glow.
-> END

=== trunk_friend_on_climb ===
-> day1_friend_on_climb

=== trunk_friend_at_lookout ===
{ day1 == "climb": -> day1_lookout }
[PLACEHOLDER] "Look at them go." #speaker:friend
-> END
