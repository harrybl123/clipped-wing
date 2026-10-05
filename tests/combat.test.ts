import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMBATANTS, ENCOUNTERS, ITEMS, MOVES } from '../src/data/combat';
import { ALL_OUT_POWER, Battle, type CombatantDef, type EncounterDef, type ItemDef, type MoveDef } from '../src/systems/Combat';

// Small test data, so the numbers are easy: attack = defence, so harm = power × multipliers. An rng
// fixed at 0.5 means no variance (×1.0), no criticals (unless crit is 1) and the middle weighted pick.
const half = () => 0.5;
const MV: Record<string, MoveDef> = {
  punch: { id: 'punch', name: 'Punch', description: '', target: 'enemy', power: 10, kind: 'strike' },
  lucky: { id: 'lucky', name: 'Lucky', description: '', target: 'enemy', power: 10, kind: 'strike', crit: 1 },
  pull: { id: 'pull', name: 'Pull', description: '', target: 'enemy', power: 10, kind: 'grab', sp: 4 },
  leave: { id: 'leave', name: 'Leave', description: '', target: 'self', ends: 'left' },
  bash: { id: 'bash', name: 'Bash', description: '', target: 'enemy', power: 10, kind: 'strike', reaction: { dodge: 250, late: 50, parry: 100 } },
  charge: { id: 'charge', name: 'Charge', description: '', target: 'self', windsUp: 'smash' },
  smash: { id: 'smash', name: 'Smash', description: '', target: 'enemy', power: 30, kind: 'strike', reaction: { dodge: 200, late: 50, parry: 80 } },
  hook: { id: 'hook', name: 'Hook', description: '', target: 'enemy', power: 10, kind: 'strike', reaction: { kind: 'side', dodge: 250, late: 50 }, tell: { pose: 'cock', lines: ['He drops a shoulder.'] } },
  flurry: { id: 'flurry', name: 'Flurry', description: '', target: 'enemy', power: 4, kind: 'strike', hits: 2, reaction: { kind: 'rhythm', dodge: 250, late: 50 }, tell: { pose: 'squared', lines: ['He bounces.'] } },
  hold: { id: 'hold', name: 'Hold', description: '', target: 'enemy', power: 10, kind: 'grab', reaction: { kind: 'mash', presses: 8, time: 1500 } },
  shove: { id: 'shove', name: 'Shove', description: '', target: 'enemy', power: 2, kind: 'shove', interrupts: true },
};
const DEFS: Record<string, CombatantDef> = {
  hero: { id: 'hero', name: 'Hero', sprite: 'x', hp: 50, sp: 6, attack: 10, defence: 10, speed: 5, basic: 'punch', moves: ['pull', 'lucky', 'leave', 'shove'], reactions: ['dodge', 'parry'] },
  friend: { id: 'friend', name: 'Friend', sprite: 'x', hp: 50, attack: 10, defence: 10, speed: 1, basic: 'punch', moves: [] },
  brute: { id: 'brute', name: 'Brute', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['bash'], weak: ['grab'], resists: ['strike'] },
  brawler: { id: 'brawler', name: 'Brawler', sprite: 'x', hp: 50, sp: 40, attack: 10, defence: 10, speed: 5, basic: 'punch', moves: ['pull'] },
  tough: { id: 'tough', name: 'Tough', sprite: 'x', hp: 200, attack: 10, defence: 10, speed: 3, moves: ['bash'], weak: ['grab'], poise: 2 },
  flurrier: { id: 'flurrier', name: 'Flurrier', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['flurry'] },
  hooker: { id: 'hooker', name: 'Hooker', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['hook'] },
  holder: { id: 'holder', name: 'Holder', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['hold'] },
  liar: { id: 'liar', name: 'Liar', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['flurry', 'hook'], weights: [1, 0], feint: 1 },
  charger: { id: 'charger', name: 'Charger', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['charge'] },
};
const IT: Record<string, ItemDef> = { bun: { id: 'bun', name: 'Bun', description: '', heal: 15 } };
const fight = (enc: Partial<EncounterDef> = {}, rng = half) =>
  new Battle({ id: 't', party: ['hero'], enemies: ['brute'], outcomes: { won: {}, lost: {} }, ...enc }, MV, DEFS, IT, rng);

