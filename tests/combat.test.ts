import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMBATANTS, ENCOUNTERS, MOVES } from '../src/data/combat';
import { Battle, type CombatantDef, type EncounterDef, type MoveDef } from '../src/systems/Combat';

/** An rng that returns these values in turn (then repeats the last). */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
};
// The zealot's weights are swing 3, wind up 2, jeer 1 (of 6): these rolls pick each.
const SWING = 0.1;
const WIND_UP = 0.6;
const JEER = 0.95;

const scrap = (...rolls: number[]) => new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, seq(...rolls));

describe('Battle', () => {
  it('opens with round 1 and the enemy intent', () => {
    const b = scrap(SWING);
    expect(b.round).toBe(1);
    expect(b.opening).toContainEqual({ type: 'intent', actor: 'zealot', move: 'swing', target: 'carver' });
    expect(b.intentOf('zealot')).toEqual({ move: 'swing', target: 'carver' });
  });

  it('acts in order of speed: the carver (2) before the zealot (1)', () => {
    const b = scrap(SWING);
    expect(b.current?.id).toBe('carver');
    b.choose('shove');
    expect(b.current?.id).toBe('zealot');
  });

  it('a shove does a little harm', () => {
    const b = scrap(SWING);
    const events = b.choose('shove');
    expect(events).toContainEqual({ type: 'damage', target: 'zealot', amount: 1, hp: 5 });
  });

  it('an attack that lands hurts; a dodge or parry takes nothing', () => {
    for (const [reaction, hp] of [['none', 5], ['dodge', 7], ['parry', 7]] as const) {
      const b = scrap(SWING);
      b.choose('dodge');
      const events = b.enemyTurn(reaction);
      expect(b.get('carver').hp).toBe(hp);
      expect(events).toContainEqual({ type: 'reaction', actor: 'zealot', target: 'carver', reaction });
    }
  });

  it('a parry staggers the attacker: he loses his next turn and can be grabbed', () => {
    const b = scrap(SWING, SWING, SWING);
    b.choose('dodge');
    expect(b.enemyTurn('parry')).toContainEqual({ type: 'stagger', target: 'zealot' });
    // Round 2: no intent while he finds his feet, and grab is open.
    expect(b.round).toBe(2);
    expect(b.intentOf('zealot')).toBeUndefined();
    expect(b.choices().find((c) => c.move.id === 'grab')?.usable).toBe(true);
    b.choose('grab');
    expect(b.get('zealot').hp).toBe(3);
    expect(b.enemyTurn()).toContainEqual({ type: 'recover', target: 'zealot' });
    expect(b.round).toBe(3);
  });

  it('grab needs an opening', () => {
    const b = scrap(SWING);
    const grab = b.choices().find((c) => c.move.id === 'grab')!;
    expect(grab.usable).toBe(false);
    expect(grab.reason).toBe('No opening');
    expect(() => b.choose('grab')).toThrow(/can't be used now/);
  });

  it('a jeer leaves him open until he next acts', () => {
    const b = scrap(JEER, SWING);
    b.choose('dodge');
    b.enemyTurn();
    expect(b.get('zealot').exposed).toBe(true);
    b.choose('grab');
    expect(b.get('zealot').hp).toBe(3);
    b.enemyTurn();
    expect(b.get('zealot').exposed).toBe(false);
  });

  it('a wind-up is followed by the haymaker, whatever the roll', () => {
    const b = scrap(WIND_UP, SWING, SWING);
    b.choose('dodge');
    b.enemyTurn();
    expect(b.intentOf('zealot')?.move).toBe('haymaker');
    b.choose('dodge');
    b.enemyTurn('none');
    expect(b.get('carver').hp).toBe(3);
  });

  it('a shove breaks a wind-up: no haymaker, and he is staggered', () => {
    const b = scrap(WIND_UP, SWING, SWING);
    const events = b.choose('shove');
    expect(events).toContainEqual({ type: 'interrupt', target: 'zealot' });
    expect(b.get('zealot').staggered).toBe(true);
    // He loses his turn, but is still open going into round 2.
    expect(b.enemyTurn()).toContainEqual({ type: 'recover', target: 'zealot' });
    expect(b.round).toBe(2);
    expect(b.choices().find((c) => c.move.id === 'grab')?.usable).toBe(true);
  });

  it('dodging widens the reaction windows until your next turn', () => {
    const b = scrap(SWING, SWING);
    expect(b.reactionWindow('swing', 'carver')).toEqual({ dodge: 260, parry: 110 });
    b.choose('dodge');
    expect(b.reactionWindow('swing', 'carver')).toEqual({ dodge: 416, parry: 176 });
    b.enemyTurn();
    b.choose('shove');
    expect(b.reactionWindow('swing', 'carver')).toEqual({ dodge: 260, parry: 110 });
  });

  it('grades a press by how long before the hit it came', () => {
    const w = { dodge: 260, parry: 110 };
    expect(Battle.grade(null, w)).toBe('none');
    expect(Battle.grade(50, w)).toBe('parry');
    expect(Battle.grade(200, w)).toBe('dodge');
    expect(Battle.grade(400, w)).toBe('none');
    expect(Battle.grade(50, { dodge: 260, parry: 0 })).toBe('dodge');
    expect(Battle.grade(50, null)).toBe('none');
  });

  it('wins when he goes down, loses when you do', () => {
    const won = scrap(SWING, SWING, SWING, SWING, SWING, SWING);
    while (!won.outcome) {
      if (won.current!.side === 'party') won.choose(won.choices().find((c) => c.move.id === 'grab')!.usable ? 'grab' : 'shove');
      else won.enemyTurn('parry');
    }
    expect(won.outcome).toBe('won');

    const lost = scrap(SWING);
    while (!lost.outcome) {
      if (lost.current!.side === 'party') lost.choose('dodge');
      else lost.enemyTurn('none');
    }
    expect(lost.outcome).toBe('lost');
    expect(lost.get('carver').hp).toBe(0);
    expect(lost.current).toBeNull();
  });

  it('holding back ends the fight at once', () => {
    const b = scrap(SWING);
    expect(b.choose('hold_back')).toContainEqual({ type: 'end', outcome: 'held_back' });
    expect(b.outcome).toBe('held_back');
  });

  it('runs a party of two against two enemies', () => {
    const moves: Record<string, MoveDef> = {
      hit: { id: 'hit', name: 'Hit', description: '', target: 'enemy', damage: 5, reaction: { dodge: 200, parry: 80 } },
    };
    const defs: Record<string, CombatantDef> = {
      a: { id: 'a', name: 'A', sprite: 'x', hp: 10, speed: 3, moves: ['hit'], reactions: ['dodge'] },
      b: { id: 'b', name: 'B', sprite: 'x', hp: 10, speed: 1, moves: ['hit'] },
      foe: { id: 'foe', name: 'Foe', sprite: 'x', hp: 5, speed: 2, moves: ['hit'] },
    };
    const enc: EncounterDef = { id: 'test', party: ['a', 'b'], enemies: ['foe', 'foe'], outcomes: {} };
    const battle = new Battle(enc, moves, defs, seq(0, 0, 0, 0.99));
    expect(battle.combatants.map((c) => c.id)).toEqual(['a', 'b', 'foe', 'foe-2']);
    expect(battle.intentOf('foe')?.target).toBe('a');
    expect(battle.intentOf('foe-2')?.target).toBe('b');
    // a (3), then foe and foe-2 (2), then b (1).
    expect(battle.current?.id).toBe('a');
    battle.choose('hit', 'foe');
    expect(battle.get('foe').hp).toBe(0);
    // foe is down, so it's foe-2's turn; b can't parry, so a parry counts as no reaction.
    expect(battle.current?.id).toBe('foe-2');
    battle.enemyTurn('parry');
    expect(battle.get('b').hp).toBe(5);
    expect(battle.current?.id).toBe('b');
    battle.choose('hit', 'foe-2');
    expect(battle.outcome).toBe('won');
  });
});

describe('combat data', () => {
  it('every combatant and encounter refers to things that exist', () => {
    for (const c of Object.values(COMBATANTS)) for (const m of c.moves) expect(MOVES[m], `${c.id}: ${m}`).toBeDefined();
    for (const e of Object.values(ENCOUNTERS)) {
      for (const id of [...e.party, ...e.enemies]) expect(COMBATANTS[id], `${e.id}: ${id}`).toBeDefined();
      expect(Object.keys(e.outcomes)).toEqual(expect.arrayContaining(['won', 'lost']));
    }
    for (const m of Object.values(MOVES)) if (m.windsUp) expect(MOVES[m.windsUp]).toBeDefined();
  });

  it('every move that ends a fight has an outcome in each encounter that can use it', () => {
    for (const e of Object.values(ENCOUNTERS)) {
      for (const id of e.party) for (const m of COMBATANTS[id]!.moves) {
        const ends = MOVES[m]!.ends;
        if (ends) expect(e.outcomes[ends], `${e.id}: ${ends}`).toBeDefined();
      }
    }
  });

  it('outcomes only write variables the story declares', () => {
    const declared = new Set([...readFileSync('story/main.ink', 'utf8').matchAll(/^VAR (\w+)/gm)].map((m) => m[1]));
    for (const e of Object.values(ENCOUNTERS)) {
      for (const vars of Object.values(e.outcomes)) for (const name of Object.keys(vars)) expect(declared.has(name), name).toBe(true);
    }
  });
});
