import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import type { Adviser, Side } from '../systems/Riot';
import { CAPITAL_CAST_LOOKS, CITIZEN_LOOKS, courtlyFrames, type CapitalLook } from './capitalFolk';
import { capitalPortrait } from './capitalPortraits';
import { PRINCE } from './characters';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import type { RowSprite } from './sprites';
import { playConfirm, playMove } from './sfx';
import { playSound } from './soundscape';

// The audience on the war table (Jack: a "community square"): three people come to you and you choose who to
// hear. The accountant weighs your gold on his scales; the townsfolk gather in a square to hear you from a stage
// (four things to say, two that go down well, you can't tell which); the commander advises you on tactics, or
// clouds your judgement. Half and half, whoever you choose. Draft looks and draft lines throughout. And an audience
// with the Lord (Jack): a man on his knees at the altar, praying, and the Lord's judgement on your people.

/** What the townsfolk can be told (draft lines; which two go down well changes every time). */
export const SPEECHES = [
  'Hold fast. The city stands because you do.',
  'Every street we keep tonight is a home kept safe.',
  'Go home. Leave the fighting to those it belongs to.',
  'There will be bread for every house that stays loyal.',
];

const ADVISERS: { who: Adviser; name: string; says: string }[] = [
  { who: 'accountant', name: 'The accountant', says: 'Weighs your gold' },
  { who: 'townsfolk', name: 'The townsfolk', says: 'Want to hear you' },
  { who: 'commander', name: 'The commander', says: 'Advises on tactics' },
];

/** The accountant (draft): old, spectacles, a dark coat, his slate of figures. */
const ACCOUNTANT = capitalPortrait(
  { height: 25, width: 2, skin: 'fair', hair: SHADES.dim, hairStyle: 'receding', top: SHADES.deep, topStyle: 'coat', collar: SHADES.amberDeep, buttons: SHADES.amber, legs: SHADES.deep, hold: 'slate' },
  { build: 'narrow', age: 2, brow: 'raised', eyes: 'narrow', nose: 'long', mouth: 'thin', items: ['spectacles'] },
);
/** The commander (draft): the captain's look, older and harder. */
const COMMANDER = capitalPortrait(CAPITAL_CAST_LOOKS.captain as CapitalLook, { build: 'broad', age: 1, jaw: 'square', brow: 'heavy', mouth: 'flat', items: ['scar'] });
/** The townsfolk: three faces together. */
const FOLK = [0, 3, 5].map((i) => capitalPortrait(CITIZEN_LOOKS[i % CITIZEN_LOOKS.length]!, { age: (i % 3) as 0 | 1 | 2, mouth: i % 2 ? 'frown' : 'flat' }));

export interface AudienceShow {
  /** Who found it, and which side you are. */
  side: Side;
  you: Side;
  /** The rules decide how it went: the choice (`accountant`, `commander`, `townsfolk:<line>`), and whether it went well. */
  decide: (choice: string) => boolean;
  /** For the computer: its choice. */
  pick?: string;
  /** How long things last, for the words. */
  turns: { morale: number; output: number; slump: number; advice: number };
}

/** An overlay on the screen (fixed while the table pans). */
function overlay(scene: Phaser.Scene, alpha = 0.85): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(110).setScrollFactor(0);
  layer.add(scene.add.rectangle(0, 0, W, H, 0x000000, alpha).setOrigin(0).setScrollFactor(0));
  return layer;
}

function text(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, y: number, words: string, color: number = SHADES.light, scale = 1, wrapWidth?: number): PixelText {
  const t = new PixelText(scene, 0, y, words, { color, shadow: SHADES.shadow, scale, ...(wrapWidth ? { wrapWidth } : {}) }).setScrollFactor(0);
  t.setX(Math.round((W - t.width) / 2));
  layer.add(t);
  return t;
}

function image(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, key: string, sprite: RowSprite, x: number, y: number, scale: number): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, makeSpriteTexture(scene, key, sprite.rows, sprite.colours)).setOrigin(0.5, 0).setScale(scale).setScrollFactor(0);
  layer.add(img);
  return img;
}

