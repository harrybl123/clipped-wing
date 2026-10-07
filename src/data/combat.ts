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

export type Lesson = 'turns' | 'tells' | 'react' | 'offBalance' | 'windUp' | 'allies' | 'parry';

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
  parry: 'React perfectly to parry: you take no damage and hit back.',
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
  brace: {
    id: 'brace', name: 'Brace', target: 'self', sp: 2, braces: true, poses: ['guard'],
    description: 'Until her next turn, a good reaction parries too: no damage, and she hits back.',
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

/** The thin straggler: fast and dirty. Shows you a feint now and then. */
COMBATANTS.straggler_thin = {
  id: 'straggler_thin', name: 'The thin one', sprite: 'straggler_thin', hp: 26, attack: 8, defence: 7, speed: 13,
  moves: ['shank', 'grit', 'snatch'], weights: [3, 1.5, 2],
  weak: ['shove'], poise: 1, feint: 0,
  ai: { opening: ['shank', 'grit'], maxRepeat: 2, recent: 0.5, when: { hurt: { snatch: 2 }, foeGuarding: { grit: 2.5 } } },
};

/** The big straggler: slow, heavy, winds up. */
COMBATANTS.straggler_big = {
  id: 'straggler_big', name: 'The big one', sprite: 'straggler_big', hp: 42, attack: 10, defence: 9, speed: 8,
  moves: ['club', 'heave'], weights: [3, 1.2],
  weak: ['shove'], poise: 2, feint: 0,
  ai: { opening: ['club', 'heave'], maxRepeat: 2, recent: 0.6, when: { hurt: { heave: 2 }, foeHurt: { heave: 1.8 } } },
};

/**
 * Chapter 2, Day 1, the picked fields: stragglers from elsewhere come for your haul (designer). Your first
 * fight as the scavenger, so it teaches the basics, and the parry. Writes `stragglers_won`; either way the
 * third one is gone with your finds (the story's).
 */
ENCOUNTERS.stragglers = {
  id: 'stragglers',
  name: 'Stragglers',
  party: ['scavenger'],
  enemies: ['straggler_thin', 'straggler_big'],
  stage: 'fields',
  timing: { lunge: 1000, ease: 1.3 },
  teaches: ['turns', 'tells', 'react', 'parry', 'offBalance', 'windUp'],
  outcomes: {
    won: { stragglers_won: true },
    lost: { stragglers_won: false },
  },
};
