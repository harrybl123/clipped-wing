// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the protagonist's home.
// One knot per interactable in src/data/areas/home.ts. All text is placeholder.
// ============================================================================

=== home_mum ===
// What Mum says depends on how far Day 1 has got (story/day1.ink). The first time (Day 1 morning,
// after the prologue) she asks how you are: your first dialogue-style choice.
{
- dialogue_style == "": -> day1_mum_morning
- day1 == "bench" || day1 == "rite": -> day1_mum_go_on
- day1 == "friend" || day1 == "ascension": -> day1_mum_afternoon
- day1 == "climb": -> day1_mum_climb
- day1 == "home": -> day1_mum_blessing
- day2 == "wake": -> day2_mum_morning
- day2 == "bench" || day2 == "rite": -> day2_mum_go_on
- day2 == "afternoon": -> day2_mum_afternoon
- day2 == "burn" || day2 == "hide" || day2 == "bed": -> day2_mum_asleep
}
[PLACEHOLDER] "Get some rest, love." #speaker:mum
-> END

=== home_hearth ===
{ day2 == "burn": -> day2_hearth }
[PLACEHOLDER] The hearth. The fire is low.
-> END

=== home_food_store ===
[PLACEHOLDER] The food store. {food_store} jars left.
+ {food_store > 0} [TEST: take a jar (food -1)]
    ~ food_store -= 1
    [PLACEHOLDER] You take a jar. {food_store} left.
+ {food_store < 16} [TEST: put a jar back (food +1)]
    ~ food_store += 1
    [PLACEHOLDER] You put a jar back. {food_store} now.
+ [Leave it]
- -> END

=== home_bed ===
{ day1 == "bed": -> day1_sleep }
{ day2 == "bed": -> day2_sleep }
[PLACEHOLDER] Your bed. Not yet.
-> END

=== home_bench ===
{ day1 == "bench": -> day1_take_bird }
{ day2 == "bench": -> day2_take_bird }
[PLACEHOLDER] Your carving bench. A bird is half finished.
-> END

=== home_hiding_spot ===
{ day2 == "hide": -> day2_hide_plate }
[PLACEHOLDER] A loose board. Something could be hidden under here.
-> END

=== home_seat ===
[PLACEHOLDER] The old root seat by the candle. The cosiest spot in the house.
-> END

=== home_kitchen ===
[PLACEHOLDER] The kitchen corner. Chopped roots on the board.
-> END
