import { RiotGame, type Order, type RiotSquad, type RiotState } from './Riot';

// Computer players for the riot game (src/systems/Riot.ts), all of them the guard: your father when he
// means it (careful: "Now." in the lesson, and taking the table over if dawn beats you), the guard in the
// lesson (steady: it only punishes what's left open), and the balance tests (docs/sequences/chapter-3/
// war-table.md), which play it at different levels of skill. The rising's own play is `RiotGame.risingOrders`.

/** A whole turn for the guard: the power cut (if any) and every order. */
export interface Turn {
  cut?: string;
  orders: Order[];
}

/** How good a position looks for the guard. */
export function evaluate(g: RiotGame, s: RiotState): number {
  const o = g.outcome(s);
  if (o === 'guard') return 10000 - s.turn * 10;
  if (o === 'rising') return -10000;
  let v = 0;
  const guard = g.mine(s, 'guard');
  const rising = g.mine(s, 'rising');
  for (const q of guard) v += q.strength * 3;
  for (const q of rising) v -= q.strength * (q.place === g.heart ? 4 : 3);
  // Crowds next to the square will fall back into it.
  for (const q of rising) if (q.place !== g.heart && g.near(q.place, g.heart)) v -= q.strength * 2;
  for (const p of g.board.places) if (s.owner[p.id] === 'guard') v += 1;
  // Crowds near the way up are a worry.
  for (const q of rising) if (q.place !== g.heart) v -= Math.max(0, 3 - (g.upDist.get(q.place) ?? 9)) * q.strength;
  // Closing on the square: how much is next to it, and the biggest squad, how near and how close to matching it.
  const h = g.squadAt(s, g.heart);
  const need = h ? g.defence(s, g.heart, h.strength) : 0;
  const near = guard.filter((q) => g.near(q.place, g.heart));
  v += Math.min(near.reduce((n, q) => n + q.strength, 0), need) * 2 + near.length;
  const biggest = [...guard].sort((a, b) => b.strength - a.strength)[0];
  if (biggest) v += Math.min(biggest.strength, need + 1) * 2 - distance(g, biggest.place, g.heart) * 2;
  return v;
}

