import { describe, expect, it } from 'vitest';
import { LOW_DISTRICT_BOARD, RIOTS, type RiotScenario } from '../src/data/warTable';
import { ARCHITECT, AUDIENCE, BARRACKS, BROTHEL, CHURCH, CLASH, ELITE_SQUAD, MYSTERY, REBEL, RIOT_RULES, RUMBLE, RiotGame, type Card, type Order, type RiotEvent, type RiotState } from '../src/systems/Riot';

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

  it('dug in, it still gets its +3 at the lifts and +1 in the square (Jack: it needed more benefit); it lasts the one turn', () => {
    const s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 5 }]);
    const dug = game.fortify(game.fortify(s, at(s, 'lifts')!.id), at(s, 'square')!.id);
    const t = game.turn(dug, [], []).state;
    expect(at(t, 'lifts')!.strength).toBe(7);
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
    expect(game.risingOrders(s)).toContainEqual({ ...go(s, 'market', 'arch'), side: 'rising' });
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

  it('once every 3 turns (Jack): a second split the same turn doesn’t happen, nor the next two turns', () => {
    let s = game.start([{ side: 'guard', place: 'arch', strength: 6 }, { side: 'guard', place: 'lamp', strength: 6 }]);
    const [a, b] = [at(s, 'arch')!.id, at(s, 'lamp')!.id];
    const r = game.turn(s, [{ squad: a, to: 'screens', split: true }, { squad: b, to: 'stair', split: true }], []);
    expect(r.events.filter((e) => e.type === 'split')).toHaveLength(1);
    s = r.state;
    expect(game.canSplit(s, 'guard')).toBe(false);
    expect(game.splitIn(s, 'guard')).toBe(2);
    s = game.turn(game.turn(s, [], []).state, [], []).state;
    expect(game.canSplit(s, 'guard')).toBe(true);
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

describe('the war table: the elite squad (Jack, a trial)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, elites: ELITE_SQUAD });
  const squads = (s: RiotState, list: { id: string; side: 'guard' | 'rising'; place: string; strength: number; elite?: 'hero' | 'maiden' | 'guard3'; until?: number; poison?: boolean; hired?: 'rogue' | 'archer' | 'assassin' }[]): RiotState => ({ ...s, squads: list, nextId: 50 });
  /** A side given crests to spend. */
  const crests = (s: RiotState, side: 'guard' | 'rising', n = 1): RiotState => ({ ...s, elites: { ...s.elites, [side]: { ...s.elites[side], crests: n } } });

  it('put in next to your base (a squad of yours there steps back into it), for a crest; each once', () => {
    let s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'guard', place: 'arch', strength: 5 }]);
    expect(game.canDeploy(s, 'guard')).toBe(false); // no crest yet
    s = crests(s, 'guard', 2);
    expect(game.deployPlaces(s, 'guard').sort()).toEqual(['arch', 'lamp', 'stair']);
    expect(game.deploy(s, 'guard', 'hero', 'market').events).toEqual([]); // not next to the base
    s = game.deploy(s, 'guard', 'hero', 'arch').state;
    expect(at(s, 'arch')).toMatchObject({ elite: 'hero', strength: 7, side: 'guard' });
    expect(at(s, 'lifts')!.strength).toBe(9); // the 5 that was there stepped back into the base: nobody's lost
    // Any other, at once, with the second crest; never the same one twice.
    expect(game.canDeploy(s, 'guard', 'hero')).toBe(false);
    expect(game.canDeploy(s, 'guard', 'maiden')).toBe(true);
    s = game.deploy(s, 'guard', 'maiden', 'lamp').state;
    expect(game.canDeploy(s, 'guard')).toBe(false);
  });

  it('crests: the first on turn 3, on an empty street away from both bases; first there takes it; untaken, gone after 3 turns', () => {
    let s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 6 }, { side: 'guard', place: 'arch', strength: 3 }, { side: 'rising', place: 'market', strength: 3 }]);
    s = game.turn(s, [], []).state;
    expect(s.crest).toBeNull();
    const r = game.turn(s, [], []);
    s = r.state;
    expect(s.turn).toBe(3);
    expect(r.events).toContainEqual({ type: 'crestAppears', at: s.crest!.place });
    const c = s.crest!.place;
    expect(game.squadAt(s, c)).toBeUndefined();
    expect(game.near(c, 'lifts') || game.near(c, 'square') || c === 'lifts' || c === 'square').toBe(false);
    // Left alone: 3 turns, then gone.
    let t = s;
    for (let i = 0; i < 3; i++) t = game.turn(t, [], []).state;
    expect(t.crest).toBeNull();
    // Taken: a squad onto it (put there for the test, next door).
    const next = game.adj.get(c)![0]!;
    const u = squads(s, [{ id: 'g', side: 'guard', place: next, strength: 2 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }]);
    const v = game.order(u, { squad: 'g', to: c });
    expect(v.events).toContainEqual({ type: 'crestTaken', at: c, side: 'guard' });
    expect(v.state.crest).toBeNull();
    expect(game.canDeploy(v.state, 'guard')).toBe(true);
  });

  it('the maiden merges into one of hers: it\u2019s poisoned (green), and attacking, half the time it hits 10 to 60% harder', () => {
    let s = squads(game.start([]), [{ id: 'm', side: 'guard', place: 'arch', strength: 1, elite: 'maiden', until: 5 }, { id: 'g', side: 'guard', place: 'market', strength: 6 }, { id: 'h', side: 'guard', place: 'lifts', strength: 2 }]);
    expect(game.dests(s, s.squads[0]!)).toContain('market');
    const r = game.order(s, { squad: 'm', to: 'market' });
    expect(r.events).toContainEqual({ type: 'poison', at: 'market', side: 'guard' });
    expect(at(r.state, 'market')).toMatchObject({ strength: 7, poison: true });
    expect(r.state.squads.some((q) => q.elite === 'maiden')).toBe(false);
    // Nobody else joins an elite: the hero can't merge.
    const h = squads(game.start([]), [{ id: 'x', side: 'guard', place: 'arch', strength: 7, elite: 'hero', until: 3 }, { id: 'g', side: 'guard', place: 'market', strength: 6 }]);
    expect(game.dests(h, h.squads[0]!)).not.toContain('market');
    // Attacking: over many dice, about half are critical, each adding 10 to 60% of 10 (1 to 6).
    let crits = 0;
    for (let seed = 1; seed <= 400; seed++) {
      s = { ...squads(game.start([], seed), [{ id: 'p', side: 'guard', place: 'arch', strength: 10, poison: true }, { id: 'r', side: 'rising', place: 'market', strength: 12 }]) };
      const f = game.order(s, { squad: 'p', to: 'market' }).events.find((e) => e.type === 'fight');
      if (f?.type === 'fight' && f.crit) {
        crits++;
        expect(f.crit).toBeGreaterThanOrEqual(1);
        expect(f.crit).toBeLessThanOrEqual(6);
        expect(f.attack).toBe(10 + f.crit);
      }
    }
    expect(crits).toBeGreaterThan(160);
    expect(crits).toBeLessThan(240);
    // A critical hit never adds to your own: won, you keep at most what you had.
    for (let seed = 1; seed <= 50; seed++) {
      const w = game.order(squads(game.start([], seed), [{ id: 'p', side: 'guard', place: 'arch', strength: 10, poison: true }, { id: 'r', side: 'rising', place: 'market', strength: 2 }]), { squad: 'p', to: 'market' }).state;
      expect(at(w, 'market')!.strength).toBeLessThanOrEqual(10);
    }
    // Split: the half that goes takes the poison.
    const sp = game.order(squads(game.start([]), [{ id: 'p', side: 'guard', place: 'arch', strength: 6, poison: true }]), { squad: 'p', to: 'market', split: true }).state;
    expect(at(sp, 'market')).toMatchObject({ strength: 3, poison: true });
    expect(at(sp, 'arch')!.poison).toBeFalsy();
  });

  it('the hero: nothing can attack it; it spends what it takes; more than enough it moves in, just enough it clears it, too little it’s spent', () => {
    const s = squads(game.start([]), [
      { id: 'h', side: 'guard', place: 'arch', strength: 7, elite: 'hero', until: 3 },
      { id: 'r', side: 'rising', place: 'market', strength: 4 },
    ]);
    // (Only their hero can go at it, Jack: an ordinary squad can't.)
    expect(game.dests(s, at(s, 'market')!)).not.toContain('arch');
    expect(game.order(s, { squad: 'r', to: 'arch' }).events).toEqual([]);
    const t = game.order(s, { squad: 'h', to: 'market' }).state;
    expect(at(t, 'market')).toMatchObject({ elite: 'hero', strength: 3 });
    const exact = game.order({ ...s, squads: [{ ...s.squads[0]!, strength: 4 }, s.squads[1]!] }, { squad: 'h', to: 'market' }).state;
    expect(exact.squads).toEqual([]);
    expect(exact.owner.market).toBe('guard');
    const short = game.order({ ...s, squads: [{ ...s.squads[0]!, strength: 3 }, s.squads[1]!] }, { squad: 'h', to: 'market' }).state;
    expect(short.squads).toEqual([{ id: 'r', side: 'rising', place: 'market', strength: 1 }]);
  });

  it('two streets in one go, fighting through the first (Jack: a 2, then the 3 beside it)', () => {
    const s = squads(game.start([]), [
      { id: 'h', side: 'guard', place: 'lifts', strength: 7, elite: 'hero', until: 3 },
      { id: 'a', side: 'rising', place: 'lamp', strength: 2 },
      { id: 'b', side: 'rising', place: 'yards', strength: 3 },
    ]);
    const t = game.order(s, { squad: 'h', to: 'yards' }).state;
    expect(at(t, 'yards')).toMatchObject({ elite: 'hero', strength: 2 });
    expect(at(t, 'lamp')).toBeUndefined();
  });

  it('it never stays on the square or the lifts’ foot: it clears them; and it’s gone after 3 turns', () => {
    const s = squads(game.start([]), [
      { id: 'h', side: 'guard', place: 'market', strength: 7, elite: 'hero', until: 3 },
      { id: 'sq', side: 'rising', place: 'square', strength: 5 },
    ]);
    const t = game.order(s, { squad: 'h', to: 'square' }).state;
    expect(at(t, 'square')).toBeUndefined();
    expect(at(t, 'market')).toMatchObject({ elite: 'hero', strength: 2 });
    let u = s;
    for (let i = 0; i < 3; i++) u = game.turn(u, [], []).state;
    expect(u.squads.some((q) => q.elite)).toBe(false);
  });

  it('crusted (a hero dug in): fixed there, dug in, for the rest of its time', () => {
    let s = squads(game.start([]), [{ id: 'h', side: 'guard', place: 'arch', strength: 7, elite: 'hero', until: 3 }]);
    s = game.fortify(s, 'h');
    expect(game.dests(s, s.squads[0]!)).toEqual([]);
    s = game.turn(s, [], []).state;
    expect(s.fortified).toEqual(['arch']);
  });

  it('the maiden seduces one of theirs next to her (5 or fewer, never the square): it’s yours, and she’s gone', () => {
    const s = squads(game.start([]), [
      { id: 'm', side: 'guard', place: 'arch', strength: 1, elite: 'maiden', until: 5 },
      { id: 'r', side: 'rising', place: 'market', strength: 5 },
      { id: 'big', side: 'rising', place: 'screens', strength: 6 },
    ]);
    expect(game.seduceTargets(s, s.squads[0]!)).toEqual(['market']);
    const t = game.seduce(s, 'm', 'market').state;
    expect(at(t, 'market')).toMatchObject({ side: 'guard', strength: 5 });
    expect(t.squads.some((q) => q.id === 'm')).toBe(false);
    // Its order from the rising doesn't happen now it's yours.
    expect(game.order(t, { squad: 'r', to: 'lamp', side: 'rising' }).events).toEqual([]);
  });

  it('the king’s guard: three of 2 round the base, holding where they are, dug in as they arrive for 2 turns, there for good, never joining', () => {
    let s = game.deploy(crests(game.start([{ side: 'guard', place: 'lifts', strength: 4 }]), 'guard'), 'guard', 'guard3').state;
    const g3 = s.squads.filter((q) => q.elite === 'guard3');
    expect(g3.map((q) => q.place).sort()).toEqual(['arch', 'lamp', 'stair']);
    expect(g3.every((q) => q.strength === 2)).toBe(true);
    // Dug in as they arrive (without using the guard's fortify), this turn and the next.
    expect(s.fortified.sort()).toEqual(['arch', 'lamp', 'stair']);
    expect(game.canFortify(s, 'guard')).toBe(true);
    s = game.turn(s, [], []).state;
    expect(s.fortified.sort()).toEqual(['arch', 'lamp', 'stair']);
    s = game.turn(s, [], []).state;
    expect(s.fortified).toEqual([]);
    for (const q of g3) expect(game.dests(s, q)).toEqual([]); // (they hold where they are: Jack)
    // Fortified again: 2 turns.
    s = game.fortify(s, g3[0]!.id);
    s = game.turn(s, [], []).state;
    expect(s.fortified).toEqual([g3[0]!.place]);
    // Never gone, and nobody joins them (nor they anyone).
    for (let i = 0; i < 10; i++) s = game.turn(s, [], []).state;
    expect(s.squads.filter((q) => q.elite === 'guard3')).toHaveLength(3);
    for (const q of s.squads.filter((x) => x.elite === 'guard3')) expect(game.dests(s, q)).not.toContain('lifts');
  });

  it('beside the king’s guard (Jack): yours step onto their place and stand beside them; attacks hit the guard first, then them', () => {
    let s = squads(game.start([]), [{ id: 'k', side: 'guard', place: 'arch', strength: 2, elite: 'guard3' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }, { id: 'r', side: 'rising', place: 'market', strength: 6 }]);
    expect(game.dests(s, s.squads[1]!)).toContain('arch');
    s = game.order(s, { squad: 'l', to: 'arch' }).state;
    expect(game.squadAt(s, 'arch')!.id).toBe('k');
    expect(game.besideAt(s, 'arch')).toMatchObject({ id: 'l', strength: 5, beside: true });
    expect(game.heldBy(s, 'arch')).toBe(7);
    // Only their bastard can hurt the king's guard (Jack): a crowd of 6 can't even go at them.
    expect(game.dests(s, s.squads.find((q) => q.id === 'r')!)).not.toContain('arch');
    expect(game.order(s, { squad: 'r', to: 'arch' }).events).toEqual([]);
    // Their bastard, 7: the guard's 2 first, then the 5 beside them: just enough, and spent.
    const b = squads(s, [...s.squads, { id: 'b', side: 'rising', place: 'well', strength: 7, elite: 'hero', until: 9 }]);
    const t = game.order(b, { squad: 'b', to: 'arch', via: 'market' }).state;
    expect(t.squads.some((q) => q.place === 'arch' && q.side === 'guard')).toBe(false);
    // They can go on again.
    expect(game.dests(s, game.besideAt(s, 'arch')!)).toContain('market');
  });

  it('beside your hired fighters (Jack): yours step onto their place and stand beside them; attacks hit them first', () => {
    let s = squads(game.start([]), [{ id: 'a', side: 'guard', place: 'arch', strength: 2, hired: 'archer' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }, { id: 'r', side: 'rising', place: 'market', strength: 8 }]);
    expect(game.dests(s, s.squads[1]!)).toContain('arch');
    s = game.order(s, { squad: 'l', to: 'arch' }).state;
    expect(game.squadAt(s, 'arch')!.id).toBe('a');
    expect(game.besideAt(s, 'arch')).toMatchObject({ id: 'l', strength: 5, beside: true });
    expect(game.heldBy(s, 'arch')).toBe(7);
    // 8 against the archers' 2 and the 5 beside them: through, with 1 left.
    const t = game.order(s, { squad: 'r', to: 'arch' }).state;
    expect(t.squads.filter((q) => q.place === 'arch').map((q) => [q.side, q.strength])).toEqual([['rising', 1]]);
    // A rogue moving off leaves them standing there on their own.
    let u = squads(game.start([]), [{ id: 'g', side: 'guard', place: 'arch', strength: 3, hired: 'rogue' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }]);
    u = game.order(u, { squad: 'l', to: 'arch' }).state;
    u = game.order(u, { squad: 'g', to: 'market', auto: true }).state;
    expect(game.squadAt(u, 'arch')).toMatchObject({ id: 'l', strength: 5 });
    expect(game.squadAt(u, 'arch')!.beside).toBeUndefined();
  });

  it('the rising put in their bastard when there’s one of yours to hit, and a witch seduces', () => {
    const s = crests(game.start([{ side: 'rising', place: 'square', strength: 8 }, { side: 'guard', place: 'arch', strength: 3 }]), 'rising');
    expect(game.risingActs(game.start([{ side: 'rising', place: 'square', strength: 8 }, { side: 'guard', place: 'arch', strength: 3 }])).events).toEqual([]); // (none without a crest)
    const r = game.risingActs(s);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'deploy', side: 'rising', elite: 'hero' }));
    const w = squads(game.start([]), [{ id: 'w', side: 'rising', place: 'market', strength: 1, elite: 'maiden', until: 5 }, { id: 'g', side: 'guard', place: 'arch', strength: 3 }]);
    expect(at(game.risingActs(w).state, 'arch')!.side).toBe('rising');
  });
});

