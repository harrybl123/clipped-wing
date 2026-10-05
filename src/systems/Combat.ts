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
// sometimes a feint, another move's tell, `feint` on each enemy), and when its attack comes at you the
// scene runs a short reaction game and passes in how you did: a dodge halves the harm, a parry takes none
// and opens a counter (a free hit back). The games (`ReactionKind`): a ring closing into a band, the same
// with a side to dodge away from, one ring per hit for a flurry, or mashing to break a hold. None is
// needed to play, and a miss is only the normal harm. How forgiving the timing is belongs to each fight
// (`timing`); parrying is a move the story hands out later (a combatant's `reactions`).

export type MoveKind = 'strike' | 'shove' | 'grab' | 'pierce' | 'none';

/**
 * How you react to an attack:
 *   ring    a ring closes on your head; press while it's in the band (the donut), not before, not after
 *   side    the same, but press the arrow away from the side the blow comes from (read it from his pose)
 *   rhythm  one ring per hit, in quick succession (a flurry): a press for each
 *   mash    he's got hold of you: press again and again to break free before the time's up
 */
export type ReactionKind = 'ring' | 'side' | 'rhythm' | 'mash';

/** An attack you can react to. Times are ms before the blow lands. */
export interface ReactionDef {
  kind?: ReactionKind;
  /** The band opens (the ring reaches its outer edge). */
  dodge?: number;
  /** The band closes (the ring passes its inner edge): any later is too late. */
  late?: number;
  /** For those who can parry: the innermost part of the band. */
  parry?: number;
  /** mash: how many presses break the hold, and how long you have (ms). */
  presses?: number;
  time?: number;
}

/** A reaction as this fight sets it, for this target (windows eased by the fight's timing). */
export interface ReactionWindow {
  kind: ReactionKind;
  dodge: number;
  late: number;
  parry: number;
  presses: number;
  time: number;
}

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
  /** An attack the target can react to: which game, and its windows. */
  reaction?: ReactionDef;
  /** Blows in one attack (a flurry), each reacted to in turn. */
  hits?: number;
  /** What it looks like coming: the enemy's pose, and lines for it (one is picked). PLACEHOLDER lines. */
  tell?: { pose: string; lines: string[] };
  /** Landing it on someone about to unleash a wound-up blow breaks it: they lose it and their balance. */
  interrupts?: boolean;
  /** Builds up: the user's next intent is this move, whatever the AI would pick (an enemy's wind-up). */
  windsUp?: string;
  /** Ends the fight at once with this outcome (holding back). */
  ends?: string;
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
}

export interface EncounterDef {
  id: string;
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
}

export type Action =
  | { type: 'attack'; target?: string }
  | { type: 'skill'; move: string; target?: string }
  | { type: 'guard' }
  | { type: 'item'; item: string; target?: string }
  | { type: 'run' }
  | { type: 'allOut' };

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
/** Off balance lasts this many of their own turns, then they find their feet. */
export const RECOVER_TURNS = 2;

export class Battle {
  readonly combatants: Combatant[];
  /** Items left: id → count. */
  readonly items: Map<string, number>;
  private readonly intents = new Map<string, Intent>();
  /** Forced next intents (after a wind-up). */
  private readonly nextIntent = new Map<string, string>();
  private order: string[] = [];
  private turnIndex = 0;
  private _round = 0;
  private _outcome: string | null = null;
  /** The current actor has earned another action (One More), and hasn't used it yet. */
  private oneMore = false;

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
      return { id: n ? `${defId}-${n + 1}` : defId, def, side, hp: def.hp, sp: def.sp ?? 0, down: false, guarding: false, offBalance: 0, recoverIn: 0, steady: false };
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
    list.push({ type: 'skill', usable: actor.def.moves.length > 0, ...(actor.def.moves.length ? {} : { reason: 'No skills' }) });
    list.push({ type: 'guard', usable: true });
    if (this.items.size) list.push({ type: 'item', usable: true });
    if (this.encounter.run) list.push({ type: 'run', usable: true });
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
   * How `target` can react to `move` in this fight: the game and its windows, eased by the fight's
   * timing (the band widens inwards from its inner edge, never past the lunge). Null if the move can't
   * be reacted to, or the target can't react.
   */
  reactionWindow(move: string, target: string): ReactionWindow | null {
    const m = this.move(move);
    const t = this.get(target);
    if (!m.reaction || !t.def.reactions?.includes('dodge')) return null;
    const { ease, lunge } = this.timing;
    const r = m.reaction;
    const late = r.late ?? 0;
    const band = Math.max(0, (r.dodge ?? 0) - late) * ease;
    return {
      kind: r.kind ?? 'ring',
      dodge: Math.min(lunge, Math.round(late + band)),
      late,
      parry: t.def.reactions.includes('parry') ? Math.min(Math.round(band), Math.round((r.parry ?? 0) * ease)) : 0,
      presses: Math.max(1, Math.round((r.presses ?? 0) / ease)),
      time: r.time ?? 0,
    };
  }