const wait = (scene: Phaser.Scene, ms: number) => new Promise<void>((r) => scene.time.delayedCall(ms, r));

/** Until a click or a key (or, for the computer, a moment). */
function untilPressed(scene: Phaser.Scene, mine: boolean, ms = 1600): Promise<void> {
  if (!mine) return wait(scene, ms);
  return new Promise((resolve) => {
    const go = () => {
      scene.input.keyboard?.off('keydown', go);
      scene.input.off('pointerdown', go);
      resolve();
    };
    scene.time.delayedCall(350, () => {
      scene.input.keyboard?.on('keydown', go);
      scene.input.on('pointerdown', go);
    });
  });
}

/** Choosing one of several things laid out across the screen: arrows and E, 1 to n, or the mouse. */
function choose(scene: Phaser.Scene, boxes: { x: number; y: number; w: number; h: number }[], onHover: (i: number) => void, mine: boolean, pick: number): Promise<number> {
  if (!mine) {
    onHover(pick);
    return wait(scene, 1200).then(() => pick);
  }
  let at = 0;
  onHover(at);
  return new Promise((resolve) => {
    const finish = (i: number) => {
      scene.input.keyboard?.off('keydown', onKey);
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      playConfirm(scene);
      resolve(i);
    };
    const hit = (p: Phaser.Input.Pointer) => boxes.findIndex((b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h);
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= boxes.length) return finish(n - 1);
      const back = ['ArrowLeft', 'ArrowUp', 'a', 'w'].includes(e.key);
      const on = ['ArrowRight', 'ArrowDown', 'd', 's', 'Tab'].includes(e.key);
      if (back || on) (at = (at + (on ? 1 : boxes.length - 1)) % boxes.length), onHover(at), playMove(scene);
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') finish(at);
    };
    const onMove = (p: Phaser.Input.Pointer) => {
      const i = hit(p);
      if (i >= 0 && i !== at) (at = i), onHover(at);
    };
    const onDown = (p: Phaser.Input.Pointer) => {
      const i = hit(p);
      if (i >= 0) finish(i);
    };
    scene.time.delayedCall(300, () => {
      scene.input.keyboard?.on('keydown', onKey);
      scene.input.on('pointerdown', onDown);
      scene.input.on('pointermove', onMove);
    });
  });
}

async function fade(scene: Phaser.Scene, layer: Phaser.GameObjects.Container): Promise<void> {
  await new Promise<void>((r) => scene.tweens.add({ targets: layer, alpha: 0, duration: 250, onComplete: () => r() }));
  layer.destroy();
}

/** The three who've come: choose who to hear. */
async function pickAdviser(scene: Phaser.Scene, mine: boolean, pick: Adviser): Promise<Adviser> {
  const layer = overlay(scene);
  playSound(scene, 'diviner', 0.5);
  text(scene, layer, 14, mine ? 'Who will you hear?' : 'The rising hold an audience...', SHADES.white, 2);
  const boxes = ADVISERS.map((_, i) => ({ x: 24 + i * 148, y: 46, w: 136, h: 168 }));
  // (Behind the faces, over the shade.)
  const frame = scene.add.graphics().setScrollFactor(0);
  layer.addAt(frame, 1);
  ADVISERS.forEach((a, i) => {
    const b = boxes[i]!;
    const cx = b.x + b.w / 2;
    if (a.who === 'townsfolk') FOLK.forEach((f, j) => image(scene, layer, `riot-folk-${j}`, f, cx - 34 + j * 34, b.y + 22 + (j === 1 ? -6 : 6), 1.3));
    else image(scene, layer, `riot-${a.who}`, a.who === 'accountant' ? ACCOUNTANT : COMMANDER, cx, b.y + 8, 2);
    const name = new PixelText(scene, 0, b.y + b.h - 34, a.name, { color: SHADES.white, shadow: SHADES.shadow }).setScrollFactor(0);
    name.setX(Math.round(cx - name.width / 2));
    const says = new PixelText(scene, 0, b.y + b.h - 22, a.says, { color: SHADES.dim, shadow: SHADES.shadow }).setScrollFactor(0);
    says.setX(Math.round(cx - says.width / 2));
    const key = new PixelText(scene, b.x + 4, b.y + 4, String(i + 1), { color: SHADES.dim, shadow: SHADES.shadow }).setScrollFactor(0);
    layer.add([name, says, key]);
  });
  const hover = (at: number) => {
    frame.clear();
    boxes.forEach((b, i) => {
      frame.fillStyle(i === at ? SHADES.cyanDeep : SHADES.deep, 0.6).fillRect(b.x, b.y, b.w, b.h);
      frame.lineStyle(1, i === at ? SHADES.light : SHADES.dim, 1).strokeRect(b.x, b.y, b.w, b.h);
    });
  };
  const i = await choose(scene, boxes, hover, mine, ADVISERS.findIndex((a) => a.who === pick));
  await fade(scene, layer);
  return ADVISERS[i]!.who;
}

