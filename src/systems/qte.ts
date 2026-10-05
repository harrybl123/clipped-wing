// Quick-time events (docs/combat-design.md): the little timing games on top of the turn-based fight. Pure
// logic, no Phaser: the definitions, how a fight eases them, and how a press is graded. CombatScene draws
// and runs them. Any move can have one: on an enemy's attack it's your reaction (a good one is a dodge,
// half harm; a perfect one, for those who can parry, is a parry); on your own skill it decides how well the
// blow lands (a miss glances off for less; good and perfect hit harder). On his attacks a miss is the full blow.
//
//   ring   a ring closes on your head as the blow comes; press while it's inside the band (the donut)
//   side   the same ring, but press Left or Right: away from the arm he drew back (a read)
//   key    a key appears (an arrow); press that one, quickly; the wrong key is a miss
//   bar    a marker sweeps along a bar; press while it's in the lit zone
//   hold   hold E to fill a meter, and let go while it's in the zone (too long and it's spent)
//   mash   press E again and again, enough times before the time runs out
//   notes  arrows fall down lanes to a line, one per blow; press each as it crosses (Guitar Hero style)
//   draw   a quick draw: hold still, then press the instant the flash comes (any sooner is a miss)
//   weave  a quick run of directions as the punches come, one per blow: Up to duck, Left or Right to lean
//   balance  a wobbling needle: keep it in the middle with Left and Right until it's over
//   carve  trace a short pattern of arrows, shown as a carved line (the carver's craft)
//   grip   he's got you by the collar: his tugs yank a marker about; hold Left and Right to keep it in a
//          lit zone (which drifts and narrows); your grip fills while it's in, drains while it's out; fill
//          it to break free before the time's up
// A move can name an `alt`, used instead when the last QTE shown was the same kind, so you never get the
// same one twice running.
// Every one stops where you press, so you can see how you did, and the blow lands on that beat.

export type QteKind = 'ring' | 'side' | 'key' | 'bar' | 'hold' | 'mash' | 'notes' | 'draw' | 'weave' | 'balance' | 'carve' | 'grip';
export type Grade = 'miss' | 'good' | 'perfect';
export type Key = 'up' | 'down' | 'left' | 'right';
export const KEYS: readonly Key[] = ['up', 'down', 'left', 'right'];

export interface QteDef {
  kind: QteKind;
  /**
   * ring, side: the band, in ms before the blow lands: good from `outer` in to `inner`; perfect within
   * `perfect` ms of the inner edge. notes: good within `outer` ms either side of the line, perfect within
   * `perfect`.
   */
  outer?: number;
  inner?: number;
  perfect?: number;
  /** key, bar, hold, mash: how long it runs (ms). ring, side: how long the ring takes to close (default the fight's). */
  time?: number;
  /** bar, hold: the lit zone, as fractions of the bar or meter, and the sweet spot inside it (perfect). */
  zone?: [number, number];
  sweet?: [number, number];
  /** key: pressed within this many ms of the key showing is perfect. */
  quick?: number;
  /** mash: presses needed. */
  presses?: number;
  /** notes, weave: ms between one note (or prompt) and the next (one per blow). */
  gap?: number;
  /** draw: how long you wait, still, before the flash (ms, somewhere between the two). */
  wait?: [number, number];
  /** balance: the share of the time the needle must stay in the zone (good), and for perfect. */
  keep?: number;
  keepPerfect?: number;
  /** carve: how many strokes in the pattern (a one-blow move; a combo carves one per blow). */
  strokes?: number;
  /** grip: how narrow the zone gets by the end (a share of the track), and how hard his tugs are (0–1). */
  narrow?: number;
  tug?: number;
  /** notes: which lanes the notes fall in (default all four; dodging: Left, Up, Right). */
  lanes?: Key[];
  /** Used instead when the last QTE shown was this one's kind. */
  alt?: QteDef;
}