describe('the war table: clashes (Jack)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, elites: ELITE_SQUAD, clash: CLASH });
  const set = (list: { id: string; side: 'guard' | 'rising'; place: string; strength: number; elite?: 'hero' | 'maiden' | 'guard3'; until?: number }[], seed = 1): RiotState => {
    const s = game.start([], seed);
    for (const q of list) s.owner[q.place] = q.side;
    return { ...s, squads: list, nextId: 50 };
  };
  const head = (n: number, m = n) => set([{ id: 'g', side: 'guard', place: 'arch', strength: n }, { id: 'r', side: 'rising', place: 'market', strength: m }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 8 }]);

  it('straight at one of theirs coming straight at you, the same number: a clash; the winner takes the loser’s place with 1', () => {
    const r = game.turn(head(3), [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]);
    const c = r.events.find((e) => e.type === 'clash');
    expect(c).toMatchObject({ type: 'clash', at: 'market', from: 'arch', side: 'guard', strength: 3 });
    if (c?.type !== 'clash') return;
    const [winner, place] = c.won ? ['guard', 'market'] : ['rising', 'arch'];
    expect(at(r.state, place)).toMatchObject({ side: winner, strength: c.left });
    expect(r.state.squads.filter((q) => q.id === 'g' || q.id === 'r')).toHaveLength(1);
  });

  it('only then: not with different numbers, not when they’re going elsewhere, not the maiden, not the square', () => {
    expect(game.turn(head(3, 4), [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]).events.some((e) => e.type === 'clash')).toBe(false);
    expect(game.turn(head(3), [{ squad: 'g', to: 'market' }], []).events.some((e) => e.type === 'clash')).toBe(false);
    const m = set([{ id: 'g', side: 'guard', place: 'arch', strength: 1, elite: 'maiden', until: 5 }, { id: 'r', side: 'rising', place: 'market', strength: 1 }]);
    expect(game.turn(m, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]).events.some((e) => e.type === 'clash')).toBe(false);
    // (Their base, with exactly its number, is the final clash: Jack. Below.)
  });

  it('the winner is left with 1, now and then 2, rarely 3 (Jack); never more than it had', () => {
    const count = (n: number) => {
      const seen: Record<number, number> = {};
      for (let seed = 1; seed <= 1000; seed++) {
        const e = game.turn({ ...head(n), seed }, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]).events.find((x) => x.type === 'clash');
        if (e?.type === 'clash') seen[e.left] = (seen[e.left] ?? 0) + 1;
      }
      return seen;
    };
    const five = count(5);
    expect(five[1]! / 1000).toBeGreaterThan(0.55);
    expect(five[2]! / 1000).toBeGreaterThan(0.2);
    expect(five[3]! / 1000).toBeGreaterThan(0.04);
    expect(five[3]! / 1000).toBeLessThan(0.12);
    expect(Object.keys(count(2)).map(Number).sort()).toEqual([1, 2]);
    expect(Object.keys(count(1))).toEqual(['1']);
  });

  it('the two heroes clash too, when the numbers match (only they can hurt each other: Jack)', () => {
    const h = set([{ id: 'g', side: 'guard', place: 'arch', strength: 4, elite: 'hero', until: 3 }, { id: 'r', side: 'rising', place: 'market', strength: 4, elite: 'hero', until: 3 }]);
    expect(game.turn(h, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]).events.some((e) => e.type === 'clash')).toBe(true);
  });

  it('the odds: better with your own round you and on your ground, worse surrounded (not counting anyone dug in); 20% to 80%', () => {
    const even = game.clashOdds(head(3), at(head(3), 'arch')!, 'market').chance;
    const friends = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'market', strength: 3 }, ...game.adj.get('arch')!.filter((p) => p !== 'market').map((p, i) => ({ id: `f${i}`, side: 'guard' as const, place: p, strength: 2 }))]);
    const helped = game.clashOdds(friends, at(friends, 'arch')!, 'market').chance;
    const foes = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'market', strength: 3 }, ...game.adj.get('market')!.filter((p) => p !== 'arch').map((p, i) => ({ id: `f${i}`, side: 'rising' as const, place: p, strength: 5 }))]);
    const alone = game.clashOdds(foes, at(foes, 'arch')!, 'market').chance;
    expect(helped).toBeGreaterThan(even);
    expect(alone).toBeLessThan(even);
    for (const c of [even, helped, alone]) (expect(c).toBeGreaterThanOrEqual(0.2), expect(c).toBeLessThanOrEqual(0.8));
    // Dug in, they don't count.
    const dug = { ...foes, fortified: foes.squads.filter((q) => q.id.startsWith('f')).map((q) => q.place) };
    expect(game.clashOdds(dug, at(dug, 'arch')!, 'market').chance).toBeGreaterThan(alone);
    // And the dice follow the odds.
    let won = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const s = { ...friends, seed };
      const e = game.turn(s, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'arch' }]).events.find((x) => x.type === 'clash');
      if (e?.type === 'clash' && e.won) won++;
    }
    expect(Math.abs(won / 400 - helped)).toBeLessThan(0.08);
  });
});

