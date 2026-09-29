// ============================================================================
// TEMPORARY PLACEHOLDER STORY — technical setup only.
// Nothing in this file is real story content. Replace it wholesale when the
// designer supplies Day 1 / prologue text.
// ============================================================================

// Narrative state lives here, in ink, and nowhere else (see CLAUDE.md).
VAR suspicion = 0

// The game starts conversations by knot name via StoryBridge, so the root
// flow does nothing.
-> END

// Test conversation for the placeholder NPC in TestAreaScene.
// Sticky choices (+) so it can be repeated while testing.
=== test_conversation ===
[PLACEHOLDER] Hello. This is a test conversation.
[PLACEHOLDER] Suspicion is currently {suspicion}.
+ [Test choice A (raises suspicion)]
    ~ suspicion += 1
    [PLACEHOLDER] You picked A. Suspicion goes up by one.
+ [Test choice B (no change)]
    [PLACEHOLDER] You picked B. Nothing changes.
- [PLACEHOLDER] End of test conversation.
-> END
