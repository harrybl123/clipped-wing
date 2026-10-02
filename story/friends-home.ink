// ============================================================================
// TEMPORARY PLACEHOLDER — interactions at your friend's home.
// One knot per interactable/person in src/data/areas/friendsHome.ts. All text is placeholder.
// ============================================================================

=== friends_home_friend ===
{ day1 == "friend": -> day1_friend }
{ day2 == "afternoon": {day2_friend: -> day2_already_visited} {afternoon_with != "": -> day2_no_time} -> day2_friend }
[PLACEHOLDER] "Did you see the lights last night? One day that'll be me going up." #speaker:friend
+ [Tease them]
    [PLACEHOLDER] "You'd miss us." #speaker:you
    [PLACEHOLDER] "Not up there. Nobody's sad in the Canopy. And you'd follow me one day." #speaker:friend
+ [Say nothing]
- -> END

=== friends_home_parent ===
{ day3 != "" && day3 != "done": -> day3_parent }
[PLACEHOLDER] "They're upstairs. Wipe your feet, and mind the shrine." #speaker:friend_father
-> END

=== friends_home_shrine ===
[PLACEHOLDER] The family shrine. A blessing sits in it, glowing cyan, never touched.
-> END

=== friends_home_store ===
[PLACEHOLDER] Their store. Fuller than yours.
-> END

=== friends_home_drawings ===
[PLACEHOLDER] Drawings pinned to the wall: the tube, someone rising up it, the Canopy.
-> END
