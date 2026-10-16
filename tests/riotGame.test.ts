import { describe, expect, it } from 'vitest';
import { CASTLE_BOARD, DUEL, FATHER, FATHER_LIST, FATHER_START, LESSON, LOW_DISTRICT_BOARD, PROMENADE_BOARD, RIOT_START, RIOTS, TRANSFER_LIST } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { RIOT_RULES, RISING_STYLE, RiotGame, type Order, type RiotState } from '../src/systems/Riot';
import { besieger, careful, naive, playOut, random, sensible, steady } from '../src/systems/RiotPlayers';

// The war table's game (docs/sequences/chapter-3/war-table.md): the old table's rules with four for the riot,
// and the balance found by simulated play (designer: simple; on the easy side but not really easy).

const g = () => new RiotGame(LOW_DISTRICT_BOARD);
const at = (s: RiotState, place: string) => s.squads.find((q) => q.place === place)!;
const go = (s: RiotState, place: string, to: string): Order => ({ squad: at(s, place).id, to });

describe('the war table: the rules', () => {
  it('every map (both districts, the castle): every street joins two places, and everywhere can be reached', () => {
    for (const board of [LOW_DISTRICT_BOARD, PROMENADE_BOARD, CASTLE_BOARD]) {
      const game = new RiotGame(board);
      const ids = new Set(board.places.map((p) => p.id));
      for (const [a, b] of board.ways) expect(ids.has(a) && ids.has(b), `${a}-${b}`).toBe(true);
      expect(game.upDist.size).toBe(board.places.length);
    }
  });

  it('into an empty place: taken; into your own: joined; into theirs: the bigger number wins and keeps what’s over', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'arch', strength: 5 }, { side: 'guard', place: 'lamp', strength: 2 }, { side: 'rising', place: 'market', strength: 3 }]);
    expect(game.order(s, go(s, 'arch', 'screens')).state.owner.screens).toBe('guard');
    expect(at(game.order(s, go(s, 'lamp', 'arch')).state, 'arch').strength).toBe(7);
    const won = game.order(s, go(s, 'arch', 'market')).state;
    expect(at(won, 'market')).toMatchObject({ side: 'guard', strength: 2 });
  });

  it('a tie holds: the attackers are lost, and the defenders lose as many', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'arch', strength: 3 }, { side: 'rising', place: 'market', strength: 3 }]);
    const t = game.order(s, go(s, 'arch', 'market')).state;
    expect(game.mine(t, 'guard')).toHaveLength(0);
    expect(at(t, 'market').strength).toBe(1);
  });

  it('9 on the square’s 8: taken, though the barricades cost one more (Jack)', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'market', strength: 9 }, { side: 'rising', place: 'square', strength: 8 }]);
    const t = game.order(s, go(s, 'market', 'square')).state;
    expect(game.outcome(t)).toBe('guard');
    expect(at(t, 'square').strength).toBe(1);
  });

  it('the square’s barricades: +1; beaten off, it still wears them down (designer: it looked like a bug when it didn’t)', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'market', strength: 3 }, { side: 'rising', place: 'square', strength: 4 }]);
    const t = game.order(s, go(s, 'market', 'square')).state;
    expect(game.mine(t, 'guard')).toHaveLength(0);
    expect(at(t, 'square').strength).toBe(1);
    const u = game.start([{ side: 'guard', place: 'market', strength: 6 }, { side: 'rising', place: 'square', strength: 4 }]);
    expect(game.outcome(game.order(u, go(u, 'market', 'square')).state)).toBe('guard');
  });

  it('your orders happen in the order you give them: join up, then the two go on together (designer)', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'guard', place: 'stair', strength: 5 }, { side: 'rising', place: 'screens', strength: 7 }]);
    // The 4 into the 5, then the 9 at the screens' street's 7: taken, 2 left.
    const combo = game.turn(s, [go(s, 'lifts', 'stair'), go(s, 'stair', 'screens')], []).state;
    expect(at(combo, 'screens')).toMatchObject({ side: 'guard', strength: 2 });
    // The other way round: the 5 goes alone (and is beaten off), and the 4 just takes the stair.
    const apart = game.turn(s, [go(s, 'stair', 'screens'), go(s, 'lifts', 'stair')], []).state;
    expect(at(apart, 'screens').side).toBe('rising');
    expect(at(apart, 'stair')).toMatchObject({ side: 'guard', strength: 4 });
  });

  it('the rising\u2019s moves happen all at once', () => {
    const game = g();
    const s = game.start([{ side: 'rising', place: 'wash', strength: 4 }, { side: 'rising', place: 'weavers', strength: 3 }]);
    const t = game.turn(s, [], [go(s, 'wash', 'weavers'), go(s, 'weavers', 'back')]).state;
    expect(at(t, 'weavers').strength).toBe(4);
    expect(at(t, 'back').strength).toBe(3);
  });

  it('the square grows by 1 a turn (and over 9 sends a crowd out); the guard get 3 a turn at the lifts’ foot, while it’s theirs', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 5 }]);
    const t = game.turn(s, [], []).state;
    expect(at(t, 'square').strength).toBe(6);
    expect(at(t, 'lifts').strength).toBe(7);
    // Over 9, it sends a crowd of 2 out, towards the guard.
    const big = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 9 }]);
    const u = game.turn(big, [], []).state;
    expect(at(u, 'square').strength).toBe(8);
    expect(game.mine(u, 'rising').filter((q) => q.place !== 'square').map((q) => q.strength)).toEqual([2]);
    const lost = game.start([{ side: 'rising', place: 'lifts', strength: 2 }, { side: 'rising', place: 'square', strength: 8 }]);
    expect(game.mine(game.turn(lost, [], []).state, 'guard')).toHaveLength(0);
  });

  it('the power cut: they can’t move, the square doesn’t grow, and they fight at 1 less; then it needs time', () => {
    const game = g();
    const s = game.cutPower(game.start([{ side: 'guard', place: 'market', strength: 8 }, { side: 'rising', place: 'square', strength: 8 }]), 'square');
    expect(game.defence(s, 'square', 8)).toBe(8);
    expect(game.dests(s, at(s, 'square'))).toEqual([]);
    const t = game.turn(s, [], []).state;
    expect(at(t, 'square').strength).toBe(8);
    expect(game.canCut(t)).toBe(false);
  });

  it('dawn, and the square still the rising’s: they’ve won it', () => {
    const game = g();
    let s = game.start(RIOT_START);
    for (let i = 0; i < game.rules.dawn; i++) s = game.turn(s, [], []).state;
    expect(game.outcome(s)).toBe('rising');
  });

  it('the fights it goes down to exist', () => {
    expect(ENCOUNTERS.riot_square).toBeDefined();
    expect(ENCOUNTERS[LESSON.dropIn.encounter]).toBeDefined();
  });
});

