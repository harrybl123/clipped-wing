import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import type { Card, Side } from '../systems/Riot';
import { capitalPortrait } from './capitalPortraits';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import { playSound } from './soundscape';

// The diviner (Jack): a sly, hooded figure leans in over the table, close, and deals three cards face down.
// You pick one (click it, or 1, 2, 3, or the arrows and E); it's turned over, then the two you didn't pick. For
// the rising, the diviner picks for them. Draft looks: hood, dark robe, gold at the throat, an old knowing smirk.

const CARD = { w: 46, h: 64 };
const GAP = 14;
const CARDS_Y = 168;

export interface DivinerDeal {
  cards: Card[];
  side: Side;
  you: Side;
  /** What each card is called and does, for its face. */
  name: (card: Card) => string;
  says: (card: Card) => string;
  /** Draws a card's picture on its face (centred at x, y). */
  picture: (g: Phaser.GameObjects.Graphics, card: Card, x: number, y: number) => void;
  /** The computer's pick (for the rising). */
  pick?: number;
}

/** The diviner's own look (draft): an old figure in a deep hood. */
const DIVINER = capitalPortrait(
  { height: 25, width: 2, skin: 'tan', hair: 0x2a221b, hairStyle: 'long', head: 'hood', headColour: SHADES.deep, top: SHADES.deep, topStyle: 'long', necklace: SHADES.amber, legs: SHADES.deep },
  { build: 'narrow', age: 2, brow: 'arched', eyes: 'narrow', eyeColour: SHADES.amber, nose: 'long', mouth: 'smirk', items: ['earring'] },
);

