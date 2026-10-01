// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the back routes.
// One knot per interactable in src/data/areas/backRoutes.ts. All text is placeholder.
// ============================================================================

=== back_routes_shrine_grate ===
[PLACEHOLDER] Warm light through a grate overhead. Above it, the Tender's shrine. Voices carry down.
-> END

=== back_routes_offering_grate ===
[PLACEHOLDER] The underside of the offering floor. The tube's glow falls through the grate in a cold column.
-> END

=== back_routes_broken_blessings ===
[PLACEHOLDER] Things nobody wanted, thrown down here: splinters, a bent coil, a cracked cell that barely glows.
-> END

=== back_routes_mark ===
[PLACEHOLDER] A mark in glowing fungus ink, painted by someone who knows the way.
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
