// ============================================================================
// Day 2: the rejection. Draft text from docs/sequences/day-2.md, for the designer to rewrite.
// The day moves on through the stages in `day2` (main.ink); the area knots send you here at the right
// stage. Afternoon visits (your friend, the ration hatch, Mum, the thin man) each end in
// day2_visit_done, which counts them down; after two, the evening comes.
// Extra tags: #shake (the screen shakes) · #recoil (the crowd steps back from you)
// · #decode:<message>:<knot> (after the conversation, the decoding screen; then <knot> plays)
// · #endday:<card> (the day ends, with that card on the next morning)
// ============================================================================

// --- Morning, at home ---

=== day2_mum_morning ===
"Up you get. Same as every day: the rite first, then whatever the day brings." #speaker:mum
~ day2 = "bench"
~ objective = "Fetch your bird from your bench"
~ objective_target = "home:bench"
-> END

=== day2_take_bird ===
Your bird for the rite. The same as ever, the left wing a little heavy.
+ [Take it]
    ~ day2 = "rite"
    ~ objective = "Take your bird to the morning rite"
    ~ objective_target = "offering-floor:tender"
    You tuck it carefully into your shirt.
+ [Leave it for now]
- -> END

=== day2_mum_go_on ===
"Go on. Don't keep the Tender waiting." #speaker:mum
-> END

// --- The morning rite: the outburst ---

=== day2_rite ===
The crowd is quieter than yesterday. The bowls were thin this morning.
As the Tender lifts the basket, a thin man pushes to the front. #move:thin-man:112
"Offerings! Look at us. Half a bowl a day, and we're still sending our best up the tube." #name:Thin man
"Somebody up there needs to buck their ideas up!" #name:Thin man
The whole floor goes still.
"Enough." #speaker:tender
The Tender's staff comes down on the landing. The crack rings round the floor. #shake
"The Tree sees every hand that gives, and every mouth that grumbles." #speaker:tender
"Hunger is a test. The Tree has never failed us. It will not start now." #speaker:tender
The thin man shrinks back into the crowd. #move:thin-man:92
"Until the blessings are fuller, the hatch will share out a little less. So that everyone has something." #speaker:tender
Then it's your turn. You hold up your bird.
"The carver from the edge. Same as ever." #speaker:tender
The Tender lays it in the basket with the rest. The tube brightens. #flash:cyan
~ day2 = "afternoon"
~ visits_left = 2
~ objective = "Spend the afternoon (2 visits left)"
~ objective_target = ""
The crowd breaks up, muttering. The afternoon is yours: time for two visits. #time:afternoon
-> END

// --- The afternoon: two visits ---