/** The accountant weighs your gold against his weight; the scales tip one way or the other. */
async function accountant(scene: Phaser.Scene, mine: boolean, good: boolean, turns: AudienceShow['turns']): Promise<void> {
  const layer = overlay(scene);
  image(scene, layer, 'riot-accountant', ACCOUNTANT, 80, 40, 2);
  text(scene, layer, 12, '"Let us see the books."', SHADES.white);
  const g = scene.add.graphics().setScrollFactor(0);
  layer.add(g);
  const [cx, cy] = [W / 2 + 60, 110];
  let tilt = 0;
  let coins = 0;
  const drawScales = () => {
    g.clear();
    g.fillStyle(SHADES.wood, 1).fillRect(cx - 2, cy, 5, 80).fillRect(cx - 24, cy + 80, 49, 5); // the post and foot
    const a = tilt * 0.25;
    const [dx, dy] = [Math.cos(a) * 70, Math.sin(a) * 70];
    g.lineStyle(3, SHADES.amberDeep, 1).lineBetween(cx - dx, cy - dy, cx + dx, cy + dy); // the beam
    g.fillStyle(SHADES.amber, 1).fillCircle(cx, cy, 4);
    for (const [px, py, gold] of [[cx - dx, cy - dy, true], [cx + dx, cy + dy, false]] as const) {
      g.lineStyle(1, SHADES.dim, 1).lineBetween(px, py, px - 16, py + 34).lineBetween(px, py, px + 16, py + 34);
      g.fillStyle(SHADES.dim, 1).fillRect(px - 20, py + 34, 41, 3); // the pan
      if (gold) for (let i = 0; i < coins; i++) g.fillStyle(i % 2 ? SHADES.amber : SHADES.amberMid, 1).fillRect(px - 14 + (i % 4) * 7, py + 29 - Math.floor(i / 4) * 3, 6, 3);
      else g.fillStyle(SHADES.deep, 1).fillRect(px - 8, py + 22, 17, 12).fillStyle(SHADES.light, 1).fillRect(px - 7, py + 23, 2, 10); // his weight
    }
  };
  drawScales();
  // The gold goes on, coin by coin; the beam wavers, then settles.
  for (let i = 0; i < 12; i++) {
    coins = i + 1;
    playSound(scene, 'plink', 0.4);
    tilt = Math.sin(i * 0.9) * 0.3;
    drawScales();
    await wait(scene, 110);
  }
  const target = good ? 1 : -1;
  await new Promise<void>((r) => scene.tweens.addCounter({ from: tilt, to: target, duration: 700, ease: 'Back.easeOut', onUpdate: (tw) => ((tilt = tw.getValue() ?? 0), drawScales()), onComplete: () => r() }));
  playSound(scene, good ? 'crest' : 'boom', 0.8);
  const who = mine ? 'Your' : 'Their';
  text(scene, layer, 214, good ? 'The gold outweighs it.' : 'Short.', good ? SHADES.amber : SHADES.dim, 2);
  text(scene, layer, 236, good ? `${who} morale is up, for ${turns.morale} turns.` : `${who} morale is down, for ${turns.morale} turns.`, SHADES.light);
  await untilPressed(scene, mine);
  await fade(scene, layer);
}

