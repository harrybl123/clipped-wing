import type { CombatantDef, EncounterDef, ItemDef, MoveDef } from '../systems/Combat';

// Combat data (docs/combat-design.md): moves, items, fighters and fights, run by src/systems/Combat.ts
// and shown by CombatScene. No levelling: a lead's skills are what the story has given them so far, and
// their numbers are set here. Names and descriptions are placeholders until the designer's text;
// numbers are a first pass to playtest. The descriptions of your skills are shown in the Skill list: plain,
// on-the-nose explanations of what each does (designer), no story flavour.

export const MOVES: Record<string, MoveDef> = {
  // --- The carver. His basic attack is weak: he can't make a proper fist. The scrappy moves are skills.
  // Each has a QTE (src/systems/qte.ts): good ×1.3, perfect ×1.6; a miss glances off (×0.6).
  slap: {
    id: 'slap', name: 'Slap', target: 'enemy', power: 6, kind: 'strike', crit: 0.1,
    qte: { kind: 'key', time: 900, quick: 350, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic melee attack. Light damage.',
  },
  shove: {
    id: 'shove', name: 'Shove', target: 'enemy', power: 8, kind: 'shove', sp: 2, crit: 0.25, interrupts: true,
    qte: { kind: 'bar', time: 1100, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'key', time: 900, quick: 350 } },
    description: 'Medium damage. Can knock an enemy off balance. Interrupts a charged attack.',
  },
  grab: {
    id: 'grab', name: 'Grab', target: 'enemy', power: 10, kind: 'grab', sp: 4,
    qte: { kind: 'carve', strokes: 3, time: 2400, quick: 1200, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    description: 'Grapple attack. Heavy damage.',
  },
  // Three open-handed blows (no fist: a jab with the fingers, a slap, the heel of the bandaged hand), a
  // note for each; each one you land makes the next harder, and all three throw him off balance.
  one_two_three: {
    id: 'one_two_three', name: '1, 2, 3!', target: 'enemy', power: 4, kind: 'strike', sp: 3, hits: 3,
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 380, alt: { kind: 'carve', time: 2400, quick: 1200 } },
    combo: { build: 0.25, finisher: true },
    poses: ['attack', 'slap', 'palm'],
    description: 'Blitz attack: 3 quick hits, each stronger than the last. Land all 3 to knock the enemy off balance.',
  },

  // --- The girl (the deep rot). She isn't hampered like you: she can hit properly, but she's slighter. Her
  // own skillset, with the same mechanics: a QTE on each, and one move that changes who gets hit (Lure). ---
  clout: {
    id: 'clout', name: 'Stab', target: 'enemy', power: 7, kind: 'strike', crit: 0.15,
    qte: { kind: 'key', time: 800, quick: 300, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic melee attack.',
  },
  flick: {
    id: 'flick', name: 'Flick', target: 'enemy', power: 8, kind: 'pierce', sp: 2, crit: 0.15, poses: ['slap'],
    // A quick draw: wait for the opening, and throw the instant it comes.
    qte: { kind: 'draw', time: 420, quick: 160, wait: [600, 1200], alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Ranged attack. Effective against shelled enemies.',
  },
  lure: {
    id: 'lure', name: 'Lure', target: 'self', sp: 1, taunts: true,
    description: 'Draws all enemy attacks to her this round. She guards, taking half damage.',
  },
  rot_ink: {
    id: 'rot_ink', name: 'Rot-ink', target: 'enemy', power: 3, kind: 'none', sp: 3, poses: ['grab'],
    exposes: { turns: 3, mult: 1.5 },
    // A steady hand while she smears it on: keep the needle in the middle.
    qte: { kind: 'balance', time: 1800, zone: [0.36, 0.64], keep: 0.6, keepPerfect: 0.9, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    description: 'Weakens one enemy: it takes more damage for 3 rounds.',
  },

  // --- The rot beetles (the deep rot): shelled, so ordinary hits do little. ---
  pincer: {
    id: 'pincer', name: 'Pincer', target: 'enemy', power: 8, kind: 'strike',
    qte: { kind: 'bar', time: 1100, zone: [0.62, 0.82], sweet: [0.7, 0.74], alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'squared', lines: ['It clicks its pincers.', 'It lowers its head.'] },
    description: 'A snap of the pincers.',
  },
  scuttle: {
    id: 'scuttle', name: 'Scuttle', target: 'enemy', power: 4, kind: 'strike', hits: 2,
    qte: { kind: 'weave', time: 700, quick: 300, gap: 560, alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'cock', lines: ['It skitters sideways.', 'It shifts on its legs.'] },
    description: 'Two quick rushes.',
  },
  rear: {
    id: 'rear', name: 'Rear up', target: 'self', windsUp: 'slam',
    tell: { pose: 'shift', lines: ['It rears up a little.', 'Its front legs lift.'] },
    description: 'Rears up for a heavy slam.',
  },
  slam: {
    id: 'slam', name: 'Slam', target: 'enemy', power: 15, kind: 'strike',
    softened: { guard: 0.25, dodge: 0.1 },
    qte: { kind: 'draw', time: 420, quick: 160, wait: [700, 1400], alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['It’s reared right back.'] },
    description: 'It comes down with all its weight. Guard, or Shove it before it lands.',
  },

  // --- The young zealot (the market scrap). ---
  // Each has a tell: the pose he takes as the round starts, and a vague line (PLACEHOLDER text). Swing and
  // flurry share a pose, so watch the line too. Each attack has its own kind of QTE to react with (a good
  // one dodges, half harm; designer: the ring only for the swing), with an `alt` so the same kind never
  // comes twice running.
  swing: {
    id: 'swing', name: 'Swing', target: 'enemy', power: 9, kind: 'strike',
    qte: { kind: 'ring', outer: 400, inner: 130, perfect: 70, alt: { kind: 'bar', time: 1100, zone: [0.62, 0.82], sweet: [0.7, 0.74] } },
    tell: { pose: 'squared', lines: ['He squares up.', 'He shifts his weight forward.'] },
    description: 'A wild swing.',
  },
  hook: {
    id: 'hook', name: 'Hook', target: 'enemy', power: 5, kind: 'strike', hits: 2,
    qte: { kind: 'weave', time: 700, quick: 300, gap: 560, alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'cock', lines: ['He drops a shoulder.', 'He shifts his weight.'] },
    description: 'A looping swing, and another: duck and lean as they come.',
  },
  flurry: {
    id: 'flurry', name: 'Flurry', target: 'enemy', power: 5, kind: 'strike', hits: 2,
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 420, lanes: ['left', 'up', 'right'], alt: { kind: 'weave', time: 700, quick: 300, gap: 520 } },
    tell: { pose: 'squared', lines: ['He bounces on his toes.', 'He squares up.'] },
    description: 'Two quick ones.',
  },
  collar: {
    id: 'collar', name: 'Collar', target: 'enemy', power: 8, kind: 'grab',
    qte: { kind: 'grip', time: 5000, zone: [0.36, 0.64], narrow: 0.16, tug: 0.8, keep: 0.72, quick: 3300, alt: { kind: 'mash', presses: 8, time: 1800 } },
    tell: { pose: 'reach', lines: ['He’s eyeing your collar.', 'He opens his hands.'] },
    description: 'He gets you by the collar and yanks you about: keep your footing, and break free.',
  },
  wind_up: {
    id: 'wind_up', name: 'Wind up', target: 'self', windsUp: 'haymaker',
    tell: { pose: 'shift', lines: ['He shifts his weight back.', 'He breathes hard through his nose.'] },
    description: 'Draws back for a big one.',
  },
  haymaker: {
    id: 'haymaker', name: 'Haymaker', target: 'enemy', power: 18, kind: 'strike',
    // Big if it lands clean; a guard takes most of it, and getting out of the way nearly all.
    softened: { guard: 0.25, dodge: 0.08 },
    qte: { kind: 'draw', time: 420, quick: 160, wait: [700, 1400], alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['He’s drawn right back.'] },
    description: 'Everything he has. Guard, or shove him before it comes.',
  },
  jeer: {
    id: 'jeer', name: 'Jeer', target: 'self',
    tell: { pose: 'glance', lines: ['He glances at the crowd.'] },
    description: 'Plays to the crowd.',
  },
};

/** Nothing to carry in Chapter 1 yet; the engine takes items when the story hands them out. */
export const ITEMS: Record<string, ItemDef> = {};

export const COMBATANTS: Record<string, CombatantDef> = {
  carver: {
    id: 'carver', name: 'You', sprite: 'protagonist', hp: 40, sp: 10, attack: 8, defence: 9, speed: 12,
    // Dodge only in Act 1: parrying is a move the story hands out later.
    basic: 'slap', moves: ['shove', 'grab', 'one_two_three'], reactions: ['dodge'],
  },
  zealot: {
    id: 'zealot', name: 'The young man', sprite: 'zealot', hp: 70, attack: 10, defence: 9, speed: 10,
    moves: ['swing', 'hook', 'flurry', 'collar', 'wind_up', 'jeer'], weights: [2, 2, 2, 2, 2, 1],
    // The first fight: his tells never lie.
    feint: 0,
    // Hot-headed (suggestion): he shows you each of his moves in the first rounds (so you meet each way of
    // reacting), likes to vary what he does and never does the same thing three times running, escalates
    // when he's hurt, goes for the big one when you're nearly done, and grabs you if you keep guarding.
    ai: {
      opening: ['swing', 'hook', 'flurry', 'wind_up', 'collar'],
      maxRepeat: 2,
      recent: 0.35,
      when: {
        hurt: { wind_up: 2.5, flurry: 1.5, jeer: 0.2 },
        foeHurt: { wind_up: 2, jeer: 1.5 },
        foeGuarding: { collar: 3, wind_up: 0.5 },
      },
    },
    // (suggestion) He's never been held: grabs throw him; two before he recovers floor him.
    weak: ['grab'], poise: 2,
  },
};

/** The girl from the lower roots, fighting beside you in the deep rot (draft numbers, to playtest). */
COMBATANTS.girl = {
  id: 'girl', name: 'The girl', sprite: 'girl', hp: 30, sp: 10, attack: 9, defence: 8, speed: 14,
  basic: 'clout', moves: ['flick', 'lure', 'rot_ink'], reactions: ['dodge'],
};

/** A big beetle from the deep rot: its shell turns ordinary blows, but it's top-heavy and cracks. */
COMBATANTS.beetle = {
  id: 'beetle', name: 'Rot beetle', sprite: 'beetle', hp: 26, attack: 9, defence: 9, speed: 8,
  moves: ['pincer', 'scuttle', 'rear'], weights: [3, 2, 1.2],
  weak: ['pierce', 'shove'], resists: ['strike'], poise: 2, feint: 0,
  ai: { maxRepeat: 2, recent: 0.5 },
};

/** A second, weaker young man, for trying fights with more than one enemy (a test, not in the story). */
COMBATANTS.lackey = {
  id: 'lackey', name: 'His friend', sprite: 'lackey', hp: 26, attack: 8, defence: 8, speed: 9,
  moves: ['swing', 'hook', 'jeer'], weights: [2, 2, 1], weak: ['shove'], poise: 1, feint: 0,
  ai: { maxRepeat: 2, when: { hurt: { jeer: 0 } } },
};

export type Lesson = 'turns' | 'tells' | 'react' | 'offBalance' | 'windUp' | 'allies';

/**
 * The first fights teach themselves (designer: the scene is the tutorial). Each shows once, the first time
 * it comes up: plain explanations (designer), no flavour. An encounter lists the ones it teaches
 * (`teaches`), so a later fight only teaches what's new.
 */
export const LESSONS: Record<Lesson, string> = {
  turns: 'Your turn. Up and Down to choose, E to confirm. Attack is your basic melee attack. Skills are stronger moves that cost SP. Guard halves the damage you take until your next turn.',
  tells: 'An enemy\u2019s pose, and the line above its head, show what it\u2019s about to do.',
  react: 'When an enemy attacks, follow the prompt on screen in time to dodge. Miss it and you take the full hit.',
  offBalance: 'That enemy is off balance. Hit it again before it recovers to knock it down and get an extra turn.',
  windUp: 'An enemy is charging a heavy attack. Guard to take less of it, or Shove it before it lands to stop it.',
  allies: 'You\u2019ll fight alongside friends, each with their own abilities.',
};

export const ENCOUNTERS: Record<string, EncounterDef> = {
  /**
   * Day 4 afternoon at the market (design doc). No running, and no way out mid-fight (designer: Hold
   * back is gone; holding back is the story's choice before it starts, `held_back` in ink). What follows
   * is the story's: ink reads these (win: suspicion jumps; lose: hurt, less food).
   */
  market_scrap: {
    id: 'market_scrap',
    name: 'The market scrap',
    party: ['carver'],
    enemies: ['zealot'],
    // The first fight: the ring takes a second to close and the band is a third wider than the moves
    // say. Later fights can close faster and narrower.
    timing: { lunge: 1000, ease: 1.3 },
    // The scene itself is the tutorial (designer): a line the first time each thing comes up.
    teaches: ['turns', 'tells', 'react', 'offBalance', 'windUp'],
    outcomes: {
      won: { fight_won: true },
      lost: { fight_won: false },
    },
  },
  /**
   * Day 4 night, the deep rot: strange beetles, and the girl at your side (designer: three beetles against
   * the two of you). Teaches only that you fight alongside friends, each with their own abilities.
   * Writes `rot_beetles_won`; the story takes it from there.
   */
  rot_beetles: {
    id: 'rot_beetles',
    name: 'The deep rot',
    party: ['carver', 'girl'],
    enemies: ['beetle', 'beetle', 'beetle'],
    stage: 'rot',
    timing: { lunge: 1000, ease: 1.3 },
    // (Designer: not too hand-holdy; the rest was taught at the market. If you held back there and never
    // fought, it's your first fight, so it teaches the basics too.)
    teaches: ['allies'],
    alsoTeaches: { unless: 'fought', lessons: ['turns', 'tells', 'react', 'offBalance', 'windUp'] },
    outcomes: {
      won: { rot_beetles_won: true },
      lost: { rot_beetles_won: false },
    },
  },
  /** A test fight (dev): the zealot and his friend, for targeting more than one enemy. Writes nothing. */
  test_two: {
    id: 'test_two',
    name: 'Two of them (test)',
    party: ['carver'],
    enemies: ['zealot', 'lackey'],
    timing: { lunge: 1000, ease: 1.3 },
    outcomes: { won: {}, lost: {} },
  },
  /** A test fight (dev): three of them, for the layout and targeting. Writes nothing. */
  test_three: {
    id: 'test_three',
    name: 'Three of them (test)',
    party: ['carver'],
    enemies: ['lackey', 'zealot', 'lackey'],
    timing: { lunge: 1000, ease: 1.3 },
    outcomes: { won: {}, lost: {} },
  },
};

// --- Chapter 2: the scavenger, the dog, and the borderland's people (draft numbers, to playtest) ---
// Each has their own abilities (designer: unique to them, nothing borrowed from Act 1). Hers come from her
// staff (designer: like the one in Tenet, a staff of different-shaped cuboid pieces): reach, sweeps, a
// rattle of blows, and bracing it to turn blows aside. She can parry from the start: she's been fighting
// for scraps all her life.

Object.assign(MOVES, {
  jab: {
    id: 'jab', name: 'Jab', target: 'enemy', power: 7, kind: 'strike', crit: 0.15, poses: ['attack'],
    qte: { kind: 'key', time: 800, quick: 300, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic attack with the staff.',
  },
  sweep: {
    id: 'sweep', name: 'Sweep', target: 'enemy', power: 7, kind: 'shove', sp: 2, crit: 0.2, interrupts: true, poses: ['shove'],
    // Low and flat across the ground: time it as it swings through.
    qte: { kind: 'bar', time: 1100, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'key', time: 800, quick: 300 } },
    description: 'Takes their legs. Knocks an enemy off balance. Interrupts a charged attack.',
  },
  rattle: {
    id: 'rattle', name: 'Rattle', target: 'enemy', power: 4, kind: 'strike', sp: 3, hits: 3, poses: ['slap', 'palm', 'attack'],
    // The blocks clatter on the core with every blow: one note each.
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 360, alt: { kind: 'carve', time: 2400, quick: 1200 } },
    combo: { build: 0.25, finisher: true },
    description: '3 quick blows, each stronger than the last. Land all 3 to knock the enemy off balance.',
  },
  // (Designer: a little OP. Now it costs more and is spent on the first blow it turns.)
  brace: {
    id: 'brace', name: 'Brace', target: 'self', sp: 4, braces: true, poses: ['guard'],
    description: 'The next attack on her: a good reaction parries it (no damage, and she hits back).',
  },

  // The dog (Day 2 on). It sniffs out what nobody else can (design doc), in a fight as well.
  bite: {
    id: 'bite', name: 'Bite', target: 'enemy', power: 6, kind: 'pierce', crit: 0.2,
    qte: { kind: 'key', time: 700, quick: 260, alt: { kind: 'bar', time: 900, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic attack.',
  },
  sniff: {
    id: 'sniff', name: 'Sniff', target: 'self', sp: 1, reveals: true,
    description: 'Shows what every enemy will really do this round. No feints.',
  },
  worry: {
    id: 'worry', name: 'Worry', target: 'enemy', power: 5, kind: 'pierce', sp: 3, hits: 2,
    // Hangs on and shakes: keep hold.
    qte: { kind: 'mash', presses: 7, time: 1600, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    combo: { build: 0.3, finisher: true },
    description: 'Bites and hangs on: 2 hits. Land both to knock the enemy off balance.',
  },

  // The stragglers (Day 1, the picked fields): people from elsewhere, desperate, fighting dirty.
  shank: {
    id: 'shank', name: 'Shank', target: 'enemy', power: 8, kind: 'pierce',
    // (The ring is only for the zealot's swing: designer.)
    qte: { kind: 'weave', time: 650, quick: 260, gap: 520, alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'squared', lines: ['He turns the shard in his fingers.', 'He edges closer.'] },
    description: 'A quick stab with a shard.',
  },
  grit: {
    id: 'grit', name: 'Grit', target: 'enemy', power: 2, kind: 'none', blinds: 2,
    qte: { kind: 'side', time: 700, quick: 260, alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'glance', lines: ['He scoops up a handful of dirt.', 'He crouches, one hand in the dirt.'] },
    description: 'Dirt in your eyes: for 2 rounds, dodging is harder.',
  },
  snatch: {
    id: 'snatch', name: 'Snatch', target: 'enemy', power: 6, kind: 'grab',
    qte: { kind: 'grip', time: 4200, zone: [0.36, 0.64], narrow: 0.16, tug: 0.8, keep: 0.7, quick: 2800, alt: { kind: 'mash', presses: 8, time: 1800 } },
    tell: { pose: 'reach', lines: ['He’s eyeing your satchel.', 'His hands open.'] },
    description: 'He grabs for your satchel: keep hold of it.',
  },
  club: {
    id: 'club', name: 'Club', target: 'enemy', power: 9, kind: 'strike',
    qte: { kind: 'bar', time: 1100, zone: [0.62, 0.82], sweet: [0.7, 0.74], alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'squared', lines: ['He hefts the scrap.', 'He rolls his shoulders.'] },
    description: 'A swing with a lump of scrap.',
  },
  heave: {
    id: 'heave', name: 'Heave', target: 'self', windsUp: 'crush',
    tell: { pose: 'shift', lines: ['He lifts the scrap over his head.', 'He plants his feet.'] },
    description: 'Lifts the scrap high.',
  },
  crush: {
    id: 'crush', name: 'Crush', target: 'enemy', power: 17, kind: 'strike',
    softened: { guard: 0.25, dodge: 0.08 },
    qte: { kind: 'draw', time: 420, quick: 160, wait: [700, 1400], alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['The scrap is high over his head.'] },
    description: 'Brings the scrap down with all his weight. Guard, or Sweep him before it lands.',
  },
  // The small one (Day 2): the one who cut your strap, still at it.
  pelt: {
    id: 'pelt', name: 'Pelt', target: 'enemy', power: 4, kind: 'strike', hits: 2,
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 420, lanes: ['left', 'up', 'right'], alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'cock', lines: ['The small one picks up a handful of scrap.', 'The small one weighs a bolt in one hand.'] },
    description: 'Two bits of scrap, thrown.',
  },
  pinch: {
    id: 'pinch', name: 'Pinch', target: 'enemy', power: 3, kind: 'grab', drains: 3,
    qte: { kind: 'key', time: 700, quick: 260, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    tell: { pose: 'reach', lines: ['Quick fingers, reaching for your things.', 'The small one darts in close.'] },
    description: 'Into your things while you\u2019re busy: takes 3 SP.',
  },
} satisfies Record<string, MoveDef>);

/** The scavenger, Chapter 2's lead. */
COMBATANTS.scavenger = {
  id: 'scavenger', name: 'You', sprite: 'scavenger', hp: 42, sp: 12, attack: 9, defence: 8, speed: 14,
  basic: 'jab', moves: ['sweep', 'rattle', 'brace'], reactions: ['dodge', 'parry'],
};

/** The dog (Day 2 on): quick and low. */
COMBATANTS.dog = {
  id: 'dog', name: 'The dog', sprite: 'dog', hp: 26, sp: 8, attack: 8, defence: 7, speed: 16,
  basic: 'bite', moves: ['sniff', 'worry'], reactions: ['dodge'],
};

/** The thin straggler: fast (quicker than you) and dirty, and now and then a feint. (Designer: the first fight was a little easy.) */
COMBATANTS.straggler_thin = {
  id: 'straggler_thin', name: 'The thin one', sprite: 'straggler_thin', hp: 30, attack: 8, defence: 7, speed: 15,
  moves: ['shank', 'grit', 'snatch'], weights: [3, 1.5, 2],
  weak: ['shove'], poise: 1, feint: 0.1,
  ai: { opening: ['shank', 'grit'], maxRepeat: 2, recent: 0.5, when: { hurt: { snatch: 2 }, foeGuarding: { grit: 2.5 } } },
};

/** The big straggler: slow, heavy, winds up. */
COMBATANTS.straggler_big = {
  id: 'straggler_big', name: 'The big one', sprite: 'straggler_big', hp: 48, attack: 10, defence: 9, speed: 8,
  moves: ['club', 'heave'], weights: [3, 1.2],
  weak: ['shove'], poise: 2, feint: 0,
  ai: { opening: ['club', 'heave'], maxRepeat: 2, recent: 0.6, when: { hurt: { heave: 2 }, foeHurt: { heave: 1.8 } } },
};

/**
 * Chapter 2, Day 1, the picked fields: stragglers from elsewhere come for your haul (designer). No tutorial
 * in Chapter 2 (designer): you learned to fight in Chapter 1. Tighter timing than Act 1's first fights.
 * Writes `stragglers_won`; either way the third one is gone with your finds (the story's).
 */
ENCOUNTERS.stragglers = {
  id: 'stragglers',
  name: 'Stragglers',
  party: ['scavenger'],
  enemies: ['straggler_thin', 'straggler_big'],
  stage: 'fields',
  // (Designer: first too easy, then a little too tough: between the two.)
  timing: { lunge: 950, ease: 1.2 },
  outcomes: {
    won: { stragglers_won: true },
    lost: { stragglers_won: false },
  },
};

/** The small straggler (Day 2): the one who cut your strap. Quick, weak, a thief. */
COMBATANTS.straggler_small = {
  id: 'straggler_small', name: 'The small one', sprite: 'straggler_small', hp: 22, attack: 7, defence: 6, speed: 16,
  moves: ['pelt', 'pinch'], weights: [2, 2],
  weak: ['pierce'], poise: 1, feint: 0,
  ai: { opening: ['pinch', 'pelt'], maxRepeat: 2, recent: 0.5, when: { hurt: { pelt: 2 } } },
};

/**
 * Chapter 2, Day 2, the sunk town: the same three stragglers, camped deep down, with a dog they mean to eat
 * (designer: fighting to save the dog). You and the dog, its first fight. Writes `camp_won`; either way the
 * dog comes with you (the story's).
 */
ENCOUNTERS.stragglers_camp = {
  id: 'stragglers_camp',
  name: 'The camp',
  party: ['scavenger', 'dog'],
  enemies: ['straggler_small', 'straggler_big', 'straggler_thin'],
  stage: 'camp',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: {
    won: { camp_won: true },
    lost: { camp_won: false },
  },
};

// --- Chapter 2, Part 2: the boss's son, the old scavenger, the other clan's raiders (draft numbers) ---

Object.assign(MOVES, {
  // The boss's son, sparring at the bar: showy, and he plays dirty when it's going badly.
  cheap_shot: {
    id: 'cheap_shot', name: 'Cheap shot', target: 'enemy', power: 7, kind: 'strike',
    qte: { kind: 'key', time: 700, quick: 260, alt: { kind: 'weave', time: 650, quick: 260, gap: 520 } },
    tell: { pose: 'glance', lines: ['He looks away, all innocence.', 'He grins at somebody behind you.'] },
    description: 'A quick one while you\u2019re not looking.',
  },
  showboat: {
    id: 'showboat', name: 'Showboat', target: 'self', windsUp: 'big_swing',
    tell: { pose: 'jeer', lines: ['He throws his arms wide for the room.', 'He turns to make sure his father\u2019s watching.'] },
    description: 'Plays to the room before a big one.',
  },
  big_swing: {
    id: 'big_swing', name: 'Big swing', target: 'enemy', power: 15, kind: 'strike',
    softened: { guard: 0.25, dodge: 0.08 },
    qte: { kind: 'draw', time: 420, quick: 160, wait: [700, 1400], alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['He\u2019s drawn right back.'] },
    description: 'Everything he\u2019s got, for the room. Guard, or Sweep him first.',
  },
  breather: {
    id: 'breather', name: 'Breather', target: 'self', heals: 8,
    tell: { pose: 'shift', lines: ['He backs off a step, breathing hard.', 'He wipes his mouth.'] },
    description: 'He backs off and gets his breath: some health back.',
  },

  // The old scavenger: his hook, a lifetime of dirty tricks, and he looks after you.
  hook_swipe: {
    id: 'hook_swipe', name: 'Hook', target: 'enemy', power: 6, kind: 'strike', crit: 0.1,
    qte: { kind: 'key', time: 850, quick: 320, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic attack with his hook.',
  },
  yank: {
    id: 'yank', name: 'Yank', target: 'enemy', power: 7, kind: 'grab', sp: 2, interrupts: true,
    qte: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78], alt: { kind: 'key', time: 850, quick: 320 } },
    description: 'Hooks a staff or a leg and pulls. Knocks off balance anyone weak to grabs. Interrupts a charged attack.',
  },
  patch_up: {
    id: 'patch_up', name: 'Patch up', target: 'self', sp: 3, heals: 8, healsSide: true,
    description: 'Rag and spit: both of you get some health back.',
  },

  // The other clan's raiders: staves, and they fight together.
  thrust: {
    id: 'thrust', name: 'Thrust', target: 'enemy', power: 8, kind: 'pierce',
    qte: { kind: 'weave', time: 650, quick: 260, gap: 520, alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'squared', lines: ['The staff comes level.', 'They set their feet.'] },
    description: 'The end of a staff, hard.',
  },
  whirl: {
    id: 'whirl', name: 'Whirl', target: 'enemy', power: 5, kind: 'strike', hits: 2,
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 400, lanes: ['left', 'up', 'right'], alt: { kind: 'weave', time: 650, quick: 260, gap: 520 } },
    tell: { pose: 'cock', lines: ['The staff starts to turn.', 'They spin the staff once, testing.'] },
    description: 'Two blows, one end then the other.',
  },
  mark: {
    id: 'mark', name: 'Mark', target: 'enemy', power: 2, kind: 'none', exposes: { turns: 2, mult: 1.4 },
    qte: { kind: 'key', time: 800, quick: 300, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    tell: { pose: 'reach', lines: ['The leader points the staff at you, and calls out.', 'The leader whistles, two notes.'] },
    description: 'Picks you out for the others: for 2 rounds you take more damage.',
  },
} satisfies Record<string, MoveDef>);

// She fights with her fists at the bar (designer: fists only, so no staff): her own moves without it.
Object.assign(MOVES, {
  punch: {
    id: 'punch', name: 'Punch', target: 'enemy', power: 6, kind: 'strike', crit: 0.15, poses: ['attack'],
    qte: { kind: 'key', time: 800, quick: 300, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'Basic attack.',
  },
  low_kick: {
    id: 'low_kick', name: 'Low kick', target: 'enemy', power: 6, kind: 'shove', sp: 2, crit: 0.2, interrupts: true, poses: ['shove'],
    qte: { kind: 'bar', time: 1100, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'key', time: 800, quick: 300 } },
    description: 'Takes his legs. Knocks him off balance. Interrupts a charged attack.',
  },
  combination: {
    id: 'combination', name: 'Combination', target: 'enemy', power: 4, kind: 'strike', sp: 3, hits: 3, poses: ['slap', 'palm', 'attack'],
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 360, alt: { kind: 'carve', time: 2400, quick: 1200 } },
    combo: { build: 0.25, finisher: true },
    description: '3 quick punches, each harder than the last. Land all 3 to knock him off balance.',
  },
  read_him: {
    id: 'read_him', name: 'Read him', target: 'self', sp: 4, braces: true, poses: ['guard'],
    description: 'Watch him close: his next attack, a good reaction parries it (no damage, and she hits back).',
  },
} satisfies Record<string, MoveDef>);

/** The scavenger without her staff (the sparring at the bar: fists only). */
COMBATANTS.scavenger_fists = {
  id: 'scavenger_fists', name: 'You', sprite: 'scavenger_fists', hp: 42, sp: 12, attack: 9, defence: 8, speed: 14,
  basic: 'punch', moves: ['low_kick', 'combination', 'read_him'], reactions: ['dodge', 'parry'],
};

/** The boss's son: your age, jealous of your rise (design doc). Sparring at the bar. */
COMBATANTS.boss_son = {
  id: 'boss_son', name: 'The boss\u2019s son', sprite: 'boss_son', hp: 48, attack: 9, defence: 8, speed: 13,
  moves: ['cheap_shot', 'showboat', 'breather'], weights: [3, 1.4, 0.8],
  weak: ['shove'], poise: 2, feint: 0.2,
  ai: { opening: ['cheap_shot', 'showboat'], maxRepeat: 2, recent: 0.5, when: { hurt: { breather: 3, cheap_shot: 1.5 }, foeHurt: { showboat: 2 } } },
};

/** The old scavenger, beside you on the raid. */
COMBATANTS.old_scav = {
  id: 'old_scav', name: 'The old scavenger', sprite: 'old_scav', hp: 34, sp: 9, attack: 8, defence: 9, speed: 9,
  basic: 'hook_swipe', moves: ['yank', 'patch_up'], reactions: ['dodge'],
};

/** One of the other clan's raiders. */
COMBATANTS.raider = {
  id: 'raider', name: 'Raider', sprite: 'raider', hp: 30, attack: 9, defence: 8, speed: 12,
  moves: ['thrust', 'whirl'], weights: [2, 1.5],
  weak: ['grab'], poise: 1, feint: 0.15,
  ai: { maxRepeat: 2, recent: 0.5 },
};

/** The raiders' leader: marks you out for the others. */
COMBATANTS.raider_lead = {
  id: 'raider_lead', name: 'Their leader', sprite: 'raider_lead', hp: 46, attack: 10, defence: 9, speed: 11,
  moves: ['mark', 'thrust', 'whirl'], weights: [1.5, 2, 1.5],
  weak: ['grab'], poise: 2, feint: 0.1,
  ai: { opening: ['mark', 'thrust'], maxRepeat: 2, recent: 0.5 },
};

/** Chapter 2, Day 4, the bar: the boss's son wants to see what you've got. You alone. Writes `spar_won`. */
ENCOUNTERS.son_spar = {
  id: 'son_spar',
  name: 'The boss\u2019s son',
  party: ['scavenger_fists'],
  enemies: ['boss_son'],
  stage: 'bar',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { spar_won: true }, lost: { spar_won: false } },
};

/** Chapter 2, Day 5, the picked fields: the first rival raid, you and the old scavenger. Writes `raid_won`. */
ENCOUNTERS.first_raid = {
  id: 'first_raid',
  name: 'The raid',
  party: ['scavenger', 'old_scav'],
  enemies: ['raider', 'raider_lead', 'raider'],
  stage: 'fields',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { raid_won: true }, lost: { raid_won: false } },
};

