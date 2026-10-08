// ============================================================================
// Chapter 2, Day 2: the dog. Draft text from docs/sequences/chapter-2/part-1.md, for the designer to
// rewrite. Your brother sends you to the old scavenger, who tells you about the sunk town; down there, a
// dog barking leads you to the stragglers' camp, where they've a dog tied up to eat (designer: fight to
// save it). The dog choice (keep, sell, eat: you keep it whatever, designer); home to your brother, who
// names it (designer: Peggy, Luna or Bear); it gets out at night and leads you to its hollow.
// The stages are in `c2day2` (main.ink); the area knots send you here at the right stage.
// ============================================================================

// --- Morning, the shack ---

=== c2day2_brother ===
"You were talking in your sleep. Double, double, double." #speaker:brother
"What are we going to do?" #speaker:brother
+ [I'll find a way]
    "I'll find a way." #speaker:scavenger
    "That's what you said about the roof." #speaker:brother
+ [I don't know]
    "I don't know yet." #speaker:scavenger
    He chews his lip and thinks about it, hard, the way he does.
- "The old man at the stacks has been everywhere. Ask him where there's still stuff." #speaker:brother
"Can I come?" #speaker:brother
"No." #speaker:scavenger
"You always say no." #speaker:brother
~ c2day2 = "ask"
~ objective = "Ask the old scavenger"
~ objective_target = "scrap-stacks:old_scav"
-> END

// --- The scrap stacks ---

=== c2day2_old_scav ===
"Double? Off the picked fields?" #speaker:old_scav
He laughs, and it turns into a cough, and he spits.
"There's nothing on the fields. There's been nothing on the fields since before you were born." #speaker:old_scav
+ [Then where?]
    "Then where is there something?" #speaker:scavenger
+ [You've been everywhere]
    "My brother says you've been everywhere." #speaker:scavenger
    "Your brother says a lot of things. To anyone." #speaker:old_scav
- "The sunk town. Down past where the rope stops." #speaker:old_scav
"People go down there all the time." #speaker:scavenger
"Not deep they don't. Them that go deep the first time don't come up to go a second." #speaker:old_scav
"And it's not empty down there lately. Smoke coming up the stairwell, nights." #speaker:old_scav
He goes back to his sorting, and doesn't look at you again.
~ c2day2 = "deep"
~ going_deep = true
~ objective = "Go deep into the sunk town"
~ objective_target = "picked-fields:to-sunk-town"
-> END

// --- The sunk town ---

=== c2day2_bark ===
~ heard_bark = true
~ objective_target = ""
You stop at the edge of the first hole, and listen.
Wind. The ground settling. And under it, far down, a sound you've only ever heard described.
A dog, barking.
There aren't any dogs. Everybody knows that.
-> END

=== c2day2_camp ===
~ camp_found = true
~ stragglers_camp = true
~ dog_tied = true
~ objective = ""
Firelight. Somebody's camp, in an old room, with smoke going up a crack in the ceiling.
And three people round the fire you'd know anywhere. The thin one. The big one. The small one, still wearing your strap round his wrist.
In the corner, tied by the neck with wire to a pipe, is a dog.
It's real. It's thin, and its fur's matted, and it's showing them every tooth it's got.
"Hold it still." #speaker:straggler_big
"You hold it still. It's had my hand once." #speaker:straggler_thin
The big one has a knife out. The fire's already going.
+ [Step in]
    You don't think about it.
+ [Back away]
    You get as far as one step back. The dog's eyes find yours over their shoulders, and that's that.
- "Leave it alone." #speaker:scavenger
They turn round. The thin one starts to grin.
"Her again." #speaker:straggler_thin
Behind them, the dog gets its teeth into the wire, and pulls, and it snaps. #combat:stragglers_camp:c2day2_after_camp
-> END

=== c2day2_after_camp ===
{ camp_won:
    The big one goes over backwards into the fire and comes up howling, and that's enough for all three of them. They run, up through the crawl, and you hear them a long time after you stop seeing them.
    They leave their pack. Your wire's in it, and the ring of casing. Not the cube.
    ~ finds = 2
- else:
    You're down, and the big one's standing over you, and then he isn't: the dog has him by the leg.
    In the noise and the dark you get up, and grab the dog, and run.
    You don't stop until you're through the crawl and the hall and halfway up the stairwell.
}
~ stragglers_camp = false
~ dog_tied = false
Then it's just you and the dog, breathing hard, looking at each other.
It sits down in the dirt, and waits to see what you'll do.
You haven't eaten since yesterday. Neither has it, by the look of it.
+ [Keep it]
    ~ dog_choice = "keep"
    You hold out your hand. It thinks about it for a long time. Then it puts its nose against your fingers.
+ [Sell it]
    ~ dog_choice = "sell"
    A dog. A living dog. The fence would give you a year of food for it. More.
    You twist the wire into a leash. It doesn't fight you.
+ [Eat it]
    ~ dog_choice = "eat"
    You pick up the big one's knife from where he dropped it.
    The dog looks at the knife. Then at you.
    You put the knife down. You're not a monster.
- ~ dog_home = true
~ c2day2 = "home"
~ objective = ""
{ dog_choice == "sell":
    You take it out the way you came, the wire wound round your fist. #time:evening #goto:shack:90:236:c2day2_home
- else:
    You take it home the long way round, so nobody sees. #time:evening #goto:shack:90:236:c2day2_home
}
-> END

// --- Evening, the shack ---

=== c2day2_home ===
{ dog_choice == "sell":
    Halfway across the fields it slipped the wire, and was gone, and you stood there with the empty loop in your hand.
    When you get home, it's sitting in the middle of the floor, and your brother is sitting in front of it, and neither of them has moved in some time.
- else:
    You get the door shut behind you before you let go of it.
}
"Is that a dog?" #speaker:brother
"Is that a real dog?" #speaker:brother
"It's real." #speaker:scavenger
{ dog_choice == "sell":
    "It came to me. It came right in. It's ours, isn't it? Say it's ours." #speaker:brother
    You look at it. It looks at you. There's no selling it now.
}
He puts out a hand, slow, and it sniffs his fingers and then licks them, and he makes a noise you haven't heard him make since he was very small.
"What's it called?" #speaker:brother
"I don't know. It didn't say." #speaker:scavenger
"Then we have to call it something." #speaker:brother
+ [Peggy]
    ~ dog_name = "Peggy"
+ [Luna]
    ~ dog_name = "Luna"
+ [Bear]
    ~ dog_name = "Bear"
- "{dog_name}." #speaker:scavenger
"{dog_name}!" #speaker:brother
The dog's ears go up, as if it's always been called that.
"Listen to me. Nobody can know. Not the kid, not anybody. If anyone finds out, they'll take it, or they'll eat it." #speaker:scavenger
"I won't tell. I promise. I promise I promise." #speaker:brother
He's going to tell somebody. You can see it on him already.
~ c2day2 = "hide"
~ objective = "Hide " + dog_name + " under the floor"
~ objective_target = "shack:floor-panel"
-> END

=== c2day2_brother_evening ===
"{dog_name} likes me. Look. Look, it likes me." #speaker:brother
-> END

=== c2day2_hide ===
You lift the loose panel. Underneath, the dry hollow, out of sight.
{dog_name} goes down into it like it's been waiting for somewhere to go, turns round three times, and lies down with its nose on its paws.
You put the panel back. Through the gap at the edge, a nose pokes up, and sniffs, and goes away again.
~ dog_home = false
~ c2day2 = "night"
~ objective = "Go to bed"
~ objective_target = "shack:bed"
Your brother sits by the panel until he falls asleep there, and you carry him up. #time:night
-> END

// --- Night ---

=== c2day2_night ===
You lie in the dark and listen to the shack creak.
Something scratches. Then nothing. Then the door, moving on its wire.
You're down the ladder before you're awake. The panel's pushed aside, and the hollow's empty, and the door's open a hand's width onto the dark.
Prints in the dust, going out across the fields.
~ found_dog = true
~ c2day2 = "hollow"
~ objective = "Follow " + dog_name
~ objective_target = "dogs-hollow:dog"
-> END

// --- The dog's hollow ---

=== c2day2_hollow ===
A hollow out past the fields, in the lee of a fallen slab, where the wind doesn't reach.
{dog_name} is in the bottom of it, digging.
There's sacking here, chewed, and old bones, and a nest worn into the dirt. It's been living here. On its own. You'd never have known it was here.
It stops, and noses at something, and backs out of the hole with it in its mouth, and brings it to you.
It's a disc of some pale metal, clean as the day it was made, with a light inside that comes on when you hold it.
You've dug the picked fields every day of your life and never found anything like it. {dog_name} found it in the time it took you to catch up.
It sits, and looks at you, and looks at the ground, and waits, as if to say: what else?
~ c2day2 = "done"
~ objective = ""
~ objective_target = ""
You sit down in the dirt beside it, and start to think. #wake:shack:382:184 #endday:Weeks later
-> END
