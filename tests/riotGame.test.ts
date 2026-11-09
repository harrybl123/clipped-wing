import { describe, expect, it } from 'vitest';
import { CASTLE_BOARD, DUEL, FATHER, FATHER_LIST, FATHER_START, LESSON, LOW_DISTRICT_BOARD, PROMENADE_BOARD, RIOT_START, RIOTS, TRANSFER_LIST, TUTORIAL, TUTORIAL_TOPICS, type RiotScenario } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { StoryBridge } from '../src/systems/StoryBridge';
import { storyJson } from './compiledStory';
import { RIOT_RULES, RiotGame, type Order, type RiotState } from '../src/systems/Riot';
import { careful, naive, playOut, random, sensible, steady } from '../src/systems/RiotPlayers';

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
    // (With Jack's elite squads, clashes and mystery squares, about 73% over 60 games; with the skirmish's bonuses
    // and towers too, about 66%: 32 here.)
    const results = Array.from({ length: 32 }, (_, i) => playOut(riot, riot.start(RIOT_START, i + 1), naive()));
    expect(results.filter((r) => r.winner === 'guard').length).toBeGreaterThanOrEqual(19);
    for (const r of results) if (r.winner === 'guard') expect(r.state.turn).toBeGreaterThanOrEqual(8);
  }, 120000);

  it('random orders, or none, lose it', () => {
    expect(playOut(game, start(), random(3)).winner).toBe('rising');
    expect(playOut(game, start(), () => ({ orders: [] })).winner).toBe('rising');
  }, 120000);
});

