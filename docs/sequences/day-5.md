# Sequence plan: Day 5, The Archivist

**2026-10-02, the seed grove (designer: the grove wasn't used in the story):** if you told the archivist, Night 5 now goes on from the archive to the seed grove. He says a seed forty years in a drawer may never wake: it should be a living one. He waits at the bridge, ready to keep the guard talking, while you sneak to the vault (the guard walks the beds with his lantern; you can't be seen crouched behind a bed (shadow `crouch`: low cover only hides you crouching) or up on the terrace, where he never looks; `watch` gained `see`, how far above him he looks). At the vault he calls the guard away, you find the mark together (the drawer puzzle, moved here), and he hands you a seed from the grove's first planting, then lets you out the archive's back way. Then made a set piece (designer: he stood awkwardly while the guard paced, and you could jump over him): you start crouched behind the first bed; the archivist calls the guard over and he walks right past you to the bridge; he stands with his back to the grove while the archivist keeps him talking (lines over their heads, `barks`), and you creep to the vault; now and then he glances back with a long look ("..." first; `watch` gained `start`, `face` and `glance`), and the archivist calls him round again. Jumping no longer gets you out of a watchman's light. Variables `in_grove`, `grove_sneak`. Dev: `?day=5&at=grove`. The theft (if you didn't tell him) stays in the archive.

Built 2026-10-01 (`story/day5.ink`; message 4 and the reply pictures in `src/data/messages.ts`). Dev: `?day=5`.

A plan for the designer to mark up before it's built. **(doc)** = design doc; **(designer)** = decided
in conversation; **(suggestion)** = Claude's proposal. Dialogue here is a sketch; the full draft comes
once the shape is agreed.

## What the design doc asks for
- Morning: you send your reply to message 3. **(doc)**
- Message 4 and "summoned upward". **(doc)** Message 4: "Clipped wing, send me new life that can't
  fly." The same words as message 1, but the picture is a seed with a sprout, by the upper
  branches. **(doc)**
- Night: the archive (with the archivist as an ally) or the heist (no ally); a healthy seed or a
  rotten one from the roots. **(doc)**
- Big choice 2: tell the archivist the truth, or pander. **(doc)** He's suspicious but never brave
  enough to act; "voice it" answers earn his trust. **(doc)**
- The upper halls brief: an escort brings you up for your first sight of the upper branches' wealth,
  and the archivist asks to meet you there. **(doc)**

## Decided in conversation
- The afternoon is the archivist meeting: you're summoned upward. **(designer)**
- Make it obvious that Grounded wants a seed. **(designer)**
- If you befriend the archivist, you tell him the message and he gives you a seed: he's always
  been suspicious about what's outside the tree. **(designer)**
- If you told him the truth, at night you choose: go back up to him, or down to the lower roots.
  If you didn't, you can only go to the lower roots. **(designer)**
- In the lower roots you ask the girl if she knows anyone; she takes you to a strange, cheeky,
  salesy boy (an Artful Dodger type), who sells you a seed. It's the seed that eventually grows rot
  (Chapter 2; noted in `docs/ideas.md`). **(designer)**
- The archivist sends for you himself. **(designer)** How (suggestion): through the Tender, the
  official channel. At dawn, with your offering, the Tender hands you a brass token stamped with the
  archive's mark ("The archivist wants you, this afternoon. I don't know why, and I don't like it");
  a guard checks it at the checkpoint and escorts you up. His reason: the first rejection in living
  memory has to go into the records. Partly true; underneath, he wants to know why.
- Your reply to message 3 (suggestion, accepted for now): "Who are you?", "Take me", "I'm being watched" (designer: the third changed from "I'm afraid", same picture).
  Message 4's words are fixed, so it only changes flavour. **(designer)**
- The boy hangs around the lower roots as someone you can meet and talk to; make him quite sleazy.
  **(designer)**
- Night: if you pandered, you go back up to steal a seed, and the theft fails; then the lower roots.
  If you told the truth, you choose: ask the archivist peacefully, or go down to the roots. **(designer)**
- The boy wants food for the seed. **(designer)**

## The shape of the day (suggestion)

| Time | Where | What happens | Objective shown |
| --- | --- | --- | --- |
| Morning | Home → Tender's shrine | Carve your reply to message 3 (three pictures again); take it to the Tender at dawn | "Answer Grounded" → "Take your offering to the shrine" |
| Afternoon | Home → middle tiers → upper halls | An escort comes for you; up through the checkpoint; the upper halls' wealth; the archivist (truth or pander) | "Go with the escort" → "Meet the archivist" |
| Evening | Offering floor | The fourth ceremony, in a new form; message 4 comes back | "Go to the evening ceremony" |
| Evening | Home | Decode message 4: a seed, by the upper branches | "Open the bird" |
| Night | Archive (if you told him) or lower roots | Get a seed | "Get a seed" |

## Beats (suggestion)

### 1. Morning: your reply to message 3
- The same as Day 4: pick a picture, scratch it, hollow and seal the bird; take it to the Tender at
  dawn (his new arrangement). A short, colder exchange than Day 4's.
- The reply's three pictures: **open question**.

### 2. Afternoon: summoned upward
- **Who sends for you:** the archivist himself. The first rejection in living memory has to go into
  the records, and he wants to see the carver it happened to. (Or the elders send you up to be
  recorded: **open question**.)
- **The escort:** a guard from the middle tiers comes to your door (the house is already watched).
  Through the checkpoint where roots folk are turned back; people on the stair-street stare.
- **The upper halls:** the Canopy's light through skylights, the feast while the roots go hungry,
  the masterwork carving (height is skill). Your first sight of how the other end of the tree lives.
- **The archivist:** suspicious, precise, and curious. He shows you your family's record (your
  mother's marks, your own), and asks about the rejection. Underneath, he has always wondered about
  what's beyond the bark, and has never dared to say so.
- **Big choice 2:** tell him about the messages (show him the plate, or describe the pictures), or
  pander (perform devotion, blame yourself, say nothing of the plates). Style choices along the way
  build or lose his trust ("voice it" earns it).

### 3. Evening: the ceremony and message 4
- The ceremony changes form again (it's ritual on Day 4). Suggestion: **the escort** stays with you
  on the floor, a guard at your shoulder, as if you were already accused.
- Message 4: decoding is quick (most of it's in your glossary), and the new picture is a **seed with
  a sprout, by the upper branches**: "send me new life" now clearly means a seed, and where to find
  one. Your reaction: curious and afraid ("Why a seed? What would he grow out there?").

### 4. Night: getting a seed
- **If you told him the truth,** you choose:
  - **Up to the archivist** (through the trunk climb's back hatch to the archive, the only unguarded
    way in): he's waiting, frightened and excited. A short search in the records with him (the index
    engine), and he gives you a healthy seed from the seed grove's store. He makes you promise to tell
    him what happens.
  - **Down to the lower roots:** as below.
- **If you pandered,** only the lower roots: the girl ("You want a what? Up there? ... I might know
  someone"), and the boy, who sells you a seed for whatever you've got left (food? a carving?). It
  looks fine. It isn't.
- Then home, and the seed goes into tomorrow's bird (Day 6: "the seed and pointing hands").

## Open questions
None for now: all answered (above).
