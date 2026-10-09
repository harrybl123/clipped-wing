// Turn-based combat (docs/combat-design.md). Pure logic, no Phaser.
//
// The base is a traditional Persona-style system: HP and SP; on your turn a command menu (Attack, Skill
// for SP, Guard, Item, Run where allowed); turns in order of speed; enemies take their own turns.
// Persona's hook: hit a weakness (or land a critical) and the enemy is thrown off balance; enough of
// those before they recover (their `poise`, 2 for most) and they're knocked down, and you get One More,
// another action. Knocked down, they lose their next turn getting up, and can't be knocked down again
// until they've acted. (An all-out attack when
// every enemy is down is built but switched off: the designer felt it was too much Persona. An
// encounter can turn it on with `allOut: true`.)
//
// On top: you read what an enemy is about to do from a tell (a pose and a vague line, `tell` on each move;
// sometimes a feint, another move's tell, `feint` on each enemy). And any move can have a quick-time
// event (`qte`, src/systems/qte.ts), one per blow: on an enemy's attack the scene runs it as your reaction
// and passes in how you did (a dodge halves the harm; a parry, for those who can, takes none and hits
// back); on your own skill it's a boost (more harm for each good or perfect press, building through a
// combo). None is needed to play, and a miss is never worse than no QTE. How forgiving they are belongs
// to each fight (`timing`); parrying is a move the story hands out later (a combatant's `reactions`).

import { BOOST, easeQte, pickQte, type Grade, type Qte, type QteDef, type QteKind } from './qte';

export type MoveKind = 'strike' | 'shove' | 'grab' | 'pierce' | 'none';

/** Which way a blow comes from (the screen's left or right). */
export type SideOf = 'left' | 'right';

/** A skill (or a basic attack). Numbers are small and readable on purpose. */
export interface MoveDef {
  id: string;
  /** Shown in the menu and the intent. */
  name: string;
  /** One line on what it does, shown in the menu. */
  description: string;
  target: 'enemy' | 'self';
  /** How hard it hits, before the attacker's attack and the target's defence. 0 or absent: no harm. */
  power?: number;
  /** What kind of harm, for weaknesses and resistances. */
  kind?: MoveKind;
  /** SP it costs. */
  sp?: number;
  /** Chance (0–1) of a critical: more harm, knocks down, One More. */
  crit?: number;
  /** Its quick-time event, or one per blow (an enemy's: your reaction; yours: a boost). */
  qte?: QteDef | QteDef[];
  /** Blows in one attack (a flurry, a combo), each with its own QTE. */
  hits?: number;
  /** Your combos: each good press before makes the next blow `build` times harder still; `finisher`: land them all and the last throws him off balance. */
  combo?: { build: number; finisher?: boolean };
  /** Which pose each blow uses (the scene's), if not the move's id. */
  poses?: string[];
  /** What it looks like coming: the enemy's pose, and lines for it (one is picked). PLACEHOLDER lines. */
  tell?: { pose: string; lines: string[] };
  /** Landing it on someone about to unleash a wound-up blow breaks it: they lose it and their balance. */
  interrupts?: boolean;
  /** How much of it gets through a guard, and through a dodge (instead of the usual half each): a big blow can be cut right down. */
  softened?: { guard?: number; dodge?: number };
  /** Builds up: the user's next intent is this move, whatever the AI would pick (an enemy's wind-up). */
  windsUp?: string;
  /** Ends the fight at once with this outcome (holding back). */
  ends?: string;
  /** Draws every enemy that hasn't acted yet onto the user this round, and the user guards (the girl's Lure). */
  taunts?: boolean;
  /** Leaves what it hits weakened: it takes `mult` times the harm for `turns` rounds (the girl's Rot-ink). */
  exposes?: { turns: number; mult: number };
  /** Leaves what it hits half-blind for `turns` rounds: their reactions come faster and narrower (a straggler's fistful of grit). */
  blinds?: number;
  /** The next blow on the user (before their next turn): a good reaction parries it as well as a perfect one (the scavenger's Brace, her staff held across her). */
  braces?: boolean;
  /** Every enemy's tell this round shows what it will really do: no feints (the dog's Sniff). */
  reveals?: boolean;
  /** Takes this much SP off what it hits (the small straggler's Pinch: into your things). */
  drains?: number;
  /** Gives back this much HP: to the user (the boss's son's Breather), or with `healsSide` to everyone standing on the user's side (the old scavenger's Patch up). */
  heals?: number;
  healsSide?: boolean;
  /** Knocks the wind out of what it hits: for `turns` rounds its own blows do `mult` times the harm (a debt collector's Shakedown). */
  saps?: { turns: number; mult: number };
  /** Braver in numbers: `mob` times more harm for each other enemy still standing beside the user (an angry picker's Pile in). */
  mob?: number;
  /** Hangs on: what it hits takes `power` harm at the start of each of the next `turns` rounds, unless it guards (a ticker's Latch). Never the last of their health. */
  clings?: { turns: number; power: number };
  /** Shields everyone else on the user's side: they're guarding until their next turn (a drop guard's Ward, staff planted in front of the other). */
  wards?: boolean;
  /** The user slips the next blow aimed at them, outright, unless the dog's sniffed them out first (the scout's Slip). */
  evades?: boolean;
  /** Dust in the eyes: what it hits can't use skills for `silences` rounds (the scout's Dust, on the dog's nose). */
  silences?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  heal?: number;
  sp?: number;
}

