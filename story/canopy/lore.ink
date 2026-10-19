// ============================================================================
// Chapter 4's moving pictures (src/scenes/LoreScene.ts; the pictures in src/ui/loreArt.ts). DRAFT wording
// for the designer to rewrite.
//
//   c4_rise   the chapter opens halfway up the tube (you flew), your own thoughts, silent
//   c4_crack  or crawling to the light at the end of the rot (you fell)
//   c4lore    Grounded tells you, at the lookout at dusk, staged like the prologue (designer), with music
//
// What Grounded covers is the designer's list in docs/sequences/chapter-4/plan.md ("What Grounded explains"),
// and the designer's notes after the first look: the integrated in more detail (and, Jack's idea, they want to
// learn from imperfection); the king's terrible responsibility, and what would happen without the deal; your
// reaction to your whole life being a lie; "why me" when he says everyone's told to make something new; the
// canopy taking from both ways (offerings up, and food, cloth and medicine down); his plan in more detail.
//
// Tags (see LoreScene):
//   #panel:<id>[:<beat>]  a picture (rise, crack, lights, makers, choice, capital, belief, tube, hand,
//                         blessings, tree)
//   #beat:<n>             the picture moves on
//   #narration            the words under the picture (his voice, or silent for your thoughts)
//   #speaker:you          you, in the dialogue box
//   #flash, #sound:<id>, #black, #end
// ============================================================================

// --- The opening: halfway up the tube ---

=== c4_rise ===
Up. #panel:rise #narration
The torches drop away below you. Faces at the glass, mouths open, gone. #narration
The trunk. The middle tiers. The upper halls, their windows going by like sparks. #narration
Somewhere down there, Mum, at the door. #narration
Nobody's ever come back from where you're going. #beat:1 #narration
The Canopy. Where the Tree lives. Where it chose every one of them. #narration
The light above you gets bigger, and whiter, until there's nothing else in the world. #beat:2 #narration
So this is what it's like, you think. To be chosen. #narration
Then nothing at all. #beat:3 #end #narration
-> END

// --- The opening: the end of the rot ---

=== c4_crack ===
The rot goes on and on in the dark. Your hands are raw. #panel:crack #narration
{ c4_girl == "follows":
    Behind you, the girl, breathing hard, swearing at every stone. Neither of you has said a word to the other in hours. #narration
- else:
    You're on your own. You've never been this alone. #narration
}
They threw you away. Down into the rot, with everything else the tree doesn't want. #narration
And ahead: a crack. And through the crack, light. Not the tube's. Not any light you know. #narration
You crawl towards it. #beat:1 #narration
It gets bigger. Brighter. Warmer. #end #narration
-> END

// --- Grounded tells you, at the lookout at dusk ---

=== c4lore ===
// The lights on the horizon.
That's the capital. A city a hundred times the size of the tree. #panel:lights #narration
And past it, that glow along the edge of the sky. That's them. #beat:1 #narration
"Them?" #speaker:you

// Long ago: AI. Join or be ruled (designer).
A long time ago, before the tree, people made something cleverer than themselves. #panel:makers #narration
It woke up. #beat:1 #narration
And it kept getting cleverer, faster than anyone could follow. Within a lifetime it was past us. Within two, we couldn't even see where it had gone. #beat:2 #narration
In the end it offered everyone the same thing. Join it, or be ruled by it. #panel:choice #narration
Most joined. They let it into their heads, their blood, and became something else. #beat:1 #narration
Some said no. Our people, generations back. #beat:2 #narration
They chose to live in the shadow of something greater, to keep what was left of themselves. #narration

// The integrated, in more detail (designer).
And the ones who joined, we call the integrated. #beat:3 #narration
They think together. Millions of them, one mind. They don't sleep. They don't forget. #narration
They don't make mistakes. They're better than us at everything there is to be better at. #narration

// The capital keeps the peace; the king's bargain, his responsibility, and what would happen without it (designer).
Between them and us, there's the capital. It keeps the peace. #panel:capital #narration
It stands at the edge of their world and holds it back from ours. #beat:1 #narration
And its king makes the hardest bargain anyone has ever had to make. #narration
So that humans aren't destroyed by something so much greater, people like you are kept. Kept, and kept working. #beat:2 #narration
Slaves. Nobody will ever say the word. But useful is how you stay alive. #narration
Every day he decides how much of us to sell, so the rest of us are left alone. Ask too much of us and we starve. Give them too little, and... #narration
"And what?" #speaker:you
Without his bargain, they'd have no reason to leave us be. #beat:3 #narration
To them, we're slow. Sick. Hungry. Wasteful. A field gone to weeds. #narration
And they'd do what you do with a field gone to weeds. Make it useful. Every one of us made into them, or cleared away. #narration
"Then he's... protecting us." #speaker:you
He is. That's what makes him so hard to hate. #narration
I manage. #narration

