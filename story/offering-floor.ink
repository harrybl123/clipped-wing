// ============================================================================
// TEMPORARY PLACEHOLDER — interactions on the offering floor.
// One knot per interactable/person in src/data/areas/offeringFloor.ts. All text is placeholder.
// ============================================================================

=== offering_floor_tender ===
{ day1 == "rite": -> day1_rite }
{ day2 == "rite": -> day2_rite }
{ day2 == "evening": -> day2_rejection }
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
{ day2 == "afternoon": {day2_thin_man: -> day2_already_visited | -> day2_thin_man} }
[PLACEHOLDER] "Portions are smaller again. Don't tell me you haven't noticed."
-> END

=== offering_floor_ascension_way ===
{ day1 == "ascension": -> day1_go_up }
[PLACEHOLDER] The tube rises up through the ceiling. On Ascension Day, the whole tree climbs to the gate.
-> END
