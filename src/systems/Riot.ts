// The riot game (Chapter 3; docs/sequences/chapter-3/war-table.md): pure rules, no Phaser. RiotTableScene
// draws and runs them; src/data/warTable.ts holds the boards and scenarios; RiotPlayers.ts the computer
// players (your father, when he takes over; the balance tests).
//
// The war table's game, the one from the lesson (designer: its simplicity, with the riot in it; every rule
// thought about, each earning its place):
//
//   Squads are numbers. Each turn every squad can move one step along a street, or stay; your orders happen in
//   the order you give them, so a squad can join another and the two go on together (designer). Into an empty place
//   it takes it; into your own squad it joins it; into theirs it's a fight: the bigger number wins and keeps
//   what's over, and a tie holds. The square's barricades add 1, but match its number and you take it, the
//   barricades costing one more (you keep at least 1). (Jack's proposal: 9 on its 8 used to bounce off.) (Gone from the old table: uphill costing 1,
//   which on these maps only touched the stair; and the barricades losing nothing when they hold, which made a
//   big attack on the square vanish without a mark on it: designer, it looked like a bug.)
//
// And four rules for the riot, each one sentence, each for a reason:
//   1. What the rising will do this turn is shown first, as arrows. (You read them and answer them.)
//   2. People keep joining the square: it grows by 1 every turn, and once it's over 9 it sends a crowd of 2
//      out at the guard. (The clock, and the riot coming at you: designer, the rising was too passive.)
//   3. More of the guard come down the lifts: 2 every turn, if you hold the lifts' foot. (Time's on your
//      side, against the square's 1, but only while you keep the lifts: something to protect.)
//   4. Every few turns you can cut the power under a place: nobody there can move, the square doesn't grow,
//      and they fight at 1 less. (Your one trick: when, and where.)
// One goal: take the square before dawn (with enough to win, you go down yourself). Dawn first, and it's lost.
//
// And two of Jack's (proposed for the designer):
//   Fortify: instead of moving, a squad of yours digs in for the turn: nobody can attack it (their attacks on
//   it don't happen), but it can't move. It still gets its +1 or +2 (Jack: it needed more benefit). (You survive
//   a round while help comes round behind.) Like the power cut, once every 3 turns.
//   Split (Jack, a trial): half a squad (the bigger half) goes to a street next to it; the rest stays, and can
//   be sent on its own way too.
//   The elite squad (Jack, a trial; the riot only): each side has three, each once a game, one every 3 turns,
//   put in next to its base (the lifts' foot; the square): a squad of yours there becomes it, or it appears on
//   an empty place. None of them joins anyone, or is joined.
//     The hero (theirs: the bastard): 7 to deal out, and nothing can attack it; 3 turns. It goes two streets a
//     turn. Each fight spends what it takes to wipe them out: more than enough, it moves in; just enough, it
//     clears the place; not enough, it wears them down and is spent. Never stays on the square or the lifts'
//     foot. Dug in, it's crusted: fixed there for the rest of its time.
//     The maiden (theirs: the witch): 1, so easily killed; 5 turns. She seduces a squad of theirs next to her
//     (5 or fewer, never the square): it's yours, and she's gone.
//     The king's guard (theirs: the barbarians): three of 2, round the base; they only move between the places
//     next to it, never grow, and dig in for 2 turns; 4 turns.
//   Rumble (the riot only): now and then a rumble appears on an empty street for two turns (next to both
//   sides, where there's such a street: a race). Whoever gets a
//   squad onto it first sets it off: every squad next to it, on either side, takes 1 to 3 (a dice each; a
//   fortified squad takes nothing).
//
// Everything else (crowds going for squads they can beat, falling back into the square when you come for it,
// heading for the lifts) is just the rising playing by the same rules (`risingOrders`).

/** The guard (the citadel's) and the rising. Either can be yours: the rising in Day 2's lesson, the guard on Day 4. */
export type Side = 'guard' | 'rising';

export interface RiotPlace {
  id: string;
  name: string;
  x: number;
  y: number;
  /** The lifts' foot: where more of the guard come. */
  lifts?: boolean;
  /** The square: barricaded. */
  heart?: boolean;
  /** The way up, where the crowds are heading. */
  up?: boolean;
}

export interface RiotBoard {
  places: RiotPlace[];
  ways: [string, string][];
  /** How big the table is, if bigger than the screen (it pans with the cursor): Day 6's castle. */
  width?: number;
  height?: number;
  /** Places drawn close together (the skirmish, on one screen: Jack): their names shorter, without "the". */
  compact?: boolean;
}

export interface RiotRules {
  /** Turns until dawn. */
  dawn: number;
  /** More of the guard at the lifts' foot: this many, every so many turns. */
  reinforce: number;
  reinforceEvery: number;
  /** The power cut, every so many turns. */
  powerEvery: number;
  /** Fortify, every so many turns (Jack: like the power cut). */
  fortifyEvery: number;
  /** Split, every so many turns (Jack: like fortify). */
  splitEvery: number;
  /**
   * Your orders happen in the order you give them (designer): a squad can join another, and then the two go
   * on together. Otherwise (the rising's, always) they happen all at once.
   */
  ordered: boolean;
  /** Rumbles (Jack): the chance one appears each turn when there's none, how many turns it stays, and the most a dice can take (from 1). None if absent. */
  rumble?: { chance: number; lasts: number; max: number };
  /** The elite squad (Jack): one every so many turns, each once a game; what each is. None if absent. */
  elites?: EliteRules;
  /**
   * Clashes (Jack): one of yours straight at one of theirs that's coming straight at it, the same number, and
   * it's a fight to the last: the odds from morale (`clashOdds`), between these two, and the winner takes the
   * loser's place with 1 left, now and then 2, rarely 3 (`left`: the chances of 2 and 3; never more than it had).
   */
  clash?: { least: number; most: number; left: { two: number; three: number } };
  /** The mystery square (Jack): see `MYSTERY`. */
  mystery?: MysteryRules;
  /** A shake-up every so many turns (Jack, the skirmish): each side gets a crest, free; or, now and then, it's the trickster. */
  shakeUp?: { every: number; trickster?: number };
  /** Lose your base and you've lost (the skirmish: no dawn, so the rising need a way to win). */
  baseLoss?: boolean;
  /**
   * Walls round both bases (the skirmish, Jack: one big stack brought all the way down took theirs too easily): an
   * attack has to beat their number plus these; exactly that is the final clash. Without it, the square's
   * barricades +1, and matching its number takes it (the riot).
   */
  baseWalls?: number;
  /**
   * The duel (Day 6; designer): the rising (you, holding the keep) win by taking the guard's base (the lifts'
   * place: his siege camp) before dawn; dawn first, and the guard have won.
   */
  siege?: boolean;
  /**
   * The duel (designer: new units coming in, on both sides): each turn, each side's base (the keep, his camp)
   * musters a squad of this many onto an empty street next to it, towards the other's base; with nowhere free,
   * they join the base. Replaces the square's growth, its crowds, and the guard's arrivals.
   */
  muster?: number;
  /** The brothel (Jack): see `BROTHEL`. */
  brothel?: BrothelRules;
  /** The audience (Jack): see `AUDIENCE`. */
  audience?: AudienceRules;
  /** A holy cross on the map (Jack): first there has an audience with the Lord. See `CHURCH`. */
  church?: { from: number; chance: number; lasts: number };
  /** The rebels' own move (Jack, the skirmish): see `REBEL`. */
  rebel?: RebelRules;
  /** The barracks (Jack, the skirmish): see `BARRACKS`. */
  barracks?: BarracksRules;
  /** The architect (Jack, the skirmish): see `ARCHITECT`. */
  architect?: ArchitectRules;
  /** How much the rising's base grows each turn (1 if absent). */
  risingGrowth?: number;
  /**
   * Production from the home squares (Jack, the skirmish: both sides even): each base makes 1 a turn for each
   * place round it the other side doesn't hold (all three: 3; besieged: none), in place of `reinforce` and
   * `risingGrowth`.
   */
  homeGrowth?: boolean;
  /** Winning a clash (Jack): this much more production, for so many turns. */
  clashOutput?: { by: number; turns: number };
  /**
   * With `homeGrowth`, what a base makes with all its home squares held (Jack: 2), losing 1 for each the other
   * side holds (never below none). 3 if absent (1 for each).
   */
  baseMakes?: number;
  /**
   * Towers (Jack, the skirmish): each side's two, out on its flanks; each makes `makes` a turn for whoever holds
   * it, onto its own place, and has walls (+`walls` holding it). Taken, it's "Captured!", and makes men for them.
   */
  towers?: { guard: string[]; rising: string[]; makes: number; walls: number; every?: number };
  /**
   * Anyone can attack the other side's king's guard (barbarians) (Jack, the skirmish: it felt like a bug that you
   * couldn't); without it, only a hero can.
   */
  guardsOpen?: boolean;
  /** How many things can be on the map at once (Jack: more of them); 1 if absent. */
  tokensAtOnce?: number;
  /**
   * The table as it first was (designer: Day 2's first game, "just numbers"): no fortify, no split. Everything
   * else Jack added comes in through its own rule, so without those this is the old table.
   */
  simple?: boolean;
  /**
   * The tutorial (designer: then you're introduced to everything): things put on the map on set turns, in order,
   * instead of by the dice, next to the `side`'s squads and away from the other's (so you can get there first);
   * one waits while something else is still on the map.
   */
  script?: { side: Side; tokens: { turn: number; token: ScriptToken; mark?: 'diviner' | 'trickster' }[] };
}

/** What the tutorial can put on the map. */
export type ScriptToken = 'rumble' | 'crest' | 'mystery' | 'audience' | 'church' | 'barracks' | 'architect';

/**
 * The rebels' own move (Jack: like your power cut), once every `every` turns, at the start of a turn, whichever
 * suits them: **Rally** (+`rally` to one of theirs) or **Sabotage** (one street closed for `closed` turns: nobody
 * can use it). (A third, Riot, a fire next to yours, was tried and taken out: Jack.)
 */
export interface RebelRules {
  every: number;
  rally: number;
  /** How many turns a sabotaged street stays closed (this one included). */
  closed: number;
  /** Sabotage at most once in this many turns (Jack). */
  sabotageEvery: number;
}
/**
 * The barracks (Jack): now and then one appears on the map, for a few turns; first there hires fighters, one of
 * three kinds. They're on that side but nobody gives them orders (the computer plays them), they never join anyone
 * or grow, and they can be attacked like anyone. **Rogue mercenaries**: three of 3, out next to the barracks; each
 * turn they go for the nearest of the other side's they can beat (and beat it if it's next to them).
 * **Archers**: two of 2, on two places next to the barracks; they never move, and each turn each shoots one of the
 * other side's next to it for 1. **An assassin**: 3, weaving through the map for the other side's base by the
 * safest way (two streets a turn, through empty places only); there, it strikes it for its 3, half the time a
 * critical hit for twice that (never taking the base: it leaves at least 1), and is gone.
 */
export interface BarracksRules {
  from: number;
  chance: number;
  lasts: number;
  rogues: { count: number; strength: number };
  archers: { count: number; strength: number; damage: number };
  assassin: { strength: number; crit: number; critTimes: number };
}
export const BARRACKS: BarracksRules = { from: 6, chance: 0.15, lasts: 3, rogues: { count: 3, strength: 3 }, archers: { count: 2, strength: 2, damage: 1 }, assassin: { strength: 3, crit: 0.5, critTimes: 2 } };
export type Hired = 'rogue' | 'archer' | 'assassin';
export const HIRES = ['rogues', 'archers', 'assassin'] as const;
export type Hire = (typeof HIRES)[number];

/**
 * The architect (Jack): now and then he's on the map, for a few turns; first there has him build one of three, on
 * any empty place on its side of the board (one it holds, or nearer its base than theirs; not a base or a tower).
 * Nobody gives a building orders, it never moves or joins anyone. **Artillery**: 5, dug in for its first 2 turns;
 * each turn it shoots one of the other side's next to it (the biggest it can hurt) for 3. **A storehouse**: 3, does
 * nothing itself; while it stands, its side's elite are doubled (the hero 14 to deal out, the maiden seducing up to
 * 10, the king's guard 4 each, put in while it stands). **A fortress**: dug in for good (nobody can attack it), for
 * 7 turns; while it stands, a base or tower of its side next to it makes 1 more a turn.
 */
export interface ArchitectRules {
  from: number;
  chance: number;
  lasts: number;
  artillery: { strength: number; dugIn: number; shot: number };
  storehouse: { strength: number; times: number };
  fortress: { lasts: number; makes: number };
}
export const ARCHITECT: ArchitectRules = { from: 4, chance: 0.25, lasts: 3, artillery: { strength: 5, dugIn: 2, shot: 3 }, storehouse: { strength: 3, times: 2 }, fortress: { lasts: 7, makes: 1 } };
export const BUILDINGS = ['artillery', 'storehouse', 'fortress'] as const;
export type Building = (typeof BUILDINGS)[number];

export const REBEL: RebelRules = { every: 3, rally: 2, closed: 3, sabotageEvery: 9 };
export type RebelMove = 'rally' | 'sabotage';

/**
 * The brothel (Jack): now and then one appears on an empty street, for a few turns; a squad onto it (either
 * side's) is stuck there the next turn (and can be attacked there), and after that it's in fine spirits: this
 * much better odds in its next clash.
 */
export interface BrothelRules {
  from: number;
  chance: number;
  lasts: number;
  boost: number;
}
export const BROTHEL: BrothelRules = { from: 5, chance: 0.2, lasts: 3, boost: 0.15 };

/** The holy cross (Jack): now and then, from turn 8, one on an empty street for 3 turns. */
export const CHURCH = { from: 8, chance: 0.08, lasts: 3 };

/** Who you hear at an audience (Jack): the accountant, the townsfolk, the commander. */
export type Adviser = 'accountant' | 'townsfolk' | 'commander';

/**
 * The audience (Jack: a "community square"): now and then one appears on an empty street; first there chooses
 * who to hear, the accountant, the townsfolk or the commander, and it goes well or badly, half and half
 * (the townsfolk: four things to say, two that go down well). Or a crier comes, once in a while, and calls you to
 * one wherever you are (`call`: a chance in each so many turns).
 */
export interface AudienceRules {
  from: number;
  chance: number;
  lasts: number;
  /** Morale (better or worse odds in a clash), for so many turns. */
  morale: number;
  moraleTurns: number;
  /** The townsfolk: every base making more (or less) a turn, for so many turns. */
  output: number;
  outputTurns: number;
  slump: number;
  slumpTurns: number;
  /** The accountant (Jack: the treasury): your main base making more (or less) a turn, for so many turns, as well as morale. */
  treasury: number;
  treasuryTurns: number;
  /** The commander: seeing two turns of theirs ahead, or none (clouded judgement), for so many turns. */
  advice: number;
  /**
   * An audience with the Lord (Jack, in place of the crier): in each stretch of turns, half the time, on one turn of
   * it, a side's people pray; the Lord judges them heretics (cursed) or loyal servants (blessed), for `judged` turns.
   */
  call: { every: number; chance: number };
  judged: number;
  /** Whose people are called to pray out of the blue (Jack: only the player's side, the guard); anyone can reach the holy cross. */
  prays: Side;
}
export const AUDIENCE: AudienceRules = {
  from: 5, chance: 0.2, lasts: 3, morale: 0.1, moraleTurns: 5, output: 1, outputTurns: 5, slump: 1, slumpTurns: 2, treasury: 1, treasuryTurns: 3, advice: 5,
  call: { every: 12, chance: 0.35 }, judged: 5, prays: 'guard',
};

/** Something lasting on a side (Jack): morale up or down, its bases making more or less, the commander's advice. */
export interface Mood {
  side: Side;
  /**
   * `blessed` (a loyal servant, Jack): anything left to luck or morale goes its way, and its attacks win on a tie;
   * `cursed` (a heretic): the opposite.
   */
  kind: 'morale' | 'output' | 'foresight' | 'cloud' | 'blessed' | 'cursed';
  by: number;
  /** The last turn it lasts. */
  until: number;
}

/** What a mystery square turns out to be (Jack). */
export type Mystery = 'diviner' | 'thief' | 'plague' | 'trickster';
/** The diviner's cards (Jack): one of your elite squad, or a court card, or the plague. */
export type Card = Elite | 'joker' | 'jack' | 'king' | 'queen' | 'ace' | 'plague';
export const CARDS: readonly Card[] = ['hero', 'maiden', 'guard3', 'joker', 'jack', 'king', 'queen', 'ace', 'plague'];

export interface MysteryRules {
  /** From this turn, a chance each turn of one appearing (with nothing else on the map), for `lasts` turns. */
  from: number;
  chance: number;
  lasts: number;
  /** How often it's the diviner's own mark, or the trickster's, rather than a "?". */
  diviner: number;
  trickster: number;
  /** What a "?" turns out to be. */
  weights: Record<Mystery, number>;
  /** The plague: how many turns your squads (not the base) lose 1 a turn (never below 1). */
  plagueTurns: number;
  /** The thief: how much it steals (to your base). */
  steal: number;
  /** The cards: the jack's 2 to each of yours next to it, the king's 5 to your base, the queen's 3 to one of yours, the ace's 5 to whoever found it; the joker's numbers up to this at most. */
  jack: number;
  king: number;
  queen: number;
  ace: number;
  jokerMost: number;
}

/** The mystery square in the riot (Jack). */
export const MYSTERY: MysteryRules = {
  from: 4, chance: 0.3, lasts: 3, diviner: 0.2, trickster: 0.1,
  weights: { diviner: 0.35, thief: 0.3, plague: 0.2, trickster: 0.15 },
  plagueTurns: 3, steal: 3, jack: 2, king: 5, queen: 3, ace: 5, jokerMost: 10,
};

/** Clashes in the riot (Jack: 20% deep in their streets, 80% at home, at the outside). */
export const CLASH: NonNullable<RiotRules['clash']> = { least: 0.2, most: 0.8, left: { two: 0.27, three: 0.08 } };

/** A race's odds (Jack): from the two numbers and morale, kept between these. */
/**
 * A race's odds are kept between `least` and `most`; `overwhelm` or more bigger, and `rout` times as big, and it's
 * no race (Jack): the bigger gets there first (6 v 1 or 12 v 7, yes; 30 v 25, a race still).
 */
export const RACE = { least: 0.1, most: 0.9, overwhelm: 5, rout: 1.5 };

/** What makes up a clash's odds, for the side that strikes first. */
export interface ClashOdds {
  chance: number;
  parts: { what: string; by: number }[];
}

export const RIOT_RULES: RiotRules = { dawn: 18, reinforce: 3, reinforceEvery: 1, powerEvery: 3, fortifyEvery: 3, splitEvery: 3, ordered: true };

/** Rumbles in the riot (Jack): a one-in-three chance each turn there's none, two turns to get to it, 1 to 3 to each squad round it. */
export const RUMBLE: NonNullable<RiotRules['rumble']> = { chance: 1 / 3, lasts: 2, max: 3 };

/** The elite squad's three (Jack): the hero (bastard), the maiden (witch), the king's guard (barbarians). */
export type Elite = 'hero' | 'maiden' | 'guard3';
export const ELITES: readonly Elite[] = ['hero', 'maiden', 'guard3'];
export const ELITE_NAMES: Record<Side, Record<Elite, string>> = {
  guard: { hero: 'Hero', maiden: 'Maiden', guard3: "King's Guard" },
  rising: { hero: 'Bastard', maiden: 'Witch', guard3: 'Barbarians' },
};

export interface EliteRules {
  /** Each only once a game (the riot); otherwise again, once it's gone from the table (the skirmish: Jack). */
  once?: boolean;
  /**
   * The crests (Jack: like a rumble, first to reach it gets an elite): one appears on an empty street at turn
   * `first`, then every `every` turns, for `lasts` turns; a squad onto it wins its side a crest, to put in any
   * one of its elite squad it hasn't used.
   */
  crest: { first: number; every: number; lasts: number };
  /** A poisoned squad's chance of a critical hit attacking, and how much more it does (a share of its attack, rounded). */
  crit: { chance: number; least: number; most: number };
  hero: { points: number; lasts: number };
  maiden: { lasts: number; seduceMax: number };
  guard3: { strength: number; count: number; fortifyLasts: number };
}

/** The elite squad in the riot (Jack). */
export const ELITE_SQUAD: EliteRules = {
  crest: { first: 3, every: 4, lasts: 3 },
  crit: { chance: 0.5, least: 0.1, most: 0.6 },
  hero: { points: 7, lasts: 3 },
  maiden: { lasts: 5, seduceMax: 5 },
  guard3: { strength: 2, count: 3, fortifyLasts: 2 },
};

