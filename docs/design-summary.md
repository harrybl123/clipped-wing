# Clipped Wing — design summary (Act 1)

This is a condensed version of the full design doc, written as build context. When in doubt, ask the designer rather than filling gaps.

## The world

- **The tree** is vast. Its people live inside the trunk in a hierarchy of craft skill: the best makers live high in the warm upper branches; the least skilled live in the dark, crowded roots. Writing belongs to high society; roots-dwellers can't read.
- **The tube** is a glowing channel running up the middle of the trunk. Offerings go up at a **morning rite**; blessings (food, cloth, light) and rejections come down at an **evening ceremony**. The exchange is holy: nobody inspects an offering once given.
- **Rejection is unheard of.** A rejected piece is unclean; nobody touches or opens it, and it goes straight back to its shamed maker.
- **The Ascension:** the finest makers are given to the tube in a sacred ceremony at the **Ascension gate**, high on the tube. Everyone believes it's a holy sacrifice.
- **Blessings are shrinking** all week, getting visibly worse, before and after the protagonist's first rejection.
- **Technological gifts:** people believe a god sends them technological gifts down the tube. The higher up the tree, the more technology you see; the roots are mainly natural, with scavenged odd bits here and there that found their way back down.
- **The Canopy** at the top is blinding white. In Act 1 nothing up there can be seen.
- Hidden truths (not shown directly in Act 1): the outside is a barren, technological world; the Ascended are captured, not sacrificed; the tree is rotting.

## The protagonist

- A woodcarver, an only child living with their mum in the roots. Lost a thumb in a childhood carving accident, so every bird they carve has the same flaw: a heavy, clipped wing.
- Naturally doubtful. Dialogue offers three styles throughout: **hide it** (perform devotion; lowers suspicion), **joke about it** (wry deflection), **voice it** (blunt questions; raises suspicion, earns trust from the girl and the archivist).

## The outsider: Grounded

A stranger outside the tree who rejects the protagonist's birds and hides picture messages inside them. Secretly one of the Ascended (revealed in Act 2). He calls the protagonist **"clipped wing"**. His messages are detailed pictures with an impossible precision, in the tree's style.

## Cast

| Character | Role |
| --- | --- |
| You, the carver | The player |
| Mum | The personal stake; shares your home and your blessings |
| Your friend | Closest friend; devout; their family forbids them from seeing you |
| The Tender | Collects offerings in the roots; face of the rules and suspicion |
| The archivist | Upper-branch keeper of the Ascension records; suspicious but never brave enough to act |
| The girl in the roots | Your age; lives deep in the lower roots; refuses to conform; your comfort; shows you back routes |
| Grounded | Only ever messages |

## Structure: one week

Each day: **morning** (choose your offering: a proper bird or a message bird), **afternoon** (move around the tree; two visits, except Day 1 when you can visit everyone), **evening** (the descent ceremony, then home with Mum and decoding), **night** (a unique set piece).

| Day | Focus | Morning: you send | Evening: comes down | Night set piece |
| --- | --- | --- | --- | --- |
| Prologue | The slip | — | — | Losing the thumb; first dialogue-style choice |
| 1 | Ascension Day (setup) | Your usual bird | A small blessing; the Ascension | The climb (platformer tutorial) |
| 2 | The rejection | Your usual bird | Rejected: message 1 | The fire, then the first decoding |
| 3 | Your friend | The fledgling (or usual bird) | Message 2 | The visit (hide the evidence; confide or lie) |
| 4 | The girl in the roots | Reply to message 2 | Message 3 and a feather | Stealth through the lower roots to the girl's home |
| 5 | The archivist | Reply to message 3 | Message 4; summoned upward | The archive (ally) or the heist (no ally) |
| 6 | Scapegoat | The seed and pointing hands | Message 5 in a bitten bird | The interrogation |
| 7 | The mob | Your bird in a cage | Message 6 | The escape: tube chase or roots crawl |

**Big choices:** 1) reply to message 1 or ignore it (ignoring twice gives a short loyal ending); 2) tell the archivist the truth or pander; 3) the ending: jump into the tube (Act 1 ends as you rise) or refuse and be cast into the lower roots (Act 1 ends as natural light breaks in).

**Tracked state:** suspicion, friend's trust, the girl, archivist ally, Mum, Grounded's trust, the seed, dialogue style, food store.

## Grounded's messages

| # | Words (as read aloud once decoded) | Notes |
| --- | --- | --- |
| 1 | "I see you, clipped wing. Send me new life that can't fly." | Eye, clipped-wing bird, clipped-wing fledgling |
| 2 | "Clipped wing, I rest beyond the bark. Would you like to fly?" | Tree seen from outside; bird on an outer branch |
| 3 | "[Not yet / Neither can I / Because I have watched you carve]. I am Grounded. There are many of us beyond the bark." | His symbol (bird on bare ground); a real feather |
| 4 | "Clipped wing, send me new life that can't fly." | Same words as message 1, but a seed with a sprout by the upper branches |
| 5 | "[New life lives / New life sleeps. The rot is deep / No new life]. Clipped wing, stay alive. You are not the rot. We need you. Hurry." | Arrives bitten at the public ceremony |
| 6 | "Clipped wing, make yourself a martyr. Fly or fall, I will find you." | Bird rising up the tube among eyes; two paths out; the master's spiral carving |

## Core systems to build

1. **Calendar:** days and time slots (morning, afternoon, evening, night), limited afternoon actions.
2. **Map:** a zoomed-out cross-section of the tree to pick destinations; zoomed-in side-on area scenes.
3. **Areas:** side-view scenes the player walks, climbs and sneaks through (platformer engine).
4. **Dialogue:** ink-driven conversations with choices, portraits and the three dialogue styles.
5. **Decoding:** click a symbol in a message and type what it means; each symbol accepts a list of words; nudges after wrong guesses, then hints, then auto-solve; solved symbols go into a glossary in the player's own words; the full line is read aloud when complete.
6. **Offerings:** the morning choice and the evening ceremony outcome.
7. **Food store:** shrinks nightly; visible at home.
8. **Night set pieces:** built on the platformer engine (climb, stealth, heist, escape) or the dialogue engine (visit, interrogation), plus small one-offs (the fire).
9. **Save/load:** localStorage.

## Map: 12 areas

- **Roots:** your home, the offering floor (base of the tube), the roots market, your friend's home, the Tender's shrine, the back routes (hidden crawlways), the lower roots (the girl's home).
- **Trunk:** the trunk climb, the middle tiers.
- **Upper branches:** the upper halls, the archive, the seed grove.
- **The tube:** the Ascension gate (Day 1 rite, Day 7 jump). The Canopy is visible but unreachable.

## Art direction

2D, side-on pixel art at 480×270 (references: Kingdom Two Crowns, Owlboy, Eastward, Hyper Light Drifter; Planet of Lana and Creaks still hold for mood). A tight palette of the six key colours and their shades, with dithered light. A carved world; light tells you where you are (cyan tube, amber lamps, green lower roots); red is reserved for birds and the protagonist; small dark figures; the Canopy is pure white. Detail lives in the backgrounds; motion stays simple; glow, fog and particles are done in code. See the palette in CLAUDE.md.