describe('Battle: the base', () => {
  it('opens with round 1 and each enemy intent', () => {
    const b = fight();
    expect(b.round).toBe(1);
    expect(b.opening).toContainEqual({ type: 'intent', actor: 'brute', move: 'bash', target: 'hero' });
    expect(b.intentOf('brute')).toEqual({ move: 'bash', target: 'hero' });
  });

  it('acts in order of speed', () => {
    const b = fight({ party: ['hero', 'friend'] });
    expect(b.current?.id).toBe('hero');
    b.act({ type: 'guard' });
    expect(b.current?.id).toBe('brute');
    b.enemyTurn();
    expect(b.current?.id).toBe('friend');
  });

  it('offers Attack, Skill and Guard; Item only with items, Run only where allowed', () => {
    expect(fight().commands().map((c) => c.type)).toEqual(['attack', 'skill', 'guard']);
    expect(fight({ items: { bun: 1 }, run: 'ran' }).commands().map((c) => c.type)).toEqual(['attack', 'skill', 'guard', 'item', 'run']);
  });

  it('harm is power × attack ÷ defence; resisted halves it', () => {
    const b = fight();
    expect(b.act({ type: 'attack' })).toContainEqual({ type: 'damage', target: 'brute', amount: 5, hp: 55, resisted: true });
  });

  it('skills cost SP, and can’t be used without it', () => {
    const b = fight();
    b.act({ type: 'skill', move: 'pull' }); // (his weakness: One More, so still your turn)
    expect(b.get('hero').sp).toBe(2);
    expect(b.skills().find((s) => s.move.id === 'pull')).toMatchObject({ usable: false, reason: 'Not enough SP' });
    expect(() => b.act({ type: 'skill', move: 'pull' })).toThrow(/not enough SP/);
  });

  it('guarding halves harm until your next turn', () => {
    const b = fight();
    b.act({ type: 'guard' });
    expect(b.enemyTurn()).toContainEqual({ type: 'damage', target: 'hero', amount: 5, hp: 45, guarded: true });
    b.act({ type: 'attack' });
    expect(b.enemyTurn()).toContainEqual({ type: 'damage', target: 'hero', amount: 10, hp: 35 });
  });

  it('items heal, and run out', () => {
    const b = fight({ items: { bun: 1 } });
    b.act({ type: 'guard' });
    b.enemyTurn();
    expect(b.act({ type: 'item', item: 'bun' })).toContainEqual({ type: 'heal', target: 'hero', hp: 50, sp: 6 });
    expect(b.items.size).toBe(0);
    b.enemyTurn();
    expect(b.commands().map((c) => c.type)).not.toContain('item');
  });

  it('wins when they all go down, loses when you do', () => {
    const won = fight();
    while (!won.outcome) won.current!.side === 'party' ? won.act({ type: 'attack' }) : won.enemyTurn('parry');
    expect(won.outcome).toBe('won');
    const lost = fight();
    while (!lost.outcome) lost.current!.side === 'party' ? lost.act({ type: 'guard' }) : lost.enemyTurn();
    expect(lost.outcome).toBe('lost');
    expect(lost.current).toBeNull();
  });

  it('a skill can end the fight (holding back), and so can Run', () => {
    const b = fight();
    expect(b.act({ type: 'skill', move: 'leave' })).toContainEqual({ type: 'end', outcome: 'left' });
    const r = fight({ run: 'ran' });
    r.act({ type: 'run' });
    expect(r.outcome).toBe('ran');
  });

  it('a wind-up is followed by the big one, whatever the AI would pick', () => {
    const b = fight({ enemies: ['charger'] });
    expect(b.intentOf('charger')?.move).toBe('charge');
    b.act({ type: 'guard' });
    b.enemyTurn();
    expect(b.intentOf('charger')?.move).toBe('smash');
  });
});