/** The townsfolk: a square full of them under a stage, and you on it, with four things you could say. */
async function townsfolk(scene: Phaser.Scene, mine: boolean, pick: number, decide: (line: number) => boolean, turns: AudienceShow['turns']): Promise<void> {
  const layer = overlay(scene, 0.92);
  const g = scene.add.graphics().setScrollFactor(0);
  layer.add(g);
  // The square at night: lamps, the stage.
  g.fillStyle(SHADES.deep, 1).fillRect(0, 120, W, 150);
  for (const x of [40, 440]) g.fillStyle(SHADES.wood, 1).fillRect(x, 70, 3, 60).fillStyle(SHADES.amber, 1).fillCircle(x + 1, 68, 4);
  g.fillStyle(SHADES.wood, 1).fillRect(W / 2 - 50, 96, 101, 10).fillStyle(SHADES.woodLight, 1).fillRect(W / 2 - 50, 96, 101, 2); // the stage
  const you = image(scene, layer, 'riot-stage-you', PRINCE.idle[0]!, W / 2, 96 - PRINCE.idle[0]!.rows.length * 2, 2);
  void you;
  // The crowd.
  const crowd: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 22; i++) {
    const look = CITIZEN_LOOKS[i % CITIZEN_LOOKS.length]!;
    const f = courtlyFrames({ ...look, pose: 'side' }).idle[0]!;
    const row = i % 2;
    const img = scene.add.image(20 + ((i * 41) % 440), 150 + row * 14 + (i % 3) * 3, makeSpriteTexture(scene, `riot-crowd-${i % CITIZEN_LOOKS.length}`, f.rows, f.colours)).setOrigin(0.5, 1).setScale(1.5).setScrollFactor(0);
    img.setFlipX(img.x > W / 2);
    crowd.push(img);
    layer.add(img);
  }
  const ask = text(scene, layer, 8, mine ? 'The townsfolk wait. What do you tell them?' : 'The rising speak to their people...', SHADES.white);
  // Four things to say.
  const lines = SPEECHES.map((s, i) => {
    const t = new PixelText(scene, 30, 178 + i * 20, `${i + 1}. ${s}`, { color: SHADES.light, shadow: SHADES.shadow }).setScrollFactor(0);
    layer.add(t);
    return t;
  });
  const boxes = lines.map((t) => ({ x: 24, y: t.y - 3, w: W - 48, h: 16 }));
  const i = await choose(scene, boxes, (at) => lines.forEach((t, j) => t.setColor(j === at ? SHADES.white : SHADES.dim)), mine, pick);
  for (const [j, t] of lines.entries()) if (j !== i) t.setVisible(false);
  const said = lines[i]!;
  ask.setVisible(false);
  scene.tweens.add({ targets: said, y: 10, x: Math.round((W - said.width) / 2), duration: 300 });
  const good = decide(i);
  await wait(scene, 500);
  // They cheer, jumping, or mutter and turn their backs.
  if (good) {
    playSound(scene, 'warcry', 0.6);
    for (const [k, c] of crowd.entries()) scene.tweens.add({ targets: c, y: c.y - 6, duration: 140, yoyo: true, repeat: 3, delay: (k % 5) * 50 });
  } else {
    playSound(scene, 'boom', 0.5);
    for (const c of crowd) c.setFlipX(!c.flipX).setTint(0x999999);
  }
  await wait(scene, 900);
  const who = mine ? 'your' : 'their';
  text(scene, layer, 196, good ? 'They cheer!' : 'They mutter, and turn away.', good ? SHADES.amber : SHADES.dim, 2);
  text(scene, layer, 220, good ? `Morale up, and ${who} bases make 1 more a turn, for ${turns.output} turns.` : `Morale down, and ${who} bases make 1 less a turn, for ${turns.slump} turns.`, SHADES.white);
  await untilPressed(scene, mine);
  await fade(scene, layer);
}

