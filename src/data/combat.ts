import type { CombatantDef, EncounterDef, MoveDef } from '../systems/Combat';

// Combat data (docs/combat-design.md): moves, combatants and encounters, run by src/systems/Combat.ts
// and shown by CombatScene. No levelling: new moves and gear come from the story, so a lead's move list
// is what the story has given them so far. Names and descriptions are placeholders until the designer's
// text; numbers are a first pass to playtest.

export const MOVES: Record<string, MoveDef> = {
  // --- The carver: scrappy, thumbless. No punches: you can't make a proper fist. ---
  dodge: {
    id: 'dodge', name: 'Dodge', target: 'self', guard: 1.6,
    description: 'Watch him. Easier to dodge or parry until your next turn.',
  },
  shove: {
    id: 'shove', name: 'Shove', target: 'enemy', damage: 1, interrupts: true,
    description: 'Push him back. Breaks a wind-up and leaves him open.',
  },
  grab: {
    id: 'grab', name: 'Grab', target: 'enemy', damage: 3, needsOpening: true,
    description: 'Hang on and drag him down. Needs an opening.',
  },
  hold_back: {
    id: 'hold_back', name: 'Hold back', target: 'self', ends: 'held_back',
    description: 'Stop. Let him have it.',
  },

  // --- The young zealot (the market scrap). ---
  swing: {
    id: 'swing', name: 'Swing', target: 'enemy', damage: 2, reaction: { dodge: 260, parry: 110 },
    description: 'A wild swing.',
  },
  wind_up: {
    id: 'wind_up', name: 'Wind up', target: 'self', windsUp: 'haymaker',
    description: 'Draws back for a big one. A shove breaks it.',
  },
  haymaker: {
    id: 'haymaker', name: 'Haymaker', target: 'enemy', damage: 4, reaction: { dodge: 200, parry: 80 },
    description: 'Everything he has.',
  },
  jeer: {
    id: 'jeer', name: 'Jeer', target: 'self', exposesSelf: true,
    description: 'Plays to the crowd, wide open.',
  },
};

export const COMBATANTS: Record<string, CombatantDef> = {
  carver: { id: 'carver', name: 'You', sprite: 'protagonist', hp: 7, speed: 2, moves: ['dodge', 'shove', 'grab', 'hold_back'], reactions: ['dodge', 'parry'] },
  zealot: { id: 'zealot', name: 'The young man', sprite: 'zealot', hp: 6, speed: 1, moves: ['swing', 'wind_up', 'jeer'], weights: [3, 2, 1] },
};

export const ENCOUNTERS: Record<string, EncounterDef> = {
  /**
   * Day 4 afternoon at the market (design doc). What follows is the story's: ink reads these
   * (win: suspicion jumps; lose: hurt, less food; hold back: Mum sees it).
   */
  market_scrap: {
    id: 'market_scrap',
    party: ['carver'],
    enemies: ['zealot'],
    outcomes: {
      won: { fight_won: true },
      lost: { fight_won: false },
      held_back: { fight_won: false, held_back: true },
    },
  },
};
