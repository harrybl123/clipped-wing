import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMBATANTS, ENCOUNTERS, ITEMS, LESSONS, MOVES } from '../src/data/combat';
import { aiWeights, ALL_OUT_POWER, Battle, type BattleEvent, type CombatantDef, type EncounterDef, type ItemDef, type MoveDef, type Reaction } from '../src/systems/Combat';

// Small test data, so the numbers are easy: attack = defence, so harm = power × multipliers. An rng
// fixed at 0.5 means no variance (×1.0), no criticals (unless crit is 1) and the middle weighted pick.
const half = () => 0.5;
const MV: Record<string, MoveDef> = {
  punch: { id: 'punch', name: 'Punch', description: '', target: 'enemy', power: 10, kind: 'strike' },
  lucky: { id: 'lucky', name: 'Lucky', description: '', target: 'enemy', power: 10, kind: 'strike', crit: 1 },
  pull: { id: 'pull', name: 'Pull', description: '', target: 'enemy', power: 10, kind: 'grab', sp: 4 },
  leave: { id: 'leave', name: 'Leave', description: '', target: 'self', ends: 'left' },
  bash: { id: 'bash', name: 'Bash', description: '', target: 'enemy', power: 10, kind: 'strike', qte: { kind: 'ring', outer: 250, inner: 50, perfect: 100 } },
  charge: { id: 'charge', name: 'Charge', description: '', target: 'self', windsUp: 'smash' },
  smash: { id: 'smash', name: 'Smash', description: '', target: 'enemy', power: 30, kind: 'strike', qte: { kind: 'ring', outer: 200, inner: 50, perfect: 80 } },
  hook: { id: 'hook', name: 'Hook', description: '', target: 'enemy', power: 10, kind: 'strike', qte: { kind: 'side', outer: 250, inner: 50 }, tell: { pose: 'cock', lines: ['He drops a shoulder.'] } },
  flurry: { id: 'flurry', name: 'Flurry', description: '', target: 'enemy', power: 4, kind: 'strike', hits: 2, qte: { kind: 'notes', outer: 180, perfect: 70, gap: 400 }, tell: { pose: 'squared', lines: ['He bounces.'] } },
  hold: { id: 'hold', name: 'Hold', description: '', target: 'enemy', power: 10, kind: 'grab', qte: { kind: 'mash', presses: 8, time: 1500 } },
  jab: { id: 'jab', name: 'Jab', description: '', target: 'enemy', power: 10, kind: 'strike', qte: { kind: 'key', time: 900 } },
  combo: { id: 'combo', name: 'Combo', description: '', target: 'enemy', power: 10, kind: 'strike', hits: 3, qte: { kind: 'notes', outer: 180 }, combo: { build: 0.5, finisher: true } },
  shove: { id: 'shove', name: 'Shove', description: '', target: 'enemy', power: 2, kind: 'shove', interrupts: true },
};
const DEFS: Record<string, CombatantDef> = {
  hero: { id: 'hero', name: 'Hero', sprite: 'x', hp: 50, sp: 6, attack: 10, defence: 10, speed: 5, basic: 'punch', moves: ['pull', 'lucky', 'leave', 'shove', 'jab'], reactions: ['dodge', 'parry'] },
  friend: { id: 'friend', name: 'Friend', sprite: 'x', hp: 50, attack: 10, defence: 10, speed: 1, basic: 'punch', moves: [] },
  brute: { id: 'brute', name: 'Brute', sprite: 'x', hp: 60, attack: 10, defence: 10, speed: 3, moves: ['bash'], weak: ['grab'], resists: ['strike'] },
  brawler: { id: 'brawler', name: 'Brawler', sprite: 'x', hp: 50, sp: 40, attack: 10, defence: 10, speed: 5, basic: 'punch', moves: ['pull', 'combo'] },
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

  it('a good QTE on an enemy’s blow is a dodge; a perfect one a parry (the grades are in tests/qte.test.ts)', () => {
    expect(Battle.reactionFor('miss')).toBe('none');
    expect(Battle.reactionFor('good')).toBe('dodge');
    expect(Battle.reactionFor('perfect')).toBe('parry');
  });

  it('a perfect only counts for those who can parry: otherwise the QTE has no perfect', () => {
    expect(fight().reactionWindow('bash', 'hero')?.perfect).toBe(100);
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, half);
    expect(b.reactionWindow('swing', 'carver')?.perfect).toBe(0);
  });

  it('each fight eases its QTEs: the band widens inwards from its inner edge, never past the lunge', () => {
    expect(fight().timing).toEqual({ lunge: 650, ease: 1 });
    expect(fight().reactionWindow('bash', 'hero')).toMatchObject({ kind: 'ring', outer: 250, inner: 50, perfect: 100, time: 650 });
    const easy = fight({ timing: { lunge: 1000, ease: 2 } });
    expect(easy.reactionWindow('bash', 'hero')).toMatchObject({ outer: 450, inner: 50, perfect: 200 });
    expect(fight({ timing: { lunge: 300, ease: 3 } }).reactionWindow('bash', 'hero')).toMatchObject({ outer: 300, inner: 50 });
  });

  it('your own skill’s QTE decides how it lands: a miss glances (60%), good ×1.3, perfect ×1.6', () => {
    for (const [grade, amount] of [['miss', 6], ['good', 13], ['perfect', 16]] as const) {
      const b = fight({ enemies: ['charger'] });
      expect(b.act({ type: 'skill', move: 'jab', grades: [grade] })).toContainEqual({ type: 'damage', target: 'charger', amount, hp: 60 - amount });
    }
    const plain = fight({ enemies: ['charger'] });
    expect(plain.act({ type: 'skill', move: 'jab' })).toContainEqual({ type: 'damage', target: 'charger', amount: 10, hp: 50 });
  });

  it('a combo builds: each blow you land makes the next harder; land them all and the last throws him off balance', () => {
    const b = fight({ party: ['brawler'], enemies: ['tough'] });
    const events = b.act({ type: 'skill', move: 'combo', grades: ['good', 'good', 'good'] });
    // 10 × 1.3, then × (1 + 0.5), then × (1 + 1).
    expect(events.filter((e) => e.type === 'damage').map((e) => (e as { amount: number }).amount)).toEqual([13, 20, 26]);
    expect(events).toContainEqual({ type: 'offBalance', target: 'tough', hits: 1, poise: 2 });
    const missed = fight({ party: ['brawler'], enemies: ['tough'] });
    const e2 = missed.act({ type: 'skill', move: 'combo', grades: ['good', 'miss', 'good'] });
    // 13, then the miss glances (10 × 0.6 × 1.5 = 9), then 10 × 1.3 × (1 + 0.5) = 20 (the miss didn't build).
    expect(e2.filter((e) => e.type === 'damage').map((e) => (e as { amount: number }).amount)).toEqual([13, 9, 20]);
    expect(e2.find((e) => e.type === 'offBalance')).toBeUndefined();
  });

  it('a defeated enemy leaves the fight: he can\u2019t be gone for, and doesn\u2019t act', () => {
    const b = fight({ enemies: ['charger', 'charger'] });
    b.get('charger').hp = 1;
    b.act({ type: 'attack', target: 'charger' });
    expect(b.get('charger').hp).toBe(0);
    expect(b.living('enemy').map((e) => e.id)).toEqual(['charger-2']);
    // His turn is skipped: the next to act is the other one.
    expect(b.current?.id).toBe('charger-2');
    b.enemyTurn();
    expect(b.current?.id).toBe('hero');
    expect(() => b.act({ type: 'attack', target: 'charger' })).toThrow(/isn't in the fight/);
    expect(b.intentOf('charger')).toBeUndefined();
  });

  it('with more than one enemy, your blow goes to the one you chose', () => {
    const b = fight({ enemies: ['charger', 'charger'] });
    const events = b.act({ type: 'attack', target: 'charger-2' });
    expect(events).toContainEqual({ type: 'damage', target: 'charger-2', amount: 10, hp: 50 });
    expect(b.get('charger').hp).toBe(60);
    expect(() => b.act({ type: 'attack', target: 'nobody' })).toThrow();
  });

  it('a side attack: the intent says which side it comes from', () => {
    const b = fight({ enemies: ['hooker'] });
    expect(['left', 'right']).toContain(b.intentOf('hooker')?.side);
    expect(b.reactionWindow('hook', 'hero')?.kind).toBe('side');
  });

  it('breaking a hold: enough presses in time, eased by the fight', () => {
    const b = fight({ enemies: ['holder'], timing: { ease: 2 } });
    expect(b.reactionWindow('hold', 'hero')).toMatchObject({ kind: 'mash', presses: 4, time: 1500 });
    b.act({ type: 'guard' });
    expect(b.enemyTurn('dodge')).toContainEqual({ type: 'damage', target: 'hero', amount: 3, hp: 47, guarded: true });
  });

  it('missing your reaction to his blow takes the full blow; a dodge takes half', () => {
    const missed = fight();
    missed.act({ type: 'guard' });
    const full = missed.enemyTurn(Battle.reactionFor('miss'));
    const dodged = fight();
    dodged.act({ type: 'guard' });
    const half = dodged.enemyTurn(Battle.reactionFor('good'));
    expect(full).toContainEqual({ type: 'damage', target: 'hero', amount: 5, hp: 45, guarded: true });
    expect(half).toContainEqual({ type: 'damage', target: 'hero', amount: 3, hp: 47, guarded: true });
  });

  it('the haymaker is big clean, but a guard takes most of it and a dodge nearly all', () => {
    const hit = (guard: boolean, reaction: 'none' | 'dodge') => {
      const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, { ...COMBATANTS, zealot: { ...COMBATANTS.zealot!, moves: ['wind_up'], weights: [1], ai: {} } }, ITEMS, half);
      b.act({ type: 'guard' });
      b.enemyTurn(); // he winds up
      b.act(guard ? { type: 'guard' } : { type: 'skill', move: 'shove', target: 'zealot' });
      if (!guard) return null; // (a shove breaks it: no haymaker)
      const events = b.enemyTurn(reaction);
      return (events.find((e) => e.type === 'damage') as { amount: number } | undefined)?.amount ?? 0;
    };
    const clean = (() => {
      const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, { ...COMBATANTS, zealot: { ...COMBATANTS.zealot!, moves: ['wind_up'], weights: [1], ai: {} } }, ITEMS, half);
      b.act({ type: 'guard' });
      b.enemyTurn();
      b.act({ type: 'attack' });
      return (b.enemyTurn('none').find((e) => e.type === 'damage') as { amount: number }).amount;
    })();
    expect(clean).toBe(20);
    expect(hit(true, 'none')).toBe(5);
    expect(hit(true, 'dodge')).toBe(1);
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

describe('Enemy temperament (ai)', () => {
  const def: CombatantDef = {
    id: 'z', name: 'Z', sprite: 'x', hp: 40, attack: 10, defence: 10, speed: 1,
    moves: ['a', 'b', 'c'], weights: [2, 1, 1],
    ai: { opening: ['c', 'b'], maxRepeat: 2, when: { hurt: { a: 0, b: 3 }, foeHurt: { c: 5 }, foeGuarding: { b: 0 } } },
  };
  const calm = { hurt: false, foeHurt: false, foeGuarding: false };

  it('plays its opening moves first, in order', () => {
    expect(aiWeights(def, [], calm)).toEqual([0, 0, 1]);
    expect(aiWeights(def, ['c'], calm)).toEqual([0, 1, 0]);
    expect(aiWeights(def, ['c', 'b'], calm)).toEqual([2, 1, 1]);
  });

  it('never the same move more than maxRepeat times running', () => {
    expect(aiWeights(def, ['c', 'b', 'a'], calm)).toEqual([2, 1, 1]);
    expect(aiWeights(def, ['c', 'b', 'a', 'a'], calm)).toEqual([0, 1, 1]);
    expect(aiWeights(def, ['c', 'b', 'a', 'b', 'a'], calm)).toEqual([2, 1, 1]);
  });

  it('reacts to the fight: hurt, the foe hurt, the foe guarding', () => {
    const h = ['c', 'b'];
    expect(aiWeights(def, h, { ...calm, hurt: true })).toEqual([0, 3, 1]);
    expect(aiWeights(def, h, { ...calm, foeHurt: true })).toEqual([2, 1, 5]);
    expect(aiWeights(def, h, { ...calm, foeGuarding: true })).toEqual([2, 0, 1]);
  });

  it('if its temperament rules everything out, it falls back on its plain weights', () => {
    const stubborn: CombatantDef = { ...def, moves: ['a'], weights: [1], ai: { maxRepeat: 1 } };
    expect(aiWeights(stubborn, ['a'], calm)).toEqual([1]);
  });

  it('the zealot shows you every way of reacting in the first rounds', () => {
    const rolls = [0.1, 0.5, 0.9, 0.3, 0.7];
    let i = 0;
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, () => rolls[i++ % rolls.length]!);
    const kinds = new Set<string>();
    const moves: string[] = [];
    while (!b.outcome && b.round <= 6) {
      if (b.current!.side === 'party') b.act({ type: 'guard' });
      else {
        const move = b.intentOf(b.current!.id)!.move;
        moves.push(move);
        const kind = b.reactionWindow(move, 'carver', 0, null)?.kind;
        if (kind) kinds.add(kind);
        b.enemyTurn('dodge');
      }
    }
    expect(moves.slice(0, 6)).toEqual(['swing', 'hook', 'flurry', 'wind_up', 'haymaker', 'collar']);
    expect([...kinds].sort()).toEqual(['draw', 'grip', 'notes', 'ring', 'weave']);
  });

  it('over many fights he uses all his moves regularly, and none more than twice running', () => {
    // A seeded generator, so this is the same every run.
    let seed = 12345;
    const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const counts: Record<string, number> = {};
    let picks = 0;
    for (let fight = 0; fight < 200; fight++) {
      const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, rng);
      const seen: string[] = [];
      while (!b.outcome && b.round <= 12) {
        if (b.current!.side === 'party') b.act({ type: 'guard' });
        else {
          const move = b.intentOf(b.current!.id)?.move;
          if (move && move !== 'haymaker') {
            seen.push(move);
            counts[move] = (counts[move] ?? 0) + 1;
            picks++;
          }
          b.enemyTurn('dodge');
        }
      }
      for (let i = 2; i < seen.length; i++) expect(seen[i] === seen[i - 1] && seen[i] === seen[i - 2], seen.join(',')).toBe(false);
    }
    for (const m of ['swing', 'hook', 'flurry', 'collar', 'wind_up']) expect(counts[m]! / picks, m).toBeGreaterThan(0.12);
    expect(Math.max(...Object.values(counts)) / picks).toBeLessThan(0.3);
  });

  it('the zealot grabs you more if you keep guarding', () => {
    const z = COMBATANTS.zealot!;
    const after = ['swing', 'hook', 'flurry', 'wind_up', 'collar'];
    const plain = aiWeights(z, after, { hurt: false, foeHurt: false, foeGuarding: false });
    const guarded = aiWeights(z, after, { hurt: false, foeHurt: false, foeGuarding: true });
    const collar = z.moves.indexOf('collar');
    expect(guarded[collar]! / guarded.reduce((a, b) => a + b, 0)).toBeGreaterThan(plain[collar]! / plain.reduce((a, b) => a + b, 0));
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

  it('the ring is only for the zealot\u2019s swing; every other move has another kind (and an alt)', () => {
    const kinds = Object.values(MOVES).filter((m) => m.qte).map((m) => [m.id, Array.isArray(m.qte) ? m.qte[0]!.kind : m.qte!.kind] as const);
    expect(kinds.filter(([, k]) => k === 'ring').map(([id]) => id)).toEqual(['swing']);
    for (const m of Object.values(MOVES)) if (m.qte && !Array.isArray(m.qte)) expect(m.qte.alt, m.id).toBeDefined();
    expect(new Set(kinds.map(([, k]) => k)).size).toBeGreaterThanOrEqual(6);
  });

  it('a move uses its alt when the last QTE shown was the same kind', () => {
    const b = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, half);
    expect(b.reactionWindow('swing', 'carver', 0, null)?.kind).toBe('ring');
    expect(b.reactionWindow('swing', 'carver', 0, 'ring')?.kind).toBe('bar');
    expect(b.qteFor('shove', 0, true, 'bar')?.kind).toBe('key');
  });

  it('no move ends the fight early (Hold back is gone; holding back is the story\u2019s choice)', () => {
    expect(MOVES.hold_back).toBeUndefined();
    for (const m of Object.values(MOVES)) expect(m.ends, m.id).toBeUndefined();
    for (const e of Object.values(ENCOUNTERS)) expect(Object.keys(e.outcomes).sort()).toEqual(['lost', 'won']);
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
    expect(b.reactionWindow('swing', 'carver')?.perfect).toBe(0);
    expect(b.reactionWindow('swing', 'carver')?.outer).toBeGreaterThan(400);
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

describe('the market scrap teaches itself', () => {
  it('is the only fight that teaches (with the rot; not Chapter 2), and every lesson says what to press', () => {
    expect(Object.values(ENCOUNTERS).filter((e) => e.teaches).map((e) => e.id)).toEqual(['market_scrap', 'rot_beetles']);
    for (const e of Object.values(ENCOUNTERS)) for (const l of [...(e.teaches ?? []), ...(e.alsoTeaches?.lessons ?? [])]) expect(LESSONS).toHaveProperty(l);
    // Held back at the market (never fought): the rot fight teaches everything the market would have.
    expect(ENCOUNTERS.rot_beetles!.alsoTeaches).toEqual({ unless: 'fought', lessons: ENCOUNTERS.market_scrap!.teaches });
    for (const lesson of Object.values(LESSONS)) expect(lesson.length).toBeGreaterThan(0);
  });

  it('Day 4 starts it, and it writes the fight_won the story reads', () => {
    expect(readFileSync('story/day4.ink', 'utf8')).toContain('#combat:market_scrap:day4_after_fight');
    expect(ENCOUNTERS.market_scrap!.outcomes).toEqual({ won: { fight_won: true }, lost: { fight_won: false } });
  });
});

describe('the deep rot: the girl and the beetles', () => {
  const mulberry = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  it('is the two of you against three beetles, and writes rot_beetles_won', () => {
    const e = ENCOUNTERS.rot_beetles!;
    expect(e.party).toEqual(['carver', 'girl']);
    expect(e.enemies).toEqual(['beetle', 'beetle', 'beetle']);
    expect(e.outcomes).toEqual({ won: { rot_beetles_won: true }, lost: { rot_beetles_won: false } });
    expect(readFileSync('story/day4.ink', 'utf8')).toContain('#combat:rot_beetles:');
  });

  it('Lure turns every enemy that is about to attack onto her, and she braces', () => {
    const b = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, mulberry(3));
    expect(b.current!.id).toBe('girl'); // (the fastest)
    b.act({ type: 'skill', move: 'lure' });
    const girl = b.get('girl');
    expect(girl.guarding).toBe(true);
    expect(girl.sp).toBe(9);
    for (const foe of b.living('enemy')) {
      const intent = b.intentOf(foe.id)!;
      if (MOVES[intent.move]!.target === 'enemy') expect(intent.target).toBe('girl');
    }
  });

  it('Switch hands the turn to a friend who has yet to act, once a round', () => {
    const b = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, mulberry(5));
    expect(b.current!.id).toBe('girl');
    expect(b.commands().find((c) => c.type === 'switch')).toEqual({ type: 'switch', usable: true });
    expect(b.act({ type: 'switch' })).toEqual([{ type: 'switch', from: 'girl', to: 'carver' }]);
    // The carver goes now; the girl takes his place later in the round.
    expect(b.current!.id).toBe('carver');
    expect(b.commands().find((c) => c.type === 'switch')).toMatchObject({ usable: false, reason: 'Once a round' });
    b.act({ type: 'guard' });
    let guard = 0;
    while (b.current!.side === 'enemy' && guard++ < 10) b.enemyTurn('none');
    if (b.round === 1) expect(b.current!.id).toBe('girl');
  });

  it('there is no Switch alone, or when your friend has already acted', () => {
    const solo = new Battle(ENCOUNTERS.market_scrap!, MOVES, COMBATANTS, ITEMS, mulberry(1));
    expect(solo.commands().some((c) => c.type === 'switch')).toBe(false);
    const b = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, mulberry(5));
    b.act({ type: 'guard' }); // the girl
    if (b.current!.id === 'carver') expect(b.commands().find((c) => c.type === 'switch')).toMatchObject({ usable: false, reason: 'Everyone has acted' });
  });

  it('Rot-ink weakens one beetle for three rounds, and it takes more harm meanwhile', () => {
    const plain = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, () => 0.5);
    const inked = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, () => 0.5);
    const events = inked.act({ type: 'skill', move: 'rot_ink', target: 'beetle', grades: ['good'] });
    expect(events).toContainEqual({ type: 'weakened', target: 'beetle' });
    expect(inked.get('beetle').exposed).toBe(3);
    // The same shove on a weakened beetle hurts more.
    const hit = (b: Battle) => {
      while (b.current!.id !== 'carver') b.current!.side === 'enemy' ? b.enemyTurn('none') : b.act({ type: 'guard' });
      const ev = b.act({ type: 'skill', move: 'shove', target: 'beetle', grades: ['good'] });
      return (ev.find((x) => x.type === 'damage') as { amount: number }).amount;
    };
    expect(hit(inked)).toBeGreaterThan(hit(plain));
  });

  it('a good player wins, an average one usually does, and a careless one often loses (200 seeded fights)', () => {
    // `dodge`: how often they get out of the way; `good`: how often their own QTEs land.
    const play = (seed: number, dodge: number, good: number): string => {
      const rng = mulberry(seed);
      const b = new Battle(ENCOUNTERS.rot_beetles!, MOVES, COMBATANTS, ITEMS, rng);
      let guard = 0;
      while (!b.outcome && guard++ < 400) {
        const c = b.current!;
        if (c.side === 'enemy') {
          b.enemyTurn(rng() < dodge ? 'dodge' : 'none');
          continue;
        }
        const foe = b.living('enemy').find((f) => !f.down) ?? b.living('enemy')[0]!;
        const move = c.id === 'girl' ? 'flick' : 'shove';
        const grades: ('good' | 'miss')[] = [rng() < good ? 'good' : 'miss'];
        if (c.sp >= (MOVES[move]!.sp ?? 0)) b.act({ type: 'skill', move, target: foe.id, grades });
        else b.act({ type: 'attack', target: foe.id, grades });
      }
      return b.outcome ?? 'none';
    };
    const wins = (dodge: number, good: number) => Array.from({ length: 200 }, (_, i) => play(i + 1, dodge, good)).filter((o) => o === 'won').length / 200;
    const good = wins(0.8, 0.9);
    const average = wins(0.5, 0.6);
    const careless = wins(0.15, 0.3);
    expect(good).toBeGreaterThan(0.85);
    expect(average).toBeGreaterThan(0.5);
    expect(average).toBeLessThan(0.97);
    expect(careless).toBeLessThan(average);
    expect(careless).toBeLessThan(0.85);
  });
});

