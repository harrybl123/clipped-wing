import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { COMBATANTS, ENCOUNTERS, ITEMS, MOVES } from '../data/combat';
import { getSession } from '../session';
import { Battle, type Action, type BattleEvent, type Combatant, type Intent, type Reaction, type ReactionWindow, type SideOf } from '../systems/Combat';
import { CARVER_BATTLE, silhouette, ZEALOT_BATTLE } from '../ui/battleSprites';
import { addLight, falloff, noise, rgb, SHADES } from '../ui/pixelArt';
import { PIXEL, makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { SPEAKERS } from '../ui/portraits';
import { playConfirm, playMove } from '../ui/sfx';
import { playSound } from '../ui/soundscape';
import { type FightMusic, startFightMusic } from '../ui/fightMusic';
import { stopScore } from '../ui/score';
import type { RowSprite } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';

// Turn-based combat (docs/combat-design.md). The rules are src/systems/Combat.ts and the fights are data
// in src/data/combat.ts; this scene stages them.
//
// The stage is framed 3/4, Persona style: you from behind, big in the near foreground and cropped at the
// waist; the enemy further back, facing you, on a painted market. The world is on its own camera, which
// pushes in on whoever acts, punches in on a hit and pulls back out for the menu; the menus, bars and
// cut-ins are on a second camera that never moves.
//
// On your turn a command menu slides in: Attack, Skill (SP), Guard, Item, Run where allowed (and All-out
// in fights that allow it). Hit a weakness or land a critical and he's thrown off balance; again before
// he recovers and he's down, and you get One More (a cut-in). What he's about to do isn't announced: you
// read it from his pose and a line over his head (his tell). When his attack comes, you react, by kind:
//   ring    a ring closes on your head as he lunges; press E while it's in the green donut
//   side    the same, but press Left or Right, away from the arm he drew back (A/D work too)
//   rhythm  two rings, one per blow, in quick succession
//   mash    he's got hold of you: mash E to break free before the bar runs out
// Too early and you can try again a moment later; too late is a miss; a miss is only the normal harm.
// When it's over, the outcome is written to ink and you're back in the area. Captions are PLACEHOLDER.

export interface CombatSceneData {
  encounter: string;
  /** Where to go back to afterwards (its `script` plays on arrival: the story's reaction). */
  back: AreaSceneData;
  /** Dev only: every enemy uses just this move (to try one reaction game at a time). */
  only?: string;
}

/** The line where the enemy stands, deep in the frame. */
const FLOOR = 190;
const HORIZON = 118;
/** The reaction ring's radius as the lunge starts; it closes to nothing as the blow lands. */
const RING = 56;
/** After a press that's too early, how long before you can try again (ms). */
const RETRY = 260;
/** The camera's framing for the menu: the whole stage. */
const WIDE = { x: W / 2, y: H / 2, zoom: 1 };

interface Look {
  poses: Record<string, RowSprite>;
  /** Party members are seen from behind, scaled up in the foreground. */
  scale: number;
}
/** Battle sprites for the `sprite` keys in combat data. */
const LOOKS: Record<string, Look> = {
  protagonist: { poses: CARVER_BATTLE, scale: 2 },
  zealot: { poses: ZEALOT_BATTLE, scale: 1 },
};

interface View {
  c: Combatant;
  sprite: Phaser.GameObjects.Image;
  /** A white silhouette over the sprite, for flashes. */
  flash: Phaser.GameObjects.Image;
  home: { x: number; y: number; scale: number };
  pose: string;
  /** Where the head is, relative to the sprite's feet, at home. */
  head: { x: number; y: number };
  /** A shadow on the floor that follows them. */
  shadow?: Phaser.GameObjects.Ellipse;
  /** Enemies: name, health and his tell over his head, on a dark plate (drawn on the UI camera, so it's always crisp). */
  tag?: { plate: Phaser.GameObjects.Graphics; name: PixelText; tell: PixelText };
  /** Health and SP as drawn: they drain towards the real values. */
  shown: { hp: number; lag: number; sp: number };
}

interface MenuItem {
  label: string;
  note?: string;
  usable: boolean;
  description: string;
}

export class CombatScene extends Phaser.Scene {
  private params!: CombatSceneData;
  private battle!: Battle;
  private world!: Phaser.GameObjects.Layer;
  private ui!: Phaser.GameObjects.Layer;
  private views = new Map<string, View>();
  private banner!: Phaser.GameObjects.Container;
  private bannerText!: PixelText;
  private hint!: PixelText;
  private ring!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private hudTexts: PixelText[] = [];
  private menuBox: Phaser.GameObjects.Container | null = null;
  private menu: { items: MenuItem[]; index: number; pick: (i: number | null) => void; title: string; back: boolean } | null = null;
  private reacting: { target: string; impactAt: number; lunge: number; pressedAt: number | null; key: SideOf | null; side?: SideOf; window: ReactionWindow; lockedUntil: number; cued: boolean } | null = null;
  private mashing: { target: string; presses: number; needed: number; startedAt: number; endsAt: number } | null = null;
  private meter!: Phaser.GameObjects.Graphics;
  /** A flurry shows each blow as it comes, so the events after it skip the reaction animations. */
  private beatsShown = false;
  /** The attack being played out was a hold (broken free of, not dodged). */
  private held = false;
  private music: FightMusic | null = null;
  private waitingPress: (() => void) | null = null;
  /** The zoom the camera was last asked to frame at (a punch returns to it). */
  private framedZoom = 1;

  constructor() {
    super('Combat');
  }

  init(data?: Partial<CombatSceneData>): void {
    this.params = { encounter: data?.encounter ?? 'market_scrap', back: data?.back ?? { areaId: 'roots-market' }, ...(data?.only ? { only: data.only } : {}) };
    this.views = new Map();
    this.menu = null;
    this.menuBox = null;
    this.reacting = null;
    this.mashing = null;
    this.beatsShown = false;
    this.waitingPress = null;
    this.hudTexts = [];
    this.music = null;
  }

  create(): void {
    const encounter = ENCOUNTERS[this.params.encounter];
    if (!encounter) throw new Error(`CombatScene: no encounter called "${this.params.encounter}"`);
    const only = import.meta.env.DEV ? this.params.only : undefined;
    const fighters = only && MOVES[only]
      ? Object.fromEntries(Object.entries(COMBATANTS).map(([id, c]) => [id, encounter.enemies.includes(id) ? { ...c, moves: [only], weights: [1] } : c]))
      : COMBATANTS;
    this.battle = new Battle(encounter, MOVES, fighters, ITEMS);

    // Two cameras: the world one moves; the UI one never does.
    this.world = this.add.layer().setDepth(0);
    this.ui = this.add.layer().setDepth(10);
    const uiCam = this.cameras.add(0, 0, W, H);
    uiCam.ignore(this.world);
    this.cameras.main.ignore(this.ui);
    this.cameras.main.setBounds(0, 0, W, H);

    makePaintedTexture(this, 'combat-stage', W, H, paintStage());
    this.w(this.add.image(0, 0, 'combat-stage').setOrigin(0));
    const party = this.battle.combatants.filter((c) => c.side === 'party');
    const enemies = this.battle.combatants.filter((c) => c.side === 'enemy');
    party.forEach((c, i) => this.addView(c, 118 + i * 96, H + 8));
    enemies.forEach((c, i) => this.addView(c, 270 + (i - (enemies.length - 1) / 2) * 70, FLOOR));
    this.ring = this.w(this.add.graphics().setDepth(30));

    // The UI: a slanted banner for what's happening, a hint under it, and the party's bars.
    const band = this.add.graphics();
    band.fillStyle(SHADES.shadow, 0.92).fillPoints([{ x: 0, y: 6 }, { x: W, y: 6 }, { x: W, y: 20 }, { x: 0, y: 24 }].map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    band.fillStyle(SHADES.white).fillRect(0, 24, W, 1);
    this.bannerText = new PixelText(this, 12, 10, '', { color: SHADES.white });
    this.banner = this.add.container(0, -30, [band, this.bannerText]);
    this.u(this.banner);
    this.hint = this.u(new PixelText(this, 0, 30, '', { color: SHADES.light, shadow: SHADES.shadow }));
    this.hud = this.u(this.add.graphics());
    this.meter = this.u(this.add.graphics());

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    this.input.on('pointerdown', () => this.onPress());
    // Breathing: idle poses swap back and forth.
    this.time.addEvent({ delay: 650, loop: true, callback: () => this.breathe() });
    this.cameras.main.fadeIn(500);
    uiCam.fadeIn(500);
    // The fight's music (any day's score gives way to it; the area brings that back afterwards).
    stopScore(this);
    this.startMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());
    this.refresh(true);
    // An opening sweep: from the enemy back to the whole stage.
    const foe = this.views.get(enemies[0]!.id)!;
    this.cameras.main.centerOn(foe.home.x, foe.home.y - 40).setZoom(2);
    this.time.delayedCall(300, () => void this.run());
  }

  override update(_time: number, delta: number): void {
    this.drawRing();
    this.drainBars(delta);
    for (const v of this.views.values()) v.shadow?.setPosition(v.sprite.x, v.home.y).setScale(v.sprite.scale / v.home.scale);
    this.placeTags();
    this.drawMeter();
    // Sound may still be locked when the fight starts (no key pressed yet); start the music once it isn't.
    if (!this.music && !this.battle.outcome) this.startMusic();
  }

  private startMusic(): void {
    const m = startFightMusic(this);
    // (A silent stand-in comes back while sound is locked; try again next frame.)
    if (this.sound.locked) return;
    this.music = m;
  }

  // --- The fight, turn by turn ---

  private async run(): Promise<void> {
    this.say('PLACEHOLDER: the fight starts.');
    await this.frame(WIDE, 900);
    await this.wait(300);
    while (!this.battle.outcome) {
      const actor = this.battle.current!;
      this.refresh();
      if (actor.side === 'party') await this.partyTurn(actor);
      else await this.enemyTurn(actor);
      this.refresh();
      await this.wait(250);
    }
    await this.end(this.battle.outcome);
  }

  private async partyTurn(actor: Combatant): Promise<void> {
    // Pull out for the menu; your guard drops as your turn comes round.
    this.setPose(this.views.get(actor.id)!, 'idle');
    await this.frame(WIDE, 350);
    const action = await this.chooseAction(actor);
    this.closeMenu();
    const view = this.views.get(actor.id)!;
    switch (action.type) {
      case 'attack':
      case 'skill': {
        const move = MOVES[action.type === 'attack' ? actor.def.basic! : action.move]!;
        this.say(move.name);
        if (move.target === 'self') {
          // Holding back: you stop, and let your hands drop.
          this.setPose(view, 'idle');
          await this.tween(view.sprite, { y: view.home.y + 6, duration: 300, yoyo: true });
          await this.play(this.battle.act(action));
          return;
        }
        const target = this.views.get(action.target ?? this.battle.living('enemy')[0]!.id)!;
        await this.lungeAt(view, target, move.id);
        await this.play(this.battle.act(action));
        await this.returnHome(view);
        return;
      }
      case 'guard':
        this.say('Guard');
        this.setPose(view, 'guard');
        await this.play(this.battle.act(action));
        return;
      case 'item':
        this.say(ITEMS[action.item]!.name);
        await this.play(this.battle.act(action));
        return;
      case 'run':
        this.say('Run');
        await this.play(this.battle.act(action));
        return;
      case 'allOut':
        await this.allOut(view, action);
        return;
    }
  }

  /** The command menu, and the skill and item lists behind it. */
  private async chooseAction(actor: Combatant): Promise<Action> {
    for (;;) {
      this.say(actor.def.name);
      const commands = this.battle.commands();
      const names: Record<Action['type'], [string, string]> = {
        allOut: ['All-out attack!', 'Everyone piles in while they’re down.'],
        attack: ['Attack', actor.def.basic ? MOVES[actor.def.basic]!.description : ''],
        skill: ['Skill', 'Use a skill. Costs SP.'],
        guard: ['Guard', 'Half harm until your next turn, and no knockdowns.'],
        item: ['Item', 'Use something you carry.'],
        run: ['Run', 'Get out of here.'],
      };
      const i = await this.openMenu('', commands.map((c) => ({ label: names[c.type][0], usable: c.usable, description: c.usable ? names[c.type][1] : (c.reason ?? '') })), false);
      const type = commands[i!]!.type;
      if (type === 'skill') {
        const skills = this.battle.skills();
        const s = await this.openMenu('Skill', skills.map((k) => ({ label: k.move.name, note: k.move.sp ? `${k.move.sp} SP` : '', usable: k.usable, description: k.usable ? k.move.description : (k.reason ?? '') })), true);
        if (s === null) continue;
        const move = skills[s]!.move;
        const target = move.target === 'enemy' ? await this.chooseTarget() : undefined;
        if (move.target === 'enemy' && target === null) continue;
        return { type: 'skill', move: move.id, ...(target ? { target } : {}) };
      }
      if (type === 'item') {
        const items = [...this.battle.items.entries()];
        const s = await this.openMenu('Item', items.map(([id, n]) => ({ label: ITEMS[id]!.name, note: `x${n}`, usable: true, description: ITEMS[id]!.description })), true);
        if (s === null) continue;
        return { type: 'item', item: items[s]![0] };
      }
      if (type === 'attack') {
        const target = await this.chooseTarget();
        if (target === null) continue;
        return { type: 'attack', ...(target ? { target } : {}) };
      }
      return { type } as Action;
    }
  }

  /** With one enemy, no question; with more, a list. Null if you backed out. */
  private async chooseTarget(): Promise<string | undefined | null> {
    const foes = this.battle.living('enemy');
    if (foes.length === 1) return undefined;
    const t = await this.openMenu('Who?', foes.map((f) => ({ label: f.def.name, usable: true, description: f.down ? 'Down.' : '' })), true);
    return t === null ? null : foes[t]!.id;
  }

  private async enemyTurn(actor: Combatant): Promise<void> {
    const view = this.views.get(actor.id)!;
    const intent = this.battle.intentOf(actor.id);
    if (!intent) {
      // His big blow was broken: he spends the turn finding his feet.
      this.say(`${actor.def.name} stumbles.`);
      await this.tween(view.sprite, { angle: { from: 5, to: 0 }, duration: 400 });
      await this.play(this.battle.enemyTurn());
      return;
    }
    const move = MOVES[intent.move]!;
    const target = this.battle.get(intent.target).hp > 0 ? intent.target : this.battle.living('party')[0]!.id;
    // Push in on him as he moves.
    this.say(`${actor.def.name}: ${move.name}`);
    await this.frame({ x: view.home.x, y: view.home.y - 34, zoom: 2 }, 300);
    if (move.target !== 'enemy') {
      if (move.windsUp) {
        this.setPose(view, 'windup');
        playSound(this, 'creak');
        await this.tween(view.sprite, { x: view.home.x + 3, duration: 50, yoyo: true, repeat: 5 });
      } else {
        this.setPose(view, 'jeer');
        playSound(this, 'jeer');
        await this.tween(view.sprite, { y: view.home.y - 3, duration: 120, yoyo: true, repeat: 2 });
        this.setPose(view, 'idle');
      }
      await this.play(this.battle.enemyTurn());
      await this.wait(300);
      return;
    }
    // The tell's last moment: he flashes and shudders.
    playSound(this, 'tick');
    this.flashWhite(view, 80);
    this.time.delayedCall(170, () => this.flashWhite(view, 80));
    await this.tween(view.sprite, { x: view.home.x + 2, duration: 40, yoyo: true, repeat: 4 });
    // Then he comes at you, and you react, by the kind of attack.
    const t = this.views.get(target)!;
    const window = this.battle.reactionWindow(move.id, target);
    void this.frame({ x: (t.home.x + view.home.x) / 2, y: 170, zoom: 1.25 }, 220);
    const reactions: Reaction[] = [];
    const hits = move.hits ?? 1;
    this.beatsShown = hits > 1;
    this.held = window?.kind === 'mash';
    if (window?.kind === 'mash') reactions.push(await this.breakFree(view, t, window));
    else {
      for (let i = 0; i < hits; i++) {
        const lunge = Math.round(this.battle.timing.lunge * (i === 0 ? 1 : 0.6));
        reactions.push(await this.blow(view, t, window, intent, lunge, i, hits));
      }
    }
    await this.play(this.battle.enemyTurn(reactions));
    this.beatsShown = false;
    await this.returnHome(view);
  }

  /** One blow coming at you: he lunges, the ring closes, you press (or don't). */
  private async blow(view: View, t: View, window: ReactionWindow | null, intent: Intent, lunge: number, i: number, hits: number): Promise<Reaction> {
    if (window) {
      this.reacting = { target: t.c.id, impactAt: this.time.now + lunge, lunge, pressedAt: null, key: null, window, lockedUntil: 0, cued: false, ...(intent.side ? { side: intent.side } : {}) };
      if (i === 0) this.setPose(t, 'ready');
      this.hintText(
        window.kind === 'side' ? 'Dodge away from his swing: Left or Right as the ring crosses the green.'
          : hits > 1 ? `Blow ${i + 1} of ${hits}: press E as the ring crosses the green.`
            : 'Press E as the ring crosses the green.',
      );
    }
    this.setPose(view, 'attack');
    playSound(this, 'whoosh', 0.6);
    if (i === 0) await this.tween(view.sprite, { x: t.home.x + 70, y: H - 14, scale: 2, duration: lunge, ease: 'Quad.easeIn' });
    else {
      // Pulls back, and comes again.
      this.setPose(view, 'windup');
      await this.tween(view.sprite, { x: t.home.x + 84, y: H - 22, duration: lunge * 0.35, ease: 'Quad.easeOut' });
      this.setPose(view, 'attack');
      await this.tween(view.sprite, { x: t.home.x + 70, y: H - 14, duration: lunge * 0.65, ease: 'Quad.easeIn' });
    }
    let reaction: Reaction = 'none';
    const r = this.reacting;
    if (r) {
      const before = r.pressedAt === null ? null : r.impactAt - r.pressedAt;
      reaction = r.window.kind === 'side' ? Battle.gradeSide(before, r.key, r.side ?? 'left', r.window) : Battle.grade(before, r.window);
      this.reacting = null;
      this.ring.clear();
      this.hintText('');
    }
    if (hits > 1) {
      // A flurry: each blow lands (or misses) as it comes.
      if (reaction === 'none') {
        playSound(this, 'hit');
        this.flashWhite(t, 90);
        this.cameras.main.shake(120, 0.006);
        this.setPose(t, 'hit');
      } else {
        playSound(this, 'whoosh');
        this.setPose(t, 'dodge');
        this.popLabel('DODGE', t, SHADES.green);
      }
    }
    return reaction;
  }

  /** He's got hold of you: mash E to break free before the time runs out (a dodge: half harm). */
  private async breakFree(view: View, t: View, window: ReactionWindow): Promise<Reaction> {
    this.setPose(view, 'reach');
    playSound(this, 'whoosh', 0.6);
    await this.tween(view.sprite, { x: t.home.x + 52, y: H - 18, scale: 2, duration: 450, ease: 'Quad.easeIn' });
    playSound(this, 'skid');
    this.setPose(t, 'hit');
    this.cameras.main.shake(150, 0.006);
    this.hintText('He’s got hold of you! Mash E to break free.');
    this.mashing = { target: t.c.id, presses: 0, needed: window.presses, startedAt: this.time.now, endsAt: this.time.now + window.time };
    // Shaken while he holds on.
    const shake = this.tweens.add({ targets: t.sprite, x: t.home.x + 3, duration: 70, yoyo: true, repeat: -1 });
    while (this.mashing && this.mashing.presses < this.mashing.needed && this.time.now < this.mashing.endsAt) await this.wait(30);
    shake.stop();
    t.sprite.x = t.home.x;
    const reaction = Battle.gradeMash(this.mashing?.presses ?? 0, window);
    this.mashing = null;
    this.hintText('');
    if (reaction !== 'none') {
      playSound(this, 'whoosh');
      this.setPose(t, 'shove');
      await this.tween(view.sprite, { x: view.sprite.x + 24, duration: 140, ease: 'Quad.easeOut' });
    }
    return reaction;
  }

  /** What happened: a sound, a pose and a tween for each event, in order. */
  private async play(events: BattleEvent[]): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'reaction': {
          const t = this.views.get(e.target)!;
          if (this.beatsShown) break;
          if (e.reaction === 'dodge' && this.held) this.popLabel('FREE!', t, SHADES.green);
          else if (e.reaction === 'dodge') {
            playSound(this, 'whoosh');
            this.setPose(t, 'dodge');
            this.popLabel('DODGE', t, SHADES.green);
            await this.tween(t.sprite, { x: t.home.x - 14, duration: 90 });
          } else if (e.reaction === 'parry') {
            // The perfect moment: everything slows, sparks fly where you met.
            playSound(this, 'staff');
            playConfirm(this);
            this.setPose(t, 'guard');
            const a = this.views.get(e.actor)!;
            this.sparks((t.sprite.x + a.sprite.x) / 2 + 10, t.home.y - 90);
            this.cameras.main.flash(140, 244, 241, 232);
            this.popLabel('PARRY!', t, SHADES.white);
            this.tweens.timeScale = 0.2;
            await this.wait(420);
            this.tweens.timeScale = 1;
          }
          break;
        }
        case 'interrupt': {
          const t = this.views.get(e.target)!;
          playSound(this, 'crack');
          this.popLabel('BROKEN!', t, SHADES.white, 30);
          break;
        }
        case 'counter': {
          const a = this.views.get(e.actor)!;
          this.say('Counter!');
          this.setPose(a, 'attack');
          await this.tween(a.sprite, { y: a.home.y - 8, duration: 80, yoyo: true });
          break;
        }
        case 'damage':
          await this.hurt(e);
          break;
        case 'knockdown': {
          const t = this.views.get(e.target)!;
          playSound(this, 'thump');
          this.popLabel('DOWN', t, SHADES.amber, 18);
          await this.knockDown(t);
          break;
        }
        case 'oneMore':
          await this.cutIn('ONE MORE!', e.actor);
          break;
        case 'getUp': {
          const t = this.views.get(e.target)!;
          this.say(`${t.c.def.name} gets up.`);
          await this.frame({ x: t.home.x, y: t.home.y - 34, zoom: 2 }, 250);
          this.setPose(t, 'hit');
          t.sprite.setPosition(t.home.x, t.home.y).setAngle(0);
          playSound(this, 'shuffle');
          await this.tween(t.sprite, { y: t.home.y - 8, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
          this.setPose(t, this.restPose(t));
          break;
        }
        case 'offBalance': {
          const t = this.views.get(e.target)!;
          playSound(this, 'skid');
          this.popLabel('OFF BALANCE', t, SHADES.amber, 18);
          this.setPose(t, 'wobble');
          await this.tween(t.sprite, { angle: 6, duration: 110, yoyo: true, repeat: 1 });
          break;
        }
        case 'recover': {
          const t = this.views.get(e.target)!;
          if (t.c.side === 'enemy' && t.pose === 'wobble') this.setPose(t, 'idle');
          break;
        }
        case 'guard': {
          const t = this.views.get(e.actor)!;
          playSound(this, 'tap');
          this.popLabel('GUARD', t, SHADES.cyan);
          break;
        }
        case 'heal': {
          const t = this.views.get(e.target)!;
          playSound(this, 'chime');
          this.popLabel('+', t, SHADES.green);
          break;
        }
        case 'defeated': {
          const t = this.views.get(e.target)!;
          playSound(this, 'thump');
          this.cameras.main.shake(300, 0.012);
          if (t.c.side === 'enemy') await this.knockDown(t);
          else await this.tween(t.sprite, { y: t.home.y + 30, duration: 500 });
          t.sprite.setAlpha(0.75);
          break;
        }
        default:
          break;
      }
      this.refresh();
      await this.wait(90);
    }
  }

  private async hurt(e: Extract<BattleEvent, { type: 'damage' }>): Promise<void> {
    const t = this.views.get(e.target)!;
    const big = e.amount >= 15 || e.weak || e.crit;
    playSound(this, big ? 'punch' : 'hit', big ? 1.2 : 1);
    if (t.c.hp > 0 || e.hp > 0) this.setPose(t, 'hit');
    this.flashWhite(t, 110);
    // Shake and punch in, harder for more harm; a moment's freeze on the hit.
    const k = Math.min(1, e.amount / 20);
    this.cameras.main.shake(140 + k * 220, 0.004 + k * 0.014);
    this.zoomPunch(0.06 + k * 0.1);
    this.tweens.pauseAll();
    await this.wait(50 + k * 90);
    this.tweens.resumeAll();
    this.popNumber(e.amount, t, big ? SHADES.amber : SHADES.white);
    if (e.weak) this.popLabel('WEAK!', t, SHADES.amber, 18);
    else if (e.crit) this.popLabel('CRITICAL!', t, SHADES.amber, 18);
    else if (e.resisted) this.popLabel('RESIST', t, SHADES.dim, 18);
    else if (e.guarded) this.popLabel('GUARDED', t, SHADES.cyan, 18);
    this.refresh();
    const back = t.c.side === 'enemy' ? 8 : -8;
    await this.tween(t.sprite, { x: t.sprite.x + back, duration: 80, yoyo: true });
    if (e.hp > 0) this.setPose(t, this.restPose(t));
  }

  /** Down he goes: thrown back, then flat on the boards with a puff of dust. */
  private async knockDown(t: View): Promise<void> {
    if (t.c.side !== 'enemy') {
      this.setPose(t, 'hit');
      await this.tween(t.sprite, { angle: -12, y: t.home.y + 10, duration: 300 });
      return;
    }
    this.setPose(t, 'hit');
    await this.tween(t.sprite, { y: t.home.y - 10, x: t.home.x + 6, duration: 120, ease: 'Quad.easeOut' });
    this.setPose(t, 'down');
    t.sprite.setPosition(t.home.x + 6, t.home.y - 6);
    await this.tween(t.sprite, { y: t.home.y, duration: 160, ease: 'Bounce.easeOut' });
    playSound(this, 'thump', 0.8);
    this.dust(t.home.x, t.home.y);
    this.cameras.main.shake(120, 0.006);
  }

  /** How someone stands when nothing's happening to them: down, off balance, guarding, winding up, or at ease. */
  private restPose(v: View): string {
    if (v.c.down) return 'down';
    if (v.c.offBalance > 0 && v.c.side === 'enemy') return 'wobble';
    if (v.c.guarding) return 'guard';
    const intent = this.battle.intentOf(v.c.id);
    if (v.c.side === 'enemy' && intent?.tell) return tellPose(intent);
    return 'idle';
  }

  private dust(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const p = this.w(this.add.image(x + Phaser.Math.Between(-30, 30), y - Phaser.Math.Between(0, 4), PIXEL).setTint(Phaser.Math.RND.pick([SHADES.woodPale, SHADES.dim])).setScale(Phaser.Math.Between(2, 4)).setDepth(7));
      this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(6, 16), x: p.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: 500 + i * 20, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  }

  /** Every enemy down: a cut-in, then everyone piles in under a cloud of dust. */
  private async allOut(view: View, action: Action): Promise<void> {
    await this.cutIn('ALL-OUT ATTACK!', view.c.id);
    const foes = this.battle.living('enemy').map((f) => this.views.get(f.id)!);
    const cx = foes.reduce((s, f) => s + f.home.x, 0) / foes.length;
    await this.frame({ x: cx, y: FLOOR - 30, zoom: 2 }, 250);
    view.sprite.setVisible(false);
    const cloud: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 26; i++) {
      const p = this.w(this.add.image(cx + Phaser.Math.Between(-40, 40), FLOOR - Phaser.Math.Between(4, 60), PIXEL).setTint(Phaser.Math.RND.pick([SHADES.woodPale, SHADES.woodLight, SHADES.dim])).setScale(Phaser.Math.Between(6, 14)).setAlpha(0).setDepth(20));
      cloud.push(p);
      this.tweens.add({ targets: p, alpha: 0.95, duration: 160, delay: i * 8 });
      this.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-6, 6), y: p.y + Phaser.Math.Between(-6, 6), duration: 200, yoyo: true, repeat: 4 });
    }
    for (let i = 0; i < 7; i++) {
      await this.wait(130);
      playSound(this, i % 2 ? 'hit' : 'punch', 0.8);
      this.sparks(cx + Phaser.Math.Between(-36, 36), FLOOR - Phaser.Math.Between(10, 56));
      this.cameras.main.shake(90, 0.008);
    }
    const events = this.battle.act(action);
    cloud.forEach((p) => this.tweens.add({ targets: p, alpha: 0, scale: 2, duration: 300, onComplete: () => p.destroy() }));
    view.sprite.setVisible(true);
    await this.play(events.filter((e) => e.type !== 'allOut'));
  }

  private async end(outcome: string): Promise<void> {
    // Ink is the only store of story state: the outcome is written there, and the story takes it from here.
    const { story } = getSession(this);
    const vars = this.battle.encounter.outcomes[outcome] ?? {};
    for (const [name, value] of Object.entries(vars)) story.setVariable(name, value);
    const set = Object.entries(vars).map(([k, v]) => `${k} = ${String(v)}`).join(', ');
    if (outcome === 'won') this.music?.sting('win');
    else if (outcome === 'lost') this.music?.sting('lose');
    else this.music?.stop();
    await this.frame(WIDE, 500);
    this.say(`PLACEHOLDER: the fight is over (${outcome}).`);
    this.hintText(set ? `${set}. Press E.` : 'Press E.');
    await new Promise<void>((resolve) => (this.waitingPress = resolve));
    for (const cam of this.cameras.cameras) cam.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  // --- Moving people about ---

  private async lungeAt(view: View, target: View, move: string): Promise<void> {
    // Each move has its own pose where there is one (slap, shove, grab); else a plain attack.
    const look = LOOKS[view.c.def.sprite] ?? LOOKS.zealot!;
    this.setPose(view, look.poses[move] ? move : 'attack');
    playSound(this, 'whoosh', 0.7);
    void this.frame({ x: target.home.x - 20, y: target.home.y - 40, zoom: 1.6 }, 200);
    // Into the frame, towards him: up, across and smaller as you go deeper.
    await this.tween(view.sprite, { x: target.home.x - 46, y: target.home.y + 74, scale: view.home.scale * 0.75, duration: 200, ease: 'Quad.easeIn' });
  }

  private async returnHome(view: View): Promise<void> {
    await this.tween(view.sprite, { x: view.home.x, y: view.home.y, scale: view.home.scale, duration: 260, ease: 'Quad.easeOut' });
    if (view.c.hp > 0) this.setPose(view, this.restPose(view));
  }

  // --- Input ---

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (this.reacting?.window.kind === 'side' && (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd')) {
      this.onPress(k === 'arrowleft' || k === 'a' ? 'left' : 'right');
    } else if (this.menu && (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's')) {
      const n = this.menu.items.length;
      this.menu.index = (this.menu.index + (k === 'arrowup' || k === 'w' ? n - 1 : 1)) % n;
      playMove(this);
      this.drawMenu();
    } else if (this.menu?.back && (k === 'escape' || k === 'q' || k === 'x' || k === 'backspace')) {
      const pick = this.menu.pick;
      playMove(this);
      this.menu = null;
      pick(null);
    } else if (k === 'e' || k === ' ' || k === 'enter') this.onPress();
  }

  private onPress(key?: SideOf): void {
    if (this.mashing) {
      // Every press counts towards breaking his hold.
      if (key) return;
      this.mashing.presses++;
      playSound(this, 'tap', 0.6);
      const t = this.views.get(this.mashing.target)!;
      this.tweens.add({ targets: t.sprite, y: t.home.y - 3, duration: 50, yoyo: true });
      return;
    }
    if (this.reacting) {
      const r = this.reacting;
      if (r.pressedAt !== null || this.time.now < r.lockedUntil) return;
      // A side attack wants an arrow, not E.
      if (r.window.kind === 'side' && !key) return;
      // Too early: nothing lost, just a moment before you can try again. (Too late counts: it's a miss.)
      if (Battle.tooEarly(r.impactAt - this.time.now, r.window)) {
        r.lockedUntil = this.time.now + RETRY;
        playSound(this, 'tap', 0.5);
        return;
      }
      r.pressedAt = this.time.now;
      r.key = key ?? null;
      return;
    }
    if (this.menu) {
      const { items, index, pick } = this.menu;
      if (!items[index]!.usable) return;
      playConfirm(this);
      this.menu = null;
      pick(index);
    } else if (this.waitingPress) {
      const resolve = this.waitingPress;
      this.waitingPress = null;
      resolve();
    }
  }

  // --- The menu ---

  private openMenu(title: string, items: MenuItem[], back: boolean): Promise<number | null> {
    return new Promise((resolve) => {
      this.menu = { items, index: Math.max(0, items.findIndex((o) => o.usable)), pick: resolve, title, back };
      this.drawMenu(true);
    });
  }

  private closeMenu(): void {
    const box = this.menuBox;
    this.menuBox = null;
    if (box) this.tweens.add({ targets: box, x: W, duration: 140, ease: 'Quad.easeIn', onComplete: () => box.destroy() });
    this.hintText('');
  }

  /** Slanted panels down the right-hand side, the chosen one pulled out and lit; it slides in. */
  private drawMenu(slide = false): void {
    const m = this.menu;
    const old = this.menuBox;
    if (!m) return;
    const items: Phaser.GameObjects.GameObject[] = [];
    const g = this.add.graphics();
    items.push(g);
    const top = 146 - Math.max(0, m.items.length - 5) * 15;
    const rowH = 15;
    if (m.title) items.push(new PixelText(this, 362, top - 12, m.title, { color: SHADES.amber, shadow: SHADES.shadow }));
    m.items.forEach((item, i) => {
      const on = i === m.index;
      const x = 350 + i * 5 - (on ? 12 : 0);
      const y = top + i * rowH;
      const pts = [[x + 6, y], [W + 4, y], [W + 4, y + rowH - 3], [x, y + rowH - 3]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!));
      if (on) g.fillStyle(SHADES.redDark).fillPoints(pts.map((p) => new Phaser.Math.Vector2(p.x - 4, p.y + 2)), true);
      g.fillStyle(on ? SHADES.white : SHADES.shadow, on ? 1 : 0.9).fillPoints(pts, true);
      if (!on) g.lineStyle(1, SHADES.woodPale).strokePoints(pts, true);
      const colour = !item.usable ? SHADES.woodPale : on ? SHADES.shadow : SHADES.white;
      items.push(new PixelText(this, x + 12, y + 3, item.label, { color: colour }));
      if (item.note) {
        const note = new PixelText(this, 0, y + 3, item.note, { color: on ? SHADES.woodLight : SHADES.cyan });
        note.setX(W - 10 - note.width);
        items.push(note);
      }
    });
    const box = this.add.container(slide ? 160 : 0, 0, items);
    this.u(box);
    old?.destroy();
    this.menuBox = box;
    if (slide) this.tweens.add({ targets: box, x: 0, duration: 180, ease: 'Back.easeOut' });
    this.hintText(m.items[m.index]!.description + (m.back ? '   (Esc: back)' : ''));
  }

  // --- Drawing ---

  private addView(c: Combatant, x: number, y: number): void {
    const look = LOOKS[c.def.sprite] ?? LOOKS.zealot!;
    const keyFor = (pose: string, white = false) => {
      const s = look.poses[pose] ?? look.poses.idle!;
      const colours = white ? Object.fromEntries(Object.keys(s.colours).map((k) => [k, SHADES.white])) : s.colours;
      return makeSpriteTexture(this, `battle-${c.def.sprite}-${pose}${white ? '-white' : ''}`, s.rows, colours);
    };
    for (const pose of Object.keys(look.poses)) {
      keyFor(pose);
      keyFor(pose, true);
    }
    const party = c.side === 'party';
    const sprite = this.w(this.add.image(x, y, keyFor('idle')).setOrigin(0.5, 1).setScale(look.scale).setDepth(party ? 12 : 5));
    const flash = this.w(this.add.image(x, y, keyFor('idle', true)).setOrigin(0.5, 1).setScale(look.scale).setDepth(party ? 13 : 6).setAlpha(0));
    const idle = look.poses.idle!;
    const height = idle.rows.length * look.scale;
    const view: View = {
      c, sprite, flash, home: { x, y, scale: look.scale }, pose: 'idle',
      head: { x: 0, y: party ? -height + 22 * look.scale : -height + 10 },
      shown: { hp: c.hp, lag: c.hp, sp: c.sp },
    };
    if (!party) {
      // A ground shadow, and the name, health and next move over his head.
      view.shadow = this.w(this.add.ellipse(x, y, 40, 7, SHADES.shadow, 0.65).setDepth(4));
      view.tag = {
        plate: this.u(this.add.graphics()),
        name: this.u(new PixelText(this, 0, 0, c.def.name, { color: SHADES.white })),
        tell: this.u(new PixelText(this, 0, 0, '', { color: SHADES.light })),
      };
    }
    this.views.set(c.id, view);
  }

  private setPose(v: View, pose: string): void {
    const look = LOOKS[v.c.def.sprite] ?? LOOKS.zealot!;
    const p = look.poses[pose] ? pose : 'idle';
    v.pose = p;
    v.sprite.setTexture(`battle-${v.c.def.sprite}-${p}`);
    v.flash.setTexture(`battle-${v.c.def.sprite}-${p}-white`);
  }

  private breathe(): void {
    for (const v of this.views.values()) {
      if (v.pose === 'idle' || v.pose === 'breathe') this.setPose(v, v.pose === 'idle' ? 'breathe' : 'idle');
      // Off balance, he sways.
      else if (v.pose === 'wobble' && !this.tweens.isTweening(v.sprite)) this.tweens.add({ targets: v.sprite, angle: Phaser.Math.RND.pick([-3, 3]), duration: 300, yoyo: true });
    }
  }

  /** Names, his tell, and the pose he takes for it. `snap` sets the drawn bars to the real values at once. */
  private refresh(snap = false): void {
    for (const v of this.views.values()) {
      if (snap) v.shown = { hp: v.c.hp, lag: v.c.hp, sp: v.c.sp };
      if (!v.tag) continue;
      const i = this.battle.intentOf(v.c.id);
      let text = '';
      let colour: number = SHADES.light;
      if (v.c.hp <= 0) text = '';
      else if (v.c.down) [text, colour] = ['Down', SHADES.amber];
      else if (v.c.offBalance > 0) [text, colour] = ['Off balance', SHADES.amber];
      else if (i?.tell) text = i.tell.line;
      v.tag.tell.setText(text).setColor(colour);
      // Standing waiting, he takes the pose of what he's about to do (his tell).
      const resting = ['idle', 'breathe', 'squared', 'shift', 'cockL', 'cockR', 'reach', 'glance', 'wobble', 'down'].includes(v.pose);
      if (resting && this.battle.current?.id !== v.c.id && !this.tweens.isTweening(v.sprite)) {
        const pose = this.restPose(v);
        if (pose !== v.pose && !(pose === 'idle' && v.pose === 'breathe')) this.setPose(v, pose);
      }
    }
  }

  /** The plates over enemies' heads: on the UI camera, following where they stand on screen. */
  private placeTags(): void {
    const cam = this.cameras.main;
    for (const v of this.views.values()) {
      if (!v.tag) continue;
      const { plate, name, tell } = v.tag;
      // (Hidden while you react: the ring and the meter need the room.)
      const show = v.c.hp > 0 && !this.reacting && !this.mashing;
      for (const o of [plate, name, tell]) o.setVisible(show);
      if (!show) continue;
      const top = v.c.down ? v.sprite.y - 30 : v.sprite.y - v.sprite.displayHeight - 4;
      const sx = (v.sprite.x - cam.worldView.x) * cam.zoom;
      const sy = (top - cam.worldView.y) * cam.zoom;
      const bw = 44;
      const width = Math.max(bw, name.width, tell.width) + 8;
      const height = tell.text ? 30 : 20;
      const x = Math.round(Phaser.Math.Clamp(sx - width / 2, 4, W - width - 4));
      const y = Math.round(Phaser.Math.Clamp(sy - height, 38, H - height - 4));
      const g = plate.clear();
      g.fillStyle(SHADES.shadow, 0.88).fillRect(x, y, width, height);
      g.lineStyle(1, SHADES.woodLight).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
      name.setPosition(Math.round(x + (width - name.width) / 2), y + 3);
      const by = y + 12;
      const bx = Math.round(x + (width - bw) / 2);
      g.fillStyle(SHADES.deep).fillRect(bx - 1, by - 1, bw + 2, 5);
      g.fillStyle(SHADES.woodLight).fillRect(bx, by, bw, 3);
      g.fillStyle(SHADES.amber).fillRect(bx, by, Math.round((bw * v.shown.lag) / v.c.def.hp), 3);
      g.fillStyle(SHADES.green).fillRect(bx, by, Math.round((bw * v.shown.hp) / v.c.def.hp), 3);
      // Pips beside the bar: how close he is to going down.
      const poise = v.c.def.poise ?? 1;
      if (poise > 1) for (let n = 0; n < poise; n++) g.fillStyle(n < v.c.offBalance || v.c.down ? SHADES.amber : SHADES.woodLight).fillRect(bx + bw + 3, by - 1 + n * 3, 2, 2);
      tell.setPosition(Math.round(x + (width - tell.width) / 2), y + 19);
    }
  }

  /** Breaking free: how many presses you've made, and how long you've got. */
  private drawMeter(): void {
    const g = this.meter.clear();
    const m = this.mashing;
    if (!m) return;
    const w = 120;
    const x = Math.round((W - w) / 2);
    const y = 46;
    g.fillStyle(SHADES.shadow, 0.9).fillRect(x - 4, y - 4, w + 8, 16);
    g.lineStyle(1, SHADES.woodLight).strokeRect(x - 3.5, y - 3.5, w + 7, 15);
    g.fillStyle(SHADES.woodLight).fillRect(x, y, w, 4);
    g.fillStyle(SHADES.green).fillRect(x, y, Math.round((w * Math.min(m.presses, m.needed)) / m.needed), 4);
    const left = Math.max(0, (m.endsAt - this.time.now) / (m.endsAt - m.startedAt));
    g.fillStyle(SHADES.amber).fillRect(x, y + 6, Math.round(w * left), 2);
  }

  /** Bars drain smoothly towards the real values; a pale chunk shows what was just lost, then catches up. */
  private drainBars(delta: number): void {
    const step = (from: number, to: number, rate: number) => (Math.abs(to - from) < rate ? to : from + Math.sign(to - from) * rate);
    for (const v of this.views.values()) {
      v.shown.hp = step(v.shown.hp, v.c.hp, (delta / 1000) * 40);
      v.shown.lag = v.shown.lag < v.shown.hp ? v.shown.hp : step(v.shown.lag, v.shown.hp, (delta / 1000) * 14);
      v.shown.sp = step(v.shown.sp, v.c.sp, (delta / 1000) * 12);
    }
    this.drawHud();
  }

  /** The party's panel, bottom right: name, health and SP, as slanted bars. */
  private drawHud(): void {
    const g = this.hud.clear();
    const party = [...this.views.values()].filter((v) => v.c.side === 'party');
    while (this.hudTexts.length < party.length * 2) this.hudTexts.push(this.u(new PixelText(this, 0, 0, '', { color: SHADES.white })));
    party.forEach((v, i) => {
      const x = 330 - i * 8;
      const y = H - 42 - i * 34;
      const pts = [[x + 8, y], [W, y], [W, y + 34], [x, y + 34]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!));
      g.fillStyle(SHADES.shadow, 0.94).fillPoints(pts, true);
      g.lineStyle(1, SHADES.woodPale).strokePoints(pts, true);
      g.fillStyle(SHADES.red).fillRect(x + 6, y + 1, 3, 33);
      const [name, nums] = [this.hudTexts[i * 2]!, this.hudTexts[i * 2 + 1]!];
      name.setText(v.c.def.name).setPosition(x + 16, y + 4);
      const hp = Math.round(v.shown.hp);
      nums.setText(`HP ${hp}   SP ${Math.round(v.shown.sp)}`).setPosition(x + 16, y + 13).setColor(hp <= v.c.def.hp / 4 ? SHADES.amber : SHADES.light);
      const bw = W - x - 26;
      const bar = (by: number, value: number, lag: number, max: number, colour: number) => {
        g.fillStyle(SHADES.deep).fillRect(x + 15, by - 1, bw + 2, 5);
        g.fillStyle(SHADES.woodLight).fillRect(x + 16, by, bw, 3);
        g.fillStyle(SHADES.amber).fillRect(x + 16, by, Math.round((bw * lag) / Math.max(1, max)), 3);
        g.fillStyle(colour).fillRect(x + 16, by, Math.round((bw * value) / Math.max(1, max)), 3);
      };
      bar(y + 23, v.shown.hp, v.shown.lag, v.c.def.hp, SHADES.green);
      bar(y + 28, v.shown.sp, v.shown.sp, v.c.def.sp ?? 0, SHADES.cyan);
    });
  }

  /**
   * The ring closing on the target's head as the blow comes, and the donut it must be inside when you
   * press: a green band from `dodge` in to `late` (and, for those who can parry, a bright inner edge).
   * Outside the band, a press is too early (try again) or too late (a miss). For a side attack, arrows
   * either side.
   */
  private drawRing(): void {
    const r = this.reacting;
    if (!r) return;
    const t = this.views.get(r.target)!;
    const g = this.ring.clear();
    const cx = t.home.x + t.head.x;
    const cy = t.home.y + t.head.y;
    const toRadius = (ms: number) => (ms / r.lunge) * RING;
    const remaining = Math.max(0, r.impactAt - this.time.now);
    const grade = Battle.grade(remaining, r.window);
    // The cue: the moment the ring reaches the band, the band lights up and chimes.
    if (grade !== 'none' && !r.cued) {
      r.cued = true;
      if (r.pressedAt === null) playSound(this, 'chime', 0.6);
    }
    const outer = toRadius(r.window.dodge);
    const inner = toRadius(r.window.late);
    const lit = grade !== 'none' && r.pressedAt === null;
    g.lineStyle(outer - inner, lit ? SHADES.greenMid : SHADES.greenDeep, lit ? 0.8 : 0.55).strokeCircle(cx, cy, (outer + inner) / 2);
    g.lineStyle(1, lit ? SHADES.green : SHADES.greenMid).strokeCircle(cx, cy, outer);
    g.lineStyle(1, SHADES.green).strokeCircle(cx, cy, inner);
    if (r.window.parry) g.lineStyle(1, SHADES.white).strokeCircle(cx, cy, toRadius(r.window.late + r.window.parry));
    const locked = this.time.now < r.lockedUntil;
    const late = remaining < r.window.late;
    const colour = r.pressedAt !== null || locked || late ? SHADES.dim : grade !== 'none' ? SHADES.white : SHADES.amber;
    g.lineStyle(2, colour).strokeCircle(cx, cy, Math.max(1, toRadius(remaining)));
    if (r.window.kind === 'side') {
      // Arrows either side: which one is yours to work out.
      for (const dir of [-1, 1]) {
        const ax = cx + dir * (RING + 8);
        g.fillStyle(SHADES.white).fillTriangle(ax + dir * 6, cy, ax, cy - 5, ax, cy + 5);
      }
    }
  }

  // --- Effects ---

  /** Moves the world camera to frame a point (resolves when it gets there). */
  private frame(f: { x: number; y: number; zoom: number }, ms: number): Promise<void> {
    const cam = this.cameras.main;
    this.framedZoom = f.zoom;
    cam.pan(f.x, f.y, ms, 'Sine.easeInOut', true);
    cam.zoomTo(f.zoom, ms, 'Sine.easeInOut', true);
    // (Resolved by time, not the zoom's callback: a punch on a hit may take the zoom over.)
    return this.wait(ms);
  }

  /** A quick punch in on a hit, then back. */
  private zoomPunch(amount: number): void {
    const cam = this.cameras.main;
    const z = this.framedZoom;
    cam.zoomTo(Math.max(cam.zoom, z) + amount, 50, 'Quad.easeOut', true, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
      if (p === 1) cam.zoomTo(z, 160, 'Quad.easeOut', true);
    });
  }

  /**
   * A full-screen cut-in for your big moments (One More, all out): a dark band across the screen, your
   * silhouette, a red slash (your colour), and the words.
   */
  private cutIn(text: string, actor: string): Promise<void> {
    const v = this.views.get(actor);
    if (!v || v.c.side !== 'party') return Promise.resolve();
    playSound(this, 'sting');
    const g = this.add.graphics();
    const band = [[0, 78], [W, 52], [W, 188], [0, 214]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!));
    g.fillStyle(SHADES.shadow, 0.96).fillPoints(band, true);
    g.fillStyle(SHADES.white).fillPoints([[0, 74], [W, 48], [W, 51], [0, 77]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!)), true);
    g.fillStyle(SHADES.white).fillPoints([[0, 215], [W, 189], [W, 192], [0, 218]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!)), true);
    // The red slash.
    g.fillStyle(SHADES.redDark).fillPoints([[150, 220], [214, 220], [330, 44], [266, 44]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!)), true);
    g.fillStyle(SHADES.red).fillPoints([[160, 220], [200, 220], [316, 44], [276, 44]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!)), true);
    const portrait = SPEAKERS.you?.portrait;
    const sil = portrait ? silhouette(portrait) : null;
    const face = sil ? this.add.image(30, 214, makeSpriteTexture(this, 'cutin-you', sil.rows, sil.colours)).setOrigin(0, 1).setScale(3) : null;
    const words = new PixelText(this, 0, 118, text, { color: SHADES.white, scale: 3, chisel: { light: SHADES.white, dark: SHADES.dim }, shadow: SHADES.shadow });
    words.setX(W - words.width - 24);
    const box = this.add.container(W, 0, [g, ...(face ? [face] : []), words]);
    this.u(box);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: box, x: 0, duration: 140, ease: 'Quad.easeOut',
        onComplete: () => {
          if (face) this.tweens.add({ targets: face, x: 40, duration: 700 });
          this.time.delayedCall(700, () =>
            this.tweens.add({ targets: box, x: -W, duration: 140, ease: 'Quad.easeIn', onComplete: () => (box.destroy(), resolve()) }),
          );
        },
      });
    });
  }

  private flashWhite(v: View, ms: number): void {
    v.flash.setPosition(v.sprite.x, v.sprite.y).setAngle(v.sprite.angle).setScale(v.sprite.scale).setAlpha(1);
    this.tweens.add({
      targets: v.flash, alpha: 0, delay: ms / 2, duration: ms / 2,
      onUpdate: () => v.flash.setPosition(v.sprite.x, v.sprite.y).setAngle(v.sprite.angle).setScale(v.sprite.scale),
    });
  }

  private sparks(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 12 + Math.random() * 20;
      const p = this.w(this.add.image(x, y, PIXEL).setTint(Phaser.Math.RND.pick([SHADES.white, SHADES.amber, SHADES.cyan])).setScale(Phaser.Math.Between(1, 3)).setDepth(28));
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  }

  /** A damage number that pops out over them and floats away. */
  private popNumber(n: number, t: View, colour: number): void {
    const x = t.sprite.x + (t.c.side === 'party' ? 30 : 16);
    const y = t.home.y + t.head.y - (t.c.side === 'party' ? 10 : 6);
    const num = this.w(new PixelText(this, x, y, String(n), { color: colour, scale: 3, shadow: SHADES.shadow }).setDepth(35));
    num.setOrigin(0.5).setScale(0.2);
    this.tweens.add({ targets: num, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: num, y: y - 16, alpha: 0, delay: 700, duration: 400, onComplete: () => num.destroy() });
  }

  private popLabel(text: string, t: View, colour: number, dy = 0): void {
    const x = t.sprite.x + (t.c.side === 'party' ? 30 : 0);
    const y = t.home.y + t.head.y - 24 - dy;
    const label = this.w(new PixelText(this, x, y, text, { color: colour, scale: 2, shadow: SHADES.shadow }).setDepth(35));
    label.setOrigin(0.5).setScale(0.4);
    this.tweens.add({ targets: label, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: label, y: y - 10, alpha: 0, delay: 650, duration: 350, onComplete: () => label.destroy() });
  }

  private say(caption: string): void {
    this.bannerText.setText(caption);
    this.tweens.killTweensOf(this.banner);
    this.banner.y = -30;
    if (caption) this.tweens.add({ targets: this.banner, y: 0, duration: 160, ease: 'Quad.easeOut' });
  }

  private hintText(text: string): void {
    this.hint.setText(text).setX(Math.round((W - this.hint.width) / 2));
  }

  /** Puts a game object in the world (on the moving camera). */
  private w<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.world.add(o);
    return o;
  }

  /** Puts a game object in the UI (on the camera that never moves). */
  private u<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.ui.add(o);
    return o;
  }

  private tween(target: Phaser.GameObjects.Image, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...config, targets: target, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}

