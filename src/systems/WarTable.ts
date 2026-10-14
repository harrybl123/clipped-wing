// The war table (Chapter 3; docs/sequences/chapter-3/plan.md, "The war table"). Pure rules, no Phaser:
// WarTableScene draws and runs them, and src/data/warTable.ts holds the boards and scenarios.
//
// The capital is the board (designer): its places are the squares, and the halls, stairs, streets and lifts
// between them are the ways a squad can move. Turn-based: each side gives every one of its squads an order
// (move along one way, or hold), then they go. Squads are points of light with a strength (how many).
//
//   Moving into an empty place takes it. Moving into your own squad joins it (their strengths add up).
//   Moving into theirs is a fight: your strength against theirs. Attacking up a stair or street costs you 1
//   (it's uphill); a stronghold adds 1 to whoever holds it. Higher wins: the loser's squad is gone and the
//   winner is left with what's over (at least 1). A tie, the defenders hold.
//   A lift carries a squad from any lift station to any other in one move.
//   A place with its power cut: the squads there can't move this turn.
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

/** A squad's strength defending where it stands (a stronghold adds 1). */
export function defenceOf(board: WarBoard, place: string, strength: number): number {
  return strength + (placeOf(board, place).stronghold ? 1 : 0);
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
    const defence = defenceOf(board, order.to, there.strength);
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
      there.strength = Math.max(1, defence - attack - (placeOf(board, order.to).stronghold ? 1 : 0));
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

/**
 * How a side chooses (his, on the table). `lesson`: he's teaching, so he only takes empty ground and picks
 * off what's much weaker, and never leaves the place you're meant to take. `press`: he means it: every fight
 * he can win, the lifts first, and he keeps the citadel held.
 */
export function chooseOrders(board: WarBoard, state: WarState, side: WarSide, mode: 'lesson' | 'press', keep: string[] = []): Order[] {
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
        score = state.owner[to] === side ? -1 : 4 + (target.lift ? (mode === 'press' ? 6 : 1) : 0) + (target.stronghold ? 2 : 0);
      } else if (there.side === side) {
        score = -2;
      } else {
        const margin = attackOf(board, squad.place, to, squad.strength) - defenceOf(board, to, there.strength);
        score = mode === 'lesson' ? (margin >= 2 ? 6 : -10) : margin > 0 ? 10 + there.strength + (target.lift ? 4 : 0) : -10;
      }
      // Don't leave a stronghold, or a place he's told to keep, empty behind him.
      if (here.stronghold || keep.includes(squad.place)) score -= mode === 'press' && squad.strength > 3 ? 3 : 20;
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
