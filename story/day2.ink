// ============================================================================
// Day 2: the rejection. Draft text from docs/sequences/day-2.md, for the designer to rewrite.
// The day moves on through the stages in `day2` (main.ink); the area knots send you here at the right
// stage. The afternoon (designer): fetch your share from the ration hatch, which you must, and see
// either your friend or the thin man (not both); day2_afternoon_done brings the evening once both are done.
// Extra tags: #shake (the screen shakes) · #recoil (the crowd steps back from you)
// · #decode:<message>:<knot> (after the conversation, the decoding screen; then <knot> plays)
// · #endday:<card> (the day ends, with that card on the next morning) · #dim:on / #dim:off (the room darkens)
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
"Offerings! Look at us. Half a bowl a day, and we're still sending our best up the tube." #speaker:thin_man
"Somebody up there needs to buck their ideas up!" #speaker:thin_man
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
~ objective = "Fetch your rations, then see your friend or the thin man"
~ objective_target = "roots-market:ration-hatch"
The crowd breaks up, muttering. You need to fetch your share from the hatch, for you and Mum. And there's time for one visit before the evening. #time:afternoon
-> END

// --- The afternoon: the hatch, and your friend or the thin man ---

=== day2_ration ===
"One share for the carver's house. Less than yesterday, I know. Don't look at me like that." #speaker:hatch_keeper
You take the little bundle: food for you and Mum. It weighs almost nothing.
Outside the hatch, a small child from the lower roots is watching it in your hands.
+ [Keep it. Mum will need it.]
    ~ food_store += 1
    You tuck it away and don't look back.
+ [Share some]
    ~ shared_ration = true
    You break off a piece and hold it out. The child snatches it and runs.
-
~ got_rations = true
-> day2_afternoon_done

=== day2_mum_afternoon ===
{ got_rations:
    "Is that our share? That's all? Well. Put it in the store, love." #speaker:mum
- else:
    "Have you fetched our share yet? Go on, before the hatch shuts." #speaker:mum
}
-> END

=== day2_friend ===
Your friend is at their bench by the window, turning something over and over in their hands.
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
- "Look. My offering for tomorrow. Tell me honestly." #speaker:friend
"A lamp hook, twisted like a vine. Mother says it's my best yet." #speaker:friend
You see it at once: the twist runs against the grain. It'll crack within a season. Your eyes see everything your hands can't make.
+ [Tell them the truth]
    "The twist runs against the grain. It'll split." #speaker:you
    They stare at it for a long moment.
    "...You're right. You always see it." #speaker:friend
    ~ friend_trust += 1
