// ============================================================================
// Interactions in the brothel (Chapter 2): one knot per interactable in
// src/data/areas/borderland/brothel.ts. Draft text for the designer to rewrite.
// ============================================================================

=== brothel_seat ===
The madam's chair, padded, high-backed, facing the door. Nobody comes in without being seen.
-> END

=== brothel_ledger ===
The ledger. Marks, rows of them, in a hand you can't read.
It's closed before you can look closer.
-> END

=== brothel_couch ===
The softest thing in the settlement. You don't sit.
-> END

=== brothel_doors ===
Curtains. Low voices behind them. Not your business.
-> END

// --- People (draft) ---

=== brothel_madam ===
{ c2day5 == "town" && not saw_brothel: -> c2day5_brothel }
{ c2day8 == "brothel" && not saw_madam8: -> c2day8_madam }
"Visiting, or working? You don't look like either." #speaker:madam
"Everything said in this house stays in this house. Mostly." #speaker:madam
-> END

=== brothel_hostess ===
{ c2day5 == "town": -> c2day5_hostess }
"Well. You're not our usual sort." #speaker:hostess
"Sit a while, if you like. Talking's free. Everything else, ask her at the desk." #speaker:hostess
-> END
