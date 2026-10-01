// ============================================================================
// TEMPORARY PLACEHOLDER — interactions at the roots market.
// One knot per interactable/person in src/data/areas/rootsMarket.ts. All text is placeholder.
// ============================================================================

=== market_food_seller ===
[PLACEHOLDER] "Root stew! Hot root stew! Smaller bowls, same price, don't ask me why."
-> END

=== market_fungus_seller ===
[PLACEHOLDER] "Glowcaps, fresh from the lower roots. Light your supper, love."
-> END

=== market_cloth_seller ===
[PLACEHOLDER] "Blessing cloth, straight down the tube. Well, near enough."
-> END

=== market_curio_seller ===
[PLACEHOLDER] "Found that one in last week's blessings. Glows on its own. Nobody knows what it's for."
+ [Look closer]
    [PLACEHOLDER] A cracked, smooth pane that glows cyan, like the tube.
+ [Leave it]
- -> END

=== market_grumbler ===
[PLACEHOLDER] "Portions are smaller again. Don't tell me you haven't noticed."
-> END

=== market_ration_hatch ===
{ day2 == "afternoon": {day2_ration: -> day2_already_visited | -> day2_ration} }
[PLACEHOLDER] The ration hatch. The shutter is half down and the shelf behind it is thin.
-> END
