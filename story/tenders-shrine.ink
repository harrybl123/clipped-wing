// ============================================================================
// Interactions in the Tender's shrine: one knot per interactable or person in src/data/areas/tendersShrine.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== shrine_tender ===
{ today() >= 4:
    "Not now, child." #speaker:tender
    -> END
}
"Every offering counted, every blessing shared out fairly. Someone has to keep the tally." #speaker:tender
-> END

=== shrine_elder ===
"The council is sitting, child. Wait outside." #speaker:elder_cyan
-> END

=== shrine_preacher ===
{ today() >= 3:
    "The Tree sees what you are, carver. So do I." #speaker:preacher
    -> END
}
"The Tree gives to those who give. Remember it." #speaker:preacher
-> END

=== shrine_tallies ===
Boards of notches beside little pictures: every family's offerings, counted. {today() >= 3: Beside your family's mark, a row of crosses.}
-> END

=== shrine_stool ===
A single stool, alone under the lamp, facing the council's chairs.
-> END

=== shrine_blessing ===
A blessing set into the wall in a carved frame. It glows like the tube, and nobody touches it.
-> END

// Day 4 morning: the Tender, waiting for you (the summons).
=== shrine_tender_summons ===
{ day5 == "shrine": -> day5_shrine }
{ day6 == "shrine": -> day6_shrine }
-> day4_shrine