export interface CombatantDef {
  id: string;
  name: string;
  /** How the scene draws them (a key the scene maps to a sprite). */
  sprite: string;
  hp: number;
  sp?: number;
  attack: number;
  defence: number;
  /** Higher acts first. */
  speed: number;
  /** The basic Attack command (party members), a move id. */
  basic?: string;
  /** Party members: the skills the story has given them. Enemies: what their AI picks from. */
  moves: string[];
  /** Enemies: how likely each of `moves` is. */
  weights?: number[];
  weak?: MoveKind[];
  resists?: MoveKind[];
  /** Weakness or critical hits it takes to knock them down, before they recover (default 1). */
  poise?: number;
  /** Reactions this combatant can make when attacked (party members). */
  reactions?: ('dodge' | 'parry')[];
  /** Enemies: the chance (0–1) a tell is a feint, another move's tell. */
  feint?: number;
  /** Enemies: how they choose, beyond `weights` (a temperament). */
  ai?: EnemyAi;
}

/**
 * How an enemy chooses its next move, on top of its weights, so it behaves like a person: it shows you
 * its moves early on, doesn't do the same thing over and over, and reacts to how the fight's going.
 * Each `when` multiplies weights while that's true.
 */
export interface EnemyAi {
  /** Its first moves, in order, one a round (to introduce each); then it chooses. */
  opening?: string[];
  /** The same move at most this many times in a row. */
  maxRepeat?: number;
  /** Weights of the moves among its last two times this much (below 1: it likes to vary what it does). */
  recent?: number;
  when?: {
    /** It's below half its health. */
    hurt?: Record<string, number>;
    /** Its target is below 40% of theirs. */
    foeHurt?: Record<string, number>;
    /** Its target guarded with their last action. */
    foeGuarding?: Record<string, number>;
  };
}

export interface EncounterDef {
  id: string;
  /** What it's called in the dev fight picker. */
  name?: string;
  party: string[];
  enemies: string[];
  /** Run is offered (and this outcome follows), or not at all. */
  run?: string;
  /** What's in the bag for this fight: item id → how many. */
  items?: Record<string, number>;
  /** Offer an all-out attack when every enemy is down (off unless set). */
  allOut?: boolean;
  /**
   * How forgiving the reaction timing is: `lunge` is how long (ms) an attack takes to land once it
   * comes at you, `ease` widens every move's windows (2 = twice as wide). Early fights are generous.
   */
  timing?: { lunge?: number; ease?: number };
  /** Where it's fought (the scene paints a stage for each): the market by default. */
  stage?: 'market' | 'rot' | 'fields' | 'camp' | 'bar' | 'den' | 'yard';
  /** The fight teaches itself: a short explanation the first time each of these comes up (`LESSONS`). */
  teaches?: string[];
  /**
   * Also teaches these, unless this ink variable is true (you've had them already): the rot fight teaches
   * the basics too if you held back at the market and never fought there.
   */
  alsoTeaches?: { unless: string; lessons: string[] };
  /**
   * What each outcome writes to ink (the only store of story state): `won`, `lost`, the run outcome,
   * and any move's `ends` id. The scene writes them through the StoryBridge when the fight ends.
   */
  outcomes: Record<string, Record<string, string | number | boolean>>;
}

export type Side = 'party' | 'enemy';
export type Reaction = 'none' | 'dodge' | 'parry';

export interface Combatant {
  /** Unique in the fight (`<def id>`, or `<def id>-2` for a second of the same). */
  id: string;
  def: CombatantDef;
  side: Side;
  hp: number;
  sp: number;
  /** Knocked down: loses their next turn getting up. */
  down: boolean;
  /** Weakness or critical hits taken towards a knockdown (0: steady on their feet). */
  offBalance: number;
  /** Their own turns left before they find their balance again. */
  recoverIn: number;
  /** Just got up: can't be thrown off balance or knocked down until they've acted. */
  steady: boolean;
  /** Guarding until their next turn: half harm, and weaknesses don't knock them down. */
  guarding: boolean;
  /** Rounds left of being weakened (`exposes`), and by how much it multiplies the harm they take. */
  exposed: number;
  exposedMult: number;
  /** Rounds left half-blind (`blinds`): reacting is harder. */
  blinded: number;
  /** Rounds left winded (`saps`), and how much it multiplies the harm their own blows do. */
  sapped: number;
  sappedMult: number;
  /** Rounds left with something hanging on (`clings`), and the harm it does each round. */
  clinging: number;
  clingPower: number;
  /** Slipping the next blow (`evades`). */
  evading: boolean;
  /** Rounds left unable to use skills (`silences`). */
  silenced: number;
  /** Braced (`braces`) until their next turn. */
  braced: boolean;
}

export interface Intent {
  move: string;
  target: string;
  /** What you see: a pose and a line (another move's, if it's a feint). */
  tell?: { pose: string; line: string };
  /** Side attacks: which side it comes from. */
  side?: SideOf;
  /** The blow a wind-up was for: a shove (`interrupts`) breaks it. */
  charged?: boolean;
  /** Drawn onto someone this round by a Lure. */
  lured?: boolean;
}