describe('the war table: Day 2, the lesson', () => {
  const game = new RiotGame(LESSON.board, { ...RIOT_RULES, ...LESSON.rules });

  it('just numbers (designer: the first go is the table we started with): no fortify, no split, nothing on the map', () => {
    const s = game.start(LESSON.squads);
    expect(game.canFortify(s, 'rising')).toBe(false);
    expect(game.canSplit(s, 'rising')).toBe(false);
    for (const k of ['rumble', 'elites', 'clash', 'mystery', 'audience', 'church', 'barracks', 'architect', 'towers', 'script'] as const) expect(LESSON.rules?.[k]).toBeUndefined();
    let t = s;
    for (let i = 0; i < 12; i++) t = game.turn(t, [], []).state;
    expect([t.rumble, t.crest, t.mystery].filter(Boolean)).toHaveLength(0);
    expect(LESSON.next).toBe('tutorial');
  });

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

describe('the war table: Day 2, the tutorial (the table as it really is)', () => {
  const game = new RiotGame(TUTORIAL.board, { ...RIOT_RULES, ...TUTORIAL.rules });

  it('it’s Day 4’s game with everything Jack added, but each thing comes on its turn, next to your squads and away from theirs', () => {
    let s = game.start(TUTORIAL.squads, 7);
    const seen: { turn: number; type: string; at: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const r = game.turn(s, [], []);
      for (const e of r.events) if (e.type.endsWith('Appears')) seen.push({ turn: r.state.turn, type: e.type, at: (e as { at: string }).at });
      s = r.state;
      // (Nobody takes them here: each goes after its three turns, and the next waits for the map to clear.)
    }
    expect(seen.map((e) => e.type).slice(0, 2)).toEqual(['rumbleAppears', 'crestAppears']);
    expect(seen[0]!.turn).toBe(2);
    expect(seen[1]!.turn).toBe(5);
    // Next to one of yours.
    const s1 = game.turn(game.start(TUTORIAL.squads, 7), [], []).state;
    expect(game.adj.get(seen[0]!.at)!.some((n) => game.squadAt(s1, n)?.side === 'guard')).toBe(true);
  });

  it('taken as they come, all seven appear by turn 9, the diviner’s mark among them', () => {
    let s = game.start(TUTORIAL.squads, 3);
    const kinds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = game.turn(s, [], []);
      for (const e of r.events) if (e.type.endsWith('Appears')) kinds.push(e.type === 'mysteryAppears' ? `mystery:${e.mark}` : e.type);
      s = r.state;
      // (As if each were taken at once.)
      s = { ...s, rumble: null, crest: null, mystery: null, audience: null, church: null, barracks: null, architect: null };
    }
    expect(kinds).toEqual(['rumbleAppears', 'crestAppears', 'mystery:diviner', 'audienceAppears', 'barracksAppears', 'architectAppears', 'churchAppears']);
  });

  it('nothing comes by the dice, and dawn is later than the riot’s', () => {
    expect(TUTORIAL.rules?.dawn).toBeGreaterThan(18);
    for (const k of ['rumble', 'mystery', 'church', 'barracks', 'architect'] as const) expect(TUTORIAL.rules?.[k]?.chance).toBe(0);
    expect(TUTORIAL.rules?.audience?.call.chance).toBe(0);
  });

  it('a first go takes the square more often than not', () => {
    const won = Array.from({ length: 16 }, (_, i) => playOut(game, game.start(TUTORIAL.squads, i + 1), naive())).filter((r) => r.winner === 'guard').length;
    expect(won).toBeGreaterThanOrEqual(9);
  }, 300000);

  it('every topic has its card, and every game’s lines are in the story', () => {
    const story = new StoryBridge(storyJson());
    const knots = [
      ...TUTORIAL_TOPICS.map((t) => `c3tut_${t}`),
      ...Object.values(TUTORIAL.tutorial!).filter((v): v is string => typeof v === 'string'),
      TUTORIAL.knots.intro,
      ...Object.values(DUEL.duel!),
      ...Object.values(LESSON.knots), ...Object.values(LESSON.firsts), ...Object.values(LESSON.now.knots), ...LESSON.goals.flatMap((g) => [g.start, ...(g.done ? [g.done] : [])]),
      ...Object.values(FATHER.knots), ...Object.values(FATHER_LIST.knots),
    ];
    for (const k of knots) expect(() => story.startKnot(k), k).not.toThrow();
  });
});

describe('the war table: Day 6, the duel with your friend (simulated play)', () => {
  // Jack's skirmish on the crag (designer: wire his gameplay into the chapter): you hold the keep (the guard), he's
  // the army in the siege camp (the rebels, Jack's computer player). Take his camp to win; he takes your keep, he has.
  const game = () => new RiotGame(DUEL.board, { ...RIOT_RULES, ...DUEL.rules });

  it('it is the skirmish, with the story round it, and his camp is the siege camp', () => {
    const sk = RIOTS.skirmish as RiotScenario;
    expect(DUEL.skirmish).toBe(true);
    expect(DUEL.rules).toBe(sk.rules);
    expect(DUEL.squads).toBe(sk.squads);
    expect(DUEL.duel).toMatchObject({ won: 'c3day6_duel_won', lost: 'c3day6_duel_lost', after: 'c3day6_caught' });
    for (const b of [DUEL.board, DUEL.views!.in, DUEL.views!.out]) expect(b.places.find((p) => p.heart)!.name).toBe('The siege camp');
  });

  it('even armies (a bigger one for him and a first go never took his camp): sensible play always takes it', () => {
    const total = (side: string) => DUEL.squads.filter((q) => q.side === side).reduce((n, q) => n + q.strength, 0);
    expect(total('guard')).toBe(total('rising'));
    for (const seed of [1, 2, 3, 4]) expect(playOut(game(), game().start(DUEL.squads, seed), sensible()).winner).toBe('guard');
  }, 300000);

  it('the map is considerably bigger than the riot’s (designer)', () => {
    expect(CASTLE_BOARD.places.length).toBeGreaterThanOrEqual(LOW_DISTRICT_BOARD.places.length * 1.7);
    expect(DUEL.views!.in.width).toBeGreaterThan(480);
  });

  it('doing nothing loses the keep', () => {
    for (const seed of [1, 2]) expect(playOut(game(), game().start(DUEL.squads, seed), () => ({ orders: [] })).winner).toBe('rising');
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
    // (Retuned with Jack's additions: a first go about three in five, as the riot.)
    const first = Array.from({ length: 32 }, (_, i) => playOut(game, game.start(FATHER_START, i + 1), naive())).filter((r) => r.winner === 'guard').length;
    expect(first).toBeGreaterThanOrEqual(14);
    expect(first).toBeLessThanOrEqual(26);
    for (const seed of [1, 2, 3]) expect(playOut(game, game.start(FATHER_START, seed), careful()).winner).toBe('guard');
  }, 300000);

  it('the guard all gone, and the lifts’ foot theirs: it’s over (designer: it didn’t end)', () => {
    const s = game.start([{ side: 'rising', place: 'square', strength: 5 }, { side: 'rising', place: 'lifts', strength: 2 }]);
    expect(game.outcome(s)).toBe('rising');
    // (The lifts' foot still the guard's: more can come down.)
    expect(game.outcome(game.start([{ side: 'rising', place: 'square', strength: 5 }]))).toBeNull();
  });

  it('it has everything Jack added that the riot has', () => {
    const riot = (RIOTS.riot_low as RiotScenario).rules!;
    for (const k of ['elites', 'clash', 'mystery', 'audience', 'church', 'barracks', 'architect', 'towers'] as const) expect(FATHER.rules?.[k]).toEqual(riot[k]);
  });

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
