// Turn-based combat (docs/combat-design.md). Pure logic, no Phaser: the scene asks whose turn it is,
// shows each enemy's intent, plays the timed reaction window itself, and passes the result in here.
//
// A round: every enemy picks an intent (shown to the player), then everyone acts in order of speed
// (party first on a tie). A party member chooses a move; an enemy does what its intent said. When an
// enemy's attack lands on someone, the scene runs a short window and reports a Reaction: none, dodge
// (no harm) or parry (no harm, and the attacker is staggered: a counter). When everyone has acted the
// round ends, and new intents are picked. The fight is over when one side is all down, or a move ends
// it (holding back).

/** What a move does. Numbers are small on purpose: a scrap is over in a few rounds. */
export interface MoveDef {
  id: string;
  /** Shown in the menu and the intent. */
  name: string;
  /** One line on what it does, shown in the menu. */
  description: string;
  target: 'enemy' | 'self';
  /** Harm to the target. */
  damage?: number;
  /** Extra harm while the target is exposed or staggered. */
  exposedBonus?: number;
  /** Only usable while the target is exposed or staggered (a grab needs an opening). */
  needsOpening?: boolean;
  /** An attack the target can dodge or parry, with the windows (ms) for each. */
  reaction?: { dodge: number; parry: number };
  /** Staggers the target if it lands while the target's intent is a wind-up (a shove breaks a wind-up). */
  interrupts?: boolean;
  /** Staggers the target if it lands. */
  staggers?: boolean;
  /** Leaves the user exposed until their next turn (a jeer, a wild swing). */
  exposesSelf?: boolean;
  /** Puts the user on guard until their next turn: reaction windows are wider by this factor. */
  guard?: number;
  /** An enemy's wind-up: its next intent is this move, whatever the AI would pick. */
  windsUp?: string;
  /** Ends the fight at once with this outcome (holding back). */
  ends?: string;
}

export interface CombatantDef {
  id: string;
  name: string;
  /** How the scene draws them (a key the scene maps to a sprite). */
  sprite: string;
  hp: number;
  /** Higher acts first. */
  speed: number;
  /** Party members: the moves they can choose from. Enemies: what their AI picks from, with weights. */
  moves: string[];
  weights?: number[];
  /** Reactions this combatant can make when attacked (party members). */
  reactions?: ('dodge' | 'parry')[];
}

export interface EncounterDef {
  id: string;
  party: string[];
  enemies: string[];
  /**
   * What each outcome writes to ink (the only store of story state). `won`, `lost`, plus any move's
   * `ends` id. The scene writes these through the StoryBridge when the fight ends.
   */
  outcomes: Record<string, Record<string, string | number | boolean>>;
}

export type Side = 'party' | 'enemy';
export type Reaction = 'none' | 'dodge' | 'parry';

export interface Combatant {
  /** Unique in the fight (`<def id>` or `<def id>-2` for a second of the same). */
  id: string;
  def: CombatantDef;
  side: Side;
  hp: number;
  /** Open to a grab until they next act. */
  exposed: boolean;
  /** Loses their next turn, and is exposed until the turn after (when they act again). */
  staggered: boolean;
  /** Reaction windows are wider by this factor until their next turn. */
  guard: number;
}

export interface Intent {
  move: string;
  target: string;
}

/** What happened, in order, for the scene to animate and describe. */
export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'intent'; actor: string; move: string; target: string }
  | { type: 'move'; actor: string; move: string; target: string }
  | { type: 'reaction'; actor: string; target: string; reaction: Reaction }
  | { type: 'damage'; target: string; amount: number; hp: number }
  | { type: 'interrupt'; target: string }
  | { type: 'stagger'; target: string }
  | { type: 'expose'; target: string }
  | { type: 'guard'; target: string }
  | { type: 'recover'; target: string }
  | { type: 'down'; target: string }
  | { type: 'end'; outcome: string };

export interface MoveChoice {
  move: MoveDef;
  usable: boolean;
  /** Why not, when it isn't usable. */
  reason?: string;
}

export type Rng = () => number;

export class Battle {
  readonly combatants: Combatant[];
  private readonly intents = new Map<string, Intent>();
  private order: string[] = [];
  private turnIndex = 0;
  private _round = 0;
  private _outcome: string | null = null;

  /** Events from starting the fight (the first round and intents). */
  readonly opening: BattleEvent[];

