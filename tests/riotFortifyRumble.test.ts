import { describe, expect, it } from 'vitest';
import { LOW_DISTRICT_BOARD, RIOTS } from '../src/data/warTable';
import { HERO, RIOT_RULES, RUMBLE, RiotGame, type Order, type RiotState } from '../src/systems/Riot';

// Jack's two for the war table (proposed for the designer; docs/sequences/chapter-3/war-table.md): fortify,
// and rumbles.

const at = (s: RiotState, place: string) => s.squads.find((q) => q.place === place);
const go = (s: RiotState, place: string, to: string): Order => ({ squad: at(s, place)!.id, to });

describe('the war table: fortify (Jack)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD);

  it('nobody can attack a squad that’s dug in: the attack doesn’t happen, and both stay as they were', () => {
    const s = game.start([{ side: 'guard', place: 'arch', strength: 2 }, { side: 'rising', place: 'market', strength: 3 }]);
    const r = game.order(game.fortify(s, at(s, 'arch')!.id), go(s, 'market', 'arch'));
    expect(r.events).toEqual([{ type: 'blocked', at: 'arch', side: 'rising' }]);
    expect(at(r.state, 'arch')).toMatchObject({ side: 'guard', strength: 2 });
    expect(at(r.state, 'market')).toMatchObject({ side: 'rising', strength: 3 });
  });

  it('a squad that’s dug in doesn’t move; given an order after all (unfortify), it does', () => {
    const s = game.fortify(game.start([{ side: 'guard', place: 'arch', strength: 5 }]), 'q0');
    expect(at(game.order(s, go(s, 'arch', 'screens')).state, 'arch')).toBeDefined();
    const u = game.unfortify(s, 'arch');
    expect(at(game.order(u, go(u, 'arch', 'screens')).state, 'screens')).toBeDefined();
  });

  it('dug in, it still gets its +2 at the lifts and +1 in the square (Jack: it needed more benefit); it lasts the one turn', () => {
    const s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 5 }]);
    const dug = game.fortify(game.fortify(s, at(s, 'lifts')!.id), at(s, 'square')!.id);
    const t = game.turn(dug, [], []).state;
    expect(at(t, 'lifts')!.strength).toBe(6);
    expect(at(t, 'square')!.strength).toBe(6);
    expect(t.fortified).toEqual([]);
  });
});

describe('the war table: rumbles (Jack)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, rumble: RUMBLE });

  it('a squad onto a rumble sets it off: every squad next to it, either side, takes 1 to 3; one that’s dug in, nothing', () => {
    let s = game.start([
      { side: 'guard', place: 'stair', strength: 2 },
      { side: 'guard', place: 'lifts', strength: 9 },
      { side: 'rising', place: 'market', strength: 9 },
      { side: 'guard', place: 'lamp', strength: 9 },
    ], 7);
    s = { ...game.fortify(s, at(s, 'lamp')!.id), rumble: { place: 'arch', left: 2 } };
    const r = game.order(s, go(s, 'stair', 'arch'));
    const rumble = r.events.find((e) => e.type === 'rumble');
    expect(rumble).toMatchObject({ type: 'rumble', at: 'arch', side: 'guard' });
    if (rumble?.type !== 'rumble') throw new Error('no rumble');
    expect(rumble.hits.map((h) => h.place).sort()).toEqual(['lifts', 'market']);
    for (const h of rumble.hits) {
      expect(h.damage).toBeGreaterThanOrEqual(1);
      expect(h.damage).toBeLessThanOrEqual(3);
      expect(at(r.state, h.place)!.strength).toBe(9 - h.damage);
    }
    expect(at(r.state, 'lamp')!.strength).toBe(9);
    expect(at(r.state, 'arch')!.strength).toBe(2); // the one that set it off: unhurt
    expect(r.state.rumble).toBeNull();
  });

  it('the same dice, the same rumble (a game can be played again exactly)', () => {
    const s = { ...game.start([{ side: 'guard', place: 'stair', strength: 2 }, { side: 'rising', place: 'market', strength: 9 }], 42), rumble: { place: 'arch', left: 2 } };
    expect(game.order(s, go(s, 'stair', 'arch')).state).toEqual(game.order(s, go(s, 'stair', 'arch')).state);
  });

  it('one appears on an empty street (not the square or the lifts’ foot) and stays two turns', () => {
    const always = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, rumble: { ...RUMBLE, chance: 1 } });
    let s = always.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 5 }], 3);
    s = always.turn(s, [], []).state;
    const r = s.rumble!;
    expect(r.left).toBe(2);
    expect(['square', 'lifts']).not.toContain(r.place);
    expect(at(s, r.place)).toBeUndefined();
    s = always.turn(s, [], []).state;
    expect(s.rumble).toEqual({ place: r.place, left: 1 });
    s = always.turn(s, [], []).state;
    expect(s.rumble).toBeNull();
  });

  it('the rising go for a rumble that’ll hurt the guard round it more than their own', () => {
    const s = { ...game.start([
      { side: 'rising', place: 'market', strength: 3 },
      { side: 'guard', place: 'lifts', strength: 6 },
      { side: 'guard', place: 'lamp', strength: 6 },
    ]), rumble: { place: 'arch', left: 2 } };
    expect(game.risingOrders(s)).toContainEqual(go(s, 'market', 'arch'));
  });

  it('rumbles are in the riot, not the lesson', () => {
    expect(RIOTS.riot_low!.kind === 'riot' && RIOTS.riot_low!.rules?.rumble).toBeTruthy();
    expect(RIOTS.lesson!.kind).toBe('lesson');
  });
});

