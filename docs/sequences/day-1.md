# Sequence plan: Day 1, Ascension Day

Built 2026-09-30 (`story/day1.ink`; the areas' knots route into it by the `day1` stage). Planned with the designer first. **(doc)** = design doc; **(designer)** = decided
in conversation; **(suggestion)** = Claude's proposal. All dialogue below is a **first draft** for the
designer to rewrite; it keeps to the tree's faith and never hints at the truth.

## What the design doc asks for
- Pure setup: talk to people, watch things unfold. **(doc)**
- Mum is proud and devout; your friend dreams of being chosen; the Tender is busy with the rites; the
  girl in the roots watches from the edges; someone at the market grumbles that portions are
  smaller. **(doc)**
- Your offering: your usual bird. It earns a small blessing. **(doc)**
- Evening: the Ascension. A celebrated master is given to the tube; you notice their spiral. **(doc)**
  (The spiral returns in message 6: it's the master's mark, and it hints the Ascended are alive.)
- Night: the climb up the trunk to watch the Ascension lights; the platformer tutorial. **(doc)**

## Decided in conversation
- Day 1 is built around both ceremonies: the morning rite and the evening Ascension. **(designer)**
- A red bird marker shows where to go next. **(designer)** (Red is reserved for birds, so it fits.)
- Don't open up every area at once: keep some back for suspense. **(designer)** This changes the doc's
  "visit everyone on Day 1".
- Everyone who wants to watch an Ascension goes up to the gate; the girl in the lower roots can't be
  bothered, so she isn't there. **(designer)**
- You meet your friend on the way up the trunk, and they're at the lookout when you get there.
  **(designer)**
- The spiral is carved into the master's last piece, the carving they carry into the gate (their
  maker's mark; message 6 echoes it). Your bird goes up at the Day 1 morning rite. **(left to Claude)**

## The shape of the day (suggestion)

| Time | Where | What happens | Objective shown |
| --- | --- | --- | --- |
| Morning | Home | Wake in the loft; Mum asks how you are (first style choice); fetch your bird from your bench | "Talk to Mum" → "Fetch your bird from your bench" → "Take your bird to the morning rite" |
| Morning | Offering floor | The rite: the Tender takes the offerings; you glimpse the girl watching from an archway | "Give your bird to the Tender" |
| Afternoon | Roots (free) | Your friend's home (they dream of being chosen, and ask you to climb with them tonight); the market (the grumbler); Mum | "Find your friend" (the market and home are optional) |
| Evening | Ascension gate | Everyone goes up for the Ascension (Ascension Day is the one day roots-dwellers may climb to the gate); the master is given to the tube; you notice the spiral | "Go up to the Ascension" |
| Night | Shrine → trunk climb | The climb (tutorial); your friend is waiting at the lookout; the Ascension lights rise up the tube | "Climb the trunk to the lookout" |
| Night | Home | Mum shows you the small blessing that came down for your bird; sleep | "Go home to bed" |

**What's held back on Day 1 (suggestion):** the back routes, the lower roots (you see the girl, but not
where she lives), the archive and the seed grove stay dark on the map. The middle tiers and upper halls
are only passed through in a fade on the way to the Ascension, not explored, so their first real visit
is still the Day 5 escort.

## The red bird marker (suggestion)
- A small red carved bird hovers and bobs over the next place to go: a person, an object, or a door.
- A short line at the top of the screen says the objective in words.
- On the map, the same red bird sits on the area you need.
- The objective lives in ink (a variable), so the story decides it, not the code.

---

## Draft dialogue

Speakers: **Mum** (proud, devout, warm), **You** (the three styles when there's a choice: *hide* =
brave face and devotion, *joke* = wry deflection, *voice* = blunt, sincere questions), **Friend**
(devout, dreamy), **Tender** (busy, formal, kind enough), **Grumbler**, **Girl** (edgy, dismissive,
flirty), **Preacher**.

### 1. Waking (home, loft)
Card: *Day 1: Ascension Day.* You wake in the loft. Marker over Mum.

### 2. Mum (home, ground floor): the first style choice
> **Mum:** You're up. How are you feeling this morning?
> - *Hide:* **You:** Fine. Better than fine. It's Ascension Day.
> - *Joke:* **You:** Still got most of my fingers. Good start.
> - *Voice:* **You:** Tired. I dreamt about the bench again.
>
> **Mum:** *(hide)* That's my good lamb. *(joke)* Don't let the Tender hear you talk like that today. *(voice)* Oh, love. Not today. Today's a good day.
> **Mum:** A master goes up tonight. The whole tree will be watching.
> **Mum:** Imagine being chosen. The Tree taking you up, right into the Canopy's light.
> **You:** Do you think they're happy up there?
> **Mum:** Happier than anyone's ever been. Now fetch your bird. We don't want to be last to the rite.

Objective: *Fetch your bird from your bench.* Marker over the bench in the loft.

### 3. Your bench (home, loft)
> Your bird for the rite. The best you could make. The left wing sits heavy, the way it always does.
> - *[Take it]* Objective: *Take your bird to the morning rite.* Marker over the door.

(If you talk to Mum again:)
> **Mum:** Go on, go on. I'll be right behind you.