  constructor(
    readonly encounter: EncounterDef,
    private readonly moves: Record<string, MoveDef>,
    combatants: Record<string, CombatantDef>,
    private readonly rng: Rng = Math.random,
  ) {
    const make = (side: Side) => (defId: string, i: number, all: string[]): Combatant => {
      const def = combatants[defId];
      if (!def) throw new Error(`Combat: no combatant called "${defId}"`);
      for (const m of def.moves) if (!moves[m]) throw new Error(`Combat: ${defId} has unknown move "${m}"`);
      const n = all.slice(0, i).filter((d) => d === defId).length;
      return { id: n ? `${defId}-${n + 1}` : defId, def, side, hp: def.hp, exposed: false, staggered: false, guard: 1 };
    };
    this.combatants = [...encounter.party.map(make('party')), ...encounter.enemies.map(make('enemy'))];
    if (!this.combatants.some((c) => c.side === 'party') || !this.combatants.some((c) => c.side === 'enemy')) {
      throw new Error(`Combat: encounter "${encounter.id}" needs at least one on each side`);
    }
    this.opening = this.startRound();
  }

  get round(): number {
    return this._round;
  }

  /** null while the fight goes on; then `won`, `lost`, or a move's `ends` id. */
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

  living(side: Side): Combatant[] {
    return this.combatants.filter((c) => c.side === side && c.hp > 0);
  }

  /** What an enemy is about to do this round. */
  intentOf(id: string): Intent | undefined {
    return this.intents.get(id);
  }

  /** The moves the current party member can choose, and whether each can be used on `target`. */
  choices(target?: string): MoveChoice[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') return [];
    const foe = target ? this.get(target) : this.living('enemy')[0];
    return actor.def.moves.map((id) => {
      const move = this.move(id);
      if (move.needsOpening && move.target === 'enemy' && foe && !(foe.exposed || foe.staggered)) {
        return { move, usable: false, reason: 'No opening' };
      }
      return { move, usable: true };
    });
  }

  /**
   * The reaction windows (ms) for an attack on `target` with `move`, widened by the target's guard. Null
   * if the move can't be reacted to, or the target can't react.
   */
  reactionWindow(move: string, target: string): { dodge: number; parry: number } | null {
    const m = this.move(move);
    const t = this.get(target);
    if (!m.reaction || !t.def.reactions?.length) return null;
    return {
      dodge: t.def.reactions.includes('dodge') ? Math.round(m.reaction.dodge * t.guard) : 0,
      parry: t.def.reactions.includes('parry') ? Math.round(m.reaction.parry * t.guard) : 0,
    };
  }

  /** Grades a press `pressedAt` ms before the hit lands (null: no press) against the windows. Pure, for the scene. */
  static grade(pressedAt: number | null, window: { dodge: number; parry: number } | null): Reaction {
    if (pressedAt === null || !window || pressedAt < 0) return 'none';
    if (window.parry > 0 && pressedAt <= window.parry) return 'parry';
    if (window.dodge > 0 && pressedAt <= window.dodge) return 'dodge';
    return 'none';
  }

  /** The current party member uses a move. */
  choose(moveId: string, targetId?: string): BattleEvent[] {
    const actor = this.current;
    if (!actor || actor.side !== 'party') throw new Error('Combat: not a party member\'s turn');
    if (!actor.def.moves.includes(moveId)) throw new Error(`Combat: ${actor.id} can't use "${moveId}"`);
    const move = this.move(moveId);
    const target = move.target === 'self' ? actor.id : (targetId ?? this.living('enemy')[0]!.id);
    const choice = this.choices(target).find((c) => c.move.id === moveId)!;
    if (!choice.usable) throw new Error(`Combat: "${moveId}" can't be used now (${choice.reason})`);
    return this.perform(actor, move, this.get(target), 'none');
  }

  /**
   * The current enemy does what its intent said. `reaction` is how the target reacted, from the
   * scene's timed window (ignored if the move can't be reacted to).
   */
  enemyTurn(reaction: Reaction = 'none'): BattleEvent[] {
    const actor = this.current;
    if (!actor || actor.side !== 'enemy') throw new Error('Combat: not an enemy\'s turn');
    if (actor.staggered) {
      actor.staggered = false;
      return [{ type: 'recover', target: actor.id }, ...this.nextTurn()];
    }
    const intent = this.intents.get(actor.id)!;
    let target = this.get(intent.target);
    // If the one it meant to hit is down, it turns on someone else.
    if (target.hp <= 0) target = this.living('party')[0]!;
    return this.perform(actor, this.move(intent.move), target, reaction);
  }