export type Action =
  | { type: 'attack'; target?: string; grades?: Grade[] }
  | { type: 'skill'; move: string; target?: string; grades?: Grade[] }
  | { type: 'guard' }
  | { type: 'item'; item: string; target?: string }
  | { type: 'run' }
  | { type: 'allOut' }
  | { type: 'switch' };

/** What happened, in order, for the scene to animate and describe. */
export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'intent'; actor: string; move: string; target: string }
  | { type: 'move'; actor: string; move: string; target: string }
  | { type: 'item'; actor: string; item: string; target: string }
  | { type: 'guard'; actor: string }
  | { type: 'reaction'; actor: string; target: string; reaction: Reaction }
  | { type: 'damage'; target: string; amount: number; hp: number; weak?: boolean; resisted?: boolean; crit?: boolean; guarded?: boolean }
  | { type: 'heal'; target: string; hp: number; sp: number }
  | { type: 'offBalance'; target: string; hits: number; poise: number }
  | { type: 'recover'; target: string }
  | { type: 'knockdown'; target: string }
  | { type: 'oneMore'; actor: string }
  | { type: 'counter'; actor: string; target: string }
  | { type: 'interrupt'; target: string }
  | { type: 'taunt'; actor: string; lured: string[] }
  | { type: 'switch'; from: string; to: string }
  | { type: 'weakened'; target: string }
  | { type: 'blinded'; target: string }
  | { type: 'sapped'; target: string }
  | { type: 'clung'; target: string }
  | { type: 'warded'; target: string }
  | { type: 'evading'; target: string }
  | { type: 'evaded'; target: string }
  | { type: 'silenced'; target: string }
  | { type: 'gnawed'; target: string; amount: number; hp: number }
  | { type: 'drained'; target: string; amount: number; sp: number }
  | { type: 'braced'; actor: string }
  | { type: 'revealed'; actor: string }
  | { type: 'qte'; actor: string; grade: Grade }
  | { type: 'stumble'; actor: string }
  | { type: 'allOut'; actor: string }
  | { type: 'getUp'; target: string }
  | { type: 'defeated'; target: string }
  | { type: 'end'; outcome: string };

export interface Command {
  type: Action['type'];
  usable: boolean;
  reason?: string;
}

export interface SkillChoice {
  move: MoveDef;
  usable: boolean;
  reason?: string;
}

export type Rng = () => number;

/** Harm multipliers. */
export const WEAK = 1.5;
export const RESIST = 0.5;
export const CRIT = 1.5;
export const GUARD = 0.5;
export const DODGE = 0.5;
/** An all-out attack's power, per party member standing. */
export const ALL_OUT_POWER = 14;
/** Reaction timing when a fight doesn't say. */
export const DEFAULT_TIMING = { lunge: 650, ease: 1 };
/** How much easier (below 1: harder) reacting is while half-blind. */
export const BLIND_EASE = 0.6;
/** Off balance lasts this many of their own turns, then they find their feet. */
export const RECOVER_TURNS = 2;

export class Battle {
  readonly combatants: Combatant[];
  /** Items left: id → count. */
  readonly items: Map<string, number>;
  private readonly intents = new Map<string, Intent>();
  /** Forced next intents (after a wind-up). */
  private readonly nextIntent = new Map<string, string>();
  /** What each enemy has chosen so far (forced follow-ups not counted), to vary it and follow its opening. */
  private readonly chosen = new Map<string, string[]>();
  /** Party members whose last action was to guard. */
  private readonly guarded = new Set<string>();
  private order: string[] = [];
  private turnIndex = 0;
  private _round = 0;
  private _outcome: string | null = null;
  /** The current actor has earned another action (One More), and hasn't used it yet. */
  private oneMore = false;
  /** Someone has already switched this round (once a round, so it can't go back and forth). */
  private switched = false;

  /** Events from starting the fight (the first round and intents). */
  readonly opening: BattleEvent[];

  constructor(
    readonly encounter: EncounterDef,
    private readonly moves: Record<string, MoveDef>,
    combatants: Record<string, CombatantDef>,
    private readonly itemDefs: Record<string, ItemDef> = {},
    private readonly rng: Rng = Math.random,
  ) {
    const make = (side: Side) => (defId: string, i: number, all: string[]): Combatant => {
      const def = combatants[defId];
      if (!def) throw new Error(`Combat: no combatant called "${defId}"`);
      for (const m of [...def.moves, ...(def.basic ? [def.basic] : [])]) if (!moves[m]) throw new Error(`Combat: ${defId} has unknown move "${m}"`);
      const n = all.slice(0, i).filter((d) => d === defId).length;
      return { id: n ? `${defId}-${n + 1}` : defId, def, side, hp: def.hp, sp: def.sp ?? 0, down: false, guarding: false, offBalance: 0, recoverIn: 0, steady: false, exposed: 0, exposedMult: 1, blinded: 0, sapped: 0, sappedMult: 1, clinging: 0, clingPower: 0, evading: false, silenced: 0, braced: false };
    };
    this.combatants = [...encounter.party.map(make('party')), ...encounter.enemies.map(make('enemy'))];
    if (!this.combatants.some((c) => c.side === 'party') || !this.combatants.some((c) => c.side === 'enemy')) {
      throw new Error(`Combat: encounter "${encounter.id}" needs at least one on each side`);
    }
    this.items = new Map(Object.entries(encounter.items ?? {}).filter(([, n]) => n > 0));
    for (const id of this.items.keys()) if (!itemDefs[id]) throw new Error(`Combat: no item called "${id}"`);
    this.opening = this.startRound();
  }

