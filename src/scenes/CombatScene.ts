import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { COMBATANTS, ENCOUNTERS, MOVES } from '../data/combat';
import { getSession } from '../session';
import { Battle, type BattleEvent, type Combatant, type MoveDef, type Reaction } from '../systems/Combat';
import { PROTAGONIST, VILLAGERS } from '../ui/characters';
import { SHADES } from '../ui/pixelArt';
import { PIXEL, makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import type { RowSprite } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';
import { FLOOR, paintMarketCloseUp } from './FightScene';

// Turn-based combat (docs/combat-design.md): the rules are src/systems/Combat.ts, the fights are data in
// src/data/combat.ts; this scene only shows them. Each enemy's intent hangs over its head. On your turn,
// pick a move (up/down, E). When an attack comes at you, a ring closes on your head as he lunges: press E
// as it crosses the green to dodge, or late, in the bright inner ring, to parry (a counter: he's thrown
// off and open to a grab). One press per attack. The sprites are tiny row sprites, so the timing is sold
// with tweens: a flash and shudder before a hit, lunges, shakes, sparks, a freeze on a parry.
// When it's over, the outcome is written to ink (the encounter's `outcomes`) and you're back in the area.
// The captions are PLACEHOLDER until the designer writes the fight's text.

export interface CombatSceneData {
  encounter: string;
  /** Where to go back to afterwards (its `script` plays on arrival: the story's reaction). */
  back: AreaSceneData;
}

const SCALE = 3;
/** How long an attack takes to land once he lunges: the reaction ring closes over this. */
const LUNGE = 700;
/** The ring's radius when the lunge starts. */
const RING = 44;
const MENU = { x: 8, y: 204, width: W - 16, height: H - 210 };

/** Sprites for the `sprite` keys in combat data. */
const SPRITES: Record<string, RowSprite> = {
  protagonist: PROTAGONIST.idle[0]!,
  zealot: VILLAGERS[0]!.idle[0]!,
};

interface View {
  sprite: Phaser.GameObjects.Image;
  /** A white silhouette over the sprite, for flashes. */
  flash: Phaser.GameObjects.Image;
  home: { x: number; y: number };
  /** Facing: +1 right (the party), -1 left (enemies). */
  facing: number;
  height: number;
  name: PixelText;
  status: PixelText;
  pips: Phaser.GameObjects.Graphics;
}

export class CombatScene extends Phaser.Scene {
  private params!: CombatSceneData;
  private battle!: Battle;
  private views = new Map<string, View>();
  private caption!: PixelText;
  private hint!: PixelText;
  private ring!: Phaser.GameObjects.Graphics;
  private menuBox!: Phaser.GameObjects.Graphics;
  private menuItems: PixelText[] = [];
  private menuText!: PixelText;
  private menu: { options: { label: string; usable: boolean; text: string }[]; index: number; pick: (i: number) => void } | null = null;
  private reacting: { target: string; impactAt: number; pressedAt: number | null; window: { dodge: number; parry: number } } | null = null;
  private waitingPress: (() => void) | null = null;

  constructor() {
    super('Combat');
  }

  init(data?: Partial<CombatSceneData>): void {
    this.params = { encounter: data?.encounter ?? 'market_scrap', back: data?.back ?? { areaId: 'roots-market' } };
    this.views = new Map();
    this.menu = null;
    this.reacting = null;
    this.waitingPress = null;
    this.menuItems = [];
  }

  create(): void {
    const encounter = ENCOUNTERS[this.params.encounter];
    if (!encounter) throw new Error(`CombatScene: no encounter called "${this.params.encounter}"`);
    this.battle = new Battle(encounter, MOVES, COMBATANTS);

    makePaintedTexture(this, 'combat-backdrop', W, H, paintMarketCloseUp());
    this.add.image(0, 0, 'combat-backdrop').setOrigin(0);
    const party = this.battle.combatants.filter((c) => c.side === 'party');
    const enemies = this.battle.combatants.filter((c) => c.side === 'enemy');
    party.forEach((c, i) => this.addView(c, 170 - i * 46, 1));
    enemies.forEach((c, i) => this.addView(c, 310 + i * 46, -1));

    this.ring = this.add.graphics().setDepth(8);
    this.caption = new PixelText(this, 0, 10, '', { color: SHADES.white, shadow: SHADES.shadow }).setDepth(20);
    this.hint = new PixelText(this, 0, 22, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(20);
    this.menuBox = this.add.graphics().setDepth(18);
    this.menuText = new PixelText(this, MENU.x + 100, MENU.y + 6, '', { color: SHADES.light, wrapWidth: MENU.width - 108 }).setDepth(19);

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.on('pointerdown', () => this.onPress());
    this.cameras.main.fadeIn(600);
    this.refresh();
    this.time.delayedCall(700, () => void this.run());
  }

  override update(): void {
    this.drawRing();
  }

  // --- The fight, turn by turn ---

  private async run(): Promise<void> {
    this.say('PLACEHOLDER: the fight starts.', 'Watch what he is about to do.');
    await this.wait(1200);
    while (!this.battle.outcome) {
      const actor = this.battle.current!;
      this.refresh();
      if (actor.side === 'party') {
        const { move, target } = await this.pickMove(actor);
        await this.partyAct(actor, move, target);
      } else await this.enemyAct(actor);
      this.refresh();
      await this.wait(350);
    }
    await this.end(this.battle.outcome);
  }

  private async pickMove(actor: Combatant): Promise<{ move: string; target?: string }> {
    this.say(`${actor.def.name}: your move.`, '');
    const choices = this.battle.choices();
    const i = await this.openMenu(choices.map((c) => ({
      label: c.move.name,
      usable: c.usable,
      text: c.usable ? c.move.description : `${c.move.description} (${c.reason})`,
    })));
    const move = choices[i]!.move;
    const foes = this.battle.living('enemy');
    if (move.target !== 'enemy' || foes.length === 1) return { move: move.id };
    // More than one: who?
    this.say(`${move.name}: who?`, '');
    const usable = foes.map((f) => this.battle.choices(f.id).find((c) => c.move.id === move.id)!);
    const t = await this.openMenu(foes.map((f, n) => ({ label: f.def.name, usable: usable[n]!.usable, text: usable[n]!.reason ?? '' })));
    return { move: move.id, target: foes[t]!.id };
  }

  private async partyAct(actor: Combatant, moveId: string, target?: string): Promise<void> {
    const move = MOVES[moveId]!;
    this.say(`${actor.def.name}: ${move.name}`, '');
    const events = this.battle.choose(moveId, target);
    const view = this.views.get(actor.id)!;
    const hit = events.find((e) => e.type === 'move')!;
    if (move.target === 'enemy') {
      const t = this.views.get(hit.type === 'move' ? hit.target : '')!;
      await this.tween(view.sprite, { x: t.home.x - view.facing * 18, duration: 160, ease: 'Quad.easeIn' });
      await this.play(events);
      await this.tween(view.sprite, { x: view.home.x, duration: 220, ease: 'Quad.easeOut' });
    } else {
      await this.tween(view.sprite, { x: view.home.x - view.facing * 8, duration: 140, yoyo: true });
      await this.play(events);
    }
  }

  private async enemyAct(actor: Combatant): Promise<void> {
    const view = this.views.get(actor.id)!;
    if (actor.staggered) {
      this.say(`${actor.def.name} finds his feet.`, '');
      await this.tween(view.sprite, { angle: { from: -6, to: 0 }, duration: 400 });
      await this.play(this.battle.enemyTurn());
      return;
    }
    const intent = this.battle.intentOf(actor.id)!;
    const move = MOVES[intent.move]!;
    const target = this.battle.get(intent.target).hp > 0 ? intent.target : this.battle.living('party')[0]!.id;
    this.say(`${actor.def.name}: ${move.name}`, '');
    await this.telegraph(view);
    if (move.target !== 'enemy') {
      // Not an attack: a wind-up leans back, a jeer bobs to the crowd.
      if (move.windsUp) await this.tween(view.sprite, { x: view.home.x - view.facing * 10, angle: -view.facing * 6, duration: 300 });
      else await this.tween(view.sprite, { y: view.home.y - 6, duration: 140, yoyo: true, repeat: 1 });
      await this.play(this.battle.enemyTurn());
      if (!move.windsUp) await this.tween(view.sprite, { x: view.home.x, y: view.home.y, angle: 0, duration: 200 });
      return;
    }
    // The attack: he lunges, and the ring closes on whoever he's going for.
    const window = this.battle.reactionWindow(move.id, target);
    const t = this.views.get(target)!;
    if (window) {
      this.reacting = { target, impactAt: this.time.now + LUNGE, pressedAt: null, window };
      this.say(`${actor.def.name}: ${move.name}`, 'E as the ring hits green: dodge. Late, inside: parry.');
    }
    await this.tween(view.sprite, { x: t.home.x - view.facing * 16, angle: 0, duration: LUNGE, ease: 'Quad.easeIn' });
    let reaction: Reaction = 'none';
    if (this.reacting) {
      const { pressedAt, impactAt } = this.reacting;
      reaction = Battle.grade(pressedAt === null ? null : impactAt - pressedAt, window);
      this.reacting = null;
      this.ring.clear();
    }
    await this.play(this.battle.enemyTurn(reaction));
    await this.tween(view.sprite, { x: view.home.x, angle: 0, duration: 260, ease: 'Quad.easeOut' });
  }

  /** Shows what happened: a sound and a tween for each event, in order. */
  private async play(events: BattleEvent[]): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'reaction': {
          const t = this.views.get(e.target)!;
          if (e.reaction === 'dodge') {
            playSound(this, 'whoosh');
            this.say('Dodged.', '');
            await this.tween(t.sprite, { x: t.home.x - t.facing * 16, y: t.home.y - 4, duration: 120, yoyo: true });
          } else if (e.reaction === 'parry') {
            // The freeze: everything stops for a beat, sparks fly where they met.
            playSound(this, 'staff');
            playConfirm(this);
            this.say('Parried!', 'He is thrown off. An opening.');
            this.flashWhite(t, 180);
            this.sparks((t.home.x + this.views.get(e.actor)!.sprite.x) / 2, t.home.y - t.height * 0.6);
            this.cameras.main.flash(120, 244, 241, 232);
            this.tweens.pauseAll();
            await this.wait(160);
            this.tweens.resumeAll();
          }
          break;
        }
        case 'damage': {
          const t = this.views.get(e.target)!;
          playSound(this, e.amount >= 3 ? 'punch' : 'hit', e.amount >= 3 ? 1.2 : 1);
          this.cameras.main.shake(e.amount >= 3 ? 320 : 180, e.amount >= 3 ? 0.016 : 0.008);
          this.flashWhite(t, 120);
          this.floatText(`-${e.amount}`, t.home.x, t.home.y - t.height - 16, SHADES.amber);
          this.refresh();
          await this.tween(t.sprite, { x: t.home.x - t.facing * 10, duration: 90, yoyo: true });
          break;
        }
        case 'interrupt':
          this.say('Wind-up broken.', '');
          break;
        case 'stagger': {
          const t = this.views.get(e.target)!;
          this.refresh();
          await this.tween(t.sprite, { angle: -t.facing * 10, duration: 120, yoyo: true, repeat: 1 });
          break;
        }
        case 'guard':
          this.say('On guard.', 'Wider windows until your next turn.');
          break;
        case 'expose':
          this.say(this.caption.text, 'Wide open.');
          break;
        case 'down': {
          const t = this.views.get(e.target)!;
          playSound(this, 'thump');
          this.cameras.main.shake(300, 0.012);
          await this.tween(t.sprite, { angle: -t.facing * 80, y: t.home.y + 2, duration: 400, ease: 'Bounce.easeOut' });
          break;
        }
        default:
          break;
      }
      this.refresh();
      await this.wait(120);
    }
  }

  private async end(outcome: string): Promise<void> {
    // Ink is the only store of story state: the outcome is written there, and the story takes it from here.
    const { story } = getSession(this);
    const vars = this.battle.encounter.outcomes[outcome] ?? {};
    for (const [name, value] of Object.entries(vars)) story.setVariable(name, value);
    const set = Object.entries(vars).map(([k, v]) => `${k} = ${String(v)}`).join(', ');
    this.say(`PLACEHOLDER: the fight is over (${outcome}).`, set ? `${set}. Press E.` : 'Press E.');
    await new Promise<void>((resolve) => (this.waitingPress = resolve));
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  // --- Input ---

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (this.menu && (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's')) {
      const n = this.menu.options.length;
      this.menu.index = (this.menu.index + (k === 'arrowup' || k === 'w' ? n - 1 : 1)) % n;
      playMove(this);
      this.drawMenu();
    } else if (k === 'e' || k === ' ' || k === 'enter') this.onPress();
  }

  private onPress(): void {
    if (this.reacting) {
      // One press per attack: too early and you've spent it.
      if (this.reacting.pressedAt === null) {
        this.reacting.pressedAt = this.time.now;
        const t = this.views.get(this.reacting.target)!;
        this.tweens.add({ targets: t.sprite, y: t.home.y - 3, duration: 60, yoyo: true });
      }
    } else if (this.menu) {
      const { options, index, pick } = this.menu;
      if (!options[index]!.usable) return;
      playConfirm(this);
      this.menu = null;
      this.drawMenu();
      pick(index);
    } else if (this.waitingPress) {
      const resolve = this.waitingPress;
      this.waitingPress = null;
      resolve();
    }
  }

  private openMenu(options: { label: string; usable: boolean; text: string }[]): Promise<number> {
    return new Promise((resolve) => {
      this.menu = { options, index: Math.max(0, options.findIndex((o) => o.usable)), pick: resolve };
      this.drawMenu();
    });
  }

  // --- Drawing ---

  private addView(c: Combatant, x: number, facing: number): void {
    const rows = SPRITES[c.def.sprite] ?? SPRITES.zealot!;
    const key = makeSpriteTexture(this, `combat-${c.def.sprite}`, rows.rows, rows.colours);
    const white = Object.fromEntries(Object.keys(rows.colours).map((k) => [k, SHADES.white]));
    const flashKey = makeSpriteTexture(this, `combat-${c.def.sprite}-white`, rows.rows, white);
    const sprite = this.add.image(x, FLOOR, key).setOrigin(0.5, 1).setScale(SCALE).setFlipX(facing < 0).setDepth(5);
    const flash = this.add.image(x, FLOOR, flashKey).setOrigin(0.5, 1).setScale(SCALE).setFlipX(facing < 0).setDepth(6).setAlpha(0);
    const height = rows.rows.length * SCALE;
    const top = FLOOR - height - 30;
    this.views.set(c.id, {
      sprite, flash, home: { x, y: FLOOR }, facing, height,
      name: new PixelText(this, x, top, c.def.name, { color: SHADES.white, shadow: SHADES.shadow }).setDepth(10),
      status: new PixelText(this, x, top + 9, '', { color: SHADES.amber, shadow: SHADES.shadow }).setDepth(10),
      pips: this.add.graphics().setDepth(10),
    });
  }

  /** Names, health and what everyone's about to do. */
  private refresh(): void {
    for (const c of this.battle.combatants) {
      const v = this.views.get(c.id)!;
      v.flash.setPosition(v.sprite.x, v.sprite.y).setAngle(v.sprite.angle);
      v.name.setX(Math.round(v.home.x - v.name.width / 2));
      const pipsW = c.def.hp * 4 - 1;
      const px = Math.round(v.home.x - pipsW / 2);
      const py = v.name.y + 19;
      v.pips.clear();
      for (let i = 0; i < c.def.hp; i++) v.pips.fillStyle(i < c.hp ? SHADES.light : SHADES.woodLight).fillRect(px + i * 4, py, 3, 3);
      const intent = this.battle.intentOf(c.id);
      let status = '';
      let colour: number = SHADES.amber;
      if (c.hp <= 0) [status, colour] = ['Down', SHADES.dim];
      else if (c.staggered) [status, colour] = ['Staggered', SHADES.green];
      else if (c.exposed) [status, colour] = ['Open', SHADES.green];
      else if (c.guard > 1) [status, colour] = ['On guard', SHADES.cyan];
      if (c.side === 'enemy' && intent && c.hp > 0 && !c.staggered) {
        const m = MOVES[intent.move]!;
        status = `${status ? status + ' · ' : ''}${intentLabel(m)}`;
      }
      v.status.setText(status).setColor(colour);
      v.status.setX(Math.round(v.home.x - v.status.width / 2));
    }
  }

  private drawMenu(): void {
    const g = this.menuBox.clear();
    this.menuItems.forEach((t) => t.destroy());
    this.menuItems = [];
    if (!this.menu) {
      this.menuText.setText('');
      return;
    }
    g.fillStyle(SHADES.dim).fillRect(MENU.x, MENU.y, MENU.width, MENU.height);
    g.fillStyle(SHADES.shadow).fillRect(MENU.x + 1, MENU.y + 1, MENU.width - 2, MENU.height - 2);
    this.menu.options.forEach((o, i) => {
      const colour = !o.usable ? SHADES.woodPale : i === this.menu!.index ? SHADES.amber : SHADES.white;
      this.menuItems.push(new PixelText(this, MENU.x + 8, MENU.y + 6 + i * 11, o.label, { color: colour }).setDepth(19));
    });
    this.menuText.setText(this.menu.options[this.menu.index]!.text);
  }

  /** The ring closing on the target's head as the blow comes: the outer green band is a dodge, the bright inner one a parry. */
  private drawRing(): void {
    const r = this.reacting;
    if (!r) return;
    const t = this.views.get(r.target)!;
    const g = this.ring.clear();
    const cx = t.home.x;
    const cy = t.home.y - t.height + 12;
    const toRadius = (ms: number) => (ms / LUNGE) * RING;
    const remaining = Math.max(0, r.impactAt - this.time.now);
    g.lineStyle(1, SHADES.greenMid).strokeCircle(cx, cy, toRadius(r.window.dodge));
    if (r.window.parry) g.lineStyle(1, SHADES.green).strokeCircle(cx, cy, toRadius(r.window.parry));
    const grade = Battle.grade(remaining, r.window);
    g.lineStyle(2, r.pressedAt !== null ? SHADES.dim : grade === 'parry' ? SHADES.white : grade === 'dodge' ? SHADES.green : SHADES.amber).strokeCircle(cx, cy, toRadius(remaining));
  }

  // --- Effects ---

  /** The tell before an attack: he flashes and shudders. */
  private async telegraph(v: View): Promise<void> {
    playSound(this, 'tick');
    this.flashWhite(v, 90);
    this.time.delayedCall(180, () => this.flashWhite(v, 90));
    await this.tween(v.sprite, { x: v.home.x + 2, duration: 40, yoyo: true, repeat: 4 });
  }

  private flashWhite(v: View, ms: number): void {
    v.flash.setPosition(v.sprite.x, v.sprite.y).setAngle(v.sprite.angle).setAlpha(1);
    this.tweens.add({ targets: v.flash, alpha: 0, delay: ms / 2, duration: ms / 2, onUpdate: () => v.flash.setPosition(v.sprite.x, v.sprite.y) });
  }

  private sparks(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 10 + Math.random() * 16;
      const p = this.add.image(x, y, PIXEL).setTint(Phaser.Math.RND.pick([SHADES.white, SHADES.amber, SHADES.cyan])).setScale(Phaser.Math.Between(1, 2)).setDepth(12);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  }

  private floatText(text: string, x: number, y: number, colour: number): void {
    const t = new PixelText(this, x, y, text, { color: colour, shadow: SHADES.shadow, scale: 2 }).setDepth(15);
    t.setX(Math.round(x - t.width / 2));
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  private say(caption: string, hint: string): void {
    this.caption.setText(caption).setX(Math.round((W - this.caption.width) / 2));
    this.hint.setText(hint).setX(Math.round((W - this.hint.width) / 2));
  }

  private tween(target: Phaser.GameObjects.Image, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...config, targets: target, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}

/** What an enemy's about to do, over its head: the move, and how hard it'll hit. */
export function intentLabel(m: MoveDef): string {
  return m.damage ? `${m.name} ${m.damage}` : m.name;
}