export async function dealCards(scene: Phaser.Scene, deal: DivinerDeal): Promise<number> {
  // (Fixed to the screen, so it's there however the table's panned.)
  const layer = scene.add.container(0, 0).setDepth(110).setScrollFactor(0);
  const shade = scene.add.rectangle(0, 0, W, H, 0x000000, 0.8).setOrigin(0);
  layer.add(shade);
  shade.setAlpha(0);
  scene.tweens.add({ targets: shade, alpha: 1, duration: 250 });
  playSound(scene, 'diviner', 1);

  // The diviner, close up, leaning in out of the dark.
  const face = scene.add.image(W / 2, 14, makeSpriteTexture(scene, 'riot-diviner', DIVINER.rows, DIVINER.colours)).setOrigin(0.5, 0).setScale(2.4).setAlpha(0);
  layer.add(face);
  scene.tweens.add({ targets: face, alpha: 1, y: 8, duration: 500, ease: 'Sine.easeOut' });
  const mine = deal.side === deal.you;
  const line = new PixelText(scene, 0, 130, mine ? '"Choose, and the city chooses with you."' : '"The enemy draw..."', { color: SHADES.light, shadow: SHADES.shadow });
  line.setX(Math.round((W - line.width) / 2));
  layer.add(line);
  const hint = new PixelText(scene, 0, 144, mine ? 'Pick a card' : '', { color: SHADES.dim, shadow: SHADES.shadow });
  hint.setX(Math.round((W - hint.width) / 2));
  layer.add(hint);

  // Three cards, dealt face down.
  const n = deal.cards.length;
  const left = Math.round((W - (n * CARD.w + (n - 1) * GAP)) / 2);
  const cards = deal.cards.map((card, i) => {
    const x = left + i * (CARD.w + GAP) + CARD.w / 2;
    const c = scene.add.container(W / 2, H + 40);
    const g = scene.add.graphics();
    c.add(g);
    layer.add(c);
    back(g);
    scene.tweens.add({ targets: c, x, y: CARDS_Y + CARD.h / 2, duration: 280, delay: 300 + i * 140, ease: 'Quad.easeOut', onStart: () => playSound(scene, 'deal', 0.5) });
    return { card, c, g, x, open: false };
  });

  // Picking.
  let at = 1;
  const lift = () => cards.forEach((k, i) => scene.tweens.add({ targets: k.c, y: CARDS_Y + CARD.h / 2 - (i === at && mine ? 6 : 0), duration: 90 }));
  const chosen = await new Promise<number>((resolve) => {
    if (!mine) return void scene.time.delayedCall(1300, () => resolve(Math.max(0, Math.min(n - 1, deal.pick ?? 0))));
    let done = false;
    const finish = (i: number) => {
      if (done) return;
      done = true;
      scene.input.keyboard?.off('keydown', onKey);
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      resolve(i);
    };
    const hit = (p: Phaser.Input.Pointer) => cards.findIndex((k) => Math.abs(p.x - k.x) < CARD.w / 2 && Math.abs(p.y - (CARDS_Y + CARD.h / 2)) < CARD.h / 2);
    const onKey = (e: KeyboardEvent) => {
      if (['1', '2', '3'].includes(e.key) && Number(e.key) <= n) return finish(Number(e.key) - 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') (at = (at + n - 1) % n), lift(), playSound(scene, 'flip', 0.3);
      if (e.key === 'ArrowRight' || e.key === 'd') (at = (at + 1) % n), lift(), playSound(scene, 'flip', 0.3);
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') finish(at);
    };
    const onMove = (p: Phaser.Input.Pointer) => {
      const i = hit(p);
      if (i >= 0 && i !== at) (at = i), lift();
    };
    const onDown = (p: Phaser.Input.Pointer) => {
      const i = hit(p);
      if (i >= 0) finish(i);
    };
    scene.time.delayedCall(800, () => {
      lift();
      scene.input.keyboard?.on('keydown', onKey);
      scene.input.on('pointerdown', onDown);
      scene.input.on('pointermove', onMove);
    });
  });

  // Turned over: yours, then the others, dimmed.
  const turn = (k: (typeof cards)[number], dim: boolean) =>
    new Promise<void>((resolve) => {
      playSound(scene, 'flip', 1);
      scene.tweens.add({ targets: k.c, scaleX: 0, duration: 120, onComplete: () => {
        k.g.clear();
        front(scene, k.g, k.c, deal, k.card, dim);
        scene.tweens.add({ targets: k.c, scaleX: 1, duration: 120, onComplete: () => resolve() });
      } });
    });
  hint.setText('');
  const pick = cards[chosen]!;
  scene.tweens.add({ targets: pick.c, y: CARDS_Y + CARD.h / 2 - 10, duration: 120 });
  await turn(pick, false);
  const what = new PixelText(scene, 0, 144, `${deal.name(pick.card)}: ${deal.says(pick.card)}`, { color: SHADES.white, shadow: SHADES.shadow });
  what.setX(Math.max(4, Math.round((W - what.width) / 2)));
  layer.add(what);
  line.setText('');
  await new Promise<void>((r) => scene.time.delayedCall(500, r));
  for (const k of cards) if (k !== pick) await turn(k, true);

  // Until a click or a key (or a moment, for the rising).
  await new Promise<void>((resolve) => {
    const go = () => {
      scene.input.keyboard?.off('keydown', go);
      scene.input.off('pointerdown', go);
      resolve();
    };
    if (!mine) return void scene.time.delayedCall(1400, go);
    scene.time.delayedCall(300, () => {
      scene.input.keyboard?.on('keydown', go);
      scene.input.on('pointerdown', go);
    });
  });
  await new Promise<void>((r) => scene.tweens.add({ targets: layer, alpha: 0, duration: 250, onComplete: () => r() }));
  layer.destroy();
  return chosen;
}

/** A card's back: dark wood, a gold border, a lattice and an eye. */
function back(g: Phaser.GameObjects.Graphics): void {
  const [x, y] = [-CARD.w / 2, -CARD.h / 2];
  g.fillStyle(SHADES.shadow, 1).fillRect(x - 1, y - 1, CARD.w + 2, CARD.h + 2);
  g.fillStyle(SHADES.wood, 1).fillRect(x, y, CARD.w, CARD.h);
  g.lineStyle(1, SHADES.amber, 1).strokeRect(x + 2, y + 2, CARD.w - 4, CARD.h - 4);
  // A lattice of small diamonds, inside the border.
  for (let yy = y + 6; yy < y + CARD.h - 5; yy += 6) {
    for (let xx = x + 6 + ((yy - y) % 12 ? 3 : 0); xx < x + CARD.w - 5; xx += 6) g.fillStyle(SHADES.amberDeep, 0.8).fillRect(xx, yy, 2, 2);
  }
  g.fillStyle(SHADES.wood, 1).fillEllipse(0, 0, 26, 14);
  g.fillStyle(SHADES.light, 1).fillEllipse(0, 0, 20, 9);
  g.fillStyle(SHADES.amber, 1).fillCircle(0, 0, 3);
  g.fillStyle(SHADES.shadow, 1).fillCircle(0, 0, 1);
}

/** A card's face: pale, its rank in the corners, its picture, its name. */
function front(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, c: Phaser.GameObjects.Container, deal: DivinerDeal, card: Card, dim: boolean): void {
  const [x, y] = [-CARD.w / 2, -CARD.h / 2];
  g.fillStyle(SHADES.shadow, 1).fillRect(x - 1, y - 1, CARD.w + 2, CARD.h + 2);
  g.fillStyle(SHADES.light, 1).fillRect(x, y, CARD.w, CARD.h);
  g.lineStyle(1, SHADES.amberDeep, 1).strokeRect(x + 2, y + 2, CARD.w - 4, CARD.h - 4);
  deal.picture(g, card, 0, -4);
  // (An elite: its name's first letter, the Hero's H, the Witch's W.)
  const rank = { joker: '?', jack: 'J', queen: 'Q', king: 'K', ace: 'A', plague: 'X' }[card as string] ?? deal.name(card)[0]!.toUpperCase();
  const r = new PixelText(scene, x + 4, y + 4, rank, { color: SHADES.deep });
  const r2 = new PixelText(scene, 0, y + CARD.h - 11, rank, { color: SHADES.deep });
  r2.setX(Math.round(x + CARD.w - 4 - r2.width));
  c.add([r, r2]);
  if (dim) c.setAlpha(0.45);
}