  get round(): number {
    return this._round;
  }

  /** null while the fight goes on; then `won`, `lost`, the run outcome, or a move's `ends` id. */
  get outcome(): string | null {
    return this._outcome;
  }

  /** Whose turn it is (null once it's over). */
  get current(): Combatant | null {
    if (this._outcome) return null;
    return this.get(this.order[this.turnIndex]!);
  }

  get(id: string): Combatant {
    const c = this.combatants.find((x) => x.id === id);
    if (!c) throw new Error(`Combat: no combatant "${id}" in this fight`);
    return c;
  }

  move(id: string): MoveDef {
    const m = this.moves[id];
    if (!m) throw new Error(`Combat: no move called "${id}"`);
    return m;
  }

  item(id: string): ItemDef {
    const i = this.itemDefs[id];
    if (!i) throw new Error(`Combat: no item called "${id}"`);
    return i;
  }

  living(side: Side): Combatant[] {
    return this.combatants.filter((c) => c.side === side && c.hp > 0);
  }

  /** What an enemy is about to do this round (a hint over its head). */
  intentOf(id: string): Intent | undefined {
    return this.intents.get(id);
  }

  /** How forgiving the reaction timing is in this fight. */
  get timing(): { lunge: number; ease: number } {
    return { ...DEFAULT_TIMING, ...this.encounter.timing };
  }

  /** Every enemy standing is knocked down, and this fight allows an all-out attack. */
  get allOutReady(): boolean {
    if (!this.encounter.allOut) return false;
    const foes = this.living('enemy');
    return foes.length > 0 && foes.every((f) => f.down);
  }

  /** The command menu for the current party member. */
  commands(): Command[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') return [];
    const list: Command[] = [];
    if (this.allOutReady) list.push({ type: 'allOut', usable: true });
    list.push({ type: 'attack', usable: !!actor.def.basic, ...(actor.def.basic ? {} : { reason: 'No attack' }) });
    const noSkill = !actor.def.moves.length ? 'No skills' : actor.silenced > 0 ? 'Can\u2019t, not yet' : undefined;
    list.push({ type: 'skill', usable: !noSkill, ...(noSkill ? { reason: noSkill } : {}) });
    list.push({ type: 'guard', usable: true });
    if (this.items.size) list.push({ type: 'item', usable: true });
    if (this.encounter.run) list.push({ type: 'run', usable: true });
    // Switch: hand the turn to a friend who hasn't acted yet this round (they go now; you take their place).
    if (this.living('party').length > 1) {
      const reason = this.oneMore ? 'Not on One More' : this.switched ? 'Once a round' : !this.switchPartner() ? 'Everyone has acted' : undefined;
      list.push({ type: 'switch', usable: !reason, ...(reason ? { reason } : {}) });
    }
    return list;
  }

  /** The current party member's skills, and whether each can be used (enough SP). */
  skills(): SkillChoice[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') return [];
    return actor.def.moves.map((id) => {
      const move = this.move(id);
      return (move.sp ?? 0) > actor.sp ? { move, usable: false, reason: 'Not enough SP' } : { move, usable: true };
    });
  }

  /**
   * The QTE for blow `hit` of a move, as this fight eases it (`canPerfect`: whether a perfect counts).
   * `last`: the kind of the last QTE shown; a move with an `alt` uses that instead of repeating it.
   */
  qteFor(move: string, hit = 0, canPerfect = true, last: QteKind | null = null, harder = 1): Qte | null {
    const q = this.move(move).qte;
    const def = Array.isArray(q) ? q[Math.min(hit, q.length - 1)] : q;
    if (!def) return null;
    const { ease, lunge } = this.timing;
    return easeQte(pickQte(def, last), ease * harder, lunge, canPerfect);
  }

  /** How `target` reacts to blow `hit` of an enemy's `move`: null if it can't (it can't dodge, or there's no QTE). */
  reactionWindow(move: string, target: string, hit = 0, last: QteKind | null = null): Qte | null {
    const t = this.get(target);
    if (!t.def.reactions?.includes('dodge')) return null;
    return this.qteFor(move, hit, t.def.reactions.includes('parry'), last, t.blinded > 0 ? BLIND_EASE : 1);
  }

  /** What a QTE grade on an enemy's blow means for you: a good one dodges, a perfect one parries (if you can). */
  static reactionFor(grade: Grade): Reaction {
    return grade === 'perfect' ? 'parry' : grade === 'good' ? 'dodge' : 'none';
  }

  /** The current party member acts. */
  /** The friend a Switch hands the turn to: the next party member still to act this round, on their feet. */
  switchPartner(): Combatant | null {
    for (let i = this.turnIndex + 1; i < this.order.length; i++) {
      const c = this.get(this.order[i]!);
      if (c.side === 'party' && c.hp > 0 && !c.down) return c;
    }
    return null;
  }