describe('the war table: the mystery square (Jack)', () => {
  const game = new RiotGame(LOW_DISTRICT_BOARD, { ...RIOT_RULES, rumble: RUMBLE, elites: ELITE_SQUAD, mystery: MYSTERY });
  const set = (list: { id: string; side: 'guard' | 'rising'; place: string; strength: number; elite?: 'hero' }[], seed = 1): RiotState => {
    const s = game.start([], seed);
    for (const q of list) s.owner[q.place] = q.side;
    return { ...s, squads: list, nextId: 50 };
  };
  const card = (s: RiotState, c: Card, at = 'market', side: 'guard' | 'rising' = 'guard') => game.resolve({ ...s, pending: { kind: 'diviner', side, at, cards: [c, 'king', 'queen'] } }, 0);

  it('one thing on the map at a time; mystery squares appear from turn 4, for 3 turns', () => {
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 6 }], seed);
      for (let t = 0; t < 16; t++) {
        const r = game.turn(s, [], []);
        s = r.state;
        expect([s.rumble, s.crest, s.mystery].filter(Boolean).length).toBeLessThanOrEqual(1);
        for (const e of r.events) if (e.type === 'mysteryAppears') (seen++, expect(s.turn).toBeGreaterThanOrEqual(4), expect(s.mystery!.left).toBe(3));
      }
    }
    expect(seen).toBeGreaterThan(10);
  });

  it('a "?" found: diviner, thief, plague or trickster, about 35/30/20/15; the diviner’s mark is always the diviner', () => {
    const count: Record<string, number> = {};
    for (let seed = 1; seed <= 600; seed++) {
      const s = { ...set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'well', strength: 3 }], seed), mystery: { place: 'market', left: 3 } };
      const e = game.order(s, { squad: 'g', to: 'market' }).events.find((x) => x.type === 'mystery');
      if (e?.type === 'mystery') count[e.what] = (count[e.what] ?? 0) + 1;
    }
    expect(count.diviner! / 600).toBeCloseTo(0.35, 1);
    expect(count.thief! / 600).toBeCloseTo(0.3, 1);
    expect(count.plague! / 600).toBeCloseTo(0.2, 1);
    expect(count.trickster! / 600).toBeCloseTo(0.15, 1);
    const d = { ...set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }]), mystery: { place: 'market', left: 3, mark: 'diviner' as const } };
    const r = game.order(d, { squad: 'g', to: 'market' });
    expect(r.state.pending).toMatchObject({ kind: 'diviner', side: 'guard', at: 'market' });
    if (r.state.pending?.kind === 'diviner') expect(new Set(r.state.pending.cards).size).toBe(3);
  });

  it('the cards: an elite (yours, without a crest); jack, king, queen, ace', () => {
    const s = set([{ id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'g', side: 'guard', place: 'market', strength: 3 }, { id: 'a', side: 'guard', place: 'arch', strength: 2 }, { id: 'r', side: 'rising', place: 'well', strength: 3 }]);
    const elite = card(s, 'maiden').state;
    expect(game.canDeploy(elite, 'guard', 'maiden')).toBe(true);
    expect(game.canDeploy(elite, 'guard', 'hero')).toBe(false);
    expect(at(card(s, 'jack').state, 'arch')!.strength).toBe(4); // next to it, yours: +2
    expect(at(card(s, 'jack').state, 'well')!.strength).toBe(3); // theirs: nothing
    expect(at(card(s, 'king').state, 'lifts')!.strength).toBe(9);
    expect(game.mine(card(s, 'queen').state, 'guard').reduce((n, q) => n + q.strength, 0)).toBe(12);
    expect(at(card(s, 'ace').state, 'market')!.strength).toBe(8);
  });

  it('the joker: everything next to it thrown up, 1 to the most there (never over 10); the bases untouched', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = set([{ id: 'g', side: 'guard', place: 'market', strength: 3 }, { id: 'a', side: 'guard', place: 'arch', strength: 2 }, { id: 'r', side: 'rising', place: 'well', strength: 7 }, { id: 'sq', side: 'rising', place: 'square', strength: 14 }], seed);
      const t = card(s, 'joker').state;
      for (const p of ['arch', 'well']) if (game.near(p, 'market')) expect(at(t, p)!.strength).toBeGreaterThanOrEqual(1), expect(at(t, p)!.strength).toBeLessThanOrEqual(7);
      expect(at(t, 'square')!.strength).toBe(14);
      expect(at(t, 'market')!.strength).toBe(3); // (not whoever found it)
    }
  });

  it('the thief: up to 3 off any of theirs but the base, to your base; it can wipe one out', () => {
    const s = { ...set([{ id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'g', side: 'guard', place: 'market', strength: 3 }, { id: 'r', side: 'rising', place: 'well', strength: 2 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }]), pending: { kind: 'thief' as const, side: 'guard' as const, at: 'market' } };
    expect(game.thiefTargets(s, 'guard')).toEqual(['well']);
    const r = game.resolve(s, 'well');
    expect(at(r.state, 'well')).toBeUndefined();
    expect(at(r.state, 'lifts')!.strength).toBe(6);
    expect(r.events).toContainEqual({ type: 'thief', side: 'guard', at: 'well', stolen: 2, to: 'lifts', gone: true });
  });

  it('the plague: 3 turns of 1 off each of yours but the base, never below 1', () => {
    let s = set([{ id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'g', side: 'guard', place: 'market', strength: 5 }, { id: 'a', side: 'guard', place: 'arch', strength: 2 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }, { id: 'r', side: 'rising', place: 'well', strength: 4 }]);
    s = card(s, 'plague').state;
    for (let i = 0; i < 4; i++) s = game.turn(s, [], []).state;
    expect(at(s, 'market')!.strength).toBe(2);
    expect(at(s, 'arch')!.strength).toBe(1);
    expect(at(s, 'well')!.strength).toBe(4); // (not theirs)
    expect(at(s, "lifts")!.strength).toBe(16); // the base: untouched (it grows 3 a turn)
  });

  it('the trickster: every street changed; easy to read (none crossing, at most 4 from a place), as many as before, all joined up, the square not near the lifts’ foot', () => {
    const board = LOW_DISTRICT_BOARD;
    const pos = new Map(board.places.map((p) => [p.id, p]));
    for (let seed = 1; seed <= 30; seed++) {
      const s = { ...set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 8 }], seed), mystery: { place: 'market', left: 3, mark: 'trickster' as const } };
      const r = game.order(s, { squad: 'g', to: 'market' });
      const ways = r.state.ways!;
      expect(r.events.some((e) => e.type === 'trickster')).toBe(true);
      expect(ways.length).toBeLessThanOrEqual(board.ways.length);
      expect(ways.length).toBeGreaterThan(board.places.length - 2);
      const key = (w: readonly [string, string]) => [...w].sort().join('-');
      expect(ways.map(key).filter((k) => board.ways.map(key).includes(k)).length).toBeLessThan(ways.length);
      const deg = new Map<string, number>();
      for (const [a, b] of ways) (deg.set(a, (deg.get(a) ?? 0) + 1), deg.set(b, (deg.get(b) ?? 0) + 1));
      expect(Math.max(...deg.values())).toBeLessThanOrEqual(4);
      const o = (u: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
      for (const p of ways) for (const q of ways) {
        if (new Set([...p, ...q]).size < 4) continue;
        const [a, b, c, d] = [pos.get(p[0])!, pos.get(p[1])!, pos.get(q[0])!, pos.get(q[1])!];
        expect(o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)).toBe(false);
      }
      game.use(r.state);
      for (const p of board.places) expect(game.distance('lifts', p.id)).toBeLessThan(99);
      expect(game.distance('square', 'lifts')).toBeGreaterThanOrEqual(3);
      // The rules walk the new streets.
      for (const n of game.adj.get('market')!) expect(ways.some((w) => w.includes('market') && w.includes(n))).toBe(true);
    }
  });
});