/** The commander: his advice, or clouded judgement. */
async function commander(scene: Phaser.Scene, mine: boolean, good: boolean, turns: AudienceShow['turns']): Promise<void> {
  const layer = overlay(scene);
  const face = image(scene, layer, 'riot-commander', COMMANDER, W / 2, 20, 2.2);
  face.setAlpha(0);
  scene.tweens.add({ targets: face, alpha: 1, duration: 300 });
  playSound(scene, 'boots', 0.6);
  await wait(scene, 400);
  text(scene, layer, 160, good ? '"Here is what they’ll do. And after that."' : '"Attack. Hold. Attack. No, hold..."', SHADES.white);
  if (!good) (scene.cameras.main.shake(300, 0.004), playSound(scene, 'quake', 0.4));
  text(scene, layer, 184, good ? 'Good advice' : 'Clouded judgement', good ? SHADES.cyan : SHADES.dim, 2);
  text(scene, layer, 206, good
    ? `${mine ? 'You see' : 'They see'} two turns of ${mine ? 'their' : 'your'} moves ahead, for ${turns.advice} turns.`
    : `${mine ? 'You won’t' : 'They won’t'} see ${mine ? 'their' : 'your'} moves at all, for ${turns.advice} turns.`, SHADES.light);
  await untilPressed(scene, mine);
  await fade(scene, layer);
}

/** An audience, start to finish: the crier (if called), who to hear, and how it went. */
export async function holdAudience(scene: Phaser.Scene, show: AudienceShow): Promise<void> {
  const mine = show.side === show.you;
  const [pickWho, pickLine] = (show.pick ?? 'accountant').split(':');
  const who = await pickAdviser(scene, mine, (pickWho as Adviser) ?? 'accountant');
  if (who === 'townsfolk') return townsfolk(scene, mine, Number(pickLine ?? 0) || 0, (line) => show.decide(`townsfolk:${line}`), show.turns);
  const good = show.decide(who);
  if (who === 'accountant') return accountant(scene, mine, good, show.turns);
  return commander(scene, mine, good, show.turns);
}

export interface PrayerShow {
  side: Side;
  you: Side;
  /** The Lord's judgement: loyal servants (blessed), or heretics (cursed). */
  blessed: boolean;
  turns: number;
}

/**
 * An audience with the Lord (Jack): a church, the sun's rays through its stained glass onto a man on his knees at
 * the altar, pleading ("O please, Lord, won't you hear our prayer?!"); then the judgement. Heretics: the windows
 * slam shut, one after another, and the church goes dark. Loyal servants: the light turns golden, and an angelic
 * "ahhh".
 */
