import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { COMBATANTS, ENCOUNTERS, ITEMS, LESSONS, type Lesson, MOVES } from '../data/combat';
import { getSession } from '../session';
import { Battle, type Action, type BattleEvent, type Combatant, type Intent, type MoveDef, type Reaction } from '../systems/Combat';
import type { Grade, Key, Qte, QteKind } from '../systems/qte';
import { BEETLE_BATTLE, CARVER_BATTLE, COLLECTOR_BATTLE, COLLECTOR_BIG_BATTLE, TICKER_BATTLE, PICKER_BATTLE, PICKER_LOUD_BATTLE, DOG_BATTLE, GIRL_BATTLE, LACKEY_BATTLE, OLD_SCAV_BATTLE, RAIDER_BATTLE, RAIDER_LEAD_BATTLE, SCAVENGER_BATTLE, SCAVENGER_FISTS_BATTLE, SON_BATTLE, STRAGGLER_BIG_BATTLE, STRAGGLER_SMALL_BATTLE, STRAGGLER_THIN_BATTLE, ZEALOT_BATTLE } from '../ui/battleSprites';
import { CAST, DOG } from '../ui/borderlandFolk';
import { GIRL, PROTAGONIST, SCAVENGER } from '../ui/characters';
import { paintFar } from '../ui/paintOutdoor';
import { QteRunner } from '../ui/QteRunner';
import { addLight, falloff, noise, rgb, SHADES } from '../ui/pixelArt';
import { PIXEL, makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { measure } from '../ui/pixelFont';
import { PixelText } from '../ui/PixelText';
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
// read it from his pose and a line over his head (his tell). Quick-time events (src/ui/QteRunner.ts) sit
// on top: his attacks have one for you to react with (a ring, a sideways dodge, notes, a bar, a mash),
// and your skills have one to hit harder (a key, a bar, a hold, notes). The QTE keeps the time: the blow
// lands on its beat, the moment you press (or the moment passes), so the animation can't drift from it.
// With more than one enemy, Left and Right pick who you go for. In dev builds, a fight picker comes first.
// When it's over, the outcome is written to ink and you're back in the area. Captions are PLACEHOLDER.

export interface CombatSceneData {
  encounter: string;
  /** Where to go back to afterwards (its `script` plays on arrival: the story's reaction). */
  back: AreaSceneData;
  /** Dev only: every enemy uses just this move (to try one reaction game at a time). */
  only?: string;
  /** Dev only: choose the fight first (a picker), instead of starting one. */
  pick?: boolean;
}

/** The line where the enemy stands, deep in the frame. */
const FLOOR = 190;
const HORIZON = 118;
/** The camera's framing for the menu: the whole stage. */
const WIDE = { x: W / 2, y: H / 2, zoom: 1 };

interface Look {
  poses: Record<string, RowSprite>;
  /** Party members are seen from behind, scaled up in the foreground. */
  scale: number;
  /** Party members: the figure shown in their cut-in (their sprite from the areas). */
  cutIn?: RowSprite;
}
/** Battle sprites for the `sprite` keys in combat data. */
const LOOKS: Record<string, Look> = {
  protagonist: { poses: CARVER_BATTLE, scale: 2, cutIn: PROTAGONIST.idle[0]! },
  girl: { poses: GIRL_BATTLE, scale: 2, cutIn: GIRL.idle[0]! },
  beetle: { poses: BEETLE_BATTLE, scale: 1 },
  zealot: { poses: ZEALOT_BATTLE, scale: 1 },
  lackey: { poses: LACKEY_BATTLE, scale: 1 },
  scavenger: { poses: SCAVENGER_BATTLE, scale: 2, cutIn: SCAVENGER.idle[0]! },
  scavenger_fists: { poses: SCAVENGER_FISTS_BATTLE, scale: 2, cutIn: SCAVENGER.idle[0]! },
  straggler_thin: { poses: STRAGGLER_THIN_BATTLE, scale: 1 },
  straggler_big: { poses: STRAGGLER_BIG_BATTLE, scale: 1 },
  straggler_small: { poses: STRAGGLER_SMALL_BATTLE, scale: 1 },
  dog: { poses: DOG_BATTLE, scale: 2, cutIn: DOG.idle[0]! },
  old_scav: { poses: OLD_SCAV_BATTLE, scale: 2, cutIn: CAST.old_scav.idle[0]! },
  boss_son: { poses: SON_BATTLE, scale: 1 },
  raider: { poses: RAIDER_BATTLE, scale: 1 },
  raider_lead: { poses: RAIDER_LEAD_BATTLE, scale: 1 },
  collector: { poses: COLLECTOR_BATTLE, scale: 1 },
  collector_big: { poses: COLLECTOR_BIG_BATTLE, scale: 1 },
  picker: { poses: PICKER_BATTLE, scale: 1 },
  picker_loud: { poses: PICKER_LOUD_BATTLE, scale: 1 },
  ticker: { poses: TICKER_BATTLE, scale: 1 },
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
  tag?: { plate: Phaser.GameObjects.Graphics; name: PixelText; tell: PixelText; status: PixelText };
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
  private hud!: Phaser.GameObjects.Graphics;
  /** A small key hint for going back, shown wherever you can. */
  private backHint!: PixelText;
  private hudTexts: PixelText[] = [];
  private menuBox: Phaser.GameObjects.Container | null = null;
  private menu: { items: MenuItem[]; index: number; pick: (i: number | null) => void; title: string; back: boolean } | null = null;
  private qte!: QteRunner;
  /** Choosing who to go for: Left and Right, E to go, Esc to back out. */
  private targeting: { foes: string[]; index: number; resolve: (id: string | null) => void } | null = null;
  /** The blows were already shown on their beats, so the events after them skip the impacts (numbers only). */
  private quiet = false;
  /** The kind of the last QTE shown: the next uses its alternative rather than repeat it. */
  private lastQte: QteKind | null = null;
  /** Each enemy's slot across the stage (how wide its panel may be). */
  private slot = 160;
  /** The middle of the enemies' side of the stage (further right with a friend beside you). */
  private enemyX = 270;
  private music: FightMusic | null = null;
  private waitingPress: (() => void) | null = null;
  /** The zoom the camera was last asked to frame at (a punch returns to it). */
  private framedZoom = 1;
  /** Lessons already shown this fight (a fight that `teaches`). */
  private taught = new Set<Lesson>();
  /** What this fight teaches (its own, plus the basics if this is your first fight). */
  private lessons: string[] = [];

  constructor() {
    super('Combat');
  }

  init(data?: Partial<CombatSceneData>): void {
    this.params = {
      encounter: data?.encounter ?? 'market_scrap', back: data?.back ?? { areaId: 'roots-market' },
      ...(data?.only ? { only: data.only } : {}), ...(data?.pick ? { pick: true } : {}),
    };
    this.views = new Map();
    this.menu = null;
    this.menuBox = null;
    this.targeting = null;
    this.quiet = false;
    this.lastQte = null;
    this.waitingPress = null;
    this.hudTexts = [];
    this.music = null;
    this.taught = new Set();
  }

  create(): void {
    // Two cameras: the world one moves; the UI one never does.
    this.world = this.add.layer().setDepth(0);
    this.ui = this.add.layer().setDepth(10);
    const uiCam = this.cameras.add(0, 0, W, H);
    uiCam.ignore(this.world);
    this.cameras.main.ignore(this.ui);
    this.cameras.main.setBounds(0, 0, W, H);
    const stage = this.add.image(0, 0, PIXEL).setOrigin(0);
    this.w(stage);
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e, true));
    this.input.keyboard!.on('keyup', (e: KeyboardEvent) => this.onKey(e, false));
    // Left click chooses; right click goes back.
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => (pointer.rightButtonDown() ? this.goBack() : this.onPress()));
    if (import.meta.env.DEV && this.params.pick) {
      void this.pickFight();
      return;
    }

    const encounter = ENCOUNTERS[this.params.encounter];
    if (!encounter) throw new Error(`CombatScene: no encounter called "${this.params.encounter}"`);
    const only = import.meta.env.DEV ? this.params.only : undefined;
    const fighters = only && MOVES[only]
      ? Object.fromEntries(Object.entries(COMBATANTS).map(([id, c]) => [id, encounter.enemies.includes(id) ? { ...c, moves: [only], weights: [1], ai: {} } : c]))
      : COMBATANTS;
    this.battle = new Battle(encounter, MOVES, fighters, ITEMS);
    const also = encounter.alsoTeaches;
    this.lessons = [...(encounter.teaches ?? []), ...(also && !getSession(this).story.getVariable(also.unless) ? also.lessons : [])];
    // The stage: where it's fought.
    const where = encounter.stage ?? 'market';
    makePaintedTexture(this, `combat-stage-${where}`, W, H, where === 'rot' ? paintRotStage() : where === 'fields' ? paintFieldsStage() : where === 'camp' ? paintCampStage() : where === 'bar' ? paintBarStage() : where === 'den' ? paintDenStage() : where === 'yard' ? paintYardStage() : paintStage());
    stage.setTexture(`combat-stage-${where}`);
    const party = this.battle.combatants.filter((c) => c.side === 'party');
    const enemies = this.battle.combatants.filter((c) => c.side === 'enemy');
    // With friends, one is in full focus in front and the rest wait at the edge (`focus`).
    party.forEach((c) => this.addView(c, 118, H + 8));
    this.enemyX = party.length > 1 ? 300 : 270;
    const span = this.spanFor(enemies.length);
    this.slot = enemies.length > 1 ? span / (enemies.length - 1) : 170;
    enemies.forEach((c, i) => this.addView(c, enemies.length > 1 ? this.enemyX - span / 2 + (i * span) / (enemies.length - 1) : this.enemyX, FLOOR));

    // The UI: a slanted banner for what's happening, a hint under it, and the party's bars.
    const band = this.add.graphics();
    band.fillStyle(SHADES.shadow, 0.94).fillPoints([{ x: 0, y: 6 }, { x: 190, y: 6 }, { x: 178, y: 22 }, { x: 0, y: 22 }].map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    band.fillStyle(SHADES.redDark).fillPoints([{ x: 190, y: 6 }, { x: 196, y: 6 }, { x: 184, y: 22 }, { x: 178, y: 22 }].map((p) => new Phaser.Math.Vector2(p.x, p.y)), true);
    band.fillStyle(SHADES.white).fillRect(0, 22, 178, 1);
    this.bannerText = new PixelText(this, 12, 10, '', { color: SHADES.white });
    this.banner = this.add.container(0, -30, [band, this.bannerText]);
    this.u(this.banner);
    this.hint = this.u(new PixelText(this, 0, 30, '', { color: SHADES.light, shadow: SHADES.shadow }));
    this.hud = this.u(this.add.graphics());
    this.qte = new QteRunner(this, (o) => this.w(o), (o) => this.u(o));
    this.backHint = this.u(new PixelText(this, 0, 0, '[Esc] Back', { color: SHADES.light, shadow: SHADES.shadow }).setVisible(false));
    // Breathing: idle poses swap back and forth.
    this.time.addEvent({ delay: 650, loop: true, callback: () => this.breathe() });
    this.cameras.main.fadeIn(500);
    uiCam.fadeIn(500);
    // The fight's music (any day's score gives way to it; the area brings that back afterwards).
    stopScore(this);
    this.startMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());
    this.focus(party[0]!.id, true);
    this.refresh(true);
    // An opening sweep: from the enemy back to the whole stage.
    const foe = this.views.get(enemies[0]!.id)!;
    this.cameras.main.centerOn(foe.home.x, foe.home.y - 40).setZoom(2);
    this.time.delayedCall(300, () => void this.run());
  }

  override update(_time: number, delta: number): void {
    if (!this.battle) return; // (choosing a fight)
    this.qte.update();
    // [Esc] Back, wherever you can go back: under a list, or while choosing who.
    const canBack = !!this.targeting || !!this.menu?.back;
    this.backHint.setVisible(canBack).setPosition(W - this.backHint.width - 8, H - 12);
    this.drainBars(delta);
    for (const v of this.views.values()) v.shadow?.setPosition(v.sprite.x, v.home.y).setScale(v.sprite.scale / v.home.scale);
    this.placeTags();
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
    // Pull out for the menu (on whoever's turn it is, with friends); your guard drops as your turn comes round.
    this.setPose(this.views.get(actor.id)!, 'idle');
    await this.frame(this.turnFrame(actor), 350);
    await this.teach('allies');
    await this.teach('turns');
    await this.teach('tells');
    if (this.battle.living('enemy').some((e) => this.windingUp(e))) await this.teach('windUp');
    const action = await this.chooseAction(actor);
    this.closeMenu();
    const view = this.views.get(actor.id)!;
    switch (action.type) {
      case 'attack':
      case 'skill': {
        const move = MOVES[action.type === 'attack' ? actor.def.basic! : action.move]!;
        this.say(move.name);
        if (move.taunts) {
          // She steps out and draws every enemy that hasn't attacked yet onto herself.
          this.setPose(view, 'ready');
          playSound(this, 'shuffle');
          this.popLabel('LURE', view, SHADES.amber);
          await this.tween(view.sprite, { y: view.home.y - 8, duration: 160, yoyo: true, repeat: 1 });
          await this.play(this.battle.act(action));
          this.setPose(view, this.restPose(view));
          return;
        }
        if (move.target === 'self') {
          // Holding back: you stop, and let your hands drop.
          this.setPose(view, 'idle');
          await this.tween(view.sprite, { y: view.home.y + 6, duration: 300, yoyo: true });
          await this.play(this.battle.act(action));
          return;
        }
        const target = this.views.get(action.target ?? this.battle.living('enemy')[0]!.id)!;
        const grades = await this.yourBlows(view, target, move);
        this.quiet = true;
        await this.play(this.battle.act({ ...action, grades }));
        this.quiet = false;
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
      case 'switch': {
        // Hand over: the friend steps into focus, and their turn starts.
        playMove(this);
        const events = this.battle.act(action);
        const to = events.find((e) => e.type === 'switch')?.to;
        if (to) this.say(`${this.battle.get(to).def.name}`);
        await this.wait(200);
        return;
      }
    }
  }

  /** The command menu, and the skill and item lists behind it. */
  private async chooseAction(actor: Combatant): Promise<Action> {
    for (;;) {
      const commands = this.battle.commands();
      const names: Record<Action['type'], [string, string]> = {
        allOut: ['All-out attack!', 'Everyone piles in while they’re down.'],
        attack: ['Attack', actor.def.basic ? MOVES[actor.def.basic]!.description : ''],
        skill: ['Skill', 'Use a skill. Costs SP.'],
        guard: ['Guard', 'Half harm until your next turn, and no knockdowns.'],
        item: ['Item', 'Use something you carry.'],
        run: ['Run', 'Get out of here.'],
        switch: ['Switch', 'Let a friend go now; you take their place.'],
      };
      const i = await this.openMenu(this.battle.combatants.some((c) => c.side === 'party' && c.id !== actor.id) ? actor.def.name : '', commands.map((c) => ({ label: names[c.type][0], usable: c.usable, description: c.usable ? names[c.type][1] : (c.reason ?? '') })), false);
      const type = commands[i!]!.type;
      if (type === 'skill') {
        // The skill list; backing out of choosing who comes back here, and backing out of this, to the commands.
        for (;;) {
          const skills = this.battle.skills();
          const s = await this.openMenu('Skill', skills.map((k) => ({ label: k.move.name, note: k.move.sp ? `${k.move.sp} SP` : '', usable: k.usable, description: k.usable ? k.move.description : (k.reason ?? '') })), true);
          if (s === null) break;
          const move = skills[s]!.move;
          const target = move.target === 'enemy' ? await this.chooseTarget() : undefined;
          if (move.target === 'enemy' && target === null) continue;
          return { type: 'skill', move: move.id, ...(target ? { target } : {}) };
        }
        continue;
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

  /** With one enemy, no question; with more, Left and Right to pick (his plate lights up). Null if you backed out. */
  private async chooseTarget(): Promise<string | undefined | null> {
    const foes = this.battle.living('enemy');
    if (foes.length === 1) return undefined;
    return new Promise((resolve) => (this.targeting = { foes: foes.map((f) => f.id), index: 0, resolve }));
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
    // Whoever it's going for comes into focus.
    if (move.target === 'enemy') this.focus(target);
    // Push in on him as he moves.
    this.say(move.name);
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
    await this.teach('react');
    // The tell's last moment: he flashes and shudders.
    playSound(this, 'tick');
    this.flashWhite(view, 80);
    this.time.delayedCall(170, () => this.flashWhite(view, 80));
    await this.tween(view.sprite, { x: view.home.x + 2, duration: 40, yoyo: true, repeat: 4 });
    // Then he comes at you. Your QTE keeps the time: each blow lands on its beat.
    const t = this.views.get(target)!;
    void this.frame({ x: (t.home.x + view.home.x) / 2, y: 170, zoom: 1.25 }, 220);
    const reactions = await this.theirBlows(view, t, move, intent);
    this.quiet = true;
    await this.play(this.battle.enemyTurn(reactions));
    this.quiet = false;
    await this.returnHome(view);
  }

  /** Where a QTE sits: over someone's head, on the world camera, and the same point on the UI camera. */
  private anchorOf(v: View): { anchor: { x: number; y: number }; screen: () => { x: number; y: number } } {
    const anchor = { x: v.home.x + v.head.x, y: v.home.y + v.head.y };
    return { anchor, screen: () => this.toScreen(anchor.x, anchor.y) };
  }

  private toScreen(x: number, y: number): { x: number; y: number } {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }

  /**
   * His blows, each with your QTE: he closes in over the QTE's time (a ring closes as he arrives), and on
   * each beat the blow lands: slipped if you got it, full on if not. A hold is broken free of, or not.
   */
  private async theirBlows(view: View, t: View, move: MoveDef, intent: Intent): Promise<Reaction[]> {
    const hits = move.hits ?? 1;
    const strikeAt = { x: t.home.x + 70, y: H - 14 };
    const near = { x: t.home.x + 92, y: H - 34 };
    const at = this.anchorOf(t);
    // Braced (her Brace): the first blow she gets out of the way of, she parries.
    let braced = t.c.braced;
    // A blow lands on its beat: slipped if you got it, the full blow (and you stagger) if not.
    const land = (grade: Grade, last: boolean) => {
      this.setPose(view, 'attack');
      this.tweens.add({ targets: view.sprite, ...strikeAt, scale: 2, duration: 80, ease: 'Quad.easeIn', ...(last ? {} : { yoyo: true, hold: 60 }) });
      if (grade === 'miss') {
        playSound(this, 'punch', 1.3);
        this.flashWhite(t, 120);
        this.cameras.main.shake(240, 0.016);
        this.cameras.main.flash(80, 244, 241, 232);
        this.zoomPunch(0.1);
        this.setPose(t, 'hit');
        this.tweens.add({ targets: t.sprite, x: t.home.x - 10, y: t.home.y + 6, angle: -4, duration: 90, yoyo: true, hold: 180 });
      } else {
        playSound(this, 'whoosh');
        this.setPose(t, 'dodge');
        const parry = (grade === 'perfect' && t.c.def.reactions?.includes('parry')) || braced;
        braced = false;
        this.popLabel(parry ? 'PARRY!' : 'DODGE', t, SHADES.green);
        this.tweens.add({ targets: t.sprite, x: t.home.x - 16, duration: 90, yoyo: true, hold: 160 });
      }
    };
    const shown = (q: Qte) => (this.lastQte = q.kind);
    const first = this.battle.reactionWindow(move.id, t.c.id, 0, this.lastQte);
    if (!first) {
      // You can't react to it: he just comes and hits.
      this.setPose(view, 'attack');
      await this.tween(view.sprite, { ...strikeAt, scale: 2, duration: this.battle.timing.lunge * 0.6, ease: 'Quad.easeIn' });
      return Array.from({ length: hits }, () => 'none');
    }
    this.setPose(t, 'ready');
    if (first.kind === 'notes' || first.kind === 'weave') {
      // He closes in, then a punch on each note or prompt.
      shown(first);
      this.setPose(view, 'squared');
      this.tweens.add({ targets: view.sprite, ...near, scale: 1.8, duration: 600, ease: 'Quad.easeOut' });
      const grades = await this.qte.start(first, { ...at, beats: hits, onBeat: (i, g) => land(g, i === hits - 1) });
      return grades.map((g) => Battle.reactionFor(g));
    }
    const out: Reaction[] = [];
    for (let i = 0; i < hits; i++) {
      const q: Qte = i === 0 ? first : this.battle.reactionWindow(move.id, t.c.id, i, this.lastQte)!;
      shown(q);
      if (q.kind === 'mash' || q.kind === 'balance' || q.kind === 'grip') {
        // He grabs you, and holds on: break free (mash, grip), or keep your feet while he shakes you (balance).
        this.setPose(view, 'reach');
        playSound(this, 'whoosh', 0.6);
        await this.tween(view.sprite, { x: t.home.x + 52, y: H - 18, scale: 2, duration: 450, ease: 'Quad.easeIn' });
        playSound(this, 'skid');
        this.setPose(t, 'hit');
        this.cameras.main.shake(150, 0.006);
        const shaking = this.tweens.add({ targets: [t.sprite, view.sprite], x: '+=3', duration: 70, yoyo: true, repeat: -1 });
        // Locked together: the camera in tight on the two of you, swaying with every tug.
        const lock = { x: (t.home.x + view.sprite.x) / 2 + 20, y: H - 70 };
        if (q.kind === 'grip') void this.frame({ ...lock, zoom: 1.7 }, 300);
        const tug = (dir: number, strength: number) => {
          const cam = this.cameras.main;
          cam.pan(lock.x + dir * 14 * strength, lock.y, 140, 'Quad.easeOut', true);
          cam.shake(90, 0.004 + strength * 0.006);
          this.tweens.add({ targets: [t.sprite, view.sprite], angle: dir * 4 * strength, duration: 90, yoyo: true });
        };
        const [g] = await this.qte.start(q, { ...at, onTug: tug, onBeat: (_i, grade) => {
          shaking.stop();
          t.sprite.x = t.home.x;
          t.sprite.angle = 0;
          view.sprite.angle = 0;
          if (grade === 'miss') {
            // Thrown about, and down hard.
            playSound(this, 'punch', 1.3);
            this.cameras.main.shake(260, 0.016);
            this.setPose(t, 'hit');
            this.tweens.add({ targets: t.sprite, y: t.home.y + 10, angle: 6, duration: 120, yoyo: true, hold: 200 });
          } else {
            // You keep your feet, and shove him off.
            playSound(this, 'whoosh');
            this.setPose(t, 'shove');
            this.popLabel(q.kind === 'balance' ? 'STEADY!' : 'FREE!', t, SHADES.green);
            this.tweens.add({ targets: view.sprite, x: view.sprite.x + 24, duration: 140, ease: 'Quad.easeOut' });
          }
        } });
        out.push(Battle.reactionFor(g!));
        continue;
      }
      if (q.kind === 'draw') {
        // Coiled, still, at his place... and on the flash he comes, fast.
        this.setPose(view, 'windup');
        const [g] = await this.qte.start(q, { ...at, onBeat: (_i, grade) => {
          playSound(this, 'whoosh', 0.8);
          land(grade, i === hits - 1);
        } });
        out.push(Battle.reactionFor(g!));
        await this.wait(200);
        continue;
      }
      // He closes in while the QTE runs; the blow lands on its beat (when you press, or when it's up).
      this.setPose(view, i === 0 ? 'attack' : 'windup');
      playSound(this, 'whoosh', 0.5);
      const approach = this.tweens.add({ targets: view.sprite, ...near, scale: 1.8, duration: q.time, ease: 'Quad.easeIn' });
      const [g] = await this.qte.start(q, { ...at, ...(intent.side ? { from: intent.side } : {}), onBeat: (_i, grade) => {
        approach.stop();
        land(grade, i === hits - 1);
      } });
      out.push(Battle.reactionFor(g!));
      await this.wait(160);
    }
    return out;
  }

  /**
   * Your blows, each with your QTE: you step in, and on each beat the blow lands, harder for a good or
   * perfect press (the pose for each blow from the move's `poses`, else its own, else a plain attack).
   */
  private async yourBlows(view: View, target: View, move: MoveDef): Promise<Grade[]> {
    const hits = move.hits ?? 1;
    const look = LOOKS[view.c.def.sprite] ?? LOOKS.protagonist!;
    const poseFor = (i: number) => move.poses?.[i] ?? (look.poses[move.id] ? move.id : 'attack');
    const at = this.anchorOf(target);
    // Step in, ready.
    this.setPose(view, 'ready');
    playSound(this, 'whoosh', 0.5);
    void this.frame({ x: target.home.x - 20, y: target.home.y - 40, zoom: 1.6 }, 220);
    const close = { x: target.home.x - 46, y: target.home.y + 74, scale: view.home.scale * 0.75 };
    await this.tween(view.sprite, { ...close, duration: 220, ease: 'Quad.easeIn' });
    const strike = (i: number, grade: Grade) => {
      this.setPose(view, poseFor(i));
      this.tweens.add({ targets: view.sprite, x: close.x + 10, y: close.y - 6, duration: 70, yoyo: true, hold: 70 });
      if (grade === 'miss') {
        // A glancing blow: he barely feels it, and shrugs.
        playSound(this, 'tap', 0.8);
        this.popLabel('GLANCING', target, SHADES.dim, 18);
        this.tweens.add({ targets: target.sprite, x: target.home.x + 3, duration: 60, yoyo: true });
      } else {
        playSound(this, grade === 'perfect' ? 'punch' : 'hit', grade === 'perfect' ? 1.2 : 1);
        this.flashWhite(target, 100);
        this.cameras.main.shake(grade === 'perfect' ? 220 : 140, grade === 'perfect' ? 0.012 : 0.007);
        this.zoomPunch(grade === 'perfect' ? 0.12 : 0.06);
        if (grade === 'perfect') this.sparks(target.sprite.x, target.home.y - 44);
        this.setPose(target, 'hit');
        this.tweens.add({ targets: target.sprite, x: target.home.x + 8, duration: 80, yoyo: true });
      }
    };
    const first = this.battle.qteFor(move.id, 0, true, this.lastQte);
    if (!first) {
      strike(0, 'good');
      await this.wait(200);
      return [];
    }
    this.lastQte = first.kind;
    // Several blows on one QTE: a note, a prompt or a carved stroke for each.
    if (hits > 1 && (first.kind === 'notes' || first.kind === 'weave' || first.kind === 'carve')) return this.qte.start(first, { ...at, beats: hits, onBeat: strike });
    const grades: Grade[] = [];
    for (let i = 0; i < hits; i++) {
      const q: Qte = i === 0 ? first : this.battle.qteFor(move.id, i, true, this.lastQte)!;
      this.lastQte = q.kind;
      if (q.kind === 'hold' || q.kind === 'carve') this.setPose(view, poseFor(i)); // getting a grip as you go
      const [g] = await this.qte.start(q, { ...at, onBeat: (_i, grade) => strike(i, grade) });
      grades.push(g!);
      await this.wait(120);
    }
    return grades;
  }

  /** What happened: a sound, a pose and a tween for each event, in order. */
  private async play(events: BattleEvent[]): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'reaction': {
          const t = this.views.get(e.target)!;
          if (this.quiet) break; // (shown on its beat)
          if (e.reaction === 'dodge') {
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
        case 'taunt': {
          // Every enemy she drew turns to her: a flash, LURED over each, and it stays on their panels.
          const her = this.views.get(e.actor)!;
          this.popLabel('GUARD', her, SHADES.cyan, 18);
          for (const id of e.lured) {
            const t = this.views.get(id)!;
            playSound(this, 'tick');
            this.flashWhite(t, 120);
            this.popLabel('LURED', t, SHADES.amber, 18);
            await this.tween(t.sprite, { x: t.home.x - 5, duration: 90, yoyo: true });
          }
          if (!e.lured.length) this.popLabel('NO ONE LEFT TO LURE', her, SHADES.dim, 30);
          this.refresh();
          break;
        }
        case 'weakened': {
          const t = this.views.get(e.target)!;
          playSound(this, 'shimmer', 0.6);
          this.popLabel('WEAKENED', t, SHADES.green, 18);
          break;
        }
        case 'blinded': {
          // Grit in the eyes: reacting is harder for a couple of rounds.
          const t = this.views.get(e.target)!;
          playSound(this, 'scratch', 0.7);
          this.flashWhite(t, 160);
          this.popLabel('BLINDED', t, SHADES.woodPale, 18);
          break;
        }
        case 'warded': {
          const t = this.views.get(e.target)!;
          playSound(this, 'staff', 0.6);
          this.popLabel('WARDED', t, SHADES.light, 18);
          this.refresh();
          break;
        }
        case 'clung': {
          const t = this.views.get(e.target)!;
          playSound(this, 'scratch', 0.7);
          this.popLabel('LATCHED ON', t, SHADES.cyan, 18);
          break;
        }
        case 'gnawed': {
          const t = this.views.get(e.target)!;
          playSound(this, 'scratch', 0.5);
          this.flashWhite(t, 90);
          this.popLabel(`-${e.amount}`, t, SHADES.cyan, 30);
          this.refresh();
          break;
        }
        case 'sapped': {
          // Winded: their own blows land softer for a couple of rounds.
          const t = this.views.get(e.target)!;
          playSound(this, 'punch', 0.7);
          this.popLabel('WINDED', t, SHADES.woodPale, 18);
          break;
        }
        case 'drained': {
          const t = this.views.get(e.target)!;
          playSound(this, 'scratch', 0.6);
          this.popLabel(`-${e.amount} SP`, t, SHADES.cyan, 30);
          this.refresh();
          break;
        }
        case 'braced': {
          const t = this.views.get(e.actor)!;
          playSound(this, 'tick');
          this.setPose(t, 'guard');
          this.popLabel('BRACED', t, SHADES.cyan, 18);
          break;
        }
        case 'revealed': {
          // Sniffed out: the tells over their heads now show what's really coming.
          const t = this.views.get(e.actor)!;
          playSound(this, 'shimmer', 0.6);
          this.popLabel('SNIFFED OUT', t, SHADES.amber, 18);
          for (const v of this.views.values()) if (v.c.side === 'enemy' && v.c.hp > 0) this.flashWhite(v, 100);
          this.refresh();
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
          await this.hurt(e, this.quiet);
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
          if (t.c.side === 'enemy') await this.teach('offBalance');
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
          if (t.c.side === 'enemy') {
            await this.knockDown(t);
            // While others fight on, he picks himself up and stumbles off into the crowd; the rest close up.
            if (this.battle.living('enemy').length > 0) {
              await this.wait(350);
              await this.leave(t);
              this.respace();
            }
          } else {
            await this.tween(t.sprite, { y: t.home.y + 30, duration: 500 });
            t.sprite.setAlpha(0.75);
          }
          break;
        }
        default:
          break;
      }
      this.refresh();
      await this.wait(90);
    }
  }

  /** Harm: the impact (unless it was already shown on its beat: `quiet`), then the number. */
  private async hurt(e: Extract<BattleEvent, { type: 'damage' }>, quiet = false): Promise<void> {
    const t = this.views.get(e.target)!;
    const big = e.amount >= 15 || e.weak || e.crit;
    if (quiet) {
      this.popNumber(e.amount, t, big ? SHADES.amber : SHADES.white);
      if (e.weak) this.popLabel('WEAK!', t, SHADES.amber, 18);
      else if (e.crit) this.popLabel('CRITICAL!', t, SHADES.amber, 18);
      else if (e.resisted) this.popLabel('RESIST', t, SHADES.dim, 18);
      else if (e.guarded) this.popLabel('GUARDED', t, SHADES.cyan, 18);
      this.refresh();
      await this.wait(260);
      if (e.hp > 0) this.setPose(t, this.restPose(t));
      return;
    }
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

  /** Beaten, he gets up and stumbles off the nearer side into the crowd, fading as he goes. */
  private async leave(t: View): Promise<void> {
    this.setPose(t, 'wobble');
    t.sprite.setPosition(t.home.x, t.home.y).setAngle(0);
    playSound(this, 'shuffle');
    const away = t.home.x < W / 2 ? -1 : 1;
    t.shadow?.setVisible(false);
    await this.tween(t.sprite, { x: t.home.x + away * 70, y: t.home.y - 16, scale: t.home.scale * 0.85, alpha: 0, duration: 900, ease: 'Quad.easeIn' });
    t.sprite.setVisible(false);
  }

  /** How wide the enemies spread: less room beside a party of two. */
  private spanFor(n: number): number {
    const room = this.battle.combatants.filter((c) => c.side === 'party').length > 1 ? 170 : 220;
    return Math.min(room, 100 * (n - 1));
  }

  /** Those still standing spread out again across the stage (and their panels with them). */
  private respace(): void {
    const foes = this.battle.living('enemy').map((c) => this.views.get(c.id)!);
    const span = this.spanFor(foes.length);
    this.slot = foes.length > 1 ? span / (foes.length - 1) : 170;
    foes.forEach((v, i) => {
      const x = foes.length > 1 ? this.enemyX - span / 2 + (i * span) / (foes.length - 1) : this.enemyX;
      v.home.x = x;
      this.tweens.add({ targets: v.sprite, x, duration: 500, ease: 'Sine.easeInOut' });
    });
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
    if (outcome === 'won') this.music?.sting('win');
    else if (outcome === 'lost') this.music?.sting('lose');
    else this.music?.stop();
    // No captions, no key to press: a moment on the stage for the sting, then straight into the story.
    await this.frame(WIDE, 500);
    await this.wait(900);
    for (const cam of this.cameras.cameras) cam.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  /** Whose turn it is: they come into focus (with friends), and the camera takes in the whole stage. */
  private turnFrame(actor: Combatant): { x: number; y: number; zoom: number } {
    this.focus(actor.id);
    return WIDE;
  }

  /**
   * With friends, one is in full focus: big in the foreground, lit. The others step back to the edge of
   * the frame, smaller and in shadow, until it's their turn (or they're the one being attacked).
   */
  private focus(id: string, snap = false): void {
    const party = [...this.views.values()].filter((v) => v.c.side === 'party');
    if (party.length < 2) return;
    let edge = 0;
    for (const v of party) {
      const on = v.c.id === id;
      v.home = on ? { x: 160, y: H + 8, scale: 2 } : { x: 42 - edge++ * 30, y: H + 16, scale: 1.5 };
      v.sprite.setDepth(on ? 12 : 10).setTint(on ? 0xffffff : 0x8a8a8a);
      v.flash.setDepth(on ? 13 : 11);
      if (snap) v.sprite.setPosition(v.home.x, v.home.y).setScale(v.home.scale);
      else this.tweens.add({ targets: v.sprite, x: v.home.x, y: v.home.y, scale: v.home.scale, duration: 280, ease: 'Quad.easeOut' });
    }
  }

  /** His next blow is the big one he wound up for. */
  private windingUp(enemy: Combatant): boolean {
    const intent = this.battle.intentOf(enemy.id);
    return !!intent && Object.values(MOVES).some((m) => m.windsUp === intent.move);
  }

  /**
   * The first fight teaches itself (designer: the scene is the tutorial): the first time something comes
   * up, the fight holds on a plain explanation until you press E.
   */
  private async teach(lesson: Lesson): Promise<void> {
    if (!this.lessons.includes(lesson) || this.taught.has(lesson)) return;
    this.taught.add(lesson);
    // To the left of the stage, clear of his panel and tell (which a lesson may point at).
    const width = 200;
    const text = new PixelText(this, 0, 0, LESSONS[lesson], { color: SHADES.white, wrapWidth: width - 20, shadow: SHADES.shadow });
    const press = new PixelText(this, 0, 0, '[E]', { color: SHADES.light });
    const height = 8 + text.height + 14;
    const x = 10;
    const y = 36;
    const g = this.add.graphics();
    g.fillStyle(SHADES.shadow, 0.94).fillRect(x, y, width, height);
    g.fillStyle(SHADES.redDark).fillRect(x, y, 3, height);
    g.fillStyle(SHADES.white).fillRect(x, y + height, width, 1);
    text.setPosition(x + 12, y + 8);
    press.setPosition(x + width - press.width - 6, y + height - press.height - 4);
    const box = this.u(this.add.container(0, -8, [g, text, press]).setAlpha(0).setDepth(40));
    this.tweens.add({ targets: box, y: 0, alpha: 1, duration: 180, ease: 'Quad.easeOut' });
    playMove(this);
    // A moment before it can be dismissed, so a press meant for a QTE doesn't skip it.
    await this.wait(450);
    await new Promise<void>((resolve) => (this.waitingPress = resolve));
    playConfirm(this);
    await new Promise<void>((resolve) => this.tweens.add({ targets: box, alpha: 0, duration: 140, onComplete: () => resolve() }));
    box.destroy();
  }

  // --- Moving people about ---

  private async returnHome(view: View): Promise<void> {
    await this.tween(view.sprite, { x: view.home.x, y: view.home.y, scale: view.home.scale, duration: 260, ease: 'Quad.easeOut' });
    if (view.c.hp > 0) this.setPose(view, this.restPose(view));
  }

  // --- Input ---

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    const arrow: Key | null = k === 'arrowleft' || k === 'a' ? 'left' : k === 'arrowright' || k === 'd' ? 'right' : k === 'arrowup' || k === 'w' ? 'up' : k === 'arrowdown' || k === 's' ? 'down' : null;
    const confirm = k === 'e' || k === ' ' || k === 'enter';
    const back = k === 'escape' || k === 'q' || k === 'x' || k === 'backspace';
    // A QTE takes the arrows and E (pressed and let go).
    if (this.qte?.active) {
      if (arrow || confirm) this.qte.input(arrow ?? 'e', down);
      return;
    }
    if (!down) return;
    if (back) {
      this.goBack();
      return;
    }
    if (this.targeting) {
      const tg = this.targeting;
      if (arrow) {
        const forward = arrow === 'right' || arrow === 'down';
        tg.index = (tg.index + (forward ? 1 : tg.foes.length - 1)) % tg.foes.length;
        playMove(this);
      } else if (confirm) {
        this.targeting = null;
        playConfirm(this);
        tg.resolve(tg.foes[tg.index]!);
      }
      return;
    }
    if (this.menu && (arrow === 'up' || arrow === 'down')) {
      const n = this.menu.items.length;
      this.menu.index = (this.menu.index + (arrow === 'up' ? n - 1 : 1)) % n;
      playMove(this);
      this.drawMenu();
    } else if (confirm) this.onPress();
  }

  /** Back a step: from choosing who, to the move; from a list, to the commands. */
  private goBack(): void {
    if (this.qte?.active) return;
    if (this.targeting) {
      const tg = this.targeting;
      this.targeting = null;
      playMove(this);
      tg.resolve(null);
    } else if (this.menu?.back) {
      const pick = this.menu.pick;
      playMove(this);
      this.menu = null;
      pick(null);
    }
  }

  private onPress(): void {
    if (this.qte?.active) {
      this.qte.input('e', true);
      return;
    }
    if (this.targeting) {
      const tg = this.targeting;
      this.targeting = null;
      playConfirm(this);
      tg.resolve(tg.foes[tg.index]!);
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

  /** Dev only: choose a fight, or practise one of his moves on its own. */
  private async pickFight(): Promise<void> {
    this.bannerText = new PixelText(this, 12, 10, '', { color: SHADES.white });
    this.banner = this.add.container(0, 0, [this.bannerText]);
    this.u(this.banner);
    this.hint = this.u(new PixelText(this, 0, 30, '', { color: SHADES.light, shadow: SHADES.shadow }));
    this.cameras.main.fadeIn(300);
    this.say('Choose a fight (dev)', true);
    const options: { label: string; note?: string; data: Partial<CombatSceneData> }[] = Object.values(ENCOUNTERS).map((e) => ({ label: e.name ?? e.id, data: { encounter: e.id } }));
    // Each of the market scrap's enemy moves with a QTE, on its own.
    const kinds: Record<string, string> = { ring: 'ring', side: 'left/right', key: 'key', bar: 'bar', hold: 'hold', mash: 'mash', notes: 'notes' };
    for (const id of ENCOUNTERS.market_scrap!.enemies) for (const m of COMBATANTS[id]!.moves) {
      const move = MOVES[m]!;
      const real = move.windsUp ? MOVES[move.windsUp]! : move;
      const q = Array.isArray(real.qte) ? real.qte[0] : real.qte;
      if (q) options.push({ label: `Practise: ${real.name}`, note: kinds[q.kind], data: { encounter: 'market_scrap', only: m } });
    }
    const i = await this.openMenu('', options.map((o) => ({ label: o.label, ...(o.note ? { note: o.note } : {}), usable: true, description: 'Your own skills have QTEs too: try Attack and Skill.' })), false);
    this.scene.restart({ ...options[i!]!.data, back: this.params.back });
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
    // Wide enough for the longest item and its note, however many there are (it steps right as it goes down).
    const widest = Math.max(...m.items.map((o) => measure(o.label) + (o.note ? measure(o.note) + 14 : 0)));
    const left = Math.min(350, W - 30 - widest - (m.items.length - 1) * 5);
    if (m.title) items.push(new PixelText(this, left + 12, top - 12, m.title, { color: SHADES.amber, shadow: SHADES.shadow }));
    // In the skill and item lists (designer): what the one you're on does, in a box under the list (clear of
    // the enemies' panels and their tells).
    const said = m.back ? m.items[m.index]?.description : '';
    if (said) {
      const bx = Math.min(left, W - 196);
      const text = new PixelText(this, bx + 8, 0, said, { color: SHADES.light, wrapWidth: W - bx - 22 });
      const by = top + m.items.length * rowH + 2;
      text.setY(by + 5);
      g.fillStyle(SHADES.shadow, 0.94).fillRect(bx, by, W - bx - 6, text.height + 10);
      g.fillStyle(SHADES.redDark).fillRect(bx, by, 2, text.height + 10);
      items.push(text);
    }
    m.items.forEach((item, i) => {
      const on = i === m.index;
      const x = left + i * 5 - (on ? 12 : 0);
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
        tell: this.u(new PixelText(this, 0, 0, '', { color: SHADES.light, wrapWidth: this.slot - 14 })),
        status: this.u(new PixelText(this, 0, 0, '', { color: SHADES.amber })),
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
      const { plate, name, tell, status } = v.tag;
      // What's been done to it, while it lasts: weakened (rounds left), and lured onto someone.
      const intent = this.battle.intentOf(v.c.id);
      const marks = [
        ...(v.c.exposed > 0 ? [`WEAKENED ${v.c.exposed}`] : []),
        ...(v.c.sapped > 0 ? [`WINDED ${v.c.sapped}`] : []),
        ...(v.c.clinging > 0 ? [`LATCHED ${v.c.clinging}`] : []),
        ...(intent?.lured ? ['LURED'] : []),
      ];
      status.setText(marks.join('\n')).setColor(v.c.exposed > 0 ? SHADES.green : SHADES.amber);
      // (Hidden during a QTE: it needs the room.)
      const show = v.c.hp > 0 && !this.qte.active;
      for (const o of [plate, name, tell, status]) o.setVisible(show);
      if (!show) continue;
      const top = v.c.down ? v.sprite.y - 30 : v.sprite.y - v.sprite.displayHeight - 4;
      const sx = (v.sprite.x - cam.worldView.x) * cam.zoom;
      const sy = (top - cam.worldView.y) * cam.zoom;
      const bw = 44;
      // Never wider than its slot, so neighbours' panels don't overlap (the tell wraps instead).
      const width = Math.min(this.slot - 6, Math.max(bw, name.width, tell.width, status.width) + 8);
      const extra = status.text ? status.height + 3 : 0;
      const height = (tell.text ? 21 + tell.height : 20) + extra;
      const half = (this.slot * cam.zoom) / 2;
      const x = Math.round(Phaser.Math.Clamp(sx - width / 2, Math.max(4, sx - half + 3), Math.min(W - width - 4, sx + half - width - 3)));
      const y = Math.round(Phaser.Math.Clamp(sy - height, 38, H - height - 4));
      const g = plate.clear();
      g.fillStyle(SHADES.shadow, 0.88).fillRect(x, y, width, height);
      // The one you're choosing: a bright frame and a marker over it.
      const chosen = this.targeting?.foes[this.targeting.index] === v.c.id;
      g.lineStyle(1, chosen ? SHADES.amber : SHADES.woodLight).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
      if (chosen) {
        const bob = Math.round(Math.sin(this.time.now / 140) * 1.5);
        g.fillStyle(SHADES.amber).fillTriangle(x + width / 2 - 5, y - 8 + bob, x + width / 2 + 5, y - 8 + bob, x + width / 2, y - 2 + bob);
      }
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
      status.setPosition(Math.round(x + (width - status.width) / 2), y + height - status.height - 3);
    }
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

  /**
   * Each party member's own panel, under them (it follows the camera sideways): name, health and SP, and
   * whose turn it is (raised, with a bright edge).
   */
  private drawHud(): void {
    const g = this.hud.clear();
    const party = [...this.views.values()].filter((v) => v.c.side === 'party');
    while (this.hudTexts.length < party.length * 2) this.hudTexts.push(this.u(new PixelText(this, 0, 0, '', { color: SHADES.white })));
    const width = 100;
    const current = this.battle.current?.id;
    party.forEach((v, i) => {
      const on = party.length > 1 && (v.c.id === current || (current && this.battle.get(current).side === 'enemy' && v.home.scale === 2));
      // Under them: the one in focus under their figure, the others at the left edge, under theirs.
      const x = party.length === 1 ? Math.round(v.home.x - width / 2) : v.home.scale === 2 ? 112 : 4;
      const y = H - 32 - (on ? 3 : 0);
      const pts = [[x + 6, y], [x + width, y], [x + width - 6, y + 29], [x, y + 29]].map(([a, b]) => new Phaser.Math.Vector2(a!, b!));
      g.fillStyle(SHADES.shadow, 0.94).fillPoints(pts, true);
      g.lineStyle(1, on ? SHADES.white : SHADES.woodPale).strokePoints(pts, true);
      g.fillStyle(SHADES.red).fillRect(x + 5, y + 1, 2, 28);
      const [name, nums] = [this.hudTexts[i * 2]!, this.hudTexts[i * 2 + 1]!];
      name.setText(v.c.def.name).setPosition(x + 12, y + 3).setColor(on || party.length === 1 ? SHADES.white : SHADES.light);
      const hp = Math.round(v.shown.hp);
      nums.setText(`HP ${hp}  SP ${Math.round(v.shown.sp)}`).setPosition(x + 12, y + 12).setColor(hp <= v.c.def.hp / 4 ? SHADES.amber : SHADES.light);
      const bw = width - 24;
      const bar = (by: number, value: number, lag: number, max: number, colour: number) => {
        g.fillStyle(SHADES.deep).fillRect(x + 11, by - 1, bw + 2, 4);
        g.fillStyle(SHADES.woodLight).fillRect(x + 12, by, bw, 2);
        g.fillStyle(SHADES.amber).fillRect(x + 12, by, Math.round((bw * lag) / Math.max(1, max)), 2);
        g.fillStyle(colour).fillRect(x + 12, by, Math.round((bw * value) / Math.max(1, max)), 2);
      };
      bar(y + 21, v.shown.hp, v.shown.lag, v.c.def.hp, SHADES.green);
      bar(y + 25, v.shown.sp, v.shown.sp, v.c.def.sp ?? 0, SHADES.cyan);
    });
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
    // Their own figure (their sprite from the areas), big, over the slash.
    const figure = LOOKS[v.c.def.sprite]?.cutIn;
    const face = figure ? this.add.image(60, 206, makeSpriteTexture(this, `cutin-${v.c.def.sprite}`, figure.rows, figure.colours)).setOrigin(0, 1).setScale(5) : null;
    const words = new PixelText(this, 0, 118, text, { color: SHADES.white, scale: 3, chisel: { light: SHADES.white, dark: SHADES.dim }, shadow: SHADES.shadow });
    words.setX(W - words.width - 24);
    const box = this.add.container(W, 0, [g, ...(face ? [face] : []), words]);
    this.u(box);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: box, x: 0, duration: 140, ease: 'Quad.easeOut',
        onComplete: () => {
          if (face) this.tweens.add({ targets: face, x: 76, duration: 700 });
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

  /** A move's name (or what happened) in the banner, briefly, Persona style; `stay` keeps it up. */
  private say(caption: string, stay = false): void {
    this.bannerText.setText(caption);
    this.tweens.killTweensOf(this.banner);
    this.banner.y = -30;
    if (!caption) return;
    this.tweens.add({ targets: this.banner, y: 0, duration: 160, ease: 'Quad.easeOut' });
    if (!stay) this.tweens.add({ targets: this.banner, y: -30, delay: 1100, duration: 200, ease: 'Quad.easeIn' });
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

/**
 * The deep rot (Day 4 night): a low hollow of dying roots seen down its length. Black, slick wood arching
 * overhead with roots hanging down, the hollow running on into a green glow far off, pools of glowing rot
 * in the floor, slime gleaming on the wet wood, and a pale green light where the beetles stand. No red.
 */
function paintRotStage() {
  const wood = rgb(SHADES.deep);
  const mud = rgb(SHADES.wood);
  const green = rgb(SHADES.green);
  const greenMid = rgb(SHADES.greenMid);
  const vx = 300;
  const POOLS: [number, number, number][] = [[210, 226, 26], [420, 208, 20], [60, 250, 34], [330, 250, 18]];
  return (x: number, y: number) => {
    // The arch of the hollow: everything outside it is packed, black wood with a faint grain.
    const archTop = 30 + ((x - vx) / 260) ** 2 * 90;
    const glowFar = falloff(x, y, vx, 92, 30, 18) * 0.6;
    if (y < archTop) {
      const grain = noise(x / 3 + y / 24) > 0.7;
      // Roots hanging down from the roof, catching the green.
      const root = Math.floor(x / 13);
      const len = 14 + noise(root * 4.1) * 40;
      const rx = root * 13 + 6 + Math.round(Math.sin(y / 9 + root) * 2);
      if (noise(root * 1.7) > 0.45 && Math.abs(x - rx) < 1.6 && y > archTop - 6 && y < archTop + len) return x > rx ? SHADES.woodLight : SHADES.shadow;
      return grain ? SHADES.deep : SHADES.shadow;
    }
    // Roots hanging into the hollow.
    const root = Math.floor(x / 13);
    const len = 14 + noise(root * 4.1) * 40;
    const rx = root * 13 + 6 + Math.round(Math.sin(y / 9 + root) * 2);
    if (noise(root * 1.7) > 0.45 && Math.abs(x - rx) < 1.6 && y < archTop + len) return x > rx ? SHADES.woodLight : SHADES.shadow;
    if (y >= HORIZON) {
      // Pools of glowing rot sunk in the floor, bright at the middle.
      for (const [px, py, r] of POOLS) {
        const dx = (x - px) / r;
        const dy = (y - py) / (r * 0.32);
        const d = dx * dx + dy * dy;
        if (d <= 1) return d < 0.25 ? SHADES.white : d < 0.55 ? SHADES.green : SHADES.greenMid;
        if (d <= 1.35) return SHADES.greenDeep;
      }
      // The cave floor: lumps of rotten wood and muck, bigger nearer, with dark cracks between them, slime
      // gleaming on the tops, and fallen roots lying across it at odd angles. Nothing straight.
      const depth = (y - HORIZON) / (H - HORIZON);
      const scale = 5 + depth * 14;
      const lump = (ax: number, ay: number) => noise2(ax / scale, ay / (scale * 0.45));
      const here = lump(x, y);
      const above = lump(x, y - 2);
      let glow = falloff(x, y, vx + 30, FLOOR, 90, 24) * 0.15;
      for (const [px, py, r] of POOLS) glow += falloff(x, y, px, py, r * 1.6, r * 0.6) * 0.4;
      // Roots lying across the floor.
      for (const [x0, y0, x1, y1] of [[20, 196, 170, 182], [250, 262, 470, 236], [360, 150, 470, 168], [120, 140, 200, 150]] as const) {
        const t = Phaser.Math.Clamp(((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2), 0, 1);
        const d = Math.hypot(x - (x0 + (x1 - x0) * t), y - (y0 + (y1 - y0) * t) - Math.sin(t * 9) * 2);
        const r = 1.5 + depth * 3;
        if (d < r) return d < r * 0.45 && y < y0 + (y1 - y0) * t ? SHADES.woodLight : SHADES.shadow;
      }
      if (here < 0.3) return SHADES.shadow; // a crack, or a hollow full of dark water
      // Brown muck and rotten wood, lit green only near the pools.
      const base = addLight(addLight(wood, mud, (here - 0.3) * 0.7), green, Math.min(0.6, glow));
      // The top of a lump is wet: a dull sheen, green only by a pool.
      if (here - above > 0.1) return glow > 0.3 ? SHADES.greenDeep : addLight(base, rgb(SHADES.woodLight), 0.25);
      return base;
    }
    // The walls and the far end: dark wood, with the hollow running on into a green glow.
    let c = addLight(addLight(wood, mud, 0.35), greenMid, glowFar * 0.9 + falloff(x, y, vx, HORIZON, 110, 30) * 0.12);
    c = addLight(c, green, glowFar * 0.4);
    // Rot glowing in a few patches on the walls.
    if (noise(Math.floor(x / 6) * 2.9 + Math.floor(y / 6) * 7.3) > 0.95 && y > archTop + 12) return SHADES.greenDeep;
    // Slime running down the walls, in short streaks.
    const streak = Math.floor(x / 4) + 0.5;
    const from = archTop + noise(streak * 7.7) * 60;
    if (noise(streak * 3.3) > 0.85 && y > from && y < from + 6 + noise(streak * 1.9) * 16) return SHADES.greenDeep;
    return noise(x / 9 + y / 30) > 0.8 ? addLight(c, greenMid, 0.15) : c;
  };
}

/** Smooth 2D value noise (0–1), from the 1D noise: lumpy shapes for the cave floor. */
function noise2(x: number, y: number): number {
  const yi = Math.floor(y);
  const f = y - yi;
  const k = f * f * (3 - 2 * f);
  return noise(x + yi * 57.13) * (1 - k) + noise(x + (yi + 1) * 57.13) * k;
}

/**
 * The picked fields in daylight (Chapter 2): the borderland's sky and the tree on the horizon (the areas'
 * own far layer), then the dug-over ground coming towards you: lumpy dirt, old holes, scraps glinting.
 */
function paintFieldsStage() {
  const far = paintFar({ horizon: HORIZON, treeX: 330, treeScale: 0.9 }, 'morning', H);
  const dirt = rgb(SHADES.woodPale);
  const dust = rgb(SHADES.dim);
  const HOLES: [number, number, number][] = [[90, 150, 22], [400, 140, 16], [250, 236, 30], [30, 228, 26]];
  return (x: number, y: number) => {
    if (y < HORIZON) return far(x, y);
    const depth = (y - HORIZON) / (H - HORIZON);
    // Holes somebody dug and gave up on: dark inside, a lip of turned earth.
    for (const [hx, hy, r] of HOLES) {
      const d = ((x - hx) / r) ** 2 + ((y - hy) / (r * 0.3)) ** 2;
      if (d <= 1) return y < hy - r * 0.1 ? SHADES.deep : SHADES.wood;
      if (d <= 1.5) return y < hy ? SHADES.light : SHADES.dim;
    }
    // Scraps in the dirt, catching the sun: small at the back, bigger near.
    const size = 2 + depth * 6;
    const cell = Math.floor(x / (size * 4)) * 31 + Math.floor(y / (size * 1.5)) * 17;
    if (noise(cell) > 0.93 && (x % (size * 4)) < size && (y % (size * 1.5)) < size * 0.5) return noise(cell * 3) > 0.7 ? SHADES.cyanMid : SHADES.light;
    // Lumpy, dug-over dirt, lighter on the tops of the lumps, paler into the distance.
    const lump = noise2(x / (6 + depth * 14), y / (3 + depth * 6));
    const above = noise2(x / (6 + depth * 14), (y - 2) / (3 + depth * 6));
    const base = addLight(addLight(dirt, dust, 0.45 - depth * 0.35 + lump * 0.3), rgb(SHADES.light), Math.max(0, 0.18 - depth * 0.2));
    if (lump - above > 0.08) return addLight(base, rgb(SHADES.light), 0.3);
    if (lump < 0.25) return addLight(base, rgb(SHADES.woodLight), 0.5);
    return base;
  };
}

/**
 * The stragglers' camp in the sunk town (Chapter 2, Day 2): a buried room of the old society seen down its
 * length. Walls of dead panels and a ceiling of cracked tiles with earth pushing through, a dead screen
 * catching a little cyan, the doorway at the back half full of dirt, and their fire in the middle of the
 * floor throwing amber over everything.
 */
function paintCampStage() {
  const deep = rgb(SHADES.deep);
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  const cyan = rgb(SHADES.cyanMid);
  const vx = 260;
  const FIRE = { x: 250, y: 176 };
  return (x: number, y: number) => {
    const glow = falloff(x, y, FIRE.x, FIRE.y - 10, 170, 90);
    // The fire: embers, a lick of flame, stones round it.
    const fd = Math.hypot((x - FIRE.x) / 14, (y - FIRE.y) / 4);
    if (fd < 1 && y >= FIRE.y - 2) return noise(x * 3.1) > 0.5 ? SHADES.amber : SHADES.amberDeep;
    if (Math.abs(x - FIRE.x) < 7 - (FIRE.y - y) / 3 && y < FIRE.y && y > FIRE.y - 18) return (FIRE.y - y) > 10 ? SHADES.white : SHADES.amber;
    if (fd >= 1 && fd < 1.35 && y >= FIRE.y - 3) return SHADES.dim;
    if (y >= HORIZON) {
      // The floor: tiles in perspective, cracked, with earth in the cracks.
      const depth = (y - HORIZON) / (H - HORIZON);
      const u = (x - vx) / Math.max(0.05, depth);
      const seam = Math.abs((((u / 34) % 1) + 1) % 1 - 0.5) > 0.46 || Math.abs(((1 / Math.max(0.06, depth)) * 1.5) % 1 - 0.5) > 0.47;
      const base = addLight(addLight(deep, wood, 0.5), amber, glow * 0.5);
      if (seam) return glow > 0.35 ? SHADES.woodPale : SHADES.shadow;
      if (noise2(x / 9, y / 5) > 0.82) return addLight(base, rgb(SHADES.woodPale), 0.4); // earth come through
      return base;
    }
    // The back wall: dead panels, seams, a doorway half full of dirt, a dead screen.
    const ceiling = 40 + Math.abs(x - vx) * 0.12;
    if (y < ceiling) return noise2(x / 5, y / 4) > 0.6 ? SHADES.woodLight : SHADES.shadow; // earth pushing through the tiles
    if (x > 228 && x < 292 && y > HORIZON - 54) return y > HORIZON - 22 + Math.sin(x / 6) * 3 ? SHADES.woodLight : SHADES.shadow; // the doorway
    if (x > 360 && x < 420 && y > 62 && y < 96) return (x + y) % 9 === 0 ? SHADES.cyan : addLight(rgb(SHADES.cyanDeep), cyan, 0.2 + noise(y) * 0.2); // a dead screen, a little light in it
    const panel = (x % 44 < 1) || ((y - 40) % 30 < 1);
    const base = addLight(addLight(deep, wood, 0.35), amber, glow * 0.55);
    if (panel) return glow > 0.3 ? SHADES.woodPale : SHADES.shadow;
    return noise(x / 11 + y / 37) > 0.85 ? addLight(base, rgb(SHADES.woodLight), 0.3) : base;
  };
}

/**
 * The bar (Chapter 2, Day 4): its floor cleared for a fight, seen down the room. A wall of scrap panels,
 * lamps hanging over a counter at the back with bottles on it, the crowd in a ring (lamplit faces at the
 * back, dark shoulders near), and boards under your feet in a pool of amber.
 */
function paintBarStage() {
  const deep = rgb(SHADES.deep);
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  const vx = 260;
  const LAMPS: [number, number][] = [[90, 46], [200, 40], [330, 40], [430, 46]];
  return (x: number, y: number) => {
    let glow = 0;
    for (const [lx, ly] of LAMPS) glow += falloff(x, y, lx, ly + 10, 60, 50) * 0.5;
    glow += falloff(x, y, vx, FLOOR, 120, 40) * 0.4;
    for (const [lx, ly] of LAMPS) {
      if (Math.abs(x - lx) < 1 && y < ly - 3) return SHADES.shadow;
      const d = Math.hypot(x - lx, (y - ly) * 1.3);
      if (d < 2) return SHADES.white;
      if (d < 3.6) return SHADES.amber;
    }
    if (y >= HORIZON) {
      const depth = (y - HORIZON) / (H - HORIZON);
      const u = (x - vx) / Math.max(0.05, depth);
      const seam = Math.abs((((u / 22) % 1) + 1) % 1 - 0.5) > 0.47;
      const base = addLight(addLight(deep, wood, 0.6), amber, Math.min(0.6, glow));
      if (seam) return glow > 0.3 ? SHADES.woodLight : SHADES.shadow;
      return noise(x / 6 + y / 2) > 0.85 ? addLight(base, rgb(SHADES.woodPale), 0.3) : base;
    }
    // The crowd in a ring: lamplit faces at the back, darker, taller shoulders nearer (gapped behind him).
    const col = Math.floor(x / 10);
    const h = 16 + noise(col * 2.3) * 16;
    const gap = Math.abs(x - vx) < 50 && noise(col * 5.1) < 0.6;
    if (!gap && y > HORIZON - h && y < HORIZON) {
      const head = y < HORIZON - h + 6 && Math.abs((x % 10) - 5) < 3;
      const body = y >= HORIZON - h + 6;
      if (head) return glow > 0.25 ? SHADES.dim : SHADES.woodLight;
      if (body) return SHADES.shadow;
    }
    // The counter at the back, bottles on it.
    if (y > 78 && y < 84 && x > 140 && x < 380) return SHADES.woodPale;
    if (y > 84 && y < 104 && x > 140 && x < 380) return SHADES.wood;
    if (y > 66 && y < 78 && x > 140 && x < 380 && x % 9 < 2) return noise(x) > 0.5 ? SHADES.cyanMid : SHADES.amberDeep;
    // Scrap panels on the wall.
    const panel = (Math.floor(x / 38) * 7 + Math.floor(y / 26) * 3) % 4;
    const base = addLight(addLight(deep, wood, 0.25 + panel * 0.08), amber, Math.min(0.55, glow));
    if (x % 38 < 1 || y % 26 < 1) return SHADES.shadow;
    return base;
  };
}

/**
 * The gambling den (Chapter 2, Day 7): a low room in the hull of something enormous, two lamps hung low
 * over the tables, smoke, the debt wall at the back scored with strokes, the house's cage to one side.
 */
function paintDenStage() {
  const deep = rgb(SHADES.deep);
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  const vx = 260;
  const LAMPS: [number, number][] = [[150, 56], [370, 56]];
  return (x: number, y: number) => {
    let glow = 0;
    for (const [lx, ly] of LAMPS) glow += falloff(x, y, lx, ly + 16, 70, 46) * 0.55;
    for (const [lx, ly] of LAMPS) {
      if (Math.abs(x - lx) < 1 && y < ly - 3) return SHADES.shadow;
      const d = Math.hypot(x - lx, (y - ly) * 1.4);
      if (d < 2) return SHADES.white;
      if (d < 4) return SHADES.amber;
    }
    if (y >= HORIZON) {
      const depth = (y - HORIZON) / (H - HORIZON);
      const u = (x - vx) / Math.max(0.05, depth);
      const plate = Math.abs((((u / 30) % 1) + 1) % 1 - 0.5) > 0.48;
      const base = addLight(addLight(deep, wood, 0.4), amber, Math.min(0.5, glow));
      if (plate) return SHADES.shadow;
      return noise(x / 5 + y / 3) > 0.88 ? addLight(base, rgb(SHADES.dim), 0.2) : base;
    }
    // The hull's ribs, curving down.
    const rib = Math.abs(((x + (HORIZON - y) * 0.25) % 64) - 32) > 30;
    // The debt wall: rows of strokes, a few struck through.
    if (x > 190 && x < 330 && y > 40 && y < HORIZON - 14) {
      const row = Math.floor((y - 40) / 9);
      if ((y - 40) % 9 < 5 && x % 4 === 0 && noise(row * 3.1 + Math.floor(x / 20)) > 0.3) return glow > 0.2 ? SHADES.dim : SHADES.woodPale;
      if ((y - 40) % 9 === 2 && noise(row * 7.7) > 0.75) return SHADES.dim;
      return addLight(addLight(deep, wood, 0.35), amber, Math.min(0.4, glow));
    }
    // The cage, bars at the right.
    if (x > 420 && y > HORIZON - 60 && y < HORIZON && x % 7 < 1) return SHADES.dim;
    // Smoke hanging under the roof.
    const smoke = y < 70 && noise(x / 14 + y / 9) > 0.6 ? 0.12 : 0;
    const base = addLight(addLight(deep, wood, 0.2 + smoke), amber, Math.min(0.45, glow));
    return rib ? SHADES.shadow : base;
  };
}

/**
 * The swap yard at night (Chapter 2, Day 7): empty stalls under slack awnings, shack roofs against a dark
 * sky, the tree's shape on the horizon, and the last of a cooking fire.
 */
function paintYardStage() {
  const deep = rgb(SHADES.deep);
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  const vx = 260;
  return (x: number, y: number) => {
    const glow = falloff(x, y, 120, HORIZON + 6, 70, 30) * 0.6;
    if (y >= HORIZON) {
      const depth = (y - HORIZON) / (H - HORIZON);
      const u = (x - vx) / Math.max(0.05, depth);
      const rut = Math.abs((((u / 40) % 1) + 1) % 1 - 0.5) > 0.47;
      const base = addLight(addLight(deep, wood, 0.35), amber, Math.min(0.5, glow));
      if (rut) return SHADES.shadow;
      return noise(x / 4 + y / 2) > 0.86 ? addLight(base, rgb(SHADES.woodPale), 0.3) : base;
    }
    // The fire, low at the left.
    const fd = Math.hypot(x - 120, (y - (HORIZON - 3)) * 1.6);
    if (fd < 3) return SHADES.amber;
    if (fd < 5) return SHADES.amberDeep;
    // Stalls and shacks in a ragged line, roofs at different heights; a slack awning here and there.
    const col = Math.floor(x / 34);
    const roof = HORIZON - 26 - noise(col * 3.7) * 30;
    if (y > roof) {
      if (Math.abs(y - roof) < 2) return SHADES.woodPale;
      const lit = addLight(addLight(deep, wood, 0.3), amber, Math.min(0.5, glow));
      if (x % 34 < 1) return SHADES.shadow;
      return lit;
    }
    // The tree, far off, and the night sky.
    const tree = Math.abs(x - 380) < 10 - (y - 10) * 0.02 && y > 10;
    const crown = Math.hypot((x - 380) / 1.6, y - 18) < 30;
    if (tree || crown) return SHADES.shadow;
    const star = noise(x * 13.1 + y * 7.3) > 0.985;
    return star ? SHADES.dim : addLight(deep, rgb(SHADES.cyanDeep), 0.15 + (1 - y / HORIZON) * 0.1);
  };
}