### 4. The morning rite (offering floor)
A crowd; the Tender on the landing under the tube. Marker over the Tender.
> **Tender:** Quickly now, quickly. The Tree doesn't wait. *(takes your bird)*
> **Tender:** The carver from the edge of the roots. Same bird as ever, I see.
> - *Hide:* **You:** The best I have, for the Tree.
> - *Joke:* **You:** It's a classic. Why change it?
> - *Voice:* **You:** Is it good enough?
>
> **Tender:** *(hide)* That's the spirit. *(joke)* Hm. Not today, child. *(voice)* It's not for me to say. The Tree decides.
> *(The offerings go up: the tube brightens and the crowd sighs.)*

The girl stands in an archway at the edge of the crowd, watching you, not the tube. If you walk
towards her, she's gone. (If you talk to her before she goes:)
> **Girl:** Don't look so worried. It's only a bird.

Then the time moves on to the afternoon. Objective: *Find your friend.* Marker over your friend's home.

### 5. Afternoon: your friend (friend's home, upstairs)
> **Friend:** There you are! Did you see how bright the tube was this morning?
> **Friend:** Tonight's master. Imagine it. Everything you've ever made, and the Tree says: yes, you. Come up.
> **Friend:** One day that'll be me. I've been practising every night.
> - *Hide:* **You:** You'll be chosen. Anyone can see it.
> - *Joke:* **You:** Can I have your room when you go?
> - *Voice:* **You:** Would you really want to go? And leave everyone?
>
> **Friend:** *(hide)* You always say the right thing. *(joke)* Ha! You'd only fill it with shavings. *(voice)* ...Of course. It's the Canopy. Who wouldn't?
> **Friend:** Listen. After the Ascension, climb the trunk with me. From the lookout you can see the lights go all the way up.
> **Friend:** Meet me at the top. Don't be late.

Objective: *Go up to the Ascension* (once the evening comes). Until then you're free:

**The market (optional):**
> **Grumbler:** Portions are smaller again. Don't tell me you haven't noticed.
> **Grumbler:** Ascension Day and my bowl's half empty. Some celebration.

**Your friend's parent (optional):**
> **Parent:** Up the stairs, they're expecting you. Mind the shrine.

**Mum (optional):**
> **Mum:** Did your bird go up? Good. Then the Tree has it now. Nothing more to worry about.

When you're ready, the offering floor's stairs up towards the tube are marked: *Go up to the Ascension.*

### 6. Evening: the Ascension (Ascension gate)
A fade: the whole tree climbing, carrying lamps. You arrive at the gate among a crowd on the
balconies and the floor. The preacher on the dais; braziers; the gate glowing.
> **Preacher:** The Tree gives to those who give. And tonight, it asks for its finest.
> **Preacher:** A life of perfect work. Hands that never slipped. The Tree has seen, and it calls.
> *(The master climbs the stairs to the dais: old, calm, carrying one last carving.)*
> *(As they pass, you see it: carved into the piece, and stitched on their sleeve, a spiral.)*
> **You** *(thought)*: A spiral. Their mark. Every piece they ever made carried it.
> *(The master steps into the gate. Light floods the tube. The crowd goes silent, then roars.)*
> **Preacher:** Rise, and be blessed.

A fade to night. Objective: *Climb the trunk to the lookout.* Marker on the Tender's shrine (the
way to the trunk climb is through it, and it's empty at night).

### 7. Night: the climb (trunk climb)
The tutorial. Short hints appear at the right moments (*Space to jump*, *down to drop through*,
*hold on to the rope*). The weak grip is still to be designed. **(open)**

At the lookout, your friend is waiting.
> **Friend:** You made it! Look. There.
> *(Lights rise up the tube, one after another, climbing towards the Canopy.)*
> **Friend:** Every one of those is a blessing for them. For the master. They're up there now.
> - *Hide:* **You:** It's beautiful.
> - *Joke:* **You:** Bit much for one old carver.
> - *Voice:* **You:** Where do they actually go?
>
> **Friend:** *(hide)* Isn't it? *(joke)* Don't. Not tonight. *(voice)* Up. To the Canopy. Where else?
> **Friend:** One day, it'll be me. You'll watch from here, and you'll wave.

Objective: *Go home to bed.*

### 8. Home, late
> **Mum:** You're back. Look. It came down this evening, for your bird.
> *(A small blessing: a little bundle of food on the table.)*
> **Mum:** Small. But the Tree saw you. That's what matters.
> - *[Go to bed]* The day ends.

---

## What building this needs (suggestion)
- **Objectives in ink:** a variable holds the current objective (text and target); the game shows the
  line at the top and the red bird over the target (a person, object or door id), and on the map.
- **Story-driven time:** ink moves the day on (e.g. a tag after the rite: morning → afternoon), rather
  than the debug keys.
- **Areas held back:** the map shows unvisited or locked areas dark; doors to them say you can't go
  yet (and why, in a line).
- **Two short scripted scenes:** the morning rite (offerings rising) and the Ascension (the master's
  walk, the spiral, the gate), using the same ink-tag approach as the prologue.
- **Day-specific people:** the crowds, the girl in the archway, your friend at the lookout at night.

## Open questions
- The weak grip in the climb: what does it do? (Later.)
- Day 2 onwards.
