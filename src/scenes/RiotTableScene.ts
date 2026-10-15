import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { RIOTS, type RiotScenario } from '../data/warTable';
import { getSession } from '../session';
import { RIOT_RULES, RiotGame, SQUAD_KINDS, type RiotAction, type RiotBoard, type RiotPlace, type RiotSquad, type RiotState, type Spread } from '../systems/Riot';
import { careful } from '../systems/RiotPlayers';
import { DialogueBox } from '../ui/DialogueBox';
import { rgb, SHADES, type PixelColour, type RGB } from '../ui/pixelArt';
import { makePaintedTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import { startTableMusic, type TableMusic } from '../ui/tableMusic';
import type { AreaSceneData } from './AreaScene';
import type { CombatSceneData } from './CombatScene';

// The riot on the war table (Chapter 3, Day 4): the game in src/systems/Riot.ts, designed by simulated play
// (docs/sequences/chapter-3/war-table.md). Nobody tells you how to play (designer): the screen does.
//
// The district that's risen, close up, as a street plan in light, and it looks like a riot (designer): crowds
// of tiny people in every street, more the angrier it is, jostling; where it's burning, fire and smoke and
// embers drifting; the square behind its barricades; the guard in ranks of pikes and shields, one figure for
// each of their strength. Everything the rising will do this turn is shown first: amber arrows where the
// fires will spread, and streets about to catch pulsing (Into the Breach).
//
// Your turn: pick a squad (E or click), what it does (the list: up and down, E), and where (the arrows step
// round the places it can, E or click); each squad once, and you see it happen. U undoes, back to the start of
// the turn if you like. P cuts the power under a place. Enter (or the button) ends the turn. Take the square
// before dawn: you go down yourself. If dawn comes first, your father arrives and takes the table over.

export interface RiotTableSceneData {
  scenario: string;
  /** Where you were (the simulation room). */
  back: AreaSceneData;
}

type Kind = 'move' | 'quell' | 'charge' | 'storm' | 'hold';
const VERBS: Record<Kind, { label: string; text: string }> = {
  move: { label: 'Move', text: 'Through streets that aren’t burning.' },
  quell: { label: 'Quell', text: 'Talk them down: unrest 1 less, here or next door.' },
  charge: { label: 'Charge', text: 'Unrest 2 less, but they scatter into the streets round it, and the district’s anger puts the barricades up.' },
  storm: { label: 'Storm', text: 'At the barricades: they come down. It costs the squad.' },
  hold: { label: 'Brace', text: 'Stand firm: nothing hurts them this turn.' },
};

const AMBER = SHADES.amber;
const CYAN = SHADES.cyan;
const END = { x: W - 70, y: H - 15, w: 64, h: 11 };
const POWER = { x: W - 140, y: H - 15, w: 64, h: 11 };
const UNDO = { x: W - 192, y: H - 15, w: 46, h: 11 };
/** How many people stand in a street at each level of unrest. */
const CROWD = [0, 4, 8, 13];

export class RiotTableScene extends Phaser.Scene {
  private sc!: RiotScenario;
  private g!: RiotGame;
  private state!: RiotState;
  private spreads: Spread[] = [];
  private history: RiotState[] = [];
  private cursor!: RiotPlace;
  private mode: 'idle' | 'menu' | 'target' | 'cut' = 'idle';
  private picked: RiotSquad | null = null;
  private menu: Kind[] = [];
  private menuAt = 0;
  private targets: RiotPlace[] = [];
  private busy = true;
  private closedAt = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private life!: Phaser.GameObjects.Graphics;
  private title!: PixelText;
  private info!: PixelText;
  private hint!: PixelText;
  private menuText: PixelText[] = [];
  private buttons: PixelText[] = [];
  private barText!: PixelText;
  private dialogue!: DialogueBox;
  private music!: TableMusic;
  private t = 0;
  private embers: { x: number; y: number; vy: number; life: number; smoke: boolean }[] = [];
  /** Your father at the table: the game plays itself. */
  private fatherPlaying = false;

  constructor() {
    super('RiotTable');
  }

  init(data: RiotTableSceneData): void {
    const sc = RIOTS[data.scenario];
    if (!sc) throw new Error(`RiotTableScene: no riot called "${data.scenario}"`);
    this.sc = sc;
    this.g = new RiotGame(sc.board);
    this.state = this.g.start(sc.unrest, sc.squads);
    this.spreads = this.g.spreads(this.state);
    this.history = [];
    this.mode = 'idle';
    this.picked = null;
    this.busy = true;
    this.embers = [];
    this.fatherPlaying = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const key = `riot-table-${this.sc.district}`;
    makePaintedTexture(this, key, W, H, districtPainter(this.sc.board, this.sc.district));
    this.add.image(0, 0, key).setOrigin(0);
    this.gfx = this.add.graphics().setDepth(2);
    this.life = this.add.graphics().setDepth(3);
    for (const p of this.sc.board.places) {
      const label = new PixelText(this, 0, p.y + 13, lower(p.name), { color: SHADES.light, shadow: SHADES.shadow }).setDepth(4);
      label.setX(Math.max(2, Math.min(W - label.width - 2, Math.round(p.x - label.width / 2))));
    }
    this.barText = new PixelText(this, 0, 0, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(5);
    this.title = new PixelText(this, 6, 4, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(6);
    this.info = new PixelText(this, 6, 15, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(6);
    this.hint = new PixelText(this, 6, H - 12, '', { color: SHADES.dim, shadow: SHADES.shadow }).setDepth(6);
    this.buttons = [
      new PixelText(this, END.x + 4, END.y + 2, 'End turn', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8),
      new PixelText(this, POWER.x + 4, POWER.y + 2, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8),
      new PixelText(this, UNDO.x + 4, UNDO.y + 2, 'Undo', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(8),
    ];
    this.cursor = this.place(this.state.squads[0]!.place);
    this.dialogue = new DialogueBox(this, getSession(this).story);
    this.music = startTableMusic(this, 'now');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music.stop());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointer(p, false));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.time.addEvent({ delay: 120, loop: true, callback: () => ((this.t += 1), this.drawLife()) });
    this.cameras.main.fadeIn(600);
    this.draw();
    this.time.delayedCall(600, () => this.talk('c3day4_riot_intro', () => this.startTurn()));
  }

  private place = (id: string): RiotPlace => this.sc.board.places.find((p) => p.id === id)!;

  // --- The turn ---

  private startTurn(): void {
    this.spreads = this.g.spreads(this.state);
    this.history = [];
    this.mode = 'idle';
    this.picked = null;
    this.busy = false;
    this.draw();
  }

  /** One of your actions, now: it happens on the table. */
  private doAction(a: RiotAction): void {
    const before = this.state;
    const after = this.g.act(before, a);
    if (after === before) return;
    this.history.push(before);
    this.state = after;
    if (a.kind === 'move') playSound(this, 'boots', 0.5);
    else if (a.kind === 'quell') playSound(this, 'shuffle', 0.6);
    else if (a.kind === 'charge') {
      playSound(this, 'crash', 0.7);
      this.cameras.main.shake(140, 0.004);
      this.burst(this.place(a.at), AMBER);
    } else if (a.kind === 'storm') {
      playSound(this, 'smash', 0.8);
      this.cameras.main.shake(180, 0.005);
      this.burst(this.place(this.g.heart), SHADES.white);
    } else if (a.kind === 'cut') {
      playSound(this, 'boom', 0.6);
      this.cameras.main.shake(120, 0.003);
    }
    this.mode = 'idle';
    this.picked = null;
    playConfirm(this);
    // Into the square: you go down yourself.
    if (this.g.outcome(this.state) === 'won') return this.goDown();
    this.draw();
  }

  private undo(): void {
    const prev = this.history.pop();
    if (!prev) return;
    this.state = prev;
    this.mode = 'idle';
    this.picked = null;
    playMove(this);
    this.draw();
  }

  /** The rising's turn: the spreads shown carried out, fires catching, the barricades, the guard. */
  private async endTurn(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.mode = 'idle';
    this.picked = null;
    this.draw();
    const before = this.state;
    for (const sp of this.spreads) {
      if (before.unrest[sp.from]! < 3 || sp.from === before.cut) continue;
      void this.pour(this.place(sp.from), this.place(sp.to));
    }
    playSound(this, 'crackle', 0.7);
    await this.wait(this.fatherPlaying ? 220 : 520);
    this.state = this.g.endTurn(before, this.spreads);
    // Squads hurt: a flash on each, and the table shudders.
    const hurt = before.squads.filter((q) => {
      const now = this.state.squads.find((x) => x.id === q.id);
      return !now || now.hp < q.hp;
    });
    for (const q of hurt) this.burst(this.place(q.place), CYAN);
    if (hurt.length) (playSound(this, 'hit', 0.7), this.cameras.main.shake(160, 0.004));
    this.draw();
    await this.wait(this.fatherPlaying ? 120 : 300);
    if (this.fatherPlaying) return this.fatherTurn();
    if (this.g.outcome(this.state) === 'lost') return this.dawn();
    this.startTurn();
  }

  // --- How it ends ---

  /** The square's yours: down to it yourself (the fight, your hand beside you), and out at the square. */
  private goDown(): void {
    this.busy = true;
    const { story } = getSession(this);
    if (!this.fatherPlaying) story.setVariable('riot_table', 'won');
    story.setVariable('riot_turns', this.state.turn);
    story.setVariable('riot_charges', this.state.charges);
    this.draw();
    this.talk('c3day4_riot_dropin', () => {
      const data: CombatSceneData = { encounter: this.sc.square, back: { ...this.sc.squareArea, script: this.sc.knots.won } };
      this.music.stop();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Combat', data));
    });
  }

  /** Dawn, and the square's still theirs: your father comes in, and takes the table from you (designer). */
  private dawn(): void {
    this.busy = true;
    const { story } = getSession(this);
    story.setVariable('riot_table', 'lost');
    story.setVariable('riot_turns', this.state.turn);
    this.talk(this.sc.knots.lost, () => {
      // He plays it from where it is, and he doesn't need long: the night's no longer a limit.
      this.g = new RiotGame(this.sc.board, { ...RIOT_RULES, dawn: this.state.turn + 30 });
      this.fatherPlaying = true;
      this.music.mood('lesson');
      this.fatherTurn();
    });
  }

  private async fatherTurn(): Promise<void> {
    if (this.g.outcome(this.state) === 'won') return this.talk('c3day4_father_took', () => this.goDown());
    this.spreads = this.g.spreads(this.state);
    this.draw();
    await this.wait(260);
    for (const a of careful()(this.g, this.state)) {
      const next = this.g.act(this.state, a);
      if (next === this.state) continue;
      this.state = next;
      playSound(this, a.kind === 'storm' ? 'smash' : a.kind === 'charge' ? 'crash' : 'tick', 0.5);
      if (a.kind === 'storm') this.burst(this.place(this.g.heart), SHADES.white);
      this.draw();
      await this.wait(150);
      if (this.g.outcome(this.state) === 'won') return this.talk('c3day4_father_took', () => this.goDown());
    }
    this.busy = false;
    await this.endTurn();
  }

  // --- Input ---

  private ready(): boolean {
    return !this.busy && !this.fatherPlaying && !this.dialogue.isOpen && this.time.now - this.closedAt > 200;
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat || !this.ready()) return;
    const dir = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[e.key] as [number, number] | undefined;
    if (dir) {
      if (this.mode === 'menu') {
        if (dir[1]) this.menuAt = (this.menuAt + dir[1] + this.menu.length) % this.menu.length;
      } else if (this.mode === 'target' || this.mode === 'cut') {
        const i = this.targets.indexOf(this.cursor);
        this.cursor = this.targets[(i + (dir[0] + dir[1] > 0 ? 1 : this.targets.length - 1)) % this.targets.length]!;
      } else {
        const next = nearestIn(this.sc.board.places, this.cursor, dir[0], dir[1]);
        if (!next) return;
        this.cursor = next;
      }
      playMove(this);
      this.draw();
      return;
    }
    if (e.key === 'e' || e.key === 'E') return this.confirm();
    if (e.key === 'Escape') return this.back();
    if (e.key === 'u' || e.key === 'U') return this.undo();
    if (e.key === 'p' || e.key === 'P') return this.startCut();
    if (e.key === 'Tab') {
      e.preventDefault();
      return this.nextSquad();
    }
    if (e.key === 'Enter' && this.mode === 'idle') void this.endTurn();
  }

  private onPointer(p: Phaser.Input.Pointer, down: boolean): void {
    if (!this.ready()) return;
    if (down && p.rightButtonDown()) return this.back();
    const inside = (b: typeof END) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
    if (down && inside(END)) return void (this.mode === 'idle' && this.endTurn());
    if (down && inside(POWER)) return this.startCut();
    if (down && inside(UNDO)) return this.undo();
    if (this.mode === 'menu') {
      const i = this.menuText.findIndex((t) => p.x >= t.x - 2 && p.x < t.x + 70 && p.y >= t.y - 1 && p.y < t.y + 9);
      if (i >= 0 && i !== this.menuAt) (this.menuAt = i), this.draw();
      if (down && i >= 0) return this.confirm();
      if (down) return this.back();
      return;
    }
    const pool = this.mode === 'target' || this.mode === 'cut' ? this.targets : this.sc.board.places;
    const near = pool.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 14);
    if (near && near !== this.cursor) (this.cursor = near), this.draw();
    if (down) {
      if (near) this.confirm();
      else this.back();
    }
  }

  /** E or a click: pick up a squad, choose from its list, or choose where. */
  private confirm(): void {
    if (this.mode === 'idle') {
      const sq = this.g.squadAt(this.state, this.cursor.id);
      if (!sq) return;
      const acts = this.g.actions(this.state, sq);
      if (!acts.length) return;
      this.picked = sq;
      this.menu = (['move', 'quell', 'charge', 'storm', 'hold'] as Kind[]).filter((k) => acts.some((a) => a.kind === k));
      this.menuAt = 0;
      this.mode = 'menu';
      playMove(this);
    } else if (this.mode === 'menu') {
      const kind = this.menu[this.menuAt]!;
      const sq = this.picked!;
      if (kind === 'hold') return this.doAction({ kind: 'hold', squad: sq.id });
      if (kind === 'storm') return this.doAction({ kind: 'storm', squad: sq.id });
      this.targets = this.g.actions(this.state, sq).filter((a) => a.kind === kind).map((a) => this.place('to' in a ? a.to : (a as { at: string }).at));
      this.cursor = this.targets[0]!;
      this.mode = 'target';
      playMove(this);
    } else if (this.mode === 'target') {
      if (!this.targets.includes(this.cursor)) return;
      const kind = this.menu[this.menuAt]!;
      const sq = this.picked!;
      return this.doAction(kind === 'move' ? { kind: 'move', squad: sq.id, to: this.cursor.id } : ({ kind, squad: sq.id, at: this.cursor.id } as RiotAction));
    } else if (this.mode === 'cut') {
      if (!this.targets.includes(this.cursor)) return;
      return this.doAction({ kind: 'cut', at: this.cursor.id });
    }
    this.draw();
  }

  private back(): void {
    if (this.mode === 'target') this.mode = 'menu';
    else if (this.mode === 'menu' || this.mode === 'cut') {
      this.mode = 'idle';
      if (this.picked) this.cursor = this.place(this.picked.place);
      this.picked = null;
    }
    this.draw();
  }

  private startCut(): void {
    if (this.mode !== 'idle' || !this.g.canCut(this.state) || this.state.cut) return;
    this.targets = this.sc.board.places.filter((p) => this.state.unrest[p.id]! >= 2);
    if (!this.targets.length) return;
    this.cursor = this.targets[0]!;
    this.mode = 'cut';
    playMove(this);
    this.draw();
  }

  private nextSquad(): void {
    if (this.mode !== 'idle') return;
    const ready = this.state.squads.filter((q) => !this.state.acted.includes(q.id));
    const pool = ready.length ? ready : this.state.squads;
    if (!pool.length) return;
    const i = pool.findIndex((q) => q.place === this.cursor.id);
    this.cursor = this.place(pool[(i + 1) % pool.length]!.place);
    playMove(this);
    this.draw();
  }

  // --- Drawing ---

  /** What's drawn when something changes: the shown spreads, the barricades, the buttons, the words. */
  private draw(): void {
    const g = this.gfx.clear();
    const s = this.state;
    // Where the fires will spread at the end of the turn (the arrows), and the streets about to catch.
    if (!this.fatherPlaying) {
      for (const sp of this.spreads) if (s.unrest[sp.from]! >= 3 && sp.from !== s.cut) arrow(g, this.place(sp.from), this.place(sp.to), AMBER);
    }
    // The places: a ring for each, the cut ones dark.
    for (const p of this.sc.board.places) {
      const u = s.unrest[p.id]!;
      g.lineStyle(1, u >= 3 ? AMBER : u === 2 ? SHADES.amberDeep : SHADES.cyanMid, 0.8).strokeCircle(p.x, p.y, 9);
      if (p.up) g.lineStyle(1, SHADES.white, 0.7).strokeRect(p.x - 11, p.y - 11, 23, 23);
      if (s.cut === p.id) g.fillStyle(SHADES.shadow, 0.65).fillCircle(p.x, p.y, 13);
    }
    // The barricades, round the square.
    const sq = this.place(this.g.heart);
    if (s.barricade > 0) {
      for (let a = 0; a < 18; a++) {
        const ang = (a / 18) * Math.PI * 2;
        const r = 14 + ((a * 7) % 3);
        g.fillStyle(a % 3 ? SHADES.woodLight : SHADES.dim, 1).fillRect(Math.round(sq.x + Math.cos(ang) * r) - 1, Math.round(sq.y + Math.sin(ang) * r * 0.7) - 1, 3, 2);
      }
      this.barText.setText(`Barricades ${s.barricade}`).setPosition(Math.round(sq.x - 30), sq.y - 26);
    } else this.barText.setText('Barricades down').setPosition(Math.round(sq.x - 36), sq.y - 26);
    // Choosing where: the places it can go, ringed.
    if (this.mode === 'target' || this.mode === 'cut') for (const p of this.targets) g.lineStyle(1, SHADES.white, 0.9).strokeCircle(p.x, p.y, 12);
    if (this.mode === 'target' && this.picked && this.menu[this.menuAt] === 'move') arrow(g, this.place(this.picked.place), this.cursor, CYAN);
    // The cursor.
    if (!this.busy) g.lineStyle(1, SHADES.white, 1).strokeRect(this.cursor.x - 14, this.cursor.y - 14, 29, 29);
    // The menu for the squad you've picked.
    for (const t of this.menuText) t.destroy();
    this.menuText = [];
    if (this.mode === 'menu' && this.picked) {
      const p = this.place(this.picked.place);
      const x = Math.min(W - 80, p.x + 18);
      const y0 = Math.max(26, Math.min(H - 30 - this.menu.length * 10, p.y - 10));
      g.fillStyle(SHADES.shadow, 0.88).fillRect(x - 4, y0 - 3, 72, this.menu.length * 10 + 4);
      g.lineStyle(1, CYAN, 1).strokeRect(x - 4, y0 - 3, 72, this.menu.length * 10 + 4);
      this.menu.forEach((k, i) => {
        const t = new PixelText(this, x, y0 + i * 10, VERBS[k].label, { color: i === this.menuAt ? AMBER : SHADES.light, shadow: SHADES.shadow }).setDepth(9);
        this.menuText.push(t);
      });
    }
    // The buttons.
    const idle = this.mode === 'idle' && !this.busy;
    const button = (b: typeof END, on: boolean, lit = false) => {
      g.fillStyle(lit ? SHADES.amberDeep : on ? SHADES.cyanDeep : SHADES.deep, 0.95).fillRect(b.x, b.y, b.w, b.h);
      g.lineStyle(1, on ? CYAN : SHADES.dim, 1).strokeRect(b.x, b.y, b.w, b.h);
    };
    button(END, idle);
    const cutReady = this.g.canCut(s) && !s.cut;
    button(POWER, idle && cutReady, this.mode === 'cut');
    button(UNDO, idle && this.history.length > 0);
    this.buttons[0]!.setColor(idle ? SHADES.white : SHADES.dim);
    this.buttons[1]!.setText(s.cut ? 'Power cut' : cutReady ? 'Cut power' : `Power: ${this.g.cutIn(s)}`).setColor(idle && cutReady ? SHADES.white : SHADES.dim);
    this.buttons[2]!.setColor(idle && this.history.length ? SHADES.white : SHADES.dim);
    const left = this.g.rules.dawn - s.turn + 1;
    this.title.setText(this.fatherPlaying ? 'Your father has the table.' : `Take the square before dawn.   Dawn in ${left} ${left === 1 ? 'turn' : 'turns'}.`);
    this.info.setText(this.busy ? '' : this.describe());
    this.hint.setText(
      this.busy ? '' : this.mode === 'menu' ? 'Up/down: choose   E: this   Esc: back' : this.mode === 'target' ? 'Arrows: where   E: there   Esc: back' : this.mode === 'cut' ? 'Arrows: where   E: cut the power there   Esc: back' : 'E: a squad   Tab: next squad   U: undo   P: power   Enter: end turn',
    );
    this.drawLife();
  }

  /** What's under the cursor, or what the choice does, in plain words. */
  private describe(): string {
    const s = this.state;
    if (this.mode === 'menu') return VERBS[this.menu[this.menuAt]!].text;
    if (this.mode === 'cut') return `Cut the power to ${lower(this.cursor.name)}: it can't spread or catch fire this turn.`;
    if (this.mode === 'target') {
      const k = this.menu[this.menuAt]!;
      return k === 'move' ? `Move to ${lower(this.cursor.name)}.` : `${VERBS[k].label} ${lower(this.cursor.name)}: unrest ${s.unrest[this.cursor.id]} to ${Math.max(0, s.unrest[this.cursor.id]! - (k === 'charge' ? 2 : 1))}.${k === 'charge' ? ' They’ll scatter.' : ''}`;
    }
    const p = this.cursor;
    const u = s.unrest[p.id]!;
    const mood = ['calm', 'restless', 'angry', 'burning'][u]!;
    const q = this.g.squadAt(s, p.id);
    let text = `${p.name}: ${mood}`;
    if (q) text += `. ${SQUAD_KINDS[q.kind].name}, ${q.hp} strong${s.acted.includes(q.id) ? ' (done this turn)' : ''}`;
    if (p.heart) text += s.barricade > 0 ? `. Behind ${s.barricade} barricades: storm them from the streets next to it. Nobody storming, they go back up.` : '. The barricades are down: get a squad in.';
    else if (this.spreads.some((sp) => sp.to === p.id && s.unrest[sp.from]! >= 3 && sp.from !== s.cut)) text += q ? '. The fire’s coming here: they’ll be hurt unless they brace.' : '. The fire’s spreading here.';
    if (this.g.catching(s).includes(p.id)) text += ' It’ll catch fire unless someone stands in it.';
    if (p.up) text += ' The way up: more of the guard come here.';
    return text;
  }

  /** The riot, alive: crowds jostling, fires, smoke and embers; the guard in ranks. Redrawn several times a second. */
  private drawLife(): void {
    const g = this.life.clear();
    const s = this.state;
    const catching = this.busy ? [] : this.g.catching(s);
    for (const p of this.sc.board.places) {
      const u = s.unrest[p.id]!;
      const seed = p.x * 13 + p.y * 7;
      // The fire, and what rises off it.
      if (u >= 3) {
        for (let i = 0; i < 6; i++) {
          const fx = p.x - 5 + ((i * 5 + seed) % 11);
          const h = 3 + ((this.t + i * 3 + seed) % 4);
          for (let k = 0; k < h; k++) g.fillStyle(k < 1 ? SHADES.white : k < 3 ? AMBER : SHADES.amberDeep, 1).fillRect(fx + (k % 2 && this.t % 2 ? 1 : 0), p.y + 2 - k, 1, 1);
        }
        if (this.t % 2 === 0) this.embers.push({ x: p.x - 4 + ((this.t * 7 + seed) % 9), y: p.y - 4, vy: 0.6 + (seed % 3) * 0.2, life: 18, smoke: this.t % 4 === 0 });
      }
      // About to catch: the street pulses.
      if (catching.includes(p.id)) g.lineStyle(1, AMBER, this.t % 4 < 2 ? 0.9 : 0.3).strokeCircle(p.x, p.y, 11);
      // The crowd: little people, jostling, more the angrier it is.
      const n = CROWD[u]!;
      for (let i = 0; i < n; i++) {
        const a = i * 2.4 + seed;
        const r = 4 + (i % 3) * 3;
        const jig = (this.t + i * 5) % 6 < 3 ? 1 : 0;
        const x = Math.round(p.x + Math.cos(a) * r + (i % 2 ? jig : -jig));
        const y = Math.round(p.y + Math.sin(a) * r * 0.6 + 2);
        g.fillStyle(i % 3 === 0 ? SHADES.amberDeep : i % 3 === 1 ? SHADES.woodLight : SHADES.dim, 1).fillRect(x, y, 1, 2);
        g.fillStyle(SHADES.skinTan, 1).fillRect(x, y - 1, 1, 1);
        // An arm up, shouting, now and then.
        if (u >= 2 && (this.t + i) % 9 === 0) g.fillStyle(SHADES.skinTan, 1).fillRect(x + 1, y - 2, 1, 1);
      }
    }
    // Embers and smoke drifting up.
    for (const e of this.embers) {
      e.y -= e.vy;
      e.x += Math.sin((e.y + this.t) / 4) * 0.3;
      e.life--;
      g.fillStyle(e.smoke ? SHADES.dim : e.life > 10 ? AMBER : SHADES.amberDeep, e.smoke ? 0.5 : 1).fillRect(Math.round(e.x), Math.round(e.y), e.smoke ? 2 : 1, e.smoke ? 2 : 1);
    }
    this.embers = this.embers.filter((e) => e.life > 0).slice(-160);
    // The guard: a rank of figures, one for each of their strength, with pikes, shields or a lantern.
    for (const q of s.squads) {
      const p = this.place(q.place);
      const done = s.acted.includes(q.id);
      const body = done ? SHADES.cyanDeep : SHADES.cyanMid;
      const x0 = p.x - Math.floor((q.hp * 3) / 2);
      for (let i = 0; i < q.hp; i++) {
        const x = x0 + i * 3;
        const y = p.y - 6;
        g.fillStyle(done ? SHADES.dim : CYAN, 1).fillRect(x, y - 1, 1, 1);
        g.fillStyle(body, 1).fillRect(x, y, 2, 3);
        if (q.kind === 'pikes') g.fillStyle(SHADES.light, 1).fillRect(x + 2, y - 4, 1, 5);
        else if (q.kind === 'shields') g.fillStyle(SHADES.light, 1).fillRect(x - 1, y, 1, 3);
        else g.fillStyle(AMBER, this.t % 4 < 2 ? 1 : 0.6).fillRect(x + 2, y + 1, 1, 1);
      }
      if (this.picked?.id === q.id) g.lineStyle(1, SHADES.white, 1).strokeRect(x0 - 2, p.y - 12, q.hp * 3 + 3, 10);
    }
  }

  /** A burst of light where something hit. */
  private burst(p: RiotPlace, colour: number): void {
    const flash = this.add.circle(p.x, p.y, 8, SHADES.white).setDepth(7);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 240, onComplete: () => flash.destroy() });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = this.add.rectangle(p.x, p.y, 2, 2, colour).setDepth(7);
      this.tweens.add({ targets: d, x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 10, alpha: 0, duration: 420, onComplete: () => d.destroy() });
    }
  }

  /** The crowd pouring along a street, from a fire into the next. */
  private async pour(a: RiotPlace, b: RiotPlace): Promise<void> {
    for (let i = 0; i < 6; i++) {
      const d = this.add.rectangle(a.x, a.y, 1, 2, i % 2 ? AMBER : SHADES.woodLight).setDepth(6);
      this.tweens.add({ targets: d, x: b.x + (i % 3) - 1, y: b.y + (i % 2), delay: i * 50, duration: 380, ease: 'Sine.easeInOut', onComplete: () => d.destroy() });
    }
    await this.wait(420);
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

function arrow(g: Phaser.GameObjects.Graphics, a: { x: number; y: number }, b: { x: number; y: number }, col: number): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
  const [sx, sy] = [a.x + ux * 10, a.y + uy * 10];
  const [ex, ey] = [b.x - ux * 12, b.y - uy * 12];
  g.lineStyle(3, SHADES.shadow, 0.8).lineBetween(sx, sy, ex, ey);
  g.lineStyle(1, col, 1).lineBetween(sx, sy, ex, ey);
  g.fillStyle(col, 1).fillTriangle(ex + ux * 4, ey + uy * 4, ex - uy * 3 - ux * 2, ey + ux * 3 - uy * 2, ex + uy * 3 - ux * 2, ey - ux * 3 - uy * 2);
}

/**
 * The table: the district as a street plan from above, in light: its streets lit, the blocks between them
 * dark with a few lit windows, a plaza at each place. The low district warm and crowded (small blocks); the
 * promenade's glass in long, clean ones. In the table's cyan, as Day 2's lesson was.
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
    if (d < 3) lum = 0.36;
    else if (d < 5) lum = 0.55;
    else {
      const gx = x % lot;
      const gy = y % lot;
      const gap = gx === 0 || gy === 0;
      const h = ((Math.floor(x / lot) * 73856093) ^ (Math.floor(y / lot) * 19349663)) >>> 0;
      lum = gap ? 0.06 : 0.16 + (h % 7) * 0.02;
      if (!gap && gx % 3 === 1 && gy % 4 === 2 && ((h >> 3) + gx * 7 + gy) % 11 === 0) lum = 0.8;
    }
    if (y % 3 === 0) lum *= 0.8;
    const edge = Math.min(x, W - x, y, H - y) / 40;
    lum *= Math.min(1, 0.4 + edge) * 0.8;
    const t = Math.min(2.999, lum * 4);
    const i = Math.floor(t);
    const k = t - i;
    const a = steps[i]!;
    const b = steps[i + 1]!;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };
}
