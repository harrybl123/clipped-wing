import type { CombatantDef, EncounterDef, ItemDef, MoveDef } from '../systems/Combat';

// Combat data (docs/combat-design.md): moves, items, fighters and fights, run by src/systems/Combat.ts
// and shown by CombatScene. No levelling: a lead's skills are what the story has given them so far, and
// their numbers are set here. Names and descriptions are placeholders until the designer's text;
// numbers are a first pass to playtest.

export const MOVES: Record<string, MoveDef> = {
  // --- The carver. His basic attack is weak: he can't make a proper fist. The scrappy moves are skills.
  // Each has a QTE (src/systems/qte.ts): good ×1.3, perfect ×1.6; a miss glances off (×0.6).
  slap: {
    id: 'slap', name: 'Slap', target: 'enemy', power: 6, kind: 'strike', crit: 0.1,
    qte: { kind: 'key', time: 900, quick: 350, alt: { kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] } },
    description: 'An open hand. You can’t make a fist.',
  },
  shove: {
    id: 'shove', name: 'Shove', target: 'enemy', power: 8, kind: 'shove', sp: 2, crit: 0.25, interrupts: true,
    qte: { kind: 'bar', time: 1100, zone: [0.6, 0.8], sweet: [0.68, 0.72], alt: { kind: 'key', time: 900, quick: 350 } },
    description: 'Both hands. Can throw him off balance, and breaks a big swing before it comes.',
  },
  grab: {
    id: 'grab', name: 'Grab', target: 'enemy', power: 10, kind: 'grab', sp: 4,
    qte: { kind: 'carve', strokes: 3, time: 2400, quick: 1200, alt: { kind: 'hold', time: 1000, zone: [0.65, 0.85], sweet: [0.72, 0.78] } },
    description: 'Get hold and drag him down.',
  },
  // Three open-handed blows (no fist: a jab with the fingers, a slap, the heel of the bandaged hand), a
  // note for each; each one you land makes the next harder, and all three throw him off balance.
  one_two_three: {
    id: 'one_two_three', name: '1, 2, 3!', target: 'enemy', power: 4, kind: 'strike', sp: 3, hits: 3,
    qte: { kind: 'notes', outer: 180, perfect: 70, gap: 380, alt: { kind: 'carve', time: 2400, quick: 1200 } },
    combo: { build: 0.25, finisher: true },
    poses: ['attack', 'slap', 'palm'],
    description: 'Jab, slap, palm: press each arrow as it lands. All three throw him off balance.',
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
    qte: { kind: 'grip', time: 3000, zone: [0.36, 0.64], narrow: 0.16, tug: 0.5, keep: 0.42, quick: 1800, alt: { kind: 'mash', presses: 8, time: 1800 } },
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

/** A second, weaker young man, for trying fights with more than one enemy (a test, not in the story). */
COMBATANTS.lackey = {
  id: 'lackey', name: 'His friend', sprite: 'lackey', hp: 26, attack: 8, defence: 8, speed: 9,
  moves: ['swing', 'hook', 'jeer'], weights: [2, 2, 1], weak: ['shove'], poise: 1, feint: 0,
  ai: { maxRepeat: 2, when: { hurt: { jeer: 0 } } },
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
    outcomes: {
      won: { fight_won: true },
      lost: { fight_won: false },
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
