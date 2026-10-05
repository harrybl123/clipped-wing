import type { CombatantDef, EncounterDef, ItemDef, MoveDef } from '../systems/Combat';

// Combat data (docs/combat-design.md): moves, items, fighters and fights, run by src/systems/Combat.ts
// and shown by CombatScene. No levelling: a lead's skills are what the story has given them so far, and
// their numbers are set here. Names and descriptions are placeholders until the designer's text;
// numbers are a first pass to playtest.

export const MOVES: Record<string, MoveDef> = {
  // --- The carver. His basic attack is weak: he can't make a proper fist. The scrappy moves are skills. ---
  slap: {
    id: 'slap', name: 'Slap', target: 'enemy', power: 6, kind: 'strike', crit: 0.1,
    description: 'An open hand. You can’t make a fist.',
  },
  shove: {
    id: 'shove', name: 'Shove', target: 'enemy', power: 8, kind: 'shove', sp: 2, crit: 0.25, interrupts: true,
    description: 'Both hands. Can throw him off balance, and breaks a big swing before it comes.',
  },
  grab: {
    id: 'grab', name: 'Grab', target: 'enemy', power: 10, kind: 'grab', sp: 4,
    description: 'Get hold and drag him down.',
  },
  hold_back: {
    id: 'hold_back', name: 'Hold back', target: 'self', ends: 'held_back',
    description: 'Stop. Let him have it.',
  },

  // --- The young zealot (the market scrap). ---
  // Each has a tell: the pose he takes as the round starts, and a vague line (PLACEHOLDER text). Swing and
  // flurry share a pose, so watch the line too. Reaction times are ms before the blow lands: the band
  // runs from `dodge` in to `late`.
  swing: {
    id: 'swing', name: 'Swing', target: 'enemy', power: 9, kind: 'strike',
    reaction: { kind: 'ring', dodge: 400, late: 130, parry: 70 },
    tell: { pose: 'squared', lines: ['He squares up.', 'He shifts his weight forward.'] },
    description: 'A wild swing.',
  },
  hook: {
    id: 'hook', name: 'Hook', target: 'enemy', power: 10, kind: 'strike',
    reaction: { kind: 'side', dodge: 400, late: 130, parry: 70 },
    tell: { pose: 'cock', lines: ['He drops a shoulder.', 'He shifts his weight.'] },
    description: 'A looping swing from one side. Dodge the other way.',
  },
  flurry: {
    id: 'flurry', name: 'Flurry', target: 'enemy', power: 5, kind: 'strike', hits: 2,
    reaction: { kind: 'rhythm', dodge: 330, late: 120, parry: 60 },
    tell: { pose: 'squared', lines: ['He bounces on his toes.', 'He squares up.'] },
    description: 'Two quick ones.',
  },
  collar: {
    id: 'collar', name: 'Collar', target: 'enemy', power: 8, kind: 'grab',
    reaction: { kind: 'mash', presses: 8, time: 1800 },
    tell: { pose: 'reach', lines: ['He’s eyeing your collar.', 'He opens his hands.'] },
    description: 'He gets hold of you and shakes you.',
  },
  wind_up: {
    id: 'wind_up', name: 'Wind up', target: 'self', windsUp: 'haymaker',
    tell: { pose: 'shift', lines: ['He shifts his weight back.', 'He breathes hard through his nose.'] },
    description: 'Draws back for a big one.',
  },
  haymaker: {
    id: 'haymaker', name: 'Haymaker', target: 'enemy', power: 18, kind: 'strike',
    reaction: { kind: 'ring', dodge: 330, late: 130, parry: 60 },
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
    basic: 'slap', moves: ['shove', 'grab', 'hold_back'], reactions: ['dodge'],
  },
  zealot: {
    id: 'zealot', name: 'The young man', sprite: 'zealot', hp: 45, attack: 10, defence: 9, speed: 10,
    moves: ['swing', 'hook', 'flurry', 'collar', 'wind_up', 'jeer'], weights: [3, 2, 2, 1, 2, 1],
    // The first fight: his tells never lie.
    feint: 0,
    // (suggestion) He's never been held: grabs throw him; two before he recovers floor him.
    weak: ['grab'], poise: 2,
  },
};

export const ENCOUNTERS: Record<string, EncounterDef> = {
  /**
   * Day 4 afternoon at the market (design doc). No running (Hold back is the way out). What follows is
   * the story's: ink reads these (win: suspicion jumps; lose: hurt, less food; hold back: Mum sees it).
   */
  market_scrap: {
    id: 'market_scrap',
    party: ['carver'],
    enemies: ['zealot'],
    // The first fight: the ring takes a second to close and the band is a third wider than the moves
    // say. Later fights can close faster and narrower.
    timing: { lunge: 1000, ease: 1.3 },
    outcomes: {
      won: { fight_won: true },
      lost: { fight_won: false },
      held_back: { fight_won: false, held_back: true },
    },
  },
};