  act(action: Action): BattleEvent[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') throw new Error("Combat: not a party member's turn");
    const command = this.commands().find((c) => c.type === action.type);
    if (!command?.usable) throw new Error(`Combat: "${action.type}" can't be used now`);
    if (action.type === 'switch') {
      // Not an action of their own: they swap places in the order with the friend, who goes now. (Their guard,
      // balance and so on carry on as they were.)
      const partner = this.switchPartner()!;
      const j = this.order.indexOf(partner.id);
      this.order[j] = actor.id;
      this.order[this.turnIndex] = partner.id;
      this.switched = true;
      return [{ type: 'switch', from: actor.id, to: partner.id }];
    }
    actor.guarding = false;
    actor.braced = false;
    this.guarded.delete(actor.id);
    const events: BattleEvent[] = [];
    const firstFoe = () => this.living('enemy')[0]!.id;
    // Only someone still standing in the fight can be gone for.
    const target = 'target' in action ? action.target : undefined;
    if (target !== undefined && !this.living('enemy').some((e) => e.id === target)) throw new Error(`Combat: "${target}" isn't in the fight`);
    switch (action.type) {
      case 'attack':
        events.push(...this.strike(actor, this.move(actor.def.basic!), this.get(action.target ?? firstFoe()), { grades: action.grades ?? [] }));
        break;
      case 'skill': {
        if (!actor.def.moves.includes(action.move)) throw new Error(`Combat: ${actor.id} doesn't know "${action.move}"`);
        const move = this.move(action.move);
        if ((move.sp ?? 0) > actor.sp) throw new Error(`Combat: not enough SP for "${action.move}"`);
        actor.sp -= move.sp ?? 0;
        if (move.ends) {
          events.push({ type: 'move', actor: actor.id, move: move.id, target: actor.id });
          return [...events, ...this.finish(move.ends)];
        }
        const target = move.target === 'self' ? actor : this.get(action.target ?? firstFoe());
        events.push(...this.strike(actor, move, target, { grades: action.grades ?? [] }));
        if (move.taunts) events.push(...this.taunt(actor));
        if (move.braces) {
          actor.braced = true;
          events.push({ type: 'braced', actor: actor.id });
        }
        if (move.reveals) events.push(...this.reveal(actor));
        break;
      }
      case 'guard':
        actor.guarding = true;
        this.guarded.add(actor.id);
        events.push({ type: 'guard', actor: actor.id });
        break;
      case 'item': {
        const left = this.items.get(action.item) ?? 0;
        if (!left) throw new Error(`Combat: no "${action.item}" left`);
        this.items.set(action.item, left - 1);
        if (left === 1) this.items.delete(action.item);
        const item = this.item(action.item);
        const target = this.get(action.target ?? actor.id);
        target.hp = Math.min(target.def.hp, target.hp + (item.heal ?? 0));
        target.sp = Math.min(target.def.sp ?? 0, target.sp + (item.sp ?? 0));
        events.push({ type: 'item', actor: actor.id, item: item.id, target: target.id }, { type: 'heal', target: target.id, hp: target.hp, sp: target.sp });
        break;
      }
      case 'run':
        events.push({ type: 'move', actor: actor.id, move: 'run', target: actor.id });
        return [...events, ...this.finish(this.encounter.run!)];
      case 'allOut': {
        events.push({ type: 'allOut', actor: actor.id });
        const power = ALL_OUT_POWER * this.living('party').length;
        for (const foe of this.living('enemy')) {
          const amount = Math.max(1, Math.round(power * this.variance()));
          foe.hp = Math.max(0, foe.hp - amount);
          events.push({ type: 'damage', target: foe.id, amount, hp: foe.hp });
          if (foe.hp === 0) events.push({ type: 'defeated', target: foe.id });
          else {
            // Those still standing pick themselves up.
            foe.down = false;
            events.push({ type: 'getUp', target: foe.id });
          }
        }
        // Going all out spends the One More that set it up.
        this.oneMore = false;
        break;
      }
    }
    events.push(...this.checkEnd());
    if (this._outcome) return events;
    this.endOwnTurn(actor, events);
    if (this.oneMore) {
      // One More: the same one goes again (once; the next knockdown can earn another).
      this.oneMore = false;
      events.push({ type: 'oneMore', actor: actor.id });
      return events;
    }
    return [...events, ...this.nextTurn()];
  }

  /**
   * The current enemy does what its intent said. `reaction` is how the target reacted in the scene's
   * reaction game, one per blow for a flurry (ignored if the move can't be reacted to).
   */
  enemyTurn(reaction: Reaction | Reaction[] = 'none'): BattleEvent[] {
    const actor = this.current;
    if (!actor || actor.side !== 'enemy') throw new Error("Combat: not an enemy's turn");
    actor.guarding = false;
    const intent = this.intents.get(actor.id);
    let events: BattleEvent[];
    let move: MoveDef | null = null;
    if (!intent) {
      // His blow was broken: he spends the turn finding his feet.
      events = [{ type: 'stumble', actor: actor.id }];
    } else {
      move = this.move(intent.move);
      let target = this.get(intent.target);
      // If the one it meant to hit is down for good, it turns on someone else.
      if (target.hp <= 0) target = this.living('party')[0]!;
      events = this.strike(actor, move, target, { reactions: Array.isArray(reaction) ? reaction : [reaction] });
    }
    if (move?.windsUp) this.nextIntent.set(actor.id, move.windsUp);
    events.push(...this.checkEnd());
    if (this._outcome) return events;
    this.endOwnTurn(actor, events);
    // Enemies don't get One More in this first version.
    this.oneMore = false;
    return [...events, ...this.nextTurn()];
  }

