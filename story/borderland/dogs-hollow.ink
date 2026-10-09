// ============================================================================
// Interactions in the dog's hollow (Chapter 2): one knot per interactable in
// src/data/areas/borderland/dogsHollow.ts. Draft text for the designer to rewrite.
// ============================================================================

=== dogs_hollow_bed ===
Sacking and a blanket, in the slab's shadow. Out of the wind. Out of sight.
-> END

=== dogs_hollow_train ===
Bury a find. Walk away. See if it can be found again.
-> END

=== dogs_hollow_rim ===
From the rim you can see anyone coming a long way off. Nobody is.
-> END

// --- People (draft) ---

=== dogs_hollow_dog ===
{ c2day8 == "hollow": -> c2day8_hollow }
{ c2day2 == "hollow": -> c2day2_hollow }
-> dog_pet

// Petting the dog, wherever it is (designer: a cute noise).
=== dog_pet ===
{~You scratch behind its ears, and its back leg goes, thump thump thump.|It rolls over for its belly. You oblige.|It leans its whole weight against your leg, and sighs.|You rub its head. It shoves its nose into your hand for more.}
{~"Yip!"|"Huff huff!"|"Yip yip!"|"Mrrrf."} #speaker:dog
-> END

