import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { SCENARIOS, type WarScenario } from '../data/warTable';
import { getSession } from '../session';
import { attackOf, canMove, chooseOrders, defenceOf, placeInDirection, placeOf, resolveOne, squadAt, squadsOf, waysFrom, type Fought, type Order, type Squad, type WarPlace, type WarState } from '../systems/WarTable';
import { DialogueBox } from '../ui/DialogueBox';
import { paintCapitalMap } from '../ui/paintCapitalMap';
import { rgb, SHADES, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import type { AreaSceneData } from './AreaScene';
import type { CombatSceneData } from './CombatScene';

// The war table (Chapter 3, Day 2; docs/sequences/chapter-3/plan.md): the capital in light across a table,
// side-on, its places joined by the ways an army can move. The rules are src/systems/WarTable.ts and the
// scenarios src/data/warTable.ts; this scene draws and runs them, and the story (ink) speaks between turns.
//
// Your squads are amber (the people), his cyan. Arrows: move round the places. E on one of your squads,
// then E on where it goes (or on its own place to hold); Esc to back out. Enter ends the turn. In the lesson
// his orders show as cyan arrows before you give yours (Into the Breach's tells). A fight at a marked place
// you can go down to yourself: a turn-based fight (CombatScene), and how it goes decides it on the table.
// Then he turns it on (designer: obvious, and you can only lose): the room goes dark, the table hard white,
// a pulse; his arrows go, he moves twice for each of your moves, and he cuts the power where you're strongest.

export interface WarTableSceneData {
  scenario: string;
  /** Back to the area afterwards (its `script`, the scenario's `after` knot, plays on arrival). */
  back: AreaSceneData;
  /** Picking up again after a fight you went down to yourself. */
  resume?: Snapshot;
  outcome?: string;
}

interface Snapshot {
  state: WarState;
  phase: 'lesson' | 'now';
  nowTurn: number;
  orders: Order[];
  hisOrders: Order[];
  droppedIn: string[];
  /** The squad whose attack you went down to. */
  fighting?: string;
  taught: boolean;
}

const AMBER = SHADES.amber;
const CYAN = SHADES.cyan;

export class WarTableScene extends Phaser.Scene {
  private params!: WarTableSceneData;
  private sc!: WarScenario;
  private state!: WarState;
  private phase: 'lesson' | 'now' = 'lesson';
  private nowTurn = 0;
  private orders: Order[] = [];
  private hisOrders: Order[] = [];
  private droppedIn: string[] = [];
  private taught = false;
  private cursor!: WarPlace;
  /** Choosing where a squad goes. */
  private aiming: Squad | null = null;
  private busy = true;
  private closedAt = 0;
  private bg!: Phaser.GameObjects.Image;
  private gfx!: Phaser.GameObjects.Graphics;
  private labels: PixelText[] = [];
  private info!: PixelText;
  private hint!: PixelText;
  private title!: PixelText;
  private dialogue!: DialogueBox;
  private pulse?: Phaser.Time.TimerEvent;
  private blink = true;

  constructor() {
    super('WarTable');
  }

  init(data: WarTableSceneData): void {
    this.params = data;
    const sc = SCENARIOS[data.scenario];
    if (!sc) throw new Error(`WarTableScene: no scenario called "${data.scenario}"`);
    this.sc = sc;
    const r = data.resume;
    this.state = r?.state ?? { squads: sc.squads.map((s) => ({ ...s })), owner: { ...sc.owner }, cut: [], turn: 1 };
    this.phase = r?.phase ?? 'lesson';
    this.nowTurn = r?.nowTurn ?? 0;
    this.orders = r?.orders ?? [];
    this.hisOrders = r?.hisOrders ?? [];
    this.droppedIn = r?.droppedIn ?? [];
    this.taught = r?.taught ?? false;
    this.aiming = null;
    this.busy = true;
    this.labels = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    makePaintedTexture(this, 'wartable-lesson', W, H, tablePainter('lesson'));
    makePaintedTexture(this, 'wartable-now', W, H, tablePainter('now'));
    this.bg = this.add.image(0, 0, this.phase === 'now' ? 'wartable-now' : 'wartable-lesson').setOrigin(0);
    this.gfx = this.add.graphics();
    this.title = new PixelText(this, 8, 6, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(5);
    this.info = new PixelText(this, 8, 18, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(5);
    this.hint = new PixelText(this, 8, H - 12, '', { color: SHADES.dim, shadow: SHADES.shadow }).setDepth(5);
    this.cursor = placeOf(this.sc.board, squadsOf(this.state, 'you')[0]?.place ?? this.sc.goal);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.time.addEvent({ delay: 400, loop: true, callback: () => ((this.blink = !this.blink), this.draw()) });
    if (this.phase === 'now') this.startPulse();
    this.cameras.main.fadeIn(700);
    this.draw();
    const r = this.params.resume;
    if (r) {
      // Back from a fight you went down to yourself: it decides that one, and the turn goes on.
      const fought: Fought = r.fighting ? { [r.fighting]: this.params.outcome === 'won' ? 'won' : 'lost' } : {};
      this.time.delayedCall(700, () => void this.runTurn(fought));
    } else {
      this.time.delayedCall(700, () => this.talk(this.sc.knots.intro, () => this.startTurn()));
    }
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.aiming = null;
    if (this.phase === 'now') {
      // He cuts the power where you're strongest: nobody there moves this turn.
      const strongest = [...squadsOf(this.state, 'you')].sort((a, b) => b.strength - a.strength)[0];
      this.state = { ...this.state, cut: strongest ? [strongest.place] : [] };
      if (strongest) playSound(this, 'boom', 0.5);
      // And more of his guard come down from the citadel.
      const at = squadAt(this.state, 'citadel');
      if (at?.side === 'him') at.strength += this.sc.now.reinforce;
      else if (!at) this.state.squads.push({ id: `g-now-${this.nowTurn}`, side: 'him', place: 'citadel', strength: this.sc.now.reinforce });
      this.hisOrders = [];
    } else {
      this.state = { ...this.state, cut: [] };
      this.hisOrders = chooseOrders(this.sc.board, this.state, 'him', 'lesson', this.sc.keep);
    }
    this.busy = false;
    this.draw();
  }

  private async endTurn(): Promise<void> {
    this.busy = true;
    this.aiming = null;
    // A fight you could go down to yourself: ask, plainly.
    const drop = this.orders.find((o) => {
      const there = squadAt(this.state, o.to);
      return this.sc.dropIn[o.to] && there?.side === 'him' && !this.droppedIn.includes(o.to);
    });
    if (drop) {
      const place = placeOf(this.sc.board, drop.to);
      const ask = () =>
        this.dialogue.openMenu(`The fight for ${place.name.replace(/^The /, 'the ')}. Go down and fight it yourself, or leave it to the table?`, [
          { label: 'Go down yourself (a fight)', run: () => this.goDown(drop) },
          { label: 'Leave it to the table', run: () => ((this.droppedIn = [...this.droppedIn, drop.to]), this.time.delayedCall(200, () => void this.runTurn({}))) },
        ]);
      if (!this.taught) {
        this.taught = true;
        this.talk(this.sc.knots.dropIn, ask);
      } else ask();
      return;
    }
    await this.runTurn({});
  }

  /** Down to the fight: the table waits, and picks up again with how it went. */
  private goDown(order: Order): void {
    this.droppedIn = [...this.droppedIn, order.to];
    const resume: Snapshot = { state: this.state, phase: this.phase, nowTurn: this.nowTurn, orders: this.orders, hisOrders: this.hisOrders, droppedIn: this.droppedIn, fighting: order.squad, taught: this.taught };
    const data: CombatSceneData = {
      encounter: this.sc.dropIn[order.to]!,
      back: this.params.back,
      returnTo: { scene: 'WarTable', data: { scenario: this.sc.id, back: this.params.back, resume } satisfies WarTableSceneData },
    };
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Combat', data));
  }

  /** Your orders go, then his; then whatever comes of it. */
  private async runTurn(fought: Fought): Promise<void> {
    this.busy = true;
    for (const o of this.orders) await this.carry(o, fought);
    this.orders = [];
    if (this.phase === 'lesson') {
      for (const o of this.hisOrders) await this.carry(o, {});
    } else {
      for (let i = 0; i < this.sc.now.movesPerTurn; i++) {
        for (const o of chooseOrders(this.sc.board, this.state, 'him', 'press')) await this.carry(o, {});
      }
    }
    this.hisOrders = [];
    const yours = squadsOf(this.state, 'you').length;
    if (this.phase === 'lesson') {
      if (this.state.owner[this.sc.goal] === 'you') return this.talk(this.sc.knots.good, () => this.turnItOn());
      if (this.state.turn >= this.sc.lessonTurns || !yours) return this.turnItOn();
    } else {
      this.nowTurn++;
      if (this.nowTurn >= this.sc.now.turns || !yours) return this.switchOff();
    }
    this.state = { ...this.state, turn: this.state.turn + 1 };
    this.startTurn();
  }

  /** One order, shown: the squad's light slides along the way; a fight flashes. */
  private async carry(order: Order, fought: Fought): Promise<void> {
    const before = this.state.squads.find((s) => s.id === order.squad);
    if (!before) return;
    const { state, events } = resolveOne(this.sc.board, this.state, order, fought);
    if (!events.length) return;
    const from = placeOf(this.sc.board, before.place);
    const to = placeOf(this.sc.board, order.to);
    const dot = this.add.circle(from.x, from.y, 6, before.side === 'you' ? AMBER : this.hisColour()).setDepth(4);
    await this.tween(dot, { x: to.x, y: to.y, duration: 260 });
    dot.destroy();
    const battle = events.find((e) => e.type === 'battle');
    if (battle) {
      playSound(this, 'hit', 0.8);
      const flash = this.add.circle(to.x, to.y, 12, SHADES.white).setDepth(4);
      await this.tween(flash, { alpha: 0, scale: 2, duration: 300 });
      flash.destroy();
    } else playSound(this, 'tick', 0.5);
    this.state = state;
    this.draw();
    await this.wait(120);
  }

  // --- He turns it on ---

  private turnItOn(): void {
    this.busy = true;
    this.talk(this.sc.knots.now, () => {
      this.phase = 'now';
      this.nowTurn = 0;
      for (const s of squadsOf(this.state, 'him')) s.strength += this.sc.now.boost;
      // The room's lights drop; the table goes hard white; the music cuts to a pulse.
      this.cameras.main.flash(300, 255, 255, 255);
      playSound(this, 'boom');
      this.bg.setTexture('wartable-now');
      this.startPulse();
      this.state = { ...this.state, turn: this.state.turn + 1 };
      this.startTurn();
    });
  }

  private startPulse(): void {
    this.pulse?.remove();
    this.pulse = this.time.addEvent({ delay: 820, loop: true, callback: () => playSound(this, 'thump', 0.35) });
  }

  private switchOff(): void {
    this.busy = true;
    this.pulse?.remove();
    this.talk(this.sc.knots.end, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', { ...this.params.back, script: this.sc.knots.after } satisfies AreaSceneData));
    });
  }

  // --- Input ---

  private onKey(e: KeyboardEvent): void {
    if (e.repeat || this.busy || this.dialogue.isOpen || this.time.now - this.closedAt < 200) return;
    const dir = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[e.key] as [number, number] | undefined;
    if (dir) {
      const choices = this.aiming ? [placeOf(this.sc.board, this.aiming.place), ...waysFrom(this.sc.board, this.aiming.place).map((w) => placeOf(this.sc.board, w.to))] : this.sc.board.places;
      const next = placeInDirection(choices, this.cursor, dir[0], dir[1]);
      if (next) {
        this.cursor = next;
        playMove(this);
        this.draw();
      }
      return;
    }
    if (e.key === 'e' || e.key === 'E') {
      if (this.aiming) {
        // On its own place: it holds. Anywhere else it can reach: that's its order.
        const squad = this.aiming;
        this.orders = this.orders.filter((o) => o.squad !== squad.id);
        if (this.cursor.id !== squad.place) this.orders.push({ squad: squad.id, to: this.cursor.id });
        this.aiming = null;
        playConfirm(this);
      } else {
        const squad = squadAt(this.state, this.cursor.id);
        if (squad?.side === 'you' && !this.state.cut.includes(squad.place)) {
          this.aiming = squad;
          playMove(this);
        }
      }
      this.draw();
      return;
    }
    if (e.key === 'Escape' && this.aiming) {
      this.cursor = placeOf(this.sc.board, this.aiming.place);
      this.aiming = null;
      this.draw();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!this.aiming) void this.endTurn();
    }
  }

  // --- Drawing ---

  private hisColour(): number {
    return this.phase === 'now' ? SHADES.white : CYAN;
  }

  private draw(): void {
    const g = this.gfx.clear();
    for (const l of this.labels) l.destroy();
    this.labels = [];
    const board = this.sc.board;
    const now = this.phase === 'now';
    const line = now ? SHADES.white : CYAN;
    // The ways: halls and streets solid, stairs dashed, the lifts a dotted shaft. A dark line under each, so
    // they stand out from the city behind.
    for (const w of board.ways) {
      const a = placeOf(board, w.a);
      const b = placeOf(board, w.b);
      g.lineStyle(3, SHADES.shadow, 0.7).lineBetween(a.x, a.y, b.x, b.y);
      if (w.kind === 'stair') dashed(g, a, b, line, 2);
      else g.lineStyle(1, line, 1).lineBetween(a.x, a.y, b.x, b.y);
    }
    const lifts = board.places.filter((p) => p.lift).sort((a, b) => a.y - b.y);
    for (let i = 1; i < lifts.length; i++) dashed(g, lifts[i - 1]!, lifts[i]!, now ? SHADES.white : CYAN, 1);
    // The places, and who holds them.
    for (const p of board.places) {
      const owner = this.state.owner[p.id];
      const col = owner === 'you' ? AMBER : owner === 'him' ? this.hisColour() : SHADES.dim;
      g.lineStyle(1, col, 1).strokeRect(p.x - 3, p.y - 3, 7, 7);
      if (p.stronghold) g.strokeRect(p.x - 5, p.y - 5, 11, 11);
      if (this.state.cut.includes(p.id)) {
        // No power: dark, crossed out.
        g.fillStyle(SHADES.shadow, 0.85).fillRect(p.x - 12, p.y - 12, 25, 25);
        g.lineStyle(1, SHADES.dim, 1).lineBetween(p.x - 9, p.y - 9, p.x + 9, p.y + 9).lineBetween(p.x - 9, p.y + 9, p.x + 9, p.y - 9);
      }
      const label = new PixelText(this, 0, p.y + 11, p.name.replace(/^The /, '').toLowerCase(), { color: SHADES.light, shadow: SHADES.shadow });
      label.setX(Math.round(p.x - label.width / 2));
      this.labels.push(label);
    }
    // Orders: his (in the lesson) as cyan arrows, yours amber.
    for (const o of this.hisOrders) this.arrow(g, o, this.hisColour());
    for (const o of this.orders) this.arrow(g, o, AMBER);
    // The squads: a disc of light with its strength.
    for (const s of this.state.squads) {
      const p = placeOf(board, s.place);
      const col = s.side === 'you' ? AMBER : this.hisColour();
      g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, 7);
      g.fillStyle(col, 1).fillCircle(p.x, p.y, 6);
      const n = new PixelText(this, 0, p.y - 3, String(s.strength), { color: SHADES.shadow });
      n.setX(Math.round(p.x - n.width / 2 + 1));
      this.labels.push(n);
    }
    // Where you can send the one you've picked.
    if (this.aiming) {
      for (const w of waysFrom(board, this.aiming.place)) {
        const p = placeOf(board, w.to);
        g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 10);
      }
    }
    // The cursor.
    if (!this.busy && this.blink) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 11, this.cursor.y - 11, 23, 23);
    this.title.setText(now ? '' : `The lesson: take the promenade. Turn ${this.state.turn}`);
    this.info.setText(this.busy ? '' : this.describe());
    this.hint.setText(this.busy ? '' : this.aiming ? 'Arrows: where they go  E: send them (their own place: hold)  Esc: back' : 'Arrows: look round  E: give one of your squads orders  Enter: end the turn');
  }

  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number): void {
    const s = this.state.squads.find((q) => q.id === o.squad);
    if (!s) return;
    const a = placeOf(this.sc.board, s.place);
    const b = placeOf(this.sc.board, o.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
    const [ex, ey] = [b.x - ux * 9, b.y - uy * 9];
    g.lineStyle(2, col, 1).lineBetween(a.x + ux * 8, a.y + uy * 8, ex, ey);
    g.fillStyle(col, 1).fillTriangle(ex + ux * 4, ey + uy * 4, ex - uy * 4 - ux * 2, ey + ux * 4 - uy * 2, ex + uy * 4 - ux * 2, ey - ux * 4 - uy * 2);
  }

  /** What's under the cursor, plainly; and, aiming, what would happen. */
  private describe(): string {
    const p = this.cursor;
    const there = squadAt(this.state, p.id);
    const owner = this.state.owner[p.id];
    const whose = owner === 'you' ? 'yours' : owner === 'him' ? 'his' : "nobody's";
    let text = `${p.name}: ${whose}${there ? `, ${there.strength} strong` : ''}${p.stronghold ? ' (held at +1)' : ''}${this.state.cut.includes(p.id) ? '. No power: nobody here can move.' : ''}`;
    if (this.aiming && p.id !== this.aiming.place && canMove(this.sc.board, this.state, this.aiming, p.id)) {
      if (!there) text = `Send them to ${p.name.replace(/^The /, 'the ')}: they take it.`;
      else if (there.side === 'you') text = `Send them to join the squad there: ${this.aiming.strength + there.strength} strong.`;
      else {
        const a = attackOf(this.sc.board, this.aiming.place, p.id, this.aiming.strength);
        const d = defenceOf(this.sc.board, p.id, there.strength);
        const uphill = a < this.aiming.strength ? ' (uphill: 1 less)' : '';
        text = `Attack: ${a}${uphill} against ${d}. ${a > d ? `You'd take it, with ${Math.max(1, a - d)} left.` : 'They’d hold, and your squad would be lost.'}`;
        if (this.sc.dropIn[p.id] && !this.droppedIn.includes(p.id)) text += ' Or go down and fight it yourself.';
      }
    } else if (this.aiming && p.id === this.aiming.place) text = 'They hold here.';
    return text;
  }

  // --- Helpers ---

  /** The story speaks (an ink knot, in the dialogue box), then the table goes on. */
  private talk(knot: string, then: () => void): void {
    this.busy = true;
    this.draw();
    this.dialogue.open(knot, () => {
      this.closedAt = this.time.now;
      then();
    });
  }

  private tween(target: object, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ targets: target, ...config, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}

function dashed(g: Phaser.GameObjects.Graphics, a: { x: number; y: number }, b: { x: number; y: number }, col: number, gap: number): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  g.fillStyle(col, 0.9);
  // Dashes two long, `gap` apart.
  for (let d = 0; d < len; d += gap + 2) {
    for (const k of [0, 1]) g.fillRect(Math.round(a.x + ((b.x - a.x) * (d + k)) / len), Math.round(a.y + ((b.y - a.y) * (d + k)) / len), 1, 1);
  }
}

