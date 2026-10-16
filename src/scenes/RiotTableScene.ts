import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { RIOTS, type DuelScenario, type LessonScenario, type RiotScenario } from '../data/warTable';
import { getSession } from '../session';
import { RIOT_RULES, RISING_STYLE, RiotGame, type Order, type RiotBoard, type RiotEvent, type RiotPlace, type RiotSquad, type RiotState, type Side } from '../systems/Riot';
import { careful, sensible, steady, type GuardPlayer } from '../systems/RiotPlayers';
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
//   Day 6, the duel (`duel`): the old castle's siege, with your friend, for fun. You hold the keep (the rising's
//   side of the rules), he has the bigger army (the guard's), played sensibly, his moves shown; hold it till
//   dawn and you've won. Either way, back in the room after.
//
// The table shows a riot (designer): the district's streets in light; the rising's squads amber circles, with
// fire and a crowd round them; the guard's blue shields; a key at the top says who's who, and which is you.
// Controls (the old table's): pick a squad of yours (E or click), the arrows step round where it can go, E or
// click to send it (its own place to hold); Esc or right-click backs out; Tab to the next squad; Enter (or the
// button) ends the turn. Undo (or U) takes back your last order, one at a time (designer). Buttons under the
// circles (Jack: easier to play): with a squad picked up, Fortify (or F) digs it in for the turn and puts it
// down, so you can pick up the next (once every 3 turns, like the power cut); Unfortify sits under every
// squad that's dug in. As the guard, click one
// of theirs for Cut power under it (every 3 turns; P still works from the keyboard). A rumble on the map flares; set off, the screen shakes and "Rumble!" (Jack).

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
const UNDO = { x: W - 122, y: H - 15, w: 46, h: 11 };
/** Cut power, in the corner too (designer: it wasn't obvious it could be done): then choose where. */
const POWER = { x: W - 192, y: H - 15, w: 66, h: 11 };
const COLOUR: Record<Side, number> = { guard: CYAN, rising: AMBER };

