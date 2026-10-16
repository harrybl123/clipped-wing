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
//   it don't happen), but it can't move, and it gets no +1 or +2 that turn (the square's growth, the guard at
//   the lifts). (You survive a round while help comes round behind.) Like the power cut, once every 3 turns.
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
  /**
   * Your orders happen in the order you give them (designer): a squad can join another, and then the two go
   * on together. Otherwise (the rising's, always) they happen all at once.
   */
  ordered: boolean;
  /** Rumbles (Jack): the chance one appears each turn when there's none, how many turns it stays, and the most a dice can take (from 1). None if absent. */
  rumble?: { chance: number; lasts: number; max: number };
  /**
   * The duel (Day 6; designer): the rising (you, holding the keep) win by taking the guard's base (the lifts'
   * place: his siege camp) before dawn; dawn first, and the guard have won.
   */
  siege?: boolean;
}

export const RIOT_RULES: RiotRules = { dawn: 18, reinforce: 3, reinforceEvery: 1, powerEvery: 3, fortifyEvery: 3, ordered: true };

/** Rumbles in the riot (Jack): a one-in-three chance each turn there's none, two turns to get to it, 1 to 3 to each squad round it. */
export const RUMBLE: NonNullable<RiotRules['rumble']> = { chance: 1 / 3, lasts: 2, max: 3 };

export interface RiotSquad {
  id: string;
  side: Side;
  place: string;
  strength: number;
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
  fortifyBefore: Record<Side, number>;
  /** A rumble on the map: where, and for how many more turns. */
  rumble: { place: string; left: number } | null;
  /** The dice (a seeded sequence, so a game can be played again exactly, and tested). */
  seed: number;
}

/** An order: a squad to a place next to it. */
export interface Order {
  squad: string;
  to: string;
}

export type RiotEvent =
  | { type: 'move'; squad: string; side: Side; from: string; to: string }
  | { type: 'join'; squad: string; into: string; at: string }
  | { type: 'fight'; at: string; side: Side; won: boolean; attack: number; defence: number }
  | { type: 'grow'; at: string }
  | { type: 'pour'; from: string; to: string }
  | { type: 'arrive'; at: string }
  /** An attack on a fortified squad: it doesn't happen. */
  | { type: 'blocked'; at: string; side: Side }
  /** A rumble set off at a place: each squad next to it, and what it took. */
  | { type: 'rumble'; at: string; side: Side; hits: { place: string; side: Side; damage: number; gone: boolean }[] }
  | { type: 'rumbleAppears'; at: string };

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
export const RISING_STYLE: RisingStyle = { flee: 0, hunt: true, sally: false, merge: false, wear: 2, pour: 2, pourAbove: 9 };

export class RiotGame {
  style: RisingStyle = RISING_STYLE;
  readonly board: RiotBoard;
  readonly rules: RiotRules;
  readonly adj = new Map<string, string[]>();
  readonly heart: string;
  readonly lifts: string;
  /** How far each place is from the way up. */
  readonly upDist = new Map<string, number>();

  constructor(board: RiotBoard, rules: RiotRules = RIOT_RULES) {
    this.board = board;
    this.rules = rules;
    for (const p of board.places) this.adj.set(p.id, []);
    for (const [a, b] of board.ways) {
      this.adj.get(a)!.push(b);
      this.adj.get(b)!.push(a);
    }
    this.heart = board.places.find((p) => p.heart)!.id;
    this.lifts = board.places.find((p) => p.lifts)!.id;
    const todo = board.places.filter((p) => p.up).map((p) => p.id);
    for (const id of todo) this.upDist.set(id, 0);
    while (todo.length) {
      const p = todo.shift()!;
      for (const n of this.adj.get(p)!) if (!this.upDist.has(n)) (this.upDist.set(n, this.upDist.get(p)! + 1), todo.push(n));
    }
  }

  /** A game set up. `seed` starts the dice (a new one each time it's played; fixed in tests). */
  start(squads: { side: Side; place: string; strength: number }[], seed = 1): RiotState {
    const owner: Record<string, Side> = {};
    for (const s of squads) owner[s.place] = s.side;
    return { turn: 1, squads: squads.map((s, i) => ({ id: `q${i}`, ...s })), owner, cut: null, lastCut: -99, nextId: squads.length, fortified: [], lastFortify: { guard: -99, rising: -99 }, fortifyBefore: { guard: -99, rising: -99 }, rumble: null, seed };
  }

