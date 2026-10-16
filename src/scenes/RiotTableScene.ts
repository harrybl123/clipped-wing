import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { RIOTS, type DuelScenario, type LessonScenario, type RiotScenario } from '../data/warTable';
import { getSession } from '../session';
import { ELITE_NAMES, ELITES, RIOT_RULES, RISING_STYLE, RiotGame, type Card, type Elite, type Mystery, type Order, type RiotBoard, type RiotEvent, type RiotPlace, type RiotSquad, type RiotState, type Side } from '../systems/Riot';
import { besieger, careful, steady, type GuardPlayer } from '../systems/RiotPlayers';
import { DialogueBox } from '../ui/DialogueBox';
import { rgb, SHADES, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playClash } from '../ui/clashScene';
import { hearPrayer, holdAudience } from '../ui/audienceScene';
import { dealCards } from '../ui/divinerScene';
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
//   side of the rules), he has the bigger army (the guard's), played sensibly, his moves shown; take his camp,
//   keeping your keep, and you've won (designer; no turn limit for now). Either way, back in the room after.
//
// The table shows a riot (designer): the district's streets in light; the rising's squads amber circles, with
// fire and a crowd round them; the guard's blue shields; a key at the top says who's who, and which is you.
// Controls (the old table's): pick a squad of yours (E or click), the arrows step round where it can go, E or
// click to send it (its own place to hold); Esc or right-click backs out; Tab to the next squad; Enter (or the
// button) ends the turn. Undo (or U) takes back your last order, one at a time (designer). Buttons under the
// circles (Jack: easier to play): with a squad picked up, Fortify (or F) digs it in for the turn and puts it
// down, so you can pick up the next (once every 3 turns, like the power cut); Unfortify sits under every
// squad that's dug in. As the guard, click one
// of theirs for Cut power under it (every 3 turns; P still works from the keyboard). Split, beside Fortify (Jack,
// a trial): pick where the bigger half goes; the rest stays, to send on too. The elite squad (Jack, a trial),
// along the bottom: the hero, the maiden and the king's guard (theirs: the bastard, the witch, the barbarians),
// each once, for a crest: one appears on the map now and then (first there takes it): click one, then a place next
// to your base (the king's guard goes round it). A maiden merged into a squad poisons it: green, bubbling, a chance
// of a critical hit. A rumble on the map flares; set off, the screen shakes and "Rumble!" (Jack).

export interface RiotTableSceneData {
  scenario: string;
  /** Where you were (the simulation room). */
  back: AreaSceneData;
  /** The lesson, back from the fight you went down to: on to "Now.". */
  phase?: 'lesson' | 'now';
  outcome?: string;
  /** View mode (Jack): the table zoomed in or out, where it has both. */
  view?: 'in' | 'out';
  /** Switching view mode mid-game: the game as it was (this turn's orders and theirs too). */
  resume?: { state: RiotState; orders: Order[]; theirs: Order[] };
}

/** View mode's button, top right (Jack). */
const VIEW = { x: W - 132, y: 3, w: 100, h: 11 };
/** View mode, remembered between games (where the browser lets it be). */
function savedView(): 'in' | 'out' {
  try {
    return localStorage.getItem('clipped-wing:table-view') === 'in' ? 'in' : 'out';
  } catch {
    return 'out';
  }
}

