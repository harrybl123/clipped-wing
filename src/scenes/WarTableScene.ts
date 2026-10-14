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
import { startTableMusic, type TableMusic } from '../ui/tableMusic';
import type { AreaSceneData } from './AreaScene';
import type { CombatSceneData } from './CombatScene';

// The war table (Chapter 3, Day 2; docs/sequences/chapter-3/plan.md): the capital in light across a table,
// side-on, its places joined by the ways an army can move. The rules are src/systems/WarTable.ts and the
// scenarios src/data/warTable.ts; this scene draws and runs them, and the story (ink) speaks between turns.
//
// Your squads are amber (the people), his blue. Pick one of yours (E, or click it), then where it goes (the
// arrows step through the places it can reach; E or click to send it; its own place to hold); Esc or a
// right-click backs out; Tab goes to your next squad without orders; Enter (or the button) ends the turn.
// The lesson has goals one after another, and his orders show as blue arrows before you give yours (Into the
// Breach's tells). A fight at a marked place you can go down to yourself: a turn-based fight (CombatScene),
// and how it goes decides it on the table. Then he turns it on (designer: obvious, and you can only lose,
// but fairly: you're out-thought): the room goes dark, the table hard white, the music turns; the table is
// set up again as the city really is; his arrows go; one move each; he plays to win.

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
  goal: number;
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
/** The End turn button, bottom right. */
const BUTTON = { x: W - 82, y: H - 16, w: 76, h: 12 };