/**
 * The battle stage: the market seen down its length. Stalls under awnings on either side going back to
 * the vanishing point, lamps hanging between them with bunting strung across, a ring of onlookers (a
 * dim far row and a darker near one), a far glow of the tube, floorboards in perspective with a pool of
 * lamplight where he stands, Mum's spilled jars, and a crate close to the camera on the right. No red.
 */
function paintStage() {
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  const cyan = rgb(SHADES.cyan);
  const vx = 270;
  const LAMPS: [number, number][] = [[46, 50], [150, 58], [392, 56], [456, 48]];
  /** Bunting: a sagging line between two lamps, with little cloth flags in the palette (never red). */
  const bunting = (x: number, y: number): number | null => {
    for (let i = 0; i < LAMPS.length - 1; i++) {
      const [x0, y0] = LAMPS[i]!;
      const [x1, y1] = LAMPS[i + 1]!;
      if (x < x0 || x > x1 || x1 - x0 > 200) continue;
      const t = (x - x0) / (x1 - x0);
      const line = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 10;
      if (Math.abs(y - line) < 0.6) return SHADES.deep;
      const flag = Math.floor((x - x0) / 9);
      const fx = (x - x0) % 9;
      if (fx < 6 && y > line && y < line + 6 - Math.abs(fx - 2.5) * 1.6) return [SHADES.amberDeep, SHADES.greenMid, SHADES.cyanMid, SHADES.dim][flag % 4]!;
    }
    return null;
  };
  return (x: number, y: number) => {
    // A crate close to the camera on the right, out of focus: a dark block with a lit top edge.
    if (x > 438 && y > 150 && y < 270 - (x - 438) * 0.2) return y < 153 ? SHADES.woodPale : (x - 438) % 14 < 1 || (y - 150) % 18 < 1 ? SHADES.deep : SHADES.shadow;
    if (y >= HORIZON) {
      // Mum's jars, rolled across the floor: little clay ellipses, lit on top, with shadows.
      for (const [jx, jy, r] of [[330, 204, 4], [352, 212, 5], [204, 200, 3.5], [368, 198, 3]] as const) {
        const dx = (x - jx) / r;
        const dy = (y - jy) / (r * 0.7);
        if (dx * dx + dy * dy <= 1) return dy < -0.4 ? SHADES.light : dx > 0.4 ? SHADES.dim : SHADES.woodPale;
        if (Math.abs(dx - 0.3) < 1.2 && dy > 1 && dy < 1.7) return SHADES.deep;
      }
      // Floorboards converging on the vanishing point, darker towards the back, with a pool of lamplight.
      const depth = (y - HORIZON) / (H - HORIZON);
      const u = (x - vx) / Math.max(0.05, depth);
      const seam = Math.abs((((u / 26) % 1) + 1) % 1 - 0.5) > 0.47;
      const rowsLine = Math.abs(((1 / Math.max(0.06, depth)) * 1.2) % 1 - 0.5) > 0.48;
      const pool = falloff(x, y, vx, FLOOR, 90, 26);
      const base = addLight(wood, amber, pool * 0.45 + depth * 0.06 + falloff(x, y, 120, 150, 120, 40) * 0.15);
      if (seam || rowsLine) return pool > 0.4 ? SHADES.woodLight : SHADES.deep;
      return noise(x / 7 + y / 3) > 0.78 ? addLight(base, rgb(SHADES.woodLight), 0.2) : base;
    }
    // The back of the market: lamplight on the stalls, the tube's glow far off.
    const d = Math.abs(x - vx) / 300;
    let c = addLight(rgb(SHADES.deep), cyan, falloff(x, y, vx, 20, 26, 130) * 0.28);
    for (const [lx, ly] of LAMPS) c = addLight(c, amber, falloff(x, y, lx, ly + 8, 46, 40) * 0.42);
    // The lamps themselves: a bracket and a bright core.
    for (const [lx, ly] of LAMPS) {
      if (Math.abs(x - lx) < 1 && y < ly - 3 && y > ly - 12) return SHADES.shadow;
      const dl = Math.hypot(x - lx, (y - ly) * 1.3);
      if (dl < 2) return SHADES.white;
      if (dl < 3.6) return SHADES.amber;
    }
    const flag = bunting(x, y);
    if (flag !== null) return flag;
    // Stall awnings and posts, smaller and closer together as they recede.
    const stall = Math.floor(x / 48);
    const roof = 54 + (stall % 2) * 7 + Math.round(d * 10);
    if (y > roof && y < roof + 5) return (x + stall) % 6 < 3 ? SHADES.amberDeep : SHADES.woodPale;
    if (y >= roof + 5 && (x % 48 < 2 || x % 48 > 45)) return SHADES.shadow;
    // Goods on the stall counters: a lighter strip with jars and bundles.
    if (y > roof + 26 && y < roof + 30 && noise(x / 3 + stall) > 0.45) return SHADES.woodLight;
    // The crowd round the ring: a dim far row, and a darker, taller near row (gapped behind him).
    const far = Math.floor(x / 8);
    const farH = 10 + noise(far * 3.7) * 8;
    if (y > HORIZON - 14 - farH && y < HORIZON - 12) {
      const head = y < HORIZON - 14 - farH + 5 && Math.abs((x % 8) - 4) < 2.5;
      if (head || y >= HORIZON - 14 - farH + 5) return SHADES.woodLight;
    }
    const col = Math.floor(x / 11);
    const h = 18 + noise(col * 2.3) * 16;
    const ring = Math.abs(x - vx) > 60 || noise(col * 5.1) > 0.6;
    if (ring && y > HORIZON - h && y < HORIZON) {
      const head = y < HORIZON - h + 6 && Math.abs((x % 11) - 5) < 3;
      const body = y >= HORIZON - h + 6;
      if (head || body) return head && (x % 11) === 7 ? SHADES.deep : SHADES.shadow;
    }
    return noise(x / 9 + y / 30) > 0.8 ? addLight(c, rgb(SHADES.woodLight), 0.25) : addLight(c, wood, 0.6);
  };
}

/** The pose for a tell; an arm drawn back is on the side the blow will come from. */
function tellPose(intent: Intent): string {
  const pose = intent.tell?.pose ?? 'idle';
  if (pose === 'cock') return intent.side === 'right' ? 'cockR' : 'cockL';
  return pose;
}
