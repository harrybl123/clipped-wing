// The riot game (Chapter 3; docs/sequences/chapter-3/war-table.md): pure rules, no Phaser. RiotTableScene
// draws and runs them; src/data/warTable.ts holds the boards and the scenarios; RiotPlayers.ts the computer
// players (your father, when he takes over; the balance tests).
//
// Unrest spreads through a district like a disease (Pandemic); everything the rising will do is shown before
// you act (Into the Breach); a few kinds of squad, one place to take, worn-out squads regrouping (Advance
// Wars); force against calm (the chapter). Deterministic: no dice.

export interface RiotPlace {
  id: string;
  name: string;
  x: number;
  y: number;
  /** The way up (the stair to the citadel, the lifts): where the guard arrives. */
  up?: boolean;
  /** The square: barricaded; the rising's heart, and the place to take. */
  heart?: boolean;
}

export interface RiotBoard {
  places: RiotPlace[];
  ways: [string, string][];
}

export type SquadKind = 'pikes' | 'shields' | 'watch';

export const SQUAD_KINDS: Record<SquadKind, { name: string; hp: number; move: number; charge: boolean; storm: number }> = {
  pikes: { name: 'Pikes', hp: 3, move: 1, charge: true, storm: 1 },
  shields: { name: 'Shield wall', hp: 4, move: 1, charge: true, storm: 2 },
  watch: { name: 'City watch', hp: 2, move: 2, charge: false, storm: 0 },
};

export interface RiotRules {
  /** Turns until dawn. */
  dawn: number;
  /** The square's barricades. */
  barricade: number;
  /** How many streets the square spreads into each turn, behind its barricades. */
  heartSpread: number;
  /** Every this many charges, the district's anger puts the barricades up 1. */
  angerBarricade: number;
  /** The power cut: once every so many turns. */
  powerEvery: number;
  /** A squad worn to nothing comes back fresh this many turns later. */
  regroup: number;
  /** More of the guard, every so many turns. */
  reinforceEvery: number;
  reinforceKind: SquadKind;
}

export const RIOT_RULES: RiotRules = {
  dawn: 16, barricade: 16, heartSpread: 2, angerBarricade: 3, powerEvery: 3, regroup: 2, reinforceEvery: 3, reinforceKind: 'pikes',
};

export interface RiotSquad {
  id: string;
  kind: SquadKind;
  place: string;
  hp: number;
}

export interface RiotState {
  turn: number;
  unrest: Record<string, number>;
  squads: RiotSquad[];
  barricade: number;
  anger: number;
  charges: number;
  /** Squads that have acted this turn (the rest are braced). */
  acted: string[];
  stormed: boolean;
  /** The place whose power is cut this turn, and the turn it was last cut. */
  cut: string | null;
  lastCut: number;
  /** Squads regrouping: back on this turn. */
  away: { kind: SquadKind; back: number }[];
  nextId: number;
}

export type RiotAction =
  | { kind: 'move'; squad: string; to: string }
  | { kind: 'quell'; squad: string; at: string }
  | { kind: 'charge'; squad: string; at: string }
  | { kind: 'storm'; squad: string }
  | { kind: 'hold'; squad: string }
  | { kind: 'cut'; at: string };

/** What the rising will do at the end of this turn: a burning place spreading into a street. */
export interface Spread {
  from: string;
  to: string;
}

export class RiotGame {
  readonly board: RiotBoard;
  readonly rules: RiotRules;
  readonly adj = new Map<string, string[]>();
  /** How far each place is from the way up. */
  readonly upDist = new Map<string, number>();
  readonly heart: string;

  constructor(board: RiotBoard, rules: RiotRules = RIOT_RULES) {
    this.board = board;
    this.rules = rules;
    for (const p of board.places) this.adj.set(p.id, []);
    for (const [a, b] of board.ways) {
      this.adj.get(a)!.push(b);
      this.adj.get(b)!.push(a);
    }
    const todo = board.places.filter((p) => p.up).map((p) => p.id);
    for (const id of todo) this.upDist.set(id, 0);
    while (todo.length) {
      const p = todo.shift()!;
      for (const n of this.adj.get(p)!) if (!this.upDist.has(n)) (this.upDist.set(n, this.upDist.get(p)! + 1), todo.push(n));
    }
    this.heart = board.places.find((p) => p.heart)!.id;
  }