export class WarTableScene extends Phaser.Scene {
  private params!: WarTableSceneData;
  private sc!: WarScenario;
  private state!: WarState;
  private phase: 'lesson' | 'now' = 'lesson';
  private goal = 0;
  private nowTurn = 0;
  private orders: Order[] = [];
  private hisOrders: Order[] = [];
  private droppedIn: string[] = [];
  private taught = false;
  private cursor!: WarPlace;
  /** Choosing where a squad goes: the squad, and the places it can go (its own first: hold). */
  private aiming: { squad: Squad; dests: WarPlace[] } | null = null;
  private busy = true;
  private closedAt = 0;
  private bg!: Phaser.GameObjects.Image;
  private gfx!: Phaser.GameObjects.Graphics;
  private labels: PixelText[] = [];
  private info!: PixelText;
  private hint!: PixelText;
  private title!: PixelText;
  private button!: PixelText;
  private dialogue!: DialogueBox;
  private music!: TableMusic;
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
    this.state = r?.state ?? fresh(sc.squads, sc.owner);
    this.phase = r?.phase ?? 'lesson';
    this.goal = r?.goal ?? 0;
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
    this.button = new PixelText(this, BUTTON.x + 4, BUTTON.y + 3, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(6);
    this.cursor = placeOf(this.sc.board, squadsOf(this.state, 'you')[0]?.place ?? this.currentGoal());
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, this.phase);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.stop());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointer(p, false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.time.addEvent({ delay: 400, loop: true, callback: () => ((this.blink = !this.blink), this.draw()) });
    this.cameras.main.fadeIn(700);
    this.draw();
    const r = this.params.resume;
    if (r) {
      // Back from a fight you went down to yourself: it decides that one, and the turn goes on.
      const fought: Fought = r.fighting ? { [r.fighting]: this.params.outcome === 'won' ? 'won' : 'lost' } : {};
      this.time.delayedCall(700, () => void this.runTurn(fought));
    } else {
      this.time.delayedCall(700, () => this.talk(this.sc.knots.intro, () => this.talk(this.sc.goals[0]!.start, () => this.startTurn())));
    }
  }

  private currentGoal(): string {
    return this.phase === 'now' ? this.sc.now.goal : this.sc.goals[this.goal]?.place ?? this.sc.now.goal;
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.aiming = null;
    this.state = { ...this.state, cut: [] };
    // In the lesson, his orders are chosen first and shown (the tells); when he means it, after yours, unseen.
    this.hisOrders = this.phase === 'lesson' ? chooseOrders(this.sc.board, this.state, 'him', 'lesson', this.sc.keep) : [];
    this.busy = false;
    this.draw();
  }

  private async endTurn(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.aiming = null;
    // A fight you could go down to yourself: ask, plainly.
    const drop = this.orders.find((o) => this.sc.dropIn[o.to] && squadAt(this.state, o.to)?.side === 'him' && !this.droppedIn.includes(o.to));
    if (drop && this.phase === 'lesson') {
      const place = placeOf(this.sc.board, drop.to);
      const ask = () =>
        this.dialogue.openMenu(`The fight for ${lower(place.name)}. Go down and fight it yourself, or leave it to the table?`, [
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
    const resume: Snapshot = { state: this.state, phase: this.phase, goal: this.goal, nowTurn: this.nowTurn, orders: this.orders, hisOrders: this.hisOrders, droppedIn: this.droppedIn, fighting: order.squad, taught: this.taught };
    const data: CombatSceneData = {
      encounter: this.sc.dropIn[order.to]!,
      back: this.params.back,
      returnTo: { scene: 'WarTable', data: { scenario: this.sc.id, back: this.params.back, resume } satisfies WarTableSceneData },
    };
    this.music.stop();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Combat', data));
  }

  /** Your orders go, then his; then whatever comes of it. */
  private async runTurn(fought: Fought): Promise<void> {
    this.busy = true;
    this.draw();
    for (const o of this.orders) await this.carry(o, fought);
    this.orders = [];
    const his = this.phase === 'lesson' ? this.hisOrders : chooseOrders(this.sc.board, this.state, 'him', 'war');
    for (const o of his) await this.carry(o, {});
    this.hisOrders = [];
    const yours = squadsOf(this.state, 'you').length;
    if (this.phase === 'lesson') {
      if (this.state.owner[this.currentGoal()] === 'you') return this.goalDone();
      if (this.state.turn >= this.sc.lessonTurns || !yours) return this.turnItOn();
    } else {
      this.nowTurn++;
      if (this.nowTurn >= this.sc.now.turns || !yours || this.state.owner[this.sc.now.goal] === 'you') return this.switchOff();
    }
    this.nextTurn();
  }

  private nextTurn(): void {
    this.state = { ...this.state, turn: this.state.turn + 1 };
    this.startTurn();
  }

  /** A goal of the lesson taken: his word on it, then the next, or "Good." and he turns it on. */
  private goalDone(): void {
    const done = this.sc.goals[this.goal]!;
    const then = () => {
      this.goal++;
      const next = this.sc.goals[this.goal];
      if (next) this.talk(next.start, () => this.nextTurn());
      else this.talk(this.sc.knots.good, () => this.turnItOn());
    };
    if (done.done) this.talk(done.done, then);
    else then();
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
    await this.tween(dot, { x: to.x, y: to.y, duration: 280 });
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
    await this.wait(160);
  }

  // --- He turns it on ---

  private turnItOn(): void {
    this.busy = true;
    this.talk(this.sc.knots.now, () => {
      // The room's lights drop; the table goes hard white; the music turns. The table's set up again, as the
      // city really is.
      this.phase = 'now';
      this.nowTurn = 0;
      this.cameras.main.flash(300, 255, 255, 255);
      this.music.mood('now');
      this.bg.setTexture('wartable-now');
      this.state = fresh(this.sc.now.squads, this.sc.now.owner);
      this.state.turn = 1;
      this.cursor = placeOf(this.sc.board, squadsOf(this.state, 'you')[0]!.place);
      this.startTurn();
    });
  }

  private switchOff(): void {
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('sim_turns', this.nowTurn);
    story.setVariable('sim_wiped', !squadsOf(this.state, 'you').length);
    this.talk(this.sc.knots.end, () => {
      this.music.stop();
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', { ...this.params.back, script: this.sc.knots.after } satisfies AreaSceneData));
    });
  }

  // --- Input ---

  private ready(): boolean {
    return !this.busy && !this.dialogue.isOpen && this.time.now - this.closedAt > 200;
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat || !this.ready()) return;
    const dir = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[e.key] as [number, number] | undefined;
    if (dir) {
      if (this.aiming) {
        // Step round the places it can go: Right and Down to the next, Left and Up back.
        const { dests } = this.aiming;
        const i = dests.indexOf(this.cursor);
        this.cursor = dests[(i + (dir[0] + dir[1] > 0 ? 1 : dests.length - 1)) % dests.length]!;
      } else {
        const next = placeInDirection(this.sc.board.places, this.cursor, dir[0], dir[1]);
        if (!next) return;
        this.cursor = next;
      }
      playMove(this);
      this.draw();
      return;
    }
    if (e.key === 'e' || e.key === 'E') return this.choose(this.cursor);
    if (e.key === 'Escape') return this.back();
    if (e.key === 'Tab') {
      e.preventDefault();
      return this.nextSquad();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!this.aiming) void this.endTurn();
    }
  }

  /** The mouse: hovering moves the cursor; a click chooses; a right-click backs out; the button ends the turn. */
  private onPointer(p: Phaser.Input.Pointer, down: boolean): void {
    if (!this.ready()) return;
    if (down && p.rightButtonDown()) return this.back();
    if (down && p.x >= BUTTON.x && p.x < BUTTON.x + BUTTON.w && p.y >= BUTTON.y && p.y < BUTTON.y + BUTTON.h) {
      if (!this.aiming) void this.endTurn();
      return;
    }
    const near = (this.aiming ? this.aiming.dests : this.sc.board.places).find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 13);
    if (near && near !== this.cursor) {
      this.cursor = near;
      this.draw();
    }
    if (down) {
      if (near) this.choose(near);
      else if (this.aiming) this.back();
    }
  }

  /** E or a click on a place: pick up your squad there, or send the one you've picked there. */
  private choose(place: WarPlace): void {
    if (this.aiming) {
      const { squad, dests } = this.aiming;
      if (!dests.includes(place)) return;
      this.orders = this.orders.filter((o) => o.squad !== squad.id);
      if (place.id !== squad.place) this.orders.push({ squad: squad.id, to: place.id });
      this.aiming = null;
      this.cursor = place;
      playConfirm(this);
    } else {
      const squad = squadAt(this.state, place.id);
      if (squad?.side !== 'you' || this.state.cut.includes(squad.place)) return;
      const dests = [place, ...waysFrom(this.sc.board, place.id).map((w) => placeOf(this.sc.board, w.to))];
      // Round the squad clockwise from straight up, so stepping through them goes round in order.
      const angle = (q: WarPlace) => (Math.atan2(q.x - place.x, -(q.y - place.y)) + 2 * Math.PI) % (2 * Math.PI);
      const round = dests.slice(1).sort((a, b) => angle(a) - angle(b));
      this.aiming = { squad, dests: [place, ...round] };
      // Start on where it's already going, or the first place it could go.
      const going = this.orders.find((o) => o.squad === squad.id);
      this.cursor = going ? placeOf(this.sc.board, going.to) : round[0] ?? place;
      playMove(this);
    }
    this.draw();
  }

  private back(): void {
    if (!this.aiming) return;
    this.cursor = placeOf(this.sc.board, this.aiming.squad.place);
    this.aiming = null;
    this.draw();
  }

  /** Tab: on to the next of your squads without orders yet. */
  private nextSquad(): void {
    this.aiming = null;
    const mine = squadsOf(this.state, 'you').filter((s) => !this.state.cut.includes(s.place));
    if (!mine.length) return;
    const waiting = mine.filter((s) => !this.orders.some((o) => o.squad === s.id));
    const pool = waiting.length ? waiting : mine;
    const i = pool.findIndex((s) => s.place === this.cursor.id);
    this.cursor = placeOf(this.sc.board, pool[(i + 1) % pool.length]!.place);
    playMove(this);
    this.draw();
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
    for (let i = 1; i < lifts.length; i++) dashed(g, lifts[i - 1]!, lifts[i]!, line, 1);
    // The places, and who holds them; the goal ringed.
    for (const p of board.places) {
      const owner = this.state.owner[p.id];
      const col = owner === 'you' ? AMBER : owner === 'him' ? this.hisColour() : SHADES.dim;
      g.lineStyle(1, col, 1).strokeRect(p.x - 3, p.y - 3, 7, 7);
      if (p.stronghold) g.strokeRect(p.x - 5, p.y - 5, 11, 11);
      if (p.id === this.currentGoal() && !this.busy) g.lineStyle(1, AMBER, this.blink ? 1 : 0.4).strokeCircle(p.x, p.y, 14);
      const label = new PixelText(this, 0, p.y + 11, lower(p.name), { color: SHADES.light, shadow: SHADES.shadow });
      label.setX(Math.round(p.x - label.width / 2));
      this.labels.push(label);
    }
    // Orders: his (in the lesson) as blue arrows, yours amber; and, choosing, where the one you've picked would go.
    for (const o of this.hisOrders) this.arrow(g, o, this.hisColour());
    for (const o of this.orders) if (o.squad !== this.aiming?.squad.id) this.arrow(g, o, AMBER);
    if (this.aiming && this.cursor.id !== this.aiming.squad.place) this.arrow(g, { squad: this.aiming.squad.id, to: this.cursor.id }, this.blink ? AMBER : SHADES.white);
    // The squads: a disc of light with its strength.
    for (const s of this.state.squads) {
      const p = placeOf(board, s.place);
      const col = s.side === 'you' ? AMBER : this.hisColour();
      const r = s.strength > 9 ? 8 : 7;
      g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, r);
      g.fillStyle(col, 1).fillCircle(p.x, p.y, r - 1);
      if (this.aiming?.squad.id === s.id) g.lineStyle(1, SHADES.white, 1).strokeCircle(p.x, p.y, r + 2);
      const n = new PixelText(this, 0, p.y - 3, String(s.strength), { color: SHADES.shadow });
      n.setX(Math.round(p.x - n.width / 2 + 1));
      this.labels.push(n);
    }
    // Where you can send the one you've picked.
    if (this.aiming) for (const p of this.aiming.dests.slice(1)) g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 11);
    // The cursor.
    if (!this.busy && this.blink) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 12, this.cursor.y - 12, 25, 25);
    // The End turn button.
    const canEnd = !this.busy && !this.aiming;
    g.fillStyle(canEnd ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h);
    g.lineStyle(1, canEnd ? AMBER : SHADES.dim, 1).strokeRect(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h);
    this.button.setColor(canEnd ? SHADES.white : SHADES.dim);
    const goal = lower(placeOf(board, this.currentGoal()).name);
    this.title.setText(now ? `Take ${goal}.` : `The lesson: take ${goal}.   Turn ${this.state.turn}`);
    this.info.setText(this.busy ? '' : this.describe());
    this.hint.setText(this.busy ? '' : this.aiming ? 'Arrows: where they go   E or click: send them   Esc or right-click: back' : 'E or click: choose a squad   Tab: next squad   Enter: end the turn');
  }

  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number): void {
    const s = this.state.squads.find((q) => q.id === o.squad);
    if (!s) return;
    const a = placeOf(this.sc.board, s.place);
    const b = placeOf(this.sc.board, o.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
    const [ex, ey] = [b.x - ux * 9, b.y - uy * 9];
    g.lineStyle(3, SHADES.shadow, 0.8).lineBetween(a.x + ux * 8, a.y + uy * 8, ex, ey);
    g.lineStyle(1, col, 1).lineBetween(a.x + ux * 8, a.y + uy * 8, ex, ey);
    g.fillStyle(col, 1).fillTriangle(ex + ux * 4, ey + uy * 4, ex - uy * 4 - ux * 2, ey + ux * 4 - uy * 2, ex + uy * 4 - ux * 2, ey - ux * 4 - uy * 2);
  }

  /** What's under the cursor, plainly; and, choosing where to send a squad, what would happen. */
  private describe(): string {
    const p = this.cursor;
    const there = squadAt(this.state, p.id);
    const owner = this.state.owner[p.id];
    const whose = owner === 'you' ? 'yours' : owner === 'him' ? 'his' : "nobody's";
    let text = `${p.name}: ${whose}${there ? `, ${there.strength} strong` : ''}${p.stronghold ? ' (held at +1)' : ''}${this.state.cut.includes(p.id) ? '. No power: nobody here can move.' : ''}`;
    const aim = this.aiming?.squad;
    if (aim && p.id !== aim.place && canMove(this.sc.board, this.state, aim, p.id)) {
      if (!there) text = `Send them to ${lower(p.name)}: they take it.`;
      else if (there.side === 'you') text = `Send them to join the squad there: ${aim.strength + there.strength} strong.`;
      else {
        const a = attackOf(this.sc.board, aim.place, p.id, aim.strength);
        const d = defenceOf(this.sc.board, p.id, there.strength);
        const uphill = a < aim.strength ? ' (uphill: 1 less)' : '';
        text = `Attack: ${a}${uphill} against ${d}. ${a > d ? `You'd take it, with ${Math.max(1, a - d)} left.` : 'They’d hold, and your squad would be lost.'}`;
        if (this.phase === 'lesson' && this.sc.dropIn[p.id] && !this.droppedIn.includes(p.id)) text += ' Or go down and fight it yourself.';
      }
    } else if (aim && p.id === aim.place) text = 'Hold: they stay where they are.';
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

const fresh = (squads: Squad[], owner: WarState['owner']): WarState => ({ squads: squads.map((s) => ({ ...s })), owner: { ...owner }, cut: [], turn: 1 });

/** "The data centre" → "the data centre", for the middle of a sentence. */
const lower = (name: string) => name.replace(/^The /, 'the ');

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
