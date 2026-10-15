import { describe, expect, it } from 'vitest';
import { LOW_DISTRICT_BOARD, PROMENADE_BOARD, RIOTS, type RiotScenario } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import {
  attackOf, defenceOf, distancesFrom, outsideHeart, placeInDirection, reinforced, resolve, riotGoalMet, riotGrow, riotOrders,
  sealed, squadAt, squadsOf, streetsInto, waysFrom, type Order, type WarState,
} from '../src/systems/WarTable';

const fresh = (sc: RiotScenario): WarState => ({ squads: sc.squads.map((s) => ({ ...s })), owner: { ...sc.owner }, cut: [], turn: 1 });

/**
 * A sensible player, to check the riot can be won and takes a while: cuts the power under their biggest crowd
 * when it can; attacks what it can beat (never the square until the end); fills the streets into the square
 * once it's told to seal it; otherwise closes in on the nearest crowd, joining up on the way.
 */
function playerOrders(sc: RiotScenario, state: WarState, goal: RiotScenario['goals'][number]): Order[] {
  const { board } = sc;
  const heart = sc.rules.heart;
  const orders: Order[] = [];
  const claimed = new Set<string>();
  const mine = squadsOf(state, 'you').sort((a, b) => b.strength - a.strength);
  const crowds = outsideHeart(state, heart);
  for (const s of mine) {
    if (state.cut.includes(s.place)) continue;
    // Never leave the stair up to the citadel empty.
    if (s.place === sc.lostIf && goal.kind !== 'square') continue;
    const ways = waysFrom(board, s.place).map((w) => w.to).filter((t) => !claimed.has(t));
    // The end: go down to the square.
    if (goal.kind === 'square' && ways.includes(heart)) {
      orders.push({ squad: s.id, to: heart });
      claimed.add(heart);
      continue;
    }
    // Sealing: a squad already on a street into the square stays.
    const into = streetsInto(board, heart);
    const sealing = (goal.kind === 'seal' || goal.kind === 'clear') && into.includes(s.place);
    // Sealing: once on a street into the square, stay there.
    if (sealing) continue;
    const beat = ways
      .map((t) => ({ t, there: squadAt(state, t) }))
      .filter(({ t, there }) => t !== heart && there?.side === 'him' && attackOf(board, s.place, t, s.strength) > defenceOf(board, t, there.strength, state.cut, there.side))
      .sort((a, b) => b.there!.strength - a.there!.strength)[0];
    if (beat) {
      orders.push({ squad: s.id, to: beat.t });
      claimed.add(beat.t);
      continue;
    }
    // Otherwise on towards the nearest street into the square that none of ours holds (sealing), or the nearest crowd.
    const targets = goal.kind === 'take' && goal.place && goal.place !== heart
      ? [goal.place]
      : goal.kind === 'seal' || goal.kind === 'clear'
        ? into.filter((p) => squadAt(state, p)?.side !== 'you' && !claimed.has(p))
        : crowds.map((c) => c.place);
    if (!targets.length) continue;
    // A path to the nearest target, only through places it could walk into (empty, ours but not holding a
    // street into the square or the stair, or a crowd it could beat); the first step of it.
    const passable = (t: string) => {
      const q = squadAt(state, t);
      if (t === heart) return false;
      if (!q) return true;
      if (q.side === 'you') return !into.includes(t) && t !== sc.lostIf;
      return attackOf(board, s.place, t, s.strength) > defenceOf(board, t, q.strength, state.cut, 'him');
    };
    const first = new Map<string, string>();
    const todo: string[] = [];
    for (const t of ways) if (passable(t)) (first.set(t, t), todo.push(t));
    let step: string | undefined;
    while (todo.length) {
      const p = todo.shift()!;
      if (targets.includes(p)) {
        step = first.get(p);
        break;
      }
      for (const { to } of waysFrom(board, p)) if (!first.has(to) && to !== s.place && to !== heart && (!squadAt(state, to) || squadAt(state, to)!.side === 'him' || (!into.includes(to) && to !== sc.lostIf))) (first.set(to, first.get(p)!), todo.push(to));
    }
    if (step) {
      orders.push({ squad: s.id, to: step });
      claimed.add(step);
    }
  }
  return orders;
}

