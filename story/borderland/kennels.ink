// ============================================================================
// The kennels (Chapter 2; Jack's idea, for Harry to confirm): one knot per
// interactable in src/data/areas/borderland/kennels.ts. Draft text for the
// designer to rewrite.
// ============================================================================

=== kennels_cages ===
Cages of scrap, something sick in every one. They throw themselves at the bars as you pass, frothing.
Nobody has dogs. So this is what guards things now.
-> END

=== kennels_gate ===
The gate to the end pen. Three of them behind it, worse than the rest, and behind them a wooden box, nailed shut.
The chain's hanging loose. The padlock's open.
* [Go in.]
    You lift the latch. #sound:latch #through:482:236
    -> END
* [Leave it.]
    -> END

// --- The strange man (Jack): he falls out of the sky onto the small cage, and
// breaks his back. His words are Jack's.

VAR stranger_fell = false

=== kennels_stranger_falls ===
~ stranger_fell = true
A shadow, overhead. Something big, coming down fast. #fall:stranger:202:208
"Oof!" #speaker:stranger
"Damn!" #speaker:stranger
He rolls off the cage and into the dirt, and lies there writhing. #hop:stranger:246:236 #aside:1400
-> END

=== kennels_stranger ===
He's flat on his back in the dirt, writhing.
* [What are you doing?]
    "Just came to check up on you." #speaker:stranger
    "I'm your father." #speaker:stranger #name:Your father #ending:father
    -> END
* [Leave him.]
    -> END
