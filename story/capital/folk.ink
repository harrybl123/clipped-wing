// ============================================================================
// Everyone else in the capital (Chapter 3): the guards, servants, courtiers,
// council, the watch and the city's people. Each knot is shared by several
// people (src/data/areas/capital/*.ts); `#speaker:them` shows whoever you're
// talking to. A different line each time. DRAFT lines for the designer to
// rewrite: short (designer); they know who you are.
// ============================================================================

// --- The citadel ---

=== c3_guard ===
{shuffle:
- "Highness." #speaker:them
- "All quiet, Highness." #speaker:them
- "Eyes front. Sorry, Highness. Habit." #speaker:them
- "Nothing to report. That's how we like it." #speaker:them
}
-> END

=== c3_guard_night ===
{shuffle:
- "Your father's asked not to be disturbed, Highness." #speaker:them
- "Late, Highness. He's still up. He's always still up." #speaker:them
}
-> END

=== c3_guard_sealed ===
{shuffle:
- "No further, Highness." #speaker:them
- "Only your father goes through. You know that." #speaker:them
- "Don't ask me what's in there. I've never asked either." #speaker:them
}
-> END

=== c3_guard_guests ===
{shuffle:
- "The guests are resting, Highness." #speaker:them
- "Nobody in or out without the captain's word." #speaker:them
}
-> END

=== c3_guard_data ===
{shuffle:
- "This door stays shut, Highness. Your father's orders." #speaker:them
- "Warm, isn't it? Always is, by the door." #speaker:them
}
-> END

=== c3_servant ===
{shuffle:
- A quick bow, eyes down.
  "Highness." #speaker:them
- "Can I fetch you anything, Highness?" #speaker:them
- "Forgive me. I'm behind today." #speaker:them
- "Another banquet tonight. There's always a banquet." #speaker:them
}
-> END

=== c3_page ===
{shuffle:
- "Letters for the council, Highness. Heavy today." #speaker:them
- "Don't tell anyone. I read the seals. Half of them are from below." #speaker:them
}
-> END

=== c3_maid ===
{shuffle:
- "I'll be out of your way in a moment, Highness." #speaker:them
- "You kicked the covers off again." #speaker:them
}
-> END

=== c3_fire ===
"Your father likes it lit before he's up. Even in summer." #speaker:them
-> END

=== c3_gardener ===
{shuffle:
- "The only things in the city that grow, Highness." #speaker:them
- "Mind the beds. They don't forgive feet." #speaker:them
}
-> END

=== c3_server ===
{shuffle:
- "Wine, Highness? No? More for them, then." #speaker:them
- "Don't let the tray fool you. I hear everything." #speaker:them
}
-> END

=== halls_courtier ===
{shuffle:
- "Highness! Lovely to see you about." #speaker:them
- "Did you hear who wasn't at the banquet? Again?" #speaker:them
- "Your father looks tired. Everyone says so. Not to him." #speaker:them
}
-> END

=== audience_courtier ===
{shuffle:
- "They do go on, don't they?" #speaker:them
- "More of them every week. Where do they all come from?" #speaker:them
}
-> END

=== audience_petitioner ===
{shuffle:
- "Highness. Will he hear us today?" #speaker:them
- "Three days I've waited. I'll wait three more." #speaker:them
- "We don't want much. Just to be heard." #speaker:them
- "Sorry, Highness. I didn't mean to stare. You look like him." #speaker:them
}
-> END

=== council_member ===
{shuffle:
- "Not now, Highness. He's about to speak." #speaker:them
- "We'll be here till dark at this rate." #speaker:them
- "Empty seats again. Nobody mentions them." #speaker:them
}
-> END

=== salon_guest ===
{shuffle:
- "The prince! Do sit, Highness." #speaker:them
- "Isn't it awful about the lower lifts? I wouldn't know. I never take them." #speaker:them
- "Another salon. Same faces. Fewer of them." #speaker:them
}
-> END

=== banquet_guest ===
{shuffle:
- "To the steady ship!" #speaker:them
- "Your father's chair is empty again. Nobody's saying anything." #speaker:them
- "Dance, Highness? No? Pity." #speaker:them
}
-> END