export class RiotTableScene extends Phaser.Scene {
  private params!: RiotTableSceneData;
  private sc!: RiotScenario | LessonScenario | DuelScenario;
  private g!: RiotGame;
  private state!: RiotState;
  /** Which side is yours, and the computer's. */
  private you: Side = 'guard';
  private phase: 'riot' | 'lesson' | 'now' | 'duel' = 'riot';
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
  private undoButton!: PixelText;
  private powerButton!: PixelText;
  /** One of theirs you've clicked: Cut power, under it (Jack). */
  private eyeing: RiotPlace | null = null;
  /** How wide each button's words are (measured once). */
  private labelWidths = new Map<string, number>();
  /** This turn's changes, to undo one at a time (designer): the orders and the state before each. */
  private history: { orders: Order[]; state: RiotState }[] = [];
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
    this.you = sc.kind === 'riot' ? 'guard' : 'rising';
    this.phase = sc.kind === 'lesson' ? (data.phase ?? 'lesson') : sc.kind === 'duel' ? 'duel' : 'riot';
    this.g = new RiotGame(sc.board, { ...RIOT_RULES, ...sc.rules });
    if (sc.kind === 'duel') this.g.style = { ...RISING_STYLE, ...sc.style };
    this.state = this.g.start(this.phase === 'now' ? (sc as LessonScenario).now.squads : sc.squads, Math.floor(Math.random() * 2 ** 31));
    this.goal = 0;
    this.said = new Set();
    this.orders = [];
    this.theirs = [];
    this.aiming = null;
    this.cutting = false;
    this.eyeing = null;
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
    // Place names, small and dim under each place (designer: the map needs them), so they're there to read
    // without shouting.
    for (const p of this.sc.board.places) {
      const label = new PixelText(this, 0, p.y + 11, lower(p.name), { color: SHADES.dim, shadow: SHADES.shadow }).setDepth(4);
      label.setX(Math.max(2, Math.min(W - label.width - 2, Math.round(p.x - label.width / 2))));
    }
    // Hardly any words on the table (designer: too cluttered): a note in the corner, and a card by the cursor.
    this.chip = new PixelText(this, 6, 5, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(7);
    this.cardBack = this.add.graphics().setDepth(7);
    this.card = new PixelText(this, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, wrapWidth: 150 }).setDepth(8);
    this.endButton = new PixelText(this, END.x + 4, END.y + 2, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8);
    this.undoButton = new PixelText(this, UNDO.x + 4, UNDO.y + 2, 'Undo', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8);
    this.powerButton = new PixelText(this, POWER.x + 4, POWER.y + 2, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8);
    this.cursor = this.place(this.g.mine(this.state, this.you)[0]!.place);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, this.phase === 'lesson' || this.phase === 'duel' ? 'lesson' : 'now');
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
      if (sc.kind === 'riot' || sc.kind === 'duel') this.talk(sc.knots.intro, () => this.startTurn());
      else if (this.phase === 'now') this.talk(sc.knots.good, () => this.turnItOn());
      else this.talk(sc.knots.intro, () => this.talk(sc.goals[0]!.start, () => this.startTurn()));
    });
  }

  private place = (id: string): RiotPlace => this.sc.board.places.find((p) => p.id === id)!;
  private lesson = (): LessonScenario | null => (this.sc.kind === 'lesson' ? this.sc : null);

  /** The computer's guard: your father, steady in the lesson, meaning it in "Now." and when he takes over; your friend, sensible. */
  private guardPlayer(): GuardPlayer {
    return this.phase === 'lesson' ? steady() : this.phase === 'duel' ? sensible() : careful();
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.history = [];
    this.aiming = null;
    this.cutting = false;
    this.eyeing = null;
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
    this.eyeing = null;
    this.draw();
    const before = this.state;
    // Yours in the order you gave them (designer), so a join then a move goes together; otherwise all at once.
    const mine = this.g.rules.ordered ? this.orders : this.g.together(before, this.orders);
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
      if (e.type === 'rumbleAppears') this.rumbleAppears(this.place(e.at));
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
    if (events.some((e) => e.type === 'blocked')) {
      // Into a squad that's dug in: up to it, and turned back.
      await this.tween(dot, { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, duration: 200, ease: 'Sine.easeOut' });
      playSound(this, 'bolt', 0.6);
      this.pop(to, 'Dug in', SHADES.white);
      await this.tween(dot, { x: from.x, y: from.y, duration: 200, ease: 'Sine.easeIn' });
      dot.destroy();
      return;
    }
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
    const rumble = events.find((e) => e.type === 'rumble');
    if (rumble?.type === 'rumble') await this.rumbleGoesOff(rumble);
  }

  /** A rumble appears (Jack: hard to miss): a flash, a low rumble, a ring going out from it, and its name. */
  private rumbleAppears(at: RiotPlace): void {
    playSound(this, 'rumble', 1);
    this.cameras.main.flash(250, 242, 180, 90);
    for (const delay of [0, 350]) {
      const ring = this.add.circle(at.x, at.y, 10).setStrokeStyle(2, SHADES.amber).setDepth(6);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 900, delay, onComplete: () => ring.destroy() });
    }
    this.pop(at, 'Rumble!', AMBER);
  }

  /**
   * A rumble set off (Jack): the screen shakes, a distorted rumble, "Rumble!" across the table, and what each
   * squad round it took.
   */
  private async rumbleGoesOff(e: Extract<RiotEvent, { type: 'rumble' }>): Promise<void> {
    const at = this.place(e.at);
    playSound(this, 'quake', 1);
    this.cameras.main.shake(900, 0.018);
    const ring = this.add.circle(at.x, at.y, 8, SHADES.amber, 0.6).setDepth(6);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    const word = new PixelText(this, 0, 0, 'Rumble!', { color: SHADES.amber, shadow: SHADES.shadow, scale: 3 }).setDepth(20);
    word.setPosition(Math.round((W - word.width) / 2), Math.round(H / 2 - word.height / 2 - 20));
    this.tweens.add({ targets: word, x: word.x + 3, duration: 50, yoyo: true, repeat: 9 });
    this.tweens.add({ targets: word, alpha: 0, delay: 1100, duration: 500, onComplete: () => word.destroy() });
    for (const h of e.hits) this.pop(this.place(h.place), h.gone ? 'all' : `-${h.damage}`, COLOUR[h.side]);
    this.draw();
    await this.wait(1300);
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
    once('rumble', end.some((e) => e.type === 'rumbleAppears'));
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
    if (sc.kind === 'duel') return this.duelOver(sc, false);
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
    if (this.sc.kind === 'duel') return this.duelOver(this.sc, true);
    const sc = this.sc as RiotScenario;
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('riot_table', 'lost');
    story.setVariable('riot_turns', this.state.turn);
    // Lost (designer): play it again, or let the story go on (your father comes in and takes it).
    this.dialogue.openMenu('Dawn. The square\u2019s still theirs.', [
      { label: 'Play it again', run: () => this.leave(() => this.scene.restart({ ...this.params, phase: undefined } satisfies RiotTableSceneData)) },
      { label: 'Go on (your father comes in)', run: () => this.time.delayedCall(150, () => this.fatherIn(sc)) },
    ]);
  }

  /** The duel's over: you held the keep till dawn, or he took it (play it again, or go on). Back in the room either way. */
  private duelOver(sc: DuelScenario, won: boolean): void {
    this.busy = true;
    this.draw();
    const { story } = getSession(this);
    story.setVariable('duel6', won ? 'won' : 'lost');
    story.setVariable('duel6_turns', Math.min(this.state.turn, this.g.rules.dawn));
    const out = () => this.talk(won ? sc.knots.won : sc.knots.lost, () => this.leave(() => this.scene.start('Area', { ...this.params.back, script: sc.knots.after } satisfies AreaSceneData)));
    if (won) return out();
    this.dialogue.openMenu('He\u2019s taken the keep.', [
      { label: 'Play it again', run: () => this.leave(() => this.scene.restart({ ...this.params, phase: undefined } satisfies RiotTableSceneData)) },
      { label: 'Go on', run: () => this.time.delayedCall(150, out) },
    ]);
  }

  private fatherIn(sc: RiotScenario): void {
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
    if (e.key === 'u' || e.key === 'U') return this.undo();
    if ((e.key === 'f' || e.key === 'F') && this.aiming) return this.fortifyPicked();
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
    if (down && inside(UNDO)) return this.undo();
    if (down && inside(POWER) && this.you === 'guard' && !this.fatherPlaying) return this.startCut();
    // The buttons under the circles (a greyed one does nothing).
    if (down) for (const b of this.underButtons()) if (inside(this.buttonBox(b))) return void (b.enabled && b.run());
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
      this.history.push({ orders: [...this.orders], state: this.state });
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
      this.history.push({ orders: [...this.orders], state: this.state });
      this.orders = this.orders.filter((o) => o.squad !== squad.id);
      if (place.id !== squad.place) {
        // Sent somewhere after all: no longer dug in.
        this.state = this.g.unfortify(this.state, squad.place);
        this.orders.push({ squad: squad.id, to: place.id });
      }
      this.aiming = null;
      this.cursor = place;
      playConfirm(this);
    } else {
      const squad = this.g.squadAt(this.state, place.id);
      // One of theirs, as the guard: Cut power, under it (Jack); again, and it's put down.
      if (squad && squad.side !== this.you && this.you === 'guard') {
        this.eyeing = this.eyeing === place ? null : place;
        this.cursor = place;
        playMove(this);
        return this.draw();
      }
      this.eyeing = null;
      if (squad?.side !== this.you || !this.g.dests(this.state, squad).length) return this.draw();
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

  /** A button under a circle (Jack): Fortify, Unfortify, Cut power. */
  private underButtons(): { place: RiotPlace; label: string; enabled: boolean; hot?: boolean; run: () => void }[] {
    if (this.busy || this.fatherPlaying) return [];
    const s = this.state;
    const out: ReturnType<RiotTableScene['underButtons']> = [];
    // Fortify: not in "Now." (he's showing you how it's done).
    if (this.phase !== 'now') {
      if (this.aiming) {
        const q = this.aiming.squad;
        const dug = this.g.fortified(s, q.place);
        // Once every 3 turns, like the power cut (Jack): greyed, with the turns to wait, till then.
        const ready = this.g.canFortify(s, this.you);
        out.push({ place: this.place(q.place), label: dug ? 'Unfortify' : ready ? 'Fortify' : `Fortify in ${this.g.fortifyIn(s, this.you)}`, enabled: dug || ready, hot: dug, run: () => this.toggleFortify(q) });
      }
      for (const q of this.g.mine(s, this.you)) {
        if (q.id !== this.aiming?.squad.id && this.g.fortified(s, q.place)) out.push({ place: this.place(q.place), label: 'Unfortify', enabled: true, hot: true, run: () => this.toggleFortify(q) });
      }
    }
    // Cut power, under one of theirs you've clicked (every 3 turns, as ever).
    const e = this.eyeing;
    if (e && this.you === 'guard' && this.g.squadAt(s, e.id)?.side === this.g.other(this.you)) {
      const ok = this.g.canCut(s);
      out.push({ place: e, label: s.cut === e.id ? 'Power cut' : ok ? 'Cut power' : `Power in ${this.g.cutIn(s)}`, enabled: ok, run: () => this.cutAt(e) });
    }
    return out;
  }

  /** Where a button sits: under its circle (over it, near the bottom, clear of End turn and Undo). */
  private buttonBox(b: { place: RiotPlace; label: string }): { x: number; y: number; w: number; h: number } {
    let w = this.labelWidths.get(b.label);
    if (w === undefined) {
      const t = new PixelText(this, 0, 0, b.label, { color: SHADES.white });
      w = t.width;
      t.destroy();
      this.labelWidths.set(b.label, w);
    }
    const p = b.place;
    const below = p.y + 14;
    return { x: Math.round(Math.max(2, Math.min(W - w - 10, p.x - (w + 8) / 2))), y: Math.round(below + 11 > H - 17 ? p.y - 25 : below), w: w + 8, h: 11 };
  }

  /**
   * Fortify (Jack): dig a squad in for the turn (it doesn't move, and nothing can attack it), and put it down so
   * you can pick up the next; or Unfortify it.
   */
  private toggleFortify(q: RiotSquad): void {
    const dug = this.g.fortified(this.state, q.place);
    if (!dug && !this.g.canFortify(this.state, q.side)) return;
    this.history.push({ orders: [...this.orders], state: this.state });
    if (dug) {
      this.state = this.g.unfortify(this.state, q.place);
      playMove(this);
    } else {
      this.orders = this.orders.filter((o) => o.squad !== q.id);
      this.state = this.g.fortify(this.state, q.id);
      if (this.aiming?.squad.id === q.id) this.aiming = null;
      playSound(this, 'bolt', 0.6);
    }
    this.cursor = this.place(q.place);
    this.draw();
  }

  /** F: fortify (or unfortify) the squad you've picked up. */
  private fortifyPicked(): void {
    if (this.aiming && this.phase !== 'now' && !this.fatherPlaying) this.toggleFortify(this.aiming.squad);
  }

  /** The power cut under one of theirs (Jack: the button under it). */
  private cutAt(place: RiotPlace): void {
    if (!this.g.canCut(this.state)) return;
    this.history.push({ orders: [...this.orders], state: this.state });
    this.state = this.g.cutPower(this.state, place.id);
    this.eyeing = null;
    playSound(this, 'boom', 0.6);
    this.cameras.main.shake(160, 0.003);
    this.draw();
  }

  /** Undo: the last order (or the power cut) taken back. */
  private undo(): void {
    if (this.aiming || this.cutting) return this.back();
    const last = this.history.pop();
    if (!last) return;
    this.orders = last.orders;
    this.state = last.state;
    playMove(this);
    this.draw();
  }

  private back(): void {
    if (this.cutting) this.cutting = false;
    else if (this.aiming) {
      this.cursor = this.place(this.aiming.squad.place);
      this.aiming = null;
    } else this.eyeing = null;
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
    const goalPlace = sc.kind === 'lesson' && this.phase === 'lesson' ? sc.goals[this.goal]?.place : this.phase !== 'lesson' ? this.g.heart : undefined;
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
      // A rumble (Jack): a jagged burst, flaring, and how many turns it has left.
      if (s.rumble?.place === p.id) {
        const pts: Phaser.Math.Vector2[] = [];
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2 + this.t * 0.05;
          const r = i % 2 ? 5 : blink ? 12 : 10;
          pts.push(new Phaser.Math.Vector2(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * 0.85));
        }
        g.fillStyle(SHADES.amberDeep, 0.9).fillPoints(pts, true);
        g.lineStyle(1, SHADES.amber, 1).strokePoints(pts, true);
        g.fillStyle(SHADES.white, 1).fillCircle(p.x, p.y, 2);
        const left = new PixelText(this, Math.round(p.x + 9), Math.round(p.y + 6), String(s.rumble.left), { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(5);
        this.numbers.push(left);
      }
    }
    // Orders: the other side's (if shown) in their colour; yours in yours; the one you're choosing, blinking.
    if (this.phase !== 'now' || this.fatherPlaying) for (const o of this.theirs) this.arrow(g, o, COLOUR[this.g.other(this.you)], true, undefined, undefined, this.g.fortified(s, o.to) && this.g.squadAt(s, o.to)?.side === this.you);
    // Where the square will send a crowd out, at the end of the turn.
    const pour = this.g.pourTo(s);
    if (pour) {
      const sq = this.g.squadAt(s, this.g.heart);
      if (sq) this.arrow(g, { squad: sq.id, to: pour }, AMBER, true);
    }
    // Yours, numbered in the order they'll happen; a join (into a squad of yours, as it'll be by then) in green.
    let plan = this.state;
    this.orders.forEach((o, i) => {
      const q = plan.squads.find((x) => x.id === o.squad);
      const join = this.g.squadAt(plan, o.to)?.side === this.you;
      if (q && o.squad !== this.aiming?.squad.id) this.arrow(g, o, join ? SHADES.green : COLOUR[this.you], false, i + 1, q.place);
      plan = this.g.order(plan, o).state;
    });
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
      // Dug in (fortify): a wall of blocks round it.
      if (this.g.fortified(s, q.place)) for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        g.fillStyle(SHADES.shadow, 1).fillRect(Math.round(p.x + Math.cos(ang) * 12) - 2, Math.round(p.y + Math.sin(ang) * 12) - 2, 4, 4);
        g.fillStyle(SHADES.light, 1).fillRect(Math.round(p.x + Math.cos(ang) * 12) - 1, Math.round(p.y + Math.sin(ang) * 12) - 1, 3, 3);
      }
      const n = new PixelText(this, 0, p.y - 4, String(q.strength), { color: SHADES.shadow }).setDepth(5);
      n.setX(Math.round(p.x - n.width / 2 + 1));
      this.numbers.push(n);
    }
    // Where the one you've picked can go; or where you can cut the power.
    if (this.aiming) for (const p of this.aiming.dests.slice(1)) g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 13);
    if (this.cutting) for (const p of this.cutTargets()) g.lineStyle(1, SHADES.white, blink ? 1 : 0.4).strokeCircle(p.x, p.y, 13);
    if (!this.busy && blink) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 14, this.cursor.y - 14, 29, 29);
    // One of theirs you've clicked (Cut power, under it).
    if (this.eyeing && !this.busy) g.lineStyle(1, SHADES.white, blink ? 1 : 0.5).strokeCircle(this.eyeing.x, this.eyeing.y, 12);
    // The buttons under the circles (Jack): Fortify, Unfortify, Cut power.
    for (const b of this.underButtons()) {
      const box = this.buttonBox(b);
      g.fillStyle(!b.enabled ? SHADES.deep : b.hot ? SHADES.amberDeep : SHADES.cyanDeep, 0.95).fillRect(box.x, box.y, box.w, box.h);
      g.lineStyle(1, b.enabled ? SHADES.light : SHADES.dim, 1).strokeRect(box.x, box.y, box.w, box.h);
      this.numbers.push(new PixelText(this, box.x + 4, box.y + 2, b.label, { color: b.enabled ? SHADES.white : SHADES.dim, shadow: SHADES.shadow }).setDepth(8));
    }
    // The buttons.
    const idle = !this.busy && !this.aiming && !this.cutting;
    g.fillStyle(idle ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(END.x, END.y, END.w, END.h);
    g.lineStyle(1, idle ? CYAN : SHADES.dim, 1).strokeRect(END.x, END.y, END.w, END.h);
    this.endButton.setColor(idle ? SHADES.white : SHADES.dim);
    const canUndo = !this.busy && this.history.length > 0;
    g.fillStyle(canUndo ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(UNDO.x, UNDO.y, UNDO.w, UNDO.h);
    g.lineStyle(1, canUndo ? CYAN : SHADES.dim, 1).strokeRect(UNDO.x, UNDO.y, UNDO.w, UNDO.h);
    this.undoButton.setColor(canUndo ? SHADES.white : SHADES.dim);
    if (this.you === 'guard' && !this.fatherPlaying) {
      const canCut = !this.busy && !this.aiming && this.g.canCut(s);
      g.fillStyle(this.cutting ? SHADES.amberDeep : canCut ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(POWER.x, POWER.y, POWER.w, POWER.h);
      g.lineStyle(1, canCut || this.cutting ? CYAN : SHADES.dim, 1).strokeRect(POWER.x, POWER.y, POWER.w, POWER.h);
      this.powerButton.setText(s.cut ? 'Power cut' : this.cutting ? 'Cut: where?' : this.g.canCut(s) ? 'Cut power' : `Power in ${this.g.cutIn(s)}`).setColor(canCut || this.cutting ? SHADES.white : SHADES.dim);
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
    if (sc.kind === 'duel') return `Hold the keep: ${left} ${left === 1 ? 'turn' : 'turns'} till dawn.`;
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
    // As things will be by the time this order comes: your earlier orders this turn carried out (a squad joined
    // into this one goes with it).
    const s = this.orders.filter((o) => o.squad !== this.aiming?.squad.id).reduce((t, o) => this.g.order(t, o).state, this.state);
    const p = this.cursor;
    const there = this.g.squadAt(s, p.id);
    if (this.cutting) return 'Cut the power here';
    const aim = s.squads.find((q) => q.id === this.aiming!.squad.id) ?? this.aiming!.squad;
    if (p.id === aim.place) return this.g.fortified(s, p.id) ? 'Hold, dug in' : 'Hold';
    const rumble = s.rumble?.place === p.id ? ', and set off the rumble' : '';
    if (!there) return `Take it${rumble}`;
    if (there.side === aim.side) return `Join: ${aim.strength + there.strength}, then send them on`;
    const a = this.g.attack(aim.place, p.id, aim.strength);
    const d = this.g.defence(s, p.id, there.strength);
    if (this.g.fortified(s, p.id)) return "They're dug in: no attack this turn";
    // Their number as it shows on the circle, and the barricades (or the power cut) beside it; match the square's
    // number and you take it (Jack), keeping what's over after the barricades, at least 1.
    const n = there.strength;
    const vs = `${a} v ${n}${d > n ? (this.sc.kind === 'duel' ? ' (+1 walls)' : ' (+1 barricades)') : d < n ? ' (no power: -1)' : ''}`;
    if (a > d || (p.id === this.g.heart && a >= n)) return `${vs}: you take it, ${Math.max(1, a - d)} left${rumble}`;
    return a === d ? `${vs}: a tie, they hold` : `${vs}: they hold`;
  }

  /** What's at a place: its name, whose, how strong, and anything special about it. */
  private placeText(p: RiotPlace): string {
    const s = this.state;
    const there = this.g.squadAt(s, p.id);
    const duel = this.sc.kind === 'duel';
    const whose = (side: Side) => (duel ? (side === this.you ? 'Your garrison' : 'His army') : side === this.you ? (side === 'guard' ? 'Your guard' : 'Your people') : side === 'guard' ? 'The guard' : 'The rising');
    const lines = [p.name];
    if (there) lines.push(`${whose(there.side)}, ${there.strength}`);
    if (p.heart) lines.push(duel ? 'Walls +1. Grows 1 a turn, as people come in from the fields.' : `Barricades +1. Grows 1 a turn; over ${this.g.style.pourAbove}, sends crowds out.`);
    if (p.lifts) lines.push(duel ? `His army get +${this.g.rules.reinforce} here each turn.` : `The guard get +${this.g.rules.reinforce} here each turn.`);
    if (s.cut === p.id) lines.push('No power this turn.');
    if (this.g.fortified(s, p.id)) lines.push('Dug in: nobody can attack it this turn.');
    if (s.rumble?.place === p.id) lines.push(`A rumble: whoever gets here first sets it off. Everyone next to it takes 1 to 3. (${s.rumble.left} ${s.rumble.left === 1 ? 'turn' : 'turns'} left)`);
    return lines.join('\n');
  }

  /** An order's arrow. `blocked`: at a squad that's dug in, so it won't happen (crossed out at the end). */
  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number, dashed: boolean, n?: number, from?: string, blocked = false): void {
    const q = this.state.squads.find((x) => x.id === o.squad);
    if (!q || q.place === o.to) return;
    const a = this.place(from ?? q.place);
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
    if (blocked) {
      const [cx, cy] = [ex - ux * 6, ey - uy * 6];
      g.lineStyle(3, SHADES.shadow, 1).lineBetween(cx - 4, cy - 4, cx + 4, cy + 4).lineBetween(cx - 4, cy + 4, cx + 4, cy - 4);
      g.lineStyle(1, SHADES.white, 1).lineBetween(cx - 4, cy - 4, cx + 4, cy + 4).lineBetween(cx - 4, cy + 4, cx + 4, cy - 4);
    }
    // Its number in the order, on a dark disc halfway along.
    if (n) {
      const [mx, my] = [(sx + ex) / 2, (sy + ey) / 2];
      g.fillStyle(SHADES.shadow, 1).fillCircle(mx, my, 5);
      g.lineStyle(1, col, 1).strokeCircle(mx, my, 5);
      const t = new PixelText(this, 0, Math.round(my - 3), String(n), { color: col }).setDepth(5);
      t.setX(Math.round(mx - t.width / 2 + 1));
      this.numbers.push(t);
    }
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
function districtPainter(board: RiotBoard, district: 'low' | 'promenade' | 'castle'): (x: number, y: number) => PixelColour {
  const pos = new Map(board.places.map((p) => [p.id, p]));
  const segs = board.ways.map(([a, b]) => [pos.get(a)!, pos.get(b)!] as const);
  const lot = district === 'low' ? 9 : district === 'castle' ? 12 : 16;
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
