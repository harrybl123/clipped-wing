import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import {
  gradeBalance, gradeCarve, gradeDraw, gradeGrip, gradeKey, gradeMash, gradeNote, gradeRing, gradeSide, gradeZone,
  MISS_WORDS, missReason, type Grade, type Key, type MissReason, type Qte, type QteKind,
} from '../systems/qte';
import { SHADES } from './pixelArt';
import { PixelText } from './PixelText';
import { playSound } from './soundscape';

// Runs and draws one quick-time event in the fight (the rules are src/systems/qte.ts). It keeps the time:
// the scene starts the move's animation, runs the QTE, and plays each blow when the runner says its beat
// has come (`onBeat`: when you press, or when the moment passes), so the animation can't drift from it.
// The moment you press, it holds there for a beat, showing how you did (and, if you missed, why).

/** How long it holds where you pressed (ms). */
const FREEZE = 320;
/** The reaction ring's radius as it starts closing. */
const RING = 56;
/** Notes: how long a note takes to fall to the line (ms), and the lanes' size. */
const FALL = 900;
const LANE_W = 14;
const LANE_H = 64;
/** Weave: the gap between prompts if the QTE doesn't say (ms). */
const WEAVE_GAP = 520;

export interface QteOptions {
  /** Where on the stage it's centred (world coordinates; the ring is drawn round it, on the world camera). */
  anchor: { x: number; y: number };
  /** The UI point over the anchor (for the widgets drawn on the UI camera). */
  screen: () => { x: number; y: number };
  /** side: where the blow comes from. */
  from?: 'left' | 'right';
  /** notes, weave, carve: how many blows (one note, prompt or stroke each). */
  beats?: number;
  /** Called on each blow's beat, with how you did on it. */
  onBeat?: (i: number, grade: Grade) => void;
}

type Prompt = { key: Key; at: number; grade: Grade | null };

interface Run {
  q: Qte;
  o: QteOptions;
  beats: number;
  start: number;
  /** When it ends by itself (the ring closes, the bar runs out). */
  end: number;
  pressedAt: number | null;
  pressed: Key | 'e' | null;
  grade: Grade | null;
  why: MissReason | null;
  /** key: the one shown. */
  key: Key;
  /** hold: when you started holding. */
  heldAt: number | null;
  /** mash: presses so far. */
  presses: number;
  /** notes, weave: one prompt per blow, with when it lands. carve: the pattern. */
  prompts: Prompt[];
  /** draw: when the flash comes. */
  flashAt: number;
  /** balance: the needle (0–1, 0.5 the middle), its drift, time in the zone, and the arrows held. */
  needle: number;
  drift: number;
  kept: number;
  held: Set<Key>;
  last: number;
  /** grip: the zone's centre, your grip (ms of it), when it filled, and when his next tug comes. */
  zoneAt: number;
  grip: number;
  nextTug: number;
  /** carve: strokes done, and how many right. */
  done: number;
  right: number;
  /** Show the instruction (the first time this kind comes up). */
  teach: boolean;
  resolve: (grades: Grade[]) => void;
}

const ARROWS: Record<Key, [number, number][]> = {
  up: [[0, -5], [-5, 2], [5, 2]],
  down: [[0, 5], [-5, -2], [5, -2]],
  left: [[-5, 0], [2, -5], [2, 5]],
  right: [[5, 0], [-2, -5], [-2, 5]],
};
const STEP: Record<Key, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LANES: Key[] = ['left', 'up', 'down', 'right'];
/** Each kind's instruction shows only the first time you meet it (designer: no captions; the visuals carry it). */
const SEEN = new Set<QteKind>();
const TEACH: Record<QteKind, string> = {
  ring: 'Press E as the ring crosses the green.',
  side: 'Left or Right, away from his swing, as the ring crosses the green.',
  key: 'Press the arrow shown, quickly.',
  bar: 'Press E while the marker is in the green.',
  hold: 'Hold E to fill it, and let go in the green.',
  mash: 'He’s got hold of you! Mash E to break free.',
  notes: 'Press each arrow as it reaches the line.',
  draw: 'Wait for it... press E the instant it flashes.',
  weave: 'Up to duck, Left or Right to lean, as each comes.',
  balance: 'Keep the needle in the middle with Left and Right.',
  carve: 'Carve the line: press its arrows in order.',
  grip: 'He\u2019s got your collar! Left and Right: keep it in the light to break free.',
};

