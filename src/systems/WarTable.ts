// The war table (Chapter 3; docs/sequences/chapter-3/plan.md, "The war table"). Pure rules, no Phaser:
// WarTableScene draws and runs them, and src/data/warTable.ts holds the boards and scenarios.
//
// The capital is the board (designer): its places are the squares, and the halls, stairs, streets and lifts
// between them are the ways a squad can move. Turn-based: each side gives every one of its squads an order
// (move along one way, or hold), then they go. Squads are points of light with a strength (how many).
//
//   Moving into an empty place takes it. Moving into your own squad joins it (their strengths add up).
//   Moving into theirs is a fight: your strength against theirs. Attacking up a stair or street costs you 1
//   (it's uphill); a stronghold adds 1 to whoever holds it, and loses nothing when it holds (its walls). Higher wins: the loser's squad is gone and the
//   winner is left with what's over (at least 1). A tie, the defenders hold.
//   A lift carries a squad from any lift station to any other in one move.
//   A place with its power cut: the squads there can't move this turn, and fight at 1 less (in the dark).
//
// Into the Breach's tells (designer: the model he agreed): his squads' orders are chosen first, and in the
// lesson they're shown as arrows before you give yours, so you learn to read him. A fight you go down to
// yourself (designer: drop yourself in) is decided by how that fight goes, not by the numbers.

export type WarSide = 'you' | 'him';
export type WayKind = 'street' | 'stair' | 'lift' | 'hall';

export interface WarPlace {
  id: string;
  name: string;
  /** Where it sits on the table (screen pixels). */
  x: number;
  y: number;
  /** How high up the city it is: attacking a higher level along a street or stair is uphill. */
  level: number;
  /** Whoever holds it defends it at +1 (the citadel). */
  stronghold?: boolean;
  /** A lift station: the lifts join every station to every other. */
  lift?: boolean;
}

export interface WarWay {
  a: string;
  b: string;
  kind: WayKind;
}

export interface WarBoard {
  places: WarPlace[];
  ways: WarWay[];
}

export interface Squad {
  id: string;
  side: WarSide;
  place: string;
  strength: number;
}

export interface WarState {
  squads: Squad[];
  /** Who holds each place (a place stays held when its squad moves on). */
  owner: Record<string, WarSide>;
  /** Places whose power is cut this turn: nobody there can move. */
  cut: string[];
  turn: number;
}

export interface Order {
  squad: string;
  to: string;
}

/** A fight you went down to yourself: how it went, for the squad whose attack it was. */
export type Fought = Record<string, 'won' | 'lost'>;

export type WarEvent =
  | { type: 'move'; squad: string; from: string; to: string }
  | { type: 'join'; squad: string; into: string; at: string }
  | { type: 'take'; place: string; side: WarSide }
  | { type: 'battle'; at: string; attacker: string; defender: string; attack: number; defence: number; won: boolean; fought?: boolean }
  | { type: 'repelled'; squad: string; at: string };

export const placeOf = (board: WarBoard, id: string): WarPlace => {
  const p = board.places.find((q) => q.id === id);
  if (!p) throw new Error(`WarTable: no place called "${id}"`);
  return p;
};

/** Where a squad at `place` can go in one move, and how. */
export function waysFrom(board: WarBoard, place: string): { to: string; kind: WayKind }[] {
  const out: { to: string; kind: WayKind }[] = [];
  for (const w of board.ways) {
    if (w.a === place) out.push({ to: w.b, kind: w.kind });
    else if (w.b === place) out.push({ to: w.a, kind: w.kind });
  }
  if (placeOf(board, place).lift) {
    for (const q of board.places) if (q.lift && q.id !== place && !out.some((o) => o.to === q.id)) out.push({ to: q.id, kind: 'lift' });
  }
  return out;
}

/** A squad's strength attacking from one place into another (uphill costs 1; a lift doesn't). */
export function attackOf(board: WarBoard, from: string, to: string, strength: number): number {
  const kind = waysFrom(board, from).find((w) => w.to === to)?.kind;
  const uphill = kind !== 'lift' && placeOf(board, to).level > placeOf(board, from).level;
  return Math.max(0, strength - (uphill ? 1 : 0));
}

/** A squad's strength defending where it stands (a stronghold adds 1; in the dark, with the power cut, 1 less). */
export function defenceOf(board: WarBoard, place: string, strength: number, cut: readonly string[] = []): number {
  return Math.max(0, strength + (placeOf(board, place).stronghold ? 1 : 0) - (cut.includes(place) ? 1 : 0));
}

/**
 * Where he cuts the power (Chapter 3: his first pushback, on the table): under the strongest squad of theirs,
 * so it can't move; of equals, the one nearest his stronghold.
 */
export function powerCutFor(board: WarBoard, state: WarState, side: WarSide): string | undefined {
  const stronghold = board.places.find((p) => p.stronghold)?.id;
  const near = stronghold ? distancesFrom(board, stronghold) : new Map<string, number>();
  const theirs = [...squadsOf(state, side)].sort((a, b) => b.strength - a.strength || (near.get(a.place) ?? 99) - (near.get(b.place) ?? 99));
  return theirs[0]?.place;
}

