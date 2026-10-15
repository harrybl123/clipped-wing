import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { RIOTS, type LessonScenario, type RiotScenario } from '../data/warTable';
import { getSession } from '../session';
import { RIOT_RULES, RiotGame, type Order, type RiotBoard, type RiotEvent, type RiotPlace, type RiotSquad, type RiotState, type Side } from '../systems/Riot';
import { careful, steady, type GuardPlayer } from '../systems/RiotPlayers';
import { DialogueBox } from '../ui/DialogueBox';
import { rgb, SHADES, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import { startTableMusic, type TableMusic } from '../ui/tableMusic';
import type { AreaSceneData } from './AreaScene';
import type { CombatSceneData } from './CombatScene';

// The war table (Chapter 3): the game in src/systems/Riot.ts (docs/sequences/chapter-3/war-table.md), the
// old table's simplicity with the riot in it (designer). Two uses:
//
//   Day 2, the lesson (`lesson`): you're the rising, your father the guard. One goal after another, his moves
//   shown as arrows, his lines the first time each thing happens; the last goal you go down to yourself; then
//   "Now.": he means it, plays the guard properly (no arrows), cuts your power, and takes your square.
//   Day 4, the riot (`riot_low`, `riot_promenade`): you're the guard, for real, and nobody tells you how to
//   play (designer). Take the square before dawn and you go down yourself; if dawn comes first, your father
//   comes in, takes the table, and wins it while you watch.
//
// The table shows a riot (designer): the district's streets in light; the rising's squads amber circles, with
// fire and a crowd round them; the guard's blue shields; a key at the top says who's who, and which is you.
// Controls (the old table's): pick a squad of yours (E or click), the arrows step round where it can go, E or
// click to send it (its own place to hold); Esc or right-click backs out; Tab to the next squad; Enter (or the
// button) ends the turn. As the guard, P (or the button) cuts the power under a place.

export interface RiotTableSceneData {
  scenario: string;
  /** Where you were (the simulation room). */
  back: AreaSceneData;
  /** The lesson, back from the fight you went down to: on to "Now.". */
  phase?: 'lesson' | 'now';
  outcome?: string;
}

const AMBER = SHADES.amber;
const CYAN = SHADES.cyan;
const END = { x: W - 70, y: H - 15, w: 64, h: 11 };
const POWER = { x: W - 140, y: H - 15, w: 64, h: 11 };
const COLOUR: Record<Side, number> = { guard: CYAN, rising: AMBER };

export class RiotTableScene extends Phaser.Scene {
  private params!: RiotTableSceneData;
  private sc!: RiotScenario | LessonScenario;
  private g!: RiotGame;
  private state!: RiotState;
  /** Which side is yours, and the computer's. */
  private you: Side = 'guard';
  private phase: 'riot' | 'lesson' | 'now' = 'riot';
  private goal = 0;
  private said = new Set<string>();
  private orders: Order[] = [];
  /** The other side's orders this turn (decided at the start of it; shown, except in "Now."). */
  private theirs: Order[] = [];
  private cursor!: RiotPlace;
  private aiming: { squad: RiotSquad; dests: RiotPlace[] } | null = null;
  private cutting = false;
  private busy = true;
  private closedAt = 0;
  /** Your father has the table (the riot, after dawn). */
  private fatherPlaying = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private life!: Phaser.GameObjects.Graphics;
  private numbers: PixelText[] = [];
  /** A little note in the corner: dawn, or the lesson's goal. */
  private chip!: PixelText;
  /**
   * The card (designer: big text boxes are annoying): the place, whose, how strong, only when the mouse rests
   * on it a moment; choosing where to send a squad, just the sum, small, by the place.
   */
  private card!: PixelText;
  private hover: { place: RiotPlace; since: number } | null = null;
  private cardBack!: Phaser.GameObjects.Graphics;
  private endButton!: PixelText;
  private powerButton!: PixelText;
  private dialogue!: DialogueBox;
  private music!: TableMusic;
  private t = 0;
  private embers: { x: number; y: number; life: number; smoke: boolean }[] = [];

  constructor() {
    super('RiotTable');
  }

  init(data: RiotTableSceneData): void {
    this.params = data;
    const sc = RIOTS[data.scenario];
    if (!sc) throw new Error(`RiotTableScene: no game called "${data.scenario}"`);
    this.sc = sc;
    this.you = sc.kind === 'lesson' ? 'rising' : 'guard';
    this.phase = sc.kind === 'lesson' ? (data.phase ?? 'lesson') : 'riot';
    this.g = new RiotGame(sc.board, { ...RIOT_RULES, ...(sc.kind === 'riot' ? sc.rules : {}) });
    this.state = this.g.start(this.phase === 'now' ? (sc as LessonScenario).now.squads : sc.squads);
    this.goal = 0;
    this.said = new Set();
    this.orders = [];
    this.theirs = [];
    this.aiming = null;
    this.cutting = false;
    this.busy = true;
    this.fatherPlaying = false;
    this.numbers = [];
    this.embers = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const key = `riot-table-${this.sc.district}`;
    makePaintedTexture(this, key, W, H, districtPainter(this.sc.board, this.sc.district));
    this.add.image(0, 0, key).setOrigin(0);
    this.life = this.add.graphics().setDepth(2);
    this.gfx = this.add.graphics().setDepth(3);
    // Hardly any words on the table (designer: too cluttered): a note in the corner, and a card by the cursor.
    this.chip = new PixelText(this, 6, 5, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(7);
    this.cardBack = this.add.graphics().setDepth(7);
    this.card = new PixelText(this, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, wrapWidth: 150 }).setDepth(8);
    this.endButton = new PixelText(this, END.x + 4, END.y + 2, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8);
    this.powerButton = new PixelText(this, POWER.x + 4, POWER.y + 2, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8);
    this.cursor = this.place(this.g.mine(this.state, this.you)[0]!.place);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, this.phase === 'lesson' ? 'lesson' : 'now');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.stop());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointer(p, false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.time.addEvent({ delay: 400, loop: true, callback: () => this.draw() });
    this.time.addEvent({ delay: 120, loop: true, callback: () => ((this.t += 1), this.drawLife()) });
    this.cameras.main.fadeIn(600);
    this.draw();
    const sc = this.sc;
    this.time.delayedCall(600, () => {
      if (sc.kind === 'riot') this.talk(sc.knots.intro, () => this.startTurn());
      else if (this.phase === 'now') this.talk(sc.knots.good, () => this.turnItOn());
      else this.talk(sc.knots.intro, () => this.talk(sc.goals[0]!.start, () => this.startTurn()));
    });
  }

  private place = (id: string): RiotPlace => this.sc.board.places.find((p) => p.id === id)!;
  private lesson = (): LessonScenario | null => (this.sc.kind === 'lesson' ? this.sc : null);

  /** The computer's guard: your father, steady in the lesson, meaning it in "Now." and when he takes over. */
  private guardPlayer(): GuardPlayer {
    return this.phase === 'lesson' ? steady() : careful();
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.aiming = null;
    this.cutting = false;
    if (this.you === 'guard' && !this.fatherPlaying) {
      this.theirs = this.g.risingOrders(this.state);
    } else {
      // The guard's turn, decided now: its power cut happens at once (you see it), its moves are shown (in the lesson).
      const turn = this.guardPlayer()(this.g, this.state);
      if (turn.cut) {
        this.state = this.g.cutPower(this.state, turn.cut);
        playSound(this, 'boom', 0.6);
        this.cameras.main.shake(200, 0.004);
      }
      this.theirs = turn.orders;
      if (this.fatherPlaying) {
        // (He's the guard; the rising answers.)
        this.orders = turn.orders;
        this.theirs = this.g.risingOrders(this.state);
        this.busy = true;
        this.draw();
        this.time.delayedCall(350, () => void this.endTurn());
        return;
      }
      if (turn.cut && this.phase === 'now' && !this.said.has('cut')) {
        this.said.add('cut');
        this.busy = true;
        this.draw();
        this.talk(this.lesson()!.now.knots.cut, () => ((this.busy = false), this.draw()));
        return;
      }
    }
    this.busy = false;
    this.draw();
  }

  /** Your orders go, then the other side's; then the square grows and the guard arrive. */
  private async endTurn(): Promise<void> {
    if (this.busy && !this.fatherPlaying) return;
    this.busy = true;
    this.aiming = null;
    this.cutting = false;
    this.draw();
    const before = this.state;
    const mine = this.g.together(before, this.orders);
    const yours = new Set(this.g.mine(before, this.you).map((q) => q.id));
    const events: RiotEvent[] = [];
    let s = before;
    // Your side first, then theirs (as the rules say), each order shown as it goes.
    for (const o of [...mine, ...this.g.together(before, this.theirs)]) {
      const r = this.g.order(s, o);
      if (!r.events.length) continue;
      await this.show(s, o, r.events);
      s = r.state;
      this.state = s;
      events.push(...r.events);
      this.draw();
      if (this.g.outcome(s) === 'guard') break;
      // The lesson's last goal, taken: you go down yourself for the last of it.
      if (this.lastGoalTaken()) return this.goDownLesson();
    }
    // Into the square: the guard have it.
    if (this.g.outcome(s) === 'guard') return this.squareTaken();
    // The square grows; the guard come down the lifts.
    const end = this.g.turn(s, [], []);
    for (const e of end.events) {
      if (e.type === 'grow') this.pop(this.place(e.at), '+1', AMBER);
      if (e.type === 'arrive') this.pop(this.place(e.at), `+${this.g.rules.reinforce}`, CYAN);
      if (e.type === 'pour') this.pop(this.place(e.to), `${this.g.style.pour} out`, AMBER);
    }
    this.state = end.state;
    this.draw();
    await this.wait(this.fatherPlaying ? 250 : 500);
    if (this.fatherPlaying) return this.startTurn();
    // Dawn.
    if (this.g.outcome(this.state) === 'rising') return this.dawn();
    if (this.phase === 'now' && this.state.turn > this.lesson()!.now.turns) return this.switchOff();
    if (this.phase === 'lesson') return this.afterLessonTurn(events, end.events, yours);
    this.startTurn();
  }

  /** One order shown: the light slides along the street; a fight flashes. */
  private async show(s: RiotState, o: Order, events: RiotEvent[]): Promise<void> {
    const q = s.squads.find((x) => x.id === o.squad)!;
    const from = this.place(q.place);
    const to = this.place(o.to);
    const dot = this.add.circle(from.x, from.y, 6, COLOUR[q.side]).setDepth(6);
    await this.tween(dot, { x: to.x, y: to.y, duration: this.fatherPlaying ? 160 : 260, ease: 'Sine.easeInOut' });
    dot.destroy();
    const fight = events.find((e) => e.type === 'fight');
    if (fight && fight.type === 'fight') {
      playSound(this, 'crash', 0.6);
      this.cameras.main.shake(150, 0.004);
      const flash = this.add.circle(to.x, to.y, 10, SHADES.white).setDepth(6);
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 260, onComplete: () => flash.destroy() });
      const loser = fight.won ? this.g.other(fight.side) : fight.side;
      // What each side lost, floating up.
      const defender = s.squads.find((x) => x.place === o.to)!;
      if (fight.won) {
        this.pop(to, `-${fight.defence}`, COLOUR[fight.side], -10);
        this.pop(to, `all ${defender.strength}`, COLOUR[defender.side], 10);
      } else {
        this.pop(to, `all ${q.strength}`, COLOUR[fight.side], -10);
        this.pop(to, `-${Math.min(fight.attack, defender.strength - 1)}`, COLOUR[defender.side], 10);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const d = this.add.rectangle(to.x, to.y, 2, 2, COLOUR[loser]).setDepth(6);
        this.tweens.add({ targets: d, x: to.x + Math.cos(a) * 16, y: to.y + Math.sin(a) * 11, alpha: 0, duration: 420, onComplete: () => d.destroy() });
      }
    } else playSound(this, 'tick', 0.5);
    await this.wait(80);
  }

  /** Words floating up off a place: the square growing, the guard arriving. */
  private pop(p: RiotPlace, text: string, colour: number, dx = 9): void {
    const t = new PixelText(this, 0, p.y - 14, text, { color: colour, shadow: SHADES.shadow }).setDepth(9);
    t.setX(Math.round(p.x + dx - (dx < 0 ? t.width : 0)));
    this.tweens.add({ targets: t, y: p.y - 28, alpha: 0, duration: 1600, delay: 300, onComplete: () => t.destroy() });
  }

  // --- The lesson ---

  private afterLessonTurn(events: RiotEvent[], end: RiotEvent[], yours: Set<string>): void {
    const sc = this.lesson()!;
    const lines: string[] = [];
    const once = (key: keyof LessonScenario['firsts'], when: boolean) => {
      if (when && !this.said.has(key)) (this.said.add(key), lines.push(sc.firsts[key]));
    };
    const mineFight = events.filter((e) => e.type === 'fight' && e.side === this.you) as Extract<RiotEvent, { type: 'fight' }>[];
    once('idle', this.orders.length === 0);
    once('tie', mineFight.some((f) => !f.won && f.attack === f.defence));
    once('lost', mineFight.some((f) => !f.won && f.attack < f.defence));
    once('join', events.some((e) => e.type === 'join' && yours.has(e.squad)));
    once('grow', end.some((e) => e.type === 'grow'));
    once('pour', end.some((e) => e.type === 'pour'));
    once('arrive', end.some((e) => e.type === 'arrive'));
    // Goals taken: his word on each, then the next you don't already hold.
    const goal = sc.goals[this.goal]!;
    if (this.state.owner[goal.place] === this.you) {
      if (goal.done) lines.push(goal.done);
      this.goal++;
      while (sc.goals[this.goal] && this.state.owner[sc.goals[this.goal]!.place] === this.you) this.goal++;
      const next = sc.goals[this.goal];
      if (next) lines.push(next.start);
    }
    if (this.state.turn > sc.lessonTurns) return this.say(lines, () => this.turnItOn());
    this.say(lines, () => this.startTurn());
  }

  private lastGoalTaken(): boolean {
    const sc = this.lesson();
    return !!sc && this.phase === 'lesson' && this.goal === sc.goals.length - 1 && this.state.owner[sc.goals[this.goal]!.place] === this.you;
  }

  /** The last goal: taking it, you go down yourself (the fight), and come back to "Now.". */
  private goDownLesson(): void {
    const sc = this.lesson()!;
    this.busy = true;
    this.talk(sc.dropIn.knot, () => {
      const data: CombatSceneData = {
        encounter: sc.dropIn.encounter,
        back: this.params.back,
        returnTo: { scene: 'RiotTable', data: { scenario: sc.id, back: this.params.back, phase: 'now' } satisfies RiotTableSceneData },
      };
      this.leave(() => this.scene.start('Combat', data));
    });
  }

  /** He means it now: the table set up again, no arrows, and he plays to win. */
  private turnItOn(): void {
    const sc = this.lesson()!;
    this.busy = true;
    this.talk(sc.now.knots.now, () => {
      this.phase = 'now';
      this.cameras.main.flash(300, 255, 255, 255);
      this.music.mood('now');
      this.state = this.g.start(sc.now.squads);
      this.cursor = this.place(this.g.heart);
      this.startTurn();
    });
  }

  private switchOff(): void {
    const sc = this.lesson()!;
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('sim_turns', Math.min(this.state.turn, sc.now.turns));
    story.setVariable('sim_taken', this.g.outcome(this.state) === 'guard');
    this.talk(sc.now.knots.end, () => this.leave(() => this.scene.start('Area', { ...this.params.back, script: sc.knots.after } satisfies AreaSceneData)));
  }

  // --- The end of the riot ---

  /** The guard have the square: the lesson's "Now." over, or the riot taken (you go down yourself). */
  private squareTaken(): void {
    this.draw();
    const sc = this.sc;
    if (sc.kind === 'lesson') return this.switchOff();
    this.busy = true;
    const { story } = getSession(this);
    if (!this.fatherPlaying) story.setVariable('riot_table', 'won');
    story.setVariable('riot_turns', this.state.turn);
    // Your father comes in, win or lose (designer), with news: some of them have broken through. You go down
    // to stop them (the fight, your hand beside you), and then to the square.
    this.talk(this.fatherPlaying ? sc.knots.fatherTook : sc.knots.won, () => {
      const data: CombatSceneData = { encounter: sc.square, back: { ...sc.squareArea, script: sc.knots.square } };
      this.leave(() => this.scene.start('Combat', data));
    });
  }

  /** Dawn, and the square's still theirs: your father comes in, and takes the table from you (designer). */
  private dawn(): void {
    const sc = this.sc as RiotScenario;
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('riot_table', 'lost');
    story.setVariable('riot_turns', this.state.turn);
    this.talk(sc.knots.dawn, () => {
      // He plays it from where it is; the night's no longer a limit.
      this.g = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules, dawn: this.state.turn + 40 });
      this.fatherPlaying = true;
      this.startTurn();
    });
  }

  // --- Input ---

  private ready(): boolean {
    return !this.busy && !this.fatherPlaying && !this.dialogue.isOpen && this.time.now - this.closedAt > 200;
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat || !this.ready()) return;
    const dir = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[e.key] as [number, number] | undefined;
    if (dir) {
      const pool = this.aiming ? this.aiming.dests : this.cutting ? this.cutTargets() : null;
      if (pool) {
        const i = pool.indexOf(this.cursor);
        this.cursor = pool[(i + (dir[0] + dir[1] > 0 ? 1 : pool.length - 1)) % pool.length]!;
      } else {
        const next = nearestIn(this.sc.board.places, this.cursor, dir[0], dir[1]);
        if (!next) return;
        this.cursor = next;
      }
      playMove(this);
      this.draw();
      return;
    }
    if (e.key === 'e' || e.key === 'E') return this.choose(this.cursor);
    if (e.key === 'Escape') return this.back();
    if ((e.key === 'p' || e.key === 'P') && this.you === 'guard') return this.startCut();
    if (e.key === 'Tab') {
      e.preventDefault();
      return this.nextSquad();
    }
    if (e.key === 'Enter' && !this.aiming && !this.cutting) void this.endTurn();
  }

  private onPointer(p: Phaser.Input.Pointer, down: boolean): void {
    if (!this.ready()) return;
    if (down && p.rightButtonDown()) return this.back();
    const inside = (b: typeof END) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
    if (down && inside(END)) return void (!this.aiming && !this.cutting && this.endTurn());
    if (down && inside(POWER) && this.you === 'guard') return this.startCut();
    const pool = this.aiming ? this.aiming.dests : this.cutting ? this.cutTargets() : this.sc.board.places;
    const near = pool.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 13);
    const over = this.sc.board.places.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 13) ?? null;
    if (over !== this.hover?.place) this.hover = over ? { place: over, since: this.time.now } : null;
    if (near && near !== this.cursor) (this.cursor = near), this.draw();
    if (down) {
      if (near) this.choose(near);
      else this.back();
    }
  }

  /** E or a click: pick up a squad of yours, send the one you've picked there, or cut the power there. */
  private choose(place: RiotPlace): void {
    if (this.cutting) {
      if (!this.cutTargets().includes(place)) return;
      this.state = this.g.cutPower(this.state, place.id);
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
      const squad = this.g.squadAt(this.state, place.id);
      if (squad?.side !== this.you || !this.g.dests(this.state, squad).length) return;
      const round = this.g.dests(this.state, squad).map((id) => this.place(id));
      const angle = (q: RiotPlace) => (Math.atan2(q.x - place.x, -(q.y - place.y)) + 2 * Math.PI) % (2 * Math.PI);
      round.sort((a, b) => angle(a) - angle(b));
      this.aiming = { squad, dests: [place, ...round] };
      const going = this.orders.find((o) => o.squad === squad.id);
      this.cursor = going ? this.place(going.to) : round[0] ?? place;
      playMove(this);
    }
    this.draw();
  }

  private back(): void {
    if (this.cutting) this.cutting = false;
    else if (this.aiming) {
      this.cursor = this.place(this.aiming.squad.place);
      this.aiming = null;
    }
    this.draw();
  }

  private cutTargets(): RiotPlace[] {
    return this.sc.board.places.filter((p) => this.g.squadAt(this.state, p.id)?.side === 'rising');
  }

  private startCut(): void {
    if (this.aiming || !this.g.canCut(this.state)) return;
    this.cutting = !this.cutting;
    if (this.cutting) this.cursor = this.cutTargets().find((p) => p.heart) ?? this.cutTargets()[0] ?? this.cursor;
    playMove(this);
    this.draw();
  }

  private nextSquad(): void {
    this.aiming = null;
    const mine = this.g.mine(this.state, this.you).filter((q) => this.g.dests(this.state, q).length);
    if (!mine.length) return;
    const waiting = mine.filter((q) => !this.orders.some((o) => o.squad === q.id));
    const pool = waiting.length ? waiting : mine;
    const i = pool.findIndex((q) => q.place === this.cursor.id);
    this.cursor = this.place(pool[(i + 1) % pool.length]!.place);
    playMove(this);
    this.draw();
  }

  // --- Drawing ---

  private draw(): void {
    const g = this.gfx.clear();
    for (const n of this.numbers) n.destroy();
    this.numbers = [];
    const s = this.state;
    const blink = this.time.now % 800 < 400;
    // The streets.
    for (const [a, b] of this.sc.board.ways) {
      const pa = this.place(a);
      const pb = this.place(b);
      g.lineStyle(3, SHADES.shadow, 0.5).lineBetween(pa.x, pa.y, pb.x, pb.y);
      g.lineStyle(1, SHADES.cyanMid, 0.8).lineBetween(pa.x, pa.y, pb.x, pb.y);
    }
    // The places: a ring in the colour of whoever holds it; the square's barricades; the lifts' foot.
    const sc = this.sc;
    const goalPlace = sc.kind === 'lesson' && this.phase === 'lesson' ? sc.goals[this.goal]?.place : this.phase === 'riot' || this.phase === 'now' ? this.g.heart : undefined;
    for (const p of sc.board.places) {
      const owner = s.owner[p.id];
      g.lineStyle(1, owner ? COLOUR[owner] : SHADES.dim, owner ? 0.9 : 0.6).strokeCircle(p.x, p.y, 10);
      if (p.heart) for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        g.fillStyle(a % 2 ? SHADES.woodLight : SHADES.dim, 1).fillRect(Math.round(p.x + Math.cos(ang) * 14) - 1, Math.round(p.y + Math.sin(ang) * 11) - 1, 3, 2);
      }
      if (p.lifts) g.lineStyle(1, CYAN, 0.8).strokeRect(p.x - 13, p.y - 13, 27, 27);
      if (s.cut === p.id) {
        g.fillStyle(SHADES.shadow, 0.7).fillCircle(p.x, p.y, 13);
        g.lineStyle(1, SHADES.dim, 1).strokeCircle(p.x, p.y, 13);
      }
      if (p.id === goalPlace && !this.busy) g.lineStyle(1, SHADES.white, blink ? 1 : 0.35).strokeCircle(p.x, p.y, 17);
    }
    // Orders: the other side's (if shown) in their colour; yours in yours; the one you're choosing, blinking.
    if (this.phase !== 'now' || this.fatherPlaying) for (const o of this.theirs) this.arrow(g, o, COLOUR[this.g.other(this.you)], true);
    // Where the square will send a crowd out, at the end of the turn.
    const pour = this.g.pourTo(s);
    if (pour) {
      const sq = this.g.squadAt(s, this.g.heart);
      if (sq) this.arrow(g, { squad: sq.id, to: pour }, AMBER, true);
    }
    for (const o of this.orders) if (o.squad !== this.aiming?.squad.id) this.arrow(g, o, COLOUR[this.you], false);
    if (this.aiming && this.cursor.id !== this.aiming.squad.place) this.arrow(g, { squad: this.aiming.squad.id, to: this.cursor.id }, blink ? COLOUR[this.you] : SHADES.white, false);
    // The squads: the guard a blue shield, the rising an amber circle; the number on each.
    for (const q of s.squads) {
      const p = this.place(q.place);
      const col = COLOUR[q.side];
      const dark = s.cut === q.place;
      if (q.side === 'guard') {
        g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
        g.fillStyle(dark ? SHADES.cyanDeep : col, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 13, 2);
        g.fillTriangle(p.x - 7, p.y + 5, p.x + 8, p.y + 5, p.x + 0.5, p.y + 9);
      } else {
        g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, 8);
        g.fillStyle(dark ? SHADES.amberDeep : col, 1).fillCircle(p.x, p.y, 7);
      }
      if (this.aiming?.squad.id === q.id) g.lineStyle(1, SHADES.white, 1).strokeCircle(p.x, p.y, 11);
      const n = new PixelText(this, 0, p.y - 4, String(q.strength), { color: SHADES.shadow }).setDepth(5);
      n.setX(Math.round(p.x - n.width / 2 + 1));
      this.numbers.push(n);
    }
    // Where the one you've picked can go; or where you can cut the power.
    if (this.aiming) for (const p of this.aiming.dests.slice(1)) g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 13);
    if (this.cutting) for (const p of this.cutTargets()) g.lineStyle(1, SHADES.white, blink ? 1 : 0.4).strokeCircle(p.x, p.y, 13);
    if (!this.busy && blink) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 14, this.cursor.y - 14, 29, 29);
    // The buttons.
    const idle = !this.busy && !this.aiming && !this.cutting;
    g.fillStyle(idle ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(END.x, END.y, END.w, END.h);
    g.lineStyle(1, idle ? CYAN : SHADES.dim, 1).strokeRect(END.x, END.y, END.w, END.h);
    this.endButton.setColor(idle ? SHADES.white : SHADES.dim);
    const canCut = this.you === 'guard' && this.g.canCut(s) && !this.busy;
    if (this.you === 'guard') {
      g.fillStyle(this.cutting ? SHADES.amberDeep : canCut ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(POWER.x, POWER.y, POWER.w, POWER.h);
      g.lineStyle(1, canCut ? CYAN : SHADES.dim, 1).strokeRect(POWER.x, POWER.y, POWER.w, POWER.h);
      this.powerButton.setText(s.cut ? 'Power cut' : this.g.canCut(s) ? 'Cut power' : `Power: ${this.g.cutIn(s)}`).setColor(canCut ? SHADES.white : SHADES.dim);
    } else this.powerButton.setText('');
    // The words: the note in the corner, and the card by the cursor.
    this.chip.setText(this.chipText());
    this.drawCard();
    this.drawLife();
  }

  private chipText(): string {
    const sc = this.sc;
    if (this.fatherPlaying) return 'Your father has the table.';
    if (sc.kind === 'lesson') return this.phase === 'lesson' ? `Take ${lower(this.place(sc.goals[this.goal]?.place ?? this.g.heart).name)}.` : 'Hold the square.';
    const left = this.g.rules.dawn - this.state.turn + 1;
    return `Dawn in ${left} ${left === 1 ? 'turn' : 'turns'}.`;
  }

  /** The card: choosing, the sum by the place; otherwise what's there, once the mouse has rested on it. */
  private drawCard(): void {
    const choosing = this.aiming || this.cutting;
    const rested = this.hover && this.time.now - this.hover.since > 600 ? this.hover.place : null;
    const p = choosing ? this.cursor : rested;
    const text = this.busy || !p ? '' : choosing ? this.sumText() : this.placeText(p);
    this.card.setText(text);
    this.cardBack.clear();
    if (!text || !p) return;
    const [w, h] = [this.card.width + 8, this.card.height + 6];
    const x = p.x + 18 + w < W - 4 ? p.x + 18 : p.x - 18 - w;
    const y = Math.max(4, Math.min(H - h - 20, p.y - 10));
    this.cardBack.fillStyle(SHADES.shadow, 0.92).fillRect(x, y, w, h);
    this.cardBack.lineStyle(1, SHADES.cyanDeep, 1).strokeRect(x, y, w, h);
    this.card.setPosition(Math.round(x + 4), Math.round(y + 3));
  }

  /** Choosing: what would happen there, in a line. */
  private sumText(): string {
    const s = this.state;
    const p = this.cursor;
    const there = this.g.squadAt(s, p.id);
    if (this.cutting) return 'Cut the power here';
    const aim = this.aiming!.squad;
    if (p.id === aim.place) return 'Hold';
    if (!there) return 'Take it';
    if (there.side === aim.side) return `Join: ${aim.strength + there.strength}`;
    const a = this.g.attack(aim.place, p.id, aim.strength);
    const d = this.g.defence(s, p.id, there.strength);
    return a > d ? `${a} v ${d}: you take it, ${a - d} left` : a === d ? `${a} v ${d}: a tie, they hold` : `${a} v ${d}: they hold`;
  }

  /** What's at a place: its name, whose, how strong, and anything special about it. */
  private placeText(p: RiotPlace): string {
    const s = this.state;
    const there = this.g.squadAt(s, p.id);
    const whose = (side: Side) => (side === this.you ? (side === 'guard' ? 'Your guard' : 'Your people') : side === 'guard' ? 'The guard' : 'The rising');
    const lines = [p.name];
    if (there) lines.push(`${whose(there.side)}, ${there.strength}`);
    if (p.heart) lines.push(`Barricades +1. Grows 1 a turn; over ${this.g.style.pourAbove}, sends crowds out.`);
    if (p.lifts) lines.push(`The guard get +${this.g.rules.reinforce} here each turn.`);
    if (s.cut === p.id) lines.push('No power this turn.');
    return lines.join('\n');
  }

  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number, dashed: boolean): void {
    const q = this.state.squads.find((x) => x.id === o.squad);
    if (!q || q.place === o.to) return;
    const a = this.place(q.place);
    const b = this.place(o.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
    const [sx, sy] = [a.x + ux * 10, a.y + uy * 10];
    const [ex, ey] = [b.x - ux * 12, b.y - uy * 12];
    g.lineStyle(3, SHADES.shadow, 0.8).lineBetween(sx, sy, ex, ey);
    if (dashed) {
      const n = Math.floor(Math.hypot(ex - sx, ey - sy) / 4);
      for (let i = 0; i < n; i += 2) g.lineStyle(1, col, 1).lineBetween(sx + (ex - sx) * (i / n), sy + (ey - sy) * (i / n), sx + (ex - sx) * ((i + 1) / n), sy + (ey - sy) * ((i + 1) / n));
    } else g.lineStyle(1, col, 1).lineBetween(sx, sy, ex, ey);
    g.fillStyle(col, 1).fillTriangle(ex + ux * 4, ey + uy * 4, ex - uy * 3 - ux * 2, ey + ux * 3 - uy * 2, ex + uy * 3 - ux * 2, ey - ux * 3 - uy * 2);
  }

  /** The riot, alive (designer: make it look like one): fire and a crowd round every squad of the rising, smoke going up. */
  private drawLife(): void {
    const g = this.life.clear();
    for (const q of this.state.squads) {
      if (q.side !== 'rising') continue;
      const p = this.place(q.place);
      const seed = p.x * 13 + p.y * 7;
      // A crowd round it: a few for a small squad, more for a big one.
      const n = Math.min(14, 3 + q.strength);
      for (let i = 0; i < n; i++) {
        const a = i * 2.4 + seed;
        const r = 10 + (i % 3) * 2;
        const jig = (this.t + i * 5) % 6 < 3 ? 1 : 0;
        const x = Math.round(p.x + Math.cos(a) * r + (i % 2 ? jig : -jig));
        const y = Math.round(p.y + Math.sin(a) * r * 0.6 + 3);
        g.fillStyle(i % 2 ? SHADES.amberDeep : SHADES.woodLight, 1).fillRect(x, y, 1, 2);
        g.fillStyle(SHADES.skinTan, 1).fillRect(x, y - 1, 1, 1);
      }
      // Fire behind it.
      for (let i = 0; i < 4; i++) {
        const fx = p.x - 9 + ((i * 6 + seed) % 19);
        const h = 2 + ((this.t + i * 3 + seed) % 3);
        for (let k = 0; k < h; k++) g.fillStyle(k < 1 ? SHADES.white : AMBER, 1).fillRect(fx, p.y - 9 - k, 1, 1);
      }
      if (this.t % 3 === 0) this.embers.push({ x: p.x - 3 + ((this.t * 7 + seed) % 7), y: p.y - 12, life: 16, smoke: this.t % 6 === 0 });
    }
    for (const e of this.embers) {
      e.y -= 0.7;
      e.x += Math.sin((e.y + this.t) / 4) * 0.3;
      e.life--;
      g.fillStyle(e.smoke ? SHADES.dim : e.life > 9 ? AMBER : SHADES.amberDeep, e.smoke ? 0.5 : 1).fillRect(Math.round(e.x), Math.round(e.y), e.smoke ? 2 : 1, e.smoke ? 2 : 1);
    }
    this.embers = this.embers.filter((e) => e.life > 0).slice(-120);
  }

  // --- Helpers ---

  private say(knots: string[], then: () => void): void {
    const [first, ...rest] = knots;
    if (!first) return then();
    this.talk(first, () => this.say(rest, then));
  }

  private talk(knot: string, then: () => void): void {
    this.busy = true;
    this.draw();
    this.dialogue.open(knot, () => {
      this.closedAt = this.time.now;
      then();
    });
  }

  private leave(then: () => void): void {
    this.music.stop();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, then);
  }

  private tween(target: object, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ targets: target, ...config, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}

