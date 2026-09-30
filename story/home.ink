// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the protagonist's home.
// One knot per interactable in src/data/areas/home.ts. All text is placeholder.
// ============================================================================

=== home_mum ===
[PLACEHOLDER] Mum: Hello, love. This is a test conversation.
[PLACEHOLDER] Suspicion is currently {suspicion}.
+ [Test choice A (raises suspicion)]
    ~ suspicion += 1
    [PLACEHOLDER] You picked A. Suspicion goes up by one.
+ [Test choice B (no change)]
    [PLACEHOLDER] You picked B. Nothing changes.
- -> END

=== home_door ===
[PLACEHOLDER] The door out to the roots. (The map isn't built yet.)
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