// What the tree's work is for; your reaction (designer: your whole life, and your people's, a lie).
Every morning your best work goes up the tube. You know that part. #panel:belief #narration
Up here, it goes on. Down the other side of the tree, in crates. #panel:tube:1 #narration
To the capital. And on, to them. #beat:2 #narration
"No." #speaker:you
"No. The Tree sees. It chooses. Everything we send up, it sees." #speaker:you
Mum said that. At the bench. The day of the knife.
Everything inside you is shouting.
* ["You're lying."]
    "You're lying." #speaker:you
    I wish I were. I said the same, the day I came up. I said it for a month. #narration
* ["Mum prayed every morning."]
    "Mum knelt at the rite every morning of her life. Every morning since I could walk." #speaker:you
    "She thanked it. For the food. For me." #speaker:you
    I know. Mine did too. #narration
* ["They took my hand. They said I wasn't worthy."]
    "They put me in the roots for this hand. They said I wasn't worthy. Worthy of what?" #speaker:you
    Of being useful. That's all worthy ever meant. #narration
-
"Everyone who went back to the wood. Everyone who was never chosen." #speaker:you
"All of it. For them." #speaker:you
All of it. For them. #narration

// Why they want it (designer): novelty and imperfection; and (Jack) they want to learn from it.
"Why would they want anything we make? You said they're better at everything." #speaker:you
They can make anything. Perfectly, and endlessly. Perfect means nothing to them. #panel:hand #narration
What they can't make is a mistake. A guess. A slip of the knife. Something nobody meant. #beat:1 #narration
Novelty. Imperfection. That's what's valuable to them. #beat:2 #narration
And it isn't only that they want it. They want to learn from it. #beat:4 #narration
A mind that's never been wrong can't imagine being wrong. Every slip you send them is a thought they could never have had. #narration
So everyone in there is told: make something new. Different. Every time. #beat:3 #narration

// Why he chose you (designer): every piece of your work had the same deficiency.
"Then why me?" #speaker:you
Because you couldn't. #beat:1 #narration
Every bird you ever sent up had the same heavy wing. The same slip, in the same place, every time. #narration
Everyone else's offerings were different every morning. I could never pick one of them out. #narration
You, I could find in a pile of a thousand. I could write to you, and know it was you who wrote back. #narration
The hand that made you worthless in there is the only reason I could ever find you. #narration
// He knew what it would cost you, and did it anyway (designer).
And I knew what it would cost you. The bird sent back. The crowds. The hunger, put on you. #narration
I knew, before I sent the first plate. And I sent it anyway. #narration
"You knew." #speaker:you
I'm sorry. I'd do it again. Both of those are true. #narration

// The canopy's people live off what comes up, and take their share of what goes down (designer).
And us, up here? We live off what comes up the tube, before the rest goes on. Your combs. Your bowls. Your cloth. #panel:tube:3 #narration
And what comes back down to you, the price of your work: the food, the cloth, the medicine. #panel:blessings #narration
The capital takes its cut of it first. And then we take ours. #beat:1 #narration
"The medicine too? When the baby two doors down was sick last winter, one vial came down for him. One." #speaker:you
"You took from that?" #speaker:you
Yes. #narration
// The shrinking blessings are the world's economics (designer).
Every year the capital wants more for the same. So less comes down. #beat:2 #narration
That's the hunger. That's all it ever was. Not the Tree. Not a judgement. #narration
It was never you. #narration
Scavengers, all of us. The capital, and them, and us. Only you, at the bottom, have nobody to take from. #narration

// The tree as the king's resource; his plan; your power over it (designer: why, and how).
To the king, the tree's worth more than any city he has. As long as it's quiet, and believes, and works. #panel:tree #narration
Nobody in there would hear a word of this from me. They'd throw me in the rot before I'd finished the sentence. #beat:1 #narration
Not because they're cruel. Because they believe. That's harder to break than any lock. #narration
But from you? #beat:2 #narration
{ c4_left == "rot":
    They threw you in the rot. Every one of them watched you go. And you'll walk back out of it, alive. #narration
- else:
    They watched the Tree choose you. Every one of them saw you go up the tube. And you'll come back down it. #narration
}
Nobody's ever done that. They'll listen to you, the way they'll never listen to me. #narration
Here's what I want. Not a war. Not to bring the capital down. #narration
A better bargain. One where we live alongside them, and nobody has to be kept to pay for it. No slaves. #narration
And the only way the king will ever make it is if he has to. #narration
You go back in. Not to tell them everything: they couldn't bear it, not all at once. A doubt. One true thing, where they'll find it. Then another. #narration
People who doubt kneel slower. Make less. Ask why. #narration
And when the tree slows, the king has nothing left to trade. Nothing to keep them off with. #beat:3 #narration
He'll have to come to us. #beat:4 #narration
And then we set the terms. What comes back down. Who goes up. Whether anyone's kept at all. #narration
A world where we stand next to them, not under them. For every soul in that tree. That's all I've ever wanted. #narration
And you can give it to them. That's the power you have now. #end #narration
-> END