const AMBER = SHADES.amber;
const CYAN = SHADES.cyan;
const END = { x: W - 70, y: H - 15, w: 64, h: 11 };
const UNDO = { x: W - 122, y: H - 15, w: 46, h: 11 };
/** Cut power, in the corner too (designer: it wasn't obvious it could be done): then choose where. */
const POWER = { x: W - 192, y: H - 15, w: 66, h: 11 };
const COLOUR: Record<Side, number> = { guard: CYAN, rising: AMBER };
type At = { x: number; y: number };
/** A slot in the elite bar (Jack: emblems, not words). */
const SLOT = { w: 26, h: 30 };

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
  /** The buttons under the circles, drawn over everything else on the table (and the card). */
  private buttonGfx!: Phaser.GameObjects.Graphics;
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
  /** Choosing a place for something (the thief, Jack): where it can go, and the cursor among them. */
  private picking: { targets: string[]; prompt: string } | null = null;
  /** The slot in the elite bar under the mouse (its name shows above it). */
  private barHover: Elite | null = null;
  private cardBack!: Phaser.GameObjects.Graphics;
  private endButton!: PixelText;
  private undoButton!: PixelText;
  private powerButton!: PixelText;
  /** One of theirs you've clicked: Cut power, under it (Jack). */
  private eyeing: RiotPlace | null = null;
  /** Splitting the squad you've picked up (Jack): where you send it next, only the bigger half goes. */
  private splitting = false;
  /** One of your elite squad being put in (Jack): pick a place next to your base. */
  private deploying: Elite | null = null;
  /** Your hero, one step chosen (Jack): where it goes by, and now where next. */
  private heroVia: string | null = null;
  /** A split's first half sent (Jack): now where the rest goes. */
  private splitRest = false;
  /** The big words across the screen, one after another (Jack: two at once was a mess). */
  private banners: Promise<void> = Promise.resolve();
  /** The plague's drips off each squad it's on (Jack). */
  private drips: { x: number; y: number; life: number }[] = [];
  /** Their next turn's orders after this one (the commander's advice), worked out once per change. */
  private ahead: { key: string; orders: Order[]; plan: RiotState } | null = null;
  /** How wide each button's words are (measured once). */
  private labelWidths = new Map<string, number>();
  /** This turn's changes, to undo one at a time (designer): the orders and the state before each. */
  private history: { orders: Order[]; state: RiotState }[] = [];
  private dialogue!: DialogueBox;
  private music!: TableMusic;
  private t = 0;
  private embers: { x: number; y: number; life: number; smoke: boolean }[] = [];
  /** The street plan under the table (painted again when the trickster moves the streets: Jack). */
  private backdrop!: Phaser.GameObjects.Image;
  private tricks = 0;
  /** Poison bubbles rising off a poisoned squad (Jack). */
  private bubbles: { x: number; y: number; life: number; r: number }[] = [];
  /** The table's size (bigger than the screen on Day 6: it pans with the cursor, or the mouse at an edge). */
  private bw = W;
  private bh = H;
  /** The buttons in the corner, fixed to the screen while the table pans. */
  private ui!: Phaser.GameObjects.Graphics;
  /** Where the view's heading (it eases there). */
  private view = { x: 0, y: 0 };
  private looked: RiotPlace | null = null;
  private view_: 'in' | 'out' = 'out';
  private viewButton!: PixelText;
  /** Dragging the table round with the mouse (designer: hard to get about): where it started, and whether it's moved. */
  private drag: { x: number; y: number; vx: number; vy: number; moved: boolean } | null = null;

  constructor() {
    super('RiotTable');
  }

  init(data: RiotTableSceneData): void {
    this.params = data;
    const sc = RIOTS[data.scenario];
    if (!sc) throw new Error(`RiotTableScene: no game called "${data.scenario}"`);
    // View mode (Jack): zoomed out (all on the screen) or in (bigger, dragged round), where there's both.
    this.view_ = data.view ?? savedView();
    this.sc = sc.kind === 'riot' && sc.views ? { ...sc, board: sc.views[this.view_] } : sc;
    this.you = sc.kind === 'riot' ? 'guard' : 'rising';
    this.phase = sc.kind === 'lesson' ? (data.phase ?? 'lesson') : sc.kind === 'duel' ? 'duel' : 'riot';
    this.g = new RiotGame(this.sc.board, { ...RIOT_RULES, ...sc.rules });
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
    this.bubbles = [];
    this.looked = null;
    this.drag = null;
    this.bw = this.sc.board.width ?? W;
    this.bh = this.sc.board.height ?? H;
    if (data.resume) (this.state = data.resume.state), (this.orders = data.resume.orders), (this.theirs = data.resume.theirs);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    // The duel's table can be painted anywhere (designer: where do you want to fight?): the crag, a rainforest, a
    // space station. Only the picture changes.
    const look: TableLook = this.sc.kind === 'duel' ? duelLook(String(getSession(this).story.getVariable('duel6_map') ?? '')) : this.sc.district;
    const key = `riot-table-${look}`;
    makePaintedTexture(this, key, this.bw, this.bh, look === 'forest' ? forestPainter(this.sc.board, this.bw, this.bh) : look === 'station' ? stationPainter(this.sc.board, this.bw, this.bh) : districtPainter(this.sc.board, look, this.bw, this.bh));
    this.backdrop = this.add.image(0, 0, key).setOrigin(0);
    this.cameras.main.setBounds(0, 0, this.bw, this.bh);
    this.life = this.add.graphics().setDepth(2);
    this.gfx = this.add.graphics().setDepth(3);
    this.buttonGfx = this.add.graphics().setDepth(9);
    this.ui = this.add.graphics().setDepth(7).setScrollFactor(0);
    // Place names, small and dim under each place (designer: the map needs them), so they're there to read
    // without shouting.
    for (const p of this.sc.board.places) {
      const label = new PixelText(this, 0, p.y + 11, this.sc.board.compact ? p.name.replace(/^The /, '').toLowerCase() : lower(p.name), { color: SHADES.dim, shadow: SHADES.shadow }).setDepth(4);
      label.setX(Math.max(2, Math.min(this.bw - label.width - 2, Math.round(p.x - label.width / 2))));
    }
    // Hardly any words on the table (designer: too cluttered): a note in the corner, and a card by the cursor.
    this.chip = new PixelText(this, 6, 5, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(9).setScrollFactor(0);
    this.cardBack = this.add.graphics().setDepth(7);
    this.card = new PixelText(this, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow, wrapWidth: 150 }).setDepth(8);
    this.endButton = new PixelText(this, END.x + 4, END.y + 2, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8).setScrollFactor(0);
    this.undoButton = new PixelText(this, UNDO.x + 4, UNDO.y + 2, 'Undo', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8).setScrollFactor(0);
    this.powerButton = new PixelText(this, POWER.x + 4, POWER.y + 2, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8).setScrollFactor(0);
    this.viewButton = new PixelText(this, VIEW.x + 4, VIEW.y + 2, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8).setScrollFactor(0);
    this.cursor = this.place(this.g.mine(this.state, this.you)[0]!.place);
    this.lookAt(this.cursor, true);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, this.phase === 'lesson' || this.phase === 'duel' ? 'lesson' : 'now');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.stop());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointer(p, false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.time.addEvent({ delay: 400, loop: true, callback: () => this.draw() });
    this.time.addEvent({ delay: 120, loop: true, callback: () => ((this.t += 1), this.drawLife()) });
    this.cameras.main.fadeIn(600);
    this.draw();
    const sc = this.sc;
    this.time.delayedCall(this.params.resume ? 200 : 600, () => {
      // (Back from switching view mode: carry on where you were.)
      if (this.params.resume) return void ((this.busy = false), this.draw());
      if (sc.kind === 'riot' && sc.skirmish) this.startTurn();
      else if (sc.kind === 'riot' || sc.kind === 'duel') this.talk(sc.knots.intro, () => this.startTurn());
      else if (this.phase === 'now') this.talk(sc.knots.good, () => this.turnItOn());
      else this.talk(sc.knots.intro, () => this.talk(sc.goals[0]!.start, () => this.startTurn()));
    });
  }

  private place = (id: string): RiotPlace => this.sc.board.places.find((p) => p.id === id)!;

  // --- The view (a table bigger than the screen) ---

  /** Bring a place into view, with room round it (at once, or easing there). */
  private lookAt(p: { x: number; y: number }, now = false): void {
    if (this.bw <= W && this.bh <= H) return;
    const cam = this.cameras.main;
    const m = 44;
    let { x, y } = this.view;
    if (now) [x, y] = [p.x - W / 2, p.y - H / 2];
    if (p.x < x + m) x = p.x - m;
    if (p.x > x + W - m) x = p.x - W + m;
    if (p.y < y + 30) y = p.y - 30;
    if (p.y > y + H - 40) y = p.y - H + 40;
    this.view = { x: Math.max(0, Math.min(this.bw - W, x)), y: Math.max(0, Math.min(this.bh - H, y)) };
    if (now) cam.setScroll(this.view.x, this.view.y);
  }

  /** Bring places into view before something happens there, and give the camera time to get there (a big table). */
  private async focusOn(...ps: RiotPlace[]): Promise<void> {
    if (this.bw <= W && this.bh <= H) return;
    const v = this.view;
    if (ps.every((p) => p.x > v.x + 40 && p.x < v.x + W - 40 && p.y > v.y + 30 && p.y < v.y + H - 40)) return;
    const cx = ps.reduce((n, p) => n + p.x, 0) / ps.length;
    const cy = ps.reduce((n, p) => n + p.y, 0) / ps.length;
    this.view = { x: Math.max(0, Math.min(this.bw - W, cx - W / 2)), y: Math.max(0, Math.min(this.bh - H, cy - H / 2)) };
    await this.wait(320);
  }

  override update(_t: number, delta: number): void {
    if (this.bw <= W && this.bh <= H) return;
    // The mouse at an edge of the screen pans the table (when you're free to look round).
    const p = this.input.activePointer;
    if (this.ready() && !this.drag && !this.aiming && p.x >= 0 && p.y >= 0 && p.x <= W && p.y <= H) {
      const edge = 14;
      const step = delta * 0.25;
      const dx = p.x < edge ? -step : p.x > W - edge ? step : 0;
      const dy = p.y < edge && p.x > 120 ? -step : p.y > H - edge && p.x < POWER.x ? step : 0;
      if (dx || dy) this.view = { x: Math.max(0, Math.min(this.bw - W, this.view.x + dx)), y: Math.max(0, Math.min(this.bh - H, this.view.y + dy)) };
    }
    const cam = this.cameras.main;
    const k = Math.min(1, delta / 120);
    cam.setScroll(Math.round(cam.scrollX + (this.view.x - cam.scrollX) * k), Math.round(cam.scrollY + (this.view.y - cam.scrollY) * k));
  }
  private lesson = (): LessonScenario | null => (this.sc.kind === 'lesson' ? this.sc : null);

  /** The computer's guard: your father, steady in the lesson, meaning it in "Now." and when he takes over; your friend, sensible, never emptying his camp. */
  private guardPlayer(): GuardPlayer {
    return this.phase === 'lesson' ? steady() : this.phase === 'duel' ? besieger() : careful();
  }

  // --- The turn ---

  private startTurn(): void {
    this.orders = [];
    this.history = [];
    this.aiming = null;
    this.cutting = false;
    this.eyeing = null;
    this.deploying = null;
    this.heroVia = null;
    this.splitRest = false;
    this.ahead = null;
    // The rising's elite squad, at the start of the turn (Jack): whoever they put in, and a witch's seduction.
    if (this.you === 'guard' && this.g.rules.elites) {
      const acts = this.g.risingActs(this.state);
      this.state = acts.state;
      this.showActs(acts.events);
    }
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
    for (const [o, counter] of [...mine.map((o) => [o, this.theirs] as const), ...this.g.together(before, this.theirs).map((o) => [o, mine] as const)]) {
      const r = this.g.order(s, o, counter);
      if (!r.events.length) continue;
      await this.show(s, o, r.events);
      s = r.state;
      this.state = s;
      events.push(...r.events);
      this.draw();
      // A mystery square found (Jack): what it was, and any choice it brings.
      s = await this.mysteryFollows(s, r.events);
      this.state = s;
      this.draw();
      if (this.g.outcome(s)) break;
      // The lesson's last goal, taken: you go down yourself for the last of it.
      if (this.lastGoalTaken()) return this.goDownLesson();
    }
    // The duel: his camp taken, or your keep.
    if (this.sc.kind === 'duel' && this.g.outcome(s)) return this.duelOver(this.sc, this.g.outcome(s) === 'rising');
    // Into the square: the guard have it.
    if (this.g.outcome(s) === 'guard') return this.squareTaken();
    // The square grows; the guard come down the lifts.
    const end = this.g.turn(s, [], []);
    // New squads mustered out of each base (the duel): the camera goes to each, and you see them arrive.
    for (const e of end.events) {
      if (e.type !== 'muster') continue;
      const base = this.place(e.from);
      if (!e.to) {
        await this.focusOn(base);
        this.pop(base, 'Cut off', SHADES.white);
        await this.wait(600);
        continue;
      }
      const to = this.place(e.to);
      await this.focusOn(base, to);
      const dot = this.add.circle(base.x, base.y, 4, COLOUR[e.side]).setDepth(6);
      playSound(this, 'boots', 0.4);
      await this.tween(dot, { x: to.x, y: to.y, duration: 320, ease: 'Sine.easeOut' });
      dot.destroy();
      this.state = { ...this.state, squads: end.state.squads.filter((q) => q.place === e.to).concat(this.state.squads.filter((q) => q.place !== e.to)) };
      this.pop(to, `+${e.strength}`, COLOUR[e.side]);
      this.draw();
      await this.wait(180);
    }
    for (const e of end.events) {
      if (e.type === 'grow') this.pop(this.place(e.at), `+${Math.max(1, 1 + this.g.outputOf(s, 'rising'))}`, AMBER);
      if (e.type === 'arrive') this.pop(this.place(e.at), `+${Math.max(0, this.g.rules.reinforce + this.g.outputOf(s, 'guard'))}`, CYAN);
      if (e.type === 'pour') this.pop(this.place(e.to), `${this.g.style.pour} out`, AMBER);
      if (e.type === 'crestGone') this.pop(this.place(e.at), 'gone', AMBER);
      if (e.type === 'mysteryGone' || e.type === 'brothelGone' || e.type === 'audienceGone') this.pop(this.place(e.at), 'gone', SHADES.light);
      if (e.type === 'plagueTick') for (const p of e.places) this.pop(this.place(p), '-1', SHADES.greenMid, -10);
      if (e.type === 'eliteGone') this.pop(this.place(e.at), 'gone', COLOUR[e.side]);
    }
    // What appears on the map, and a shake-up: one at a time, each long enough to read (Jack).
    for (const e of end.events) {
      if (e.type === 'rumbleAppears') await this.appears(this.place(e.at), 'Rumble!', AMBER, () => this.rumbleAppears(this.place(e.at)));
      if (e.type === 'crestAppears') await this.appears(this.place(e.at), 'Elite crest!', AMBER, () => this.crestAppears(this.place(e.at)));
      if (e.type === 'mysteryAppears') await this.appears(this.place(e.at), e.mark === 'diviner' ? 'The Diviner!' : e.mark === 'trickster' ? 'The Trickster!' : 'A mystery!', SHADES.white, () => this.mysteryAppears(this.place(e.at), e.mark));
      if (e.type === 'brothelAppears') await this.appears(this.place(e.at), 'A brothel!', AMBER, () => this.tokenAppears(this.place(e.at), SHADES.amber));
      if (e.type === 'audienceAppears') await this.appears(this.place(e.at), 'An audience!', SHADES.white, () => this.tokenAppears(this.place(e.at), SHADES.white));
      if (e.type === 'shakeUp') await this.shakeUp(e.sides);
      // (A shake-up that's the trickster: the streets change.)
      if (e.type === 'trickster') await this.trickster(end.state);
    }
    this.state = end.state;
    this.draw();
    // The crier (Jack): an audience, wherever you are.
    if (this.state.pending) this.state = await this.mysteryFollows(this.state, end.events);
    this.draw();
    await this.wait(this.fatherPlaying ? 250 : 500);
    if (this.fatherPlaying) return this.startTurn();
    // The duel: dawn, and his camp still his.
    if (this.sc.kind === 'duel' && this.g.outcome(this.state)) return this.duelOver(this.sc, this.g.outcome(this.state) === 'rising');
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
    // The camera goes to it first (designer: stuff happened off screen, too fast to see).
    await this.focusOn(from, to);
    const slow = this.bw > W || this.bh > H;
    // A clash (Jack): into the circle, and the fight played out (head on, meeting in a street, or at a base).
    const clash = events.find((e) => e.type === 'clash');
    if (clash?.type === 'clash') {
      const winner = clash.won ? clash.side : this.g.other(clash.side);
      const at = clash.meet || clash.base ? to : { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      if (clash.base) await this.banner('Final clash!', { colour: SHADES.white, sub: `${clash.strength} against ${clash.strength}, for ${lower(to.name)}.`, hold: 1100 });
      // (Cursed, the street's plunged into darkness; blessed, it's lit gold: Jack.)
      const favour = [this.g.favour(s, 'guard'), this.g.favour(s, 'rising')];
      const mood = favour.includes(-1) ? 'dark' : favour.includes(1) ? 'gold' : undefined;
      await playClash(this, { at, strength: clash.strength, winner, left: clash.left, you: this.you, chance: clash.side === this.you ? clash.chance : 1 - clash.chance, mood });
      const took = clash.meet || clash.base ? to : clash.won ? to : from;
      this.pop(took, `Clash won: ${clash.left} left`, COLOUR[winner]);
      this.tokensTaken(events);
      return;
    }
    // A race for something on the map (Jack): both run for it; the winner gets there, the loser's turned back.
    const race = events.find((e) => e.type === 'race');
    if (race?.type === 'race') {
      const rival = this.place(race.rival);
      const theirs = this.g.other(race.side);
      const mine = this.add.circle(from.x, from.y, 6, COLOUR[race.side]).setDepth(6);
      const other = this.add.circle(rival.x, rival.y, 6, COLOUR[theirs]).setDepth(6);
      playSound(this, 'boots', 0.6);
      await Promise.all([
        this.tween(mine, { x: (from.x + to.x * 2) / 3, y: (from.y + to.y * 2) / 3, duration: 300, ease: 'Sine.easeIn' }),
        this.tween(other, { x: (rival.x + to.x * 2) / 3, y: (rival.y + to.y * 2) / 3, duration: 300, ease: 'Sine.easeIn' }),
      ]);
      const pc = Math.round((race.side === this.you ? race.chance : 1 - race.chance) * 100);
      const what = { crest: 'the crest', mystery: 'the mystery', rumble: 'the rumble', brothel: 'the brothel', audience: 'the audience' }[race.what];
      void this.banner(`Race for ${what}!`, { sub: `Your odds: ${pc}%`, hold: 900 });
      await this.wait(700);
      const [win, lose, back] = race.won ? [mine, other, rival] : [other, mine, from];
      playSound(this, 'clash', 0.7);
      await Promise.all([this.tween(win, { x: to.x, y: to.y, duration: 220 }), this.tween(lose, { x: back.x, y: back.y, duration: 300, ease: 'Sine.easeOut' })]);
      mine.destroy();
      other.destroy();
      this.pop(to, `${(race.won ? race.side : theirs) === this.you ? 'You' : 'They'} got there first`, COLOUR[race.won ? race.side : theirs], -16);
      this.tokensTaken(events);
      const rumble = events.find((e) => e.type === 'rumble');
      if (rumble?.type === 'rumble') await this.rumbleGoesOff(rumble);
      return;
    }
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
    // (A hero two streets off goes by the place between: Jack.)
    const via = q.elite === 'hero' ? (o.via ?? this.g.via(s, q, o.to)) : null;
    if (via) await this.tween(dot, { x: this.place(via).x, y: this.place(via).y, duration: 200, ease: 'Sine.easeInOut' });
    await this.tween(dot, { x: to.x, y: to.y, duration: this.fatherPlaying ? 160 : slow ? 360 : 260, ease: 'Sine.easeInOut' });
    dot.destroy();
    const fights = events.filter((e): e is Extract<RiotEvent, { type: 'fight' }> => e.type === 'fight');
    for (const fight of fights) {
      const at = this.place(fight.at);
      playSound(this, 'crash', 0.6);
      this.cameras.main.shake(150, 0.004);
      const flash = this.add.circle(at.x, at.y, 10, SHADES.white).setDepth(6);
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 260, onComplete: () => flash.destroy() });
      const loser = fight.won ? this.g.other(fight.side) : fight.side;
      // What each side lost, floating up.
      const defender = s.squads.find((x) => x.place === fight.at);
      if (q.elite === 'hero') this.pop(at, fight.won ? `-${fight.defence}` : `-${fight.attack}`, COLOUR[fight.side], -10);
      else if (fight.won) this.pop(at, `-${fight.defence}`, COLOUR[fight.side], -10);
      else this.pop(at, `all ${q.strength}`, COLOUR[fight.side], -10);
      if (defender) this.pop(at, fight.won ? `all ${defender.strength}` : `-${Math.min(fight.attack, defender.strength - 1)}`, COLOUR[defender.side], 10);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const d = this.add.rectangle(at.x, at.y, 2, 2, COLOUR[loser]).setDepth(6);
        this.tweens.add({ targets: d, x: at.x + Math.cos(a) * 16, y: at.y + Math.sin(a) * 11, alpha: 0, duration: 420, onComplete: () => d.destroy() });
      }
      // A critical hit (Jack): poisoned, it hit harder.
      if (fight.crit) {
        playSound(this, 'smash', 0.8);
        this.pop(at, `Critical! +${fight.crit}`, SHADES.green, -22);
      }
      if (fights.length > 1) await this.wait(200);
    }
    this.tokensTaken(events);
    if (events.some((e) => e.type === 'seduce')) for (const e of events) if (e.type === 'seduce') this.seduced(this.place(e.at), e.side);
    if (!fights.length) playSound(this, 'tick', 0.5);
    if (events.some((e) => e.type === 'eliteGone')) this.pop(to, 'spent', COLOUR[q.side], 0);
    await this.wait(slow ? 150 : 80);
    const rumble = events.find((e) => e.type === 'rumble');
    if (rumble?.type === 'rumble') await this.rumbleGoesOff(rumble);
  }

  /**
   * One of the elite squad put in (Jack), across the table: "Hero!" and a sword drawn ("Bastard!", pitched down);
   * "Maiden!" ("Witch!"); "King's Guard!" ("Barbarians!") and boots.
   */
  private async eliteArrives(side: Side, elite: Elite, places: RiotPlace[]): Promise<void> {
    const ours = side === 'guard';
    if (elite === 'hero') {
      playSound(this, ours ? 'shing' : 'shingLow', 1);
      if (ours) playSound(this, 'hero', 1);
    } else playSound(this, elite === 'maiden' ? (ours ? 'giggle' : 'cackle') : ours ? 'grunt' : 'gruntLow', 1);
    if (ours) this.cameras.main.flash(200, 230, 250, 255);
    else (this.cameras.main.flash(350, 20, 14, 10), this.cameras.main.shake(300, 0.004));
    for (const at of places) {
      const glint = this.add.circle(at.x, at.y, 6, ours ? SHADES.white : SHADES.amber).setDepth(6);
      this.tweens.add({ targets: glint, scale: 4, alpha: 0, duration: 500, onComplete: () => glint.destroy() });
    }
    this.draw();
    await this.banner(`${ELITE_NAMES[side][elite]}!`, { colour: COLOUR[side] });
  }

  /** What the rising did at the start of the turn (Jack), shown: an elite put in, a seduction. */
  private showActs(events: RiotEvent[]): void {
    for (const e of events) {
      if (e.type === 'deploy') void this.eliteArrives(e.side, e.elite, e.at.map((p) => this.place(p)));
      if (e.type === 'seduce') this.seduced(this.place(e.at), e.side);
    }
  }

  /** Seduced (Jack): "Seduced!" plucking up off it, and a kiss. */
  private seduced(at: RiotPlace, side: Side): void {
    playSound(this, 'kiss', 1);
    const word = new PixelText(this, 0, 0, 'Seduced!', { color: SHADES.white, shadow: SHADES.shadow, scale: 2 }).setDepth(20);
    word.setPosition(Math.round(Math.max(2, Math.min(W - word.width - 2, at.x - word.width / 2))), at.y - 30);
    this.tweens.add({ targets: word, y: at.y - 46, alpha: { from: 1, to: 0 }, duration: 1400, delay: 300, onComplete: () => word.destroy() });
    for (let i = 0; i < 6; i++) {
      const heart = this.add.text(at.x, at.y, '♥', { fontSize: '8px', color: '#' + COLOUR[side].toString(16).padStart(6, '0') }).setDepth(20);
      this.tweens.add({ targets: heart, x: at.x + (i - 2.5) * 6, y: at.y - 20 - (i % 2) * 6, alpha: 0, duration: 900, delay: i * 60, onComplete: () => heart.destroy() });
    }
    this.draw();
  }

  /**
   * A shake-up (Jack, the skirmish): "Shake-up!" and what it is, long enough to read (Jack): a crest for each side
   * (put in any elite), or the trickster.
   */
  private async shakeUp(sides: Side[]): Promise<void> {
    const sub = sides.length ? `${sides.length === 2 ? 'Each side gets' : sides[0] === this.you ? 'You get' : 'They get'} a crest: put in any elite.` : 'The trickster! Every street on the table changes.';
    await this.banner('Shake-up!', { sub, hold: 2600, then: () => (playSound(this, 'shing', 1), this.cameras.main.shake(300, 0.006)) });
    for (const side of sides) this.pop(this.place(this.g.base(side)), 'A crest: any elite', COLOUR[side]);
  }

  // --- The mystery square (Jack) ---

  /** A mystery square appears: a shimmer, an eerie chime, "?" (or the diviner's eye, or the trickster's mark). */
  private mysteryAppears(at: RiotPlace, _mark?: 'diviner' | 'trickster'): void {
    playSound(this, 'diviner', 0.7);
    this.cameras.main.flash(200, 200, 220, 230);
    for (const delay of [0, 300]) {
      const ring = this.add.circle(at.x, at.y, 10).setStrokeStyle(2, SHADES.white).setDepth(6);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 900, delay, onComplete: () => ring.destroy() });
    }
  }

  /** After an order: a mystery square found, what it was, and what it brings (the diviner's cards, the thief's target). */
  private async mysteryFollows(s0: RiotState, events: RiotEvent[]): Promise<RiotState> {
    let s = s0;
    for (const e of events) {
      if (e.type === 'mystery') await this.mysteryRevealed(e.what, e.side);
      if (e.type === 'plague') await this.plagueSkull(e.side);
      if (e.type === 'trickster') await this.trickster(s0);
      if (e.type === 'audienceFound') await this.banner('An audience!', { sub: e.side === this.you ? 'Three have come to you. Choose who to hear.' : 'The rising hold an audience.', hold: 1000 });
    }
    const p = s.pending;
    if (!p) return s;
    await this.banners;
    const ours = p.side === this.you && !this.fatherPlaying;
    let choice: number | string | undefined;
    if (p.kind === 'prayer') {
      // An audience with the Lord (Jack): the prayer, and his judgement.
      const d = this.g.resolve(s);
      const e = d.events.find((x) => x.type === 'judgement');
      await hearPrayer(this, { side: p.side, you: this.you, blessed: e?.type === 'judgement' && e.blessed, turns: this.g.rules.audience?.judged ?? 5 });
      this.state = d.state;
      this.draw();
      return d.state;
    }
    if (p.kind === 'audience') {
      // The audience (Jack): who to hear; how it went (the rules decide, as it plays).
      let d = { state: s, events: [] as RiotEvent[] };
      const a = this.g.rules.audience;
      const pick = ours ? undefined : (['accountant', 'townsfolk', 'commander'] as const)[Math.floor(Math.random() * 3)]! + `:${Math.floor(Math.random() * 4)}`;
      await holdAudience(this, {
        side: p.side, you: this.you, pick,
        turns: { morale: a?.moraleTurns ?? 5, output: a?.outputTurns ?? 5, slump: a?.slumpTurns ?? 2, advice: a?.advice ?? 5 },
        decide: (c) => {
          d = this.g.resolve(s, c);
          const e = d.events.find((x) => x.type === 'audience');
          return e?.type === 'audience' && e.good;
        },
      });
      this.state = d.state;
      this.ahead = null;
      this.draw();
      return d.state;
    }
    if (p.kind === 'diviner') {
      choice = await dealCards(this, {
        cards: p.cards, side: p.side, you: this.you,
        name: (c) => this.cardName(c, p.side), says: (c) => this.cardSays(c),
        picture: (g, c, x, y) => this.cardPicture(g, c, p.side, x, y),
        pick: ours ? undefined : Math.floor(Math.random() * p.cards.length),
      });
    } else if (ours) choice = await this.pickPlace(this.g.thiefTargets(s, p.side), 'Pick one of theirs to rob');
    const d = this.g.resolve(s, choice);
    s = d.state;
    this.state = s;
    this.draw();
    for (const e of d.events) {
      if (e.type === 'card') {
        for (const c of e.changes) this.pop(this.place(c.place), c.by > 0 ? `+${c.by}` : `${c.by}`, c.by > 0 ? COLOUR[e.side] : SHADES.dim);
        if ((ELITES as readonly string[]).includes(e.card)) this.pop(this.place(this.g.base(e.side)), `${ELITE_NAMES[e.side][e.card as Elite]}: free`, COLOUR[e.side]);
        if (e.card === 'joker') (this.cameras.main.shake(400, 0.01), playSound(this, 'quake', 0.6));
        else if (e.card !== 'plague') playSound(this, 'crest', 0.7);
      }
      if (e.type === 'plague') await this.plagueSkull(e.side);
      if (e.type === 'thief') {
        playSound(this, 'thief', 1);
        this.pop(this.place(e.at), e.gone ? `all ${e.stolen}` : `-${e.stolen}`, COLOUR[this.g.other(e.side)]);
        if (e.to) this.pop(this.place(e.to), `+${e.stolen}`, COLOUR[e.side]);
      }
    }
    await this.wait(400);
    return s;
  }

  /** What a mystery square turned out to be, across the table. */
  private async mysteryRevealed(what: Mystery, side: Side): Promise<void> {
    if (what === 'plague' || what === 'trickster') return; // (the skull, and the streets themselves, say it)
    if (what === 'thief') playSound(this, 'thief', 1);
    await this.banner(what === 'diviner' ? 'The Diviner!' : 'Thief!', { colour: what === 'thief' ? COLOUR[side] : SHADES.white, hold: 800 });
  }

  /** Choosing a place (the thief's target): rings round them; click one, or the arrows and E. */
  private pickPlace(targets: string[], prompt: string): Promise<string> {
    this.picking = { targets, prompt };
    this.cursor = this.place(targets[0]!);
    this.draw();
    return new Promise((resolve) => {
      const finish = (id: string) => {
        this.input.keyboard?.off('keydown', onKey);
        this.input.off('pointerdown', onDown);
        this.input.off('pointermove', onMove);
        this.picking = null;
        playConfirm(this);
        resolve(id);
      };
      const near = (p: Phaser.Input.Pointer) => targets.find((id) => Math.hypot(this.place(id).x - p.x, this.place(id).y - p.y) < 13);
      const onKey = (e: KeyboardEvent) => {
        const i = targets.indexOf(this.cursor.id);
        if (['ArrowLeft', 'ArrowUp', 'a', 'w'].includes(e.key)) (this.cursor = this.place(targets[(i + targets.length - 1) % targets.length]!)), playMove(this), this.draw();
        if (['ArrowRight', 'ArrowDown', 'd', 's', 'Tab'].includes(e.key)) (this.cursor = this.place(targets[(i + 1) % targets.length]!)), playMove(this), this.draw();
        if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') finish(this.cursor.id);
      };
      const onMove = (p: Phaser.Input.Pointer) => {
        const id = near(p);
        if (id && id !== this.cursor.id) (this.cursor = this.place(id)), this.draw();
      };
      const onDown = (p: Phaser.Input.Pointer) => {
        const id = near(p);
        if (id) finish(id);
      };
      this.input.keyboard?.on('keydown', onKey);
      this.input.on('pointerdown', onDown);
      this.input.on('pointermove', onMove);
    });
  }

  private cardName(card: Card, side: Side): string {
    if ((ELITES as readonly string[]).includes(card)) return ELITE_NAMES[side][card as Elite];
    return { joker: 'The Joker', jack: 'The Jack', king: 'The King', queen: 'The Queen', ace: 'The Ace', plague: 'The Plague' }[card as Exclude<Card, Elite>];
  }

  private cardSays(card: Card): string {
    const m = this.g.rules.mystery;
    if ((ELITES as readonly string[]).includes(card)) return 'yours to put in, no crest needed';
    return {
      joker: 'everything next to it thrown in the air',
      jack: `+${m?.jack ?? 2} to each of yours next to it`,
      king: `+${m?.king ?? 5} to your base`,
      queen: `+${m?.queen ?? 3} to one of yours`,
      ace: `+${m?.ace ?? 5} to the squad that found it`,
      plague: `all active squads lose -1 health per turn (${m?.plagueTurns ?? 3} turns)`,
    }[card as Exclude<Card, Elite>];
  }

  /** A card's picture: the elite's own emblem, or a crown, a sword, a jester's hat, a skull. */
  private cardPicture(g: Phaser.GameObjects.Graphics, card: Card, side: Side, x: number, y: number): void {
    const at = { x, y: y + 2 };
    if (card === 'hero') return this.drawHero(g, at, side, false);
    if (card === 'maiden') return this.drawMaiden(g, at, side, false);
    if (card === 'guard3') return this.drawGuardsman(g, at, side, false);
    const ink = SHADES.deep;
    if (card === 'king' || card === 'queen') {
      // A crown: the king's tall with three points, the queen's lower with a jewel.
      const h = card === 'king' ? 10 : 7;
      g.fillStyle(SHADES.amber, 1).fillRect(x - 9, y, 19, 5);
      for (const dx of [-9, -1, 7]) g.fillTriangle(x + dx, y, x + dx + 3, y, x + dx + 1.5, y - h);
      g.fillStyle(card === 'queen' ? SHADES.cyan : SHADES.white, 1).fillRect(x - 1, y + 1, 3, 3);
      g.lineStyle(1, ink, 1).strokeRect(x - 9, y, 19, 5);
    } else if (card === 'jack') {
      // A sword, point up.
      g.fillStyle(SHADES.dim, 1).fillRect(x, y - 12, 2, 18);
      g.fillStyle(ink, 1).fillRect(x - 4, y + 5, 10, 2).fillRect(x, y + 7, 2, 5);
    } else if (card === 'ace') {
      // A single great diamond.
      g.fillStyle(SHADES.amberDeep, 1).fillTriangle(x - 8, y, x + 8, y, x, y - 13).fillTriangle(x - 8, y, x + 8, y, x, y + 13);
    } else if (card === 'joker') {
      // A jester's hat: three floppy points with bells.
      g.fillStyle(SHADES.cyanMid, 1).fillTriangle(x - 10, y - 9, x - 2, y + 4, x - 6, y + 4);
      g.fillStyle(SHADES.amber, 1).fillTriangle(x, y - 13, x - 4, y + 4, x + 4, y + 4);
      g.fillStyle(SHADES.cyanMid, 1).fillTriangle(x + 10, y - 9, x + 2, y + 4, x + 6, y + 4);
      g.fillStyle(SHADES.white, 1).fillCircle(x - 10, y - 9, 2).fillCircle(x, y - 13, 2).fillCircle(x + 10, y - 9, 2);
      g.fillStyle(ink, 1).fillRect(x - 8, y + 4, 17, 3);
    } else {
      // The plague: a small skull.
      g.fillStyle(SHADES.dim, 1).fillCircle(x, y - 2, 7).fillRect(x - 4, y + 3, 9, 4);
      g.fillStyle(ink, 1).fillCircle(x - 3, y - 2, 2).fillCircle(x + 3, y - 2, 2).fillRect(x, y + 2, 1, 2);
    }
  }

  /**
   * The trickster (Jack): a cackle of bells, "Trickster!", and the streets come loose, flicker through other
   * ways, and settle as they are now; the street plan under the table is painted again.
   */
  private async trickster(s: RiotState): Promise<void> {
    void this.banner('Trickster!', { wobble: true, hold: 1300, sub: 'Every street on the table changes.', then: () => (playSound(this, 'trickster', 1), this.cameras.main.shake(500, 0.006)) });
    // The streets shuffling.
    const g = this.add.graphics().setDepth(4);
    const places = this.sc.board.places;
    for (let k = 0; k < 8; k++) {
      g.clear();
      for (let i = 0; i < this.g.ways(s).length; i++) {
        const [a, b] = [places[Math.floor(Math.random() * places.length)]!, places[Math.floor(Math.random() * places.length)]!];
        g.lineStyle(1, k % 2 ? SHADES.white : SHADES.cyanMid, 0.5).lineBetween(a.x, a.y, b.x, b.y);
      }
      if (k === 3 && this.sc.kind !== 'duel') {
        const key = `riot-table-${this.sc.district}-trick${++this.tricks}`;
        makePaintedTexture(this, key, this.bw, this.bh, districtPainter({ places, ways: [...this.g.ways(s)] as [string, string][] }, this.sc.district, this.bw, this.bh));
        this.backdrop.setTexture(key);
      }
      await this.wait(90);
    }
    g.destroy();
    this.draw();
    await this.wait(500);
  }

  /** The plague (Jack): a skull fills the screen and decays, with a hollow, dark sound. */
  private plagueSkull(side: Side): Promise<void> {
    const run = () => this.plagueSkullNow(side);
    this.banners = this.banners.then(run, run);
    return this.banners;
  }

  private async plagueSkullNow(side: Side): Promise<void> {
    playSound(this, 'plague', 1);
    const rows = [
      '....######....',
      '..##########..',
      '.############.',
      '##############',
      '##############',
      '###...##...###',
      '##....##....##',
      '##....##....##',
      '###..####..###',
      '.#####..#####.',
      '..##########..',
      '..#.#.##.#.#..',
      '..##########..',
      '...#.#..#.#...',
    ];
    const px = 7;
    const [ox, oy] = [Math.round(W / 2 - (rows[0]!.length * px) / 2), 40];
    const layer = this.add.container(0, 0).setDepth(110).setScrollFactor(0);
    layer.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0));
    const bones: Phaser.GameObjects.Rectangle[] = [];
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '#') return;
      const shade = x > 9 ? SHADES.dim : y > 9 ? SHADES.woodPale : SHADES.light;
      const b = this.add.rectangle(ox + x * px, oy + y * px, px, px, shade).setOrigin(0);
      bones.push(b);
      layer.add(b);
    }));
    // A faint glow in the eyes.
    for (const ex of [3.5, 9.5]) layer.add(this.add.circle(ox + ex * px, oy + 6.5 * px, 4, SHADES.amberDeep, 0.8));
    const word = new PixelText(this, 0, oy + rows.length * px + 10, 'Plague!', { color: SHADES.light, shadow: SHADES.shadow, scale: 2 });
    word.setX(Math.round((W - word.width) / 2));
    const says = new PixelText(this, 0, word.y + 20, `${side === this.you ? 'All' : 'All their'} active squads lose -1 health per turn (${this.g.rules.mystery?.plagueTurns ?? 3} turns)`, { color: SHADES.dim, shadow: SHADES.shadow });
    says.setX(Math.round((W - says.width) / 2));
    layer.add([word, says]);
    layer.setAlpha(0);
    await this.tween(layer, { alpha: 1, duration: 300 });
    // Decaying: bits darken, crack and fall away.
    const order = Phaser.Utils.Array.Shuffle([...bones]);
    for (let i = 0; i < order.length * 0.45; i++) {
      const b = order[i]!;
      this.time.delayedCall(200 + i * 14, () => {
        b.setFillStyle(SHADES.wood);
        if (i % 3 === 0) this.tweens.add({ targets: b, y: b.y + 30 + (i % 5) * 8, alpha: 0, duration: 700, ease: 'Quad.easeIn' });
      });
    }
    await this.wait(1900);
    await this.tween(layer, { alpha: 0, duration: 400 });
    layer.destroy();
  }

  /** A crest appears (Jack: hard to miss): a bright glint, gold rings going out from it, "Elite!". */
  private crestAppears(at: RiotPlace): void {
    playSound(this, 'crest', 1);
    this.cameras.main.flash(200, 255, 230, 160);
    for (const delay of [0, 300]) {
      const ring = this.add.circle(at.x, at.y, 10).setStrokeStyle(2, SHADES.amber).setDepth(6);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 900, delay, onComplete: () => ring.destroy() });
    }
  }

  /** A crest taken: a chime, and who got it. */
  private crestTaken(at: RiotPlace, side: Side): void {
    playSound(this, 'crest', 0.8);
    const glint = this.add.circle(at.x, at.y, 6, SHADES.amber).setDepth(6);
    this.tweens.add({ targets: glint, scale: 3, alpha: 0, duration: 500, onComplete: () => glint.destroy() });
    this.pop(at, side === this.you ? 'Crest! Pick an elite' : 'They took the crest', COLOUR[side], -16);
  }

  /** What a move picked up off the map, shown: a crest, the brothel; a squad poisoned. */
  private tokensTaken(events: RiotEvent[]): void {
    for (const e of events) {
      if (e.type === 'crestTaken') this.crestTaken(this.place(e.at), e.side);
      if (e.type === 'poison') this.poisoned(this.place(e.at));
      if (e.type === 'brothel') {
        playSound(this, 'giggle', 0.8);
        this.pop(this.place(e.at), `Stuck a turn, then +${Math.round((this.g.rules.brothel?.boost ?? 0) * 100)}% in a clash`, COLOUR[e.side], -16);
      }
    }
  }

  /** Poisoned (Jack): she merges in, it turns green, and it bubbles. */
  private poisoned(at: RiotPlace): void {
    playSound(this, 'bubble', 1);
    const cloud = this.add.circle(at.x, at.y, 8, SHADES.green, 0.6).setDepth(6);
    this.tweens.add({ targets: cloud, scale: 2.6, alpha: 0, duration: 800, onComplete: () => cloud.destroy() });
    this.pop(at, 'Poisoned!', SHADES.green, -16);
  }

  /** Something appears on the map (one at a time, Jack): the camera goes there, it flares, and its name. */
  private async appears(at: RiotPlace, name: string, colour: number, flare: () => void): Promise<void> {
    await this.banners;
    await this.focusOn(at);
    flare();
    await this.banner(name, { colour, hold: 900 });
  }

  /** The brothel or an audience appearing: rings going out from it. */
  private tokenAppears(at: RiotPlace, colour: number): void {
    playSound(this, 'chime', 0.8);
    for (const delay of [0, 300]) {
      const ring = this.add.circle(at.x, at.y, 10).setStrokeStyle(2, colour).setDepth(6);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 900, delay, onComplete: () => ring.destroy() });
    }
  }

  /** A rumble appears (Jack: hard to miss): a flash, a low rumble, a ring going out from it, and its name. */
  private rumbleAppears(at: RiotPlace): void {
    this.lookAt(at);
    playSound(this, 'rumble', 1);
    this.cameras.main.flash(250, 242, 180, 90);
    for (const delay of [0, 350]) {
      const ring = this.add.circle(at.x, at.y, 10).setStrokeStyle(2, SHADES.amber).setDepth(6);
      this.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 900, delay, onComplete: () => ring.destroy() });
    }
  }

  /**
   * A rumble set off (Jack): the screen shakes, a distorted rumble, "Rumble!" across the table, and what each
   * squad round it took.
   */
  private async rumbleGoesOff(e: Extract<RiotEvent, { type: 'rumble' }>): Promise<void> {
    const at = this.place(e.at);
    this.lookAt(at);
    playSound(this, 'quake', 1);
    this.cameras.main.shake(900, 0.018);
    const ring = this.add.circle(at.x, at.y, 8, SHADES.amber, 0.6).setDepth(6);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    for (const h of e.hits) this.pop(this.place(h.place), h.gone ? 'all' : `-${h.damage}`, COLOUR[h.side]);
    this.draw();
    await this.banner('Rumble!', { colour: SHADES.amber, jitter: true, hold: 1100 });
  }

  /**
   * Big words across the middle of the screen (and a line under them), one after another, never on top of each
   * other (Jack). Resolves once they've gone.
   */
  private banner(words: string, opts: { colour?: number; sub?: string; hold?: number; wobble?: boolean; jitter?: boolean; then?: () => void } = {}): Promise<void> {
    const show = async () => {
      opts.then?.();
      const word = new PixelText(this, 0, 0, words, { color: opts.colour ?? SHADES.white, shadow: SHADES.shadow, scale: 3 }).setDepth(20).setScrollFactor(0);
      word.setPosition(Math.round((W - word.width) / 2), Math.round(H / 2 - word.height / 2 - 20));
      const sub = opts.sub ? new PixelText(this, 0, word.y + word.height + 6, opts.sub, { color: SHADES.light, shadow: SHADES.shadow, wrapWidth: W - 40 }).setDepth(20).setScrollFactor(0) : null;
      sub?.setX(Math.round((W - sub.width) / 2));
      const back = this.add.rectangle(0, word.y - 8, W, word.height + (sub ? sub.height + 22 : 16), 0x000000, 0.45).setOrigin(0).setDepth(19).setScrollFactor(0);
      word.setScale(0.6);
      this.tweens.add({ targets: word, scale: 1, duration: 180, ease: 'Back.easeOut' });
      if (opts.wobble) this.tweens.add({ targets: word, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, repeat: 5 });
      if (opts.jitter) this.tweens.add({ targets: word, x: word.x + 3, duration: 50, yoyo: true, repeat: 9 });
      await this.wait(opts.hold ?? 1000);
      await this.tween([word, back, ...(sub ? [sub] : [])], { alpha: 0, duration: 400 });
      word.destroy();
      back.destroy();
      sub?.destroy();
    };
    this.banners = this.banners.then(show, show);
    return this.banners;
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
    if (sc.kind === 'riot' && sc.skirmish) return this.skirmishOver(true);
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

  /** The skirmish over (Jack): who won, on which turn; a click plays again. */
  private skirmishOver(won: boolean): void {
    this.busy = true;
    this.draw();
    playSound(this, won ? 'shing' : 'quake', 1);
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setDepth(110);
    // (Nobody of yours left anywhere, Jack: no moves possible.)
    const none = !this.g.mine(this.state, this.you).length;
    const theirs = !this.g.mine(this.state, this.g.other(this.you)).length;
    shade.setScrollFactor(0);
    const big = new PixelText(this, 0, H / 2 - 30, none ? 'Game over' : won ? (theirs ? 'They’re all gone!' : `You took ${lower(this.place(this.g.base(this.g.other(this.you))).name)}!`) : 'They took your base.', { color: won ? SHADES.white : SHADES.amber, shadow: SHADES.shadow, scale: 2 }).setDepth(111).setScrollFactor(0);
    big.setX(Math.round((W - big.width) / 2));
    const small = new PixelText(this, 0, H / 2, `${none ? '(No moves possible.) ' : ''}On turn ${this.state.turn}. Click to play again.`, { color: SHADES.light, shadow: SHADES.shadow }).setDepth(111).setScrollFactor(0);
    small.setX(Math.round((W - small.width) / 2));
    void shade;
    this.time.delayedCall(800, () => this.input.once('pointerdown', () => this.scene.restart({ ...this.params, resume: undefined })));
  }

  /** Dawn, and the square's still theirs: your father comes in, and takes the table from you (designer). */
  private dawn(): void {
    if (this.sc.kind === 'duel') return this.duelOver(this.sc, true);
    const sc = this.sc as RiotScenario;
    if (sc.skirmish) return this.skirmishOver(false);
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('riot_table', 'lost');
    story.setVariable('riot_turns', this.state.turn);
    // Lost (designer): play it again, or let the story go on (your father comes in and takes it).
    this.dialogue.openMenu('Dawn. The square\u2019s still theirs.', [
      { label: 'Play it again', run: () => this.leave(() => this.scene.restart({ ...this.params, phase: undefined, resume: undefined } satisfies RiotTableSceneData)) },
      { label: 'Go on (your father comes in)', run: () => this.time.delayedCall(150, () => this.fatherIn(sc)) },
    ]);
  }

  /** The duel's over: you took his camp, or he took your keep, or dawn came (play it again, or go on). Back in the room either way. */
  private duelOver(sc: DuelScenario, won: boolean): void {
    this.busy = true;
    this.draw();
    const { story } = getSession(this);
    const keepTaken = this.g.squadAt(this.state, this.g.heart)?.side === 'guard';
    story.setVariable('duel6', won ? 'won' : 'lost');
    story.setVariable('duel6_how', won ? 'camp' : keepTaken ? 'keep' : 'dawn');
    story.setVariable('duel6_turns', Math.min(this.state.turn, this.g.rules.dawn));
    const out = () => this.talk(won ? sc.knots.won : sc.knots.lost, () => this.leave(() => this.scene.start('Area', { ...this.params.back, script: sc.knots.after } satisfies AreaSceneData)));
    if (won) return out();
    this.dialogue.openMenu(keepTaken ? 'He\u2019s taken the keep.' : 'Dawn, and his camp\u2019s still standing.', [
      { label: 'Play it again', run: () => this.leave(() => this.scene.restart({ ...this.params, phase: undefined, resume: undefined } satisfies RiotTableSceneData)) },
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
    if (e.key === 'v' || e.key === 'V') return this.switchView();
    if (['1', '2', '3'].includes(e.key)) return void this.eliteBar()[Number(e.key) - 1]?.run();
    if ((e.key === 'f' || e.key === 'F') && this.aiming) return this.fortifyPicked();
    if ((e.key === 'p' || e.key === 'P') && this.you === 'guard') return this.startCut();
    if (e.key === 'Tab') {
      e.preventDefault();
      return this.nextSquad();
    }
    if (e.key === 'Enter' && !this.aiming && !this.cutting) void this.endTurn();
  }

  private onPointer(p: Phaser.Input.Pointer, down: boolean): void {
    // Dragging the table round.
    if (this.drag && !down && p.isDown) {
      const [dx, dy] = [p.x - this.drag.x, p.y - this.drag.y];
      if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.moved = true;
      if (this.drag.moved) {
        this.view = { x: Math.max(0, Math.min(this.bw - W, this.drag.vx - dx)), y: Math.max(0, Math.min(this.bh - H, this.drag.vy - dy)) };
        this.cameras.main.setScroll(Math.round(this.view.x), Math.round(this.view.y));
      }
      return;
    }
    if (!this.ready()) return;
    if (down && p.rightButtonDown()) return this.back();
    // The corner buttons are on the screen; everything else is on the table (which may have panned).
    const inside = (b: typeof END) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
    const [wx, wy] = [p.x + this.cameras.main.scrollX, p.y + this.cameras.main.scrollY];
    const onTable = (b: typeof END) => wx >= b.x && wx < b.x + b.w && wy >= b.y && wy < b.y + b.h;
    if (down && inside(END)) return void (!this.aiming && !this.cutting && this.endTurn());
    if (down && inside(UNDO)) return this.undo();
    if (down && inside(VIEW) && this.hasViews()) return this.switchView();
    // Your elite squad, along the bottom (Jack).
    if (down) for (const b of this.eliteBar()) if (inside(b.box)) return void (b.enabled && b.run());
    if (down && inside(POWER) && this.you === 'guard' && !this.fatherPlaying) return this.startCut();
    // The buttons under the circles (a greyed one does nothing).
    if (down) for (const b of this.underButtons()) if (onTable(this.buttonBox(b))) return void (b.enabled && b.run());
    const pool = this.aiming ? this.aiming.dests : this.cutting ? this.cutTargets() : this.sc.board.places;
    const near = pool.find((q) => Math.hypot(q.x - wx, q.y - wy) < 13);
    const over = this.sc.board.places.find((q) => Math.hypot(q.x - wx, q.y - wy) < 13) ?? null;
    if (over !== this.hover?.place) this.hover = over ? { place: over, since: this.time.now } : null;
    const slot = this.eliteBar().find((b) => inside(b.box))?.elite ?? null;
    if (slot !== this.barHover) (this.barHover = slot), this.draw();
    if (near && near !== this.cursor) (this.cursor = near), this.draw();
    if (down) {
      if (near) this.choose(near);
      // Off the places: hold and drag to move round the table; a click without dragging backs out, as ever.
      else if (p.leftButtonDown()) this.drag = { x: p.x, y: p.y, vx: this.view.x, vy: this.view.y, moved: false };
      else this.back();
    }
  }

  private onPointerUp(_p: Phaser.Input.Pointer): void {
    const drag = this.drag;
    this.drag = null;
    if (drag && !drag.moved && this.ready()) this.back();
  }

  /** E or a click: pick up a squad of yours, send the one you've picked there, or cut the power there. */
  private choose(place: RiotPlace): void {
    // Putting in one of your elite squad (Jack): a place next to your base.
    if (this.deploying) {
      const r = this.g.deploy(this.state, this.you, this.deploying, place.id);
      if (!r.events.length) return;
      this.history.push({ orders: [...this.orders], state: this.state });
      this.state = r.state;
      this.orders = this.orders.filter((o) => this.state.squads.some((q) => q.id === o.squad));
      this.deploying = null;
      this.showActs(r.events);
      return this.draw();
    }
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
      // A hero (Jack): a step next to it, then (if it can go on from there) where next; there again, it stops there.
      const via = this.heroVia;
      if (squad.elite === 'hero' && !via && place.id !== squad.place && this.g.near(squad.place, place.id)) {
        const on = this.g.dests(this.state, squad).filter((m) => m !== place.id && m !== squad.place && this.g.near(place.id, m)).map((id) => this.place(id));
        if (on.length && this.g.squadAt(this.state, place.id)?.side !== this.you) {
          this.heroVia = place.id;
          this.aiming = { squad, dests: [place, ...on] };
          this.cursor = on[0]!;
          playMove(this);
          return this.draw();
        }
      }
      this.heroVia = null;
      const split = this.splitting;
      this.splitting = false;
      // (Splitting, onto its own place: no split after all.)
      if (split && place.id === squad.place) return void ((this.aiming = null), this.draw());
      this.history.push({ orders: [...this.orders], state: this.state });
      // A squad's split and its own move are separate orders (the half that stays can go its own way).
      this.orders = this.orders.filter((o) => o.squad !== squad.id || !!o.split !== split);
      if (place.id !== squad.place) {
        // Sent somewhere after all: no longer dug in.
        this.state = this.g.unfortify(this.state, squad.place);
        const o: Order = { squad: squad.id, to: place.id, side: this.you, ...(split ? { split } : {}), ...(via && place.id !== via ? { via } : {}) };
        this.orders.push(o);
      }
      this.aiming = null;
      this.cursor = place;
      playConfirm(this);
      // Split (Jack): the first half's sent; now where the rest goes (its own place: it stays).
      if (split) {
        this.splitRest = true;
        const rest = this.g.dests(this.state, squad).map((id) => this.place(id));
        this.aiming = { squad, dests: [this.place(squad.place), ...rest] };
        this.cursor = this.place(squad.place);
        return this.draw();
      }
      this.splitRest = false;
    } else {
      // (Yours beside the king's guard first: the guard themselves hold where they are, Jack.)
      const by = this.g.besideAt(this.state, place.id);
      const squad = by?.side === this.you && !this.orders.some((o) => o.squad === by.id) ? by : this.g.squadAt(this.state, place.id);
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
      this.splitting = false;
      this.heroVia = null;
      this.splitRest = false;
      const going = this.orders.find((o) => o.squad === squad.id && !o.split);
      this.cursor = going ? this.place(going.to) : round[0] ?? place;
      playMove(this);
    }
    this.draw();
  }

  /**
   * Your elite squad (Jack), along the bottom: each ready (lit), waiting ("Hero 2"), out on the table (amber), or
   * used. Click one (or 1, 2, 3), then a place next to your base; the king's guard goes straight round it.
   */
  private eliteBar(): { elite: Elite; label: string; box: { x: number; y: number; w: number; h: number }; enabled: boolean; state: 'ready' | 'wait' | 'out' | 'used' | 'picked'; run: () => void }[] {
    if (!this.g.rules.elites || this.phase !== 'riot' || this.fatherPlaying) return [];
    const s = this.state;
    let x = 4;
    return ELITES.map((elite) => {
      const name = ELITE_NAMES[this.you][elite];
      // (The king's guard: out only while all three are there; one or two missing, they can be made up: Jack.)
      const short = elite === 'guard3' ? this.g.guardsShort(s, this.you) : 0;
      const some = s.squads.some((q) => q.side === this.you && q.elite === elite);
      const out = elite === 'guard3' ? short <= 0 || (some && !this.g.eliteFree(s, this.you, elite)) : some;
      const used = !out && !this.g.eliteFree(s, this.you, elite);
      const ready = !used && !out && this.g.canDeploy(s, this.you, elite);
      const state = this.deploying === elite ? 'picked' : out ? 'out' : used ? 'used' : ready ? 'ready' : 'wait';
      const again = elite === 'guard3' && some && short > 0 ? `: make up ${short}` : '';
      const label = state === 'wait' ? `${name}${again}: needs a crest` : state === 'used' ? `${name}: used` : state === 'out' ? `${name}: out` : `${name}${again}`;
      const box = { x, y: H - SLOT.h - 4, w: SLOT.w, h: SLOT.h };
      x += SLOT.w + 3;
      const run = () => {
        if (!ready || this.busy) return;
        if (elite === 'guard3') {
          const r = this.g.deploy(this.state, this.you, 'guard3');
          if (!r.events.length) return;
          this.history.push({ orders: [...this.orders], state: this.state });
          this.state = r.state;
          this.orders = this.orders.filter((o) => this.state.squads.some((q) => q.id === o.squad));
          this.showActs(r.events);
        } else {
          this.deploying = this.deploying === elite ? null : elite;
          this.aiming = null;
          playMove(this);
        }
        this.draw();
      };
      return { elite, label, box, enabled: ready && !this.busy, state, run };
    });
  }

  /** Choosing where your hero goes (Jack): what it'll do on the way, and what it'll have left. */
  private heroSum(s: RiotState, hero: RiotSquad, p: RiotPlace, chosen: string | null = null): string {
    const via = chosen && chosen !== p.id ? chosen : chosen === p.id ? null : this.g.via(s, hero, p.id);
    let left = hero.strength;
    const parts: string[] = [];
    for (const step of via ? [via, p.id] : [p.id]) {
      const there = this.g.squadAt(s, step);
      if (!there || there.side === hero.side) continue;
      if (this.g.fortified(s, step) || there.elite === 'hero') {
        parts.push(`${there.strength} can't be attacked`);
        break;
      }
      const need = step === this.g.heart ? there.strength : this.g.defence(s, step, there.strength);
      const stays = step === this.g.heart || step === this.g.lifts;
      if (left > need && !stays) (parts.push(`wipes out ${there.strength}`), (left -= need));
      else if (left >= need) {
        parts.push(`clears ${there.strength}`);
        left -= need;
        break;
      } else {
        parts.push(`${there.strength} down to ${Math.max(1, there.strength - left)}`);
        left = 0;
        break;
      }
    }
    const more = this.heroVia === p.id ? ' (stops here)' : !this.heroVia && this.g.near(hero.place, p.id) && this.aiming?.dests.length ? '. Then pick where next, or here again to stop' : '';
    return `${parts.length ? parts.join(', then ') : 'Goes there'}: ${left > 0 ? `${left} left` : 'spent'}${more}`;
  }

  /**
   * A hero (Jack): a warrior's helmet from the front: a plume arching over the dome, cheek guards down both sides,
   * and a T-shaped opening for the face (its number in it, in white). The bastard's plume is dark.
   */
  private drawHero(g: Phaser.GameObjects.Graphics, p: At, side: Side, dark: boolean): void {
    const body = dark ? (side === 'guard' ? SHADES.cyanDeep : SHADES.amberDeep) : COLOUR[side];
    const plume = side === 'guard' ? [SHADES.white, SHADES.amber] : [SHADES.wood, SHADES.deep];
    g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y - 3, 10).fillRect(p.x - 10, p.y - 3, 21, 14);
    for (let i = -9; i <= 9; i++) {
      const top = p.y - 12 - Math.round(Math.sqrt(Math.max(0, 81 - i * i)) * 0.45);
      g.fillStyle(i % 3 === 0 ? plume[1]! : plume[0]!, 1).fillRect(p.x + i, top, 1, 3); // the plume
    }
    g.fillStyle(body, 1).fillCircle(p.x, p.y - 3, 9).fillRect(p.x - 9, p.y - 3, 19, 13);
    g.fillStyle(SHADES.light, 1).fillRect(p.x - 9, p.y - 7, 19, 1); // the brow
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 7, p.y - 5, 15, 3).fillRect(p.x - 3, p.y - 2, 7, 12); // the T
  }

  /**
   * A side's home base (Jack: it should look like one): the guard's a keep, battlements along the top and a gate;
   * the rising's a camp, a ring of their colour with their banner flying over it (and their fire, behind).
   */
  private drawBase(g: Phaser.GameObjects.Graphics, p: At, side: Side, dark: boolean, poison?: boolean): void {
    const body = poison ? (dark ? SHADES.greenMid : SHADES.green) : dark ? (side === 'guard' ? SHADES.cyanDeep : SHADES.amberDeep) : COLOUR[side];
    if (side === 'guard') {
      g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 11, p.y - 12, 23, 22);
      g.fillStyle(body, 1).fillRect(p.x - 10, p.y - 7, 21, 16);
      for (const dx of [-10, -4, 3, 8]) g.fillRect(p.x + dx, p.y - 11, 3, 4); // the battlements
      g.fillStyle(SHADES.light, 1).fillRect(p.x - 10, p.y - 7, 21, 1);
      g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 2, p.y + 5, 5, 4); // the gate
      g.lineStyle(1, SHADES.white, 1).lineBetween(p.x + 0.5, p.y - 11, p.x + 0.5, p.y - 18); // the flagpole
      g.fillStyle(SHADES.white, 1).fillTriangle(p.x + 1, p.y - 18, p.x + 7, p.y - 16, p.x + 1, p.y - 14);
    } else {
      // Their banner on a tall pole, ragged, planted behind the camp.
      g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 1, p.y - 27, 3, 20);
      g.fillStyle(SHADES.woodPale, 1).fillRect(p.x, p.y - 27, 1, 20);
      g.fillStyle(SHADES.shadow, 1).fillRect(p.x + 1, p.y - 27, 15, 11);
      g.fillStyle(SHADES.amber, 1).fillRect(p.x + 1, p.y - 26, 14, 9);
      g.fillStyle(SHADES.amberDeep, 1).fillRect(p.x + 1, p.y - 21, 14, 2);
      g.fillStyle(SHADES.white, 1).fillRect(p.x + 6, p.y - 24, 4, 2); // (their mark, chalked)
      g.fillStyle(SHADES.shadow, 1).fillTriangle(p.x + 11, p.y - 17, p.x + 15, p.y - 17, p.x + 15, p.y - 21); // (torn)
      g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, 12);
      g.fillStyle(body, 1).fillCircle(p.x, p.y, 11);
      g.lineStyle(1, SHADES.amberDeep, 1).strokeCircle(p.x, p.y, 8);
    }
  }

  /** A crest (Jack): a small gold shield with a white chevron. */
  private drawCrest(g: Phaser.GameObjects.Graphics, p: At, k: number): void {
    const r = (n: number) => Math.round(n * k);
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - r(7), p.y - r(8), r(15), r(10)).fillTriangle(p.x - r(7), p.y + r(2), p.x + r(8), p.y + r(2), p.x + 0.5, p.y + r(10));
    g.fillStyle(SHADES.amber, 1).fillRect(p.x - r(6), p.y - r(7), r(13), r(9)).fillTriangle(p.x - r(6), p.y + r(2), p.x + r(7), p.y + r(2), p.x + 0.5, p.y + r(8));
    g.fillStyle(SHADES.white, 1).fillTriangle(p.x - r(4), p.y + r(1), p.x + 0.5, p.y - r(4), p.x + r(5), p.y + r(1));
    g.fillStyle(SHADES.amber, 1).fillTriangle(p.x - r(2), p.y + r(1), p.x + 0.5, p.y - r(2), p.x + r(3), p.y + r(1));
  }

  /** The maiden (Jack): long fair hair; the witch: long dark hair under a pointed hat. In her side's colour below. */
  private drawMaiden(g: Phaser.GameObjects.Graphics, p: At, side: Side, dark: boolean): void {
    const dress = dark ? (side === 'guard' ? SHADES.cyanDeep : SHADES.amberDeep) : COLOUR[side];
    const hair = side === 'guard' ? SHADES.amber : SHADES.deep;
    g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y + 1, 9);
    g.fillStyle(dress, 1).fillCircle(p.x, p.y + 2, 8); // her dress
    g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y - 4, 6);
    g.fillStyle(hair, 1).fillCircle(p.x, p.y - 5, 5).fillRect(p.x - 5, p.y - 5, 3, 9).fillRect(p.x + 3, p.y - 5, 3, 9); // her hair, long
    g.fillStyle(SHADES.skinFair, 1).fillRect(p.x - 2, p.y - 6, 5, 6); // her face
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 1, p.y - 4, 1, 1).fillRect(p.x + 1, p.y - 4, 1, 1);
    if (side === 'rising') {
      // The witch's hat.
      g.fillStyle(SHADES.shadow, 1).fillTriangle(p.x - 8, p.y - 8, p.x + 9, p.y - 8, p.x + 2, p.y - 20);
      g.fillStyle(SHADES.amberDeep, 1).fillRect(p.x - 4, p.y - 10, 9, 2);
    }
  }

  /**
   * The king's guard (Jack: armoured): a knight's closed steel helm, a slit to see through, a crest in the guard's
   * colour. The barbarians: a horned helmet over wild hair.
   */
  private drawGuardsman(g: Phaser.GameObjects.Graphics, p: At, side: Side, dark: boolean): void {
    g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 9, 17, 19, 4);
    if (side === 'guard') {
      g.fillStyle(dark ? SHADES.deep : SHADES.dim, 1).fillRoundedRect(p.x - 7, p.y - 8, 15, 17, 4); // the helm
      g.fillStyle(SHADES.light, 1).fillRect(p.x - 6, p.y - 7, 2, 9); // light on the steel
      g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 6, p.y - 3, 13, 2); // the slit
      g.fillStyle(dark ? SHADES.cyanDeep : CYAN, 1).fillRect(p.x - 1, p.y - 13, 3, 6); // the crest
    } else {
      g.fillStyle(SHADES.wood, 1).fillRect(p.x - 8, p.y - 1, 17, 10); // wild hair
      g.fillStyle(dark ? SHADES.amberDeep : AMBER, 1).fillCircle(p.x, p.y - 2, 7).fillRect(p.x - 7, p.y - 2, 15, 3); // the helmet
      g.fillStyle(SHADES.light, 1).fillTriangle(p.x - 7, p.y - 3, p.x - 12, p.y - 13, p.x - 4, p.y - 6).fillTriangle(p.x + 7, p.y - 3, p.x + 12, p.y - 13, p.x + 4, p.y - 6); // the horns
    }
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
        // (A hero dug in is crusted: fixed there for the rest of its time, Jack.)
        const [on, off] = q.elite === 'hero' ? ['Crust', 'Uncrust'] : ['Fortify', 'Unfortify'];
        // (Not the maiden: she's left open, Jack. The king's guard are dug in or not by their own clock: no Unfortify, Jack.)
        if (q.elite !== 'maiden' && !(dug && this.isGuardPlace(q.place))) out.push({ place: this.place(q.place), label: dug ? off : ready ? on : `${on} in ${this.g.fortifyIn(s, this.you)}`, enabled: dug || ready, hot: dug, run: () => this.toggleFortify(q) });
        // Split (Jack): not a hero, not a 1, not dug in; once every 3 turns (greyed, with the turns to wait, or
        // "used" once another squad's split this turn).
        if (!q.elite && q.strength >= 2 && !dug && !this.splitRest && !this.heroVia) {
          const half = Math.ceil(q.strength / 2);
          const other = this.orders.some((o) => o.split && o.squad !== q.id);
          const ready = this.g.canSplit(s, this.you) && !other;
          const label = this.splitting ? `${half} | ${q.strength - half}` : ready ? 'Split' : other ? 'Split used' : `Split in ${this.g.splitIn(s, this.you)}`;
          out.push({ place: this.place(q.place), label, enabled: ready || this.splitting, hot: this.splitting, run: () => ((this.splitting = !this.splitting), playMove(this), this.draw()) });
        }
      }
      for (const q of this.g.mine(s, this.you)) {
        if (q.id !== this.aiming?.squad.id && this.g.fortified(s, q.place) && !this.isGuardPlace(q.place)) out.push({ place: this.place(q.place), label: 'Unfortify', enabled: true, hot: true, run: () => this.toggleFortify(q) });
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

  /** One of the king's guard (barbarians) holds it. */
  private isGuardPlace = (place: string): boolean => this.g.squadAt(this.state, place)?.elite === 'guard3';

  /** How wide a button is, for its words (measured once). */
  private buttonWidth(label: string): number {
    let w = this.labelWidths.get(label);
    if (w === undefined) {
      const t = new PixelText(this, 0, 0, label, { color: SHADES.white });
      w = t.width;
      t.destroy();
      this.labelWidths.set(label, w);
    }
    return w + 8;
  }

  /**
   * Where a button sits: under its circle (over it, near the bottom, clear of End turn and Undo); several under
   * one circle (Fortify and Split) side by side.
   */
  private buttonBox(b: { place: RiotPlace; label: string }): { x: number; y: number; w: number; h: number } {
    const row = this.underButtons().filter((x) => x.place === b.place);
    const widths = row.map((x) => this.buttonWidth(x.label));
    const total = widths.reduce((a, w) => a + w, 0) + 2 * (row.length - 1);
    const i = Math.max(0, row.findIndex((x) => x.label === b.label));
    const p = b.place;
    const left = Math.round(Math.max(2, Math.min(W - total - 2, p.x - total / 2)));
    const x = left + widths.slice(0, i).reduce((a, w) => a + w + 2, 0);
    const below = p.y + 14;
    return { x, y: Math.round(below + 11 > this.bh - 17 ? p.y - 25 : below), w: widths[i] ?? this.buttonWidth(b.label), h: 11 };
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

  /** The table has a zoomed in and a zoomed out view (Jack's view mode). */
  private hasViews = (): boolean => this.sc.kind === 'riot' && !!this.sc.views;

  /** View mode (Jack): zoomed in or out, the game carrying on exactly where it was. */
  private switchView(): void {
    if (!this.hasViews() || this.aiming || this.cutting || this.deploying) return;
    const view = this.view_ === 'in' ? 'out' : 'in';
    try {
      localStorage.setItem('clipped-wing:table-view', view);
    } catch {
      // (Not remembered: fine.)
    }
    playConfirm(this);
    this.music.stop();
    this.scene.restart({ ...this.params, view, resume: { state: this.state, orders: this.orders, theirs: this.theirs } } satisfies RiotTableSceneData);
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
    if (this.deploying) this.deploying = null;
    else if (this.cutting) this.cutting = false;
    else if (this.heroVia && this.aiming) {
      // (A hero's first step taken back: choose again.)
      const sq = this.aiming.squad;
      this.heroVia = null;
      this.aiming = null;
      this.cursor = this.place(sq.place);
      return this.choose(this.place(sq.place));
    } else if (this.aiming) {
      this.splitRest = false;
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
    // The cursor moved: bring it into view (only then, so panning with the mouse isn't undone).
    if (!this.busy && this.cursor !== this.looked) {
      this.looked = this.cursor;
      this.lookAt(this.cursor);
    }
    const g = this.gfx.clear();
    const ui = this.ui.clear();
    for (const n of this.numbers) n.destroy();
    this.numbers = [];
    const s = this.state;
    const blink = this.time.now % 800 < 400;
    // The streets.
    for (const [a, b] of this.g.ways(s)) {
      const pa = this.place(a);
      const pb = this.place(b);
      g.lineStyle(3, SHADES.shadow, 0.5).lineBetween(pa.x, pa.y, pb.x, pb.y);
      g.lineStyle(1, SHADES.cyanMid, 0.8).lineBetween(pa.x, pa.y, pb.x, pb.y);
    }
    // The places: a ring in the colour of whoever holds it; the square's barricades; the lifts' foot.
    const sc = this.sc;
    const goalPlace = sc.kind === 'lesson' && this.phase === 'lesson' ? sc.goals[this.goal]?.place : sc.kind === 'duel' ? this.g.lifts : this.phase !== 'lesson' ? this.g.heart : undefined;
    // The three places round each base (Jack): a faint glow in its side's colour.
    if (this.g.rules.elites) for (const side of ['guard', 'rising'] as const) {
      for (const [a, b] of this.g.ways(s)) {
        const home = a === this.g.base(side) ? b : b === this.g.base(side) ? a : null;
        if (!home) continue;
        const p = this.place(home);
        g.lineStyle(3, COLOUR[side], 0.18).strokeCircle(p.x, p.y, 14);
        g.lineStyle(1, COLOUR[side], 0.35).strokeCircle(p.x, p.y, 13);
      }
    }
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
      // A mystery square (Jack): a "?" in a dark tile, or the diviner's eye under a hood; turns left.
      if (s.mystery?.place === p.id) {
        g.lineStyle(1, SHADES.white, blink ? 0.9 : 0.35).strokeCircle(p.x, p.y, blink ? 14 : 12);
        if (s.mystery.mark === 'trickster') {
          // The trickster's mark: two arrows crossing, swapped round.
          g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
          g.fillStyle(SHADES.deep, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 15, 2);
          g.lineStyle(1, SHADES.white, 1).lineBetween(p.x - 5, p.y - 4, p.x + 5, p.y + 4).lineBetween(p.x - 5, p.y + 4, p.x + 5, p.y - 4);
          g.fillStyle(SHADES.amber, 1).fillTriangle(p.x + 6, p.y + 5, p.x + 2, p.y + 5, p.x + 6, p.y + 1).fillTriangle(p.x + 6, p.y - 5, p.x + 2, p.y - 5, p.x + 6, p.y - 1);
        } else if (s.mystery.mark === 'diviner') {
          g.fillStyle(SHADES.shadow, 1).fillTriangle(p.x - 10, p.y + 6, p.x + 11, p.y + 6, p.x + 0.5, p.y - 11);
          g.fillStyle(SHADES.deep, 1).fillTriangle(p.x - 8, p.y + 5, p.x + 9, p.y + 5, p.x + 0.5, p.y - 9);
          g.fillStyle(SHADES.light, 1).fillEllipse(p.x + 0.5, p.y + 1, 10, 5);
          g.fillStyle(SHADES.amber, 1).fillCircle(p.x + 0.5, p.y + 1, 2);
        } else {
          g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
          g.fillStyle(SHADES.deep, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 15, 2);
          const q = new PixelText(this, 0, p.y - 6, '?', { color: SHADES.white, shadow: SHADES.shadow, scale: 2 }).setDepth(5);
          q.setX(Math.round(p.x - q.width / 2 + 1));
          this.numbers.push(q);
        }
        this.numbers.push(new PixelText(this, Math.round(p.x + 9), Math.round(p.y + 6), String(s.mystery.left), { color: SHADES.light, shadow: SHADES.shadow }).setDepth(5));
      }
      // Picking a place (the thief): rings round the ones it can go.
      if (this.picking?.targets.includes(p.id)) g.lineStyle(1, SHADES.white, blink ? 1 : 0.4).strokeCircle(p.x, p.y, 14);
      // A crest (Jack): a gold shield, glowing, and how many turns it has left.
      if (s.crest?.place === p.id) {
        g.lineStyle(1, SHADES.amber, blink ? 0.9 : 0.35).strokeCircle(p.x, p.y, blink ? 14 : 12);
        this.drawCrest(g, p, 1);
        const left = new PixelText(this, Math.round(p.x + 9), Math.round(p.y + 6), String(s.crest.left), { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(5);
        this.numbers.push(left);
      }
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
      // The brothel (Jack): a lit doorway, curtained, and a lantern over it.
      if (s.brothel?.place === p.id) {
        g.lineStyle(1, SHADES.amber, blink ? 0.9 : 0.35).strokeCircle(p.x, p.y, blink ? 14 : 12);
        g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
        g.fillStyle(SHADES.deep, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 15, 2);
        g.fillStyle(SHADES.amberDeep, 1).fillRect(p.x - 3, p.y - 2, 7, 8).fillCircle(p.x + 0.5, p.y - 2, 3.5); // the doorway, lit
        g.fillStyle(SHADES.amberMid, 1).fillRect(p.x - 3, p.y - 2, 2, 8).fillRect(p.x + 2, p.y - 2, 2, 8); // the curtains
        g.fillStyle(blink ? SHADES.amber : SHADES.amberMid, 1).fillCircle(p.x + 0.5, p.y - 8, 2); // the lantern
        this.numbers.push(new PixelText(this, Math.round(p.x + 9), Math.round(p.y + 6), String(s.brothel.left), { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(5));
      }
      // An audience (Jack): a small crowd round a raised figure.
      if (s.audience?.place === p.id) {
        g.lineStyle(1, SHADES.white, blink ? 0.9 : 0.35).strokeCircle(p.x, p.y, blink ? 14 : 12);
        g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
        g.fillStyle(SHADES.deep, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 15, 2);
        g.fillStyle(SHADES.wood, 1).fillRect(p.x - 4, p.y, 9, 2); // the stage
        g.fillStyle(SHADES.white, 1).fillCircle(p.x + 0.5, p.y - 5, 2).fillRect(p.x - 1, p.y - 3, 3, 3); // the speaker
        for (const dx of [-5, -2, 1, 4]) g.fillStyle(SHADES.light, 1).fillCircle(p.x + dx + 0.5, p.y + 5, 1.5); // the crowd
        this.numbers.push(new PixelText(this, Math.round(p.x + 9), Math.round(p.y + 6), String(s.audience.left), { color: SHADES.light, shadow: SHADES.shadow }).setDepth(5));
      }
    }
    // Orders: the other side's (if shown) in their colour; yours in yours; the one you're choosing, blinking.
    // (Clouded judgement, Jack: none of theirs shown.)
    const clouded = this.g.adviceIn(s, this.you, 'cloud') > 0 && !this.fatherPlaying;
    if ((this.phase !== 'now' || this.fatherPlaying) && !clouded) for (const o of this.theirs) this.arrow(g, o, COLOUR[this.g.other(this.you)], true, undefined, undefined, this.g.fortified(s, o.to) && this.g.squadAt(s, o.to)?.side === this.you);
    // The commander's advice (Jack): what they'll do the turn after, faint, from where they'll be.
    if (this.g.adviceIn(s, this.you, 'foresight') > 0 && this.you === 'guard' && !this.fatherPlaying && !clouded) {
      const next = this.nextTheirs();
      for (const o of next.orders) this.arrow(g, o, SHADES.dim, true, undefined, undefined, false, next.plan);
    }
    // Where the square will send a crowd out, at the end of the turn.
    const pour = this.g.rules.muster ? null : this.g.pourTo(s);
    if (pour) {
      const sq = this.g.squadAt(s, this.g.heart);
      if (sq) this.arrow(g, { squad: sq.id, to: pour }, AMBER, true);
    }
    // Yours, numbered in the order they'll happen; a join (into a squad of yours, as it'll be by then) in green.
    let plan = this.state;
    this.orders.forEach((o, i) => {
      const q = plan.squads.find((x) => x.id === o.squad);
      const join = this.g.squadAt(plan, o.to)?.side === this.you;
      if (q && o.squad !== this.aiming?.squad.id) {
        const via = q.elite === 'hero' ? (o.via ?? this.g.via(plan, q, o.to)) : null;
        if (via) this.arrow(g, { squad: o.squad, to: via }, COLOUR[this.you], false, undefined, q.place);
        this.arrow(g, o, join ? SHADES.green : COLOUR[this.you], false, i + 1, via ?? q.place);
        // The maiden going at one of theirs (Jack): "Seduce" over the arrow.
        if (q.elite === 'maiden' && this.g.squadAt(plan, o.to)?.side === this.g.other(this.you)) this.arrowWord(q.place, o.to, 'Seduce');
      }
      plan = this.g.order(plan, o).state;
    });
    if (this.aiming && this.cursor.id !== this.aiming.squad.place) {
      const hero = this.aiming.squad.elite === 'hero';
      const via = !hero ? null : this.heroVia ? (this.cursor.id === this.heroVia ? null : this.heroVia) : this.g.via(this.state, this.aiming.squad, this.cursor.id);
      if (via) this.arrow(g, { squad: this.aiming.squad.id, to: via }, blink ? COLOUR[this.you] : SHADES.white, false);
      this.arrow(g, { squad: this.aiming.squad.id, to: this.cursor.id }, blink ? COLOUR[this.you] : SHADES.white, false, undefined, via ?? undefined);
      if (this.aiming.squad.elite === 'maiden' && this.g.squadAt(this.state, this.cursor.id)?.side === this.g.other(this.you)) this.arrowWord(this.aiming.squad.place, this.cursor.id, 'Seduce');
    }
    // The squads: the guard a blue shield, the rising an amber circle; the number on each.
    for (const q of s.squads) {
      // (Beside the king's guard, Jack: a little down and to the right of them, plainly not one of them.)
      const at = this.place(q.place);
      const p = q.beside ? { ...at, x: at.x + 14, y: at.y + 10 } : at;
      // The plague on it (Jack): a sickly green, dripping, and a small skull at its shoulder.
      const sick = this.plagued(q);
      const col = sick ? SHADES.greenMid : COLOUR[q.side];
      const dark = s.cut === q.place;
      const stuck = (q.stuck ?? -1) >= s.turn;
      if (stuck) this.drawBrothel(g, p, blink);
      // The Lord's judgement (Jack): a gold halo over the blessed; a dark cloud over the cursed.
      const fav = this.g.favour(s, q.side);
      if (fav > 0) g.lineStyle(1, SHADES.amber, 0.9).strokeEllipse(p.x + 0.5, p.y - 12, 12, 4);
      if (fav < 0) g.fillStyle(SHADES.shadow, 0.8).fillEllipse(p.x - 2, p.y - 13, 10, 5).fillEllipse(p.x + 3, p.y - 14, 10, 5);
      if (q.elite === 'maiden') this.drawMaiden(g, p, q.side, dark);
      else if (q.elite === 'guard3') this.drawGuardsman(g, p, q.side, dark);
      else if (q.elite === 'hero') this.drawHero(g, p, q.side, dark);
      else if (!q.beside && q.place === this.g.base(q.side)) this.drawBase(g, p, q.side, dark, q.poison);
      else if (q.side === 'guard') {
        g.fillStyle(SHADES.shadow, 1).fillRoundedRect(p.x - 8, p.y - 8, 17, 17, 3);
        g.fillStyle(q.poison ? (dark ? SHADES.greenMid : SHADES.green) : dark ? SHADES.cyanDeep : col, 1).fillRoundedRect(p.x - 7, p.y - 7, 15, 13, 2);
        if (sick) g.fillStyle(SHADES.greenDeep, 1).fillRect(p.x - 7, p.y + 1, 15, 2);
        g.fillTriangle(p.x - 7, p.y + 5, p.x + 8, p.y + 5, p.x + 0.5, p.y + 9);
      } else {
        g.fillStyle(SHADES.shadow, 1).fillCircle(p.x, p.y, 8);
        g.fillStyle(q.poison ? (dark ? SHADES.greenMid : SHADES.green) : dark ? SHADES.amberDeep : col, 1).fillCircle(p.x, p.y, 7);
        if (sick) g.fillStyle(SHADES.greenDeep, 1).fillRect(p.x - 5, p.y + 2, 11, 2);
      }
      if (sick) this.drawSkull(g, { x: p.x + 10, y: p.y - 11 });
      // Been to the brothel (Jack): a lantern while it's stuck there; a little gold star once it's in fine spirits.
      if (!stuck && q.cheer) {
        g.fillStyle(SHADES.amber, 1).fillTriangle(p.x - 13, p.y - 9, p.x - 7, p.y - 9, p.x - 10, p.y - 14).fillTriangle(p.x - 13, p.y - 12, p.x - 7, p.y - 12, p.x - 10, p.y - 7);
      }
      if (this.aiming?.squad.id === q.id) g.lineStyle(1, SHADES.white, 1).strokeCircle(p.x, p.y, 11);
      // Dug in (fortify): a wall of blocks round it.
      if (this.g.fortified(s, q.place) && !q.beside) for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        g.fillStyle(SHADES.shadow, 1).fillRect(Math.round(p.x + Math.cos(ang) * 12) - 2, Math.round(p.y + Math.sin(ang) * 12) - 2, 4, 4);
        g.fillStyle(SHADES.light, 1).fillRect(Math.round(p.x + Math.cos(ang) * 12) - 1, Math.round(p.y + Math.sin(ang) * 12) - 1, 3, 3);
      }
      const lit = q.elite === 'hero' || q.elite === 'guard3';
      const n = new PixelText(this, 0, q.elite === 'hero' ? p.y - 1 : q.elite === 'maiden' ? p.y + 4 : q.elite === 'guard3' ? p.y + 1 : p.y - 4, String(q.strength), { color: lit ? SHADES.white : SHADES.shadow }).setDepth(5);
      // The elite squad: how many turns left, as pips under it (Jack).
      if (q.elite && q.until !== undefined) for (let i = 0; i <= q.until - s.turn; i++) g.fillStyle(SHADES.white, 1).fillRect(Math.round(p.x - 6 + i * 4), p.y + 12, 2, 2);
      // A hero picked up: a reminder it goes two streets (Jack).
      if (q.elite === 'hero' && this.aiming?.squad.id === q.id) {
        const m = new PixelText(this, 0, p.y - 30, '2 moves', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(10);
        m.setX(Math.round(p.x - m.width / 2));
        this.numbers.push(m);
      }
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
    const bg = this.buttonGfx.clear();
    for (const b of this.underButtons()) {
      const box = this.buttonBox(b);
      bg.fillStyle(!b.enabled ? SHADES.deep : b.hot ? SHADES.amberDeep : SHADES.cyanDeep, 1).fillRect(box.x, box.y, box.w, box.h);
      bg.lineStyle(1, b.enabled ? SHADES.light : SHADES.dim, 1).strokeRect(box.x, box.y, box.w, box.h);
      this.numbers.push(new PixelText(this, box.x + 4, box.y + 2, b.label, { color: b.enabled ? SHADES.white : SHADES.dim, shadow: SHADES.shadow }).setDepth(10));
    }
    // Your elite squad, along the bottom (Jack), fixed to the screen while the table pans.
    const eb = this.ui;
    for (const b of this.eliteBar()) {
      const fill = { ready: SHADES.cyanDeep, picked: SHADES.amberDeep, out: SHADES.amberDeep, wait: SHADES.deep, used: SHADES.shadow }[b.state];
      const lit = b.state === 'ready' || b.state === 'picked';
      eb.fillStyle(fill, 1).fillRect(b.box.x, b.box.y, b.box.w, b.box.h);
      eb.lineStyle(1, lit || this.barHover === b.elite ? SHADES.light : SHADES.dim, 1).strokeRect(b.box.x, b.box.y, b.box.w, b.box.h);
      // Its emblem: the piece itself, darkened while it waits or once it's used.
      const at = { x: b.box.x + Math.floor(b.box.w / 2), y: b.box.y + 17 };
      if (b.elite === 'hero') this.drawHero(bg, at, this.you, !lit && b.state !== 'out');
      else if (b.elite === 'maiden') this.drawMaiden(bg, at, this.you, !lit && b.state !== 'out');
      else this.drawGuardsman(bg, at, this.you, !lit && b.state !== 'out');
      if (b.state === 'used' || b.state === 'wait') eb.fillStyle(SHADES.shadow, 0.55).fillRect(b.box.x + 1, b.box.y + 1, b.box.w - 2, b.box.h - 2);
      if (b.state === 'used') eb.lineStyle(2, SHADES.dim, 1).lineBetween(b.box.x + 3, b.box.y + 3, b.box.x + b.box.w - 3, b.box.y + b.box.h - 3);
      // Its key, in the corner.
      this.numbers.push(new PixelText(this, b.box.x + 2, b.box.y + 2, String(ELITES.indexOf(b.elite) + 1), { color: lit ? SHADES.white : SHADES.dim, shadow: SHADES.shadow }).setDepth(10).setScrollFactor(0));
      // Its name, beside the bar, under the mouse or picked.
      if (this.barHover === b.elite || b.state === 'picked') this.numbers.push(new PixelText(this, 4 + ELITES.length * (SLOT.w + 3) + 2, b.box.y + 19, b.label, { color: SHADES.white, shadow: SHADES.shadow }).setDepth(10).setScrollFactor(0));
    }
    // The crests you hold (Jack), beside the bar.
    const held = this.g.rules.elites && this.phase === 'riot' && !this.fatherPlaying ? s.elites[this.you].crests : 0;
    if (held) {
      const at = { x: 4 + ELITES.length * (SLOT.w + 3) + 7, y: H - SLOT.h + 4 };
      this.drawCrest(bg, at, 0.8);
      this.numbers.push(new PixelText(this, at.x + 9, at.y - 3, `x${held}`, { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(10).setScrollFactor(0));
    }
    if (this.deploying) for (const id of this.g.deployPlaces(s, this.you, this.deploying)) g.lineStyle(1, SHADES.white, blink ? 1 : 0.4).strokeCircle(this.place(id).x, this.place(id).y, 14);
    // The buttons.
    const idle = !this.busy && !this.aiming && !this.cutting;
    ui.fillStyle(idle ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(END.x, END.y, END.w, END.h);
    ui.lineStyle(1, idle ? CYAN : SHADES.dim, 1).strokeRect(END.x, END.y, END.w, END.h);
    this.endButton.setColor(idle ? SHADES.white : SHADES.dim);
    const canUndo = !this.busy && this.history.length > 0;
    ui.fillStyle(canUndo ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(UNDO.x, UNDO.y, UNDO.w, UNDO.h);
    ui.lineStyle(1, canUndo ? CYAN : SHADES.dim, 1).strokeRect(UNDO.x, UNDO.y, UNDO.w, UNDO.h);
    this.undoButton.setColor(canUndo ? SHADES.white : SHADES.dim);
    if (this.you === 'guard' && !this.fatherPlaying) {
      const canCut = !this.busy && !this.aiming && this.g.canCut(s);
      ui.fillStyle(this.cutting ? SHADES.amberDeep : canCut ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(POWER.x, POWER.y, POWER.w, POWER.h);
      ui.lineStyle(1, canCut || this.cutting ? CYAN : SHADES.dim, 1).strokeRect(POWER.x, POWER.y, POWER.w, POWER.h);
      this.powerButton.setText(s.cut ? 'Power cut' : this.cutting ? 'Cut: where?' : this.g.canCut(s) ? 'Cut power' : `Power in ${this.g.cutIn(s)}`).setColor(canCut || this.cutting ? SHADES.white : SHADES.dim);
    } else this.powerButton.setText('');
    if (this.hasViews()) {
      ui.fillStyle(idle ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      ui.lineStyle(1, idle ? CYAN : SHADES.dim, 1).strokeRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      this.viewButton.setText(`View: zoomed ${this.view_ === 'in' ? 'in' : 'out'}`).setColor(idle ? SHADES.white : SHADES.dim);
    }
    // The words: the note in the corner, and the card by the cursor.
    this.chip.setText(this.chipText());
    this.drawCard();
    this.drawLife();
  }

  private chipText(): string {
    const sc = this.sc;
    if (this.picking) return this.picking.prompt;
    if (this.fatherPlaying) return 'Your father has the table.';
    if (sc.kind === 'lesson') return this.phase === 'lesson' ? `Take ${lower(this.place(sc.goals[this.goal]?.place ?? this.g.heart).name)}.` : 'Hold the square.';
    const left = this.g.rules.dawn - this.state.turn + 1;
    if (this.splitRest) return 'Split: now where does the rest go? (Its own place: they stay.)';
    if (this.heroVia) return 'Then where? (Click there again to stop there.)';
    const plague = this.state.plague?.[this.you] ?? 0;
    const st = this.state;
    const morale = this.g.moraleOf(st, this.you);
    const out = this.g.outputOf(st, this.you);
    const [fore, cloud] = [this.g.adviceIn(st, this.you, 'foresight'), this.g.adviceIn(st, this.you, 'cloud')];
    const extra = (plague ? ` Plague: ${plague} more ${plague === 1 ? 'turn' : 'turns'}.` : '')
      + (morale ? ` Morale ${morale > 0 ? '+' : ''}${Math.round(morale * 100)}%.` : '')
      + (out ? ` Bases ${out > 0 ? '+' : ''}${out} a turn.` : '')
      + (fore ? ` Seeing ahead: ${fore}.` : '') + (cloud ? ` Clouded: ${cloud}.` : '')
      + (this.g.favour(st, this.you) ? ` ${this.g.favour(st, this.you) > 0 ? 'Blessed' : 'Cursed'}: ${this.judgedIn(st)}.` : '');
    const sick = extra ? `\n${extra.trim()}` : '';
    if (sc.kind === 'duel') return `Take his camp. Turn ${this.state.turn}.${sick}`;
    // The skirmish (Jack): no dawn; the turn, and the next shake-up.
    if (sc.kind === 'riot' && sc.skirmish) {
      const k = this.g.shakeIn(this.state);
      return `Turn ${this.state.turn}. Shake-up ${k === 1 ? 'this turn' : `in ${k} turns`}.${sick}`;
    }
    return `Dawn in ${left} ${left === 1 ? 'turn' : 'turns'}.${sick}`;
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
    const [vx, vy] = [this.view.x, this.view.y];
    const x = p.x + 18 + w < vx + W - 4 ? p.x + 18 : p.x - 18 - w;
    let y = Math.max(vy + 4, Math.min(vy + H - h - 20, p.y - 10));
    // Out of the way of the buttons under the circles: above them, or below.
    const hits = (yy: number) => this.underButtons().some((b) => {
      const r = this.buttonBox(b);
      return x < r.x + r.w && x + w > r.x && yy < r.y + r.h && yy + h > r.y;
    });
    if (hits(y)) {
      const above = Math.max(vy + 4, Math.min(...this.underButtons().map((b) => this.buttonBox(b).y)) - h - 2);
      y = !hits(above) ? above : Math.min(vy + H - h - 20, Math.max(...this.underButtons().map((b) => this.buttonBox(b).y + 13)));
    }
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
    const whole = s.squads.find((q) => q.id === this.aiming!.squad.id) ?? this.aiming!.squad;
    // Splitting (Jack): the bigger half goes first, then the rest.
    const half = this.splitting ? Math.ceil(whole.strength / 2) : this.splitRest ? whole.strength - Math.ceil(whole.strength / 2) : whole.strength;
    const aim = { ...whole, strength: half };
    const lead = this.splitting ? `Split: ${half} go, ${whole.strength - half} stay. ` : this.splitRest ? `The rest, ${half}: ` : '';
    // Both going for the same empty place (Jack): a race for what's on it, or, the same size, a clash there.
    const rival = !there && p.id !== aim.place ? this.g.rivalFor(s, aim, p.id, this.theirs) : null;
    if (rival && this.g.rules.clash) {
      const what = this.g.tokenAt(s, p.id);
      const odds = Math.round(this.g.clashOdds(s, aim, p.id, rival).chance * 100);
      if (what) return `${lead}Race! They're going for it too: ${odds}% to get there first. The loser stays put.`;
      if (rival.strength === aim.strength && aim.elite !== 'maiden' && !this.splitting) return `${lead}Clash! They're going there too, ${aim.strength} each: ${odds}% to win. Winner has it, 1 to 3 left.`;
    }
    // A clash (Jack): they're coming straight at it with the same number.
    if (!this.splitting && this.g.clashWith(s, aim, p.id, this.theirs)) {
      const odds = this.g.clashOdds(s, aim, p.id);
      const pc = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n * 100)}%`;
      return [`Clash! ${Math.round(odds.chance * 100)}% to win`, ...odds.parts.map((x) => `${x.what} ${pc(x.by)}`), 'Winner takes the loser\u2019s place, 1 to 3 left'].join('\n');
    }
    if (aim.elite === 'hero' && p.id !== aim.place) return this.heroSum(s, aim, p, this.heroVia);
    if (p.id === aim.place) return this.splitting ? 'Split: pick where half goes' : this.splitRest ? `The rest, ${half}, stay here` : this.g.fortified(s, p.id) ? 'Hold, dug in' : 'Hold';
    const tok = this.g.tokenAt(s, p.id);
    const rumble = tok ? `, and ${{ rumble: 'set off the rumble', crest: 'the crest', mystery: 'the mystery', brothel: 'the brothel (stuck a turn, then +15% in a clash)', audience: 'the audience' }[tok]}` : '';
    if (!there) return `${lead}Take it${rumble}`;
    if (there.side !== aim.side && aim.elite === 'maiden') return `Seduce: ${there.elite === 'hero' ? `their ${ELITE_NAMES[there.side].hero.toLowerCase()} becomes your ${ELITE_NAMES[aim.side].hero.toLowerCase()}` : `their ${there.strength} are yours`}, and she's gone`;
    if (there.side !== aim.side && there.elite === 'guard3') return `Their ${ELITE_NAMES[there.side].guard3.toLowerCase()}: only your ${ELITE_NAMES[aim.side].hero.toLowerCase()} can hurt them`;
    if (there.side === aim.side && aim.elite === 'maiden') return `Merge: ${aim.strength + there.strength}, poisoned (${this.critChance()} chance of a critical hit)`;
    if (there.side === aim.side && there.elite === 'guard3') return `${lead}Stand beside the ${ELITE_NAMES[there.side].guard3}: they take any attack first`;
    if (there.side === aim.side) return `${lead}Join: ${aim.strength + there.strength}, then send them on`;
    const a = this.g.attack(aim.place, p.id, aim.strength);
    const d = this.g.defence(s, p.id, this.g.heldBy(s, p.id));
    if (this.g.fortified(s, p.id)) return "They're dug in: no attack this turn";
    if (there.elite === 'hero') return `Their ${ELITE_NAMES[there.side].hero.toLowerCase()}: nothing can attack it`;
    // Their base, with exactly its number (Jack): the final clash.
    if (this.g.rules.clash && !aim.elite && p.id === this.g.base(there.side) && aim.strength === this.g.heldBy(s, p.id)) {
      const odds = Math.round(this.g.clashOdds(s, aim, p.id, there).chance * 100);
      return `${lead}Final clash! ${aim.strength} against ${aim.strength}: ${odds}% to win. Win and it's yours, 1 to 3 left; lose and they hold.`;
    }
    // Their number as it shows on the circle, and the barricades (or the power cut) beside it; match the square's
    // number and you take it (Jack), keeping what's over after the barricades, at least 1.
    const n = this.g.heldBy(s, p.id);
    const vs = `${a} v ${n}${d > n ? (this.sc.kind === 'duel' ? ' (+1 walls)' : ' (+1 barricades)') : d < n ? ' (no power: -1)' : ''}`;
    const crit = aim.poison ? ` (poisoned: ${this.critChance()} chance of a critical hit)` : '';
    if (a > d || (p.id === this.g.heart && a >= n)) return `${lead}${vs}: you take it, ${Math.max(1, a - d)} left${rumble}${crit}`;
    return lead + (a === d ? `${vs}: a tie, they hold` : `${vs}: they hold`) + crit;
  }

  /** A poisoned squad's chance of a critical hit, as a percentage. */
  private critChance(): string {
    return `${Math.round((this.g.rules.elites?.crit.chance ?? 0) * 100)}%`;
  }

  /** What's at a place: its name, whose, how strong, and anything special about it. */
  private placeText(p: RiotPlace): string {
    const s = this.state;
    const there = this.g.squadAt(s, p.id);
    const duel = this.sc.kind === 'duel';
    const whose = (side: Side) => (duel ? (side === this.you ? 'Your garrison' : 'His army') : side === this.you ? (side === 'guard' ? 'Your guard' : 'Your people') : side === 'guard' ? 'The guard' : 'The rising');
    const lines = [p.name];
    if (there) lines.push(`${whose(there.side)}, ${there.strength}`);
    const by = this.g.besideAt(s, p.id);
    if (by) lines.push(`Beside them: ${whose(by.side).toLowerCase()}, ${by.strength}, passing through (hit only once the ${ELITE_NAMES[by.side].guard3} are gone)`);
    if (there?.elite) {
      const left = (there.until ?? s.turn) - s.turn + 1;
      const name = ELITE_NAMES[there.side][there.elite];
      const what = there.elite === 'hero'
        ? `${there.strength} to deal out. Nothing can attack it. Two streets a turn.${there.crusted ? ' Crusted: fixed here.' : ''}`
        : there.elite === 'maiden' ? `Moved onto one of theirs next to her (${this.g.rules.elites?.maiden.seduceMax ?? 3} or fewer, or their ${ELITE_NAMES[this.g.other(there.side)].hero.toLowerCase()}), she seduces it; or she merges into one of hers, poisoning it.` : `Holds where it is. Digs in for 2 turns. Only their ${ELITE_NAMES[this.g.other(there.side)].hero.toLowerCase()} can hurt them. Yours can stand beside them.`;
      lines.push(`${name}: ${what}${there.until === undefined ? '' : ` ${left} ${left === 1 ? 'turn' : 'turns'} left.`}`);
    }
    if (there?.poison) {
      const c = this.g.rules.elites?.crit;
      lines.push(`Poisoned: attacking, a ${this.critChance()} chance of a critical hit (${Math.round((c?.least ?? 0) * 100)} to ${Math.round((c?.most ?? 0) * 100)}% more).`);
    }
    if (s.mystery?.place === p.id) lines.push(s.mystery.mark === 'trickster' ? `The trickster: first here changes every street on the table. (${s.mystery.left} ${s.mystery.left === 1 ? 'turn' : 'turns'} left)` : s.mystery.mark === 'diviner' ? `The diviner: first here draws one of three cards. (${s.mystery.left} ${s.mystery.left === 1 ? 'turn' : 'turns'} left)` : `A mystery: first here finds out. A diviner, a thief, the trickster, or the plague. (${s.mystery.left} ${s.mystery.left === 1 ? 'turn' : 'turns'} left)`);
    if (there && (there.stuck ?? -1) >= s.turn) lines.push('At the brothel: stuck here this turn.');
    else if (there?.cheer) lines.push(`In fine spirits: +${Math.round((this.g.rules.brothel?.boost ?? 0) * 100)}% in its next clash.`);
    if (there && this.plagued(there)) lines.push('The plague: -1 a turn.');
    if (s.brothel?.place === p.id) lines.push(`A brothel: first here is stuck here next turn (and can be attacked), then +${Math.round((this.g.rules.brothel?.boost ?? 0) * 100)}% in its next clash. (${s.brothel.left} ${s.brothel.left === 1 ? 'turn' : 'turns'} left)`);
    if (s.audience?.place === p.id) lines.push(`An audience: first here hears the accountant, the townsfolk or the commander. It can go well, or badly. (${s.audience.left} ${s.audience.left === 1 ? 'turn' : 'turns'} left)`);
    if (s.crest?.place === p.id) lines.push(`A crest: whoever gets here first can put in one of their elite squad. (${s.crest.left} ${s.crest.left === 1 ? 'turn' : 'turns'} left)`);
    if (p.heart) lines.push(duel ? `Your keep. Walls +1. Each turn ${this.g.rules.muster} new men come out onto a road next to it, unless he holds them all. Lose it and you've lost.` : `Barricades +1. Grows 1 a turn; over ${this.g.style.pourAbove}, sends crowds out.`);
    if (p.lifts) lines.push(duel ? `His camp. Each turn ${this.g.rules.muster} new men come out of it, unless you hold every road round it. Take it and you've won.` : `The guard get +${this.g.rules.reinforce} here each turn.`);
    if (s.cut === p.id) lines.push('No power this turn.');
    if (this.g.fortified(s, p.id)) lines.push('Dug in: nobody can attack it this turn.');
    if (s.rumble?.place === p.id) lines.push(`A rumble: whoever gets here first sets it off. Everyone next to it takes 1 to 3. (${s.rumble.left} ${s.rumble.left === 1 ? 'turn' : 'turns'} left)`);
    return lines.join('\n');
  }

  /** Turns left of the Lord's judgement on your side. */
  private judgedIn(s: RiotState): number {
    return Math.max(0, ...(s.moods ?? []).filter((m) => m.side === this.you && (m.kind === 'blessed' || m.kind === 'cursed')).map((m) => m.until - s.turn + 1));
  }

  /**
   * The brothel round a squad that's in it (Jack: the icon still there, the squad sitting within): a little house
   * with a lit doorway, curtains, and its lantern.
   */
  private drawBrothel(g: Phaser.GameObjects.Graphics, p: At, blink: boolean): void {
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 13, p.y - 12, 27, 25).fillTriangle(p.x - 15, p.y - 11, p.x + 16, p.y - 11, p.x + 0.5, p.y - 20);
    g.fillStyle(SHADES.deep, 1).fillRect(p.x - 12, p.y - 11, 25, 23).fillTriangle(p.x - 13, p.y - 11, p.x + 14, p.y - 11, p.x + 0.5, p.y - 18);
    g.fillStyle(SHADES.amberDeep, 1).fillRect(p.x - 10, p.y - 10, 21, 21); // the lit doorway
    g.fillStyle(SHADES.amberMid, 1).fillRect(p.x - 10, p.y - 10, 3, 21).fillRect(p.x + 8, p.y - 10, 3, 21); // the curtains
    g.fillStyle(blink ? SHADES.amber : SHADES.amberMid, 1).fillCircle(p.x + 0.5, p.y - 14, 2); // the lantern
  }

  /** A squad the plague's on (Jack): its side's, not its base, not one of the elite squad. */
  private plagued(q: RiotSquad): boolean {
    return (this.state.plague?.[q.side] ?? 0) > 0 && q.place !== this.g.base(q.side) && !q.elite;
  }

  /** A small skull (the plague, Jack), like an exponent beside the squad. */
  private drawSkull(g: Phaser.GameObjects.Graphics, p: At): void {
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 3, p.y - 3, 7, 8);
    g.fillStyle(SHADES.light, 1).fillRect(p.x - 2, p.y - 2, 5, 4).fillRect(p.x - 1, p.y + 2, 3, 2);
    g.fillStyle(SHADES.shadow, 1).fillRect(p.x - 1, p.y - 1, 1, 1).fillRect(p.x + 1, p.y - 1, 1, 1);
    g.fillStyle(SHADES.greenMid, 1).fillRect(p.x - 2, p.y + 1, 1, 1);
  }

  /** A word over an arrow (the maiden's "Seduce", Jack). */
  private arrowWord(from: string, to: string, word: string): void {
    const [a, b] = [this.place(from), this.place(to)];
    const t = new PixelText(this, 0, Math.round((a.y + b.y) / 2 - 12), word, { color: SHADES.white, shadow: SHADES.shadow }).setDepth(10);
    t.setX(Math.round((a.x + b.x) / 2 - t.width / 2));
    this.numbers.push(t);
  }

  /** What they'll do the turn after this one (the commander's advice): this turn played out as ordered, then theirs. */
  private nextTheirs(): { orders: Order[]; plan: RiotState } {
    const key = `${this.state.turn}:${this.state.nextId}:${JSON.stringify(this.orders)}:${JSON.stringify(this.theirs)}`;
    if (this.ahead?.key !== key) {
      const plan = this.g.turn(this.state, this.orders, this.theirs).state;
      this.ahead = { key, plan, orders: this.g.outcome(plan) ? [] : this.g.risingOrders(plan) };
    }
    return this.ahead;
  }

  /** An order's arrow. `blocked`: at a squad that's dug in, so it won't happen (crossed out at the end). */
  private arrow(g: Phaser.GameObjects.Graphics, o: Order, col: number, dashed: boolean, n?: number, from?: string, blocked = false, state = this.state): void {
    const q = state.squads.find((x) => x.id === o.squad);
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
    // Poisoned (Jack): green bubbles rising off it and popping.
    for (const q of this.state.squads) if (q.poison && this.t % 2 === 0) {
      const p = this.place(q.place);
      this.bubbles.push({ x: p.x - 5 + ((this.t * 5 + p.x) % 11), y: p.y - 6, life: 10 + (this.t % 5), r: this.t % 3 === 0 ? 2 : 1 });
    }
    for (const b of this.bubbles) {
      b.y -= 0.8;
      b.x += Math.sin((b.y + this.t) / 3) * 0.4;
      b.life--;
      if (b.life > 1) g.lineStyle(1, SHADES.green, 0.9).strokeCircle(Math.round(b.x), Math.round(b.y), b.r);
      else g.fillStyle(SHADES.greenMid, 0.8).fillRect(Math.round(b.x) - 1, Math.round(b.y), 3, 1); // (pop)
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0);
    // The plague (Jack): green drips falling off each squad it's on.
    for (const q of this.state.squads) if (this.plagued(q) && this.t % 3 === 0) {
      const p = this.place(q.place);
      this.drips.push({ x: p.x - 5 + ((this.t * 7 + p.y) % 11), y: p.y + 6, life: 7 });
    }
    for (const d of this.drips) {
      d.y += 1;
      d.life--;
      g.fillStyle(d.life > 3 ? SHADES.greenMid : SHADES.greenDeep, 1).fillRect(Math.round(d.x), Math.round(d.y), 1, d.life > 4 ? 2 : 1);
    }
    this.drips = this.drips.filter((d) => d.life > 0);
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
/** What the table's painted as: a district, the crag, or (the duel, for fun) a rainforest or a space station. */
type TableLook = 'low' | 'promenade' | 'castle' | 'forest' | 'station';

function duelLook(map: string): TableLook {
  return map === 'forest' ? 'forest' : map === 'station' ? 'station' : 'castle';
}

/** How far a pixel is from the nearest street or place on the board (for painting them lit). */
function roadDistance(board: RiotBoard): (x: number, y: number) => number {
  const pos = new Map(board.places.map((p) => [p.id, p]));
  const segs = board.ways.map(([a, b]) => [pos.get(a)!, pos.get(b)!] as const);
  return (x, y) => {
    let d = Infinity;
    for (const [a, b] of segs) {
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
      d = Math.min(d, Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t)));
    }
    for (const p of board.places) d = Math.min(d, Math.hypot(x - p.x, y - p.y) - 8);
    return d;
  };
}

const hash = (a: number, b: number) => (((a * 73856093) ^ (b * 19349663)) >>> 0);
/** The table's own light over a picture: scan lines, and darker towards the edges. */
const tableLight = (x: number, y: number, bw: number, bh: number) => (y % 3 === 0 ? 0.8 : 1) * Math.min(1, 0.45 + Math.min(x, bw - x, y, bh - y) / 40);
const scale = (c: number, k: number): RGB => rgb(c).map((v) => v * k) as unknown as RGB;

/**
 * A rainforest, from above: the canopy crowns packed close, lit on top and dark between, with paths of earth
 * worn through it where the streets are, and here and there a river's glint. (The duel, if you choose it.)
 */
function forestPainter(board: RiotBoard, bw: number, bh: number): (x: number, y: number) => PixelColour {
  const road = roadDistance(board);
  return (x, y) => {
    const k = tableLight(x, y, bw, bh) * 0.85;
    const d = road(x, y);
    if (d < 3) return scale(SHADES.woodLight, k * 0.75);
    if (d < 5) return scale(SHADES.wood, k);
    // The nearest crown, on a jittered grid.
    const cell = 11;
    let best = Infinity;
    let r = 0;
    let dx = 0;
    let dy = 0;
    const [cx, cy] = [Math.floor(x / cell), Math.floor(y / cell)];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const h = hash(cx + i, cy + j);
      const tx = (cx + i) * cell + (h % cell);
      const ty = (cy + j) * cell + ((h >> 4) % cell);
      const dist = Math.hypot(x - tx, y - ty);
      if (dist < best) [best, r, dx, dy] = [dist, 5 + ((h >> 8) % 4), x - tx, y - ty];
    }
    if (best > r) return scale(SHADES.shadow, k);
    // Lit from the top left.
    const lit = -(dx + dy) / (r * 1.4);
    if (lit > 0.35) return scale(SHADES.green, k * 0.8);
    if (lit > -0.3) return scale(SHADES.greenMid, k);
    return scale(SHADES.greenDeep, k);
  };
}

/**
 * A space station, from above: hull plates riveted in a grid, seams of cyan light, the corridors lit where the
 * streets are, small amber lamps, and the stars at its edges. (The duel, if you choose it.)
 */
function stationPainter(board: RiotBoard, bw: number, bh: number): (x: number, y: number) => PixelColour {
  const road = roadDistance(board);
  return (x, y) => {
    const k = tableLight(x, y, bw, bh);
    const edge = Math.min(x, bw - x, y, bh - y);
    // Space round the hull.
    if (edge < 14) return hash(x, y) % 97 === 0 ? scale(SHADES.white, 0.8) : scale(SHADES.shadow, 1);
    if (edge < 16) return scale(SHADES.cyanMid, k);
    const d = road(x, y);
    if (d < 2) return scale(SHADES.light, k * 0.8);
    if (d < 4) return scale(SHADES.cyanMid, k);
    if (d < 6) return scale(SHADES.deep, k);
    const plate = 18;
    const [gx, gy] = [x % plate, y % plate];
    if (gx === 0 || gy === 0) return scale(SHADES.cyanDeep, k);
    const h = hash(Math.floor(x / plate), Math.floor(y / plate));
    if ((gx === 2 || gx === plate - 2) && (gy === 2 || gy === plate - 2)) return scale(SHADES.dim, k);
    if (h % 9 === 0 && gx > 6 && gx < 11 && gy > 6 && gy < 11) return scale(gx === 8 && gy === 8 ? SHADES.amber : SHADES.amberDeep, k);
    return scale(h % 3 === 0 ? SHADES.dim : SHADES.deep, k * (0.7 + (h % 5) * 0.06));
  };
}

function districtPainter(board: RiotBoard, district: 'low' | 'promenade' | 'castle', bw = W, bh = H): (x: number, y: number) => PixelColour {
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
    const edge = Math.min(x, bw - x, y, bh - y) / 40;
    lum *= Math.min(1, 0.4 + edge) * 0.75;
    const t = Math.min(2.999, lum * 4);
    const i = Math.floor(t);
    const k = t - i;
    const a = steps[i]!;
    const b = steps[i + 1]!;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
}
