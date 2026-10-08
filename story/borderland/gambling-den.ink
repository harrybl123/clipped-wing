// ============================================================================
// Interactions in the gambling den (Chapter 2): one knot per interactable in
// src/data/areas/borderland/gamblingDen.ts. Draft text for the designer to rewrite.
// ============================================================================

=== gambling_den_game ===
The tokens are all the same: little parts cut from one bigger thing, nobody knows what.
They rattle like teeth when they're thrown.
-> END

=== gambling_den_play ===
Not with what you've got.
-> END

=== gambling_den_cage ===
The house keeps the stakes behind bars. It always gets its share.
-> END

=== gambling_den_debts ===
The debt wall. Every name that owes, and how much, in strokes.
A few are struck through. Paid, or gone.
-> END

// --- People (draft) ---

=== gambling_den_gambler ===
{ c2day5 == "town" && not saw_den: -> c2day5_den }
"I'm due. You get a feel for it, you know? I'm due." #speaker:gambler
"You couldn't spare a little something? Just until the next hand." #speaker:gambler
-> END
