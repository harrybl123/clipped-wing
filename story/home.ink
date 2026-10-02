// ============================================================================
// Interactions in the protagonist's home: one knot per interactable or person in src/data/areas/home.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
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
- day3 == "wake": -> day3_mum_morning
- day3 == "carve" || day3 == "rite": -> day3_mum_go_on
- day3 == "open" || day3 == "hide" || day3 == "bed": -> day2_mum_asleep
- day4 == "wake": -> day4_summons
- day4 == "carve": -> day4_mum_go_on
- day4 == "open" || day4 == "bed": -> day2_mum_asleep
- day5 == "wake" || day5 == "carve" || day5 == "shrine": -> day5_mum_morning
- day5 == "escort": -> day5_mum_escort
- day6 == "wake" || day6 == "carve" || day6 == "shrine": -> day6_mum_morning
- day6 == "open" || day6 == "hide": -> day2_mum_asleep
- house_guarded && (day7 == "wake" || day7 == "carve" || day7 == "rite"): -> day7_mum_morning
- day7 == "goodbyes": -> day7_mum_goodbye
- day7 == "open" && house_guarded: -> day7_mum_night
- day5 != "" && day5 != "upper" && day5 != "evening" && day5 != "done": -> day2_mum_asleep
}
"Get some rest, love." #speaker:mum
-> END

=== home_hearth ===
{ day2 == "burn": -> day2_hearth }
{ day3 == "open": -> day3_open_bird }
{ day4 == "open" && mum_in_bed: -> day4_open_bird }
{ day5 == "open" && mum_in_bed: -> day5_open_bird }
{ day6 == "open" && mum_in_bed: -> day6_open_bird }
{ day7 == "open" && house_guarded: -> day7_open_bird }
The hearth. The fire is low.
-> END

=== home_food_store ===
{
- food_store <= 0: The food store. Empty. Not a crumb.
- food_store == 1: The food store. One jar left.
- food_store <= 3: The food store. {food_store} jars left. Mum's been counting them.
- else: The food store. {food_store} jars.
}
-> END

=== home_bed ===
{ day1 == "bed": -> day1_sleep }
{ day2 == "bed": -> day2_sleep }
{ day3 == "bed": -> day3_sleep }
{ day4 == "bed": -> day4_sleep }
{ day5 == "bed": -> day5_sleep }
{ day6 == "bed": -> day6_sleep }
Your bed. Not yet.
-> END

=== home_bench ===
{ day1 == "bench": -> day1_take_bird }
{ day2 == "bench": -> day2_take_bird }
{ day3 == "carve": -> day3_bench }
{ day4 == "carve": -> day4_bench }
{ day5 == "wake" || day5 == "carve": -> day5_bench }
{ day6 == "wake" || day6 == "carve": -> day6_bench }
{ house_guarded && (day7 == "wake" || day7 == "carve"): -> day7_bench }
Your carving bench. Shavings, and the knife, and Mum's old tools hung in a row.
-> END

=== home_hiding_spot ===
{ day2 == "hide": -> day2_hide_plate }
A loose board. Something could be hidden under here.
-> END

=== home_seat ===
The old root seat by the candle. Mum's spot. It's held the shape of her for years.
-> END

=== home_kitchen ===
The kitchen corner. Chopped roots on the board{today() >= 5:, fewer every day}.
-> END

// Day 4: the Tender's summons, pushed under the door (src/data/areas/home.ts).
=== home_summons ===
-> day4_summons

// Day 5 afternoon: the guard sent to take you up to the archivist.
=== home_escort ===
-> day5_escort

// Hiding the plate (Day 3: one of three things; Day 6: just the plate, before the guards break in).
=== home_hide_plate ===
{ day6 == "hide": -> day6_hide_plate }
-> day3_hide_plate

// Day 7 (you blamed the girl): the guard on your door. He walks you to the rite, and to the ceremony.
=== home_guard_door ===
-> day7_guard
