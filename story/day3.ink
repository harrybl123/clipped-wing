// ============================================================================
// Day 3: your friend. Draft text from docs/sequences/day-3.md, for the designer to rewrite.
// Stages in `day3` (main.ink): wake, carve, rite, girl, sneak, evening, home, open, hide, visit, bed, done.
// On the ignore path (reply1 == "usual") you carve your usual bird, it comes back with message 1 again,
// and the second, stern choice follows; ignoring again is the loyal ending (#ending:loyal).
// Extra tags: #carve:<knot> (after the conversation, the carving close-up plays that knot)
// · #step:<stage> (carving only: that stage's timing game) · #throw (something is thrown at you)
// · #when:<variable>:<knot>[:<seconds>] (once the variable reaches 0, or the time runs out, the knot plays)
// · #ending:loyal (the loyal ending)
// ============================================================================

// --- Morning, at home ---

=== day3_mum_morning ===
Mum is already up. She doesn't look as if she slept.
"Carve something today. Anything. Let them see you're still faithful." #speaker:mum
"And keep your head down at the rite. Please." #speaker:mum
~ day3 = "carve"
~ objective = "Carve your offering"
~ objective_target = "home:bench"
-> END

=== day3_mum_go_on ===
"Go on. And don't look at anyone." #speaker:mum
-> END

=== day3_bench ===
{ reply1 == "usual":
    Your bench. Wood for your usual bird.
- else:
    Your bench. A small block of wood, just big enough for a fledgling.
}
+ [Carve]
    You sit down at the bench. #carve:day3_carving
+ [Not yet]
- -> END

// --- The carving close-up (src/scenes/CarveScene.ts steps through this) ---

=== day3_carving ===
{ reply1 == "usual": -> usual }
First light, and the house still asleep. You turn the block in your good hand.
How small should it be?
+ [Tiny, small enough to cup in one hand]
    ~ fledgling_size = "tiny"
+ [Small, but strong enough to last]
    ~ fledgling_size = "small"
- You rough out the shape. Your knife hand knows the way, even if your other hand doesn't. #step:rough
Now smooth it. Slowly, the way Mum taught you. #step:smooth
Which wing do you clip?
+ [The left, like your hand]
    ~ fledgling_wing = "left"
+ [The right]
    ~ fledgling_wing = "right"
- You cut the wing short, clean and straight. #step:wing
And the eye. Open, or half closed?
+ [Open, looking up]
    ~ fledgling_eye = "open"
+ [Half closed, as if asleep]
    ~ fledgling_eye = "sleepy"
- One small cut. #step:eye
~ day3 = "rite"
~ objective = "Give your offering to the Tender"
~ objective_target = "offering-floor:tender"
It sits in your palm: a fledgling that will never fly. It's the best thing you've made in years. #end
-> END

= usual
First light, and the house still asleep. Your usual bird. You could carve it with your eyes shut.
You rough out the shape. #step:rough
Smooth it. #step:smooth
The wing, the way it always comes out: a little heavy. #step:wing
The eye. #step:eye
~ day3 = "rite"
~ objective = "Give your offering to the Tender"
~ objective_target = "offering-floor:tender"
The same bird as ever. The Tree will take it this time. It has to. #end
-> END

// --- The morning rite: the crowd, your friend, the girl ---

=== day3_rite ===
The floor is packed: people on the stairs, in the archways, people you've never seen at a roots rite.
They part around you as you come through. Nobody lets their sleeve touch yours.
"That's the one." #name:Someone in the crowd
"Cursed." #name:Someone else
The Tender sees you coming and takes a cloth from their robe before reaching for your offering.
"Not with the others." #speaker:tender
Your {reply1 == "usual": bird|fledgling} goes into a basket of its own, and the basket goes up last. #flash:cyan
Across the floor, you see your friend. He sees you too, and starts towards you. #show:friend-rite
His father grabs his arm and pulls him back, out through the archway. #move:friend-rite:452 #move:friend-parent-rite:452
"Stay away from my son!" #name:His father
They're gone. #hide:friend-rite #hide:friend-parent-rite
You need to tell him. You need to tell someone.
Someone is leaning in the far archway, watching you. The girl from the lower roots. #show:girl-rite
~ day3 = "girl"
~ objective = "Talk to the girl"
~ objective_target = "offering-floor:girl-rite"
-> END