describe('Battle: weaknesses, One More, all out', () => {
  it('hitting a weakness knocks them down and gives One More', () => {
    const b = fight();
    const events = b.act({ type: 'skill', move: 'pull' });
    expect(events).toContainEqual({ type: 'damage', target: 'brute', amount: 15, hp: 45, weak: true });
    expect(events).toContainEqual({ type: 'knockdown', target: 'brute' });
    expect(events).toContainEqual({ type: 'oneMore', actor: 'hero' });
    expect(b.current?.id).toBe('hero');
  });

  it('a critical knocks down too', () => {
    const b = fight({ enemies: ['charger'] });
    const events = b.act({ type: 'skill', move: 'lucky' });
    expect(events).toContainEqual({ type: 'damage', target: 'charger', amount: 15, hp: 45, crit: true });
    expect(events).toContainEqual({ type: 'oneMore', actor: 'hero' });
  });

  it('no second One More off someone already down', () => {
    const b = fight({ enemies: ['brute', 'brute'] });
    b.act({ type: 'skill', move: 'pull', target: 'brute' });
    const events = b.act({ type: 'attack', target: 'brute' });
    expect(events.find((e) => e.type === 'oneMore')).toBeUndefined();
  });

  it('no all-out attack unless the fight allows it', () => {
    const b = fight();
    b.act({ type: 'skill', move: 'pull' });
    expect(b.allOutReady).toBe(false);
    expect(b.commands().map((c) => c.type)).not.toContain('allOut');
  });

  it('when every enemy is down (and the fight allows it), an all-out attack is offered', () => {
    const b = fight({ allOut: true });
    b.act({ type: 'skill', move: 'pull' });
    expect(b.allOutReady).toBe(true);
    expect(b.commands()[0]).toEqual({ type: 'allOut', usable: true });
    const events = b.act({ type: 'allOut' });
    expect(events).toContainEqual({ type: 'damage', target: 'brute', amount: ALL_OUT_POWER, hp: 45 - ALL_OUT_POWER });
    expect(b.get('brute').down).toBe(false);
    expect(b.current?.id).toBe('brute');
  });

  it('someone knocked down gets up on their next turn, and acts normally the turn after', () => {
    const b = fight();
    b.act({ type: 'skill', move: 'pull' }); // down, One More
    expect(b.act({ type: 'attack' })).toContainEqual({ type: 'getUp', target: 'brute' });
    expect(b.get('brute').down).toBe(false);
    expect(b.round).toBe(2);
    expect(b.intentOf('brute')).toEqual({ move: 'bash', target: 'hero' });
    b.act({ type: 'guard' });
    expect(b.enemyTurn()).toContainEqual({ type: 'move', actor: 'brute', move: 'bash', target: 'hero' });
  });

  it('after an all-out attack, those still standing get up (an event, so the scene stands them up)', () => {
    const b = fight({ allOut: true });
    b.act({ type: 'skill', move: 'pull' });
    expect(b.act({ type: 'allOut' })).toContainEqual({ type: 'getUp', target: 'brute' });
  });

  it('someone knocked down spends their next turn getting up (and loses their intent)', () => {
    const b = fight({ party: ['hero', 'friend'], enemies: ['brute', 'brute'] });
    b.act({ type: 'skill', move: 'pull', target: 'brute' }); // brute down, One More
    const events = b.act({ type: 'attack', target: 'brute-2' }); // on to brute (down) → gets up → brute-2
    expect(events).toContainEqual({ type: 'getUp', target: 'brute' });
    expect(b.current?.id).toBe('brute-2');
  });
});