describe('Chapter 2: the scavenger, the dog and the stragglers', () => {
  const rng = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Plays enemies' turns until it's the party's (or the fight ends). */
  const toParty = (b: Battle, reaction: Reaction = 'none') => {
    while (!b.outcome && b.current!.side === 'enemy') b.enemyTurn(reaction);
  };

  it('each has their own skills, none borrowed from Act 1', () => {
    const act1 = new Set([...COMBATANTS.carver!.moves, COMBATANTS.carver!.basic, ...COMBATANTS.girl!.moves, COMBATANTS.girl!.basic]);
    for (const id of ['scavenger', 'dog', 'straggler_thin', 'straggler_big']) {
      const def = COMBATANTS[id]!;
      for (const m of [def.basic, ...def.moves].filter(Boolean)) expect(act1.has(m!), `${id}: ${m}`).toBe(false);
    }
    expect(COMBATANTS.scavenger!.reactions).toEqual(['dodge', 'parry']);
  });

  it('the stragglers fight is hers alone, on the fields, and writes stragglers_won', () => {
    const e = ENCOUNTERS.stragglers!;
    expect(e.party).toEqual(['scavenger']);
    expect(e.stage).toBe('fields');
    expect(e.outcomes).toEqual({ won: { stragglers_won: true }, lost: { stragglers_won: false } });
  });

  it('Brace: the next blow she dodges, she parries and hits back; then it\u2019s spent', () => {
    const b = new Battle(ENCOUNTERS.stragglers!, MOVES, COMBATANTS, ITEMS, rng(3));
    toParty(b);
    expect(b.current!.id).toBe('scavenger');
    const events = b.act({ type: 'skill', move: 'brace' });
    expect(events.some((e) => e.type === 'braced')).toBe(true);
    // The stragglers' attacks this round: the first dodge becomes a parry (no harm, a counter), then it's spent.
    const after: BattleEvent[] = [];
    while (!b.outcome && b.current!.side === 'enemy') after.push(...b.enemyTurn('dodge'));
    const reactions = after.filter((e) => e.type === 'reaction');
    if (reactions.length) {
      expect(reactions[0]).toMatchObject({ reaction: 'parry' });
      for (const r of reactions.slice(1)) expect(r).toMatchObject({ reaction: 'dodge' });
      expect(after.some((e) => e.type === 'counter')).toBe(true);
    }
    expect(b.get('scavenger').braced).toBe(reactions.length === 0);
  });

  it('Grit half-blinds: reacting is harder for two rounds', () => {
    const b = new Battle(ENCOUNTERS.stragglers!, MOVES, COMBATANTS, ITEMS, rng(5));
    const before = b.reactionWindow('shank', 'scavenger')!;
    b.get('scavenger').blinded = 2;
    const blind = b.reactionWindow('shank', 'scavenger')!;
    expect(blind.time).toBeLessThan(before.time);
    expect(MOVES.grit!.blinds).toBe(2);
  });

  it('the camp fight: you and the dog against all three, and it writes camp_won', () => {
    const e = ENCOUNTERS.stragglers_camp!;
    expect(e.party).toEqual(['scavenger', 'dog']);
    expect(e.enemies).toHaveLength(3);
    expect(e.teaches).toBeUndefined();
    expect(e.outcomes).toEqual({ won: { camp_won: true }, lost: { camp_won: false } });
  });

  it('Pinch takes SP off what it hits', () => {
    const b = new Battle(ENCOUNTERS.stragglers_camp!, MOVES, COMBATANTS, ITEMS, rng(4));
    const you = b.get('scavenger');
    const before = you.sp;
    const events = (b as unknown as { harm: (a: unknown, m: MoveDef, t: unknown, s: number, k: boolean) => BattleEvent[] }).harm(b.get('straggler_small'), MOVES.pinch!, you, 1, false);
    expect(events.some((e) => e.type === 'drained')).toBe(true);
    expect(you.sp).toBe(before - 3);
  });

  it('Sniff shows every enemy\u2019s real move: no feints', () => {
    const tricky = { ...COMBATANTS, straggler_thin: { ...COMBATANTS.straggler_thin!, feint: 1 } };
    const fight = { ...ENCOUNTERS.stragglers!, party: ['dog'] };
    const b = new Battle(fight, MOVES, tricky, ITEMS, rng(9));
    toParty(b);
    b.act({ type: 'skill', move: 'sniff' });
    for (const foe of b.living('enemy')) {
      const intent = b.intentOf(foe.id);
      const tell = MOVES[intent!.move]!.tell;
      if (tell && intent!.tell) expect(tell.lines).toContain(intent!.tell.line);
    }
  });
});
