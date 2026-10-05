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
    id: 'shove', name: 'Shove', target: 'enemy', power: 8, kind: 'shove', sp: 2, crit: 0.25,
    description: 'Both hands. Good odds of knocking him off his feet.',
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
  swing: {
    id: 'swing', name: 'Swing', target: 'enemy', power: 9, kind: 'strike', reaction: { dodge: 260, parry: 110 },
    description: 'A wild swing.',
  },
  wind_up: {
    id: 'wind_up', name: 'Wind up', target: 'self', windsUp: 'haymaker',
    description: 'Draws back for a big one.',
  },
  haymaker: {
    id: 'haymaker', name: 'Haymaker', target: 'enemy', power: 18, kind: 'strike', reaction: { dodge: 200, parry: 80 },
    description: 'Everything he has.',
  },
  jeer: {
    id: 'jeer', name: 'Jeer', target: 'self',
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
    moves: ['swing', 'wind_up', 'jeer'], weights: [4, 2, 1],
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
    // The first fight: the ring closes slowly (1.6s) and the dodge band is twice as wide. Later fights
    // can close faster and narrower.
    timing: { lunge: 1600, ease: 2 },
    outcomes: {
      won: { fight_won: true },
      lost: { fight_won: false },
      held_back: { fight_won: false, held_back: true },
    },
  },
};
