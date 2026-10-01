// ============================================================================
// TEMPORARY PLACEHOLDER — interactions on the offering floor.
// One knot per interactable/person in src/data/areas/offeringFloor.ts. All text is placeholder.
// ============================================================================

=== offering_floor_tender ===
{ day1 == "rite": -> day1_rite }
{ day2 == "rite": -> day2_rite }
{ day2 == "evening": -> day2_rejection }
{ day3 == "rite": -> day3_rite }
{ day3 == "evening": -> day3_rejection }
{ day4 == "shrine": -> day4_not_here }
{ day4 == "evening": -> day4_tender_evening }
[PLACEHOLDER] The Tender looks down from the landing. "Child of the roots." #speaker:tender
[PLACEHOLDER] "The Tree gives, and the Tree takes. What do you bring?" #speaker:tender
+ [Hide it: "Only my devotion."]
    [PLACEHOLDER] "Only my devotion." #speaker:you
+ [Joke about it: "Nothing that'll fit up there."]
    [PLACEHOLDER] "Nothing that'll fit up there." #speaker:you
+ [Voice it: "Where does it all go?"]
    [PLACEHOLDER] "Where does it all go?" #speaker:you
- [PLACEHOLDER] The Tender turns back to the light. #speaker:tender
-> END

=== offering_floor_tube ===
[PLACEHOLDER] The tube comes down through the ceiling into the carved basin. Nobody touches it.
-> END

=== offering_floor_baskets ===
[PLACEHOLDER] Baskets for the blessings that come down in the evening. Mostly empty.
-> END

=== offering_floor_grumbler ===
// On Day 2 he's the thin man from the morning's outburst.
{ day2 == "afternoon": {day2_thin_man: -> day2_already_visited} {afternoon_with != "": -> day2_no_time} -> day2_thin_man }
[PLACEHOLDER] "Portions are smaller again. Don't tell me you haven't noticed."
-> END

=== offering_floor_ascension_way ===
{ day1 == "ascension": -> day1_go_up }
[PLACEHOLDER] The tube rises up through the ceiling. On Ascension Day, the whole tree climbs to the gate.
-> END

=== offering_floor_girl_rite ===
{ day3 == "girl": -> day3_girl }
"Go on, then." #speaker:girl
-> END

// Talkable people in the crowd at the rites (src/data/areas/offeringFloor.ts).
=== offering_floor_crowd_mother ===
{ day4 == "evening": -> day4_crowd_mother }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_mother }
They're watching the tube, not you.
-> END

=== offering_floor_crowd_old_man ===
{ day4 == "evening": -> day4_crowd_old_man }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_old_man }
They're watching the tube, not you.
-> END

=== offering_floor_crowd_zealot ===
{ day4 == "evening": -> day4_crowd_zealot }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_zealot }
They're watching the tube, not you.
-> END

// Day 4 evening: the chalk ring at the foot of the stairs.
=== offering_floor_chalk_ring ===
{ day4 == "evening": -> day4_ritual }
Chalk on the floor, scuffed by a hundred feet.
-> END