const lower = (name: string) => name.replace(/^The /, 'the ');

/** The nearest place in a direction (within about 45°, straighter then closer). */
function nearestIn(places: readonly RiotPlace[], from: RiotPlace, dx: number, dy: number): RiotPlace | null {
  let best: RiotPlace | null = null;
  let bestScore = Infinity;
  for (const p of places) {
    if (p === from) continue;
    const vx = p.x - from.x;
    const vy = p.y - from.y;
    const dist = Math.hypot(vx, vy);
    const cos = (vx * dx + vy * dy) / dist;
    if (cos < 0.7) continue;
    const score = dist * (1 + 4 * (1 - cos));
    if (score < bestScore) (bestScore = score), (best = p);
  }
  return best;
}

/**
 * The table: the district as a street plan from above, in light: its streets lit, the blocks between them
 * dark with a few lit windows. The low district warm and crowded (small blocks); the promenade's glass in
 * long, clean ones. In the table's cyan.
 */
function districtPainter(board: RiotBoard, district: 'low' | 'promenade'): (x: number, y: number) => PixelColour {
  const pos = new Map(board.places.map((p) => [p.id, p]));
  const segs = board.ways.map(([a, b]) => [pos.get(a)!, pos.get(b)!] as const);
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
    for (const p of board.places) d = Math.min(d, Math.hypot(x - p.x, y - p.y) - 8);
    let lum: number;
    if (d < 3) lum = 0.3;
    else if (d < 5) lum = 0.45;
    else {
      const gx = x % lot;
      const gy = y % lot;
      const gap = gx === 0 || gy === 0;
      const h = ((Math.floor(x / lot) * 73856093) ^ (Math.floor(y / lot) * 19349663)) >>> 0;
      lum = gap ? 0.05 : 0.13 + (h % 7) * 0.015;
      if (!gap && gx % 3 === 1 && gy % 4 === 2 && ((h >> 3) + gx * 7 + gy) % 11 === 0) lum = 0.6;
    }
    if (y % 3 === 0) lum *= 0.8;
    const edge = Math.min(x, W - x, y, H - y) / 40;
    lum *= Math.min(1, 0.4 + edge) * 0.75;
    const t = Math.min(2.999, lum * 4);
    const i = Math.floor(t);
    const k = t - i;
    const a = steps[i]!;
    const b = steps[i + 1]!;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
}