/** A QTE as a fight sets it: every number filled in, and eased. */
export interface Qte {
  kind: QteKind;
  outer: number;
  inner: number;
  perfect: number;
  time: number;
  zone: [number, number];
  sweet: [number, number];
  quick: number;
  presses: number;
  gap: number;
  wait: [number, number];
  keep: number;
  keepPerfect: number;
  strokes: number;
  lanes: Key[];
  narrow: number;
  tug: number;
}

/**
 * How much more a QTE gives when a fight eases it (`ease`, 1 = as written; early fights are higher):
 * bands and zones widen, time to answer a key grows, fewer presses are needed. `lunge` is the fight's
 * default time for a ring to close. `canPerfect` is false when a perfect can't be reached (you can't parry
 * yet).
 */
export function easeQte(def: QteDef, ease: number, lunge: number, canPerfect = true): Qte {
  const time = def.time ?? lunge;
  const inner = def.inner ?? 0;
  const widen = ([a, b]: [number, number]): [number, number] => {
    const mid = (a + b) / 2;
    const half = ((b - a) / 2) * ease;
    return [Math.max(0, mid - half), Math.min(1, mid + half)];
  };
  const zone = widen(def.zone ?? [0.6, 0.8]);
  return {
    kind: def.kind,
    outer: def.kind === 'notes' ? Math.round((def.outer ?? 0) * ease) : Math.min(time, Math.round(inner + Math.max(0, (def.outer ?? 0) - inner) * ease)),
    inner,
    perfect: canPerfect ? Math.round((def.perfect ?? 0) * ease) : 0,
    time: ['key', 'weave', 'draw', 'carve'].includes(def.kind) ? Math.round(time * ease) : time,
    zone,
    sweet: canPerfect && def.sweet ? widen(def.sweet) : [0, -1],
    quick: canPerfect ? Math.round((def.quick ?? 0) * ease) : 0,
    presses: Math.max(1, Math.round((def.presses ?? 0) / ease)),
    gap: Math.round((def.gap ?? 0) * Math.max(1, ease)),
    wait: def.wait ?? [600, 1200],
    keep: Math.min(1, (def.keep ?? 0.6) / Math.max(1, ease)),
    keepPerfect: canPerfect ? Math.min(1, (def.keepPerfect ?? 0.9) / Math.max(1, ease ** 0.5)) : 2,
    strokes: Math.max(1, def.strokes ?? 3),
    lanes: def.lanes ?? ['left', 'up', 'down', 'right'],
    narrow: Math.min(1, (def.narrow ?? 0.15) * ease),
    tug: (def.tug ?? 0.5) / ease,
  };
}

/** A ring: `before` is how many ms before the blow you pressed (null: you didn't). */
export function gradeRing(before: number | null, q: Qte): Grade {
  if (before === null || before > q.outer || before < q.inner) return 'miss';
  return q.perfect > 0 && before <= q.inner + q.perfect ? 'perfect' : 'good';
}

/** A ring you dodge sideways: the arrow away from the side the blow comes from. */
export function gradeSide(before: number | null, pressed: 'left' | 'right' | null, from: 'left' | 'right', q: Qte): Grade {
  return !pressed || pressed === from ? 'miss' : gradeRing(before, q);
}

/** A key: the one shown, in time (`after` ms after it showed; null: you didn't). */
export function gradeKey(shown: Key, pressed: Key | null, after: number | null, q: Qte): Grade {
  if (pressed === null || after === null || pressed !== shown || after > q.time) return 'miss';
  return q.quick > 0 && after <= q.quick ? 'perfect' : 'good';
}

/** A bar or a hold: where the marker or meter was (0–1) when you pressed or let go (null: you didn't). */
export function gradeZone(at: number | null, q: Qte): Grade {
  if (at === null) return 'miss';
  if (at >= q.sweet[0] && at <= q.sweet[1]) return 'perfect';
  return at >= q.zone[0] && at <= q.zone[1] ? 'good' : 'miss';
}