describe('the war table: fortify waits, like the power cut (Jack)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD);

  it('once every 3 turns; taken back the same turn, you have it again', () => {
    let s = game.start([{ side: 'guard', place: 'arch', strength: 5 }, { side: 'guard', place: 'lamp', strength: 5 }]);
    s = game.fortify(s, at(s, 'arch')!.id);
    expect(s.fortified).toEqual(['arch']);
    // Not a second one this turn.
    expect(game.fortify(s, at(s, 'lamp')!.id).fortified).toEqual(['arch']);
    // Taken back: it can go on the other instead.
    const back = game.unfortify(s, 'arch');
    expect(game.canFortify(back, 'guard')).toBe(true);
    expect(game.fortify(back, at(back, 'lamp')!.id).fortified).toEqual(['lamp']);
    // Two turns on, still waiting; three, ready.
    s = game.turn(s, [], []).state;
    expect(game.fortifyIn(s, 'guard')).toBe(2);
    s = game.turn(game.turn(s, [], []).state, [], []).state;
    expect(game.canFortify(s, 'guard')).toBe(true);
  });
});

describe('the war table: split (Jack, a trial)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD);

  it('the bigger half goes (7: 4 go, 3 stay), and the rest can be sent another way the same turn', () => {
    const s = game.start([{ side: 'guard', place: 'arch', strength: 7 }]);
    const id = at(s, 'arch')!.id;
    const t = game.turn(s, [{ squad: id, to: 'screens', split: true }, { squad: id, to: 'lamp' }], []).state;
    expect(at(t, 'screens')).toMatchObject({ side: 'guard', strength: 4 });
    expect(at(t, 'lamp')).toMatchObject({ side: 'guard', strength: 3 });
    expect(at(t, 'arch')).toBeUndefined();
  });

  it('a split half fights like any squad; a 1 can’t split', () => {
    const s = game.start([{ side: 'guard', place: 'arch', strength: 9 }, { side: 'rising', place: 'market', strength: 3 }]);
    const t = game.order(s, { squad: at(s, 'arch')!.id, to: 'market', split: true }).state;
    expect(at(t, 'market')).toMatchObject({ side: 'guard', strength: 2 });
    expect(at(t, 'arch')!.strength).toBe(4);
    const one = game.start([{ side: 'guard', place: 'arch', strength: 1 }]);
    expect(game.order(one, { squad: 'q0', to: 'screens', split: true }).events).toEqual([]);
  });
});