// --- Chapter 2, Part 3: the den's debt collectors, and the angry pickers (draft numbers) ---

Object.assign(MOVES, {
  // The debt collectors: the house's men. One talks and goes through your pockets; one hits.
  shakedown: {
    id: 'shakedown', name: 'Shakedown', target: 'enemy', power: 5, kind: 'grab', saps: { turns: 2, mult: 0.7 },
    qte: { kind: 'grip', time: 3800, zone: [0.36, 0.64], narrow: 0.16, tug: 0.8, keep: 0.7, quick: 2600, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    tell: { pose: 'reach', lines: ['He smiles, and reaches for your collar.', '"Let’s see what you’re carrying."'] },
    description: 'A fist in your gut and a hand in your pockets: for 2 rounds you hit softer.',
  },
  backhand: {
    id: 'backhand', name: 'Backhand', target: 'enemy', power: 6, kind: 'strike',
    qte: { kind: 'side', time: 650, quick: 250, alt: { kind: 'key', time: 750, quick: 280 } },
    tell: { pose: 'glance', lines: ['He looks bored.', 'He sighs, and flexes his hand.'] },
    description: 'The back of his hand, without looking.',
  },
  cosh: {
    id: 'cosh', name: 'Cosh', target: 'enemy', power: 10, kind: 'strike',
    qte: { kind: 'bar', time: 1100, zone: [0.62, 0.82], sweet: [0.7, 0.74], alt: { kind: 'draw', time: 460, quick: 180, wait: [600, 1200] } },
    tell: { pose: 'squared', lines: ['He taps the cosh on his palm.', 'He steps in, cosh low.'] },
    description: 'A short, heavy club.',
  },
  make_example: {
    id: 'make_example', name: 'Make an example', target: 'self', windsUp: 'example',
    tell: { pose: 'shift', lines: ['He turns to the room, so they can all see.', '"Watch this, everyone."'] },
    description: 'He makes sure the whole den is watching.',
  },
  example: {
    id: 'example', name: 'The example', target: 'enemy', power: 16, kind: 'strike',
    softened: { guard: 0.3, dodge: 0.1 },
    qte: { kind: 'balance', time: 1800, zone: [0.36, 0.64], keep: 0.6, keepPerfect: 0.9, alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['The cosh is right back over his shoulder.'] },
    description: 'For the room. Guard, or Sweep him before it lands.',
  },

  // The angry pickers: your own people. Untrained, desperate, and braver together.
  pile_in: {
    id: 'pile_in', name: 'Pile in', target: 'enemy', power: 4, kind: 'strike', mob: 0.35,
    qte: { kind: 'notes', outer: 190, perfect: 75, gap: 440, lanes: ['left', 'up', 'right'], alt: { kind: 'key', time: 800, quick: 300 } },
    tell: { pose: 'cock', lines: ['They look at each other, and come on together.', '"All of us. Go on!"'] },
    description: 'They all pile in: harder for every one of them still standing.',
  },
  hurl: {
    id: 'hurl', name: 'Hurl', target: 'enemy', power: 6, kind: 'pierce',
    qte: { kind: 'key', time: 750, quick: 280, alt: { kind: 'weave', time: 650, quick: 260, gap: 520 } },
    tell: { pose: 'glance', lines: ['A hand goes down for a stone.', '"Rat!"'] },
    description: 'A stone from the yard.',
  },
  drag: {
    id: 'drag', name: 'Drag', target: 'enemy', power: 5, kind: 'grab', hits: 2,
    qte: { kind: 'mash', presses: 7, time: 1700, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    tell: { pose: 'reach', lines: ['Hands out for your hair, your strap.', 'They lunge for your satchel.'] },
    description: 'Hands on you, pulling you down: 2 hits.',
  },
} satisfies Record<string, MoveDef>);

/** The talker: goes through your pockets while he hits you. */
COMBATANTS.collector = {
  id: 'collector', name: 'The talker', sprite: 'collector', hp: 34, attack: 9, defence: 8, speed: 13,
  moves: ['shakedown', 'backhand'], weights: [1.6, 2.4],
  weak: ['shove'], poise: 1, feint: 0.15,
  ai: { opening: ['shakedown', 'backhand'], maxRepeat: 2, recent: 0.5, when: { foeGuarding: { shakedown: 2 } } },
};

/** The muscle: heavy, slow, and he likes an audience. */
COMBATANTS.collector_big = {
  id: 'collector_big', name: 'The muscle', sprite: 'collector_big', hp: 52, attack: 11, defence: 10, speed: 7,
  moves: ['cosh', 'make_example'], weights: [3, 1.2],
  weak: ['pierce'], poise: 2, feint: 0,
  ai: { opening: ['cosh', 'make_example'], maxRepeat: 2, recent: 0.6, when: { hurt: { make_example: 2 }, foeHurt: { make_example: 1.8 } } },
};

/**
 * Chapter 2, Day 7, the gambling den: the house's debt collectors, come for the gambler (or for you, if you
 * walked away: "Friend of his? Then you can pay."). You alone. Writes `collectors_won`.
 */
ENCOUNTERS.debt_collectors = {
  id: 'debt_collectors',
  name: 'The house’s men',
  party: ['scavenger'],
  enemies: ['collector', 'collector_big'],
  stage: 'den',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { collectors_won: true }, lost: { collectors_won: false } },
};

/** A picker off the fields: thin, angry, and not a fighter. */
COMBATANTS.picker = {
  id: 'picker', name: 'Picker', sprite: 'picker', hp: 20, attack: 8, defence: 6, speed: 11,
  moves: ['pile_in', 'hurl', 'drag'], weights: [2.5, 1.5, 1.5],
  weak: ['strike'], poise: 1, feint: 0,
  ai: { maxRepeat: 2, recent: 0.5 },
};

/** The one who started it: louder, and with a shard. */
COMBATANTS.picker_loud = {
  id: 'picker_loud', name: 'The loud one', sprite: 'picker_loud', hp: 30, attack: 9, defence: 7, speed: 12,
  moves: ['pile_in', 'hurl', 'drag'], weights: [2, 2, 1.5],
  weak: ['shove'], poise: 1, feint: 0.1,
  ai: { opening: ['hurl', 'pile_in'], maxRepeat: 2, recent: 0.5 },
};

/**
 * Chapter 2, Day 7, the swap yard at night: pickers who think you're the rat, waiting for you on the way
 * home. Your own people (the first fight against your own side). Writes `ambush_won`.
 */
ENCOUNTERS.angry_pickers = {
  id: 'angry_pickers',
  name: 'Your own people',
  party: ['scavenger'],
  enemies: ['picker', 'picker_loud', 'picker'],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { ambush_won: true }, lost: { ambush_won: false } },
};