=== day2_friend ===
"Did you hear that man this morning? In front of the Tender!" #speaker:friend
+ [He shouldn't have said it. Not there.]
    "He shouldn't have said it. Not there." #speaker:you
    "That's what I said." #speaker:friend
+ [He's got a point about the bowls, though.]
    "He's got a point about the bowls, though." #speaker:you
    "Don't. Someone'll hear you." #speaker:friend
+ [Is he wrong? People are hungry.]
    "Is he wrong? People are hungry." #speaker:you
    "...The Tree knows what it's doing. It always has." #speaker:friend
- -> day2_visit_done

=== day2_ration ===
"One share. Less than yesterday, I know. Don't look at me like that." #name:Hatch keeper
You take the little bundle. It weighs almost nothing.
Outside the hatch, a small child from the lower roots is watching it in your hands.
+ [Keep it. Mum will need it.]
    ~ food_store += 1
    You tuck it away and don't look back.
+ [Share some]
    ~ shared_ration = true
    You break off a piece and hold it out. The child snatches it and runs.
- -> day2_visit_done

=== day2_mum_visit ===
"A man shouting at the rite. In front of the Tender. What's the tree coming to?" #speaker:mum
"Keep your head down, love. The Tree looks after those who look after it." #speaker:mum
-> day2_visit_done

=== day2_thin_man ===
"Go on. Tell me I'm wrong." #name:Thin man
He won't look at you.
"My little one hasn't eaten since yesterday." #name:Thin man
-> day2_visit_done

// Said instead if you go back to someone you've already visited today (doesn't use a visit).
=== day2_already_visited ===
You've already spent time here today.
-> END

=== day2_visit_done ===
~ visits_left -= 1
{ visits_left > 0:
    ~ objective = "Spend the afternoon (1 visit left)"
    -> END
}
~ day2 = "evening"
~ mum_at_ceremony = true
~ objective = "Go to the evening ceremony"
~ objective_target = "offering-floor:tender"
The light in the tube is turning gold. It's time for the evening ceremony. #time:evening
-> END

// --- The evening: the rejection ---

=== day2_rejection ===
The blessings come down. The Tender calls out each family as their bundle drops into the basin.
"A blessing, for the weavers. A blessing, for the potters. A blessing, for the lamp-makers." #speaker:tender
Then the light in the tube stutters.
Something drops into the basin with a hard knock. #show:rejected-bird #shake
Your bird. Untouched.
"...Rejected." #speaker:tender
Nobody moves. Nobody has ever seen this.
+ [Bow your head.]
    You bow your head and say nothing.
+ [Maybe it just... fell?]
    "Maybe it just... fell?" #speaker:you
    ~ suspicion += 1
    Someone laughs, once, then stops.
+ [Why?]
    "Why?" #speaker:you
    ~ suspicion += 2
    Your voice carries all the way round the floor.
- "The Tree has spoken. Take it. It is not ours to touch." #speaker:tender
You climb the steps and take it. Nobody else will. #hide:rejected-bird
People step back from you. #recoil
A whisper: "Cursed." Someone pulls a child away.
"Come. Now. Don't look at anyone." #speaker:mum
~ mum_at_ceremony = false
~ objective = ""
~ objective_target = ""
Mum holds your arm all the way home, and doesn't let go. #time:night #goto:home:130:236:day2_mum_burn
-> END

// --- Night: the fire ---

=== day2_mum_burn ===
"It can't stay in this house. Burn it. Tonight." #speaker:mum
+ [You're right. I'll do it now.]
    "You're right. I'll do it now." #speaker:you
    "Good." #speaker:mum
+ [Waste of good wood.]
    "Waste of good wood." #speaker:you
    "Don't. Not tonight." #speaker:mum
+ [It's my bird. Why should I burn it?]
    "It's my bird. Why should I burn it?" #speaker:you
    "Because the Tree said no. That's why." #speaker:mum
- "I'm going to bed. It had better be gone by morning." #speaker:mum
~ mum_in_bed = true
~ day2 = "burn"
~ objective = "Burn the bird"
~ objective_target = "home:hearth"
She goes to bed without another word.
-> END

=== day2_mum_asleep ===
Mum is asleep, or pretending to be.
-> END

=== day2_hearth ===
The fire is low. You hold your bird over the flames.
Then you stop.
There's a seam along its belly. A cut you never made.
You shake it. Something rattles inside.
- (seam)
* [Drop it in the fire]
    Your hand won't let go. Not until you know what's inside.
    -> seam
+ [Open it]
- You work the seam open with the tip of your knife. It gives far too easily, as if it was made to.
Inside, wedged in the hollow: a thin plate of pale metal, no bigger than your thumbnail was, covered in tiny scratches.
You tilt it towards the fire. #decode:message1:day2_decoded
-> END

=== day2_decoded ===
"I see you, clipped wing. Send me new life that can't fly." #speaker:you
You drop the empty bird into the fire. It catches at once.
Tomorrow's offering. What will you carve?
+ [A fledgling, with a clipped wing]
    ~ reply1 = "fledgling"
    A fledgling, then. Small enough to hold a secret.
+ [Your usual bird]
    ~ reply1 = "usual"
    ~ times_ignored += 1
    Your usual bird. The Tree will take it this time. It has to.
-
~ day2 = "hide"
~ objective = "Hide the plate"
~ objective_target = "home:hiding-spot"
-> END

=== day2_hide_plate ===
You lift the loose board and slide the plate underneath.
~ day2 = "bed"
~ objective = "Go to bed"
~ objective_target = "home:bed"
-> END

=== day2_sleep ===
Your bed. The scratches on the plate are still there when you close your eyes.
+ [Sleep]
    ~ day2 = "done"
    ~ mum_in_bed = false
    ~ objective = ""
    ~ objective_target = ""
    You sleep, badly. #endday:Day 3 (not built yet)
+ [Not yet]
- -> END