describe('the war table: Day 4, the riot (simulated play)', () => {
  const game = new RiotGame(RIOTS.riot_low!.board);
  const start = () => game.start(RIOT_START);

  it('a careful player takes the square in good time; a sensible one does too', () => {
    const c = playOut(game, start(), careful());
    expect(c.winner).toBe('guard');
    expect(c.state.turn).toBeLessThanOrEqual(12);
    // (Chaining squads into one strike mustn't let it rush the square.)
    expect(c.state.turn).toBeGreaterThanOrEqual(6);
    expect(playOut(game, start(), sensible()).winner).toBe('guard');
  }, 120000);

  it('a naive player (straight at the square, no power cut, no fortify: designer, on a first go) usually wins, late', () => {
    // (Balanced against this, not only the clever players: Jack's version had sensible play at 97%, and the naive at 0.)
    const riot = new RiotGame(RIOTS.riot_low!.board, { ...game.rules, ...(RIOTS.riot_low as { rules?: object }).rules });
    const results = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => playOut(riot, riot.start(RIOT_START, seed), naive()));
    expect(results.filter((r) => r.winner === 'guard').length).toBeGreaterThanOrEqual(6);
    for (const r of results) if (r.winner === 'guard') expect(r.state.turn).toBeGreaterThanOrEqual(8);
  }, 120000);

  it('random orders, or none, lose it', () => {
    expect(playOut(game, start(), random(3)).winner).toBe('rising');
    expect(playOut(game, start(), () => ({ orders: [] })).winner).toBe('rising');
  }, 120000);
});