export class QteRunner {
  private run: Run | null = null;
  private readonly world: Phaser.GameObjects.Graphics;
  private readonly ui: Phaser.GameObjects.Graphics;
  private readonly label: PixelText;
  private readonly prompt: PixelText;
  private readonly big: PixelText;

  constructor(private readonly scene: Phaser.Scene, addWorld: <T extends Phaser.GameObjects.GameObject>(o: T) => T, addUi: <T extends Phaser.GameObjects.GameObject>(o: T) => T) {
    this.world = addWorld(scene.add.graphics().setDepth(30));
    this.ui = addUi(scene.add.graphics());
    this.label = addUi(new PixelText(scene, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, scale: 2 }));
    this.prompt = addUi(new PixelText(scene, 0, 0, '', { color: SHADES.light, shadow: SHADES.shadow }));
    this.big = addUi(new PixelText(scene, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, scale: 3 }));
  }

  get active(): boolean {
    return this.run !== null;
  }

  /** Runs a QTE: resolves with a grade per blow once it's over and has held a beat. */
  start(q: Qte, o: QteOptions): Promise<Grade[]> {
    const now = this.scene.time.now;
    const beats = Math.max(1, o.beats ?? 1);
    let prompts: Prompt[] = [];
    let end = now + q.time;
    if (q.kind === 'notes') {
      prompts = Array.from({ length: beats }, (_, i) => ({ key: Phaser.Math.RND.pick(q.lanes), at: now + FALL + i * Math.max(260, q.gap), grade: null }));
      end = prompts[prompts.length - 1]!.at + q.outer + 40;
    } else if (q.kind === 'weave') {
      const gap = Math.max(q.gap, WEAVE_GAP);
      prompts = Array.from({ length: beats }, (_, i) => ({ key: Phaser.Math.RND.pick(['up', 'left', 'right'] as Key[]), at: now + 300 + i * gap, grade: null }));
      end = prompts[prompts.length - 1]!.at + q.time;
    } else if (q.kind === 'carve') {
      // A short carved line: each stroke an arrow, never straight back on itself.
      const n = beats > 1 ? beats : q.strokes;
      const keys: Key[] = [];
      for (let i = 0; i < n; i++) {
        const back: Record<Key, Key> = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const options = LANES.filter((k) => k !== (keys[i - 1] && back[keys[i - 1]!]));
        keys.push(Phaser.Math.RND.pick(options));
      }
      prompts = keys.map((key) => ({ key, at: 0, grade: null }));
      end = now + q.time;
    } else if (q.kind === 'hold') end = now + q.time * 1.6;
    else if (q.kind === 'draw') end = now + q.wait[1] + q.time + 200;
    const flashAt = now + Phaser.Math.Between(q.wait[0], q.wait[1]);
    this.label.setText('');
    this.big.setText('');
    const teach = !SEEN.has(q.kind);
    SEEN.add(q.kind);
    return new Promise((resolve) => {
      this.run = {
        q, o, beats, start: now, end, pressedAt: null, pressed: null, grade: null, why: null, key: Phaser.Math.RND.pick(LANES),
        heldAt: null, presses: 0, prompts, flashAt, needle: 0.5, drift: Phaser.Math.FloatBetween(-0.5, 0.5), kept: 0, held: new Set(), last: now,
        zoneAt: 0.5, grip: 0, nextTug: now + 400,
        done: 0, right: 0, teach, resolve,
      };
    });
  }

  /** Input: an arrow or E, pressed (down) or let go (up). Returns whether it was used. */
  input(k: Key | 'e', down: boolean): boolean {
    const r = this.run;
    if (!r || r.grade !== null) return false;
    const now = this.scene.time.now;
    const q = r.q;
    switch (q.kind) {
      case 'ring': {
        if (!down || k !== 'e') return false;
        const before = r.end - now;
        return this.decide(r, gradeRing(before, q), now, k, missReason(q, { before }));
      }
      case 'side': {
        if (!down || (k !== 'left' && k !== 'right')) return false;
        const before = r.end - now;
        return this.decide(r, gradeSide(before, k, r.o.from ?? 'left', q), now, k, k === r.o.from ? 'wrong' : missReason(q, { before }));
      }
      case 'key':
        if (!down || k === 'e') return false;
        return this.decide(r, gradeKey(r.key, k, now - r.start, q), now, k, k !== r.key ? 'wrong' : 'slow');
      case 'bar': {
        if (!down || k !== 'e') return false;
        const at = (now - r.start) / q.time;
        return this.decide(r, gradeZone(at, q), now, k, missReason(q, { at }));
      }
      case 'hold': {
        if (k !== 'e') return false;
        if (down && r.heldAt === null) {
          r.heldAt = now;
          return true;
        }
        if (down || r.heldAt === null) return false;
        const at = (now - r.heldAt) / q.time;
        return this.decide(r, gradeZone(at, q), now, k, missReason(q, { at }));
      }
      case 'mash':
        if (!down || k !== 'e') return false;
        r.presses++;
        playSound(this.scene, 'tap', 0.6);
        if (r.presses >= q.presses) this.decide(r, gradeMash(r.presses, q), now, k, null);
        return true;
      case 'draw': {
        if (!down || k !== 'e') return false;
        const after = now - r.flashAt;
        return this.decide(r, gradeDraw(after, q), now, k, missReason(q, { before: after }));
      }
      case 'balance':
      case 'grip':
        if (k !== 'left' && k !== 'right') return false;
        if (down) r.held.add(k);
        else r.held.delete(k);
        return true;
      case 'notes':
      case 'weave': {
        if (!down || k === 'e') return false;
        // The next prompt still coming: graded if it's close enough (any key: the wrong one is a miss).
        const next = r.prompts.find((n) => n.grade === null);
        if (!next) return false;
        const off = now - next.at;
        if (q.kind === 'notes') {
          if (Math.abs(off) > Math.max(q.outer, 220)) return false;
          this.beat(r, r.prompts.indexOf(next), gradeNote(next.key, k, off, q), k !== next.key ? 'wrong' : 'late');
        } else {
          if (off < 0) return false; // not shown yet
          this.beat(r, r.prompts.indexOf(next), gradeKey(next.key, k, off, q), k !== next.key ? 'wrong' : 'slow');
        }
        return true;
      }
      case 'carve': {
        if (!down || k === 'e') return false;
        const stroke = r.prompts[r.done];
        if (!stroke) return false;
        const ok = stroke.key === k;
        stroke.grade = ok ? 'good' : 'miss';
        r.done++;
        if (ok) r.right++;
        playSound(this.scene, ok ? 'scratch' : 'thump', ok ? 0.7 : 0.4);
        if (r.beats > 1) {
          // A combo: each stroke is a blow.
          this.beat(r, r.done - 1, ok ? (now - r.start <= q.quick * (r.done / r.prompts.length) ? 'perfect' : 'good') : 'miss', 'wrong');
        } else if (r.done === r.prompts.length) {
          this.decide(r, gradeCarve(r.right, r.prompts.length, now - r.start, q), now, k, r.right < r.prompts.length ? 'wrong' : 'slow');
        }
        return true;
      }
    }
    return false;
  }

  /** Call every frame: ends a QTE whose time has run out, moves what moves, and draws it. */
  update(): void {
    const r = this.run;
    this.world.clear();
    this.ui.clear();
    if (!r) return;
    const now = this.scene.time.now;
    const dt = Math.min(50, now - r.last) / 1000;
    r.last = now;
    const q = r.q;
    if (q.kind === 'notes' || q.kind === 'weave') {
      r.prompts.forEach((n, i) => {
        const late = q.kind === 'notes' ? now > n.at + q.outer : now > n.at + q.time;
        if (n.grade === null && late) this.beat(r, i, 'miss', 'slow');
      });
    } else if (q.kind === 'carve' && r.beats > 1) {
      if (now >= r.end) r.prompts.forEach((n, i) => n.grade === null && this.beat(r, i, 'miss', 'slow'));
    } else if (r.grade === null) {
      if (q.kind === 'grip') {
        // His tugs jerk the marker one way or the other; your arrows pull it back. The lit zone wanders
        // and narrows; your grip builds while the marker's in it and slips while it's out.
        const t = (now - r.start) / q.time;
        if (now >= r.nextTug) {
          r.drift = Phaser.Math.RND.pick([-1, 1]) * q.tug * Phaser.Math.FloatBetween(0.7, 1.3) * 2.2;
          r.nextTug = now + Phaser.Math.Between(380, 650);
          playSound(this.scene, 'skid', 0.35);
          this.scene.cameras.main.shake(70, 0.004);
        }
        r.drift *= Math.pow(0.04, dt); // each tug dies away
        const push = (r.held.has('right') ? 1 : 0) - (r.held.has('left') ? 1 : 0);
        r.needle = Phaser.Math.Clamp(r.needle + (r.drift + push * 0.9) * dt, 0, 1);
        r.zoneAt = 0.5 + Math.sin(now / 700) * 0.18 * Math.min(1, t * 2);
        const half = this.gripHalf(r, t);
        const inside = Math.abs(r.needle - r.zoneAt) <= half;
        r.grip = Math.max(0, r.grip + (inside ? 1 : -0.6) * dt * 1000);
        if (r.grip >= q.keep * q.time) this.decide(r, gradeGrip(now - r.start, q), now, null, null);
        else if (now >= r.end) this.decide(r, 'miss', now, null, 'grip');
      } else if (q.kind === 'balance') {
        // The needle wanders, pushed harder the further out it is; your arrows push it back.
        r.drift += Phaser.Math.FloatBetween(-2.2, 2.2) * dt + (r.needle - 0.5) * 1.6 * dt;
        r.drift = Phaser.Math.Clamp(r.drift, -0.9, 0.9);
        const push = (r.held.has('right') ? 1 : 0) - (r.held.has('left') ? 1 : 0);
        r.needle = Phaser.Math.Clamp(r.needle + (r.drift + push * 1.1) * dt * 0.6, 0, 1);
        if (Math.abs(r.needle - 0.5) <= (q.zone[1] - q.zone[0]) / 2) r.kept += dt * 1000;
        if (now >= r.end) this.decide(r, gradeBalance(r.kept / q.time, q), now, null, 'balance');
      } else {
        const overcharged = q.kind === 'hold' && r.heldAt !== null && now - r.heldAt > q.time;
        if (now >= r.end || overcharged) {
          const grade = q.kind === 'mash' ? gradeMash(r.presses, q) : 'miss';
          this.decide(r, grade, now, null, overcharged ? 'long' : q.kind === 'mash' ? 'weak' : q.kind === 'carve' ? 'slow' : 'slow');
        }
      }
    }
    this.draw(r, now);
  }

  /** grip: the zone's half-width at `t` (0–1 through the time): from its starting width down to `narrow`. */
  private gripHalf(r: Run, t: number): number {
    const start = (r.q.zone[1] - r.q.zone[0]) / 2;
    return start + (r.q.narrow / 2 - start) * Math.min(1, t);
  }

  /** A single-press QTE is decided: hold there a beat, then the blow lands. */
  private decide(r: Run, grade: Grade, now: number, k: Key | 'e' | null, why: MissReason | null): boolean {
    r.grade = grade;
    r.why = grade === 'miss' ? why ?? 'slow' : null;
    r.pressedAt = now;
    r.pressed = k;
    this.showGrade(grade, r.why);
    playSound(this.scene, grade === 'miss' ? 'thump' : 'tick', grade === 'miss' ? 0.6 : 0.8);
    this.scene.time.delayedCall(FREEZE, () => {
      r.o.onBeat?.(0, grade);
      this.finish(r, [grade]);
    });
    return true;
  }

  /** One of several prompts is judged: its blow lands now; after the last one, it's over. */
  private beat(r: Run, i: number, grade: Grade, why: MissReason): void {
    const n = r.prompts[i]!;
    n.grade = grade;
    this.showGrade(grade, grade === 'miss' ? why : null);
    playSound(this.scene, grade === 'miss' ? 'thump' : 'tick', grade === 'miss' ? 0.5 : 0.8);
    r.o.onBeat?.(i, grade);
    if (r.prompts.every((x) => x.grade !== null)) this.scene.time.delayedCall(FREEZE, () => this.finish(r, r.prompts.map((x) => x.grade!)));
  }

  private finish(r: Run, grades: Grade[]): void {
    if (this.run !== r) return;
    this.run = null;
    this.world.clear();
    this.ui.clear();
    this.label.setText('');
    this.prompt.setText('');
    this.big.setText('');
    r.resolve(grades);
  }

  private showGrade(grade: Grade, why: MissReason | null): void {
    const { x, y } = this.run!.o.screen();
    const text = grade === 'perfect' ? 'PERFECT!' : grade === 'good' ? 'GOOD' : `MISS: ${MISS_WORDS[why ?? 'slow']}`;
    this.label.setText(text).setColor(grade === 'miss' ? SHADES.amber : grade === 'perfect' ? SHADES.white : SHADES.green);
    this.label.setPosition(Math.round(Phaser.Math.Clamp(x - this.label.width / 2, 4, W - this.label.width - 4)), Math.round(Math.max(36, y - 44)));
  }

  private draw(r: Run, now: number): void {
    const g = this.ui;
    const q = r.q;
    const at = r.pressedAt ?? now; // held where you pressed
    const { x: sx, y: sy } = r.o.screen();
    const box = (x: number, y: number, w: number, h: number) => {
      g.fillStyle(SHADES.shadow, 0.9).fillRect(x - 3, y - 3, w + 6, h + 6);
      g.lineStyle(1, SHADES.woodLight).strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
    };
    const arrow = (key: Key, x: number, y: number, size: number, colour: number) =>
      g.fillStyle(colour).fillTriangle(...ARROWS[key].flatMap(([a, b]) => [x + a * size, y + b * size]) as [number, number, number, number, number, number]);
    const result = (grade: Grade | null) => (grade === null ? SHADES.white : grade === 'miss' ? SHADES.amber : SHADES.green);
    this.prompt.setText(r.teach ? TEACH[q.kind] : '').setPosition(Math.round(W / 2 - this.prompt.width / 2), 28);
    switch (q.kind) {
      case 'ring':
      case 'side': {
        const w = this.world;
        const { x: cx, y: cy } = r.o.anchor;
        const toR = (ms: number) => (ms / q.time) * RING;
        const remaining = Math.max(0, r.end - at);
        const inBand = remaining <= q.outer && remaining >= q.inner;
        const outer = toR(q.outer);
        const inner = toR(q.inner);
        w.lineStyle(outer - inner, inBand ? SHADES.greenMid : SHADES.greenDeep, inBand ? 0.85 : 0.55).strokeCircle(cx, cy, (outer + inner) / 2);
        w.lineStyle(1, SHADES.green).strokeCircle(cx, cy, outer).strokeCircle(cx, cy, inner);
        if (q.perfect) w.lineStyle(1, SHADES.white).strokeCircle(cx, cy, toR(q.inner + q.perfect));
        const colour = r.grade !== null ? result(r.grade) : inBand ? SHADES.white : remaining < q.inner ? SHADES.dim : SHADES.amber;
        w.lineStyle(r.grade !== null ? 3 : 2, colour).strokeCircle(cx, cy, Math.max(1, toR(remaining)));
        if (q.kind === 'side') for (const dir of [-1, 1]) {
          const ax = cx + dir * (RING + 8);
          w.fillStyle(r.pressed === (dir < 0 ? 'left' : 'right') ? result(r.grade) : SHADES.white).fillTriangle(ax + dir * 6, cy, ax, cy - 5, ax, cy + 5);
        }
        break;
      }
      case 'key': {
        const x = Math.round(sx - 14);
        const y = Math.round(Math.max(40, sy - 34));
        box(x, y, 28, 28);
        arrow(r.key, x + 14, y + 13, 1.6, result(r.grade));
        g.fillStyle(SHADES.amber).fillRect(x, y + 25, Math.round(28 * Math.max(0, 1 - (at - r.start) / q.time)), 2);
        break;
      }
      case 'bar':
      case 'hold': {
        const w = 140;
        const x = Math.round(W / 2 - w / 2);
        const y = 48;
        box(x, y, w, 8);
        g.fillStyle(SHADES.woodLight).fillRect(x, y, w, 8);
        g.fillStyle(SHADES.greenMid).fillRect(x + q.zone[0] * w, y, (q.zone[1] - q.zone[0]) * w, 8);
        if (q.sweet[1] > q.sweet[0]) g.fillStyle(SHADES.green).fillRect(x + q.sweet[0] * w, y, (q.sweet[1] - q.sweet[0]) * w, 8);
        const pos = q.kind === 'bar' ? (at - r.start) / q.time : r.heldAt === null ? 0 : (at - r.heldAt) / q.time;
        if (q.kind === 'hold') g.fillStyle(SHADES.light, 0.8).fillRect(x, y + 2, Math.round(Math.min(1, pos) * w), 4);
        g.fillStyle(result(r.grade)).fillRect(Math.round(x + Phaser.Math.Clamp(pos, 0, 1) * w) - 1, y - 3, 3, 14);
        break;
      }
      case 'mash': {
        const w = 120;
        const x = Math.round(W / 2 - w / 2);
        const y = 48;
        box(x, y, w, 8);
        g.fillStyle(SHADES.woodLight).fillRect(x, y, w, 4);
        g.fillStyle(SHADES.green).fillRect(x, y, Math.round((w * Math.min(r.presses, q.presses)) / q.presses), 4);
        g.fillStyle(SHADES.amber).fillRect(x, y + 6, Math.round(w * Math.max(0, 1 - (at - r.start) / q.time)), 2);
        this.big.setText(r.grade === null && Math.floor(now / 90) % 2 ? 'E' : '').setPosition(Math.round(W / 2 - 7), 62);
        break;
      }
      case 'draw': {
        // Still... then the flash.
        const flashed = at >= r.flashAt;
        const x = Math.round(sx - 16);
        const y = Math.round(Math.max(40, sy - 38));
        box(x, y, 32, 30);
        if (flashed && r.grade === null) g.fillStyle(SHADES.white, 0.9).fillRect(x, y, 32, 30);
        this.big.setText(flashed ? '!' : '...').setColor(flashed ? (r.grade === null ? SHADES.shadow : result(r.grade)) : SHADES.dim);
        this.big.setPosition(Math.round(x + 16 - this.big.width / 2), y + 5);
        if (flashed && r.pressedAt === null && now - r.flashAt < 60) this.scene.cameras.main.flash(60, 244, 241, 232);
        break;
      }
      case 'balance': {
        const w = 120;
        const x = Math.round(W / 2 - w / 2);
        const y = 50;
        box(x, y, w, 10);
        g.fillStyle(SHADES.woodLight).fillRect(x, y, w, 10);
        g.fillStyle(SHADES.greenMid).fillRect(x + q.zone[0] * w, y, (q.zone[1] - q.zone[0]) * w, 10);
        // The needle, and how long you've kept it in.
        g.fillStyle(result(r.grade)).fillRect(Math.round(x + r.needle * w) - 1, y - 4, 3, 18);
        g.fillStyle(SHADES.green).fillRect(x, y + 13, Math.round(w * Math.min(1, r.kept / q.time / Math.max(0.01, q.keep))), 2);
        g.fillStyle(SHADES.amber).fillRect(x, y + 16, Math.round(w * Math.max(0, 1 - (at - r.start) / q.time)), 1);
        for (const [dir, k] of [[-1, 'left'], [1, 'right']] as const) arrow(k, x + w / 2 + dir * (w / 2 + 12), y + 5, 1, r.held.has(k) ? SHADES.green : SHADES.dim);
        break;
      }
      case 'grip': {
        const w = 150;
        const x = Math.round(W / 2 - w / 2);
        const y = 48;
        const t = Math.min(1, (at - r.start) / q.time);
        const half = this.gripHalf(r, t);
        box(x, y, w, 22);
        // The track, the lit zone (wandering, narrowing), and the marker he's yanking about.
        g.fillStyle(SHADES.woodLight).fillRect(x, y, w, 10);
        g.fillStyle(SHADES.amberDeep).fillRect(x + (r.zoneAt - half) * w, y, half * 2 * w, 10);
        g.fillStyle(SHADES.amber, 0.6).fillRect(x + (r.zoneAt - half) * w, y + 4, half * 2 * w, 2);
        g.fillStyle(r.grade === null ? SHADES.white : result(r.grade)).fillRect(Math.round(x + r.needle * w) - 1, y - 3, 3, 16);
        // Your grip, and the time left.
        g.fillStyle(SHADES.deep).fillRect(x, y + 14, w, 4);
        g.fillStyle(SHADES.green).fillRect(x, y + 14, Math.round(w * Math.min(1, r.grip / (q.keep * q.time))), 4);
        g.fillStyle(SHADES.amber).fillRect(x, y + 20, Math.round(w * Math.max(0, 1 - t)), 1);
        for (const [dir, k] of [[-1, 'left'], [1, 'right']] as const) arrow(k, x + w / 2 + dir * (w / 2 + 12), y + 5, 1, r.held.has(k) ? SHADES.green : SHADES.dim);
        break;
      }
      case 'notes': {
        const lanes = LANES.filter((l) => q.lanes.includes(l));
        const x0 = Math.round(W / 2 - (lanes.length * LANE_W) / 2);
        const y0 = 40;
        box(x0, y0, lanes.length * LANE_W, LANE_H);
        lanes.forEach((lane, i) => {
          const lx = x0 + i * LANE_W;
          g.fillStyle(i % 2 ? SHADES.deep : SHADES.wood).fillRect(lx, y0, LANE_W, LANE_H);
          arrow(lane, lx + LANE_W / 2, y0 + LANE_H - 8, 0.9, SHADES.woodPale);
        });
        g.fillStyle(SHADES.light).fillRect(x0, y0 + LANE_H - 8, lanes.length * LANE_W, 1);
        for (const n of r.prompts) {
          const lx = x0 + lanes.indexOf(n.key) * LANE_W + LANE_W / 2;
          const t = n.grade !== null ? 1 : 1 - (n.at - now) / FALL;
          if (t < 0) continue;
          const ny = y0 + Math.min(1.12, t) * (LANE_H - 8);
          arrow(n.key, lx, ny, 1, result(n.grade));
        }
        break;
      }
      case 'weave': {
        // The current prompt, big, by your head: which way to go.
        const next = r.prompts.find((n) => n.grade === null) ?? r.prompts[r.prompts.length - 1]!;
        const shown = now >= next.at;
        const x = Math.round(sx - 16);
        const y = Math.round(Math.max(40, sy - 40));
        box(x, y, 32, 32);
        if (shown) arrow(next.key, x + 16, y + 14, 2, result(next.grade));
        if (shown) g.fillStyle(SHADES.amber).fillRect(x, y + 29, Math.round(32 * Math.max(0, 1 - (now - next.at) / q.time)), 2);
        r.prompts.forEach((n, i) => g.fillStyle(n.grade === null ? SHADES.woodLight : result(n.grade)).fillRect(x + 4 + i * 6, y + 35, 4, 2));
        break;
      }
      case 'carve': {
        // The line to carve, as a groove in a plank: each stroke an arrow's direction; done strokes lit.
        const len = 14;
        const pts: [number, number][] = [[0, 0]];
        for (const p of r.prompts) {
          const [px, py] = pts[pts.length - 1]!;
          pts.push([px + STEP[p.key][0] * len, py + STEP[p.key][1] * len]);
        }
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const bw = Math.max(...xs) - Math.min(...xs) + 24;
        const bh = Math.max(...ys) - Math.min(...ys) + 24;
        const bx = Math.round(W / 2 - bw / 2);
        const by = 44;
        box(bx, by, bw, bh);
        g.fillStyle(SHADES.woodPale).fillRect(bx, by, bw, bh);
        const ox = bx + 12 - Math.min(...xs);
        const oy = by + 12 - Math.min(...ys);
        r.prompts.forEach((p, i) => {
          const [ax, ay] = pts[i]!;
          const [bx2, by2] = pts[i + 1]!;
          g.lineStyle(3, p.grade === null ? (i === r.done ? SHADES.shadow : SHADES.dim) : result(p.grade));
          g.lineBetween(ox + ax, oy + ay, ox + bx2, oy + by2);
        });
        const cur = pts[r.done];
        if (cur && r.grade === null && r.done < r.prompts.length) g.fillStyle(SHADES.white).fillCircle(ox + cur[0], oy + cur[1], 2);
        g.fillStyle(SHADES.amber).fillRect(bx, by + bh + 2, Math.round(bw * Math.max(0, 1 - (at - r.start) / q.time)), 2);
        break;
      }
    }
  }
}
