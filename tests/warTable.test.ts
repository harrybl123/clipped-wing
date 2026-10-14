import { describe, expect, it } from 'vitest';
import { CAPITAL_BOARD, LESSON, SCENARIOS } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { attackOf, canMove, chooseOrders, defenceOf, placeInDirection, powerCutFor, resolve, resolveOne, squadAt, squadsOf, waysFrom, type WarState } from '../src/systems/WarTable';

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
    // 4 along the street, against 2: they take it, 2 left.
    let s = resolve(CAPITAL_BOARD, start(), [{ squad: 'r4', to: 'lift_mid' }, { squad: 'r2', to: 'lift_low' }]).state;
    s = resolveOne(CAPITAL_BOARD, s, { squad: 'r2', to: 'lift_mid' }).state;
    const won = resolveOne(CAPITAL_BOARD, s, { squad: 'r4', to: 'data' });
    expect(won.events).toContainEqual(expect.objectContaining({ type: 'battle', won: true, attack: 4, defence: 2 }));
    expect(squadAt(won.state, 'data')).toMatchObject({ side: 'you', strength: 2 });
    expect(won.state.owner.data).toBe('you');
    // 2 along the street against 2: a tie, and the defenders hold.
    const tie = resolveOne(CAPITAL_BOARD, resolveOne(CAPITAL_BOARD, start(), { squad: 'r4', to: 'lift_mid' }).state, { squad: 'r4', to: 'data' });
    expect(tie.events).toContainEqual(expect.objectContaining({ type: 'battle', won: false, attack: 2, defence: 2 }));
    expect(squadAt(tie.state, 'data')).toMatchObject({ side: 'him' });
    // 2 up the stair is 1, against 3: beaten, the squad's gone.
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
  it('in the lesson he never leaves the places he keeps, and picks no even fights', () => {
    const orders = chooseOrders(CAPITAL_BOARD, start(), 'him', 'lesson', LESSON.keep);
    const s = start();
    for (const o of orders) {
      const from = s.squads.find((q) => q.id === o.squad)!.place;
      expect(LESSON.keep).not.toContain(from);
      const there = squadAt(s, o.to);
      if (there) expect(attackOf(CAPITAL_BOARD, from, o.to, s.squads.find((q) => q.id === o.squad)!.strength) - defenceOf(CAPITAL_BOARD, o.to, there.strength)).toBeGreaterThanOrEqual(2);
    }
  });

  it('when he means it, he only ever picks fights he can win, and never leaves the citadel empty', () => {
    let s: WarState = { squads: LESSON.now.squads.map((q) => ({ ...q })), owner: { ...LESSON.now.owner }, cut: [], turn: 1 };
    for (let turn = 0; turn < LESSON.now.turns; turn++) {
      const orders = chooseOrders(CAPITAL_BOARD, s, 'him', 'war');
      for (const o of orders) {
        const sq = s.squads.find((q) => q.id === o.squad)!;
        const there = squadAt(s, o.to);
        if (there && there.side !== 'him') expect(attackOf(CAPITAL_BOARD, sq.place, o.to, sq.strength)).toBeGreaterThan(defenceOf(CAPITAL_BOARD, o.to, there.strength));
      }
      s = resolve(CAPITAL_BOARD, s, orders).state;
      expect(squadAt(s, 'citadel')?.side).toBe('him');
    }
  });

  it('"Now." can\u2019t be won, whatever you do (designer: and it mustn\u2019t look that way)', () => {
    // It looks winnable: ten of yours against six in the citadel.
    const yours = (st: WarState) => squadsOf(st, 'you').reduce((n, q) => n + q.strength, 0);
    const start = (): WarState => ({ squads: LESSON.now.squads.map((q) => ({ ...q })), owner: { ...LESSON.now.owner }, cut: [], turn: 1 });
    expect(yours(start())).toBeGreaterThan(squadAt(start(), 'citadel')!.strength);
    // Thousands of games of random play (leaning towards the citadel), and his strategy as you: never taken.
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let game = 0; game < 3000; game++) {
      let s = start();
      for (let turn = 0; turn < LESSON.now.turns; turn++) {
        const cut = powerCutFor(CAPITAL_BOARD, s, 'you');
        s = { ...s, cut: cut ? [cut] : [] };
        const mine = squadsOf(s, 'you').sort(() => rand() - 0.5);
        const orders = game % 10 === 0
          ? chooseOrders(CAPITAL_BOARD, s, 'you', 'war')
          : mine.flatMap((q) => {
              const ways = waysFrom(CAPITAL_BOARD, q.place).map((w) => w.to);
              const at = ways.includes('citadel') && rand() < 0.7 ? 'citadel' : ways[Math.floor(rand() * (ways.length + 1))];
              return at ? [{ squad: q.id, to: at }] : [];
            });
        s = resolve(CAPITAL_BOARD, s, orders).state;
        expect(s.owner.citadel, `game ${game}, turn ${turn}`).toBe('him');
        s = resolve(CAPITAL_BOARD, s, chooseOrders(CAPITAL_BOARD, s, 'him', 'war')).state;
      }
    }
  });

  it('the citadel loses nothing when it holds; in the dark, a squad fights at one less', () => {
    const s: WarState = { squads: [{ id: 'a', side: 'you', place: 'promenade', strength: 5 }, { id: 'c', side: 'him', place: 'citadel', strength: 6 }], owner: {}, cut: [], turn: 1 };
    const r = resolveOne(CAPITAL_BOARD, s, { squad: 'a', to: 'citadel' });
    expect(squadAt(r.state, 'citadel')!.strength).toBe(6);
    expect(defenceOf(CAPITAL_BOARD, 'promenade', 4, ['promenade'])).toBe(3);
    expect(powerCutFor(CAPITAL_BOARD, { ...s, squads: [...s.squads, { id: 'b', side: 'you', place: 'gate', strength: 2 }] }, 'you')).toBe('promenade');
  });

  it('"Now.": played against himself as you, he grinds you down within the turns', () => {
    let s: WarState = { squads: LESSON.now.squads.map((q) => ({ ...q })), owner: { ...LESSON.now.owner }, cut: [], turn: 1 };
    const total = (st: WarState) => squadsOf(st, 'you').reduce((n, q) => n + q.strength, 0);
    const before = total(s);
    for (let turn = 0; turn < LESSON.now.turns; turn++) {
      s = resolve(CAPITAL_BOARD, s, chooseOrders(CAPITAL_BOARD, s, 'you', 'war')).state;
      s = resolve(CAPITAL_BOARD, s, chooseOrders(CAPITAL_BOARD, s, 'him', 'war')).state;
    }
    expect(s.owner.citadel).toBe('him');
    expect(total(s)).toBeLessThan(before);
  });

  it('the lesson’s goals can each be taken: the lifts, then join up for the data centre, then the promenade', () => {
    let s = start();
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r4', to: 'lift_mid' }]).state;
    expect(s.owner.lift_mid).toBe('you');
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r2', to: 'lift_low' }]).state;
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r2', to: 'lift_mid' }]).state;
    expect(squadAt(s, 'lift_mid')!.strength).toBe(4);
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r4', to: 'data' }]).state;
    expect(s.owner.data).toBe('you');
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r1', to: 'lift_low' }]).state;
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r1', to: 'lift_mid' }]).state;
    s = resolve(CAPITAL_BOARD, s, [{ squad: 'r1', to: 'promenade' }], { r1: 'won' }).state;
    expect(LESSON.goals.map((g) => s.owner[g.place])).toEqual(['you', 'you', 'you']);
  });

  it('the scenarios’ fights exist', () => {
    for (const sc of Object.values(SCENARIOS)) for (const enc of Object.values(sc.dropIn)) expect(ENCOUNTERS[enc], enc).toBeDefined();
  });
});