describe('the war table: the skirmish (Jack, for playtesting)', () => {
  const rules = { ...RIOT_RULES, ...(RIOTS.skirmish as RiotScenario).rules };
  const game = new RiotGame(LOW_DISTRICT_BOARD, rules);

  it('no dawn, and no shake-ups now (Jack: no need for a random hero or the map changing every few turns); the elite come back once gone', () => {
    let s = game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 6 }]);
    let shakes = 0;
    for (let i = 0; i < 40; i++) {
      const r = game.turn(s, [], []);
      s = r.state;
      shakes += r.events.filter((e) => e.type === 'shakeUp').length;
    }
    expect(game.outcome(s)).toBeNull();
    expect(shakes).toBe(0);
    // A gift: put in without a crest; gone, it can come back.
    let t: RiotState = { ...game.start([{ side: 'guard', place: 'lifts', strength: 4 }]), elites: { guard: { used: ['hero'], crests: 0, gifts: ['hero'] }, rising: { used: [], crests: 0, gifts: [] } } };
    expect(game.canDeploy(t, 'guard', 'hero')).toBe(true);
    t = game.deploy(t, 'guard', 'hero', 'arch').state;
    expect(game.canDeploy(t, 'guard', 'hero')).toBe(false); // (on the table)
  });

  it('take their base and you’ve won; lose yours and you’ve lost', () => {
    const s = game.start([{ side: 'rising', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 6 }]);
    expect(game.outcome(s)).toBe('rising');
  });

  it('on the bigger map the hero (and the bastard) last 5 turns (Jack); in the riot, 3', () => {
    expect(rules.elites?.hero.lasts).toBe(5);
    expect(ELITE_SQUAD.hero.lasts).toBe(3);
  });

  it('the maiden can’t dig in (Jack: she’s left open)', () => {
    const s = { ...game.start([]), squads: [{ id: 'm', side: 'guard' as const, place: 'arch', strength: 1, elite: 'maiden' as const, until: 5 }] };
    expect(game.fortify(s, 'm')).toBe(s);
  });
});


