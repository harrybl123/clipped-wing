// ============================================================================
// Interactions in the scrap stacks (Chapter 2): one knot per interactable in
// src/data/areas/borderland/scrapStacks.ts. Draft text for the designer to rewrite.
// ============================================================================

=== scrap_stacks_view ===
From up here: every roof in the settlement, the boss's compound on its rise, the plain going out grey.
And the tree, bigger than all of it.
-> END

=== scrap_stacks_tube ===
A tube on a stand, to look through. Somebody's lookout.
Through it, the tree's pipes come close enough to count.
-> END

=== scrap_stacks_stacks ===
Junk, crushed and stacked higher than anyone remembers stacking it. It shifts in the wind.
-> END

// --- People (draft) ---

=== scrap_stacks_old_scav ===
{ c2day2 == "ask": -> c2day2_old_scav }
{ c2day5 == "town" && not saw_old: -> c2day5_old }
"Mind where you climb. The stacks shift." #speaker:old_scav
"Don't look at me like that. I've been at this since before you could walk." #speaker:old_scav
-> END

=== scrap_stacks_lookout ===
"You found my spot. Don't tell anyone. You can see the whole town from here, and they can't see you." #speaker:lookout
-> END