  /**
   * Grades a press `pressedAt` ms before the blow lands (null: no press): a dodge while the ring is in
   * the band, a parry in its innermost part (if you can parry); too early or too late is nothing.
   */
  static grade(pressedAt: number | null, window: ReactionWindow | null): Reaction {
    if (pressedAt === null || !window || window.kind === 'mash') return 'none';
    if (pressedAt > window.dodge || pressedAt < window.late) return 'none';
    if (window.parry > 0 && pressedAt <= window.late + window.parry) return 'parry';
    return 'dodge';
  }

  /** Whether a press is too early (the ring hasn't reached the band yet), so you can try again. */
  static tooEarly(pressedAt: number, window: ReactionWindow): boolean {
    return pressedAt > window.dodge;
  }

  /** A side attack: the press must be the arrow away from where the blow comes from, in the band. */
  static gradeSide(pressedAt: number | null, pressed: SideOf | null, from: SideOf, window: ReactionWindow | null): Reaction {
    if (!pressed || pressed === from) return 'none';
    return Battle.grade(pressedAt, window);
  }

  /** Breaking a hold: enough presses in time is a dodge (half harm). */
  static gradeMash(presses: number, window: ReactionWindow | null): Reaction {
    return window && presses >= window.presses ? 'dodge' : 'none';
  }

  /** The current party member acts. */
  act(action: Action): BattleEvent[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') throw new Error("Combat: not a party member's turn");
    const command = this.commands().find((c) => c.type === action.type);
    if (!command?.usable) throw new Error(`Combat: "${action.type}" can't be used now`);
    actor.guarding = false;
    const events: BattleEvent[] = [];
    const firstFoe = () => this.living('enemy')[0]!.id;
    switch (action.type) {
      case 'attack':
        events.push(...this.strike(actor, this.move(actor.def.basic!), this.get(action.target ?? firstFoe()), []));
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
        events.push(...this.strike(actor, move, target, []));
        break;
      }
      case 'guard':
        actor.guarding = true;
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
      events = this.strike(actor, move, target, Array.isArray(reaction) ? reaction : [reaction]);
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
  private strike(actor: Combatant, move: MoveDef, target: Combatant, reactions: Reaction[]): BattleEvent[] {
    const events: BattleEvent[] = [{ type: 'move', actor: actor.id, move: move.id, target: target.id }];
    if (move.target === 'self' || !move.power) return events;
    const window = this.reactionWindow(move.id, target.id);
    // Was the target about to unleash a wound-up blow? (Before this lands, in case it floors them.)
    const intent = this.intents.get(target.id);
    const breaks = !!move.interrupts && target.side === 'enemy' && !!intent?.charged && !this.hasActed(target.id);
    for (let i = 0; i < (move.hits ?? 1) && target.hp > 0 && actor.hp > 0; i++) {
      const reaction = reactions[i] ?? 'none';
      const r: Reaction = window && (reaction === 'none' || target.def.reactions?.includes(reaction)) ? reaction : 'none';
      if (window) events.push({ type: 'reaction', actor: actor.id, target: target.id, reaction: r });
      if (r === 'parry') {
        // A clean parry: no harm, and a free hit back (the target's basic attack), which can't chain.
        if (target.def.basic) {
          events.push({ type: 'counter', actor: target.id, target: actor.id });
          events.push(...this.harm(target, this.move(target.def.basic), actor, 1, false));
        }
        continue;
      }
      events.push(...this.harm(actor, move, target, r === 'dodge' ? DODGE : 1, true));
    }
    if (breaks && target.hp > 0 && !target.down) {
      // Broken: the big blow is lost, and so is his balance.
      this.intents.delete(target.id);
      events.push({ type: 'interrupt', target: target.id });
      this.unbalance(actor, target, events);
    }
    return events;
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
    if (target.guarding) amount *= GUARD;
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
    if (canKnockDown && (weak || crit) && !target.guarding && scale === 1) this.unbalance(actor, target, events);
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

  private startRound(): BattleEvent[] {
    this._round++;
    const events: BattleEvent[] = [{ type: 'round', round: this._round }];
    this.intents.clear();
    for (const enemy of this.living('enemy')) {
      const forced = this.nextIntent.get(enemy.id);
      this.nextIntent.delete(enemy.id);
      const move = forced ?? pickWeighted(enemy.def.moves, enemy.def.weights, this.rng);
      const party = this.living('party');
      const m = this.move(move);
      const target = m.target === 'self' ? enemy.id : party[Math.floor(this.rng() * party.length)]!.id;
      const intent: Intent = { move, target, ...(forced ? { charged: true } : {}) };
      if (m.reaction?.kind === 'side') intent.side = this.rng() < 0.5 ? 'left' : 'right';
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

function pickWeighted(moves: string[], weights: number[] | undefined, rng: Rng): string {
  const w = moves.map((_, i) => weights?.[i] ?? 1);
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < moves.length; i++) {
    r -= w[i]!;
    if (r < 0) return moves[i]!;
  }
  return moves[moves.length - 1]!;
}