// The sunk town's tickers: small, shelled, clicking things from the old machines. Your staff skids off the
// casing; the dog's teeth find the joints.
Object.assign(MOVES, {
  latch: {
    id: 'latch', name: 'Latch', target: 'enemy', power: 3, kind: 'pierce', clings: { turns: 3, power: 3 },
    qte: { kind: 'hold', time: 1000, zone: [0.62, 0.84], sweet: [0.7, 0.76], alt: { kind: 'key', time: 750, quick: 280 } },
    tell: { pose: 'squared', lines: ['It goes very still, and clicks once.', 'Its legs bunch under it.'] },
    description: 'It latches on and hangs there, gnawing every round: guard to shake it off.',
  },
  skitter: {
    id: 'skitter', name: 'Skitter', target: 'enemy', power: 5, kind: 'pierce', hits: 2,
    qte: { kind: 'weave', time: 600, quick: 240, gap: 480, alt: { kind: 'notes', outer: 180, perfect: 70, gap: 400 } },
    tell: { pose: 'cock', lines: ['Click-click-click.', 'It runs a fast circle round you.'] },
    description: 'In and out, two quick nips.',
  },
} satisfies Record<string, MoveDef>);

/** A ticker: low, shelled, quick. Strikes skid off it; teeth and points get in. */
COMBATANTS.ticker = {
  id: 'ticker', name: 'Ticker', sprite: 'ticker', hp: 22, attack: 8, defence: 9, speed: 14,
  moves: ['skitter', 'latch'], weights: [2, 1.4],
  weak: ['pierce'], resists: ['strike'], poise: 1, feint: 0.1,
  ai: { maxRepeat: 2, recent: 0.5, when: { foeGuarding: { skitter: 2 } } },
};