  /** A move from one to another: harm, weaknesses, criticals, knockdowns; a parry's counter. */
  /**
   * A move from one to another, blow by blow: harm, weaknesses, criticals, knockdowns. An enemy's blows
   * take your `reactions` (a parry hits back); your own take your QTE `grades` (each a boost, building
   * through a combo).
   */
  private strike(actor: Combatant, move: MoveDef, target: Combatant, { reactions = [], grades = [] }: { reactions?: Reaction[]; grades?: Grade[] }): BattleEvent[] {
    const events: BattleEvent[] = [{ type: 'move', actor: actor.id, move: move.id, target: target.id }];
    if (move.heals) {
      for (const c of move.healsSide ? this.living(actor.side) : [actor]) {
        c.hp = Math.min(c.def.hp, c.hp + move.heals);
        events.push({ type: 'heal', target: c.id, hp: c.hp, sp: c.sp });
      }
    }
    if (move.wards) {
      for (const c of this.living(actor.side)) {
        if (c === actor) continue;
        c.guarding = true;
        events.push({ type: 'warded', target: c.id });
      }
    }
    if (move.evades) {
      actor.evading = true;
      events.push({ type: 'evading', target: actor.id });
    }
    if (move.target === 'self' || !move.power) return events;
    if (target.evading && actor.side !== target.side) {
      // Slipped: the blow finds nothing.
      target.evading = false;
      events.push({ type: 'evaded', target: target.id });
      return events;
    }
    const window = this.reactionWindow(move.id, target.id);
    let landed = 0;
    // Was the target about to unleash a wound-up blow? (Before this lands, in case it floors them.)
    const intent = this.intents.get(target.id);
    const breaks = !!move.interrupts && target.side === 'enemy' && !!intent?.charged && !this.hasActed(target.id);
    for (let i = 0; i < (move.hits ?? 1) && target.hp > 0 && actor.hp > 0; i++) {
      const reaction = reactions[i] ?? 'none';
      let r: Reaction = window && (reaction === 'none' || target.def.reactions?.includes(reaction)) ? reaction : 'none';
      // Braced: the next blow, a good reaction turns it aside and hits back, like a perfect one. Spent on that blow.
      if (r !== 'none' && target.braced) {
        if (r === 'dodge') r = 'parry';
        target.braced = false;
      }
      if (window) events.push({ type: 'reaction', actor: actor.id, target: target.id, reaction: r });
      if (r === 'parry') {
        // A clean parry: no harm, and a free hit back (the target's basic attack), which can't chain.
        if (target.def.basic) {
          events.push({ type: 'counter', actor: target.id, target: actor.id });
          events.push(...this.harm(target, this.move(target.def.basic), actor, 1, false));
        }
        continue;
      }
      // Your own blow: boosted by how you did on its QTE, and by the good presses before it in a combo.
      const grade = grades[i] ?? 'miss';
      // (Only when the move had a QTE: a move without one hits as written.)
      const boost = actor.side === 'party' && grades.length ? BOOST[grade] * (1 + (move.combo?.build ?? 0) * landed) : 1;
      if (grade !== 'miss') landed++;
      if (grades.length) events.push({ type: 'qte', actor: actor.id, grade });
      events.push(...this.harm(actor, move, target, (r === 'dodge' ? (move.softened?.dodge ?? DODGE) : 1) * boost, true));
    }
    // A combo's finisher: land every blow and the last throws him off balance.
    const hits = move.hits ?? 1;
    if (move.combo?.finisher && landed === hits && target.hp > 0) this.unbalance(actor, target, events);
    if (breaks && target.hp > 0 && !target.down) {
      // Broken: the big blow is lost, and so is his balance.
      this.intents.delete(target.id);
      events.push({ type: 'interrupt', target: target.id });
      this.unbalance(actor, target, events);
    }
    return events;
  }

  /** Everything about to attack this round turns on the one who drew it, who braces. */
  private taunt(actor: Combatant): BattleEvent[] {
    actor.guarding = true;
    this.guarded.add(actor.id);
    const lured: string[] = [];
    for (const foe of this.living('enemy')) {
      const intent = this.intents.get(foe.id);
      if (intent && !this.hasActed(foe.id) && this.move(intent.move).target === 'enemy') {
        intent.target = actor.id;
        intent.lured = true;
        lured.push(foe.id);
      }
    }
    return [{ type: 'taunt', actor: actor.id, lured }];
  }

  /** Sniffed out: every enemy still to act this round shows its real move's tell. */
  private reveal(actor: Combatant): BattleEvent[] {
    for (const foe of this.living('enemy')) {
      // Sniffed out: nobody slips anything this round.
      foe.evading = false;
      const intent = this.intents.get(foe.id);
      const tell = intent && this.move(intent.move).tell;
      if (intent && tell?.lines.length && !this.hasActed(foe.id)) intent.tell = { pose: tell.pose, line: tell.lines[0]! };
    }
    return [{ type: 'revealed', actor: actor.id }];
  }

