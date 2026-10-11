// ============================================================================
// Interactions in your shack (Chapter 2): one knot per interactable in
// src/data/areas/borderland/shack.ts. Draft text for the designer to rewrite.
// ============================================================================

=== shack_kit ===
Your kit, by the door where you can grab it in the dark. A hook, a sack, a bar for prising.
-> END

=== shack_fire ===
The fire, in a casing cut down to a drum. It was something else once. Now it's this.
-> END

=== shack_table ===
The table was a hatch. The wheel still turns, if you want it to. Nothing opens.
-> END

=== shack_floor ===
{ c2day2 == "hide": -> c2day2_hide }
{ c2day10 == "dawn" && boss_visit10 && not boss_growled10: -> c2day10_call_dog }
{ c2day10 == "line" && not cairn10: -> c2day10_fetch_dog }
The loose panel in the floor. Underneath, a dry hollow, out of sight.
-> END

=== shack_drum ===
Water. Less than there should be.
-> END

=== shack_tally ===
The rations, scratched into the wall. One mark a day, five to a bundle.
-> END

=== shack_brothers_bed ===
Your brother's bed. He's left it made, more or less.
-> END

=== shack_collection ===
His collection, lined up smallest to biggest. He'll know if you move any of it.
The one on the end still glows a little at night. He calls it his light.
-> END

=== shack_bed ===
{ c2day2 == "night": -> c2day2_night }
{ c2day3 == "home": -> c2day3_bed }
{ c2day4 == "home": -> c2day4_bed }
{ c2day5 == "home": -> c2day5_bed }
{ c2day1 == "home": -> c2day1_bed }
{ c2day6 == "home": -> c2day6_bed }
{ c2day7 == "home" && ambush_done: -> c2day7_bed }
{ c2day8 == "home": -> c2day8_bed }
{ c2day10 != "" && c2day10 != "done": -> c2day10_not_now }
{ c2day7 == "home": -> c2day7_ambush_door }
Not yet.
-> END

// --- People (draft) ---

=== shack_brother ===
{ c2day2 == "wake": -> c2day2_brother }
{ c2day5 == "town" && not saw_brother: -> c2day5_brother }
{ c2day2 == "hide": -> c2day2_brother_evening }
{~"Did you find anything? Show me. Show me!"|"I counted the tally marks again. We've got more than last week. I think."|"Can I come out with you tomorrow? I'll be quiet. I'll be so quiet."} #speaker:brother
* [Not yet.]
    "You always say not yet." #speaker:brother
* [Maybe.]
    "Maybe means yes!" #speaker:brother
- -> END

=== shack_dog_bed ===
{dog_name}'s bed: sacking, a rag your brother gave up to it, a bowl cut from a casing. Pushed up close to the loose panel, so it can be down the hole the moment anyone knocks.
-> END

=== shack_brother_asleep ===
{ traded_light: Your brother, asleep with one arm hanging off the bed, his hand open where his light used to be. | Your brother, asleep with one arm hanging off the bed, holding the tin thing he found. }
-> END