  start(unrest: Record<string, number>, squads: { kind: SquadKind; place: string }[]): RiotState {
    const u: Record<string, number> = {};
    for (const p of this.board.places) u[p.id] = unrest[p.id] ?? 0;
    u[this.heart] = 3;
    return {
      turn: 1, unrest: u, barricade: this.rules.barricade, anger: 0, charges: 0, acted: [], stormed: false, cut: null, lastCut: -99, away: [],
      squads: squads.map((s, i) => ({ id: `s${i}`, kind: s.kind, place: s.place, hp: SQUAD_KINDS[s.kind].hp })),
      nextId: squads.length,
    };
  }

  clone(s: RiotState): RiotState {
    return { ...s, unrest: { ...s.unrest }, squads: s.squads.map((q) => ({ ...q })), acted: [...s.acted], away: s.away.map((a) => ({ ...a })) };
  }

  near = (a: string, b: string): boolean => this.adj.get(a)!.includes(b);
  squadAt = (s: RiotState, place: string): RiotSquad | undefined => s.squads.find((q) => q.place === place);
  burning = (s: RiotState): string[] => this.board.places.filter((p) => s.unrest[p.id]! >= 3).map((p) => p.id);
  canCut = (s: RiotState): boolean => s.turn - s.lastCut >= this.rules.powerEvery;
  /** Turns until the power can be cut again (0: now). */
  cutIn = (s: RiotState): number => Math.max(0, this.rules.powerEvery - (s.turn - s.lastCut));

  /** Where a squad can move this turn: through places that aren't burning, not through other squads. */
  reach(s: RiotState, sq: RiotSquad): string[] {
    const out: string[] = [];
    const seen = new Set([sq.place]);
    let frontier = [sq.place];
    for (let step = 0; step < SQUAD_KINDS[sq.kind].move; step++) {
      const next: string[] = [];
      for (const p of frontier) for (const n of this.adj.get(p)!) {
        if (seen.has(n)) continue;
        seen.add(n);
        if (s.unrest[n]! >= 3 || this.squadAt(s, n)) continue;
        out.push(n);
        next.push(n);
      }
      frontier = next;
    }
    return out;
  }

  /** Everything a squad can do now (nothing, if it's already acted). */
  actions(s: RiotState, sq: RiotSquad): RiotAction[] {
    if (s.acted.includes(sq.id)) return [];
    const k = SQUAD_KINDS[sq.kind];
    const out: RiotAction[] = [{ kind: 'hold', squad: sq.id }];
    for (const to of this.reach(s, sq)) out.push({ kind: 'move', squad: sq.id, to });
    if (s.barricade > 0 && k.storm && this.near(sq.place, this.heart)) out.push({ kind: 'storm', squad: sq.id });
    for (const at of [sq.place, ...this.adj.get(sq.place)!]) {
      if (at === this.heart && s.barricade > 0) continue;
      if (s.unrest[at]! <= 0) continue;
      out.push({ kind: 'quell', squad: sq.id, at });
      if (at !== sq.place && k.charge) out.push({ kind: 'charge', squad: sq.id, at });
    }
    return out;
  }

  /** Whether the action can be taken now. */
  legal(s: RiotState, a: RiotAction): boolean {
    if (a.kind === 'cut') return this.canCut(s) && !s.cut;
    const sq = s.squads.find((q) => q.id === a.squad);
    if (!sq) return false;
    return this.actions(s, sq).some((b) => JSON.stringify(b) === JSON.stringify(a));
  }

  /** One action, carried out now (on a copy). Illegal actions do nothing. */
  act(s0: RiotState, a: RiotAction): RiotState {
    if (!this.legal(s0, a)) return s0;
    const s = this.clone(s0);
    if (a.kind === 'cut') {
      s.cut = a.at;
      s.lastCut = s.turn;
      return s;
    }
    const sq = s.squads.find((q) => q.id === a.squad)!;
    s.acted.push(sq.id);
    if (a.kind === 'move') sq.place = a.to;
    else if (a.kind === 'quell') s.unrest[a.at] = Math.max(0, s.unrest[a.at]! - 1);
    else if (a.kind === 'charge') {
      const before = s.unrest[a.at]!;
      s.unrest[a.at] = Math.max(0, before - 2);
      // The crowd scatters into the streets round it that nobody's holding.
      if (before >= 2) for (const n of this.adj.get(a.at)!) if (n !== sq.place && !this.squadAt(s, n)) s.unrest[n] = Math.min(3, s.unrest[n]! + 1);
      if (before >= 3) sq.hp -= 1;
      // The district's anger: the barricades go up.
      s.charges++;
      s.anger++;
      if (s.anger % this.rules.angerBarricade === 0 && s.barricade > 0) s.barricade++;
    } else if (a.kind === 'storm') {
      s.stormed = true;
      s.barricade = Math.max(0, s.barricade - SQUAD_KINDS[sq.kind].storm);
      sq.hp -= 1;
      // Down: the square's crowd breaks; it can be taken.
      if (s.barricade === 0) s.unrest[this.heart] = 2;
    }
    this.withdraw(s);
    return s;
  }