+ [Tell them it's perfect]
    "It's perfect. The Tree will love it." #speaker:you
    "Really? You'd tell me if it wasn't." #speaker:friend
- They lower their voice.
"Our share was smaller too. Mother pretends it isn't. She gave hers to my little brother last night." #speaker:friend
"It's a test. That's all. The Tree's testing us. Isn't it?" #speaker:friend
+ [It's a test. We'll pass it.]
    "It's a test. We'll pass it." #speaker:you
    "We will." #speaker:friend
+ [I don't know.]
    "I don't know." #speaker:you
    They don't answer.
- They press a little root cake into your hand. "For your mum. Don't tell mine." #speaker:friend
~ food_store += 1
~ afternoon_with = "friend"
-> day2_afternoon_done

=== day2_thin_man ===
The thin man is alone on the floor, scraping at the empty blessing baskets with his fingers. He freezes when he sees you.
"Go on. Tell the Tender. Everyone else will." #speaker:thin_man
+ [I won't tell anyone.]
    "I won't tell anyone." #speaker:you
    His shoulders drop, a little.
+ [You shouldn't have said it. Not at the rite.]
    "You shouldn't have said it. Not at the rite." #speaker:you
    "You think I don't know that?" #speaker:thin_man
+ [You only said what everyone's thinking.]
    "You only said what everyone's thinking." #speaker:you
    ~ suspicion += 1
    Across the floor, a passer-by slows down, listening.
- "My little one hasn't eaten in two days. What was I meant to do? Smile, and send up my best?" #speaker:thin_man
"I carved ladles once. Good ones. We lived up by the market then." #speaker:thin_man
He holds up his hands. They shake.
"Then my hands went. The work goes, the food goes, the house goes. Fair, they call it." #speaker:thin_man
+ {got_rations} [Give him some of your rations]
    ~ food_store -= 1
    ~ shared_ration = true
    You hold out part of your share. He stares at it, then takes it, and can't say anything at all.
+ [Leave him be]
    You leave him to the empty baskets.
- "If the Tree turns its face from anyone, let it be me. Not my little one." #speaker:thin_man
~ afternoon_with = "thin_man"
-> day2_afternoon_done

// Said instead if you go back to someone you've already seen today, or try for both visits.
=== day2_already_visited ===
You've already spent time here today.
-> END

=== day2_no_time ===
There isn't time for this as well, not today. The evening ceremony will be starting soon.
-> END

=== day2_afternoon_done ===
{
- got_rations && afternoon_with != "":
    ~ day2 = "evening"
    ~ mum_at_ceremony = true
    ~ objective = "Go to the evening ceremony"
    ~ objective_target = "offering-floor:tender"
    The light in the tube is turning gold. It's time for the evening ceremony. #time:evening
- got_rations:
    ~ objective = "See your friend or the thin man"
    ~ objective_target = ""
- else:
    ~ objective = "Fetch your rations from the hatch"
    ~ objective_target = "roots-market:ration-hatch"
}
-> END

// --- The evening: the rejection ---

=== day2_rejection ===
The blessings come down. The Tender calls out each family as their bundle drops into the basin.
"A blessing, for the weavers. A blessing, for the potters. A blessing, for the lamp-makers." #speaker:tender
Then the tube goes dark. #flash:dark
Every voice on the floor stops.
The light comes back. Something drops into the basin with a hard knock. #show:rejected-bird #shake
Your bird. Untouched.
The Tender stares at it. The staff is shaking in their hand.
"...Rejected." #speaker:tender
A woman screams. Someone drops their blessing, and it rolls across the floor, and nobody picks it up.
"It sent it back. The Tree sent it back!" #speaker:crowd_woman
"Never. Not once. Not in my grandmother's time, not in hers." #speaker:old_man
"What did you put in it? What did you do?" #speaker:crowd_man
They're pulling their children behind their legs. Backing away from you as if you were rot. #recoil
+ [Bow your head.]
    You bow your head and say nothing.
    "Look at it. Can't even meet our eyes." #speaker:crowd_man
+ [Maybe it just... fell?]
    "Maybe it just... fell?" #speaker:you
    ~ suspicion += 1
    "Fell? It thinks this is funny!" #speaker:crowd_woman
+ [Why?]
    "Why?" #speaker:you
    ~ suspicion += 2
    The whole floor gasps.
    "It asks the Tree why. It asks the Tree why!" #speaker:old_man
- "Silence!" #speaker:tender
"The Tree has spoken. Take it out of the basin. It is not ours to touch." #speaker:tender
You climb the steps and take it. Nobody else will go near it. #hide:rejected-bird
Someone spits at your feet. #recoil
"Rot-hand." #speaker:crowd_man
"Cursed." The word goes round the floor, from mouth to mouth. Cursed. Cursed. #speaker:crowd
Mum's face has gone the colour of ash.
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
Inside, wedged in the hollow: a thin plate of metal, no bigger than your thumbnail was, black with soot from the fire.
You almost drop it. Nobody puts things inside offerings. Nobody would dare.
But somebody has. And it was meant for you: it came back in your bird, to your hands.
You turn it towards the firelight. Your heart is going so hard you can hear it.
Under the soot, something is scratched into it. #decode:message1:day2_decoded
-> END

=== day2_decoded ===
"I see you, clipped wing. Send me new life that can't fly." #speaker:you
You read it again. And again.
"I see you." Who sees you? From where? The Tree doesn't speak in pictures. Does it? #quote
Clipped wing. They know about your hand. They know about your birds. Someone has been watching you, closely, for a long time.
It should frighten you. It does. But underneath the fear there's something else, small and bright, that you haven't felt in years.
Somebody looked at your work and saw you.
You drop the empty bird into the fire. It catches at once.
The house is silent. Tomorrow, something of yours goes up the tube. #dim:on
Whatever you carve tonight is your answer. This choice can't be undone.
- (choose)
+ [Carve a fledgling with a clipped wing (answer the message)]
    A fledgling with a clipped wing: nothing like anything you've ever sent up.
    If anyone looks closely, they'll wonder why. And once it goes up the tube, there's no taking it back.
    ++ [Yes. Carve the fledgling.]
        ~ reply1 = "fledgling"
        You pick up your knife. A fledgling, then. Small enough to hold a secret.
    ++ [No. Think again.]
        -> choose
+ [Carve your usual bird (ignore the message)]
    Your usual bird. You'd be turning away from whoever made this plate, as if it never came.
    The Tree sent your bird back once already. Are you sure?
    ++ [Yes. Carve my usual bird.]
        ~ reply1 = "usual"
        ~ times_ignored += 1
        Your usual bird. The Tree will take it this time. It has to.
    ++ [No. Think again.]
        -> choose
-
~ day2 = "hide"
~ objective = "Hide the plate"
~ objective_target = "home:hiding-spot"
You'll carve it at first light. #dim:off
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
    ~ day3 = "wake"
    ~ mum_in_bed = false
    ~ objective = "Talk to Mum"
    ~ objective_target = "home:mum"
    You sleep, badly. #endday:Day 3
+ [Not yet]
- -> END