export const squadAt = (state: WarState, place: string): Squad | undefined => state.squads.find((s) => s.place === place);
export const squadsOf = (state: WarState, side: WarSide): Squad[] => state.squads.filter((s) => s.side === side);

/** Whether a squad can go there this turn. */
export function canMove(board: WarBoard, state: WarState, squad: Squad, to: string): boolean {
  return !state.cut.includes(squad.place) && waysFrom(board, squad.place).some((w) => w.to === to);
}

const clone = (state: WarState): WarState => ({
  squads: state.squads.map((s) => ({ ...s })),
  owner: { ...state.owner },
  cut: [...state.cut],
  turn: state.turn,
});

/**
 * One order carried out, on a copy of the state. Orders that can't happen now (the squad's gone, or can't
 * move from where it is) do nothing. `fought` decides a fight you went down to yourself.
 */
export function resolveOne(board: WarBoard, state: WarState, order: Order, fought: Fought = {}): { state: WarState; events: WarEvent[] } {
  const next = clone(state);
  const events: WarEvent[] = [];
  const squad = next.squads.find((s) => s.id === order.squad);
  if (!squad || !canMove(board, next, squad, order.to)) return { state: next, events };
  const from = squad.place;
  const there = squadAt(next, order.to);
  const take = () => {
    if (next.owner[order.to] !== squad.side) events.push({ type: 'take', place: order.to, side: squad.side });
    next.owner[order.to] = squad.side;
  };
  if (!there) {
    squad.place = order.to;
    events.push({ type: 'move', squad: squad.id, from, to: order.to });
    take();
  } else if (there.side === squad.side) {
    there.strength += squad.strength;
    next.squads = next.squads.filter((s) => s !== squad);
    events.push({ type: 'move', squad: squad.id, from, to: order.to }, { type: 'join', squad: squad.id, into: there.id, at: order.to });
  } else {
    const attack = attackOf(board, from, order.to, squad.strength);
    const defence = defenceOf(board, order.to, there.strength, next.cut);
    const result = fought[squad.id];
    const won = result ? result === 'won' : attack > defence;
    events.push({ type: 'battle', at: order.to, attacker: squad.id, defender: there.id, attack, defence, won, ...(result ? { fought: true } : {}) });
    if (won) {
      next.squads = next.squads.filter((s) => s !== there);
      squad.place = order.to;
      // (Fought for yourself: your squad comes through whole.)
      if (!result) squad.strength = Math.max(1, attack - defence);
      events.push({ type: 'move', squad: squad.id, from, to: order.to });
      take();
    } else if (result) {
      // Beaten back, not wiped out: they come home weaker.
      squad.strength = Math.max(1, squad.strength - 1);
      events.push({ type: 'repelled', squad: squad.id, at: order.to });
    } else {
      next.squads = next.squads.filter((s) => s !== squad);
      // (Behind a stronghold's walls, the defenders lose nothing.)
      if (!placeOf(board, order.to).stronghold) there.strength = Math.max(1, there.strength - attack);
    }
  }
  return { state: next, events };
}