describe('the war table: Jack’s third round', () => {
  const rules = { ...RIOT_RULES, elites: ELITE_SQUAD, clash: CLASH, mystery: MYSTERY, brothel: BROTHEL, audience: AUDIENCE };
  const game = new RiotGame(LOW_DISTRICT_BOARD, rules);
  type Q = RiotState['squads'][number];
  const set = (list: Q[], seed = 1): RiotState => {
    const s = game.start([], seed);
    for (const q of list) s.owner[q.place] = q.side;
    return { ...s, squads: list.map((q) => ({ ...q })), nextId: 50 };
  };

  it('the king’s guard can’t be unfortified (Jack: what would be the point?)', () => {
    const s = set([{ id: 'k', side: 'guard', place: 'arch', strength: 2, elite: 'guard3', fortUntil: 3 }]);
    const dug = { ...s, fortified: ['arch'] };
    expect(game.unfortify(dug, 'arch').fortified).toEqual(['arch']);
  });

  it('the king’s guard made up again (Jack): one or two missing, a crest puts back just those', () => {
    let s = set([{ id: 'k1', side: 'guard', place: 'stair', strength: 2, elite: 'guard3' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }]);
    s.elites.guard.used = ['guard3'];
    expect(game.canDeploy(s, 'guard', 'guard3')).toBe(false); // (no crest)
    s.elites.guard.crests = 1;
    expect(game.canDeploy(s, 'guard', 'guard3')).toBe(true);
    s = game.deploy(s, 'guard', 'guard3').state;
    expect(s.squads.filter((q) => q.elite === 'guard3')).toHaveLength(3);
    s.elites.guard.crests = 1;
    expect(game.canDeploy(s, 'guard', 'guard3')).toBe(false); // (all three there)
  });

  it('the maiden can be put in beside the king’s guard (Jack)', () => {
    const s = set([{ id: 'k1', side: 'guard', place: 'stair', strength: 2, elite: 'guard3' }, { id: 'k2', side: 'guard', place: 'arch', strength: 2, elite: 'guard3' }, { id: 'k3', side: 'guard', place: 'lamp', strength: 2, elite: 'guard3' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }]);
    s.elites.guard.crests = 1;
    expect(game.deployPlaces(s, 'guard', 'maiden')).toContain('arch');
    const t = game.deploy(s, 'guard', 'maiden', 'arch').state;
    expect(t.squads.filter((q) => q.place === 'arch').map((q) => q.elite).sort()).toEqual(['guard3', 'maiden']);
    expect(game.besideAt(t, 'arch')?.elite).toBe('maiden');
  });

  it('the maiden seduces by moving onto one of theirs (Jack: no button); a bastard turns into a hero', () => {
    const s = set([{ id: 'm', side: 'guard', place: 'arch', strength: 1, elite: 'maiden', until: 5 }, { id: 'r', side: 'rising', place: 'market', strength: 4 }, { id: 'big', side: 'rising', place: 'screens', strength: 8 }, { id: 'b', side: 'rising', place: 'lamp', strength: 7, elite: 'hero', until: 5 }]);
    const m = s.squads[0]!;
    expect(game.dests(s, m)).toContain('market');
    expect(game.dests(s, m)).not.toContain('screens'); // (8: too many to seduce)
    const r = game.order(s, { squad: 'm', to: 'market' });
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'seduce', at: 'market', side: 'guard' }));
    expect(at(r.state, 'market')!.side).toBe('guard');
    const h = game.order(s, { squad: 'm', to: 'lamp' }).state;
    expect(at(h, 'lamp')).toMatchObject({ side: 'guard', elite: 'hero', strength: 7 });
  });

  it('a hero goes the way you choose (Jack: one step, then the next)', () => {
    const s = set([{ id: 'h', side: 'guard', place: 'stair', strength: 7, elite: 'hero', until: 5 }, { id: 'a', side: 'rising', place: 'arch', strength: 2 }]);
    const r = game.order(s, { squad: 'h', to: 'market', via: 'arch' });
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'fight', at: 'arch', won: true }));
    expect(at(r.state, 'market')).toMatchObject({ id: 'h', strength: 5 });
  });

  it('the brothel (Jack): stuck there next turn, then 15% better in its next clash', () => {
    let s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }]);
    s.brothel = { place: 'market', left: 3 };
    const r = game.order(s, { squad: 'g', to: 'market' });
    expect(r.events).toContainEqual({ type: 'brothel', at: 'market', side: 'guard' });
    s = game.turn(r.state, [], []).state;
    const g = s.squads.find((q) => q.id === 'g')!;
    expect(game.dests(s, g)).toEqual([]); // (stuck, the turn after)
    s = game.turn(s, [], []).state;
    expect(game.dests(s, s.squads.find((q) => q.id === 'g')!).length).toBeGreaterThan(0);
    const odds = game.clashOdds(s, s.squads.find((q) => q.id === 'g')!, 'well');
    expect(odds.parts).toContainEqual({ what: 'Fine spirits', by: 0.15 });
  });

  it('an audience (Jack): you choose who; it goes well or badly; morale, output, the commander', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }]);
    s.audience = { place: 'market', left: 3 };
    const r = game.order(s, { squad: 'g', to: 'market' });
    expect(r.events).toContainEqual({ type: 'audienceFound', at: 'market', side: 'guard' });
    const p = r.state.pending;
    expect(p?.kind).toBe('audience');
    if (p?.kind !== 'audience') return;
    expect(p.good).toHaveLength(2);
    // The townsfolk, a line that goes down well: morale up, and the lifts' foot makes 1 more a turn.
    const good = game.resolve(r.state, `townsfolk:${p.good[0]}`);
    expect(good.events).toContainEqual({ type: 'audience', side: 'guard', who: 'townsfolk', good: true, line: p.good[0] });
    expect(game.moraleOf(good.state, 'guard')).toBeCloseTo(0.1);
    expect(at(game.turn(good.state, [], []).state, 'lifts')!.strength).toBe(4 + 3 + 1);
    const bad = game.resolve(r.state, `townsfolk:${[0, 1, 2, 3].find((i) => !p.good.includes(i))}`);
    expect(at(game.turn(bad.state, [], []).state, 'lifts')!.strength).toBe(4 + 3 - 1);
    // The commander: either way, five turns of it.
    const c = game.resolve(r.state, 'commander');
    const e = c.events.find((x) => x.type === 'audience');
    expect(game.adviceIn(c.state, 'guard', e?.type === 'audience' && e.good ? 'foresight' : 'cloud')).toBe(5);
    // Half and half, the accountant.
    let won = 0;
    for (let seed = 1; seed <= 200; seed++) won += game.resolve({ ...r.state, seed }, 'accountant').events.some((x) => x.type === 'audience' && x.good) ? 1 : 0;
    expect(won).toBeGreaterThan(70);
    expect(won).toBeLessThan(130);
    // The accountant (the treasury, Jack): morale, and the main base 1 more (or less) a turn, for 3 turns.
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const a = game.resolve({ ...r.state, seed }, 'accountant');
      const ae = a.events.find((x) => x.type === 'audience');
      const by = ae?.type === 'audience' && ae.good ? 1 : -1;
      let t = a.state;
      for (let i = 0; i < 3; i++) {
        const before = at(t, 'lifts')!.strength;
        t = game.turn(t, [], []).state;
        expect(at(t, 'lifts')!.strength).toBe(before + 3 + by);
      }
      const before = at(t, 'lifts')!.strength;
      expect(at(game.turn(t, [], []).state, 'lifts')!.strength).toBe(before + 3);
    }
  });

  it('an audience with the Lord (Jack): far less often, one side at a time, and sometimes a holy cross on the map', () => {
    const g = new RiotGame(LOW_DISTRICT_BOARD, { ...rules, church: CHURCH });
    let s = { ...game.start([{ side: 'guard', place: 'lifts', strength: 4 }, { side: 'rising', place: 'square', strength: 9 }]) };
    let calls = 0;
    let crosses = 0;
    for (let i = 0; i < 240; i++) {
      const r = g.turn(s, [], []);
      calls += r.events.filter((e) => e.type === 'call').length;
      crosses += r.events.filter((e) => e.type === 'churchAppears').length;
      s = r.state;
    }
    // Twenty stretches of 12 turns, about a third of them: about 7, so once in 35 turns or so.
    expect(calls).toBeGreaterThan(2);
    expect(calls).toBeLessThan(13);
    expect(crosses).toBeGreaterThan(0);
    // The cross: first there prays.
    const t = { ...g.start([{ side: 'guard', place: 'arch', strength: 3 }]), church: { place: 'market', left: 3 } };
    const r = g.order(t, { squad: 'q0', to: 'market' });
    expect(r.events).toContainEqual({ type: 'churchFound', at: 'market', side: 'guard' });
    expect(r.state.pending).toEqual({ kind: 'prayer', side: 'guard' });
    // Only the player's side is called out of the blue (Jack); the rising can still reach the cross.
    expect(s.calls?.rising).toBeNull();
    const u = { ...g.start([{ side: 'rising', place: 'well', strength: 3 }]), church: { place: 'market', left: 3 } };
    expect(g.order(u, { squad: 'q0', to: 'market' }).state.pending).toEqual({ kind: 'prayer', side: 'rising' });
  });

  it('a race for something on the map (Jack): the winner gets it and the place, the loser stays put, untouched', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'well', strength: 5 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }]);
    s.crest = { place: 'market', left: 3 };
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const r = game.turn({ ...s, seed }, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]);
      const race = r.events.find((e) => e.type === 'race');
      expect(race).toMatchObject({ type: 'race', at: 'market', what: 'crest', side: 'guard' });
      if (race?.type !== 'race') return;
      const [winner, loser, from] = race.won ? ['g', 'r', 'well'] : ['r', 'g', 'arch'];
      expect(r.state.squads.find((q) => q.id === winner)!.place).toBe('market');
      expect(r.state.squads.find((q) => q.id === loser)).toMatchObject({ place: from, strength: loser === 'g' ? 3 : 5 });
      expect(r.state.elites[race.won ? 'guard' : 'rising'].crests).toBe(1);
      wins += race.won ? 1 : 0;
    }
    expect(wins).toBeGreaterThan(5);
    expect(wins).toBeLessThan(35);
  });

  it('two the same size going for the same empty place: a clash there (Jack); different sizes, no', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'well', strength: 3 }]);
    const r = game.turn(s, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]);
    const c = r.events.find((e) => e.type === 'clash');
    expect(c).toMatchObject({ type: 'clash', at: 'market', meet: 'well', strength: 3 });
    expect(r.state.squads.filter((q) => q.id === 'g' || q.id === 'r')).toHaveLength(1);
    expect(at(r.state, 'market')).toBeDefined();
    const u = { ...s, squads: s.squads.map((q) => (q.id === 'r' ? { ...q, strength: 4 } : q)) };
    expect(game.turn(u, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]).events.some((e) => e.type === 'clash')).toBe(false);
  });

  it('their base, with exactly its number: the final clash (Jack); holding, the base stays where it is', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'market', strength: 10 }, { id: 'sq', side: 'rising', place: 'square', strength: 10 }]);
    let took = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const r = game.order({ ...s, seed }, { squad: 'g', to: 'square' });
      const c = r.events.find((e) => e.type === 'clash');
      expect(c).toMatchObject({ type: 'clash', base: true, at: 'square' });
      if (c?.type !== 'clash') return;
      expect(at(r.state, 'square')).toMatchObject({ side: c.won ? 'guard' : 'rising', strength: c.left });
      expect(at(r.state, 'market')).toBeUndefined();
      took += c.won ? 1 : 0;
    }
    expect(took).toBeGreaterThan(0);
    // One more than its number: taken outright, as before.
    expect(at(game.order({ ...s, squads: s.squads.map((q) => (q.id === 'g' ? { ...q, strength: 11 } : q)) }, { squad: 'g', to: 'square' }).state, 'square')!.side).toBe('guard');
  });

  it('a rumble and the cards reach the hero; the plague doesn’t (Jack)', () => {
    const s = set([{ id: 'h', side: 'guard', place: 'arch', strength: 7, elite: 'hero', until: 9 }, { id: 'g', side: 'guard', place: 'stair', strength: 4 }, { id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }, { id: 'r', side: 'rising', place: 'well', strength: 2 }]);
    s.rumble = { place: 'screens', left: 2 };
    const r = game.order(s, { squad: 'g', to: 'screens' });
    const hit = r.events.find((e) => e.type === 'rumble');
    expect(hit?.type === 'rumble' && hit.hits.some((x) => x.place === 'arch')).toBe(true);
    let p: RiotState = { ...s, plague: { guard: 3, rising: 0 } };
    p = game.turn(p, [], []).state;
    expect(at(p, 'arch')!.strength).toBe(7);
    expect(at(p, 'stair')!.strength).toBe(3);
  });

  it('nobody of yours left, the base included: game over (Jack)', () => {
    const sk = new RiotGame(LOW_DISTRICT_BOARD, { ...rules, baseLoss: true });
    expect(sk.outcome(set([{ id: 'sq', side: 'rising', place: 'square', strength: 9 }]))).toBe('rising');
  });
});

