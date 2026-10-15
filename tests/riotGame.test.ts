import { describe, expect, it } from 'vitest';
import { LESSON, LOW_DISTRICT_BOARD, PROMENADE_BOARD, RIOT_START, RIOTS } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { RiotGame, type Order, type RiotState } from '../src/systems/Riot';
import { careful, playOut, random, sensible, steady } from '../src/systems/RiotPlayers';

// The war table's game (docs/sequences/chapter-3/war-table.md): the old table's rules with four for the riot,
// and the balance found by simulated play (designer: simple; on the easy side but not really easy).

const g = () => new RiotGame(LOW_DISTRICT_BOARD);
const at = (s: RiotState, place: string) => s.squads.find((q) => q.place === place)!;
const go = (s: RiotState, place: string, to: string): Order => ({ squad: at(s, place).id, to });

describe('the war table: the rules', () => {
  it('both districts’ maps: every street joins two places, and everywhere can be reached', () => {
    for (const board of [LOW_DISTRICT_BOARD, PROMENADE_BOARD]) {
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

  it('the square grows by 1 a turn (and over 9 sends a crowd out); the guard get 2 a turn at the lifts’ foot, while it’s theirs', () => {
    const game = g();
    const s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 5 }]);
    const t = game.turn(s, [], []).state;
    expect(at(t, 'square').strength).toBe(6);
    expect(at(t, 'lifts').strength).toBe(6);
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

  it('"Now.": whatever the rising does, he takes the square, in a few turns, never at once', () => {
    const toSquare = (gm: RiotGame, s: RiotState): Order[] => gm.mine(s, 'rising').filter((q) => q.place !== gm.heart && gm.near(q.place, gm.heart)).map((q) => ({ squad: q.id, to: gm.heart }));
    for (const rising of [(gm: RiotGame, s: RiotState) => gm.risingOrders(s), toSquare, () => []]) {
      const r = playOut(game, game.start(LESSON.now.squads), careful(), rising, LESSON.now.turns);
      expect(r.winner).toBe('guard');
      expect(r.state.turn).toBeGreaterThanOrEqual(3);
    }
  }, 120000);
});
