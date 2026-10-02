// ============================================================================
// Interactions at the roots market: one knot per interactable or person in src/data/areas/rootsMarket.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

// The market turns on you as the week goes on (designer: it should get progressively worse): friendly
// on Days 1 and 2, wary after the first rejection, refusing on Day 4, hostile on Day 5, and after the
// riot on Day 6, ready to hit you. The fungus seller (lower roots stock) is the kindest, for longest.
=== market_food_seller ===
{ day6 == "market": -> day6_market }
{
- today() >= 6: She picks up her ladle like a club. "You've got some nerve, coming back here." #speaker:stew_seller
- today() == 5: "Get away from my pot! Nobody'll eat from it if the rot-hand's breathed on it." #speaker:stew_seller
- today() == 4: She puts the lid on the pot as you come near. "Not for you. Go on." #speaker:stew_seller
- today() == 3: "Stew? I... there's none left. Sorry." There's a full pot behind her. #speaker:stew_seller
- else: "Root stew! Hot root stew! Smaller bowls, same price, don't ask me why." #speaker:stew_seller
}
-> END

=== market_fungus_seller ===
{
- today() >= 6: He's packed up his crate before you even reach the stall.
- today() == 5: He won't look up. "I've a family, love. I'm sorry." #speaker:fungus_seller
- today() == 4: "Glowcaps? Take one. Go on." He presses it into your hand. "Just don't let them see me give it you." #speaker:fungus_seller
- today() == 3:
    "Heard about your bird, love. Don't listen to them." #speaker:fungus_seller
    He drops his voice. "But maybe don't stand at my stall too long." #speaker:fungus_seller
- else: "Glowcaps, fresh from the lower roots. Light your supper, love." #speaker:fungus_seller
}
-> END

=== market_cloth_seller ===
{
- today() >= 6: "Thief! Starving us all, and now you're after my stall?" #speaker:cloth_seller
- today() == 5: "Keep your rot-hands off the cloth! I'll have to burn anything you touch." #speaker:cloth_seller
- today() == 4: She drapes a sheet over her cloth as you pass, as if you might stain it.
- today() == 3: "Blessing cloth? For you?" She laughs, not kindly. "Wrap your bird in it. Maybe the Tree won't notice." #speaker:cloth_seller
- else: "Blessing cloth, straight down the tube. Well, near enough." #speaker:cloth_seller
}
-> END

=== market_curio_seller ===
{
- today() >= 6:
    He spits over the balcony rail. It only just misses you.
    -> END
- today() == 5:
    "Rot-hand. If anything on this table goes dark, I'll know who to blame." #speaker:curio_seller
    -> END
- today() == 4:
    "Don't touch. Don't even look." #speaker:curio_seller
    -> END
- today() == 3:
    "Glows on its own, this one. Like the Tree's watching." He pulls it out of your reach. "Nothing for you here." #speaker:curio_seller
    -> END
}
"Found that one in last week's blessings. Glows on its own. Nobody knows what it's for." #speaker:curio_seller
+ [Look closer]
    A cracked, smooth pane that glows cyan, like the tube. Something from up there. Something made.
+ [Leave it]
- -> END

// The thin man: he grumbled about the bowls before any bird came back. At first he's on your side; then he's hungry.
=== market_grumbler ===
-> thin_man

=== thin_man ===
{
- today() >= 6: "My wife fainted in the queue this morning. Because of you. Get away from me." #speaker:thin_man
- today() == 5: "I was wrong, you know. The bowls get thinner every time you're on that floor." #speaker:thin_man
- today() == 4: "Don't stand by me. They already think I'm trouble. The two of us together, they'll hang us both." #speaker:thin_man
- today() == 3:
    "They're saying it's you. That the Tree's punishing all of us for your bird." #speaker:thin_man
    "I said the bowls were thin before any bird came back. Nobody listens to me either." #speaker:thin_man
- else: "Portions are smaller again. Don't tell me you haven't noticed." #speaker:thin_man
}
-> END

=== market_ration_hatch ===
{ day6 == "tail": -> day6_tail_hatch }
{ day2 == "afternoon": {day2_ration: -> day2_already_visited | -> day2_ration} }
The ration hatch. The shutter is half down and the shelf behind it is thin.{today() >= 3: The woman behind it shuts it the rest of the way when she sees you.}
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