  /** What the rising will do at the end of this turn (fixed at the start of it, and shown). */
  spreads(s: RiotState): Spread[] {
    const out: Spread[] = [];
    for (const p of this.board.places) {
      if (s.unrest[p.id]! < 3) continue;
      const options = this.adj.get(p.id)!.map((n) => {
        const sq = this.squadAt(s, n);
        const score = -(this.upDist.get(n) ?? 9) * 3 + (sq ? -2 - sq.hp : 2) + (s.unrest[n]! < 3 ? s.unrest[n]! : -10) + (this.board.places.find((q) => q.id === n)!.up ? 4 : 0);
        return { n, score };
      }).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
      const n = p.id === this.heart && s.barricade > 0 ? this.rules.heartSpread : 1;
      for (const o of options.slice(0, n)) out.push({ from: p.id, to: o.n });
    }
    return out;
  }

  /** Places that will catch fire at the end of this turn, as things stand: at 2, next to a fire, nobody in them, power on. */
  catching(s: RiotState): string[] {
    return this.board.places.filter((p) => p.id !== s.cut && s.unrest[p.id] === 2 && !this.squadAt(s, p.id) && this.adj.get(p.id)!.some((n) => s.unrest[n]! >= 3)).map((p) => p.id);
  }

  /** The rising's turn: the spreads shown at the start carried out, and everything after; then the next turn. */
  endTurn(s0: RiotState, spreads: Spread[]): RiotState {
    const s = this.clone(s0);
    const braced = new Set(s.squads.filter((q) => !s.acted.includes(q.id)).map((q) => q.id));
    const catching = this.catching(s);
    const boiled = new Set<string>();
    const push = (to: string, depth: number) => {
      const sq = this.squadAt(s, to);
      if (sq) {
        if (!braced.has(sq.id)) sq.hp -= 1;
        return;
      }
      if (s.unrest[to]! >= 3) {
        if (boiled.has(to) || depth > 3) return;
        boiled.add(to);
        for (const n of this.adj.get(to)!) push(n, depth + 1);
        return;
      }
      s.unrest[to] = s.unrest[to]! + 1;
    };
    for (const sp of spreads) if (s.unrest[sp.from]! >= 3 && sp.from !== s.cut) push(sp.to, 0);
    for (const p of catching) if (!this.squadAt(s, p)) s.unrest[p] = Math.max(s.unrest[p]!, 3);
    if (s.barricade > 0) {
      s.unrest[this.heart] = 3;
      if (!s.stormed) s.barricade = Math.min(this.rules.barricade, s.barricade + 1);
    }
    for (const q of s.squads) if (s.unrest[q.place]! >= 3 && !braced.has(q.id)) q.hp -= 1;
    this.withdraw(s);
    const free = () => this.board.places.filter((p) => p.up).map((p) => p.id).find((p) => s.unrest[p]! < 2 && !this.squadAt(s, p));
    for (const a of s.away) {
      if (a.back > s.turn) continue;
      const at = free();
      if (!at) continue;
      s.squads.push({ id: `s${s.nextId++}`, kind: a.kind, place: at, hp: SQUAD_KINDS[a.kind].hp });
      a.back = -1;
    }
    s.away = s.away.filter((a) => a.back !== -1);
    if (s.turn % this.rules.reinforceEvery === 0) {
      const at = free();
      if (at) s.squads.push({ id: `s${s.nextId++}`, kind: this.rules.reinforceKind, place: at, hp: SQUAD_KINDS[this.rules.reinforceKind].hp });
    }
    s.turn++;
    s.acted = [];
    s.stormed = false;
    s.cut = null;
    return s;
  }

  /** Squads worn to nothing withdraw, to come back fresh. */
  private withdraw(s: RiotState): void {
    for (const q of s.squads) if (q.hp <= 0) s.away.push({ kind: q.kind, back: s.turn + this.rules.regroup });
    s.squads = s.squads.filter((q) => q.hp > 0);
  }

  /** Won: the barricades down and a squad in the square. Lost: dawn, and it's still theirs. */
  outcome(s: RiotState): 'won' | 'lost' | null {
    if (s.barricade <= 0 && this.squadAt(s, this.heart)) return 'won';
    if (s.turn > this.rules.dawn) return 'lost';
    return null;
  }
}
