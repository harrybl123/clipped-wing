import { RiotGame, type RiotAction, type RiotState } from './Riot';

// Computer players for the riot game (src/systems/Riot.ts): your father, when he takes the table over
// (a careful player), and the balance tests (docs/sequences/chapter-3/war-table.md), which play it at
// different levels of skill to keep it on the easy side but not really easy.

/** How good a position looks for the guard. */
export function evaluate(g: RiotGame, s: RiotState): number {
  const o = g.outcome(s);
  if (o === 'won') return 10000 - s.turn * 10;
  if (o === 'lost') return -10000;
  let v = 0;
  for (const p of g.board.places) {
    const u = s.unrest[p.id]!;
    const w = 1 + (p.up ? 3 : 0) + (p.heart ? 0.5 : 0);
    v -= u * u * w;
    if (u >= 3) v -= 4 + (p.up ? 16 : 0);
  }
  for (const q of s.squads) v += q.hp * 3 + 2;
  v -= s.anger * 0.5;
  v -= s.barricade * 8;
  v += s.squads.filter((q) => g.near(q.place, g.heart)).length * 2;
  if (s.barricade <= 0) v -= s.unrest[g.heart]! * 6;
  return v;
}

/** A turn played out: these actions in order, then the rising's turn (as shown at the start of it). */
export function playTurn(g: RiotGame, s: RiotState, actions: RiotAction[]): RiotState {
  const spreads = g.spreads(s);
  let t = s;
  for (const a of actions) t = g.act(t, a);
  return g.outcome(t) ? t : g.endTurn(t, spreads);
}

export type RiotPlayer = (g: RiotGame, s: RiotState) => RiotAction[];

function cuts(g: RiotGame, s: RiotState): RiotAction[] {
  if (!g.canCut(s)) return [];
  return g.board.places
    .filter((p) => s.unrest[p.id]! >= 3 || (s.unrest[p.id] === 2 && g.adj.get(p.id)!.some((n) => s.unrest[n]! >= 3)))
    .map((p) => ({ kind: 'cut', at: p.id }) as RiotAction);
}

/** Sensible: each squad in turn does what looks best one turn ahead. `allow` restricts what it'll do. */
export function sensible(allow?: (a: RiotAction) => boolean): RiotPlayer {
  return (g, s) => {
    const out: RiotAction[] = [];
    let bestCut: RiotAction | null = null;
    let bv = evaluate(g, playTurn(g, s, []));
    for (const c of cuts(g, s)) {
      const v = evaluate(g, playTurn(g, s, [c]));
      if (v > bv) (bv = v), (bestCut = c);
    }
    if (bestCut) out.push(bestCut);
    for (const q of s.squads) {
      let best: RiotAction | null = null;
      let b = -Infinity;
      const now = out.reduce((t, a) => g.act(t, a), s);
      for (const a of g.actions(now, now.squads.find((x) => x.id === q.id) ?? q).filter((a) => !allow || allow(a))) {
        const v = evaluate(g, playTurn(g, s, [...out, a]));
        if (v > b) (b = v), (best = a);
      }
      if (best) out.push(best);
    }
    return out;
  };
}

/**
 * Careful (your father): starts from the sensible turn, then keeps changing one squad's action (and when it
 * goes: first, or last) and the power cut while that improves things, judging each by the turn after too.
 */
export function careful(): RiotPlayer {
  const quick = sensible();
  const judge = (g: RiotGame, s: RiotState, actions: RiotAction[]) => {
    let t = playTurn(g, s, actions);
    if (!g.outcome(t)) t = playTurn(g, t, quick(g, t));
    return evaluate(g, t);
  };
  return (g, s) => {
    let best = quick(g, s);
    let bv = judge(g, s, best);
    for (let pass = 0; pass < 3; pass++) {
      let improved = false;
      for (const q of s.squads) {
        const mine = (a: RiotAction) => a.kind !== 'cut' && a.squad === q.id;
        const others = best.filter((a) => !mine(a));
        const at = best.findIndex(mine);
        for (const a of g.actions(s, q)) {
          const swapped = at >= 0 ? best.map((b, i) => (i === at ? a : b)) : [...best, a];
          for (const t of [swapped, [a, ...others], [...others, a]]) {
            const v = judge(g, s, t);
            if (v > bv + 1e-9) (bv = v), (best = t), (improved = true);
          }
        }
      }
      const noCut = best.filter((a) => a.kind !== 'cut');
      for (const c of [null, ...cuts(g, s)]) {
        const t = c ? [c, ...noCut] : noCut;
        const v = judge(g, s, t);
        if (v > bv + 1e-9) (bv = v), (best = t), (improved = true);
      }
      if (!improved) break;
    }
    return best;
  };
}

/** Plays a whole game out; the number of turns and how it ended. */
export function playOut(g: RiotGame, s0: RiotState, player: RiotPlayer, limit = 40): { state: RiotState; outcome: 'won' | 'lost'; charges: number } {
  let s = s0;
  let charges = 0;
  for (let i = 0; i < limit && !g.outcome(s); i++) {
    const actions = player(g, s);
    charges += actions.filter((a) => a.kind === 'charge').length;
    s = playTurn(g, s, actions);
  }
  return { state: s, outcome: g.outcome(s) ?? 'lost', charges };
}