/**
 * Chapter 2, Day 7, dawn in the sunk town: the tickers, nested down where the lost picker went (or where
 * nobody goes). You and the dog. Writes `tickers_won`.
 */
ENCOUNTERS.tickers = {
  id: 'tickers',
  name: 'Something in the dark',
  party: ['scavenger', 'dog'],
  enemies: ['ticker', 'ticker', 'ticker'],
  stage: 'camp',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { tickers_won: true }, lost: { tickers_won: false } },
};

// --- Chapter 2, Day 8: the son's rematch at dawn, and the drop's guards in the deep ground (draft numbers) ---

Object.assign(MOVES, {
  // The son, with a length of pipe this time, and nobody watching.
  pipe: {
    id: 'pipe', name: 'Pipe', target: 'enemy', power: 9, kind: 'strike',
    qte: { kind: 'bar', time: 1050, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'side', time: 650, quick: 250 } },
    tell: { pose: 'squared', lines: ['He swings the pipe loose from his wrist.', 'He grips the pipe in both hands.'] },
    description: 'A length of pipe, swung hard.',
  },
  // The other clan's drop guards: staves, and they look after each other.
  low_sweep: {
    id: 'low_sweep', name: 'Low sweep', target: 'enemy', power: 7, kind: 'shove',
    qte: { kind: 'side', time: 620, quick: 240, alt: { kind: 'weave', time: 650, quick: 260, gap: 520 } },
    tell: { pose: 'cock', lines: ['The staff drops low, towards your ankles.', 'They crouch, staff level with the dirt.'] },
    description: 'The staff along the ground, at your legs.',
  },
  ward: {
    id: 'ward', name: 'Ward', target: 'self', wards: true,
    tell: { pose: 'shift', lines: ['One plants the staff in front of the other.', 'They close up, staves crossed.'] },
    description: 'Plants the staff in front of the other: they’re guarded until their next turn.',
  },
} satisfies Record<string, MoveDef>);

