// ============================================================================
// Grounded tells you, at the lookout at dusk (Chapter 4, Day 1). Staged like the prologue (designer):
// his words under animated stills, almost frame by frame (src/scenes/LoreScene.ts; the pictures in
// src/ui/loreArt.ts). DRAFT wording for the designer to rewrite.
//
// What he covers is the designer's list in docs/sequences/chapter-4/plan.md ("What Grounded explains"),
// and nothing else. The personal part of it (why he chose you; why nobody could just walk in and say it;
// that he knew what it would cost you) he's already told you this morning (chapter4-day1.ink), and the
// child owned up to the bitten bird in the mess. Here: the integrated; the capital and the king's
// bargain; what the tree's work is for; the shrinking blessings; the canopy living off what comes up;
// the tree as the king's resource, and your power over it.
//
// Tags (see LoreScene):
//   #panel:<id>   a new picture (lights, makers, choice, capital, belief (the prologue's own picture of the tree), tube, hand, scales, tree)
//   #beat:<n>     the picture moves on to its next movement
//   #narration    his words, under the picture, in his voice
//   #speaker:you  you, in the dialogue box
//   #end          after this line, back to the lookout
// ============================================================================

=== c4lore ===
// The lights on the horizon, from where you're standing.
That's the capital. A city. A hundred times bigger than the tree. #panel:lights #narration
And past it, that glow along the edge of the sky. That's them. #beat:1 #narration
"Them?" #speaker:you

// AI: join or be ruled (designer).
A long time ago, before the tree, people made something cleverer than themselves. #panel:makers #narration
It woke up. #beat:1 #narration
And it kept getting cleverer, faster than anyone could follow. #beat:2 #narration
In the end there was only one choice left. Join it, or be ruled by it. #panel:choice #narration
Most joined. They let it in, and became something more than us. The integrated. #beat:1 #narration
Some said no. Our people, generations back. #beat:2 #narration
They chose to live in the shadow of something greater, to keep what was left of themselves. #narration

// The capital keeps the peace; the king's bargain (designer).
Between them and us, there's the capital. It keeps the peace. #panel:capital #narration
And its king makes the hardest bargain of all. #beat:1 #narration
So that humans aren't destroyed by something so much greater, people like you are kept. #beat:2 #narration
Kept, and kept working. Slaves, though nobody would ever say the word. #narration
Because a human who's useful to them is a human they let live. #narration
"Useful how?" #speaker:you

// What the tree's work is for (designer): the integrated value novelty and imperfection.
Every morning your best work goes up the tube. You know that part. #panel:belief #narration
Up here, it goes on. Down the other side of the tree, in crates. #panel:tube:1 #narration
To the capital, and on to them. #beat:2 #narration
"Why would they want anything we make?" #speaker:you
They can make anything. Perfectly. Endlessly. Perfect means nothing to them. #panel:hand #narration
What they can't make is what nobody meant. A guess. A slip. Something new. #beat:1 #narration
Novelty. Imperfection. That's what's valuable to them. That's what your tree is for. #beat:2 #narration
So everyone in there is told: make something different. Every time. #beat:3 #narration

// The canopy's people live off what the tree sends up (designer): scavengers, really.
And us, up here? We live off what comes up the tube, before the rest goes on. #panel:tube:3 #narration
Your shirts. Your bowls. Scavengers, really. Every one of us. #narration

// The shrinking blessings are the world's economics (designer).
What comes back down to you is what's left over. #panel:scales #narration
And every year, the same work is worth a little less. #beat:1 #narration
So the blessings get smaller. That's all it is. It isn't the Tree's judgement. #beat:2 #narration
"They said it was me." #speaker:you
It was never you. #narration

// The tree is an economic resource to the king, and now you have power over it: why, and how (designer).
To the king, the tree is worth more than any city he has. As long as it's quiet, and believes, and works. #panel:tree #narration
Nobody in there will ever believe a word of this from me. #beat:1 #narration
{ c4_left == "rot":
    But from the one they threw in the rot, walking back out of it? #beat:2 #narration
- else:
    But from the one the Tree chose, come back down the tube? #beat:2 #narration
}
If the tree listens to you, the king has to. #narration
That's the power you have now. #end #narration
-> END
