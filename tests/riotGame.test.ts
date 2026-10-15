import { describe, expect, it } from 'vitest';
import { LOW_DISTRICT_BOARD, PROMENADE_BOARD, RIOTS } from '../src/data/warTable';
import { ENCOUNTERS } from '../src/data/combat';
import { RiotGame, type RiotState } from '../src/systems/Riot';
import { careful, playOut, playTurn, sensible } from '../src/systems/RiotPlayers';

// The riot game (docs/sequences/chapter-3/war-table.md). The rules, and the balance found by simulation
// (designer: a longer game, on the easy side but not really easy; force against calm).

const sc = RIOTS.riot_low!;
const game = () => new RiotGame(sc.board);
const start = (g = game()) => g.start(sc.unrest, sc.squads);
const squad = (s: RiotState, place: string) => s.squads.find((q) => q.place === place)!;

describe('the riot game: the rules', () => {
  it('both districts’ boards: every way joins two places, and everywhere can be reached', () => {
    for (const board of [LOW_DISTRICT_BOARD, PROMENADE_BOARD]) {
      const g = new RiotGame(board);
      const ids = new Set(board.places.map((p) => p.id));
      for (const [a, b] of board.ways) expect(ids.has(a) && ids.has(b), `${a}-${b}`).toBe(true);
      expect(g.upDist.size).toBe(board.places.length);
    }
  });

  it('quell: one less; charge: two less, and the crowd scatters into streets nobody holds', () => {
    const g = game();
    let s = start(g);
    s = g.act(s, { kind: 'move', squad: squad(s, 'arch').id, to: 'market' });
    expect(s.squads.find((q) => q.place === 'market')).toBeDefined();
    const t = g.act(start(g), { kind: 'charge', squad: squad(start(g), 'arch').id, at: 'market' });
    expect(t.unrest.market).toBe(0);
    expect(t.unrest.yards).toBe(1); // scattered
    expect(t.unrest.lamp).toBe(0); // the watch is there
    expect(t.anger).toBe(1);
    const u = g.act(start(g), { kind: 'quell', squad: squad(start(g), 'arch').id, at: 'market' });
    expect(u.unrest.market).toBe(1);
    expect(u.unrest.yards).toBe(0);
  });

  it('each squad acts once a turn; the ones that don’t are braced', () => {
    const g = game();
    let s = start(g);
    const id = squad(s, 'arch').id;
    s = g.act(s, { kind: 'quell', squad: id, at: 'market' });
    expect(g.actions(s, s.squads.find((q) => q.id === id)!)).toEqual([]);
  });

  it('the square: you can’t walk in or quell it behind its barricades; storming costs the squad; nobody storming, they go back up', () => {
    const g = game();
    const s = start(g);
    expect(s.barricade).toBe(16);
    const next = g.endTurn(s, g.spreads(s));
    expect(next.barricade).toBe(16);
    // Put a shield wall beside it and storm.
    const t = { ...g.clone(s), squads: [{ id: 'x', kind: 'shields' as const, place: 'well', hp: 4 }] };
    const after = g.act(t, { kind: 'storm', squad: 'x' });
    expect(after.barricade).toBe(14);
    expect(after.squads[0]!.hp).toBe(3);
    expect(g.actions(after, after.squads[0]!)).toEqual([]);
    expect(g.endTurn(after, g.spreads(after)).barricade).toBe(14);
  });

  it('the barricades down: the square can be taken, and that wins it', () => {
    const g = game();
    const s = { ...g.clone(start(g)), barricade: 1, squads: [{ id: 'x', kind: 'pikes' as const, place: 'well', hp: 3 }] };
    const down = g.act(s, { kind: 'storm', squad: 'x' });
    expect(down.barricade).toBe(0);
    expect(down.unrest.square).toBe(2);
    const t = g.endTurn(down, g.spreads(s));
    const moved = g.act(t, { kind: 'move', squad: t.squads.find((q) => q.id === 'x')?.id ?? 'x', to: 'square' });
    expect(g.outcome(moved)).toBe('won');
  });

  it('dawn, and the square still theirs: lost (nothing else loses it)', () => {
    const g = game();
    let s = start(g);
    for (let i = 0; i < g.rules.dawn; i++) {
      expect(g.outcome(s)).toBeNull();
      s = g.endTurn(s, g.spreads(s));
    }
    expect(g.outcome(s)).toBe('lost');
  });

  it('the power cut stops a place spreading this turn, and then needs time', () => {
    const g = game();
    const s = start(g);
    const spreads = g.spreads(s);
    const cut = g.act(s, { kind: 'cut', at: 'square' });
    const a = g.endTurn(s, spreads);
    const b = g.endTurn(cut, spreads);
    const fromSquare = spreads.filter((sp) => sp.from === 'square').map((sp) => sp.to);
    for (const p of fromSquare) expect(b.unrest[p]!).toBeLessThanOrEqual(a.unrest[p]!);
    expect(g.canCut(b)).toBe(false);
  });

  it('worn-out squads withdraw and come back fresh', () => {
    const g = game();
    const s = { ...g.clone(start(g)), squads: [{ id: 'x', kind: 'pikes' as const, place: 'well', hp: 1 }] };
    const t = g.act(s, { kind: 'storm', squad: 'x' });
    expect(t.squads).toHaveLength(0);
    expect(t.away).toHaveLength(1);
    let u = t;
    for (let i = 0; i <= g.rules.regroup; i++) u = g.endTurn(u, []);
    expect(u.squads.some((q) => q.kind === 'pikes' && q.hp === 3)).toBe(true);
  });

  it('the fight at the square exists', () => {
    expect(ENCOUNTERS[sc.square]).toBeDefined();
  });
});

describe('the riot game: the balance (simulated play)', () => {
  const g = game();

  it('a careful player wins with turns to spare; a sensible one wins too, closer to dawn', () => {
    const c = playOut(g, start(g), careful());
    expect(c.outcome).toBe('won');
    expect(c.state.turn).toBeLessThanOrEqual(11);
    const s = playOut(g, start(g), sensible());
    expect(s.outcome).toBe('won');
    expect(s.state.turn).toBeGreaterThan(c.state.turn);
  }, 120000);

  it('force alone loses it; calm alone only just wins (no single way of playing is the answer)', () => {
    expect(playOut(g, start(g), sensible((a) => a.kind !== 'quell')).outcome).toBe('lost');
    const calm = playOut(g, start(g), sensible((a) => a.kind !== 'charge'));
    expect(calm.outcome).toBe('won');
    expect(calm.state.turn).toBeGreaterThanOrEqual(13);
  }, 120000);

  it('doing nothing loses it', () => {
    expect(playOut(g, start(g), () => []).outcome).toBe('lost');
  });

  it('a turn played out is the same as acting then ending the turn', () => {
    const s = start(g);
    const acts = sensible()(g, s);
    let t = s;
    for (const a of acts) t = g.act(t, a);
    expect(playTurn(g, s, acts)).toEqual(g.endTurn(t, g.spreads(s)));
  });
});