/** The boss's son at dawn, with a pipe: the rematch nobody's betting on. */
COMBATANTS.boss_son_pipe = {
  id: 'boss_son_pipe', name: 'The boss’s son', sprite: 'boss_son', hp: 52, attack: 10, defence: 8, speed: 13,
  moves: ['pipe', 'cheap_shot', 'showboat'], weights: [3, 2, 1.2],
  weak: ['shove'], poise: 2, feint: 0.2,
  ai: { opening: ['pipe', 'cheap_shot'], maxRepeat: 2, recent: 0.5, when: { foeHurt: { showboat: 2 } } },
};

/** Chapter 2, Day 8, dawn in the scrap stacks: the son caught you trying to slip past. You alone. Writes `rematch_won`. */
ENCOUNTERS.son_rematch = {
  id: 'son_rematch',
  name: 'The boss’s son',
  party: ['scavenger'],
  enemies: ['boss_son_pipe'],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { rematch_won: true }, lost: { rematch_won: false } },
};

/** One of the other clan's guards on the drop. */
COMBATANTS.drop_guard = {
  id: 'drop_guard', name: 'Drop guard', sprite: 'raider', hp: 34, attack: 9, defence: 9, speed: 11,
  moves: ['thrust', 'low_sweep', 'ward'], weights: [2, 2, 1.2],
  weak: ['grab'], poise: 1, feint: 0.15,
  ai: { opening: ['low_sweep', 'thrust'], maxRepeat: 2, recent: 0.5, when: { hurt: { ward: 2 } } },
};

