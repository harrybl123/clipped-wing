// ============================================================================
// TEMPORARY PLACEHOLDER — interactions at the roots market.
// One knot per interactable/person in src/data/areas/rootsMarket.ts. All text is placeholder.
// ============================================================================

=== market_food_seller ===
{ day6 == "market": -> day6_market }
[PLACEHOLDER] "Root stew! Hot root stew! Smaller bowls, same price, don't ask me why." #speaker:stew_seller
-> END

=== market_fungus_seller ===
[PLACEHOLDER] "Glowcaps, fresh from the lower roots. Light your supper, love." #speaker:fungus_seller
-> END

=== market_cloth_seller ===
[PLACEHOLDER] "Blessing cloth, straight down the tube. Well, near enough." #speaker:cloth_seller
-> END

=== market_curio_seller ===
[PLACEHOLDER] "Found that one in last week's blessings. Glows on its own. Nobody knows what it's for." #speaker:curio_seller
+ [Look closer]
    [PLACEHOLDER] A cracked, smooth pane that glows cyan, like the tube.
+ [Leave it]
- -> END

=== market_grumbler ===
[PLACEHOLDER] "Portions are smaller again. Don't tell me you haven't noticed." #speaker:thin_man
-> END

=== market_ration_hatch ===
{ day6 == "tail": -> day6_tail_hatch }
{ day2 == "afternoon": {day2_ration: -> day2_already_visited | -> day2_ration} }
[PLACEHOLDER] The ration hatch. The shutter is half down and the shelf behind it is thin.
-> END

// Day 4: Mum at the stew stall, and the girl under the balcony afterwards (src/data/areas/rootsMarket.ts).
=== market_mum ===
{ day4 == "market": -> day4_market }
"Not now, love." #speaker:mum
-> END

=== market_girl ===
{ day4 == "girl": -> day4_girl }
"Go on. Shoo." #speaker:girl
-> END