describe('the war table: Day 2, the lesson', () => {
  const game = new RiotGame(LESSON.board);

  it('every goal can be taken, in order, against his steady guard', () => {
    // A plain way through: the wash house into the Weavers' Row; the tenements join the well, then the market;
    // the square's crowd to the screens.
    let s = game.start(LESSON.squads);
    const turn = (orders: Order[]) => (s = game.turn(s, orders, steady()(game, s).orders).state);
    turn([go(s, 'wash', 'weavers')]);
    expect(s.owner.weavers).toBe('rising');
    turn([go(s, 'tenements', 'well')]);
    turn([go(s, 'well', 'market')]);
    expect(s.owner.market).toBe('rising');
    turn([go(s, 'square', 'screens')]);
    expect(s.owner.screens).toBe('rising');
  });

  it('"Now.": whatever the rising does, he takes the square, in a few turns (designer: make it impossible)', () => {
    const toSquare = (gm: RiotGame, s: RiotState): Order[] => gm.mine(s, 'rising').filter((q) => q.place !== gm.heart && gm.near(q.place, gm.heart)).map((q) => ({ squad: q.id, to: gm.heart }));
    // Everything at his lifts' foot, to cut his guard off (designer: nearly beat him that way).
    const toLifts = (gm: RiotGame, s: RiotState): Order[] => gm.mine(s, 'rising').filter((q) => q.place !== gm.heart).map((q) => {
      const d = (p: string) => { const seen = new Map([[p, 0]]); const todo = [p]; while (todo.length) { const x = todo.shift()!; for (const n of gm.adj.get(x)!) if (!seen.has(n)) (seen.set(n, seen.get(x)! + 1), todo.push(n)); } return seen.get(gm.lifts) ?? 99; };
      return { squad: q.id, to: [...gm.adj.get(q.place)!].sort((a, b) => d(a) - d(b))[0]! };
    });
    for (const rising of [(gm: RiotGame, s: RiotState) => gm.risingOrders(s), toSquare, toLifts, () => []]) {
      const now = new RiotGame(LESSON.board, { ...game.rules, ...LESSON.rules });
      for (const seed of [1, 2, 3]) {
        const r = playOut(now, now.start(LESSON.now.squads, seed), careful(), rising, LESSON.now.turns);
        expect(r.winner).toBe('guard');
        expect(r.state.turn).toBeLessThanOrEqual(6);
      }
    }
  }, 120000);
});

describe('the war table: Day 6, the duel with your friend (simulated play)', () => {
  // You hold the keep (the rising's side); he has the bigger army, played sensibly, never emptying his camp.
  // Take his camp to win (designer: the objective's his main base; no turn limit for now). Your orders go first,
  // in order; his, shown at the start of the turn, all at once.
  const game = () => {
    const g = new RiotGame(DUEL.board, { ...RIOT_RULES, ...DUEL.rules });
    g.style = { ...RISING_STYLE, ...DUEL.style };
    return g;
  };
  type You = (g: RiotGame, s: RiotState) => Order[];
  const duel = (g: RiotGame, seed: number, you: You, turns = 40) => {
    const him = besieger();
    let s = g.start(DUEL.squads, seed);
    for (let i = 0; i < turns && !g.outcome(s); i++) s = g.turn(s, you(g, s), him(g, s).orders).state;
    return { winner: g.outcome(s), turn: s.turn };
  };
  const steps = (g: RiotGame, a: string, b: string) => {
    const seen = new Map([[a, 0]]);
    const todo = [a];
    while (todo.length) {
      const p = todo.shift()!;
      if (p === b) return seen.get(p)!;
      for (const n of g.adj.get(p)!) if (!seen.has(n)) (seen.set(n, seen.get(p)! + 1), todo.push(n));
    }
    return 99;
  };
  // A first go at his camp (as a person plays it): everyone but the keep heads for the camp's door, beating what
  // they can on the way; whoever's already at the door waits for the rest to join it, and goes in once it's enough.
  const firstGo: You = (g, s) => {
    const orders: Order[] = [];
    const camp = g.squadAt(s, g.lifts);
    const need = camp?.side === 'guard' ? g.defence(s, g.lifts, camp.strength) : 0;
    const lead = g.mine(s, 'rising').filter((q) => g.near(q.place, g.lifts)).sort((a, b) => b.strength - a.strength)[0];
    for (const q of [...g.mine(s, 'rising')].sort((a, b) => b.strength - a.strength)) {
      if (q.place === g.heart) continue;
      const ways = g.dests(s, q);
      if (ways.includes(g.lifts) && q.strength > need) {
        orders.push({ squad: q.id, to: g.lifts });
        continue;
      }
      const beat = ways.find((to) => {
        const t = g.squadAt(s, to);
        return to !== g.lifts && t?.side === 'guard' && q.strength > g.defence(s, to, t.strength);
      });
      if (beat) {
        orders.push({ squad: q.id, to: beat });
        continue;
      }
      if (lead && q !== lead && ways.includes(lead.place)) {
        orders.push({ squad: q.id, to: lead.place });
        continue;
      }
      if (q === lead) continue;
      const step = ways.filter((to) => g.squadAt(s, to)?.side !== 'guard').sort((a, b) => steps(g, a, g.lifts) - steps(g, b, g.lifts))[0];
      if (step && steps(g, step, g.lifts) < steps(g, q.place, g.lifts)) orders.push({ squad: q.id, to: step });
    }
    return orders;
  };

  it('a first go usually takes his camp (designer: as easy as the riot)', () => {
    const results = Array.from({ length: 16 }, (_, i) => duel(game(), i + 1, firstGo));
    expect(results.filter((r) => r.winner === 'rising').length).toBeGreaterThanOrEqual(8);
  }, 120000);

  it('both bases muster new men every turn onto a road next to them; a garrison never grows; cut off, none come', () => {
    const g = game();
    const s = g.start([{ side: 'rising', place: 'keep', strength: 6 }, { side: 'guard', place: 'camp', strength: 8 }]);
    const t = g.turn(s, [], []).state;
    expect(g.squadAt(t, 'keep')!.strength).toBe(6);
    expect(g.squadAt(t, 'camp')!.strength).toBe(8);
    expect(g.mine(t, 'rising').filter((q) => q.place !== 'keep').map((q) => [q.place, q.strength])).toEqual([['gate', 2]]);
    expect(g.mine(t, 'guard').filter((q) => q.place !== 'camp').map((q) => q.strength)).toEqual([2]);
    // Every road out of the keep held by him: none come.
    const sieged = g.start([{ side: 'rising', place: 'keep', strength: 6 }, ...['postern', 'yard', 'gate'].map((place) => ({ side: 'guard' as const, place, strength: 3 })), { side: 'guard', place: 'camp', strength: 8 }]);
    expect(g.mine(g.turn(sieged, [], []).state, 'rising')).toHaveLength(1);
  });

  it('he keeps moving (designer: he played too static)', () => {
    const g = game();
    const s = g.start(DUEL.squads, 1);
    const his = besieger()(g, s).orders;
    expect(his.length).toBeGreaterThanOrEqual(6);
  });

  it('the map is considerably bigger than the riot’s (designer), on a table bigger than the screen', () => {
    expect(CASTLE_BOARD.places.length).toBeGreaterThanOrEqual(LOW_DISTRICT_BOARD.places.length * 1.7);
    for (const p of CASTLE_BOARD.places) {
      expect(p.x).toBeLessThanOrEqual(CASTLE_BOARD.width! - 30);
      expect(p.y).toBeLessThanOrEqual(CASTLE_BOARD.height! - 30);
    }
  });

  it('you have fewer troops, technically', () => {
    const total = (side: string) => DUEL.squads.filter((q) => q.side === side).reduce((n, q) => n + q.strength, 0);
    expect(total('rising')).toBeLessThan(total('guard'));
  });

  it('doing nothing, or random orders, loses the keep', () => {
    for (const seed of [1, 2, 3]) {
      expect(duel(game(), seed, () => [], 30).winner).toBe('guard');
      let r = seed;
      const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      expect(duel(game(), seed, (g, s) => g.mine(s, 'rising').map((q) => {
        const o = [q.place, ...g.dests(s, q)];
        return { squad: q.id, to: o[Math.floor(rnd() * o.length)]! };
      })).winner).toBe('guard');
    }
  }, 120000);
});

