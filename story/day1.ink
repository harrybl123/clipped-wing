// ============================================================================
// Day 1: Ascension Day. Draft text from docs/sequences/day-1.md, for the designer to rewrite.
// The day moves on through the stages in `day1` (main.ink); the area knots (home_mum, home_bench,
// offering_floor_tender, friends_home_friend, the trunk climb…) send you here at the right stage.
// Each stage sets the objective (what the red bird marker points at): objective_target is
// "<area id>:<person, object or door id>".
// Tags the areas act on: #time:<slot> · #show:/#hide:<person> · #move:<person>:<x>:<y> · #flash:<colour>
// · #inset:<id> · #lights:<x>:<top>:<bottom> · #goto:<area>[:<x>:<y>[:<knot>]] · #endday
// ============================================================================

// --- Morning, at home ---

=== day1_mum_morning ===
"You're up. How are you feeling this morning?" #speaker:mum
+ [Put on a brave face]
    ~ dialogue_style = "hide"
    "Fine. Better than fine. It's Ascension Day." #speaker:you
    "That's my good lamb." #speaker:mum
+ [Make a joke of it]
    ~ dialogue_style = "joke"
    "Still got most of my fingers. Good start." #speaker:you
    "Don't let the Tender hear you talk like that today." #speaker:mum
+ [Say how you really feel]
    ~ dialogue_style = "voice"
    "Tired. I dreamt about the bench again." #speaker:you
    "Oh, love. Not today. Today's a good day." #speaker:mum
- "A master goes up tonight. The whole tree will be watching." #speaker:mum
"Imagine being chosen. The Tree taking you up, right into the Canopy's light." #speaker:mum
"Do you think they're happy up there?" #speaker:you
"Happier than anyone's ever been. Now fetch your bird. We don't want to be last to the rite." #speaker:mum
~ day1 = "bench"
~ objective = "Fetch your bird from your bench"
~ objective_target = "home:bench"
-> END

=== day1_take_bird ===
Your bird for the rite. The best you could make. The left wing sits heavy, the way it always does.
+ [Take it]
    ~ day1 = "rite"
    ~ objective = "Take your bird to the morning rite"
    ~ objective_target = "offering-floor:tender"
    You tuck it carefully into your shirt.
+ [Leave it for now]
- -> END

=== day1_mum_go_on ===
"Go on, go on. I'll be right behind you." #speaker:mum
-> END

// --- The morning rite, on the offering floor ---

=== day1_rite ===
"Quickly now, quickly. The Tree doesn't wait." #speaker:tender
"The carver from the edge of the roots. Same bird as ever, I see." #speaker:tender
+ [The best I have, for the Tree.]
    "The best I have, for the Tree." #speaker:you
    "That's the spirit." #speaker:tender
