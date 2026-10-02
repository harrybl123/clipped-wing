// ============================================================================
// TEMPORARY PLACEHOLDER — interactions in the Tender's shrine.
// One knot per interactable/person in src/data/areas/tendersShrine.ts. All text is placeholder.
// ============================================================================

=== shrine_tender ===
[PLACEHOLDER] "Every offering counted, every blessing shared out fairly. Someone has to keep the tally." #speaker:tender
-> END

=== shrine_elder ===
[PLACEHOLDER] "The council is sitting, child. Wait outside." #speaker:elder_cyan
-> END

=== shrine_preacher ===
[PLACEHOLDER] "The Tree gives to those who give. Remember it." #speaker:preacher
-> END

=== shrine_tallies ===
[PLACEHOLDER] Boards of notches beside little pictures: every family's offerings, counted.
-> END

=== shrine_stool ===
[PLACEHOLDER] A single stool, alone under the lamp, facing the council's chairs.
-> END

=== shrine_blessing ===
[PLACEHOLDER] A blessing set into the wall in a carved frame. It glows like the tube, and nobody touches it.
-> END

// Day 4 morning: the Tender, waiting for you (the summons).
=== shrine_tender_summons ===
{ day5 == "shrine": -> day5_shrine }
{ day6 == "shrine": -> day6_shrine }
-> day4_shrine
