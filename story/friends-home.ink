// ============================================================================
// Interactions at your friend's home: one knot per interactable or person in src/data/areas/friendsHome.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== friends_home_friend ===
{ day1 == "friend": -> day1_friend }
{ day2 == "afternoon": {day2_friend: -> day2_already_visited} {afternoon_with != "": -> day2_no_time} -> day2_friend }
{ day1 == "ascension":
    "The Ascension! Go on, I'll see you up there. And don't forget the climb after." #speaker:friend
    -> END
}
"Did you see the lights last night? One day that'll be me going up." #speaker:friend
+ [You'd miss us.]
    "You'd miss us." #speaker:you
    "Not up there. Nobody's sad in the Canopy. And you'll be chosen too, one day. I know it." #speaker:friend
+ [Say nothing]
- -> END

=== friends_home_parent ===
{ day3 != "" && day3 != "done": -> day3_parent }
"He's upstairs. Wipe your feet, and mind the shrine." #speaker:friend_father
-> END

=== friends_home_shrine ===
The family shrine. A blessing sits in it, glowing cyan, never touched. They pray to it every night.
-> END

=== friends_home_store ===
Their store. Fuller than yours.
-> END

=== friends_home_drawings ===
Drawings pinned to the wall: the tube, someone rising up it, the Canopy. The someone has his hair.
-> END