  clone(s: RiotState): RiotState {
    return { ...s, squads: s.squads.map((q) => ({ ...q })), owner: { ...s.owner }, fortified: [...s.fortified], lastFortify: { ...s.lastFortify }, fortifyBefore: { ...s.fortifyBefore }, rumble: s.rumble && { ...s.rumble } };
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
  canFortify = (s: RiotState, side: Side): boolean => s.turn - s.lastFortify[side] >= this.rules.fortifyEvery;
  /** Turns until a side can fortify again (0: now). */
  fortifyIn = (s: RiotState, side: Side): number => Math.max(0, this.rules.fortifyEvery - (s.turn - s.lastFortify[side]));

  /** Fortify (Jack): the squad digs in where it is for this turn (if its side can). */
  fortify(s0: RiotState, squad: string): RiotState {
    const q = s0.squads.find((x) => x.id === squad);
    if (!q || this.fortified(s0, q.place) || !this.canFortify(s0, q.side)) return s0;
    const s = this.clone(s0);
    s.fortified.push(q.place);
    s.fortifyBefore[q.side] = s.lastFortify[q.side];
    s.lastFortify[q.side] = s.turn;
    return s;
  }

  /** No longer dug in (taken back, or given an order after all): this turn, it gives the side its fortify back. */
  unfortify(s0: RiotState, place: string): RiotState {
    if (!this.fortified(s0, place)) return s0;
    const s = this.clone(s0);
    s.fortified = s.fortified.filter((p) => p !== place);
    const side = this.squadAt(s, place)?.side;
    if (side && s.lastFortify[side] === s.turn) s.lastFortify[side] = s.fortifyBefore[side];
    return s;
  }

  place = (id: string): RiotPlace => this.board.places.find((p) => p.id === id)!;
  near = (a: string, b: string): boolean => this.adj.get(a)!.includes(b);
  squadAt = (s: RiotState, place: string): RiotSquad | undefined => s.squads.find((q) => q.place === place);
  mine = (s: RiotState, side: Side): RiotSquad[] => s.squads.filter((q) => q.side === side);
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
    return Math.max(0, strength + (place === this.heart ? 1 : 0) - (s.cut === place ? 1 : 0));
  }

  /** Where a squad can go this turn: the streets next to it (nowhere, with its power cut). */
  dests(s: RiotState, q: RiotSquad): string[] {
    return s.cut === q.place ? [] : this.adj.get(q.place)!;
  }

  /** The power cut, under a place, for this turn. */
  cutPower(s0: RiotState, at: string): RiotState {
    if (!this.canCut(s0)) return s0;
    const s = this.clone(s0);
    s.cut = at;
    s.lastCut = s.turn;
    return s;
  }

  /** One order carried out (orders that can't happen now do nothing). */
  order(s0: RiotState, o: Order): { state: RiotState; events: RiotEvent[] } {
    const s = this.clone(s0);
    const q = s.squads.find((x) => x.id === o.squad);
    // (A fortified squad stays put.)
    if (!q || o.to === q.place || !this.dests(s, q).includes(o.to) || this.fortified(s, q.place)) return { state: s, events: [] };
    const from = q.place;
    const events: RiotEvent[] = [];
    const there = this.squadAt(s, o.to);
    if (!there) {
      q.place = o.to;
      s.owner[o.to] = q.side;
      events.push({ type: 'move', squad: q.id, side: q.side, from, to: o.to });
    } else if (there.side === q.side) {
      there.strength += q.strength;
      s.squads = s.squads.filter((x) => x !== q);
      events.push({ type: 'move', squad: q.id, side: q.side, from, to: o.to }, { type: 'join', squad: q.id, into: there.id, at: o.to });
    } else if (this.fortified(s, o.to)) {
      // Dug in: the attack doesn't happen, and they stay where they are.
      events.push({ type: 'blocked', at: o.to, side: q.side });
    } else {
      const attack = this.attack(from, o.to, q.strength);
      const defence = this.defence(s, o.to, there.strength);
      // The square: match its number and you've taken it (Jack: 9 on its 8 bounced off the barricades, which was
      // confusing); the barricades still cost one more, but you keep at least 1. Elsewhere a tie holds, as ever
      // (tried everywhere, it broke "Now." and made the rising's ties win too: docs/sequences/chapter-3/war-table.md).
      const won = attack > defence || (o.to === this.heart && attack >= there.strength);
      events.push({ type: 'fight', at: o.to, side: q.side, won, attack, defence });
      if (won) {
        s.squads = s.squads.filter((x) => x !== there);
        q.place = o.to;
        q.strength = Math.max(1, attack - defence);
        s.owner[o.to] = q.side;
      } else {
        // Beaten off: the attackers are lost, and the defenders lose as many (they keep at least 1).
        s.squads = s.squads.filter((x) => x !== q);
        there.strength = Math.max(1, there.strength - attack);
      }
    }
    // Onto a rumble: it goes off.
    if (s.rumble && q.place === s.rumble.place && s.squads.includes(q)) this.setOff(s, q.place, q.side, events);
    return { state: s, events };
  }

