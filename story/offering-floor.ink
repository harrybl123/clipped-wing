// ============================================================================
// Interactions on the offering floor: one knot per interactable or person in src/data/areas/offeringFloor.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== offering_floor_tender ===
{ day1 == "rite": -> day1_rite }
{ day2 == "rite": -> day2_rite }
{ day2 == "evening": -> day2_rejection }
{ day3 == "rite": -> day3_rite }
{ day3 == "evening": -> day3_rejection }
{ day4 == "shrine": -> day4_not_here }
{ day4 == "evening": -> day4_tender_evening }
{ day5 == "evening": -> day4_tender_evening }
{ day6 == "evening": -> day4_tender_evening }
{ day6 == "shrine": -> day6_not_here }
{ today() >= 3:
    The Tender sees you, and looks away, back to the light.
- else:
    "Child of the roots. The Tree sees every hand that gives." #speaker:tender
    The Tender turns back to the light.
}
-> END

=== offering_floor_tube ===
The tube comes down through the ceiling into the carved basin. Nobody touches it. Nobody has ever touched it.
-> END

=== offering_floor_baskets ===
Baskets for the blessings that come down in the evening. {today() >= 4: Emptier every night.| Mostly empty.}
-> END

=== offering_floor_grumbler ===
// On Day 2 he's the thin man from the morning's outburst.
{ day2 == "afternoon": {day2_thin_man: -> day2_already_visited} {afternoon_with != "": -> day2_no_time} -> day2_thin_man }
-> thin_man

=== offering_floor_ascension_way ===
{ day1 == "ascension": -> day1_go_up }
The way up to the gate. On Ascension Day, the whole tree climbs it together.
-> END

=== offering_floor_girl_rite ===
{ day3 == "girl": -> day3_girl }
"Go on, then." #speaker:girl
-> END

// Talkable people in the crowd at the rites (src/data/areas/offeringFloor.ts).
=== offering_floor_crowd_mother ===
{ day6 == "evening": -> day6_crowd_mother }
{ day5 == "evening": -> day5_crowd_mother }
{ day4 == "evening": -> day4_crowd_mother }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_mother }
They're watching the tube, not you.
-> END

=== offering_floor_crowd_old_man ===
{ day6 == "evening": -> day6_crowd_old_man }
{ day5 == "evening": -> day5_crowd_old_man }
{ day4 == "evening": -> day4_crowd_old_man }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_old_man }
They're watching the tube, not you.
-> END

=== offering_floor_crowd_zealot ===
{ day6 == "evening": -> day6_crowd_zealot }
{ day5 == "evening": -> day5_crowd_zealot }
{ day4 == "evening": -> day4_crowd_zealot }
{ day3 == "rite" || day3 == "evening": -> day3_crowd_zealot }
They're watching the tube, not you.
-> END

// Day 4 evening: the chalk ring at the foot of the stairs.
=== offering_floor_chalk_ring ===
{ day4 == "evening": -> day4_ritual }
{ day5 == "evening": -> day5_ceremony }
{ day6 == "evening": -> day6_ceremony }
Chalk on the floor, scuffed by a hundred feet.
-> END