  private perform(actor: Combatant, move: MoveDef, target: Combatant, reaction: Reaction): BattleEvent[] {
    // Your turn comes round: openings and guard from last time are gone.
    actor.exposed = false;
    actor.guard = 1;
    const events: BattleEvent[] = [{ type: 'move', actor: actor.id, move: move.id, target: target.id }];
    if (move.ends) {
      this._outcome = move.ends;
      events.push({ type: 'end', outcome: move.ends });
      return events;
    }
    if (move.guard) {
      actor.guard = move.guard;
      events.push({ type: 'guard', target: actor.id });
    }
    if (move.target === 'enemy') {
      const window = this.reactionWindow(move.id, target.id);
      const r: Reaction = window ? reaction : 'none';
      const allowed = r === 'none' || target.def.reactions?.includes(r);
      const landed = r === 'none' || !allowed;
      if (move.reaction && window) events.push({ type: 'reaction', actor: actor.id, target: target.id, reaction: allowed ? r : 'none' });
      if (landed) {
        const open = target.exposed || target.staggered;
        const amount = (move.damage ?? 0) + (open ? (move.exposedBonus ?? 0) : 0);
        if (amount > 0) {
          target.hp = Math.max(0, target.hp - amount);
          events.push({ type: 'damage', target: target.id, amount, hp: target.hp });
        }
        const intent = this.intents.get(target.id);
        const windingUp = target.side === 'enemy' && intent && this.move(intent.move).windsUp && !this.hasActed(target.id);
        if (target.hp > 0 && move.interrupts && windingUp) {
          this.intents.delete(target.id);
          events.push({ type: 'interrupt', target: target.id });
          this.stagger(target, events);
        } else if (target.hp > 0 && move.staggers) this.stagger(target, events);
        if (target.hp === 0) events.push({ type: 'down', target: target.id });
      } else if (r === 'parry') {
        // A good parry: the attacker is thrown off, open to a counter.
        this.stagger(actor, events);
      }
    }
    if (move.exposesSelf) {
      actor.exposed = true;
      events.push({ type: 'expose', target: actor.id });
    }
    if (move.windsUp) this.nextIntent.set(actor.id, move.windsUp);
    events.push(...this.checkEnd());
    if (this._outcome) return events;
    return [...events, ...this.nextTurn()];
  }

  private stagger(c: Combatant, events: BattleEvent[]): void {
    c.staggered = true;
    c.exposed = true;
    events.push({ type: 'stagger', target: c.id });
  }

  private hasActed(id: string): boolean {
    return this.order.indexOf(id) < this.turnIndex;
  }

  private checkEnd(): BattleEvent[] {
    if (this._outcome) return [];
    if (!this.living('enemy').length) this._outcome = 'won';
    else if (!this.living('party').length) this._outcome = 'lost';
    return this._outcome ? [{ type: 'end', outcome: this._outcome }] : [];
  }

  /** On to the next one standing; a new round when everyone has gone. */
  private nextTurn(): BattleEvent[] {
    do this.turnIndex++;
    while (this.turnIndex < this.order.length && this.get(this.order[this.turnIndex]!).hp <= 0);
    if (this.turnIndex >= this.order.length) return this.startRound();
    // A staggered party member loses their turn too.
    const c = this.current!;
    if (c.side === 'party' && c.staggered) {
      c.staggered = false;
      return [{ type: 'recover', target: c.id }, ...this.nextTurn()];
    }
    return [];
  }

  /** Forced next intents (after a wind-up). */
  private readonly nextIntent = new Map<string, string>();

  private startRound(): BattleEvent[] {
    this._round++;
    const events: BattleEvent[] = [{ type: 'round', round: this._round }];
    this.intents.clear();
    for (const enemy of this.living('enemy')) {
      const forced = this.nextIntent.get(enemy.id);
      this.nextIntent.delete(enemy.id);
      // A staggered enemy has no intent: it spends its turn getting its feet back.
      if (enemy.staggered) continue;
      const move = forced ?? pickWeighted(enemy.def.moves, enemy.def.weights, this.rng);
      const party = this.living('party');
      const target = this.move(move).target === 'self' ? enemy.id : party[Math.floor(this.rng() * party.length)]!.id;
      this.intents.set(enemy.id, { move, target });
      events.push({ type: 'intent', actor: enemy.id, move, target });
    }
    const living = this.combatants.filter((c) => c.hp > 0);
    this.order = [...living].sort((a, b) => b.def.speed - a.def.speed || (a.side === b.side ? 0 : a.side === 'party' ? -1 : 1)).map((c) => c.id);
    this.turnIndex = 0;
    const first = this.current!;
    if (first.side === 'party' && first.staggered) {
      first.staggered = false;
      events.push({ type: 'recover', target: first.id }, ...this.nextTurn());
    }
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
