import { describe, expect, it } from 'vitest';
import { CAPITAL_BOARD, LESSON, SCENARIOS } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { attackOf, canMove, chooseOrders, defenceOf, placeInDirection, resolve, resolveOne, squadAt, waysFrom, type WarState } from '../src/systems/WarTable';

const start = (): WarState => ({ squads: LESSON.squads.map((s) => ({ ...s })), owner: { ...LESSON.owner }, cut: [], turn: 1 });

describe('the war table: the board', () => {
  it('every way joins two places on the board', () => {
    const ids = new Set(CAPITAL_BOARD.places.map((p) => p.id));
    for (const w of CAPITAL_BOARD.ways) {
      expect(ids.has(w.a), w.a).toBe(true);
      expect(ids.has(w.b), w.b).toBe(true);
    }
  });

  it('every place can be reached from every other', () => {
    const seen = new Set(['citadel']);
    const todo = ['citadel'];
    while (todo.length) for (const { to } of waysFrom(CAPITAL_BOARD, todo.pop()!)) if (!seen.has(to)) (seen.add(to), todo.push(to));
    expect(seen.size).toBe(CAPITAL_BOARD.places.length);
  });

  it('the lifts join every station to every other in one move', () => {
    const tos = waysFrom(CAPITAL_BOARD, 'lift_low').map((w) => w.to);
    expect(tos).toContain('lift_top');
    expect(tos).toContain('lift_mid');
  });

  it('every place can be reached with the arrow keys', () => {
    for (const from of CAPITAL_BOARD.places) {
      const reached = new Set<string>([from.id]);
      const todo = [from];
      while (todo.length) {
        const p = todo.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const q = placeInDirection(CAPITAL_BOARD.places, p, dx, dy);
          if (q && !reached.has(q.id)) (reached.add(q.id), todo.push(q));
        }
      }
      expect(reached.size, from.id).toBe(CAPITAL_BOARD.places.length);
    }
  });
});

describe('the war table: the rules', () => {
  it('uphill costs 1 along a stair; a lift doesn’t; the citadel defends at +1', () => {
    expect(attackOf(CAPITAL_BOARD, 'low_west', 'promenade', 3)).toBe(2);
    expect(attackOf(CAPITAL_BOARD, 'lift_low', 'lift_top', 3)).toBe(3);
    expect(defenceOf(CAPITAL_BOARD, 'citadel', 4)).toBe(5);
  });

  it('moving into an empty place takes it; into your own joins it', () => {
    let s = start();
    s = resolveOne(CAPITAL_BOARD, s, { squad: 'r4', to: 'lift_mid' }).state;
    expect(s.owner.lift_mid).toBe('you');
    s = resolveOne(CAPITAL_BOARD, s, { squad: 'r3', to: 'low_west' }).state;
    expect(squadAt(s, 'low_west')!.strength).toBe(4);
    expect(s.squads.find((q) => q.id === 'r3')).toBeUndefined();
  });

  it('a fight: higher wins and is left with what’s over; a tie, the defenders hold', () => {
    // 4 up the stair is 3, against 2: they take it, 1 left.
    let s = resolveOne(CAPITAL_BOARD, start(), { squad: 'r3', to: 'low_west' }).state;
    const won = resolveOne(CAPITAL_BOARD, s, { squad: 'r1', to: 'promenade' });
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'battle', won: true, attack: 3, defence: 2 }));
    expect(squadAt(won.state, 'promenade')).toMatchObject({ side: 'you', strength: 1 });
    expect(won.state.owner.promenade).toBe('you');
    // 2 up the stair is 1, against 2: beaten, the squad's gone.
    s = start();
    const lost = resolveOne(CAPITAL_BOARD, s, { squad: 'r1', to: 'promenade' });
    expect(lost.events).toContainEqual(expect.objectContaining({ type: 'battle', won: false }));
    expect(lost.state.squads.find((q) => q.id === 'r1')).toBeUndefined();
    expect(squadAt(lost.state, 'promenade')).toMatchObject({ side: 'him' });
  });

  it('a fight you went down to yourself goes the way the fight went', () => {
    const won = resolveOne(CAPITAL_BOARD, start(), { squad: 'r1', to: 'promenade' }, { r1: 'won' });
    expect(squadAt(won.state, 'promenade')).toMatchObject({ id: 'r1', side: 'you', strength: 2 });
    const lost = resolveOne(CAPITAL_BOARD, start(), { squad: 'r1', to: 'promenade' }, { r1: 'lost' });
    expect(lost.events).toContainEqual({ type: 'repelled', squad: 'r1', at: 'promenade' });
    expect(lost.state.squads.find((q) => q.id === 'r1')).toMatchObject({ place: 'low_west', strength: 1 });
  });

  it('nobody moves out of a place whose power is cut', () => {
    const s = { ...start(), cut: ['low_west'] };
    expect(canMove(CAPITAL_BOARD, s, squadAt(s, 'low_west')!, 'gate')).toBe(false);
    expect(resolveOne(CAPITAL_BOARD, s, { squad: 'r1', to: 'gate' }).events).toEqual([]);
  });
});

describe('the war table: him', () => {
  it('in the lesson he never leaves the promenade or the citadel, and picks no even fights', () => {
    const orders = chooseOrders(CAPITAL_BOARD, start(), 'him', 'lesson', LESSON.keep);
    const s = start();
    for (const o of orders) {
      const from = s.squads.find((q) => q.id === o.squad)!.place;
      expect(['promenade', 'citadel']).not.toContain(from);
      const there = squadAt(s, o.to);
      if (there) expect(attackOf(CAPITAL_BOARD, from, o.to, s.squads.find((q) => q.id === o.squad)!.strength) - defenceOf(CAPITAL_BOARD, o.to, there.strength)).toBeGreaterThanOrEqual(2);
    }
  });

  it('when he means it, he takes every fight he can win', () => {
    const s: WarState = { ...start(), squads: start().squads.map((q) => (q.side === 'him' ? { ...q, strength: q.strength + 3 } : q)) };
    const orders = chooseOrders(CAPITAL_BOARD, s, 'him', 'press');
    const after = resolve(CAPITAL_BOARD, s, orders);
    expect(after.events.some((e) => e.type === 'battle' && e.won)).toBe(true);
  });

  it('the lesson can be won: join up, then take the promenade', () => {
    let s = start();
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r3', to: 'low_west' }]).state;
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r1', to: 'promenade' }]).state;
    expect(s.owner[LESSON.goal]).toBe('you');
  });

  it('the scenarios’ fights exist', () => {
    for (const sc of Object.values(SCENARIOS)) for (const enc of Object.values(sc.dropIn)) expect(ENCOUNTERS[enc], enc).toBeDefined();
  });
});