describe('Battle: off balance, then down (poise)', () => {
  it('with poise 2, the first weakness hit only throws him off balance: no knockdown, no One More', () => {
    const b = fight({ party: ['brawler'], enemies: ['tough'] });
    const events = b.act({ type: 'skill', move: 'pull' });
    expect(events).toContainEqual({ type: 'offBalance', target: 'tough', hits: 1, poise: 2 });
    expect(events.find((e) => e.type === 'knockdown' || e.type === 'oneMore')).toBeUndefined();
    expect(b.current?.id).toBe('tough');
  });

  it('a second one before he recovers knocks him down, with One More', () => {
    const b = fight({ party: ['brawler'], enemies: ['tough'] });
    b.act({ type: 'skill', move: 'pull' });
    b.enemyTurn(); // still off balance (one of his two turns gone)
    expect(b.get('tough').offBalance).toBe(1);
    const events = b.act({ type: 'skill', move: 'pull' });
    expect(events).toContainEqual({ type: 'knockdown', target: 'tough' });
    expect(events).toContainEqual({ type: 'oneMore', actor: 'brawler' });
  });

  it('given time, he finds his balance again', () => {
    const b = fight({ party: ['brawler'], enemies: ['tough'] });
    b.act({ type: 'skill', move: 'pull' });
    b.enemyTurn();
    b.act({ type: 'attack' });
    expect(b.enemyTurn()).toContainEqual({ type: 'recover', target: 'tough' });
    expect(b.get('tough').offBalance).toBe(0);
    expect(b.act({ type: 'skill', move: 'pull' })).toContainEqual({ type: 'offBalance', target: 'tough', hits: 1, poise: 2 });
  });

  it('just after getting up, he can’t be thrown off balance until he’s acted', () => {
    const b = fight({ party: ['brawler'], enemies: ['tough'] });
    b.act({ type: 'skill', move: 'pull' });
    b.enemyTurn();
    b.act({ type: 'skill', move: 'pull' }); // down, One More
    b.act({ type: 'attack' }); // he gets up (his turn); round 3
    expect(b.get('tough').steady).toBe(true);
    const events = b.act({ type: 'skill', move: 'pull' });
    expect(events).toContainEqual({ type: 'damage', target: 'tough', amount: 15, hp: expect.any(Number), weak: true });
    expect(events.find((e) => e.type === 'offBalance' || e.type === 'knockdown')).toBeUndefined();
    b.enemyTurn();
    expect(b.get('tough').steady).toBe(false);
    expect(b.act({ type: 'skill', move: 'pull' })).toContainEqual({ type: 'offBalance', target: 'tough', hits: 1, poise: 2 });
  });
});