function distance(g: RiotGame, a: string, b: string): number {
  const seen = new Map([[a, 0]]);
  const todo = [a];
  while (todo.length) {
    const p = todo.shift()!;
    if (p === b) return seen.get(p)!;
    for (const n of g.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
  }
  return 99;
}

/** A turn played out for the guard: the rising's orders as shown at the start, the power cut, the guard's orders, then the rest. */
export function playTurn(g: RiotGame, s: RiotState, turn: Turn, rising = g.risingOrders(s)): RiotState {
  return g.turn(turn.cut ? g.cutPower(s, turn.cut) : s, turn.orders, rising).state;
}

export type GuardPlayer = (g: RiotGame, s: RiotState) => Turn;

const options = (g: RiotGame, s: RiotState, q: RiotSquad): string[] => [q.place, ...g.dests(s, q)];

function cuts(g: RiotGame, s: RiotState): (string | undefined)[] {
  return g.canCut(s) ? [undefined, ...g.mine(s, 'rising').map((q) => q.place)] : [undefined];
}

/** Sensible: the best power cut, then each squad in turn does what looks best one turn ahead. */
export function sensible(): GuardPlayer {
  return (g, s) => {
    let cut: string | undefined;
    let bv = -Infinity;
    for (const c of cuts(g, s)) {
      const v = evaluate(g, playTurn(g, s, { cut: c, orders: [] }));
      if (v > bv) (bv = v), (cut = c);
    }
    const orders: Order[] = [];
    for (const q of g.mine(s, 'guard')) {
      let pick = q.place;
      let pv = -Infinity;
      for (const to of options(g, s, q)) {
        const v = evaluate(g, playTurn(g, s, { cut, orders: [...orders, { squad: q.id, to }] }));
        if (v > pv) (pv = v), (pick = to);
      }
      orders.push({ squad: q.id, to: pick });
    }
    return { cut, orders };
  };
}

/**
 * Careful (your father): starts from the sensible turn, then keeps changing one squad's order (and when it
 * goes: first, or last) and the power cut while that improves things, judging each by the turn after too.
 */
export function careful(): GuardPlayer {
  const quick = sensible();
  const judge = (g: RiotGame, s: RiotState, t: Turn) => {
    let n = playTurn(g, s, t);
    if (!g.outcome(n)) n = playTurn(g, n, quick(g, n));
    return evaluate(g, n);
  };
  return (g, s) => {
    let best = quick(g, s);
    let bv = judge(g, s, best);
    for (let pass = 0; pass < 3; pass++) {
      let improved = false;
      for (const q of g.mine(s, 'guard')) {
        const others = best.orders.filter((o) => o.squad !== q.id);
        for (const to of options(g, s, q)) {
          const o = { squad: q.id, to };
          for (const orders of [best.orders.map((x) => (x.squad === q.id ? o : x)), [o, ...others], [...others, o]]) {
            const t = { cut: best.cut, orders };
            const v = judge(g, s, t);
            if (v > bv + 1e-9) (bv = v), (best = t), (improved = true);
          }
        }
      }
      for (const cut of cuts(g, s)) {
        const t = { cut, orders: best.orders };
        const v = judge(g, s, t);
        if (v > bv + 1e-9) (bv = v), (best = t), (improved = true);
      }
      if (!improved) break;
    }
    return best;
  };
}

/** The guard in the lesson (steady): holds its ground, and only goes for a squad of the rising it beats by 2 or more. */
export function steady(): GuardPlayer {
  return (g, s) => {
    const orders: Order[] = [];
    const claimed = new Set<string>();
    for (const q of g.mine(s, 'guard').sort((a, b) => b.strength - a.strength)) {
      const target = g.dests(s, q).find((to) => {
        const there = g.squadAt(s, to);
        return to !== g.heart && !claimed.has(to) && there?.side === 'rising' && g.attack(q.place, to, q.strength) - g.defence(s, to, there.strength) >= 2;
      });
      if (target) (orders.push({ squad: q.id, to: target }), claimed.add(target));
    }
    return { orders };
  };
}

/** Random orders (a player who doesn't know what they're doing). */
export function random(seed = 1): GuardPlayer {
  let r = seed;
  const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return (g, s) => ({ orders: g.mine(s, 'guard').map((q) => {
    const o = options(g, s, q);
    return { squad: q.id, to: o[Math.floor(rnd() * o.length)]! };
  }) });
}

/** A whole game, the guard against the rising (by default the rising's own play), to the end or a turn limit. */
export function playOut(g: RiotGame, s0: RiotState, player: GuardPlayer, rising?: (g: RiotGame, s: RiotState) => Order[], limit = 40): { state: RiotState; winner: 'guard' | 'rising' } {
  let s = s0;
  for (let i = 0; i < limit && !g.outcome(s); i++) s = playTurn(g, s, player(g, s), rising ? rising(g, s) : g.risingOrders(s));
  return { state: s, winner: g.outcome(s) ?? 'rising' };
}

/**
 * Naive (a person on their first go, as the designer played it): every squad heads for the square by the
 * shortest way, attacking anything it can beat on the way, joining up with its own; at the square, it attacks
 * only if it'd take it. No power cut, no fortify, no thought for the order.
 */
export function naive(): GuardPlayer {
  return (g, s) => {
    const orders: Order[] = [];
    for (const q of [...g.mine(s, 'guard')].sort((a, b) => b.strength - a.strength)) {
      const ways = g.dests(s, q);
      const beat = ways.find((to) => {
        const there = g.squadAt(s, to);
        return there?.side === 'rising' && g.attack(q.place, to, q.strength) > g.defence(s, to, there.strength) - (to === g.heart ? 1 : 0);
      });
      if (beat) {
        orders.push({ squad: q.id, to: beat });
        continue;
      }
      const step = ways.filter((to) => g.squadAt(s, to)?.side !== 'rising').sort((a, b) => distance(g, a, g.heart) - distance(g, b, g.heart))[0];
      if (step && distance(g, step, g.heart) < distance(g, q.place, g.heart)) orders.push({ squad: q.id, to: step });
    }
    return { orders };
  };
}

/**
 * Your friend in the duel (Day 6): sensible, but his camp's garrison never leaves it (the duel's won by taking
 * it: designer), so his reinforcements gather there and you have to bring enough together to take it.
 */
export function besieger(): GuardPlayer {
  const quick = sensible();
  return (g, s) => {
    const turn = quick(g, s);
    const home = g.squadAt(s, g.lifts);
    if (home?.side !== 'guard') return turn;
    return { ...turn, orders: turn.orders.filter((o) => o.squad !== home.id) };
  };
}