export interface RiotSquad {
  id: string;
  side: Side;
  place: string;
  strength: number;
  /** One of the elite squad (Jack): never joined with anyone. A hero's `strength` is what it has left to deal out. */
  elite?: Elite;
  /** Hired at the barracks (Jack): the computer plays it; it never joins anyone or grows. */
  hired?: Hired;
  /** Built by the architect (Jack): it never moves or joins anyone. */
  built?: Building;
  /** The last turn an elite is here (it's gone at the end of it). */
  until?: number;
  /** Dug in through this turn (fortify: one turn; the king's guard two; a crusted hero its whole time). */
  fortUntil?: number;
  /** A hero dug in: fixed where it is for the rest of its time. */
  crusted?: boolean;
  /** A maiden (witch) merged into it (Jack): green, bubbling, a chance of a critical hit when it attacks. */
  poison?: boolean;
  /**
   * Standing beside one of the king's guard, or hired fighters of yours (Jack): a squad of yours on the same place,
   * not one of them, only passing through. Attacks there hit them first, then these.
   */
  beside?: boolean;
  /** Been to the brothel (Jack): stuck there through this turn. */
  stuck?: number;
  /** In fine spirits after the brothel (Jack): better odds in its next clash. */
  cheer?: boolean;
}

export interface RiotState {
  turn: number;
  squads: RiotSquad[];
  /** Who holds each place (it stays theirs when the squad moves on). */
  owner: Record<string, Side>;
  /** The place with its power cut this turn, and the turn the power was last cut. */
  cut: string | null;
  lastCut: number;
  nextId: number;
  /** Places dug in this turn (fortify): nobody can attack them, and they don't move. */
  fortified: string[];
  /** The turn each side last fortified, and what it was before (so taking it back this turn gives it back). */
  lastFortify: Record<Side, number>;
  /** The turn each side last split a squad (Jack: once every 3 turns). */
  lastSplit: Record<Side, number>;
  fortifyBefore: Record<Side, number>;
  /** A rumble on the map: where, and for how many more turns. */
  rumble: { place: string; left: number } | null;
  /** The dice (a seeded sequence, so a game can be played again exactly, and tested). */
  seed: number;
  /** Each side's elite squad: which they've used, and the crests they hold to put one in. */
  elites: Record<Side, { used: Elite[]; crests: number; gifts?: Elite[] }>;
  /** A crest on the map (Jack): where, and for how many more turns. */
  crest: { place: string; left: number } | null;
  /** A crest's turn has come, but the map's taken (one thing on it at a time): it appears once it's clear. */
  crestDue?: boolean;
  /** A mystery square on the map (Jack): where, for how many more turns, and whether it's the diviner's own mark. */
  mystery?: { place: string; left: number; mark?: 'diviner' | 'trickster' } | null;
  /** Waiting on a choice (Jack): the diviner's three cards, face down, or where the thief goes. */
  pending?: { kind: 'diviner'; side: Side; at: string; cards: Card[] } | { kind: 'thief'; side: Side; at: string } | { kind: 'audience'; side: Side; at: string; good: number[] } | { kind: 'prayer'; side: Side } | { kind: 'barracks'; side: Side; at: string } | { kind: 'architect'; side: Side; at: string } | null;
  /** Turns of plague left for each side (Jack). */
  plague?: Record<Side, number>;
  /** The streets, once the trickster's changed them (Jack); the board's until then. */
  ways?: [string, string][];
  /** A brothel on the map (Jack). */
  brothel?: { place: string; left: number } | null;
  /** An audience on the map (Jack). */
  audience?: { place: string; left: number } | null;
  /** A holy cross on the map (Jack). */
  church?: { place: string; left: number } | null;
  /** The barracks on the map (Jack). */
  barracks?: { place: string; left: number } | null;
  /** The architect on the map (Jack). */
  architect?: { place: string; left: number } | null;
  /** What's lasting on each side (Jack): morale, output, the commander's advice. */
  moods?: Mood[];
  /** When the crier comes to each side, in this stretch of turns (Jack), or not at all. */
  calls?: Record<Side, number | null>;
  /** Squads that stay where they are this turn whatever they were ordered (a race for a token lost: Jack). */
  held?: string[];
  /** The turn the rebels last made their move (Jack), and last sabotaged a street. */
  lastRebel?: number;
  lastSabotage?: number;
  /** A street sabotaged (Jack): nobody can use it, up to and including turn `until`. */
  blocked?: { ways: [string, string]; until: number } | null;
  /** How many of the tutorial's things have been put on the map so far. */
  scripted?: number;
}

/**
 * An order: a squad to a place next to it (a hero: up to two streets away). With `split`, only half goes (the
 * bigger half). With `side`, only if the squad is still that side's (it may have been seduced).
 */
export interface Order {
  squad: string;
  to: string;
  split?: boolean;
  side?: Side;
  /** A hero two streets off: the place it goes by (Jack: you choose it, one step at a time). */
  via?: string;
  /** Part of a chain (the rising, in the even skirmish): joins up, then strikes on together, in this order. */
  chain?: boolean;
  /** A hired fighter's (Jack): the computer's, the only orders they take. */
  auto?: boolean;
}

export type RiotEvent =
  | { type: 'move'; squad: string; side: Side; from: string; to: string }
  | { type: 'join'; squad: string; into: string; at: string }
  /** `crit`: a poisoned squad's critical hit, and what it added to the attack. */
  | { type: 'fight'; at: string; side: Side; won: boolean; attack: number; defence: number; crit?: number }
  | { type: 'grow'; at: string }
  | { type: 'pour'; from: string; to: string; strength?: number }
  | { type: 'arrive'; at: string }
  /** The duel: a new squad mustered out of a base onto a street next to it (`to` null: cut off, none came). */
  | { type: 'muster'; side: Side; from: string; to: string | null; strength: number }
  /** An attack on a fortified squad: it doesn't happen. */
  | { type: 'blocked'; at: string; side: Side }
  /** A rumble set off at a place: each squad next to it, and what it took. */
  | { type: 'rumble'; at: string; side: Side; hits: { place: string; side: Side; damage: number; gone: boolean }[] }
  | { type: 'rumbleAppears'; at: string }
  /** The rebels' move (Jack): +2 to one of theirs; a street closed. */
  | { type: 'rally'; at: string; by: number }
  /** The rebels dig in at their base (the skirmish, Jack: one big stack walked in too easily). */
  | { type: 'dugIn'; at: string; side: Side }
  | { type: 'sabotage'; ways: [string, string] }
  /** Half a squad split off (`squad`, the half that went) from `from`. */
  | { type: 'split'; squad: string; from: string; strength: number }
  /** One of the elite squad put in, at these places. */
  | { type: 'deploy'; side: Side; elite: Elite; at: string[] }
  /** A squad seduced by a maiden (witch) at `from`: it's `side`'s now. */
  | { type: 'seduce'; at: string; from: string; side: Side }
  /** A clash (Jack): `side` struck at `at` from `from` as they came for it; `won` by `side` or not, at these odds. */
  | { type: 'clash'; at: string; from: string; side: Side; won: boolean; chance: number; strength: number; left: number; meet?: string; base?: boolean }
  /**
   * A race for something on the map (Jack): `side` and theirs (from `rival`) both went for it; `won` by `side` or
   * not, at these odds. The winner takes it; the loser stays where it was, untouched.
   */
  | { type: 'race'; at: string; from: string; rival: string; side: Side; won: boolean; chance: number; what: Token; strength: number; rivalStrength: number; wiped?: boolean; outright?: boolean }
  | { type: 'brothelAppears'; at: string }
  | { type: 'brothel'; at: string; side: Side }
  | { type: 'brothelGone'; at: string }
  | { type: 'audienceAppears'; at: string }
  | { type: 'audienceGone'; at: string }
  | { type: 'audienceFound'; at: string; side: Side }
  /** The holy cross (Jack): appearing, gone untaken, or found (an audience with the Lord: `pending`). */
  | { type: 'churchAppears'; at: string }
  | { type: 'churchGone'; at: string }
  | { type: 'churchFound'; at: string; side: Side }
  /** The barracks (Jack): appearing, gone, found, who was hired and where; an archer's arrow; the assassin's strike. */
  | { type: 'barracksAppears'; at: string }
  /** The architect (Jack): appearing, gone, found; what he built; an artillery shot; a building gone. */
  | { type: 'architectAppears'; at: string }
  | { type: 'architectGone'; at: string }
  | { type: 'architectFound'; at: string; side: Side }
  | { type: 'built'; side: Side; building: Building; at: string }
  | { type: 'shell'; side: Side; from: string; at: string; damage: number; gone: boolean }
  | { type: 'builtGone'; side: Side; building: Building; at: string }
  /** A tower taken (Jack), and its men each turn. */
  | { type: 'captured'; at: string; side: Side; from?: string }
  | { type: 'towerMakes'; at: string; side: Side; by: number }
  | { type: 'barracksGone'; at: string }
  | { type: 'barracksFound'; at: string; side: Side }
  | { type: 'hired'; side: Side; hire: Hire; at: string[] }
  | { type: 'arrow'; side: Side; from: string; at: string; damage: number; gone: boolean }
  | { type: 'assassin'; side: Side; at: string; damage: number; crit: boolean }
  /** An audience with the Lord (Jack): `side`'s people pray ("O please, Lord, won't you hear our prayer?!"); `pending`. */
  | { type: 'call'; side: Side }
  /** The Lord's judgement on them (Jack): loyal servants (blessed), or heretics (cursed). */
  | { type: 'judgement'; side: Side; blessed: boolean }
  /** An audience heard (Jack): who, and whether it went well; for the townsfolk, which line was said. */
  | { type: 'audience'; side: Side; who: Adviser; good: boolean; line?: number }
  /** A mystery square appearing (the diviner's mark, or a "?"), found, or gone untaken (Jack). */
  | { type: 'mysteryAppears'; at: string; mark?: 'diviner' | 'trickster' }
  /** A shake-up (Jack, the skirmish): the elite each side got. */
  | { type: 'shakeUp'; sides: Side[] }
  /** The trickster (Jack): every street changed; the new ones. */
  | { type: 'trickster'; side: Side; ways: [string, string][] }
  | { type: 'mystery'; at: string; side: Side; what: Mystery }
  | { type: 'mysteryGone'; at: string }
  /** A card drawn from the diviner, and what it changed. */
  | { type: 'card'; side: Side; at: string; card: Card; changes: { place: string; by: number }[] }
  /** The thief: what it stole from where, and where it went. */
  | { type: 'thief'; side: Side; at: string; stolen: number; to: string | null; gone: boolean }
  /** The plague on a side, and each turn, what it took. */
  | { type: 'plague'; side: Side }
  | { type: 'plagueTick'; side: Side; places: string[] }
  /** A crest appearing, taken by a side, or gone untaken. */
  | { type: 'crestAppears'; at: string }
  | { type: 'crestTaken'; at: string; side: Side }
  | { type: 'crestGone'; at: string }
  /** A maiden (witch) merged into a squad of hers (Jack): it's poisoned. */
  | { type: 'poison'; at: string; side: Side }
  /** An elite's time up (or a hero spent). */
  | { type: 'eliteGone'; at: string; side: Side; elite: Elite };

/** Something on the map a squad can go for (Jack). */
export type Token = 'crest' | 'mystery' | 'rumble' | 'brothel' | 'audience' | 'church' | 'barracks' | 'architect';

/** How the rising plays (being tuned: designer, the rising was too passive). */
export interface RisingStyle {
  /** How much a crowd avoids a street where the guard could beat it. */
  flee: number;
  /** With nothing to attack, crowds go for the guard rather than the way up. */
  hunt: boolean;
  /** The square sends its people out at a squad of the guard next to it, if it can beat it and nothing else of the guard is next to the square. */
  sally: boolean;
  /** With nothing to attack, crowds gather into bigger crowds. */
  merge: boolean;
  /** Crowds throw themselves at a squad of the guard even when they'll lose, if they have at least this many (0: never). */
  wear: number;
  /** The square pours a crowd of this many out into an empty street next to it each turn, when it has more than `pourAbove` (0: never). */
  pour: number;
  pourAbove: number;
}

/**
 * How the rising plays (designer: it was too passive, it should fight you; tested against other ways, docs/
 * sequences/chapter-3/war-table.md): crowds go for the guard rather than keeping clear, throw themselves at a
 * squad even when they'll lose (if they're 2 or more), and the square, once it's over 9, pours a crowd of 2 out
 * at the guard each turn.
 */
/** Even, with production from the home squares (Jack): the rising's base keeps its men, and sends out half, a wave, once it's over this. */
export const WAVE = { above: 12, least: 6, home: 20 };

export const RISING_STYLE: RisingStyle = { flee: 0, hunt: true, sally: false, merge: false, wear: 2, pour: 2, pourAbove: 9 };

export class RiotGame {
  style: RisingStyle = RISING_STYLE;
  readonly board: RiotBoard;
  readonly rules: RiotRules;
  /** The streets between places, as they are in the state last looked at (`use`: the trickster moves them, Jack). */
  adj!: Map<string, string[]>;
  readonly heart: string;
  readonly lifts: string;
  /** How far each place is from the way up (the same). */
  upDist!: Map<string, number>;
  /** While a turn plays out: the side ordering's orders and the other side's (for a race, `heading`). */
  private ownOrders: readonly Order[] = [];
  private otherOrders: readonly Order[] = [];
  private nets = new WeakMap<readonly (readonly [string, string])[], { adj: Map<string, string[]>; upDist: Map<string, number> }>();

  constructor(board: RiotBoard, rules: RiotRules = RIOT_RULES) {
    this.board = board;
    this.rules = rules;
    this.heart = board.places.find((p) => p.heart)!.id;
    this.lifts = board.places.find((p) => p.lifts)!.id;
    this.useWays(board.ways);
  }

  /** The streets as they are in a state (the board's, unless the trickster's changed them). */
  ways = (s: RiotState): readonly (readonly [string, string])[] => s.ways ?? this.board.ways;
  /** Looks at the streets as they are in this state (every rule that walks the streets calls it). */
  use(s: RiotState): void {
    this.useWays(s.ways ?? this.board.ways);
  }
  private useWays(ways: readonly (readonly [string, string])[]): void {
    let net = this.nets.get(ways);
    if (!net) {
      const adj = new Map<string, string[]>(this.board.places.map((p) => [p.id, []]));
      for (const [a, b] of ways) (adj.get(a)!.push(b), adj.get(b)!.push(a));
      const upDist = new Map<string, number>();
      const todo = this.board.places.filter((p) => p.up).map((p) => p.id);
      for (const id of todo) upDist.set(id, 0);
      while (todo.length) {
        const p = todo.shift()!;
        for (const n of adj.get(p)!) if (!upDist.has(n)) (upDist.set(n, upDist.get(p)! + 1), todo.push(n));
      }
      net = { adj, upDist };
      this.nets.set(ways, net);
    }
    this.adj = net.adj;
    this.upDist = net.upDist;
  }

  /** A game set up. `seed` starts the dice (a new one each time it's played; fixed in tests). */
  start(squads: { side: Side; place: string; strength: number }[], seed = 1): RiotState {
    const owner: Record<string, Side> = {};
    for (const s of squads) owner[s.place] = s.side;
    // (The towers start their own side's, Jack.)
    for (const t of this.towerList()) owner[t.place] ??= t.side;
    // (On the board's own streets: a game before may have ended with the trickster's.)
    this.useWays(this.board.ways);
    return { turn: 1, squads: squads.map((s, i) => ({ id: `q${i}`, ...s })), owner, cut: null, lastCut: -99, nextId: squads.length, fortified: [], lastFortify: { guard: -99, rising: -99 }, lastSplit: { guard: -99, rising: -99 }, fortifyBefore: { guard: -99, rising: -99 }, rumble: null, seed, elites: { guard: { used: [], crests: 0, gifts: [] }, rising: { used: [], crests: 0, gifts: [] } }, crest: null, mystery: null, pending: null, plague: { guard: 0, rising: 0 } };
  }

  clone(s: RiotState): RiotState {
    return { ...s, squads: s.squads.map((q) => ({ ...q })), owner: { ...s.owner }, fortified: [...s.fortified], lastFortify: { ...s.lastFortify }, lastSplit: { ...s.lastSplit }, fortifyBefore: { ...s.fortifyBefore }, rumble: s.rumble && { ...s.rumble }, crest: s.crest && { ...s.crest }, mystery: s.mystery && { ...s.mystery }, brothel: s.brothel && { ...s.brothel }, audience: s.audience && { ...s.audience }, church: s.church && { ...s.church }, barracks: s.barracks && { ...s.barracks }, architect: s.architect && { ...s.architect }, moods: (s.moods ?? []).map((m) => ({ ...m })), calls: s.calls && { ...s.calls }, held: [...(s.held ?? [])], blocked: s.blocked && { ways: [...s.blocked.ways] as [string, string], until: s.blocked.until }, pending: s.pending && { ...s.pending, ...(s.pending.kind === 'diviner' ? { cards: [...s.pending.cards] } : s.pending.kind === 'audience' ? { good: [...s.pending.good] } : {}) }, plague: { guard: s.plague?.guard ?? 0, rising: s.plague?.rising ?? 0 }, elites: { guard: { ...s.elites.guard, used: [...s.elites.guard.used], gifts: [...(s.elites.guard.gifts ?? [])] }, rising: { ...s.elites.rising, used: [...s.elites.rising.used], gifts: [...(s.elites.rising.gifts ?? [])] } } };
  }