/** A side's orders carried out in turn. */
export function resolve(board: WarBoard, state: WarState, orders: Order[], fought: Fought = {}): { state: WarState; events: WarEvent[] } {
  let s = state;
  const events: WarEvent[] = [];
  for (const o of orders) {
    const r = resolveOne(board, s, o, fought);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

/** How many moves from a place to every other (the lifts count as one move). */
export function distancesFrom(board: WarBoard, from: string): Map<string, number> {
  const dist = new Map([[from, 0]]);
  const todo = [from];
  while (todo.length) {
    const p = todo.shift()!;
    for (const { to } of waysFrom(board, p)) {
      if (dist.has(to)) continue;
      dist.set(to, dist.get(p)! + 1);
      todo.push(to);
    }
  }
  return dist;
}

/**
 * How a side chooses (his, on the table). `lesson`: he's teaching, so he only takes empty ground and picks
 * off what's much weaker, and never leaves the places in `keep`. `war`: he means it (designer: a fair fight
 * you're out-thought in, not a sudden flood of troops): see `warOrders`.
 */
export function chooseOrders(board: WarBoard, state: WarState, side: WarSide, mode: 'lesson' | 'war', keep: string[] = []): Order[] {
  if (mode === 'war') return warOrders(board, state, side);
  const orders: Order[] = [];
  const claimed = new Set<string>();
  // Strongest first, so they get the best targets.
  const mine = squadsOf(state, side).filter((s) => !state.cut.includes(s.place)).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
  for (const squad of mine) {
    let best: { to: string; score: number } | null = null;
    const here = placeOf(board, squad.place);
    for (const { to } of waysFrom(board, squad.place)) {
      if (claimed.has(to)) continue;
      const target = placeOf(board, to);
      const there = squadAt(state, to);
      let score: number;
      if (!there) {
        score = state.owner[to] === side ? -1 : 4 + (target.lift ? 1 : 0) + (target.stronghold ? 2 : 0);
      } else if (there.side === side) {
        score = -2;
      } else {
        const margin = attackOf(board, squad.place, to, squad.strength) - defenceOf(board, to, there.strength, state.cut);
        score = margin >= 2 ? 6 : -10;
      }
      // Don't leave a stronghold, or a place he's told to keep, empty behind him.
      if (here.stronghold || keep.includes(squad.place)) score -= 20;
      if (score > 0 && (!best || score > best.score)) best = { to, score };
    }
    if (best) {
      orders.push({ squad: squad.id, to: best.to });
      claimed.add(best.to);
    }
  }
  return orders;
}

/**
 * Meaning it, one move each, the same rules as you: every fight he can win, the biggest first; squads that
 * couldn't win alone join up beside one that could win together; the rest close in on yours by the shortest
 * way, never stepping where you could beat them; the lifts are worth having; and the stronghold is never
 * left empty.
 */
function warOrders(board: WarBoard, state: WarState, side: WarSide): Order[] {
  const foe: WarSide = side === 'you' ? 'him' : 'you';
  const enemies = squadsOf(state, foe);
  if (!enemies.length) return [];
  const mine = squadsOf(state, side).filter((s) => !state.cut.includes(s.place)).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
  const stronghold = board.places.find((p) => p.stronghold)?.id;
  const nextTo = (a: string, b: string) => waysFrom(board, a).some((w) => w.to === b);
  /** Could one of theirs beat this many here? */
  const threatened = (place: string, strength: number) => enemies.some((e) => !state.cut.includes(e.place) && nextTo(e.place, place) && attackOf(board, e.place, place, e.strength) > defenceOf(board, place, strength));
  /** How far a place is from their nearest squad. */
  const toFoe = (place: string) => {
    const d = distancesFrom(board, place);
    return Math.min(...enemies.map((e) => d.get(e.place) ?? 99));
  };
  /** Could this many, from here, beat any of theirs next to it? */
  const couldStrike = (place: string, strength: number) => enemies.some((e) => nextTo(place, e.place) && attackOf(board, place, e.place, strength) > defenceOf(board, e.place, e.strength, state.cut));
  const orders: Order[] = [];
  const claimed = new Set<string>();
  /** Whether the stronghold could be left empty for a turn: none of theirs could walk into it. */
  const safeToLeave = (target?: string) => !!stronghold && !enemies.some((e) => e.place !== target && nextTo(e.place, stronghold));
  for (const squad of mine) {
    const alone = squad.place === stronghold && mine.filter((m) => m.place === stronghold).length === 1;
    let best: { to: string; score: number } | null = null;
    for (const { to } of waysFrom(board, squad.place)) {
      if (claimed.has(to)) continue;
      const there = squadAt(state, to);
      let score: number;
      if (there?.side === foe) {
        const margin = attackOf(board, squad.place, to, squad.strength) - defenceOf(board, to, there.strength, state.cut);
        if (margin <= 0) continue;
        score = 30 + there.strength * 3 + (placeOf(board, to).lift ? 6 : 0) - (threatened(to, margin) ? 8 : 0);
        // The garrison comes down like a hammer: only when none of theirs could walk in behind it, and
        // everything they'd have left, together, couldn't beat what comes back.
        const left = enemies.reduce((n, e) => n + e.strength, 0) - there.strength;
        if (alone && safeToLeave(to) && left < margin) score += 70;
      } else if (there?.side === side) {
        // Joining up: worth it if together they could strike next turn, or it makes a squad that's strong
        // enough to go looking for a fight. Into the stronghold only to make the garrison a hammer.
        const together = there.strength + squad.strength;
        if (to === stronghold) score = couldStrike(to, together) && !couldStrike(to, there.strength) ? 20 : -5;
        else score = couldStrike(to, together) && !couldStrike(to, there.strength) ? 18 : couldStrike(to, together) ? 6 : squad.strength < 4 ? 9 : 1;
      } else if (to === stronghold && !there) {
        // The stronghold's empty (the garrison's out): back in, first.
        score = 90;
      } else {
        // Closing in on theirs by the shortest way; the lifts and ground worth a little; never into their reach.
        score = 3 + (toFoe(squad.place) - toFoe(to)) * 7 + (placeOf(board, to).lift ? 2 : 0) + (state.owner[to] !== side ? 2 : 0);
        if (threatened(to, squad.strength)) score -= 25;
      }
      if (alone) score -= 60;
      if (score > 0 && (!best || score > best.score)) best = { to, score };
    }
    if (best) {
      orders.push({ squad: squad.id, to: best.to });
      claimed.add(best.to);
    }
  }
  return orders;
}

/** The place under a cursor moving in a direction: within about 45°, straighter then closer wins. */
export function placeInDirection(places: readonly WarPlace[], from: WarPlace, dx: number, dy: number): WarPlace | null {
  let best: WarPlace | null = null;
  let bestScore = Infinity;
  for (const p of places) {
    if (p === from) continue;
    const vx = p.x - from.x;
    const vy = p.y - from.y;
    const dist = Math.hypot(vx, vy);
    const cos = (vx * dx + vy * dy) / (dist * Math.hypot(dx, dy));
    if (cos < 0.7) continue;
    const score = dist * (1 + 4 * (1 - cos));
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}