/** A note: the lane's key, `off` ms from the line (either side; null: you didn't). */
export function gradeNote(lane: Key, pressed: Key | null, off: number | null, q: Qte): Grade {
  if (pressed === null || off === null || pressed !== lane || Math.abs(off) > q.outer) return 'miss';
  return q.perfect > 0 && Math.abs(off) <= q.perfect ? 'perfect' : 'good';
}

/** A quick draw: `after` ms after the flash you pressed (negative: before it; null: you didn't). */
export function gradeDraw(after: number | null, q: Qte): Grade {
  if (after === null || after < 0 || after > q.time) return 'miss';
  return q.quick > 0 && after <= q.quick ? 'perfect' : 'good';
}

/** Balance: the share of the time (0–1) you kept the needle in the zone. */
export function gradeBalance(kept: number, q: Qte): Grade {
  if (kept >= q.keepPerfect) return 'perfect';
  return kept >= q.keep ? 'good' : 'miss';
}

/** A carved pattern: every stroke right, in time (`elapsed` ms for the whole thing); quick is perfect. */
export function gradeCarve(right: number, strokes: number, elapsed: number, q: Qte): Grade {
  if (right < strokes || elapsed > q.time) return 'miss';
  return q.quick > 0 && elapsed <= q.quick ? 'perfect' : 'good';
}

/** A grip: `filledAt` ms in, your grip filled (null: it never did); quick is perfect. */
export function gradeGrip(filledAt: number | null, q: Qte): Grade {
  if (filledAt === null || filledAt > q.time) return 'miss';
  return q.quick > 0 && filledAt <= q.quick ? 'perfect' : 'good';
}

/** A mash: enough presses in time. */
export function gradeMash(presses: number, q: Qte): Grade {
  return presses >= q.presses ? 'good' : 'miss';
}

/** How hard your own blow lands for each grade on its QTE: a miss glances off (designer: misses must matter). */
export const BOOST: Record<Grade, number> = { miss: 0.6, good: 1.3, perfect: 1.6 };

/** Why a QTE was missed, to say so where it froze. */
export type MissReason = 'early' | 'late' | 'wrong' | 'slow' | 'long' | 'weak' | 'balance' | 'grip';

/** Why a press missed (for the marker): too early or late for the band or zone, the wrong key, too slow. */
export function missReason(q: Qte, pressed: { before?: number | null; at?: number | null; wrongKey?: boolean; overcharged?: boolean }): MissReason {
  if (pressed.wrongKey) return 'wrong';
  if (pressed.overcharged) return 'long';
  if (q.kind === 'mash') return 'weak';
  if (q.kind === 'balance') return 'balance';
  if (q.kind === 'grip') return 'grip';
  if (q.kind === 'draw') return pressed.before !== null && pressed.before !== undefined && pressed.before < 0 ? 'early' : 'slow';
  if (q.kind === 'ring' || q.kind === 'side') {
    if (pressed.before === null || pressed.before === undefined) return 'slow';
    return pressed.before > q.outer ? 'early' : 'late';
  }
  if (q.kind === 'bar' || q.kind === 'hold') {
    if (pressed.at === null || pressed.at === undefined) return 'slow';
    return pressed.at < q.zone[0] ? 'early' : 'late';
  }
  return 'slow';
}

/** The words for a miss, where it froze. */
export const MISS_WORDS: Record<MissReason, string> = {
  early: 'TOO EARLY', late: 'TOO LATE', wrong: 'WRONG WAY', slow: 'TOO SLOW', long: 'TOO LONG', weak: 'NOT ENOUGH', balance: 'LOST BALANCE', grip: 'HE HELD ON',
};

/** The QTE to use: a move's own, or its `alt` if the last one shown was the same kind. */
export function pickQte(def: QteDef, last: QteKind | null): QteDef {
  return def.alt && def.kind === last ? def.alt : def;
}