+ [It's a classic. Why change it?]
    "It's a classic. Why change it?" #speaker:you
    "Hm. Not today, child." #speaker:tender
+ [Is it good enough?]
    "Is it good enough?" #speaker:you
    "It's not for me to say. The Tree decides." #speaker:tender
- The Tender lays your bird in the basket with the rest. The tube brightens, and the whole floor sighs. #flash:cyan
~ rite_done = true
~ day1 = "friend"
~ objective = "Find your friend"
~ objective_target = "friends-home:friend"
The crowd begins to drift away. The day is yours until the Ascension. #time:afternoon
-> END

// --- The afternoon ---

=== day1_friend ===
"There you are! Did you see how bright the tube was this morning?" #speaker:friend
"Tonight's master. Imagine it. Everything you've ever made, and the Tree says: yes, you. Come up." #speaker:friend
"One day that'll be me. I've been practising every night." #speaker:friend
+ [You'll be chosen. Anyone can see it.]
    "You'll be chosen. Anyone can see it." #speaker:you
    "You always say the right thing." #speaker:friend
+ [Can I have your room when you go?]
    "Can I have your room when you go?" #speaker:you
    "Ha! You'd only fill it with shavings." #speaker:friend
+ [Would you really want to go? And leave everyone?]
    "Would you really want to go? And leave everyone?" #speaker:you
    "...Of course. It's the Canopy. Who wouldn't?" #speaker:friend
- "Listen. After the Ascension, climb the trunk with me. From the lookout you can see the lights go all the way up." #speaker:friend
"Meet me on the climb. Don't be late." #speaker:friend
~ day1 = "ascension"
~ objective = "Go up to the Ascension"
~ objective_target = "offering-floor:ascension-way"
-> END

=== day1_mum_afternoon ===
"Did your bird go up? Good. Then the Tree has it now. Nothing more to worry about." #speaker:mum
-> END

=== day1_go_up ===
The whole tree is climbing to the gate, carrying lamps. Go up to the Ascension?
+ [Go up]
    ~ objective = ""
    ~ objective_target = ""
    You join the crowd on the long climb. #time:evening #goto:ascension-gate:104:300:day1_ascension
+ [Not yet]
- -> END

// --- The evening: the Ascension, at the gate ---

=== day1_ascension ===
The gate is packed. Lamps on every balcony, braziers burning on the dais.
"The Tree gives to those who give. And tonight, it asks for its finest." #name:The preacher
"A life of perfect work. Hands that never slipped. The Tree has seen, and it calls." #name:The preacher
The master comes through the crowd: old, calm, carrying one last carving. #show:master
They climb the steps to the dais. #move:master:216:204
As they pass, you see it. Cut into the carving: a spiral. #inset:spiral
"A spiral. Their mark. Every piece they ever made must carry it." #speaker:you
The master stands before the gate. #move:master:280:204
They step into the light. #hide:master #flash:white
The tube blazes. The crowd falls silent, then roars.
"Rise, and be blessed." #name:The preacher
~ day1 = "climb"
~ climb_tutorial = true
~ objective = "Climb the trunk to the lookout"
~ objective_target = "trunk-climb:lookout"
Later, the crowds drift home. Your friend will be waiting on the climb. #time:night #goto:tenders-shrine
-> END

=== day1_mum_climb ===
"Go on, then. Don't keep your friend waiting." #speaker:mum
-> END

// --- Night: the climb ---

=== day1_friend_on_climb ===
"You came! I've been here ages." #speaker:friend
"The lights start soon. Come on, race you to the top!" #speaker:friend
~ met_friend_climb = true
-> END

=== day1_lookout ===
"You made it! Look. There." #speaker:friend
Lights rise up the tube, one after another, climbing towards the Canopy. #lights:416:10:430
"Every one of those is a blessing for the master. They're up there now." #speaker:friend
+ [It's beautiful.]
    "It's beautiful." #speaker:you
    "Isn't it?" #speaker:friend
+ [Bit much for one old carver.]
    "Bit much for one old carver." #speaker:you
    "Don't. Not tonight." #speaker:friend
+ [Where do they actually go?]
    "Where do they actually go?" #speaker:you
    "Up. To the Canopy. Where else?" #speaker:friend
- "One day, it'll be me. You'll watch from here, and you'll wave." #speaker:friend
~ watched_lights = true
~ climb_tutorial = false
~ day1 = "home"
~ objective = "Go home"
~ objective_target = "home:mum"
-> END

// --- Home, late ---

=== day1_mum_blessing ===
"You're back. Look. It came down this evening, for your bird." #speaker:mum
A small bundle of food sits on the table: your blessing.
~ food_store += 1
"Small. But the Tree saw you. That's what matters." #speaker:mum
~ day1 = "bed"
~ objective = "Go to bed"
~ objective_target = "home:bed"
-> END

=== day1_sleep ===
Your bed. The lights are still rising behind your eyes.
+ [Sleep]
    ~ day1 = "done"
    ~ objective = ""
    ~ objective_target = ""
    You close your eyes. #endday
+ [Not yet]
- -> END
