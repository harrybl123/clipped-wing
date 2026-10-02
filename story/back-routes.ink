// ============================================================================
// Interactions in the back routes: one knot per interactable or person in src/data/areas/backRoutes.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== back_routes_shrine_grate ===
Warm light through a grate overhead: the Tender's shrine. Every word said up there falls straight down here.
-> END

=== back_routes_offering_grate ===
The underside of the offering floor. The tube's glow falls through the grate in a cold column. Footsteps cross it, back and forth.
-> END

=== back_routes_broken_blessings ===
Things nobody wanted, thrown down here: splinters, a bent coil, a cracked cell that barely glows. Blessings, once.
-> END

=== back_routes_mark ===
A mark in glowing fungus ink, painted by someone who knows the way. An arrow, and a little sign for danger.
-> END

// The girl, showing you the way (Day 3).
=== girl_guide ===
-> day3_girl_follow

=== back_routes_window ===
{ day3 == "sneak": -> day3_window }
{ day7 == "goodbyes": -> day7_friend_window }
A window into the back of your friend's house, high in the tunnel wall.
-> END

// Day 6: where the tunnel narrows, near the old chamber under the offering floor: listen to the elders.
=== back_routes_listen ===
{ day6 == "listen": -> day6_meeting }
The tunnel narrows here, then opens out into the old chamber under the offering floor.
-> END