describe('Battle: reactions on top', () => {
  it('a dodge halves the harm; a parry takes none and hits back', () => {
    const b = fight();
    b.act({ type: 'attack' });
    expect(b.enemyTurn('dodge')).toContainEqual({ type: 'damage', target: 'hero', amount: 5, hp: 45 });
    b.act({ type: 'attack' });
    const parried = b.enemyTurn('parry');
    expect(b.get('hero').hp).toBe(45);
    expect(parried).toContainEqual({ type: 'counter', actor: 'hero', target: 'brute' });
    expect(parried).toContainEqual({ type: 'damage', target: 'brute', amount: 5, hp: 45, resisted: true });
  });

  it('only combatants who can react do', () => {
    const b = fight({ party: ['friend'] });
    expect(b.reactionWindow('bash', 'friend')).toBeNull();
    expect(b.enemyTurn('parry')).toContainEqual({ type: 'damage', target: 'friend', amount: 10, hp: 40 });
  });

  it('only a press while the ring is in the band (the donut) counts: not before, not after', () => {
    const w = { kind: 'ring' as const, dodge: 400, late: 130, parry: 0, presses: 1, time: 0 };
    expect(Battle.grade(null, w)).toBe('none');
    expect(Battle.grade(500, w)).toBe('none'); // too early: the ring hasn't reached the band
    expect(Battle.tooEarly(500, w)).toBe(true);
    expect(Battle.grade(400, w)).toBe('dodge'); // the outer edge
    expect(Battle.grade(250, w)).toBe('dodge');
    expect(Battle.grade(130, w)).toBe('dodge'); // the inner edge
    expect(Battle.grade(100, w)).toBe('none'); // too late: it's inside the hole
    expect(Battle.tooEarly(100, w)).toBe(false);
    expect(Battle.grade(0, w)).toBe('none');
    expect(Battle.grade(250, null)).toBe('none');
  });

  it('a parry is the innermost part of the band, for those who can parry', () => {
    const w = { kind: 'ring' as const, dodge: 400, late: 130, parry: 60, presses: 1, time: 0 };
    expect(Battle.grade(150, w)).toBe('parry');
    expect(Battle.grade(190, w)).toBe('parry');
    expect(Battle.grade(200, w)).toBe('dodge');
    expect(Battle.grade(120, w)).toBe('none');
  });

  it('each fight sets how forgiving the timing is: the band widens inwards from its inner edge, never past the lunge', () => {
    expect(fight().timing).toEqual({ lunge: 650, ease: 1 });
    expect(fight().reactionWindow('bash', 'hero')).toEqual({ kind: 'ring', dodge: 250, late: 50, parry: 100, presses: 1, time: 0 });
    const easy = fight({ timing: { lunge: 1000, ease: 2 } });
    expect(easy.timing).toEqual({ lunge: 1000, ease: 2 });
    expect(easy.reactionWindow('bash', 'hero')).toMatchObject({ dodge: 450, late: 50, parry: 200 });
    expect(fight({ timing: { lunge: 300, ease: 3 } }).reactionWindow('bash', 'hero')).toMatchObject({ dodge: 300, late: 50, parry: 300 });
  });

  it('a side attack: dodge away from where it comes from, in the band', () => {
    const w = { kind: 'side' as const, dodge: 400, late: 130, parry: 0, presses: 1, time: 0 };
    expect(Battle.gradeSide(250, 'right', 'left', w)).toBe('dodge');
    expect(Battle.gradeSide(250, 'left', 'left', w)).toBe('none'); // into it
    expect(Battle.gradeSide(600, 'right', 'left', w)).toBe('none'); // too early
    expect(Battle.gradeSide(null, null, 'left', w)).toBe('none');
    const b = fight({ enemies: ['hooker'] });
    expect(['left', 'right']).toContain(b.intentOf('hooker')?.side);
    expect(b.reactionWindow('hook', 'hero')?.kind).toBe('side');
  });

  it('breaking a hold: enough presses in time, eased by the fight', () => {
    const b = fight({ enemies: ['holder'], timing: { ease: 2 } });
    const w = b.reactionWindow('hold', 'hero')!;
    expect(w).toMatchObject({ kind: 'mash', presses: 4, time: 1500 });
    expect(Battle.gradeMash(4, w)).toBe('dodge');
    expect(Battle.gradeMash(3, w)).toBe('none');
    b.act({ type: 'guard' });
    expect(b.enemyTurn('dodge')).toContainEqual({ type: 'damage', target: 'hero', amount: 3, hp: 47, guarded: true });
  });

  it('a flurry is one blow per reaction', () => {
    const b = fight({ enemies: ['flurrier'] });
    b.act({ type: 'attack' });
    const events = b.enemyTurn(['dodge', 'none']);
    expect(events.filter((e) => e.type === 'reaction').map((e) => (e as { reaction: string }).reaction)).toEqual(['dodge', 'none']);
    expect(events.filter((e) => e.type === 'damage').map((e) => (e as { amount: number }).amount)).toEqual([2, 4]);
  });

  it('the intent carries a tell to read (the move’s own, unless the enemy feints)', () => {
    expect(fight({ enemies: ['flurrier'] }).intentOf('flurrier')?.tell).toEqual({ pose: 'squared', line: 'He bounces.' });
    const lied = fight({ enemies: ['liar'] });
    expect(lied.intentOf('liar')?.move).toBe('flurry');
    expect(lied.intentOf('liar')?.tell).toEqual({ pose: 'cock', line: 'He drops a shoulder.' });
  });

  it('a shove breaks a wound-up blow before it comes: no blow, and he’s thrown off balance', () => {
    const b = fight({ enemies: ['charger'] });
    b.act({ type: 'guard' });
    b.enemyTurn(); // he winds up
    expect(b.intentOf('charger')).toMatchObject({ move: 'smash', charged: true });
    const events = b.act({ type: 'skill', move: 'shove' });
    expect(events).toContainEqual({ type: 'interrupt', target: 'charger' });
    expect(events).toContainEqual({ type: 'knockdown', target: 'charger' }); // poise 1
    expect(b.intentOf('charger')).toBeUndefined();
  });

  it('a shove does nothing special to an ordinary blow', () => {
    const b = fight({ enemies: ['charger'] });
    expect(b.act({ type: 'skill', move: 'shove' }).find((e) => e.type === 'interrupt')).toBeUndefined();
  });

  it('names duplicates apart', () => {
    expect(fight({ enemies: ['brute', 'brute'] }).combatants.map((c) => c.id)).toEqual(['hero', 'brute', 'brute-2']);
  });
});