describe('the war table: Day 8, against your father (simulated play)', () => {
  const game = new RiotGame(FATHER.board, { ...RIOT_RULES, ...FATHER.rules });
  // The second game: the list off the table, but for the one you kept.
  const listed = (kept?: string) => {
    const off = new Set(TRANSFER_LIST.filter((l) => !l.left && !(l.name && l.name === kept)).map((l) => l.place));
    const left = new Map(TRANSFER_LIST.filter((l) => l.left).map((l) => [l.place, l.left!]));
    return FATHER_START.filter((q) => !off.has(q.place)).map((q) =>
      q.place === TRANSFER_LIST.find((l) => l.name === kept)?.place ? { ...q, strength: FATHER_LIST.kept! } : left.has(q.place) ? { ...q, strength: left.get(q.place)! } : q);
  };

  it('winnable but difficult (designer): harder than the riot for a first go, which still wins it some of the time; careful play wins', () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const first = seeds.filter((seed) => playOut(game, game.start(FATHER_START, seed), naive()).winner === 'guard').length;
    expect(first).toBeGreaterThanOrEqual(3);
    expect(first).toBeLessThanOrEqual(9);
    for (const seed of [1, 2, 3]) expect(playOut(game, game.start(FATHER_START, seed), careful()).winner).toBe('guard');
  }, 300000);

  it('with the list off the table, it\u2019s easy, even with one name kept', () => {
    for (const kept of ['none', 'barkeep', 'kid', 'woman']) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const r = playOut(game, game.start(listed(kept), seed), naive());
        expect(r.winner).toBe('guard');
        expect(r.state.turn).toBeLessThanOrEqual(6);
      }
    }
  }, 300000);

  it('the list is crowds on the table, and every name you can strike is one of them', () => {
    for (const l of TRANSFER_LIST) expect(FATHER_START.some((q) => q.side === 'rising' && q.place === l.place)).toBe(true);
    expect(TRANSFER_LIST.map((l) => l.name).filter(Boolean).sort()).toEqual(['barkeep', 'kid', 'woman']);
    expect(RIOTS[FATHER.next!]).toBe(FATHER_LIST);
  });
});