/** Chapter 2, Day 8, the deep ground: two of the other clan, come to check their drop. You and the dog. Writes `guards_won`. */
ENCOUNTERS.drop_guards = {
  id: 'drop_guards',
  name: 'The drop',
  party: ['scavenger', 'dog'],
  enemies: ['drop_guard', 'drop_guard'],
  stage: 'fields',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { guards_won: true }, lost: { guards_won: false } },
};

// --- Chapter 2, Day 9: the night watch at the rival line, and the scout (draft numbers) ---

Object.assign(MOVES, {
  // The scout: small, fast, never where you hit.
  cut: {
    id: 'cut', name: 'Cut', target: 'enemy', power: 6, kind: 'pierce', crit: 0.15,
    qte: { kind: 'key', time: 650, quick: 240, alt: { kind: 'weave', time: 600, quick: 240, gap: 480 } },
    tell: { pose: 'squared', lines: ['The blade flicks out.', 'They come in low.'] },
    description: 'A quick cut with a short blade.',
  },
  slip: {
    id: 'slip', name: 'Slip', target: 'self', evades: true,
    tell: { pose: 'shift', lines: ['They stay light on their feet, watching your hands.', 'They sway, loose, ready.'] },
    description: 'Ready to slip your next blow outright, unless the dog sniffs them out first.',
  },
  dust: {
    id: 'dust', name: 'Dust', target: 'enemy', power: 2, kind: 'none', silences: 2,
    qte: { kind: 'side', time: 650, quick: 250, alt: { kind: 'key', time: 750, quick: 280 } },
    tell: { pose: 'glance', lines: ['A fist closes on a handful of dirt.', 'They glance at the dog.'] },
    description: 'Dirt in the face: for 2 rounds, no skills.',
  },
  // (Day 9, if you took the note off their drop: they want it back.)
  grab_satchel: {
    id: 'grab_satchel', name: 'For the satchel', target: 'enemy', power: 5, kind: 'grab', hits: 2,
    qte: { kind: 'grip', time: 3600, zone: [0.36, 0.64], narrow: 0.16, tug: 0.85, keep: 0.7, quick: 2400, alt: { kind: 'mash', presses: 8, time: 1700 } },
    tell: { pose: 'reach', lines: ['Their eyes go to your satchel.', '"Where is it? Give it here!"'] },
    description: 'Both hands on your satchel, for the note: 2 hits. Keep hold.',
  },
} satisfies Record<string, MoveDef>);