describe('combat data', () => {
  it('every combatant, encounter and item refers to things that exist', () => {
    for (const c of Object.values(COMBATANTS)) for (const m of [...c.moves, ...(c.basic ? [c.basic] : [])]) expect(MOVES[m], `${c.id}: ${m}`).toBeDefined();
    for (const e of Object.values(ENCOUNTERS)) {
      for (const id of [...e.party, ...e.enemies]) expect(COMBATANTS[id], `${e.id}: ${id}`).toBeDefined();
      for (const id of Object.keys(e.items ?? {})) expect(ITEMS[id], `${e.id}: ${id}`).toBeDefined();
      expect(Object.keys(e.outcomes)).toEqual(expect.arrayContaining(['won', 'lost', ...(e.run ? [e.run] : [])]));
      for (const id of e.party) for (const m of COMBATANTS[id]!.moves) {
        const ends = MOVES[m]!.ends;
        if (ends) expect(e.outcomes[ends], `${e.id}: ${ends}`).toBeDefined();
      }
    }
    for (const m of Object.values(MOVES)) if (m.windsUp) expect(MOVES[m.windsUp]).toBeDefined();
  });

  it('every party member has a basic attack', () => {
    for (const e of Object.values(ENCOUNTERS)) for (const id of e.party) expect(COMBATANTS[id]!.basic).toBeDefined();
  });

  it('outcomes only write variables the story declares', () => {
    const declared = new Set([...readFileSync('story/main.ink', 'utf8').matchAll(/^VAR (\w+)/gm)].map((m) => m[1]));
    for (const e of Object.values(ENCOUNTERS)) {
      for (const vars of Object.values(e.outcomes)) for (const name of Object.keys(vars)) expect(declared.has(name), name).toBe(true);
    }
  });

  it('in the market scrap you can only dodge (parrying comes later in the story)', () => {
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, half);
    expect(b.reactionWindow('swing', 'carver')?.parry).toBe(0);
    expect(b.reactionWindow('swing', 'carver')?.dodge).toBeGreaterThan(400);
  });

  it('the market scrap can be won by playing well (grabs, slaps, dodging)', () => {
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, half);
    let guard = 0;
    while (!b.outcome && guard++ < 60) {
      if (b.current!.side === 'enemy') b.enemyTurn('dodge');
      else if (b.skills().find((s) => s.move.id === 'grab')!.usable) b.act({ type: 'skill', move: 'grab' });
      else b.act({ type: 'attack' });
    }
    expect(b.outcome).toBe('won');
  });

  it('the market scrap can be lost if you never dodge and never guard', () => {
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, half);
    let guard = 0;
    while (!b.outcome && guard++ < 60) b.current!.side === 'enemy' ? b.enemyTurn('none') : b.act({ type: 'attack' });
    expect(b.outcome).toBe('lost');
  });
});