describe('the war table: an audience with the Lord (Jack)', () => {
  const rules = { ...RIOT_RULES, elites: ELITE_SQUAD, clash: CLASH, mystery: MYSTERY, brothel: BROTHEL, audience: AUDIENCE };
  const game = new RiotGame(LOW_DISTRICT_BOARD, rules);
  type Q = RiotState['squads'][number];
  const set = (list: Q[], seed = 1): RiotState => {
    const s = game.start([], seed);
    for (const q of list) s.owner[q.place] = q.side;
    return { ...s, squads: list.map((q) => ({ ...q })), nextId: 50 };
  };
  const judged = (s: RiotState, side: 'guard' | 'rising', kind: 'blessed' | 'cursed'): RiotState => ({ ...s, moods: [{ side, kind, by: 0, until: s.turn + 4 }] });

  it('the crier’s gone: a call is a prayer, judged heretics or loyal servants, half and half, for 5 turns', () => {
    let blessed = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const s = { ...set([{ id: 'l', side: 'guard', place: 'lifts', strength: 4 }]), seed, pending: { kind: 'prayer' as const, side: 'guard' as const } };
      const r = game.resolve(s);
      const e = r.events.find((x) => x.type === 'judgement');
      expect(e?.type).toBe('judgement');
      if (e?.type !== 'judgement') return;
      expect(game.favour(r.state, 'guard')).toBe(e.blessed ? 1 : -1);
      blessed += e.blessed ? 1 : 0;
    }
    expect(blessed).toBeGreaterThan(30);
    expect(blessed).toBeLessThan(70);
  });

  it('blessed, every clash and race is won; cursed, lost; and it wears off after 5 turns', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'market', strength: 3 }]);
    const g = s.squads[0]!;
    expect(game.clashOdds(judged(s, 'guard', 'blessed'), g, 'market').chance).toBe(1);
    expect(game.clashOdds(judged(s, 'guard', 'cursed'), g, 'market').chance).toBe(0);
    expect(game.clashOdds(judged(s, 'rising', 'cursed'), g, 'market').chance).toBe(1);
    let t = judged(s, 'guard', 'blessed');
    for (let i = 0; i < 5; i++) t = game.turn(t, [], []).state;
    expect(game.favour(t, 'guard')).toBe(0);
  });

  it('blessed, your attack wins on a tie; cursed, theirs on you does', () => {
    const s = set([{ id: 'g', side: 'guard', place: 'arch', strength: 3 }, { id: 'r', side: 'rising', place: 'market', strength: 3 }]);
    expect(at(game.order(s, { squad: 'g', to: 'market' }).state, 'market')!.side).toBe('rising');
    expect(at(game.order(judged(s, 'guard', 'blessed'), { squad: 'g', to: 'market' }).state, 'market')).toMatchObject({ side: 'guard', strength: 1 });
    expect(at(game.order(judged(s, 'guard', 'cursed'), { squad: 'r', to: 'arch' }).state, 'arch')).toMatchObject({ side: 'rising', strength: 1 });
  });

  it('blessed, a poisoned squad always lands its critical hit; an audience always goes well', () => {
    const s = judged(set([{ id: 'g', side: 'guard', place: 'arch', strength: 4, poison: true }, { id: 'r', side: 'rising', place: 'market', strength: 2 }]), 'guard', 'blessed');
    for (let seed = 1; seed <= 20; seed++) expect(game.order({ ...s, seed }, { squad: 'g', to: 'market' }).events.find((e) => e.type === 'fight')).toHaveProperty('crit');
    const a = { ...s, pending: { kind: 'audience' as const, side: 'guard' as const, at: 'market', good: [0, 1] } };
    for (let seed = 1; seed <= 20; seed++) expect(game.resolve({ ...a, seed }, 'townsfolk:3').events).toContainEqual(expect.objectContaining({ type: 'audience', good: true }));
  });

  it('the hero can be put in beside the king’s guard (Jack)', () => {
    const s = set([{ id: 'k1', side: 'guard', place: 'stair', strength: 2, elite: 'guard3' }, { id: 'k2', side: 'guard', place: 'arch', strength: 2, elite: 'guard3' }, { id: 'k3', side: 'guard', place: 'lamp', strength: 2, elite: 'guard3' }, { id: 'l', side: 'guard', place: 'lifts', strength: 5 }]);
    s.elites.guard.crests = 1;
    expect(game.deployPlaces(s, 'guard', 'hero')).toEqual(expect.arrayContaining(['stair', 'arch', 'lamp']));
    const t = game.deploy(s, 'guard', 'hero', 'arch').state;
    expect(t.squads.filter((q) => q.place === 'arch').map((q) => q.elite).sort()).toEqual(['guard3', 'hero']);
    expect(game.heldBy(t, 'arch')).toBe(2);
  });

  it('a crest or a mystery appears where both sides can get to it before it goes (Jack)', () => {
    let s = set([{ id: 'l', side: 'guard', place: 'lifts', strength: 4 }, { id: 'sq', side: 'rising', place: 'square', strength: 9 }, { id: 'a', side: 'guard', place: 'arch', strength: 2 }, { id: 'w', side: 'rising', place: 'wash', strength: 2 }]);
    for (let i = 0; i < 30; i++) {
      const r = game.turn(s, [], []);
      for (const e of r.events) if (e.type === 'crestAppears' || e.type === 'mysteryAppears') {
        const far = (side: 'guard' | 'rising') => Math.min(...game.mine(r.state, side).map((q) => game.distance(e.at, q.place)));
        expect(far('guard')).toBeLessThanOrEqual(3);
        expect(far('rising')).toBeLessThanOrEqual(3);
      }
      s = r.state;
    }
  });
});

describe('the war table: races on horseback (Jack)', () => {
  const rules = { ...RIOT_RULES, elites: ELITE_SQUAD, clash: CLASH, mystery: MYSTERY, brothel: BROTHEL, audience: AUDIENCE };
  const game = new RiotGame(LOW_DISTRICT_BOARD, rules);
  const set = (g: number, r: number): RiotState => {
    const s = game.start([], 1);
    s.owner.arch = 'guard';
    s.owner.well = 'rising';
    return { ...s, squads: [{ id: 'g', side: 'guard', place: 'arch', strength: g }, { id: 'r', side: 'rising', place: 'well', strength: r }], nextId: 50, crest: { place: 'market', left: 3 } };
  };

  it('the odds come from the two numbers ("7 v 6") and morale, not the whole board', () => {
    const s = set(7, 6);
    const odds = game.clashOdds(s, s.squads[0]!, 'market', s.squads[1]!, true);
    expect(odds.parts[0]).toEqual({ what: '7 v 6', by: 0.04 });
    expect(game.clashOdds(set(9, 1), set(9, 1).squads[0]!, 'market', set(9, 1).squads[1]!, true).chance).toBeLessThanOrEqual(0.9);
    const r = game.turn(s, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]);
    expect(r.events.find((e) => e.type === 'race')).toMatchObject({ strength: 7, rivalStrength: 6 });
  });

  it('under the Lord’s judgement, the loser’s wiped out: the heretic’s, or whoever faced the blessed', () => {
    const cursed: RiotState = { ...set(7, 6), moods: [{ side: 'guard', kind: 'cursed', by: 0, until: 9 }] };
    const r = game.turn(cursed, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]);
    expect(r.events.find((e) => e.type === 'race')).toMatchObject({ won: false, wiped: true });
    expect(r.state.squads.some((q) => q.id === 'g')).toBe(false);
    expect(at(r.state, 'market')?.id).toBe('r');
    const blessed: RiotState = { ...set(2, 6), moods: [{ side: 'guard', kind: 'blessed', by: 0, until: 9 }] };
    const b = game.turn(blessed, [{ squad: 'g', to: 'market' }], [{ squad: 'r', to: 'market' }]);
    expect(b.state.squads.some((q) => q.id === 'r')).toBe(false);
    expect(at(b.state, 'market')?.id).toBe('g');
  });
});

