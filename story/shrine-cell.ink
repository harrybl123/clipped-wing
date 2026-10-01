// ============================================================================
// The cell behind the shrine (Day 7, in custody): off the map. One knot per interactable/person in
// src/data/areas/shrineCell.ts. Draft text.
// ============================================================================

=== shrine_cell_guard ===
-> day7_guard

=== shrine_cell_bench ===
{ day7 == "carve": -> day7_bench }
{ day7 == "open": -> day7_open_bird }
A bench, scored with marks. Someone kept count of their days on it, once.
-> END

=== shrine_cell_door ===
Bolted, from the outside.
{
- day7 == "open" || day7 == "mob":
    The guard's on the other side. You can hear him breathing.
    "Don't. There's a hundred of them out there. You're safer in there than out here." #name:A guard
- day7 == "carve":
    "Try that again and I'll tie you to the bench." #name:A guard
- day7 == "evening":
    "Not yet. They'll come for you soon enough." #name:A guard
- else:
    "Nobody's going anywhere. Sit down." #name:A guard
}
-> END

=== shrine_cell_grate ===
A grate in the floor. Cold air comes up through it from the back routes. It's far too heavy to lift from this side.
-> END

=== shrine_cell_mum ===
-> day7_mum_cell

=== shrine_cell_archivist ===
-> day7_archivist_cell

=== shrine_cell_friend ===
-> day7_friend_cell