  private hasActed(id: string): boolean {
    return this.order.indexOf(id) < this.turnIndex;
  }

  private harm(actor: Combatant, move: MoveDef, target: Combatant, scale: number, canKnockDown: boolean): BattleEvent[] {
    const events: BattleEvent[] = [];
    const kind = move.kind ?? 'strike';
    const weak = !!target.def.weak?.includes(kind);
    const resisted = !weak && !!target.def.resists?.includes(kind);
    const crit = !weak && !resisted && this.rng() < (move.crit ?? 0);
    let amount = (move.power! * actor.def.attack) / target.def.defence;
    amount *= this.variance() * scale;
    if (weak) amount *= WEAK;
    if (resisted) amount *= RESIST;
    if (crit) amount *= CRIT;
    if (target.guarding) amount *= move.softened?.guard ?? GUARD;
    if (target.exposed > 0) amount *= target.exposedMult;
    if (actor.sapped > 0) amount *= actor.sappedMult;
    if (move.mob) amount *= 1 + move.mob * this.living(actor.side).filter((c) => c !== actor).length;
    const n = Math.max(1, Math.round(amount));
    target.hp = Math.max(0, target.hp - n);
    events.push({
      type: 'damage', target: target.id, amount: n, hp: target.hp,
      ...(weak ? { weak } : {}), ...(resisted ? { resisted } : {}), ...(crit ? { crit } : {}), ...(target.guarding ? { guarded: true } : {}),
    });
    if (target.hp === 0) {
      events.push({ type: 'defeated', target: target.id });
      return events;
    }
    // A weakness or a critical throws them off balance (not while guarding, not if already down, not
    // the turn they got up); enough of those before they recover and they're knocked down, and the party
    // member who did it goes again.
    if (canKnockDown && (weak || crit) && !target.guarding && scale >= 1) this.unbalance(actor, target, events);
    if (move.exposes && actor.side !== target.side) {
      target.exposed = move.exposes.turns;
      target.exposedMult = move.exposes.mult;
      events.push({ type: 'weakened', target: target.id });
    }
    if (move.drains && actor.side !== target.side && target.sp > 0) {
      const amount = Math.min(target.sp, move.drains);
      target.sp -= amount;
      events.push({ type: 'drained', target: target.id, amount, sp: target.sp });
    }
    if (move.blinds && actor.side !== target.side) {
      target.blinded = move.blinds;
      events.push({ type: 'blinded', target: target.id });
    }
    if (move.clings && actor.side !== target.side) {
      target.clinging = move.clings.turns;
      target.clingPower = move.clings.power;
      events.push({ type: 'clung', target: target.id });
    }
    if (move.silences && actor.side !== target.side) {
      target.silenced = move.silences;
      events.push({ type: 'silenced', target: target.id });
    }
    if (move.saps && actor.side !== target.side) {
      target.sapped = move.saps.turns;
      target.sappedMult = move.saps.mult;
      events.push({ type: 'sapped', target: target.id });
    }
    return events;
  }

  /** One more knock to their balance: off balance, or, at their poise, down (and One More for the party). */
  private unbalance(actor: Combatant, target: Combatant, events: BattleEvent[]): void {
    if (target.down || target.steady) return;
    target.offBalance++;
    const poise = target.def.poise ?? 1;
    if (target.offBalance >= poise) {
      target.down = true;
      target.offBalance = 0;
      target.recoverIn = 0;
      events.push({ type: 'knockdown', target: target.id });
      if (actor.side === 'party') this.oneMore = true;
    } else {
      target.recoverIn = RECOVER_TURNS;
      events.push({ type: 'offBalance', target: target.id, hits: target.offBalance, poise });
    }
  }

  /** The end of someone's own action: the turn after getting up is over, and off balance wears off. */
  private endOwnTurn(c: Combatant, events: BattleEvent[]): void {
    c.steady = false;
    if (c.offBalance > 0 && --c.recoverIn <= 0) {
      c.offBalance = 0;
      c.recoverIn = 0;
      events.push({ type: 'recover', target: c.id });
    }
  }

  /** ±10% on every hit. */
  private variance(): number {
    return 0.9 + this.rng() * 0.2;
  }

  private finish(outcome: string): BattleEvent[] {
    this._outcome = outcome;
    return [{ type: 'end', outcome }];
  }

  private checkEnd(): BattleEvent[] {
    if (this._outcome) return [];
    if (!this.living('enemy').length) return this.finish('won');
    if (!this.living('party').length) return this.finish('lost');
    return [];
  }

  /** On to the next one standing; a new round when everyone has gone. Anyone down spends their turn getting up. */
  private nextTurn(): BattleEvent[] {
    const events: BattleEvent[] = [];
    for (;;) {
      do this.turnIndex++;
      while (this.turnIndex < this.order.length && this.get(this.order[this.turnIndex]!).hp <= 0);
      if (this.turnIndex >= this.order.length) {
        events.push(...this.startRound());
        if (!this.getUp(events)) return events;
      } else if (!this.getUp(events)) return events;
    }
  }