describe('the war table: the hero (Jack, a trial)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, hero: HERO });
  const hero = (place: string) => ({ side: 'guard' as const, place, strength: 7, hero: true });

  it('goes two streets, through an empty place or its own, never through theirs', () => {
    const s = game.start([]);
    const st = { ...s, squads: [{ id: 'h', ...hero('lifts') }], nextId: 1 };
    const t = game.order(st, { squad: 'h', to: 'market' }).state; // lifts → arch/lamp → market
    expect(at(t, 'market')?.hero).toBe(true);
    const blocked = { ...st, squads: [{ id: 'h', ...hero('lifts') }, { id: 'r1', side: 'rising' as const, place: 'arch', strength: 1 }, { id: 'r2', side: 'rising' as const, place: 'lamp', strength: 1 }], nextId: 3 };
    expect(game.dests(blocked, blocked.squads[0]!)).not.toContain('market');
  });

  it('always 7: it wins without losing any, nobody joins it, and a rumble doesn’t touch it', () => {
    const s = { ...game.start([]), squads: [{ id: 'h', ...hero('arch') }, { id: 'g', side: 'guard' as const, place: 'lamp', strength: 3 }, { id: 'r', side: 'rising' as const, place: 'market', strength: 5 }], nextId: 3 };
    const won = game.order(s, { squad: 'h', to: 'market' }).state;
    expect(at(won, 'market')).toMatchObject({ hero: true, strength: 7 });
    expect(game.dests(s, s.squads[1]!)).not.toContain('arch');
    const rumbled = game.order({ ...s, rumble: { place: 'stair', left: 2 }, squads: [...s.squads, { id: 'g2', side: 'guard' as const, place: 'back', strength: 2 }] }, { squad: 'g2', to: 'stair' }).state;
    expect(at(rumbled, 'arch')).toMatchObject({ hero: true, strength: 7 });
  });

  it('now and then the reinforcements come as a hero instead of +2', () => {
    const always = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, hero: { ...HERO, chance: 1 } });
    const t = always.turn(always.start([{ side: 'guard', place: 'lifts', strength: 4 }]), [], []).state;
    expect(at(t, 'lifts')!.strength).toBe(4);
    expect(t.squads.filter((q) => q.hero)).toHaveLength(1);
    // Only one at a time.
    expect(always.turn(t, [], []).state.squads.filter((q) => q.hero)).toHaveLength(1);
  });
});

describe('the war table: their hero, the bastard (Jack, a trial)', () => {
  const always = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, hero: { ...HERO, chance: 1 } });

  it('now and then, instead of growing, the square sends one out onto a street next to it', () => {
    const s = always.start([{ side: 'rising', place: 'square', strength: 6 }]);
    const r = always.turn(s, [], []);
    const theirs = r.state.squads.find((q) => q.hero && q.side === 'rising')!;
    expect(theirs.strength).toBe(7);
    expect(always.near(theirs.place, 'square')).toBe(true);
    expect(at(r.state, 'square')!.strength).toBe(6); // no growth that turn
    expect(r.events).toContainEqual({ type: 'heroArrives', at: theirs.place, side: 'rising' });
    // Only one at a time.
    expect(always.turn(r.state, [], []).state.squads.filter((q) => q.hero && q.side === 'rising')).toHaveLength(1);
  });

  it('it goes up to two streets for a squad of the guard it beats, the lifts’ foot first', () => {
    const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, hero: HERO });
    const s = { ...game.start([]), squads: [
      { id: 'b', side: 'rising' as const, place: 'market', strength: 7, hero: true },
      { id: 'g1', side: 'guard' as const, place: 'lifts', strength: 5 },
      { id: 'g2', side: 'guard' as const, place: 'yards', strength: 4 },
    ], nextId: 3 };
    expect(game.risingOrders(s)).toContainEqual({ squad: 'b', to: 'lifts' });
  });
});