/** The other clan's scout (Day 9): quick and slippery. The drop changes them (the encounter's variants). */
COMBATANTS.scout = {
  id: 'scout', name: 'The scout', sprite: 'scout', hp: 40, attack: 9, defence: 8, speed: 17,
  moves: ['cut', 'slip', 'dust'], weights: [3, 1.5, 1.4],
  weak: ['grab'], poise: 1, feint: 0.25,
  ai: { opening: ['slip', 'cut'], maxRepeat: 2, recent: 0.5, when: { hurt: { slip: 2 }, foeGuarding: { dust: 2 } } },
};
/** You swapped the drop: they went to row five for nothing. Angry: hit harder, guard less, no time for tricks. */
COMBATANTS.scout_angry = { ...COMBATANTS.scout, id: 'scout_angry', attack: 12, defence: 6, feint: 0, weights: [4, 0.8, 1.2] };
/** You watched them collect it: you know their face, and their tricks. No feints. */
COMBATANTS.scout_known = { ...COMBATANTS.scout, id: 'scout_known', feint: 0 };
/** You took the note: they want it back. */
COMBATANTS.scout_desperate = { ...COMBATANTS.scout, id: 'scout_desperate', moves: ['cut', 'slip', 'grab_satchel'], weights: [2.5, 1.2, 2.5] };