describe('the war table: even, the home squares, the rebels’ move, heroes (Jack)', () => {
  const board = (RIOTS.skirmish as RiotScenario).board;
  const even = new RiotGame(board, { ...RIOT_RULES, homeGrowth: true, clash: CLASH, clashOutput: { by: 1, turns: 3 } });
  const both = [{ side: 'guard' as const, place: 'keep', strength: 5 }, { side: 'rising' as const, place: 'camp', strength: 5 }];

  it('each base makes 1 a turn for each of its three home squares the other side doesn’t hold; besieged, none', () => {
    const s = even.turn(even.start(both), [], []).state;
    expect([at(s, 'keep')!.strength, at(s, 'camp')!.strength]).toEqual([8, 8]);
    const one = even.start([...both, { side: 'rising', place: 'gate', strength: 1 }]);
    expect(even.production(one, 'guard')).toBe(2);
    const besieged = { ...even.start(both), owner: { ...even.start(both).owner, postern: 'rising' as const, yard: 'rising' as const, gate: 'rising' as const } };
    expect(even.production(besieged, 'guard')).toBe(0);
    expect(even.production(besieged, 'rising')).toBe(3);
  });

  it('the skirmish is even: 5 in each base, the same out in the field', () => {
    const sc = RIOTS.skirmish as RiotScenario;
    const total = (side: string) => sc.squads.filter((q) => q.side === side).reduce((n, q) => n + q.strength, 0);
    expect(sc.squads.find((q) => q.place === 'keep')!.strength).toBe(5);
    expect(sc.squads.find((q) => q.place === 'camp')!.strength).toBe(5);
    expect(total('guard')).toBe(total('rising'));
    expect(sc.rules?.homeGrowth).toBe(true);
  });

  it('winning a clash: the winners’ base makes 1 more for 3 turns', () => {
    const s = even.start([...both, { side: 'guard', place: 'gate', strength: 3 }, { side: 'rising', place: 'bridge', strength: 3 }]);
    const r = even.turn(s, [go(s, 'gate', 'bridge')], [{ ...go(s, 'bridge', 'gate'), side: 'rising' }]);
    const clash = r.events.find((e) => e.type === 'clash');
    expect(clash).toBeTruthy();
    const winner = clash?.type === 'clash' && clash.won ? 'guard' : 'rising';
    expect(even.outputOf(r.state, winner)).toBe(1);
  });

  it('one big stack at their base (Jack: too easy): walls +3; they dig in when it could take it', () => {
    const sk = new RiotGame(board, { ...RIOT_RULES, ...(RIOTS.skirmish as RiotScenario).rules });
    const s = sk.start([{ side: 'guard', place: 'keep', strength: 10 }, { side: 'rising', place: 'camp', strength: 10 }, { side: 'guard', place: 'farms', strength: 14 }], 5);
    // 10 behind walls of 3: 13 is the final clash, 14 takes it.
    expect(sk.defence(s, 'camp', 10)).toBe(13);
    expect(sk.baseClashAt(s, 'camp')).toBe(13);
    expect(sk.defence(s, 'keep', 10)).toBe(13);
    const taken = sk.order(s, go(s, 'farms', 'camp')).state;
    expect(at(taken, 'camp')).toMatchObject({ side: 'guard', strength: 1 });
    // With 14 next to it, they dig in first: the attack doesn't happen.
    const r = sk.risingActs(s);
    expect(r.events.some((e) => e.type === 'dugIn')).toBe(true);
    expect(sk.fortified(r.state, 'camp')).toBe(true);
    expect(at(sk.turn(r.state, [go(r.state, 'farms', 'camp')], []).state, 'camp')!.side).toBe('rising');
    // 12 next to it can't even tie it: no need.
    const small = sk.start([{ side: 'guard', place: 'keep', strength: 10 }, { side: 'rising', place: 'camp', strength: 10 }, { side: 'guard', place: 'farms', strength: 12 }], 5);
    expect(sk.risingActs(small).events.some((e) => e.type === 'dugIn')).toBe(false);
  });

  it('the rebels don’t sit in their base (Jack: 39 at home, never coming out): your keep far off doesn’t hold them in', () => {
    const sk = new RiotGame(board, { ...RIOT_RULES, ...(RIOTS.skirmish as RiotScenario).rules });
    let s = sk.start([{ side: 'guard', place: 'keep', strength: 30 }, { side: 'rising', place: 'camp', strength: 39 }, { side: 'guard', place: 'farms', strength: 12 }, { side: 'guard', place: 'market', strength: 5 }], 5);
    s = { ...s, turn: 20, owner: { ...s.owner, crossroads: 'rising', road: 'rising', farms: 'guard' } };
    expect(sk.threatened(s)).toBe(false);
    const r = sk.turn(s, [], sk.risingOrders(s));
    expect(at(r.state, 'camp')!.strength).toBeLessThan(30);
    expect(r.state.squads.filter((q) => q.side === 'rising' && q.place !== 'camp').reduce((n, q) => n + q.strength, 0)).toBeGreaterThan(5);
  });

  it('the hero and the bastard can hurt each other; nothing else can hurt either', () => {
    const s = { ...even.start(both), squads: [{ id: 'h', side: 'guard' as const, place: 'gate', strength: 7, elite: 'hero' as const, until: 9 }, { id: 'b', side: 'rising' as const, place: 'bridge', strength: 3, elite: 'hero' as const, until: 9 }, { id: 'c', side: 'guard' as const, place: 'smithy', strength: 9 }] };
    expect(even.dests(s, s.squads[2]!)).not.toContain('bridge');
    const r = even.order(s, { squad: 'h', to: 'bridge' });
    expect(r.state.squads.some((q) => q.id === 'b')).toBe(false);
    expect(r.events.some((e) => e.type === 'eliteGone' && e.side === 'rising')).toBe(true);
  });

  const rebels = new RiotGame(board, { ...RIOT_RULES, rebel: REBEL });
  it('the rebels’ move, once every 3 turns: Rally where +2 wins them a fight', () => {
    const s = rebels.start([...both, { side: 'guard', place: 'gate', strength: 4 }, { side: 'rising', place: 'bridge', strength: 3 }]);
    const r = rebels.risingActs(s);
    expect(r.events).toContainEqual({ type: 'rally', at: 'bridge', by: 2 });
    expect(at(r.state, 'bridge')!.strength).toBe(5);
    expect(rebels.canRebel(r.state)).toBe(false);
    expect(rebels.rebelIn(r.state)).toBe(3);
  });

  it('Sabotage: the street one of yours would take their base by, closed for 3 turns (Jack), counting down', () => {
    const s = rebels.start([...both, { side: 'guard', place: 'crossroads', strength: 9 }]);
    let t = rebels.risingActs(s).state;
    expect(rebels.risingActs(s).events[0]).toMatchObject({ type: 'sabotage' });
    for (const left of [3, 2, 1]) {
      expect(rebels.closedFor(t, 'crossroads', 'camp')).toBe(left);
      expect(rebels.dests(t, at(t, 'crossroads')!)).not.toContain('camp');
      t = rebels.turn(t, [], []).state;
    }
    expect(t.blocked).toBeNull();
    expect(rebels.dests(t, at(t, 'crossroads')!)).toContain('camp');
    // (Once in 9 turns, Jack: their move's back, but not sabotage yet.)
    expect(rebels.canRebel(t)).toBe(true);
    expect(rebels.canSabotage(t)).toBe(false);
    expect(rebels.risingActs(t).events.some((e) => e.type === 'sabotage')).toBe(false);
    expect(rebels.canSabotage({ ...t, turn: t.turn + 6 })).toBe(true);
  });

  it('no riot (Jack took it out): with only fire-worthy ground about, they wait', () => {
    const s = rebels.start([...both, { side: 'guard', place: 'wwall', strength: 6 }, { side: 'guard', place: 'oldtown', strength: 6 }]);
    expect(rebels.risingActs(s).events).toEqual([]);
  });
});

describe('the war table: the barracks (Jack)', () => {
  const board = (RIOTS.skirmish as RiotScenario).board;
  const game = new RiotGame(board, { ...RIOT_RULES, barracks: BARRACKS, homeGrowth: true });
  const bases = [{ side: 'guard' as const, place: 'keep', strength: 5 }, { side: 'rising' as const, place: 'camp', strength: 5 }];
  const found = (extra: Parameters<typeof game.start>[0] = []) => {
    const s = { ...game.start([...bases, { side: 'guard', place: 'gate', strength: 4 }, ...extra]), barracks: { place: 'bridge', left: 3 } };
    const r = game.order(s, { squad: at(s, 'gate')!.id, to: 'bridge' });
    expect(r.events).toContainEqual({ type: 'barracksFound', at: 'bridge', side: 'guard' });
    expect(r.state.pending).toEqual({ kind: 'barracks', side: 'guard', at: 'bridge' });
    return r.state;
  };

  it('first there hires: rogue mercenaries, three of 3, out next to it; nobody gives them orders, nobody joins them', () => {
    const r = game.resolve(found(), 'rogues');
    const rogues = r.state.squads.filter((q) => q.hired === 'rogue');
    expect(rogues).toHaveLength(3);
    for (const q of rogues) expect(q).toMatchObject({ side: 'guard', strength: 3 });
    expect(game.dests(r.state, rogues[0]!)).toEqual([]);
    expect(game.order(r.state, { squad: rogues[0]!.id, to: game.adj.get(rogues[0]!.place)![0]! }).events).toEqual([]);
    // (One of yours doesn't join them: it stands beside them, Jack.)
    const next = game.adj.get(rogues[0]!.place)!.find((p) => at(r.state, p)?.side === 'guard' && !at(r.state, p)!.hired && !at(r.state, p)!.elite && p !== game.base('guard'));
    if (next) {
      const t = game.order(r.state, { squad: at(r.state, next)!.id, to: rogues[0]!.place }).state;
      expect(game.squadAt(t, rogues[0]!.place)).toMatchObject({ hired: 'rogue', strength: 3 });
      expect(game.besideAt(t, rogues[0]!.place)?.beside).toBe(true);
    }
  });

  it('rogues go for the nearest of theirs they can beat, on their own, and beat one next to them', () => {
    const s0 = game.resolve(found([{ side: 'rising', place: 'crossroads', strength: 2 }]), 'rogues').state;
    const orders = game.hiredOrders(s0);
    expect(orders.length).toBeGreaterThan(0);
    let t = s0;
    for (let i = 0; i < 3; i++) t = game.turn(t, [], []).state;
    expect(t.squads.some((q) => q.side === 'rising' && q.place === 'crossroads')).toBe(false);
    expect(t.squads.some((q) => q.hired === 'rogue' && q.place === 'crossroads')).toBe(true);
  });

  it('archers: two of 2 next to it, never moving, shooting one of theirs next to them for 1 a turn', () => {
    const s0 = game.resolve(found([{ side: 'rising', place: 'smithy', strength: 5 }]), 'archers').state;
    const archers = s0.squads.filter((q) => q.hired === 'archer');
    expect(archers).toHaveLength(2);
    expect(archers.every((q) => game.near(q.place, 'bridge') && q.strength === 2)).toBe(true);
    expect(game.hiredOrders(s0)).toEqual([]);
    const r = game.turn(s0, [], []);
    const arrows = r.events.filter((e) => e.type === 'arrow');
    const nextTo = archers.filter((a) => game.near(a.place, 'smithy')).length;
    expect(arrows).toHaveLength(nextTo);
    expect(at(r.state, 'smithy')!.strength).toBe(5 - nextTo);
  });

  it('the assassin: weaves to their base, two streets a turn, and strikes it (3, or 6 on a critical hit), then is gone', () => {
    let s = game.resolve(found(), 'assassin').state;
    expect(s.squads.filter((q) => q.hired === 'assassin')).toHaveLength(1);
    let strike: RiotEvent | undefined;
    for (let i = 0; i < 8 && !strike; i++) {
      const r = game.turn({ ...s, squads: s.squads.map((q) => (q.place === 'camp' ? { ...q, strength: 20 } : q)) }, [], []);
      strike = r.events.find((e) => e.type === 'assassin');
      s = r.state;
    }
    if (strike?.type !== 'assassin') throw new Error('no strike');
    expect(strike.at).toBe('camp');
    expect([3, 6]).toContain(strike.damage);
    expect(s.squads.some((q) => q.hired === 'assassin')).toBe(false);
  });

  it('the skirmish has the barracks', () => {
    expect((RIOTS.skirmish as RiotScenario).rules?.barracks).toMatchObject({ rogues: BARRACKS.rogues, archers: BARRACKS.archers, assassin: BARRACKS.assassin });
  });
});

