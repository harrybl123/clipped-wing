import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { RIOTS, type RiotGoal, type RiotScenario } from '../data/warTable';
import { getSession } from '../session';
import {
  attackOf, canMove, defenceOf, outsideHeart, placeInDirection, placeOf, reinforced, resolveOne, riotGoalMet, riotGrow, riotOrders,
  squadAt, squadsOf, waysFrom, type Order, type Squad, type WarBoard, type WarPlace, type WarState,
} from '../systems/WarTable';
import { DialogueBox } from '../ui/DialogueBox';
import { rgb, SHADES, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import { startTableMusic, type TableMusic } from '../ui/tableMusic';
import type { AreaSceneData } from './AreaScene';
import type { CombatSceneData } from './CombatScene';

// The riot on the war table (Chapter 3, Day 4; docs/sequences/chapter-3/plan.md): the same table as Day 2,
// and now it's real. Your father hands you command of the guard (designer); the table shows the district
// that's risen, close up, as a street plan in light (designer: its own map, larger; a longer game, on the easy
// side but not really easy). The rules are src/systems/WarTable.ts ("The riot"), the boards and scenarios
// src/data/warTable.ts (RIOTS).
//
// The guard is yours now, in the city's cyan; the rising is amber, and it burns where it holds. It grows in
// the square and spreads out of it into any empty street next to it; its crowds head for the stair up to the
// citadel. One goal after another: take back two streets, seal every street into the square, clear what's
// left outside it, then the square, which you go down to yourself (the fight, your hand beside you). More of
// the guard comes off the lifts every few turns, and every few turns you can cut the power under a crowd. If a
// crowd takes the stair up, you've lost it: he takes command from you (designer), finishes it, and sends you
// down to the square anyway.
//
// Controls as the lesson's: pick a squad (E or click), the arrows step round where it can go, E or click to
// send it (its own place to hold); Esc or right-click backs out; Tab to the next squad; Enter (or the button)
// ends the turn; P (or the button), then a crowd, cuts the power under it.

export interface RiotTableSceneData {
  scenario: string;
  /** Where you were (the simulation room). The riot comes out in its square instead. */
  back: AreaSceneData;
}

const CYAN = SHADES.cyan;
const AMBER = SHADES.amber;
const END = { x: W - 82, y: H - 16, w: 76, h: 12 };
const POWER = { x: W - 168, y: H - 16, w: 80, h: 12 };

export class RiotTableScene extends Phaser.Scene {
  private sc!: RiotScenario;
  private board!: WarBoard;
  private state!: WarState;
  private goal = 0;
  private orders: Order[] = [];
  /** The turn the power was last cut. */
  private lastCut = -99;
  /** Choosing a crowd to cut the power under. */
  private cutting = false;
  /** What's been said once already. */
  private said = new Set<string>();
  private cursor!: WarPlace;
  private aiming: { squad: Squad; dests: WarPlace[] } | null = null;
  private busy = true;
  private closedAt = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private labels: PixelText[] = [];
  private title!: PixelText;
  private info!: PixelText;
  private hint!: PixelText;
  private endButton!: PixelText;
  private powerButton!: PixelText;
  private dialogue!: DialogueBox;
  private music!: TableMusic;
  private blink = true;
  private flicker = 0;

  constructor() {
    super('RiotTable');
  }

  init(data: RiotTableSceneData): void {
    const sc = RIOTS[data.scenario];
    if (!sc) throw new Error(`RiotTableScene: no riot called "${data.scenario}"`);
    this.sc = sc;
    this.board = sc.board;
    this.state = { squads: sc.squads.map((s) => ({ ...s })), owner: { ...sc.owner }, cut: [], turn: 1 };
    this.goal = 0;
    this.orders = [];
    this.lastCut = -99;
    this.cutting = false;
    this.said = new Set();
    this.aiming = null;
    this.busy = true;
    this.labels = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const key = `riot-table-${this.sc.district}`;
    makePaintedTexture(this, key, W, H, districtPainter(this.board, this.sc.district));
    this.add.image(0, 0, key).setOrigin(0);
    this.gfx = this.add.graphics();
    this.title = new PixelText(this, 8, 6, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(5);
    this.info = new PixelText(this, 8, 18, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(5);
    this.hint = new PixelText(this, 8, H - 12, '', { color: SHADES.dim, shadow: SHADES.shadow }).setDepth(5);
    this.endButton = new PixelText(this, END.x + 4, END.y + 3, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(6);
    this.powerButton = new PixelText(this, POWER.x + 4, POWER.y + 3, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(6);
    this.cursor = placeOf(this.board, squadsOf(this.state, 'you')[0]!.place);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, 'now');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.stop());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointer(p, false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.time.addEvent({ delay: 400, loop: true, callback: () => ((this.blink = !this.blink), this.draw()) });
    this.time.addEvent({ delay: 140, loop: true, callback: () => ((this.flicker = (this.flicker + 1) % 64), this.drawFires()) });
    this.cameras.main.fadeIn(700);
    this.draw();
    this.time.delayedCall(700, () => this.talk(this.sc.knots.intro, () => this.talk(this.currentGoal()!.start, () => this.startTurn())));
  }

  private currentGoal(): RiotGoal | undefined {
    return this.sc.goals[this.goal];
  }

  private powerReady(): boolean {
    return this.state.turn - this.lastCut >= this.sc.powerEvery;
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.aiming = null;
    this.cutting = false;
    this.state = { ...this.state, cut: [] };
    this.busy = false;
    this.draw();
  }

  private async endTurn(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.aiming = null;
    this.cutting = false;
    // Into the square, once it's time: you go down yourself (there's no leaving this one to the table).
    const goal = this.currentGoal();
    const down = goal?.kind === 'square' && this.orders.find((o) => o.to === this.sc.rules.heart);
    if (down) return this.goDown(false);
    const lostBefore = squadsOf(this.state, 'you').length;
    let lostFight = false;
    for (const o of this.orders) lostFight = (await this.carry(o)) || lostFight;
    this.orders = [];
    for (const o of riotOrders(this.board, this.state, this.sc.rules)) lostFight = (await this.carry(o)) || lostFight;
    // The square grows, and a crowd goes out of it.
    const grown = riotGrow(this.board, this.state, this.sc.rules);
    this.state = grown.state;
    if (grown.spread) await this.pour(grown.spread.to);
    // More of the guard, off the lifts.
    const arriving = this.state.turn % this.sc.reinforce.every === 0;
    if (arriving) {
      this.state = reinforced(this.board, this.state, this.sc.reinforce.place, this.sc.reinforce.strength);
      playSound(this, 'boots', 0.6);
    }
    this.draw();
    // They've taken the stair up: it's his now.
    if (this.state.owner[this.sc.lostIf] === 'him') return this.takenFromYou();
    const lines: string[] = [];
    const once = (key: string, knot: string, when: boolean) => {
      if (when && !this.said.has(key)) (this.said.add(key), lines.push(knot));
    };
    once('lost', this.sc.knots.lost, lostFight || squadsOf(this.state, 'you').length < lostBefore);
    once('spread', this.sc.knots.spread, !!grown.spread);
    once('reinforce', this.sc.knots.reinforce, arriving);
    once('power', this.sc.knots.power, this.powerReady() && this.state.turn + 1 - this.lastCut >= this.sc.powerEvery && this.state.turn >= 2);
    const nearStair = waysFrom(this.board, this.sc.lostIf).some((w) => squadAt(this.state, w.to)?.side === 'him');
    once('stair', this.sc.knots.stair, nearStair);
    // Goals met (more than one at once, sometimes): on to the next.
    let advanced = false;
    while (this.currentGoal() && this.currentGoal()!.kind !== 'square' && riotGoalMet(this.board, this.state, this.sc.rules.heart, this.currentGoal()!)) {
      this.goal++;
      advanced = true;
    }
    if (advanced) lines.push(this.currentGoal()!.start);
    this.state = { ...this.state, turn: this.state.turn + 1 };
    this.say(lines, () => this.startTurn());
  }

  /** Several knots, one after another, then on. */
  private say(knots: string[], then: () => void): void {
    const [first, ...rest] = knots;
    if (!first) return then();
    this.talk(first, () => this.say(rest, then));
  }

  /** One order, shown: the light slides along the street; a fight flashes; a squad of yours broken bursts. Returns whether yours lost it. */
  private async carry(order: Order): Promise<boolean> {
    const before = this.state.squads.find((s) => s.id === order.squad);
    if (!before) return false;
    const { state, events } = resolveOne(this.board, this.state, order);
    if (!events.length) return false;
    const from = placeOf(this.board, before.place);
    const to = placeOf(this.board, order.to);
    const dot = this.add.circle(from.x, from.y, 6, before.side === 'you' ? CYAN : AMBER).setDepth(4);
    await this.tween(dot, { x: to.x, y: to.y, duration: 220, ease: 'Sine.easeInOut' });
    dot.destroy();
    const battle = events.find((e) => e.type === 'battle');
    let yoursLost = false;
    if (battle && battle.type === 'battle') {
      const broken = battle.won ? squadAt(this.state, order.to) : before;
      yoursLost = broken?.side === 'you';
      void this.burst(to.x, to.y, broken?.side === 'you' ? CYAN : AMBER, yoursLost);
    } else playSound(this, 'tick', 0.5);
    this.state = state;
    this.draw();
    await this.wait(90);
    return yoursLost;
  }

  /** A squad broken: a burst of light, a ring, shards; harder, and the table shaking, when it's yours. */
  private async burst(x: number, y: number, colour: number, hard: boolean): Promise<void> {
    playSound(this, hard ? 'crash' : 'hit', hard ? 0.8 : 0.7);
    if (hard) this.cameras.main.shake(220, 0.006);
    const flash = this.add.circle(x, y, 9, SHADES.white).setDepth(6);
    const ring = this.add.circle(x, y, 7).setStrokeStyle(1, SHADES.white).setDepth(6);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 240, onComplete: () => flash.destroy() });
    this.tweens.add({ targets: ring, scale: 3.4, alpha: 0, duration: 460, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
      const d = 12 + Math.random() * 18;
      const shard = this.add.rectangle(x, y, 2, 2, i % 3 ? colour : SHADES.white).setDepth(6);
      this.tweens.add({ targets: shard, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 5, alpha: 0, duration: 450 + Math.random() * 250, ease: 'Quad.easeOut', onComplete: () => shard.destroy() });
    }
    await this.wait(160);
  }

  /** A crowd pouring out of the square into a street. */
  private async pour(to: string): Promise<void> {
    const a = placeOf(this.board, this.sc.rules.heart);
    const b = placeOf(this.board, to);
    playSound(this, 'murmur', 0.5);
    for (let i = 0; i < 5; i++) {
      const d = this.add.circle(a.x, a.y, 2, AMBER).setDepth(4);
      this.tweens.add({ targets: d, x: b.x + (Math.random() - 0.5) * 8, y: b.y + (Math.random() - 0.5) * 8, delay: i * 60, duration: 360, ease: 'Sine.easeOut', onComplete: () => d.destroy() });
    }
    await this.wait(520);
    this.draw();
  }

  // --- The end of it ---

  /** Down to the square, yourself: the fight (your hand beside you), then the square, in the district. */
  private goDown(taken: boolean): void {
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('riot_table', taken ? 'taken' : 'won');
    story.setVariable('riot_turns', this.state.turn);
    this.talk(this.sc.knots.dropIn, () => {
      const data: CombatSceneData = { encounter: this.sc.square, back: { ...this.sc.squareArea, script: this.sc.knots.after } };
      this.music.stop();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Combat', data));
    });
  }

  /** They've reached the stair up: he takes command from you (designer), and finishes it, fast. */
  private takenFromYou(): void {
    this.busy = true;
    this.talk(this.sc.knots.taken, async () => {
      this.cameras.main.flash(250, 255, 255, 255);
      // Every crowd outside the square broken, one after another, and the guard on every street into it.
      for (const crowd of outsideHeart(this.state, this.sc.rules.heart)) {
        const p = placeOf(this.board, crowd.place);
        this.state = { ...this.state, squads: this.state.squads.filter((s) => s !== crowd), owner: { ...this.state.owner, [crowd.place]: 'you' } };
        void this.burst(p.x, p.y, AMBER, false);
        this.draw();
        await this.wait(260);
      }
      for (const [i, w] of waysFrom(this.board, this.sc.rules.heart).entries()) {
        if (!squadAt(this.state, w.to)) this.state.squads.push({ id: `taken-${i}`, side: 'you', place: w.to, strength: 4 });
        this.state.owner[w.to] = 'you';
      }
      playSound(this, 'boots', 0.8);
      this.draw();
      await this.wait(600);
      this.goDown(true);
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
        const { dests } = this.aiming;
        const i = dests.indexOf(this.cursor);
        this.cursor = dests[(i + (dir[0] + dir[1] > 0 ? 1 : dests.length - 1)) % dests.length]!;
      } else {
        const next = placeInDirection(this.board.places, this.cursor, dir[0], dir[1]);
        if (!next) return;
        this.cursor = next;
      }
      playMove(this);
      this.draw();
      return;
    }
    if (e.key === 'e' || e.key === 'E') return this.choose(this.cursor);
    if (e.key === 'p' || e.key === 'P') return this.togglePower();
    if (e.key === 'Escape') return this.back();
    if (e.key === 'Tab') {
      e.preventDefault();
      return this.nextSquad();
    }
    if ((e.key === 'Enter' || e.key === ' ') && !this.aiming && !this.cutting) void this.endTurn();
  }

  private onPointer(p: Phaser.Input.Pointer, down: boolean): void {
    if (!this.ready()) return;
    if (down && p.rightButtonDown()) return this.back();
    const inside = (b: typeof END) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
    if (down && inside(END)) {
      if (!this.aiming && !this.cutting) void this.endTurn();
      return;
    }
    if (down && inside(POWER)) return this.togglePower();
    const near = (this.aiming ? this.aiming.dests : this.board.places).find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 13);
    if (near && near !== this.cursor) {
      this.cursor = near;
      this.draw();
    }
    if (down) {
      if (near) this.choose(near);
      else this.back();
    }
  }

  private togglePower(): void {
    if (this.aiming || !this.powerReady()) return;
    this.cutting = !this.cutting;
    playMove(this);
    this.draw();
  }

  private choose(place: WarPlace): void {
    if (this.cutting) {
      // The power off under one of their crowds (not the square: it has its own).
      const there = squadAt(this.state, place.id);
      if (there?.side !== 'him') return;
      this.state = { ...this.state, cut: [place.id] };
      this.lastCut = this.state.turn;
      this.cutting = false;
      playSound(this, 'boom', 0.6);
      this.cameras.main.shake(160, 0.003);
      this.draw();
      return;
    }
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
      const dests = [place, ...waysFrom(this.board, place.id).map((w) => placeOf(this.board, w.to))];
      const angle = (q: WarPlace) => (Math.atan2(q.x - place.x, -(q.y - place.y)) + 2 * Math.PI) % (2 * Math.PI);
      const round = dests.slice(1).sort((a, b) => angle(a) - angle(b));
      this.aiming = { squad, dests: [place, ...round] };
      const going = this.orders.find((o) => o.squad === squad.id);
      this.cursor = going ? placeOf(this.board, going.to) : round[0] ?? place;
      playMove(this);
    }
    this.draw();
  }

  private back(): void {
    if (this.cutting) {
      this.cutting = false;
      this.draw();
      return;
    }
    if (!this.aiming) return;
    this.cursor = placeOf(this.board, this.aiming.squad.place);
    this.aiming = null;
    this.draw();
  }

  private nextSquad(): void {
    this.aiming = null;
    const mine = squadsOf(this.state, 'you');
    if (!mine.length) return;
    const waiting = mine.filter((s) => !this.orders.some((o) => o.squad === s.id));
    const pool = waiting.length ? waiting : mine;
    const i = pool.findIndex((s) => s.place === this.cursor.id);
    this.cursor = placeOf(this.board, pool[(i + 1) % pool.length]!.place);
    playMove(this);
    this.draw();
  }

  // --- Drawing ---

  /** Fire where the rising holds: embers flickering round each place of theirs, the square burning hardest. */
  private fires!: Phaser.GameObjects.Graphics;
  private drawFires(): void {
    this.fires ??= this.add.graphics().setDepth(1);
    const g = this.fires.clear();
    for (const p of this.board.places) {
      if (this.state.owner[p.id] !== 'him') continue;
      const big = p.id === this.sc.rules.heart;
      const n = big ? 16 : 7;
      for (let i = 0; i < n; i++) {
        const seed = (i * 37 + p.x * 3 + p.y) % 97;
        const life = ((this.flicker + seed) % 12) / 12;
        const a = seed * 0.7;
        const r = (big ? 13 : 10) + (seed % 5);
        const x = Math.round(p.x + Math.cos(a) * r);
        const y = Math.round(p.y + Math.sin(a) * r * 0.6 - life * 6);
        g.fillStyle(life < 0.3 ? SHADES.white : life < 0.7 ? AMBER : SHADES.amberDeep, 1 - life * 0.6).fillRect(x, y, 1, 1);
      }
    }
  }

  private draw(): void {
    const g = this.gfx.clear();
    for (const l of this.labels) l.destroy();
    this.labels = [];
    for (const w of this.board.ways) {
      const a = placeOf(this.board, w.a);
      const b = placeOf(this.board, w.b);
      g.lineStyle(3, SHADES.shadow, 0.6).lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(1, w.kind === 'stair' ? SHADES.white : SHADES.cyanMid, 1).lineBetween(a.x, a.y, b.x, b.y);
    }
    const goal = this.currentGoal();
    const goalPlaces = goal?.kind === 'take' || goal?.kind === 'square' ? [goal.place!] : goal?.kind === 'seal' ? waysFrom(this.board, this.sc.rules.heart).map((w) => w.to).filter((p) => squadAt(this.state, p)?.side !== 'you') : goal?.kind === 'clear' ? outsideHeart(this.state, this.sc.rules.heart).map((s) => s.place) : [];
    for (const p of this.board.places) {
      const owner = this.state.owner[p.id];
      const col = owner === 'you' ? CYAN : owner === 'him' ? AMBER : SHADES.dim;
      g.lineStyle(1, col, 1).strokeRect(p.x - 3, p.y - 3, 7, 7);
      if (p.stronghold) g.strokeRect(p.x - 5, p.y - 5, 11, 11);
      if (p.id === this.sc.lostIf) g.lineStyle(1, SHADES.white, 0.8).strokeRect(p.x - 5, p.y - 5, 11, 11);
      if (goalPlaces.includes(p.id) && !this.busy) g.lineStyle(1, SHADES.white, this.blink ? 1 : 0.35).strokeCircle(p.x, p.y, 13);
      if (this.state.cut.includes(p.id)) g.fillStyle(SHADES.shadow, 0.7).fillCircle(p.x, p.y, 12);
      const label = new PixelText(this, 0, p.y + 10, lower(p.name), { color: SHADES.light, shadow: SHADES.shadow });
      label.setX(Math.max(2, Math.min(W - label.width - 2, Math.round(p.x - label.width / 2))));
      this.labels.push(label);
    }
    for (const o of this.orders) if (o.squad !== this.aiming?.squad.id) this.arrow(g, o, CYAN);
    if (this.aiming && this.cursor.id !== this.aiming.squad.place) this.arrow(g, { squad: this.aiming.squad.id, to: this.cursor.id }, this.blink ? CYAN : SHADES.white);
    for (const s of this.state.squads) {
      const p = placeOf(this.board, s.place);
      const col = s.side === 'you' ? CYAN : AMBER;
      const r = s.strength > 9 ? 8 : 7;
      g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, r);
      g.fillStyle(this.state.cut.includes(s.place) ? SHADES.amberDeep : col, 1).fillCircle(p.x, p.y, r - 1);
      if (this.aiming?.squad.id === s.id) g.lineStyle(1, SHADES.white, 1).strokeCircle(p.x, p.y, r + 2);
      const n = new PixelText(this, 0, p.y - 3, String(s.strength), { color: SHADES.shadow });
      n.setX(Math.round(p.x - n.width / 2 + 1));
      this.labels.push(n);
    }
    if (this.aiming) for (const p of this.aiming.dests.slice(1)) g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 11);
    if (this.cutting) for (const s of squadsOf(this.state, 'him')) if (s.place !== this.sc.rules.heart) {
      const p = placeOf(this.board, s.place);
      g.lineStyle(1, SHADES.white, this.blink ? 1 : 0.4).strokeCircle(p.x, p.y, 11);
    }
    if (!this.busy && this.blink) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 12, this.cursor.y - 12, 25, 25);
    // The buttons.
    const canEnd = !this.busy && !this.aiming && !this.cutting;
    g.fillStyle(canEnd ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(END.x, END.y, END.w, END.h);
    g.lineStyle(1, canEnd ? CYAN : SHADES.dim, 1).strokeRect(END.x, END.y, END.w, END.h);
    this.endButton.setColor(canEnd ? SHADES.white : SHADES.dim);
    const ready = this.powerReady() && !this.busy;
    const wait = this.sc.powerEvery - (this.state.turn - this.lastCut);
    g.fillStyle(this.cutting ? SHADES.amberDeep : ready ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(POWER.x, POWER.y, POWER.w, POWER.h);
    g.lineStyle(1, ready ? CYAN : SHADES.dim, 1).strokeRect(POWER.x, POWER.y, POWER.w, POWER.h);
    this.powerButton.setText(this.cutting ? 'Cut: where?' : ready ? 'Cut power' : `Power: ${wait}`).setColor(ready ? SHADES.white : SHADES.dim);
    const movable = squadsOf(this.state, 'you').filter((q) => !this.state.cut.includes(q.place)).length;
    this.title.setText(`${goal ? goalText(goal, this.board) : ''}   Turn ${this.state.turn}   Orders: ${this.orders.length} of ${movable}`);
    this.info.setText(this.busy ? '' : this.describe());
    this.hint.setText(
      this.busy
        ? ''
        : this.cutting
          ? 'Choose a crowd to cut the power under   Esc: back'
          : this.aiming
            ? 'Arrows: where they go   E: send them   Esc: back'
            : 'E: choose a squad   Tab: next   P: cut power   Enter: end turn',
    );
  }

  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number): void {
    const s = this.state.squads.find((q) => q.id === o.squad);
    if (!s) return;
    const a = placeOf(this.board, s.place);
    const b = placeOf(this.board, o.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
    const [ex, ey] = [b.x - ux * 9, b.y - uy * 9];
    g.lineStyle(3, SHADES.shadow, 0.8).lineBetween(a.x + ux * 8, a.y + uy * 8, ex, ey);
    g.lineStyle(1, col, 1).lineBetween(a.x + ux * 8, a.y + uy * 8, ex, ey);
    g.fillStyle(col, 1).fillTriangle(ex + ux * 4, ey + uy * 4, ex - uy * 4 - ux * 2, ey + ux * 4 - uy * 2, ex + uy * 4 - ux * 2, ey - ux * 4 - uy * 2);
  }

  /** What's under the cursor, plainly; choosing where to send a squad, what would happen. */
  private describe(): string {
    const p = this.cursor;
    const there = squadAt(this.state, p.id);
    const owner = this.state.owner[p.id];
    const whose = owner === 'you' ? 'the guard' : owner === 'him' ? 'the rising' : 'nobody';
    let text = `${p.name}: ${whose}${there ? `, ${there.strength} strong` : ''}`;
    if (p.id === this.sc.rules.heart) text += '. Barricaded: held at +1, and the barricades lose nothing. It grows, and spreads into empty streets.';
    else if (p.id === this.sc.lostIf) text += '. The way up to the citadel. Don’t let them take it.';
    else if (there?.side === 'you') text += ' (the guard’s pikes: they defend at +1)';
    if (this.state.cut.includes(p.id)) text += '. No power: they can’t move, and fight at 1 less.';
    if (this.cutting) return there?.side === 'him' && p.id !== this.sc.rules.heart ? `Cut the power under them: they can't move this turn, and fight at 1 less.` : 'Choose one of their crowds.';
    const aim = this.aiming?.squad;
    if (aim && p.id !== aim.place && canMove(this.board, this.state, aim, p.id)) {
      if (p.id === this.sc.rules.heart && this.currentGoal()?.kind === 'square') return 'The square. Go down yourself.';
      if (!there) return `Send them to ${lower(p.name)}: they take it.`;
      if (there.side === 'you') return `Send them to join the squad there: ${aim.strength + there.strength} strong.`;
      const a = attackOf(this.board, aim.place, p.id, aim.strength);
      const d = defenceOf(this.board, p.id, there.strength, this.state.cut, there.side);
      return `Attack: ${a} against ${d}. ${a > d ? `You'd break them, with ${Math.max(1, a - d)} left.` : 'They’d hold, and your squad would be lost.'}`;
    }
    if (aim && p.id === aim.place) return 'Hold: they stay where they are.';
    return text;
  }

  // --- Helpers ---

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

const lower = (name: string) => name.replace(/^The /, 'the ');

/** The goal, as the line at the top. */
function goalText(goal: RiotGoal, board: WarBoard): string {
  switch (goal.kind) {
    case 'take':
      return `Take back ${lower(placeOf(board, goal.place!).name)}.`;
    case 'seal':
      return 'Seal the square: a squad on every street into it.';
    case 'clear':
      return 'Break every crowd outside the square.';
    case 'square':
      return 'The square. Go down yourself.';
  }
}

/**
 * The table: the district as a street plan from above, in light: its streets lit, the blocks between them
 * dark with a few lit windows, a plaza at each place. The low district warm and crowded (small blocks); the
 * promenade's glass in long, clean ones. Drawn in the table's cyan, as Day 2's lesson was.
 */
function districtPainter(board: WarBoard, district: 'low' | 'promenade'): (x: number, y: number) => PixelColour {
  const segs = board.ways.map((w) => [placeOf(board, w.a), placeOf(board, w.b)] as const);
  const lot = district === 'low' ? 9 : 16;
  const steps: RGB[] = [SHADES.shadow, SHADES.cyanDeep, SHADES.cyanMid, SHADES.cyan].map(rgb);
  return (x, y) => {
    let d = Infinity;
    for (const [a, b] of segs) {
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
      d = Math.min(d, Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t)));
    }
    for (const p of board.places) d = Math.min(d, Math.hypot(x - p.x, y - p.y) - 6);
    let lum: number;
    if (d < 3) lum = 0.42;
    else if (d < 5) lum = 0.62; // the kerb, lit
    else {
      // Blocks: lots in a grid, a dark gap between them; their roofs; now and then a lit window.
      const gx = x % lot;
      const gy = y % lot;
      const gap = gx === 0 || gy === 0;
      const h = ((Math.floor(x / lot) * 73856093) ^ (Math.floor(y / lot) * 19349663)) >>> 0;
      lum = gap ? 0.08 : 0.2 + (h % 7) * 0.02;
      if (!gap && gx % 3 === 1 && gy % 4 === 2 && ((h >> 3) + gx * 7 + gy) % 11 === 0) lum = 0.85;
    }
    if (y % 3 === 0) lum *= 0.8;
    const edge = Math.min(x, W - x, y, H - y) / 40;
    lum *= Math.min(1, 0.4 + edge) * 0.85;
    const t = Math.min(2.999, lum * 4);
    const i = Math.floor(t);
    const k = t - i;
    const a = steps[i]!;
    const b = steps[i + 1]!;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
}