/** Plays a riot through as the scene does; returns the turns it took (or Infinity) and how often the guard lost a squad. */
function play(sc: RiotScenario, cap = 60): { turns: number; lost: number } {
  let state = fresh(sc);
  let g = 0;
  let lost = 0;
  let lastCut = -99;
  for (let turn = 1; turn <= cap; turn++) {
    state = { ...state, turn, cut: [] };
    while (sc.goals[g] && riotGoalMet(sc.board, state, sc.rules.heart, sc.goals[g]!)) g++;
    const goal = sc.goals[g];
    if (!goal) return { turns: turn - 1, lost };
    if (turn - lastCut >= sc.powerEvery) {
      const biggest = outsideHeart(state, sc.rules.heart).sort((a, b) => b.strength - a.strength)[0];
      if (biggest) (state = { ...state, cut: [biggest.place] }), (lastCut = turn);
    }
    const before = squadsOf(state, 'you').length;
    // The square's fight is always won here (it's a fight you play).
    const mine = playerOrders(sc, state, goal);
    const fought = Object.fromEntries(mine.filter((o) => o.to === sc.rules.heart && goal.kind === 'square').map((o) => [o.squad, 'won' as const]));
    state = resolve(sc.board, state, mine, fought).state;
    state = resolve(sc.board, state, riotOrders(sc.board, state, sc.rules)).state;
    state = riotGrow(sc.board, state, sc.rules).state;
    if (turn % sc.reinforce.every === 0) state = reinforced(sc.board, state, sc.reinforce.place, sc.reinforce.strength);
    lost += Math.max(0, before - squadsOf(state, 'you').length);
    if (process.env.TRACE) console.log(turn, goal.kind, goal.place ?? '', state.squads.map((q) => `${q.side === 'you' ? 'G' : 'R'}${q.strength}@${q.place}`).join(' '));
    if (riotGoalMet(sc.board, state, sc.rules.heart, { kind: 'square' })) return { turns: turn, lost };
    if (state.owner[sc.lostIf] === 'him') return { turns: -turn, lost };
  }
  return { turns: Infinity, lost };
}

describe('the riot table', () => {
  it('its own boards: every way joins two places, all reachable, every place by the arrow keys', () => {
    for (const board of [LOW_DISTRICT_BOARD, PROMENADE_BOARD]) {
      const ids = new Set(board.places.map((p) => p.id));
      for (const w of board.ways) expect(ids.has(w.a) && ids.has(w.b), `${w.a}-${w.b}`).toBe(true);
      expect(distancesFrom(board, 'square').size).toBe(board.places.length);
      for (const from of board.places) {
        const reached = new Set([from.id]);
        const todo = [from];
        while (todo.length) {
          const p = todo.pop()!;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const q = placeInDirection(board.places, p, dx, dy);
            if (q && !reached.has(q.id)) (reached.add(q.id), todo.push(q));
          }
        }
        expect(reached.size, from.id).toBe(board.places.length);
      }
    }
  });

  it('the square grows, and spreads into an empty street nearest the way up', () => {
    const sc = RIOTS.riot_low!;
    let state = fresh(sc);
    state = { ...state, squads: state.squads.filter((s) => s.place !== 'market') };
    const r = riotGrow(sc.board, state, sc.rules);
    expect(r.spread?.to).toBe('market');
    expect(squadAt(r.state, 'square')!.strength).toBe(4 + 1 - 2);
  });

  it('a sealed square cannot spread', () => {
    const sc = RIOTS.riot_low!;
    const state: WarState = { squads: [{ id: 'h', side: 'him', place: 'square', strength: 7 }, ...streetsInto(sc.board, 'square').map((p, i) => ({ id: `y${i}`, side: 'you' as const, place: p, strength: 2 }))], owner: {}, cut: [], turn: 1 };
    expect(sealed(sc.board, state, 'square')).toBe(true);
    expect(riotGrow(sc.board, state, sc.rules).spread).toBeUndefined();
  });

  it('the square holds against numbers: it can only be taken by going down', () => {
    const sc = RIOTS.riot_low!;
    expect(defenceOf(sc.board, 'square', sc.rules.spreadAt)).toBeGreaterThan(sc.rules.spreadAt);
    expect(ENCOUNTERS[sc.square]).toBeDefined();
  });

  it('can be won, takes a good while, and isn\'t free (designer: a longer game, on the easy side but not really easy)', () => {
    for (const sc of Object.values(RIOTS)) {
      const { turns, lost } = play(sc);
      if (process.env.TRACE) console.log('RESULT', sc.id, turns, lost);
      // (A simple player: someone playing should be quicker, but it's long; about 37 turns for this one.)
      expect(turns, sc.id).toBeGreaterThanOrEqual(15);
      expect(turns, sc.id).toBeLessThan(45);
      expect(lost, `${sc.id}: the guard should take losses`).toBeGreaterThan(0);
    }
  });
});