describe('the war table: towers, and more on the map (Jack)', () => {
  const sc = RIOTS.skirmish as RiotScenario;
  const game = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, rumble: undefined, mystery: undefined, brothel: undefined, audience: undefined, church: undefined, barracks: undefined, elites: undefined, shakeUp: undefined });
  const bases = [{ side: 'guard' as const, place: 'keep', strength: 5 }, { side: 'rising' as const, place: 'camp', strength: 5 }];

  it('each side’s two towers start theirs, and each makes 2 every 4 turns, there, for whoever holds it (Jack); each base makes 2', () => {
    let s = game.start(bases);
    expect(game.towersHeld(s, 'guard')).toBe(2);
    expect(game.towersHeld(s, 'rising')).toBe(2);
    s = game.turn(s, [], []).state;
    for (const p of ['mill', 'orchards', 'marsh', 'quarry']) expect(at(s, p)).toBeUndefined();
    expect(at(s, 'keep')!.strength).toBe(7);
    expect(at(s, 'camp')!.strength).toBe(7);
    expect(game.towersIn(s)).toBe(2);
    for (let i = 0; i < 3; i++) s = game.turn(s, [], []).state;
    for (const p of ['mill', 'orchards', 'marsh', 'quarry']) expect(at(s, p)!.strength).toBe(2);
  });

  it('walls +1; taken, it’s "Captured!", and makes men for whoever took it', () => {
    const s = game.start([...bases, { side: 'rising', place: 'mill', strength: 2 }, { side: 'guard', place: 'wtower', strength: 4 }]);
    expect(game.defence(s, 'mill', 2)).toBe(3);
    const r = game.order(s, { squad: at(s, 'wtower')!.id, to: 'mill' });
    expect(r.events).toContainEqual({ type: 'captured', at: 'mill', side: 'guard', from: 'wtower' });
    expect(game.towersHeld(s, 'guard')).toBe(1);
    expect(game.towersHeld(r.state, 'guard')).toBe(2);
    expect(at(game.turn({ ...r.state, turn: 4 }, [], []).state, 'mill')!.strength).toBe(3);
  });

  it('one thing on the map at a time, and no brothel (Jack: too many, and confusing)', () => {
    expect(sc.rules?.tokensAtOnce).toBe(1);
    expect(sc.rules?.brothel).toBeUndefined();
    const busy = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, barracks: { ...BARRACKS, from: 1, chance: 1 }, audience: { ...AUDIENCE, from: 1, chance: 1 } });
    const t = busy.turn(busy.start(bases), [], []).state;
    expect([t.rumble, t.crest, t.mystery, t.brothel, t.audience, t.church, t.barracks, t.architect].filter(Boolean)).toHaveLength(1);
  });

  it('at most one thing out of the blue a turn (Jack): a prayer due as something appears waits a turn', () => {
    const busy = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, barracks: { ...BARRACKS, from: 1, chance: 1 } });
    const s = { ...busy.start(bases), turn: 2, calls: { guard: 2, rising: null } };
    const r = busy.turn(s, [], []);
    expect(r.events.some((e) => e.type.endsWith('Appears'))).toBe(true);
    expect(r.events.some((e) => e.type === 'call')).toBe(false);
    expect(r.state.calls?.guard).toBe(3);
  });

  it('anyone can attack the barbarians in the skirmish (Jack: it felt like a bug); in the riot, only a hero', () => {
    const k = { id: 'k', side: 'rising' as const, place: 'tannery', strength: 2, elite: 'guard3' as const };
    const s = { ...game.start([...bases, { side: 'guard', place: 'smithy', strength: 5 }]), turn: 5 };
    s.squads.push(k);
    expect(game.dests(s, at(s, 'smithy')!)).toContain('tannery');
    const r = game.order(s, { squad: at(s, 'smithy')!.id, to: 'tannery' });
    expect(at(r.state, 'tannery')).toMatchObject({ side: 'guard', strength: 3 });
    const riot = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, guardsOpen: undefined });
    expect(riot.dests(s, at(s, 'smithy')!)).not.toContain('tannery');
  });

  it('the rebels go for your base first (Jack): an empty keep next to them, they walk in', () => {
    const s = game.start([{ side: 'rising', place: 'camp', strength: 5 }, { side: 'rising', place: 'gate', strength: 3 }, { side: 'rising', place: 'market', strength: 9 }, { side: 'guard', place: 'woods', strength: 2 }]);
    s.owner.keep = 'guard';
    const o = game.risingOrders(s);
    expect(o).toContainEqual(expect.objectContaining({ squad: at(s, 'gate')!.id, to: 'keep' }));
  });

  it('with the field theirs, the rebels close in on your keep (Jack: their main aim)', () => {
    const s = game.start([...bases, { side: 'rising', place: 'crossroads', strength: 9 }]);
    const o = game.risingOrders(s).find((x) => x.squad === at(s, 'crossroads')!.id);
    expect(o?.to).toBe('bridge');
  });
});

describe('the war table: the architect (Jack)', () => {
  const sc = RIOTS.skirmish as RiotScenario;
  const game = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, rumble: undefined, mystery: undefined, brothel: undefined, audience: undefined, church: undefined, barracks: undefined, shakeUp: undefined, towers: undefined, rebel: undefined });
  const bases = [{ side: 'guard' as const, place: 'keep', strength: 5 }, { side: 'rising' as const, place: 'camp', strength: 5 }];
  const found = (extra: Parameters<typeof game.start>[0] = []) => {
    const s = { ...game.start([...bases, { side: 'guard', place: 'gate', strength: 4 }, ...extra]), architect: { place: 'bridge', left: 3 } };
    const r = game.order(s, { squad: at(s, 'gate')!.id, to: 'bridge' });
    expect(r.events).toContainEqual({ type: 'architectFound', at: 'bridge', side: 'guard' });
    expect(r.state.pending).toEqual({ kind: 'architect', side: 'guard', at: 'bridge' });
    return r.state;
  };

  it('he builds on your side of the board only: an empty place you hold, or nearer your base; not a base or a tower', () => {
    const places = game.buildPlaces(found(), 'guard');
    expect(places).toContain('postern');
    expect(places).not.toContain('keep');
    expect(places).not.toContain('farms');
    expect(places).not.toContain('bridge');
    const s = found();
    expect(game.resolve(s, 'artillery:farms').state.squads.some((q) => q.built)).toBe(false);
  });

  it('artillery: 5, dug in at first, never moves, and shoots one of theirs next to it for 3 a turn', () => {
    const s = game.resolve(found([{ side: 'rising', place: 'smithy', strength: 6 }]), 'artillery:wwall').state;
    const a = at(s, 'wwall')!;
    expect(a).toMatchObject({ built: 'artillery', strength: 5, side: 'guard' });
    expect(game.fortified(s, 'wwall')).toBe(true);
    expect(game.dests(s, a)).toEqual([]);
    const r = game.turn(s, [], []);
    expect(r.events).toContainEqual({ type: 'shell', side: 'guard', from: 'wwall', at: 'smithy', damage: 3, gone: false });
    expect(at(r.state, 'smithy')!.strength).toBe(3);
  });

  it('a storehouse: while it stands, your elite are doubled (hero 14, maiden seduces 10, the king’s guard 4)', () => {
    const s = game.resolve(found(), 'storehouse:postern').state;
    expect(at(s, 'postern')).toMatchObject({ built: 'storehouse', strength: 3 });
    expect(game.seduceMax(s, 'guard')).toBe(10);
    expect(game.seduceMax(s, 'rising')).toBe(5);
    const gift = { ...s, elites: { ...s.elites, guard: { used: [], crests: 1, gifts: [] } } };
    const hero = game.deploy(gift, 'guard', 'hero', game.deployPlaces(gift, 'guard', 'hero')[0]).state;
    expect(hero.squads.find((q) => q.elite === 'hero')!.strength).toBe(14);
  });

  it('a fortress: dug in for 7 turns, nobody can attack it, and your base next to it makes 1 more a turn', () => {
    const s = game.resolve(found(), 'fortress:postern').state;
    expect(game.fortified(s, 'postern')).toBe(true);
    expect(game.production(s, 'guard')).toBe(game.production(found(), 'guard') + 1);
    let t = s;
    for (let i = 0; i < 6; i++) t = game.turn(t, [], []).state;
    expect(at(t, 'postern')?.built).toBe('fortress');
    const r = game.turn(t, [], []);
    expect(r.events).toContainEqual({ type: 'builtGone', side: 'guard', building: 'fortress', at: 'postern' });
    expect(at(r.state, 'postern')).toBeUndefined();
  });

  it('the skirmish has him', () => expect(sc.rules?.architect).toMatchObject({ artillery: ARCHITECT.artillery, storehouse: ARCHITECT.storehouse, fortress: ARCHITECT.fortress }));
});
