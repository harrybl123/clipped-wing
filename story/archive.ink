// ============================================================================
// Interactions in the archive: one knot per interactable or person in src/data/areas/archive.ts.
// Day-specific scenes divert to the day files; the rest is draft text for the designer to rewrite.
// ============================================================================

=== archive_archivist ===
{ day5 == "archive": -> day5_archive }
"Every one of the Ascended, recorded. Name, craft, the day the Tree took them up." #speaker:archivist
-> END

// Day 7 afternoon (at home under guard): a goodbye, if he's your ally.
=== archive_archivist_goodbye ===
-> day7_archivist_goodbye

=== archive_index_engine ===
A cabinet of drawers worked by a crank and a great gear. A glass eye glows over one of them, as if it knows which one you want.
-> END

=== archive_drawers ===
{ day5 == "steal": -> day5_theft }
Drawer after drawer of records. The writing means nothing to you, but here and there a maker's mark you almost know.
-> END

=== archive_records ===
A wall of plaques, one for each of the Ascended. You can't read the names. But every one of them carries the same mark: a spiral. So many of them. All chosen. All gone up.
-> END

=== archive_newest_record ===
The newest plaque, its wood still pale from the chisel. The same spiral as all the rest: the master you watched go up on Ascension Day.
-> END

// Day 5 night: he catches you at the drawers (the theft that fails).
=== archive_archivist_catch ===
"Go. Now." #speaker:archivist
-> END