export async function hearPrayer(scene: Phaser.Scene, show: PrayerShow): Promise<void> {
  const mine = show.side === show.you;
  const layer = overlay(scene, 1);
  const g = scene.add.graphics().setScrollFactor(0);
  layer.add(g);
  const windows = [100, 240, 380];
  // The nave: dark stone, pillars, the altar on its steps.
  g.fillStyle(SHADES.shadow, 1).fillRect(0, 0, W, H);
  for (const x of [30, 170, 310, 450]) g.fillStyle(SHADES.deep, 1).fillRect(x - 6, 20, 12, 200);
  g.fillStyle(SHADES.deep, 1).fillRect(0, 214, W, 56);
  g.fillStyle(SHADES.wood, 1).fillRect(W / 2 - 70, 196, 141, 6).fillRect(W / 2 - 80, 202, 161, 6).fillRect(W / 2 - 90, 208, 181, 6); // the steps
  g.fillStyle(SHADES.woodLight, 1).fillRect(W / 2 - 34, 168, 69, 28).fillStyle(SHADES.light, 1).fillRect(W / 2 - 34, 168, 69, 3); // the altar
  g.fillStyle(SHADES.amber, 1).fillRect(W / 2 - 1, 150, 3, 18).fillRect(W / 2 - 6, 155, 13, 3); // a gold mark on it
  // The stained glass: tall arched windows of coloured panes (no red: the palette's).
  const glass = scene.add.graphics().setScrollFactor(0);
  layer.add(glass);
  const panes = [SHADES.cyan, SHADES.amber, SHADES.green, SHADES.cyanMid, SHADES.white, SHADES.amberMid];
  const paintGlass = (gold: boolean) => {
    glass.clear();
    for (const [w, x] of windows.entries()) {
      glass.fillStyle(SHADES.shadow, 1).fillRect(x - 18, 30, 37, 90).fillCircle(x + 0.5, 30, 18.5);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) {
        const colour = gold ? (r + c) % 2 ? SHADES.amber : SHADES.white : panes[(r * 3 + c + w) % panes.length]!;
        glass.fillStyle(colour, 1).fillRect(x - 16 + c * 8.5, 22 + r * 10.5, 7, 9);
      }
    }
  };
  paintGlass(false);
  // The sun's rays down through them onto him.
  const rays = scene.add.graphics().setScrollFactor(0);
  layer.add(rays);
  const paintRays = (colour: number, alpha: number) => {
    rays.clear();
    for (const x of windows) rays.fillStyle(colour, alpha).fillTriangle(x - 16, 110, x + 17, 110, W / 2 + (x - W / 2) * 0.15, 214);
  };
  paintRays(SHADES.light, 0.12);
  // Him: on his knees before the altar, hands together.
  const look = { ...CITIZEN_LOOKS[1]!, pose: 'front' as const };
  const f = courtlyFrames(look).idle[0]!;
  const man = scene.add.image(W / 2, 214, makeSpriteTexture(scene, 'riot-prayer-man', f.rows, f.colours)).setOrigin(0.5, 1).setScale(2.6).setScrollFactor(0);
  man.setCrop(0, 0, f.rows[0]!.length, Math.round(f.rows.length * 0.72)); // (kneeling: his legs folded under him)
  man.y += Math.round(f.rows.length * 0.28 * 2.6);
  man.setTint(0x3a3028); // (backlit by the windows: a shape on his knees, facing the altar)
  layer.add(man);
  layer.setAlpha(0);
  await new Promise<void>((r) => scene.tweens.add({ targets: layer, alpha: 1, duration: 400, onComplete: () => r() }));
  playSound(scene, 'chime', 0.6);
  const plea = text(scene, layer, 232, '"O please, Lord, won\u2019t you hear our prayer?!"', SHADES.white);
  text(scene, layer, 6, mine ? 'An audience with the Lord' : 'The rising pray', SHADES.dim);
  scene.tweens.add({ targets: man, y: man.y - 2, duration: 500, yoyo: true, repeat: 2 });
  await wait(scene, 1800);
  plea.setVisible(false);
  if (!show.blessed) {
    // Heretics: the windows slam shut one after another, and the church goes dark.
    for (const x of windows) {
      playSound(scene, 'slam', 1);
      scene.cameras.main.shake(120, 0.006);
      glass.fillStyle(SHADES.deep, 1).fillRect(x - 19, 10, 39, 112);
      glass.lineStyle(1, SHADES.wood, 1).lineBetween(x, 10, x, 122);
      await wait(scene, 260);
    }
    rays.clear();
    const dark = scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setScrollFactor(0);
    layer.add(dark);
    await new Promise<void>((r) => scene.tweens.add({ targets: dark, fillAlpha: 0.85, duration: 700, onComplete: () => r() }));
  } else {
    // Loyal servants: the light turns golden, and an angelic "ahhh".
    playSound(scene, 'angel', 1);
    paintGlass(true);
    for (let i = 1; i <= 8; i++) {
      paintRays(SHADES.amber, 0.05 * i);
      await wait(scene, 70);
    }
    man.setTint(0xb08a50);
  }
  text(scene, layer, 196, show.blessed ? 'Loyal servants!' : 'Heretics!', show.blessed ? SHADES.amber : SHADES.dim, 3);
  const who = mine ? 'you' : 'them';
  text(scene, layer, 226, show.blessed
    ? `Blessed for ${show.turns} turns: anything left to luck or morale goes ${mine ? 'your' : 'their'} way, and ${mine ? 'your' : 'their'} attacks win on a tie.`
    : `Cursed for ${show.turns} turns: anything left to luck or morale goes against ${who}, and attacks on ${who} win on a tie.`, SHADES.light, 1, W - 40);
  await untilPressed(scene, mine, 2200);
  await fade(scene, layer);
}