=== banquet_dancer ===
{shuffle:
- "Not now, Highness. I'll lose count." #speaker:them
- "Cut in, if you dare." #speaker:them
}
-> END

=== banquet_musician ===
{shuffle:
- "Requests, Highness? We know all the old ones." #speaker:them
- "Nobody listens. They just like that we're here." #speaker:them
}
-> END

=== guest_wing_guest ===
{shuffle:
- "Lovely rooms. Everything you could want." #speaker:them
- "I do miss home, though." #speaker:them
}
-> END

=== office_visitor ===
"Evening, Highness. Just leaving." #speaker:them
-> END

// --- The city ---

=== promenade_cook ===
{shuffle:
- "Noodles, Highness? On the house. Please. Take them." #speaker:them
- "Hot, cheap and quick. Like everything down here." #speaker:them
}
-> END

=== promenade_folk ===
{shuffle:
- "Highness? Out here?" #speaker:them
- "Mind the puddles, Highness." #speaker:them
- "Prices went up again. Not that you'd notice." #speaker:them
- "Lovely coat." #speaker:them
}
-> END

=== promenade_shopper ===
{shuffle:
- "Window shopping, Highness? Same." #speaker:them
- "Everything costs more this season." #speaker:them
}
-> END

=== promenade_night ===
{shuffle:
- "Bad night to be out, Highness." #speaker:them
- "Keep your hood up. Everyone else does." #speaker:them
}
-> END

=== c3_watch ===
{shuffle:
- "Move along. Oh. Highness." #speaker:them
- "Keep to the lit streets after dark." #speaker:them
- "Quiet so far." #speaker:them
}
-> END

=== c3_kid ===
{shuffle:
- "Are you really him?" #speaker:them
  "Prove it." #speaker:them
- "Can I touch the gold?" #speaker:them
}
-> END

=== c3_old ===
{shuffle:
- "I remember when the lights stayed on all night." #speaker:them
- "Sit, if you like. The bench doesn't care who you are." #speaker:them
}
-> END

=== lifts_folk ===
{shuffle:
- "Always waiting. Always." #speaker:them
- "The car's late. They're always late now." #speaker:them
- "Going up, Highness? Lucky you." #speaker:them
}
-> END

=== low_cook ===
"Eat, or move. People are watching you stand there." #speaker:them
-> END

=== low_repairer ===
"I fix anything. Except what's actually broken." #speaker:them
-> END

=== low_grocer ===
"Fruit, Highness? It's not much. It's what comes down." #speaker:them
-> END

=== low_folk ===
{shuffle:
- "...Highness." #speaker:them
- "You lost?" #speaker:them
- "We don't get your sort down here. Not on purpose." #speaker:them
- "Want to know what it's like? Come back without the coat." #speaker:them
}
-> END

=== low_night ===
{shuffle:
- "Don't hang about after dark, Highness. Not here." #speaker:them
- "Who sent you down?" #speaker:them
}
-> END

=== low_fire ===
{shuffle:
- "Warm your hands. Nobody'll say anything. Probably." #speaker:them
- "The fire's free. That's why we like it." #speaker:them
}
-> END

=== low_watch ===
"Shouldn't be down here, Highness. Not without us." #speaker:them
-> END

=== hideout_folk ===
{shuffle:
- "Quiet. Drink." #speaker:them
- "You're brave, or stupid, coming here." #speaker:them
- "Nobody here's seen you. Understood?" #speaker:them
}
-> END

=== hideout_corner ===
"Not tonight." #speaker:them
-> END

=== data_tech ===
{shuffle:
- "Don't touch the racks, Highness. They're warm for a reason." #speaker:them
- "Long shift. The numbers don't sleep." #speaker:them
}
-> END

=== gate_watch ===
{shuffle:
- "Papers. Oh. Highness. Go ahead." #speaker:them
- "Nobody out without a pass. Nobody in without a reason." #speaker:them
}
-> END

=== gate_traveller ===
{shuffle:
- "They're slow letting anyone in today." #speaker:them
- "Long road. Longer wait." #speaker:them
}
-> END

=== gate_folk ===
{shuffle:
- "Most of us never go past that wall." #speaker:them
- "Out there? Nothing out there, Highness." #speaker:them
}
-> END