/**
 * The table: the capital's map (the city side-on, as on the map screen) drawn in light. In the lesson a
 * soft cyan, dim, like something you could reach into; once he turns it on, hard white on black.
 */
function tablePainter(phase: 'lesson' | 'now'): (x: number, y: number) => PixelColour {
  const map = paintCapitalMap(new Map(), []);
  const steps: RGB[] = (phase === 'now' ? [SHADES.shadow, SHADES.deep, SHADES.dim, SHADES.white] : [SHADES.shadow, SHADES.cyanDeep, SHADES.cyanMid, SHADES.cyan]).map(rgb);
  return (x, y) => {
    const c = map(x, y);
    const v = c === null ? [0, 0, 0] : typeof c === 'number' ? rgb(c) : c;
    let lum = (v[0]! * 0.3 + v[1]! * 0.59 + v[2]! * 0.11) / 255;
    // Faint lines across it, like a projection, and darker towards the edges of the table.
    if (y % 3 === 0) lum *= 0.75;
    const edge = Math.min(x, W - x, y, H - y) / 40;
    lum *= Math.min(1, 0.35 + edge) * (phase === 'now' ? 0.9 : 0.7);
    const t = Math.min(2.999, lum * 4);
    const i = Math.floor(t);
    const k = t - i;
    const a = steps[i]!;
    const b = steps[i + 1]!;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
}