/** The scout cornered on the kid's perch, you and the dog. Writes `scout_won`. Variants by the drop (`c2day9_cornered`). */
const scoutFight = (id: string, enemy: string): EncounterDef => ({
  id,
  name: 'The scout',
  party: ['scavenger', 'dog'],
  enemies: [enemy],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { scout_won: true }, lost: { scout_won: false } },
});
ENCOUNTERS.scout_fight = scoutFight('scout_fight', 'scout');
ENCOUNTERS.scout_angry = scoutFight('scout_angry', 'scout_angry');
ENCOUNTERS.scout_known = scoutFight('scout_known', 'scout_known');
ENCOUNTERS.scout_desperate = scoutFight('scout_desperate', 'scout_desperate');

/** Chapter 2, Day 9, the rival line at night: two of the other clan through the dip, on your watch. You and the dog. Writes `line_won`. */
ENCOUNTERS.line_raid = {
  id: 'line_raid',
  name: 'The line',
  party: ['scavenger', 'dog'],
  enemies: ['raider', 'raider'],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { line_won: true }, lost: { line_won: false } },
};

// --- Chapter 2, Day 10: the circle's men, the enforcer, and the son on your side (draft numbers) ---

/** One of the boss's circle, sent to do a job. */
COMBATANTS.circle_man = { ...COMBATANTS.collector!, id: 'circle_man', name: 'One of the circle' };
/** The bigger one, with a cosh. */
COMBATANTS.circle_man_big = { ...COMBATANTS.collector_big!, id: 'circle_man_big', name: 'One of the circle' };

/** Chapter 2, Day 10, up the scrap stacks: the circle's men come for your brother and the kid. You alone. Writes `circle_won10`. */
ENCOUNTERS.circle_men = {
  id: 'circle_men',
  name: 'The boss\u2019s men',
  party: ['scavenger'],
  enemies: ['circle_man', 'circle_man_big'],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { circle_won10: true }, lost: { circle_won10: false } },
};

/** Chapter 2, Day 10, your shack: your brother brings the circle's men to take the dog. You and the dog. Writes `circle_won10`. */
ENCOUNTERS.circle_men_dog = { ...ENCOUNTERS.circle_men!, id: 'circle_men_dog', party: ['scavenger', 'dog'] };

Object.assign(MOVES, {
  // The enforcer: slow, enormous, and he doesn't care what you're holding up in front of you.
  maul: {
    id: 'maul', name: 'Maul', target: 'enemy', power: 11, kind: 'strike',
    qte: { kind: 'bar', time: 1150, zone: [0.62, 0.82], sweet: [0.7, 0.74], alt: { kind: 'side', time: 700, quick: 260 } },
    tell: { pose: 'squared', lines: ['He rolls his shoulders.', 'He comes forward, fists low.'] },
    description: 'A fist like a lump of scrap.',
  },
  square_up: {
    id: 'square_up', name: 'Square up', target: 'self', windsUp: 'crusher',
    tell: { pose: 'shift', lines: ['He sets his feet, and lets you see him do it.', '"Hold still."'] },
    description: 'He sets himself for the big one.',
  },
  crusher: {
    id: 'crusher', name: 'Crusher', target: 'enemy', power: 19, kind: 'strike',
    softened: { guard: 0.55, dodge: 0.1 },
    qte: { kind: 'draw', time: 420, quick: 160, wait: [800, 1500], alt: { kind: 'bar', time: 1300, zone: [0.72, 0.86], sweet: [0.77, 0.81] } },
    tell: { pose: 'windup', lines: ['He\u2019s brought both fists right back over his head.'] },
    description: 'Straight through anything you hold up: guarding barely helps. Dodge it, or knock him off his feet first.',
  },
  throttle: {
    id: 'throttle', name: 'Throttle', target: 'enemy', power: 6, kind: 'grab', silences: 2,
    qte: { kind: 'grip', time: 3600, zone: [0.36, 0.64], narrow: 0.16, tug: 0.9, keep: 0.7, quick: 2600, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    tell: { pose: 'reach', lines: ['His hand opens, wide as your face.', 'He reaches for your throat.'] },
    description: 'A hand round your throat: for 2 rounds, no skills.',
  },

  // The boss's son, on your side: his pipe, and his dirty tricks, for once at somebody else.
  son_pipe: {
    id: 'son_pipe', name: 'Pipe', target: 'enemy', power: 7, kind: 'strike',
    qte: { kind: 'bar', time: 1050, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'key', time: 800, quick: 300 } },
    description: 'Basic attack with his pipe.',
  },
  low_blow: {
    id: 'low_blow', name: 'Low blow', target: 'enemy', power: 9, kind: 'shove', sp: 3, crit: 0.3, interrupts: true,
    qte: { kind: 'key', time: 700, quick: 260, alt: { kind: 'weave', time: 650, quick: 260, gap: 520 } },
    description: 'Something his father would be ashamed of. Knocks off balance anyone weak to shoves; interrupts a big swing.',
  },
  get_up: {
    id: 'get_up', name: 'Get up', target: 'self', sp: 3, heals: 10,
    description: 'He spits, and gets up again: some health back.',
  },
} satisfies Record<string, MoveDef>);

/** The enforcer, at your table, at night. */
COMBATANTS.enforcer = {
  id: 'enforcer', name: 'The enforcer', sprite: 'enforcer', hp: 92, attack: 12, defence: 11, speed: 8,
  moves: ['maul', 'square_up', 'throttle'], weights: [3, 1.2, 1.4],
  weak: ['shove'], resists: ['strike'], poise: 3, feint: 0.05,
  ai: { opening: ['maul', 'throttle'], maxRepeat: 2, recent: 0.5, when: { hurt: { square_up: 2 }, foeGuarding: { square_up: 2.5 } } },
};

/** The boss's son, beside you (from behind, his pipe in hand). */
COMBATANTS.son_ally = {
  id: 'son_ally', name: 'The boss\u2019s son', sprite: 'son_back', hp: 46, sp: 9, attack: 10, defence: 8, speed: 13,
  basic: 'son_pipe', moves: ['low_blow', 'get_up'], reactions: ['dodge'],
};

/**
 * Chapter 2, Day 10, your shack at night: the enforcer and two of the circle come for you and the dog, and
 * the boss's son stands with you (designer: the son turns). Writes `enforcer_won`.
 */
ENCOUNTERS.enforcer_night = {
  id: 'enforcer_night',
  name: 'The enforcer',
  party: ['scavenger', 'dog', 'son_ally'],
  enemies: ['circle_man', 'enforcer', 'circle_man_big'],
  stage: 'yard',
  timing: { lunge: 950, ease: 1.2 },
  outcomes: { won: { enforcer_won: true }, lost: { enforcer_won: false } },
};