  /** If the current one is down, they get up, and that's their turn. */
  private getUp(events: BattleEvent[]): boolean {
    const c = this.current!;
    if (!c.down) return false;
    c.down = false;
    c.guarding = false;
    c.steady = true;
    this.intents.delete(c.id);
    events.push({ type: 'getUp', target: c.id });
    return true;
  }

  /** An enemy's next move, by its weights and temperament (`ai`). */
  private choose(enemy: Combatant, foe: Combatant): string {
    const history = this.chosen.get(enemy.id) ?? [];
    const weights = aiWeights(enemy.def, history, {
      hurt: enemy.hp < enemy.def.hp / 2,
      foeHurt: foe.hp < foe.def.hp * 0.4,
      foeGuarding: this.guarded.has(foe.id),
    });
    const move = pickWeighted(enemy.def.moves, weights, this.rng);
    this.chosen.set(enemy.id, [...history, move]);
    return move;
  }

  private startRound(): BattleEvent[] {
    this._round++;
    this.switched = false;
    for (const c of this.combatants) {
      if (c.exposed > 0) c.exposed--;
      if (c.blinded > 0) c.blinded--;
      if (c.sapped > 0) c.sapped--;
      if (c.silenced > 0) c.silenced--;
    }
    const events: BattleEvent[] = [{ type: 'round', round: this._round }];
    // Whatever's hanging on gnaws at the start of each round (guarding shakes it off); it never finishes anyone.
    for (const c of this.combatants) {
      if (c.clinging <= 0 || c.hp <= 0) continue;
      c.clinging--;
      if (c.guarding) { c.clinging = 0; continue; }
      const amount = Math.min(c.clingPower, c.hp - 1);
      if (amount <= 0) continue;
      c.hp -= amount;
      events.push({ type: 'gnawed', target: c.id, amount, hp: c.hp });
    }
    this.intents.clear();
    for (const enemy of this.living('enemy')) {
      const forced = this.nextIntent.get(enemy.id);
      this.nextIntent.delete(enemy.id);
      const party = this.living('party');
      // Whom it's after decides how it feels about the fight, so pick that first.
      const foe = party[Math.floor(this.rng() * party.length)]!;
      const move = forced ?? this.choose(enemy, foe);
      const m = this.move(move);
      const target = m.target === 'self' ? enemy.id : foe.id;
      const intent: Intent = { move, target, ...(forced ? { charged: true } : {}) };
      if (this.qteFor(move)?.kind === 'side') intent.side = this.rng() < 0.5 ? 'left' : 'right';
      // What you see: this move's tell, or now and then (a feint) another's.
      const others = enemy.def.moves.filter((o) => o !== move && this.move(o).tell);
      const feint = (enemy.def.feint ?? 0) > 0 && others.length > 0 && this.rng() < enemy.def.feint!;
      const shown = feint ? this.move(others[Math.floor(this.rng() * others.length)]!) : m;
      if (shown.tell?.lines.length) intent.tell = { pose: shown.tell.pose, line: shown.tell.lines[Math.floor(this.rng() * shown.tell.lines.length)]! };
      this.intents.set(enemy.id, intent);
      events.push({ type: 'intent', actor: enemy.id, move, target });
    }
    const living = this.combatants.filter((c) => c.hp > 0);
    this.order = [...living].sort((a, b) => b.def.speed - a.def.speed || (a.side === b.side ? 0 : a.side === 'party' ? -1 : 1)).map((c) => c.id);
    this.turnIndex = 0;
    return events;
  }
}

/** Weights after an enemy's temperament: its opening, no long repeats, and how the fight's going. */
export function aiWeights(def: CombatantDef, history: readonly string[], state: { hurt: boolean; foeHurt: boolean; foeGuarding: boolean }): number[] {
  const ai = def.ai ?? {};
  const opening = ai.opening?.[history.length];
  if (opening && def.moves.includes(opening)) return def.moves.map((m) => (m === opening ? 1 : 0));
  const last = history[history.length - 1];
  let streak = 0;
  for (let i = history.length - 1; i >= 0 && history[i] === last; i--) streak++;
  const weights = def.moves.map((m, i) => {
    let w = def.weights?.[i] ?? 1;
    if (state.hurt) w *= ai.when?.hurt?.[m] ?? 1;
    if (state.foeHurt) w *= ai.when?.foeHurt?.[m] ?? 1;
    if (state.foeGuarding) w *= ai.when?.foeGuarding?.[m] ?? 1;
    if (ai.recent !== undefined && history.slice(-2).includes(m)) w *= ai.recent;
    if (ai.maxRepeat && m === last && streak >= ai.maxRepeat) w = 0;
    return w;
  });
  // (If its temperament rules everything out, fall back on its plain weights.)
  return weights.some((w) => w > 0) ? weights : def.moves.map((_, i) => def.weights?.[i] ?? 1);
}

function pickWeighted(moves: string[], weights: number[] | undefined, rng: Rng): string {
  const w = moves.map((_, i) => weights?.[i] ?? 1);
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < moves.length; i++) {
    r -= w[i]!;
    if (r < 0) return moves[i]!;
  }
  return moves[moves.length - 1]!;
}