  /** The next number from the dice, 0 to 1 (moves `s.seed` on: only ever on a clone). */
  private roll(s: RiotState): number {
    let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  fortified = (s: RiotState, place: string): boolean => s.fortified.includes(place);
  /** A side can fortify now: once every so many turns (Jack: like the power cut). */
  /** A side can split a squad now (Jack: once every 3 turns, like fortify). */
  canSplit = (s: RiotState, side: Side): boolean => !this.rules.simple && s.turn - s.lastSplit[side] >= this.rules.splitEvery;
  /** Turns until a side can split again (0: now). */
  splitIn = (s: RiotState, side: Side): number => Math.max(0, this.rules.splitEvery - (s.turn - s.lastSplit[side]));
  canFortify = (s: RiotState, side: Side): boolean => !this.rules.simple && s.turn - s.lastFortify[side] >= this.rules.fortifyEvery;
  /** Turns until the next shake-up (1: at the end of this one). */
  shakeIn = (s: RiotState): number => (this.rules.shakeUp ? this.rules.shakeUp.every - ((s.turn - 1) % this.rules.shakeUp.every) : 0);
  /** Turns until a side can fortify again (0: now). */
  fortifyIn = (s: RiotState, side: Side): number => Math.max(0, this.rules.fortifyEvery - (s.turn - s.lastFortify[side]));

  /**
   * Fortify (Jack): the squad digs in where it is (if its side can): for this turn; the king's guard for two; a
   * hero is crusted, fixed there for the rest of its time.
   */
  fortify(s0: RiotState, squad: string): RiotState {
    const b0 = s0.squads.find((x) => x.id === squad);
    // (Beside the king's guard: it's the place that digs in, theirs.)
    const q0 = b0?.beside ? this.squadAt(s0, b0.place) : b0;
    // (The maiden can't dig in: she's left open, Jack. Nor the hired, nor a building.)
    if (q0?.elite === 'maiden' || q0?.hired || q0?.built) return s0;
    if (!q0 || this.fortified(s0, q0.place) || !this.canFortify(s0, q0.side)) return s0;
    const s = this.clone(s0);
    const q = s.squads.find((x) => x.id === q0.id)!;
    s.fortified.push(q.place);
    s.fortifyBefore[q.side] = s.lastFortify[q.side];
    s.lastFortify[q.side] = s.turn;
    const e = this.rules.elites;
    if (q.elite === 'hero') (q.crusted = true), (q.fortUntil = q.until ?? s.turn);
    else q.fortUntil = s.turn + (q.elite === 'guard3' && e ? e.guard3.fortifyLasts - 1 : 0);
    return s;
  }

  /** No longer dug in (taken back, or given an order after all): this turn, it gives the side its fortify back. */
  unfortify(s0: RiotState, place: string): RiotState {
    // (Never the king's guard: what would be the point? Jack.)
    if (!this.fortified(s0, place) || this.squadAt(s0, place)?.elite === 'guard3' || this.squadAt(s0, place)?.built) return s0;
    const s = this.clone(s0);
    s.fortified = s.fortified.filter((p) => p !== place);
    const q = this.squadAt(s, place);
    if (q && s.lastFortify[q.side] === s.turn) {
      s.lastFortify[q.side] = s.fortifyBefore[q.side];
      q.fortUntil = undefined;
      q.crusted = false;
    }
    return s;
  }

  // --- The elite squad (Jack) ---

  /** A side's base: the lifts' foot for the guard, the square for the rising. */
  base = (side: Side): string => (side === 'guard' ? this.lifts : this.heart);
  /** A side can put in one of its elite squad now (this one, if given): it holds a crest (Jack), and each only once. */
  canDeploy(s: RiotState, side: Side, elite?: Elite): boolean {
    const mine = s.elites[side];
    if (!this.rules.elites) return false;
    // (A card from the diviner gives one of them in particular: Jack.)
    const gifts = (mine.gifts ?? []).filter((x) => this.eliteFree(s, side, x));
    if (elite) return this.eliteFree(s, side, elite) && (mine.crests > 0 || gifts.includes(elite));
    return gifts.length > 0 || (mine.crests > 0 && ELITES.some((x) => this.eliteFree(s, side, x)));
  }
  /** One of a side's elite squad can be put in: not used yet (or, where they come back, not on the table now). */
  eliteFree(s: RiotState, side: Side, elite: Elite): boolean {
    // The king's guard can be made up again (Jack): fewer than three about, and somewhere round the base for them.
    if (elite === 'guard3') return this.guardsShort(s, side) > 0 && this.deployPlaces(s, side, 'guard3').length > 0;
    return this.rules.elites?.once === false ? !s.squads.some((q) => q.side === side && q.elite === elite) : !s.elites[side].used.includes(elite);
  }
  /** How many of a side's king's guard (barbarians) are missing from round its base. */
  guardsShort = (s: RiotState, side: Side): number => (this.rules.elites?.guard3.count ?? 0) - s.squads.filter((q) => q.side === side && q.elite === 'guard3').length;
  /** Crests a side has taken in all (held, or spent on its elite squad). */
  crestsTaken = (s: RiotState, side: Side): number => s.elites[side].crests + s.elites[side].used.length;
  /**
   * Where one can be put in: next to the base, empty or one of yours (not one of the elite, not dug in); the
   * maiden beside one of your king's guard too (Jack).
   */
  deployPlaces(s: RiotState, side: Side, elite?: Elite): string[] {
    this.use(s);
    return this.adj.get(this.base(side))!.filter((p) => {
      const there = this.squadAt(s, p);
      // (The maiden or the hero beside one of your king's guard, Jack: if none of the elite's beside them already.)
      if ((elite === 'maiden' || elite === 'hero') && there?.side === side && there.elite === 'guard3') return !s.squads.some((q) => q.place === p && q.elite && q.elite !== 'guard3');
      return !there || (there.side === side && !there.elite && !there.hired && !there.built && !this.fortified(s, p));
    });
  }

  /**
   * One of the elite squad put in (Jack): the hero or maiden at a place next to the base (a squad of yours there
   * steps back into the base, joining it); the king's guard round the base (on as many of those places as there are, up to three: empty
   * ones first, then your smallest).
   */
  deploy(s0: RiotState, side: Side, elite: Elite, at?: string): { state: RiotState; events: RiotEvent[] } {
    const e = this.rules.elites;
    const free = this.deployPlaces(s0, side, elite);
    if (!e || !this.canDeploy(s0, side, elite) || (elite !== 'guard3' && (!at || !free.includes(at)))) return { state: s0, events: [] };
    const s = this.clone(s0);
    // (The king's guard: only as many as are missing, Jack.)
    const places = elite === 'guard3'
      ? [...free].sort((a, b) => (this.squadAt(s, a)?.strength ?? 0) - (this.squadAt(s, b)?.strength ?? 0)).slice(0, this.guardsShort(s, side))
      : [at!];
    if (!places.length) return { state: s0, events: [] };
    for (const p of places) {
      // A squad of yours there steps back into the base, joining whoever holds it, so nobody's lost (with the base
      // not yours, it stands down). (The maiden beside the king's guard: they stay, and so does she.)
      const keep = (q: RiotSquad) => q.elite === 'guard3' && (elite === 'maiden' || elite === 'hero');
      const home = this.squadAt(s, this.base(side));
      for (const there of s.squads.filter((q) => q.place === p && !keep(q))) if (home?.side === side && !home.elite) home.strength += there.strength;
      s.squads = s.squads.filter((q) => q.place !== p || keep(q));
      if (elite === 'guard3') {
        // The king's guard (Jack): there for good, and dug in as they arrive (for as long as their fortify lasts),
        // without using the side's fortify.
        s.squads.push({ id: `q${s.nextId++}`, side, place: p, strength: e.guard3.strength * this.stored(s, side), elite, fortUntil: s.turn + e.guard3.fortifyLasts - 1 });
        s.fortified.push(p);
      } else {
        const [strength, lasts] = elite === 'hero' ? [e.hero.points * this.stored(s, side), e.hero.lasts] : [1, e.maiden.lasts];
        s.squads.push({ id: `q${s.nextId++}`, side, place: p, strength, elite, until: s.turn + lasts - 1 });
      }
      s.owner[p] = side;
    }
    s.elites[side].used.push(elite);
    this.settle(s);
    const gifts = s.elites[side].gifts ?? [];
    if (gifts.includes(elite)) s.elites[side].gifts = gifts.filter((x) => x !== elite);
    else s.elites[side].crests -= 1;
    return { state: s, events: [{ type: 'deploy', side, elite, at: places }] };
  }

  /** Who a maiden (witch) can seduce: a squad of theirs next to her, 5 or fewer, not the square, not one of the elite, not dug in. */
  seduceTargets(s: RiotState, maiden: RiotSquad): string[] {
    this.use(s);
    const max = this.seduceMax(s, maiden.side);
    return this.adj.get(maiden.place)!.filter((p) => {
      const there = this.squadAt(s, p);
      // (Their hero too, whatever it has left: the maiden turns a bastard into a hero, the witch a hero into a bastard, Jack.)
      if (there?.elite === 'hero' && there.side !== maiden.side) return true;
      return !!there && there.side !== maiden.side && p !== this.heart && p !== this.lifts && !there.elite && there.strength <= max && !this.fortified(s, p);
    });
  }

  /** Seduced (Jack): the squad there is the maiden's side's now, and she's gone. */
  seduce(s0: RiotState, maidenId: string, at: string): { state: RiotState; events: RiotEvent[] } {
    const m0 = s0.squads.find((q) => q.id === maidenId);
    if (!m0 || m0.elite !== 'maiden' || !this.seduceTargets(s0, m0).includes(at)) return { state: s0, events: [] };
    const s = this.clone(s0);
    const target = this.squadAt(s, at)!;
    target.side = m0.side;
    s.owner[at] = m0.side;
    s.squads = s.squads.filter((q) => q.id !== maidenId);
    return { state: s, events: [{ type: 'seduce', at, from: m0.place, side: m0.side }] };
  }

  /**
   * What the rising do at the start of a turn, before they move (shown as it happens): put in one of their elite
   * squad when it's worth it (the barbarians when you're closing on the square; the bastard when there's one of
   * yours to hit; the witch when there's one of yours to seduce), and a witch next to one of yours seduces it.
   */
  risingActs(s0: RiotState): { state: RiotState; events: RiotEvent[] } {
    const e = this.rules.elites ? this.eliteActs(s0, 'rising') : { state: s0, events: [] };
    const r = this.rules.rebel && this.canRebel(e.state) ? this.rebelActs(e.state) : { state: e.state, events: [] };
    const d = this.digIn(r.state);
    return { state: d.state, events: [...e.events, ...r.events, ...d.events] };
  }

  /**
   * The rebels dig in at their base (the skirmish, Jack: bringing one big stack all the way down took it too
   * easily): when what of yours could hit it next turn would take it, they fortify it (once in 3 turns, as you can),
   * so nothing can attack it this turn, and their crowds have a turn to get home.
   */
  private digIn(s: RiotState): { state: RiotState; events: RiotEvent[] } {
    const h = this.squadAt(s, this.heart);
    if (!this.rules.homeGrowth || !h || h.side !== 'rising' || this.fortified(s, this.heart) || !this.canFortify(s, 'rising')) return { state: s, events: [] };
    if (this.strike(s) + this.heroNear(s) < this.baseClashAt(s, this.heart)) return { state: s, events: [] };
    const t = this.fortify(s, h.id);
    return t === s ? { state: s, events: [] } : { state: t, events: [{ type: 'dugIn', at: this.heart, side: 'rising' }] };
  }

  /** Whether the rebels can make their move this turn (Jack: once every 3 turns), and in how many turns they can. */
  canRebel = (s: RiotState): boolean => !!this.rules.rebel && s.turn - (s.lastRebel ?? -99) >= this.rules.rebel.every;
  /** Sabotage: at most once in 9 turns (Jack). */
  canSabotage = (s: RiotState): boolean => !!this.rules.rebel && s.turn - (s.lastSabotage ?? -99) >= this.rules.rebel.sabotageEvery;
  sabotageIn = (s: RiotState): number => Math.max(0, (this.rules.rebel?.sabotageEvery ?? 0) - (s.turn - (s.lastSabotage ?? -99)));
  rebelIn = (s: RiotState): number => Math.max(0, (this.rules.rebel?.every ?? 0) - (s.turn - (s.lastRebel ?? -99)));
  /** Whether a street can be used this turn: not sabotaged (Jack). */
  open = (s: RiotState, from: string, to: string): boolean => !(s.blocked && s.blocked.until >= s.turn && s.blocked.ways.includes(from) && s.blocked.ways.includes(to));
  /** How many more turns a street stays closed (0: open), this one included (Jack). */
  closedFor = (s: RiotState, a: string, b: string): number => (s.blocked && s.blocked.ways.includes(a) && s.blocked.ways.includes(b) ? Math.max(0, s.blocked.until - s.turn + 1) : 0);

  /**
   * The rebels' move (Jack), the one that suits them best now (or none yet, if nothing's worth it): Rally where
   * +2 wins a fight or holds one off; Sabotage the street one of yours would beat one of theirs down (their base
   * most of all).
   */
  rebelActs(s0: RiotState): { state: RiotState; events: RiotEvent[] } {
    const rules = this.rules.rebel;
    if (!rules || !this.canRebel(s0)) return { state: s0, events: [] };
    this.use(s0);
    const theirs = this.mine(s0, 'rising').filter((q) => !q.elite && !q.hired && !q.built);
    const yours = this.mine(s0, 'guard').filter((q) => !this.fortified(s0, q.place) && s0.cut !== q.place && !q.crusted);
    const hittable = (q: RiotSquad) => q.elite !== 'guard3';
    let best: { move: RebelMove; score: number; at: string; ways?: [string, string] } | null = null;
    const consider = (c: NonNullable<typeof best>) => void ((!best || c.score > best.score) && (best = c));
    for (const q of theirs) {
      for (const n of this.adj.get(q.place)!) {
        const g = this.squadAt(s0, n);
        if (!g || g.side !== 'guard' || !hittable(g)) continue;
        // (+2 and it beats one of yours it couldn't; or it holds off one of yours that would have beaten it.)
        const theirDefence = this.defence(s0, n, g.strength);
        if (!this.fortified(s0, n) && g.elite !== 'hero' && q.strength <= theirDefence && q.strength + rules.rally > theirDefence) consider({ move: 'rally', score: 5 + g.strength * 2, at: q.place });
        const mine = this.defence(s0, q.place, q.strength);
        if (yours.includes(g) && g.strength > mine && g.strength <= mine + rules.rally) consider({ move: 'rally', score: 4 + q.strength * 2, at: q.place });
        // (Yours would beat it down: block the street between.)
        if (yours.includes(g) && g.strength > mine && this.canSabotage(s0)) consider({ move: 'sabotage', score: (q.place === this.heart ? 100 : 3) + q.strength * 2, at: q.place, ways: [g.place, q.place] });
      }
    }
    if (!best) return { state: s0, events: [] };
    const b: { move: RebelMove; score: number; at: string; ways?: [string, string] } = best;
    const s = this.clone(s0);
    const events: RiotEvent[] = [];
    s.lastRebel = s.turn;
    if (b.move === 'rally') {
      this.squadAt(s, b.at)!.strength += rules.rally;
      events.push({ type: 'rally', at: b.at, by: rules.rally });
    } else if (b.move === 'sabotage') {
      s.blocked = { ways: b.ways!, until: s.turn + rules.closed - 1 };
      s.lastSabotage = s.turn;
      events.push({ type: 'sabotage', ways: b.ways! });
    }
    return { state: s, events };
  }

  /**
   * A side's elite squad played simply (the rising's, and the computer guard's in the balance tests and when your
   * father takes over): a maiden next to one of theirs she can seduce does; and when one's ready, the king's guard
   * if they're closing on the base, else the hero if there's one of theirs within reach, else the maiden if
   * there's one to seduce.
   */
  eliteActs(s0: RiotState, side: Side): { state: RiotState; events: RiotEvent[] } {
    this.use(s0);
    let s = s0;
    const events: RiotEvent[] = [];
    const apply = (r: { state: RiotState; events: RiotEvent[] }) => ((s = r.state), events.push(...r.events));
    for (const w of this.mine(s, side).filter((q) => q.elite === 'maiden')) {
      const targets = this.seduceTargets(s, w).sort((a, b) => this.squadAt(s, b)!.strength - this.squadAt(s, a)!.strength);
      if (targets[0]) apply(this.seduce(s, w.id, targets[0]));
    }
    if (this.canDeploy(s, side)) {
      const free = this.deployPlaces(s, side);
      const them = this.mine(s, this.other(side));
      const dist = (from: string, to: string) => this.distance(from, to);
      const nearest = (p: string) => Math.min(99, ...them.map((g) => dist(p, g.place)));
      const home = this.squadAt(s, this.base(side));
      const closing = them.some((g) => dist(g.place, this.base(side)) <= 2 && g.strength + 2 >= (home?.side === side ? home.strength : 0));
      const best = [...free].sort((a, b) => nearest(a) - nearest(b) || (this.squadAt(s, a)?.strength ?? 0) - (this.squadAt(s, b)?.strength ?? 0))[0];
      const can = (e: Elite) => this.canDeploy(s, side, e);
      if (can('guard3') && closing) apply(this.deploy(s, side, 'guard3'));
      else if (can('hero') && best && nearest(best) <= 3) apply(this.deploy(s, side, 'hero', best));
      else if (can('maiden') && best && them.some((g) => !g.elite && g.place !== this.heart && g.strength <= this.seduceMax(s, side) && dist(best, g.place) <= 2)) apply(this.deploy(s, side, 'maiden', best));
      else {
        // One given free (a card, a shake-up): put in, rather than kept.
        const gift = (s.elites[side].gifts ?? []).find((e) => can(e));
        if (gift) apply(this.deploy(s, side, gift, gift === 'guard3' ? undefined : best));
      }
    }
    return { state: s, events };
  }

  /** Streets between two places. */
  distance(a: string, b: string): number {
    const seen = new Map([[a, 0]]);
    const todo = [a];
    while (todo.length) {
      const p = todo.shift()!;
      if (p === b) return seen.get(p)!;
      for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
    }
    return 99;
  }

  place = (id: string): RiotPlace => this.board.places.find((p) => p.id === id)!;
  near = (a: string, b: string): boolean => this.adj.get(a)!.includes(b);
  /** Who holds a place (the king's guard, not anyone beside them). */
  squadAt = (s: RiotState, place: string): RiotSquad | undefined => (this.use(s), s.squads.find((q) => q.place === place && !q.beside) ?? s.squads.find((q) => q.place === place));
  /** The number that makes an attack on a base its final clash (Jack): exactly its number, or with walls, its number and the walls. */
  baseClashAt = (s: RiotState, place: string): number => (this.rules.baseWalls ? this.defence(s, place, this.heldBy(s, place)) : this.heldBy(s, place));
  /** Who others of their side can stand beside (Jack): the king's guard, and hired fighters. */
  host = (q: RiotSquad): boolean => q.elite === 'guard3' || !!q.hired;
  /** A squad standing beside the king's guard (or hired fighters) at a place (Jack). */
  besideAt = (s: RiotState, place: string): RiotSquad | undefined => s.squads.find((q) => q.place === place && q.beside);
  /** How strong a place is all told: whoever holds it and anyone beside them. */
  heldBy = (s: RiotState, place: string): number => s.squads.filter((q) => q.place === place && !(q.beside && q.elite === 'hero')).reduce((n, q) => n + q.strength, 0);
  /** Who's beside the king's guard, worked out again (on `s`, a clone): a squad of theirs sharing the place. */
  private settle(s: RiotState): void {
    for (const q of s.squads) q.beside = !this.host(q) && s.squads.some((k) => k !== q && k.place === q.place && this.host(k) && k.side === q.side) ? true : undefined;
  }
  mine = (s: RiotState, side: Side): RiotSquad[] => (this.use(s), s.squads.filter((q) => q.side === side));
  canCut = (s: RiotState): boolean => !s.cut && s.turn - s.lastCut >= this.rules.powerEvery;
  /** Turns until the power can be cut again (0: now). */
  cutIn = (s: RiotState): number => Math.max(0, this.rules.powerEvery - (s.turn - s.lastCut));
  /** Turns until more of the guard come (1: at the end of this one). */
  reinforceIn = (s: RiotState): number => this.rules.reinforceEvery - ((s.turn - 1) % this.rules.reinforceEvery);

  /** The other side. */
  other = (side: Side): Side => (side === 'guard' ? 'rising' : 'guard');

  /** A squad's strength attacking from one place into another: all of it. */
  attack(_from: string, _to: string, strength: number): number {
    return strength;
  }

  /** A squad's strength holding where it is (the square's barricades +1; the power cut −1). */
  defence(s: RiotState, place: string, strength: number): number {
    const walls = this.rules.baseWalls ? (place === this.heart || place === this.lifts ? this.rules.baseWalls : 0) : place === this.heart ? 1 : 0;
    return Math.max(0, strength + walls + (this.rules.towers && this.isTower(place) ? this.rules.towers.walls : 0) - (s.cut === place ? 1 : 0));
  }

  /** Where a squad can go this turn: the streets next to it (nowhere, with its power cut). */
  dests(s: RiotState, q: RiotSquad): string[] {
    this.use(s);
    if (s.cut === q.place) return [];
    // A crusted hero stays where it is (Jack); so does a squad at the brothel, the turn after.
    if (q.crusted || (q.stuck ?? -1) >= s.turn) return [];
    // Nobody joins one of the elite squad, and they join nobody (Jack); but a maiden (witch) can merge into one of
    // hers (poisoning it).
    // Onto one of the king's guard, or hired fighters of yours: a squad of yours stands beside them (Jack).
    // (Hired fighters: the computer's, by `hiredDests`; nobody joins them. Buildings never move.)
    if (q.hired || q.built) return [];
    const joinable = (p: string) => {
      const there = this.squadAt(s, p);
      return !there || there.side !== q.side || (!there.elite && !there.hired && !there.built && (!q.elite || q.elite === 'maiden')) || (this.host(there) && !q.elite);
    };
    // The king's guard hold where they are (Jack).
    if (q.elite === 'guard3') return [];
    // Only their bastard (hero) can hurt your hero, and the other way round (Jack); anyone can go at their king's
    // guard (or barbarians: Jack, it felt like a bug that you couldn't).
    const reach = (p: string) => {
      const there = this.squadAt(s, p);
      if (there && there.side !== q.side && there.elite === 'guard3' && !this.rules.guardsOpen) return false;
      // The maiden goes at one of theirs only to seduce it (Jack).
      if (q.elite === 'maiden' && there && there.side !== q.side) return this.seduceTargets(s, q).includes(p);
      // (Nor their hero: only yours can hurt it, Jack.)
      if (there && there.side !== q.side && there.elite === 'hero') return false;
      return true;
    };
    if (q.elite !== 'hero') return this.adj.get(q.place)!.filter((p) => this.open(s, q.place, p) && joinable(p) && reach(p));
    // A hero: up to two streets, through an empty place or one of its own (never through theirs); never onto the
    // square or the lifts' foot, only at whoever holds them.
    const ok = (p: string) => {
      const there = this.squadAt(s, p);
      // (Nothing it can attack: dug in. Their hero it can: only the two heroes hurt each other, Jack.)
      if (there && there.side !== q.side && this.fortified(s, p)) return false;
      return joinable(p) && there?.side !== q.side && (!(p === this.heart || p === this.lifts) || there?.side === this.other(q.side));
    };
    // (Through theirs too, Jack: it attacks on the way, and if it wins its way in, carries on.)
    const out = new Set<string>();
    for (const n of this.adj.get(q.place)!) {
      if (!this.open(s, q.place, n)) continue;
      const there = this.squadAt(s, n);
      if (ok(n)) out.add(n);
      if (n === this.heart || n === this.lifts || (there && there.side !== q.side && this.fortified(s, n))) continue;
      for (const m of this.adj.get(n)!) if (m !== q.place && this.open(s, n, m) && ok(m)) out.add(m);
    }
    return [...out];
  }

  /**
   * The place between a hero and `to`, two streets off: an empty place or one of its own if there is one, else
   * one of theirs it fights its way through (the smallest). Null if `to` is next door.
   */
  via(s: RiotState, q: RiotSquad, to: string): string | null {
    this.use(s);
    if (this.near(q.place, to)) return null;
    const between = this.adj.get(q.place)!.filter((n) => this.near(n, to) && n !== this.heart && n !== this.lifts && this.open(s, q.place, n) && this.open(s, n, to));
    const clear = between.find((n) => this.squadAt(s, n)?.side !== this.other(q.side));
    if (clear) return clear;
    const theirs = between.filter((n) => !this.fortified(s, n)).sort((a, b) => this.squadAt(s, a)!.strength - this.squadAt(s, b)!.strength);
    return theirs[0] ?? null;
  }

  /**
   * A hero's step (Jack): onto an empty place or through its own; at theirs, it spends what it takes to wipe them
   * out (the square: its number; elsewhere, their number with the power cut). More than enough: in it goes (not
   * onto the square or the lifts' foot: it clears them and stays put); just enough: it clears the place, spent;
   * not enough: it wears them down, spent. Whether it's moved on and can go on.
   */
  private heroStep(s: RiotState, q: RiotSquad, to: string, events: RiotEvent[]): boolean {
    const there = this.squadAt(s, to);
    if (!there || there.side === q.side) {
      q.place = to;
      if (!there) s.owner[to] = q.side;
      return true;
    }
    if (this.fortified(s, to)) {
      events.push({ type: 'blocked', at: to, side: q.side });
      return false;
    }
    // (A hero beside the king's guard: nothing can attack it, so it doesn't count.)
    const beside = this.besideAt(s, to);
    const by = beside?.elite === 'hero' ? undefined : beside;
    const total = there.strength + (by?.strength ?? 0);
    const need = to === this.heart && !this.rules.baseWalls ? total : this.defence(s, to, total) + (this.rules.baseWalls && (to === this.heart || to === this.lifts) ? 1 : 0);
    const enough = q.strength >= need;
    events.push({ type: 'fight', at: to, side: q.side, won: enough, attack: q.strength, defence: need });
    let moved = false;
    if (enough) {
      s.squads = s.squads.filter((x) => x !== there && x !== by);
      if (there.elite === 'hero') events.push({ type: 'eliteGone', at: to, side: there.side, elite: 'hero' });
      s.owner[to] = q.side;
      moved = q.strength > need && to !== this.heart && to !== this.lifts;
      q.strength -= need;
      if (moved) q.place = to;
    } else {
      there.strength = Math.max(1, there.strength - q.strength);
      q.strength = 0;
    }
    if (q.strength <= 0) {
      s.squads = s.squads.filter((x) => x !== q);
      events.push({ type: 'eliteGone', at: to, side: q.side, elite: 'hero' });
    }
    return moved;
  }

  /** The power cut, under a place, for this turn. */
  cutPower(s0: RiotState, at: string): RiotState {
    if (!this.canCut(s0)) return s0;
    const s = this.clone(s0);
    s.cut = at;
    s.lastCut = s.turn;
    return s;
  }

  /**
   * One order carried out (orders that can't happen now do nothing). `counter`: the other side's orders this
   * turn, for clashes (Jack).
   */
  order(s0: RiotState, o: Order, counter?: Order[]): { state: RiotState; events: RiotEvent[] } {
    const r = this.orderOne(s0, o, counter);
    if (r.state !== s0) this.settle(r.state);
    // A tower changing hands (Jack): "Captured!".
    const from = s0.squads.find((q) => q.id === o.squad)?.place;
    for (const t of this.towerList()) if (r.state.owner[t.place] && r.state.owner[t.place] !== s0.owner[t.place]) r.events.push({ type: 'captured', at: t.place, side: r.state.owner[t.place]!, ...(from && from !== t.place ? { from } : {}) });
    return r;
  }

  private orderOne(s0: RiotState, o: Order, counter?: Order[]): { state: RiotState; events: RiotEvent[] } {
    this.use(s0);
    const s = this.clone(s0);
    const q0 = s.squads.find((x) => x.id === o.squad);
    // (A fortified squad stays put.)
    if (!q0 || (o.side && q0.side !== o.side) || o.to === q0.place || !(q0.hired ? (o.auto ? this.hiredDests(s, q0) : []) : this.dests(s, q0)).includes(o.to) || this.fortified(s, q0.place) || s.held?.includes(q0.id)) return { state: s, events: [] };
    let q = q0;
    const events: RiotEvent[] = [];
    // Split (Jack): the bigger half goes; the rest stays (a hero can't be split; nor can a squad of 1).
    if (o.split) {
      if (q.elite || q.strength < 2 || !this.canSplit(s, q.side)) return { state: s, events: [] };
      s.lastSplit[q.side] = s.turn;
      const half: RiotSquad = { id: `q${s.nextId++}`, side: q.side, place: q.place, strength: Math.ceil(q.strength / 2) };
      q.strength -= half.strength;
      // (Poisoned: the half that goes takes it with it.)
      if (q.poison) (half.poison = true), (q.poison = undefined);
      if (q.cheer) half.cheer = true;
      s.squads.push(half);
      events.push({ type: 'split', squad: half.id, from: q.place, strength: half.strength });
      q = half;
    }
    // Straight at one of theirs coming straight at it, the same number: a clash (Jack).
    // (Not half a squad split off: the rest would still be standing where the winner goes.)
    const foe = o.split ? null : this.clashWith(s, q, o.to, counter);
    if (foe) {
      this.clash(s, q, foe, events);
      return { state: s, events };
    }
    // A hero (Jack): one street or two, fighting its way through the first if it has to, and on if it wins its way in.
    if (q.elite === 'hero') {
      // (The way you chose, if it's one it can go: Jack.)
      const chosen = o.via && this.near(q.place, o.via) && this.near(o.via, o.to) && o.via !== this.heart && o.via !== this.lifts && this.dests(s, q).includes(o.via) ? o.via : null;
      const via = this.near(q.place, o.to) && !o.via ? null : chosen ?? this.via(s, q, o.to);
      if (!this.near(q.place, o.to) && !via) return { state: this.clone(s0), events: [] };
      const from = q.place;
      for (const step of via ? [via, o.to] : [o.to]) if (!this.heroStep(s, q, step, events) || !s.squads.includes(q)) break;
      if (s.squads.includes(q) && q.place !== from) events.unshift({ type: 'move', squad: q.id, side: q.side, from, to: q.place });
      if (s.rumble && s.squads.includes(q) && q.place === s.rumble.place) this.setOff(s, q.place, q.side, events);
      this.takeTokens(s, events);
      return { state: s, events };
    }
    const from = q.place;
    const there = this.squadAt(s, o.to);
    // The maiden onto one of theirs: seduced (Jack: no button, it's just what she does).
    if (q.elite === 'maiden' && there && there.side !== q.side) {
      const r = this.seduce(s, q.id, o.to);
      return { state: r.state, events: r.events };
    }
    // Both going for the same empty place at once (Jack): for something on the map, a race (the winner gets it,
    // the loser stays put, untouched); otherwise, the same number each, a clash there.
    if (!there && this.rules.clash) {
      const rival = this.rivalFor(s, q, o.to, counter);
      if (rival) {
        const what = this.tokenAt(s, o.to);
        if (what) return this.race(s, q, rival, o.to, what, events, o.squad);
        if (rival.strength === q.strength && q.elite !== 'maiden' && rival.elite !== 'maiden' && !o.split) {
          this.clash(s, q, rival, events, o.to);
          return { state: s, events };
        }
      }
    }
    // Their base, with exactly its number (Jack): the final clash.
    if (there && there.side !== q.side && this.rules.clash && !q.elite && there.place === this.base(there.side) && q.strength === this.baseClashAt(s, o.to) && !this.fortified(s, o.to)) {
      this.clash(s, q, there, events, undefined, true);
      return { state: s, events };
    }
    if (!there) {
      q.place = o.to;
      s.owner[o.to] = q.side;
      events.push({ type: 'move', squad: q.id, side: q.side, from, to: o.to });
    } else if (there.side === q.side && this.host(there)) {
      // Beside the king's guard or hired fighters (Jack): with whoever's already beside them, or standing there alone.
      const by = this.besideAt(s, o.to);
      if (by && by !== q) (by.strength += q.strength), (s.squads = s.squads.filter((x) => x !== q));
      else q.place = o.to;
      events.push({ type: 'move', squad: q.id, side: q.side, from, to: o.to });
    } else if (there.side === q.side) {
      there.strength += q.strength;
      s.squads = s.squads.filter((x) => x !== q);
      events.push({ type: 'move', squad: q.id, side: q.side, from, to: o.to }, { type: 'join', squad: q.id, into: there.id, at: o.to });
      // A maiden (witch) merging in poisons it (Jack); a poisoned squad joining another poisons that.
      if (q.elite === 'maiden' && !there.poison) events.push({ type: 'poison', at: o.to, side: q.side });
      if (q.elite === 'maiden' || q.poison) there.poison = true;
      if (q.cheer) there.cheer = true;
    } else if (this.fortified(s, o.to) || there.elite === 'hero' || (there.elite === 'guard3' && !this.rules.guardsOpen)) {
      // Dug in, or a hero (only the other hero can attack one: Jack): the attack doesn't happen, and they stay
      // where they are.
      events.push({ type: 'blocked', at: o.to, side: q.side });
    } else {
      // Poisoned (Jack): a chance of a critical hit, adding 10 to 60% to the attack (rounded).
      const c = this.rules.elites?.crit;
      const fav = this.favour(s, q.side);
      const crit = q.poison && c && fav >= 0 && (fav > 0 || this.roll(s) < c.chance) ? Math.max(1, Math.round(q.strength * (fav > 0 ? c.most : c.least + this.roll(s) * (c.most - c.least)))) : 0;
      const attack = this.attack(from, o.to, q.strength) + crit;
      // (The king's guard and anyone beside them stand together: Jack.)
      const by = this.besideAt(s, o.to);
      const defence = this.defence(s, o.to, there.strength + (by?.strength ?? 0));
      // The square: match its number and you've taken it (Jack: 9 on its 8 bounced off the barricades, which was
      // confusing); the barricades still cost one more, but you keep at least 1. Elsewhere a tie holds, as ever
      // (tried everywhere, it broke "Now." and made the rising's ties win too: docs/sequences/chapter-3/war-table.md).
      // Blessed, your attack wins on a tie; cursed, theirs on you does (Jack: their number matching yours).
      const tie = q.strength === this.heldBy(s, o.to) && this.favour(s, q.side) - this.favour(s, there.side) > 0;
      const won = attack > defence || (o.to === this.heart && !this.rules.baseWalls && attack >= there.strength) || tie;
      events.push({ type: 'fight', at: o.to, side: q.side, won, attack, defence, ...(crit ? { crit } : {}) });
      if (won) {
        s.squads = s.squads.filter((x) => x !== there && x !== by);
        q.place = o.to;
        // (A critical hit costs them more, never adds to yours.)
        q.strength = Math.max(1, Math.min(q.strength, attack - defence));
        if (tie && attack <= defence) q.strength = 1;
        s.owner[o.to] = q.side;
      } else {
        // Beaten off: the attackers are lost, and the defenders lose as many (they keep at least 1): the king's
        // guard first, then anyone beside them (Jack).
        s.squads = s.squads.filter((x) => x !== q);
        let hurt = Math.min(attack, there.strength + (by?.strength ?? 0) - 1);
        const first = Math.min(hurt, there.strength);
        there.strength -= first;
        hurt -= first;
        if (by) by.strength -= hurt;
        s.squads = s.squads.filter((x) => x.strength > 0);
      }
    }
    // Onto a rumble: it goes off.
    if (s.rumble && q.place === s.rumble.place && s.squads.includes(q)) this.setOff(s, q.place, q.side, events);
    this.takeTokens(s, events);
    return { state: s, events };
  }

  /** Whatever's on the map where a squad now stands, taken (on `s`, already a clone). */
  private takeTokens(s: RiotState, events: RiotEvent[]): void {
    this.takeCrest(s, events);
    this.takeMystery(s, events);
    this.takeBrothel(s, events);
    this.takeAudience(s, events);
    this.takeChurch(s, events);
    this.takeBarracks(s, events);
    this.takeArchitect(s, events);
  }

  /** A squad onto the architect (Jack): what will he build, and where? (Waits on a choice: `pending`.) */
  private takeArchitect(s: RiotState, events: RiotEvent[]): void {
    const there = s.architect && this.squadAt(s, s.architect.place);
    if (!s.architect || !there) return;
    s.pending = { kind: 'architect', side: there.side, at: s.architect.place };
    events.push({ type: 'architectFound', at: s.architect.place, side: there.side });
    s.architect = null;
  }

  /** Where a side can build (Jack: its side of the board): empty places it holds, or nearer its base than theirs; not a base, a tower, or anything on the map. */
  buildPlaces(s: RiotState, side: Side): string[] {
    this.use(s);
    const far = (from: string, to: string): number => {
      const seen = new Map([[from, 0]]);
      const todo = [from];
      while (todo.length) {
        const p = todo.shift()!;
        if (p === to) return seen.get(p)!;
        for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
      }
      return 99;
    };
    const [mine, theirs] = [this.base(side), this.base(this.other(side))];
    return this.board.places.map((p) => p.id).filter((p) => p !== mine && p !== theirs && !this.squadAt(s, p) && !this.isTower(p) && !this.tokenAt(s, p) && (s.owner[p] === side || (s.owner[p] !== this.other(side) && far(p, mine) < far(p, theirs))));
  }

  /** What, and where, the computer has the architect build: a fortress next to its base if there's room, else artillery nearest the other side. */
  buildFor(s: RiotState, side: Side): { building: Building; at: string } | null {
    const places = this.buildPlaces(s, side);
    if (!places.length) return null;
    const home = places.find((p) => this.near(p, this.base(side)) || this.towerList().some((t) => s.owner[t.place] === side && this.near(p, t.place)));
    if (home && this.roll(s) < 0.5) return { building: 'fortress', at: home };
    const foe = this.mine(s, this.other(side));
    const near = (p: string) => this.adj.get(p)!.filter((n) => foe.some((q) => q.place === n)).length;
    const at = [...places].sort((a, b) => near(b) - near(a) || a.localeCompare(b))[0]!;
    return { building: this.roll(s) < 0.8 ? 'artillery' : 'storehouse', at };
  }

  /** Built (on `s`, a clone). */
  private build(s: RiotState, side: Side, building: Building, at: string, events: RiotEvent[]): void {
    const a = this.rules.architect ?? ARCHITECT;
    if (!this.buildPlaces(s, side).includes(at)) return;
    const q: RiotSquad = { id: `q${s.nextId++}`, side, place: at, strength: 1, built: building };
    if (building === 'artillery') (q.strength = a.artillery.strength), (q.fortUntil = s.turn + a.artillery.dugIn - 1);
    if (building === 'storehouse') q.strength = a.storehouse.strength;
    if (building === 'fortress') (q.until = s.turn + a.fortress.lasts - 1), (q.fortUntil = q.until);
    s.squads.push(q);
    s.owner[at] = side;
    if (q.fortUntil !== undefined) s.fortified = [...new Set([...s.fortified, at])];
    events.push({ type: 'built', side, building, at });
  }

  /** The storehouse's doubling (Jack): 2 while one of a side's stands, else 1. */
  stored = (s: RiotState, side: Side): number => (s.squads.some((q) => q.side === side && q.built === 'storehouse') ? (this.rules.architect ?? ARCHITECT).storehouse.times : 1);
  /** How many a side's maiden can seduce (doubled by a storehouse). */
  seduceMax = (s: RiotState, side: Side): number => (this.rules.elites?.maiden.seduceMax ?? 0) * this.stored(s, side);
  /** A fortress of a side's next to a place (its base or a tower: Jack, +1 a turn). */
  fortressBy = (s: RiotState, side: Side, place: string): number => (s.squads.some((q) => q.side === side && q.built === 'fortress' && this.near(q.place, place)) ? (this.rules.architect ?? ARCHITECT).fortress.makes : 0);

  /** A squad onto the barracks (Jack): who to hire? (Waits on a choice: `pending`.) */
  private takeBarracks(s: RiotState, events: RiotEvent[]): void {
    const there = s.barracks && this.squadAt(s, s.barracks.place);
    if (!s.barracks || !there) return;
    s.pending = { kind: 'barracks', side: there.side, at: s.barracks.place };
    events.push({ type: 'barracksFound', at: s.barracks.place, side: there.side });
    s.barracks = null;
  }

  /** Who the computer hires (the rising's, or a test's): an assassin when their base is in reach of one, else rogues, or archers when theirs are about. */
  hireFor(s: RiotState, side: Side, at: string): Hire {
    const foe = this.other(side);
    const near = this.adj.get(at)!.filter((p) => this.squadAt(s, p)?.side === foe).length;
    if (near >= 2) return 'archers';
    return this.roll(s) < 0.35 ? 'assassin' : 'rogues';
  }

  /** Fighters hired (on `s`, a clone): out on the empty places nearest the barracks. */
  private hire(s: RiotState, side: Side, at: string, hire: Hire, events: RiotEvent[]): void {
    const b = this.rules.barracks ?? BARRACKS;
    const [count, strength, kind] = hire === 'rogues' ? [b.rogues.count, b.rogues.strength, 'rogue' as const] : hire === 'archers' ? [b.archers.count, b.archers.strength, 'archer' as const] : [1, b.assassin.strength, 'assassin' as const];
    // The nearest empty places (next to it first; not the bases, the square or the lifts' foot).
    const seen = new Map([[at, 0]]);
    const todo = [at];
    const free: string[] = [];
    while (todo.length && free.length < count) {
      const p = todo.shift()!;
      for (const n of this.adj.get(p)!) {
        if (seen.has(n)) continue;
        seen.set(n, seen.get(p)! + 1);
        todo.push(n);
        if (!this.squadAt(s, n) && n !== this.heart && n !== this.lifts && !this.tokenAt(s, n) && free.length < count) free.push(n);
      }
    }
    for (const p of free) {
      s.squads.push({ id: `q${s.nextId++}`, side, place: p, strength, hired: kind });
      s.owner[p] = side;
    }
    events.push({ type: 'hired', side, hire, at: free });
  }

  /** Where a hired fighter can go (Jack: the computer plays it): rogues one street (not onto their own, not at a hero or the king's guard); the assassin two through empty places; archers nowhere. */
  private hiredDests(s: RiotState, q: RiotSquad): string[] {
    if (q.hired === 'archer') return [];
    const ok = (from: string, p: string) => {
      const there = this.squadAt(s, p);
      if (!this.open(s, from, p)) return false;
      if (q.hired === 'assassin') return !there;
      return !there || (there.side !== q.side && there.elite !== 'hero' && (there.elite !== 'guard3' || !!this.rules.guardsOpen) && !this.fortified(s, p));
    };
    const one = this.adj.get(q.place)!.filter((p) => ok(q.place, p));
    if (q.hired !== 'assassin') return one;
    return [...new Set([...one, ...one.flatMap((p) => this.adj.get(p)!.filter((m) => m !== q.place && ok(p, m)))])];
  }

  /**
   * What the hired fighters do this turn (Jack: the computer plays them), as orders: a rogue at one of the other
   * side's next to it it beats, or a street towards the nearest it could; the assassin two streets nearer their
   * base by the safest way (keeping clear of anyone who'd beat it), or none once it's next to it.
   */
  hiredOrders(s: RiotState): Order[] {
    this.use(s);
    const orders: Order[] = [];
    const claimed = new Set<string>();
    const dist = (from: string, goal: (p: string) => boolean, avoid?: (p: string) => number): number => {
      // (Cheapest way, counting a step next to danger as 4.)
      const cost = new Map([[from, 0]]);
      const todo = [from];
      let best = 99;
      while (todo.length) {
        todo.sort((a, b) => cost.get(a)! - cost.get(b)!);
        const p = todo.shift()!;
        if (goal(p)) best = Math.min(best, cost.get(p)!);
        for (const n of this.adj.get(p)!) {
          const c = cost.get(p)! + 1 + (avoid ? avoid(n) : 0);
          if (c < (cost.get(n) ?? 99)) (cost.set(n, c), todo.push(n));
        }
      }
      return best;
    };
    for (const q of s.squads.filter((x) => x.hired && x.hired !== 'archer')) {
      const foe = this.other(q.side);
      const dests = this.hiredDests(s, q).filter((p) => !claimed.has(p));
      let to: string | undefined;
      if (q.hired === 'rogue') {
        const beats = (p: string) => {
          const there = this.squadAt(s, p);
          return !!there && there.side === foe && there.elite !== 'hero' && (there.elite !== 'guard3' || !!this.rules.guardsOpen) && !this.fortified(s, p) && q.strength > this.defence(s, p, this.heldBy(s, p));
        };
        to = dests.filter(beats).sort((a, b) => this.squadAt(s, b)!.strength - this.squadAt(s, a)!.strength)[0];
        if (!to) {
          const here = dist(q.place, beats);
          to = dests.filter((p) => !this.squadAt(s, p)).sort((a, b) => dist(a, beats) - dist(b, beats))[0];
          if (to && dist(to, beats) >= here) to = undefined;
        }
      } else {
        const base = this.base(foe);
        if (this.near(q.place, base)) continue;
        const danger = (p: string) => (this.adj.get(p)!.some((n) => this.squadAt(s, n)?.side === foe && this.squadAt(s, n)!.strength >= q.strength && n !== base) ? 4 : 0);
        const here = dist(q.place, (p) => this.near(p, base), danger);
        to = dests.sort((a, b) => dist(a, (p) => this.near(p, base), danger) + danger(a) - (dist(b, (p) => this.near(p, base), danger) + danger(b)))[0];
        if (to && dist(to, (p) => this.near(p, base), danger) + danger(to) > here) to = undefined;
      }
      if (to) (orders.push({ squad: q.id, to, side: q.side, auto: true }), claimed.add(to));
    }
    return orders;
  }

  /**
   * At the end of the turn (on `s`, a clone), the hired fighters' shots (Jack): each archer shoots one of the other
   * side's next to it for 1 (the weakest, to finish it); the assassin next to their base strikes it, and is gone.
   */
  private hiredStrike(s: RiotState, events: RiotEvent[]): void {
    const b = this.rules.barracks ?? BARRACKS;
    for (const a of s.squads.filter((x) => x.hired === 'archer')) {
      const foe = this.other(a.side);
      const targets = this.adj.get(a.place)!.map((p) => this.squadAt(s, p)).filter((t): t is RiotSquad => !!t && t.side === foe && !this.fortified(s, t.place) && t.place !== this.base(foe)).sort((x, y) => x.strength - y.strength);
      const t = targets[0];
      if (!t) continue;
      t.strength -= b.archers.damage;
      const gone = t.strength <= 0;
      if (gone) s.squads = s.squads.filter((x) => x !== t);
      if (gone && t.elite) events.push({ type: 'eliteGone', at: t.place, side: t.side, elite: t.elite });
      events.push({ type: 'arrow', side: a.side, from: a.place, at: t.place, damage: b.archers.damage, gone });
    }
    // Artillery (Jack): the biggest of the other side's next to it it can hurt, for 3.
    const art = (this.rules.architect ?? ARCHITECT).artillery;
    for (const a of s.squads.filter((x) => x.built === 'artillery')) {
      const foe = this.other(a.side);
      const t = this.adj.get(a.place)!.map((p) => this.squadAt(s, p)).filter((x): x is RiotSquad => !!x && x.side === foe && !this.fortified(s, x.place) && x.place !== this.base(foe)).sort((x, y) => y.strength - x.strength)[0];
      if (!t) continue;
      t.strength -= art.shot;
      const gone = t.strength <= 0;
      if (gone) s.squads = s.squads.filter((x) => x !== t);
      if (gone && t.elite) events.push({ type: 'eliteGone', at: t.place, side: t.side, elite: t.elite });
      events.push({ type: 'shell', side: a.side, from: a.place, at: t.place, damage: art.shot, gone });
    }
    for (const a of s.squads.filter((x) => x.hired === 'assassin')) {
      const base = this.base(this.other(a.side));
      const there = this.squadAt(s, base);
      if (!this.near(a.place, base)) continue;
      const crit = this.roll(s) < b.assassin.crit;
      const damage = a.strength * (crit ? b.assassin.critTimes : 1);
      if (there && there.side !== a.side) there.strength = Math.max(1, there.strength - damage);
      s.squads = s.squads.filter((x) => x !== a);
      events.push({ type: 'assassin', side: a.side, at: base, damage, crit });
    }
  }

  /** A squad onto the holy cross (Jack): an audience with the Lord for its side. */
  private takeChurch(s: RiotState, events: RiotEvent[]): void {
    const there = s.church && this.squadAt(s, s.church.place);
    if (!s.church || !there) return;
    s.pending = { kind: 'prayer', side: there.side };
    events.push({ type: 'churchFound', at: s.church.place, side: there.side });
    s.church = null;
  }

  /** What's on the map at a place, if anything. */
  tokenAt(s: RiotState, place: string): Token | null {
    if (s.crest?.place === place) return 'crest';
    if (s.mystery?.place === place) return 'mystery';
    if (s.rumble?.place === place) return 'rumble';
    if (s.brothel?.place === place) return 'brothel';
    if (s.audience?.place === place) return 'audience';
    if (s.church?.place === place) return 'church';
    if (s.barracks?.place === place) return 'barracks';
    if (s.architect?.place === place) return 'architect';
    return null;
  }

  /**
   * One of theirs ordered onto the same empty place this turn (Jack), that can get there: not split off, not dug
   * in or cut off, not already beaten to something.
   */
  rivalFor(s: RiotState, q: RiotSquad, to: string, counter?: Order[]): RiotSquad | null {
    if (!counter) return null;
    for (const x of counter) {
      const r = s.squads.find((y) => y.id === x.squad);
      if (!r || r.side === q.side || x.to !== to || x.split || r.place === to || (x.side && x.side !== r.side)) continue;
      if (s.held?.includes(r.id) || this.fortified(s, r.place) || s.cut === r.place || !this.dests(s, r).includes(to)) continue;
      return r;
    }
    return null;
  }

  /** One squad 5 or more bigger than the other, and half as big again: no race, it gets there first (Jack). */
  overwhelms = (a: number, b: number): boolean => Math.abs(a - b) >= RACE.overwhelm && Math.max(a, b) >= Math.min(a, b) * RACE.rout;

  /**
   * How many more of a side are heading for a place this turn (Jack: from three directions at once, they race as
   * one): the side's squads ordered there that can get there (a split, the half that goes), but those in `skip`.
   */
  heading(s: RiotState, side: Side, to: string, orders: readonly Order[], skip: readonly string[] = []): { strength: number; ids: string[] } {
    let strength = 0;
    const ids: string[] = [];
    for (const x of orders) {
      const r = s.squads.find((y) => y.id === x.squad);
      if (!r || r.side !== side || x.to !== to || r.place === to || skip.includes(r.id) || ids.includes(r.id) || (x.side && x.side !== r.side)) continue;
      if (s.held?.includes(r.id) || this.fortified(s, r.place) || s.cut === r.place || r.hired || r.built || !this.dests(s, r).includes(to)) continue;
      strength += x.split ? Math.ceil(r.strength / 2) : r.strength;
      ids.push(r.id);
    }
    return { strength, ids };
  }

  /**
   * A race for something on the map (Jack): the odds as for a clash; the winner goes on there and takes it, the
   * loser stays where it is, untouched (and stays there this turn). Everyone each side is sending there this turn
   * counts (Jack), and all the loser's stay where they are.
   */
  private race(s: RiotState, q: RiotSquad, rival: RiotSquad, to: string, what: Token, events: RiotEvent[], lead?: string): { state: RiotState; events: RiotEvent[] } {
    const ours = this.heading(s, q.side, to, this.ownOrders, [q.id, ...(lead ? [lead] : [])]);
    const them = this.heading(s, rival.side, to, this.otherOrders, [rival.id]);
    const [mine, theirs] = [q.strength + ours.strength, rival.strength + them.strength];
    const outright = this.overwhelms(mine, theirs);
    const chance = outright ? (mine > theirs ? 1 : 0) : this.clashOdds(s, { ...q, strength: mine }, to, { ...rival, strength: theirs }, true).chance;
    const won = outright ? mine > theirs : this.roll(s) < chance;
    const [winner, loser] = won ? [q, rival] : [rival, q];
    // (All the loser's that were on their way stay where they are.)
    const stay = won ? them.ids : ours.ids;
    q.cheer = rival.cheer = undefined;
    // The Lord's judgement on it (Jack): this once, the loser's wiped out (the heretic's, or whoever faced the blessed).
    const judged = this.favour(s, q.side) !== this.favour(s, rival.side);
    events.push({ type: 'race', at: to, from: q.place, rival: rival.place, side: q.side, won, chance, what, strength: mine, rivalStrength: theirs, ...(judged ? { wiped: true } : {}), ...(outright ? { outright: true } : {}) });
    if (judged) s.squads = s.squads.filter((x) => x !== loser);
    const from = winner.place;
    winner.place = to;
    s.owner[to] = winner.side;
    events.push({ type: 'move', squad: winner.id, side: winner.side, from, to });
    s.held = [...(s.held ?? []), loser.id, winner.id, ...stay];
    if (s.rumble?.place === to) this.setOff(s, to, winner.side, events);
    this.takeTokens(s, events);
    return { state: s, events };
  }
  // --- The mystery square (Jack) ---

  /** A squad on the mystery square (on `s`, already a clone): what it turns out to be. */
  private takeMystery(s: RiotState, events: RiotEvent[]): void {
    const m = this.rules.mystery;
    const there = s.mystery && this.squadAt(s, s.mystery.place);
    if (!m || !s.mystery || !there) return;
    const at = s.mystery.place;
    const side = there.side;
    let what: Mystery = s.mystery.mark ?? 'diviner';
    if (!s.mystery.mark) {
      let r = this.roll(s);
      for (const k of ['diviner', 'thief', 'plague', 'trickster'] as const) {
        what = k;
        if ((r -= m.weights[k]) < 0) break;
      }
    }
    s.mystery = null;
    events.push({ type: 'mystery', at, side, what });
    if (what === 'diviner') s.pending = { kind: 'diviner', side, at, cards: this.drawCards(s, side) };
    else if (what === 'thief') {
      if (this.thiefTargets(s, side).length) s.pending = { kind: 'thief', side, at };
    } else if (what === 'plague') this.plagueOn(s, side, events);
    else this.trick(s, side, events);
  }

  /**
   * The trickster (Jack): every street changes; the same places, joined up differently (somewhere two or three
   * streets off can be next door now). Kept easy to read: no streets crossing, none running past a place, at
   * most four from any place, about as many as before, everywhere still reachable; and the square never right
   * next to the lifts' foot.
   */
  private trick(s: RiotState, side: Side, events: RiotEvent[]): void {
    const places = this.board.places;
    const at = new Map(places.map((p) => [p.id, p]));
    const want = this.board.ways.length;
    const pairs: [string, string, number][] = [];
    for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++) {
      const [a, b] = [places[i]!, places[j]!];
      pairs.push([a.id, b.id, Math.hypot(a.x - b.x, a.y - b.y)]);
    }
    const cross = (p: [string, string], q: [string, string]) => {
      if (p[0] === q[0] || p[0] === q[1] || p[1] === q[0] || p[1] === q[1]) return false;
      const [a, b, c, d] = [at.get(p[0])!, at.get(p[1])!, at.get(q[0])!, at.get(q[1])!];
      const o = (u: RiotPlace, v: RiotPlace, w: RiotPlace) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
      return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
    };
    const past = (a: RiotPlace, b: RiotPlace) => places.some((p) => {
      if (p === a || p === b) return false;
      const [vx, vy] = [b.x - a.x, b.y - a.y];
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy)));
      return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t)) < 14;
    });
    for (let attempt = 0; attempt < 12; attempt++) {
      // Shorter streets more likely, but not always: the point is somewhere far can be close.
      const order = pairs.map((p) => [p, p[2] * (0.5 + this.roll(s) * 1.5)] as const).sort((x, y) => x[1] - y[1]).map((x) => x[0]);
      const ways: [string, string][] = [];
      const deg = new Map(places.map((p) => [p.id, 0]));
      const root = new Map(places.map((p) => [p.id, p.id]));
      const find = (x: string): string => (root.get(x) === x ? x : find(root.get(x)!));
      // (Two streets out of a place never too close in angle, Jack: they're hard to tell apart.)
      const narrow = (a: string, b: string) => ways.some((w) => {
        const c = w[0] === a ? w[1] : w[1] === a ? w[0] : null;
        if (!c) return false;
        const [pa, pb, pc] = [at.get(a)!, at.get(b)!, at.get(c)!];
        const d = Math.abs(Math.atan2(pb.y - pa.y, pb.x - pa.x) - Math.atan2(pc.y - pa.y, pc.x - pa.x));
        return Math.min(d, 2 * Math.PI - d) < 0.4;
      });
      const ok = (a: string, b: string) => deg.get(a)! < 4 && deg.get(b)! < 4 && !((a === this.heart && b === this.lifts) || (a === this.lifts && b === this.heart)) && !past(at.get(a)!, at.get(b)!) && !ways.some((w) => cross(w, [a, b])) && !narrow(a, b) && !narrow(b, a);
      const add = (a: string, b: string) => (ways.push([a, b]), deg.set(a, deg.get(a)! + 1), deg.set(b, deg.get(b)! + 1));
      // Everywhere joined up first, then more till there are as many as before.
      for (const [a, b] of order) if (find(a) !== find(b) && ok(a, b)) (add(a, b), root.set(find(a), find(b)));
      if (new Set(places.map((p) => find(p.id))).size > 1) continue;
      for (const [a, b] of order) if (ways.length < want && !ways.some((w) => (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a)) && ok(a, b)) add(a, b);
      // (Not the square two streets from the lifts' foot either: too quick a way in.)
      this.useWays(ways);
      const close = this.distance(this.heart, this.lifts) < 3;
      this.use(s);
      if (close) continue;
      s.ways = ways;
      this.use(s);
      events.push({ type: 'trickster', side, ways });
      return;
    }
  }

  /** Three cards from the diviner, all different (an elite only if it's still to be used). */
  private drawCards(s: RiotState, side: Side): Card[] {
    const mine = s.elites[side];
    const deck = CARDS.filter((c) => !(ELITES as readonly string[]).includes(c) || (!!this.rules.elites && this.eliteFree(s, side, c as Elite) && !(mine.gifts ?? []).includes(c as Elite)));
    const out: Card[] = [];
    while (out.length < 3 && deck.length) out.push(deck.splice(Math.floor(this.roll(s) * deck.length), 1)[0]!);
    return out;
  }

  /** Who a thief can rob: any of theirs but their base. */
  thiefTargets = (s: RiotState, side: Side): string[] => this.mine(s, this.other(side)).filter((q) => q.place !== this.base(q.side) && !q.beside).map((q) => q.place);

  /** The plague on a side (Jack). */
  private plagueOn(s: RiotState, side: Side, events: RiotEvent[]): void {
    s.plague = { guard: s.plague?.guard ?? 0, rising: s.plague?.rising ?? 0, [side]: this.rules.mystery?.plagueTurns ?? 3 };
    events.push({ type: 'plague', side });
  }

  /**
   * What's waiting decided: the diviner's card (`choice`, which of the three; or the dice), or where the thief
   * goes (`choice`, the place; or the biggest of theirs it can reach).
   */
  resolve(s0: RiotState, choice?: number | string): { state: RiotState; events: RiotEvent[] } {
    this.use(s0);
    const p = s0.pending;
    if (!p) return { state: s0, events: [] };
    const s = this.clone(s0);
    s.pending = null;
    const events: RiotEvent[] = [];
    if (p.kind === 'audience') this.hear(s, p.side, p.good, typeof choice === 'string' ? choice : undefined, events);
    else if (p.kind === 'prayer') this.judge(s, p.side, events);
    else if (p.kind === 'architect') {
      // (`building:place`, or the computer's choice.)
      const [b, at] = typeof choice === 'string' ? choice.split(':') : [];
      const pick = (BUILDINGS as readonly string[]).includes(b ?? '') && at ? { building: b as Building, at } : this.buildFor(s, p.side);
      if (pick) this.build(s, p.side, pick.building, pick.at, events);
    } else if (p.kind === 'barracks') this.hire(s, p.side, p.at, typeof choice === 'string' && (HIRES as readonly string[]).includes(choice) ? (choice as Hire) : this.hireFor(s, p.side, p.at), events);
    else if (p.kind === 'diviner') {
      const i = typeof choice === 'number' ? choice : Math.floor(this.roll(s) * p.cards.length);
      const card = p.cards[i] ?? p.cards[0]!;
      this.playCard(s, p.side, p.at, card, events);
    } else {
      const targets = this.thiefTargets(s, p.side);
      const at = typeof choice === 'string' && targets.includes(choice) ? choice : [...targets].sort((a, b) => this.squadAt(s, b)!.strength - this.squadAt(s, a)!.strength)[0];
      if (at) this.steal(s, p.side, at, events);
    }
    return { state: s, events };
  }

  /** A card played (Jack). */
  private playCard(s: RiotState, side: Side, at: string, card: Card, events: RiotEvent[]): void {
    const m = this.rules.mystery ?? MYSTERY;
    const changes: { place: string; by: number }[] = [];
    const add = (q: RiotSquad | undefined, by: number) => {
      if (!q || !by) return;
      q.strength += by;
      changes.push({ place: q.place, by });
    };
    // (Any squad, the elite squad too: Jack.)
    const ordinary = (q: RiotSquad | undefined): q is RiotSquad => !!q;
    const home = () => {
      const h = this.squadAt(s, this.base(side));
      if (h?.side === side) return h;
      if (!h && s.owner[this.base(side)] === side) {
        const q: RiotSquad = { id: `q${s.nextId++}`, side, place: this.base(side), strength: 0 };
        s.squads.push(q);
        return q;
      }
      return undefined;
    };
    if ((ELITES as readonly string[]).includes(card)) {
      const mine = s.elites[side];
      mine.gifts = [...(mine.gifts ?? []), card as Elite];
    } else if (card === 'joker') {
      // Everything next to it (not either base), either side's, thrown up: 1 to the most there (up to 10).
      const round = this.adj.get(at)!.filter((p) => p !== this.heart && p !== this.lifts).map((p) => this.squadAt(s, p)).filter(ordinary);
      const top = Math.min(m.jokerMost, Math.max(0, ...round.map((q) => q.strength)));
      for (const q of round) add(q, 1 + Math.floor(this.roll(s) * top) - q.strength);
    } else if (card === 'jack') {
      for (const p of this.adj.get(at)!) {
        const q = this.squadAt(s, p);
        if (ordinary(q) && q.side === side) add(q, m.jack);
      }
    } else if (card === 'king') add(home(), m.king);
    else if (card === 'queen') {
      const mine = this.mine(s, side).filter(ordinary);
      add(mine[Math.floor(this.roll(s) * mine.length)], m.queen);
    } else if (card === 'ace') {
      const q = this.squadAt(s, at);
      add(ordinary(q) && q.side === side ? q : home(), m.ace);
    } else this.plagueOn(s, side, events);
    s.squads = s.squads.filter((q) => q.strength > 0);
    events.unshift({ type: 'card', side, at, card, changes });
  }

  /** The thief (Jack): takes up to 3 from one of theirs (it can wipe it out), and adds them to your base. */
  private steal(s: RiotState, side: Side, at: string, events: RiotEvent[]): void {
    const q = this.squadAt(s, at)!;
    const stolen = Math.min(q.strength, this.rules.mystery?.steal ?? 3);
    q.strength -= stolen;
    const gone = q.strength <= 0;
    if (gone) s.squads = s.squads.filter((x) => x !== q);
    const h = this.squadAt(s, this.base(side));
    let to: string | null = null;
    if (h?.side === side) (h.strength += stolen), (to = h.place);
    else if (!h && s.owner[this.base(side)] === side) (s.squads.push({ id: `q${s.nextId++}`, side, place: this.base(side), strength: stolen }), (to = this.base(side)));
    events.push({ type: 'thief', side, at, stolen, to, gone });
  }

  /**
   * Who a squad would clash with going to `to` (Jack): one of theirs there, next door, ordered straight at it this
   * turn, with exactly the same number; not on the square, not the maiden (she seduces), not dug in or cut off.
   */
  clashWith(s: RiotState, q: RiotSquad, to: string, counter?: Order[]): RiotSquad | null {
    this.use(s);
    if (!this.rules.clash || !counter || q.elite === 'maiden') return null;
    const there = this.squadAt(s, to);
    if (!there || there.side === q.side || there.elite === 'maiden' || there.strength !== q.strength) return null;
    if (to === this.heart || q.place === this.heart || !this.near(q.place, to) || this.fortified(s, to) || s.cut === to) return null;
    const coming = counter.some((x) => x.squad === there.id && x.to === q.place && !x.split && (!x.side || x.side === there.side));
    return coming && this.dests(s, there).includes(q.place) ? there : null;
  }

  /**
   * A clash's odds for the squad striking first (Jack: morale): even, then its side's share of everything on
   * the board (up to 15 either way); 5 for each of its own round the fight, less 5 for each of theirs (not ones
   * dug in: they look after themselves); 10 for the ground round it being mostly its side's (or less 10, theirs);
   * 5 for one of its elite there (a hero, the king's guard, a poisoned squad; less 5, theirs). Between 20% and 80%.
   */
  clashOdds(s: RiotState, q: RiotSquad, to: string, foe?: RiotSquad, race = false): ClashOdds {
    this.use(s);
    const side = q.side;
    const parts: ClashOdds['parts'] = [];
    const total = (x: Side) => this.mine(s, x).reduce((n, y) => n + y.strength, 0);
    const all = total(side) + total(this.other(side));
    // A race (Jack): the two squads' numbers ("7 v 6") rather than the whole board's.
    if (race && foe) parts.push({ what: `${q.strength} v ${foe.strength}`, by: Math.round((q.strength / (q.strength + foe.strength) - 0.5) * 100) / 100 });
    else parts.push({ what: 'Strength on the board', by: all ? Math.round((total(side) / all - 0.5) * 30) / 100 : 0 });
    const round = [...new Set([...this.adj.get(q.place)!, ...this.adj.get(to)!])].filter((p) => p !== q.place && p !== to);
    const near = round.map((p) => this.squadAt(s, p)).filter((x): x is RiotSquad => !!x && !this.fortified(s, x.place));
    parts.push({ what: 'Allies near', by: near.filter((x) => x.side === side).length * 0.05 });
    parts.push({ what: 'Enemies near', by: -near.filter((x) => x.side !== side).length * 0.05 });
    const ground = [...round, q.place, to];
    const held = (x: Side) => ground.filter((p) => s.owner[p] === x).length;
    parts.push({ what: 'Home ground', by: Math.sign(held(side) - held(this.other(side))) * 0.1 });
    const there = foe ?? this.squadAt(s, to);
    const elite = (x: RiotSquad) => x.elite === 'hero' || x.elite === 'guard3' || !!x.poison;
    const elites = (x: Side) => [q, ...(there ? [there] : []), ...near].some((y) => y.side === x && elite(y));
    parts.push({ what: 'Elites', by: (elites(side) ? 0.05 : 0) - (elites(this.other(side)) ? 0.05 : 0) });
    // Morale (Jack): an audience that went well (or badly), on either side.
    parts.push({ what: 'Morale', by: Math.round((this.moraleOf(s, side) - this.moraleOf(s, this.other(side))) * 100) / 100 });
    // Back from the brothel, in fine spirits (Jack).
    const boost = this.rules.brothel?.boost ?? 0;
    parts.push({ what: 'Fine spirits', by: (q.cheer ? boost : 0) - (there?.cheer ? boost : 0) });
    const c = this.rules.clash ?? CLASH;
    const [least, most] = race ? [RACE.least, RACE.most] : [c.least, c.most];
    let chance = Math.max(least, Math.min(most, 0.5 + parts.reduce((n, x) => n + x.by, 0)));
    // Blessed, it's won; cursed, it's lost (Jack: certainly).
    const f = this.favour(s, side) - this.favour(s, this.other(side));
    if (f) {
      parts.push({ what: f > 0 ? 'Blessed' : 'Cursed', by: f > 0 ? 1 - chance : -chance });
      chance = f > 0 ? 1 : 0;
    }
    return { chance, parts: parts.filter((x) => Math.abs(x.by) > 1e-9) };
  }

  /**
   * A clash fought (on `s`, already a clone): the winner takes the loser's place, with 1 to 3 left (Jack). Meeting
   * on an empty place (`meet`), the winner has it; at a base (`base`), the attacker takes it, or the base holds.
   */
  private clash(s: RiotState, q: RiotSquad, foe: RiotSquad, events: RiotEvent[], meet?: string, base = false): void {
    const from = q.place;
    const rivalFrom = foe.place;
    const at = meet ?? foe.place;
    const strength = foe.strength;
    const { chance } = this.clashOdds(s, q, at, foe);
    const won = this.roll(s) < chance;
    const [winner, loser] = won ? [q, foe] : [foe, q];
    q.cheer = foe.cheer = undefined;
    const place = meet ?? (base ? foe.place : loser.place);
    s.squads = s.squads.filter((x) => x !== loser);
    // How many of the winners are left (Jack): mostly 1, now and then 2, rarely 3; never more than they had.
    const odds = (this.rules.clash ?? CLASH).left;
    const r = this.roll(s);
    const left = Math.min(strength, r < odds.three ? 3 : r < odds.three + odds.two ? 2 : 1);
    winner.place = place;
    winner.strength = left;
    s.owner[place] = winner.side;
    events.push({ type: 'clash', at, from, side: q.side, won, chance, strength, left, ...(meet ? { meet: rivalFrom } : {}), ...(base ? { base: true } : {}) });
    // (Won: the winners' base makes more for a few turns, Jack.)
    const co = this.rules.clashOutput;
    if (co) s.moods = [...(s.moods ?? []), { side: winner.side, kind: 'output', by: co.by, until: s.turn + co.turns - 1 }];
    if (meet) s.held = [...(s.held ?? []), winner.id];
    this.takeTokens(s, events);
  }

  /** A side's morale from its moods (Jack): better or worse odds in a clash. */
  moraleOf = (s: RiotState, side: Side): number => (s.moods ?? []).filter((m) => m.side === side && m.kind === 'morale' && m.until >= s.turn).reduce((n, m) => n + m.by, 0);
  /** A side's bases making more or less this turn (Jack: the townsfolk). */
  /** The towers (Jack): every one, whose it was to start with. */
  towerList = (): { place: string; side: Side }[] => (this.rules.towers ? [...this.rules.towers.guard.map((place) => ({ place, side: 'guard' as Side })), ...this.rules.towers.rising.map((place) => ({ place, side: 'rising' as Side }))] : []);
  /**
   * Where the tutorial puts something: an empty street next to one of `side`'s squads (not a base, a tower, or
   * something already there), nobody of the other side's next to it if it can (so it's yours to take), nearest the
   * square (where the game's going).
   */
  scriptPlace(s: RiotState, side: Side): string | null {
    this.use(s);
    const empty = this.board.places.filter((p) => !p.heart && !p.lifts && !this.squadAt(s, p.id) && !this.tokenAt(s, p.id) && !this.isTower(p.id));
    const nextTo = (p: RiotPlace, who: Side) => this.adj.get(p.id)!.some((n) => this.squadAt(s, n)?.side === who);
    const hops = (from: string) => {
      const seen = new Map([[from, 0]]);
      const todo = [from];
      while (todo.length) {
        const p = todo.shift()!;
        if (p === this.heart) return seen.get(p)!;
        for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
      }
      return 99;
    };
    const mine = empty.filter((p) => nextTo(p, side));
    const safe = mine.filter((p) => !nextTo(p, this.other(side)));
    const pool = (safe.length ? safe : mine.length ? mine : empty).sort((a, b) => hops(a.id) - hops(b.id) || a.id.localeCompare(b.id));
    return pool[0]?.id ?? null;
  }

  isTower = (place: string): boolean => this.towerList().some((t) => t.place === place);
  /** Who holds a tower now (whoever last took the place). */
  towerHolder = (s: RiotState, place: string): Side | undefined => s.owner[place];
  /** How many towers a side holds. */
  towersHeld = (s: RiotState, side: Side): number => this.towerList().filter((t) => s.owner[t.place] === side).length;
  /** Turns until the towers next make their men (0: at the end of this one). */
  towersIn = (s: RiotState): number => {
    const every = this.rules.towers?.every ?? 1;
    return (every - (s.turn % every)) % every;
  };

  /** A side's home squares: the places round its base (Jack). */
  homeSquares = (side: Side): string[] => this.adj.get(this.base(side))!;
  /** How many a side's base makes this turn: its home squares held (or its usual), and whatever's lasting. */
  production = (s: RiotState, side: Side): number => {
    const lost = this.homeSquares(side).filter((p) => s.owner[p] === this.other(side)).length;
    const made = this.rules.homeGrowth ? (this.rules.baseMakes === undefined ? 3 - lost : Math.max(0, this.rules.baseMakes - lost)) : side === 'guard' ? this.rules.reinforce : (this.rules.risingGrowth ?? 1);
    return Math.max(side === 'rising' && !this.rules.homeGrowth ? 1 : 0, made + this.outputOf(s, side) + this.fortressBy(s, side, this.base(side)));
  };
  outputOf = (s: RiotState, side: Side): number => (s.moods ?? []).filter((m) => m.side === side && m.kind === 'output' && m.until >= s.turn).reduce((n, m) => n + m.by, 0);
  /** Turns left of the commander's advice on a side: seeing ahead, or clouded (0: none). */
  adviceIn = (s: RiotState, side: Side, kind: 'foresight' | 'cloud'): number => Math.max(0, ...(s.moods ?? []).filter((m) => m.side === side && m.kind === kind).map((m) => m.until - s.turn + 1));

  /** A squad onto the brothel (Jack): stuck there next turn, then in fine spirits. */
  private takeBrothel(s: RiotState, events: RiotEvent[]): void {
    const there = s.brothel && this.squadAt(s, s.brothel.place);
    if (!s.brothel || !there) return;
    there.stuck = s.turn + 1;
    there.cheer = true;
    events.push({ type: 'brothel', at: s.brothel.place, side: there.side });
    s.brothel = null;
  }

  /** A squad onto the audience (Jack): who'll they hear? (Waits on a choice: `pending`.) */
  private takeAudience(s: RiotState, events: RiotEvent[]): void {
    const there = s.audience && this.squadAt(s, s.audience.place);
    if (!s.audience || !there) return;
    s.pending = { kind: 'audience', side: there.side, at: s.audience.place, good: this.goodLines(s) };
    events.push({ type: 'audienceFound', at: s.audience.place, side: there.side });
    s.audience = null;
  }

  /** The Lord's judgement (on `s`, a clone): heretics or loyal servants, half and half, for a few turns (Jack). */
  private judge(s: RiotState, side: Side, events: RiotEvent[]): void {
    const blessed = this.roll(s) < 0.5;
    const turns = (this.rules.audience ?? AUDIENCE).judged;
    s.moods = [...(s.moods ?? []).filter((m) => !(m.side === side && (m.kind === 'blessed' || m.kind === 'cursed'))), { side, kind: blessed ? 'blessed' : 'cursed', by: 0, until: s.turn + turns - 1 }];
    events.push({ type: 'judgement', side, blessed });
  }

  /** The Lord's favour on a side (Jack): 1 blessed, -1 cursed, 0 neither. */
  favour = (s: RiotState, side: Side): number => ((s.moods ?? []).some((m) => m.side === side && m.kind === 'blessed' && m.until >= s.turn) ? 1 : 0) - ((s.moods ?? []).some((m) => m.side === side && m.kind === 'cursed' && m.until >= s.turn) ? 1 : 0);

  /** Which two of the townsfolk's four lines go down well, this time (Jack: always half and half). */
  private goodLines(s: RiotState): number[] {
    const lines = [0, 1, 2, 3];
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(this.roll(s) * (i + 1));
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
    }
    return lines.slice(0, 2).sort();
  }

  /** An audience heard (on `s`, a clone): `choice` is who (the townsfolk: `townsfolk:<line>`); the dice otherwise. */
  private hear(s: RiotState, side: Side, good: number[], choice: string | undefined, events: RiotEvent[]): void {
    const a = this.rules.audience ?? AUDIENCE;
    const advisers: Adviser[] = ['accountant', 'townsfolk', 'commander'];
    const [name, n] = (choice ?? '').split(':');
    const who: Adviser = advisers.includes(name as Adviser) ? (name as Adviser) : advisers[Math.floor(this.roll(s) * 3)]!;
    const line = who === 'townsfolk' ? (n !== undefined && /^[0-3]$/.test(n) ? Number(n) : Math.floor(this.roll(s) * 4)) : undefined;
    const luck = line !== undefined ? good.includes(line) : this.roll(s) < 0.5;
    // (Blessed or cursed, Jack: luck has nothing to do with it.)
    const f = this.favour(s, side);
    const ok = f > 0 ? true : f < 0 ? false : luck;
    const moods = (s.moods = [...(s.moods ?? [])]);
    const add = (kind: Mood['kind'], by: number, turns: number) => moods.push({ side, kind, by, until: s.turn + turns - 1 });
    if (who === 'commander') add(ok ? 'foresight' : 'cloud', 0, a.advice);
    else add('morale', ok ? a.morale : -a.morale, a.moraleTurns);
    if (who === 'townsfolk') ok ? add('output', a.output, a.outputTurns) : add('output', -a.slump, a.slumpTurns);
    // (The accountant, Jack: the treasury's weight shows at the main base too, +1 or -1 a turn for 3 turns.)
    if (who === 'accountant') add('output', ok ? a.treasury : -a.treasury, a.treasuryTurns);
    events.push({ type: 'audience', side, who, good: ok, ...(line !== undefined ? { line } : {}) });
  }

  /** A squad on the crest (on `s`, already a clone): its side takes it (Jack). */
  private takeCrest(s: RiotState, events: RiotEvent[]): void {
    const there = s.crest && this.squadAt(s, s.crest.place);
    if (!s.crest || !there) return;
    s.elites[there.side].crests += 1;
    events.push({ type: 'crestTaken', at: s.crest.place, side: there.side });
    s.crest = null;
  }

  /**
   * Where a crest appears (Jack: a race): an empty street, not the square, the lifts' foot or next to either, about
   * as far from both sides (two streets, if it can), and nearer whichever side has taken fewer, so it can catch up.
   */
  private crestPlace(s: RiotState, tilt = true): string | null {
    const bases = [this.heart, this.lifts];
    const empty = this.board.places.filter((p) => !p.heart && !p.lifts && !this.squadAt(s, p.id) && !this.tokenAt(s, p.id) && !this.isTower(p.id) && !bases.some((b) => this.near(p.id, b)));
    const far = (p: string, side: Side) => Math.min(99, ...this.mine(s, side).map((q) => this.distance(p, q.place)));
    // (A street nearer the guard when even: the rising have more crowds out, so they'd win most races otherwise.)
    const lead = tilt ? Math.sign(this.crestsTaken(s, 'guard') - this.crestsTaken(s, 'rising')) - (this.crestsTaken(s, 'guard') <= this.crestsTaken(s, 'rising') ? 1 : 0) : -1;
    // (The skirmish, Jack: random, anywhere both sides are as near, so each has the same chance of getting there.)
    const even = !!this.rules.homeGrowth;
    const score = (p: string) => even ? Math.abs(far(p, 'guard') - far(p, 'rising')) : Math.abs(far(p, 'guard') - far(p, 'rising') - lead) * 10 + Math.abs(Math.min(far(p, 'guard'), far(p, 'rising')) - 2) * 3;
    // (Only where both sides could get to it before it goes, if there's anywhere: Jack, some were out of reach.)
    const lasts = Math.min(this.rules.elites?.crest.lasts ?? 3, this.rules.mystery?.lasts ?? 3);
    const reach = empty.filter((p) => far(p.id, 'guard') <= lasts && far(p.id, 'rising') <= lasts);
    const among = reach.length ? reach : empty;
    const best = Math.min(...among.map((p) => score(p.id)));
    const pool = among.filter((p) => score(p.id) === best);
    return pool[Math.floor(this.roll(s) * pool.length)]?.id ?? null;
  }

  /** A rumble set off (on `s`, already a clone): every squad next to it, not dug in, takes a dice of 1 to the most. */
  private setOff(s: RiotState, at: string, side: Side, events: RiotEvent[]): void {
    const hits: Extract<RiotEvent, { type: 'rumble' }>['hits'] = [];
    for (const n of this.adj.get(at)!) {
      const there = this.squadAt(s, n);
      // (Heroes too: Jack.)
      if (!there || this.fortified(s, n)) continue;
      // (Blessed, the least; cursed, the most: Jack.)
      const fav = this.favour(s, there.side);
      const most = this.rules.rumble?.max ?? 3;
      const damage = fav > 0 ? 1 : fav < 0 ? most : 1 + Math.floor(this.roll(s) * most);
      there.strength -= damage;
      const gone = there.strength <= 0;
      if (gone) s.squads = s.squads.filter((x) => x !== there);
      if (gone && there.elite) events.push({ type: 'eliteGone', at: n, side: there.side, elite: there.elite });
      hits.push({ place: n, side: there.side, damage, gone });
    }
    s.rumble = null;
    events.push({ type: 'rumble', at, side, hits });
  }

  /**
   * What the rising will do this turn, decided at the start of it and shown (the arrows). The square stays
   * put. Each crowd out in the streets: goes for a squad of the guard it can beat (the biggest it can; the
   * lifts' foot most of all, to cut off the guard coming down); or joins another crowd so that together they
   * could; or, if the guard are coming for the square, falls back into it; or heads for the way up, keeping out
   * of reach of anything that would beat it.
   */
  risingOrders(s: RiotState): Order[] {
    this.use(s);
    // (The even skirmish: they think it through, Jack: below.)
    if (this.rules.homeGrowth) return this.tacticalOrders(s);
    return this.plainOrders(s);
  }

  /**
   * The rebels thinking it through (Jack, the skirmish: not rushing home on the first turn; holding where that's
   * strongest; splitting when that's best, once in 3 turns like you): their elite as before; then each of the rest
   * (the base too), biggest first, tries holding, every street it can take, and (once a split's due) sending half
   * each way, plays out everything ordered so far with it, and keeps whatever leaves them best placed (`placed`);
   * twice over, so a crowd that's been joined can go on together.
   */
  private tacticalOrders(s: RiotState): Order[] {
    const plain = this.plainOrders(s);
    const fixed = plain.filter((o) => s.squads.find((q) => q.id === o.squad)?.elite);
    const movers = this.mine(s, 'rising')
      .filter((q) => !q.elite && !q.hired && !q.built && !q.crusted && (q.stuck ?? -1) < s.turn && s.cut !== q.place)
      .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
    const run = (orders: Order[]) => {
      let t = s;
      let found = 0;
      for (const o of [...orders, ...fixed]) {
        const r = this.order(t, o, []);
        for (const e of r.events) if ((/Found$/.test(e.type) || e.type === 'crestTaken' || e.type === 'mystery' || e.type === 'rumble') && 'side' in e && e.side === 'rising') found++;
        t = r.state;
      }
      return this.placed(t, found);
    };
    let orders: Order[] = [];
    let best = run(orders);
    for (let pass = 0; pass < 2; pass++) {
      for (const q of movers) {
        const others = orders.filter((o) => o.squad !== q.id);
        const ways = this.dests(s, q).filter((p) => p !== q.place);
        const splitOk = this.canSplit(s, 'rising') && q.strength >= 2 && !others.some((o) => o.split);
        const options: (Order | null)[] = [null, ...ways.map((to) => ({ squad: q.id, to, side: 'rising' as const, chain: true })), ...(splitOk ? ways.map((to) => ({ squad: q.id, to, side: 'rising' as const, chain: true, split: true })) : [])];
        let pick: Order | null = orders.find((o) => o.squad === q.id) ?? null;
        let pv = pass === 0 ? -Infinity : best;
        for (const o of options) {
          const v = run(o ? [...others, o] : others);
          if (v > pv + 1e-9) (pv = v), (pick = o);
        }
        orders = pick ? [...others, pick] : others;
        best = pv;
      }
    }
    return [...orders, ...fixed];
  }

  /** How well placed the rebels are after their moves (the skirmish's planning, `tacticalOrders`). */
  private placed(s: RiotState, found: number): number {
    const o = this.outcome(s);
    if (o === 'rising') return 1e6;
    if (o === 'guard') return -1e6;
    const rising = this.mine(s, 'rising');
    const guard = this.mine(s, 'guard');
    let v = found * 15;
    for (const q of rising) v += q.strength * 3;
    for (const q of guard) v -= q.strength * 3;
    // What they hold: the towers most, then the home squares (each makes their base 1 a turn), then anywhere.
    for (const t of this.towerList()) v += s.owner[t.place] === 'rising' ? 12 : s.owner[t.place] === 'guard' ? -12 : 0;
    for (const p of this.homeSquares('rising')) if (s.owner[p] === 'guard') v -= 8;
    for (const p of this.homeSquares('guard')) if (s.owner[p] === 'rising') v += 8;
    for (const p of this.board.places) v += s.owner[p.id] === 'rising' ? 0.5 : 0;
    // Their base: could you take it next turn?
    const h = this.squadAt(s, this.heart);
    const hold = h?.side === 'rising' ? this.defence(s, this.heart, this.heldBy(s, this.heart)) : 0;
    // (By how much it'd fall short: the less, the better, so they come home to it when it's in danger.)
    const short = this.strike(s) + this.heroNear(s) - (hold + (h ? 0 : this.production(s, 'rising')));
    if (short >= 0) v -= 150 + short * 15;
    // And in two turns' time, what's gathering within two streets: crowds nearer home, as much as it needs; and
    // much more so with one of yours next to it that could take it (Jack: one big stack walked in), the base dug
    // in for a turn to let them get back.
    const later = this.looming(s) + this.heroNear(s) - (hold + 2 * this.production(s, 'rising'));
    const now = short >= 0 ? short + 2 : 0;
    const need = Math.max(later, now);
    if (need > 0) for (const q of rising) if (q.place !== this.heart && !q.hired && !q.built) v -= this.distance(q.place, this.heart) * Math.min(q.strength, need) * (now ? 4 : 1.5);
    // Next turn: each of theirs one of yours next to it could beat is at risk (a tower or home square more so);
    // each of yours one of theirs next to it could beat is a chance (your keep most of all).
    const beats = (from: RiotSquad, p: string) => !this.fortified(s, from.place) && from.elite !== 'guard3' && !from.built && s.cut !== from.place && this.attack(from.place, p, from.strength) > this.defence(s, p, this.heldBy(s, p));
    for (const q of rising) {
      if (q.place === this.heart || q.beside || this.fortified(s, q.place)) continue;
      if (guard.some((y) => this.near(y.place, q.place) && y.place !== this.lifts && beats(y, q.place))) v -= q.strength * 2.5 + (this.isTower(q.place) ? 12 : 0) + (this.homeSquares('rising').includes(q.place) ? 4 : 0);
    }
    for (const y of guard) {
      if (y.beside || y.elite === 'hero' || this.fortified(s, y.place)) continue;
      if (!rising.some((q) => this.near(q.place, y.place) && !q.hired && !q.built && beats(q, y.place))) continue;
      v += y.place === this.lifts ? 80 : y.strength + (this.isTower(y.place) ? 8 : 0) + (this.homeSquares('guard').includes(y.place) ? 4 : 0);
    }
    const keep = this.squadAt(s, this.lifts);
    if (!keep && s.owner[this.lifts] === 'guard' && rising.some((q) => this.near(q.place, this.lifts) && !q.built)) v += 80;
    // Getting somewhere: each crowd out nearer something of yours worth taking (a tower, a home square, the keep).
    const goals = [this.lifts, ...this.towerList().map((t) => t.place), ...this.homeSquares('guard')].filter((p) => s.owner[p] !== 'rising');
    // (Every man of theirs counts, in the base too: going home is no way to get nearer.)
    for (const q of rising) if (!q.hired && !q.built && !(this.isTower(q.place) && q.place !== this.heart) && goals.length) v -= Math.min(...goals.map((p) => this.distance(q.place, p))) * (1 + q.strength * 0.3);
    // A bonus on the map: the nearest of theirs that can get there in time, nearer.
    for (const t of [s.crest, s.mystery, s.audience, s.church, s.barracks, s.architect]) {
      if (!t) continue;
      const d = Math.min(99, ...rising.filter((q) => q.place !== this.heart && !q.hired && !q.built).map((q) => this.distance(q.place, t.place)));
      if (d <= t.left) v -= d * 4;
    }
    return v;
  }

  private plainOrders(s: RiotState): Order[] {
    const orders: Order[] = [];
    const claimed = new Set<string>();
    const yours = this.mine(s, 'guard');
    const sq = this.squadAt(s, this.heart);
    // You're coming for the square: a squad of yours next to it, or a step away, big enough to match it soon.
    const threat = this.threatened(s);
    // (Even, with production from the home squares: they guard their base, and fight over the home squares.)
    const homes = !!this.rules.homeGrowth;
    // (Your towers and your keep most of all, Jack: they go for them.)
    const homeBonus = (p: string) => (!homes ? 0 : (this.isTower(p) && s.owner[p] === 'guard') || p === this.lifts ? 30 : this.homeSquares('rising').includes(p) || this.homeSquares('guard').includes(p) || this.isTower(p) ? 15 : 0);
    const couldBeat = (place: string, strength: number) => yours.some((y) => this.near(place, y.place) && this.attack(place, y.place, strength) > this.defence(s, y.place, y.strength));
    // (Even: with the field theirs, half of yours out there or less, they go for your base, Jack: their main aim.)
    const field = (side: Side) => this.mine(s, side).filter((q) => q.place !== this.base(side) && q.elite !== 'guard3' && !q.hired && !q.built).reduce((n, q) => n + q.strength, 0);
    const siege = homes && field('guard') * 2 <= field('rising');
    const st = this.style;
    const distTo = (from: string, to: (p: string) => boolean): number => {
      const seen = new Map([[from, 0]]);
      const todo = [from];
      while (todo.length) {
        const p = todo.shift()!;
        if (to(p)) return seen.get(p)!;
        for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
      }
      return 99;
    };
    // The square, out at a squad of the guard next to it, if it beats it and nothing else of theirs could walk in behind.
    if (homes && sq?.side === 'rising' && s.cut !== this.heart) {
      // (Even: out at the biggest of yours next to it that it beats; all of it if nothing else of yours is about
      // to walk in behind (the base makes more anyway), else half.)
      const near = yours.filter((y) => this.near(y.place, this.heart) && !this.fortified(s, y.place) && y.elite !== 'guard3' && y.elite !== 'hero');
      const target = near.filter((y) => this.attack(this.heart, y.place, sq.strength) > this.defence(s, y.place, y.strength)).sort((a, b) => b.strength - a.strength)[0];
      if (target) {
        // (Alone: nothing else of yours that could walk in behind next turn: within two streets, or chained up to it.)
        const without = { ...s, squads: s.squads.filter((q) => q !== target) };
        // (An empty base still makes its men, behind its barricades: safe if nothing could beat that.)
        // (And enough left after the fight for whatever else of yours is about.)
        const left = this.attack(this.heart, target.place, sq.strength) - this.defence(s, target.place, target.strength);
        // (Jack: more ruthless: only what could really hit the empty base next turn counts.)
        const alone = this.strike(without) + this.heroNear(without) + 1 < this.production(s, 'rising') + 1 + (this.homeSquares('rising').includes(target.place) ? 1 : 0) && left >= 1;
        const half = Math.ceil(sq.strength / 2);
        if (alone) orders.push({ squad: sq.id, to: target.place });
        else if (this.canSplit(s, 'rising') && this.attack(this.heart, target.place, half) > this.defence(s, target.place, target.strength)) orders.push({ squad: sq.id, to: target.place, split: true });
        if (orders.length) claimed.add(target.place);
      }
    } else if (st.sally && sq?.side === 'rising' && s.cut !== this.heart) {
      const near = yours.filter((y) => this.near(y.place, this.heart));
      const target = near.length === 1 ? near[0]! : undefined;
      if (target && this.attack(this.heart, target.place, sq.strength) > this.defence(s, target.place, target.strength)) {
        orders.push({ squad: sq.id, to: target.place });
        claimed.add(target.place);
      }
    }
    // The square left empty: back into it, first.
    const emptySquare = !sq && s.owner[this.heart] === 'rising';
    // (Even: chains, as you can: crowds joining up street by street to strike one of yours together.)
    const chained = homes ? this.chains(s, claimed) : [];
    orders.push(...chained);
    const busy = new Set(chained.map((o) => o.squad));
    // (A crowd on one of their towers holds it, Jack: never leaves it empty to go home; it only goes out to beat one
    // of yours next to it, with nothing else of yours next to the tower to walk in behind, or for a bonus right
    // next to it with none of yours about: below.)
    const crowds = this.mine(s, 'rising').filter((q) => q.place !== this.heart && s.cut !== q.place && !busy.has(q.id) && !q.hired && !q.built).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
    // (Bonuses on the map, Jack: each one, the nearest crowd that could get there before it goes heads for it.)
    const chase = new Map<string, string>();
    if (homes || this.rules.tokensAtOnce) for (const t of [s.crest, s.mystery, s.audience, s.church, s.barracks, s.architect]) {
      if (!t) continue;
      const free = crowds.filter((q) => !q.elite && !chase.has(q.id) && !(this.isTower(q.place)) && distTo(q.place, (p) => p === t.place) <= t.left);
      const near = free.sort((a, b) => distTo(a.place, (p) => p === t.place) - distTo(b.place, (p) => p === t.place) || b.strength - a.strength)[0];
      if (near) chase.set(near.id, t.place);
    }
    for (const q of crowds) {
      // (Holding a tower: out only to beat the one of yours next to it, Jack.)
      if (homes && this.isTower(q.place) && !q.elite) {
        // (Or a bonus right next to the tower, with nothing of yours within two streets of it.)
        const calm = !this.mine(s, 'guard').some((y) => distTo(y.place, (p) => p === q.place) <= 2);
        const prize = calm ? this.adj.get(q.place)!.find((p) => !this.squadAt(s, p) && this.tokenAt(s, p) && this.tokenAt(s, p) !== 'rumble' && this.open(s, q.place, p)) : undefined;
        const to = this.towerSally(s, q) ?? prize;
        if (to && !claimed.has(to)) (orders.push({ squad: q.id, to, side: 'rising' }), claimed.add(to));
        continue;
      }
      let best: { to: string; score: number } | null = null;
      // Their elite squad (Jack). The bastard: up to two streets (fighting through one on the way), for one of
      // yours it wipes out (the lifts' foot most of all), or towards the nearest. The witch: towards one of yours
      // she could seduce. The barbarians: at one of yours round the square they beat; else they hold.
      if (q.elite) {
        const guardAt = (p: string) => yours.some((y) => y.place === p);
        const seducible = (p: string) => yours.some((y) => y.place === p && !y.elite && y.strength <= this.seduceMax(s, 'rising'));
        for (const to of this.dests(s, q)) {
          if (claimed.has(to)) continue;
          const there = this.squadAt(s, to);
          let score: number;
          if (there?.side === 'guard') {
            if (this.fortified(s, to) || (there.elite === 'hero' && q.elite !== 'hero')) continue;
            if (q.elite === 'hero') {
              const need = to === this.heart && !this.rules.baseWalls ? there.strength : this.defence(s, to, there.strength) + (this.rules.baseWalls && to === this.lifts ? 1 : 0);
              if (q.strength < need) continue;
              score = homes && to === this.lifts ? 200 : 60 + need * 2 + (to === this.lifts ? 15 : 0);
            } else if (this.attack(q.place, to, q.strength) > this.defence(s, to, there.strength)) score = 50 + there.strength * 2;
            else continue;
          } else if (!there && this.tokenAt(s, to) && this.tokenAt(s, to) !== 'rumble') score = 55; // (a crest, a mystery: Jack)
          else if (!there && q.elite !== 'guard3') {
            const target = q.elite === 'maiden' ? seducible : guardAt;
            score = 6 + (distTo(q.place, target) - distTo(to, target)) * 5;
          } else if (there?.side === 'rising' && q.elite === 'maiden' && !there.elite && !there.poison && to !== this.heart) {
            // The witch merges into a crowd (Jack: poisoning it), the biggest, when there's nobody near to seduce.
            if (distTo(q.place, seducible) <= 2) continue;
            score = 12 + there.strength;
          } else continue;
          if (score > 0 && (!best || score > best.score)) best = { to, score };
        }
        if (best) (orders.push({ squad: q.id, to: best.to, side: 'rising' }), claimed.add(best.to));
        continue;
      }
      for (const to of this.adj.get(q.place)!) {
        if (claimed.has(to) && to !== this.heart) continue;
        const there = this.squadAt(s, to);
        let score: number;
        // (Even: nothing of yours it could beat within 3 streets: back home, to go out again bigger.)
        // (And a small crowd, under 6, always: they gather, and go out as waves.)
        const idle = homes && !siege && !chase.has(q.id) && (q.strength < WAVE.least || !yours.some((y) => !y.beside && y.elite !== 'hero' && (y.elite !== 'guard3' || !!this.rules.guardsOpen) && distTo(q.place, (p) => p === y.place) <= 3 && q.strength > this.defence(s, y.place, this.heldBy(s, y.place))) && !this.homeSquares('guard').some((p) => s.owner[p] !== 'rising' && distTo(q.place, (x) => x === p) <= 3 && !yours.some((y) => y.place === p)));
        if (to === this.lifts && !there && homes) score = 200; // (your base left empty: walk in, Jack)
        else if (to === this.heart) {
          if (emptySquare && !there) score = 90;
          else if (there?.side === 'rising' && homes && (threat || idle)) score = threat ? 70 : 20;
          else if (there?.side !== 'rising' || !threat) continue;
          else score = homes ? 70 : 30;
        } else if (there?.side === 'guard') {
          if (this.fortified(s, to) || there.elite === 'hero' || (there.elite === 'guard3' && !this.rules.guardsOpen)) continue;
          // Your base, theirs for the taking (Jack: their main aim): nothing comes first.
          if (homes && to === this.lifts && this.attack(q.place, to, q.strength) > this.defence(s, to, this.heldBy(s, to))) score = 200;
          // (Or exactly its number: the final clash, a coin toss for the game.)
          else if (homes && to === this.lifts && this.rules.clash && q.strength === this.baseClashAt(s, to)) score = 60;
          else if (this.attack(q.place, to, q.strength) > this.defence(s, to, this.heldBy(s, to))) score = 40 + there.strength * 2 + (to === this.lifts ? 15 : 0) + homeBonus(to) - (homes && (threat || q.strength < WAVE.least) && !this.near(to, this.heart) && to !== this.lifts ? 40 : 0);
          // Throwing themselves at it: they'll lose, but it'll cost the guard.
          // (Not in the even game: they keep their numbers.)
          else if (st.wear && !homes && q.strength >= st.wear) score = 25 - there.strength + (to === this.lifts ? 10 : 0);
          else continue;
        } else if (there) {
          if (there.elite || there.hired || there.built) continue; // (nobody joins the elite squad, the hired, or a building)
          // Together, they could take one of yours next turn (or, gathering, just to be bigger).
          // (One of their towers yours could take: they go and hold it, Jack.)
          const atRisk = homes && this.isTower(to) && yours.some((y) => this.near(y.place, to) && !this.fortified(s, y.place) && this.attack(y.place, to, y.strength) > this.defence(s, to, there.strength));
          if (atRisk) score = 45;
          else if (couldBeat(q.place, q.strength)) continue;
          else if (couldBeat(to, there.strength + q.strength)) score = 18;
          else if (st.merge || homes) score = 8;
          else continue;
        } else if (this.tokenAt(s, to) && this.tokenAt(s, to) !== 'rumble') {
          // A crest, a mystery square, the brothel, an audience (Jack): theirs for the taking.
          score = 55;
        } else if (s.rumble?.place === to) {
          // A rumble: set it off, if it'll hurt the guard round it more than their own.
          const round = (side: Side) => this.adj.get(to)!.reduce((n, p) => {
            const x = this.squadAt(s, p);
            return n + (x && x !== q && x.side === side && !this.fortified(s, p) ? 1 : 0);
          }, 0);
          if (round('guard') <= round('rising')) continue;
          score = 45 + (round('guard') - round('rising')) * 5;
        } else {
          // (Even: for one of yours it could beat, or your home squares, to cut what your base makes.)
          const beatable = (p: string) => yours.some((y) => y.place === p && !y.beside && y.elite !== 'hero' && (y.elite !== 'guard3' || !!this.rules.guardsOpen) && q.strength > this.defence(s, p, this.heldBy(s, p)));
          const theirHome = (p: string) => (this.homeSquares('guard').includes(p) || this.isTower(p) || p === this.lifts) && s.owner[p] !== 'rising' && !yours.some((y) => y.place === p && q.strength <= this.defence(s, p, this.heldBy(s, p)));
          const guardNear = homes ? (p: string) => beatable(p) || theirHome(p) : (p: string) => yours.some((y) => y.place === p);
          const crowdNear = (p: string) => this.mine(s, 'rising').some((c) => c !== q && !c.elite && !c.hired && c.place === p && p !== this.heart);
          const toward = st.hunt && yours.length ? distTo(q.place, guardNear) - distTo(to, guardNear) : (this.upDist.get(q.place) ?? 9) - (this.upDist.get(to) ?? 9);
          score = 6 + toward * 5 + (s.owner[to] !== 'rising' ? 4 + homeBonus(to) : 0);
          // (Their base threatened: home, Jack.)
          if (homes && (threat || idle)) score += (distTo(q.place, (p) => p === this.heart) - distTo(to, (p) => p === this.heart)) * (threat ? 25 : 8);
          if (st.merge || homes) score += (distTo(q.place, crowdNear) - distTo(to, crowdNear)) * (homes && distTo(q.place, guardNear) >= 99 ? 6 : 3);
          if (yours.some((y) => this.near(y.place, to) && this.attack(y.place, to, y.strength) > q.strength)) score -= homes ? 25 : st.flee;
          // (One of their towers left empty with yours next to it: they step in and hold it, Jack.)
          if (homes && this.isTower(to) && s.owner[to] === 'rising' && yours.some((y) => this.near(y.place, to))) score = Math.max(score, 45);
        }
        // A bonus it's going for (Jack: they should get there as often as you).
        const goal = chase.get(q.id);
        if (goal && to !== this.heart && !(there && there.side === 'guard')) score += (distTo(q.place, (p) => p === goal) - distTo(to, (p) => p === goal)) * 30;
        // Your base, their main aim (Jack): with the field theirs, everyone closes in on it.
        if (siege && to !== this.heart) score += (distTo(q.place, (p) => p === this.lifts) - distTo(to, (p) => p === this.lifts)) * 12;
        if (score > 0 && (!best || score > best.score)) best = { to, score };
      }
      if (best) {
        orders.push({ squad: q.id, to: best.to, side: 'rising' });
        claimed.add(best.to);
      }
    }
    return orders;
  }

  /** How many the square sends out: a crowd (or, even with production from the home squares, a wave: half). */
  pourSize = (strength: number, s?: RiotState): number => {
    if (!this.rules.homeGrowth) return this.style.pour;
    // (Even: everything it can spare, keeping enough to hold what's about, and never less than half home.)
    // (What could actually hit it next turn, Jack: more ruthless; not everything of yours within a few streets.)
    // (And never below what's within two streets could take after a turn's making: one big stack of yours
    // closing in, Jack, walked in while it sent its men out.)
    const keep = s ? Math.max(this.strike(s) + this.heroNear(s) + 3, this.looming(s) + this.heroNear(s) + 2 - this.production(s, 'rising')) : 0;
    // (Never more than 20 at home, Jack, unless that much of yours could really hit it next turn.)
    if (strength > WAVE.home) return Math.max(0, strength - Math.max(keep, Math.min(WAVE.home, Math.ceil(strength * 0.4))));
    return Math.max(0, Math.min(Math.ceil(strength * 0.6), strength - keep));
  };

  /**
   * The rising's chains (the even skirmish; Jack: as you can): for each of yours worth taking (the biggest win
   * first, your home squares and base most of all), their crowds joined up to it street by street (not their
   * base, nor the elite), the farthest moving first, so that together they strike it; only when together they
   * beat it, and it takes more than one of them.
   */
  private chains(s: RiotState, claimed: Set<string>): Order[] {
    const out: Order[] = [];
    const used = new Set<string>();
    const yours = this.mine(s, 'guard').filter((y) => !y.beside && y.elite !== 'hero' && (y.elite !== 'guard3' || !!this.rules.guardsOpen) && !y.built && !this.fortified(s, y.place));
    const worth = (y: RiotSquad) => y.strength * 2 + (y.place === this.lifts ? 30 : 0) + (this.homeSquares('guard').includes(y.place) || this.isTower(y.place) ? 15 : 0);
    const crowd = (p: string) => {
      const q = this.squadAt(s, p);
      return q && q.side === 'rising' && !q.elite && !q.hired && !q.built && p !== this.heart && !this.isTower(p) && s.cut !== p && !used.has(q.id) && !q.crusted && (q.stuck ?? -1) < s.turn && !s.held?.includes(q.id) ? q : null;
    };
    for (const y of [...yours].sort((a, b) => worth(b) - worth(a))) {
      if (claimed.has(y.place)) continue;
      // The crowds joined to it: a tree out from the places next to it, each pointing the way in.
      const parent = new Map<string, string>();
      const order: string[] = [];
      const todo = this.adj.get(y.place)!.filter((p) => crowd(p) && this.open(s, p, y.place));
      for (const p of todo) parent.set(p, y.place);
      while (todo.length) {
        const p = todo.shift()!;
        order.push(p);
        for (const n of this.adj.get(p)!) if (!parent.has(n) && n !== y.place && crowd(n) && this.open(s, n, p)) (parent.set(n, p), todo.push(n));
      }
      // The best branch in (one of the places next to it, and everything joined to that).
      const into = new Map<string, number>();
      const root = (p: string): string => (parent.get(p) === y.place ? p : root(parent.get(p)!));
      for (const p of order) into.set(root(p), (into.get(root(p)) ?? 0) + crowd(p)!.strength);
      const best = [...into.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!best || best[1] <= this.defence(s, y.place, this.heldBy(s, y.place))) continue;
      const branch = order.filter((p) => root(p) === best[0]);
      if (branch.length < 2) continue; // (one alone: the crowds' own way)
      // Only as many as it takes, the nearest first.
      const need = this.defence(s, y.place, this.heldBy(s, y.place)) + 1;
      let have = 0;
      const going: string[] = [];
      for (const p of branch) {
        if (have >= need) break;
        // (A place's way in has to be going too.)
        let x: string | undefined = p;
        while (x && x !== y.place && !going.includes(x)) (going.push(x), (have += crowd(x)!.strength), (x = parent.get(x)));
      }
      const depth = (p: string): number => (parent.get(p) === y.place ? 0 : 1 + depth(parent.get(p)!));
      for (const p of going.sort((a, b) => depth(b) - depth(a))) {
        const q = crowd(p)!;
        out.push({ squad: q.id, to: parent.get(p)!, side: 'rising', chain: true });
      }
      for (const p of going) used.add(crowd(p)!.id);
      claimed.add(y.place);
    }
    return out;
  }

  /** Whether you're coming for their base: a squad of yours next to it, or a step away, big enough to match it soon. */
  threatened(s: RiotState, without = 0): boolean {
    const sq = this.squadAt(s, this.heart);
    const reach = this.rules.homeGrowth ? 3 : 2;
    const far = (p: string): number => {
      const seen = new Map([[p, 0]]);
      const todo = [p];
      while (todo.length) {
        const x = todo.shift()!;
        if (x === this.heart) return seen.get(x)!;
        for (const n of this.adj.get(x)!) if (!seen.has(n)) (seen.set(n, seen.get(x)! + 1), todo.push(n));
      }
      return 99;
    };
    if (sq?.side !== 'rising') return false;
    // (Even: what you could strike it with next turn, chaining your orders, or what's gathering round it.)
    if (this.rules.homeGrowth) {
      const left = this.defence(s, this.heart, sq.strength - without);
      // (What could hit it next turn; or what's gathering within two streets, which takes two turns to come, while
      // the base makes its men twice over. Jack: they called everyone home whenever the base was small.)
      return this.strike(s) + this.heroNear(s) + 2 >= left || this.looming(s) >= left + 2 * this.production(s, 'rising') + 2;
    }
    return this.mine(s, 'guard').some((y) => {
      const d = far(y.place);
      return d <= reach && y.strength + 2 >= this.defence(s, this.heart, sq.strength) + d;
    });
  }

  /**
   * The most you could throw at their base in one turn (the even skirmish): a squad of yours next to it, and
   * everything of yours joined up to it street by street (your orders chain: join, then strike on together). Not
   * anyone dug in, cut off, or the king's guard.
   */
  strike(s: RiotState): number {
    const free = (q: RiotSquad | undefined): q is RiotSquad => !!q && q.side === 'guard' && q.elite !== 'guard3' && !q.crusted && !this.fortified(s, q.place) && s.cut !== q.place && q.place !== this.lifts;
    let most = 0;
    for (const start of this.adj.get(this.heart)!) {
      if (!free(this.squadAt(s, start))) continue;
      const seen = new Set([start]);
      const todo = [start];
      let n = 0;
      while (todo.length) {
        const p = todo.shift()!;
        n += this.squadAt(s, p)!.strength;
        for (const x of this.adj.get(p)!) if (!seen.has(x) && this.open(s, p, x) && free(this.squadAt(s, x))) (seen.add(x), todo.push(x));
      }
      most = Math.max(most, n);
    }
    return most;
  }

  /** What of yours is gathering within two streets of their base (the even skirmish), the king's guard aside. */
  looming(s: RiotState, reach = 2): number {
    let near = new Set([this.heart]);
    for (let i = 0; i < reach; i++) near = new Set([...near, ...[...near].flatMap((p) => this.adj.get(p)!)]);
    return this.mine(s, 'guard').filter((q) => near.has(q.place) && q.elite !== 'guard3' && q.place !== this.lifts).reduce((n, q) => n + q.strength, 0);
  }

  /** Where the square will pour a crowd out at the end of this turn (towards the guard), if it does. */
  pourTo(s: RiotState): string | null {
    this.use(s);
    // (Their base threatened, with production from the home squares: they keep everyone in.)
    const h = this.squadAt(s, this.heart);
    // (Even, Jack: more ruthless. A wave as soon as there's a wave to spare, so long as what's left holds against
    // what could hit it next turn; it goes out where nothing of yours next to it could beat it, towards yours.)
    if (this.rules.homeGrowth && h) {
      const n = this.pourSize(h.strength, s);
      if (n < WAVE.least || this.strike(s) + this.heroNear(s) + 2 >= this.defence(s, this.heart, h.strength - n)) return null;
    }
    if (!this.style.pour || h?.side !== 'rising' || s.cut === this.heart || h.strength + 1 <= (this.rules.homeGrowth ? WAVE.above : this.style.pourAbove)) return null;
    const guard = this.mine(s, 'guard').map((q) => q.place);
    const dist = (from: string) => {
      const seen = new Map([[from, 0]]);
      const todo = [from];
      while (todo.length) {
        const p = todo.shift()!;
        if (guard.includes(p)) return seen.get(p)!;
        for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
      }
      return 99;
    };
    if (this.rules.homeGrowth && h) {
      // (Onto one of theirs next to it too, joining it; first where nothing of yours next to it could beat the wave.)
      const n = this.pourSize(h.strength, s);
      const safe = (p: string) => !this.adj.get(p)!.some((x) => {
        const y = this.squadAt(s, x);
        return y?.side === 'guard' && !this.fortified(s, x) && y.elite !== 'guard3' && this.attack(x, p, y.strength) > n + (this.squadAt(s, p)?.strength ?? 0);
      });
      const ways = this.adj.get(this.heart)!.filter((p) => this.open(s, this.heart, p) && (!this.squadAt(s, p) || (this.squadAt(s, p)!.side === 'rising' && !this.squadAt(s, p)!.elite && !this.squadAt(s, p)!.hired && !this.squadAt(s, p)!.built)));
      return ways.sort((a, b) => Number(safe(b)) - Number(safe(a)) || Number(!!this.squadAt(s, a)) - Number(!!this.squadAt(s, b)) || dist(a) - dist(b) || a.localeCompare(b))[0] ?? null;
    }
    return this.adj.get(this.heart)!.filter((p) => !this.squadAt(s, p) && this.open(s, this.heart, p)).sort((a, b) => dist(a) - dist(b) || a.localeCompare(b))[0] ?? null;
  }

  /** Where a crowd holding a tower of the rebels' can go out to (a squad of yours next to it that it beats, with nothing else of yours next to the tower), or null. */
  private towerSally(s: RiotState, q: RiotSquad): string | null {
    const foes = this.adj.get(q.place)!.filter((p) => this.squadAt(s, p)?.side === 'guard');
    if (foes.length !== 1) return null;
    const p = foes[0]!;
    const y = this.squadAt(s, p)!;
    if (this.fortified(s, p) || y.elite === 'hero' || (y.elite === 'guard3' && !this.rules.guardsOpen) || !this.open(s, q.place, p)) return null;
    return this.attack(q.place, p, q.strength) > this.defence(s, p, this.heldBy(s, p)) ? p : null;
  }

  /** Their hero (the bastard's opposite: yours) within two streets of the rebels' base, able to hit it next turn: its number. */
  heroNear(s: RiotState): number {
    const near = new Set([this.heart, ...this.adj.get(this.heart)!]);
    for (const p of [...near]) for (const x of this.adj.get(p)!) near.add(x);
    return this.mine(s, 'guard').filter((q) => q.elite === 'hero' && !q.crusted && near.has(q.place)).reduce((n, q) => n + q.strength, 0);
  }

  /**
   * A side's orders as if they all move at once: a squad moving out of a place goes before one moving into it
   * (so a squad is never joined and then carried along), and each squad moves once.
   */
  together(s: RiotState, orders: Order[]): Order[] {
    const pending = orders.filter((o, i) => orders.findIndex((x) => x.squad === o.squad) === i);
    const out: Order[] = [];
    while (pending.length) {
      const leaving = (place: string) => pending.some((o) => s.squads.find((q) => q.id === o.squad)?.place === place && o.to !== place);
      const i = Math.max(0, pending.findIndex((o) => !leaving(o.to)));
      out.push(pending.splice(i, 1)[0]!);
    }
    return out;
  }

  /**
   * The end of the turn: your orders, then the other side's (as shown at the start), then the square grows,
   * then the guard.
   */
  /**
   * The rising's orders in the order they happen: its chains first, in order (the even skirmish), then the rest all
   * at once.
   */
  theirsInOrder = (s: RiotState, theirs: Order[]): Order[] => [...theirs.filter((o) => o.chain), ...this.together(s, theirs.filter((o) => !o.chain))];

  /** `hiredDone`: the hired fighters have already gone this turn (the table plays them itself, to show them). */
  turn(s0: RiotState, yours: Order[], theirs: Order[], opts: { hiredDone?: boolean } = {}): { state: RiotState; events: RiotEvent[] } {
    this.use(s0);
    let s = s0;
    const events: RiotEvent[] = [];
    // (An audience the crier called, still waiting: the dice decide, for the computer or a test.)
    if (s.pending) {
      const d = this.resolve(s);
      s = d.state;
      events.push(...d.events);
    }
    const first = this.rules.ordered ? yours.filter((o, i) => yours.findIndex((x) => x.squad === o.squad && !!x.split === !!o.split) === i) : this.together(s0, yours);
    // (The rising's chains go in order, first; the rest all at once. Then the hired fighters.)
    const second = this.theirsInOrder(s0, theirs);
    const hired = this.rules.barracks && !opts.hiredDone;
    for (const [o, counter] of [...first.map((o) => [o, theirs] as const), ...second.map((o) => [o, yours] as const), ...(hired ? [[null, []] as const] : [])]) {
      if (!o) {
        for (const h of this.hiredOrders(s)) {
          const r = this.order(s, h, []);
          s = r.state;
          events.push(...r.events);
          if (this.outcome(s)) return { state: s, events };
        }
        continue;
      }
      // (Each side's own orders, for a race: everyone it's sending to the same place counts, Jack.)
      this.ownOrders = counter === theirs ? yours : theirs;
      this.otherOrders = counter;
      let r = this.order(s, o, counter);
      this.ownOrders = this.otherOrders = [];
      // (A choice waiting, here, is made by the dice: the computer's, or a test's.)
      if (r.state.pending) {
        const d = this.resolve(r.state);
        r = { state: d.state, events: [...r.events, ...d.events] };
      }
      s = r.state;
      events.push(...r.events);
      if (this.outcome(s)) return { state: s, events };
    }
    s = this.clone(s);
    this.hiredStrike(s, events);
    // The towers (Jack): each makes its men for whoever holds it, onto its own place (not with the power cut),
    // every so many turns (Jack: a 2 every four turns, not a 1 every turn). (A fortress next to one still adds its
    // 1 a turn, saved up.)
    const tw = this.rules.towers;
    if (tw && s.turn % (tw.every ?? 1) === 0) for (const t of this.towerList()) {
      const side = s.owner[t.place];
      if (!side || s.cut === t.place) continue;
      const there = this.squadAt(s, t.place);
      const by = tw.makes + this.fortressBy(s, side, t.place) * (tw.every ?? 1);
      if (there && (there.side !== side || there.elite || there.hired || there.built)) continue;
      if (there) there.strength += by;
      else s.squads.push({ id: `q${s.nextId++}`, side, place: t.place, strength: by });
      events.push({ type: 'towerMakes', at: t.place, side, by });
    }
    if (this.rules.muster) this.musterAll(s, events);
    // People keep joining the square.
    // (Even, Jack: an empty base of theirs still makes men, as yours does.)
    if (this.rules.homeGrowth && !this.squadAt(s, this.heart) && s.owner[this.heart] === 'rising' && s.cut !== this.heart && this.production(s, 'rising') > 0) s.squads.push({ id: `q${s.nextId++}`, side: 'rising', place: this.heart, strength: 0 });
    const h = this.rules.muster ? undefined : this.squadAt(s, this.heart);
    if (h?.side === 'rising' && s.cut !== this.heart) {
      // (The townsfolk: a base making more, or less, Jack.)
      h.strength = Math.max(1, h.strength + this.production(s, 'rising'));
      events.push({ type: 'grow', at: this.heart });
      // And it pours a crowd out at the guard.
      const to = this.pourTo(s);
      if (to) {
        const n = this.pourSize(h.strength, s);
        h.strength -= n;
        const own = this.squadAt(s, to);
        if (own?.side === 'rising') own.strength += n;
        else s.squads.push({ id: `q${s.nextId++}`, side: 'rising', place: to, strength: n });
        s.owner[to] = 'rising';
        events.push({ type: 'pour', from: this.heart, to, strength: n });
      }
    }
    // More of the guard, if the lifts' foot is yours (dug in or not: Jack).
    if (!this.rules.muster && s.turn % this.rules.reinforceEvery === 0) {
      const there = this.squadAt(s, this.lifts);
      const more = this.production(s, 'guard');
      if (there?.side === 'guard') there.strength += more;
      else if (!there && s.owner[this.lifts] !== 'rising' && more) s.squads.push({ id: `q${s.nextId++}`, side: 'guard', place: this.lifts, strength: more });
      if (there?.side === 'guard' || (!there && s.owner[this.lifts] !== 'rising')) events.push({ type: 'arrive', at: this.lifts });
    }
    // The plague (Jack): each of a side's squads but the base loses 1 (never below 1); not the elite squad.
    for (const side of ['guard', 'rising'] as const) {
      if (!s.plague?.[side]) continue;
      const hit = this.mine(s, side).filter((q) => q.place !== this.base(side) && q.strength > 1 && !q.elite);
      for (const q of hit) q.strength -= 1;
      s.plague[side] -= 1;
      events.push({ type: 'plagueTick', side, places: hit.map((q) => q.place) });
    }
    // One thing on the map at a time (a rumble, a crest, a mystery square: Jack), a crest first when it's due.
    const crest = this.rules.elites?.crest;
    if (crest && s.turn + 1 >= crest.first && (s.turn + 1 - crest.first) % crest.every === 0) s.crestDue = true;
    const taken = () => [s.rumble, s.crest, s.mystery, s.brothel, s.audience, s.church, s.barracks, s.architect].filter(Boolean).length >= (this.rules.tokensAtOnce ?? 1);
    // A rumble: one there stays a turn less; with none, now and then one appears on an empty street.
    const rumble = this.rules.rumble;
    if (s.rumble) {
      s.rumble.left -= 1;
      if (s.rumble.left <= 0) s.rumble = null;
    } else if (rumble && !s.crestDue && !taken() && this.roll(s) < rumble.chance) {
      // Where it matters (Jack: never caught one): an empty street next to both sides if there is one, so it's
      // a race; else next to anyone; else anywhere empty.
      const empty = this.board.places.filter((p) => !p.heart && !p.lifts && !this.squadAt(s, p.id) && !this.tokenAt(s, p.id) && !this.isTower(p.id));
      const nextTo = (p: RiotPlace, side: Side) => this.adj.get(p.id)!.some((n) => this.squadAt(s, n)?.side === side);
      const contested = empty.filter((p) => nextTo(p, 'guard') && nextTo(p, 'rising'));
      const near = empty.filter((p) => nextTo(p, 'guard') || nextTo(p, 'rising'));
      const pool = contested.length ? contested : near.length ? near : empty;
      const at = pool[Math.floor(this.roll(s) * pool.length)];
      if (at) {
        s.rumble = { place: at.id, left: rumble.lasts };
        events.push({ type: 'rumbleAppears', at: at.id });
      }
    }
    // A crest (Jack): one there stays a turn less; one appears when it's due and the map's clear.
    if (s.crest) {
      s.crest.left -= 1;
      if (s.crest.left <= 0) (events.push({ type: 'crestGone', at: s.crest.place }), (s.crest = null));
    }
    if (crest && s.crestDue && !taken()) {
      const at = this.crestPlace(s);
      if (at) (s.crest = { place: at, left: crest.lasts }), (s.crestDue = false), events.push({ type: 'crestAppears', at });
    }
    // A mystery square (Jack): the same; with the map clear, now and then one appears (a race, like a crest).
    const mystery = this.rules.mystery;
    if (s.mystery) {
      s.mystery.left -= 1;
      if (s.mystery.left <= 0) (events.push({ type: 'mysteryGone', at: s.mystery.place }), (s.mystery = null));
    } else if (mystery && !s.crestDue && !taken() && s.turn + 1 >= mystery.from && this.roll(s) < mystery.chance) {
      const at = this.crestPlace(s, false);
      if (at) {
        const r = this.roll(s);
        const mark = r < mystery.diviner ? 'diviner' : r < mystery.diviner + mystery.trickster ? 'trickster' : undefined;
        s.mystery = { place: at, left: mystery.lasts, ...(mark ? { mark } : {}) };
        events.push({ type: 'mysteryAppears', at, ...(mark ? { mark } : {}) });
      }
    }
    // The brothel and the audience (Jack): the same.
    const names = { brothel: ['brothelAppears', 'brothelGone'], audience: ['audienceAppears', 'audienceGone'], church: ['churchAppears', 'churchGone'], barracks: ['barracksAppears', 'barracksGone'], architect: ['architectAppears', 'architectGone'] } as const;
    for (const kind of ['brothel', 'audience', 'church', 'barracks', 'architect'] as const) {
      const r = this.rules[kind];
      const there = s[kind];
      if (there) {
        there.left -= 1;
        if (there.left <= 0) (events.push({ type: names[kind][1], at: there.place }), (s[kind] = null));
      } else if (r && !s.crestDue && !taken() && s.turn + 1 >= r.from && this.roll(s) < r.chance) {
        const at = this.crestPlace(s, false);
        if (at) (s[kind] = { place: at, left: r.lasts }), events.push({ type: names[kind][0], at });
      }
    }
    // The tutorial's things, on their turns, in order (one waits while the map's not clear).
    const script = this.rules.script;
    const next = script?.tokens[s.scripted ?? 0];
    if (script && next && s.turn + 1 >= next.turn && !taken()) {
      const at = this.scriptPlace(s, script.side);
      if (at) {
        s.scripted = (s.scripted ?? 0) + 1;
        const lasts = 3;
        if (next.token === 'rumble') (s.rumble = { place: at, left: lasts }), events.push({ type: 'rumbleAppears', at });
        else if (next.token === 'crest') (s.crest = { place: at, left: lasts }), events.push({ type: 'crestAppears', at });
        else if (next.token === 'mystery') (s.mystery = { place: at, left: lasts, ...(next.mark ? { mark: next.mark } : {}) }), events.push({ type: 'mysteryAppears', at, ...(next.mark ? { mark: next.mark } : {}) });
        else {
          s[next.token] = { place: at, left: lasts };
          events.push({ type: `${next.token}Appears`, at });
        }
      }
    }
    // An audience with the Lord (Jack: far less often): in each stretch of turns, now and then, on one turn of it,
    // one side's people pray (which side, by the dice).
    const call = this.rules.audience?.call;
    if (call) {
      if (!s.calls || (s.turn - 1) % call.every === 0) {
        const when = this.roll(s) < call.chance ? s.turn + Math.floor(this.roll(s) * call.every) : null;
        // (Only the player's side: Jack.)
        const who = this.rules.audience?.prays ?? 'guard';
        s.calls = who === 'guard' ? { guard: when, rising: null } : { guard: null, rising: when };
      }
      // (At most one thing out of the blue a turn, Jack: with something just appeared on the map, it waits a turn.)
      const fresh = events.some((e) => e.type.endsWith('Appears'));
      for (const side of ['guard', 'rising'] as const) {
        if (s.calls[side] === s.turn && fresh) s.calls[side] = s.turn + 1;
        if (s.calls[side] !== s.turn || s.pending) continue;
        s.pending = { kind: 'prayer', side };
        events.push({ type: 'call', side });
      }
    }
    // A shake-up (Jack): every so many turns, each side gets a crest, free, to put in any of its elite it can.
    const shake = this.rules.shakeUp;
    if (shake && this.rules.elites && s.turn % shake.every === 0 && shake.trickster && this.roll(s) < shake.trickster) {
      // (Or, now and then, it's the trickster, and the streets change instead: Jack.)
      events.push({ type: 'shakeUp', sides: [] });
      this.trick(s, 'guard', events);
    } else if (shake && this.rules.elites && s.turn % shake.every === 0) {
      const sides = (['guard', 'rising'] as const).filter((side) => ELITES.some((e) => this.eliteFree(s, side, e)));
      for (const side of sides) s.elites[side].crests += 1;
      events.push({ type: 'shakeUp', sides });
    }
    s.turn++;
    s.cut = null;
    s.held = [];
    if (s.blocked && s.blocked.until < s.turn) s.blocked = null;
    // The elite squad whose time is up are gone (Jack); whoever's still dug in (the king's guard's two turns, a
    // crusted hero) stays dug in.
    for (const q of s.squads.filter((x) => x.elite && (x.until ?? Infinity) < s.turn)) events.push({ type: 'eliteGone', at: q.place, side: q.side, elite: q.elite! });
    for (const q of s.squads.filter((x) => x.built && (x.until ?? Infinity) < s.turn)) events.push({ type: 'builtGone', at: q.place, side: q.side, building: q.built! });
    s.squads = s.squads.filter((x) => !(x.elite || x.built) || (x.until ?? Infinity) >= s.turn);
    s.fortified = s.squads.filter((x) => (x.fortUntil ?? -1) >= s.turn).map((x) => x.place);
    this.settle(s);
    return { state: s, events };
  }

  /**
   * Where a base would muster its new squad this turn: a street next to it, free or held by its own side, nearest
   * the other base (free first). Null: every way out's held by the other side, and they're cut off (a siege).
   */
  musterTo(s: RiotState, side: Side): string | null {
    const base = side === 'rising' ? this.heart : this.lifts;
    const enemy = side === 'rising' ? this.lifts : this.heart;
    const dist = (from: string) => {
      const seen = new Map([[from, 0]]);
      const todo = [from];
      while (todo.length) {
        const p = todo.shift()!;
        if (p === enemy) return seen.get(p)!;
        for (const n of this.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
      }
      return 99;
    };
    const ways = this.adj.get(base)!.filter((p) => s.rumble?.place !== p && p !== enemy);
    const free = ways.filter((p) => !this.squadAt(s, p)).sort((a, b) => dist(a) - dist(b) || a.localeCompare(b));
    const own = ways.filter((p) => this.squadAt(s, p)?.side === side).sort((a, b) => dist(a) - dist(b) || a.localeCompare(b));
    return free[0] ?? own[0] ?? null;
  }

  /**
   * Each base musters its new squad (on `s`, already a clone), whatever's in it (designer: lose your base and the
   * game's over anyway), out onto a street next to it; never into the base, so a garrison stays what it is. Cut
   * off on every side, none come (`to` null).
   */
  private musterAll(s: RiotState, events: RiotEvent[]): void {
    const m = this.rules.muster!;
    for (const side of ['rising', 'guard'] as const) {
      const base = side === 'rising' ? this.heart : this.lifts;
      if (this.squadAt(s, base)?.side === this.other(side)) continue;
      const to = this.musterTo(s, side);
      const there = to ? this.squadAt(s, to) : undefined;
      const more = Math.max(0, m + this.outputOf(s, side));
      if (there) there.strength += more;
      else if (to && more) {
        s.squads.push({ id: `q${s.nextId++}`, side, place: to, strength: more });
        s.owner[to] = side;
      }
      events.push({ type: 'muster', side, from: base, to, strength: Math.max(0, m + this.outputOf(s, side)) });
    }
  }

  /**
   * Who's won: the guard, when the square's theirs; the rising, if dawn comes and it's still theirs. In a siege
   * (the duel), the rising win by taking the guard's base, and dawn's the guard's.
   */
  outcome(s: RiotState): Side | null {
    this.use(s);
    if (this.rules.baseLoss && this.squadAt(s, this.lifts)?.side === 'rising') return 'rising';
    // Nobody of yours left anywhere, the base included (Jack): game over, no moves possible.
    if (this.rules.baseLoss && !this.mine(s, 'guard').length) return 'rising';
    if (this.rules.baseLoss && !this.mine(s, 'rising').length) return 'guard';
    if (this.squadAt(s, this.heart)?.side === 'guard') return 'guard';
    if (this.rules.siege && this.squadAt(s, this.lifts)?.side === 'rising') return 'rising';
    if (s.turn > this.rules.dawn) return this.rules.siege ? 'guard' : 'rising';
    return null;
  }
}
