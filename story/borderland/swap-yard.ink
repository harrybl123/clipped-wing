// ============================================================================
// Interactions in the swap yard (Chapter 2): one knot per interactable in
// src/data/areas/borderland/swapYard.ts. Draft text for the designer to rewrite.
// ============================================================================

=== swap_yard_scrap ===
A table of finds, the bright ones nobody wanted. Glass, rings, a casing as smooth as an egg.
None of it is food.
-> END

=== swap_yard_food ===
{ c2day1 == "trade": -> c2day1_trade }
{ c2day7 == "yard" && not yard7_done: -> c2day7_yard }
Roots. Something dried. A pot of something hot, if you can pay.
You've nothing to trade yet.
-> END

=== swap_yard_scales ===
The scales. A bowl of food on one side, finds piled on the other until it tips.
It never tips your way.
-> END

=== swap_yard_pot ===
Something's cooking. It smells better than it is.
-> END

=== swap_yard_prices ===
The prices, in signs. A bowl: so many strokes of this, or that, or that.
More strokes than last time.
-> END

=== swap_yard_view ===
From up here you can see over the whole yard: every stall, every hand.
And past the roofs, the tree.
-> END

=== swap_yard_fence ===
The fence's corner, half behind a cloth. A lamp burning low inside.
The fence buys what nobody else will, and asks nothing.
-> END

// --- People (draft) ---

=== swap_yard_fencer ===
{ (c2day9 == "fields" || c2day9 == "dusk") && not fence9: -> c2day9_fence }
"Something special? I don't ask where. Nobody asks where. That's the whole trick of it." #speaker:fence
"The tallyman prices. I appreciate. Different trade." #speaker:fence
-> END

=== swap_yard_brother ===
{ c2day1 == "brother": -> c2day1_brother }
{ c2day4 == "tell": -> c2day4_tell }
{ c2day5 == "town" && not saw_brother: -> c2day5_brother }
"We're spying! The kid says that man's sold the same pot three times." #speaker:brother
"Don't tell anyone we were spying. Not even the kid. Wait, the kid knows." #speaker:brother
-> END

=== swap_yard_lookout ===
"I see everything from the crates. Everything." #speaker:lookout
"Your brother's slow, though. Tell him to keep up." #speaker:lookout
-> END

=== swap_yard_friend ===
"Fields again? Same. Walk with me some of the way?" #speaker:scav_friend
"Not tonight, though. I've got. Things." #speaker:scav_friend
-> END