=== day3_girl ===
"You look like you've been spat at. Oh, wait. You have." #speaker:girl
She pushes off the archway and looks you up and down.
"You all right? Honestly. Nobody else is going to ask you."
+ [I'm fine. Really.]
    "I'm fine. Really." #speaker:you
    "Course you are. That's why your hands are shaking." #speaker:girl
+ [Never better. Can't you tell?]
    "Never better. Can't you tell?" #speaker:you
    "Ha. There's a bit of fight in you. I like that." #speaker:girl
+ [No. I'm not.]
    "No. I'm not." #speaker:you
    "No. Didn't think so." #speaker:girl
- "Don't look so surprised. Somebody had to say something to you that wasn't 'cursed'." #speaker:girl
+ [Who are you?]
    "Who are you?" #speaker:you
    "Nobody you'd know. I live where the roots run out." #speaker:girl
+ [You were at the first rite. Watching me.]
    "You were at the first rite. Watching me." #speaker:you
    "Don't flatter yourself. I watch everyone. You were just the only one not looking at the tube." #speaker:girl
+ [Why are you talking to me?]
    "Why are you talking to me?" #speaker:you
    "Because nobody else will. That makes you interesting." #speaker:girl
- "So. Cursed child. What now? Going to go home and hide under the bed?" #speaker:girl
+ [Tell her about your friend]
    You tell her. Your friend, the one person who'd listen. His father pulling him away. "Stay away from my son."
+ [I don't know.]
    "I don't know." #speaker:you
    "Liar. You keep looking at that archway like someone's about to walk back through it." #speaker:girl
    So you tell her. Your friend. His father. "Stay away from my son."
- "His father. Big man, little house, shrine in the window?" #speaker:girl
"Down in the lower roots we've been 'cursed' since before you were born. You get used to people pulling their children away." #speaker:girl
"His room's at the back, isn't it? The back of that house sits right on the old ways. Nobody up here remembers they're there." #speaker:girl
+ [Why would you help me?]
    "Why would you help me?" #speaker:you
    "Who said I'm helping? I'm bored. You're the most interesting thing that's happened down here in years." #speaker:girl
+ [Can you get me there?]
    "Can you get me there?" #speaker:you
    "Can I. Ha. I could get you under the Tender's chair if I wanted." #speaker:girl
+ [The old ways?]
    "The old ways?" #speaker:you
    "Tunnels. Under everything. You'll see." #speaker:girl
- "Come on, then. Keep up." #speaker:girl
~ day3 = "sneak"
~ girl_with_you = true
~ objective = "Get to your friend's window"
~ objective_target = "back-routes:friends-window"
She leads you down, and down, to where the roots end. #time:afternoon #goto:lower-roots:80:360:day3_lower_roots
-> END

=== day3_lower_roots ===
"My end of the tree. Lovely, isn't it." #speaker:girl
"And that, down at the end, is the way into the old routes. Tunnels under everything. Under your house, under the Tender's feet." #speaker:girl
"Mind the ceilings. They come down when they like." #speaker:girl
"I'm coming with you. Not to hold your hand. Just to make sure you don't die stupidly." #speaker:girl
-> END

=== day3_girl_follow ===
{~"Keep moving."|"Up the shaft, then along. You'll see."|"Don't stand on the soft boards. Or do, and find out."|"Watch the dust. When it falls, something follows."}
-> END

=== day3_window ===
At the end of the tunnel, a little window glows in the wall: the back of his room.
You knock: three taps, the knock you made up together when you were small.
A shadow moves. Then his face. He pushes the window open and leans out. #show:friend-window
"You can't be here! If Father hears..." #speaker:friend
+ [I had to see you.]
    "I had to see you." #speaker:you
+ [Nice to see you too.]
    "Nice to see you too." #speaker:you
+ [I need to tell you the truth.]
    "I need to tell you the truth. About the bird." #speaker:you
- Then he sees who's behind you, and goes quiet.
"Who's that?" #speaker:friend
"Charmed, I'm sure." #speaker:girl
"You're from the lower roots." #speaker:friend
"Go on, then. Cursed? Rotten? I've heard them all." #speaker:girl
"I was only going to say thank you. For bringing him." #speaker:friend
He gives her a small, stiff nod, the way his mother nods to the lower-roots women at the market: kind, and not quite sure she's allowed.
"Not here. Not now." #speaker:friend
A voice from inside calls his name. He looks over his shoulder.
"Tonight. I'll come to you. I promise." #speaker:friend
The window shuts. #hide:friend-window
"Well. That was touching." #speaker:girl
+ [Thank you. Really.]
    "Thank you. Really." #speaker:you
    "Don't. You'll ruin my reputation." #speaker:girl
+ [Will I see you again?]
    "Will I see you again?" #speaker:you
    "Maybe. If you don't get yourself squashed on the way back." #speaker:girl
- "I'm going home the low way. You want the top way: back along here, past the shaft, and up under the offering floor." #speaker:girl
"It's quicker. Mostly. Watch the roof. It's been groaning all afternoon." #speaker:girl
She gives you a little two-fingered salute, drops down the shaft, and is gone.
~ girl_with_you = false
~ routes_collapsing = true
~ day3 = "evening"
~ mum_at_ceremony = true
~ objective = "Go to the evening ceremony"
~ objective_target = "offering-floor:tender"
Somewhere above you, the evening ceremony will be starting. #time:evening
-> END

=== day3_parent ===
"Out. Out of my house. Now." #name:His father
-> END

// --- The crowd at the rites (talk to them before the Tender) ---

=== day3_crowd_mother ===
{ day3 == "evening": -> evening }
A mother pulls her children behind her skirts as you come near.
"Don't you come near my children." #name:A mother
+ [I'd never hurt them.]
    "I'd never hurt them." #speaker:you
    "That's what the rot says too, before it gets in." #name:A mother
+ [Say nothing]
    You say nothing. She backs away, still facing you, until the crowd swallows her.
- -> END
= evening
"Come to watch it come back, have you? Or to make sure it does?" #name:A mother
-> END

=== day3_crowd_old_man ===
{ day3 == "evening": -> evening }
"My grandmother told me about a rejection once. I thought it was just a story." #name:An old man
"The whole family was gone within the week." #name:An old man
+ [Gone where?]
    "Gone where?" #speaker:you
    He won't meet your eyes. "Nobody would say."
+ [It's only a story.]
    "It's only a story." #speaker:you
    "Hope so. For your sake." #name:An old man
- -> END
= evening
"If it comes back again, the Tender will have to do something. They'll have no choice." #name:An old man
-> END

=== day3_crowd_zealot ===
{ day3 == "evening": -> evening }
A young man on the stairs spits as you pass. "Rot-hand." #name:A young man
+ [What did you call me?]
    "What did you call me?" #speaker:you
    "You heard. Clean hands make clean offerings. Everyone knows that." #name:A young man
+ [Walk away]
    You walk away. He laughs at your back.
- -> END
= evening
"Twice, and we'll know for sure what you are." #name:A young man
-> END

// --- The evening: the second rejection, worse than the first ---

=== day3_rejection ===
The floor is packed before the blessings even start. There's a space around you and Mum, a ring nobody steps into.
"A blessing, for the weavers. A blessing, for the potters." #speaker:tender
The Tender doesn't look your way when the tube goes dark. #flash:dark
Your {reply1 == "usual": bird|fledgling} drops into the basin. #show:rejected-bird #shake
This time, nobody screams. They were waiting for it.
"Again." #name:A woman
"Twice! The Tree's sent it back twice!" #name:An old man
Something hits your shoulder: a rotten root, thrown from the back of the crowd. #throw #shake
"Get it out of here!" #name:A man
Someone shoves Mum. She stumbles against the steps. #move:mum-ceremony:150
+ [Go to Mum, head down]
    You go to her and help her up, and keep your eyes on the floor.
+ [Stare them down]
    ~ suspicion += 1
    You stare back at them. A few look away. Most don't.
+ [Leave her alone!]
    ~ suspicion += 2
    "Leave her alone!" #speaker:you
    For a moment the whole floor goes quiet. Then the shouting is twice as loud.
- A young man shoves through to the front and plants himself in front of you. A zealot's stole, a carver's hands.
"Say it. Say what you did to make the Tree spit you out." #name:The young man
+ [I didn't do anything.]
    "I didn't do anything." #speaker:you
    "Twice. Twice, and he did nothing." #name:The young man
    The crowd laughs, and it's an ugly sound.
+ [Ask the Tree yourself.]
    ~ suspicion += 1
    "Ask the Tree yourself." #speaker:you
    He hits you. Not hard; he doesn't need to. #shake
+ [Push past him]
    ~ suspicion += 1
    You try to push past. He shoves you back into the space around you, and the crowd closes it again. #shake
- Low at first, from the back, then all round the floor: "Cursed. Cursed. Cursed." #shake
"Enough!" #speaker:tender
"Until the Tree is appeased, no blessings will come down for the carver's house." #speaker:tender
~ food_store -= 2
~ blessings_withheld = true
A murmur goes round the floor. Some of them sound pleased.
"Take it. And take yourselves home." #speaker:tender
You climb the steps and take your {reply1 == "usual": bird|fledgling} out of the basin. #hide:rejected-bird
~ mum_at_ceremony = false
~ objective = ""
~ objective_target = ""
Mum doesn't say a word all the way home. #time:night #goto:home:130:236:day3_mum_night
-> END

// --- Night, at home ---

=== day3_mum_night ===
{ dialogue_style:
- "hide":
    Mum sits by the fire and doesn't take off her shawl.
    "I don't know what we did. I don't know what you did." #speaker:mum
    "I've given the Tree everything my whole life." #speaker:mum
- "joke":
    "Don't. Don't you dare make a joke of this. Not tonight." #speaker:mum
    "They pushed me. In front of everyone. And you just stood there with that look on your face." #speaker:mum
- else:
    "They put their hands on me, love. On me." #speaker:mum
    "Forty years I've stood on that floor." #speaker:mum
}
"I'm going to bed. Get rid of that thing." #speaker:mum
~ mum_in_bed = true
~ day3 = "open"
{ reply1 == "usual":
    ~ objective = "Open the bird"
- else:
    ~ objective = "Open the fledgling"
}
~ objective_target = "home:hearth"
She goes to bed without looking at it.
-> END

=== day3_open_bird ===
You sit by the hearth with your {reply1 == "usual": bird|fledgling} in your hands.
There's a seam along the belly again. Someone has been inside it.
{ reply1 == "usual": -> ignore_again }
You work it open. Inside is a plate, blackened like the first. On purpose, you think. To keep it hidden.
They answered. You sent a fledgling up into the light, and whoever is up there understood it, and wrote back.
And the fledgling itself has been hollowed out. Neatly, from the inside, so it holds its shape.
You turn it over and over. You'd never get a wall that thin with your hands. Whoever did this has tools you've never seen, or hands that never shake.
Your fingers are trembling. You can't tell any more if it's fear.
You start rubbing at the soot. #decode:message2:day3_decoded
-> END

= ignore_again
You work it open. Inside is a plate, blackened like the first.
You already know what it says before you've rubbed it clean. #decode:message1:day3_second_choice
-> END

=== day3_decoded ===
"Clipped wing, I rest beyond the bark. Would you like to fly?" #speaker:you
Beyond the bark. Outside the tree. Nobody lives outside the tree.
Do they? Is there even an outside? You've never thought about it, not properly. Nobody does. The tree is the world.
You look at the wall, at the dark wood your whole life has happened inside, and for the first time you wonder how thick it is.
"Would you like to fly?" It's a question. They're asking you something. They want to know what you think.
You turn the hollow fledgling over in your hands. Whoever did this wants you to see how it's done.
To carve a bird empty, and put something inside it.
To answer.
-> day3_knock

=== day3_second_choice ===
"I see you, clipped wing. Send me new life that can't fly." #speaker:you
The same words. Whoever this is asked you twice, and twice you turned away.
The plate is warm from the fire, and the Tree is above you, as it always has been. #dim:on
- (choose)
+ [Carve a fledgling with a clipped wing (answer the message)]
    You'll answer. Late, but you'll answer.
    ++ [Yes. Answer it.]
        ~ reply1 = "fledgling"
        ~ answered_late = true
        You set the plate aside. Tomorrow, a fledgling goes up the tube. #dim:off
        -> day3_knock
    ++ [No. Think again.]
        -> choose
+ [Carve your usual bird (stay loyal to the Tree)]
    Your usual bird, the way Mum taught you. The Tree, and nothing else.
    ++ [Yes. Stay loyal to the Tree.]
        ~ times_ignored += 1
        You drop the plate into the fire and watch it blacken until the scratches are gone.
        You stayed loyal to the Tree. #ending:loyal
        -> END
    ++ [No. Think again.]
        -> choose

=== day3_knock ===
A tap at the window. Three taps: the knock you made up together when you were small.
It's him. And the plate, the {answered_late: bird|fledgling} and your shavings are all out in the open.
~ day3 = "hide"
~ evidence_left = 3
~ evidence_plate = true
~ evidence_bird = true
~ evidence_shavings = true
~ objective = "Hide everything (3 left)"
~ objective_target = "home:evidence-plate"
He's already at the window. Hide them, quickly! #when:evidence_left:day3_visit:15
-> END

=== day3_hide_plate ===
~ evidence_plate = false
~ evidence_left -= 1
You slide the plate under the chopping board.
-> day3_hide_next

=== day3_hide_bird ===
~ evidence_bird = false
~ evidence_left -= 1
You stuff the hollow bird under your blanket.
-> day3_hide_next

=== day3_hide_shavings ===
~ evidence_shavings = false
~ evidence_left -= 1
You sweep the shavings into the kindling.
-> day3_hide_next

// After hiding something: what's left, and where the marker points next.
=== day3_hide_next ===
{ evidence_left:
- 2: ~ objective = "Hide everything (2 left)"
- 1: ~ objective = "Hide everything (1 left)"
- else: ~ objective = ""
}
{
- evidence_plate: ~ objective_target = "home:evidence-plate"
- evidence_shavings: ~ objective_target = "home:evidence-shavings"
- evidence_bird: ~ objective_target = "home:evidence-bird"
- else: ~ objective_target = ""
}
-> END

// --- The visit: confide or lie ---

=== day3_visit ===
~ objective = ""
{ evidence_left > 0: Too late. The window creaks open. }
He drops down from the window, out of breath. #show:friend-visit
"I said I'd come." #speaker:friend
{ evidence_plate: His eyes go straight to the kitchen, to the blackened plate lying by the board. }
{ evidence_bird: He looks up at the loft, at the hollowed bird on your bed. }
{ evidence_shavings: He steps in the fresh shavings by the bench and looks at them, then at you. }
"Why is the Tree doing this to you? What did you do?" #speaker:friend
"You said you'd tell me the truth." #speaker:friend
+ [Tell him everything]
    -> confide
+ [Lie to him]
    -> lie

= confide
~ confided = true
You fetch the plate from where you hid it, and tell him everything. The seam in the bird. The pictures. "I see you, clipped wing."
He doesn't say anything for a long time. Then he sinks down onto the floor, as if his legs have gone.
"It spoke to you." #speaker:friend
"The Tree. It sent something back. To you. It's never... nobody has ever..." #speaker:friend
{ friend_trust > 0:
    He looks at you as if he's never seen you before. As if you're something holy.
    "All my life I've prayed for a sign. And it came to you." #speaker:friend
    "I'm not jealous. I'm not. I just... why you?" #speaker:friend
    ~ friend_trust += 1
- else:
    He reaches out to touch the plate, and stops, as if it might burn him.
    "Are you sure? You'd swear it, on the tube? Because if you're lying about this..." #speaker:friend
    "No. No, look at it. Nobody in the tree could cut lines like that." #speaker:friend
}
"I won't tell anyone. I swear on the tube. This is between you and the Tree." #speaker:friend
-> goodbye

= lie
~ confided = false
"I don't know. I'm cursed, that's all. The Tree's turned its face from me." #speaker:you
{ evidence_left > 0: -> caught }
"I'm sorry. I'm so sorry." #speaker:friend
He believes you. Somehow, that's worse.
-> goodbye

= caught
"Then what's that?" #speaker:friend
+ [Nothing. Just an old offering.]
    "Nothing. Just an old offering." #speaker:you
+ [Leave it. Please.]
    "Leave it. Please." #speaker:you
- He looks at you for a long time. He knows. You can see that he knows.
~ friend_trust -= 1
~ friend_suspects = true
"Fine. Keep your secrets." #speaker:friend
-> goodbye

= goodbye
"I have to go before they notice." #speaker:friend
He climbs back out of the window, into the dark. #hide:friend-visit
~ day3 = "bed"
~ objective = "Go to bed"
~ objective_target = "home:bed"
-> END

=== day3_sleep ===
Your bed. {evidence_bird: Something hard under the blanket: the hollow bird.}
+ [Sleep]
    ~ day3 = "done"
    ~ mum_in_bed = false
    ~ routes_collapsing = false
    ~ day4 = "wake"
    ~ summons_on_floor = true
    ~ objective = "See what's by the door"
    ~ objective_target = "home:summons"
    You lie awake a long time. #endday:Day 4
+ [Not yet]
- -> END