  /** A rumble set off (on `s`, already a clone): every squad next to it, not dug in, takes a dice of 1 to the most. */
  private setOff(s: RiotState, at: string, side: Side, events: RiotEvent[]): void {
    const hits: Extract<RiotEvent, { type: 'rumble' }>['hits'] = [];
    for (const n of this.adj.get(at)!) {
      const there = this.squadAt(s, n);
      if (!there || this.fortified(s, n)) continue;
      const damage = 1 + Math.floor(this.roll(s) * (this.rules.rumble?.max ?? 3));
      there.strength -= damage;
      const gone = there.strength <= 0;
      if (gone) s.squads = s.squads.filter((x) => x !== there);
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
    const orders: Order[] = [];
    const claimed = new Set<string>();
    const yours = this.mine(s, 'guard');
    const sq = this.squadAt(s, this.heart);
    // You're coming for the square: a squad of yours next to it, or a step away, big enough to match it soon.
    const threat = sq?.side === 'rising' && yours.some((y) => {
      const d = this.near(y.place, this.heart) ? 1 : this.adj.get(y.place)!.some((n) => this.near(n, this.heart)) ? 2 : 9;
      return d <= 2 && y.strength + 2 >= this.defence(s, this.heart, sq.strength) + d;
    });
    const couldBeat = (place: string, strength: number) => yours.some((y) => this.near(place, y.place) && this.attack(place, y.place, strength) > this.defence(s, y.place, y.strength));
    const st = this.style;
    // The square, out at a squad of the guard next to it, if it beats it and nothing else of theirs could walk in behind.
    if (st.sally && sq?.side === 'rising' && s.cut !== this.heart) {
      const near = yours.filter((y) => this.near(y.place, this.heart));
      const target = near.length === 1 ? near[0]! : undefined;
      if (target && this.attack(this.heart, target.place, sq.strength) > this.defence(s, target.place, target.strength)) {
        orders.push({ squad: sq.id, to: target.place });
        claimed.add(target.place);
      }
    }
    // The square left empty: back into it, first.
    const emptySquare = !sq && s.owner[this.heart] === 'rising';
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
    const crowds = this.mine(s, 'rising').filter((q) => q.place !== this.heart && s.cut !== q.place).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
    for (const q of crowds) {
      let best: { to: string; score: number } | null = null;
      for (const to of this.adj.get(q.place)!) {
        if (claimed.has(to) && to !== this.heart) continue;
        const there = this.squadAt(s, to);
        let score: number;
        if (to === this.heart) {
          if (emptySquare && !there) score = 90;
          else if (there?.side !== 'rising' || !threat) continue;
          else score = 30;
        } else if (there?.side === 'guard') {
          if (this.attack(q.place, to, q.strength) > this.defence(s, to, there.strength)) score = 40 + there.strength * 2 + (to === this.lifts ? 15 : 0);
          // Throwing themselves at it: they'll lose, but it'll cost the guard.
          else if (st.wear && q.strength >= st.wear) score = 25 - there.strength + (to === this.lifts ? 10 : 0);
          else continue;
        } else if (there) {
          // Together, they could take one of yours next turn (or, gathering, just to be bigger).
          if (couldBeat(q.place, q.strength)) continue;
          if (couldBeat(to, there.strength + q.strength)) score = 18;
          else if (st.merge) score = 8;
          else continue;
        } else if (s.rumble?.place === to) {
          // A rumble: set it off, if it'll hurt the guard round it more than their own.
          const round = (side: Side) => this.adj.get(to)!.reduce((n, p) => {
            const x = this.squadAt(s, p);
            return n + (x && x !== q && x.side === side && !this.fortified(s, p) ? 1 : 0);
          }, 0);
          if (round('guard') <= round('rising')) continue;
          score = 45 + (round('guard') - round('rising')) * 5;
        } else {
          const guardNear = (p: string) => yours.some((y) => y.place === p);
          const crowdNear = (p: string) => this.mine(s, 'rising').some((c) => c !== q && c.place === p && p !== this.heart);
          const toward = st.hunt && yours.length ? distTo(q.place, guardNear) - distTo(to, guardNear) : (this.upDist.get(q.place) ?? 9) - (this.upDist.get(to) ?? 9);
          score = 6 + toward * 5 + (s.owner[to] !== 'rising' ? 4 : 0);
          if (st.merge) score += (distTo(q.place, crowdNear) - distTo(to, crowdNear)) * 3;
          if (yours.some((y) => this.near(y.place, to) && this.attack(y.place, to, y.strength) > q.strength)) score -= st.flee;
        }
        if (score > 0 && (!best || score > best.score)) best = { to, score };
      }
      if (best) {
        orders.push({ squad: q.id, to: best.to });
        claimed.add(best.to);
      }
    }
    return orders;
  }

  /** Where the square will pour a crowd out at the end of this turn (towards the guard), if it does. */
  pourTo(s: RiotState): string | null {
    const h = this.squadAt(s, this.heart);
    if (!this.style.pour || h?.side !== 'rising' || s.cut === this.heart || h.strength + 1 <= this.style.pourAbove) return null;
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
    return this.adj.get(this.heart)!.filter((p) => !this.squadAt(s, p)).sort((a, b) => dist(a) - dist(b) || a.localeCompare(b))[0] ?? null;
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
  turn(s0: RiotState, yours: Order[], theirs: Order[]): { state: RiotState; events: RiotEvent[] } {
    let s = s0;
    const events: RiotEvent[] = [];
    for (const o of [...(this.rules.ordered ? yours.filter((o, i) => yours.findIndex((x) => x.squad === o.squad) === i) : this.together(s0, yours)), ...this.together(s0, theirs)]) {
      const r = this.order(s, o);
      s = r.state;
      events.push(...r.events);
      if (this.outcome(s)) return { state: s, events };
    }
    s = this.clone(s);
    // People keep joining the square.
    const h = this.squadAt(s, this.heart);
    if (h?.side === 'rising' && s.cut !== this.heart && !this.fortified(s, this.heart)) {
      h.strength += 1;
      events.push({ type: 'grow', at: this.heart });
      // And it pours a crowd out at the guard.
      const to = this.pourTo(s);
      if (to) {
        h.strength -= this.style.pour;
        s.squads.push({ id: `q${s.nextId++}`, side: 'rising', place: to, strength: this.style.pour });
        s.owner[to] = 'rising';
        events.push({ type: 'pour', from: this.heart, to });
      }
    }
    // More of the guard, if the lifts' foot is yours (and not dug in: Jack).
    if (s.turn % this.rules.reinforceEvery === 0 && !this.fortified(s, this.lifts)) {
      const there = this.squadAt(s, this.lifts);
      if (there?.side === 'guard') there.strength += this.rules.reinforce;
      else if (!there && s.owner[this.lifts] !== 'rising') s.squads.push({ id: `q${s.nextId++}`, side: 'guard', place: this.lifts, strength: this.rules.reinforce });
      if (there?.side === 'guard' || (!there && s.owner[this.lifts] !== 'rising')) events.push({ type: 'arrive', at: this.lifts });
    }
    // A rumble: one there stays a turn less; with none, now and then one appears on an empty street.
    const rumble = this.rules.rumble;
    if (s.rumble) {
      s.rumble.left -= 1;
      if (s.rumble.left <= 0) s.rumble = null;
    } else if (rumble && this.roll(s) < rumble.chance) {
      // Where it matters (Jack: never caught one): an empty street next to both sides if there is one, so it's
      // a race; else next to anyone; else anywhere empty.
      const empty = this.board.places.filter((p) => !p.heart && !p.lifts && !this.squadAt(s, p.id));
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
    s.turn++;
    s.cut = null;
    s.fortified = [];
    return { state: s, events };
  }

  /**
   * Who's won: the guard, when the square's theirs; the rising, if dawn comes and it's still theirs. In a siege
   * (the duel), the rising win by taking the guard's base, and dawn's the guard's.
   */
  outcome(s: RiotState): Side | null {
    if (this.squadAt(s, this.heart)?.side === 'guard') return 'guard';
    if (this.rules.siege && this.squadAt(s, this.lifts)?.side === 'rising') return 'rising';
    if (s.turn > this.rules.dawn) return this.rules.siege ? 'guard' : 'rising';
    return null;
  }
}
