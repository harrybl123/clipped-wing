// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the protagonist's home.
// One knot per interactable in src/data/areas/home.ts. All text is placeholder.
// ============================================================================

=== home_mum ===
// The first time you talk to her (Day 1 morning, after the prologue), she asks how you are: your
// answer is the first dialogue-style choice (the designer moved it here from the prologue).
{ dialogue_style == "": -> how_are_you }
[PLACEHOLDER] "Off you go, love. Big day." #speaker:mum
-> END

= how_are_you
[PLACEHOLDER] "You're up. How are you feeling this morning?" #speaker:mum
+ [PLACEHOLDER: put on a brave face]
    ~ dialogue_style = "hide"
    [PLACEHOLDER] "Fine. Better than fine. It's Ascension Day." #speaker:you
+ [PLACEHOLDER: make a joke of it]
    ~ dialogue_style = "joke"
    [PLACEHOLDER] "Still got most of my fingers. Good start." #speaker:you
+ [PLACEHOLDER: say how you really feel]
    ~ dialogue_style = "voice"
    [PLACEHOLDER] "Tired. I keep dreaming about that day." #speaker:you
- [PLACEHOLDER] "Well. Eat something before you go." #speaker:mum
-> END

=== home_hearth ===
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
[PLACEHOLDER] Your bed. (Sleeping will end the day later.)
-> END

=== home_bench ===
[PLACEHOLDER] Your carving bench. A bird is half finished.
-> END

=== home_hiding_spot ===
[PLACEHOLDER] A loose board. Something could be hidden under here.
-> END

=== home_seat ===
[PLACEHOLDER] The old root seat by the candle. The cosiest spot in the house.
-> END

=== home_kitchen ===
[PLACEHOLDER] The kitchen corner. Chopped roots on the board.
-> END
